# Phase 7B: 撤回和编辑优化 - 详细实现计划

## 🎯 项目目标

基于 QQ 和微信的消息撤回和编辑功能，实现完整的消息生命周期管理：
- **消息撤回**: 2 分钟内支持撤回，显示"已撤回"提示
- **消息编辑**: 编辑后显示"已编辑"标记，保留编辑历史
- **交互优化**: 流畅的 UI 交互和状态变更
- **冲突处理**: 处理并发编辑和撤回冲突

**预计工时**: 10 小时
**阶段**: Phase 7B (第二个功能模块)

## 📋 需求分析

### 7B.1 消息撤回功能

#### 核心需求

```
撤回流程:
1. 用户点击消息的"撤回"按钮
2. 系统检查撤回时间限制（2分钟内）
3. 发送撤回请求到后端
4. 后端验证权限和时间限制
5. 后端删除消息内容，保留撤回记录
6. 通知所有客户端消息已撤回
7. 前端显示"已撤回"提示
8. 撤回操作记录到日志
```

#### 技术规范

```javascript
// 撤回请求数据结构
{
  messageId: 'msg_123',
  conversationId: 'conv_456',
  timestamp: 1666000000000,
  operatorId: 'user_789'
}

// 撤回响应数据结构
{
  success: true,
  messageId: 'msg_123',
  status: 'recalled',
  recalledAt: 1666000000000,
  recalledBy: 'user_789'
}

// WebSocket 通知事件
{
  type: 'message-recalled',
  messageId: 'msg_123',
  conversationId: 'conv_456',
  recalledAt: 1666000000000
}
```

#### 业务规则

```
✅ 撤回时间限制: 2 分钟（120000ms）
✅ 权限限制: 仅发送者或管理员可撤回
✅ 撤回不可恢复: 撤回后的消息无法查看内容
✅ 撤回记录: 保留谁在什么时间撤回了哪条消息
✅ 群聊通知: 群聊中撤回需要通知所有成员
✅ 个聊不提示: 个人聊天中撤回不特别提示
```

### 7B.2 消息编辑功能

#### 核心需求

```
编辑流程:
1. 用户点击消息的"编辑"按钮
2. 系统进入编辑模式，显示原文本
3. 用户修改文本内容
4. 用户提交编辑（Ctrl+Enter 或按钮）
5. 发送编辑请求到后端
6. 后端验证权限
7. 后端保存新内容和编辑历史
8. 通知所有客户端消息已编辑
9. 前端显示"已编辑"标记
10. 用户可查看编辑历史
```

#### 技术规范

```javascript
// 编辑请求数据结构
{
  messageId: 'msg_123',
  conversationId: 'conv_456',
  newContent: '编辑后的内容',
  timestamp: 1666000000000,
  operatorId: 'user_789'
}

// 编辑响应数据结构
{
  success: true,
  messageId: 'msg_123',
  content: '编辑后的内容',
  status: 'edited',
  editedAt: 1666000000000,
  editCount: 1
}

// 编辑历史数据结构
{
  messageId: 'msg_123',
  versions: [
    {
      version: 1,
      content: '原始内容',
      editedAt: 1666000000000,
      editedBy: 'user_789'
    },
    {
      version: 2,
      content: '编辑后的内容',
      editedAt: 1666000010000,
      editedBy: 'user_789'
    }
  ]
}

// WebSocket 通知事件
{
  type: 'message-edited',
  messageId: 'msg_123',
  conversationId: 'conv_456',
  content: '编辑后的内容',
  editedAt: 1666000000000,
  editCount: 1
}
```

#### 业务规则

```
✅ 编辑不限时: 消息创建后任何时间都可编辑
✅ 编辑权限: 仅发送者可编辑
✅ 保留历史: 记录所有编辑版本
✅ 标记显示: 编辑后显示"已编辑"标记
✅ 历史查看: 用户可点击标记查看历史
✅ 群聊显示: 显示谁编辑了消息
✅ 冲突处理: 处理并发编辑冲突
```

## 🏗️ 架构设计

### 系统架构

