# Phase 7B: 撤回和编辑优化 - 详细实现指南

**当前阶段**: Phase 7B (高级功能第二个模块)
**预计工时**: 10 小时
**优先级**: 高 (核心功能)
**完成时间**: 2025-10-24 (预计)

## 快速开始

### 1. 创建消息撤回服务

```bash
# 创建文件
touch frontend/src/services/messageRecallService.js
```

### 2. 创建消息编辑服务

```bash
# 创建文件
touch frontend/src/services/messageEditService.js
```

### 3. 创建编辑覆盖层组件

```bash
# 创建文件
touch frontend/src/components/chat/MessageEditOverlay.vue
```

### 4. 创建编辑历史组件

```bash
# 创建文件
touch frontend/src/components/chat/MessageEditHistory.vue
```

## 详细实现步骤

### Step 1: 消息撤回服务完整实现

**文件**: `frontend/src/services/messageRecallService.js`

```javascript
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import socketService from '@/utils/socket'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

/**
 * 消息撤回服务 Composable
 * 管理消息撤回的业务逻辑
 */
export function useMessageRecall() {
  const store = useChatWorkspaceStore()

  // 撤回配置
  const config = reactive({
    RECALL_TIMEOUT: 2 * 60 * 1000, // 2 分钟
    RECALL_CHECK_INTERVAL: 1000 // 1 秒检查一次
  })

  // 已撤回消息集合（for performance）
  const recalledMessages = new Set()

  // 撤回操作队列（处理离线情况）
  const recallQueue = ref([])

  // 监听定时器
  let recallTimerInterval = null

  /**
   * 检查消息是否可以撤回
   * @param {Object} message - 消息对象
   * @returns {boolean}
   */
  function canRecallMessage(message) {
    if (!message) return false

    // 不能撤回已撤回的消息
    if (message.isRecalled) return false

    // 检查权限：仅发送者或管理员可撤回
    const currentUser = store.currentUserId
    const isOwner = message.senderId === currentUser

    if (!isOwner) {
      // TODO: 检查是否是管理员
      return false
    }

    // 检查时间限制：2 分钟内
    const now = Date.now()
    const messageTime = message.timestamp || message.createdAt
    const elapsed = now - messageTime
    const canRecall = elapsed <= config.RECALL_TIMEOUT

    return canRecall
  }

  /**
   * 获取消息剩余撤回时间（毫秒）
   * @param {Object} message - 消息对象
   * @returns {number} 剩余时间（毫秒）
   */
  function getRecallTimeRemaining(message) {
    if (!message || !canRecallMessage(message)) return 0

    const now = Date.now()
    const messageTime = message.timestamp || message.createdAt
    const elapsed = now - messageTime
    const remaining = config.RECALL_TIMEOUT - elapsed

    return Math.max(0, remaining)
  }

  /**
   * 获取剩余时间的格式化字符串
   * @param {Object} message - 消息对象
   * @returns {string} 格式化时间字符串（如 "1m30s"）
   */
  function getRecallTimeString(message) {
    const remaining = getRecallTimeRemaining(message)
    if (remaining <= 0) return '已过期'

    const seconds = Math.ceil(remaining / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    if (minutes > 0) {
      return `${minutes}m${secs}s`
    } else {
      return `${secs}s`
    }
  }

  /**
   * 撤回消息
   * @param {string} messageId - 消息 ID
   * @param {string} conversationId - 会话 ID
   * @returns {Promise<boolean>}
   */
  async function recallMessage(messageId, conversationId) {
    try {
      const message = store.getMessageById(messageId)

      // 验证是否可以撤回
      if (!canRecallMessage(message)) {
        const remaining = getRecallTimeRemaining(message)
        if (remaining <= 0) {
          ElMessage.error('消息已超过撤回时间限制（2分钟）')
        } else {
          ElMessage.error('您没有权限撤回此消息')
        }
        return false
      }

      // 构建撤回请求
      const recallRequest = {
        messageId: messageId,
        conversationId: conversationId,
        timestamp: Date.now(),
        operatorId: store.currentUserId
      }

      // 发送撤回请求到后端
      socketService.emit('message-recall', recallRequest)

      // 乐观更新：立即更新本地状态
      // 这样用户可以立即看到效果，即使网络延迟
      store.updateMessageRecalledStatus(messageId, true, Date.now())
      recalledMessages.add(messageId)

      ElMessage.success('消息已撤回')
      return true
    } catch (error) {
      console.error('撤回消息失败:', error)
      ElMessage.error('撤回消息失败，请稍后重试')

      // 添加到重试队列
      recallQueue.value.push({
        messageId,
        conversationId,
        timestamp: Date.now(),
        retryCount: 0
      })

      return false
    }
  }

  /**
   * 处理撤回确认
   * @param {Object} message - 消息对象
   */
  async function handleRecallConfirm(message) {
    // 显示确认对话框
    try {
      await ElMessageBox.confirm(
        '撤回后，对方将看到你撤回了一条消息。是否继续？',
        '撤回消息',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      // 用户确认，执行撤回
      return await recallMessage(message.id, message.conversationId)
    } catch (error) {
      // 用户取消
      return false
    }
  }

  /**
   * 处理 WebSocket 撤回事件
   * @param {Object} event - WebSocket 事件数据
   */
  function handleRecallEvent(event) {
    const { messageId, conversationId, recalledAt, recalledBy } = event

    // 只处理当前会话的消息
    if (conversationId !== store.activeConversationId) return

    // 更新消息状态
    store.updateMessageRecalledStatus(messageId, true, recalledAt, recalledBy)
    recalledMessages.add(messageId)

    // 如果是其他人撤回的，显示提示
    if (recalledBy !== store.currentUserId) {
      const senderName = store.getMessageById(messageId)?.senderName || '用户'
      ElMessage.info(`${senderName} 撤回了一条消息`)
    }
  }

  /**
   * 初始化撤回时间监听
   */
  function startRecallTimeMonitor() {
    recallTimerInterval = setInterval(() => {
      // 定期更新UI以显示倒计时
      // 这会触发 Vue 的响应式更新
      const messages = store.activeMessages || []
      messages.forEach(msg => {
        if (canRecallMessage(msg)) {
          // 触发更新（Vue 会检测到需要重新渲染）
          msg.__timeUpdated = Date.now()
        }
      })
    }, config.RECALL_CHECK_INTERVAL)
  }

  /**
   * 停止撤回时间监听
   */
  function stopRecallTimeMonitor() {
    if (recallTimerInterval) {
      clearInterval(recallTimerInterval)
      recallTimerInterval = null
    }
  }

  /**
   * 清理资源
   */
  function cleanup() {
    stopRecallTimeMonitor()
    recalledMessages.clear()
    recallQueue.value = []
  }

  return {
    // 配置
    config,

    // 状态
    recalledMessages,
    recallQueue,

    // 方法
    canRecallMessage,
    getRecallTimeRemaining,
    getRecallTimeString,
    recallMessage,
    handleRecallConfirm,
    handleRecallEvent,
    startRecallTimeMonitor,
    stopRecallTimeMonitor,
    cleanup
  }
}
```

