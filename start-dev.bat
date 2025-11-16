@echo off
REM Windows 快速启动脚本 - 同时启动前后端

setlocal enabledelayedexpansion

echo ======================================
echo    AI面试官系统 - 前后端启动脚本
echo ======================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18.0.0 以上版本
    echo 访问: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 已安装: %NODE_VERSION%
echo.

REM 启动后端
echo 🚀 启动后端服务器...
cd backend
if not exist "node_modules" (
    echo    📦 安装后端依赖...
    call npm install
)
start "Backend Server" cmd /k "npm start"
echo    ✅ 后端已启动
echo.

REM 等待后端启动
timeout /t 3 /nobreak

REM 启动前端
echo 🚀 启动前端服务器...
cd ..\frontend
if not exist "node_modules" (
    echo    📦 安装前端依赖...
    call npm install
)
start "Frontend Dev Server" cmd /k "npm run dev"
echo    ✅ 前端已启动
echo.

echo ======================================
echo ✅ 系统已启动！
echo ======================================
echo.
echo 📱 前端地址:
echo    http://localhost:5174/
echo.
echo 🔌 后端 API 地址:
echo    http://localhost:3001/api
echo.
echo 🧪 测试页面:
echo    http://localhost:5174/community/posts/20
echo.
echo 📋 关闭: 直接关闭两个命令窗口
echo.
pause
