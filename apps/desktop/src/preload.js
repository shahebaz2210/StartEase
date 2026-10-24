const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApi", {
  isDesktop: true,
  switchToFloat: () => ipcRenderer.send("switch-to-float"),
  switchToFull: () => ipcRenderer.send("switch-to-full"),
  setOpacity: (opacity) => ipcRenderer.send("set-opacity", opacity),
});
