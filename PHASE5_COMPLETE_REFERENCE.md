# 📚 Phase 5: 右键菜单增强功能 - 完整参考指南

## 🎯 Phase 5 总览

Phase 5 实现了完整的消息右键菜单增强功能，包括 3 个主要功能模块：

```
Phase 5: 右键菜单增强功能 [██████████ 100%]

├─ Phase 5A: 回复编辑框 UI [██████████ 100%] ✅
│  ├─ 回复框显示 (messageActionStates.replyingTo)
│  └─ 编辑框显示 (messageActionStates.editingMessage)
│
├─ Phase 5B: 转发功能 UI [██████████ 100%] ✅
│  ├─ 转发对话框 (showForwardDialog)
│  ├─ 会话列表选择 (selectedForwardTarget)
│  └─ 附加信息输入 (forwardMessage)
│
└─ Phase 5C: 完整集成 [░░░░░░░░░░ 0%] 待进行
   └─ ContextMenu 和 MessageListNew 集成
```

## 📋 功能清单

### Phase 5A: 回复编辑框 UI

#### 回复框 (Reply Box)
- **触发条件**: `messageActionStates.replyingTo != null`
- **显示位置**: 消息列表下方，输入框上方
- **内容**: 被回复用户名 + 消息内容
- **关闭方式**: 点击 X 按钮或切换会话

#### 编辑框 (Edit Box)
- **触发条件**: `messageActionStates.editingMessage != null`
- **显示位置**: 与回复框相同
- **内容**: 编辑提示 + 消息内容
- **关闭方式**: 点击 X 按钮或切换会话

### Phase 5B: 转发功能 UI

#### 转发对话框 (Forward Dialog)
- **触发条件**: `showForwardDialog == true`
- **组件**: ElDialog (Element Plus)
- **宽度**: 50% 响应式

#### 对话框内容区
1. **原消息预览** - 显示被转发消息
2. **会话列表** - 选择转发目标 (可滚动)
3. **附加信息** - 可选的备注信息
4. **页脚按钮** - 取消/确定

## 🔧 集成步骤

### 步骤 1: 连接 ContextMenu

在 `ContextMenu.vue` 或 `MessageListNew.vue` 中：

```javascript
// 右键菜单点击处理
function handleMenuItemClick(action, message) {
  const payload = { action, message }
  emit('select', payload)
}
```

### 步骤 2: 在 ChatRoom 中处理事件

```javascript
// ChatRoom.vue
function handleContextMenuSelect(payload) {
  const { action, message } = payload

  switch(action) {
    case 'reply':
      messageActionStates.replyingTo = message
      break
    case 'edit':
      messageActionStates.editingMessage = message
      break
    case 'forward':
      handleOpenForwardDialog(message)
      break
  }
}
```

### 步骤 3: 绑定事件处理

```vue
<!-- ChatRoom.vue -->
<ContextMenu
  v-if="showContextMenu"
  :position="contextMenuPosition"
  :items="contextMenuItems"
  @select="handleContextMenuSelect"
  @close="showContextMenu = false"
/>
```

### 步骤 4: 实现消息发送逻辑

```javascript
async function handleSendMessage(content) {
  if (!content.trim()) return

  try {
    if (messageActionStates.replyingTo) {
      // 发送回复消息
      await store.sendReplyMessage(
        store.activeConversationId,
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
      await store.sendMessage(store.activeConversationId, content)
    }
  } catch (error) {
    console.error('Send message failed:', error)
  }
}
```

## 🎨 样式自定义

### 修改回复框颜色

```css
.reply-box {
  border-left-color: #你的颜色;
  background: #你的背景色;
}

.reply-label {
  color: #你的文字颜色;
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

### 修改转发对话框大小

```vue
<!-- ChatRoom.vue -->
<el-dialog
  v-model="showForwardDialog"
  title="转发消息"
  width="60%"  <!-- 修改这里 -->
>
```

## 📊 状态流转图

### 回复流程

```
用户右键点击消息
        ↓
显示上下文菜单
        ↓
点击"回复"选项
        ↓
setReplyingTo(message)
        ↓
回复框显示
        ↓
用户输入内容并发送
        ↓
sendReplyMessage()
        ↓
清除 replyingTo 状态
```

### 转发流程

```
用户右键点击消息
        ↓
显示上下文菜单
        ↓
点击"转发"选项
        ↓
showForwardDialog = true
        ↓
对话框显示
        ↓
用户选择目标会话
        ↓
点击"确定转发"
        ↓
sendMessage(targetConversation)
        ↓
