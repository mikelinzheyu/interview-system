# 第1周集成任务 - 详细操作指南

## 任务1: 集成4个前端组件到ChatRoom.vue

### 步骤1.1: 更新imports
在 `frontend/src/views/chat/ChatRoom.vue` 的 `<script setup>` 中修改导入语句:

```javascript
// 从这样改：
import ConversationList from '@/components/chat/ConversationList.vue'

// 改成这样：
import ConversationListEnhanced from '@/components/chat/ConversationListEnhanced.vue'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import { useUserStatusStore } from '@/stores/userStatus'
```

### 步骤1.2: 在script中添加状态变量
在 `onMounted` 前添加:

```javascript
const statusStore = useUserStatusStore()
const userStatusMap = computed(() => statusStore.userStatusMap)
```

### 步骤1.3: 替换template中的组件

#### 替换左侧会话列表 (第6-16行):
```vue
<!-- 旧的: -->
<ConversationList
  :conversations="store.conversations"
  :active-id="store.activeConversationId"
  :loading="store.conversationsLoading"
  @select="handleConversationSelect"
>
  <template #actions>
    <el-button type="primary" text @click="handleCreateConversation">新建</el-button>
  </template>
</ConversationList>

<!-- 新的: -->
<ConversationListEnhanced
  :conversations="store.conversations"
  :active-conversation-id="store.activeConversationId"
  :loading="store.conversationsLoading"
  :user-status-map="userStatusMap"
  :show-online-status="true"
  @select="handleConversationSelect"
  @create="handleCreateConversation"
  @pin="handlePin"
  @mute="handleMute"
  @mark-read="handleMarkRead"
  @delete="handleDeleteConversation"
  @search="handleSearch"
/>
```

### 步骤1.4: 在MessagePanel中集成MessageBubble
修改 `frontend/src/components/chat/MessagePanel.vue` 来使用新的 MessageBubble 组件

在消息渲染部分使用:
```vue
<MessageBubble
  v-for="message in messages"
  :key="message.id"
  :message="message"
  :is-group-chat="isGroupChat"
  :current-user-avatar="currentUserAvatar"
  @reply="handleReply"
  @edit="handleEdit"
  @resend="handleResend"
  @recall="handleRecall"
  @delete="handleDelete"
  @copy="handleCopy"
  @preview-image="handlePreviewImage"
/>
```

### 步骤1.5: 添加新的事件处理方法

在 ChatRoom.vue 的 script 中添加这些方法:

```javascript
// 会话置顶
function handlePin(conversationId) {
  const conversation = store.conversations.find(c => c.id === conversationId)
  if (conversation) {
    conversation.pinned = !conversation.pinned
    ElMessage.success(conversation.pinned ? '已置顶' : '已取消置顶')
  }
}

// 会话免打扰
function handleMute(conversationId) {
  const conversation = store.conversations.find(c => c.id === conversationId)
  if (conversation) {
    conversation.isMuted = !conversation.isMuted
    ElMessage.success(conversation.isMuted ? '已禁言' : '已取消禁言')
  }
}

// 标记为已读
function handleMarkRead(conversationId) {
  store.markConversationRead(conversationId)
  ElMessage.success('已标记为已读')
}

// 删除对话
function handleDeleteConversation(conversationId) {
  store.conversations = store.conversations.filter(c => c.id !== conversationId)
  ElMessage.success('已删除对话')
}

// 搜索
function handleSearch(query) {
  console.log('搜索关键词:', query)
  // TODO: 实现搜索功能
}

// 消息操作
function handleReply(message) {
  draft.value = `> ${message.senderName}: ${message.content}\n`
}

function handleEdit(message) {
  draft.value = message.content
  // TODO: 实现编辑功能
}

function handleResend(message) {
  handleResendMessage(message)
}

function handleRecall(message) {
  handleRecallMessage(message)
}

function handleDelete(message) {
  store.removeMessage(store.activeConversationId, message.id)
}

function handleCopy(message) {
  if (message.content) {
    navigator.clipboard.writeText(message.content)
    ElMessage.success('已复制')
  }
}

function handlePreviewImage(image) {
  // TODO: 实现图片预览功能
  window.open(image.url, '_blank')
}
```

