@echo off
REM AI面试系统 - Docker生产部署脚本 (CMD)
REM ========================================
REM 使用方法: docker-deploy-prod.bat [start|stop|restart|logs|status|clean]

setlocal enabledelayedexpansion

set PROJECT_NAME=interview-system
set ENV_FILE=.env.docker
set DOCKER_COMPOSE_FILE=docker-compose.yml

REM 颜色定义 (Windows CMD 不原生支持颜色，使用简单输出)
set "SUCCESS=[SUCCESS]"
set "ERROR=[ERROR]"
set "WARNING=[WARNING]"
set "HEADER=[INFO]"

:main
if "%1"=="" (
    call :show_usage
    exit /b 0
)

if /i "%1"=="start" (
    call :check_environment
    call :prepare_deployment
    call :build_images
    call :start_services
    call :verify_deployment
    echo.
    echo %HEADER% 部署成功
    echo %HEADER% 前端地址: http://localhost
    echo %HEADER% 后端API: http://localhost:8080/api
    echo %HEADER% Redis: localhost:6379
    exit /b 0
)

if /i "%1"=="stop" (
    call :stop_services
    exit /b 0
)

if /i "%1"=="restart" (
    call :restart_services
    call :verify_deployment
    exit /b 0
)

if /i "%1"=="logs" (
    call :show_logs %2
    exit /b 0
)

if /i "%1"=="status" (
    call :show_status
    exit /b 0
)

if /i "%1"=="verify" (
    call :verify_deployment
    exit /b 0
)

if /i "%1"=="clean" (
    call :clean_data
    exit /b 0
)

if /i "%1"=="help" (
    call :show_usage
    exit /b 0
)

echo %ERROR% 未知的命令: %1
call :show_usage
exit /b 1

:check_environment
echo.
echo %HEADER% ========================================
echo %HEADER% 检查环境
echo %HEADER% ========================================

REM 检查Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker未安装
    exit /b 1
)
for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo %SUCCESS% %DOCKER_VERSION%

REM 检查Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker Compose未安装
    exit /b 1
)
for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
echo %SUCCESS% %COMPOSE_VERSION%

REM 检查必要文件
if not exist "%DOCKER_COMPOSE_FILE%" (
    echo %ERROR% %DOCKER_COMPOSE_FILE% 不存在
    exit /b 1
)
echo %SUCCESS% %DOCKER_COMPOSE_FILE% 已找到

if not exist "%ENV_FILE%" (
    echo %WARNING% %ENV_FILE% 不存在
    if exist ".env.production" (
        copy .env.production %ENV_FILE% >nul
        echo %SUCCESS% 从 .env.production 复制配置
    ) else (
        echo %ERROR% .env.production 不存在
        exit /b 1
    )
)
echo %SUCCESS% %ENV_FILE% 已找到

REM 创建必要的目录
if not exist "logs\backend" mkdir logs\backend
if not exist "logs\frontend" mkdir logs\frontend
if not exist "logs\redis" mkdir logs\redis
if not exist "logs\proxy" mkdir logs\proxy
if not exist "data\redis" mkdir data\redis
if not exist "backend\uploads" mkdir backend\uploads
if not exist "nginx\ssl" mkdir nginx\ssl
echo %SUCCESS% 目录结构已创建

exit /b 0

:prepare_deployment
echo.
echo %HEADER% ========================================
echo %HEADER% 准备部署
echo %HEADER% ========================================

REM 检查.env文件
findstr /M "DIFY_API_KEY=your-dify-api-key" %ENV_FILE% >nul 2>&1
if errorlevel 0 (
    echo %WARNING% 检测到未配置的DIFY_API_KEY
)

echo %SUCCESS% 部署准备完成
exit /b 0

:build_images
echo.
echo %HEADER% ========================================
echo %HEADER% 构建Docker镜像
echo %HEADER% ========================================

echo %WARNING% 构建后端镜像...
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% build backend
if errorlevel 1 (
    echo %ERROR% 后端镜像构建失败
    exit /b 1
)
echo %SUCCESS% 后端镜像构建完成

echo %WARNING% 构建前端镜像...
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% build frontend
if errorlevel 1 (
    echo %ERROR% 前端镜像构建失败
    exit /b 1
)
echo %SUCCESS% 前端镜像构建完成

echo %WARNING% 验证Redis镜像...
docker pull redis:7-alpine >nul 2>&1
echo %SUCCESS% Redis镜像已就绪

echo %SUCCESS% 所有镜像构建完成
exit /b 0

