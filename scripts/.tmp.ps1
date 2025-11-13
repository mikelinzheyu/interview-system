 110:     }
 111:   }
 112: }
 113: 
 114: function SavePids($backendPid, $frontendPid) {
 115:   $obj = @{ backend = $backendPid; frontend = $frontendPid; updated = (Get-Date).ToString('s') }
 116:   try { $obj | ConvertTo-Json | Set-Content -Path $pidsFile -Encoding UTF8 } catch { }
 117: }
 118: 
 119: function LoadPids() {
 120:   if (Test-Path $pidsFile) {
 121:     try { return (Get-Content $pidsFile -Raw | ConvertFrom-Json) } catch { return $null }
 122:   }
 123:   return $null
 124: }
 125: 
 126: switch ($Action) {
 127:   'start' {
 128:     Write-Host '==> Starting dev environment (backend mock + frontend) ...' -ForegroundColor Cyan
 129: 
 130:     # 环境与依赖预检
 131:     Ensure-Node
 132:     Ensure-NpmDependencies $backendDir 'backend'
 133:     Ensure-NpmDependencies $frontendDir 'frontend'
 134: 
 135:     # Stop any old frontend mock occupying port 3001
 136:     $oldFrontMocks = Get-NodeProcsMatching "frontend\mock-server.js"
 137:     if ($oldFrontMocks) {
 138:       Write-Host 'Stopping old frontend mock on 3001 ...' -ForegroundColor Yellow
 139:       KillByPid ($oldFrontMocks | Select-Object -ExpandProperty ProcessId)
 140:     }
 141: 
 142:     # Free port 3001 if needed
 143:     $pid3001 = Get-ListenerPid 3001
 144:     if ($pid3001) {
 145:       $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid3001").CommandLine
 146:       if ($cmd -notlike '*backend\mock-server.js*') {
 147:         Write-Host ("Port 3001 occupied by PID {0}; terminating." -f $pid3001) -ForegroundColor Yellow
 148:         KillByPid @($pid3001)
 149:       }
 150:     }
 151: 
 152:     # Start backend mock (or reuse if already running)
 153:     $pBackend = $null
 154:     $pid3001 = Get-ListenerPid 3001
 155:     if ($pid3001) {
 156:       $cmd3001 = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid3001").CommandLine
 157:       if ($cmd3001 -like '*backend\mock-server.js*') {
 158:         Write-Host ("Backend mock already running (PID {0})" -f $pid3001) -ForegroundColor Green
 159:         $pBackend = [PSCustomObject]@{ Id = $pid3001 }
 160:       }
 161:     }
 162:     if (-not $pBackend) {
 163:       try {
 164:         $pBackend = Start-Process -FilePath node -ArgumentList 'mock-server.js' -WorkingDirectory $backendDir -PassThru
 165:         Write-Host ("Backend mock started PID {0}" -f $pBackend.Id) -ForegroundColor Green
 166:       } catch {
 167:         Write-Error 'Failed to start backend mock. Ensure Node.js is installed.'
 168:         exit 1
 169:       }
 170:     }
 171: 
 172:     Start-Sleep -Seconds 1
 173: 
 174:     # Start frontend (prefer npm, fallback to vite bin), or reuse if already running
 175:     $pFront = $null
 176:     $pid5174 = Get-ListenerPid 5174
 177:     if ($pid5174) {
 178:       $cmd5174 = (Get-CimInstance Win32_Process -Filter "ProcessId=$pid5174").CommandLine
 179:       if ($cmd5174 -like '*node_modules\vite\bin\vite.js*') {
 180:         Write-Host ("Frontend dev already running (PID {0})" -f $pid5174) -ForegroundColor Green
 181:         $pFront = [PSCustomObject]@{ Id = $pid5174 }
 182:       }
 183:     }
 184:     if (-not $pFront) {
 185:       $useNpm = $false
 186:       try { if (Get-Command npm -ErrorAction Stop) { $useNpm = $true } } catch { }
 187:       try {
 188:         if ($useNpm) {
 189:           $pFront = Start-Process -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory $frontendDir -PassThru
 190:         } else {
 191:           $viteBin = Join-Path $frontendDir 'node_modules\vite\bin\vite.js'
 192:           if (-not (Test-Path $viteBin)) { throw "Vite binary not found: $viteBin (run 'cd frontend && npm i')" }
 193:           $pFront = Start-Process -FilePath node -ArgumentList $viteBin -WorkingDirectory $frontendDir -PassThru
 194:         }
 195:         Write-Host ("Frontend dev started PID {0}" -f $pFront.Id) -ForegroundColor Green
 196:       } catch {
 197:         Write-Error ("Failed to start frontend dev: " + $_.Exception.Message)
 198:         if ($pBackend) { try { Stop-Process -Id $pBackend.Id -Force } catch { } }
 199:         exit 1
 200:       }
 201:     }
 202: 
 203:     SavePids $pBackend.Id $pFront.Id
 204: 
 205:     # Health checks
 206:     Write-Host 'Waiting for mock backend health ...'
 207:     $okMock = Test-Url 'http://localhost:3001/api/health' 60 1000
 208:     if ($okMock) { Write-Host 'Mock backend: UP' } else { Write-Host 'Mock backend: NOT READY' }
 209: 
 210:     Write-Host 'Waiting for frontend ...'
 211:     $okFront = Test-Url 'http://127.0.0.1:5174' 60 1000
 212:     if ($okFront) { Write-Host 'Frontend    : UP' } else { Write-Host 'Frontend    : NOT READY' }
 213: 
 214:     if (-not $okMock -or -not $okFront) {
 215:       Write-Warning 'One or both services did not respond in time. They may still be starting.'
 216:     } else {
 217:       Write-Host 'All services are up. Open http://localhost:5174' -ForegroundColor Cyan
 218:     }
 219:   }
 220: 
 221:   'stop' {
 222:     Write-Host '==> Stopping dev processes ...' -ForegroundColor Cyan
 223:     $saved = LoadPids()
 224:     $toKill = @()
 225:     if ($saved -and $saved.backend) { $toKill += [int]$saved.backend }
 226:     if ($saved -and $saved.frontend) { $toKill += [int]$saved.frontend }
 227:     $p3001 = Get-ListenerPid 3001
 228:     $p5174 = Get-ListenerPid 5174
 229:     foreach ($p in @($p3001, $p5174)) { if ($p) { if ($toKill -notcontains $p) { $toKill += $p } } }
 230:     if ($toKill.Count -gt 0) { KillByPid $toKill } else { Write-Host 'No known dev processes found.' }
 231:     try { if (Test-Path $pidsFile) { Remove-Item $pidsFile -Force -ErrorAction SilentlyContinue } } catch { }
 232:   }
 233: 
 234:   'status' {
 235:     Write-Host '==> Dev environment status' -ForegroundColor Cyan
 236:     $saved = LoadPids()
 237:     if ($saved) { Write-Host ("Saved PIDs -> backend={0}, frontend={1}" -f $saved.backend, $saved.frontend) }
 238:     try { $s1 = (Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3001/api/health -TimeoutSec 2).StatusCode } catch { $s1 = 'ERR' }
 239:     try { $s2 = (Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:5174 -TimeoutSec 2).StatusCode } catch { $s2 = 'ERR' }
 240:     Write-Host ("Health -> mock={0}, front={1}" -f $s1, $s2)
 241:     $pid3001 = Get-ListenerPid 3001
 242:     $pid5174 = Get-ListenerPid 5174
 243:     if (-not $pid3001) { $pid3001 = 'none' }
 244:     if (-not $pid5174) { $pid5174 = 'none' }
 245:     Write-Host ("Ports  -> 3001={0}, 5174={1}" -f $pid3001, $pid5174)
 246:   }
 247: }
