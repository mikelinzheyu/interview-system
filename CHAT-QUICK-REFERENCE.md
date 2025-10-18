# QQ 风格聊天中心 - 快速参考卡

## 📚 文档速查表

| 需求 | 参考文档 | 位置 |
|-----|--------|------|
| 📁 项目文件结构 | CHAT-INTEGRATION-SUMMARY.md | #文件清单 |
| 🎨 组件使用指南 | CHAT-INTEGRATION-SUMMARY.md | #快速集成步骤 |
| 🔍 搜索功能实现 | IMPLEMENTATION-GUIDE-CHAT.md | #消息搜索功能 |
| 👤 用户状态管理 | IMPLEMENTATION-GUIDE-CHAT.md | #用户在线状态管理 |
| ✏️ 消息编辑撤回 | IMPLEMENTATION-GUIDE-CHAT.md | #消息编辑和撤回 |
| 📤 文件上传下载 | IMPLEMENTATION-GUIDE-CHAT.md | #文件上传和下载 |
| 💬 引用消息 | IMPLEMENTATION-GUIDE-CHAT.md | #引用消息功能 |
| 📊 数据模型定义 | CHAT-DATA-MODELS.md | #核心数据模型 |
| 🗄️ 数据库 Schema | CHAT-DATA-MODELS.md | #数据库-schema |
| 📘 TypeScript 类型 | CHAT-DATA-MODELS.md | #typescript-类型定义 |
| 🌐 REST API 设计 | CHAT-API-DESIGN.md | #会话接口 |
| 💬 WebSocket 事件 | CHAT-API-DESIGN.md | #websocket-事件 |
| ⚙️ 错误处理 | CHAT-API-DESIGN.md | #错误处理 |

---

## 🎯 核心功能实现清单

### 会话管理
```
✅ 会话列表展示（按最后活跃排序）
✅ 会话置顶功能
✅ 会话免打扰功能
✅ 会话删除功能
✅ 会话搜索功能
⏳ 创建/编辑会话
```

### 消息管理
```
✅ 消息发送和接收
✅ 消息已读状态显示
✅ 消息编辑功能（15分钟内）
✅ 消息撤回功能
✅ 消息搜索功能
✅ 消息引用/回复
⏳ 消息表情反应
```

### 用户交互
```
✅ 用户在线/离线状态显示
✅ 输入状态提示（"正在输入..."）
✅ 用户自定义状态
✅ @提及功能
⏳ 语音/视频通话
```

### 文件处理
```
✅ 文件上传进度显示
⏳ 文件预览（图片、文档）
⏳ 文件下载管理
⏳ 图片缩略图显示
```

---

## 📁 新增文件位置

### 前端组件
```
frontend/src/components/chat/
├── ConversationListItem.vue          [新增]
├── ConversationListEnhanced.vue      [新增]
├── VirtualList.vue                   [新增]
├── MessageBubble.vue                 [新增]
└── ChatLayout.vue                    [现有]
```

### 前端服务
```
frontend/src/services/
├── messageSearchService.js           [新增]
├── uploadService.js                  [新增]
└── chatService.js                    [建议新增]
```

### 前端 Store
```
frontend/src/stores/
├── chatWorkspace.js                  [现有，建议增强]
├── chatRooms.js                      [现有，建议增强]
└── userStatus.js                     [新增]
```

### 类型定义
```
frontend/src/types/
└── chat.ts                           [新增]
```

---

## 🚀 快速启动命令

### 1. 安装依赖（如需）
```bash
npm install
# 确保已安装：element-plus, pinia, socket.io-client, vue-router
```

### 2. 复制组件文件
```bash
# 从你的项目中复制这些文件到正确的位置
cp ConversationListItem.vue frontend/src/components/chat/
cp ConversationListEnhanced.vue frontend/src/components/chat/
cp VirtualList.vue frontend/src/components/chat/
cp MessageBubble.vue frontend/src/components/chat/
```

### 3. 创建服务文件
```bash
# 创建以下文件并复制相应的代码
touch frontend/src/services/messageSearchService.js
touch frontend/src/services/uploadService.js
touch frontend/src/stores/userStatus.js
touch frontend/src/types/chat.ts
```

### 4. 启动开发服务器
```bash
npm run dev
```

---

## 🎨 样式主题变量

在你的全局 CSS 中定义这些变量：

```css
:root {
  /* 文本 */
  --chat-text-primary: #333;
  --chat-text-secondary: #999;

  /* 背景 */
  --chat-list-item-bg: rgba(0, 0, 0, 0.02);
  --chat-list-item-hover-bg: rgba(0, 0, 0, 0.05);
  --chat-list-item-active-bg: #e3f2fd;

  /* 消息气泡 */
  --chat-message-own-bg: #409eff;
  --chat-message-other-bg: rgba(0, 0, 0, 0.08);

  /* 状态指示器 */
  --chat-status-online: #67c23a;
  --chat-status-away: #e6a23c;
  --chat-status-busy: #f56c6c;
  --chat-status-offline: #909399;
}
```

---

## 📱 响应式断点

```javascript
// 大屏 (1440px+) - 3 列布局
// 左: 320px | 中: 1fr | 右: 320px

// 中屏 (960px - 1279px) - 2 列布局
// 左: 280px | 中: 1fr

// 小屏 (< 960px) - 1 列布局
// 中: 1fr (左侧隐藏，可通过菜单展开)
```

---

## 💾 关键数据结构

