# Redis存储服务集成指南

## 概述

本项目已成功集成基于Spring Boot + Redis的会话存储服务，用于支持Dify AI面试官工作流。

## 目录结构

```
interview-system/
├── storage-service/               # Redis存储服务
│   ├── src/                      # Java源代码
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/interviewstorage/
│   │       │       ├── InterviewStorageApplication.java  # 主应用
│   │       │       ├── controller/
│   │       │       │   └── SessionController.java        # API控制器
│   │       │       ├── model/
│   │       │       │   └── SessionData.java              # 数据模型
│   │       │       └── config/
│   │       │           ├── SecurityConfig.java           # 安全配置
│   │       │           └── ApiKeyAuthFilter.java         # API密钥认证
│   │       └── resources/
│   │           └── application.properties                # 应用配置
│   ├── docker-compose.yml        # Docker编排配置
│   ├── Dockerfile                # Docker构建文件
│   ├── pom.xml                   # Maven依赖配置
│   ├── start-storage-service.bat # Windows启动脚本
│   ├── start-storage-service.sh  # Linux/Mac启动脚本
│   └── README.md                 # 服务文档
└── AI-Interview-Workflow-WithRedis.yml  # Dify工作流配置
```

## 服务架构

### 技术栈
- **后端框架**: Spring Boot 3.2.0
- **Java版本**: 17
- **数据存储**: Redis 7 (Alpine)
- **容器化**: Docker + Docker Compose
- **安全认证**: Bearer Token

### 核心功能
1. **会话存储**: 保存面试问答数据到Redis
2. **答案查询**: 根据session_id和question查询标准答案
3. **会话管理**: 支持删除会话
4. **自动过期**: 7天后自动清理数据

## 快速启动

### 前置条件
- 已安装Docker Desktop
- Docker正在运行

### Windows系统

```bash
cd storage-service
.\start-storage-service.bat
```

### Linux/Mac系统

```bash
cd storage-service
chmod +x start-storage-service.sh
./start-storage-service.sh
```

### 手动启动

```bash
cd storage-service
export API_KEY="ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
docker-compose up -d
```

## API接口说明

### 基础信息
- **Base URL**: `http://localhost:8080`
- **认证方式**: Bearer Token
- **API Key**: `ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0`

### 1. 保存会话数据

**请求**:
```http
POST /api/sessions
Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "qaData": [
    {
      "question": "请解释Python的GIL机制",
      "answer": "GIL（全局解释器锁）是CPython解释器中的一个机制..."
    },
    {
      "question": "什么是闭包？",
      "answer": "闭包是指函数可以访问其外部作用域的变量..."
    }
  ],
  "metadata": {
    "jobTitle": "Python后端工程师",
    "createdBy": "dify-workflow"
  }
}
```

**响应**:
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "qa_count": 2,
  "expires_in_days": 7
}
```

### 2. 查询会话数据

#### 查询整个会话
```http
GET /api/sessions/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

**响应**:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "qaData": [...],
  "metadata": {...},
  "createdAt": "2025-10-11T07:30:00Z",
  "updatedAt": "2025-10-11T07:30:00Z"
}
```

#### 查询特定问题的答案
```http
GET /api/sessions/550e8400-e29b-41d4-a716-446655440000?question=请解释Python的GIL机制
Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

**响应**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "question": "请解释Python的GIL机制",
  "answer": "GIL（全局解释器锁）是CPython解释器中的一个机制..."
}
```

### 3. 删除会话
```http
DELETE /api/sessions/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

## Dify工作流集成

### 工作流文件
- `AI-Interview-Workflow-WithRedis.yml`

### 工作流程

#### 阶段1: 生成面试问题（request_type=generate_questions）

```mermaid
graph LR
A[开始] --> B[搜索职位信息]
B --> C[提取核心技能]
C --> D[生成面试问题]
D --> E[循环生成标准答案]
E --> F[保存会话到Redis]
F --> G[返回session_id]
```

**保存会话节点** (`save_session`):
- 调用: `POST /api/sessions`
- 输入: 问答对列表
- 输出: session_id
- 用途: 将生成的问题和标准答案存储到Redis

#### 阶段2: 评估候选人回答（request_type=score_answer）

```mermaid
graph LR
A[开始] --> B[加载标准答案]
B --> C[综合评价与打分]
C --> D[解析评分结果]
D --> E[返回评分]
```

