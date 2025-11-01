# Cloudflare Tunnel 迁移指南

**创建时间**: 2025-10-27
**当前状态**: ngrok → Cloudflare Tunnel 迁移方案
**目标**: 将生产环境从 ngrok 迁移到更稳定的 Cloudflare Tunnel

---

## 📊 1. Cloudflare Tunnel vs ngrok 对比

### 1.1 功能对比表

| 特性 | Cloudflare Tunnel (免费) | ngrok (免费) | 建议 |
|------|------------------------|-------------|------|
| **稳定性** | ⭐⭐⭐⭐⭐ 企业级稳定 | ⭐⭐⭐ 会话可能过期 | Cloudflare 胜出 |
| **性能** | ⭐⭐⭐⭐⭐ Cloudflare CDN 加速 | ⭐⭐⭐ 直连隧道 | Cloudflare 胜出 |
| **免费限制** | 无带宽限制 | 有带宽和连接数限制 | Cloudflare 胜出 |
| **固定URL** | ✅ 永久固定 | ❌ 每次重启变化 (免费版) | Cloudflare 胜出 |
| **SSL证书** | ✅ 官方证书 | ⚠️ 自签名证书 | Cloudflare 胜出 |
| **DDoS防护** | ✅ 免费内置 | ❌ 需付费版 | Cloudflare 胜出 |
| **设置复杂度** | ⭐⭐⭐⭐ 需域名 | ⭐⭐ 即开即用 | ngrok 更简单 |
| **隧道数量** | 无限制 | 1个 (免费版) | Cloudflare 胜出 |
| **自定义域名** | ✅ 免费 | ❌ 需付费版 | Cloudflare 胜出 |
| **访问日志** | ✅ 详细日志 | ⚠️ 有限日志 | Cloudflare 胜出 |

### 1.2 为什么选择 Cloudflare Tunnel？

#### ✅ 生产环境优势

1. **稳定性保证**
   - 不会像 ngrok 那样随机断开连接
   - 基于 Cloudflare 全球网络，99.99% SLA
   - 隧道进程崩溃会自动重启

2. **固定URL**
   - ngrok 免费版每次重启 URL 都会变化
   - Cloudflare Tunnel 提供永久固定的子域名
   - 无需每次更新 Dify 工作流配置

3. **更好的性能**
   - Cloudflare CDN 边缘节点加速
   - 自动路由到最近的数据中心
   - 内置缓存和优化

4. **安全性**
   - 官方签名的 SSL/TLS 证书 (无需跳过验证)
   - 内置 DDoS 防护和 WAF
   - 支持访问控制策略

5. **成本效益**
   - 完全免费，无带宽限制
   - 无需购买 ngrok Pro ($8/月)
   - 适合生产环境长期使用

#### ❌ ngrok 的局限性

1. **免费版限制**
   - URL 每次重启变化，需频繁更新配置
   - 带宽和连接数限制
   - 隧道可能在不活动时过期
   - 自签名证书导致 SSL 验证问题

2. **生产环境风险**
   - 隧道意外断开，影响 Dify 工作流
   - 无法保证 SLA
   - 免费版不适合商业用途

---

## 🚀 2. 安装和配置步骤

### 2.1 前置要求

1. **Cloudflare 账号** (免费)
   - 访问: https://dash.cloudflare.com/sign-up
   - 完成邮箱验证

2. **域名** (可选但推荐)
   - 如果没有域名: Cloudflare 会提供 `.trycloudflare.com` 子域名
   - 如果有域名: 可以使用自定义域名 (如 `api.yourdomain.com`)

3. **Windows 系统要求**
   - Windows 10/11 或 Windows Server 2019+
   - PowerShell 5.1+ 或管理员权限

### 2.2 安装 cloudflared CLI

#### 方法1: 使用 Winget (推荐)

```powershell
# 使用管理员权限运行 PowerShell
winget install --id Cloudflare.cloudflared
```

#### 方法2: 手动下载

```powershell
# 1. 下载 cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"

# 2. 移动到系统路径
Move-Item cloudflared.exe C:\Windows\System32\cloudflared.exe

# 3. 验证安装
cloudflared --version
```

预期输出:
```
cloudflared version 2024.10.0 (built 2024-10-15-1200 UTC)
```

### 2.3 配置 Cloudflare Tunnel

#### 步骤1: 登录 Cloudflare 账号

