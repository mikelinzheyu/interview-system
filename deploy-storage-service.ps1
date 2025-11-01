# ==========================================
# Storage Service 部署脚本 (PowerShell)
# Interview System - Production Deployment
# ==========================================

param(
    [ValidateSet("build", "start", "stop", "restart", "logs", "status", "health", "rebuild")]
    [string]$Action = "start",

    [switch]$Force = $false,
    [switch]$Verbose = $false
)

# 颜色定义
$colors = @{
    "Success" = "Green"
    "Error"   = "Red"
    "Warning" = "Yellow"
    "Info"    = "Cyan"
}

function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $colors[$Level]
}

function Invoke-Command {
    param([string]$Command, [string]$Description)
    Write-Log $Description "Info"
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Log "命令失败: $Command" "Error"
        return $false
    }
    return $true
}

function Create-Directories {
    Write-Log "创建必要的目录..." "Info"

    $dirs = @("logs/storage", "data/storage", "logs/backend", "logs/frontend", "logs/redis")

    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "创建目录: $dir" "Success"
        }
    }
}

function Build-Images {
    Write-Log "开始构建 Docker 镜像..." "Info"

    $buildCmd = "docker-compose -f docker-compose.yml build"
    if ($Force) {
        $buildCmd += " --no-cache"
    }

    if (Invoke-Command $buildCmd "构建镜像...") {
        Write-Log "镜像构建成功" "Success"
        return $true
    } else {
        Write-Log "镜像构建失败" "Error"
        return $false
    }
}

function Start-Services {
    Write-Log "启动 Docker 容器..." "Info"

    if (Invoke-Command "docker-compose -f docker-compose.yml up -d" "启动容器...") {
        Write-Log "容器启动成功" "Success"
        Start-Sleep -Seconds 5
        return $true
    } else {
        Write-Log "容器启动失败" "Error"
        return $false
    }
}

function Stop-Services {
    Write-Log "停止 Docker 容器..." "Info"

    if (Invoke-Command "docker-compose -f docker-compose.yml down" "停止容器...") {
        Write-Log "容器停止成功" "Success"
        return $true
    } else {
        Write-Log "容器停止失败" "Error"
        return $false
    }
}

function Restart-Services {
    Write-Log "重启服务..." "Info"

    if ((Stop-Services) -and (Start-Services)) {
        Write-Log "服务重启成功" "Success"
        return $true
    } else {
        Write-Log "服务重启失败" "Error"
        return $false
    }
}

function Show-Logs {
    Write-Log "显示 Storage Service 日志..." "Info"
    docker-compose -f docker-compose.yml logs -f storage-service
}

function Show-Status {
    Write-Log "检查容器状态..." "Info"
    Write-Host ""
    docker-compose -f docker-compose.yml ps
    Write-Host ""
}

function Health-Check {
    Write-Log "执行健康检查..." "Info"
    Write-Host ""

    # 检查 Storage Service
    Write-Log "检查 Storage Service 健康状态..." "Info"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8081/api/sessions" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Log "Storage Service 正常运行 ✓" "Success"
        } else {
            Write-Log "Storage Service 返回状态码: $($response.StatusCode)" "Warning"
        }
    } catch {
        Write-Log "无法连接 Storage Service: $_" "Error"
    }

    # 检查 Redis
    Write-Log "检查 Redis 连接..." "Info"
    try {
        $redisCheck = docker exec interview-redis redis-cli ping 2>$null
        if ($redisCheck -eq "PONG") {
            Write-Log "Redis 正常运行 ✓" "Success"
        } else {
            Write-Log "Redis 连接失败" "Error"
        }
    } catch {
        Write-Log "无法连接 Redis: $_" "Error"
    }

    # 检查 Backend
    Write-Log "检查 Backend 健康状态..." "Info"
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -ErrorAction SilentlyContinue
        if ($backendResponse.StatusCode -eq 200) {
            Write-Log "Backend 正常运行 ✓" "Success"
        } else {
            Write-Log "Backend 返回状态码: $($backendResponse.StatusCode)" "Warning"
        }
    } catch {
        Write-Log "无法连接 Backend" "Warning"
    }

    Write-Host ""
    Write-Log "健康检查完成" "Info"
}

function Show-Summary {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Interview System - Storage Service" -ForegroundColor Cyan
    Write-Host "  生产环境部署" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "服务信息:" -ForegroundColor Yellow
    Write-Host "  Storage Service: http://localhost:8081/api/sessions" -ForegroundColor White
    Write-Host "  Backend API:     http://localhost:8080" -ForegroundColor White
    Write-Host "  Frontend:        http://localhost" -ForegroundColor White
    Write-Host "  Redis:           localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "常用命令:" -ForegroundColor Yellow
    Write-Host "  .\deploy-storage-service.ps1 -Action logs     # 查看日志" -ForegroundColor White
    Write-Host "  .\deploy-storage-service.ps1 -Action status   # 查看状态" -ForegroundColor White
    Write-Host "  .\deploy-storage-service.ps1 -Action health   # 健康检查" -ForegroundColor White
    Write-Host "  .\deploy-storage-service.ps1 -Action restart  # 重启服务" -ForegroundColor White
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
}

# 检查 Docker
Write-Log "检查 Docker 环境..." "Info"
try {
    $dockerVersion = docker --version
    Write-Log "找到 Docker: $dockerVersion" "Success"
} catch {
    Write-Log "Docker 未安装或不在 PATH 中" "Error"
    exit 1
}

# 执行对应操作
Write-Log "执行操作: $Action" "Info"

switch ($Action) {
    "build" {
        Create-Directories
        if (Build-Images) {
            Write-Log "构建完成" "Success"
            Show-Summary
        }
    }
    "start" {
        Create-Directories
        Build-Images
        Start-Services
        Show-Summary
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
        Show-Summary
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "health" {
        Health-Check
    }
    "rebuild" {
        Create-Directories
        Stop-Services
        Build-Images -Force $true
        Start-Services
        Show-Summary
    }
    default {
        Write-Log "未知操作: $Action" "Error"
        Write-Host "用法: .\deploy-storage-service.ps1 -Action {build|start|stop|restart|logs|status|health|rebuild}"
        exit 1
    }
}

exit 0
