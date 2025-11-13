/**
 * WebSocket 组合式函数
 * 用于在 Vue 3 组件中简化 WebSocket 操作
 *
 * 使用示例:
 * const { syncMessage, onMessageReceived } = useWebSocket()
 * onMessageReceived((message) => { ... })
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import socketService from '@/utils/socket'

export function useWebSocket() {
  // 连接状态
  const isConnected = computed(() => socketService.isConnected())
  const socketId = computed(() => socketService.getSocketId())
  const connectionStats = ref({})

  // 初始化 WebSocket
  const initWebSocket = (token, url) => {
    if (!isConnected.value) {
      socketService.connect(token, url)
    }
  }

  // 断开连接
  const disconnectWebSocket = () => {
    socketService.disconnect()
  }

  // ==================== 消息实时同步 ====================

  /**
   * 同步消息
   */
  const syncMessage = (roomId, message) => {
    socketService.syncMessage(roomId, message)
  }

  /**
   * 监听实时消息
   */
  const onMessageReceived = (callback) => {
    socketService.onMessageSync(callback)
  }

  /**
   * 发送消息已读回执
   */
  const markMessageAsRead = (messageId, roomId) => {
    socketService.sendReadReceipt(messageId, roomId)
  }

  /**
   * 监听消息已读状态
   */
  const onMessageReadStatusChanged = (callback) => {
    socketService.onMessageRead(callback)
  }

  // ==================== 用户状态 ====================

  /**
   * 更新自己的在线状态
   */
  const updateMyStatus = (status) => {
    socketService.updateUserStatus(status)
  }

  /**
   * 监听用户状态变化
   */
  const onOtherUserStatusChanged = (callback) => {
    socketService.onUserStatusChanged(callback)
  }

  /**
   * 监听用户在线状态更新
   */
  const onUserPresenceChanged = (callback) => {
    socketService.onUserPresenceUpdated(callback)
  }

  /**
   * 订阅特定用户的状态变化
   */
  const subscribeToUser = (userId) => {
    socketService.subscribeToUser(userId)
  }

  /**
   * 取消订阅用户
   */
  const unsubscribeFromUser = (userId) => {
    socketService.unsubscribeFromUser(userId)
  }

  // ==================== 频道管理 ====================

  /**
   * 监听频道创建
   */
  const onChannelCreated = (callback) => {
    socketService.onChannelCreated(callback)
  }

  /**
   * 监听频道更新
   */
  const onChannelUpdated = (callback) => {
    socketService.onChannelUpdated(callback)
  }

  /**
   * 监听频道删除
   */
  const onChannelDeleted = (callback) => {
    socketService.onChannelDeleted(callback)
  }

  /**
   * 订阅频道更新
   */
  const subscribeToChannel = (channelId) => {
    socketService.subscribeToChannel(channelId)
  }

  /**
   * 取消订阅频道
   */
  const unsubscribeFromChannel = (channelId) => {
    socketService.unsubscribeFromChannel(channelId)
  }

  // ==================== 表情反应 ====================

  /**
   * 监听反应添加
   */
  const onReactionAdded = (callback) => {
    socketService.onReactionAdded(callback)
  }

  /**
   * 监听反应移除
   */
  const onReactionRemoved = (callback) => {
    socketService.onReactionRemoved(callback)
  }

  /**
   * 添加表情反应
   */
  const addReaction = (messageId, roomId, emoji) => {
    socketService.addReaction(messageId, roomId, emoji)
  }

  /**
   * 移除表情反应
   */
  const removeReaction = (messageId, roomId, emoji) => {
    socketService.removeReaction(messageId, roomId, emoji)
  }

  // ==================== 线程回复 ====================

  /**
   * 监听线程回复
   */
  const onThreadReplyAdded = (callback) => {
    socketService.onThreadReply(callback)
  }

  /**
   * 订阅线程更新
   */
  const subscribeToThread = (messageId, roomId) => {
    socketService.subscribeToThread(messageId, roomId)
  }

  /**
   * 取消订阅线程
   */
  const unsubscribeFromThread = (messageId, roomId) => {
    socketService.unsubscribeFromThread(messageId, roomId)
  }

  // ==================== 输入状态 ====================

  /**
   * 发送输入状态
   */
  const sendTypingStatus = (roomId, isTyping, draft = null) => {
    socketService.sendTypingStatusEnhanced(roomId, isTyping, draft)
  }

  /**
   * 原有的发送输入状态方法（保持兼容性）
   */
  const broadcastTypingStatus = (roomId, isTyping) => {
    socketService.sendTypingStatus(roomId, isTyping)
  }

  /**
   * 监听草稿更新
   */
  const onDraftUpdated = (callback) => {
    socketService.onDraftUpdated(callback)
  }

  // ==================== 通知 ====================

  /**
   * 监听通知
   */
  const onNotification = (callback) => {
    socketService.onGeneralNotification(callback)
  }

  /**
   * 发送系统消息
   */
  const sendSystemMessage = (targetUserId, message) => {
    socketService.sendSystemMessage(targetUserId, message)
  }

  // ==================== 聊天室（保持兼容性） ====================

  const joinRoom = (roomId) => {
    socketService.joinRoom(roomId)
  }

  const leaveRoom = (roomId) => {
    socketService.leaveRoom(roomId)
  }

  const sendMessage = (roomId, content, replyTo = null) => {
    socketService.sendMessage(roomId, content, replyTo)
  }

  const onNewMessage = (callback) => {
    socketService.onNewMessage(callback)
  }

  const onUserJoined = (callback) => {
    socketService.onUserJoined(callback)
  }

  const onUserLeft = (callback) => {
    socketService.onUserLeft(callback)
  }

  const onUserTyping = (callback) => {
    socketService.onUserTyping(callback)
  }

  // ==================== 帖子相关（保持兼容性） ====================

  const notifyPostLiked = (postId, likeCount) => {
    socketService.notifyPostLiked(postId, likeCount)
  }

  const onPostLikeUpdated = (callback) => {
    socketService.onPostLikeUpdated(callback)
  }

  const notifyNewComment = (postId, comment) => {
    socketService.notifyNewComment(postId, comment)
  }

  const onCommentAdded = (callback) => {
    socketService.onCommentAdded(callback)
  }

  // ==================== 工具函数 ====================

  /**
   * 获取连接统计
   */
  const getStats = () => {
    connectionStats.value = socketService.getConnectionStats()
    return connectionStats.value
  }

  /**
   * 清除所有监听器
   */
  const clearListeners = () => {
    socketService.clearAllListeners()
  }

  // 在组件挂载时更新统计信息
  onMounted(() => {
    getStats()
  })

  // 在组件卸载时清除监听器
  onUnmounted(() => {
    clearListeners()
  })

  return {
    // 连接状态
    isConnected,
    socketId,
    connectionStats,
    initWebSocket,
    disconnectWebSocket,
    getStats,
    clearListeners,

    // 消息相关
    syncMessage,
    onMessageReceived,
    markMessageAsRead,
    onMessageReadStatusChanged,

    // 用户状态
    updateMyStatus,
    onOtherUserStatusChanged,
    onUserPresenceChanged,
    subscribeToUser,
    unsubscribeFromUser,

    // 频道相关
    onChannelCreated,
    onChannelUpdated,
    onChannelDeleted,
    subscribeToChannel,
    unsubscribeFromChannel,

    // 表情反应
    onReactionAdded,
    onReactionRemoved,
    addReaction,
    removeReaction,

    // 线程相关
    onThreadReplyAdded,
    subscribeToThread,
    unsubscribeFromThread,

    // 输入状态
    sendTypingStatus,
    broadcastTypingStatus,
    onDraftUpdated,

    // 通知
    onNotification,
    sendSystemMessage,

    // 聊天室（兼容性）
    joinRoom,
    leaveRoom,
    sendMessage,
    onNewMessage,
    onUserJoined,
    onUserLeft,
    onUserTyping,

    // 帖子（兼容性）
    notifyPostLiked,
    onPostLikeUpdated,
    notifyNewComment,
    onCommentAdded
  }
}
