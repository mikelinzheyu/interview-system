# 🚀 Phase 5A: 回复编辑框 UI 快速开始指南

## 概览

Phase 5A 实现了 QQ 风格聊天界面中的**回复框**和**编辑框** UI 组件。这两个框用于显示用户当前正在进行的操作上下文。

## 核心概念

### 消息操作状态 (messageActionStates)

```javascript
const messageActionStates = reactive({
  replyingTo: null,           // 回复的消息
  editingMessage: null,       // 编辑的消息
  forwardingMessage: null     // 转发的消息 (预留)
})
```

## 功能演示

### 触发回复框

```javascript
// 当用户点击"回复"按钮时
messageActionStates.replyingTo = {
  id: 'msg_123',
  senderName: '张三',
  content: '你好，这是一条消息',
  timestamp: Date.now()
}
```

**显示效果**:
```
┌────────────────────────────────┐
│ 📝 回复 张三         [X]       │
│ 你好，这是一条消息...         │
└────────────────────────────────┘
```

### 触发编辑框

```javascript
// 当用户点击"编辑"按钮时
messageActionStates.editingMessage = {
  id: 'msg_456',
  senderName: '我',
  content: '需要编辑的消息内容',
  timestamp: Date.now()
}
```

**显示效果**:
```
┌────────────────────────────────┐
│ ✏️ 编辑模式            [X]     │
│ 需要编辑的消息内容...         │
└────────────────────────────────┘
```

### 关闭框

**点击 X 按钮**:
```javascript
messageActionStates.replyingTo = null
// 或
messageActionStates.editingMessage = null
```

**切换会话时自动关闭**:
```javascript
function clearAllActionStates() {
  Object.keys(messageActionStates).forEach((key) => {
    delete messageActionStates[key]
  })
}
```

## 集成指南

### 1. 在 ContextMenu 中添加事件处理

在 `ContextMenu.vue` 中添加回复/编辑事件触发:

```javascript
// ContextMenu.vue
const emit = defineEmits(['select'])

function handleReply(message) {
  emit('select', {
    action: 'reply',
    message: message
  })
}

function handleEdit(message) {
  emit('select', {
    action: 'edit',
    message: message
  })
}
```

### 2. 在 ChatRoom 中处理事件

```javascript
// ChatRoom.vue
function handleContextMenuSelect(payload) {
  if (payload.action === 'reply') {
    messageActionStates.replyingTo = payload.message
  } else if (payload.action === 'edit') {
    messageActionStates.editingMessage = payload.message
  }
}
```

### 3. 在消息发送时应用操作

```javascript
// ChatRoom.vue
async function handleSendMessage(content) {
  const conversationId = store.activeConversationId
  if (!conversationId || !content.trim()) return

  // 检查是否在回复或编辑模式
  if (messageActionStates.replyingTo) {
    // 发送回复消息
    await store.sendReplyMessage(
      conversationId,
      content,
      messageActionStates.replyingTo.id
    )
    messageActionStates.replyingTo = null
  } else if (messageActionStates.editingMessage) {
    // 编辑消息
    await store.editMessage(
      messageActionStates.editingMessage.id,
      content
    )
    messageActionStates.editingMessage = null
  } else {
    // 发送普通消息
    await store.sendMessage(conversationId, content)
  }
}
```

## 样式定制

### 修改回复框颜色

```css
.reply-box {
  border-left-color: #你的颜色;  /* 左边框颜色 */
  background: #你的背景色;       /* 背景颜色 */
}

.reply-label {
  color: #你的文字颜色;          /* 文字颜色 */
}
```

### 修改编辑框颜色

```css
.edit-box {
  border-left-color: #你的颜色;
  background: #你的背景色;
}

.edit-label {
  color: #你的文字颜色;
}
```

### 修改动画

```css
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);  /* 调整下降距离 */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 常见问题

### Q: 如何显示更多行的消息内容？

A: 修改 `.reply-text` 和 `.edit-text` 的 `-webkit-line-clamp` 值:

```css
.reply-text {
  -webkit-line-clamp: 3;  /* 显示 3 行 */
}
```

### Q: 如何禁用动画？

A: 注释掉 `animation` 属性:

```css
.reply-box {
  /* animation: slideInDown 0.3s ease-out; */
}
```

### Q: 如何在编辑时预填充消息输入框？

A: 在 `handleContextMenuSelect` 中设置输入值:

```javascript
function handleContextMenuSelect(payload) {
  if (payload.action === 'edit') {
    messageActionStates.editingMessage = payload.message
    // 预填充输入框
    inputRef.value.focus()
    inputValue.value = payload.message.content
  }
}
```

## 测试清单

- [ ] 回复框在点击回复时显示
- [ ] 回复框正确显示用户名和消息内容
- [ ] 点击 X 按钮关闭回复框
- [ ] 编辑框在点击编辑时显示
- [ ] 编辑框正确显示编辑提示和消息内容
- [ ] 点击 X 按钮关闭编辑框
- [ ] 两个框都有平滑的进入动画
- [ ] 消息内容超长时正确截断
- [ ] 切换会话时自动关闭框
- [ ] 响应式设计在小屏幕上工作正常

## 下一步

Phase 5B 将实现**转发功能** UI，包括:
- 转发对话框
- 转发目标选择器
- 转发消息预览

## 文件位置

| 文件 | 说明 |
|------|------|
| `frontend/src/views/chat/ChatRoom.vue` | 主要实现 |
| `frontend/src/components/chat/MessageListNew.vue` | 消息列表 |
| `frontend/src/components/chat/ContextMenu.vue` | 上下文菜单 |

---

**建议阅读**: `PHASE5A_REPLY_EDIT_BOX_UI_COMPLETE.md` 获取完整技术文档
