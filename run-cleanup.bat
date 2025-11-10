@echo off
REM 一键清理部署目录脚本 (Windows 版本)
REM 使用 Git Bash 连接到服务器并清理
REM 需要安装 Git for Windows

setlocal enabledelayedexpansion

REM 配置
set "SERVER_IP=47.76.110.106"
set "SERVER_USER=root"
set "SERVER_PORT=22"
set "DEPLOY_PATH=/opt/interview-system"

echo.
echo =======================================
echo 🚀 开始执行服务器清理
echo =======================================
echo.
echo 📍 服务器信息:
echo    IP: %SERVER_IP%
echo    用户: %SERVER_USER%
echo    端口: %SERVER_PORT%
echo    清理目录: %DEPLOY_PATH%
echo.

REM 检查 SSH 连接
echo ⏳ 检查 SSH 连接...
ssh -p %SERVER_PORT% %SERVER_USER%@%SERVER_IP% "echo SSH连接成功" >nul 2>&1
if errorlevel 1 (
  echo ❌ SSH 连接失败！
  echo.
  echo 请确保:
  echo   1. 服务器 IP 正确（当前：%SERVER_IP%）
  echo   2. SSH 密钥已配置
  echo   3. 网络连接正常
  echo.
  pause
  exit /b 1
)
echo ✅ SSH 连接成功
echo.

REM 远程执行清理命令
echo 🛑 在服务器上执行清理...
echo.

ssh -p %SERVER_PORT% %SERVER_USER%@%SERVER_IP% ^
  "cd /opt/interview-system 2>/dev/null || { echo '⚠️  目录不存在'; exit 0; }; " ^
  "echo '🛑 停止现有容器...'; " ^
  "docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || echo '⚠️  docker-compose 失败'; " ^
  "echo '✅ 容器已停止'; " ^
  "cd /opt; " ^
  "echo '🗑️  删除旧部署目录...'; " ^
  "rm -rf interview-system; " ^
  "echo '✅ 旧目录已删除'; "

if errorlevel 1 (
  echo.
  echo ❌ 清理失败，请检查错误信息
  echo.
  pause
  exit /b 1
)

echo.
echo =======================================
echo ✅ 清理成功！
echo =======================================
echo.
echo 📋 后续步骤:
echo   1. 打开 GitHub Actions: https://github.com/mikelinzheyu/interview-system/actions
echo   2. 找到最新失败的工作流
echo   3. 点击 'Re-run all jobs' 重新部署
echo   4. 等待部署完成
echo.
echo ⏱️  部署通常需要 5-10 分钟
echo.
pause
