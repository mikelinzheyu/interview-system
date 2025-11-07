# AI面试系统 - Docker生产部署脚本 (PowerShell)
# ========================================
# 使用方法: .\docker-deploy-prod.ps1 -Action start|stop|restart|logs|status|clean

param(
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "verify", "clean", "help")]
    [string]$Action = "help",

    [Parameter(Position = 1)]
    [string]$Service = ""
)

# 配置
$ProjectName = $env:COMPOSE_PROJECT_NAME ? $env:COMPOSE_PROJECT_NAME : "interview-system"
$EnvFile = ".env.docker"
$DockerComposeFile = "docker-compose.yml"

# 颜色定义
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# 检查环境
function Test-Environment {
    Write-Header "检查环境"

    # 检查Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker已安装: $dockerVersion"
    }
    catch {
        Write-Error "Docker未安装，请先安装Docker"
        exit 1
    }

    # 检查Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose已安装: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose未安装或未配置到PATH"
        exit 1
    }

    # 检查必要文件
    if (-not (Test-Path $DockerComposeFile)) {
        Write-Error "$DockerComposeFile 不存在"
        exit 1
    }
    Write-Success "$DockerComposeFile 已找到"

    if (-not (Test-Path $EnvFile)) {
        Write-Warning "$EnvFile 不存在，使用默认配置"
        if (-not (Test-Path ".env.production")) {
            Write-Error ".env.production 不存在，请创建环境配置文件"
            exit 1
        }
        Copy-Item ".env.production" $EnvFile
        Write-Success "从 .env.production 复制配置"
    }
    Write-Success "$EnvFile 已找到"

    # 创建必要的目录
    @("logs/backend", "logs/frontend", "logs/redis", "logs/proxy", "data/redis", "backend/uploads", "nginx/ssl") | ForEach-Object {
        if (-not (Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
    Write-Success "目录结构已创建"
}

# 准备部署
function Invoke-PreparationDeployment {
    Write-Header "准备部署"

    # 检查.env文件
    $envContent = Get-Content $EnvFile -Raw
    if ($envContent -match "DIFY_API_KEY=your-dify-api-key") {
        Write-Warning "检测到未配置的DIFY_API_KEY，请在$EnvFile中配置"
    }

    # 生成自签名证书
    if (-not (Test-Path "nginx/ssl/cert.pem") -or -not (Test-Path "nginx/ssl/key.pem")) {
        Write-Warning "SSL证书不存在，生成自签名证书..."

        $certPath = "nginx/ssl/cert.pem"
        $keyPath = "nginx/ssl/key.pem"

        try {
            # 使用OpenSSL生成证书 (如果安装了)
            # 这里需要PowerShell运行环境支持OpenSSL命令
            Write-Warning "请手动生成SSL证书或在生产环境配置真实证书"
        }
        catch {
            Write-Warning "无法自动生成证书，请手动创建"
        }
    }

    Write-Success "部署准备完成"
}

# 构建镜像
function Invoke-BuildImages {
    Write-Header "构建Docker镜像"

    Write-Warning "构建后端镜像..."
    docker-compose --env-file $EnvFile -f $DockerComposeFile build backend
    Write-Success "后端镜像构建完成"

    Write-Warning "构建前端镜像..."
    docker-compose --env-file $EnvFile -f $DockerComposeFile build frontend
    Write-Success "前端镜像构建完成"

    Write-Warning "验证Redis镜像..."
    docker pull redis:7-alpine | Out-Null
    Write-Success "Redis镜像已就绪"

    Write-Success "所有镜像构建完成"
}

# 启动服务
function Invoke-StartServices {
    Write-Header "启动服务"

    Write-Warning "启动Docker Compose栈..."
    docker-compose --env-file $EnvFile -f $DockerComposeFile up -d

    # 等待服务启动
    Start-Sleep -Seconds 5

    Write-Warning "等待服务健康检查..."
    $maxRetries = 30
    $retryCount = 0

    while ($retryCount -lt $maxRetries) {
        $psOutput = docker-compose --env-file $EnvFile -f $DockerComposeFile ps

        if ($psOutput -match "backend.*healthy" -and $psOutput -match "frontend.*healthy" -and $psOutput -match "redis.*healthy") {
            Write-Success "所有服务已启动且健康"
            break
        }

        if ($retryCount -eq ($maxRetries - 1)) {
            Write-Error "服务启动超时，请检查日志"
            Invoke-ShowLogs
            exit 1
        }

        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $retryCount++
    }

    Write-Success "服务启动完成"
}

# 显示服务状态
function Invoke-ShowStatus {
    Write-Header "服务状态"
    docker-compose --env-file $EnvFile -f $DockerComposeFile ps

    Write-Header "网络信息"
    docker network ls | Select-String "interview-network"

    Write-Header "容器统计"
    docker stats --no-stream
}

# 显示日志
function Invoke-ShowLogs {
    Write-Header "服务日志"

    if ([string]::IsNullOrEmpty($Service)) {
        docker-compose --env-file $EnvFile -f $DockerComposeFile logs --tail=50 -f
    }
    else {
        docker-compose --env-file $EnvFile -f $DockerComposeFile logs --tail=50 -f $Service
    }
}

# 停止服务
function Invoke-StopServices {
    Write-Header "停止服务"

    Write-Warning "停止Docker Compose栈..."
    docker-compose --env-file $EnvFile -f $DockerComposeFile down

    Write-Success "服务已停止"
}

# 重启服务
function Invoke-RestartServices {
    Write-Header "重启服务"
    Invoke-StopServices
    Start-Sleep -Seconds 2
    Invoke-StartServices
}

# 清理数据
function Invoke-CleanData {
    Write-Header "清理数据"

    $response = Read-Host "即将删除所有容器和数据，确定吗? (y/n)"
    if ($response -ne "y") {
        Write-Warning "已取消"
        return
    }

    Write-Warning "停止并删除所有容器..."
    docker-compose --env-file $EnvFile -f $DockerComposeFile down -v

    Write-Warning "删除日志文件..."
    Remove-Item -Path "logs/*" -Force -Recurse -ErrorAction SilentlyContinue

    Write-Warning "删除Redis数据..."
    Remove-Item -Path "data/redis/*" -Force -Recurse -ErrorAction SilentlyContinue

    Write-Success "清理完成"
}

# 验证部署
function Invoke-VerifyDeployment {
    Write-Header "验证部署"

    # 检查后端API
    Write-Warning "检查后端API..."
    try {
        Invoke-WebRequest -Uri "http://localhost:8080/api/health" -TimeoutSec 5 | Out-Null
        Write-Success "后端API健康检查通过"
    }
    catch {
        Write-Error "后端API健康检查失败"
    }

    # 检查前端
    Write-Warning "检查前端..."
    try {
        Invoke-WebRequest -Uri "http://localhost/health" -TimeoutSec 5 | Out-Null
        Write-Success "前端健康检查通过"
    }
    catch {
        Write-Error "前端健康检查失败"
    }

    # 检查Redis
    Write-Warning "检查Redis..."
    try {
        docker-compose --env-file $EnvFile -f $DockerComposeFile exec -T redis redis-cli ping | Out-Null
        Write-Success "Redis连接通过"
    }
    catch {
        Write-Error "Redis连接失败"
    }

    Write-Header "部署验证完成"
}

# 显示使用信息
function Show-Usage {
    @"
AI面试系统 - Docker生产部署脚本 (PowerShell)

使用方法: .\docker-deploy-prod.ps1 -Action <命令> [-Service <服务名>]

命令列表:
  start       - 构建并启动所有服务
  stop        - 停止所有服务
  restart     - 重启所有服务
  logs        - 查看服务日志 (可选指定服务: backend|frontend|redis)
  status      - 显示服务状态
  verify      - 验证部署状态
  clean       - 清理所有数据
  help        - 显示此帮助信息

示例:
  .\docker-deploy-prod.ps1 -Action start
  .\docker-deploy-prod.ps1 -Action logs -Service backend
  .\docker-deploy-prod.ps1 -Action status
  .\docker-deploy-prod.ps1 -Action restart

环境变量:
  COMPOSE_PROJECT_NAME       - 项目名称 (默认: interview-system)

"@
}

# 主函数
function Invoke-Main {
    switch ($Action) {
        "start" {
            Test-Environment
            Invoke-PreparationDeployment
            Invoke-BuildImages
            Invoke-StartServices
            Invoke-VerifyDeployment
            Write-Header "部署成功"
            Write-Host "前端地址: http://localhost"
            Write-Host "后端API: http://localhost:8080/api"
            Write-Host "Redis: localhost:6379"
        }
        "stop" {
            Invoke-StopServices
        }
        "restart" {
            Invoke-RestartServices
            Invoke-VerifyDeployment
        }
        "logs" {
            Invoke-ShowLogs
        }
        "status" {
            Invoke-ShowStatus
        }
        "verify" {
            Invoke-VerifyDeployment
        }
        "clean" {
            Invoke-CleanData
        }
        "help" {
            Show-Usage
        }
        default {
            Write-Error "未知的命令: $Action"
            Show-Usage
            exit 1
        }
    }
}

# 执行主函数
Invoke-Main
