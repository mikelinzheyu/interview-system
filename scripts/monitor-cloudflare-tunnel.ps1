# Cloudflare Tunnel 健康监控脚本
# ====================================
#
# 用途: 持续监控 Cloudflare Tunnel 的健康状态
#
# 使用方法:
#   .\scripts\monitor-cloudflare-tunnel.ps1 -TunnelURL "https://storage-api.yourdomain.com"
#
# 后台运行:
#   Start-Process powershell -ArgumentList "-File .\scripts\monitor-cloudflare-tunnel.ps1 -TunnelURL https://storage-api.yourdomain.com" -WindowStyle Hidden
#

param(
    [Parameter(Mandatory=$true)]
    [string]$TunnelURL,

    [Parameter(Mandatory=$false)]
    [int]$CheckInterval = 60,  # 检查间隔 (秒)

    [Parameter(Mandatory=$false)]
    [string]$LogFile = "D:\code7\interview-system\logs\tunnel\health-check.log",

    [Parameter(Mandatory=$false)]
    [string]$APIKey = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",

    [Parameter(Mandatory=$false)]
    [switch]$SendAlert = $false,

    [Parameter(Mandatory=$false)]
    [string]$AlertEmail = ""
)

# ============ 配置 ============

$ErrorActionPreference = "SilentlyContinue"

# 确保日志目录存在
$logDir = Split-Path -Path $LogFile -Parent
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# ============ 函数定义 ============

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"

    # 控制台输出
    Write-Host $logMessage -ForegroundColor $Color

    # 写入日志文件
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-TunnelHealth {
    param([string]$URL)

    try {
        $response = Invoke-WebRequest -Uri "$URL/api/sessions" `
                                       -Method GET `
                                       -Headers @{
                                           "Authorization" = "Bearer $APIKey"
                                       } `
                                       -TimeoutSec 10 `
                                       -UseBasicParsing `
                                       -ErrorAction Stop

        return @{
            Status = "Healthy"
            StatusCode = $response.StatusCode
            StatusDescription = $response.StatusDescription
            ResponseTime = $null
            Timestamp = Get-Date
        }
    } catch {
        return @{
            Status = "Unhealthy"
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
            Timestamp = Get-Date
        }
    }
}

function Test-TunnelLatency {
    param([string]$URL)

    $start = Get-Date

    try {
        $response = Invoke-WebRequest -Uri "$URL/api/sessions" `
                                       -Method GET `
                                       -Headers @{"Authorization" = "Bearer $APIKey"} `
                                       -TimeoutSec 10 `
                                       -UseBasicParsing `
                                       -ErrorAction Stop

        $latency = ((Get-Date) - $start).TotalMilliseconds

        return @{
            Success = $true
            Latency = $latency
            StatusCode = $response.StatusCode
        }
    } catch {
        return @{
            Success = $false
            Latency = ((Get-Date) - $start).TotalMilliseconds
            Error = $_.Exception.Message
        }
    }
}