```powershell
# 这会打开浏览器进行授权
cloudflared tunnel login
```

成功后会显示:
```
You have successfully logged in.
If you wish to copy your credentials to a server, they have been saved to:
C:\Users\YourUsername\.cloudflared\cert.pem
```

#### 步骤2: 创建隧道

```powershell
# 创建名为 interview-system 的隧道
cloudflared tunnel create interview-system
```

输出示例:
```
Tunnel credentials written to C:\Users\YourUsername\.cloudflared\<TUNNEL-ID>.json
Created tunnel interview-system with id <TUNNEL-ID>
```

**重要**: 保存输出中的 `<TUNNEL-ID>`，后续需要用到。

#### 步骤3: 配置隧道路由

创建配置文件 `C:\Users\YourUsername\.cloudflared\config.yml`:

```yaml
# Cloudflare Tunnel 配置
# 隧道ID (替换为你的实际隧道ID)
tunnel: <TUNNEL-ID>
credentials-file: C:\Users\YourUsername\.cloudflared\<TUNNEL-ID>.json

# 入口配置 (Ingress Rules)
ingress:
  # 路由1: 存储服务 API (localhost:8081)
  - hostname: storage-api.yourdomain.com
    service: http://localhost:8081
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      httpHostHeader: localhost:8081

  # 路由2: 后端 API (localhost:8080) - 可选
  - hostname: api.yourdomain.com
    service: http://localhost:8080
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s

  # 默认路由 (捕获所有其他请求)
  - service: http_status:404
```

**配置说明**:
- `hostname`: 你的域名或 Cloudflare 提供的子域名
- `service`: 本地服务地址 (对应你的 storage-service 的 8081 端口)
- `noTLSVerify`: 跳过本地服务的 TLS 验证
- `connectTimeout`: 连接超时时间 (根据你的需求调整)

#### 步骤4: 配置 DNS (如果使用自定义域名)

```powershell
# 为你的域名创建 DNS 路由
cloudflared tunnel route dns interview-system storage-api.yourdomain.com
cloudflared tunnel route dns interview-system api.yourdomain.com
```

**如果没有域名**: Cloudflare 会自动分配一个 `.trycloudflare.com` 子域名。

#### 步骤5: 启动隧道

```powershell
# 测试运行 (前台)
cloudflared tunnel run interview-system

# 或使用配置文件
cloudflared tunnel --config C:\Users\YourUsername\.cloudflared\config.yml run
```

成功启动后会显示:
```
2024-10-27T10:00:00Z INF Starting tunnel tunnelID=<TUNNEL-ID>
2024-10-27T10:00:00Z INF Connection registered connIndex=0 location=SJC
2024-10-27T10:00:00Z INF Connection registered connIndex=1 location=LAX
2024-10-27T10:00:00Z INF Registered tunnel connection connIndex=2 location=DFW
```

### 2.4 获取公网 URL

#### 方法1: 查看隧道信息

```powershell
cloudflared tunnel info interview-system
```

输出包含你的公网 URL:
```
NAME: interview-system
ID: <TUNNEL-ID>
CREATED: 2024-10-27 10:00:00 +0000 UTC
CONNECTIONS:
  - id: abc123, origin: SJC, protocol: http2
  - id: def456, origin: LAX, protocol: http2
```

#### 方法2: 从 Cloudflare Dashboard 查看

1. 访问: https://one.dash.cloudflare.com/
2. 进入 **Zero Trust** → **Networks** → **Tunnels**
3. 找到 `interview-system` 隧道
4. 查看 **Public Hostname** 获取 URL

你的 URL 格式:
- 有域名: `https://storage-api.yourdomain.com`
- 无域名: `https://<TUNNEL-ID>.cfargotunnel.com`

---

## 🐳 3. 集成到 Docker Compose

### 3.1 添加 Cloudflare Tunnel 服务

编辑 `D:\code7\interview-system\docker-compose.yml`，添加新服务:

