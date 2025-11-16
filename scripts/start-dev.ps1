<#
  One-click dev starter for Interview System (Windows PowerShell)

  Features:
  - Starts backend mock on port 3001 (backend/mock-server.js)
  - Starts frontend Vite dev on port 5174 (frontend)
  - Health checks for both services
  - Stop and status helpers via arguments

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1          # start
    powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1 start    # start
    powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1 status   # status
    powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1 stop     # stop
#>

[CmdletBinding()]
param(
  [ValidateSet('start','stop','status')]
  [string]$Action = 'start'
)

$ErrorActionPreference = 'Continue'

function Test-Url($url, $tries = 60, $delayMs = 1000) {
  for ($i = 0; $i -lt $tries; $i++) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
    } catch { }
    Start-Sleep -Milliseconds $delayMs
  }
  return $false
}

function Get-ListenerPid([int]$port) {
  try { (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop).OwningProcess } catch { $null }
}

function Get-NodeProcsMatching([string]$pattern) {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like "*$pattern*" }
}

function KillByPid([int[]]$pids) {
  foreach ($procId in $pids) {
    if ($procId -and ($procId -is [int])) {
      try { Stop-Process -Id $procId -Force -ErrorAction Stop; Write-Host ("Killed PID {0}" -f $procId) -ForegroundColor Yellow } catch { }
    }
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Resolve-Path (Join-Path $scriptDir '..')
$frontendDir = Join-Path $repoRoot 'frontend'
$backendDir  = Join-Path $repoRoot 'backend'
$pidsFile    = Join-Path $scriptDir '.dev.pids.json'

function Ensure-Command([string]$name) {
  try { Get-Command $name -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Ensure-Node() {
  if (-not (Ensure-Command 'node')) {
    Write-Error 'Node.js not found. Install Node.js 18+ from https://nodejs.org/'
    exit 1
  }
  if (-not (Ensure-Command 'npm')) {
    Write-Error 'npm not found. Ensure Node.js with npm is installed.'
    exit 1
  }
  try {
    $v = (& node -v) 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $v) { throw 'Unable to read Node.js version' }
    $v = $v.TrimStart('v')
    $major = [int]($v.Split('.')[0])
    if ($major -lt 18) {
      Write-Error ("Need Node.js >= 18, current: {0}" -f $v)
      exit 1
    }
  } catch {
    Write-Warning ("Unable to verify Node.js version: {0}" -f $_.Exception.Message)
  }
}

function Ensure-NpmDependencies([string]$dir, [string]$label) {
  $pkg = Join-Path $dir 'package.json'
  if (-not (Test-Path $pkg)) { return }

  $needsInstall = $false
  $nodeModules = Join-Path $dir 'node_modules'
  if (-not (Test-Path $nodeModules)) { $needsInstall = $true }

  if (-not $needsInstall -and $label -match 'front') {
    $viteBin = Join-Path $dir 'node_modules\vite\bin\vite.js'
    if (-not (Test-Path $viteBin)) { $needsInstall = $true }
  }

  if ($needsInstall) {
    Write-Host ("==> Installing {0} dependencies (npm install)..." -f $label) -ForegroundColor Cyan
    $prev = Get-Location
    try {
      Set-Location $dir
      npm install --silent
      if ($LASTEXITCODE -ne 0) {
        Write-Error ("{0} dependencies install failed. Check network and npm registry." -f $label)
        exit 1
      }
    } finally {
      Set-Location $prev
    }
  }
}

function SavePids($backendPid, $frontendPid) {
  $obj = @{ backend = $backendPid; frontend = $frontendPid; updated = (Get-Date).ToString('s') }
  try { $obj | ConvertTo-Json | Set-Content -Path $pidsFile -Encoding UTF8 } catch { }
}

function LoadPids() {
  if (Test-Path $pidsFile) {
    try { return (Get-Content $pidsFile -Raw | ConvertFrom-Json) } catch { return $null }
  }
  return $null
}

switch ($Action) {
  'start' {
    Write-Host '==> Starting dev environment (backend mock + frontend) ...' -ForegroundColor Cyan

    # 环境与依赖预检
    Ensure-Node
    Ensure-NpmDependencies $backendDir 'backend'
    Ensure-NpmDependencies $frontendDir 'frontend'

    # Stop any old frontend mock occupying port 3001
    $oldFrontMocks = Get-NodeProcsMatching "frontend\mock-server.js"
    if ($oldFrontMocks) {
      Write-Host 'Stopping old frontend mock on 3001 ...' -ForegroundColor Yellow
      KillByPid ($oldFrontMocks | Select-Object -ExpandProperty ProcessId)
    }

    # Free port 3001 if needed
    $pid3001 = Get-ListenerPid 3001
    if ($pid3001) {
      $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid3001").CommandLine
      if ($cmd -notlike '*backend\mock-server.js*') {
        Write-Host ("Port 3001 occupied by PID {0}; terminating." -f $pid3001) -ForegroundColor Yellow
        KillByPid @($pid3001)
      }
    }

    # Start backend mock (or reuse if already running)
    $pBackend = $null
    $pid3001 = Get-ListenerPid 3001
    if ($pid3001) {
      $cmd3001 = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid3001").CommandLine
      if ($cmd3001 -like '*backend\mock-server.js*') {
        Write-Host ("Backend mock already running (PID {0})" -f $pid3001) -ForegroundColor Green
        $pBackend = [PSCustomObject]@{ Id = $pid3001 }
      }
    }
    if (-not $pBackend) {
      try {
        $pBackend = Start-Process -FilePath node -ArgumentList 'mock-server.js' -WorkingDirectory $backendDir -PassThru
        Write-Host ("Backend mock started PID {0}" -f $pBackend.Id) -ForegroundColor Green
      } catch {
        Write-Error 'Failed to start backend mock. Ensure Node.js is installed.'
        exit 1
      }
    }

    Start-Sleep -Seconds 1

    # Start frontend (prefer npm, fallback to vite bin), or reuse if already running
    $pFront = $null
    $pid5174 = Get-ListenerPid 5174
    if ($pid5174) {
      $cmd5174 = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid5174").CommandLine
      if ($cmd5174 -like '*node_modules\vite\bin\vite.js*') {
        Write-Host ("Frontend dev already running (PID {0})" -f $pid5174) -ForegroundColor Green
        $pFront = [PSCustomObject]@{ Id = $pid5174 }
      }
    }
    if (-not $pFront) {
      $useNpm = $false
      try { if (Get-Command npm -ErrorAction Stop) { $useNpm = $true } } catch { }
      try {
        if ($useNpm) {
          $pFront = Start-Process -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory $frontendDir -PassThru
        } else {
          $viteBin = Join-Path $frontendDir 'node_modules\vite\bin\vite.js'
          if (-not (Test-Path $viteBin)) { Write-Error ("Vite binary not found: {0}. Run npm install." -f $viteBin); exit 1 }
          $pFront = Start-Process -FilePath node -ArgumentList $viteBin -WorkingDirectory $frontendDir -PassThru
        }
        Write-Host ("Frontend dev started PID {0}" -f $pFront.Id) -ForegroundColor Green
      } catch {
        Write-Error ("Failed to start frontend dev: " + $_.Exception.Message)
        if ($pBackend) { try { Stop-Process -Id $pBackend.Id -Force } catch { } }
        exit 1
      }
    }

    SavePids $pBackend.Id $pFront.Id

    # Health checks
    Write-Host 'Waiting for mock backend health ...'
    $okMock = Test-Url 'http://localhost:3001/api/health' 60 1000
    if ($okMock) { Write-Host 'Mock backend: UP' } else { Write-Host 'Mock backend: NOT READY' }

    Write-Host 'Waiting for frontend ...'
    $okFront = Test-Url 'http://127.0.0.1:5174' 60 1000
    if ($okFront) { Write-Host 'Frontend    : UP' } else { Write-Host 'Frontend    : NOT READY' }

    if (-not $okMock -or -not $okFront) {
      Write-Warning 'One or both services did not respond in time. They may still be starting.'
    } else {
      Write-Host 'All services are up. Open http://localhost:5174' -ForegroundColor Cyan
    }
  }

  'stop' {
    Write-Host '==> Stopping dev processes ...' -ForegroundColor Cyan
    $saved = LoadPids
    $toKill = @()
    if ($saved -and $saved.backend) { $toKill += [int]$saved.backend }
    if ($saved -and $saved.frontend) { $toKill += [int]$saved.frontend }
    $p3001 = Get-ListenerPid 3001
    $p5174 = Get-ListenerPid 5174
    foreach ($p in @($p3001, $p5174)) { if ($p) { if ($toKill -notcontains $p) { $toKill += $p } } }
    if ($toKill.Count -gt 0) { KillByPid $toKill } else { Write-Host 'No known dev processes found.' }
    try { if (Test-Path $pidsFile) { Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue } } catch { }
  }

  'status' {
    Write-Host '==> Dev environment status' -ForegroundColor Cyan
    $saved = LoadPids
    if ($saved) { Write-Host ("Saved PIDs -> backend={0}, frontend={1}" -f $saved.backend, $saved.frontend) }
    try { $s1 = (Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3001/api/health -TimeoutSec 2).StatusCode } catch { $s1 = 'ERR' }
    try { $s2 = (Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:5174 -TimeoutSec 2).StatusCode } catch { $s2 = 'ERR' }
    Write-Host ("Health -> mock={0}, front={1}" -f $s1, $s2)
    $pid3001 = Get-ListenerPid 3001
    $pid5174 = Get-ListenerPid 5174
    if (-not $pid3001) { $pid3001 = 'none' }
    if (-not $pid5174) { $pid5174 = 'none' }
    Write-Host ("Ports  -> 3001={0}, 5174={1}" -f $pid3001, $pid5174)
  }
}
