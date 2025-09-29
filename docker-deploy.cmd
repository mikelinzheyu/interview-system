@echo off
REM AI面试系统 Docker 生产环境部署脚本 (Windows版)

echo 🚀 AI面试系统 Docker 生产环境部署
echo ==================================
echo.

REM 检查Docker是否可用
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Docker或Docker未运行
    echo 请启动Docker Desktop后重试
    pause
    exit /b 1
)

docker-compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到docker-compose
    echo 请安装Docker Desktop完整版
    pause
    exit /b 1
)

REM 创建必要的目录
echo 📁 创建必要的目录...
if not exist logs mkdir logs
if not exist logs\frontend mkdir logs\frontend
if not exist logs\backend mkdir logs\backend
if not exist logs\redis mkdir logs\redis
if not exist logs\proxy mkdir logs\proxy
if not exist data mkdir data
if not exist data\redis mkdir data\redis
if not exist nginx mkdir nginx
if not exist nginx\ssl mkdir nginx\ssl

REM 检查环境文件
if not exist .env.production (
    echo ❌ 错误: 未找到 .env.production 文件
    echo 请复制 .env.example 为 .env.production 并配置必要的参数
    pause
    exit /b 1
)

REM 停止已存在的容器
echo 🛑 停止现有容器...
docker-compose --env-file .env.production down --remove-orphans

REM 构建镜像
echo 🔨 构建Docker镜像...
echo   构建后端镜像...
docker-compose --env-file .env.production build --no-cache backend
if %errorlevel% neq 0 (
    echo ❌ 后端镜像构建失败
    pause
    exit /b 1
)

echo   构建前端镜像...
docker-compose --env-file .env.production build --no-cache frontend
if %errorlevel% neq 0 (
    echo ❌ 前端镜像构建失败
    pause
    exit /b 1
)

REM 启动服务
echo 🚀 启动服务...
docker-compose --env-file .env.production up -d
if %errorlevel% neq 0 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
)

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 30 /nobreak >nul

REM 健康检查
echo 🔍 进行健康检查...

echo   检查后端服务...
curl -f http://localhost:8080/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ 后端服务正常
) else (
    echo   ❌ 后端服务异常
)

echo   检查前端服务...
curl -f http://localhost:80/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ 前端服务正常
) else (
    echo   ❌ 前端服务异常，正在检查基础连接...
    curl -f http://localhost:80 >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✅ 前端基础连接正常
    ) else (
        echo   ❌ 前端服务连接异常
    )
)

REM 显示状态
echo.
echo 📊 服务状态:
docker-compose --env-file .env.production ps

echo.
echo 🎉 部署完成！
echo.
echo 📱 访问地址:
echo   前端应用: http://localhost
echo   API服务: http://localhost:8080
echo   健康检查: http://localhost/health
echo.
echo 📝 常用命令:
echo   查看日志: docker-compose --env-file .env.production logs -f
echo   停止服务: docker-compose --env-file .env.production down
echo   重启服务: docker-compose --env-file .env.production restart
echo.
echo 🔧 如果遇到问题，请检查日志或联系技术支持
echo.
pause