清除所有转发状态
```

## 🔐 数据结构

### messageActionStates

```javascript
{
  replyingTo: {
    id: 'msg_123',
    senderName: '张三',
    content: '消息内容',
    timestamp: 1634900000
  },
  editingMessage: {
    id: 'msg_456',
    senderName: '我',
    content: '编辑中的消息',
    timestamp: 1634900000
  },
  forwardingMessage: {
    id: 'msg_789',
    senderName: '李四',
    content: '被转发的消息',
    timestamp: 1634900000
  }
}
```

### forwardedMessage (发送格式)

```javascript
{
  type: 'forward',
  originalContent: '原消息内容',
  originalSender: '张三',
  attachMessage: '附加备注信息',
  timestamp: Date.now()
}
```

## 🧪 测试场景

### 测试场景 1: 回复功能

```gherkin
场景: 用户回复消息
  给定: 聊天室已打开
  当: 用户右键点击一条消息
  然后: 显示上下文菜单
  当: 用户点击"回复"选项
  然后: 回复框显示
  当: 用户输入回复内容并发送
  然后: 消息以回复形式发送
  当: 回复框自动关闭
```

### 测试场景 2: 编辑功能

```gherkin
场景: 用户编辑自己的消息
  给定: 聊天室已打开，用户有自己的消息
  当: 用户右键点击自己的消息
  然后: 显示上下文菜单（包含编辑选项）
  当: 用户点击"编辑"选项
  然后: 编辑框显示，消息内容预填充
  当: 用户修改内容并确定
  然后: 消息被编辑
  当: 编辑框自动关闭
```

### 测试场景 3: 转发功能

```gherkin
场景: 用户转发消息到其他会话
  给定: 聊天室已打开
  当: 用户右键点击一条消息
  然后: 显示上下文菜单
  当: 用户点击"转发"选项
  然后: 转发对话框显示，显示原消息
  当: 用户选择目标会话
  然后: 目标会话高亮显示
  当: 用户点击"确定转发"
  然后: 消息转发到目标会话
  当: 对话框自动关闭
```

## 📝 文件清单

| 文件 | 描述 |
|------|------|
| `ChatRoom.vue` | 主要实现文件 |
| `MessageListNew.vue` | 消息列表（待集成） |
| `ContextMenu.vue` | 右键菜单（待集成） |
| `PHASE5A_REPLY_EDIT_BOX_UI_COMPLETE.md` | Phase 5A 详细文档 |
| `PHASE5B_FORWARD_DIALOG_COMPLETE.md` | Phase 5B 详细文档 |
| `PHASE5_COMPLETE_REFERENCE.md` | 本文件 |

## ⚙️ 关键函数

### 打开回复框

```javascript
function openReplyBox(message) {
  messageActionStates.replyingTo = message
  inputRef.value?.focus()
}
```

### 打开编辑框

```javascript
function openEditBox(message) {
  messageActionStates.editingMessage = message
  inputRef.value?.focus()
  // 可选: 预填充输入框
  inputValue.value = message.content
}
```

### 打开转发对话框

```javascript
function handleOpenForwardDialog(message) {
  messageActionStates.forwardingMessage = message
  selectedForwardTarget.value = null
  forwardMessage.value = ''
  showForwardDialog.value = true
}
```

### 执行转发

```javascript
async function handleConfirmForward() {
  if (!selectedForwardTarget.value) {
    ElMessage.warning('请选择转发目标')
    return
  }

  const forwardedMessage = {
    type: 'forward',
    originalContent: messageActionStates.forwardingMessage.content,
    originalSender: messageActionStates.forwardingMessage.senderName,
    attachMessage: forwardMessage.value
  }

  await store.sendMessage(
    selectedForwardTarget.value.id,
    JSON.stringify(forwardedMessage)
  )

  showForwardDialog.value = false
  // 清除状态
}
```

## 🐛 常见问题

### Q: 为什么回复框不显示？
A: 检查 `messageActionStates.replyingTo` 是否被正确设置。确保:
1. messageActionStates 在组件中定义
2. 回复框的 v-if 条件正确
3. 没有 CSS 隐藏回复框

### Q: 转发对话框中看不到会话列表？
A: 检查以下几点:
1. `conversations` 计算属性是否返回数据
2. `store.conversations` 是否已加载
3. 当前会话是否被正确过滤掉

### Q: 转发后消息格式不对？
A: 确保:
1. 消息以 JSON 字符串发送
2. 接收端正确解析 `type === 'forward'` 的消息
3. 显示格式包含原发送者和原消息内容

## 🚀 后续改进方向

1. **多选转发** - 支持同时转发到多个会话
2. **消息预览** - 转发对话框中显示更详细的消息预览
3. **回复链接** - 点击回复框跳转到被回复的原消息
4. **编辑历史** - 显示消息编辑历史记录
5. **转发标记** - 在消息上显示是否被转发过
6. **快捷操作** - 键盘快捷键支持 (Ctrl+R 回复、Ctrl+E 编辑等)

## 📞 支持和反馈

遇到问题？请查看：
- `PHASE5A_REPLY_EDIT_BOX_UI_COMPLETE.md` - Phase 5A 详细说明
- `PHASE5B_FORWARD_DIALOG_COMPLETE.md` - Phase 5B 详细说明
- `ChatRoom.vue` - 源代码实现

---

**最后更新**: 2025-10-21
**版本**: 1.0
**状态**: ✅ Phase 5A 和 5B 完成，Phase 5C 待进行
