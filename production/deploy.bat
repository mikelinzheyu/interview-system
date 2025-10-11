@echo off
REM ====================================================
REM AI面试系统 - 生产环境部署脚本 (Windows)
REM ====================================================

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ==========================================
echo   AI面试系统 - 生产环境部署
echo ==========================================
echo.

REM 检查Docker
echo [INFO] 检查Docker环境...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker未运行，请启动Docker Desktop
    pause
    exit /b 1
)
echo [SUCCESS] Docker环境检查通过
echo.

REM 检查Docker Compose
echo [INFO] 检查Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose未安装
    pause
    exit /b 1
)
echo [SUCCESS] Docker Compose检查通过
echo.

REM 检查环境变量文件
echo [INFO] 检查环境配置...
if not exist .env.production (
    echo [WARNING] .env.production 不存在，从示例文件复制...
    copy .env.example .env.production
    echo [WARNING] 请编辑 .env.production 并设置正确的密码和密钥
    pause
    exit /b 1
)
echo [SUCCESS] 环境配置检查通过
echo.

REM 创建必要的目录
echo [INFO] 创建必要的目录...
if not exist data\redis mkdir data\redis
if not exist logs\redis mkdir logs\redis
if not exist logs\storage-api mkdir logs\storage-api
if not exist logs\backend mkdir logs\backend
if not exist logs\nginx mkdir logs\nginx
if not exist logs\proxy mkdir logs\proxy
if not exist nginx\ssl mkdir nginx\ssl
echo [SUCCESS] 目录创建完成
echo.

REM 构建镜像
echo [INFO] 构建Docker镜像...
docker-compose -f docker-compose.production.yml build --no-cache
if errorlevel 1 (
    echo [ERROR] 镜像构建失败
    pause
    exit /b 1
)
echo [SUCCESS] 镜像构建完成
echo.

REM 启动服务
echo [INFO] 启动服务...
docker-compose -f docker-compose.production.yml up -d
if errorlevel 1 (
    echo [ERROR] 服务启动失败
    pause
    exit /b 1
)
echo [SUCCESS] 服务启动完成
echo.

REM 等待服务启动
echo [INFO] 等待服务启动...
timeout /t 10 /nobreak >nul

REM 显示服务状态
echo [INFO] 服务状态：
docker-compose -f docker-compose.production.yml ps
echo.

echo ==========================================
echo 部署完成！
echo ==========================================
echo.
echo 服务访问地址：
echo   前端: http://localhost:80
echo   后端API: http://localhost:3001
echo   存储API: http://localhost:8090
echo   Redis: localhost:6379
echo.
echo 常用命令：
echo   查看日志: docker-compose -f docker-compose.production.yml logs -f
echo   停止服务: docker-compose -f docker-compose.production.yml down
echo   重启服务: docker-compose -f docker-compose.production.yml restart
echo.
echo 配置文件：
echo   环境变量: production\.env.production
echo   Docker配置: production\docker-compose.production.yml
echo.

pause
