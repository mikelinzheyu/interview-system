# 批量修复Element Plus图标引用错误
$rootPath = "D:\code7\interview-system\frontend\src"

# 图标映射关系（旧图标 -> 新图标）
$iconMappings = @{
    '\bRobot\b' = 'Avatar'
    '\bPlay\b' = 'VideoPlay'
    '\bSuccess\b' = 'SuccessFilled'
    '\bInfo\b(?!Filled)' = 'InfoFilled'
    '\bLightbulb\b' = 'QuestionFilled'
    '\bBulb\b' = 'QuestionFilled'
    '\bLight\b' = 'QuestionFilled'
    '\bLike\b' = 'StarFilled'
    '\bCheck\b(?!ed|Filled)' = 'CircleCheck'
    '\bWarning\b(?!Filled)' = 'WarningFilled'
}

Write-Host "开始修复图标引用..." -ForegroundColor Green

# 查找所有Vue文件
Get-ChildItem -Path $rootPath -Filter *.vue -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $modified = $false

    # 检查文件是否包含@element-plus/icons-vue
    if ($content -match "@element-plus/icons-vue") {
        Write-Host "处理文件: $($file.FullName)" -ForegroundColor Yellow

        # 应用所有映射
        foreach ($pattern in $iconMappings.Keys) {
            $replacement = $iconMappings[$pattern]
            if ($content -match $pattern) {
                $content = $content -replace $pattern, $replacement
                $modified = $true
                Write-Host "  替换: $pattern -> $replacement" -ForegroundColor Cyan
            }
        }

        # 如果有修改，保存文件
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "  ✓ 已保存" -ForegroundColor Green
        }
    }
}

Write-Host "`n图标修复完成！" -ForegroundColor Green
