# 前后端联调测试指南

## 📋 目录

1. [快速启动](#快速启动)
2. [环境配置](#环境配置)
3. [启动流程](#启动流程)
4. [API测试](#api测试)
5. [功能测试](#功能测试)
6. [故障排查](#故障排查)
7. [性能测试](#性能测试)

---

## 🚀 快速启动

### 一键启动所有服务（推荐）

**Windows PowerShell:**
```powershell
# 1. 后端
cd D:\code7\interview-system\backend
npm install
node mock-server.js

# 2. 新开一个终端，启动前端
cd D:\code7\interview-system\frontend
npm install
npm run dev

# 3. 访问前端
# http://localhost:5174
```

**Linux/Mac:**
```bash
# 1. 后端
cd /path/to/interview-system/backend
npm install
npm start

# 2. 新开一个终端，启动前端
cd /path/to/interview-system/frontend
npm install
npm run dev

# 3. 访问前端
# http://localhost:5174
```

---

## ⚙️ 环境配置

### 后端配置 (.env)

```env
NODE_ENV=development
PORT=3001
DIFY_API_KEY=app-your-key-here
DIFY_API_BASE_URL=https://api.dify.ai/v1
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=debug
```

### 前端配置 (.env.local)

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DEV_PROXY_TARGET=http://localhost:3001
```

---

## 🔄 启动流程

### 第一步：启动后端服务

```bash
cd backend
npm install      # 首次需要
npm start        # 或 node mock-server.js
```

**预期输出：**
```
🚀 Mock API服务器已启动
📍 地址: http://localhost:3001
🔗 健康检查: http://localhost:3001/api/health
✅ WebSocket 服务器已初始化
```

### 第二步：验证后端健康状态

```bash
# 测试健康检查端点
curl http://localhost:3001/api/health

# 预期响应：
{
  "code": 200,
  "message": "Success",
  "data": {
    "status": "UP",
    "version": "1.0.0"
  }
}
```

### 第三步：启动前端服务

```bash
cd frontend
npm install      # 首次需要
npm run dev
```

**预期输出：**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
  ➜  press h to show help
```

### 第四步：访问应用

打开浏览器访问：
```
http://localhost:5174
```

---

## 🧪 API测试

### 1. 健康检查测试

```bash
# 后端健康检查
curl -X GET http://localhost:3001/api/health
```

**预期状态码：** 200

---

### 2. 模拟面试接口测试

#### 开始面试

```bash
curl -X POST http://localhost:3001/api/interviews/start \
  -H "Content-Type: application/json" \
  -d '{
    "jobPosition": "前端工程师",
    "jobDescription": "3年经验，熟悉React",
    "difficulty": "intermediate"
  }'
```

**预期响应：**
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "interviewId": "xxxxx",
    "status": "started",
    "currentQuestion": "..."
  }
}
```

#### 提交答案

```bash
curl -X POST http://localhost:3001/api/interviews/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "xxxxx",
    "questionId": "q1",
    "answer": "用户的答案"
  }'
```

#### 结束面试

```bash
curl -X POST http://localhost:3001/api/interviews/end \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "xxxxx"
  }'
```

---

### 3. WebSocket连接测试

#### 使用 wscat 测试

```bash
# 安装 wscat
npm install -g wscat

# 连接到 WebSocket 服务器
wscat -c ws://localhost:3001/ws
```

#### JavaScript 客户端测试

```javascript
// 在浏览器控制台执行
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('WebSocket 已连接');
  ws.send(JSON.stringify({
    type: 'ping',
    data: { timestamp: Date.now() }
  }));
};

ws.onmessage = (event) => {
  console.log('收到消息:', JSON.parse(event.data));
};

ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};

ws.onclose = () => {
  console.log('WebSocket 已断开连接');
};
```

---

## ✨ 功能测试

### 1. 首页加载测试

**操作步骤：**
1. 打开 http://localhost:5174
2. 观察页面加载情况
3. 检查是否有错误信息

**预期结果：**
- 页面正常加载
- 控制台无错误信息
- 网络请求成功

---

### 2. 创建面试流程测试

**操作步骤：**
1. 点击"开始面试"按钮
2. 填写职位信息
3. 点击"开始"

**预期结果：**
- 请求成功发送到后端
- 前端收到面试数据
- 页面跳转到面试页面

---

### 3. 答题流程测试

**操作步骤：**
1. 在面试页面输入答案
2. 点击"提交答案"
3. 查看下一个问题

**预期结果：**
- 答案成功提交
- 后端返回下一个问题
- 页面实时更新

---

### 4. 实时通知测试

**操作步骤：**
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 查看 WebSocket 连接
4. 观察实时消息推送

**预期结果：**
- WebSocket 连接正常
- 能接收实时消息
- 消息格式正确

---

## 🔍 浏览器调试

### 打开开发者工具

**Windows/Linux：** F12 或 Ctrl+Shift+I
**Mac：** Cmd+Option+I

### 检查项目

#### 1. Console（控制台）

```javascript
// 查看后端地址
console.log(import.meta.env.VITE_API_BASE_URL);

// 测试API连接
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('后端连接正常:', d))
  .catch(e => console.error('后端连接失败:', e));
