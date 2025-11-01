import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import socketService from '@/utils/socket'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

/**
 * 消息收藏服务 Composable
 * 管理消息收藏、收藏列表和收藏同步的业务逻辑
 *
 * 特性:
 * - 本地收藏管理
 * - 全文搜索和筛选
 * - WebSocket 实时同步
 * - localStorage 持久化
 * - 批量操作支持
 */
export function useMessageCollection() {
  const store = useChatWorkspaceStore()

  // 收藏配置
  const config = reactive({
    STORAGE_KEY: 'message_collections',
    MAX_COLLECTIONS: 1000,
    SYNC_INTERVAL: 30000 // 30 秒同步一次
  })

  // 收藏数据: Map<messageId, collection>
  const collections = reactive(new Map())

  // 待同步的收藏 ID 列表
  const pendingSyncs = ref([])

  // 同步状态
  const isSyncing = ref(false)

  // 最后同步时间
  const lastSyncTime = ref(0)

  /**
   * 创建收藏记录
   */
  function createCollectionRecord(messageId, message) {
    return {
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      conversationId: message.conversationId,
      messageContent: message.content,
      messageType: message.type || 'text',
      senderName: message.senderName,
      senderId: message.senderId,
      collectedAt: Date.now(),
      collectedBy: store.currentUserId,
      notes: '',
      tags: [],
      metadata: {
        type: message.type,
        attachments: message.attachments || [],
        quoted: message.quotedMessage || null,
        editCount: message.editCount || 0,
        isRecalled: message.isRecalled || false
      }
    }
  }

  /**
   * 收藏消息
   */
  async function collectMessage(messageId, conversationId, message) {
    try {
      if (!messageId || !message) {
        ElMessage.error('无法收藏：消息信息不完整')
        return false
      }

      // 检查是否已收藏
      if (isCollected(messageId)) {
        ElMessage.info('消息已经被收藏过了')
        return false
      }

      // 检查数量限制
      if (collections.size >= config.MAX_COLLECTIONS) {
        ElMessage.error(`收藏数量已达上限 (${config.MAX_COLLECTIONS})`)
        return false
      }

      // 创建收藏记录
      const collection = createCollectionRecord(messageId, message)
      collections.set(messageId, collection)

      // 发送 WebSocket 事件
      socketService.emit('message-collected', {
        messageId,
        conversationId,
        collectedAt: collection.collectedAt,
        collectedBy: store.currentUserId
      })

      // 添加到待同步列表
      if (!pendingSyncs.value.includes(messageId)) {
        pendingSyncs.value.push(messageId)
      }

      // 保存到本地存储
      saveToLocalStorage()

      ElMessage.success('已收藏消息')
      return true
    } catch (error) {
      console.error('收藏消息失败:', error)
      ElMessage.error('收藏失败，请稍后重试')
      return false
    }
  }

  /**
   * 取消收藏
   */
  async function uncollectMessage(messageId) {
    try {
      if (!messageId) return false

      if (!isCollected(messageId)) {
        ElMessage.warning('消息未被收藏')
        return false
      }

      const collection = collections.get(messageId)
      const conversationId = collection.conversationId

      // 从收藏中删除
      collections.delete(messageId)

      // 发送 WebSocket 事件
      socketService.emit('message-uncollected', {
        messageId,
        conversationId,
        uncollectedAt: Date.now(),
        uncollectedBy: store.currentUserId
      })

      // 从待同步列表移除
      pendingSyncs.value = pendingSyncs.value.filter(id => id !== messageId)

      // 保存到本地存储
      saveToLocalStorage()

      ElMessage.success('已取消收藏')
      return true
    } catch (error) {
      console.error('取消收藏失败:', error)
      ElMessage.error('操作失败，请稍后重试')
      return false
    }
  }

  /**
   * 检查消息是否已收藏
   */
  function isCollected(messageId) {
    if (!messageId) return false
    return collections.has(messageId)
  }

  /**
   * 获取收藏数量
   */
  const collectionCount = computed(() => collections.size)

  /**
   * 获取收藏列表 (支持筛选)
   */
  function getCollections(filter = {}) {
    let result = Array.from(collections.values())

    // 按类型筛选
    if (filter.type) {
      result = result.filter(c => c.messageType === filter.type)
    }

    // 按日期范围筛选
    if (filter.startDate) {
      result = result.filter(c => c.collectedAt >= filter.startDate)
    }
    if (filter.endDate) {
      result = result.filter(c => c.collectedAt <= filter.endDate)
    }

    // 按标签筛选
    if (filter.tags && filter.tags.length > 0) {
      result = result.filter(c =>
        filter.tags.some(tag => c.tags.includes(tag))
      )
    }

    // 按发送者筛选
    if (filter.senderId) {
      result = result.filter(c => c.senderId === filter.senderId)
    }

    // 按关键词搜索
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      result = result.filter(c =>
        c.messageContent.toLowerCase().includes(kw) ||
        c.senderName.toLowerCase().includes(kw) ||
        c.notes.toLowerCase().includes(kw)
      )
    }

    // 排序
    if (filter.sortBy === 'recent') {
      result.sort((a, b) => b.collectedAt - a.collectedAt)
    } else if (filter.sortBy === 'oldest') {
      result.sort((a, b) => a.collectedAt - b.collectedAt)
    }

    return result
  }

  /**
   * 获取指定消息的收藏记录
   */
  function getCollection(messageId) {
    return collections.get(messageId) || null
  }

  /**
   * 更新收藏备注
   */
  function updateCollectionNote(messageId, note) {
    try {
      const collection = collections.get(messageId)
      if (!collection) {
        ElMessage.error('收藏记录不存在')
        return false
      }

      collection.notes = note || ''
      collection.updatedAt = Date.now()

      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('更新备注失败:', error)
      return false
    }
  }

  /**
   * 给收藏添加标签
   */
  function addCollectionTag(messageId, tag) {
    try {
      const collection = collections.get(messageId)
      if (!collection) return false

      if (!collection.tags.includes(tag)) {
        collection.tags.push(tag)
        saveToLocalStorage()
      }
      return true
    } catch (error) {
      console.error('添加标签失败:', error)
      return false
    }
  }

  /**
   * 移除收藏标签
   */
  function removeCollectionTag(messageId, tag) {
    try {
      const collection = collections.get(messageId)
      if (!collection) return false

      collection.tags = collection.tags.filter(t => t !== tag)
      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('移除标签失败:', error)
      return false
    }
  }

  /**
   * 清空所有收藏
   */
  function clearCollections() {
    try {
      collections.clear()
      pendingSyncs.value = []
      saveToLocalStorage()
      ElMessage.success('已清空所有收藏')
      return true
    } catch (error) {
      console.error('清空收藏失败:', error)
      return false
    }
  }

  /**
   * 批量取消收藏
   */
  async function batchUncollect(messageIds) {
    try {
      for (const messageId of messageIds) {
        await uncollectMessage(messageId)
      }
      return true
    } catch (error) {
      console.error('批量取消失败:', error)
      return false
    }
  }

  /**
   * 保存到本地存储
   */
  function saveToLocalStorage() {
    try {
      const data = {
        collections: Array.from(collections.entries()),
        lastSyncTime: Date.now(),
        version: 1
      }
      localStorage.setItem(config.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(config.STORAGE_KEY)
      if (!data) return

      const parsed = JSON.parse(data)
      if (parsed.collections && Array.isArray(parsed.collections)) {
        collections.clear()
        parsed.collections.forEach(([messageId, collection]) => {
          collections.set(messageId, collection)
        })
        lastSyncTime.value = parsed.lastSyncTime || 0
      }
    } catch (error) {
      console.error('从本地存储加载失败:', error)
    }
  }

  /**
   * 与服务器同步
   */
  async function syncWithServer() {
    if (isSyncing.value || pendingSyncs.value.length === 0) return

    try {
      isSyncing.value = true

      // 批量发送待同步的收藏
      for (const messageId of pendingSyncs.value) {
        const collection = collections.get(messageId)
        if (collection) {
          socketService.emit('collection-sync', {
            messageId,
            collection
          })
        }
      }

      // 清空待同步列表
      pendingSyncs.value = []
      lastSyncTime.value = Date.now()
    } catch (error) {
      console.error('同步失败:', error)
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * 处理 WebSocket 收藏事件
   */
  function handleCollectionEvent(event) {
    if (!event) return

    const { messageId, type, data } = event

    if (type === 'collection-added') {
      // 其他用户收藏了消息
      if (data && !collections.has(messageId)) {
        collections.set(messageId, data)
        saveToLocalStorage()
      }
    } else if (type === 'collection-removed') {
      // 其他用户取消了收藏
      if (collections.has(messageId)) {
        collections.delete(messageId)
        saveToLocalStorage()
      }
    }
  }

  /**
   * 清理资源
   */
  function cleanup() {
    collections.clear()
    pendingSyncs.value = []
    lastSyncTime.value = 0
  }

  // 计算属性: 是否有待同步
  const hasPendingSyncs = computed(() => pendingSyncs.value.length > 0)

  return {
    // 配置
    config,

    // 状态
    collections,
    pendingSyncs,
    isSyncing,
    lastSyncTime,
    collectionCount,
    hasPendingSyncs,

    // 收藏操作
    collectMessage,
    uncollectMessage,
    isCollected,
    getCollections,
    getCollection,
    batchUncollect,
    clearCollections,

    // 收藏管理
    updateCollectionNote,
    addCollectionTag,
    removeCollectionTag,

    // 存储和同步
    saveToLocalStorage,
    loadFromLocalStorage,
    syncWithServer,

    // 事件处理
    handleCollectionEvent,

    // 清理
    cleanup
  }
}
