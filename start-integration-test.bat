@echo off
REM 前后端集成测试启动脚本（Windows版本）
REM 使用方法: start-integration-test.bat

setlocal enabledelayedexpansion

echo.
echo.
echo ╔════════════════════════════════════════╗
echo ║   前后端联调测试启动脚本                ║
echo ╚════════════════════════════════════════╝
echo.

REM 设置脚本目录
set SCRIPT_DIR=%~dp0

REM 1. 启动后端
echo [1/3] 启动后端服务...
cd /d "%SCRIPT_DIR%backend"
if exist node_modules (
    echo 后端依赖已存在
) else (
    echo 安装后端依赖...
    call npm install > nul 2>&1
    echo 后端依赖安装完成
)

REM 启动后端（新窗口）
echo 启动后端...
start "Interview-Backend" cmd /k "node mock-server.js"
timeout /t 3 /nobreak

REM 检查后端是否启动
echo 检查后端健康状态...
for /f "delims=" %%i in ('curl -s http://localhost:3001/api/health 2^>nul') do set HEALTH=%%i
if "!HEALTH!"=="" (
    echo ✗ 后端启动失败，请检查是否有错误
    pause
    exit /b 1
)
echo ✓ 后端已启动
echo.

REM 2. 启动前端
echo [2/3] 启动前端服务...
cd /d "%SCRIPT_DIR%frontend"
if exist node_modules (
    echo 前端依赖已存在
) else (
    echo 安装前端依赖...
    call npm install > nul 2>&1
    echo 前端依赖安装完成
)

REM 启动前端（新窗口）
echo 启动前端...
start "Interview-Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak
echo ✓ 前端已启动
echo.

REM 3. 运行集成测试
echo [3/3] 运行集成测试...
cd /d "%SCRIPT_DIR%"
timeout /t 2 /nobreak

node test-integration.js
if errorlevel 1 (
    echo.
    echo ✗ 集成测试有失败
) else (
    echo.
    echo ✓ 集成测试全部通过
)

echo.
echo ════════════════════════════════════════
echo 服务信息：
echo   后端: http://localhost:3001
echo   前端: http://localhost:5174
echo ════════════════════════════════════════
echo.

echo 服务已在新窗口中运行。要停止服务，请关闭对应的命令窗口。
echo.
pause
