# AI面试系统 - 生产环境备份脚本（Windows PowerShell版本）
# 功能：自动备份数据库、Redis缓存和用户文件
# 使用: .\backup-prod.ps1

param(
    [string]$BackupDir = "$PSScriptRoot\backups",
    [string]$RetentionDays = 30,
    [switch]$Help = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色定义
$Blue = @{ForegroundColor = "Blue"}
$Green = @{ForegroundColor = "Green"}
$Red = @{ForegroundColor = "Red"}
$Yellow = @{ForegroundColor = "Yellow"}

# 日志函数
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')]" @Blue -NoNewline
    Write-Host " $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✓" @Green -NoNewline
    Write-Host " $Message"
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ✗" @Red -NoNewline
    Write-Host " $Message"
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ⚠" @Yellow -NoNewline
    Write-Host " $Message"
}

# 显示帮助
function Show-Help {
    Write-Host @"
AI面试系统 - 生产环境备份脚本

使用方法:
    .\backup-prod.ps1 [选项]

选项:
    -BackupDir <path>    备份目录（默认: $PSScriptRoot\backups）
    -RetentionDays <num> 保留天数（默认: 30）
    -Help                显示此帮助

示例:
    .\backup-prod.ps1                                    # 使用默认配置
    .\backup-prod.ps1 -BackupDir "D:\backups" -RetentionDays 60
    .\backup-prod.ps1 -Help
"@
}

# 检查前置条件
function Check-Prerequisites {
    Write-Log "检查前置条件..."

    # 检查Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error-Log "Docker未安装"
        exit 1
    }
    Write-Success "Docker已安装"

    # 检查Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error-Log "Docker Compose未安装"
        exit 1
    }
    Write-Success "Docker Compose已安装"

    # 检查配置文件
    if (-not (Test-Path "$PSScriptRoot\.env.docker")) {
        Write-Error-Log "环境配置文件不存在: $PSScriptRoot\.env.docker"
        exit 1
    }
    Write-Success "环境配置文件存在"

    if (-not (Test-Path "$PSScriptRoot\docker-compose.yml")) {
        Write-Error-Log "Docker Compose文件不存在"
        exit 1
    }
    Write-Success "Docker Compose文件存在"
}

# 创建备份目录
function Create-BackupDir {
    Write-Log "创建备份目录..."

    $script:BackupTime = Get-Date -Format "yyyyMMdd_HHmmss"
    $script:BackupPath = Join-Path $BackupDir "backup_$BackupTime"

    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }

    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath | Out-Null
    }

    Write-Success "备份目录已创建: $BackupPath"
}

# 备份Redis数据
function Backup-Redis {
    Write-Log "备份Redis数据..."

    try {
        # 触发Redis后台保存
        & docker-compose -f "$PSScriptRoot\docker-compose.yml" `
            --env-file "$PSScriptRoot\.env.docker" `
            exec -T redis redis-cli BGSAVE | Out-Null

        Start-Sleep -Seconds 5

        # 复制RDB文件
        $rdbFile = Join-Path $PSScriptRoot "data\redis\dump.rdb"
        if (Test-Path $rdbFile) {
            Copy-Item $rdbFile "$BackupPath\" -ErrorAction SilentlyContinue
            Write-Success "Redis RDB文件已备份"
        } else {
            Write-Warning-Log "Redis RDB文件不存在"
        }

        # 备份AOF文件
        $aofFile = Join-Path $PSScriptRoot "data\redis\appendonly.aof"
        if (Test-Path $aofFile) {
            Copy-Item $aofFile "$BackupPath\" -ErrorAction SilentlyContinue
            Write-Success "Redis AOF文件已备份"
        }
    } catch {
        Write-Warning-Log "Redis备份失败: $_"
    }
}

# 备份用户上传文件
function Backup-Uploads {
    Write-Log "备份用户上传文件..."

    try {
        $uploadsDir = Join-Path $PSScriptRoot "backend\uploads"
        if (Test-Path $uploadsDir) {
            $targetDir = Join-Path $BackupPath "uploads"
            New-Item -ItemType Directory -Path $targetDir -ErrorAction SilentlyContinue | Out-Null
            Copy-Item -Path "$uploadsDir\*" -Destination $targetDir -Recurse -ErrorAction SilentlyContinue
            Write-Success "用户上传文件已备份"
        } else {
            Write-Warning-Log "上传文件目录不存在"
        }
    } catch {
        Write-Warning-Log "上传文件备份失败: $_"
    }
}

# 备份应用配置
function Backup-Config {
    Write-Log "备份应用配置..."

    try {
        $configDir = Join-Path $BackupPath "config"
        New-Item -ItemType Directory -Path $configDir -ErrorAction SilentlyContinue | Out-Null

        # 备份docker-compose
        Copy-Item "$PSScriptRoot\docker-compose.yml" "$configDir\" -ErrorAction SilentlyContinue

        # 备份环境配置
        Copy-Item "$PSScriptRoot\.env.docker" "$configDir\.env.docker.backup" -ErrorAction SilentlyContinue

        # 备份nginx配置
        $nginxDir = Join-Path $PSScriptRoot "nginx"
        if (Test-Path $nginxDir) {
            Copy-Item -Path $nginxDir -Destination "$configDir\nginx" -Recurse -ErrorAction SilentlyContinue
        }

        Write-Success "应用配置已备份"
    } catch {
        Write-Warning-Log "配置备份失败: $_"
    }
}

