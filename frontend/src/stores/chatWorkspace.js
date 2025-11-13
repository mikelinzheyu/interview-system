import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import {
  getChatRooms,
  getChatRoomDetail,
  getChatMessages,
  getChatMembers,
  sendChatMessage
} from '@/api/chat'

const MAX_MESSAGES = 400
const DEFAULT_PAGE_SIZE = 40
const DEFAULT_ATTACHMENT_STATUS = 'uploading'
const DEFAULT_ATTACHMENT_PROGRESS = 0
const DEFAULT_ATTACHMENT_TYPE = 'general'
const DEFAULT_SENDER_NAME = 'Unknown'
const TYPING_THROTTLE_MS = 1200
const TYPING_EXPIRE_MS = 5000
const TYPING_CLEANUP_INTERVAL = 1000

function toNumber(value, fallback = 0) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

function ensureArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

function normalizeConversation(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    avatar: raw.avatar || '',
    type: raw.type || 'group',
    unreadCount: raw.unreadCount ?? 0,
    isMuted: Boolean(raw.isMuted),
    pinned: Boolean(raw.pinned),
    memberCount: raw.memberCount ?? 0,
    onlineCount: raw.onlineCount ?? 0,
    lastMessage: raw.lastMessage || null,
    lastMessageAt: raw.lastMessageAt || raw.updatedAt || raw.updated_at,
    updatedAt: raw.updatedAt || raw.updated_at,
    tags: Array.isArray(raw.tags) ? raw.tags : []
  }
}

