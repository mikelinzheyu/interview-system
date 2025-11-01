# Dify工作流测试 - 故障排除指南

**日期**: 2025-10-24
**状态**: 诊断与恢复

---

## 📋 当前系统状态

### ✅ 正常运行的组件
- ✅ ngrok隧道: `https://phrenologic-preprandial-jesica.ngrok-free.dev`
- ✅ Dify API: `https://api.dify.ai/v1/workflows/run`
- ✅ Docker容器状态

### ⚠️ 需要修复的问题

**问题1: 存储API Redis连接失败**
```
Error: Unable to connect to Redis
Container: interview-storage-api
```

**问题2: 工作流返回空数据**
```
Response: {
  "session_id": "",
  "questions": "[]",
  "question_count": 0
}
```

**问题3: 存储服务运行在独立的docker-compose中**
- 主项目docker-compose.yml中的Redis和存储API在不同网络

---

## 🔍 根本原因分析

### Docker网络配置问题

**当前架构:**
```
主项目: docker-compose.yml
├── 网络: interview-network
├── Redis: interview-redis (172.19.0.3)
├── 前端: interview-frontend
└── 后端: interview-backend

存储服务: storage-service/docker-compose.yml
├── 网络: 独立网络 (production_interview-network)
├── Redis: interview-redis (容器内)
├── API: interview-storage-api (8090:8080)
└── 期望连接: redis://redis:6379 (内部)
```

**问题:**
- 存储API容器在 `production_interview-network` 网络
- 期望连接到 `redis` 容器（通过容器名称）
- 但Redis连接配置到IP `172.25.0.5` 导致失败

---

## ✅ 快速修复步骤

### 方案A: 使用现有的Docker Compose（推荐）

**步骤1: 停止存储服务**
```bash
cd D:\code7\interview-system\storage-service
docker-compose down
```

**步骤2: 确保主项目的存储API运行**
```bash
cd D:\code7\interview-system
docker-compose up -d interview-storage-api
```

**步骤3: 验证存储API运行**
```bash
docker ps | grep interview-storage-api
# 应该看到: interview-storage-api ... 0.0.0.0:8090->8080/tcp
```

**步骤4: 验证本地存储API连接**
```bash
curl -X POST http://localhost:8090/api/sessions \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","jobTitle":"测试","questions":[]}'
```

**期望返回:**
```json
{
  "success": true,
  "sessionId": "test",
  "message": "Session saved successfully"
}
```

---

### 方案B: 修复存储服务的Docker Compose

**修改**: `storage-service/docker-compose.yml`

**找到这一行:**
```yaml
# 第25-26行
- spring.data.redis.host=redis
- spring.data.redis.port=6379
```

**更改为:**
```yaml
# 使用外部Redis IP
- spring.data.redis.host=interview-redis
- spring.data.redis.port=6379
```

**然后重启:**
```bash
cd D:\code7\interview-system\storage-service
docker-compose up -d
```

---

## 🧪 完整验证流程

### 步骤1: 本地存储API测试
```bash
cd D:\code7\interview-system
node test-storage-direct.js
```

**期望输出:**
```
✅ 本地存储API工作正常！
✅ ngrok隧道工作正常！
```

### 步骤2: 检查Dify工作流代码是否保存

访问: `https://cloud.dify.ai`

对于每个工作流，检查Python节点：
- 工作流1 > 节点"保存问题列表" > 确认代码包含 `STORAGE_API_URL = "...ngrok..."`
- 工作流2 > 节点"保存标准答案" > 同上
- 工作流3 > 节点评分 > 同上

**问题**: 如果代码是空的或没有ngrok URL，说明修改没有保存。

**解决方案**:
1. 重新复制代码
2. 粘贴到Dify编辑器
3. 点击"保存"
4. 点击"发布工作流"
5. **等待2-3秒让Dify完成发布**

### 步骤3: 运行完整测试
```bash
node test-workflows-complete.js
```

**期望输出:**
```
✅ 工作流1完成！
   - Session ID: abc123...
   - 生成问题数: 5

✅ 工作流2完成！
   - 保存状态: 成功

✅ 工作流3完成！
   - 综合评分: 75/100

✅ 存储服务: 数据正确保存和读取
```