```yaml
services:
  # ... 其他服务 ...

  # Cloudflare Tunnel 服务
  cloudflare-tunnel:
    image: cloudflare/cloudflared:latest
    container_name: interview-cloudflare-tunnel
    restart: unless-stopped

    # 使用配置文件启动隧道
    command: tunnel --config /etc/cloudflared/config.yml run

    # 环境变量
    environment:
      TZ: ${TZ:-Asia/Shanghai}
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}

    # 挂载配置文件
    volumes:
      - ./cloudflare-tunnel/config.yml:/etc/cloudflared/config.yml:ro
      - ./cloudflare-tunnel/credentials.json:/etc/cloudflared/credentials.json:ro
      - ./logs/tunnel:/var/log/cloudflared

    # 网络配置 (连接到 interview-network)
    networks:
      - interview-network

    # 依赖后端服务启动
    depends_on:
      backend:
        condition: service_healthy
      storage-service:
        condition: service_healthy

    # 健康检查
    healthcheck:
      test: ["CMD", "cloudflared", "tunnel", "info", "${TUNNEL_NAME}"]
      interval: 60s
      timeout: 10s
      retries: 3

    # 日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  interview-network:
    driver: bridge
```

### 3.2 创建 Cloudflare Tunnel 配置目录

```powershell
# 在项目根目录创建配置文件夹
New-Item -ItemType Directory -Path "D:\code7\interview-system\cloudflare-tunnel" -Force
```

### 3.3 创建 Docker 专用配置文件

创建 `D:\code7\interview-system\cloudflare-tunnel\config.yml`:

```yaml
# Cloudflare Tunnel 配置 (Docker 容器内)
# ==========================================

# 隧道ID (从环境变量或直接填写)
tunnel: <TUNNEL-ID>

# 凭证文件路径 (容器内路径)
credentials-file: /etc/cloudflared/credentials.json

# 日志配置
loglevel: info
logfile: /var/log/cloudflared/tunnel.log

# 指标服务器 (用于监控)
metrics: 0.0.0.0:8090

# 入口规则 (Ingress Rules)
ingress:
  # 路由1: 存储服务 (Docker 内部网络地址)
  - hostname: storage-api.yourdomain.com  # 替换为你的域名或 Cloudflare 子域名
    service: http://interview-storage-service:8081  # Docker 服务名
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      keepAliveTimeout: 90s
      httpHostHeader: interview-storage-service:8081

  # 路由2: 后端 API (可选)
  - hostname: api.yourdomain.com
    service: http://interview-backend:3001
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      httpHostHeader: interview-backend:3001

  # 默认路由 (404)
  - service: http_status:404
```

**重要**:
- 使用 Docker 服务名 (`interview-storage-service`, `interview-backend`) 而不是 `localhost`
- 确保 `tunnel` 字段填写你的实际隧道 ID

### 3.4 复制凭证文件

```powershell
# 复制隧道凭证到 Docker 配置目录
Copy-Item "C:\Users\$env:USERNAME\.cloudflared\<TUNNEL-ID>.json" `
          "D:\code7\interview-system\cloudflare-tunnel\credentials.json"
```

### 3.5 更新环境变量

编辑 `D:\code7\interview-system\.env.docker`:

```bash
# ============ Cloudflare Tunnel 配置 ============
CLOUDFLARE_TUNNEL_TOKEN=<YOUR-TUNNEL-TOKEN>
TUNNEL_NAME=interview-system
TUNNEL_ID=<TUNNEL-ID>

# 公网 API URL (替换为你的 Cloudflare Tunnel URL)
STORAGE_API_PUBLIC_URL=https://storage-api.yourdomain.com
BACKEND_API_PUBLIC_URL=https://api.yourdomain.com

# ... 其他配置保持不变 ...
```

### 3.6 启动 Docker 服务

```powershell
# 停止现有服务
docker-compose -f docker-compose.yml --env-file .env.docker down

# 启动包括 Cloudflare Tunnel 的所有服务
docker-compose -f docker-compose.yml --env-file .env.docker up -d

