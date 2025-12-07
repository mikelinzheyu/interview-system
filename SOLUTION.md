# API 404/500 错误完整解决方案

## 问题演进历程

1. **初始问题**：`GET /api/users/preferences` 返回 404 Not Found
2. **升级问题**：`GET /api/users/me` 返回 500 Internal Server Error
3. **关联问题**：WebSocket 无法连接到 `ws://localhost:3001`

## 根本原因分析

### 问题 1：preferences 404 的根本原因

**根因**：`router.use('/users', auth, userSettingsRouter)` 中的中间件链式应用可能有问题

- userSettingsRouter 定义在 user-settings.js 中
- 路由定义正确：`router.get('/preferences', ...)`
- 但 auth 中间件的应用方式可能导致 req.user 未被正确设置

### 问题 2：/users/me 500 错误的根本原因

**根因**：`req.user` 未被正确设置，导致 `req.user.id` 访问时崩溃

```javascript
// api.js 898 行
const userId = req.user.id  // req.user 为 undefined，导致 TypeError
```

## 修复步骤

### 修复 1：添加请求日志（已完成）

在 user-settings.js 中添加日志中间件，用于诊断 req.user 是否被正确设置

### 修复 2：确保 auth 中间件正确应用

当前代码：
```javascript
router.use('/users', auth, userSettingsRouter)
```

这是正确的 Express 中间件链式语法。auth 中间件应该：
1. 检查 Authorization header
2. 提取并验证 token
3. 设置 req.user = { id: userId }
4. 调用 next() 传递给 userSettingsRouter

### 修复 3：隔离测试各个端点

运行以下测试命令，逐个验证：

```bash
# 测试 preferences 端点
curl -X GET http://localhost:3000/api/users/preferences \
  -H "Authorization: Bearer 1"

# 测试 me 端点
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer 1"

# 查看后端日志输出
# [user-settings] Incoming request: { method: 'GET', path: '/preferences', hasReqUser: true, userId: 1 }
```

## 已实施的修改

### 1. api.js (第 891 行)
```javascript
// 确保使用标准的 Express 中间件链式语法
router.use('/users', auth, userSettingsRouter)
```

### 2. user-settings.js (第 10-19 行)
```javascript
// 添加调试日志中间件
router.use((req, res, next) => {
  console.log('[user-settings] Incoming request:', {
    method: req.method,
    path: req.path,
    hasReqUser: !!req.user,
    userId: req.user?.id
  })
  next()
})
```

## 预期结果

修复后应该看到：

1. ✅ `GET /api/users/preferences` 返回 200，包含用户偏好设置
2. ✅ `GET /api/users/me` 返回 200，包含用户信息
3. ✅ 后端日志显示 `hasReqUser: true` 和正确的 `userId`
4. ✅ WebSocket 连接成功（若后端服务正常启动）

## 下一步调试

如果问题仍未解决，查看后端日志输出：

```
[user-settings] Incoming request: { method: 'GET', path: '/preferences', hasReqUser: false, userId: undefined }
```

表示 auth 中间件未正确执行。此时需要检查：
- Authorization header 是否被正确发送
- auth 中间件是否被正确应用
- token 格式是否正确

## 架构建议

为了避免未来的混淆，建议：

1. **选项 A**：将所有 /users/* 的处理放在 userSettingsRouter 中，包括 /me、/profile 等
2. **选项 B**：将所有 /users/* 的处理都在 api.js 中定义，不使用 userSettingsRouter

当前状态是混合的，这可能导致维护困难。选择一种方式并坚持会更清晰。
