@echo off
echo ========================================
echo    Redis 服务启动脚本
echo ========================================
echo.

echo [1/3] 检查 Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop 未运行
    echo    请先启动 Docker Desktop
    echo.
    pause
    exit /b 1
)
echo ✅ Docker 可用

echo.
echo [2/3] 启动 Redis 服务...
cd /d %~dp0
docker-compose up -d redis
if %errorlevel% neq 0 (
    echo ❌ Redis 启动失败
    pause
    exit /b 1
)

echo.
echo [3/3] 等待 Redis 就绪...
timeout /t 3 >nul
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Redis 可能还在启动中...
    echo    请稍后运行测试脚本
) else (
    echo ✅ Redis 已就绪!
)

echo.
echo ========================================
echo    Redis 服务启动完成!
echo ========================================
echo.
echo 📝 有用的命令:
echo    查看日志: docker-compose logs -f redis
echo    测试连接: node ..\test-redis-connection.js
echo    查看状态: docker-compose ps
echo.
pause