```
┌─────────────────────────────────────────┐
│         ChatRoom.vue                    │
│  ┌─────────────────────────────────────┤
│  │ MessageListNew (消息列表)           │
│  │  ├─ 消息项渲染                     │
│  │  │  ├─ 文本内容                   │
│  │  │  ├─ "已撤回" 标记              │
│  │  │  ├─ "已编辑 (版本数)" 标记    │
│  │  │  └─ 长按菜单                   │
│  │  │     ├─ 撤回 (如果在时间限制内)│
│  │  │     ├─ 编辑                    │
│  │  │     └─ 查看历史 (如果已编辑)   │
│  │  └─ 撤回/编辑 Store 集成         │
│  │
│  └─ EditOverlay.vue (编辑覆盖层)     │
│     ├─ 编辑输入框                    │
│     ├─ 提交/取消按钮                 │
│     └─ 字数统计                      │
│
│  MessageEditHistory.vue (编辑历史)   │
│  ├─ 历史版本列表                    │
│  ├─ 版本对比                        │
│  └─ 恢复操作                        │
└─────────────────────────────────────────┘

┌──────────────────────────────────────┐
│         Vuex/Pinia Store             │
│  messageRecallStore                  │
│  ├─ recalledMessages (Set)          │
│  ├─ messageEditHistory (Map)        │
│  └─ pendingOperations (Queue)       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         WebSocket Service            │
│  ├─ sendRecallRequest()              │
│  ├─ sendEditRequest()                │
│  ├─ on('message-recalled')           │
│  └─ on('message-edited')             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         Backend API                  │
│  ├─ POST /messages/:id/recall        │
│  ├─ PUT /messages/:id/edit           │
│  └─ GET /messages/:id/history        │
└──────────────────────────────────────┘
```

### 数据流

```
撤回消息流:
User Interaction
    ↓
MessageItem 长按菜单 → 点击"撤回"
    ↓
MessageRecallService.recallMessage(messageId)
    ↓
验证撤回时间限制 (当前时间 - 消息时间 < 2分钟)
    ↓
WebSocket.emit('message-recall', {messageId, ...})
    ↓
Backend 验证权限和时间限制
    ↓
Backend 更新消息状态 (isRecalled = true)
    ↓
Backend 广播 'message-recalled' 事件
    ↓
Frontend WebSocket 收到事件
    ↓
Store 更新 recalledMessages
    ↓
MessageListNew 重新渲染
    ↓
显示"已撤回" UI


编辑消息流:
User Interaction
    ↓
MessageItem 长按菜单 → 点击"编辑"
    ↓
EditOverlay 显示，输入框获得焦点
    ↓
用户修改文本内容
    ↓
用户提交 (Ctrl+Enter 或点击提交)
    ↓
MessageEditService.editMessage(messageId, newContent)
    ↓
验证内容长度和权限
    ↓
WebSocket.emit('message-edit', {messageId, newContent, ...})
    ↓
Backend 验证权限
    ↓
Backend 保存新版本和编辑历史
    ↓
Backend 广播 'message-edited' 事件
    ↓
Frontend WebSocket 收到事件
    ↓
Store 更新 messageEditHistory
    ↓
MessageListNew 重新渲染
    ↓
显示"已编辑 (版本数)" UI
```

## 📦 需要创建的文件

### 核心服务文件 (3 个)

```
frontend/src/services/
├── messageRecallService.js          (200 行)
│   ├─ recallMessage(messageId)
│   ├─ canRecallMessage(message)
│   ├─ getRecallTimeRemaining()
│   └─ handleRecallConfirm()
│
├── messageEditService.js            (250 行)
│   ├─ editMessage(messageId, newContent)
│   ├─ canEditMessage(message)
│   ├─ validateEditContent()
│   ├─ getMessageHistory(messageId)
│   └─ restoreVersion(messageId, versionId)
│
└── messageOperationService.js       (200 行)
    ├─ 处理消息操作冲突
    ├─ 管理待处理操作队列
    ├─ 重试失败的操作
    └─ 同步操作状态
```

### UI 组件文件 (3 个)