function Send-AlertEmail {
    param(
        [string]$Subject,
        [string]$Body,
        [string]$To
    )

    if (-not $SendAlert -or [string]::IsNullOrEmpty($To)) {
        return
    }

    try {
        # 配置你的 SMTP 设置
        $smtpServer = "smtp.gmail.com"  # 修改为你的 SMTP 服务器
        $smtpPort = 587
        $smtpUser = "your-email@gmail.com"  # 修改为你的邮箱
        $smtpPassword = "your-password"  # 修改为你的密码

        $credential = New-Object System.Management.Automation.PSCredential($smtpUser, (ConvertTo-SecureString $smtpPassword -AsPlainText -Force))

        Send-MailMessage -From $smtpUser `
                         -To $To `
                         -Subject $Subject `
                         -Body $Body `
                         -SmtpServer $smtpServer `
                         -Port $smtpPort `
                         -UseSsl `
                         -Credential $credential

        Write-ColorOutput "📧 已发送告警邮件到 $To" "Yellow"
    } catch {
        Write-ColorOutput "❌ 发送告警邮件失败: $($_.Exception.Message)" "Red"
    }
}

function Get-TunnelMetrics {
    try {
        # 尝试从 Cloudflare Tunnel 指标端点获取数据
        $response = Invoke-WebRequest -Uri "http://localhost:8090/metrics" `
                                       -TimeoutSec 5 `
                                       -UseBasicParsing

        return $response.Content
    } catch {
        return $null
    }
}

# ============ 主监控循环 ============

Write-ColorOutput "🔍 Cloudflare Tunnel 健康监控已启动" "Cyan"
Write-ColorOutput "═" * 60 "Gray"
Write-ColorOutput "URL: $TunnelURL" "White"
Write-ColorOutput "检查间隔: ${CheckInterval}秒" "White"
Write-ColorOutput "日志文件: $LogFile" "White"
Write-ColorOutput "═" * 60 "Gray"
Write-ColorOutput "" "White"

$consecutiveFailures = 0
$totalChecks = 0
$totalFailures = 0
$latencies = @()

while ($true) {
    $totalChecks++

    # 健康检查
    $health = Test-TunnelHealth -URL $TunnelURL

    if ($health.Status -eq "Healthy") {
        # 测量延迟
        $latencyTest = Test-TunnelLatency -URL $TunnelURL

        if ($latencyTest.Success) {
            $latencies += $latencyTest.Latency

            # 只保留最近100次的延迟数据
            if ($latencies.Count -gt 100) {
                $latencies = $latencies[-100..-1]
            }

            $avgLatency = ($latencies | Measure-Object -Average).Average

            Write-ColorOutput "[✓] Healthy (HTTP $($health.StatusCode)) - Latency: $([math]::Round($latencyTest.Latency, 2))ms (Avg: $([math]::Round($avgLatency, 2))ms)" "Green"
        } else {
            Write-ColorOutput "[✓] Healthy (HTTP $($health.StatusCode))" "Green"
        }

        # 重置连续失败计数
        $consecutiveFailures = 0

    } else {
        $totalFailures++
        $consecutiveFailures++

        $errorMsg = if ($health.StatusCode) {
            "[✗] Unhealthy (HTTP $($health.StatusCode)) - $($health.Error)"
        } else {
            "[✗] Unhealthy - $($health.Error)"
        }

        Write-ColorOutput $errorMsg "Red"

        # 连续失败告警
        if ($consecutiveFailures -eq 3) {
            Write-ColorOutput "⚠️  警告: 连续失败 3 次!" "Yellow"

            if ($SendAlert) {
                $subject = "Cloudflare Tunnel 健康检查失败"
                $body = @"
Cloudflare Tunnel 健康检查连续失败 3 次。

URL: $TunnelURL
时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
错误: $($health.Error)

请检查:
1. Cloudflare Tunnel 服务是否运行
2. 本地服务 (Docker) 是否正常
3. 网络连接是否正常
"@
                Send-AlertEmail -Subject $subject -Body $body -To $AlertEmail
            }
        }

        # 严重告警
        if ($consecutiveFailures -ge 10) {
            Write-ColorOutput "❌ 严重: 连续失败 $consecutiveFailures 次!" "Red"

            if ($SendAlert) {
                $subject = "[紧急] Cloudflare Tunnel 持续失败"
                $body = @"
Cloudflare Tunnel 健康检查持续失败。

URL: $TunnelURL
连续失败次数: $consecutiveFailures
总检查次数: $totalChecks
总失败次数: $totalFailures
失败率: $([math]::Round($totalFailures / $totalChecks * 100, 2))%

请立即检查系统状态!
"@
                Send-AlertEmail -Subject $subject -Body $body -To $AlertEmail
            }
        }
    }

    # 每10次检查输出统计信息
    if ($totalChecks % 10 -eq 0) {
        $successRate = [math]::Round((1 - $totalFailures / $totalChecks) * 100, 2)
        Write-ColorOutput "" "White"
        Write-ColorOutput "─" * 60 "Gray"
        Write-ColorOutput "📊 统计 (过去 $totalChecks 次检查)" "Cyan"
        Write-ColorOutput "成功率: $successRate%" "White"
        Write-ColorOutput "总失败: $totalFailures" "White"

        if ($latencies.Count -gt 0) {
            $avgLatency = [math]::Round(($latencies | Measure-Object -Average).Average, 2)
            $minLatency = [math]::Round(($latencies | Measure-Object -Minimum).Minimum, 2)
            $maxLatency = [math]::Round(($latencies | Measure-Object -Maximum).Maximum, 2)

            Write-ColorOutput "平均延迟: ${avgLatency}ms (Min: ${minLatency}ms, Max: ${maxLatency}ms)" "White"
        }

        Write-ColorOutput "─" * 60 "Gray"
        Write-ColorOutput "" "White"

        # 获取并输出 Cloudflare Tunnel 指标 (如果可用)
        $metrics = Get-TunnelMetrics
        if ($metrics) {
            # 解析指标 (简单示例)
            if ($metrics -match "cloudflared_tunnel_total_requests\s+(\d+)") {
                Write-ColorOutput "Tunnel 总请求数: $($Matches[1])" "Gray"
            }
        }
    }

    # 等待下一次检查
    Start-Sleep -Seconds $CheckInterval
}
