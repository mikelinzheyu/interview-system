# 自动更新 Dify Workflow YAML 文件中的 API URL
# ====================================================
#
# 用途: 将 workflow YAML 文件中的 ngrok URL 替换为 Cloudflare Tunnel URL
#
# 使用方法:
#   .\scripts\update-workflow-urls.ps1 -NewURL "https://storage-api.yourdomain.com"
#
# 示例:
#   .\scripts\update-workflow-urls.ps1 -NewURL "https://abc123.cfargotunnel.com"
#

param(
    [Parameter(Mandatory=$false)]
    [string]$OldURL = "https://phrenologic-preprandial-jesica.ngrok-free.dev",

    [Parameter(Mandatory=$true)]
    [string]$NewURL,

    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,

    [Parameter(Mandatory=$false)]
    [switch]$Backup = $true
)

# 配置
$ProjectRoot = "D:\code7\interview-system"
$WorkflowFiles = @(
    "$ProjectRoot\workflow2-fixed-latest.yml",
    "$ProjectRoot\workflow3-fixed.yml",
    "$ProjectRoot\dify-workflow2-code.py",
    "$ProjectRoot\dify-workflow3-code.py"
)

# 颜色输出
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 备份文件
function Backup-File {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) {
        return $null
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = "$FilePath.backup.$timestamp"

    Copy-Item -Path $FilePath -Destination $backupPath -Force
    return $backupPath
}

# 主逻辑
Write-ColorOutput "`n🔄 Dify Workflow URL 更新工具" "Cyan"
Write-ColorOutput "=" * 60 "Gray"
Write-ColorOutput "旧 URL: $OldURL" "Yellow"
Write-ColorOutput "新 URL: $NewURL" "Green"
Write-ColorOutput "=" * 60 "Gray"

if ($DryRun) {
    Write-ColorOutput "`n⚠️  DRY RUN 模式 - 不会实际修改文件`n" "Yellow"
}

$totalUpdates = 0
$filesUpdated = 0

foreach ($file in $WorkflowFiles) {
    if (-not (Test-Path $file)) {
        Write-ColorOutput "⏭️  跳过: $file (文件不存在)" "Gray"
        continue
    }

    Write-ColorOutput "`n📄 处理文件: $file" "Cyan"

    # 读取文件内容
    $content = Get-Content $file -Raw -Encoding UTF8

    # 检查是否包含旧 URL
    if ($content -notmatch [regex]::Escape($OldURL)) {
        Write-ColorOutput "   ✓ 无需更新 (未找到旧 URL)" "Gray"
        continue
    }

    # 统计替换次数
    $matches = [regex]::Matches($content, [regex]::Escape($OldURL))
    $count = $matches.Count

    Write-ColorOutput "   🔍 找到 $count 处需要替换" "Yellow"

    if (-not $DryRun) {
        # 备份原文件
        if ($Backup) {
            $backupPath = Backup-File -FilePath $file
            if ($backupPath) {
                Write-ColorOutput "   💾 已备份到: $backupPath" "Gray"
            }
        }

        # 执行替换
        $updatedContent = $content -replace [regex]::Escape($OldURL), $NewURL

        # 写回文件
        Set-Content -Path $file -Value $updatedContent -NoNewline -Encoding UTF8

        Write-ColorOutput "   ✅ 已更新 $count 处" "Green"
        $filesUpdated++
        $totalUpdates += $count
    } else {
        Write-ColorOutput "   [DRY RUN] 将更新 $count 处" "Yellow"
    }
}

# 总结
Write-ColorOutput "`n" "White"
Write-ColorOutput "=" * 60 "Gray"
Write-ColorOutput "📊 更新总结" "Cyan"
Write-ColorOutput "=" * 60 "Gray"

if ($DryRun) {
    Write-ColorOutput "模式: DRY RUN (未实际修改)" "Yellow"
} else {
    Write-ColorOutput "模式: 实际更新" "Green"
}

Write-ColorOutput "文件更新数: $filesUpdated" "White"
Write-ColorOutput "URL 替换总数: $totalUpdates" "White"

if ($Backup -and -not $DryRun) {
    Write-ColorOutput "备份文件: 已创建" "Gray"
}

Write-ColorOutput "=" * 60 "Gray"

# 验证更新
if (-not $DryRun -and $totalUpdates -gt 0) {
    Write-ColorOutput "`n🔍 验证更新..." "Cyan"

    $remainingOldURLs = 0
    foreach ($file in $WorkflowFiles) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            $matches = [regex]::Matches($content, [regex]::Escape($OldURL))
            if ($matches.Count -gt 0) {
                Write-ColorOutput "   ⚠️  警告: $file 仍包含 $($matches.Count) 处旧 URL" "Red"
                $remainingOldURLs += $matches.Count
            }
        }
    }

    if ($remainingOldURLs -eq 0) {
        Write-ColorOutput "   ✅ 验证通过: 所有旧 URL 已替换" "Green"
    } else {
        Write-ColorOutput "   ❌ 验证失败: 仍有 $remainingOldURLs 处旧 URL" "Red"
        exit 1
    }
}

# 下一步提示
if (-not $DryRun -and $totalUpdates -gt 0) {
    Write-ColorOutput "`n📝 下一步操作:" "Cyan"
    Write-ColorOutput "1. 检查更新后的 workflow 文件" "White"
    Write-ColorOutput "2. 在 Dify 中导入更新后的 YAML 文件" "White"
    Write-ColorOutput "3. 测试 Dify 工作流运行" "White"
    Write-ColorOutput "4. 如有问题，可从备份文件恢复`n" "White"
}

exit 0
