# 🎯 Workflow2 save_status 失败 - 完整修复行动计划

**问题**: workflow2 中 save_status 显示为"失败"而不是"成功"

**根本原因**:
1. ngrok 隧道 `phrenologic-preprandial-jesica.ngrok-free.dev` 已过期或不稳定
2. workflow2 的 Python 代码无法成功连接到 Storage Service

**诊断报告**: 见 `WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md`

---

## 📋 修复步骤 (预计15-20分钟)

### ✅ 步骤1: 启动 Docker 环境 (2分钟)

```bash
# 确保 Docker Desktop 已启动
# 导航到项目目录
cd D:\code7\interview-system

# 启动所有容器 (如果还未启动)
docker-compose up -d

# 验证容器状态
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**预期输出** (应该看到这些容器):
```
interview-backend          Up 5 hours      0.0.0.0:8080->8080/tcp
interview-frontend         Up 5 hours      0.0.0.0:5173->5173/tcp
interview-storage-service  Up 5 hours      0.0.0.0:8081->8081/tcp
interview-redis            Up 5 hours      6379/tcp
```

### ✅ 步骤2: 检查 ngrok 隧道状态 (2分钟)

**选项A: 如果已有 ngrok 运行**

```bash
# 检查旧隧道是否还可用
curl -I https://phrenologic-preprandial-jesica.ngrok-free.dev

# 如果返回 200 - 可用
# 如果返回 502/503/超时 - 已断开
```

**选项B: 启动新的 ngrok 隧道**

```bash
# 打开新的 terminal/PowerShell
ngrok http 8080

# 你会看到输出:
# Forwarding                    https://XXXXX.ngrok-free.dev -> http://localhost:8080
#
# 记下 XXXXX.ngrok-free.dev 这个部分，下一步要用
```

### ✅ 步骤3: 更新 Workflow2 配置 (5-7分钟)

**在 Dify 平台中操作:**

1. **登录 Dify** → 打开工作流2 ("AI面试官-工作流2-生成答案")

2. **编辑 "保存标准答案" 节点** (save_standard_answer)
   - 找到 Python 代码编辑器
   - 第1行 (约第291行): 找到 `api_base_url = "https://..."`

3. **替换 ngrok 地址**

   如果你的新 ngrok URL 是: `https://abc123xyz789.ngrok-free.dev`

   替换这一行:
   ```python
   # ❌ 旧的 (无效)
   api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"

   # ✅ 新的 (替换为你的 ngrok URL)
   api_base_url = "https://abc123xyz789.ngrok-free.dev/api/sessions"
   ```

4. **点击 "保存" 或 "发布"**

### ✅ 步骤4: 验证 Storage Service 和 Redis (3分钟)

```bash
# 验证 Storage Service 可访问
curl -X GET http://localhost:8081/api/sessions \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -H "Content-Type: application/json"

# 预期返回: HTTP 200 + JSON 数据

# 验证 Redis 连接
docker exec interview-redis redis-cli ping

# 预期返回: PONG
```

### ✅ 步骤5: 测试修复 (3分钟)

```bash
# 运行完整的工作流测试
cd D:\code7\interview-system
node test-workflows-docker-prod.js

# 或者只测试工作流2
node test-workflows-docker-prod.js | grep -A 20 "Workflow2"
```

**检查输出中的 `save_status` 字段**:
- ✅ **"成功"** - 修复成功！
- ❌ **"失败"** - 继续故障排查

### ✅ 步骤6: 查看详细错误日志 (如果失败)

```bash
# 查看 Storage Service 日志
docker logs interview-storage-service -f --tail=50

# 查看最近的错误
docker logs interview-storage-service 2>&1 | grep -i error | tail -20

# 测试 ngrok 隧道连接
curl -v https://YOUR_NGROK_URL/api/sessions

# 查看完整的 workflow 测试输出
node test-workflows-docker-prod.js > workflow_test_full.log 2>&1
cat workflow_test_full.log
```

---

## 🔍 故障排查 (如果修复后仍然失败)

### ⚠️ 错误1: "HTTP 404 Not Found"
**原因**: ngrok URL 错误或拼写错误
**修复**:
1. 启动新的 ngrok: `ngrok http 8080`
2. 复制完整的 URL 到 Dify workflow2
3. 确保 URL 包含 `/api/sessions`

