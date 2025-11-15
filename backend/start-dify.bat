@echo off
REM Dify AI Chat 快速启动脚本 (Windows)
REM 使用最新的 API Key: app-Bj1UccX9v9X1aw6st7OW5paG

setlocal enabledelayedexpansion

echo ==========================================
echo   ^> Dify AI Chat 快速启动 ^<
echo ==========================================
echo.

REM 设置环境变量
set DIFY_CHAT_API_KEY=app-Bj1UccX9v9X1aw6st7OW5paG
set DIFY_CHAT_APP_ID=NF8mUftOYiGfQEzE
set DIFY_API_URL=https://api.dify.ai/v1

echo ✅ 环境变量已设置：
echo    DIFY_CHAT_API_KEY: %DIFY_CHAT_API_KEY%
echo    DIFY_CHAT_APP_ID: %DIFY_CHAT_APP_ID%
echo    DIFY_API_URL: %DIFY_API_URL%
echo.

REM 清理旧进程
echo 🧹 清理旧进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /PID %%a /F 2>nul || true
)
timeout /t 1 /nobreak >nul

REM 启动后端
echo.
echo 🚀 启动后端服务...
cd /d "%~dp0"
node mock-server.js

pause
