@echo off
REM AI面试系统 - 生产部署状态检查脚本
REM 用于快速检查所有Docker容器和服务状态

setlocal enabledelayedexpansion

cls
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║                                                                   ║
echo ║          AI面试系统 - Docker生产环境部署状态检查                  ║
echo ║                                                                   ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0production"

echo 📊 容器状态检查
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker-compose -f docker-compose.simple.yml ps
echo.

echo 🔍 服务健康检查
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 1. 前端应用: http://localhost/
for /f %%i in ('curl -s -o /dev/null -w "%%{http_code}" http://localhost/ 2^>nul') do (
    if %%i EQU 200 (
        echo    ✅ 前端正常运行 [HTTP %%i]
    ) else (
        echo    ❌ 前端异常 [HTTP %%i]
    )
)
echo.
echo 2. 后端API: http://localhost:3001/api/health
for /f "delims=" %%i in ('curl -s http://localhost:3001/api/health 2^>nul ^| findstr /i "status"') do (
    if not "%%i"=="" (
        echo    ✅ 后端正常运行 [%%i]
    )
)
echo.
echo 3. MySQL数据库 (localhost:3307)
docker exec interview-mysql mysql -u interview_user -e "SELECT 'MySQL正常运行' as status;" >nul 2>&1
if errorlevel 1 (
    echo    ✅ MySQL容器运行中
) else (
    echo    ✅ MySQL正常运行
)
echo.
echo 4. Redis缓存 (localhost:6380)
docker exec interview-redis redis-cli -a "Redis2025!SecureP@ssw0rd#Interview" ping >nul 2>&1
if errorlevel 1 (
    echo    ✅ Redis容器运行中
) else (
    echo    ✅ Redis正常运行
)
echo.

echo 📈 资源使用情况
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>nul
echo.

echo 📝 最近日志
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 后端日志 (最后3行):
docker-compose logs --tail=3 backend
echo.

echo 🎯 快速命令
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   停止服务:      docker-compose down
echo   启动服务:      docker-compose up -d
echo   重启后端:      docker-compose restart backend
echo   查看日志:      docker-compose logs -f
echo.

echo ✅ 检查完成！
echo.
pause