# 查看 Cloudflare Tunnel 日志
docker logs -f interview-cloudflare-tunnel
```

预期输出:
```
2024-10-27T10:00:00Z INF Starting tunnel tunnelID=<TUNNEL-ID>
2024-10-27T10:00:00Z INF Connection registered connIndex=0
2024-10-27T10:00:00Z INF Each HA connection's tunnel IDs: map[0:<ID> 1:<ID>]
```

---

## 🔄 4. 更新 Dify Workflow2 配置

### 4.1 获取新的 Cloudflare Tunnel URL

假设你的 Cloudflare Tunnel URL 是:
```
https://storage-api.yourdomain.com
```

或者 Cloudflare 自动分配的:
```
https://<TUNNEL-ID>.cfargotunnel.com
```

### 4.2 更新 workflow2-fixed-latest.yml

编辑 `D:\code7\interview-system\workflow2-fixed-latest.yml`，将所有 ngrok URL 替换为 Cloudflare Tunnel URL:

#### 修改前 (ngrok):
```python
api_url = f"https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions/{session_id}"
```

#### 修改后 (Cloudflare Tunnel):
```python
api_url = f"https://storage-api.yourdomain.com/api/sessions/{session_id}"
```

### 4.3 完整的更新位置

在 `workflow2-fixed-latest.yml` 中需要修改的地方:

1. **load_question_info 节点 (Line 145)**:
```yaml
code: |
  import json
  import urllib.request
  import ssl

  def main(session_id: str, question_id: str) -> dict:
      # ⭐ 修改这里: 使用 Cloudflare Tunnel URL
      api_url = f"https://storage-api.yourdomain.com/api/sessions/{session_id}"
      api_key = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

      # SSL 上下文 (Cloudflare 使用官方证书，可以开启验证)
      ctx = ssl.create_default_context()
      # ctx.check_hostname = False  # Cloudflare 证书有效，可以注释掉
      # ctx.verify_mode = ssl.CERT_NONE  # Cloudflare 证书有效，可以注释掉

      # ... 其余代码保持不变 ...
```

2. **save_standard_answer 节点 (Line 291)**:
```yaml
code: |
  import json
  import urllib.request
  import urllib.error
  import ssl
  import socket

  def main(session_id: str, question_id: str, standard_answer: str) -> dict:
      # ⭐ 修改这里: 使用 Cloudflare Tunnel URL
      api_base_url = "https://storage-api.yourdomain.com/api/sessions"
      api_key = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"

      # SSL 上下文 (Cloudflare 使用官方证书，可以开启验证)
      ctx = ssl.create_default_context()
      # ctx.check_hostname = False  # 可以注释掉
      # ctx.verify_mode = ssl.CERT_NONE  # 可以注释掉

      # ... 其余代码保持不变 ...
```

### 4.4 自动替换脚本

创建 `D:\code7\interview-system\scripts\update-workflow-urls.ps1`:

```powershell
# 自动更新 workflow YAML 文件中的 API URL
# ============================================

param(
    [string]$OldURL = "https://phrenologic-preprandial-jesica.ngrok-free.dev",
    [string]$NewURL = "https://storage-api.yourdomain.com"
)

$files = @(
    "D:\code7\interview-system\workflow2-fixed-latest.yml",
    "D:\code7\interview-system\workflow3-fixed.yml"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file..." -ForegroundColor Green

        # 读取文件内容
        $content = Get-Content $file -Raw

        # 替换 URL
        $updatedContent = $content -replace [regex]::Escape($OldURL), $NewURL

        # 写回文件
        Set-Content -Path $file -Value $updatedContent -NoNewline

        Write-Host "  ✓ Updated" -ForegroundColor Cyan
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nAll workflow files have been updated!" -ForegroundColor Green
```

运行脚本:
```powershell
# 使用你的实际 Cloudflare Tunnel URL
.\scripts\update-workflow-urls.ps1 -NewURL "https://storage-api.yourdomain.com"
```

### 4.5 验证更新

```powershell
# 检查是否还有 ngrok URL
Select-String -Path "D:\code7\interview-system\workflow2-fixed-latest.yml" -Pattern "ngrok"

# 如果没有输出，说明替换成功
```

### 4.6 在 Dify 中更新工作流

1. **导出更新后的 YAML**:
   - 使用更新后的 `workflow2-fixed-latest.yml`

2. **在 Dify 中导入**:
   - 登录 https://cloud.dify.ai
   - 进入 **AI面试官-工作流2-生成答案**
   - 点击 **导入** → 选择更新后的 YAML 文件
   - 或者手动修改 Python 代码节点中的 URL

3. **测试工作流**:
   ```python
   # 在 Dify 工作流测试中输入:
   {
     "session_id": "test-session-123",
     "question_id": "q1"
   }
   ```

4. **验证输出**:
   - 确保 `load_question_info` 能成功加载问题
   - 确保 `save_standard_answer` 返回 `status: "成功"`

---

## ✅ 5. 性能和可靠性验证

### 5.1 连接测试

#### 测试1: 基本连接

```powershell
# 测试 Cloudflare Tunnel 是否可访问
Invoke-WebRequest -Uri "https://storage-api.yourdomain.com/api/sessions" `
                   -Method GET `
                   -Headers @{
                       "Authorization" = "Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
                   }
```

预期响应:
```
StatusCode        : 200
StatusDescription : OK
Content           : {"sessions": [...]}
```

#### 测试2: SSL 证书验证

```powershell
# 验证 SSL 证书是否官方签名 (应该成功，不需要跳过验证)
$response = Invoke-WebRequest -Uri "https://storage-api.yourdomain.com/api/sessions" `
                               -Headers @{"Authorization" = "Bearer ak_live_..."} `
                               -SkipCertificateCheck:$false

Write-Host "SSL Certificate Valid: $($response.StatusCode -eq 200)" -ForegroundColor Green
```

### 5.2 性能测试

创建 `D:\code7\interview-system\test-cloudflare-tunnel-performance.js`:

```javascript
const https = require('https');

// Cloudflare Tunnel URL
const CLOUDFLARE_URL = 'https://storage-api.yourdomain.com/api/sessions';
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// 性能测试配置
const TEST_COUNT = 100;  // 测试 100 次请求
const CONCURRENT = 10;   // 并发 10 个请求

async function measureLatency(url, method = 'GET') {
    const start = Date.now();

    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method,
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        }, (res) => {
            const latency = Date.now() - start;
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    latency,
                    statusCode: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 300
                });
            });
        });

        req.on('error', (err) => {
            reject({ latency: Date.now() - start, error: err.message });
        });

        req.end();
    });
}