### Step 2: 消息编辑服务完整实现

**文件**: `frontend/src/services/messageEditService.js`

```javascript
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import socketService from '@/utils/socket'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import api from '@/api'

/**
 * 消息编辑服务 Composable
 * 管理消息编辑和版本控制的业务逻辑
 */
export function useMessageEdit() {
  const store = useChatWorkspaceStore()

  // 编辑配置
  const config = reactive({
    MAX_CONTENT_LENGTH: 5000,
    MAX_HISTORY_VERSIONS: 10
  })

  // 消息编辑历史映射（messageId -> versions[]）
  const messageEditHistory = new Map()

  // 正在编辑的消息 ID
  const editingMessageId = ref(null)

  // 编辑队列（处理离线情况）
  const editQueue = ref([])

  /**
   * 检查消息是否可以编辑
   * @param {Object} message - 消息对象
   * @returns {boolean}
   */
  function canEditMessage(message) {
    if (!message) return false

    // 不能编辑已撤回的消息
    if (message.isRecalled) return false

    // 仅文本消息可编辑
    if (message.type !== 'text') return false

    // 仅发送者可编辑
    const currentUser = store.currentUserId
    const isOwner = message.senderId === currentUser

    return isOwner
  }

  /**
   * 验证编辑内容
   * @param {string} content - 编辑后的内容
   * @returns {Object} { valid: boolean, error?: string }
   */
  function validateEditContent(content) {
    if (!content || content.trim().length === 0) {
      return { valid: false, error: '内容不能为空' }
    }

    if (content.length > config.MAX_CONTENT_LENGTH) {
      return {
        valid: false,
        error: `内容长度不能超过 ${config.MAX_CONTENT_LENGTH} 字符`
      }
    }

    return { valid: true }
  }

  /**
   * 编辑消息
   * @param {string} messageId - 消息 ID
   * @param {string} conversationId - 会话 ID
   * @param {string} newContent - 新内容
   * @returns {Promise<boolean>}
   */
  async function editMessage(messageId, conversationId, newContent) {
    try {
      const message = store.getMessageById(messageId)

      // 验证是否可以编辑
      if (!canEditMessage(message)) {
        ElMessage.error('无法编辑此消息')
        return false
      }

      // 验证新内容
      const validation = validateEditContent(newContent)
      if (!validation.valid) {
        ElMessage.error(validation.error)
        return false
      }

      // 构建编辑请求
      const editRequest = {
        messageId: messageId,
        conversationId: conversationId,
        newContent: newContent,
        timestamp: Date.now(),
        operatorId: store.currentUserId
      }

      // 发送编辑请求到后端
      socketService.emit('message-edit', editRequest)

      // 乐观更新：立即更新本地状态
      const editCount = (message.editCount || 0) + 1
      store.updateMessageEditStatus(messageId, newContent, editCount, Date.now())

      // 保存编辑历史
      saveEditVersion(messageId, newContent, editCount)

      ElMessage.success('消息已编辑')
      return true
    } catch (error) {
      console.error('编辑消息失败:', error)
      ElMessage.error('编辑消息失败，请稍后重试')

      // 添加到重试队列
      editQueue.value.push({
        messageId,
        conversationId,
        newContent,
        timestamp: Date.now(),
        retryCount: 0
      })

      return false
    }
  }

  /**
   * 保存编辑版本到本地历史
   * @param {string} messageId - 消息 ID
   * @param {string} content - 内容
   * @param {number} editCount - 编辑次数
   */
  function saveEditVersion(messageId, content, editCount) {
    if (!messageEditHistory.has(messageId)) {
      messageEditHistory.set(messageId, [])
    }

    const history = messageEditHistory.get(messageId)
    history.push({
      version: editCount,
      content: content,
      editedAt: Date.now(),
      editedBy: store.currentUserId
    })

    // 限制历史版本数量
    if (history.length > config.MAX_HISTORY_VERSIONS) {
      history.shift()
    }
  }

  /**
   * 获取消息编辑历史
   * @param {string} messageId - 消息 ID
   * @returns {Promise<Array>}
   */
  async function getMessageHistory(messageId) {
    try {
      // 首先查看本地历史
      if (messageEditHistory.has(messageId)) {
        return messageEditHistory.get(messageId)
      }

      // 从后端获取完整历史
      const response = await api.get(`/api/messages/${messageId}/history`)
      const versions = response.data?.versions || []

      // 保存到本地缓存
      messageEditHistory.set(messageId, versions)

      return versions
    } catch (error) {
      console.error('获取编辑历史失败:', error)
      return []
    }
  }

  /**
   * 恢复到某个版本
   * @param {string} messageId - 消息 ID
   * @param {number} versionNumber - 版本号
   * @returns {Promise<boolean>}
   */
  async function restoreVersion(messageId, versionNumber) {
    try {
      const history = messageEditHistory.get(messageId) || []
      const version = history.find(v => v.version === versionNumber)

      if (!version) {
        ElMessage.error('版本不存在')
        return false
      }

      // 将版本内容作为新编辑
      return await editMessage(
        messageId,
        store.activeConversationId,
        version.content
      )
    } catch (error) {
      console.error('恢复版本失败:', error)
      ElMessage.error('恢复版本失败')
      return false
    }
  }

  /**
   * 处理编辑确认
   * @param {Object} message - 消息对象
   * @param {Function} onEdit - 编辑回调
   */
  async function handleEditConfirm(message, onEdit) {
    // 设置为编辑中
    editingMessageId.value = message.id

    // 调用编辑回调（显示编辑界面）
    const newContent = await onEdit(message.content)

    // 重置编辑状态
    editingMessageId.value = null

    if (newContent !== null && newContent !== undefined) {
      return await editMessage(message.id, message.conversationId, newContent)
    }

    return false
  }

  /**
   * 处理 WebSocket 编辑事件
   * @param {Object} event - WebSocket 事件数据
   */
  function handleEditEvent(event) {
    const { messageId, conversationId, content, editedAt, editCount } = event

    // 只处理当前会话的消息
    if (conversationId !== store.activeConversationId) return

    // 更新消息内容
    store.updateMessageEditStatus(messageId, content, editCount, editedAt)

    // 保存到历史
    saveEditVersion(messageId, content, editCount)

    // 显示提示
    const message = store.getMessageById(messageId)
    if (message && message.senderId !== store.currentUserId) {
      const senderName = message.senderName || '用户'
      ElMessage.info(`${senderName} 编辑了消息`)
    }
  }

  /**
   * 清理资源
   */
  function cleanup() {
    messageEditHistory.clear()
    editingMessageId.value = null
    editQueue.value = []
  }

  return {
    // 配置
    config,

    // 状态
    messageEditHistory,
    editingMessageId,
    editQueue,

    // 方法
    canEditMessage,
    validateEditContent,
    editMessage,
    saveEditVersion,
    getMessageHistory,
    restoreVersion,
    handleEditConfirm,
    handleEditEvent,
    cleanup
  }
}
```

