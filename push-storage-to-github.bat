@echo off
REM 推送存储系统到 GitHub

echo.
echo ===================================================
echo 推送存储系统到 GitHub
echo ===================================================
echo.

cd D:\code7\interview-system

echo [1/4] 检查 Git 状态...
git status --short | head -10
echo.

echo [2/4] 检查远程仓库...
git remote -v
echo.

echo [3/4] 添加存储远程仓库...
git remote add storage https://github.com/mikelinzheyu/storage.git 2>nul
if %ERRORLEVEL% EQU 0 (
    echo.   ✓ Remote 已添加
) else (
    echo.   ! Remote 可能已存在
)
echo.

echo [4/4] 推送到 GitHub...
echo.   推送中...请稍候...
echo.
git push -u storage main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo ✅ 推送成功！
    echo ===================================================
    echo.
    echo 仓库地址: https://github.com/mikelinzheyu/storage
    echo 分支: main
    echo.
    echo 下一步:
    echo 1. 访问 GitHub 仓库验证代码
    echo 2. 添加 GitHub Secrets (Settings ^> Secrets)
    echo 3. 配置 DNS A 记录
    echo.
) else (
    echo.
    echo ===================================================
    echo ❌ 推送失败！
    echo ===================================================
    echo.
    echo 可能的原因:
    echo 1. 网络连接问题 - 请重试
    echo 2. GitHub 账户认证 - 确认已登录
    echo 3. SSH 密钥问题 - 使用 HTTPS 地址
    echo.
    echo 请尝试以下命令:
    echo   git push -u storage main
    echo.
)

pause