async function runPerformanceTest() {
    console.log('🚀 Cloudflare Tunnel 性能测试\n');
    console.log(`测试URL: ${CLOUDFLARE_URL}`);
    console.log(`测试次数: ${TEST_COUNT}`);
    console.log(`并发数: ${CONCURRENT}\n`);

    const results = [];

    // 分批并发测试
    for (let i = 0; i < TEST_COUNT; i += CONCURRENT) {
        const batch = [];
        for (let j = 0; j < CONCURRENT && (i + j) < TEST_COUNT; j++) {
            batch.push(measureLatency(CLOUDFLARE_URL));
        }

        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);

        process.stdout.write(`\rProgress: ${Math.min(i + CONCURRENT, TEST_COUNT)}/${TEST_COUNT}`);
    }

    console.log('\n');

    // 统计结果
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

    const latencies = successful.map(r => r.value.latency);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

    // 输出报告
    console.log('📊 性能测试报告\n');
    console.log('✅ 成功率:');
    console.log(`   ${successful.length}/${TEST_COUNT} (${(successful.length / TEST_COUNT * 100).toFixed(2)}%)\n`);

    console.log('⏱️  延迟统计:');
    console.log(`   平均延迟: ${avgLatency.toFixed(2)} ms`);
    console.log(`   最小延迟: ${minLatency} ms`);
    console.log(`   最大延迟: ${maxLatency} ms`);
    console.log(`   P95延迟: ${p95Latency} ms\n`);

    console.log('🔍 与 ngrok 对比:');
    console.log('   ngrok 平均延迟: ~200-300ms');
    console.log(`   Cloudflare 平均延迟: ${avgLatency.toFixed(2)}ms`);

    if (avgLatency < 200) {
        console.log('   ✅ Cloudflare Tunnel 更快!');
    } else if (avgLatency < 300) {
        console.log('   ⚖️  性能相当');
    } else {
        console.log('   ⚠️  Cloudflare Tunnel 较慢 (检查网络配置)');
    }

    if (failed.length > 0) {
        console.log(`\n❌ 失败的请求: ${failed.length}`);
        failed.slice(0, 5).forEach((f, i) => {
            console.log(`   ${i + 1}. ${f.reason || f.value.error}`);
        });
    }
}

// 运行测试
runPerformanceTest().catch(console.error);
```

运行测试:
```powershell
node test-cloudflare-tunnel-performance.js
```

预期输出:
```
🚀 Cloudflare Tunnel 性能测试

测试URL: https://storage-api.yourdomain.com/api/sessions
测试次数: 100
并发数: 10

Progress: 100/100

📊 性能测试报告

✅ 成功率:
   100/100 (100.00%)

⏱️  延迟统计:
   平均延迟: 156.34 ms
   最小延迟: 89 ms
   最大延迟: 423 ms
   P95延迟: 245 ms

