# 第1周快速参考指南

## 🎯 3分钟快速回顾

### 第1周完成了什么？
✅ 集成了4个高级聊天组件
✅ 创建了完整的消息搜索系统
✅ 实现了会话置顶/免打扰/已读标记/删除API

---

## 📂 核心文件位置

### 前端核心文件

| 文件 | 位置 | 说明 |
|------|------|------|
| 用户状态Store | `frontend/src/stores/userStatus.js` | 用户在线状态管理 |
| 搜索服务 | `frontend/src/services/messageSearchService.js` | 消息搜索逻辑 |
| 搜索页面 | `frontend/src/views/chat/ChatSearch.vue` | 搜索UI组件 |
| 主聊天页面 | `frontend/src/views/chat/ChatRoom.vue` | 集成所有新功能 |
| API调用 | `frontend/src/api/chat.js` | 聊天相关API |
| 路由配置 | `frontend/src/router/index.js` | 包含搜索路由 |

### 后端API端点

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/chat/conversations/:id/pin` | 置顶会话 |
| POST | `/api/chat/conversations/:id/mute` | 免打扰会话 |
| POST | `/api/chat/conversations/:id/mark-read` | 标记已读 |
| DELETE | `/api/chat/conversations/:id` | 删除会话 |

---

## 💻 常用代码片段

### 1. 搜索消息
```javascript
import { searchMessagesLocally, formatSearchResults } from '@/services/messageSearchService'

// 执行搜索
const results = searchMessagesLocally(
  messages,           // 消息数组
  '搜索关键词',        // 关键词
  {
    senderId: '123',  // 可选：按发送者
    type: 'text',     // 可选：按类型
    startDate: new Date('2024-01-01'),  // 可选：开始日期
    endDate: new Date('2024-12-31'),    // 可选：结束日期
    status: 'read'    // 可选：消息状态
  }
)

// 格式化结果（高亮显示）
const formatted = formatSearchResults(results, '搜索关键词')
```

### 2. 置顶会话
```javascript
import { pinConversation } from '@/api/chat'

// 置顶
await pinConversation('conversation-id', true)

// 取消置顶
await pinConversation('conversation-id', false)
```

### 3. 免打扰会话
```javascript
import { muteConversation } from '@/api/chat'

// 免打扰1小时（3600秒）
await muteConversation('conversation-id', true, 3600)

// 取消免打扰
await muteConversation('conversation-id', false)
```

### 4. 标记已读
```javascript
import { markConversationRead } from '@/api/chat'

await markConversationRead('conversation-id')
```

### 5. 删除会话
```javascript
import { deleteConversation } from '@/api/chat'

await deleteConversation('conversation-id')
```

### 6. 用户状态管理
```javascript
import { useUserStatusStore } from '@/stores/userStatus'

const statusStore = useUserStatusStore()

// 设置单个用户状态
statusStore.setUserStatus('user-123', 'online')

// 批量设置
statusStore.setUserStatuses([
  { userId: '123', status: 'online' },
  { userId: '456', status: 'away' }
])

// 检查用户是否在线
const isOnline = statusStore.isUserOnline('user-123')

// 获取用户状态
const status = statusStore.getUserStatus('user-123')
```

---

## 🔍 调试技巧

### 查看搜索缓存
```javascript
import { getCacheStats } from '@/services/messageSearchService'

const stats = getCacheStats()
console.log('缓存项数:', stats.size)
console.log('缓存详情:', stats.items)
```

### 清除搜索缓存
```javascript
import { clearSearchCache } from '@/services/messageSearchService'

clearSearchCache()
```

### 浏览器控制台测试API
```javascript
// 在浏览器控制台测试置顶API
fetch('/api/chat/conversations/test-room/pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pinned: true })
}).then(r => r.json()).then(d => console.log(d))
```

---

## 🔗 路由导航

### 访问搜索页面
```javascript
// 方式1：在模板中
<router-link to="/chat/search?q=关键词">搜索</router-link>

// 方式2：在代码中
router.push({
  name: 'ChatSearch',
  query: { q: '关键词' }
})

// 方式3：直接访问
window.location.href = 'http://localhost:5174/chat/search?q=关键词'
```

---

## ⚙️ 配置参数

### 搜索缓存配置
**文件**: `frontend/src/services/messageSearchService.js`
```javascript
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5分钟过期时间
```

### 用户状态配置
**文件**: `frontend/src/stores/userStatus.js`
```javascript
// 支持的状态: 'online', 'offline', 'away', 'busy'
```

---

## 🧪 单元测试建议

### 搜索功能测试
```javascript
// 测试本地搜索
const testMessages = [
  { id: 1, content: '你好', senderName: '张三' },
  { id: 2, content: '世界', senderName: '李四' }
]

const results = searchMessagesLocally(testMessages, '你')
assert(results.length === 1)
assert(results[0].content === '你好')
```

### API调用测试
```javascript
// 测试置顶API
const response = await pinConversation('test-id', true)
assert(response.pinned === true)
assert(response.id === 'test-id')
```

---

## 🚀 启动命令

### 启动后端
```bash
cd backend
node mock-server.js
```

### 启动前端
```bash
cd frontend
npm run dev
```

### 同时启动前后端
```bash
npm run dev:full
```

---

## 📊 常见问题排查

### Q: 搜索结果为空
**A**:
1. 检查搜索关键词是否正确
2. 检查消息列表是否已加载
3. 使用浏览器控制台查看日志
4. 清除搜索缓存: `clearSearchCache()`

### Q: API调用返回404
**A**:
1. 确认后端服务已启动（端口3001）
2. 检查API路径是否正确
3. 查看backend.log文件
4. 确认路由处理已添加

### Q: 用户状态未显示
**A**:
1. 检查userStatusStore是否初始化
2. 确认用户ID正确
3. 检查Vue DevTools中的Pinia状态

### Q: 虚拟列表显示异常
**A**:
1. 检查项目高度配置
2. 确认容器宽度正确
3. 检查浏览器控制台错误

---

## 📖 详细文档

| 文档 | 说明 |
|------|------|
| `WEEK1-COMPLETION-SUMMARY.md` | 完整的第1周总结 |
| `PHASE1-INTEGRATION-GUIDE.md` | 详细集成步骤 |
| `IMPLEMENTATION-SCHEDULE.md` | 6-8周完整计划 |
| `IMPLEMENTATION-GUIDE-CHAT.md` | 详细实现指南 |

---

## ✅ 第2周准备清单

- [ ] 阅读`WEEK1-COMPLETION-SUMMARY.md`了解第1周成果
- [ ] 查看`IMPLEMENTATION-SCHEDULE.md`中第2周计划
- [ ] 准备文件上传功能实现
- [ ] 测试所有第1周功能是否正常
- [ ] 检查代码质量和文档完整性

---

**最后更新**: 2024年
**状态**: ✅ 完成
**下一阶段**: 第2-3周文件上传和消息编辑功能
