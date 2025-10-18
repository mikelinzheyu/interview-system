#!/usr/bin/env pwsh
# ========================================
# AI 鏅鸿兘闈㈣瘯绯荤粺 - 甯?Dify 宸ヤ綔娴佸惎鍔ㄨ剼鏈?(PowerShell)
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AI 鏅鸿兘闈㈣瘯绯荤粺 - 鍚姩閰嶇疆" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# 1. Dify 宸ヤ綔娴侀厤缃?
# ========================================
Write-Host "[1/4] 閰嶇疆 Dify 宸ヤ綔娴?.." -ForegroundColor Yellow

# 鉁?宸查厤缃偍鐨?Dify 宸ヤ綔娴佷俊鎭?
# 鍏紑璁块棶 URL: https://udify.app/workflow/ZJIwyB7UMouf2H9V
# API 璁块棶鍑嵁: https://api.dify.ai/v1

# Dify API 绔偣 (宸ヤ綔娴佽繍琛屽湴鍧€)
$env:DIFY_WORKFLOW_URL = "https://api.dify.ai/v1/workflows/run"

# Dify App ID / API Token
$env:DIFY_APP_ID = "app-vZlc0w5Dio2gnrTkdlblcPXG"

Write-Host "   Workflow URL: $env:DIFY_WORKFLOW_URL" -ForegroundColor Green
Write-Host "   App ID: $env:DIFY_APP_ID" -ForegroundColor Green
Write-Host ""

# ========================================
# 2. 鏁版嵁搴撻厤缃?
# ========================================
Write-Host "[2/4] 閰嶇疆鏁版嵁搴撹繛鎺?.." -ForegroundColor Yellow

# 鏁版嵁搴撳瘑鐮侊紙榛樿锛?23456锛?
$env:DB_PASSWORD = "123456"

# Redis 瀵嗙爜锛堝鏋滄病鏈夎缃瘑鐮侊紝淇濇寔涓虹┖锛?
$env:REDIS_PASSWORD = ""

Write-Host "   Database: localhost:3306/interview_system" -ForegroundColor Green
Write-Host "   Redis: localhost:6379" -ForegroundColor Green
Write-Host ""

# ========================================
# 3. JWT 瀵嗛挜閰嶇疆锛堝彲閫夛級
# ========================================
Write-Host "[3/4] 閰嶇疆 JWT 瀵嗛挜..." -ForegroundColor Yellow

# JWT 瀵嗛挜锛堥粯璁や娇鐢ㄩ厤缃枃浠朵腑鐨勫€硷級
# $env:JWT_SECRET = "your-custom-jwt-secret-key-here"

Write-Host "   JWT Secret: (浣跨敤榛樿鍊?" -ForegroundColor Green
Write-Host ""

# ========================================
# 4. 鍚姩鍚庣鏈嶅姟
# ========================================
Write-Host "[4/4] 鍚姩鍚庣鏈嶅姟..." -ForegroundColor Yellow
Write-Host ""

# 妫€鏌?Java 鏄惁瀹夎
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "   Java 宸插畨瑁? $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "[閿欒] 鏈娴嬪埌 Java锛岃鍏堝畨瑁?JDK 17 鎴栨洿楂樼増鏈? -ForegroundColor Red
    Write-Host ""
    Read-Host "鎸変换鎰忛敭閫€鍑?
    exit 1
}

# 妫€鏌?Maven 鏄惁瀹夎
try {
    $mavenVersion = mvn -version 2>&1 | Select-Object -First 1
    Write-Host "   Maven 宸插畨瑁? $mavenVersion" -ForegroundColor Green
} catch {
    Write-Host "[閿欒] 鏈娴嬪埌 Maven锛岃鍏堝畨瑁?Maven" -ForegroundColor Red
    Write-Host ""
    Read-Host "鎸変换鎰忛敭閫€鍑?
    exit 1
}

Write-Host ""

# 杩涘叆鍚庣鐩綍
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 姝ｅ湪鍚姩 Spring Boot 搴旂敤..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "鎻愮ず锛? -ForegroundColor Yellow
Write-Host " - 鍚庣鏈嶅姟鍦板潃: http://localhost:8080/api" -ForegroundColor White
Write-Host " - API 鏂囨。: http://localhost:8080/api/doc.html (濡傚凡閰嶇疆)" -ForegroundColor White
Write-Host " - 鏃ュ織绾у埆: DEBUG" -ForegroundColor White
Write-Host ""
Write-Host "鎸?Ctrl+C 鍋滄鏈嶅姟" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 鍚姩 Spring Boot 搴旂敤
mvn spring-boot:run

