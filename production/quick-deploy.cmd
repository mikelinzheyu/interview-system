@echo off
echo ==================================================
echo 面试系统 Docker 生产环境部署脚本
echo ==================================================

REM 检查 Docker 是否运行
echo 检查 Docker 状态...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker 未安装或未启动
    echo 请确保 Docker Desktop 已安装并正在运行
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] Docker 服务未运行
    echo 正在尝试启动 Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo 等待 Docker 启动...
    timeout /t 30 /nobreak >nul
)

REM 再次检查 Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Docker 服务启动失败
    echo 请手动启动 Docker Desktop 后重试
    pause
    exit /b 1
)

echo [成功] Docker 服务正常

REM 停止现有容器
echo.
echo 停止现有容器...
docker-compose down -v

REM 清理旧镜像
echo.
echo 清理旧镜像...
docker image prune -f

REM 构建镜像
echo.
echo 构建镜像...
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo [错误] 镜像构建失败
    pause
    exit /b 1
)

REM 启动服务
echo.
echo 启动服务...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [错误] 服务启动失败
    pause
    exit /b 1
)

echo.
echo 等待服务就绪...
timeout /t 30 /nobreak >nul

REM 检查服务状态
echo.
echo 检查服务状态...
docker-compose ps

echo.
echo ==================================================
echo 部署完成！
echo ==================================================
echo 前端地址: http://localhost
echo 后端地址: http://localhost:8080
echo 数据库地址: localhost:3306
echo Redis地址: localhost:6379
echo.
echo 管理命令:
echo   查看日志: docker-compose logs -f
echo   停止服务: docker-compose down
echo   重启服务: docker-compose restart
echo   查看状态: docker-compose ps
echo ==================================================

pause