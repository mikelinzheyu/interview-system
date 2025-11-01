@echo off
REM AI面试系统 - Windows生产环境部署脚本
REM =====================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ==========================================
echo AI面试系统 - 生产环境部署
echo ==========================================
echo.

REM 检查Docker
echo [INFO] 检查Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker未安装
    exit /b 1
)

echo [INFO] Docker已安装
docker --version

REM 检查docker-compose
echo [INFO] 检查docker-compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] docker-compose未安装
    exit /b 1
)

echo [INFO] docker-compose已安装
docker-compose --version

REM 检查配置文件
echo [INFO] 检查配置文件...
if not exist ".env.prod" (
    echo [ERROR] .env.prod文件不存在，请先配置
    exit /b 1
)

if not exist "docker-compose.prod.yml" (
    echo [ERROR] docker-compose.prod.yml文件不存在
    exit /b 1
)

echo [SUCCESS] 配置文件检查完成

REM 创建必要的目录
echo [INFO] 创建数据目录...
if not exist "data\db\init" mkdir data\db\init
if not exist "data\db\backups" mkdir data\db\backups
if not exist "data\redis" mkdir data\redis
if not exist "data\backend\uploads" mkdir data\backend\uploads
if not exist "data\storage" mkdir data\storage
if not exist "data\frontend\cache" mkdir data\frontend\cache
if not exist "data\proxy\cache" mkdir data\proxy\cache
if not exist "logs\db" mkdir logs\db
if not exist "logs\redis" mkdir logs\redis
if not exist "logs\backend" mkdir logs\backend
if not exist "logs\storage" mkdir logs\storage
if not exist "logs\frontend" mkdir logs\frontend
if not exist "logs\proxy" mkdir logs\proxy
if not exist "logs\prometheus" mkdir logs\prometheus
if not exist "logs\grafana" mkdir logs\grafana
if not exist "logs\elasticsearch" mkdir logs\elasticsearch
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "monitoring\prometheus" mkdir monitoring\prometheus
if not exist "monitoring\grafana" mkdir monitoring\grafana

echo [SUCCESS] 数据目录创建完成

REM 检查SSL证书
echo [INFO] 检查SSL证书...
if not exist "nginx\ssl\cert.pem" (
    echo [WARN] SSL证书不存在
    echo [INFO] 请手动配置SSL证书或使用以下命令生成自签证书:
    echo   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
)

REM 构建Docker镜像
echo.
echo [INFO] 构建Docker镜像...
docker-compose -f docker-compose.prod.yml build --no-cache
if errorlevel 1 (
    echo [ERROR] Docker镜像构建失败
    exit /b 1
)

echo [SUCCESS] Docker镜像构建完成

REM 启动服务
echo.
echo [INFO] 启动服务...
docker-compose -f docker-compose.prod.yml up -d
if errorlevel 1 (
    echo [ERROR] 服务启动失败
    exit /b 1
)

echo [SUCCESS] 服务启动完成

REM 显示服务状态
echo.
echo [INFO] 显示服务状态...
timeout /t 5 /nobreak
docker-compose -f docker-compose.prod.yml ps

echo.
echo ==========================================
echo [SUCCESS] 部署完成！
echo ==========================================
echo.
echo 访问地址:
echo   前端: https://localhost
echo   后端API: https://localhost/api
echo   存储服务: https://localhost/storage
echo.
echo 日志位置: .\logs\
echo 数据位置: .\data\
echo.
echo 有用的命令:
echo   查看日志: docker-compose -f docker-compose.prod.yml logs -f [service-name]
echo   停止服务: docker-compose -f docker-compose.prod.yml down
echo   重启服务: docker-compose -f docker-compose.prod.yml restart
echo.
pause
