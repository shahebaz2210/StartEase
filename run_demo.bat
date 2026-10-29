@echo off
title StartEase Pitch Demo Launcher
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_demo.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Script encountered an error. Press any key to close...
    pause >nul
)
