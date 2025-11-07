@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo      nginx 安装和配置脚本
echo ================================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 需要管理员权限
    echo 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo [1/6] 创建目录...
if not exist C:\nginx mkdir C:\nginx
if not exist C:\nginx\conf mkdir C:\nginx\conf
if not exist C:\nginx\logs mkdir C:\nginx\logs
echo 完成!
echo.

echo [2/6] 下载 nginx...
echo 正在下载 nginx-1.25.4.zip...
powershell -Command "^
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;^
    (New-Object System.Net.WebClient).DownloadFile('http://nginx.org/download/nginx-1.25.4.zip', 'C:\nginx.zip')^
"
if errorlevel 1 (
    echo 注: 下载可能失败，您可以手动下载 nginx 放在 C:\nginx
)
echo 完成!
echo.

echo [3/6] 解压文件...
if exist C:\nginx.zip (
    powershell -Command "Expand-Archive -Path 'C:\nginx.zip' -DestinationPath 'C:\' -Force"
    del C:\nginx.zip
)
echo 完成!
echo.

echo [4/6] 配置 nginx...
if exist D:\code7\interview-system\nginx-windows.conf (
    copy "D:\code7\interview-system\nginx-windows.conf" "C:\nginx\conf\nginx.conf" /Y
    echo 完成!
) else (
    echo 错误: 找不到配置文件
    pause
    exit /b 1
)
echo.

echo [5/6] 验证 nginx...
cd C:\nginx
nginx.exe -t
if errorlevel 1 (
    echo 验证失败!
    pause
    exit /b 1
)
echo 验证成功!
echo.

echo [6/6] 启动 nginx...
start nginx.exe
timeout /t 2 /nobreak
echo nginx 已启动!
echo.

echo ================================================
echo      安装完成!
echo ================================================
echo.
echo 下一步:
echo   1. 在新的命令行窗口启动存储服务:
echo      cd D:\code7\interview-system
echo      node mock-storage-service.js
echo.
echo   2. 测试 API:
echo      curl http://localhost/health
echo.
echo   3. 更新 Dify 工作流中的 URL
echo      http://localhost/api/sessions
echo.

pause
