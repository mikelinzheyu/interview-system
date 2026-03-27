# AI 面试系统 - Docker 部署脚本 (Windows PowerShell)
# ================================================
# 用法: .\deploy-docker.ps1

# 需要管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "请以管理员权限运行此脚本" -ForegroundColor Red
    exit 1
}

# 颜色定义
$Header = "Cyan"
$Success = "Green"
$Error = "Red"
$Warning = "Yellow"
$Info = "Blue"

function Print-Header {
    param([string]$Message)
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor $Header
    Write-Host "║ $Message" -ForegroundColor $Header
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor $Header
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Success
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Error
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Warning
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Info
}

# ================================================
# 开始部署
# ================================================

Print-Header "AI 面试系统 - Docker 部署启动"
Write-Host ""

# 1. 检查前置条件
Print-Info "检查前置条件..."

# 检查 Docker
$dockerPath = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerPath) {
    Print-Error "Docker 未安装。请先安装 Docker Desktop"
    Write-Host "下载地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    exit 1
}

Print-Success "Docker 已安装"
$dockerVersion = docker --version
Print-Info "Docker 版本: $dockerVersion"

# 检查 Docker Compose
$composeExists = $false
try {
    $composeVersion = docker-compose --version 2>$null
    $composeExists = $true
} catch {
    Print-Warning "Docker Compose 检查失败，但 Docker CLI 可能已包含"
    $composeExists = $true
}

if ($composeExists) {
    Print-Success "Docker Compose 已可用"
}

# 2. 检查 Docker daemon 是否运行
Print-Info "检查 Docker daemon 状态..."

$dockerRunning = $false
try {
    docker ps >$null 2>&1
    $dockerRunning = $true
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Print-Error "Docker daemon 未运行"
    Print-Info "正在尝试启动 Docker Desktop..."

    # 启动 Docker Desktop
    $dockerExePath = "C:\Program Files\Docker\Docker\Docker.exe"
    if (Test-Path $dockerExePath) {
        & $dockerExePath
        Print-Warning "Docker Desktop 正在启动，请等待 1-2 分钟..."
        Start-Sleep -Seconds 60

        # 再次检查
        try {
            docker ps >$null 2>&1
            Print-Success "Docker daemon 已启动"
        } catch {
            Print-Error "Docker daemon 启动失败，请手动启动 Docker Desktop"
            exit 1
        }
    } else {
        Print-Error "找不到 Docker Desktop"
        exit 1
    }
} else {
    Print-Success "Docker daemon 正在运行"
}

Write-Host ""

# 3. 创建必要的目录
Print-Info "创建必要的目录..."
$dirs = @(
    "logs\db",
    "logs\nginx",
    "backend\logs",
    "backend\uploads",
    "frontend\logs"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Print-Success "目录创建完成"

# 4. 检查文件是否存在
if (-not (Test-Path "docker-compose.local.yml")) {
    Print-Error "docker-compose.local.yml 文件不存在"
    exit 1
}
Print-Success "docker-compose.local.yml 文件已找到"

if (-not (Test-Path "backend\Dockerfile.prod")) {
    Print-Error "backend\Dockerfile.prod 文件不存在"
    exit 1
}

if (-not (Test-Path "frontend\Dockerfile.prod")) {
    Print-Error "frontend\Dockerfile.prod 文件不存在"
    exit 1
}
Print-Success "Dockerfile 文件已找到"

Write-Host ""

# 5. 构建和启动容器
Print-Header "开始构建 Docker 镜像并启动容器"

Print-Info "这可能需要 5-10 分钟，请耐心等待..."
Write-Host ""

try {
    docker-compose -f docker-compose.local.yml up -d
    Print-Success "容器启动命令已执行"
} catch {
    Print-Error "容器启动失败: $_"
    exit 1
}

Write-Host ""
Print-Info "等待容器完全启动 (30 秒)..."
Start-Sleep -Seconds 30

# 6. 检查容器状态
Print-Header "检查容器状态"
Write-Host ""
docker-compose -f docker-compose.local.yml ps
Write-Host ""

# 7. 检查服务健康状态
Print-Header "检查服务健康状态"

Print-Info "检查后端 API..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response) {
        Print-Success "后端 API 运行正常"
    }
} catch {
    Print-Warning "后端 API 还未就绪，可能需要更多时间启动"
}

Print-Info "检查前端..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Print-Success "前端运行正常"
    }
} catch {
    Print-Warning "前端还未就绪，可能需要更多时间启动"
}

Print-Info "检查数据库..."
try {
    docker exec interview-db pg_isready -U admin 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "数据库运行正常"
    }
} catch {
    Print-Warning "数据库还未就绪"
}

Print-Info "检查 Redis..."
try {
    docker exec interview-redis redis-cli ping 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Redis 运行正常"
    }
} catch {
    Print-Warning "Redis 还未就绪"
}

Write-Host ""

# 8. 显示访问信息
Print-Header "部署完成！"

Write-Host ""
Write-Host "✨ 所有服务已启动" -ForegroundColor Green
Write-Host ""
Write-Host "📱 访问应用:" -ForegroundColor Cyan
Write-Host "   前端 UI:     http://localhost:8080" -ForegroundColor Green
Write-Host "   后端 API:    http://localhost:3001/api" -ForegroundColor Green
Write-Host ""
Write-Host "📊 数据库访问:" -ForegroundColor Cyan
Write-Host "   PostgreSQL:  localhost:5432 (用户: admin)"
Write-Host "   Redis:       localhost:6379"
Write-Host ""
Write-Host "🔧 常用命令:" -ForegroundColor Cyan
Write-Host "   查看日志:     " -NoNewline; Write-Host "docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor Blue
Write-Host "   查看状态:     " -NoNewline; Write-Host "docker-compose -f docker-compose.local.yml ps" -ForegroundColor Blue
Write-Host "   重启服务:     " -NoNewline; Write-Host "docker-compose -f docker-compose.local.yml restart" -ForegroundColor Blue
Write-Host "   停止服务:     " -NoNewline; Write-Host "docker-compose -f docker-compose.local.yml stop" -ForegroundColor Blue
Write-Host "   删除容器:     " -NoNewline; Write-Host "docker-compose -f docker-compose.local.yml down" -ForegroundColor Blue
Write-Host ""
Write-Host "📚 更多信息: 查看 DOCKER_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""

# 9. 显示建议
Print-Header "部署建议"

$computerMemory = (Get-ComputerInfo).OsSystemMemoryInMegabytes / 1024
Print-Info "系统内存: $([math]::Round($computerMemory, 2)) GB"

if ($computerMemory -lt 8) {
    Print-Warning "内存不足 8GB，可能影响性能"
}

Print-Success "部署流程完成！"
Print-Info "建议等待 30-60 秒让所有服务完全初始化"
Print-Info "然后在浏览器中访问 http://localhost:8080"

Write-Host ""
Write-Host "如有问题，请查看 DOCKER_DEPLOYMENT_GUIDE.md 的故障排查部分" -ForegroundColor Yellow
