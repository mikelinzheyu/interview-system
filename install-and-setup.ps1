# nginx 一键安装和设置脚本
# 使用: powershell -ExecutionPolicy Bypass -File install-and-setup.ps1

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          nginx 一键安装和配置脚本                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = [Security.Principal.WindowsWindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ 需要管理员权限！" -ForegroundColor Red
    Write-Host "请以管理员身份运行 PowerShell，然后重新运行此脚本" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ 已获得管理员权限" -ForegroundColor Green
Write-Host ""

# 第 1 步: 检查 Chocolatey
Write-Host "📋 步骤 1: 检查 Chocolatey..." -ForegroundColor Cyan
$chocoPath = $env:ProgramData + '\chocolatey\bin\choco.exe'

if (Test-Path $chocoPath) {
    Write-Host "✅ Chocolatey 已安装" -ForegroundColor Green
} else {
    Write-Host "⚠️  Chocolatey 未安装，正在安装..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    $chocoInstallScript = 'https://community.chocolatey.org/install.ps1'
    iex ((New-Object System.Net.WebClient).DownloadString($chocoInstallScript))

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Chocolatey 安装成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Chocolatey 安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 第 2 步: 安装 nginx
Write-Host "📋 步骤 2: 安装 nginx..." -ForegroundColor Cyan

if (Test-Path "C:\nginx\nginx.exe") {
    Write-Host "✅ nginx 已安装在 C:\nginx" -ForegroundColor Green
} else {
    Write-Host "正在下载和安装 nginx..." -ForegroundColor Yellow
    & $chocoPath install nginx -y

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ nginx 安装成功" -ForegroundColor Green
    } else {
        Write-Host "❌ nginx 安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 第 3 步: 验证 nginx
Write-Host "📋 步骤 3: 验证 nginx..." -ForegroundColor Cyan
if (Test-Path "C:\nginx\nginx.exe") {
    $nginxVersion = & "C:\nginx\nginx.exe" -v 2>&1
    Write-Host "✅ nginx 版本: $nginxVersion" -ForegroundColor Green
} else {
    Write-Host "❌ nginx 未找到" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 第 4 步: 复制配置文件
Write-Host "📋 步骤 4: 配置 nginx..." -ForegroundColor Cyan

$sourceConfig = "D:\code7\interview-system\nginx-windows.conf"
$destConfig = "C:\nginx\conf\nginx.conf"

if (Test-Path $sourceConfig) {
    Write-Host "正在复制配置文件..." -ForegroundColor Yellow

    # 备份原配置
    if (Test-Path $destConfig) {
        Copy-Item $destConfig "$destConfig.backup" -Force
        Write-Host "✅ 原配置已备份到 $destConfig.backup" -ForegroundColor Green
    }

    Copy-Item $sourceConfig $destConfig -Force
    Write-Host "✅ 配置文件已复制到 $destConfig" -ForegroundColor Green
} else {
    Write-Host "❌ 找不到源配置文件: $sourceConfig" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 第 5 步: 验证 nginx 配置
Write-Host "📋 步骤 5: 验证 nginx 配置..." -ForegroundColor Cyan

$testOutput = & "C:\nginx\nginx.exe" -t 2>&1
if ($testOutput -like "*is ok*") {
    Write-Host "✅ nginx 配置验证成功" -ForegroundColor Green
} else {
    Write-Host "❌ nginx 配置有问题:" -ForegroundColor Red
    Write-Host $testOutput
    exit 1
}

Write-Host ""

# 第 6 步: 启动 nginx
Write-Host "📋 步骤 6: 启动 nginx..." -ForegroundColor Cyan

# 检查 80 端口是否被占用
$portInUse = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  80 端口已被占用" -ForegroundColor Yellow
    Write-Host "正在停止占用 80 端口的进程..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.ProcessName -eq "nginx" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 启动 nginx
& "C:\nginx\nginx.exe"
Start-Sleep -Seconds 2

# 检查是否成功启动
$nginxRunning = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginxRunning) {
    Write-Host "✅ nginx 已启动" -ForegroundColor Green
    Write-Host "   进程数: $($nginxRunning.Count)" -ForegroundColor Green
} else {
    Write-Host "❌ nginx 启动失败" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 第 7 步: 测试 nginx
Write-Host "📋 步骤 7: 测试 nginx..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ nginx 健康检查成功" -ForegroundColor Green
        Write-Host "   响应: $($response.Content)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  nginx 健康检查失败: $_" -ForegroundColor Yellow
}

Write-Host ""

# 第 8 步: 启动存储服务
Write-Host "📋 步骤 8: 启动存储服务..." -ForegroundColor Cyan

$storageServicePath = "D:\code7\interview-system\mock-storage-service.js"
if (Test-Path $storageServicePath) {
    Write-Host "正在启动存储服务 (将在新窗口中打开)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command `"cd D:\code7\interview-system; node mock-storage-service.js`"" -WindowStyle Normal
    Start-Sleep -Seconds 3
    Write-Host "✅ 存储服务启动脚本已执行" -ForegroundColor Green
} else {
    Write-Host "❌ 找不到存储服务文件" -ForegroundColor Red
}

Write-Host ""

# 完成
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ 安装完成！                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 当前状态:" -ForegroundColor Cyan
Write-Host "   ✅ nginx 已安装在: C:\nginx" -ForegroundColor Green
Write-Host "   ✅ nginx 已启动: http://localhost" -ForegroundColor Green
Write-Host "   ✅ 配置文件: C:\nginx\conf\nginx.conf" -ForegroundColor Green
Write-Host "   ⏳ 存储服务: 在新窗口中启动中..." -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 下一步:" -ForegroundColor Cyan
Write-Host "   1. 等待存储服务启动完成 (应该显示 'listening on port 8080')" -ForegroundColor White
Write-Host "   2. 测试 API: curl -X POST http://localhost/api/sessions ..." -ForegroundColor White
Write-Host "   3. 更新 Dify 工作流中的 URL 为: http://localhost/api/sessions" -ForegroundColor White
Write-Host "   4. 运行: node test-workflow1-simple.js" -ForegroundColor White
Write-Host ""

Write-Host "📚 相关文档:" -ForegroundColor Cyan
Write-Host "   📖 START-NGINX-NOW.md - 完整指南" -ForegroundColor White
Write-Host "   📖 QUICK-REFERENCE.txt - 快速参考" -ForegroundColor White
Write-Host "   📖 LOCAL-NGINX-SETUP.md - 详细说明" -ForegroundColor White
Write-Host ""

Write-Host "🔧 常用命令:" -ForegroundColor Cyan
Write-Host "   重新加载配置: nginx.exe -s reload" -ForegroundColor White
Write-Host "   停止 nginx: nginx.exe -s stop" -ForegroundColor White
Write-Host "   查看错误日志: type C:\nginx\logs\error.log" -ForegroundColor White
Write-Host ""

pause
