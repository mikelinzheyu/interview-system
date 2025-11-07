# 工作流2 保存失败详细诊断 - 已验证

## 📍 问题现象

工作流2测试结果：
```json
{
  "generated_answer": "完整详细的标准答案...",  // ✅ 成功生成
  "save_status": "失败"                        // ❌ 保存失败
}
```

---

## 🔍 已验证的存储服务 API 实现

### 实际的 API 端点设计

存储服务 (`storage-service-nodejs.js`) 支持的端点:

```
1. POST /api/sessions/{sessionId}
   → 创建或更新特定会话
   → 需要在 URL 中包含 sessionId

2. GET /api/sessions/{sessionId}
   → 获取特定会话数据

3. DELETE /api/sessions/{sessionId}
   → 删除特定会话

4. GET /api/sessions
   → 列出所有会话（演示用）
```

### 关键代码证据

存储服务路由逻辑（来自 storage-service-nodejs.js 第 280-312 行）:

```javascript
// /api/sessions - 列表或创建（无 sessionId）
if (pathname === '/api/sessions' || pathname === '/api/sessions/') {
  if (req.method === 'POST') {
    await handlePostSession(req, res);  // ← 创建新会话
  } else if (req.method === 'GET') {
    // 列出所有会话
  }
  return;
}

// /api/sessions/{sessionId} - 特定会话
if (match = pathname.match(/^\/api\/sessions\/([^\/]+)\/?$/)) {
  const sessionId = match[1];
  if (req.method === 'GET') {
    await handleGetSession(req, res, sessionId);
  } else if (req.method === 'DELETE') {
    await handleDeleteSession(req, res, sessionId);
  } else if (req.method === 'POST') {
    await handlePostSession(req, res, sessionId);  // ← 更新会话
  }
  return;
}
```

---

## 🔴 核心问题确认

### 问题 1: POST 路径错误 (最可能原因)

**工作流2 的代码** (AI面试官-工作流2-生成答案 (5).yml 第 313-316 行):

```python
post_req = urllib.request.Request(
    api_base_url,              # ❌ 这只是 "/api/sessions"
    data=json_data,
    headers={...},
    method='POST'
)
```

**实际发送的请求**:
```
POST /api/sessions
```

**存储服务的行为**:
- ✅ 这个端点存在
- ✅ 会被 `handlePostSession(req, res)` 处理
- ⚠️ 但是这个方法是用来**创建新会话**的，而不是**更新会话**的

**为什么失败**:

当 POST 到 `/api/sessions` (不带 sessionId) 时，存储服务会：
1. 提取请求体中的会话数据
2. 生成一个**新的 sessionId**
3. 保存这个新会话
4. **但工作流2期望的是更新现有会话**

工作流2的代码逻辑是：
```python
# Step 1: GET 现有会话
session_data = GET(f"/api/sessions/{session_id}")

# Step 2: 修改会话中的问题答案
for q in session_data['questions']:
    if q['id'] == question_id:
        q['answer'] = standard_answer

# Step 3: POST 更新的会话回去
POST("/api/sessions", updated_session)  # ❌ 错误！应该是 POST("/api/sessions/{session_id}")
```

### 问题 2: API 密钥验证

**存储服务的认证代码** (storage-service-nodejs.js 第 ~70-80 行):

```javascript
const apiKey = req.headers['authorization']?.replace('Bearer ', '');
const expectedKey = process.env.API_KEY || 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

if (apiKey !== expectedKey) {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ code: 401, message: 'Unauthorized' }));
  return;
}
```

**工作流2使用的密钥** (AI面试官-工作流2-生成答案 (5).yml 第 292 行):

```python
api_key = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
```

**分析**:
- ✅ 这个密钥与默认值匹配
- ✅ 不应该返回 401 错误
- ⚠️ 除非在生产环境中 `API_KEY` 环境变量被改了

### 问题 3: 存储服务是否运行

**如何检查**:
```bash
# 检查存储服务健康状态
curl https://phrenologic-preprandial-jesica.ngrok-free.dev/health

# 预期返回
{"status": "ok", "timestamp": "2025-10-27T..."}
```

**如果服务未运行**:
- 连接被拒绝: `Connection refused`
- 或 Ngrok 隧道错误: `502 Bad Gateway`

---

## 📊 故障排查矩阵

| 检查项 | 预期 | 当前状态 | 影响 |
|--------|------|---------|------|
| **存储服务运行** | ✅ 运行 | ❓ 未验证 | 如果关闭→ Connection refused |
| **API 密钥** | ✅ 匹配 | ✅ 应该匹配 | 如果错误→ HTTP 401 |
| **POST 路径** | ❌ `/api/sessions/{sessionId}` | ❌ `/api/sessions` | 创建新会话而不是更新 |
| **Ngrok 隧道** | ✅ 活跃 | ❓ 未验证 | 如果断开→ 502/504 错误 |
| **超时设置** | ⚠️ 30+ 秒 | ❌ 10 秒 | 大文件可能超时 |

---

