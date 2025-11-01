@echo off
REM 启动后端Mock服务器
cd /d "D:\code7\interview-system\backend"
echo Starting Mock Backend Server...
echo.
"C:\Program Files\nodejs\node.exe" mock-server.js
