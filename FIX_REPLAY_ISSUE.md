# 错题复盘功能 - 问题修复指南

## 🔴 问题描述

点击"错题复盘"按钮时显示：**"未找到面试记录，请先完成面试"**

## 🔍 根本原因

### 主要原因：前端服务未启动
- 后端已启动 ✅ (http://localhost:3001)
- 前端未启动 ❌

### 次要原因（如果前端启动后仍有问题）
1. recordId 未正确保存到 sessionStorage
2. 面试报告保存 API 调用失败
3. 数据库连接问题

---

## ✅ 解决方案

### 步骤 1: 启动前端服务

打开**新的终端窗口**，执行以下命令：

```bash
cd frontend
npm install
npm run dev
```

**预期输出**:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 步骤 2: 访问应用

在浏览器中打开：
- **http://localhost:5173** (推荐)
- 或 **http://localhost:3000** (如果5173被占用)

### 步骤 3: 完成面试流程

1. 完成一次模拟面试
2. 进入面试报告页面 (`/interview/report-v2`)
3. 等待报告自动保存（查看浏览器控制台）
4. 点击"错题复盘"按钮

---

## 🔧 调试步骤（如果问题仍未解决）

### 打开浏览器开发者工具

按 **F12** 或右键 → **检查**

### 查看 Console 标签

查找以下日志：

**成功情况**:
```
[InterviewReportV2] 开始保存面试报告到数据库...
[InterviewReportV2] ✅ 报告已保存，recordId = xxx-xxx-xxx
```

**失败情况**:
```
[InterviewReportV2] 保存报告失败: ...
```

### 查看 Network 标签

1. 刷新页面
2. 完成面试
3. 查看 **POST /api/interview/save-report** 请求
4. 检查响应状态码：
   - **201**: 成功 ✅
   - **400**: 请求参数错误
   - **500**: 服务器错误
   - **Network Error**: 后端未响应

### 检查 sessionStorage

在浏览器控制台运行：

```javascript
// 检查 recordId 是否已保存
console.log(sessionStorage.getItem('interview_record_id'))

// 应该输出类似: "550e8400-e29b-41d4-a716-446655440000"
// 如果输出 null，说明 recordId 未保存
```

---

## 📋 完整的启动流程

### 终端 1 - 启动后端

```bash
cd backend
npm install
npm start
```

**预期输出**:
```
[timestamp] GET /health
API server listening on port 3001
```

### 终端 2 - 启动前端

```bash
cd frontend
npm install
npm run dev
```

**预期输出**:
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 终端 3 - 可选：运行诊断脚本

```bash
bash diagnose-issue.sh
```

---

## 🚨 常见错误和解决方案

### 错误 1: 前端无法连接到后端

**症状**: 浏览器控制台显示 `Failed to fetch` 或 `Network Error`

**原因**: 后端未启动或端口不正确

**解决**:
```bash
# 检查后端是否运行
curl http://localhost:3001/health

# 如果返回 404，说明后端未启动
# 启动后端
cd backend && npm start
```

---

### 错误 2: 报告保存失败 (500 错误)

**症状**: 浏览器控制台显示 `POST /api/interview/save-report 500`

**原因**: 通常是数据库连接问题

**解决**:
```bash
# 1. 检查数据库配置
cat backend/.env | grep DB_

# 2. 确保数据库已启动
# 对于 MySQL:
mysql -u root -p

# 对于 PostgreSQL:
psql -U postgres

# 3. 检查后端日志中的错误信息
# 查看后端终端的输出
```

---

### 错误 3: recordId 未保存

**症状**: 报告保存成功但 recordId 为 null

**原因**: API 响应格式不正确或 sessionStorage 被禁用

**解决**:
```javascript
// 在浏览器控制台检查
// 1. 检查 sessionStorage 是否可用
console.log(typeof sessionStorage)  // 应该输出 "object"

// 2. 手动保存 recordId
sessionStorage.setItem('interview_record_id', 'test-id')
console.log(sessionStorage.getItem('interview_record_id'))  // 应该输出 "test-id"

// 3. 检查浏览器隐私设置
// 某些浏览器的隐私模式可能禁用 sessionStorage
```

---

### 错误 4: 面试报告页面为空

**症状**: 进入报告页面但没有看到任何内容

**原因**: 面试数据未正确传递

**解决**:
```javascript
// 在浏览器控制台检查
// 查看 history.state 中是否有数据
console.log(history.state)

// 应该包含:
// {
//   jobTitle: "...",
//   difficulty: "...",
//   answers: [...],
//   overallScore: ...,
//   ...
// }
```

---

## 📊 验证修复

完成以下步骤验证问题已解决：

- [ ] 前端服务已启动 (http://localhost:5173)
- [ ] 后端服务已启动 (http://localhost:3001)
- [ ] 完成了一次面试
- [ ] 进入面试报告页面
- [ ] 浏览器控制台显示 "✅ 报告已保存"
- [ ] sessionStorage 中有 interview_record_id
- [ ] 点击"错题复盘"按钮成功导航到复盘页面
- [ ] 复盘页面显示错题列表

---

## 🎯 快速修复清单

```bash
# 1. 打开新终端，启动前端
cd frontend && npm run dev

# 2. 等待前端启动完成
# 3. 在浏览器中打开 http://localhost:5173
# 4. 完成面试
# 5. 点击"错题复盘"按钮

# 如果仍有问题，运行诊断脚本
bash diagnose-issue.sh
```

---

## 📞 获取帮助

如果问题仍未解决，请提供以下信息：

1. **浏览器控制台的完整错误信息**
   - 按 F12 打开开发者工具
   - 复制 Console 标签中的所有错误

2. **后端服务的日志输出**
   - 复制后端终端中的所有输出

3. **Network 标签中的请求详情**
   - 查看 POST /api/interview/save-report 的响应

4. **系统信息**
   - 操作系统
   - Node.js 版本 (`node -v`)
   - npm 版本 (`npm -v`)

---

**最后更新**: 2026-03-26
**状态**: ✅ 问题已诊断，解决方案已提供
