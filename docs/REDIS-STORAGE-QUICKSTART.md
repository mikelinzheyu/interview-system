# Redis存储服务快速开始指南

## 5分钟快速启动

### 第一步：启动存储服务

**Windows**:
```bash
cd storage-service
.\start-storage-service.bat
```

**Linux/Mac**:
```bash
cd storage-service
chmod +x start-storage-service.sh
./start-storage-service.sh
```

等待服务启动（约30秒），看到以下输出表示成功：
```
Service is starting...
Redis: redis://localhost:6379
API: http://localhost:8080
```

### 第二步：测试服务

在项目根目录运行：
```bash
node test-redis-storage.js
```

看到 `🎉 所有测试通过！` 表示集成成功。

### 第三步：在Dify中导入工作流

1. 打开Dify平台
2. 导入工作流文件：`AI-Interview-Workflow-WithRedis.yml`
3. 工作流中的API已配置好，无需修改

### 第四步：测试完整流程

#### 生成面试问题

在Dify中运行工作流，输入：
- **职位名称**: Python后端工程师
- **请求类型**: generate_questions
- 其他字段留空

工作流会：
1. 搜索职位信息
2. 生成5个面试问题
3. 为每个问题生成标准答案
4. 保存到Redis
5. 返回 `session_id`

#### 评分候选人回答

使用上一步返回的 `session_id`，输入：
- **请求类型**: score_answer
- **会话ID**: 上一步返回的session_id
- **面试问题**: 从生成的问题中选一个
- **候选人回答**: 输入测试答案

工作流会：
1. 从Redis加载标准答案
2. 对比候选人回答
3. 生成综合评价
4. 给出0-100分的评分

## 常见问题

### Q1: 服务启动失败

**检查Docker是否运行**:
```bash
docker info
```

如果Docker未运行，请启动Docker Desktop。

**检查端口占用**:
```bash
# Windows
netstat -ano | findstr 8080

# Linux/Mac
lsof -i :8080
```

### Q2: 测试脚本连接失败

**等待服务完全启动**:
服务启动需要30秒左右，请等待后再运行测试。

**检查服务状态**:
```bash
cd storage-service
docker-compose ps
```

应该看到两个服务都是 `Up` 状态。

### Q3: Dify工作流调用失败

**本地环境**:
如果Dify在云端，无法访问 `localhost:8080`，需要使用ngrok暴露服务：

```bash
ngrok http 8080
```

然后修改工作流中的API URL为ngrok提供的URL。

**检查API Key**:
确保工作流代码节点中的API Key与服务配置一致：
```python
api_key = "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
```

## 目录结构

```
interview-system/
├── storage-service/                      # Redis存储服务
│   ├── src/                             # Java源代码
│   ├── docker-compose.yml               # Docker配置
│   ├── start-storage-service.bat        # Windows启动脚本
│   └── start-storage-service.sh         # Linux/Mac启动脚本
├── AI-Interview-Workflow-WithRedis.yml  # Dify工作流配置
├── test-redis-storage.js                # 集成测试脚本
├── REDIS-STORAGE-INTEGRATION.md         # 详细集成文档
└── REDIS-STORAGE-QUICKSTART.md          # 本文件
```

## 下一步

详细文档请参考：
- `storage-service/README.md` - 存储服务文档
- `REDIS-STORAGE-INTEGRATION.md` - 完整集成指南

## 架构图

```
┌─────────────────┐
│   Dify 工作流    │
│                 │
│  ┌───────────┐  │
│  │ 生成问题   │──┼──> POST /api/sessions
│  └───────────┘  │    (保存问答对)
│                 │
│  ┌───────────┐  │
│  │ 评分回答   │──┼──> GET /api/sessions/{id}?question=xxx
│  └───────────┘  │    (获取标准答案)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Storage Service │
│  (Spring Boot)  │
│                 │
│  ┌───────────┐  │
│  │   Redis   │  │
│  │  (持久化)  │  │
│  └───────────┘  │
└─────────────────┘
```

## 成功标志

✅ `docker-compose ps` 显示两个服务都在运行
✅ `node test-redis-storage.js` 所有测试通过
✅ Dify工作流可以成功生成问题并返回session_id
✅ Dify工作流可以根据session_id进行评分

恭喜！你已经成功集成Redis存储服务！
