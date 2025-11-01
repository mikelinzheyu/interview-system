import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import socketService from '@/utils/socket'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

/**
 * 消息撤回服务 Composable
 * 管理消息撤回的业务逻辑、权限验证和状态管理
 *
 * 特性:
 * - 2分钟撤回时间限制
 * - 权限验证（仅发送者或管理员）
 * - WebSocket 实时同步
 * - 乐观更新和错误恢复
 * - 撤回时间倒计时
 */
export function useMessageRecall() {
  const store = useChatWorkspaceStore()

  // 撤回配置
  const config = reactive({
    RECALL_TIMEOUT: 2 * 60 * 1000, // 2 分钟（毫秒）
    RECALL_CHECK_INTERVAL: 1000 // 1 秒检查一次（毫秒）
  })

  // 已撤回消息集合（用于性能优化）
  const recalledMessages = new Set()

  // 撤回操作队列（处理离线情况）
  const recallQueue = ref([])

  // 监听定时器
  let recallTimerInterval = null

  /**
   * 检查消息是否可以撤回
   * 验证：
   * 1. 消息未被撤回
   * 2. 用户有权限（发送者或管理员）
   * 3. 在2分钟时间限制内
   *
   * @param {Object} message - 消息对象
   * @returns {boolean} 是否可以撤回
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
      // const isAdmin = checkIsAdmin()
      return false
    }

    // 检查时间限制：在2分钟内
    const now = Date.now()
    const messageTime = message.timestamp || message.createdAt
    if (!messageTime) return false

    const elapsed = now - messageTime
    const canRecall = elapsed <= config.RECALL_TIMEOUT

    return canRecall
  }

  /**
   * 获取消息剩余撤回时间（毫秒）
   *
   * @param {Object} message - 消息对象
   * @returns {number} 剩余时间（毫秒），如果无法撤回返回0
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
   * 例如: "2m30s", "45s", "已过期"
   *
   * @param {Object} message - 消息对象
   * @returns {string} 格式化时间字符串
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
   *
   * 流程:
   * 1. 验证是否可以撤回
   * 2. 构建撤回请求
   * 3. 发送到服务器
   * 4. 乐观更新本地状态
   * 5. 失败则添加到重试队列
   *
   * @param {string} messageId - 消息 ID
   * @param {string} conversationId - 会话 ID
   * @returns {Promise<boolean>} 撤回是否成功
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

      // 发送撤回请求到后端（通过 WebSocket）
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

      // 添加到重试队列（处理离线情况）
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
   * 显示确认对话框，用户确认后执行撤回
   *
   * @param {Object} message - 消息对象
   * @returns {Promise<boolean>} 是否确认撤回
   */
  async function handleRecallConfirm(message) {
    try {
      // 显示确认对话框
      await ElMessageBox.confirm(
        '撤回后，对方将看到你撤回了一条消息。是否继续？',
        '撤回消息',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          closeOnClickModal: false,
          closeOnPressEscape: false
        }
      )

      // 用户确认，执行撤回
      return await recallMessage(message.id, message.conversationId)
    } catch (error) {
      // 用户取消或错误
      return false
    }
  }

  /**
   * 处理 WebSocket 撤回事件
   * 当其他客户端或服务器通知有消息被撤回时调用
   *
   * @param {Object} event - WebSocket 事件数据
   * @example
   * {
   *   messageId: 'msg_123',
   *   conversationId: 'conv_456',
   *   recalledAt: 1666000000000,
   *   recalledBy: 'user_789'
   * }
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
      const message = store.getMessageById(messageId)
      const senderName = message?.senderName || '用户'
      // 群聊时显示谁撤回了消息
      ElMessage.info(`${senderName} 撤回了一条消息`)
    }
  }

  /**
   * 初始化撤回时间监听
   * 定期更新UI以显示倒计时
   */
  function startRecallTimeMonitor() {
    recallTimerInterval = setInterval(() => {
      // 定期更新UI以显示倒计时
      // 这会触发 Vue 的响应式更新
      const messages = store.activeMessages || []
      messages.forEach(msg => {
        if (msg && canRecallMessage(msg)) {
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
   * 重试撤回操作
   * 处理之前失败的撤回请求
   */
  async function retryRecallQueue() {
    if (recallQueue.value.length === 0) return

    const queue = [...recallQueue.value]
    recallQueue.value = []

    for (const item of queue) {
      try {
        const success = await recallMessage(item.messageId, item.conversationId)
        if (!success && item.retryCount < 3) {
          // 重试失败，重新加入队列
          item.retryCount++
          recallQueue.value.push(item)
        }
      } catch (error) {
        console.error('重试撤回失败:', error)
        if (item.retryCount < 3) {
          item.retryCount++
          recallQueue.value.push(item)
        }
      }
    }
  }

  /**
   * 清理资源
   * 在组件卸载时调用
   */
  function cleanup() {
    stopRecallTimeMonitor()
    recalledMessages.clear()
    recallQueue.value = []
  }

  // 计算属性：是否有待重试的操作
  const hasPendingRecalls = computed(() => recallQueue.value.length > 0)

  return {
    // 配置
    config,

    // 状态
    recalledMessages,
    recallQueue,
    hasPendingRecalls,

    // 方法
    canRecallMessage,
    getRecallTimeRemaining,
    getRecallTimeString,
    recallMessage,
    handleRecallConfirm,
    handleRecallEvent,
    startRecallTimeMonitor,
    stopRecallTimeMonitor,
    retryRecallQueue,
    cleanup
  }
}
