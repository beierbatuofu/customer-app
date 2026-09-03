export const isWin32 = function () {
  try {
    return window.electron?.process.platform === "win32";
  } catch (err) {
    return false;
  }
};

export function sendEvent(sEvt: string, args?: any): Promise<any> {
  try {
    const ipcRenderer = window.electron.ipcRenderer;
    const evtName = (window as Window & { api: Record<string, any> }).api[sEvt];
    ipcRenderer.send(evtName, JSON.parse(JSON.stringify(args || {})));
    return new Promise((resolve, reject) => {
      try {
        ipcRenderer.on(evtName, (_, res: any) => {
          resolve(res.data);
        });
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

export function ListenEvent(evtName: string, cb: (...args: any) => void) {
  const ipcRenderer = window.electron.ipcRenderer;
  ipcRenderer.on(evtName, (_, res: any) => {
    cb(res);
  });
}

export function listenMenuAction(cb: (action: string) => void) {
  const ipcRenderer = window.electron.ipcRenderer;
  ipcRenderer.on("open-setting-window", (_event, value) => cb(value));
}
