"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const UPSERT_CONFIG = "upsert:config";
const QXIN_NEW = "qxin:new";
const CREATE_CUSTOMER = "create:customer";
const EventNames = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CREATE_CUSTOMER,
  QXIN_NEW,
  UPSERT_CONFIG
}, Symbol.toStringTag, { value: "Module" }));
const api = {
  ...EventNames
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
    electron.contextBridge.exposeInMainWorld("electronAPI", {
      onMenuAction: (callback) => {
        electron.ipcRenderer.on("open-setting-window", (_event, value) => callback(value));
      }
    });
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
