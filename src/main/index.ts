import { app, shell, BrowserWindow, Menu } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import * as Events from "./events";
import { createMenu } from "./menus";
import { autoUpdater } from "electron-updater";

autoUpdater.autoDownload = true; // 检测到新版本自动下载
autoUpdater.autoInstallOnAppQuit = true; // 关闭应用自动安装更新
autoUpdater.allowDowngrade = false; // 禁止版本降级

console.log("当前应用版本：", app.getVersion());

function initUpdateEvent(mainWindow) {
  // 开始检测更新
  autoUpdater.on("checking-for-update", () => {
    mainWindow.webContents.send("update:status", "正在检测最新版本...");
  }); // 发现新版本

  autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update:available", info);
  }); // 无新版本

  autoUpdater.on("update-not-available", () => {
    mainWindow.webContents.send("update:status", "当前已是最新版本");
  }); // 更新下载进度

  autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send("update:progress", progress.percent.toFixed(2));
  }); // 下载完成

  autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update:finished", "更新包下载完成，重启即可生效");
  }); // 更新报错

  autoUpdater.on("error", (err) => {
    mainWindow.webContents.send("update:error", "更新失败：" + err.message);
  });
}

const WINDOW_WIDTH = 1440;
const WINDOW_HEIGHT = 900;
const hasRegisterEvents: string[] = [];
let mainWindow: BrowserWindow;
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,

    minWidth: WINDOW_WIDTH * 0.5,
    minHeight: WINDOW_HEIGHT * 0.5,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      //   contextIsolation: false
      devTools: is.dev,
    },
  });

  mainWindow.on("ready-to-show", () => {
    for (let _evt of Object.values(Events)) {
      const { eventName } = _evt as any;
      if (hasRegisterEvents.includes(eventName)) continue;
      hasRegisterEvents.push(eventName);
      _evt.on(mainWindow.webContents);
    }
    mainWindow.show();
    const menus = createMenu(mainWindow);
    Menu.setApplicationMenu(menus);
  });
  // process.platform == "darwin" ? app?.dock?.hide() : mainWindow.setMenu(null);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
  initUpdateEvent(mainWindow);
  // mainWindow.webContents.openDevTools(); // 打开调试工具
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    hasRegisterEvents.length = 0; // 清空事件
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