```
frontend/src/components/chat/
├── MessageEditOverlay.vue           (300 行)
│   ├─ 编辑输入框
│   ├─ 提交/取消按钮
│   ├─ 字数统计
│   ├─ 快捷键处理 (Ctrl+Enter)
│   └─ 动画过渡
│
├── MessageEditHistory.vue           (250 行)
│   ├─ 历史版本列表
│   ├─ 版本对比视图
│   ├─ 版本详情信息
│   ├─ 恢复按钮
│   └─ 时间线展示
│
└── MessageBubbleEnhanced.vue       (200 行)
    ├─ 已撤回状态显示
    ├─ 已编辑标记和版本数
    ├─ 长按菜单项控制
    └─ 操作按钮条件显示
```

### 状态管理文件 (2 个)

```
frontend/src/stores/
├── messageRecallStore.js            (150 行)
│   ├─ recalledMessages (Set)
│   ├─ setMessageRecalled()
│   └─ isMessageRecalled()
│
└── messageEditStore.js              (200 行)
    ├─ messageEditHistory (Map)
    ├─ updateEditHistory()
    ├─ getMessageHistory()
    └─ getEditCount()
```

### 测试文件 (3 个)

```
frontend/src/__tests__/services/
├── messageRecallService.spec.js     (400 行)
│   ├─ 撤回权限验证
│   ├─ 时间限制检查
│   ├─ 冲突处理
│   └─ WebSocket 事件
│
├── messageEditService.spec.js       (400 行)
│   ├─ 编辑权限验证
│   ├─ 内容验证
│   ├─ 历史版本管理
│   └─ WebSocket 事件
│
└── components/chat/MessageEditOverlay.spec.js (300 行)
    ├─ 覆盖层显示/隐藏
    ├─ 输入框交互
    ├─ 快捷键处理
    └─ 事件发送
```

## 🔧 实现详情

### Phase 7B.1: 消息撤回

#### 步骤 1: 创建撤回服务

```javascript
// services/messageRecallService.js

export function useMessageRecall() {
  const store = useChatWorkspaceStore()
  const socket = socketService

  // 检查是否可以撤回
  function canRecallMessage(message) {
    if (!message) return false

    // 检查权限: 仅发送者或管理员
    const currentUser = store.currentUserId
    const isOwner = message.senderId === currentUser
    const isAdmin = checkIsAdmin()

    if (!isOwner && !isAdmin) return false

    // 检查时间限制: 2分钟内
    const now = Date.now()
    const messageTime = message.timestamp
    const elapsed = now - messageTime
    const RECALL_TIMEOUT = 2 * 60 * 1000 // 2分钟

    return elapsed <= RECALL_TIMEOUT
  }

  // 获取剩余撤回时间
  function getRecallTimeRemaining(message) {
    if (!message) return 0

    const now = Date.now()
    const messageTime = message.timestamp
    const elapsed = now - messageTime
    const RECALL_TIMEOUT = 2 * 60 * 1000

    const remaining = RECALL_TIMEOUT - elapsed
    return Math.max(0, remaining)
  }

  // 撤回消息
  async function recallMessage(messageId) {
    try {
      const message = store.getMessageById(messageId)

      if (!canRecallMessage(message)) {
        ElMessage.error('无法撤回此消息（可能已超过撤回时间或无权限）')
        return false
      }

      // 发送撤回请求
      socket.emit('message-recall', {
        messageId: messageId,
        conversationId: message.conversationId,
        timestamp: Date.now()
      })

      // 乐观更新: 立即更新本地状态
      store.setMessageRecalled(messageId)

      ElMessage.success('消息已撤回')
      return true
    } catch (error) {
      console.error('撤回消息失败:', error)
      ElMessage.error('撤回消息失败')
      return false
    }
  }

  return {
    canRecallMessage,
    getRecallTimeRemaining,
    recallMessage
  }
}
```

#### 步骤 2: 修改 MessageBubble 组件