---

## 任务2: 创建消息搜索服务

### 步骤2.1: 创建搜索服务文件
创建 `frontend/src/services/messageSearchService.js`

参考 IMPLEMENTATION-GUIDE-CHAT.md 中的完整实现代码

### 步骤2.2: 创建搜索页面
创建 `frontend/src/views/chat/ChatSearch.vue`

参考 IMPLEMENTATION-GUIDE-CHAT.md 中的完整实现代码

### 步骤2.3: 添加路由
在 `frontend/src/router/index.js` 中添加:

```javascript
{
  path: '/chat/search',
  name: 'ChatSearch',
  component: () => import('@/views/chat/ChatSearch.vue'),
  meta: { requiresAuth: true }
}
```

---

## 任务3: 实现会话置顶/免打扰API

### 步骤3.1: 后端API实现

在 `backend/mock-server.js` 中添加以下端点:

```javascript
// 置顶会话
app.post('/api/chat/conversations/:id/pin', (req, res) => {
  const { id } = req.params
  const { pinned } = req.body

  // 更新数据库
  // ...

  res.json({
    code: 200,
    message: 'success',
    data: { id, pinned }
  })
})

// 免打扰会话
app.post('/api/chat/conversations/:id/mute', (req, res) => {
  const { id } = req.params
  const { muted, duration } = req.body

  // 更新数据库
  // ...

  res.json({
    code: 200,
    message: 'success',
    data: { id, muted }
  })
})

// 标记为已读
app.post('/api/chat/conversations/:id/mark-read', (req, res) => {
  const { id } = req.params

  // 更新数据库
  // ...

  res.json({
    code: 200,
    message: 'success'
  })
})
```

### 步骤3.2: 前端API调用

在 `frontend/src/api/chat.js` 中添加:

```javascript
// 置顶会话
export function pinConversation(id, pinned) {
  return api({
    url: `/chat/conversations/${id}/pin`,
    method: 'post',
    data: { pinned }
  })
}

// 免打扰会话
export function muteConversation(id, muted, duration) {
  return api({
    url: `/chat/conversations/${id}/mute`,
    method: 'post',
    data: { muted, duration }
  })
}

// 标记为已读
export function markConversationRead(id) {
  return api({
    url: `/chat/conversations/${id}/mark-read`,
    method: 'post'
  })
}
```

### 步骤3.3: 更新ChatRoom.vue中的方法

```javascript
async function handlePin(conversationId) {
  try {
    const conversation = store.conversations.find(c => c.id === conversationId)
    if (!conversation) return

    const newPinned = !conversation.pinned
    await pinConversation(conversationId, newPinned)

    conversation.pinned = newPinned
    ElMessage.success(newPinned ? '已置顶' : '已取消置顶')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleMute(conversationId) {
  try {
    const conversation = store.conversations.find(c => c.id === conversationId)
    if (!conversation) return

    const newMuted = !conversation.isMuted
    await muteConversation(conversationId, newMuted)

    conversation.isMuted = newMuted
    ElMessage.success(newMuted ? '已禁言' : '已取消禁言')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleMarkRead(conversationId) {
  try {
    await markConversationRead(conversationId)
    store.markConversationRead(conversationId)
    ElMessage.success('已标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}
```

---

## 验证清单

第1周完成后，请检查以下项目:

- [ ] 4个新组件已在 `frontend/src/components/chat/` 中
- [ ] ChatRoom.vue 已更新导入和使用新组件
- [ ] 新的事件处理方法已添加到 ChatRoom.vue
- [ ] 消息搜索服务已创建
- [ ] 搜索页面已创建并添加路由
- [ ] 后端API端点已实现
- [ ] 前端API调用已添加
- [ ] 所有功能已在浏览器中测试

---

## 下一步

完成第1周后，继续：
- 第2-3周：实现文件上传功能
- 第2-3周：添加消息编辑/撤回
- 第2-3周：增强用户状态管理