function normalizeAttachment(raw) {
  if (!raw) return null
  const isFile = typeof File !== 'undefined' && raw instanceof File
  const id =
    raw.id ||
    raw.uid ||
    `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const size = toNumber(
    raw.size,
    isFile ? raw.size : 0
  )

  return {
    id,
    name: raw.name || raw.fileName || (isFile ? raw.name : '未命名附件'),
    size,
    type: raw.type || raw.mimeType || DEFAULT_ATTACHMENT_TYPE,
    url: raw.url || raw.downloadUrl || '',
    previewUrl: raw.previewUrl || raw.thumbUrl || '',
    status: raw.status || (isFile ? DEFAULT_ATTACHMENT_STATUS : 'uploaded'),
    progress:
      raw.progress ??
      (raw.status && raw.status !== 'uploaded'
        ? DEFAULT_ATTACHMENT_PROGRESS
        : 100),
    rawFile: raw.rawFile || (isFile ? raw : null),
    local: Boolean(raw.local ?? isFile)
  }
}

function resolveMessageStatus(raw) {
  const status = String(
    raw?.status || raw?.deliveryStatus || raw?.state || ''
  ).toLowerCase()

  if (status === 'recalled' || status === 'retracted' || raw.recalledAt || raw.recallAt) {
    return 'recalled'
  }

  if (status === 'failed' || status === 'error') {
    return 'failed'
  }

  if (status === 'uploading' || raw.uploading) {
    return 'uploading'
  }

  if (status === 'pending' || status === 'sending' || status === 'queued') {
    return 'pending'
  }

  if (status === 'read' || status === 'seen') {
    return 'read'
  }

  return status || 'delivered'
}

function normalizeMessage(raw, currentUserId) {
  if (!raw) return null
  const status = resolveMessageStatus(raw)
  const attachments = ensureArray(
    raw.attachments || raw.files || raw.fileList || raw.file
  )
    .map((item) => normalizeAttachment(item))
    .filter(Boolean)

  return {
    id: raw.id || raw.tempId || `temp-${Date.now()}`,
    conversationId: raw.conversationId || raw.roomId,
    content: raw.content ?? '',
    contentType:
      raw.contentType ||
      raw.messageType ||
      (attachments.length ? 'attachment' : 'text'),
    senderId: raw.senderId,
    senderName:
      raw.senderName || raw.sender?.name || DEFAULT_SENDER_NAME,
    senderAvatar: raw.senderAvatar || raw.sender?.avatar || '',
    createdAt:
      raw.createdAt || raw.createTime || new Date().toISOString(),
    status,
    isOwn: currentUserId ? raw.senderId === currentUserId : false,
    attachments,
    hasAttachments: attachments.length > 0,
    isRecalled: status === 'recalled',
    recallById: raw.recallById || raw.recalledById,
    recallByName:
      raw.recallByName || raw.recalledByName || raw.recalledBy?.name,
    recalledAt: raw.recalledAt || raw.recallAt || null,
    canRecall: Boolean(raw.canRecall),
    localOnly: Boolean(raw.localOnly || raw._localOnly),
    error: raw.error || null,
    metadata: raw.metadata || {}
  }
}

function normalizeMember(raw) {
  return {
    userId: raw.userId,
    username: raw.username,
    avatar: raw.avatar || '',
    role: raw.role || 'member',
    status: raw.status || 'offline',
    title: raw.title || '',
    joinedAt: raw.joinedAt || raw.joined_at,
    lastSeen: raw.lastSeen || raw.last_seen || raw.lastSeenAt || raw.last_seen_at || null
  }
}

function mergeMessages(existing = [], incoming = []) {
  if (!incoming.length && !existing.length) return []
  const map = new Map()
  existing.forEach((item) => {
    if (item) {
      map.set(item.id, item)
    }
  })
  incoming.forEach((item) => {
    if (!item) return
    const prev = map.get(item.id)
    map.set(item.id, prev ? { ...prev, ...item } : item)
  })
  const merged = Array.from(map.values())
  merged.sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime() || 0
    const bTime = new Date(b.createdAt || 0).getTime() || 0
    return aTime - bTime
  })
  return merged.slice(-MAX_MESSAGES)
}

export const useChatWorkspaceStore = defineStore('chat-workspace', () => {
  const conversations = ref([])
  const conversationsLoading = ref(false)
  const conversationsLoaded = ref(false)
  const activeConversationId = ref(null)

  const messagesMap = reactive({})
  const hasMoreMap = reactive({})
  const messageLoadingMap = reactive({})
  const messagePrependLoadingMap = reactive({})
  const paginationMap = reactive({}) // { [id]: { page, size, hasMore } }

  const participantsMap = reactive({})
  const participantsLoadingMap = reactive({})

  const reactionsMap = reactive({}) // { [conversationId]: { [messageId]: [{ emoji, count, users: [userId], isReacted }] } }

  const readReceiptsMap = reactive({}) // { [conversationId]: { [messageId]: [{ userId, readAt, userName, userAvatar }] } }

  const typingMap = reactive({})
  const typingStateMap = reactive({})
  const typingCleanupTimers = new Map()
  const typingEmitState = new Map()

  function applyMessageMeta(message) {
    if (!message) return null
    const attachments = Array.isArray(message.attachments)
      ? message.attachments.filter(Boolean)
      : []

    return {
      ...message,
      attachments,
      hasAttachments: attachments.length > 0,
      isOwn:
        currentUserId.value != null
          ? message.senderId === currentUserId.value
          : Boolean(message.isOwn),
      isRecalled: message.status === 'recalled',
      metadata: message.metadata || {}
    }
  }

  function ensureTypingState(conversationId) {
    if (!conversationId) return null
    if (!typingStateMap[conversationId]) {
      typingStateMap[conversationId] = {
        users: {},
        updatedAt: Date.now()
      }
    }
    return typingStateMap[conversationId]
  }

  function scheduleTypingCleanup(conversationId) {
    if (!conversationId) return
    if (typingCleanupTimers.has(conversationId)) return
    const timer = setInterval(() => {
      cleanupTypingState(conversationId)
    }, TYPING_CLEANUP_INTERVAL)
    typingCleanupTimers.set(conversationId, timer)
  }

  function cleanupTypingState(conversationId) {
    const state = typingStateMap[conversationId]
    if (!state) {
      clearTypingTimer(conversationId)
      typingMap[conversationId] = []
      return
    }

    const now = Date.now()
    let changed = false
    Object.entries(state.users).forEach(([username, expiry]) => {
      if (!username) return
      if (!expiry || expiry <= now) {
        delete state.users[username]
        changed = true
      }
    })

    if (changed) {
      refreshTypingUsers(conversationId, state)
    }

    if (!Object.keys(state.users).length) {
      clearTypingTimer(conversationId)
    }
  }

  function clearTypingTimer(conversationId) {
    const timer = typingCleanupTimers.get(conversationId)
    if (timer) {
      clearInterval(timer)
      typingCleanupTimers.delete(conversationId)
    }
  }

  function refreshTypingUsers(conversationId, state = ensureTypingState(conversationId)) {
    if (!state) return
    const now = Date.now()
    const users = Object.entries(state.users)
      .filter(([, expiry]) => expiry && expiry > now)
      .map(([username]) => username)
    typingMap[conversationId] = users
    if (users.length) {
      scheduleTypingCleanup(conversationId)
    } else {
      clearTypingTimer(conversationId)
    }
  }

  function resetTypingState(conversationId) {
    if (!conversationId) return
    delete typingStateMap[conversationId]
    typingMap[conversationId] = []
    clearTypingTimer(conversationId)
    typingEmitState.delete(conversationId)
  }

  function shouldEmitTyping(conversationId, isTyping) {
    if (!conversationId) return false
    const now = Date.now()
    const record = typingEmitState.get(conversationId) || {
      last: 0,
      state: false
    }

    const stateChanged = record.state !== isTyping
    const throttled = now - record.last >= TYPING_THROTTLE_MS
    if (!stateChanged && !throttled) {
      return false
    }

    typingEmitState.set(conversationId, {
      last: now,
      state: isTyping
    })
    return true
  }

  const currentUserId = ref(1)

  const activeConversation = computed(() =>
    conversations.value.find(
      (item) => item.id === activeConversationId.value
    ) || null
  )

  const activeMessages = computed(() => {
    const id = activeConversationId.value
    if (!id) return []
    return messagesMap[id] || []
  })

  const activeParticipants = computed(() => {
    const id = activeConversationId.value
    if (!id) return []
    return participantsMap[id] || []
  })

  const activeTypingUsers = computed(
    () => typingMap[activeConversationId.value] || []
  )

  const activeHasMore = computed(
    () => hasMoreMap[activeConversationId.value] ?? false
  )

  function ensurePagination(conversationId) {
    if (!paginationMap[conversationId]) {
      paginationMap[conversationId] = {
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        hasMore: true
      }
    }
    return paginationMap[conversationId]
  }

  async function fetchConversations() {
    if (conversationsLoading.value) return
    conversationsLoading.value = true
    try {
      const { data } = await getChatRooms()
      const items = Array.isArray(data?.items) ? data.items : data
      conversations.value = (items || [])
        .map(normalizeConversation)
        .filter(Boolean)
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1
          return (
            new Date(b.lastMessageAt || b.updatedAt || 0) -
            new Date(a.lastMessageAt || a.updatedAt || 0)
          )
        })
      conversationsLoaded.value = true
    } catch (error) {
      console.error('[chat] Failed to fetch conversations', error)
      ElMessage.error('获取会话列表失败')
    } finally {
      conversationsLoading.value = false
    }
  }

  async function ensureConversation(conversationId) {
    if (!conversationId) return

    if (!messagesMap[conversationId]) {
      await fetchMessages(conversationId)
    }

    if (!participantsMap[conversationId]) {
      await fetchParticipants(conversationId)
    }
  }

  async function fetchConversationDetail(conversationId) {
    try {
      const { data } = await getChatRoomDetail(conversationId)
      const normalized = normalizeConversation(data)
      if (!normalized) return
      const idx = conversations.value.findIndex(
        (item) => item.id === normalized.id
      )
      if (idx >= 0) {
        conversations.value[idx] = {
          ...conversations.value[idx],
          ...normalized
        }
      } else {
        conversations.value.push(normalized)
      }
    } catch (error) {
      console.warn('[chat] Failed to fetch conversation detail', error)
    }
  }

  async function fetchMessages(conversationId, { direction = 'initial' } = {}) {
    if (!conversationId) return
    const pagination = ensurePagination(conversationId)

    if (direction === 'prepend') {
      if (messagePrependLoadingMap[conversationId] || pagination.hasMore === false) return
      messagePrependLoadingMap[conversationId] = true
    } else {
      if (messageLoadingMap[conversationId]) return
      messageLoadingMap[conversationId] = true
      pagination.page = 0
      pagination.hasMore = true
    }

    try {
      const targetPage = direction === 'prepend' ? pagination.page + 1 : 1
      const params = { page: targetPage, size: pagination.size }
      const { data } = await getChatMessages(conversationId, params)
      const list = Array.isArray(data?.items) ? data.items : data || []
      const normalized = list
        .map((item) => normalizeMessage(item, currentUserId.value))
        .filter(Boolean)

      const existing = messagesMap[conversationId] || []
      const merged = mergeMessages(existing, normalized)
      messagesMap[conversationId] = merged.map(applyMessageMeta)

      pagination.page = targetPage
      pagination.hasMore = Boolean(
        data?.hasMore ?? (Array.isArray(list) && list.length >= pagination.size)
      )
      hasMoreMap[conversationId] = pagination.hasMore
    } catch (error) {
      console.error('[chat] Failed to fetch messages', error)
      ElMessage.error('获取消息记录失败')
    } finally {
      if (direction === 'prepend') {
        messagePrependLoadingMap[conversationId] = false
      } else {
        messageLoadingMap[conversationId] = false
      }
    }
  }

  async function fetchParticipants(conversationId) {
    if (!conversationId) return
    if (participantsLoadingMap[conversationId]) return

    participantsLoadingMap[conversationId] = true
    try {
      const { data } = await getChatMembers(conversationId)
      const list = Array.isArray(data?.items) ? data.items : data
      participantsMap[conversationId] = (list || []).map(normalizeMember)
    } catch (error) {
      console.error('[chat] Failed to fetch participants', error)
      ElMessage.error('获取成员列表失败')
    } finally {
      participantsLoadingMap[conversationId] = false
    }
  }

  function setActiveConversation(conversationId) {
    if (conversationId === activeConversationId.value) return
    activeConversationId.value = conversationId
    if (conversationId) {
      ensureConversation(conversationId)
    }
  }

  function setCurrentUser(userId) {
    currentUserId.value = userId
  }

  function upsertMessage(conversationId, message) {
    if (!conversationId || !message) return null
    const normalized = normalizeMessage(message, currentUserId.value)
    if (!normalized) return null
    const finalMessage = applyMessageMeta(normalized)
    const existing = messagesMap[conversationId] || []
    const merged = mergeMessages(existing, [finalMessage])
    messagesMap[conversationId] = merged.map(applyMessageMeta)
    return finalMessage
  }

  function appendLocalMessage(conversationId, message) {
    if (!conversationId || !message) return null
    const normalized = normalizeMessage(
      { ...message, localOnly: true },
      currentUserId.value
    )
    if (!normalized) return null
    const finalMessage = applyMessageMeta(normalized)
    const existing = messagesMap[conversationId] || []
    const merged = mergeMessages(existing, [finalMessage])
    messagesMap[conversationId] = merged.map(applyMessageMeta)
    return finalMessage
  }

  function updateMessage(conversationId, messageId, patch) {
    if (!conversationId || !messageId || !patch) return null
    const list = messagesMap[conversationId]
    if (!Array.isArray(list)) return null
    const index = list.findIndex((item) => item.id === messageId)
    if (index < 0) return null

    const current = list[index]
    const updates =
      typeof patch === 'function' ? patch(current) || {} : patch

    if (!updates || typeof updates !== 'object') return current

    const merged = applyMessageMeta({ ...current, ...updates })
    const nextList = [...list]
    nextList[index] = merged
    messagesMap[conversationId] = nextList
    return merged
  }

  function removeMessage(conversationId, messageId) {
    if (!conversationId || !messageId) return
    const list = messagesMap[conversationId]
    if (!Array.isArray(list) || !list.length) return
    const next = list.filter((item) => item.id !== messageId)
    messagesMap[conversationId] = next
  }

  async function resendMessage(conversationId, message) {
    if (!conversationId || !message) return null
    const messageId = message.id || message.tempId
    if (!messageId) return null

    const attachmentsPayload = Array.isArray(message.attachments)
      ? message.attachments
          .map((attachment) => {
            if (!attachment) return null
            const mediaId = attachment.id || attachment.mediaId || attachment.storageName
            if (!mediaId) return null
            return {
              mediaId,
              storageName: attachment.storageName,
              fileName: attachment.fileName || attachment.name,
              contentType: attachment.contentType || attachment.mimeType
            }
          })
          .filter(Boolean)
      : []

    if (!message.content && !attachmentsPayload.length) {
      throw new Error('UNSUPPORTED_RESEND')
    }

    updateMessage(conversationId, messageId, {
      status: 'pending',
      error: null,
      metadata: {
        ...(message.metadata || {}),
        resendCount: (message.metadata?.resendCount || 0) + 1
      }
    })

    const resolvedContentType =
      message.contentType ||
      (attachmentsPayload.length && !(message.content || '').trim() ? 'attachment' : 'text')

    const payload = {
      content: message.content || '',
      contentType: resolvedContentType,
      attachments: attachmentsPayload
    }

    try {
      const { data } = await sendChatMessage(conversationId, payload)
      const normalized = normalizeMessage(data, currentUserId.value)
      removeMessage(conversationId, messageId)
      return upsertMessage(conversationId, normalized)
    } catch (error) {
      console.error('[chat] resend failed', error)
      updateMessage(conversationId, messageId, {
        status: 'failed',
        error
      })
      throw error
    }
  }

  async function recallMessage(conversationId, message) {
    if (!conversationId || !message) return null
    const messageId = message.id || message.tempId
    if (!messageId) return null

    const recallAt = new Date().toISOString()
    const result = updateMessage(conversationId, messageId, (current) => ({
      status: 'recalled',
      isRecalled: true,
      recallById: currentUserId.value,
      recallByName: current?.senderName || '我',
      recalledAt: recallAt,
      metadata: {
        ...(current?.metadata || {}),
        recalledAt: recallAt
      }
    }))
    return result
  }

  function markConversationRead(conversationId, options = {}) {
    if (!conversationId) return
    const list = messagesMap[conversationId]
    if (!Array.isArray(list) || !list.length) return
    const readAt = options.readAt || new Date().toISOString()
    let changed = false
    const updated = list.map((message) => {
      if (!message || message.isOwn) return message
      if (message.status === 'read') return message
      changed = true
      return applyMessageMeta({
        ...message,
        status: 'read',
        readAt,
        metadata: { ...message.metadata, readAt }
      })
    })

    if (changed) {
      messagesMap[conversationId] = updated
    }

    updateConversationMeta(conversationId, {
      unreadCount: 0,
      unread_count: 0,
      lastReadAt: readAt
    })
  }

  function applyReadReceipt(conversationId, receipt = {}) {
    if (!conversationId || !receipt) return
    const list = messagesMap[conversationId]
    if (!Array.isArray(list) || !list.length) return
    const messageIds = ensureArray(receipt.messageIds)
    if (!messageIds.length) return

    const readAt = receipt.readAt || new Date().toISOString()
    const idSet = new Set(messageIds)
    let changed = false

    const updated = list.map((message) => {
      if (!message || !message.isOwn) return message
      if (!idSet.has(message.id)) return message
      if (message.status === 'read') return message
      changed = true
      return applyMessageMeta({
        ...message,
        status: 'read',
        readAt,
        metadata: {
          ...message.metadata,
          readAt,
          lastReaderId: receipt.readerId ?? message.metadata?.lastReaderId
        }
      })
    })

    if (changed) {
      messagesMap[conversationId] = updated
    }
  }

  function updateConversationMeta(conversationId, patch = {}) {
    if (!conversationId || !patch) return
    const index = conversations.value.findIndex((item) => item.id === conversationId)
    if (index < 0) return

    const current = conversations.value[index]
    const next = {
      ...current,
      ...patch
    }

    if (patch.unreadCount != null) {
      next.unreadCount = patch.unreadCount
      next.unread_count = patch.unreadCount
    }

    conversations.value.splice(index, 1, next)
  }

  function setParticipantStatus(conversationId, userId, status, extra = {}) {
    if (!conversationId || !userId) return
    const list = participantsMap[conversationId]
    if (!Array.isArray(list)) return
    const index = list.findIndex((item) => item.userId === userId)
    if (index < 0) return

    const next = {
      ...list[index],
      status: status || list[index].status,
      lastSeen: extra.lastSeen || extra.lastSeenAt || new Date().toISOString(),
      ...extra
    }

    const updated = [...list]
    updated.splice(index, 1, next)
    participantsMap[conversationId] = updated
  }

  function upsertParticipant(conversationId, participant) {
    if (!conversationId || !participant) return
    const normalized = normalizeMember(participant)
    const list = Array.isArray(participantsMap[conversationId])
      ? [...participantsMap[conversationId]]
      : []
    const index = list.findIndex((item) => item.userId === normalized.userId)
    if (index >= 0) {
      list.splice(index, 1, { ...list[index], ...normalized })
    } else {
      list.unshift(normalized)
    }
    participantsMap[conversationId] = list
  }

  function createAttachmentPlaceholder(conversationId, files, options = {}) {
    if (!conversationId) return null
    const fileList = ensureArray(files).filter(Boolean)
    if (!fileList.length) return null

    const placeholderId = `upload-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`
    const attachments = fileList.map((file, index) =>
      normalizeAttachment({
        id: `${placeholderId}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: DEFAULT_ATTACHMENT_STATUS,
        progress: DEFAULT_ATTACHMENT_PROGRESS,
        rawFile: file,
        local: true
      })
    )

    const placeholder = {
      id: placeholderId,
      conversationId,
      senderId: currentUserId.value,
      senderName: DEFAULT_SENDER_NAME,
      senderAvatar: '',
      content:
        options.note ||
        (attachments.length > 1
          ? `发送了 ${attachments.length} 个附件`
          : attachments[0]?.name || '发送了一个附件'),
      contentType: 'attachment',
      attachments,
      createdAt: new Date().toISOString(),
      status: 'uploading',
      localOnly: true,
      metadata: { attachmentsCount: attachments.length }
    }

    const appended = appendLocalMessage(conversationId, placeholder)
    return appended || applyMessageMeta(placeholder)
  }

  async function sendMessage(conversationId, content) {
    if (!conversationId || !content?.trim()) return null
    const trimmed = content.trim()
    const tempId = `temp-${Date.now()}`

    const optimisticMessage = {
      id: tempId,
      conversationId,
      senderId: currentUserId.value,
      senderName: DEFAULT_SENDER_NAME,
      senderAvatar: '',
      content: trimmed,
      contentType: 'text',
      createdAt: new Date().toISOString(),
      status: 'pending',
      localOnly: true
    }
    appendLocalMessage(conversationId, optimisticMessage)

    try {
      const { data } = await sendChatMessage(conversationId, {
        content: trimmed
      })
      const persisted = {
        ...data,
        id: data?.id || tempId,
        status: 'delivered'
      }
      upsertMessage(conversationId, persisted)
      fetchConversationDetail(conversationId)
      return persisted
    } catch (error) {
      console.error('[chat] send message failed', error)
      updateMessage(conversationId, tempId, { status: 'failed' })
      ElMessage.error('发送消息失败，请稍后再试')
      throw error
    }
  }

  async function loadOlderMessages(conversationId) {
    await fetchMessages(conversationId, { direction: 'prepend' })
  }

  function updateTyping(conversationId, usernames = []) {
    if (!conversationId) return
    const state = ensureTypingState(conversationId)
    state.users = {}
    const now = Date.now()
    ensureArray(usernames).forEach((username) => {
      if (!username) return
      state.users[username] = now + TYPING_EXPIRE_MS
    })
    refreshTypingUsers(conversationId, state)
  }

  function handleRemoteTyping(conversationId, username, isTyping = true) {
    if (!conversationId || !username) return
    const state = ensureTypingState(conversationId)
    if (isTyping) {
      state.users[username] = Date.now() + TYPING_EXPIRE_MS
      refreshTypingUsers(conversationId, state)
    } else if (state.users[username]) {
      delete state.users[username]
      refreshTypingUsers(conversationId, state)
    }
  }

  function notifyTyping(conversationId, isTyping) {
    if (!conversationId) return false
    return shouldEmitTyping(conversationId, Boolean(isTyping))
  }

  function clearTyping(conversationId) {
    resetTypingState(conversationId)
  }

  // ============ 反应功能 (Reactions) ============

  /**
   * 获取消息的反应列表
   */
  function getMessageReactions(conversationId, messageId) {
    if (!conversationId || !messageId) return []
    const convReactions = reactionsMap[conversationId]
    if (!convReactions) return []
    return convReactions[messageId] || []
  }

  /**
   * 添加或切换反应
   */
  function addReaction(conversationId, messageId, emoji, userId = currentUserId.value) {
    if (!conversationId || !messageId || !emoji) return null

    // 确保结构存在
    if (!reactionsMap[conversationId]) {
      reactionsMap[conversationId] = {}
    }
    if (!reactionsMap[conversationId][messageId]) {
      reactionsMap[conversationId][messageId] = []
    }

    const messageReactions = reactionsMap[conversationId][messageId]
    let reactionItem = messageReactions.find(r => r.emoji === emoji)

    if (!reactionItem) {
      // 创建新的反应
      reactionItem = {
        emoji,
        count: 1,
        users: [userId],
        isReacted: userId === currentUserId.value
      }
      messageReactions.push(reactionItem)
    } else {
      // 如果用户已经反应过，则移除；否则添加
      const userIndex = reactionItem.users.indexOf(userId)
      if (userIndex >= 0) {
        reactionItem.users.splice(userIndex, 1)
        reactionItem.count = Math.max(0, reactionItem.count - 1)
        reactionItem.isReacted = false
      } else {
        reactionItem.users.push(userId)
        reactionItem.count += 1
        reactionItem.isReacted = userId === currentUserId.value
      }

      // 如果没有用户反应了，删除这个反应
      if (reactionItem.count === 0) {
        const index = messageReactions.findIndex(r => r.emoji === emoji)
        if (index >= 0) {
          messageReactions.splice(index, 1)
        }
      }
    }

    // 触发更新
    reactionsMap[conversationId][messageId] = [...messageReactions]
    return reactionItem
  }

  /**
   * 移除反应
   */
  function removeReaction(conversationId, messageId, emoji, userId = currentUserId.value) {
    if (!conversationId || !messageId || !emoji) return

    const messageReactions = getMessageReactions(conversationId, messageId)
    if (!messageReactions.length) return

    const reactionItem = messageReactions.find(r => r.emoji === emoji)
    if (!reactionItem) return

    const userIndex = reactionItem.users.indexOf(userId)
    if (userIndex >= 0) {
      reactionItem.users.splice(userIndex, 1)
      reactionItem.count = Math.max(0, reactionItem.count - 1)

      // 如果没有用户反应了，删除这个反应
      if (reactionItem.count === 0) {
        const index = messageReactions.findIndex(r => r.emoji === emoji)
        if (index >= 0) {
          messageReactions.splice(index, 1)
        }
      }
    }

    // 触发更新
    if (reactionsMap[conversationId] && reactionsMap[conversationId][messageId]) {
      reactionsMap[conversationId][messageId] = [...reactionsMap[conversationId][messageId]]
    }
  }

  /**
   * 从服务器同步反应数据
   */
  function syncReactions(conversationId, messageId, reactions = []) {
    if (!conversationId || !messageId) return

    if (!reactionsMap[conversationId]) {
      reactionsMap[conversationId] = {}
    }

    const normalized = reactions.map(r => ({
      emoji: r.emoji,
      count: r.count || r.users?.length || 0,
      users: Array.isArray(r.users) ? r.users : (r.userIds || []),
      isReacted: r.isReacted || (Array.isArray(r.users) ? r.users.includes(currentUserId.value) : false)
    }))

    reactionsMap[conversationId][messageId] = normalized
  }

  /**
   * 清除某个消息的所有反应
   */
  function clearMessageReactions(conversationId, messageId) {
    if (!conversationId || !messageId) return
    if (reactionsMap[conversationId]) {
      delete reactionsMap[conversationId][messageId]
    }
  }

  /**
   * 清除某个会话的所有反应
   */
  function clearConversationReactions(conversationId) {
    if (!conversationId) return
    delete reactionsMap[conversationId]
  }

  // ============ 已读回执功能 (Read Receipts) ============

  /**
   * 获取消息的已读用户列表
   */
  function getMessageReadReceipts(conversationId, messageId) {
    if (!conversationId || !messageId) return []
    const convReceipts = readReceiptsMap[conversationId]
    if (!convReceipts) return []
    return convReceipts[messageId] || []
  }

  /**
   * 添加已读回执
   */
  function addReadReceipt(conversationId, messageId, userId, userName, userAvatar) {
    if (!conversationId || !messageId || !userId) return

    // 确保结构存在
    if (!readReceiptsMap[conversationId]) {
      readReceiptsMap[conversationId] = {}
    }
    if (!readReceiptsMap[conversationId][messageId]) {
      readReceiptsMap[conversationId][messageId] = []
    }

    const receipts = readReceiptsMap[conversationId][messageId]
    const existingIndex = receipts.findIndex(r => r.userId === userId)

    if (existingIndex < 0) {
      // 添加新的已读记录
      receipts.push({
        userId,
        userName: userName || 'Unknown',
        userAvatar: userAvatar || '',
        readAt: new Date().toISOString()
      })
    } else {
      // 更新已读时间
      receipts[existingIndex].readAt = new Date().toISOString()
    }

    // 触发更新
    readReceiptsMap[conversationId][messageId] = [...receipts]
  }

  /**
   * 批量添加已读回执
   */
  function batchAddReadReceipts(conversationId, receipts = []) {
    if (!conversationId) return

    receipts.forEach(receipt => {
      addReadReceipt(
        conversationId,
        receipt.messageId,
        receipt.userId,
        receipt.userName,
        receipt.userAvatar
      )
    })
  }

  /**
   * 同步已读回执数据（从服务器）
   */
  function syncReadReceipts(conversationId, messageId, userReceipts = []) {
    if (!conversationId || !messageId) return

    if (!readReceiptsMap[conversationId]) {
      readReceiptsMap[conversationId] = {}
    }

    const normalized = userReceipts.map(r => ({
      userId: r.userId,
      userName: r.userName || 'Unknown',
      userAvatar: r.userAvatar || '',
      readAt: r.readAt
    }))

    readReceiptsMap[conversationId][messageId] = normalized
  }

  /**
   * 获取消息已读人数
   */
  function getMessageReadCount(conversationId, messageId) {
    const receipts = getMessageReadReceipts(conversationId, messageId)
    return receipts.length
  }

  /**
   * 判断是否所有人都已读
   */
  function isMessageReadByAll(conversationId, messageId, totalParticipants) {
    const readCount = getMessageReadCount(conversationId, messageId)
    return readCount >= (totalParticipants - 1) // 排除发送者本身
  }

  /**
   * 清除某个消息的已读回执
   */
  function clearMessageReadReceipts(conversationId, messageId) {
    if (!conversationId || !messageId) return
    if (readReceiptsMap[conversationId]) {
      delete readReceiptsMap[conversationId][messageId]
    }
  }

  /**
   * 清除某个会话的所有已读回执
   */
  function clearConversationReadReceipts(conversationId) {
    if (!conversationId) return
    delete readReceiptsMap[conversationId]
  }

  return {
    conversations,
    conversationsLoading,
    conversationsLoaded,
    activeConversationId,
    activeConversation,
    activeMessages,
    activeParticipants,
    activeTypingUsers,
    hasMoreMap,
    activeHasMore,
    messageLoadingMap,
    messagePrependLoadingMap,
    participantsLoadingMap,
    currentUserId,
    fetchConversations,
    fetchConversationDetail,
    fetchMessages,
    fetchParticipants,
    setActiveConversation,
    setCurrentUser,
    sendMessage,
    appendLocalMessage,
    upsertMessage,
    updateMessage,
    removeMessage,
    loadOlderMessages,
    ensureConversation,
    updateTyping,
    handleRemoteTyping,
    notifyTyping,
    clearTyping,
    createAttachmentPlaceholder,
    resendMessage,
    recallMessage,
    markConversationRead,
    applyReadReceipt,
    updateConversationMeta,
    setParticipantStatus,
    upsertParticipant,
    // 反应相关方法
    getMessageReactions,
    addReaction,
    removeReaction,
    syncReactions,
    clearMessageReactions,
    clearConversationReactions,
    // 已读回执相关方法
    getMessageReadReceipts,
    addReadReceipt,
    batchAddReadReceipts,
    syncReadReceipts,
    getMessageReadCount,
    isMessageReadByAll,
    clearMessageReadReceipts,
    clearConversationReadReceipts
  }
})
