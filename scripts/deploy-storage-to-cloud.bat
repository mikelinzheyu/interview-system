@echo off
REM 云服务器一键部署脚本 (Windows版)
REM 使用 PuTTY 或其他 SSH 工具连接到云服务器后运行
REM
REM 或者在 PowerShell 中运行：
REM   powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/YOUR_USERNAME/interview-system/main/scripts/deploy-storage-to-cloud.ps1' -OutFile 'deploy.ps1'; .\deploy.ps1"

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     🚀 Storage Service 云服务器一键部署脚本 (Windows)           ║
echo ║     Nginx + Docker + Redis 完整生产环境                         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo 步骤 1: 检查依赖...

REM 检查 Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker 未安装！
    echo 请从 https://www.docker.com/products/docker-desktop 下载安装
    pause
    exit /b 1
)

REM 检查 Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git 未安装！
    echo 请从 https://git-scm.com/download/win 下载安装
    pause
    exit /b 1
)

echo ✓ 依赖检查完成
echo.

REM 获取配置信息
echo 步骤 2: 收集配置信息...
echo.

set /p GITHUB_REPO="请输入 GitHub 仓库地址 (例: https://github.com/username/interview-system.git): "
set /p DOMAIN_NAME="请输入域名 (例: storage.interview-system.com): "
set /p REDIS_PASSWORD="请输入 Redis 密码 (最少16字符): "
set /p STORAGE_API_KEY="请输入存储服务 API Key (最少32字符): "

if %REDIS_PASSWORD% gtr 0 (
    if "%REDIS_PASSWORD:~15%" equ "" (
        echo 错误: Redis 密码至少需要 16 个字符
        pause
        exit /b 1
    )
)

if %STORAGE_API_KEY% gtr 0 (
    if "%STORAGE_API_KEY:~31%" equ "" (
        echo 错误: API Key 至少需要 32 个字符
        pause
        exit /b 1
    )
)

echo ✓ 配置信息收集完成
echo.

REM 创建项目目录
echo 步骤 3: 克隆/更新代码...

set PROJECT_DIR=%USERPROFILE%\interview-system
if not exist "%PROJECT_DIR%" mkdir "%PROJECT_DIR%"
cd /d "%PROJECT_DIR%"

if exist ".git" (
    echo 仓库已存在，正在更新...
    git pull origin main
) else (
    echo 克隆仓库...
    git clone %GITHUB_REPO% .
)

echo ✓ 代码同步完成
echo.

REM 配置环境变量
echo 步骤 4: 配置环境变量...

cd /d "%PROJECT_DIR%\storage-service"

(
    echo # Redis 配置
    echo SPRING_REDIS_HOST=interview-redis
    echo SPRING_REDIS_PORT=6379
    echo SPRING_REDIS_PASSWORD=%REDIS_PASSWORD%
    echo SPRING_REDIS_TIMEOUT=3000ms
    echo SPRING_REDIS_DATABASE=0
    echo SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE=8
    echo SPRING_REDIS_LETTUCE_POOL_MAX_IDLE=8
    echo.
    echo # 存储服务配置
    echo SERVER_PORT=8081
    echo SESSION_STORAGE_API_KEY=%STORAGE_API_KEY%
    echo.
    echo # Spring 配置
    echo SPRING_PROFILES_ACTIVE=prod
    echo.
    echo # Java 配置
    echo JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200
    echo.
    echo # 时区
    echo TZ=Asia/Shanghai
) > .env.prod

echo ✓ 环境变量配置完成
echo.

REM 启动 Docker 容器
echo 步骤 5: 启动 Docker 容器...

docker-compose -f docker-compose-prod.yml down 2>nul
docker-compose -f docker-compose-prod.yml up -d

REM 等待容器启动
echo 等待容器启动 (15 秒)...
timeout /t 15 /nobreak

REM 检查容器状态
docker-compose -f docker-compose-prod.yml ps | findstr "interview-storage-service" >nul
if %errorlevel% neq 0 (
    echo 错误: 存储服务容器启动失败
    docker-compose -f docker-compose-prod.yml logs interview-storage-service
    pause
    exit /b 1
)

docker-compose -f docker-compose-prod.yml ps | findstr "interview-redis" >nul
if %errorlevel% neq 0 (
    echo 错误: Redis 容器启动失败
    docker-compose -f docker-compose-prod.yml logs interview-redis
    pause
    exit /b 1
)

echo ✓ Docker 容器启动成功
echo.

REM 健康检查
echo 步骤 6: 执行健康检查...

for /l %%i in (1,1,5) do (
    curl -f -H "Authorization: Bearer %STORAGE_API_KEY%" http://localhost:8081/api/sessions >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ 存储服务响应正常
        goto health_ok
    )
    if %%i lss 5 (
        echo 尝试 %%i/5，等待服务启动...
        timeout /t 3 /nobreak
    )
)

echo 错误: 存储服务无法响应
pause
exit /b 1

:health_ok
echo.

REM 完成
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   ✅ 本地部署完成！                             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 重要信息：
echo   📍 服务地址: http://localhost:8081 (本地)
echo   🔐 API Key: %STORAGE_API_KEY%
echo   🗝️  Redis 密码: %REDIS_PASSWORD%
echo.
echo 后续步骤：
echo   1. 将代码推送到 GitHub: git push origin main
echo   2. GitHub Actions 将自动部署到云服务器
echo   3. 在 Dify 中更新 API 地址为: https://%DOMAIN_NAME%/api/sessions
echo.
echo 有用的命令：
echo   查看日志: docker-compose -f docker-compose-prod.yml logs -f
echo   重启服务: docker-compose -f docker-compose-prod.yml restart
echo   停止服务: docker-compose -f docker-compose-prod.yml down
echo   健康检查: curl -H "Authorization: Bearer %STORAGE_API_KEY%" http://localhost:8081/api/sessions
echo.
echo 安全提示：
echo   ⚠️  请妥善保管 API Key 和 Redis 密码
echo   ⚠️  不要将 .env.prod 提交到 GitHub
echo   ⚠️  定期备份 Redis 数据
echo.

pause
