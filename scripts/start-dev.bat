@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=start"

echo === Interview System Dev (%ACTION%) ===
where powershell >nul 2>nul
if errorlevel 1 (
  echo [ERROR] PowerShell 未找到，请右鍵以 PowerShell 打開並運行 scripts\start-dev.ps1
  goto :end
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-dev.ps1" %ACTION%
set "EC=%ERRORLEVEL%"

if /I "%ACTION%"=="start" (
  if "%EC%"=="0" (
    echo Opening frontend at http://localhost:5174 ...
    start "" http://localhost:5174
  )
)

echo.
if "%~1"=="" (
  echo Press any key to close...
  pause >nul
)
exit /b %EC%

:end
exit /b %EC%