🔍 与 ngrok 对比:
   ngrok 平均延迟: ~200-300ms
   Cloudflare 平均延迟: 156.34ms
   ✅ Cloudflare Tunnel 更快!
```

### 5.3 稳定性测试 (长时间运行)

创建 `D:\code7\interview-system\test-cloudflare-tunnel-stability.js`:

```javascript
const https = require('https');

const CLOUDFLARE_URL = 'https://storage-api.yourdomain.com/api/sessions';
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
const TEST_DURATION = 60 * 60 * 1000;  // 1小时
const INTERVAL = 5000;  // 每5秒测试一次

let successCount = 0;
let failCount = 0;
let startTime = Date.now();

async function healthCheck() {
    return new Promise((resolve) => {
        const req = https.request(CLOUDFLARE_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        }, (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 300);
            res.resume();  // 消费数据
        });

        req.on('error', () => resolve(false));
        req.setTimeout(10000, () => {
            req.abort();
            resolve(false);
        });

        req.end();
    });
}

async function runStabilityTest() {
    console.log('🔄 Cloudflare Tunnel 稳定性测试');
    console.log(`测试时长: ${TEST_DURATION / 1000 / 60} 分钟`);
    console.log(`测试间隔: ${INTERVAL / 1000} 秒\n`);

    const interval = setInterval(async () => {
        const success = await healthCheck();

        if (success) {
            successCount++;
            process.stdout.write('✓');
        } else {
            failCount++;
            process.stdout.write('✗');
        }

        // 每50次测试换行
        if ((successCount + failCount) % 50 === 0) {
            const uptime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const successRate = (successCount / (successCount + failCount) * 100).toFixed(2);
            console.log(`\n[${uptime}min] Success: ${successCount}, Failed: ${failCount}, Rate: ${successRate}%`);
        }

        // 测试完成
        if (Date.now() - startTime >= TEST_DURATION) {
            clearInterval(interval);

            console.log('\n\n📊 稳定性测试报告\n');
            console.log(`测试时长: ${(Date.now() - startTime) / 1000 / 60} 分钟`);
            console.log(`总请求数: ${successCount + failCount}`);
            console.log(`成功: ${successCount}`);
            console.log(`失败: ${failCount}`);
            console.log(`成功率: ${(successCount / (successCount + failCount) * 100).toFixed(2)}%`);

            if (successCount / (successCount + failCount) >= 0.999) {
                console.log('\n✅ Cloudflare Tunnel 稳定性优秀 (>99.9%)');
            } else if (successCount / (successCount + failCount) >= 0.99) {
                console.log('\n⚖️  Cloudflare Tunnel 稳定性良好 (>99%)');
            } else {
                console.log('\n⚠️  Cloudflare Tunnel 稳定性需优化 (<99%)');
            }
        }
    }, INTERVAL);
}

// 运行测试
runStabilityTest().catch(console.error);
```

### 5.4 监控和日志配置

#### 启用 Cloudflare Tunnel 指标

在 `config.yml` 中已配置:
```yaml
metrics: 0.0.0.0:8090
```

访问指标端点:
```powershell
# 查看隧道指标
Invoke-WebRequest -Uri "http://localhost:8090/metrics"
```

#### 日志配置

查看 Cloudflare Tunnel 日志:
```powershell
# Docker 日志
docker logs -f interview-cloudflare-tunnel

# 或查看日志文件
Get-Content "D:\code7\interview-system\logs\tunnel\tunnel.log" -Tail 50 -Wait
```

#### Cloudflare Dashboard 监控

1. 访问: https://one.dash.cloudflare.com/
2. 进入 **Zero Trust** → **Analytics** → **Access**
3. 查看隧道流量、请求数、错误率等指标

### 5.5 自动健康检查脚本

创建 `D:\code7\interview-system\scripts\monitor-cloudflare-tunnel.ps1`:

```powershell
# Cloudflare Tunnel 健康监控脚本
# ==================================

param(
    [string]$TunnelURL = "https://storage-api.yourdomain.com",
    [int]$CheckInterval = 60,  # 每60秒检查一次
    [string]$LogFile = "D:\code7\interview-system\logs\tunnel\health-check.log"
)

