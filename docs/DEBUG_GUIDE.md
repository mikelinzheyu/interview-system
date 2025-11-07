# 前后端联合调试指导

## 配置修复总结

我已经完成了以下配置修复，确保前后端能够正常联合调试：

### 后端修复 (Spring Boot)

1. **端口配置统一**
   - 修复了application.yml中的端口配置冲突
   - 后端服务运行在: `http://localhost:8080`
   - Context path: `/api`

2. **CORS配置**
   - 创建了 `CorsConfig.java` 允许前端跨域访问
   - 在 `SecurityConfig.java` 中启用CORS支持

3. **安全配置优化**
   - 允许认证相关接口 `/auth/**` 公开访问
   - 允许分类和题目接口公开访问（便于调试）
   - `/users/me` 等需要认证的接口要求JWT token

4. **缺失接口补充**
   - 添加了 `/users/me` 接口获取当前用户信息
   - 修复了 UserLoginDto 字段名不匹配问题

5. **错误处理机制**
   - 创建了 `GlobalExceptionHandler.java` 统一处理异常
   - 确保错误响应格式与前端期望一致

### 前端修复 (Vue 3 + Vite)

1. **代理配置**
   - 在 `vite.config.js` 中配置了API代理
   - 前端: `http://localhost:5173`
   - API代理: `/api` -> `http://localhost:8080`

2. **登录逻辑修复**
   - 修改 `Login.vue` 使用真正的API调用而非模拟数据
   - 保持了用户Store的正确API调用逻辑

## 启动步骤

### 1. 启动后端服务
```bash
# 确保Java环境配置正确
cd D:\code7\interview-system\interview-server
mvn spring-boot:run
# 或使用IDE直接运行 InterviewServerApplication.java
```

### 2. 启动前端服务
```bash
cd D:\code7\facetest
npm run dev
```

### 3. 访问应用
- 前端地址: http://localhost:5173
- 后端API: http://localhost:8080/api

## 接口测试

### 1. 注册接口测试
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123456",
    "realName": "测试用户"
  }'
```

### 2. 登录接口测试
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

### 3. 获取用户信息测试
```bash
curl -X GET http://localhost:8080/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 常见问题排查

### 1. 后端启动失败
- **检查Java环境**: 确保JAVA_HOME配置正确，Java版本 >= 8
- **检查数据库**: 确保MySQL运行在localhost:3306，数据库名为 interview_system
- **检查Redis**: 确保Redis运行在localhost:6379（可选）

### 2. 前端启动失败
- **检查Node.js**: 确保Node.js版本 >= 14
- **安装依赖**: 运行 `npm install`

### 3. CORS错误
- 确保后端CORS配置正确加载
- 检查前端代理配置是否正确

### 4. 认证失败
- 检查JWT token是否正确传递
- 验证token格式: `Bearer <token>`
- 检查token是否过期

### 5. 接口404错误
- 检查context-path配置: `/api`
- 确认接口路径: 前端 `/api/auth/login` -> 后端 `localhost:8080/api/auth/login`

## 数据库准备

确保创建了正确的数据库表结构，可以使用项目中的SQL文件：
```bash
D:\code7\facetest\interview_system.sql
```

## 调试技巧

1. **查看网络请求**: 使用浏览器开发者工具Network面板
2. **查看控制台日志**: 前端console.log和后端日志
3. **使用Postman**: 独立测试后端API接口
4. **检查响应格式**: 确保符合ApiResponse格式

## 期望的API响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user": {...},
    "token": "...",
    "expires_at": "..."
  },
  "timestamp": "2024-..."
}
```

## 下一步

1. 配置并启动数据库
2. 按照上述步骤启动前后端服务
3. 使用浏览器访问 http://localhost:5173 进行测试
4. 如遇问题，查看控制台日志并参考常见问题排查