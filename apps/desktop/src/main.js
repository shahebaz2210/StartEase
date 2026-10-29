const { app, BrowserWindow, ipcMain, Tray, Menu, protocol, screen, powerMonitor } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

let fullWindow = null;
let floatWindow = null;
let tray = null;
let isFloatMode = false;
let backendProcess = null;

function ensureBackendRunning() {
  const req = http.get("http://127.0.0.1:8000/docs", () => {
    console.log("FastAPI backend is already active on http://127.0.0.1:8000");
  });

  req.on("error", () => {
    console.log("FastAPI backend not detected, launching background process...");
    const apiDir = path.join(__dirname, "../../api");
    const venvPython = path.join(apiDir, ".venv/Scripts/python.exe");
    const venvUvicorn = path.join(apiDir, ".venv/Scripts/uvicorn.exe");
    const pythonCmd = (fs.existsSync(venvPython) && fs.existsSync(venvUvicorn)) ? venvPython : "python";

    try {
      backendProcess = spawn(
        pythonCmd,
        ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        {
          cwd: apiDir,
          stdio: "ignore",
          windowsHide: true,
        }
      );

      backendProcess.on("error", (err) => {
        console.warn("Could not automatically spawn backend:", err);
      });
    } catch (e) {
      console.warn("Exception spawning backend:", e);
    }
  });
}

// Path to static web export
const WEB_OUT_DIR = path.join(__dirname, "../../web/out");
const STATE_FILE = (app && typeof app.getPath === "function")
  ? path.join(app.getPath("userData"), "window-state.json")
  : path.join(__dirname, "window-state.json");
const FLOAT_WIDTH = 360;
const FLOAT_HEIGHT = 310;

// Register custom protocol app://startease
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function loadSavedPosition() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      // Validate that position is still on screen
      const displays = screen.getAllDisplays();
      const onScreen = displays.some((d) => {
        const bounds = d.bounds;
        return (
          data.x >= bounds.x &&
          data.x < bounds.x + bounds.width &&
          data.y >= bounds.y &&
          data.y < bounds.y + bounds.height
        );
      });
      if (onScreen) return data;
    }
  } catch (e) {
    console.warn("Could not load saved window position:", e);
  }

  // Default to top-right
  const primary = screen.getPrimaryDisplay().workArea;
  return {
    x: primary.x + primary.width - 380,
    y: primary.y + 40,
  };
}

function savePosition(x, y) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ x, y }), "utf-8");
  } catch (e) {
    console.warn("Could not save window position:", e);
  }
}

let preStagnationPosition = null;
let glideInterval = null;

function animateWindowPosition(targetWin, targetX, targetY, durationMs = 350) {
  if (!targetWin || targetWin.isDestroyed()) return;
  if (glideInterval) clearInterval(glideInterval);

  const [startX, startY] = targetWin.getPosition();
  const startTime = Date.now();

  glideInterval = setInterval(() => {
    if (!targetWin || targetWin.isDestroyed()) {
      clearInterval(glideInterval);
      glideInterval = null;
      return;
    }
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    // Cubic ease-in-out curve
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const currentX = Math.round(startX + (targetX - startX) * ease);
    const currentY = Math.round(startY + (targetY - startY) * ease);

    targetWin.setPosition(currentX, currentY);

    if (progress >= 1) {
      clearInterval(glideInterval);
      glideInterval = null;
    }
  }, 16);
}

function glideFloatToCenter() {
  if (!floatWindow || floatWindow.isDestroyed()) return;
  const [currX, currY] = floatWindow.getPosition();
  preStagnationPosition = { x: currX, y: currY };

  const primary = screen.getPrimaryDisplay().workArea;
  const centerX = Math.round(primary.x + (primary.width - FLOAT_WIDTH) / 2);
  const centerY = Math.round(primary.y + (primary.height - FLOAT_HEIGHT) / 2);

  animateWindowPosition(floatWindow, centerX, centerY, 350);
}

function glideFloatToCorner() {
  if (!floatWindow || floatWindow.isDestroyed()) return;
  const target = preStagnationPosition || loadSavedPosition();
  animateWindowPosition(floatWindow, target.x, target.y, 350);
}

