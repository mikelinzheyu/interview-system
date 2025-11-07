# 智能面试系统 API 文档

## 概述

本文档描述了智能面试系统的所有API接口，包括认证、面试管理、用户管理等功能。

**基础URL:** `http://localhost:8080/api`

**版本:** `v1.0.0`

## 认证方式

系统使用JWT (JSON Web Token) 进行身份认证。

### 请求头格式
```
Authorization: Bearer <token>
```

## 通用响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": <response_data>
}
```

### 错误响应
```json
{
  "code": <error_code>,
  "message": "<error_message>",
  "data": null
}
```

## 用户认证 API

### 1. 用户注册
**POST** `/auth/register`

#### 请求参数
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "realName": "测试用户"
}
```

#### 请求参数说明
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| username | String | ✓ | 用户名，3-20个字符 |
| email | String | ✓ | 邮箱地址 |
| password | String | ✓ | 密码，6-20个字符 |
| realName | String | ✓ | 真实姓名 |

#### 响应示例
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user_id": 1,
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-09-25T10:30:00"
  }
}
```

### 2. 用户登录
**POST** `/auth/login`

#### 请求参数
```json
{
  "username": "testuser",
  "password": "password123"
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "real_name": "测试用户",
      "email": "test@example.com",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-09-25T10:30:00"
  }
}
```

### 3. 刷新Token
**POST** `/auth/refresh`

#### 请求头
```
Authorization: Bearer <current_token>
```

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expires_at": "2025-09-25T10:30:00"
  }
}
```

### 4. 用户登出
**POST** `/auth/logout`

#### 请求头
```
Authorization: Bearer <token>
```

#### 响应示例
```json
{
  "code": 200,
  "message": "登出成功"
}
```

## 用户管理 API

### 1. 获取用户信息
**GET** `/users/me`

#### 请求头
```
Authorization: Bearer <token>
```

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "testuser",
    "real_name": "测试用户",
    "email": "test@example.com",
    "avatar": null,
    "created_at": "2025-01-01T00:00:00"
  }
}
```

### 2. 更新用户信息
**PUT** `/users/me`

#### 请求参数
```json
{
  "realName": "新的真实姓名",
  "email": "new@example.com"
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "real_name": "新的真实姓名",
    "email": "new@example.com"
  }
}
```

## 面试管理 API

### 1. 生成面试问题
**POST** `/interview/generate-question`

#### 请求参数
```json
{
  "position": "Java开发工程师",
  "level": "中级",
  "skills": ["Java", "Spring Boot", "MySQL"],
  "previousQuestions": []
}
```

#### 请求参数说明
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| position | String | ✓ | 面试职位 |
| level | String | ✓ | 技能水平：初级/中级/高级 |
| skills | String[] | ✓ | 技能列表 |
| previousQuestions | Object[] | ✗ | 已提问的问题列表 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "success": true,
    "question": "请介绍一下Spring Boot的自动配置原理",
    "expectedAnswer": "通过@EnableAutoConfiguration注解...",
    "keywords": ["Spring Boot", "自动配置", "注解", "Bean"],
    "category": "Java框架",
    "difficulty": "中等",
    "timestamp": 1727123456789
  }
}
```

### 2. 分析回答
**POST** `/interview/analyze`

#### 请求参数
```json
{
  "question": "请介绍一下Spring Boot的自动配置原理",
  "answer": "Spring Boot通过@EnableAutoConfiguration注解实现自动配置...",
  "interviewId": 123456789
}
```

#### 请求参数说明
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| question | String | ✓ | 面试问题 |
| answer | String | ✓ | 用户回答 |
| interviewId | Long | ✗ | 面试会话ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "success": true,
    "overallScore": 85,
    "technicalScore": 88,
    "communicationScore": 82,
    "logicalScore": 86,
    "summary": "回答较为全面，技术理解准确，表达清晰...",
    "suggestions": [
      "建议深入解释自动配置的具体机制",
      "可以举例说明常用的自动配置类"
    ],
    "mentionedKeywords": ["Spring Boot", "自动配置", "注解"],
    "missingKeywords": ["Bean", "条件注解"],
    "keywordRelevance": 75,
    "timestamp": 1727123456789
  }
}
```

### 3. 创建面试会话
**POST** `/interview/sessions`

#### 请求参数
```json
{
  "position": "Java开发工程师",
  "level": "中级",
  "skills": ["Java", "Spring Boot", "MySQL"],
  "duration": 30
}
```

#### 请求参数说明
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| position | String | ✓ | 面试职位 |
| level | String | ✓ | 技能水平 |
| skills | String[] | ✓ | 技能列表 |
| duration | Integer | ✗ | 面试时长(分钟)，默认30 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1727123456789,
    "position": "Java开发工程师",
    "level": "中级",
    "skills": "Java,Spring Boot,MySQL",
    "duration": 30,
    "status": "active",
    "currentScore": 0,
    "createdAt": "2025-09-24T10:30:00",
    "updatedAt": "2025-09-24T10:30:00"
  }
}
```

