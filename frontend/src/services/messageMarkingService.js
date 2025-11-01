import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import socketService from '@/utils/socket'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

/**
 * 消息标记服务 Composable
 * 管理消息标记、标签和标记同步的业务逻辑
 *
 * 特性:
 * - 多标记类型支持 (重要、紧急、待做、完成)
 * - 自定义标签管理
 * - 标签色彩自定义
 * - WebSocket 实时同步
 * - localStorage 持久化
 */
export function useMessageMarking() {
  const store = useChatWorkspaceStore()

  // 标记配置
  const config = reactive({
    STORAGE_KEY: 'message_marks',
    TAGS_STORAGE_KEY: 'message_tags',
    MARK_TYPES: ['important', 'urgent', 'todo', 'done'],
    DEFAULT_TAGS: [
      { id: 'tag_work', name: '工作', color: '#409EFF', icon: 'briefcase' },
      { id: 'tag_personal', name: '个人', color: '#67C23A', icon: 'user' },
      { id: 'tag_urgent', name: '紧急', color: '#F56C6C', icon: 'warning' },
      { id: 'tag_important', name: '重要', color: '#E6A23C', icon: 'star' }
    ]
  })

  // 标记数据: Map<messageId, { markType: boolean, tags: [] }>
  const marks = reactive(new Map())

  // 标签数据: Array<Tag>
  const tags = reactive([])

  // 初始化默认标签
  function initDefaultTags() {
    if (tags.length === 0) {
      tags.push(...config.DEFAULT_TAGS)
    }
  }

  /**
   * 标记消息
   */
  function markMessage(messageId, markType) {
    try {
      if (!messageId || !markType) {
        ElMessage.error('参数不完整')
        return false
      }

      if (!config.MARK_TYPES.includes(markType)) {
        ElMessage.error('无效的标记类型')
        return false
      }

      // 获取或创建标记记录
      if (!marks.has(messageId)) {
        marks.set(messageId, {
          messageId,
          marks: {},
          tags: [],
          createdAt: Date.now()
        })
      }

      const record = marks.get(messageId)
      const isMarked = record.marks[markType]

      // 切换标记状态
      record.marks[markType] = !isMarked
      record.updatedAt = Date.now()

      // 发送 WebSocket 事件
      socketService.emit('message-marked', {
        messageId,
        markType,
        isMarked: !isMarked,
        markedAt: Date.now(),
        markedBy: store.currentUserId
      })

      // 保存到本地存储
      saveToLocalStorage()

      const action = record.marks[markType] ? '已标记' : '已取消标记'
      ElMessage.success(`${action}为 ${markType}`)
      return true
    } catch (error) {
      console.error('标记消息失败:', error)
      ElMessage.error('操作失败，请稍后重试')
      return false
    }
  }

  /**
   * 取消标记
   */
  function unmarkMessage(messageId, markType) {
    try {
      const record = marks.get(messageId)
      if (!record || !record.marks[markType]) {
        return false
      }

      record.marks[markType] = false
      record.updatedAt = Date.now()

      // 发送 WebSocket 事件
      socketService.emit('message-unmarked', {
        messageId,
        markType,
        unmarkedAt: Date.now(),
        unmarkedBy: store.currentUserId
      })

      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('取消标记失败:', error)
      return false
    }
  }

  /**
   * 检查消息是否有指定标记
   */
  function hasMarkType(messageId, markType) {
    const record = marks.get(messageId)
    return record ? record.marks[markType] === true : false
  }

  /**
   * 获取消息的所有标记
   */
  function getMessageMarks(messageId) {
    const record = marks.get(messageId)
    if (!record) return []

    return Object.entries(record.marks)
      .filter(([_, isMarked]) => isMarked)
      .map(([markType, _]) => markType)
  }

  /**
   * 获取指定类型的所有已标记消息
   */
  function getMarkedMessages(markType) {
    const result = []
    marks.forEach((record, messageId) => {
      if (record.marks[markType] === true) {
        result.push(messageId)
      }
    })
    return result
  }

  /**
   * 获取标记统计
   */
  function getMarkStatistics() {
    const stats = {}
    config.MARK_TYPES.forEach(type => {
      stats[type] = getMarkedMessages(type).length
    })
    return stats
  }

  /**
   * 添加标签
   */
  function addTag(messageId, tag) {
    try {
      if (!messageId || !tag) {
        ElMessage.error('参数不完整')
        return false
      }

      // 获取或创建标记记录
      if (!marks.has(messageId)) {
        marks.set(messageId, {
          messageId,
          marks: {},
          tags: [],
          createdAt: Date.now()
        })
      }

      const record = marks.get(messageId)

      // 检查标签是否已存在
      if (record.tags.some(t => t.id === tag.id)) {
        ElMessage.info('标签已存在')
        return false
      }

      // 添加标签
      record.tags.push(tag)
      record.updatedAt = Date.now()

      // 发送 WebSocket 事件
      socketService.emit('message-tag-added', {
        messageId,
        tag,
        addedAt: Date.now(),
        addedBy: store.currentUserId
      })

      saveToLocalStorage()
      ElMessage.success(`已添加标签: ${tag.name}`)
      return true
    } catch (error) {
      console.error('添加标签失败:', error)
      return false
    }
  }

  /**
   * 移除标签
   */
  function removeTag(messageId, tagId) {
    try {
      const record = marks.get(messageId)
      if (!record) return false

      const initialLength = record.tags.length
      record.tags = record.tags.filter(t => t.id !== tagId)

      if (initialLength === record.tags.length) {
        return false
      }

      record.updatedAt = Date.now()

      // 发送 WebSocket 事件
      socketService.emit('message-tag-removed', {
        messageId,
        tagId,
        removedAt: Date.now(),
        removedBy: store.currentUserId
      })

      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('移除标签失败:', error)
      return false
    }
  }

  /**
   * 获取消息的标签
   */
  function getMessageTags(messageId) {
    const record = marks.get(messageId)
    return record ? record.tags : []
  }

  /**
   * 创建新标签
   */
  function createTag(name, color, icon = 'tag') {
    try {
      if (!name || !color) {
        ElMessage.error('标签名称和颜色不能为空')
        return null
      }

      const newTag = {
        id: `tag_${Date.now()}`,
        name,
        color,
        icon,
        createdAt: Date.now()
      }

      tags.push(newTag)
      saveTagsToLocalStorage()
      ElMessage.success(`已创建标签: ${name}`)
      return newTag
    } catch (error) {
      console.error('创建标签失败:', error)
      return null
    }
  }

  /**
   * 更新标签
   */
  function updateTag(tagId, name, color) {
    try {
      const tag = tags.find(t => t.id === tagId)
      if (!tag) {
        ElMessage.error('标签不存在')
        return false
      }

      if (name) tag.name = name
      if (color) tag.color = color
      tag.updatedAt = Date.now()

      saveTagsToLocalStorage()
      return true
    } catch (error) {
      console.error('更新标签失败:', error)
      return false
    }
  }

  /**
   * 删除标签
   */
  function deleteTag(tagId) {
    try {
      // 检查是否有消息使用该标签
      let usageCount = 0
      marks.forEach(record => {
        if (record.tags.some(t => t.id === tagId)) {
          record.tags = record.tags.filter(t => t.id !== tagId)
          usageCount++
        }
      })

      // 从标签列表删除
      const initialLength = tags.length
      tags.splice(tags.findIndex(t => t.id === tagId), 1)

      if (tags.length === initialLength) {
        return false
      }

      saveTagsToLocalStorage()
      saveToLocalStorage()

      if (usageCount > 0) {
        ElMessage.success(`已删除标签，同时移除了 ${usageCount} 条消息的该标签`)
      }
      return true
    } catch (error) {
      console.error('删除标签失败:', error)
      return false
    }
  }

  /**
   * 获取所有标签
   */
  function getTags() {
    return [...tags]
  }

  /**
   * 获取标签统计
   */
  function getTagStatistics() {
    const stats = {}
    tags.forEach(tag => {
      stats[tag.id] = 0
    })

    marks.forEach(record => {
      record.tags.forEach(tag => {
        if (stats.hasOwnProperty(tag.id)) {
          stats[tag.id]++
        }
      })
    })

    return stats
  }

  /**
   * 保存标记到本地存储
   */
  function saveToLocalStorage() {
    try {
      const data = {
        marks: Array.from(marks.entries()),
        lastSyncTime: Date.now(),
        version: 1
      }
      localStorage.setItem(config.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('保存标记失败:', error)
    }
  }

  /**
   * 从本地存储加载标记
   */
  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(config.STORAGE_KEY)
      if (!data) return

      const parsed = JSON.parse(data)
      if (parsed.marks && Array.isArray(parsed.marks)) {
        marks.clear()
        parsed.marks.forEach(([messageId, record]) => {
          marks.set(messageId, record)
        })
      }
    } catch (error) {
      console.error('加载标记失败:', error)
    }
  }

  /**
   * 保存标签到本地存储
   */
  function saveTagsToLocalStorage() {
    try {
      const data = {
        tags: tags,
        lastSyncTime: Date.now(),
        version: 1
      }
      localStorage.setItem(config.TAGS_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('保存标签失败:', error)
    }
  }

  /**
   * 从本地存储加载标签
   */
  function loadTagsFromLocalStorage() {
    try {
      const data = localStorage.getItem(config.TAGS_STORAGE_KEY)
      if (!data) {
        initDefaultTags()
        return
      }

      const parsed = JSON.parse(data)
      if (parsed.tags && Array.isArray(parsed.tags)) {
        tags.splice(0, tags.length, ...parsed.tags)
      } else {
        initDefaultTags()
      }
    } catch (error) {
      console.error('加载标签失败:', error)
      initDefaultTags()
    }
  }

  /**
   * 处理 WebSocket 标记事件
   */
  function handleMarkingEvent(event) {
    if (!event) return

    const { messageId, type, data } = event

    if (type === 'mark-added') {
      // 其他用户添加了标记
      if (data && data.markType) {
        if (!marks.has(messageId)) {
          marks.set(messageId, {
            messageId,
            marks: {},
            tags: []
          })
        }
        marks.get(messageId).marks[data.markType] = true
        saveToLocalStorage()
      }
    } else if (type === 'mark-removed') {
      // 其他用户移除了标记
      const record = marks.get(messageId)
      if (record && data && data.markType) {
        record.marks[data.markType] = false
        saveToLocalStorage()
      }
    }
  }

  /**
   * 初始化服务
   */
  function initialize() {
    loadFromLocalStorage()
    loadTagsFromLocalStorage()
  }

  /**
   * 清理资源
   */
  function cleanup() {
    marks.clear()
    tags.splice(0)
  }

  // 计算属性
  const totalMarkedMessages = computed(() => marks.size)
  const totalTags = computed(() => tags.length)

  return {
    // 配置
    config,

    // 状态
    marks,
    tags,
    totalMarkedMessages,
    totalTags,

    // 标记操作
    markMessage,
    unmarkMessage,
    hasMarkType,
    getMessageMarks,
    getMarkedMessages,
    getMarkStatistics,

    // 标签管理
    addTag,
    removeTag,
    getMessageTags,
    createTag,
    updateTag,
    deleteTag,
    getTags,
    getTagStatistics,

    // 存储
    saveToLocalStorage,
    loadFromLocalStorage,
    saveTagsToLocalStorage,
    loadTagsFromLocalStorage,

    // 事件处理
    handleMarkingEvent,

    // 生命周期
    initialize,
    cleanup
  }
}
