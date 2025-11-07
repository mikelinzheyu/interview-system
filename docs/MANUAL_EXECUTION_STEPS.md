# 🚀 工作流2 修复 - 手动执行步骤指南

由于当前环境中 Docker 未启动，您需要按照下面的步骤手动执行修复。

---

## 📋 执行步骤

### ✅ 步骤1: 启动 Docker Desktop (5分钟)

1. **打开 Windows 开始菜单**
   - 按 `Win` 键或点击左下角的 Windows 图标

2. **搜索 "Docker Desktop"**
   - 输入 "Docker"
   - 点击 "Docker Desktop"

3. **等待 Docker 完全启动**
   - Docker Desktop 会显示一个图标在系统托盘
   - 等待它显示 "Docker is running"
   - 这通常需要 30-60 秒

4. **验证 Docker 已启动**
   ```bash
   # 打开 PowerShell 或 CMD，运行：
   docker ps
   ```
   如果看到容器列表或 "CONTAINER ID" 表头，说明 Docker 已正常运行。

---

### ✅ 步骤2: 启动所有容器 (3分钟)

在 PowerShell 或 CMD 中运行：

```bash
cd D:\code7\interview-system
docker-compose up -d
```

**预期输出**:
```
[+] Running 5/5
  ✔ Container interview-redis              Running
  ✔ Container interview-backend            Running
  ✔ Container interview-storage-service    Running
  ✔ Container interview-frontend           Running
  ✔ Container nginx                        Running
```

**验证所有容器都在运行**:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

应该看到类似：
```
NAMES                          STATUS          PORTS
interview-redis                Up 2 minutes    6379/tcp
interview-backend              Up 2 minutes    0.0.0.0:8080->8080/tcp
interview-storage-service      Up 2 minutes    0.0.0.0:8081->8081/tcp
interview-frontend             Up 2 minutes    0.0.0.0:5173->5173/tcp
```

---

### ✅ 步骤3: 启动新的 ngrok 隧道 (5分钟)

**在另一个 PowerShell/CMD terminal 中**运行：

```bash
ngrok http 8080
```

**该命令的输出看起来像这样**:
```
ngrok                                       (Ctrl+C to quit)

Session Status                online
Account                       zheyulin676@gmail.com (Plan: Free)
Update                        update available (version 3.32.0, Ctrl-U to update)
Version                       3.31.0
Region                        Asia Pacific (ap)
Latency                        392ms
Web Interface                  http://127.0.0.1:4040

Forwarding                     https://abc123xyz789.ngrok-free.dev -> http://localhost:8080
```

**📝 记下公网 URL**: `https://abc123xyz789.ngrok-free.dev`

**重要**: 保持这个 terminal 窗口打开，不要关闭！

---

### ✅ 步骤4: 更新 Dify 中的 workflow2 配置 (5-7分钟) ⭐ 最关键

这是最重要的一步，需要手动在 Dify 平台中操作。

#### 4.1 登录 Dify

