# AI面试官系统 - PowerShell启动脚本
# 需要以管理员身份运行

# 设置编码和颜色
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Logo {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                ║" -ForegroundColor Cyan
    Write-Host "║             AI 面试官系统 - PowerShell 启动脚本                 ║" -ForegroundColor Cyan
    Write-Host "║                                                                ║" -ForegroundColor Cyan
    Write-Host "║                   系统启动中...                                ║" -ForegroundColor Cyan
    Write-Host "║                                                                ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Port {
    param([int]$Port, [string]$Service)

    $process = netstat -ano 2>$null | Select-String ":$Port" | Select-String "LISTENING"

    if ($process) {
        Write-Host "✅ $Service 已运行 (Port $Port)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Service 未运行 (Port $Port)" -ForegroundColor Yellow
        return $false
    }
}

# 清屏
Clear-Host

# 显示logo
Write-Logo

# 步骤1: 检查后端
Write-Host "[1/5] 检查后端服务..." -ForegroundColor Yellow
$backendRunning = Check-Port 3001 "后端服务"

if (-not $backendRunning) {
    Write-Host "      ⏳ 启动后端服务..." -ForegroundColor Cyan
    Start-Process -FilePath "C:\Program Files\nodejs\node.exe" `
                  -ArgumentList "D:\code7\interview-system\backend\mock-server.js" `
                  -WindowStyle Minimized `
                  -NoNewWindow
    Write-Host "      ⏳ 等待后端启动..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Write-Host "      ✅ 后端服务已启动" -ForegroundColor Green
}

Write-Host ""

# 步骤2: 启动前端
Write-Host "[2/5] 启动前端服务..." -ForegroundColor Yellow
Write-Host "      ⏳ 启动 Vue.js 开发服务器..." -ForegroundColor Cyan

$npmPath = "C:\Program Files\nodejs\npm.cmd"
$workingDir = "D:\code7\interview-system\frontend"

Start-Process -FilePath $npmPath `
              -ArgumentList "run dev" `
              -WorkingDirectory $workingDir `
              -WindowStyle Minimized

Write-Host "      ✅ 前端服务已启动" -ForegroundColor Green

Write-Host ""

# 步骤3: 等待初始化
Write-Host "[3/5] 等待服务初始化..." -ForegroundColor Yellow
for ($i = 5; $i -gt 0; $i--) {
    Write-Host "      ⏳ 等待中... $i 秒" -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}

Write-Host ""

# 步骤4: 验证服务
Write-Host "[4/5] 验证服务状态..." -ForegroundColor Yellow
$backendOk = Check-Port 3001 "后端服务"

Write-Host ""

# 步骤5: 打开浏览器
Write-Host "[5/5] 打开浏览器..." -ForegroundColor Yellow
Write-Host "      ⏳ 正在打开 http://localhost:5173" -ForegroundColor Cyan

Start-Process "http://localhost:5173"

Write-Host "      ✅ 浏览器已打开" -ForegroundColor Green

Write-Host ""

# 显示启动完成信息
Clear-Host
Write-Logo

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ 系统启动成功！                             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "📍 访问地址：" -ForegroundColor Cyan
Write-Host "   前端: " -ForegroundColor White -NoNewLine
Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "   后端: " -ForegroundColor White -NoNewLine
Write-Host "http://localhost:3001/api/health" -ForegroundColor Green

Write-Host ""
Write-Host "⏳ 系统初始化中..." -ForegroundColor Yellow
Write-Host "   首次加载可能需要 30-60 秒，请耐心等待" -ForegroundColor White

Write-Host ""
Write-Host "🎯 使用步骤：" -ForegroundColor Cyan
Write-Host "   1️⃣  在页面中输入职位名称（如：Python后端开发工程师）" -ForegroundColor White
Write-Host "   2️⃣  点击 '生成问题' 按钮" -ForegroundColor White
Write-Host "   3️⃣  查看生成的 5 个面试问题" -ForegroundColor White
Write-Host "   4️⃣  选择一个问题，输入你的答案" -ForegroundColor White
Write-Host "   5️⃣  点击 '提交并评分' 获取 AI 评价" -ForegroundColor White

Write-Host ""
Write-Host "📝 快捷提示：" -ForegroundColor Cyan
Write-Host "   • 按 F12 打开浏览器开发者工具查看详细日志" -ForegroundColor White
Write-Host "   • 如果页面无响应，按 F5 刷新" -ForegroundColor White
Write-Host "   • 查看 STARTUP_GUIDE.txt 获得更多帮助" -ForegroundColor White
Write-Host "   • 第一次请求会比较慢（10-30秒），这是正常的" -ForegroundColor White

Write-Host ""
Write-Host "⚙️  运行的服务：" -ForegroundColor Cyan
Write-Host "   • 后端 Mock Server (Node.js) - Port 3001" -ForegroundColor White
Write-Host "   • 前端 Vite Dev Server (Vue.js) - Port 5173" -ForegroundColor White
Write-Host "   • Dify Cloud API - api.dify.ai" -ForegroundColor White
Write-Host "   • ngrok 隧道 - 可选" -ForegroundColor Gray
Write-Host "   • Redis - 可选" -ForegroundColor Gray

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host ""
Write-Host "此窗口可以关闭，后台服务将继续运行。" -ForegroundColor Yellow
Write-Host "系统已准备好，祝您使用愉快！🎉" -ForegroundColor Green

Write-Host ""
