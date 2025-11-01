# 🔧 Workflow2 ngrok 修复方案

## 📊 问题分析

**当前现象**: workflow2 中 save_status = "失败"

**根本原因**: 
1. ngrok 隧道地址: `https://phrenologic-preprandial-jesica.ngrok-free.dev`
2. 这个隧道可能已过期或不稳定
3. workflow2 的 Python 代码无法成功调用 Storage Service API

## ✅ 解决方案

### 方案分析

我们有两个选择：

**选项1: 使用新的 ngrok 隧道** (需要重新生成)
- 优点: 保持当前架构
- 缺点: ngrok 免费版限流多、不稳定
- 实施时间: 5 分钟

**选项2: 使用 Docker 内部网络** (推荐)
- 优点: 更稳定、更快、更安全
- 缺点: 只能在 Docker 容器内访问
- 实施时间: 10 分钟

## 🎯 建议实施步骤

### 第一步: 检查当前 ngrok 隧道状态

```bash
# 检查 ngrok 是否运行
curl -I https://phrenologic-preprandial-jesica.ngrok-free.dev

# 如果返回 502/503/超时 - 隧道已坏
# 如果返回 200 - 隧道仍可用
```

### 第二步: 如果使用 ngrok，需要更新为新地址

1. **启动新的 ngrok 隧道** (Windows):
```bash
ngrok http 8080
```

2. **记下新的公网 URL**，例如:
```
https://abc123def456.ngrok-free.dev
```

3. **更新 workflow2** 中的 API 地址:
   - 登录 Dify
   - 打开 workflow2
   - 编辑 "保存标准答案" 节点
   - 替换 URL:
```python
# 旧的
api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"

# 新的 (替换为你的新 ngrok URL)
api_base_url = "https://abc123def456.ngrok-free.dev/api/sessions"
```

### 第三步: 测试修复

```bash
node test-workflows-docker-prod.js
```

检查输出中 save_status 是否为 "成功"

---

## 🏗️ 架构对比

### 当前架构 (ngrok)
```
Dify Workflow2 → ngrok 隧道 → 本地 http://localhost:8080 → Storage Service (Docker)
                  延迟: 200-500ms
                  稳定性: 60-70% (免费版限流)
```

### 推荐架构 (Docker 内部)
```
Dify Workflow2 → Docker 网络 → Storage Service 容器
                延迟: 10-50ms
                稳定性: 99%+
```

如果要用推荐架构，在 Dify 中配置应该是：
- 如果 Dify 也在 Docker 中: `http://interview-storage-service:8081/api/sessions`
- 如果 Dify 在外部: 需要保留 ngrok 或使用其他隧道

---

## 📋 检查清单

修复后验证：
- [ ] ngrok 隧道可访问 (curl 返回 200)
- [ ] workflow2 中的 API 地址已更新
- [ ] Storage Service 容器正在运行
- [ ] Redis 容器正在运行
- [ ] 测试 workflow2，save_status = "成功"
- [ ] 检查 Storage Service 日志无错误

---

## 🚀 快速命令

**启动新 ngrok 隧道:**
```bash
ngrok http 8080
```

**测试 workflow:**
```bash
cd D:\code7\interview-system
node test-workflows-docker-prod.js
```

**查看 Storage Service 日志:**
```bash
docker logs interview-storage-service -f
```

**查看 Redis 连接:**
```bash
docker exec interview-redis redis-cli ping
```

