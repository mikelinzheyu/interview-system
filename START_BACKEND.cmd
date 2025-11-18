@echo off
echo.
echo ========================================
echo  启动后端服务...
echo ========================================
echo.

cd /d "%~dp0\backend"

echo 当前目录: %cd%
echo.

echo 检查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
echo.

echo 安装依赖...
call npm install --legacy-peer-deps

echo.
echo 启动后端服务 (监听在 http://localhost:3001)...
echo.

call npm start

pause
