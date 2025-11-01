@echo off
REM AI面试系统 - 本地前后端联调一键启动脚本

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ╔═════════════════════════════════════════╗
echo ║  AI面试系统 - 本地前后端联调启动脚本   ║
echo ╚═════════════════════════════════════════╝
echo.

REM 检查Node.js
where node.exe >nul 2>nul
if errorlevel 1 (
    echo [错误] 找不到 Node.js，请先安装: https://nodejs.org
    pause
    exit /b 1
)

echo [信息] 检测到 Node.js 版本:
node --version
npm --version
echo.

REM 启动后端
echo [步骤1] 启动Mock后端服务 (端口 3001)...
start "Interview-Backend" cmd /k "cd /d "%cd%\backend" && node mock-server.js"
timeout /t 3 /nobreak

REM 启动前端
echo [步骤2] 启动前端开发服务 (端口 5174)...
start "Interview-Frontend" cmd /k "cd /d "%cd%\frontend" && "C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5174"
timeout /t 5 /nobreak

echo.
echo ╔═════════════════════════════════════════╗
echo ║          启动完成! 请稍候...             ║
echo ╚═════════════════════════════════════════╝
echo.

REM 等待服务启动
echo [等待] 检查服务状态...
setlocal
set "counter=0"
:check_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>nul
if %errorlevel% neq 0 (
    set /a counter+=1
    if !counter! lss 15 (
        echo [等待] 后端服务还在启动... (!counter!/15)
        goto check_backend
    )
) else (
    echo [✓] 后端服务已就绪
)
endlocal

echo.
echo ╔═════════════════════════════════════════╗
echo ║       所有服务已启动!                   ║
echo ╚═════════════════════════════════════════╝
echo.

echo 📋 服务地址:
echo   前端: http://localhost:5174
echo   后端: http://localhost:3001
echo.

echo 💡 下一步:
echo   1. 打开浏览器访问 http://localhost:5174
echo   2. 前端会自动代理API请求到后端
echo   3. 按 F12 查看浏览器控制台和网络请求
echo.

echo ✨ 提示:
echo   - 如需停止，请关闭弹出的cmd窗口
echo   - 后端日志: backend\backend.log
echo   - 前端日志: frontend\frontend.log
echo   - 完整指南: 查看 LOCAL_INTEGRATION_GUIDE.md
echo.

echo 🚀 准备好了吗?
echo http://localhost:5174
echo.

pause
