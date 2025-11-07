@echo off
REM nginx Windows 自动安装脚本
REM 检查是否有管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo           nginx Windows 安装脚本
echo ====================================================================
echo.

REM 检查 Chocolatey 是否安装
where choco >nul 2>&1
if %errorLevel% equ 0 (
    echo [✓] Chocolatey 已安装
    echo.
    echo 开始安装 nginx...
    choco install nginx -y
    if %errorLevel% equ 0 (
        echo [✓] nginx 安装成功！
    ) else (
        echo [✗] nginx 安装失败
        pause
        exit /b 1
    )
) else (
    echo [!] Chocolatey 未安装
    echo.
    echo 方法 1: 自动安装 Chocolatey (需要 PowerShell)
    echo ────────────────────────────────────────
    echo powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072); iex (New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1')"
    echo.
    echo 方法 2: 手动安装 nginx
    echo ────────────────────────────────────────
    echo 1. 下载: http://nginx.org/en/download.html
    echo 2. 解压到: C:\nginx
    echo 3. 双击此脚本继续配置
    echo.
    pause
    exit /b 1
)

REM 验证安装
if exist "C:\nginx\nginx.exe" (
    echo.
    echo [✓] nginx 已安装到 C:\nginx
    echo.
) else (
    echo [✗] nginx 未找到在 C:\nginx
    echo    请检查安装
    pause
    exit /b 1
)

REM 显示下一步步骤
echo ====================================================================
echo           下一步: 配置 nginx
echo ====================================================================
echo.
echo 1. 配置文件位置: C:\nginx\conf\nginx.conf
echo.
echo 2. 复制以下内容到 nginx.conf:
echo    (参考文件: nginx-windows.conf)
echo.
echo 3. 启动 nginx:
echo    cd C:\nginx
echo    nginx.exe
echo.
echo 4. 验证运行:
echo    curl http://localhost/health
echo.
echo ====================================================================
echo.

pause