```vue
<!-- 在消息气泡中添加撤回状态 -->
<template>
  <div class="message-item" :class="{recalled: message.isRecalled}">
    <!-- 已撤回提示 -->
    <div v-if="message.isRecalled" class="recalled-hint">
      <el-icon><Delete /></el-icon>
      <span>{{ message.senderName }} 撤回了一条消息</span>
      <!-- 可选: 显示撤回时间 -->
      <span class="recall-time">{{ formatRecallTime(message.recalledAt) }}</span>
    </div>

    <!-- 正常消息内容（未撤回） -->
    <div v-else class="message-content">
      {{ message.content }}
    </div>

    <!-- 长按菜单中的撤回选项 -->
    <template #context-menu>
      <el-dropdown-item
        v-if="canRecallMessage(message)"
        @click="handleRecallClick"
      >
        <el-icon><Delete /></el-icon>
        <span>撤回 ({{ remainingTime }})</span>
      </el-dropdown-item>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMessageRecall } from '@/services/messageRecallService'

const props = defineProps({
  message: Object
})

const { canRecallMessage, getRecallTimeRemaining, recallMessage } = useMessageRecall()

const remainingTime = computed(() => {
  const remaining = getRecallTimeRemaining(props.message)
  const seconds = Math.ceil(remaining / 1000)
  return `${seconds}s`
})

async function handleRecallClick() {
  ElMessageBox.confirm(
    '确定要撤回这条消息吗？撤回后对方可以看到你撤回了一条消息。',
    '撤回消息',
    {
      confirmButtonText: '撤回',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    recallMessage(props.message.id)
  }).catch(() => {})
}
</script>

<style scoped>
.recalled-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
  font-size: 13px;
}

.recall-time {
  margin-left: auto;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
```

### Phase 7B.2: 消息编辑

#### 步骤 3: 创建编辑服务

```javascript
// services/messageEditService.js

export function useMessageEdit() {
  const store = useChatWorkspaceStore()
  const socket = socketService

  // 检查是否可以编辑
  function canEditMessage(message) {
    if (!message || message.isRecalled) return false

    // 仅发送者可编辑
    const currentUser = store.currentUserId
    const isOwner = message.senderId === currentUser

    return isOwner
  }

  // 验证编辑内容
  function validateEditContent(content) {
    if (!content || !content.trim()) {
      return { valid: false, error: '内容不能为空' }
    }

    if (content.length > 5000) {
      return { valid: false, error: '内容长度不能超过5000字符' }
    }

    return { valid: true }
  }

  // 编辑消息
  async function editMessage(messageId, newContent) {
    try {
      const message = store.getMessageById(messageId)

      if (!canEditMessage(message)) {
        ElMessage.error('无法编辑此消息')
        return false
      }

      const validation = validateEditContent(newContent)
      if (!validation.valid) {
        ElMessage.error(validation.error)
        return false
      }

      // 发送编辑请求
      socket.emit('message-edit', {
        messageId: messageId,
        conversationId: message.conversationId,
        newContent: newContent,
        timestamp: Date.now()
      })

      // 乐观更新
      store.updateMessage(messageId, {
        content: newContent,
        isEdited: true,
        editedAt: Date.now(),
        editCount: (message.editCount || 0) + 1
      })

      ElMessage.success('消息已编辑')
      return true
    } catch (error) {
      console.error('编辑消息失败:', error)
      ElMessage.error('编辑消息失败')
      return false
    }
  }

  // 获取消息历史
  async function getMessageHistory(messageId) {
    try {
      const response = await api.get(`/messages/${messageId}/history`)
      return response.data.versions || []
    } catch (error) {
      console.error('获取历史失败:', error)
      return []
    }
  }

  return {
    canEditMessage,
    validateEditContent,
    editMessage,
    getMessageHistory
  }
}
```

#### 步骤 4: 创建编辑覆盖层组件

