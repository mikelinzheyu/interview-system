# Windows PowerShell 快速启动脚本 - 同时启动前后端

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   AI面试官系统 - 前后端启动脚本" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js 18.0.0 以上版本" -ForegroundColor Red
    Write-Host "访问: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
Write-Host ""

# 启动后端
Write-Host "🚀 启动后端服务器..." -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path "node_modules")) {
    Write-Host "   📦 安装后端依赖..." -ForegroundColor Gray
    npm install
}

# 在新的 PowerShell 窗口中启动后端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" `
    -WindowStyle Normal

Write-Host "   ✅ 后端已启动"
Write-Host ""

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端
Write-Host "🚀 启动前端服务器..." -ForegroundColor Yellow
Pop-Location
Push-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "   📦 安装前端依赖..." -ForegroundColor Gray
    npm install
}

# 在新的 PowerShell 窗口中启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" `
    -WindowStyle Normal

Write-Host "   ✅ 前端已启动"
Write-Host ""

Pop-Location

Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ 系统已启动！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Write-Host "📱 前端地址:" -ForegroundColor Cyan
Write-Host "   http://localhost:5174/" -ForegroundColor White

Write-Host ""
Write-Host "🔌 后端 API 地址:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001/api" -ForegroundColor White

Write-Host ""
Write-Host "🧪 测试页面:" -ForegroundColor Cyan
Write-Host "   http://localhost:5174/community/posts/20" -ForegroundColor White

Write-Host ""
Write-Host "📋 关闭: 直接关闭两个 PowerShell 窗口" -ForegroundColor Yellow
Write-Host ""

Read-Host "按 Enter 键退出此窗口"
