# Desktop (Electron)
- contextIsolation true, nodeIntegration false, sandbox true.
- The UI talks to the main process only through a small preload API (set mode, hide, set opacity).
- Load only the packaged UI through a custom protocol (app://startease). Deny navigation and new windows to other origins.
- Float mode is always on top. Full mode is a normal window. Use showInactive() so the window does not take focus. No sounds, no notifications.
- acceptFirstMouse so the first click on a button works.
- Save only window position and mode. Restore only if the position is on a visible screen, otherwise top-right of the main screen.
- Do not auto-start with the computer.
- Never add screen capture, window-title reading, keystroke capture or accessibility observation.
