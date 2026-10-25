const { app, BrowserWindow, ipcMain, Tray, Menu, protocol, screen } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let tray = null;
let isFloatMode = false;

// Path to static web export
const WEB_OUT_DIR = path.join(__dirname, "../../web/out");
const STATE_FILE = path.join(app.getPath("userData"), "window-state.json");
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

function createMainWindow(float = false) {
  isFloatMode = float;

  if (mainWindow) {
    mainWindow.close();
  }

  if (float) {
    const pos = loadSavedPosition();
    mainWindow = new BrowserWindow({
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
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.setAlwaysOnTop(true, "floating");

    mainWindow.on("moved", () => {
      const [x, y] = mainWindow.getPosition();
      savePosition(x, y);
    });

    mainWindow.loadURL("app://startease/float.html");
  } else {
    mainWindow = new BrowserWindow({
      width: 1040,
      height: 780,
      minWidth: 800,
      minHeight: 600,
      center: true,
      frame: true,
      alwaysOnTop: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.loadURL("app://startease/index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
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
        if (!mainWindow) createMainWindow(false);
        else mainWindow.show();
      },
    },
    {
      label: "Floating Mode",
      click: () => {
        createMainWindow(true);
      },
    },
    {
      label: "Full Window Mode",
      click: () => {
        createMainWindow(false);
      },
    },
    { type: "separator" },
    {
      label: "Opacity",
      submenu: [
        {
          label: "100%",
          click: () => mainWindow && mainWindow.setOpacity(1.0),
        },
        {
          label: "90%",
          click: () => mainWindow && mainWindow.setOpacity(0.9),
        },
        {
          label: "80%",
          click: () => mainWindow && mainWindow.setOpacity(0.8),
        },
        {
          label: "70%",
          click: () => mainWindow && mainWindow.setOpacity(0.7),
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

  createMainWindow(false);
  createTray();

  // IPC Handlers
  ipcMain.on("switch-to-float", () => {
    createMainWindow(true);
  });

  ipcMain.on("switch-to-full", () => {
    createMainWindow(false);
  });

  ipcMain.on("set-opacity", (_, opacity) => {
    if (mainWindow && typeof opacity === "number") {
      mainWindow.setOpacity(Math.max(0.4, Math.min(1.0, opacity)));
    }
  });

  let dragOffset = { x: 0, y: 0 };
  let isDragging = false;

  ipcMain.on("start-drag", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
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
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
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
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      savePosition(x, y);
    }
  });

  ipcMain.on("move-window", (_, { deltaX, deltaY }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(Math.round(x + deltaX), Math.round(y + deltaY));
    }
  });

  ipcMain.on("save-window-position", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition();
      savePosition(x, y);
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(false);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
