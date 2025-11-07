# Phase 7B 快速参考指南

## 文件导航

### Services 服务层
```
frontend/src/services/
├── messageRecallService.js     (350 行) - 消息撤回服务
└── messageEditService.js       (300 行) - 消息编辑服务
```

### UI 组件
```
frontend/src/components/chat/
├── MessageBubble.vue           (修改 +85 行) - 消息气泡
├── MessageEditOverlay.vue      (220 行) - 编辑覆盖层
└── MessageEditHistory.vue      (200 行) - 编辑历史
```

### 测试文件
```
frontend/src/__tests__/services/
├── messageRecallService.spec.js (380 行) - 撤回测试 (32 个用例)
└── messageEditService.spec.js   (420 行) - 编辑测试 (38 个用例)
```

### 集成文件
```
frontend/src/views/chat/
└── ChatRoom.vue                (修改 +120 行) - 集成点
```

---

## API 速查

### useMessageRecall 核心 API

```javascript
import { useMessageRecall } from '@/services/messageRecallService'

const {
  // 检查方法
  canRecallMessage(message),           // 是否可撤回
  getRecallTimeRemaining(message),     // 剩余时间(毫秒)
  getRecallTimeString(message),        // 时间字符串(如"1m30s")

  // 操作方法
  recallMessage(messageId, conversationId),    // 执行撤回
  handleRecallConfirm(message),                // 显示确认对话框
  handleRecallEvent(event),                    // 处理WS事件

  // 管理方法
  startRecallTimeMonitor(),            // 启动倒计时
  stopRecallTimeMonitor(),             // 停止倒计时
  retryRecallQueue(),                  // 重试失败操作
  cleanup(),                           // 清理资源

  // 状态
  config,                              // 配置对象
  recalledMessages,                    // 已撤回消息集合
  recallQueue,                         // 重试队列
  hasPendingRecalls                    // 是否有待重试
} = useMessageRecall()
```

### useMessageEdit 核心 API

```javascript
import { useMessageEdit } from '@/services/messageEditService'

const {
  // 检查方法
  canEditMessage(message),             // 是否可编辑
  validateEditContent(content),        // 验证内容

  // 操作方法
  editMessage(messageId, conversationId, newContent),  // 执行编辑
  saveEditVersion(messageId, content, editCount),      // 保存版本
  getMessageHistory(messageId),                        // 获取历史
  restoreVersion(messageId, versionNumber),            // 恢复版本
  handleEditConfirm(message, onEdit),                  // 处理确认
  handleEditEvent(event),                              // 处理WS事件

  // 管理方法
  retryEditQueue(),                    // 重试失败操作
  cleanup(),                           // 清理资源

  // 状态
  config,                              // 配置对象
  messageEditHistory,                  // 版本历史
  editingMessageId,                    // 当前编辑消息ID
  editQueue,                           // 重试队列
  hasPendingEdits                      // 是否有待重试
} = useMessageEdit()
```

---

## 组件使用示例

### MessageEditOverlay 使用

```vue
<template>
  <MessageEditOverlay
    :visible.sync="showEditOverlay"
    :message="currentEditingMessage"
    :edit-history="editHistory"
    :show-history="true"
    @edit="handleEdit"
    @restore="handleRestore"
    @cancel="handleCancel"
  />
</template>

<script setup>
import { ref } from 'vue'
import MessageEditOverlay from '@/components/chat/MessageEditOverlay.vue'

const showEditOverlay = ref(false)
const currentEditingMessage = ref(null)
const editHistory = ref([])

function handleEdit(payload) {
  const { messageId, conversationId, newContent } = payload
  // 执行编辑逻辑
}

function handleRestore(payload) {
  const { messageId, versionNumber } = payload
  // 恢复版本逻辑
}

function handleCancel() {
  showEditOverlay.value = false
}
</script>
```

### MessageEditHistory 使用

```vue
<template>
  <MessageEditHistory
    :visible.sync="showHistoryDrawer"
    :edit-history="editHistory"
    @restore="handleRestore"
    @close="handleClose"
  />
</template>

<script setup>
import { ref } from 'vue'
import MessageEditHistory from '@/components/chat/MessageEditHistory.vue'

const showHistoryDrawer = ref(false)
const editHistory = ref([])

function handleRestore(payload) {
  const { version, content } = payload
  // 恢复版本逻辑
}

function handleClose() {
  showHistoryDrawer.value = false
}
</script>
```

---

## 常见任务

### 检查消息是否可撤回

```javascript
const { canRecallMessage, getRecallTimeString } = useMessageRecall()

function checkRecallAbility(message) {
  if (canRecallMessage(message)) {
    const timeStr = getRecallTimeString(message)
    console.log(`可撤回, 剩余时间: ${timeStr}`)
    return true
  } else {
    console.log('无法撤回')
    return false
  }
}
```

### 执行消息撤回

```javascript
const { recallMessage, handleRecallConfirm } = useMessageRecall()

async function doRecall(message) {
  // 显示确认对话框
  const confirmed = await handleRecallConfirm(message)
  if (confirmed) {
    // 执行撤回
    const success = await recallMessage(message.id, message.conversationId)
    if (success) {
      console.log('撤回成功')
    }
  }
}
```

### 执行消息编辑

```javascript
const { editMessage, validateEditContent } = useMessageEdit()

async function doEdit(messageId, conversationId, newContent) {
  // 验证内容
  const validation = validateEditContent(newContent)
  if (!validation.valid) {
    console.error(validation.error)
    return
  }

  // 执行编辑
  const success = await editMessage(messageId, conversationId, newContent)
  if (success) {
    console.log('编辑成功')
  }
}
```

### 获取和恢复版本

