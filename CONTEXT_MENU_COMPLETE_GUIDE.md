# 🖱️ 右键菜单完整功能实现指南

## 📋 概述

本指南详细说明如何完善 ContextMenu 组件的所有功能。

## 🎯 右键菜单功能列表

| 功能 | 说明 | 实现状态 | 优先级 |
|------|------|---------|--------|
| 回复 | 引用消息并回复 | ✅ 框架完成 | P1 |
| 复制 | 复制消息内容 | ✅ 框架完成 | P1 |
| 编辑 | 编辑自己的消息 | ✅ 框架完成 | P1 |
| 撤回 | 撤回自己的消息 | ✅ 框架完成 | P1 |
| 转发 | 转发消息 | ✅ 框架完成 | P2 |
| 屏蔽 | 屏蔽用户消息 | ✅ 框架完成 | P2 |

## 💻 实现详解

### 1. 回复功能

```javascript
// ChatRoom.vue

function handleReplyMessage(message) {
  // 存储引用的消息
  replyingTo.value = {
    id: message.id,
    content: message.content,
    senderName: message.senderName
  }

  // 显示回复框
  showReplyBox.value = true

  // 获取焦点到输入框
  nextTick(() => {
    inputRef.value?.focus?.()
  })

  // 在输入框上方显示引用
  ElNotification({
    title: '正在回复',
    message: `回复: ${message.senderName}`,
    type: 'info',
    duration: 2000
  })
}
```

**模板修改 (MessageInputNew.vue):**

```vue
<!-- 回复框 -->
<div v-if="replyingTo" class="reply-box">
  <div class="reply-content">
    <span class="reply-label">回复 {{ replyingTo.senderName }}:</span>
    <span class="reply-text">{{ replyingTo.content.substring(0, 50) }}...</span>
  </div>
  <el-button
    text
    type="danger"
    size="small"
    @click="replyingTo = null"
  >
    ✕
  </el-button>
</div>
```

**样式:**

```css
.reply-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f0f9ff;
  border-left: 3px solid #5c6af0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.reply-content {
  flex: 1;
}

.reply-label {
  font-weight: 600;
  color: #5c6af0;
  margin-right: 4px;
}

.reply-text {
  color: #666;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 2. 复制功能

```javascript
// ChatRoom.vue

function handleCopyMessage(message) {
  try {
    // 获取消息内容
    const content = message.content

    // 使用 Clipboard API 复制
    navigator.clipboard.writeText(content).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => {
      // 降级方案：使用传统方法
      copyToClipboardFallback(content)
    })
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 降级方案（兼容较旧浏览器）
function copyToClipboardFallback(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  ElMessage.success('已复制到剪贴板')
}
```

### 3. 编辑功能

```javascript
// ChatRoom.vue

function handleEditMessage(message) {
  if (!message.isOwn) {
    ElMessage.error('只能编辑自己的消息')
    return
  }

  // 进入编辑模式
  editingMessage.value = {
    id: message.id,
    content: message.content
  }

  // 显示编辑框
  showEditBox.value = true

  // 将消息内容加载到输入框
  nextTick(() => {
    inputValue.value = message.content
    inputRef.value?.focus?.()
  })

  ElNotification({
    title: '编辑模式',
    message: '修改消息并点击更新按钮',
    type: 'warning',
    duration: 3000
  })
}

// 保存编辑
function saveEditedMessage() {
  if (!editingMessage.value) return

  socketService.send({
    type: 'edit-message',
    messageId: editingMessage.value.id,
    content: inputValue.value,
    timestamp: Date.now()
  })

  // 重置编辑状态
  editingMessage.value = null
  inputValue.value = ''
  showEditBox.value = false

  ElMessage.success('消息已更新')
}
```

**编辑框样式 (MessageInputNew.vue):**

```vue
<!-- 编辑框 -->
<div v-if="editingMessage" class="edit-box">
  <span class="edit-label">编辑模式</span>
  <el-button
    text
    type="primary"
    size="small"
    @click="saveEditedMessage"
  >
    ✓ 更新
  </el-button>
  <el-button
    text
    type="danger"
    size="small"
    @click="editingMessage = null"
  >
    ✕ 取消
  </el-button>
</div>
```

### 4. 撤回功能

```javascript
// ChatRoom.vue

function handleRecallMessage(message) {
  if (!message.isOwn) {
    ElMessage.error('只能撤回自己的消息')
    return
  }

  // 检查是否在撤回时限内（通常 2 分钟）
  const now = Date.now()
  const messageTime = message.timestamp
  const timeDiff = now - messageTime
  const recallTimeLimit = 2 * 60 * 1000 // 2 分钟

  if (timeDiff > recallTimeLimit) {
    ElMessage.error('消息已过期，无法撤回（仅支持 2 分钟内的消息）')
    return
  }

  // 确认撤回
  ElMessageBox.confirm(
    '确定要撤回这条消息吗？',
    '撤回消息',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 通过 WebSocket 发送撤回请求
    socketService.send({
      type: 'recall-message',
      messageId: message.id,
      roomId: store.activeConversationId
    })

    // 本地更新消息状态
    const msg = store.activeMessages.find(m => m.id === message.id)
    if (msg) {
      msg.isRecalled = true
      msg.content = '此消息已被撤回'
    }

    ElMessage.success('消息已撤回')
  }).catch(() => {
    // 用户取消
  })
}
```

### 5. 转发功能

```javascript
// ChatRoom.vue

