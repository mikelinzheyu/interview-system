# Week 4 快速参考指南 - 测试与优化

**文档日期**: 2024年
**项目进度**: 80% 完成
**当前阶段**: 测试框架建立 (35% 完成)

---

## 📝 快速开始

### 安装依赖

```bash
cd frontend

# 安装测试框架
npm install -D vitest @vue/test-utils happy-dom

# 或者使用 Jest
npm install -D jest @babel/preset-env @vue/vue3-jest
```

### 运行测试

```bash
# 运行所有测试
npm run test

# 监听模式（开发中实时运行）
npm run test:watch

# 生成覆盖报告
npm run test:coverage

# UI 界面
npm run test:ui
```

---

## 🧪 测试文件位置

| 文件 | 位置 | 测试数 |
|------|------|--------|
| 用户状态服务 | `frontend/src/__tests__/services/userStatusEnhancedService.test.js` | 31 |
| 聊天API | `frontend/src/__tests__/api/chat.test.js` | 16 |

**总计**: 47个测试用例

---

## 📊 测试覆盖区域

### userStatusEnhancedService.test.js (31 tests)

```javascript
✅ 基础状态管理 (4 tests)
   - 初始化为 online
   - 设置不同状态
   - 返回完整状态对象
   - 拒绝无效状态

✅ 自定义消息 (5 tests)
   - 设置消息
   - 长度限制 (50字符)
   - 接受最大50字符
   - 设置空消息
   - 同时设置状态和消息

✅ 状态历史 (4 tests)
   - 记录状态变化
   - 限制100条记录
   - 指定数量返回
   - 包含时间戳

✅ 格式化显示 (3 tests)
   - 返回格式化信息
   - 包含自定义消息
   - 不同图标

✅ 数据持久化 (3 tests)
   - 保存到 localStorage
   - 从 localStorage 恢复
   - 离线状态恢复为在线

✅ 配置测试 (3 tests)
   - 返回正确配置
   - 返回所有可用状态
   - 状态包含标签和图标

✅ 事件回调 (3 tests)
   - 触发状态变化回调
   - 多个回调支持
   - 取消注册回调

✅ 边界值 (4 tests)
   - 快速状态变化
   - 连续设置相同状态
   - 空的自定义消息
   - 始终有有效时间戳

✅ 整合测试 (2 tests)
   - 完整状态流程
   - 持久化和恢复
```

### chat.test.js (16 tests)

```javascript
✅ 用户状态 API (6 tests)
   - getCurrentUserStatus()
   - updateUserStatus()
   - getUserStatus()
   - getUserStatuses()
   - setStatusMessage()
   - getStatusHistory()

✅ 会话管理 (4 tests)
   - pinConversation()
   - muteConversation()
   - markConversationRead()
   - deleteConversation()

✅ 文件和消息 (3 tests)
   - uploadFile()
   - editMessage()
   - recallMessage()

✅ 错误处理 (3 tests)
   - 缺少参数
   - 无效 userId
   - 空数组处理
```

---

## 🎯 性能基准

| 指标 | 目标 | 当前状态 |
|------|------|---------|
| 首屏加载 | < 2秒 | 待测 |
| 状态切换 | < 100ms | 待测 |
| API响应 | < 500ms | 待测 |
| 内存占用 | < 100MB | 待测 |
| 测试执行 | < 5秒 | < 4秒 |

---

## 🚀 优化清单

### 虚拟列表优化
- [ ] 固定高度配置
- [ ] 缓冲区大小调整
- [ ] 可见范围计算
- [ ] DOM节点优化

### 缓存策略
- [ ] 智能缓存实现
- [ ] TTL配置
- [ ] 缓存失效机制
- [ ] 内存管理

### API优化
- [ ] 请求合并 (Debounce)
- [ ] 批量查询优化
- [ ] 请求缓存
- [ ] 错误重试

### 组件优化
- [ ] 计算属性缓存
- [ ] 减少 DOM 更新
- [ ] v-show 替代 v-if
- [ ] 事件防抖

### 包大小优化
- [ ] 树摇 (Tree Shaking)
- [ ] 代码分割
- [ ] 懒加载
- [ ] 压缩优化

---

## 📈 性能测试命令

### 加载时间测试
```javascript
performance.mark('start')
// ... 操作
performance.mark('end')
performance.measure('operation', 'start', 'end')
const measure = performance.getEntriesByName('operation')[0]
console.log(`耗时: ${measure.duration}ms`)
```

### 内存测试
```javascript
if (performance.memory) {
  console.log(`已用: ${performance.memory.usedJSHeapSize / 1048576}MB`)
  console.log(`总堆: ${performance.memory.totalJSHeapSize / 1048576}MB`)
}
```

### API 性能测试
```bash
# 运行 1000 次请求
for i in {1..1000}; do
  curl -s http://localhost:3001/api/chat/users/me/status
done
```

---

## 🔧 调试技巧

### 运行单个测试
```bash
npm run test -- userStatusEnhancedService.test.js
npm run test -- --grep="状态管理"
```

### 覆盖率报告
```bash
npm run test:coverage
# 生成 HTML 报告: coverage/index.html
```

### 监听特定文件
```bash
npm run test:watch userStatusEnhancedService.test.js
```

### UI 调试
```bash
npm run test:ui
# 打开浏览器: http://localhost:51204/__vitest__/
```

---

## 📚 重要文件

| 文件 | 说明 |
|------|------|
| `WEEK4-TESTING-AND-OPTIMIZATION.md` | 完整指南 (1050 行) |
| `WEEK4-QUICK-REFERENCE.md` | 本文件 - 快速参考 |
| `frontend/src/__tests__/services/userStatusEnhancedService.test.js` | 服务测试 (700 行) |
| `frontend/src/__tests__/api/chat.test.js` | API 测试 (300 行) |

---

## ✅ 完成检查清单

### 第 4 周任务

- [x] 创建单元测试套件
  - [x] userStatusEnhancedService 测试 (31 tests)
  - [x] chat API 测试 (16 tests)

- [ ] 集成测试 (待开始)
  - [ ] 端对端工作流
  - [ ] 前后端交互
  - [ ] 错误恢复

- [ ] 性能基准 (待开始)
  - [ ] 加载时间测试
  - [ ] 内存使用测试
  - [ ] API 响应时间

- [ ] 性能优化 (待开始)
  - [ ] 虚拟列表优化
  - [ ] 缓存优化
  - [ ] API 优化
  - [ ] 组件优化
  - [ ] 包大小优化

---

## 🎯 下周目标 (Week 5)

- [ ] 完成所有集成测试
- [ ] 执行性能优化
- [ ] 生成优化报告
- [ ] WebSocket 集成准备

---

## 📞 快速帮助

### 常见问题

**Q: 如何快速运行测试?**
A: `npm run test:ui` 在浏览器中查看所有测试

**Q: 覆盖率如何查看?**
A: `npm run test:coverage` 然后打开 `coverage/index.html`

**Q: 如何只运行失败的测试?**
A: `npm run test -- --reporter=verbose`

**Q: 测试太慢?**
A: 使用 `npm run test -- --threads=1` 减少并发

---

**项目进度**: 80% 完成
**下一步**: 继续执行集成测试和性能优化