```

#### 2. Network（网络标签）

- 查看API请求URL是否正确
- 检查请求方法（GET/POST）是否正确
- 验证请求头（headers）是否完整
- 检查响应状态码和内容

#### 3. Application（应用）

- 检查 Local Storage
- 查看 Cookies
- 验证 WebSocket 连接

---

## 📊 测试场景

### 场景1：正常流程

```
[前端] → [发送请求] → [后端]
         [1. 创建面试] ↓
[前端] ← [返回数据] ← [后端]
         [2. 开始答题]
[前端] → [提交答案] → [后端]
         [3. 处理答案] ↓
[前端] ← [下一个问题] ← [后端]
         [重复步骤2-3]
[前端] → [结束面试] → [后端]
         [4. 生成报告] ↓
[前端] ← [面试结果] ← [后端]
```

### 场景2：错误处理

```
[前端] → [发送错误数据] → [后端]
         [验证失败] ↓
[前端] ← [返回错误信息] ← [后端]
         [显示错误提示]
[用户] → [重新输入] → [前端]
```

### 场景3：超时处理

```
[前端] → [发送请求] → [后端]
         [等待响应]
         [等待超时]
[前端] ← [显示超时提示]
[用户] → [重试] → [前端]
```

---

## 🐛 故障排查

### 问题1：前端无法连接后端

**症状：**
```
Error: Network request failed
CORS error: No 'Access-Control-Allow-Origin' header
```

**解决方案：**
```bash
# 1. 检查后端是否运行
curl http://localhost:3001/api/health

# 2. 检查前端代理配置
# vite.config.js 中的 proxy 配置

# 3. 检查端口是否正确
# 后端应该在 3001
# 前端应该在 5174
```

---

### 问题2：WebSocket 连接失败

**症状：**
```
WebSocket connection to 'ws://localhost:3001/ws' failed
```

**解决方案：**
```javascript
// 在浏览器控制台检查
console.log('WebSocket URL:', `ws://localhost:3001/ws`);

// 使用 wscat 测试
// wscat -c ws://localhost:3001/ws
```

---

### 问题3：API 返回 404

**症状：**
```
POST /api/interviews/start 404 Not Found
```

**解决方案：**
```bash
# 1. 检查后端路由是否定义
# 查看 mock-server.js 中的路由

# 2. 检查API路径是否正确
# 应该是 /api/xxx，不是 /xxx

# 3. 重启后端服务
# Ctrl+C 然后 npm start
```

---

### 问题4：CORS 错误

**症状：**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/...'
from origin 'http://localhost:5174' has been blocked by CORS policy
```

**解决方案：**
```javascript
// 在 vite.config.js 中检查代理配置
// 应该配置：
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

---

## 📈 性能测试

### 1. 加载时间测试

```javascript
// 在浏览器控制台执行
console.time('API 响应时间');
fetch('/api/health')
  .then(r => r.json())
  .then(() => console.timeEnd('API 响应时间'));
```

**预期：** < 500ms

---

### 2. 吞吐量测试

```javascript
// 并发发送10个请求
const requests = Array(10).fill().map(() =>
  fetch('/api/health').then(r => r.json())
);

Promise.all(requests).then(() => {
  console.log('10个请求全部完成');
});
```

**预期：** 所有请求都成功

---

### 3. WebSocket 延迟测试

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  const start = Date.now();
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const latency = Date.now() - start;
  console.log('WebSocket 延迟:', latency, 'ms');
};
```

**预期：** < 100ms

---

## 📋 测试检查清单

### 部署前检查

- [ ] 后端服务已启动
- [ ] 前端服务已启动
- [ ] 能访问 http://localhost:5174
- [ ] 没有控制台错误

### 功能检查

- [ ] 首页能正常加载
- [ ] 能创建新面试
- [ ] 能提交答案
- [ ] 能结束面试
- [ ] 能看到面试结果

### API 检查

- [ ] 健康检查端点 (GET /api/health) 可访问
- [ ] 创建面试端点 (POST /api/interviews/start) 可访问
- [ ] 提交答案端点 (POST /api/interviews/submit-answer) 可访问
- [ ] WebSocket 连接正常

### 网络检查

- [ ] 无 CORS 错误
- [ ] 无网络超时
- [ ] 响应时间 < 500ms
- [ ] WebSocket 连接稳定

### 浏览器检查

- [ ] 无 JavaScript 错误
- [ ] 无资源加载失败
- [ ] 页面布局正确
- [ ] 响应式设计正常

---

## 📊 测试报告模板

```markdown
# 前后端联调测试报告

## 测试环境
- 后端地址: http://localhost:3001
- 前端地址: http://localhost:5174
- 测试时间: YYYY-MM-DD HH:MM:SS
- 测试人员: XXX

## 测试结果
### 基础功能
- [ ] 后端服务启动正常
- [ ] 前端服务启动正常
- [ ] API 连接正常

### 核心功能
- [ ] 创建面试成功
- [ ] 答题流程正常
- [ ] 结束面试成功
- [ ] 生成报告成功

### 问题清单
| 问题 | 严重级别 | 状态 | 说明 |
|------|--------|------|------|
| XXX | 高/中/低 | 已解决/待解决 | ... |

## 建议
- ...
```

---

## 🎯 下一步

1. **性能优化** - 优化API响应时间
2. **错误处理** - 完善错误提示机制
3. **缓存策略** - 实现请求缓存
4. **监控告警** - 部署监控系统
5. **压力测试** - 进行压力测试验证

---

**最后更新**: 2024年01月
**版本**: 1.0