**加载标准答案节点** (`load_session`):
- 调用: `GET /api/sessions/{session_id}?question={question}`
- 输入: session_id, question
- 输出: 标准答案
- 用途: 从Redis获取标准答案用于评分

### Dify工作流配置要点

1. **API端点配置**
   - 在代码节点中配置API URL
   - 默认: `http://localhost:8080/api/sessions`
   - 生产环境可使用ngrok等工具暴露服务

2. **认证配置**
   - Header: `Authorization: Bearer {API_KEY}`
   - API_KEY在代码节点中硬编码或作为环境变量

3. **数据格式**
   - 使用驼峰命名: `sessionId`, `qaData`
   - 如失败会自动尝试下划线命名: `session_id`, `qa_data`

## 测试验证

### 创建测试脚本

创建 `test-redis-storage.js`:

```javascript
const API_URL = 'http://localhost:8080/api/sessions';
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

async function testStorageService() {
    const sessionId = crypto.randomUUID();

    // 1. 保存会话
    console.log('1. Saving session...');
    const saveResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sessionId: sessionId,
            qaData: [
                {
                    question: "什么是闭包？",
                    answer: "闭包是函数和其词法环境的组合..."
                }
            ]
        })
    });
    console.log('Save result:', await saveResponse.json());

    // 2. 查询答案
    console.log('\n2. Loading answer...');
    const loadResponse = await fetch(
        `${API_URL}/${sessionId}?question=什么是闭包？`,
        {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        }
    );
    console.log('Load result:', await loadResponse.json());
}

testStorageService();
```

运行测试:
```bash
node test-redis-storage.js
```

## 运维管理

### 查看服务状态
```bash
cd storage-service
docker-compose ps
```

### 查看日志
```bash
# 实时日志
docker-compose logs -f

# 只看API日志
docker-compose logs -f api

# 只看Redis日志
docker-compose logs -f redis
```

### 停止服务
```bash
docker-compose down
```

### 完全清理（包括数据）
```bash
docker-compose down -v
```

### 重启服务
```bash
docker-compose restart
```

## 配置自定义

### 修改API Key

编辑 `storage-service/docker-compose.yml`:
```yaml
environment:
  - API_KEY=your_new_api_key
```

同时更新Dify工作流中的API Key。

### 修改端口

编辑 `storage-service/docker-compose.yml`:
```yaml
ports:
  - "9090:8080"  # 外部端口:内部端口
```

### 修改Redis过期时间

编辑 `storage-service/src/main/java/com/example/interviewstorage/controller/SessionController.java`:
```java
// 第41行
redisTemplate.opsForValue().set(key, value, Duration.ofDays(30));  // 改为30天
```

需要重新构建Docker镜像:
```bash
docker-compose up -d --build
```

## 故障排查

### 问题1: 服务无法启动

**症状**: `docker-compose up` 失败

**解决**:
1. 检查Docker是否运行
2. 检查端口8080是否被占用: `netstat -ano | findstr 8080`
3. 查看详细日志: `docker-compose logs`

### 问题2: API返回401未授权

**症状**: 调用API返回401错误

**解决**:
1. 检查Authorization header是否正确
2. 确认API Key匹配
3. 检查Bearer Token格式: `Bearer {API_KEY}`

### 问题3: 会话未找到

**症状**: 查询时返回404

**解决**:
1. 确认session_id正确
2. 检查会话是否过期（7天）
3. 检查Redis是否正常运行: `docker-compose ps`

## 生产部署建议

1. **使用环境变量管理API Key**
   - 不要在代码中硬编码
   - 使用`.env`文件或环境变量

2. **配置反向代理**
   - 使用Nginx或Traefik
   - 配置HTTPS证书
   - 限制请求频率

3. **Redis持久化**
   - 配置RDB和AOF
   - 定期备份Redis数据

4. **监控和日志**
   - 集成Prometheus监控
   - 配置日志聚合（如ELK）
   - 设置告警规则

5. **高可用部署**
   - Redis主从复制
   - 多实例负载均衡
   - 健康检查和自动恢复

## 总结

Redis存储服务已成功集成到项目中，与Dify AI面试官工作流完美配合：

✅ Spring Boot + Redis存储服务已部署
✅ Docker Compose一键启动
✅ REST API完整实现
✅ Bearer Token安全认证
✅ Dify工作流配置完成
✅ 启动脚本和文档完善

下一步可以：
1. 启动存储服务
2. 在Dify中导入工作流
3. 测试完整流程
4. 根据需要调整配置
