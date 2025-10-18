# 前后端联合调试指南

## 🎯 当前系统状态

### ✅ 已启动的服务

| 服务 | 地址 | 状态 | 说明 |
|------|------|------|------|
| **后端 Mock API** | http://localhost:3001 | ✅ 运行中 | Node.js Express Mock 服务器 |
| **前端 Vite Dev** | http://localhost:5174 | ✅ 运行中 | Vue3 Vite 开发服务器 |
| **API 代理** | http://localhost:5174/api | ✅ 正常 | 前端自动代理到后端 |

### 📊 集成测试结果

```
✅ 后端健康检查 (200)
✅ 获取用户信息 (200)
✅ 获取问题列表 (200)
✅ 获取问题分类 (200)
✅ 获取用户统计数据 (200)
✅ 获取用户排行榜 (200)
✅ 生成面试问题 (200)
✅ 分析回答 (200)
✅ 前端API代理 (200)

📊 成功率: 9/9 (100%)
```

---

## 🔧 调试工作流

### 1. 访问应用

打开浏览器访问：
```
http://localhost:5174
```

### 2. 打开开发者工具

**快捷键：** `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)

### 3. 查看关键信息

#### 📱 控制台 (Console)

查看应用日志和错误信息：
```javascript
// 常见日志位置
[PROXY] 转发: /api/... -> /api/...
[VITE] API proxy target: http://localhost:3001
```

#### 🌐 网络 (Network)

监控所有网络请求：
- 过滤器: 输入 `/api` 查看 API 请求
- 查看请求头、响应头、响应数据
- 检查状态码和响应时间

#### 💾 应用 (Application/Storage)

- **Cookie:** 检查认证相关 cookie
- **LocalStorage:** 查看本地存储数据
- **SessionStorage:** 查看会话数据

#### 📊 性能 (Performance)

监控渲染性能：
1. 点击录制按钮
2. 进行操作
3. 停止录制
4. 分析帧率和渲染时间

---

## 🐛 常见调试场景

### 场景 1: API 请求失败

**步骤：**
1. 打开 Network 选项卡
2. 查找失败的请求
3. 检查：
   - ✓ 状态码是否为 4xx/5xx
   - ✓ 响应内容是否为有效 JSON
   - ✓ 请求头是否包含正确的 Content-Type
   - ✓ 后端是否正常运行

**检查后端：**
```bash
curl -v http://localhost:3001/api/health
```

### 场景 2: 组件渲染问题

**步骤：**
1. 打开 Console
2. 查找 Vue 相关错误
3. 检查：
   - ✓ 组件 props 是否正确
   - ✓ 数据绑定是否正确
   - ✓ 事件监听是否工作

**检查 Vue DevTools：**
- 安装 Vue DevTools 浏览器扩展
- 查看组件树和数据变化

### 场景 3: 跨域问题

**症状：** `CORS` 错误

**解决：**
1. 检查 vite.config.js 的 proxy 配置
2. 确保目标地址正确：`http://localhost:3001`
3. 检查后端是否设置了 CORS headers

**验证后端 CORS：**
```bash
curl -i -X OPTIONS http://localhost:3001/api/health
```

### 场景 4: Hot Reload 不工作

**症状：** 修改文件后页面不更新

**解决：**
1. 检查 Vite 服务器是否运行
2. 查看 Console 是否有连接错误
3. 硬刷新页面：`Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

---

## 📋 常用 API 端点

### 认证相关
```
POST /api/auth/login - 用户登录
POST /api/auth/register - 用户注册
POST /api/auth/login/sms - 短信验证码登录
```

### 用户相关
```
GET /api/users/me - 获取当前用户信息
GET /api/users/profile - 获取用户资料
GET /api/users/statistics - 获取用户统计
GET /api/users/leaderboard - 获取排行榜
```

### 题库相关
```
GET /api/questions - 获取题库列表
GET /api/questions/categories - 获取分类
GET /api/questions/:id - 获取题目详情
GET /api/questions/:id/practice-records - 获取练习记录
```

### 面试相关
```
POST /api/interview/generate-question - 生成题目
POST /api/interview/analyze - 分析回答
GET /api/interview/sessions - 获取会话列表
GET /api/interview/sessions/:id - 获取会话详情
```

---

## 🔍 调试技巧

### 1. 条件断点

在 Sources 标签：
1. 点击行号设置断点
2. 右键选择"编辑断点"
3. 输入条件表达式
4. 仅当条件为真时才暂停

### 2. 监视表达式

在 Sources 标签右侧面板：
1. 点击"Watch"
2. 添加表达式
3. 实时查看值的变化

### 3. 本地覆写

在 Network 标签：
1. 右键选择请求
2. 选择"保存为响应副本"
3. 编辑响应内容进行测试

### 4. 模拟网络延迟

在 Network 标签：
1. 点击"Throttling"下拉菜单
2. 选择网络速度配置
3. 测试慢网络环境下的行为

### 5. 模拟离线

在 Network 标签：
1. 勾选"Offline"
2. 测试离线缓存功能

---

## 📝 调试检查清单

启动调试前检查：
- [ ] 后端服务运行中（http://localhost:3001）
- [ ] 前端服务运行中（http://localhost:5174）
- [ ] 浏览器开发工具已打开
- [ ] 控制台没有全局错误
- [ ] Network 选项卡已清空

进行调试时检查：
- [ ] API 请求是否成功
- [ ] 响应数据格式是否正确
- [ ] 组件数据是否正确更新
- [ ] 是否有 console 错误或警告
- [ ] 页面性能是否正常

### 调试命令

启动调试服务器（如需重启）：

```bash
# 启动后端 Mock 服务
cd backend && npm start

# 启动前端开发服务
cd frontend && npm run dev
```

验证服务健康状态：

```bash
# 后端健康检查
curl http://localhost:3001/api/health

# 前端 API 代理
curl http://localhost:5174/api/health
```

---

## 🚀 快速调试启动

### 一键启动所有服务

```bash
# Windows PowerShell
./start-with-dify.ps1

# 或手动启动
cd backend && npm start &
cd frontend && npm run dev
```

### 运行集成测试

```bash
node test-integration-final.js
```

---

## 📞 获取帮助

### 查看服务日志

**后端日志：**
查看 Mock 服务器输出，寻找错误信息

**前端日志：**
1. 打开浏览器控制台
2. 查看 Network 标签
3. 检查是否有 CORS 错误

### 常见问题

**Q: 前端无法连接到后端？**
A: 确保后端运行在 3001 端口，检查 Network 标签中的 API 请求

**Q: 修改文件后页面没有更新？**
A: 检查 Vite 是否仍在运行，尝试硬刷新或重启 Vite

**Q: 获得 CORS 错误？**
A: 检查后端是否正确配置了 CORS，vite.config.js 中 proxy 设置是否正确

---

## 🎓 进阶调试

### 使用 Vue DevTools

1. 安装浏览器扩展
2. 打开开发工具的 Vue 标签
3. 查看组件树和实例数据
4. 追踪事件和生命周期

### 使用 Network Throttling

1. Network 标签 → Throttling
2. 选择不同网络条件
3. 测试应用在慢网络下的表现

### 使用性能监控

1. Performance 标签 → Record
2. 进行用户操作
3. 分析瓶颈和优化点

---

**✨ 系统已准备好开始调试！**

祝您调试愉快！如有问题，请查看日志或使用上述调试技巧。
