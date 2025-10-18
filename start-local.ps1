# 本地开发 - 一键启动脚本
# 用途: 解压 nginx、配置、启动所有服务

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     本地开发环境启动脚本                                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 检查 nginx 压缩包
Write-Host "1️⃣  检查 nginx 压缩包..."
if (Test-Path "D:\code7\interview-system\nginx-1.25.4.zip") {
    Write-Host "✓ nginx-1.25.4.zip 已找到" -ForegroundColor Green
} else {
    Write-Host "✗ 找不到 nginx-1.25.4.zip" -ForegroundColor Red
    exit 1
}

# 步骤 2: 解压 nginx
Write-Host ""
Write-Host "2️⃣  解压 nginx..."
Expand-Archive -Path "D:\code7\interview-system\nginx-1.25.4.zip" -DestinationPath "C:\" -Force
Write-Host "✓ 解压完成" -ForegroundColor Green

# 步骤 3: 复制配置
Write-Host ""
Write-Host "3️⃣  配置 nginx..."
Copy-Item "D:\code7\interview-system\nginx-windows.conf" "C:\nginx\conf\nginx.conf" -Force
Write-Host "✓ 配置复制完成" -ForegroundColor Green

# 步骤 4: 验证 nginx
Write-Host ""
Write-Host "4️⃣  验证 nginx..."
cd C:\nginx
& ".\nginx.exe" -t
Write-Host "✓ nginx 验证通过" -ForegroundColor Green

# 步骤 5: 启动 nginx
Write-Host ""
Write-Host "5️⃣  启动 nginx..."
& ".\nginx.exe"
Start-Sleep -Seconds 2
Write-Host "✓ nginx 已启动" -ForegroundColor Green

# 步骤 6: 提示下一步
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✓ nginx 已启动！                               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步 (在新的 PowerShell 窗口执行):" -ForegroundColor Cyan
Write-Host ""
Write-Host "   窗口 2 - 启动存储服务:" -ForegroundColor White
Write-Host "   cd D:\code7\interview-system" -ForegroundColor White
Write-Host "   node mock-storage-service.js" -ForegroundColor White
Write-Host ""
Write-Host "   窗口 3 - 测试和开发:" -ForegroundColor White
Write-Host "   curl http://localhost/health" -ForegroundColor White
Write-Host "   node test-workflow1-simple.js" -ForegroundColor White
Write-Host ""