# 备份日志
function Backup-Logs {
    Write-Log "备份应用日志..."

    try {
        $logsDir = Join-Path $PSScriptRoot "logs"
        if (Test-Path $logsDir) {
            $targetDir = Join-Path $BackupPath "logs"
            Copy-Item -Path $logsDir -Destination $targetDir -Recurse -ErrorAction SilentlyContinue
            Write-Success "应用日志已备份"
        } else {
            Write-Warning-Log "日志目录不存在"
        }
    } catch {
        Write-Warning-Log "日志备份失败: $_"
    }
}

# 创建备份清单
function Create-Manifest {
    Write-Log "创建备份清单..."

    try {
        $manifestPath = Join-Path $BackupPath "MANIFEST.txt"
        $manifest = @"
备份信息
========

备份时间: $(Get-Date)
备份位置: $BackupPath
系统版本: $(Get-Date -Format 'yyyyMMdd')

包含文件:
$(Get-ChildItem -Path $BackupPath -Recurse -File | ForEach-Object { "$($_.FullName) ($($_.Length) bytes)" })
"@
        Set-Content -Path $manifestPath -Value $manifest
        Write-Success "备份清单已生成"
    } catch {
        Write-Warning-Log "清单创建失败: $_"
    }
}

# 压缩备份
function Compress-Backup {
    Write-Log "压缩备份文件..."

    try {
        $compressedFile = "$BackupPath.zip"

        # 使用7-Zip (如果安装了)
        if (Get-Command 7z -ErrorAction SilentlyContinue) {
            & 7z a -tzip $compressedFile "$BackupPath" | Out-Null
        } else {
            # 使用内置的PowerShell压缩
            [System.IO.Compression.ZipFile]::CreateFromDirectory($BackupPath, $compressedFile)
        }

        $fileSize = (Get-Item $compressedFile).Length / 1MB
        Write-Success "备份已压缩: $(Split-Path $compressedFile -Leaf) ($([math]::Round($fileSize, 2)) MB)"

        # 删除未压缩的目录（节省空间）
        # Remove-Item -Path $BackupPath -Recurse -ErrorAction SilentlyContinue
    } catch {
        Write-Warning-Log "压缩失败: $_"
    }
}

# 清理过期备份
function Cleanup-OldBackups {
    Write-Log "清理过期备份（保留${RetentionDays}天）..."

    try {
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        Get-ChildItem -Path $BackupDir -Filter "backup_*" -File |
            Where-Object { $_.LastWriteTime -lt $cutoffDate } |
            Remove-Item -Force

        $count = (Get-ChildItem -Path $BackupDir -Filter "backup_*" -File | Measure-Object).Count
        Write-Success "备份清理完成，当前保留${count}个备份"
    } catch {
        Write-Warning-Log "清理备份失败: $_"
    }
}

# 显示备份统计
function Show-BackupStats {
    Write-Host ""
    Write-Host "========================================" @Green
    Write-Host "备份完成！" @Green
    Write-Host "========================================" @Green
    Write-Host ""
    Write-Host "备份统计:"
    Write-Host "  备份位置: $BackupPath"
    Write-Host "  压缩文件: backup_$BackupTime.zip"

    $compressedFile = "$BackupPath.zip"
    if (Test-Path $compressedFile) {
        $fileSize = (Get-Item $compressedFile).Length / 1MB
        Write-Host "  备份大小: $([math]::Round($fileSize, 2)) MB"
    }

    Write-Host "  包含内容:"
    Write-Host "    - Redis数据库"
    Write-Host "    - 用户上传文件"
    Write-Host "    - 应用配置"
    Write-Host "    - 应用日志"
    Write-Host ""
    Write-Host "保留策略: ${RetentionDays}天"
    Write-Host ""
    Write-Host "所有备份:"
    Get-ChildItem -Path $BackupDir -Filter "backup_*" -File |
        ForEach-Object { Write-Host "  $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)" }
    Write-Host ""
}

# 主函数
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════╗" @Blue
    Write-Host "║   AI面试系统 - 生产环境备份脚本        ║" @Blue
    Write-Host "╚════════════════════════════════════════╝" @Blue
    Write-Host ""

    if ($Help) {
        Show-Help
        return
    }

    try {
        Check-Prerequisites
        Create-BackupDir
        Backup-Redis
        Backup-Uploads
        Backup-Config
        Backup-Logs
        Create-Manifest
        Compress-Backup
        Cleanup-OldBackups
        Show-BackupStats

        Write-Success "备份流程已完成"
    } catch {
        Write-Error-Log "备份发生错误: $_"
        exit 1
    }
}

# 执行主函数
Main