- 打开浏览器
- 访问你的 Dify 实例 (通常是 https://dify.ai 或你的私有部署)
- 使用你的账号登录

#### 4.2 打开 workflow2

- 在 Dify 工作室中
- 找到并打开 **"AI面试官-工作流2-生成答案"** workflow

#### 4.3 编辑 "保存标准答案" 节点

在 workflow 编辑器中：

1. 找到 **"保存标准答案"** 节点 (save_standard_answer)
   - 这是最后一个节点，在 "生成标准答案" 和 "结束" 之间

2. **点击进入代码编辑**
   - 双击或点击编辑按钮进入 Python 代码编辑器

3. **找到这一行** (通常在第一行):
   ```python
   api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
   ```

#### 4.4 替换为新的 ngrok URL

将上面的行替换为你的新 URL：

```python
api_base_url = "https://abc123xyz789.ngrok-free.dev/api/sessions"
```

**完整的修改示例**:

```python
# ❌ 旧的 (删除)
api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"

# ✅ 新的 (替换为你的 ngrok URL)
api_base_url = "https://abc123xyz789.ngrok-free.dev/api/sessions"
```

#### 4.5 保存

- 点击 "保存" 或 "发布" 按钮
- 等待保存完成

---

### ✅ 步骤5: 验证配置 (3分钟)

在 PowerShell/CMD 中运行以下命令来验证所有配置：

```bash
# 验证 Redis 连接
docker exec interview-redis redis-cli ping

# 预期输出: PONG
```

```bash
# 验证 ngrok 隧道是否可访问
curl -I https://abc123xyz789.ngrok-free.dev/api/sessions

# 预期输出中应该包含 HTTP 状态码，例如:
# HTTP/1.1 401 Unauthorized
# 或
# HTTP/1.1 400 Bad Request
# (401 或 400 表示隧道通达，只是 API 请求有问题，这是正常的)

# 如果看到 502, 503, 超时或连接被拒绝 → ngrok 隧道有问题
```

---

### ✅ 步骤6: 运行工作流测试 (3分钟)

在 PowerShell/CMD 中运行：

```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

**查看输出中的 `save_status` 字段**:

#### 如果看到 "成功" ✅

```json
{
  "session_id": "session-xxx",
  "question_id": "q-xxx",
  "generated_answer": "Python是一种...",
  "save_status": "成功",
  "error_message": ""
}
```

**恭喜！修复成功！** 🎉

#### 如果仍然是 "失败" ❌

```json
{
  "save_status": "失败",
  "error_message": "..."
}
```

需要进行故障排查，见下一部分。

---

## 🚨 修复后仍然失败？故障排查

如果 `save_status` 仍然是 "失败"，请按照这个顺序检查：

### 1️⃣ ngrok 隧道是否仍在运行？

```bash
curl -I https://YOUR_NGROK_URL/api/sessions
```

- 如果看到 HTTP 错误 → ngrok 隧道连接正常
- 如果看到 "连接被拒绝" 或超时 → ngrok 隧道已断开

**解决**: 重新启动 ngrok：
```bash
# 关闭当前的 ngrok (Ctrl+C)
# 然后重新运行
ngrok http 8080
# 获取新 URL，再次更新 Dify 中的 workflow2
```

### 2️⃣ Storage Service 是否运行？

```bash
docker ps | findstr storage-service
```

应该显示：
```
interview-storage-service    interview-system/storage-service:latest    Up 5 minutes    0.0.0.0:8081->8081/tcp
```

**解决**: 如果未显示，重启 Storage Service：
```bash
docker-compose up -d storage-service
```

### 3️⃣ Redis 是否连接正常？

```bash
docker exec interview-redis redis-cli ping
```

应该返回: `PONG`

**解决**: 如果失败，重启 Redis：
```bash
docker-compose restart interview-redis
```

### 4️⃣ 查看详细的 Storage Service 日志

```bash
docker logs interview-storage-service -f --tail=50
```

寻找错误信息，例如：
- `401 Unauthorized` → API Key 问题
- `404 Not Found` → API 路径错误
- `500 Internal Server` → 服务内部错误

### 5️⃣ 检查 Dify 中的 workflow2 URL 是否正确

再次检查：
- ✅ 是否在 "保存标准答案" 节点？
- ✅ API 基础 URL 是否以 `https://` 开头？
- ✅ 是否以 `/api/sessions` 结尾？
- ✅ ngrok URL 是否正确（没有多余空格或特殊字符）？
- ✅ 是否点击了"保存"按钮？

---

## 💡 常见问题

**Q: ngrok 隧道经常断开怎么办？**

A: 这是 ngrok 免费版的已知问题。解决方案：
- 升级到 ngrok Pro ($5/月)
- 使用 Cloudflare Tunnel (免费)
- 使用 Docker 内部网络 (如果 Dify 在 Docker 内)

**Q: 如何知道我的 ngrok URL 是什么？**

A: 运行 `ngrok http 8080` 后，查看输出中的 "Forwarding" 行

**Q: 我修改错了 Dify 中的代码怎么办？**

A: 您可以：
- 撤销更改（Ctrl+Z）
- 或者恢复原来的旧 ngrok URL
- 或者重新加载页面

**Q: Storage Service 为什么显示 401 Unauthorized？**

A: API Key 可能不匹配。检查：
- Dify 中的 API Key: `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`
- Storage Service 配置中的 API Key (application-prod.properties)

---

## ✅ 完成检查清单

修复完成后，确认以下项目都已完成：

- [ ] Docker Desktop 已启动并运行
- [ ] 所有容器都在运行 (docker ps 显示5个容器)
- [ ] ngrok 隧道已启动并显示 "Forwarding" 地址
- [ ] Dify 中的 workflow2 已更新新 ngrok URL
- [ ] Dify 中的 workflow2 已保存
- [ ] Redis PING 返回 PONG
- [ ] ngrok 隧道可以访问 (curl 不超时)
- [ ] 工作流测试运行，save_status = "成功"
- [ ] Storage Service 日志无错误

---

## 🎯 快速参考命令

```bash
# 启动 Docker 容器
docker-compose up -d

# 检查容器状态
docker ps

# 启动 ngrok 隧道
ngrok http 8080

# 验证 Redis
docker exec interview-redis redis-cli ping

# 查看 Storage Service 日志
docker logs interview-storage-service -f

# 运行工作流测试
cd D:\code7\interview-system
node test-workflows-docker-prod.js

# 重启所有容器
docker-compose restart

# 停止所有容器
docker-compose down
```

---

## 📞 需要帮助？

查看诊断报告了解更多详情：
- `WORKFLOW2_FIX_ACTION_PLAN.md` - 完整的行动计划
- `WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md` - 深度诊断报告
- `WORKFLOW2_DIAGNOSIS_INDEX.md` - 文档索引

祝修复顺利！🚀

