const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronApi", {
  isDesktop: true,
  switchToFloat: () => ipcRenderer.send("switch-to-float"),
  switchToFull: () => ipcRenderer.send("switch-to-full"),
  openMainWindow: () => ipcRenderer.send("switch-to-full"),
  setOpacity: (opacity) => ipcRenderer.send("set-opacity", opacity),
  startDrag: () => ipcRenderer.send("start-drag"),
  dragging: () => ipcRenderer.send("dragging"),
  endDrag: () => ipcRenderer.send("end-drag"),
  moveBy: (deltaX, deltaY) => ipcRenderer.send("move-window", { deltaX, deltaY }),
  savePosition: () => ipcRenderer.send("save-window-position"),
  onSyncSession: (callback) => {
    ipcRenderer.on("sync-session", () => callback());
  },
  getSystemIdleTime: () => ipcRenderer.invoke("get-system-idle-time"),
  glideToCenter: () => ipcRenderer.send("glide-to-center"),
  glideToCorner: () => ipcRenderer.send("glide-to-corner"),
  closeFloatWithFade: () => ipcRenderer.send("close-float-fade"),
});
