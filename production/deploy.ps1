# ====================================================
# AI面试系统 - Docker生产环境部署脚本 (Windows PowerShell)
# ====================================================

param(
    [switch]$Build,
    [switch]$NoBuild,
    [switch]$Down,
    [switch]$Restart
)

# 颜色输出
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查Docker和Docker Compose
function Test-Prerequisites {
    Write-Info "检查系统环境..."

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Docker未安装，请先安装Docker Desktop"
        exit 1
    }

    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "Docker Compose未安装，请确保Docker Desktop正确安装"
        exit 1
    }

    Write-Info "Docker版本: $(docker --version)"
    Write-Info "Docker Compose版本: $(docker-compose --version)"
}

# 准备Java后端源码
function Prepare-BackendJava {
    Write-Info "准备Java后端源码..."

    # 创建backend-java目录
    if (-not (Test-Path "../backend-java")) {
        New-Item -ItemType Directory -Path "../backend-java" -Force | Out-Null
        New-Item -ItemType Directory -Path "../backend-java/src/main/java" -Force | Out-Null
        New-Item -ItemType Directory -Path "../backend-java/src/main/resources" -Force | Out-Null
    }

    # 复制源码
    if (Test-Path "../backend/main/java") {
        Copy-Item -Path "../backend/main/java/*" -Destination "../backend-java/src/main/java" -Recurse -Force
        Write-Info "已复制Java源码"
    } else {
        Write-Warn "Java源码目录不存在，跳过"
    }

    if (Test-Path "../backend/main/resources") {
        Copy-Item -Path "../backend/main/resources/*" -Destination "../backend-java/src/main/resources" -Recurse -Force
        Write-Info "已复制资源文件"
    } else {
        Write-Warn "资源文件目录不存在，跳过"
    }

    # 复制Dockerfile
    if (Test-Path "../backend-java/Dockerfile") {
        Write-Info "Dockerfile已存在"
    } else {
        Write-Warn "Dockerfile不存在"
    }

    if (Test-Path "../backend-java/pom.xml") {
        Write-Info "pom.xml已存在"
    } else {
        Write-Warn "pom.xml不存在，可能导致构建失败"
    }
}

# 创建必要的目录
function New-Directories {
    Write-Info "创建必要的目录..."

    $dirs = @(
        "logs/mysql", "logs/redis", "logs/storage-api",
        "logs/backend-java", "logs/backend-node", "logs/nginx",
        "data/redis", "uploads"
    )

    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    Write-Info "目录创建完成"
}

# 检查环境变量文件
function Test-EnvFile {
    Write-Info "检查环境变量文件..."

    if (-not (Test-Path ".env.production")) {
        Write-Error-Custom ".env.production文件不存在"
        exit 1
    }

    Write-Info "环境变量文件检查通过"
}

# 构建镜像
function Build-Images {
    Write-Info "开始构建Docker镜像..."

    docker-compose -f docker-compose.production.yml build --no-cache

    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "镜像构建失败"
        exit 1
    }

    Write-Info "镜像构建完成"
}

# 启动服务
function Start-Services {
    Write-Info "启动Docker服务..."

    docker-compose -f docker-compose.production.yml up -d

    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "服务启动失败"
        exit 1
    }

    Write-Info "服务启动完成"
}

# 停止服务
function Stop-Services {
    Write-Info "停止Docker服务..."

    docker-compose -f docker-compose.production.yml down

    Write-Info "服务已停止"
}

# 重启服务
function Restart-Services {
    Write-Info "重启Docker服务..."

    docker-compose -f docker-compose.production.yml restart

    Write-Info "服务已重启"
}

# 检查服务状态
function Test-Services {
    Write-Info "检查服务状态..."

    Start-Sleep -Seconds 10

    docker-compose -f docker-compose.production.yml ps

    Write-Info "等待服务就绪..."

    $maxAttempts = 60
    $attempt = 0

    while ($attempt -lt $maxAttempts) {
        $services = docker-compose -f docker-compose.production.yml ps --format json | ConvertFrom-Json
        $healthyCount = ($services | Where-Object { $_.Health -eq "healthy" }).Count

        if ($healthyCount -ge 3) {
            Write-Info "服务已就绪"
            return
        }

        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 5
    }

    Write-Warn "部分服务可能未就绪，请检查日志"
}

# 显示服务信息
function Show-Info {
    $env = Get-Content .env.production | ConvertFrom-StringData

    Write-Host ""
    Write-Info "======================================================"
    Write-Info "AI面试系统部署完成！"
    Write-Info "======================================================"
    Write-Host ""
    Write-Info "服务访问地址："
    Write-Info "  前端服务: http://localhost:$($env.FRONTEND_PORT)"
    Write-Info "  Java后端: http://localhost:$($env.BACKEND_JAVA_PORT)"
    Write-Info "  Node后端: http://localhost:$($env.BACKEND_NODE_PORT)"
    Write-Info "  存储API:  http://localhost:$($env.STORAGE_API_PORT)"
    Write-Info "  MySQL:    localhost:$($env.MYSQL_PORT)"
    Write-Info "  Redis:    localhost:$($env.REDIS_PORT)"
    Write-Host ""
    Write-Info "查看日志命令："
    Write-Info "  docker-compose -f docker-compose.production.yml logs -f [服务名]"
    Write-Host ""
    Write-Info "停止服务命令："
    Write-Info "  .\deploy.ps1 -Down"
    Write-Host ""
    Write-Info "重启服务命令："
    Write-Info "  .\deploy.ps1 -Restart"
    Write-Info "======================================================"
}

# 主函数
function Main {
    Set-Location $PSScriptRoot

    if ($Down) {
        Stop-Services
        return
    }

    if ($Restart) {
        Restart-Services
        return
    }

    Write-Info "开始部署AI面试系统..."

    # 检查前置条件
    Test-Prerequisites

    # 检查环境变量
    Test-EnvFile

    # 准备后端代码
    Prepare-BackendJava

    # 创建目录
    New-Directories

    # 构建镜像（如果指定或首次部署）
    if ($Build -or -not $NoBuild) {
        Build-Images
    }

    # 启动服务
    Start-Services

    # 检查服务状态
    Test-Services

    # 显示信息
    Show-Info
}

# 运行主函数
Main
