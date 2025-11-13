@echo off
REM 启动后端Mock API服务器

echo.
echo ========================================
echo 启动后端Mock API服务器
echo ========================================
echo.

cd /d "%~dp0..\\..\\backend"

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo 安装依赖中...
    call npm install
)

echo.
echo 启动Mock API服务器...
echo 访问地址: http://localhost:3001
echo 健康检查: http://localhost:3001/api/health
echo WebSocket: ws://localhost:3001/ws
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm start

pause