function closeFloatWithFade() {
  if (!floatWindow || floatWindow.isDestroyed()) return;
  let opacity = 1.0;
  const fadeInterval = setInterval(() => {
    if (!floatWindow || floatWindow.isDestroyed()) {
      clearInterval(fadeInterval);
      return;
    }
    opacity -= 0.15;
    if (opacity <= 0.05) {
      clearInterval(fadeInterval);
      floatWindow.hide();
      floatWindow.setOpacity(1.0);
    } else {
      floatWindow.setOpacity(opacity);
    }
  }, 30);
}

function createFullWindow() {
  if (fullWindow && !fullWindow.isDestroyed()) {
    return fullWindow;
  }

  fullWindow = new BrowserWindow({
    width: 1040,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    center: true,
    frame: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  fullWindow.loadURL("app://startease/index.html");

  // REQUIREMENT 1: When user minimizes the full desktop app, automatically open the floating window!
  fullWindow.on("minimize", (event) => {
    event.preventDefault();
    switchToFloat();
  });

  fullWindow.on("close", () => {
    // When user closes the main desktop window, quit the application
    app.quit();
  });

  return fullWindow;
}

function createFloatWindow() {
  if (floatWindow && !floatWindow.isDestroyed()) {
    return floatWindow;
  }

  const pos = loadSavedPosition();
  floatWindow = new BrowserWindow({
    width: FLOAT_WIDTH,
    height: FLOAT_HEIGHT,
    minWidth: FLOAT_WIDTH,
    maxWidth: FLOAT_WIDTH,
    minHeight: FLOAT_HEIGHT,
    maxHeight: FLOAT_HEIGHT,
    x: pos.x,
    y: pos.y,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: false,
    focusable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  floatWindow.setAlwaysOnTop(true, "floating");

  floatWindow.on("moved", () => {
    if (floatWindow && !floatWindow.isDestroyed()) {
      const [x, y] = floatWindow.getPosition();
      savePosition(x, y);
    }
  });

  floatWindow.on("close", (e) => {
    // If the full window is alive, just hide float window instead of closing
    if (fullWindow && !fullWindow.isDestroyed()) {
      e.preventDefault();
      floatWindow.hide();
    }
  });

  floatWindow.loadURL("app://startease/float.html");

  return floatWindow;
}

function switchToFloat() {
  isFloatMode = true;

  // 1. Hide full window without destroying it - preserves state!
  if (fullWindow && !fullWindow.isDestroyed()) {
    fullWindow.hide();
  }

  // 2. Ensure float window exists
  if (!floatWindow || floatWindow.isDestroyed()) {
    createFloatWindow();
  }

  const pos = loadSavedPosition();
  floatWindow.setBounds({ x: pos.x, y: pos.y, width: FLOAT_WIDTH, height: FLOAT_HEIGHT });
  floatWindow.show();
  floatWindow.focus();

  // Notify float window to synchronize with latest session
  if (floatWindow.webContents) {
    floatWindow.webContents.send("sync-session");
  }
}

function switchToFull() {
  isFloatMode = false;

  // 1. Hide float window
  if (floatWindow && !floatWindow.isDestroyed()) {
    floatWindow.hide();
  }

  // 2. Show & restore full window - NO RELOAD, NO RESTART!
  if (!fullWindow || fullWindow.isDestroyed()) {
    createFullWindow();
    fullWindow.once("ready-to-show", () => {
      fullWindow.show();
      fullWindow.focus();
    });
  } else {
    fullWindow.show();
    if (fullWindow.isMinimized()) {
      fullWindow.restore();
    }
    fullWindow.focus();
    // Notify full window to sync with latest session state without restarting the page
    if (fullWindow.webContents) {
      fullWindow.webContents.send("sync-session");
    }
  }
}

function createTray() {
  // Simple tray icon support
  try {
    tray = new Tray(path.join(__dirname, "tray-icon.png"));
  } catch (e) {
    // If icon image isn't available, create without image or skip
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open StartEase",
      click: () => {
        switchToFull();
      },
    },
    {
      label: "Floating Mode",
      click: () => {
        switchToFloat();
      },
    },
    {
      label: "Full Window Mode",
      click: () => {
        switchToFull();
      },
    },
    { type: "separator" },
    {
      label: "Opacity",
      submenu: [
        {
          label: "100%",
          click: () => {
            const target = floatWindow || fullWindow;
            if (target && !target.isDestroyed()) target.setOpacity(1.0);
          },
        },
        {
          label: "90%",
          click: () => {
            const target = floatWindow || fullWindow;
            if (target && !target.isDestroyed()) target.setOpacity(0.9);
          },
        },
        {
          label: "80%",
          click: () => {
            const target = floatWindow || fullWindow;
            if (target && !target.isDestroyed()) target.setOpacity(0.8);
          },
        },
        {
          label: "70%",
          click: () => {
            const target = floatWindow || fullWindow;
            if (target && !target.isDestroyed()) target.setOpacity(0.7);
          },
        },
      ],
    },
    { type: "separator" },
    {
      label: "Quit StartEase",
      click: () => {
        app.quit();
      },
    },
  ]);

  if (tray) {
    tray.setToolTip("StartEase — Calm task companion");
    tray.setContextMenu(contextMenu);
  }
}

app.whenReady().then(() => {
  // Handle custom app://startease protocol
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let filePath = path.join(WEB_OUT_DIR, decodeURIComponent(url.pathname));

    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(filePath, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      // Fallback for HTML5 routes
      filePath = path.join(WEB_OUT_DIR, "index.html");
    }

    return require("electron").net.fetch(`file://${filePath}`);
  });

  ensureBackendRunning();
  createFullWindow();
  fullWindow.show();
  createTray();

  // IPC Handlers
  ipcMain.on("switch-to-float", () => {
    switchToFloat();
  });

  ipcMain.on("switch-to-full", () => {
    switchToFull();
  });

  ipcMain.on("set-opacity", (_, opacity) => {
    const target = floatWindow || fullWindow;
    if (target && !target.isDestroyed() && typeof opacity === "number") {
      target.setOpacity(Math.max(0.4, Math.min(1.0, opacity)));
    }
  });

  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;

  ipcMain.on("start-drag", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || floatWindow;
    if (!win || win.isDestroyed()) return;

    isDragging = true;
    const cursor = screen.getCursorScreenPoint();
    const [winX, winY] = win.getPosition();
    dragOffset = {
      x: cursor.x - winX,
      y: cursor.y - winY,
    };
  });

  ipcMain.on("dragging", (event) => {
    if (!isDragging) return;
    const win = BrowserWindow.fromWebContents(event.sender) || floatWindow;
    if (!win || win.isDestroyed()) return;

    const cursor = screen.getCursorScreenPoint();
    win.setBounds({
      x: Math.round(cursor.x - dragOffset.x),
      y: Math.round(cursor.y - dragOffset.y),
      width: FLOAT_WIDTH,
      height: FLOAT_HEIGHT,
    });
  });

  ipcMain.on("end-drag", (event) => {
    isDragging = false;
    const win = BrowserWindow.fromWebContents(event.sender) || floatWindow;
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      savePosition(x, y);
    }
  });

  ipcMain.on("move-window", (event, { deltaX, deltaY }) => {
    const win = BrowserWindow.fromWebContents(event.sender) || floatWindow;
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      win.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
    }
  });

  ipcMain.on("save-window-position", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || floatWindow;
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      savePosition(x, y);
    }
  });

  ipcMain.handle("get-system-idle-time", () => {
    try {
      return powerMonitor ? powerMonitor.getSystemIdleTime() : 0;
    } catch {
      return 0;
    }
  });

  ipcMain.on("glide-to-center", () => {
    glideFloatToCenter();
  });

  ipcMain.on("glide-to-corner", () => {
    glideFloatToCorner();
  });

  ipcMain.on("close-float-fade", () => {
    closeFloatWithFade();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFullWindow();
      fullWindow.show();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill();
    } catch {}
  }
});
