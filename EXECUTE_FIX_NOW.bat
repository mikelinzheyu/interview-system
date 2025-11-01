@echo off
chcp 65001 > nul
REM 工作流2 save_status 修复执行脚本

echo.
echo ════════════════════════════════════════════════════════════════════
echo   工作流2 save_status="失败" 修复执行脚本
echo ════════════════════════════════════════════════════════════════════
echo.

REM 步骤1: 启动Docker
echo [步骤1] 启动 Docker 环境...
echo.
echo 请确保 Docker Desktop 已启动！
echo 如果 Docker Desktop 未运行，请：
echo   1. 打开 Windows 开始菜单
echo   2. 搜索 "Docker Desktop"
echo   3. 点击启动
echo.
pause

REM 验证Docker
docker ps > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行! 请先启动 Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker 已检测到并运行

REM 启动容器
echo.
echo 正在启动所有容器...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Docker Compose 启动失败!
    pause
    exit /b 1
)
echo ✅ Docker 容器启动成功

REM 等待容器启动
echo.
echo 等待容器完全启动... (15秒)
timeout /t 15 /nobreak

REM 验证容器
echo.
echo [步骤1完成] Docker 容器状态:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ════════════════════════════════════════════════════════════════════
echo [步骤2] 启动新的 ngrok 隧道
echo ════════════════════════════════════════════════════════════════════
echo.
echo 请在另一个 terminal/PowerShell 中运行以下命令:
echo.
echo   ngrok http 8080
echo.
echo 该命令会输出类似以下的内容:
echo   Forwarding: https://abc123xyz789.ngrok-free.dev ^-> http://localhost:8080
echo.
echo 请记下 "abc123xyz789.ngrok-free.dev" 这部分（去掉前缀https://）
echo.
pause

REM 获取ngrok URL
set /p NGROK_URL="请输入新的 ngrok URL (例如: abc123xyz789.ngrok-free.dev): "

if "%NGROK_URL%"=="" (
    echo ❌ ngrok URL 不能为空!
    pause
    exit /b 1
)

echo.
echo ✅ 记录的 ngrok URL: %NGROK_URL%
echo.

echo ════════════════════════════════════════════════════════════════════
echo [步骤3] 更新 workflow2 配置 (需要手动操作)
echo ════════════════════════════════════════════════════════════════════
echo.
echo 请在 Dify 中执行以下操作:
echo.
echo 1. 登录 Dify 平台
echo 2. 打开 workflow2 ("AI面试官-工作流2-生成答案")
echo 3. 找到并编辑 "保存标准答案" 节点
echo 4. 在 Python 代码中找到这一行 (约第 291 行):
echo    api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
echo.
echo 5. 替换为你的新 ngrok URL:
echo    api_base_url = "https://%NGROK_URL%/api/sessions"
echo.
echo 6. 点击 "保存" 或 "发布" 按钮
echo.
pause

REM 验证
echo.
echo ════════════════════════════════════════════════════════════════════
echo [步骤4] 验证配置
echo ════════════════════════════════════════════════════════════════════
echo.
echo 验证 Redis 连接...
docker exec interview-redis redis-cli ping
if %errorlevel% equ 0 (
    echo ✅ Redis 正常连接
) else (
    echo ⚠️  Redis 连接出现问题，但继续...
)

echo.
echo 验证 ngrok 隧道连接...
curl -I "https://%NGROK_URL%/api/sessions" 2>&1 | findstr "HTTP"
if %errorlevel% equ 0 (
    echo ✅ ngrok 隧道可访问
) else (
    echo ❌ ngrok 隧道不可访问，请检查:
    echo    - ngrok 是否仍在运行
    echo    - 网络连接是否正常
)

REM 测试
echo.
echo ════════════════════════════════════════════════════════════════════
echo [步骤5] 运行工作流2测试
echo ════════════════════════════════════════════════════════════════════
echo.
echo 正在运行工作流测试...
cd /d D:\code7\interview-system
node test-workflows-docker-prod.js 2>&1 | findstr /i "save_status\|success\|failed"

echo.
echo ════════════════════════════════════════════════════════════════════
echo 修复执行完成！
echo ════════════════════════════════════════════════════════════════════
echo.
echo 请检查上面的测试输出中 save_status 的值：
echo   ✅ "成功" - 修复成功！
echo   ❌ "失败" - 需要故障排查
echo.
pause
