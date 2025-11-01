# 🔧 前后端联调 - 故障诊断与解决方案

## 快速导航

- [无法访问 localhost:5174](#无法访问-localhost5174)
- [无法访问 localhost:3001](#无法访问-localhost3001)
- [CORS错误](#cors错误)
- [端口被占用](#端口被占用)
- [npm命令不可用](#npm命令不可用)
- [依赖安装失败](#依赖安装失败)
- [API返回404](#api返回404)
- [WebSocket连接失败](#websocket连接失败)

---

## 无法访问 localhost:5174

### 症状
- 浏览器显示"无法连接到服务器"
- 或显示空白页面
- 或显示Vite logo但无内容

### 根本原因
1. ❌ 前端服务未启动
2. ❌ 端口5174被其他程序占用
3. ❌ 防火墙阻止了连接
4. ❌ 浏览器缓存问题

### 诊断步骤

**步骤1：检查前端是否运行**

在命令行执行：
```bash
netstat -ano | findstr 5174
```

或使用PowerShell：
```powershell
Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
```

**期望结果：** 应该显示一个监听 5174 端口的进程

**步骤2：检查前端终端输出**

查看运行 `npm run dev` 的终端窗口：
- 应该看到 `Local: http://localhost:5174`
- 不应该有红色错误信息

### 解决方案

#### 方案A：重启前端服务（最常见）

```bash
# 1. 关闭前端窗口 (Ctrl+C 或关闭窗口)
# 2. 重新启动前端
cd D:\code7\interview-system\frontend
npm run dev

# 3. 等待看到 "Local: http://localhost:5174"
# 4. 在浏览器刷新 http://localhost:5174
```

#### 方案B：清除浏览器缓存

```
1. 在浏览器按 F12 打开开发者工具
2. 右键点击刷新按钮，选择"清空缓存并硬性重新加载"
   或按 Ctrl+Shift+R (强制刷新)
3. 重新访问 http://localhost:5174
```

#### 方案C：释放被占用的端口

```bash
# 找出占用5174端口的进程ID
netstat -ano | findstr :5174

# 假设找到的PID是1234，杀死该进程
taskkill /PID 1234 /F

# 重新启动前端
cd frontend && npm run dev
```

#### 方案D：修改前端端口（如果5174被占用）

编辑 `frontend/vite.config.js`：
```javascript
server: {
  port: 5175,  // 改为其他端口
  // ... 其他配置
}
```

然后访问 http://localhost:5175

---

## 无法访问 localhost:3001

### 症状
- 浏览器显示"无法连接到服务器"
- API请求返回Connection refused
- 后端健康检查失败

### 根本原因
1. ❌ 后端服务未启动
2. ❌ 端口3001被其他程序占用
3. ❌ 防火墙阻止了连接
4. ❌ 后端启动出错

### 诊断步骤

**步骤1：检查后端是否运行**

```bash
# 方式1：端口检查
netstat -ano | findstr 3001

# 方式2：直接测试
curl http://localhost:3001/api/health

# 预期响应：
# {"code":200,"message":"Success","data":{"status":"UP"}}
```

**步骤2：检查后端终端输出**

查看运行 `npm start` 的终端窗口：
- 应该看到 `🚀 Mock API服务器已启动`
- 应该看到 `📍 地址: http://localhost:3001`
- 应该看到 `✅ WebSocket 服务器已初始化`
- 不应该有红色错误信息

### 解决方案

#### 方案A：启动后端服务

```bash
cd D:\code7\interview-system\backend
npm install  # 首次可能需要
npm start
```

等待看到：
```
🚀 Mock API服务器已启动
📍 地址: http://localhost:3001
✅ WebSocket 服务器已初始化
```

#### 方案B：检查后端启动错误

常见错误及解决方案：

**错误：EADDRINUSE (端口被占用)**
```
Error: listen EADDRINUSE: address already in use :::3001
```
解决：
```bash
taskkill /F /IM node.exe
# 等待3秒
npm start
```

**错误：找不到模块**
```
Error: Cannot find module 'xxxx'
```
解决：
```bash
npm install
npm start
```

**错误：权限拒绝**
```
Error: EACCES: permission denied
```
解决：
- 以管理员身份运行命令窗口
- 或修改文件权限

#### 方案C：释放被占用的端口

```bash
# 找出占用3001端口的进程
netstat -ano | findstr :3001

# 杀死该进程
taskkill /PID <PID> /F

# 重新启动后端
npm start
```

#### 方案D：修改后端端口

编辑 `backend/mock-server.js`：
```javascript
const PORT = process.env.PORT || 3002;  // 改为 3002
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

然后修改 `.env.docker` 中的 `BACKEND_PORT=3002`

---

## CORS错误

### 症状

浏览器控制台显示：
```
Access to XMLHttpRequest at 'http://localhost:3001/api/...'
from origin 'http://localhost:5174' has been blocked by CORS policy
```

### 根本原因

1. ❌ 前端和后端跨域请求
2. ❌ 后端未配置CORS头
3. ❌ Vite代理配置不正确

### 解决方案

#### 方案A：检查Vite代理配置

编辑 `frontend/vite.config.js`，确保有这样的配置：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path
    }
  }
}
```

#### 方案B：后端添加CORS配置

如果直接调用 http://localhost:3001，需要后端支持CORS。

编辑 `backend/mock-server.js`：

```javascript
// 添加CORS中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

#### 方案C：使用正确的API地址

前端应该使用：
```javascript
// ✓ 正确 - 使用相对路径，让Vite代理转发
fetch('/api/health')

// ✗ 错误 - 直接调用后端会跨域
fetch('http://localhost:3001/api/health')
```

---

## 端口被占用

### 症状

启动服务时显示：
```
Error: listen EADDRINUSE: address already in use :::3001
```

### 根本原因
旧的Node.js进程仍在运行，占用了端口

### 解决方案

#### 方案A：杀死所有Node.js进程（最简单）

```bash
taskkill /F /IM node.exe
```

然后重新启动服务：
```bash
npm start
```

#### 方案B：只杀死特定端口的进程

```bash
# 找出占用3001端口的进程PID
netstat -ano | findstr :3001

# 假设PID是12345
taskkill /PID 12345 /F
```

#### 方案C：使用不同的端口

编辑 `.env` 或启动命令：
```bash
PORT=3002 npm start
```

---

## npm命令不可用

### 症状

执行 `npm start` 时显示：
```
'npm' 不是内部或外部命令
```

### 根本原因
Node.js 或 npm 未正确安装或配置

### 解决方案

#### 步骤1：检查Node.js是否安装

```bash
node --version
npm --version
```

应该显示版本号，如 `v22.19.0` 和 `10.x.x`

#### 步骤2：重新安装Node.js

1. 从 https://nodejs.org 下载LTS版本
2. 运行安装程序
3. **重要**：在安装时勾选"Add to PATH"
4. 完成后重启电脑

#### 步骤3：验证安装

```bash
node --version   # 应显示版本
npm --version    # 应显示版本
npm list -g      # 显示全局安装的包
```

---

## 依赖安装失败

### 症状

执行 `npm install` 时显示错误：
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

### 根本原因
依赖版本冲突或网络问题

### 解决方案

#### 方案A：清除缓存并重新安装

```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules目录
rmdir /s /q node_modules
del package-lock.json

# 重新安装
npm install
```

#### 方案B：使用镜像源加速

```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

#### 方案C：跳过锁定文件

```bash
npm install --legacy-peer-deps
```

---

## API返回404

### 症状

API请求返回：
```
HTTP 404 Not Found
{
  "code": 404,
  "message": "API接口不存在"
}
```

### 根本原因
1. ❌ 后端路由未定义
2. ❌ API路径错误
3. ❌ 后端未正确启动

### 诊断步骤

**步骤1：检查健康检查端点**

```bash
curl http://localhost:3001/api/health
```

如果也返回404，说明后端有问题

**步骤2：检查API路径**

确保API调用时：
- 路径以 `/api/` 开头
- 使用正确的HTTP方法 (GET/POST)
- 请求头包含 `Content-Type: application/json`

### 解决方案

#### 检查后端路由定义

编辑 `backend/mock-server.js`，确保定义了路由：

```javascript
// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'Success' });
});

// 其他路由
app.post('/api/interviews/start', (req, res) => {
  // 处理...
});
```

#### 重启后端

```bash
# Ctrl+C 停止
# 然后
npm start
```

---

## WebSocket连接失败

### 症状

浏览器控制台显示：
```
WebSocket connection to 'ws://localhost:3001/ws' failed
```

### 根本原因
1. ❌ WebSocket服务未启动
2. ❌ 使用了错误的协议 (wss 而不是 ws)
3. ❌ 后端未正确配置WebSocket

### 诊断步骤

**检查WebSocket地址**

```javascript
// ✓ 正确
const ws = new WebSocket('ws://localhost:3001/ws');

// ✗ 错误 - wss 用于HTTPS
const ws = new WebSocket('wss://localhost:3001/ws');
```

### 解决方案

#### 确保后端支持WebSocket

编辑 `backend/mock-server.js`：

```javascript
const http = require('http');
const WebSocket = require('ws');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('客户端已连接');
  ws.send('欢迎连接');
});

server.listen(PORT);
```

#### 测试WebSocket连接

在浏览器控制台执行：

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('✓ WebSocket已连接');
};

ws.onerror = (error) => {
  console.error('✗ WebSocket错误:', error);
};

ws.onmessage = (event) => {
  console.log('收到消息:', event.data);
};
```

---

## 多个问题的综合解决方案

### 核心检查清单

```bash
# 1. 杀死所有旧进程
taskkill /F /IM node.exe

# 2. 等待3秒
timeout /t 3

# 3. 清除npm缓存
npm cache clean --force

# 4. 重新安装依赖
cd backend && npm install
cd ../frontend && npm install

# 5. 启动后端
cd ../backend && npm start

# 6. 新终端启动前端
cd ../frontend && npm run dev

# 7. 访问
http://localhost:5174
```

### 如果以上都不工作

1. **重启电脑** - 这会清除所有资源占用
2. **检查防火墙** - Windows防火墙可能阻止了连接
3. **使用管理员权限** - 右键选择"以管理员身份运行"
4. **查看详细日志** - 保留终端窗口打开查看完整错误信息

---

## 🆘 获取更多帮助

如果以上解决方案都不适用：

1. **查看日志文件**
   ```bash
   type backend.log
   type frontend.log
   ```

2. **查看完整文档**
   - `START_GUIDE.md` - 快速启动指南
   - `INTEGRATION_TEST_QUICK_START.md` - 测试快速参考
   - `FRONTEND_BACKEND_INTEGRATION_TEST.md` - 详细指南

3. **运行诊断脚本**
   ```bash
   node test-integration.js
   ```

---

**版本**: 1.0
**日期**: 2024年01月
**状态**: ✅ 已验证