```vue
<!-- MessageEditOverlay.vue -->
<template>
  <transition name="fade">
    <div v-if="visible" class="edit-overlay">
      <!-- 遮罩 -->
      <div class="overlay-mask" @click="handleCancel"></div>

      <!-- 编辑框 -->
      <div class="edit-box">
        <div class="edit-header">
          <span>编辑消息</span>
          <el-button text type="danger" size="small" @click="handleCancel">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="edit-content">
          <el-input
            v-model="editContent"
            type="textarea"
            :rows="4"
            placeholder="编辑消息内容..."
            maxlength="5000"
            show-word-limit
            @keydown.ctrl.enter="handleSubmit"
          />
        </div>

        <div class="edit-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            保存编辑
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMessageEdit } from '@/services/messageEditService'

const props = defineProps({
  visible: Boolean,
  message: Object
})

const emit = defineEmits(['update:visible', 'submit'])

const editContent = ref('')
const loading = ref(false)
const { editMessage } = useMessageEdit()

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.message) {
      editContent.value = props.message.content
    }
  }
)

async function handleSubmit() {
  if (!editContent.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }

  loading.value = true
  try {
    await editMessage(props.message.id, editContent.value)
    emit('update:visible', false)
    emit('submit', editContent.value)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
.edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.overlay-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.edit-box {
  position: relative;
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2001;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
}

.edit-content {
  padding: 16px;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #ebeef5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## 🧪 测试计划

### 单元测试 (80 个)

```javascript
// messageRecallService.spec.js (40 个)
✅ 撤回权限验证 (6 个)
✅ 时间限制检查 (8 个)
✅ 撤回确认流程 (5 个)
✅ 冲突处理 (8 个)
✅ WebSocket 事件 (7 个)
✅ 乐观更新 (6 个)

// messageEditService.spec.js (40 个)
✅ 编辑权限验证 (6 个)
✅ 内容验证 (8 个)
✅ 编辑确认流程 (5 个)
✅ 历史版本管理 (8 个)
✅ WebSocket 事件 (7 个)
✅ 版本控制 (6 个)
```

### 组件测试 (30 个)

```javascript
// MessageEditOverlay.spec.js (15 个)
✅ 显示/隐藏动画
✅ 输入框交互
✅ 字数统计
✅ 快捷键处理
✅ 事件发送

// MessageBubble.spec.js (15 个)
✅ 已撤回状态显示
✅ 已编辑标记显示
✅ 长按菜单项控制
✅ 时间限制倒计时
```

### 集成测试 (20 个)

```javascript
✅ 完整撤回流程
✅ 完整编辑流程
✅ 多用户并发撤回/编辑
✅ 撤回后编辑处理
✅ 编辑后撤回处理
✅ WebSocket 同步验证
```

## 📊 性能目标

| 指标 | 目标 | 备注 |
|------|------|------|
| 撤回操作响应 | < 200ms | 包含网络延迟 |
| 编辑操作响应 | < 300ms | 包含验证和网络 |
| 历史加载 | < 500ms | 最多100条历史 |
| UI 更新 | < 100ms | 消息列表重新渲染 |

## 📝 开发日程

### Day 1-2: 撤回功能 (4 小时)
- [ ] 创建 messageRecallService.js
- [ ] 修改消息气泡组件
- [ ] 实现 WebSocket 事件处理
- [ ] 编写单元和集成测试

### Day 3-4: 编辑功能 (4 小时)
- [ ] 创建 messageEditService.js
- [ ] 创建 MessageEditOverlay.vue 组件
- [ ] 创建编辑历史组件
- [ ] 编写单元和集成测试

### Day 5: 优化和文档 (2 小时)
- [ ] 性能优化
- [ ] 代码审查
- [ ] 完整文档编写
- [ ] 最终测试

## 🎯 成功标准

```
✅ 所有功能实现完整
✅ 单元测试覆盖 > 90%
✅ 集成测试全部通过
✅ 性能目标全部达成
✅ 文档完整清晰
✅ 代码质量优秀
✅ 无已知 Bug
```

## 📚 文档输出

- PHASE7B_RECALL_EDIT_IMPLEMENTATION.md (详细实现)
- PHASE7B_COMPLETION_SUMMARY.md (完成总结)
- PHASE7B_API_REFERENCE.md (API 参考)

---

**预计开始**: 2025-10-22
**预计完成**: 2025-10-24
**工时**: 10 小时
**优先级**: 高 (核心功能)