function handleForwardMessage(message) {
  // 打开转发对话框
  showForwardDialog.value = true

  // 存储要转发的消息
  messageToForward.value = message

  // 显示转发预览
  ElNotification({
    title: '转发消息',
    message: `准备转发: ${message.content.substring(0, 50)}...`,
    type: 'info',
    duration: 2000
  })
}

// 转发到指定对话
function confirmForward(targetConversationId) {
  if (!messageToForward.value) return

  socketService.send({
    type: 'forward-message',
    messageId: messageToForward.value.id,
    fromRoomId: store.activeConversationId,
    toRoomId: targetConversationId,
    timestamp: Date.now()
  })

  // 重置转发状态
  messageToForward.value = null
  showForwardDialog.value = false

  ElMessage.success('消息已转发')
}
```

### 6. 屏蔽功能

```javascript
// ChatRoom.vue

function handleBlockUser(message) {
  if (message.isOwn) {
    ElMessage.error('无法屏蔽自己')
    return
  }

  const userId = message.senderId
  const userName = message.senderName

  // 确认屏蔽
  ElMessageBox.confirm(
    `确定要屏蔽 ${userName} 的消息吗？\n屏蔽后将不再看到此用户的消息`,
    '屏蔽用户',
    {
      confirmButtonText: '屏蔽',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 添加到屏蔽列表
    blockedUsers.value.push(userId)

    // 存储到本地存储
    localStorage.setItem(
      'blockedUsers',
      JSON.stringify(blockedUsers.value)
    )

    // 通知服务器
    socketService.send({
      type: 'block-user',
      userId: userId,
      timestamp: Date.now()
    })

    ElMessage.success(`已屏蔽 ${userName}`)
  }).catch(() => {
    // 用户取消
  })
}

// 解除屏蔽
function handleUnblockUser(userId) {
  blockedUsers.value = blockedUsers.value.filter(id => id !== userId)
  localStorage.setItem(
    'blockedUsers',
    JSON.stringify(blockedUsers.value)
  )
  ElMessage.success('已解除屏蔽')
}
```

## 📊 完整事件流

```javascript
// ChatRoom.vue handleContextMenuSelect 完整实现

function handleContextMenuSelect(action) {
  showContextMenu.value = false

  if (!selectedMessage.value) return

  const message = selectedMessage.value

  switch (action) {
    case 'reply':
      handleReplyMessage(message)
      break

    case 'copy':
      handleCopyMessage(message)
      break

    case 'edit':
      handleEditMessage(message)
      break

    case 'recall':
      handleRecallMessage(message)
      break

    case 'forward':
      handleForwardMessage(message)
      break

    case 'block':
      handleBlockUser(message)
      break

    default:
      ElMessage.warning('功能开发中...')
  }

  selectedMessage.value = null
}
```

## 🎨 右键菜单样式增强

在 `ContextMenu.vue` 中添加更好的样式：

```css
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
  animation: contextMenuAppear 0.15s ease-out;
}

@keyframes contextMenuAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.15s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.menu-item:hover:not(.divider) {
  background: linear-gradient(135deg, #f0f4ff, #fafbff);
  color: #5c6af0;
  padding-left: 16px;
}

.menu-item.danger {
  color: #ff5f72;
}

.menu-item.danger:hover {
  background: rgba(255, 95, 114, 0.08);
  color: #ff5f72;
  padding-left: 16px;
}

.menu-item.divider {
  height: 1px;
  background: #e5e7eb;
  padding: 0;
  cursor: default;
  margin: 4px 0;
}

.menu-item el-icon {
  font-size: 14px;
}
```

## ✅ 实现检查清单

- [ ] 回复功能实现
- [ ] 复制功能实现
- [ ] 编辑功能实现
- [ ] 撤回功能实现
- [ ] 转发功能实现
- [ ] 屏蔽功能实现
- [ ] 所有确认对话实现
- [ ] 错误处理完善
- [ ] 权限检查完成
- [ ] 样式优化完成
- [ ] 动画效果添加
- [ ] 测试全部通过

---

**下一步**: 性能优化和完整测试。
