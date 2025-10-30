@echo off
chcp 65001 >nul
color 0A
cls

REM Storage Service Docker 生产环境部署脚本 (Windows)
REM 使用方式: deploy-prod.bat [start|stop|restart|logs|status|backup|health]

setlocal enabledelayedexpansion

REM 配置
set "COMPOSE_FILE=docker-compose-prod.yml"

REM 颜色代码 (使用 findstr 实现)
set "GREEN=✓"
set "RED=✗"
set "INFO=ℹ"

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║          🚀 Storage Service Docker 生产环境部署                   ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM 检查参数
if "%1"=="" (
    goto show_help
)

REM 检查 Docker
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Docker 未安装
    echo.
    echo 请从以下地址下载安装 Docker:
    echo https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM 检查 Docker Compose
docker-compose --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Docker Compose 未安装
    pause
    exit /b 1
)

REM 检查 compose 文件
if not exist "%COMPOSE_FILE%" (
    echo %RED% 文件不存在: %COMPOSE_FILE%
    pause
    exit /b 1
)

echo %GREEN% Docker 和 Docker Compose 已就绪
echo %GREEN% docker-compose 文件已找到
echo.

REM 处理命令
if "%1"=="start" goto start_services
if "%1"=="stop" goto stop_services
if "%1"=="restart" goto restart_services
if "%1"=="logs" goto show_logs
if "%1"=="status" goto show_status
if "%1"=="backup" goto backup_data
if "%1"=="health" goto health_check
goto show_help

REM ============ 启动服务 ============
:start_services
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      启动存储服务                                 ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo %INFO% 构建镜像...
docker-compose -f %COMPOSE_FILE% build
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo %INFO% 启动服务...
docker-compose -f %COMPOSE_FILE% up -d
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo %INFO% 等待服务启动（60秒）...
timeout /t 60 /nobreak

echo.
echo %INFO% 验证服务状态...
docker-compose -f %COMPOSE_FILE% ps

echo.
echo %GREEN% 存储服务已成功启动
echo.
echo 📊 服务信息:
echo   Storage Service URL: http://localhost:8081
echo   API 端点: http://localhost:8081/api/sessions
echo   Redis: interview-redis:6379
echo.
echo 📝 常用命令:
echo   查看日志: deploy-prod.bat logs storage
echo   停止服务: deploy-prod.bat stop
echo   重启服务: deploy-prod.bat restart
echo.
pause
exit /b 0

REM ============ 停止服务 ============
:stop_services
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      停止存储服务                                 ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo %INFO% 停止所有容器...
docker-compose -f %COMPOSE_FILE% down

echo.
echo %GREEN% 服务已停止
echo.
pause
exit /b 0

REM ============ 重启服务 ============
:restart_services
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      重启存储服务                                 ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo %INFO% 重启所有容器...
docker-compose -f %COMPOSE_FILE% restart

echo.
echo %INFO% 等待服务重启（30秒）...
timeout /t 30 /nobreak

echo.
echo %INFO% 验证服务状态...
docker-compose -f %COMPOSE_FILE% ps

echo.
echo %GREEN% 服务已重启
echo.
pause
exit /b 0

REM ============ 显示日志 ============
:show_logs
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      显示服务日志                                 ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

if "%2"=="storage" (
    docker-compose -f %COMPOSE_FILE% logs -f interview-storage-service
) else if "%2"=="redis" (
    docker-compose -f %COMPOSE_FILE% logs -f interview-redis
) else (
    docker-compose -f %COMPOSE_FILE% logs -f
)

exit /b 0

REM ============ 显示状态 ============
:show_status
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      服务状态                                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo 📊 容器状态:
docker-compose -f %COMPOSE_FILE% ps

echo.
echo 💾 资源使用情况:
docker stats --no-stream

echo.
pause
exit /b 0

REM ============ 备份数据 ============
:backup_data
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      备份数据                                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

if not exist backups mkdir backups

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

set "TIMESTAMP=%mydate%-%mytime%"

echo %INFO% 备份 Redis 数据...
docker cp interview-redis:/data/dump.rdb backups/redis-backup-%TIMESTAMP%.rdb
echo %GREEN% Redis 数据已备份

echo.
echo %INFO% 备份应用日志...
docker cp interview-storage-service:/app/logs backups/logs-backup-%TIMESTAMP%
echo %GREEN% 应用日志已备份

echo.
echo %GREEN% 备份完成
echo   位置: backups\
echo.
pause
exit /b 0

REM ============ 健康检查 ============
:health_check
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║                      健康检查                                     ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo %INFO% 检查 Redis...
docker-compose -f %COMPOSE_FILE% exec -T interview-redis redis-cli -a redis-password-prod ping >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN% Redis 健康
) else (
    echo %RED% Redis 异常
    pause
    exit /b 1
)

echo.
echo %INFO% 检查 Storage Service...
curl -f http://localhost:8081/api/sessions >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN% Storage Service 健康
) else (
    echo %RED% Storage Service 异常
    pause
    exit /b 1
)

echo.
echo %GREEN% 所有服务健康检查通过
echo.
pause
exit /b 0

REM ============ 显示帮助 ============
:show_help
cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║          Storage Service Docker 生产部署脚本（Windows）          ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo 使用方式: %0 [命令]
echo.
echo 命令:
echo   start              启动服务
echo   stop               停止服务
echo   restart            重启服务
echo   logs [service]     显示日志 (service: storage^|redis^|all)
echo   status             显示服务状态
echo   backup             备份数据
echo   health             执行健康检查
echo   help               显示此帮助信息
echo.
echo 示例:
echo   %0 start                 # 启动服务
echo   %0 logs storage          # 显示 Storage Service 日志
echo   %0 backup                # 备份数据
echo.
pause
exit /b 0

REM ============ 错误处理 ============
:error
echo.
echo %RED% 命令执行失败，请查看上面的错误信息
echo.
pause
exit /b 1