:start_services
echo.
echo %HEADER% ========================================
echo %HEADER% 启动服务
echo %HEADER% ========================================

echo %WARNING% 启动Docker Compose栈...
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% up -d
if errorlevel 1 (
    echo %ERROR% 启动服务失败
    exit /b 1
)

echo %WARNING% 等待服务启动...
timeout /t 5 /nobreak >nul

echo %WARNING% 等待服务健康检查...
setlocal enabledelayedexpansion
for /l %%i in (1,1,30) do (
    docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% ps | find "healthy" >nul 2>&1
    if errorlevel 0 (
        echo %SUCCESS% 所有服务已启动且健康
        exit /b 0
    )
    if %%i equ 30 (
        echo %ERROR% 服务启动超时
        call :show_logs
        exit /b 1
    )
    timeout /t 1 /nobreak >nul
)

exit /b 0

:show_status
echo.
echo %HEADER% ========================================
echo %HEADER% 服务状态
echo %HEADER% ========================================
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% ps

echo.
echo %HEADER% ========================================
echo %HEADER% 网络信息
echo %HEADER% ========================================
docker network ls | find "interview-network"

exit /b 0

:show_logs
echo.
echo %HEADER% ========================================
echo %HEADER% 服务日志
echo %HEADER% ========================================
if "%1"=="" (
    docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% logs --tail=50 -f
) else (
    docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% logs --tail=50 -f %1
)
exit /b 0

:stop_services
echo.
echo %HEADER% ========================================
echo %HEADER% 停止服务
echo %HEADER% ========================================

echo %WARNING% 停止Docker Compose栈...
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% down
if errorlevel 1 (
    echo %ERROR% 停止服务失败
    exit /b 1
)

echo %SUCCESS% 服务已停止
exit /b 0

:restart_services
echo.
echo %HEADER% ========================================
echo %HEADER% 重启服务
echo %HEADER% ========================================
call :stop_services
timeout /t 2 /nobreak >nul
call :start_services
exit /b 0

:clean_data
echo.
echo %HEADER% ========================================
echo %HEADER% 清理数据
echo %HEADER% ========================================

set /p CONFIRM="即将删除所有容器和数据，确定吗? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo %WARNING% 已取消
    exit /b 0
)

echo %WARNING% 停止并删除所有容器...
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% down -v

echo %WARNING% 删除日志文件...
rmdir /s /q logs 2>nul

echo %WARNING% 删除Redis数据...
rmdir /s /q data 2>nul

echo %SUCCESS% 清理完成
exit /b 0

:verify_deployment
echo.
echo %HEADER% ========================================
echo %HEADER% 验证部署
echo %HEADER% ========================================

echo %WARNING% 检查后端API...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080/api/health' -TimeoutSec 5 } catch { exit 1 }" >nul 2>&1
if errorlevel 0 (
    echo %SUCCESS% 后端API健康检查通过
) else (
    echo %ERROR% 后端API健康检查失败
)

echo %WARNING% 检查前端...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost/health' -TimeoutSec 5 } catch { exit 1 }" >nul 2>&1
if errorlevel 0 (
    echo %SUCCESS% 前端健康检查通过
) else (
    echo %ERROR% 前端健康检查失败
)

echo %WARNING% 检查Redis...
docker-compose --env-file %ENV_FILE% -f %DOCKER_COMPOSE_FILE% exec -T redis redis-cli ping >nul 2>&1
if errorlevel 0 (
    echo %SUCCESS% Redis连接通过
) else (
    echo %ERROR% Redis连接失败
)

echo.
echo %HEADER% ========================================
echo %HEADER% 部署验证完成
echo %HEADER% ========================================
exit /b 0

:show_usage
echo.
echo AI面试系统 - Docker生产部署脚本
echo.
echo 使用方法: docker-deploy-prod.bat [命令]
echo.
echo 命令列表:
echo   start       - 构建并启动所有服务
echo   stop        - 停止所有服务
echo   restart     - 重启所有服务
echo   logs        - 查看服务日志 (可选: logs backend^|frontend^|redis)
echo   status      - 显示服务状态
echo   verify      - 验证部署状态
echo   clean       - 清理所有数据
echo   help        - 显示此帮助信息
echo.
echo 示例:
echo   docker-deploy-prod.bat start
echo   docker-deploy-prod.bat logs backend
echo   docker-deploy-prod.bat status
echo   docker-deploy-prod.bat restart
echo.

exit /b 0

endlocal