### Message 对象
```typescript
{
  id: 100,                      // 消息ID
  conversationId: 1,            // 所属对话
  content: "大家好",            // 内容
  contentType: "text",          // 类型: text|image|attachment
  senderId: 1,                  // 发送者ID
  senderName: "张三",           // 发送者名称
  status: "read",               // 状态: pending|delivered|read|failed
  isOwn: true,                  // 是否是自己发送
  attachments: [],              // 附件列表
  quotedMessage: null,          // 被引用的消息
  createdAt: "2024-01-20T10:30:00Z"
}
```

### Conversation 对象
```typescript
{
  id: 1,                        // 对话ID
  name: "前端开发",             // 对话名称
  type: "group",                // 类型: private|group|public
  avatar: "http://...",         // 头像
  memberCount: 15,              // 成员数
  onlineCount: 8,               // 在线人数
  unreadCount: 3,               // 未读数
  pinned: false,                // 是否置顶
  isMuted: false,               // 是否禁言
  lastMessage: {...},           // 最后一条消息
  lastMessageAt: "2024-01-20T10:30:00Z"
}
```

---

## 🔌 Socket 事件快速查询

### 发送事件
```javascript
// 发送消息
socket.emit('send-message', { conversationId, content, ... })

// 设置输入状态
socket.emit('typing-status', { conversationId, isTyping: true })

// 标记已读
socket.emit('message-read', { conversationId, messageIds: [...] })

// 设置在线状态
socket.emit('set-status', { status: 'busy', customMessage: '...' })
```

### 接收事件
```javascript
// 接收新消息
socket.on('message-received', (message) => { ... })

// 消息已读
socket.on('message-read', (data) => { ... })

// 用户上线
socket.on('user-online', (data) => { ... })

// 用户离线
socket.on('user-offline', (data) => { ... })

// 用户输入
socket.on('user-typing', (data) => { ... })
```

---

## 🔧 常见操作代码片段

### 发送消息
```javascript
const message = await store.sendMessage(conversationId, "内容")
```

### 搜索消息
```javascript
const results = await messageSearchService.searchMessages("关键词", {
  conversationId: 1,
  dateRange: [new Date('2024-01-01'), new Date('2024-01-31')]
})
```

### 更新用户状态
```javascript
socketService.setMyStatus('busy', '在开会中...')
```

### 上传文件
```javascript
const result = await uploadService.uploadFile(
  file,
  conversationId,
  (progress) => console.log(`上传进度: ${progress}%`)
)
```

### 标记为已读
```javascript
store.markConversationRead(conversationId)
```

---

## ⚡ 性能优化技巧

### 1. 虚拟列表
```vue
<VirtualList
  :items="conversations"
  :item-size="72"
  :height="600"
>
  <template #default="{ item }">
    <ConversationListItem :conversation="item" />
  </template>
</VirtualList>
```

### 2. 缓存搜索结果
```javascript
// 已内置在 messageSearchService 中
const cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
```

### 3. 防抖输入状态
```javascript
// 已内置在 socket 服务中
const TYPING_THROTTLE_MS = 1200
```

### 4. 图片懒加载
```vue
<img v-lazy="image.url" :alt="image.name" />
```

---

## 🎯 按优先级实施顺序

### 第 1 阶段（关键）⭐⭐⭐
1. 集成新会话列表组件
2. 集成新消息气泡组件
3. 实现消息搜索功能
4. 优化用户状态显示

### 第 2 阶段（重要）⭐⭐
5. 实现文件上传功能
6. 完善消息编辑功能
7. 添加消息引用功能
8. 增强 Socket 事件处理

### 第 3 阶段（可选）⭐
9. 实现消息表情反应
10. 添加消息翻译功能
11. 实现语音/视频通话
12. 消息加密存储

---

## 🐛 调试技巧

### 查看消息对象
```javascript
console.log(JSON.stringify(message, null, 2))
```

### 监听 Socket 事件
```javascript
socketService.socket.onAny((event, ...args) => {
  console.log(`Socket Event: ${event}`, args)
})
```

### 查看 Store 状态
```javascript
const store = useChatWorkspaceStore()
console.log('Conversations:', store.conversations)
console.log('Active Messages:', store.activeMessages)
```

### 测试搜索功能
```javascript
import messageSearchService from '@/services/messageSearchService'
messageSearchService.searchMessages('测试')
```

---

## 📞 获取帮助

1. **文档查阅**
   - IMPLEMENTATION-GUIDE-CHAT.md - 详细实现指南
   - CHAT-DATA-MODELS.md - 数据模型参考
   - CHAT-API-DESIGN.md - API 接口设计

2. **问题排查**
   - 检查浏览器控制台是否有错误
   - 验证 Socket 连接状态
   - 确认 API 端点是否响应正确

3. **性能优化**
   - 使用浏览器开发工具的 Performance 标签
   - 检查网络请求是否过于频繁
   - 验证虚拟列表是否正确加载

---

## ✅ 测试清单

在提交前，请测试以下功能：

- [ ] 会话列表加载和排序
- [ ] 新消息实时显示
- [ ] 消息已读状态更新
- [ ] 消息搜索功能
- [ ] 文件上传和下载
- [ ] 用户状态显示和更新
- [ ] 消息编辑和撤回
- [ ] 移动端响应式显示
- [ ] Socket 连接断开重连
- [ ] 离线消息同步

---

最后，祝你实施顺利！如有问题，欢迎反馈。🚀