---

## 🔧 单个组件测试

### 测试1: ngrok隧道
```bash
curl https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -k  # 忽略SSL证书
```

### 测试2: 本地存储API
```bash
curl http://localhost:8090/api/sessions \
  -X POST \
  -H "Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","jobTitle":"test","questions":[]}'
```

### 测试3: Dify API
```bash
curl https://api.dify.ai/v1/workflows/run \
  -X POST \
  -H "Authorization: Bearer app-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {"job_title": "Python开发"},
    "response_mode": "blocking",
    "user": "test"
  }'
```

### 测试4: Redis连接
```bash
docker exec interview-redis redis-cli ping
# 应该返回: PONG

docker exec interview-storage-api redis-cli -h redis ping
# 应该返回: PONG
```

---

## 📊 诊断检查清单

- [ ] ngrok隧道正在运行且可访问
- [ ] 本地存储API在localhost:8090上响应
- [ ] Redis容器运行正常
- [ ] 存储API可以连接到Redis
- [ ] Dify工作流中的Python节点代码已更新（包含ngrok URL）
- [ ] Dify工作流已发布
- [ ] 工作流测试返回有效数据

---

## 🚨 常见错误及解决方案

### 错误1: "Unable to connect to Redis"
**原因**: 存储API容器无法连接到Redis

**解决**:
1. 检查Redis是否运行: `docker ps | grep redis`
2. 检查网络: `docker network ls`
3. 检查环境变量: `docker inspect interview-storage-api | grep REDIS`

### 错误2: "API接口不存在" (404)
**原因**: ngrok隧道指向错误的服务

**解决**:
1. 重新启动ngrok: `ngrok http 8090`
2. 验证隧道URL: `curl http://localhost:4040/api/tunnels`
3. 更新Dify工作流中的URL

### 错误3: 工作流返回空数据
**原因**: Dify工作流中的Python节点代码没有正确保存或发布

**解决**:
1. 重新打开工作流编辑器
2. 检查Python节点代码是否存在
3. 如果代码为空，重新复制并粘贴
4. 点击"保存"和"发布"
5. 等待3秒后再测试

### 错误4: SSL证书错误
**原因**: ngrok使用自签名证书

**解决**: 代码中已包含 `rejectUnauthorized: false` 和 `verify=False`

---

## 📞 获取更多帮助

### 日志文件
```bash
# Docker容器日志
docker logs interview-storage-api

# ngrok日志
curl http://localhost:4040/api/tunnels

# 系统状态检查
node check-system-status.js
```

### 相关文档
- DIFY_UPDATE_GUIDE.md - Dify工作流更新指南
- DIFY_UPDATE_VISUAL_GUIDE.md - 图文版更新指南
- NGROK_TUNNEL_READY.md - ngrok配置指南

---

## ✨ 预期最终状态

完全修复后：

```
╔════════════════════════════════════════════╗
║     Dify工作流系统 - 正常运行              ║
╠════════════════════════════════════════════╣
║                                            ║
║  🟢 工作流1 (生成问题)      ✅ 运行正常    ║
║  🟢 工作流2 (生成答案)      ✅ 运行正常    ║
║  🟢 工作流3 (评分)          ✅ 运行正常    ║
║                                            ║
║  🟢 ngrok隧道              ✅ 连接正常    ║
║  🟢 存储API                ✅ 响应正常    ║
║  🟢 Redis                  ✅ 连接正常    ║
║                                            ║
╚════════════════════════════════════════════╝
```

测试输出示例:
```
✅ 工作流1完成！
   - Session ID: abc123def456-1729040000
   - 生成问题数: 5
   - 职位: Python后端开发工程师

✅ 工作流2完成！
   - 保存状态: 成功
   - 生成答案长度: 450 字符

✅ 工作流3完成！
   - 综合评分: 78/100
   - 综合评价: 很好的回答...

✅ 存储服务: 数据正确保存和读取
```

---

**最后更新**: 2025-10-24 08:42 UTC
**作者**: 系统诊断工具
**版本**: v1.0 - 完整故障排除指南
