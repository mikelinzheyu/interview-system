@echo off
echo.
echo ========================================
echo  One-click Start: Backend
echo ========================================
echo.

REM Change to backend directory
cd /d "D:\code7\interview-system\backend"

echo Current directory: %cd%
echo.

REM Check Node.js
where node >nul 2>&1
if not "%ERRORLEVEL%"=="0" goto NoNode

REM Check npm
where npm >nul 2>&1
if not "%ERRORLEVEL%"=="0" goto NoNpm

REM Install dependencies on first run
if not exist "node_modules" goto InstallDeps
goto StartBackend

:InstallDeps
echo Installing backend dependencies (npm install)...
call npm install
if not "%ERRORLEVEL%"=="0" goto InstallError

:StartBackend
echo.
echo Starting backend on http://localhost:3001 ...
echo (command: npm start)
echo.
call npm start
echo.
echo Backend process exited with code %ERRORLEVEL%.
goto End

:NoNode
echo [ERROR] Node.js is not installed or not in PATH.
echo Please install Node.js (v18 or newer) from https://nodejs.org/ and try again.
goto End

:NoNpm
echo [ERROR] npm is not installed or not in PATH.
echo npm is normally installed together with Node.js.
goto End

:InstallError
echo [ERROR] npm install failed. Please check the error messages above.
goto End

:End
echo.
echo Press any key to close this window...
pause >nul