```javascript
const { getMessageHistory, restoreVersion } = useMessageEdit()

async function showAndRestore(messageId) {
  // 获取版本历史
  const history = await getMessageHistory(messageId)
  console.log(`共有 ${history.length} 个版本`)

  // 恢复到指定版本
  const success = await restoreVersion(messageId, 1)
  if (success) {
    console.log('已恢复到版本 1')
  }
}
```

---

## WebSocket 事件

### 消息撤回事件

```javascript
// 事件名: message-recalled
// 事件格式:
{
  messageId: 'msg_123',
  conversationId: 'conv_456',
  recalledAt: 1666000000000,
  recalledBy: 'user_789'
}

// 监听方式:
socketService.on('message-recalled', (event) => {
  handleRecallEvent(event)
})
```

### 消息编辑事件

```javascript
// 事件名: message-edited
// 事件格式:
{
  messageId: 'msg_123',
  conversationId: 'conv_456',
  content: '新内容',
  editedAt: 1666000000000,
  editCount: 1
}

// 监听方式:
socketService.on('message-edited', (event) => {
  handleEditEvent(event)
})
```

---

## 配置参数

### 撤回配置

```javascript
const RECALL_TIMEOUT = 2 * 60 * 1000      // 2 分钟 (毫秒)
const RECALL_CHECK_INTERVAL = 1000        // 检查间隔 (毫秒)
```

### 编辑配置

```javascript
const MAX_CONTENT_LENGTH = 5000            // 最大内容长度 (字符)
const MAX_HISTORY_VERSIONS = 10            // 最多保留版本数
```

### 重试配置

```javascript
const MAX_RETRY_COUNT = 3                  // 最多重试次数
```

---

## 错误处理

### 常见错误消息

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| "消息已超过撤回时间限制" | 超过2分钟 | 无法撤回 |
| "您没有权限撤回此消息" | 非发送者 | 无法撤回 |
| "内容不能为空" | 编辑内容为空 | 输入有效内容 |
| "内容长度不能超过5000字符" | 内容过长 | 删除部分内容 |
| "版本不存在" | 版本号错误 | 检查版本号 |

### 错误捕获示例

```javascript
try {
  const success = await editMessage(messageId, conversationId, newContent)
  if (success) {
    // 编辑成功
  } else {
    // 编辑失败，查看错误消息
  }
} catch (error) {
  console.error('编辑出错:', error.message)
  // 处理异常
}
```

---

## 性能优化

### 时间复杂度

| 操作 | 复杂度 | 说明 |
|------|--------|------|
| canRecallMessage | O(1) | 直接检查 |
| editMessage | O(1) | 单个消息操作 |
| getMessageHistory | O(n) | n=版本数(≤10) |
| restoreVersion | O(n) | n=版本数(≤10) |

### 内存占用

| 项 | 占用 |
|----|------|
| 单个消息版本 | ~200 字节 |
| 最多版本数 | 10 个 |
| 单条消息最大 | ~2KB |
| 所有消息历史 | ~3MB (1000条消息) |

---

## 调试技巧

### 查看服务状态

```javascript
const service = useMessageRecall()
console.log('已撤回消息:', service.recalledMessages)
console.log('待重试操作:', service.recallQueue.value)

const editService = useMessageEdit()
console.log('编辑历史:', editService.messageEditHistory)
```

### 监听 WebSocket 事件

```javascript
import socketService from '@/utils/socket'

socketService.on('message-recalled', (event) => {
  console.log('[RECALL] 事件接收:', event)
})

socketService.on('message-edited', (event) => {
  console.log('[EDIT] 事件接收:', event)
})
```

### 测试时间限制

```javascript
// 创建2分钟前的消息
const message = {
  id: 'msg_1',
  timestamp: Date.now() - (2 * 60 * 1000),
  // ...
}

const { canRecallMessage } = useMessageRecall()
console.log(canRecallMessage(message))  // true (刚好2分钟)
```

---

## 常见问题

### Q: 为什么撤回不了？
A: 检查以下条件：
1. 是否是消息发送者？
2. 是否超过2分钟？
3. 消息是否已被撤回？

### Q: 编辑历史最多能保存多少个版本？
A: 最多保存 10 个版本，超过会自动删除最早的版本。

### Q: 网络断掉编辑丢失吗？
A: 不会。编辑操作会加入重试队列，网络恢复后自动重试，最多重试 3 次。

### Q: 可以编辑他人的消息吗？
A: 不可以。只有消息发送者才能编辑自己的消息。

### Q: 支持富文本编辑吗？
A: 目前只支持纯文本，最多 5000 个字符。

---

## 快速启动

```javascript
// 1. 导入服务
import { useMessageRecall } from '@/services/messageRecallService'
import { useMessageEdit } from '@/services/messageEditService'

// 2. 初始化服务
const { canRecallMessage, recallMessage } = useMessageRecall()
const { canEditMessage, editMessage } = useMessageEdit()

// 3. 使用服务
if (canRecallMessage(message)) {
  await recallMessage(message.id, message.conversationId)
}

if (canEditMessage(message)) {
  await editMessage(message.id, message.conversationId, newContent)
}
```

---

## 相关文档

- [PHASE7B_COMPLETE_SUMMARY.md](./PHASE7B_COMPLETE_SUMMARY.md) - 完整项目总结
- [PHASE7B_SERVICES_IMPLEMENTATION.md](./PHASE7B_SERVICES_IMPLEMENTATION.md) - Services 实现细节
- [PHASE7B_UI_INTEGRATION_COMPLETE.md](./PHASE7B_UI_INTEGRATION_COMPLETE.md) - UI 集成完成报告

---

**快速参考指南 v1.0**
**更新于**: 2025-10-22
**维护人**: AI 助手

💡 遇到问题？查看完整文档或代码注释获取更多信息。