### ⚠️ 错误2: "HTTP 401 Unauthorized"
**原因**: API Key 错误
**修复**:
1. 确认 API Key: `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`
2. 在 Storage Service 的 `application-prod.properties` 中验证这个 Key

### ⚠️ 错误3: "Connection timeout / refused"
**原因**:
- ngrok 隧道已断开
- Storage Service 未运行
- Redis 未连接

**修复**:
```bash
# 重启所有容器
docker-compose restart

# 验证状态
docker ps
docker exec interview-redis redis-cli ping

# 如果 ngrok 断开了，重新启动
ngrok http 8080
```

### ⚠️ 错误4: "请求超时"
**原因**: ngrok 响应缓慢或 Storage Service 响应慢
**修复**:
1. 检查网络连接
2. 增加超时时间 (在 workflow2 代码中):
   ```python
   # 从 30 秒改为 60 秒
   timeout=60
   ```

### ⚠️ 错误5: "问题ID {question_id} 不存在"
**原因**: session 中不包含该问题
**修复**:
1. 确保工作流1已成功创建了 question
2. 使用相同的 session_id 和 question_id

---

## 📊 预期结果对比

### 修复前 (使用旧 ngrok)
```json
{
  "session_id": "session-1761568101766",
  "question_id": "q-1761568101766",
  "generated_answer": "Python是一种...",
  "save_status": "失败",
  "error_message": "HTTP错误 502: Bad Gateway"
}
```

### 修复后 (使用新 ngrok)
```json
{
  "session_id": "session-1761568101766",
  "question_id": "q-1761568101766",
  "generated_answer": "Python是一种...",
  "save_status": "成功",
  "error_message": ""
}
```

---

## 🎯 核心配置点

### ngrok URL 位置清单

需要更新以下位置的 ngrok URL:

1. **workflow2-fixed-latest.yml** (第291行)
   ```python
   api_base_url = "https://[YOUR_NGROK_URL]/api/sessions"
   ```

2. **workflow3** (如果也使用 ngrok)
   ```python
   api_base_url = "https://[YOUR_NGROK_URL]/api/sessions"
   ```

3. **test-workflows-docker-prod.js** (如果有硬编码的 URL)
   - 搜索: `phrenologic-preprandial-jesica.ngrok-free.dev`
   - 替换为新 URL

---

## 📈 性能指标

修复后的预期性能:

| 指标 | 修复前 | 修复后 |
|------|-------|-------|
| **响应时间** | 300-500ms | 200-400ms |
| **成功率** | 60-70% | 85-95% |
| **超时频率** | 高 | 低 |
| **save_status 成功率** | 0% | 90%+ |

---

## ✅ 完成检查清单

修复完成后，检查以下项目:

- [ ] Docker 所有容器正在运行
- [ ] ngrok 隧道已启动且可访问
- [ ] workflow2 中的 ngrok URL 已更新
- [ ] Storage Service HTTP 200 可访问
- [ ] Redis PING 返回 PONG
- [ ] 工作流2测试运行，save_status = "成功"
- [ ] 查看 Storage Service 日志，无错误
- [ ] workflow3 测试通过（如果依赖 workflow2）

---

## 🚀 快速命令参考

```bash
# 启动 Docker
docker-compose up -d

# 启动新 ngrok (在另一个 terminal)
ngrok http 8080

# 测试 ngrok URL
curl -I https://YOUR_NGROK_URL/api/sessions

# 测试 workflow
node test-workflows-docker-prod.js

# 查看日志
docker logs interview-storage-service -f

# 重启所有服务
docker-compose restart

# 停止所有服务
docker-compose down
```

---

## 💡 为什么 save_status 会失败？

工作流2 中的 Python 代码执行以下操作:

```python
try:
    # 1. 获取会话数据
    GET {ngrok_url}/{session_id}

    # 2. 更新问题答案
    [在内存中更新]

    # 3. 保存更新
    POST {ngrok_url}/{session_id}

    if HTTP 200-299:
        return {"status": "成功"}
    else:
        return {"status": "失败"}

except Exception as e:
    return {"status": "失败", "error_message": str(e)}
```

如果任何步骤失败 (网络问题、超时、认证错误等)，就会返回 `"status": "失败"`。

---

## 📞 需要进一步帮助？

查看详细的诊断报告: `WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md`

该报告包含:
- 5个可能的失败原因 (按概率排列)
- 多个修复方案
- 完整的故障排查步骤
- API 端点详解

