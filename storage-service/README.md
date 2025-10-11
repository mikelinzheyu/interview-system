# Interview Storage Service

基于Spring Boot + Redis的会话存储服务，用于AI面试官工作流。

## 功能

- 存储面试问答数据（session_id + qa_data）
- 根据session_id和question查询标准答案
- 支持Bearer Token认证
- Redis持久化存储，7天自动过期
- Docker容器化部署

## API接口

### 1. 保存会话
```bash
POST /api/sessions
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "sessionId": "uuid",
  "qaData": [
    {
      "question": "问题1",
      "answer": "答案1"
    }
  ],
  "metadata": {}
}
```

### 2. 查询会话/答案
```bash
# 查询整个会话
GET /api/sessions/{sessionId}
Authorization: Bearer {API_KEY}

# 查询特定问题的答案
GET /api/sessions/{sessionId}?question=问题1
Authorization: Bearer {API_KEY}
```

### 3. 删除会话
```bash
DELETE /api/sessions/{sessionId}
Authorization: Bearer {API_KEY}
```

## 快速启动

### 使用Docker Compose（推荐）

1. 设置环境变量：
```bash
export API_KEY="your_api_key_here"
```

2. 启动服务：
```bash
cd storage-service
docker-compose up -d
```

3. 查看日志：
```bash
docker-compose logs -f
```

4. 停止服务：
```bash
docker-compose down
```

### 本地开发

1. 确保已安装Java 17和Maven
2. 启动本地Redis：
```bash
redis-server
```

3. 设置环境变量：
```bash
export API_KEY="test_key_12345"
```

4. 运行应用：
```bash
mvn spring-boot:run
```

## 配置说明

- `API_KEY`: API认证密钥（必须）
- `server.port`: 服务端口（默认8080）
- Redis配置在Docker Compose中自动配置

## 与Dify工作流集成

此服务配合Dify工作流使用：

1. **生成问题阶段**：工作流调用`save_session`节点，将生成的问答对存储到Redis
2. **评分阶段**：工作流调用`load_session`节点，从Redis加载标准答案进行评分

API URL配置在Dify工作流的代码节点中。
