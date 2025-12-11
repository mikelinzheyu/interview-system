@echo off
echo ====================================================
echo AI面试系统 - Docker生产环境快速部署
echo ====================================================
echo.

REM 切换到production目录
cd /d "%~dp0"

echo [1/5] 检查Docker状态...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker Desktop未运行，请先启动Docker Desktop
    echo.
    echo 请按照以下步骤操作：
    echo 1. 启动Docker Desktop应用
    echo 2. 等待Docker完全启动（托盘图标变绿）
    echo 3. 重新运行此脚本
    pause
    exit /b 1
)
echo [完成] Docker运行正常
echo.

echo [2/5] 停止旧服务（如果存在）...
docker-compose -f docker-compose.production.yml down
echo.

echo [3/5] 构建Docker镜像...
echo 这可能需要几分钟，请耐心等待...
docker-compose -f docker-compose.production.yml build --no-cache
if errorlevel 1 (
    echo [错误] 镜像构建失败
    pause
    exit /b 1
)
echo [完成] 镜像构建成功
echo.

echo [4/5] 启动所有服务...
docker-compose -f docker-compose.production.yml up -d
if errorlevel 1 (
    echo [错误] 服务启动失败
    pause
    exit /b 1
)
echo [完成] 服务启动成功
echo.

echo [5/5] 等待服务就绪...
timeout /t 10 /nobreak >nul
echo.

echo ====================================================
echo 部署完成！
echo ====================================================
echo.
echo 服务访问地址：
echo   前端应用: http://localhost
echo   Java后端: http://localhost:8080
echo   Node后端: http://localhost:3001
echo   MySQL:    localhost:3307
echo   Redis:    localhost:6380
echo.
echo 查看服务状态：
echo   docker-compose -f docker-compose.production.yml ps
echo.
echo 查看服务日志：
echo   docker-compose -f docker-compose.production.yml logs -f
echo.
pause
