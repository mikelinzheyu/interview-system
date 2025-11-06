param(
  [string]$FrontendBase = 'http://localhost:8088',
  [string]$ApiPrefix = '/api',
  [int]$MaxMinutes = 30
)

Write-Host "[wait-and-smoke] Start polling $FrontendBase and backend health for up to $MaxMinutes minutes..."

$deadline = (Get-Date).AddMinutes($MaxMinutes)
$backendOk = $false
$frontendOk = $false

while((Get-Date) -lt $deadline){
  try {
    $b = Invoke-WebRequest -UseBasicParsing http://localhost:8080/actuator/health -TimeoutSec 5
    if ($b.StatusCode -eq 200 -and $b.Content -match 'UP') { $backendOk = $true }
  } catch {}
  try {
    $f = Invoke-WebRequest -UseBasicParsing ($FrontendBase.TrimEnd('/') + '/health') -TimeoutSec 5
    if ($f.StatusCode -eq 200) { $frontendOk = $true }
  } catch {}

  if ($backendOk -and $frontendOk) { break } else { Start-Sleep -Seconds 5 }
}

if (-not ($backendOk -and $frontendOk)) {
  Write-Host "[wait-and-smoke] Not ready within timeout." -ForegroundColor Yellow
  exit 2
}

Write-Host "[wait-and-smoke] Services ready. Running smoke tests..." -ForegroundColor Green

$env:FRONTEND_BASE = $FrontendBase
$env:API_PREFIX = $ApiPrefix
$env:MOCK_MODE = 'false'

node scripts/smoke-test.js
exit $LASTEXITCODE

