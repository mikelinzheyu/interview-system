@echo off
chcp 65001 > nul
color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║             AI 面试官系统 - 启动脚本                           ║
echo ║                                                                ║
echo ║                   系统启动中...                                ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM 检查后端是否已运行
echo [1/4] 检查后端服务...
netstat -ano | findstr ":3001" > nul
if %errorlevel% equ 0 (
    echo ✅ 后端服务已运行 (Port 3001)
) else (
    echo ⏳ 启动后端服务...
    start "后端服务 - Mock Server" cmd /k "cd D:\code7\interview-system && node backend/mock-server.js"
    timeout /t 3 /nobreak
    echo ✅ 后端服务已启动
)

echo.
echo [2/4] 启动前端服务...
start "前端服务 - Vue.js Dev Server" cmd /k "cd D:\code7\interview-system\frontend && npm run dev"
timeout /t 3 /nobreak
echo ✅ 前端服务已启动

echo.
echo [3/4] 检查服务状态...
timeout /t 5 /nobreak

echo.
echo [4/4] 打开浏览器...
start http://localhost:5173
timeout /t 2 /nobreak

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║                   ✅ 系统启动成功！                            ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📍 访问地址：
echo    前端: http://localhost:5173
echo    后端: http://localhost:3001/api/health
echo.
echo ⏳ 请稍候... 系统正在初始化（约 30 秒）
echo.
echo 🎯 系统功能：
echo    1️⃣  输入职位名称，生成 5 个面试问题
echo    2️⃣  输入答案，获得 AI 评分和反馈
echo    3️⃣  查看标准答案和改进建议
echo.
echo 📝 快捷提示：
echo    - 遇到问题先刷新浏览器 (F5)
echo    - 按 F12 打开开发者工具查看日志
echo    - 第一次生成问题可能需要 10-30 秒
echo    - Redis 和存储服务是可选的
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