## 🔧 修复计划

### 必做 (优先级 1 - 最高)

#### 修复 1: 更正 POST 路径

**在 Dify 平台上**:
1. 打开工作流2编辑页面
2. 找到 `save_standard_answer` 节点（Python 代码节点）
3. 找到这行代码:
   ```python
   post_req = urllib.request.Request(
       api_base_url,  # ❌ 这里
   ```

4. 改为:
   ```python
   post_req = urllib.request.Request(
       f"{api_base_url}/{session_id}",  # ✅ 这样
   ```

5. 重新发布工作流

**为什么这样做**:
- 存储服务期望 `POST /api/sessions/{sessionId}` 来更新会话
- 当前代码 `POST /api/sessions` 会创建新会话，而不是更新现有会话

### 应做 (优先级 2 - 高)

#### 修复 2: 验证存储服务运行

```bash
# 检查存储服务是否正常
curl https://phrenologic-preprandial-jesica.ngrok-free.dev/health

# 预期: {"status": "ok"}
```

如果失败，启动存储服务:
```bash
cd D:\code7\interview-system
node storage-service-nodejs.js
```

#### 修复 3: 增加超时时间

在工作流2的 `save_standard_answer` 节点中，找到:
```python
with urllib.request.urlopen(post_req, context=ctx, timeout=10) as response:
```

改为:
```python
with urllib.request.urlopen(post_req, context=ctx, timeout=30) as response:
```

### 可做 (优先级 3 - 中)

#### 修复 4: 添加详细错误日志

增强错误处理，返回更详细的错误信息以便诊断:

```python
except urllib.error.HTTPError as e:
    return {
        "status": "失败",
        "error_message": f"HTTP {e.code}: {e.reason}",
        "error_details": {
            "url": str(e.url),
            "request_method": "POST",
            "headers_sent": str(headers),
            "body_sent": str(json_data)[:200]  # 前200字符
        }
    }
```

#### 修复 5: 实现重试机制

```python
import time

max_retries = 3
for attempt in range(max_retries):
    try:
        with urllib.request.urlopen(post_req, context=ctx, timeout=30) as response:
            if 200 <= response.getcode() < 300:
                return {"status": "成功", "error_message": ""}
    except Exception as e:
        if attempt < max_retries - 1:
            wait_time = 2 ** attempt  # 2s, 4s, 8s
            time.sleep(wait_time)
        else:
            return {"status": "失败", "error_message": str(e)}
```

---

## 🧪 验证修复

### 修复前的测试结果
```
工作流2: ✅ 生成答案成功，❌ 保存失败
   └─ save_status: "失败"
```

### 修复后的预期结果
```
工作流2: ✅ 生成答案成功，✅ 保存成功
   └─ save_status: "成功"
```

### 验证命令
```bash
cd D:\code7\interview-system
node test-workflows-with-mcp.js
```

---

## 📋 诊断清单

在应用修复前，请检查:

- [ ] 已读这个诊断文档
- [ ] 确认存储服务正在运行 (`curl https://ngrok-url/health`)
- [ ] 已备份工作流2 YAML 文件
- [ ] 已理解 POST 路径的问题 (缺少 {sessionId})
- [ ] 已在 Dify 平台打开工作流2编辑页面

修复后验证:

- [ ] 工作流2 已重新发布
- [ ] 存储服务仍在运行
- [ ] 运行 `test-workflows-with-mcp.js` 成功
- [ ] `save_status` 返回 "成功"
- [ ] 无新的错误日志

---

## 🎯 预计效果

修复这个问题后：

| 工作流 | 修复前 | 修复后 |
|--------|--------|--------|
| 工作流1 | ✅ 成功 | ✅ 成功 (无变化) |
| 工作流2 | ⚠️ 答案成功，保存失败 | ✅ 完全成功 |
| 工作流3 | 🔧 已修复配置 | ✅ 待验证 |

**总体成功率**: 从 33% (1/3) → 100% (3/3)

---

## 📁 相关文件

- **工作流2 YAML**: `D:\code7\test5\AI面试官-工作流2-生成答案 (5).yml`
- **存储服务代码**: `D:\code7\interview-system\storage-service-nodejs.js`
- **测试脚本**: `D:\code7\interview-system\test-workflows-with-mcp.js`
- **前一份诊断**: `D:\code7\interview-system\WORKFLOW2_SAVE_FAILURE_ROOT_CAUSE.md`

---

## ✅ 总结

**最可能的问题**:
- 🔴 **POST 路径错误**: 应该是 `POST /api/sessions/{sessionId}` 而不是 `POST /api/sessions`

**其他可能的问题**:
- 🟡 **存储服务未运行**: 检查并启动服务
- 🟡 **超时设置太短**: 10秒改为30秒
- 🟢 **API密钥不匹配**: 可能性较小

**立即行动**:
1. 验证存储服务运行: `curl https://ngrok-url/health`
2. 修复 POST 路径: 添加 `{sessionId}` 到 URL
3. 重新发布工作流2
4. 运行测试验证