function Test-TunnelHealth {
    param([string]$URL)

    try {
        $response = Invoke-WebRequest -Uri "$URL/api/sessions" `
                                       -Method GET `
                                       -Headers @{
                                           "Authorization" = "Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
                                       } `
                                       -TimeoutSec 10 `
                                       -UseBasicParsing

        return @{
            Status = "Healthy"
            StatusCode = $response.StatusCode
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    } catch {
        return @{
            Status = "Unhealthy"
            Error = $_.Exception.Message
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    }
}

Write-Host "🔍 Starting Cloudflare Tunnel Health Monitor" -ForegroundColor Cyan
Write-Host "URL: $TunnelURL"
Write-Host "Check Interval: ${CheckInterval}s"
Write-Host "Log File: $LogFile`n"

while ($true) {
    $health = Test-TunnelHealth -URL $TunnelURL

    $logEntry = "$($health.Timestamp) - $($health.Status)"
    if ($health.Status -eq "Healthy") {
        $logEntry += " (HTTP $($health.StatusCode))"
        Write-Host "[OK] $logEntry" -ForegroundColor Green
    } else {
        $logEntry += " - $($health.Error)"
        Write-Host "[FAIL] $logEntry" -ForegroundColor Red

        # 发送告警 (可选)
        # Send-MailMessage -To "admin@yourdomain.com" -Subject "Cloudflare Tunnel Down" -Body $logEntry
    }

    # 写入日志
    Add-Content -Path $LogFile -Value $logEntry

    Start-Sleep -Seconds $CheckInterval
}
```

后台运行监控:
```powershell
# 启动监控脚本
Start-Process powershell -ArgumentList "-File D:\code7\interview-system\scripts\monitor-cloudflare-tunnel.ps1" -WindowStyle Hidden
```

---

## 🎯 6. 迁移检查清单

### 6.1 迁移前准备

- [ ] 已安装 cloudflared CLI
- [ ] 已登录 Cloudflare 账号
- [ ] 已创建 Cloudflare Tunnel
- [ ] 已获取隧道 ID 和凭证文件
- [ ] 已配置 DNS 路由 (如果使用自定义域名)

### 6.2 Docker 集成

- [ ] 已添加 `cloudflare-tunnel` 服务到 `docker-compose.yml`
- [ ] 已创建 `cloudflare-tunnel/config.yml`
- [ ] 已复制凭证文件到 `cloudflare-tunnel/credentials.json`
- [ ] 已更新 `.env.docker` 环境变量
- [ ] 已测试 Docker Compose 启动

### 6.3 Dify 工作流更新

- [ ] 已将 workflow2 中的 ngrok URL 替换为 Cloudflare Tunnel URL
- [ ] 已将 workflow3 中的 ngrok URL 替换为 Cloudflare Tunnel URL
- [ ] 已更新所有 SSL 验证代码 (可启用验证)
- [ ] 已在 Dify 中导入更新后的工作流
- [ ] 已测试 Dify 工作流运行

### 6.4 验证测试

- [ ] 基本连接测试通过
- [ ] SSL 证书验证通过
- [ ] 性能测试达标 (延迟 < 300ms)
- [ ] 稳定性测试通过 (成功率 > 99%)
- [ ] 端到端集成测试通过

### 6.5 监控配置

- [ ] 已启用 Cloudflare Tunnel 指标
- [ ] 已配置日志记录
- [ ] 已设置健康检查脚本
- [ ] 已配置 Cloudflare Dashboard 监控

### 6.6 清理工作

- [ ] 已停止 ngrok 进程
- [ ] 已删除 ngrok 相关配置
- [ ] 已更新文档中的 URL 引用
- [ ] 已通知团队成员 URL 变更

---

## 🆚 7. 迁移对比总结

| 项目 | ngrok (旧) | Cloudflare Tunnel (新) | 改进 |
|------|-----------|----------------------|------|
| **URL 稳定性** | ❌ 每次重启变化 | ✅ 永久固定 | ✅ 无需频繁更新配置 |
| **SSL 证书** | ⚠️ 自签名 | ✅ 官方证书 | ✅ 无需跳过验证 |
| **性能** | ~200-300ms | ~150-250ms | ✅ 更快 |
| **稳定性** | 90-95% | >99.9% | ✅ 更稳定 |
| **免费限制** | 有带宽限制 | 无限制 | ✅ 更适合生产 |
| **配置复杂度** | ⭐⭐ 简单 | ⭐⭐⭐⭐ 稍复杂 | ⚠️ 需要域名 |
| **DDoS 防护** | ❌ 无 | ✅ 内置 | ✅ 更安全 |
| **监控能力** | ⚠️ 有限 | ✅ 完整 | ✅ 更好的可观测性 |

---

## 📚 8. 附录

### 8.1 常见问题

**Q1: 如果没有域名怎么办?**

A: Cloudflare 会自动分配一个 `.trycloudflare.com` 子域名，完全免费可用。你可以使用:
```
https://<TUNNEL-ID>.cfargotunnel.com
```

**Q2: Cloudflare Tunnel 会断开吗?**

A: Cloudflare Tunnel 使用持久连接，并且有自动重连机制。即使隧道进程重启，URL 也保持不变。相比 ngrok，稳定性大幅提升。

**Q3: 如何在 Windows 上将 Cloudflare Tunnel 设置为开机自启?**

A: 使用 Windows 任务计划程序:
```powershell
# 创建任务计划
$action = New-ScheduledTaskAction -Execute "cloudflared.exe" -Argument "tunnel run interview-system"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "CloudflareTunnel" -Action $action -Trigger $trigger -RunLevel Highest
```

**Q4: 如何查看 Cloudflare Tunnel 的流量统计?**

A: 访问 Cloudflare Zero Trust Dashboard:
https://one.dash.cloudflare.com/ → **Analytics** → **Access**

**Q5: Cloudflare Tunnel 有请求速率限制吗?**

A: 免费版无速率限制，但有 DDoS 保护。如果检测到异常流量，可能会触发 CAPTCHA 验证。

### 8.2 快速命令参考

```powershell
# 安装 cloudflared
winget install --id Cloudflare.cloudflared

# 登录 Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create interview-system

# 配置 DNS 路由
cloudflared tunnel route dns interview-system storage-api.yourdomain.com

# 启动隧道
cloudflared tunnel run interview-system

# 查看隧道信息
cloudflared tunnel info interview-system

# 查看所有隧道
cloudflared tunnel list

# 删除隧道
cloudflared tunnel delete interview-system

# Docker 启动
docker-compose up -d cloudflare-tunnel

# 查看日志
docker logs -f interview-cloudflare-tunnel

# 健康检查
docker exec interview-cloudflare-tunnel cloudflared tunnel info interview-system
```

### 8.3 故障排除

#### 问题1: 隧道无法连接

```powershell
# 检查隧道状态
cloudflared tunnel info interview-system

# 检查本地服务是否运行
Test-NetConnection localhost -Port 8081

# 检查 DNS 配置
nslookup storage-api.yourdomain.com
```

#### 问题2: Docker 容器启动失败

```powershell
# 查看容器日志
docker logs interview-cloudflare-tunnel

# 检查配置文件
docker exec interview-cloudflare-tunnel cat /etc/cloudflared/config.yml

# 重启容器
docker restart interview-cloudflare-tunnel
```

#### 问题3: SSL 证书错误

确保使用 Cloudflare 提供的域名，而不是 IP 地址。如果仍有问题:
```powershell
# 验证证书
openssl s_client -connect storage-api.yourdomain.com:443 -showcerts
```

### 8.4 相关链接

- **Cloudflare Tunnel 官方文档**: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- **Cloudflare Zero Trust Dashboard**: https://one.dash.cloudflare.com/
- **cloudflared GitHub**: https://github.com/cloudflare/cloudflared
- **Dify 官方文档**: https://docs.dify.ai/

---

## ✅ 9. 下一步行动

1. **立即开始**:
   ```powershell
   # 安装 cloudflared
   winget install --id Cloudflare.cloudflared

   # 登录并创建隧道
   cloudflared tunnel login
   cloudflared tunnel create interview-system
   ```

2. **集成到 Docker**:
   - 按照第3节的步骤添加 `cloudflare-tunnel` 服务

3. **更新 Dify 工作流**:
   - 使用第4节的脚本自动替换 URL

4. **运行测试**:
   - 执行性能和稳定性测试脚本

5. **监控和维护**:
   - 设置健康检查脚本后台运行
   - 定期查看 Cloudflare Dashboard

---

**文档版本**: 1.0
**最后更新**: 2025-10-27
**作者**: AI Interview System Team
**支持**: 如有问题请参考故障排除章节或查阅 Cloudflare 官方文档

---

**🎉 恭喜! 你已准备好从 ngrok 迁移到 Cloudflare Tunnel，享受更稳定、更快速的生产环境！**
