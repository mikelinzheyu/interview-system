import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import socketService from '@/utils/socket'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import api from '@/api'

/**
 * 消息编辑服务 Composable
 * 管理消息编辑、版本控制和历史记录的业务逻辑
 *
 * 特性:
 * - 无时间限制的消息编辑
 * - 完整的版本历史记录
 * - 版本对比和恢复
 * - WebSocket 实时同步
 * - 乐观更新和错误恢复
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
   */
  function canEditMessage(message) {
    if (!message) return false
    if (message.isRecalled) return false
    if (message.type !== 'text') return false

    const currentUser = store.currentUserId
    const isOwner = message.senderId === currentUser

    return isOwner
  }

  /**
   * 验证编辑内容
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
   */
  async function editMessage(messageId, conversationId, newContent) {
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

      if (newContent === message.content) {
        ElMessage.info('内容未修改')
        return false
      }

      const editRequest = {
        messageId: messageId,
        conversationId: conversationId,
        newContent: newContent,
        timestamp: Date.now(),
        operatorId: store.currentUserId
      }

      socketService.emit('message-edit', editRequest)

      const editCount = (message.editCount || 0) + 1
      store.updateMessageEditStatus(messageId, newContent, editCount, Date.now())

      saveEditVersion(messageId, newContent, editCount)

      ElMessage.success('消息已编辑')
      return true
    } catch (error) {
      console.error('编辑消息失败:', error)
      ElMessage.error('编辑消息失败，请稍后重试')

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

    if (history.length > config.MAX_HISTORY_VERSIONS) {
      history.shift()
    }
  }

  /**
   * 获取消息编辑历史
   */
  async function getMessageHistory(messageId) {
    try {
      if (messageEditHistory.has(messageId)) {
        return messageEditHistory.get(messageId)
      }

      const response = await api.get(`/api/messages/${messageId}/history`)
      const versions = response.data?.versions || []

      messageEditHistory.set(messageId, versions)

      return versions
    } catch (error) {
      console.error('获取编辑历史失败:', error)
      ElMessage.error('获取编辑历史失败')
      return []
    }
  }

  /**
   * 恢复到某个版本
   */
  async function restoreVersion(messageId, versionNumber) {
    try {
      const history = messageEditHistory.get(messageId) || []
      const version = history.find(v => v.version === versionNumber)

      if (!version) {
        ElMessage.error('版本不存在')
        return false
      }

      const confirmed = await ElMessageBox.confirm(
        `确定要恢复到版本 ${versionNumber} 吗？`,
        '恢复版本',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(() => false)

      if (!confirmed) return false

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
   */
  async function handleEditConfirm(message, onEdit) {
    try {
      editingMessageId.value = message.id

      const newContent = await onEdit(message.content)

      editingMessageId.value = null

      if (newContent !== null && newContent !== undefined) {
        return await editMessage(message.id, message.conversationId, newContent)
      }

      return false
    } catch (error) {
      editingMessageId.value = null
      console.error('编辑确认失败:', error)
      return false
    }
  }

  /**
   * 处理 WebSocket 编辑事件
   */
  function handleEditEvent(event) {
    const { messageId, conversationId, content, editedAt, editCount } = event

    if (conversationId !== store.activeConversationId) return

    store.updateMessageEditStatus(messageId, content, editCount, editedAt)
    saveEditVersion(messageId, content, editCount)

    const message = store.getMessageById(messageId)
    if (message && message.senderId !== store.currentUserId) {
      const senderName = message.senderName || '用户'
      ElMessage.info(`${senderName} 编辑了消息`)
    }
  }

  /**
   * 重试编辑操作
   */
  async function retryEditQueue() {
    if (editQueue.value.length === 0) return

    const queue = [...editQueue.value]
    editQueue.value = []

    for (const item of queue) {
      try {
        const success = await editMessage(
          item.messageId,
          item.conversationId,
          item.newContent
        )
        if (!success && item.retryCount < 3) {
          item.retryCount++
          editQueue.value.push(item)
        }
      } catch (error) {
        console.error('重试编辑失败:', error)
        if (item.retryCount < 3) {
          item.retryCount++
          editQueue.value.push(item)
        }
      }
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

  const hasPendingEdits = computed(() => editQueue.value.length > 0)

  return {
    config,
    messageEditHistory,
    editingMessageId,
    editQueue,
    hasPendingEdits,
    canEditMessage,
    validateEditContent,
    editMessage,
    saveEditVersion,
    getMessageHistory,
    restoreVersion,
    handleEditConfirm,
    handleEditEvent,
    retryEditQueue,
    cleanup
  }
}
