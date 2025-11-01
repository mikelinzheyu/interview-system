@echo off
REM AI面试系统 - 前后端完整启动脚本

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   AI面试系统 - 本地前后端联调完整启动              ║
echo ║                                                    ║
echo ║   后端: localhost:3001 (Mock Server)              ║
echo ║   前端: localhost:5174 (Vite)                     ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM 检查Node.js
where node.exe >nul 2>nul
if errorlevel 1 (
    echo [ERROR] 找不到 Node.js！请先安装
    pause
    exit /b 1
)

echo [✓] Node.js 已安装
node --version
echo.

REM 启动后端
echo [步骤1] 启动后端 Mock Server (端口3001)...
start "AI-Interview-Backend" cmd /k "cd /d "%cd%\backend" && node mock-server.js"
timeout /t 3 /nobreak >nul

REM 启动前端
echo [步骤2] 启动前端 Vite (端口5174)...
start "AI-Interview-Frontend" cmd /k "cd /d "%cd%\frontend" && "C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5174"
timeout /t 4 /nobreak >nul

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   ✅ 所有服务已启动!                              ║
echo ╚════════════════════════════════════════════════════╝
echo.

echo 🌐 访问地址:
echo   前端: http://localhost:5174
echo   后端: http://localhost:3001/api/health
echo.

echo 📝 提示:
echo   • 两个新窗口已打开，分别运行后端和前端
echo   • 代码修改会自动热更新
echo   • 按 Ctrl+C 可停止服务
echo   • 查看详细说明: QUICK_START_LOCAL.md
echo.

echo 🚀 立即打开浏览器: http://localhost:5174
echo.

pause
