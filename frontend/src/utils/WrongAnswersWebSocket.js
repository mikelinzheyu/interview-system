/**
 * WebSocket service for real-time wrong answers synchronization
 * Handles bidirectional communication with backend for live updates
 */

import { ref, reactive } from 'vue'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { ElMessage } from 'element-plus'

class WrongAnswersWebSocket {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.messageQueue = []
    this.isConnected = ref(false)
    this.isSyncing = ref(false)
    this.lastSyncTime = ref(null)
    this.pendingUpdates = reactive({})
  }

  /**
   * Initialize WebSocket connection
   */
  connect(userId, token) {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/wrong-answers?userId=${userId}&token=${token}`

      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('[WrongAnswers WS] Connected')
        this.isConnected.value = true
        this.reconnectAttempts = 0
        this.flushMessageQueue()
        this.sendHeartbeat()
      }

      this.socket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

      this.socket.onerror = (error) => {
        console.error('[WrongAnswers WS] Error:', error)
        ElMessage.error('实时同步连接错误')
      }

      this.socket.onclose = () => {
        console.log('[WrongAnswers WS] Disconnected')
        this.isConnected.value = false
        this.attemptReconnect(userId, token)
      }
    } catch (error) {
      console.error('[WrongAnswers WS] Connection failed:', error)
      ElMessage.error('无法建立实时连接')
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect(userId, token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(`[WrongAnswers WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      setTimeout(() => this.connect(userId, token), delay)
    } else {
      console.error('[WrongAnswers WS] Max reconnection attempts reached')
      ElMessage.error('实时连接已断开，请刷新页面')
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    const { type, data, timestamp } = message
    this.lastSyncTime.value = timestamp

    switch (type) {
      case 'RECORD_WRONG_ANSWER':
        this.handleRecordWrongAnswer(data)
        break
      case 'UPDATE_STATUS':
        this.handleUpdateStatus(data)
        break
      case 'UPDATE_NOTES':
        this.handleUpdateNotes(data)
        break
      case 'UPDATE_TAGS':
        this.handleUpdateTags(data)
        break
      case 'DELETE_RECORD':
        this.handleDeleteRecord(data)
        break
      case 'SYNC_REQUEST':
        this.handleSyncRequest(data)
        break
      case 'CONFLICT_DETECTED':
        this.handleConflict(data)
        break
      case 'HEARTBEAT_ACK':
        // Keep-alive response
        break
      default:
        console.warn('[WrongAnswers WS] Unknown message type:', type)
    }
  }

  /**
   * Handle remote record wrong answer
   */
  handleRecordWrongAnswer(data) {
    const store = useWrongAnswersStore()
    const { record, source } = data

    // Check if this is from another device
    if (source !== 'local') {
      const index = store.wrongAnswers.findIndex(item => item.id === record.id)
      if (index >= 0) {
        // Update existing record with conflict resolution
        this.resolveConflict(store.wrongAnswers[index], record)
      } else {
        // Add new record
        store.wrongAnswers.unshift(record)
      }
      ElMessage.success('已同步新的错题记录')
    }
  }

  /**
   * Handle remote status update
   */
  handleUpdateStatus(data) {
    const store = useWrongAnswersStore()
    const { recordId, status, remoteVersion, timestamp } = data

    const record = store.wrongAnswers.find(item => item.id === recordId)
    if (record) {
      record.reviewStatus = status
      record.updatedAt = timestamp
      record._remoteVersion = remoteVersion
    }
  }

  /**
   * Handle remote notes update
   */
  handleUpdateNotes(data) {
    const store = useWrongAnswersStore()
    const { recordId, notes, timestamp } = data

    const record = store.wrongAnswers.find(item => item.id === recordId)
    if (record) {
      record.userNotes = notes
      record.updatedAt = timestamp
    }
  }

  /**
   * Handle remote tags update
   */
  handleUpdateTags(data) {
    const store = useWrongAnswersStore()
    const { recordId, tags, timestamp } = data

    const record = store.wrongAnswers.find(item => item.id === recordId)
    if (record) {
      record.userTags = tags
      record.updatedAt = timestamp
    }
  }

  /**
   * Handle remote delete
   */
  handleDeleteRecord(data) {
    const store = useWrongAnswersStore()
    const { recordId } = data

    store.wrongAnswers = store.wrongAnswers.filter(item => item.id !== recordId)
  }

  /**
   * Handle sync request from another device
   */
  handleSyncRequest(data) {
    const store = useWrongAnswersStore()
    const { deviceId, lastSyncTime } = data

    // Send current state to other device
    this.sendMessage({
      type: 'SYNC_RESPONSE',
      data: {
        deviceId,
        records: store.wrongAnswers,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Three-way merge conflict resolution
   */
  resolveConflict(localRecord, remoteRecord) {
    const store = useWrongAnswersStore()

    // Get base version from server
    // For now, use last-write-wins strategy with timestamp
    if (new Date(remoteRecord.updatedAt) > new Date(localRecord.updatedAt)) {
      // Remote is newer
      Object.assign(localRecord, remoteRecord)
      this.pendingUpdates[localRecord.id] = {
        status: 'resolved',
        strategy: 'remote_wins',
        timestamp: Date.now()
      }
    } else {
      // Local is newer or equal
      this.pendingUpdates[localRecord.id] = {
        status: 'resolved',
        strategy: 'local_wins',
        timestamp: Date.now()
      }
    }

    ElMessage.info('已自动解决数据冲突')
  }

  /**
   * Handle conflict detection
   */
  handleConflict(data) {
    const { recordId, localVersion, remoteVersion } = data
    console.warn('[WrongAnswers WS] Conflict detected for record:', recordId)

    this.pendingUpdates[recordId] = {
      status: 'conflict',
      localVersion,
      remoteVersion,
      timestamp: Date.now()
    }

    ElMessage.warning('检测到数据冲突，正在同步...')
  }

  /**
   * Send message through WebSocket
   */
  sendMessage(message) {
    const payload = {
      ...message,
      timestamp: Date.now(),
      clientId: this.getClientId()
    }

    if (this.isConnected.value && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload))
    } else {
      // Queue message for later delivery
      this.messageQueue.push(payload)
      console.warn('[WrongAnswers WS] Message queued (not connected):', payload)
    }
  }

  /**
   * Send record wrong answer event
   */
  sendRecordWrongAnswer(data) {
    this.sendMessage({
      type: 'RECORD_WRONG_ANSWER',
      data: {
        ...data,
        source: 'local'
      }
    })
  }

  /**
   * Send status update
   */
  sendStatusUpdate(recordId, status) {
    this.sendMessage({
      type: 'UPDATE_STATUS',
      data: {
        recordId,
        status,
        version: this.getRecordVersion(recordId)
      }
    })
  }

  /**
   * Send notes update
   */
  sendNotesUpdate(recordId, notes) {
    this.sendMessage({
      type: 'UPDATE_NOTES',
      data: {
        recordId,
        notes
      }
    })
  }

  /**
   * Send tags update
   */
  sendTagsUpdate(recordId, tags) {
    this.sendMessage({
      type: 'UPDATE_TAGS',
      data: {
        recordId,
        tags
      }
    })
  }

  /**
   * Send delete record
   */
  sendDeleteRecord(recordId) {
    this.sendMessage({
      type: 'DELETE_RECORD',
      data: { recordId }
    })
  }

  /**
   * Request sync from server
   */
  requestSync() {
    this.isSyncing.value = true
    this.sendMessage({
      type: 'SYNC_REQUEST',
      data: {
        deviceId: this.getClientId(),
        lastSyncTime: this.lastSyncTime.value
      }
    })

    setTimeout(() => {
      this.isSyncing.value = false
    }, 5000)
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message))
      }
    }
  }

  /**
   * Send heartbeat to keep connection alive
   */
  sendHeartbeat() {
    if (this.isConnected.value) {
      this.sendMessage({ type: 'HEARTBEAT', data: {} })
      setTimeout(() => this.sendHeartbeat(), 30000) // Every 30 seconds
    }
  }

  /**
   * Get unique client ID
   */
  getClientId() {
    let clientId = localStorage.getItem('clientId')
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('clientId', clientId)
    }
    return clientId
  }

  /**
   * Get record version
   */
  getRecordVersion(recordId) {
    const store = useWrongAnswersStore()
    const record = store.wrongAnswers.find(item => item.id === recordId)
    return record?._remoteVersion || 1
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected.value,
      isSyncing: this.isSyncing.value,
      lastSyncTime: this.lastSyncTime.value,
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.messageQueue.length
    }
  }
}

// Singleton instance
let wsInstance = null

export function useWrongAnswersWebSocket() {
  if (!wsInstance) {
    wsInstance = new WrongAnswersWebSocket()
  }
  return wsInstance
}

export default WrongAnswersWebSocket
