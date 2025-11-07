# 工作流2 save_status 修复 - PowerShell 自动执行脚本

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  工作流2 save_status='失败' 修复执行脚本" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# 步骤1: 启动Docker Desktop
Write-Host "[步骤1] 启动 Docker Desktop..." -ForegroundColor Cyan
Write-Host "检查 Docker 是否运行..." -ForegroundColor Yellow

$dockerRunning = $false
for ($i = 0; $i -lt 3; $i++) {
    try {
        $result = & docker ps 2>&1
        if ($result -notmatch "error" -and $result -notmatch "cannot") {
            $dockerRunning = $true
            break
        }
    }
    catch {
        # Docker 未运行
    }
    if ($i -lt 2) {
        Write-Host "等待 Docker 启动... ($($i+1)/2)" -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if (-not $dockerRunning) {
    Write-Host "⚠️  Docker 未运行，尝试启动 Docker Desktop..." -ForegroundColor Yellow
    if (Test-Path "C:\Program Files\Docker\Docker\Docker.exe") {
        Start-Process "C:\Program Files\Docker\Docker\Docker.exe"
        Write-Host "Docker Desktop 启动中，请等待 30-60 秒..." -ForegroundColor Yellow
        Start-Sleep -Seconds 40
    }
}

# 验证Docker
try {
    $result = & docker ps 2>&1
    Write-Host "✅ Docker 已运行" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker 仍未运行，请手动启动 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 步骤2: 启动所有容器
Write-Host ""
Write-Host "[步骤2] 启动所有容器..." -ForegroundColor Cyan
Set-Location "D:\code7\interview-system"
& docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker 容器启动成功" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker Compose 可能有问题，但继续进行..." -ForegroundColor Yellow
}

Write-Host "等待容器完全启动... (15秒)" -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 验证容器
Write-Host ""
Write-Host "容器状态:" -ForegroundColor Cyan
& docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

# 步骤3: 启动ngrok
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[步骤3] 启动 ngrok 隧道" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "请在新的 PowerShell 或 CMD 窗口中运行以下命令:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ngrok http 8080" -ForegroundColor White
Write-Host ""
Write-Host "该命令会输出类似下面的内容:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Forwarding: https://abc123xyz789.ngrok-free.dev -> http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "请记下 'abc123xyz789.ngrok-free.dev' 这部分（去掉 https://）" -ForegroundColor Yellow
Write-Host ""
$NGROK_URL = Read-Host "请输入 ngrok URL (例如: abc123xyz789.ngrok-free.dev)"

if ([string]::IsNullOrWhiteSpace($NGROK_URL)) {
    Write-Host "❌ ngrok URL 不能为空!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ 记录的 ngrok URL: https://$NGROK_URL" -ForegroundColor Green

# 步骤4: 更新Workflow2
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[步骤4] 更新 Dify 中的 workflow2 配置 (需要手动操作)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "请在 Dify 平台中执行以下操作:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 登录 Dify 平台" -ForegroundColor White
Write-Host "2. 打开 workflow2 ('AI面试官-工作流2-生成答案')" -ForegroundColor White
Write-Host "3. 编辑 '保存标准答案' 节点" -ForegroundColor White
Write-Host "4. 在 Python 代码中找到这一行 (约第 291 行):" -ForegroundColor White
Write-Host ""
Write-Host "   api_base_url = ""https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions""" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. 替换为你的新 ngrok URL:" -ForegroundColor White
Write-Host ""
Write-Host "   api_base_url = ""https://$NGROK_URL/api/sessions""" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. 点击 '保存' 或 '发布' 按钮" -ForegroundColor White
Write-Host ""
Write-Host "完成后，按 Enter 继续..." -ForegroundColor Yellow
Read-Host "按 Enter"

# 步骤5: 验证
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[步骤5] 验证配置" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "验证 Redis 连接..." -ForegroundColor Yellow
try {
    $result = & docker exec interview-redis redis-cli ping
    if ($result -eq "PONG") {
        Write-Host "✅ Redis 连接正常" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis 可能有问题" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Redis 连接失败，但继续..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "验证 ngrok 隧道连接..." -ForegroundColor Yellow
try {
    $response = & curl -s -I "https://$NGROK_URL/api/sessions" 2>&1
    if ($response -match "HTTP") {
        Write-Host "✅ ngrok 隧道可访问" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ngrok 隧道可能断开连接" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  无法验证 ngrok，但继续..." -ForegroundColor Yellow
}

# 步骤6: 运行测试
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[步骤6] 运行工作流2测试" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "正在运行测试..." -ForegroundColor Yellow
Write-Host ""

Set-Location "D:\code7\interview-system"
$testOutput = & node test-workflows-docker-prod.js 2>&1 | Out-String

Write-Host $testOutput

# 检查结果
if ($testOutput -match '"save_status":\s*"成功"') {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ 修复成功！save_status 已变为 '成功'" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
} elseif ($testOutput -match '"save_status":\s*"失败"') {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "⚠️  save_status 仍然显示 '失败'" -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "请查看故障排查步骤:" -ForegroundColor Yellow
    Write-Host "1. 检查 ngrok 隧道是否仍在运行"
    Write-Host "2. 验证 Storage Service 容器是否运行"
    Write-Host "3. 查看 Storage Service 日志"
    Write-Host ""
    Write-Host "查看详细日志:" -ForegroundColor Cyan
    Write-Host "docker logs interview-storage-service | tail -50" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  无法判断测试结果，请查看上面的输出" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "执行完成！" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green

