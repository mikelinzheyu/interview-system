@echo off
REM 启动前端开发服务器

echo.
echo ========================================
echo 启动前端开发服务器 (Vite)
echo ========================================
echo.

cd /d "%~dp0frontend"

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo 安装依赖中...
    call npm install
)

echo.
echo 启动Vite开发服务器...
echo 访问地址: http://localhost:5174
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