### Step 3: 编辑覆盖层组件

**文件**: `frontend/src/components/chat/MessageEditOverlay.vue`

```vue
<template>
  <transition name="fade">
    <div v-if="visible" class="edit-overlay">
      <!-- 遮罩 -->
      <div class="overlay-mask" @click="handleCancel"></div>

      <!-- 编辑框 -->
      <div class="edit-box">
        <div class="edit-header">
          <span class="title">编辑消息</span>
          <el-button
            text
            type="danger"
            size="small"
            @click="handleCancel"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="edit-content">
          <el-input
            v-model="editContent"
            type="textarea"
            :rows="4"
            placeholder="编辑消息内容..."
            :maxlength="5000"
            show-word-limit
            clearable
            @keydown.ctrl.enter="handleSubmit"
          />
        </div>

        <div class="edit-footer">
          <span class="tip">💡 按 Ctrl+Enter 快速发送</span>
          <div class="buttons">
            <el-button @click="handleCancel">取消</el-button>
            <el-button
              type="primary"
              @click="handleSubmit"
              :loading="loading"
              :disabled="!editContent.trim()"
            >
              保存编辑
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'submit'])

const editContent = ref('')
const loading = ref(false)

// 监听 visible 属性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.message) {
      // 显示覆盖层时，预填充原内容
      editContent.value = props.message.content || ''

      // 自动获得焦点
      setTimeout(() => {
        const textarea = document.querySelector('.edit-content textarea')
        if (textarea) {
          textarea.focus()
          textarea.select()
        }
      }, 100)
    }
  }
)

async function handleSubmit() {
  const content = editContent.value.trim()

  if (!content) {
    ElMessage.warning('内容不能为空')
    return
  }

  if (content === props.message?.content) {
    ElMessage.info('内容未修改')
    return
  }

  loading.value = true
  try {
    emit('submit', content)
    // 等待父组件处理后再关闭
    setTimeout(() => {
      emit('update:visible', false)
    }, 300)
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
  cursor: pointer;
}

.edit-box {
  position: relative;
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 2001;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.edit-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.edit-content :deep(.el-textarea) {
  height: 100%;
}

.edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.tip {
  font-size: 12px;
  color: #909399;
}

.buttons {
  display: flex;
  gap: 8px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .edit-box {
    width: 95%;
    max-width: none;
  }

  .edit-overlay {
    align-items: flex-end;
  }

  .edit-box {
    border-radius: 8px 8px 0 0;
  }
}
</style>
```