### 4. 获取面试会话详情
**GET** `/interview/sessions/{sessionId}`

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| sessionId | Long | 会话ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1727123456789,
    "position": "Java开发工程师",
    "level": "中级",
    "skills": "Java,Spring Boot,MySQL",
    "duration": 30,
    "status": "active",
    "currentScore": 85,
    "createdAt": "2025-09-24T09:30:00",
    "updatedAt": "2025-09-24T10:30:00"
  }
}
```

### 5. 获取用户面试会话列表
**GET** `/interview/sessions`

#### 查询参数
| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| page | Integer | ✗ | 1 | 页码 |
| size | Integer | ✗ | 10 | 每页大小 |
| status | String | ✗ | - | 状态筛选 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "position": "Java开发工程师 1",
        "level": "高级",
        "skills": "Java,Spring Boot,MySQL",
        "duration": 30,
        "status": "completed",
        "currentScore": 88,
        "createdAt": "2025-09-21T10:30:00",
        "updatedAt": "2025-09-21T11:30:00"
      }
    ],
    "total": 25,
    "page": 1,
    "size": 10,
    "pages": 3
  }
}
```

### 6. 结束面试会话
**POST** `/interview/sessions/{sessionId}/complete`

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| sessionId | Long | 会话ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "success": true,
    "sessionId": 1727123456789,
    "completedAt": "2025-09-24T10:30:00",
    "finalScore": 85,
    "message": "面试会话已完成"
  }
}
```

### 7. 获取面试反馈
**GET** `/interview/sessions/{sessionId}/feedback`

#### 路径参数
| 参数 | 类型 | 描述 |
|------|------|------|
| sessionId | Long | 会话ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "overallScore": 78,
    "summary": "整体表现良好，技术功底扎实，沟通能力较强。",
    "strengths": ["技术理解深入", "表达清晰", "思路清楚"],
    "weaknesses": ["实战经验可以更丰富", "对新技术的了解可以更深入"],
    "questions": [
      {
        "question": "JavaScript闭包相关问题",
        "answer": "用户的回答内容...",
        "score": 85,
        "analysis": "回答准确，理解深入",
        "expectedPoints": ["闭包定义", "作用域链", "内存管理"],
        "mentionedPoints": ["闭包定义", "作用域链"]
      }
    ],
    "recommendations": ["加强实际项目经验", "深入学习新框架特性"],
    "skillGaps": ["微前端架构", "性能优化", "工程化"],
    "nextSteps": ["学习TypeScript", "掌握Node.js", "了解云原生"]
  }
}
```

### 8. 语音转文本
**POST** `/interview/speech/transcribe`

#### 请求参数
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| audio | String | ✓ | 音频数据(Base64编码) |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "success": true,
    "transcript": "这是转录的文本内容",
    "confidence": 0.95,
    "duration": 3.5,
    "language": "zh-CN"
  }
}
```

## 系统管理 API

### 1. 健康检查
**GET** `/health`

#### 响应示例
```json
{
  "service": "interview-system",
  "status": "healthy",
  "timestamp": "2025-09-24T10:30:00Z",
  "version": "1.0.0"
}
```

## 错误代码说明

| 错误代码 | 描述 |
|----------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或token过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突(如用户名已存在) |
| 500 | 服务器内部错误 |

## 数据模型

### User (用户)
```json
{
  "id": "Long - 用户ID",
  "username": "String - 用户名",
  "real_name": "String - 真实姓名",
  "email": "String - 邮箱",
  "avatar": "String - 头像URL",
  "status": "String - 状态",
  "created_at": "DateTime - 创建时间",
  "updated_at": "DateTime - 更新时间"
}
```

### InterviewSession (面试会话)
```json
{
  "id": "Long - 会话ID",
  "userId": "Long - 用户ID",
  "position": "String - 面试职位",
  "level": "String - 技能水平",
  "skills": "String - 技能列表(逗号分隔)",
  "duration": "Integer - 面试时长(分钟)",
  "status": "String - 状态(active/completed/cancelled)",
  "currentScore": "Integer - 当前得分",
  "createdAt": "DateTime - 创建时间",
  "updatedAt": "DateTime - 更新时间"
}
```

### Question (问题)
```json
{
  "id": "Long - 问题ID",
  "question": "String - 问题内容",
  "category": "String - 问题分类",
  "difficulty": "String - 难度等级",
  "expectedAnswer": "String - 期望答案",
  "keywords": "String[] - 关键词列表"
}
```

## 开发指南

### 环境变量
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=interview_system
DB_USERNAME=root
DB_PASSWORD=root

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000

# AI接口配置
OPENAI_API_KEY=your-openai-key
OPENAI_BASE_URL=https://api.openai.com
```

### 测试工具推荐
- **Postman**: API测试
- **curl**: 命令行测试
- **Swagger**: API文档和测试界面

### 示例请求 (curl)
```bash
# 用户登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# 生成面试问题
curl -X POST http://localhost:8080/api/interview/generate-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"position":"Java开发工程师","level":"中级","skills":["Java","Spring"]}'
```

## 更新日志

### v1.0.0 (2025-09-24)
- 完成用户认证系统
- 实现面试问题生成和答案分析
- 添加面试会话管理
- 支持语音转文本功能
- 完善API文档

---

**联系信息**
- 项目地址: [GitHub](https://github.com/your-repo/interview-system)
- 技术支持: support@interview-system.com