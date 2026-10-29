# StartEase Bulletproof Pitch Demo Launcher
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# Completely neutralize any ambient ELECTRON_RUN_AS_NODE in this session
[Environment]::SetEnvironmentVariable("ELECTRON_RUN_AS_NODE", $null, "Process")
Remove-Item env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue

$rootDir = $PSScriptRoot
if (-not $rootDir) {
    $rootDir = (Get-Item .).FullName
}

$apiDir = Join-Path $rootDir "apps\api"
$desktopDir = Join-Path $rootDir "apps\desktop"
$electronDist = Join-Path $desktopDir "node_modules\electron\dist\electron.exe"
$packagedExe = Join-Path $desktopDir "release\win-unpacked\StartEase.exe"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "          StartEase Pitch Demo Launcher               " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Resolve Python Binary
Write-Host "[1/3] Verifying Python Environment..." -ForegroundColor Yellow
$pythonCmd = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $pythonCmd -or -not (Test-Path $pythonCmd)) {
    if (Test-Path "C:\Program Files\Python313\python.exe") {
        $pythonCmd = "C:\Program Files\Python313\python.exe"
    } else {
        Write-Host "[-] ERROR: Python 3 not found on system PATH." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  -> Python Engine: $pythonCmd" -ForegroundColor DarkGray

# 2. Check or Launch Backend API with Active Health Probe
Write-Host "[2/3] Checking Backend Health on http://127.0.0.1:8000..." -ForegroundColor Yellow

function Test-BackendHealth {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/healthz" -TimeoutSec 1 -ErrorAction Stop
        return ($res.ok -eq $true)
    } catch {
        return $false
    }
}

$isHealthy = Test-BackendHealth

if ($isHealthy) {
    Write-Host "  -> Backend is already active and healthy." -ForegroundColor Green
} else {
    Write-Host "  -> Starting FastAPI Backend in background..." -ForegroundColor Cyan
    
    $backendPsi = New-Object System.Diagnostics.ProcessStartInfo
    $backendPsi.FileName = $pythonCmd
    $backendPsi.Arguments = "-m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    $backendPsi.WorkingDirectory = $apiDir
    $backendPsi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Minimized
    $backendPsi.UseShellExecute = $true
    
    [System.Diagnostics.Process]::Start($backendPsi) | Out-Null
    
    # Active Healthcheck polling loop (up to 10 seconds)
    $attempts = 0
    while (-not $isHealthy -and $attempts -lt 20) {
        Start-Sleep -Milliseconds 500
        $attempts++
        $isHealthy = Test-BackendHealth
        Write-Host -NoNewline "." -ForegroundColor DarkGray
    }
    Write-Host ""

    if (-not $isHealthy) {
        Write-Host "[-] ERROR: Backend failed to respond to /healthz within 10 seconds." -ForegroundColor Red
        exit 1
    }
    Write-Host "  -> Backend is now healthy and accepting requests!" -ForegroundColor Green
}

# 3. Launch Electron Desktop Companion
Write-Host "[3/3] Launching Desktop App..." -ForegroundColor Yellow

$electronPath = ""
if (Test-Path $electronDist) {
    $electronPath = $electronDist
} elseif (Test-Path $packagedExe) {
    $electronPath = $packagedExe
} else {
    Write-Host "[-] ERROR: Electron binary not found." -ForegroundColor Red
    exit 1
}

$electronPsi = New-Object System.Diagnostics.ProcessStartInfo
$electronPsi.FileName = $electronPath
$electronPsi.Arguments = "."
$electronPsi.WorkingDirectory = $desktopDir
$electronPsi.UseShellExecute = $false
if ($electronPsi.EnvironmentVariables.ContainsKey("ELECTRON_RUN_AS_NODE")) {
    $electronPsi.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE")
}

$desktopProcess = [System.Diagnostics.Process]::Start($electronPsi)
Start-Sleep -Seconds 1

if ($desktopProcess.HasExited) {
    Write-Host "[-] ERROR: Desktop app exited unexpectedly (Code: $($desktopProcess.ExitCode))." -ForegroundColor Red
    exit 1
}

Write-Host "  -> Desktop Application is active! (PID: $($desktopProcess.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   StartEase is 100% READY. Best of luck on stage!     " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