## 集成到现有组件

### 修改 MessageBubble 或 MessageListNew

在长按菜单中添加撤回和编辑选项：

```vue
<!-- 在消息上下文菜单中 -->
<el-dropdown-item
  v-if="canRecallMessage(message)"
  @click="handleRecall"
>
  <el-icon><Delete /></el-icon>
  <span>撤回 ({{ recallTimeString }})</span>
</el-dropdown-item>

<el-dropdown-item
  v-if="canEditMessage(message)"
  @click="handleEdit"
>
  <el-icon><Edit /></el-icon>
  <span>编辑</span>
</el-dropdown-item>

<el-dropdown-item
  v-if="message.isEdited"
  @click="handleShowHistory"
>
  <el-icon><DocumentCopy /></el-icon>
  <span>编辑历史 (版本 {{ message.editCount }})</span>
</el-dropdown-item>
```

## WebSocket 事件处理

在 ChatRoom 或 socket 服务中：

```javascript
// 监听撤回事件
socketService.on('message-recalled', (event) => {
  const { messageRecall } = useMessageRecall()
  messageRecall.handleRecallEvent(event)
})

// 监听编辑事件
socketService.on('message-edited', (event) => {
  const { messageEdit } = useMessageEdit()
  messageEdit.handleEditEvent(event)
})
```

## 测试检查清单

```
撤回功能:
✅ 可以撤回自己的消息
✅ 超过2分钟无法撤回
✅ 显示剩余撤回时间
✅ WebSocket 通知其他客户端
✅ UI 显示"已撤回"提示

编辑功能:
✅ 可以编辑自己的消息
✅ 编辑后显示"已编辑"标记
✅ 可以查看编辑历史
✅ WebSocket 通知其他客户端
✅ 编辑内容验证

冲突处理:
✅ 并发撤回/编辑处理
✅ 网络错误重试
✅ 权限验证
```

---

**预计完成**: 2025-10-24
**质量目标**: 测试覆盖 > 90%
**优先级**: 高 (核心功能)
