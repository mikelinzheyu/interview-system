@echo off
REM 快速启动前后端脚本 - Windows 版本

echo.
echo ======================================
echo   AI面试官系统 - 快速启动脚本
echo ======================================
echo.

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

echo ✅ Node.js 已安装:
node --version
echo.

REM 启动后端
echo 🚀 启动后端服务器...
start "Backend Server" cmd /k "cd backend && npm install --legacy-peer-deps && npm start"
echo ✅ 后端已启动 (http://localhost:3001/api)
echo.

REM 等待后端启动
timeout /t 3 /nobreak

REM 启动前端
echo 🚀 启动前端服务器...
start "Frontend Server" cmd /k "cd frontend && npm install --legacy-peer-deps && npm run dev"
echo ✅ 前端已启动 (http://localhost:5174/)
echo.

echo ======================================
echo ✅ 系统已启动！
echo ======================================
echo.
echo 📱 前端地址: http://localhost:5174/
echo 🔌 后端 API: http://localhost:3001/api
echo.
echo 💡 两个新窗口已打开，请勿关闭
echo    - Backend Server 窗口
echo    - Frontend Server 窗口
echo.
pause
