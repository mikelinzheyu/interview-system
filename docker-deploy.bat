@echo off
chcp 65001 >nul
color 0B
cls

REM AI 面试系统完整 Docker 部署脚本 (Windows)

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║        🚀 AI 面试系统 - 完整 Docker 部署                          ║
echo ║         (前端 + 后端 + 存储服务 + Redis)                         ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

if "%1"=="" goto show_help

REM 检查 Docker
echo ✓ 检查 Docker 环境...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Docker 未安装
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Docker Compose 未安装
    pause
    exit /b 1
)

echo ✓ Docker 环境已就绪
echo.

REM 处理命令
if "%1"=="start" goto start_all
if "%1"=="stop" goto stop_all
if "%1"=="restart" goto restart_all
if "%1"=="logs" goto show_logs
if "%1"=="status" goto show_status
if "%1"=="build" goto build_images
goto show_help

REM ============ 启动所有服务 ============
:start_all
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   启动所有服务                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo ✓ 构建镜像...
docker-compose -f docker-compose-full.yml build

echo.
echo ✓ 启动容器...
docker-compose -f docker-compose-full.yml up -d

echo.
echo ✓ 等待服务启动（60秒）...
timeout /t 60 /nobreak

echo.
echo ✓ 验证容器状态...
docker-compose -f docker-compose-full.yml ps

echo.
echo ════════════════════════════════════════════════════════════════════
echo ✅ 所有服务已启动！
echo ════════════════════════════════════════════════════════════════════
echo.
echo 📊 服务访问地址:
echo   • 前端应用:        http://localhost:5174
echo   • 后端 API:       http://localhost:3001
echo   • 存储服务:       http://localhost:8081
echo   • Redis:          localhost:6379
echo.
echo 📝 常用命令:
echo   • 查看日志:       docker-deploy.bat logs [service]
echo   • 停止服务:       docker-deploy.bat stop
echo   • 重启服务:       docker-deploy.bat restart
echo   • 查看状态:       docker-deploy.bat status
echo.
echo 📖 可用服务:
echo   • frontend        前端应用
echo   • backend         后端 API
echo   • storage-service 存储服务
echo   • redis           Redis 缓存
echo.
pause
exit /b 0

REM ============ 停止所有服务 ============
:stop_all
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   停止所有服务                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo ✓ 停止容器...
docker-compose -f docker-compose-full.yml down

echo.
echo ✅ 所有服务已停止
echo.
pause
exit /b 0

REM ============ 重启所有服务 ============
:restart_all
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   重启所有服务                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo ✓ 重启容器...
docker-compose -f docker-compose-full.yml restart

echo.
echo ✓ 等待服务重启（30秒）...
timeout /t 30 /nobreak

echo.
docker-compose -f docker-compose-full.yml ps

echo.
echo ✅ 所有服务已重启
echo.
pause
exit /b 0

REM ============ 显示日志 ============
:show_logs
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   显示服务日志                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

if "%2"=="" (
    echo ✓ 显示所有服务日志...
    docker-compose -f docker-compose-full.yml logs -f
) else (
    echo ✓ 显示 %2 服务日志...
    docker-compose -f docker-compose-full.yml logs -f %2
)
exit /b 0

REM ============ 显示状态 ============
:show_status
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   容器状态                                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

docker-compose -f docker-compose-full.yml ps

echo.
echo ════════════════════════════════════════════════════════════════════
echo 📊 资源使用情况:
echo ════════════════════════════════════════════════════════════════════
docker stats --no-stream

echo.
pause
exit /b 0

REM ============ 构建镜像 ============
:build_images
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                   构建所有镜像                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo ✓ 构建镜像（无缓存）...
docker-compose -f docker-compose-full.yml build --no-cache

echo.
echo ✅ 镜像构建完成
echo.
pause
exit /b 0

REM ============ 显示帮助 ============
:show_help
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║      AI 面试系统 Docker 部署脚本 (Windows)                       ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 使用方式: %0 [命令]
echo.
echo 可用命令:
echo   start              启动所有服务
echo   stop               停止所有服务
echo   restart            重启所有服务
echo   build              构建所有镜像（无缓存）
echo   logs [service]     显示日志
echo   status             显示容器状态
echo   help               显示此帮助
echo.
echo 示例:
echo   %0 start                    # 启动所有服务
echo   %0 logs backend             # 显示后端日志
echo   %0 logs storage-service     # 显示存储服务日志
echo   %0 status                   # 显示容器状态
echo.
echo 可用的服务:
echo   • frontend         - Vue 3 前端
echo   • backend          - Node.js API
echo   • storage-service  - Java 存储服务
echo   • redis            - Redis 缓存
echo.
pause
exit /b 0
