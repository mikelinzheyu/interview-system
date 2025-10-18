<template>
  <div class="chat-room">
    <div class="chat-room__gradient" />
    <div class="chat-room__container">
      <ChatLayout :show-panel="showRightPanel">
        <template #aside>
          <ConversationListEnhanced
            :conversations="store.conversations"
            :active-conversation-id="store.activeConversationId"
            :loading="store.conversationsLoading"
            :user-status-map="userStatusMap"
            :show-online-status="true"
            @select="handleConversationSelect"
            @create="handleCreateConversation"
            @pin="handlePin"
            @mute="handleMute"
            @mark-read="handleMarkRead"
            @delete="handleDeleteConversation"
            @search="handleSearch"
          />
        </template>

        <template #default>
          <MessagePanel
            :messages="store.activeMessages"
            :loading="messageLoading"
            :typing-users="store.activeTypingUsers"
            :has-more="messageHasMore"
            :prepend-loading="messagePrependLoading"
            :action-states="messageActionStates"
            @load-previous="handleLoadPrevious"
            @resend-message="handleResendMessage"
            @recall-message="handleRecallMessage"
            @toggle-day="handleToggleDay"
          >
            <template #header>
              <div v-if="store.activeConversation" class="chat-room__header">
                <div class="chat-room__header-info">
                  <el-avatar :size="48" :src="store.activeConversation.avatar">
                    {{ store.activeConversation.name?.slice(0, 1) || '?' }}
                  </el-avatar>
                  <div>
                    <div class="chat-room__title">
                      {{ store.activeConversation.name || 'δ�����Ự' }}
                      <el-tag v-if="store.activeConversation.type === 'group'" size="small">Ⱥ��</el-tag>
                    </div>
                    <p class="chat-room__subtitle">
                      {{ store.activeConversation.description || '��ӭ��ʼ�µĶԻ���' }}
                    </p>
                  </div>
                </div>
                <div class="chat-room__header-meta">
                  <el-tag type="success" effect="dark">���� {{ store.activeConversation.onlineCount || 0 }}</el-tag>
                  <el-tag type="info">��Ա {{ store.activeConversation.memberCount || 0 }}</el-tag>
                </div>
              </div>
            </template>
          </MessagePanel>

          <MessageComposer
            v-model="draft"
            :disabled="!store.activeConversationId"
            @send="handleSend"
            @attachments-selected="handleAttachmentsSelected"
            @attachment-rejected="handleAttachmentRejected"
          />
        </template>

        <template #panel>
          <ParticipantSidebar
            :participants="store.activeParticipants"
            :loading="participantsLoading"
          />
        </template>
      </ChatLayout>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatLayout from '@/components/chat/ChatLayout.vue'
import ConversationListEnhanced from '@/components/chat/ConversationListEnhanced.vue'
import MessagePanel from '@/components/chat/MessagePanel.vue'
import MessageComposer from '@/components/chat/MessageComposer.vue'
import ParticipantSidebar from '@/components/chat/ParticipantSidebar.vue'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import { useUserStatusStore } from '@/stores/userStatus'
import { ElMessage } from 'element-plus'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import { useUserStore } from '@/stores/user'
import socketService from '@/utils/socket'
import {
  pinConversation,
  muteConversation,
  markConversationRead,
  deleteConversation
} from '@/api/chat'

const route = useRoute()
const router = useRouter()
const store = useChatWorkspaceStore()
const userStore = useUserStore()

const draft = ref('')
const uploadTasks = new Map()
const socketListeners = []
const messageActionStates = reactive({})
let joinedRoomId = null
let typingStopTimer = null

const messageLoading = computed(() => {
  const id = store.activeConversationId
  return id ? store.messageLoadingMap[id] : false
})

const messagePrependLoading = computed(() => {
  const id = store.activeConversationId
  return id ? store.messagePrependLoadingMap[id] : false
})

const messageHasMore = computed(() => store.activeHasMore)

const participantsLoading = computed(() => {
  const id = store.activeConversationId
  return id ? store.participantsLoadingMap[id] : false
})

const showRightPanel = computed(() => true)

// User status management
const statusStore = useUserStatusStore()
const userStatusMap = computed(() => statusStore.userStatusMap)

onMounted(async () => {
  store.setCurrentUser(userStore.user?.id || 1)
  ensureSocketConnection()
  bindSocketEvents()

  if (!store.conversationsLoaded) {
    await store.fetchConversations()
  }

  const routeId = resolveConversationId(route.params.roomId)
  if (routeId) {
    store.setActiveConversation(routeId)
  } else if (store.conversations.length) {
    store.setActiveConversation(store.conversations[0].id)
    pushRoute(store.conversations[0].id)
  }
})

onBeforeUnmount(() => {
  cleanupUploadTasks()
  teardownSocket()
})

watch(
  () => store.activeConversationId,
  (conversationId, previousId) => {
    if (previousId && previousId !== conversationId) {
      if (socketService.isConnected()) {
        try {
          if (store.notifyTyping(previousId, false)) {
            socketService.sendTypingStatus(previousId, false)
          }
          socketService.leaveRoom(previousId)
        } catch (error) {
          console.warn('[chat] leave room failed', error)
        }
      }
      store.clearTyping(previousId)
    }

    if (!conversationId) {
      joinedRoomId = null
      clearAllActionStates()
      return
    }

    joinedRoomId = conversationId
    clearAllActionStates()

    if (socketService.isConnected()) {
      try {
        socketService.joinRoom(conversationId)
      } catch (error) {
        console.warn('[chat] join room failed', error)
      }
    }

    store.fetchParticipants(conversationId)
    store.markConversationRead(conversationId)
  },
  { immediate: true }
)

watch(
  () =>
    (store.activeMessages || [])
      .map((message) => `${message?.id}:${message?.status}`)
      .join('|'),
  () => {
    const conversationId = store.activeConversationId
    if (!conversationId) return

    const unreadIds = (store.activeMessages || [])
      .filter((message) => message && !message.isOwn && message.status !== 'read')
      .map((message) => message.id)

    if (!unreadIds.length) return

    store.markConversationRead(conversationId)

    if (socketService.isConnected()) {
      try {
        socketService.emit('message-read', {
          roomId: conversationId,
          messageIds: unreadIds
        })
      } catch (error) {
        console.warn('[chat] emit read receipt failed', error)
      }
    }
  }
)

watch(
  draft,
  (value) => {
    const conversationId = store.activeConversationId
    if (!conversationId) return

    const hasContent = Boolean(value && value.trim())

    if (socketService.isConnected()) {
      try {
        if (store.notifyTyping(conversationId, hasContent)) {
          socketService.sendTypingStatus(conversationId, hasContent)
        }
      } catch (error) {
        console.warn('[chat] typing status emit failed', error)
      }
    }

    if (typingStopTimer) {
      clearTimeout(typingStopTimer)
      typingStopTimer = null
    }

    if (!hasContent) {
      if (socketService.isConnected()) {
        try {
          if (store.notifyTyping(conversationId, false)) {
            socketService.sendTypingStatus(conversationId, false)
          }
        } catch (error) {
          console.warn('[chat] typing stop emit failed', error)
        }
      }
      return
    }

    typingStopTimer = setTimeout(() => {
      if (!store.activeConversationId) return
      if (socketService.isConnected()) {
        try {
          if (store.notifyTyping(store.activeConversationId, false)) {
            socketService.sendTypingStatus(store.activeConversationId, false)
          }
        } catch (error) {
          console.warn('[chat] typing stop emit failed', error)
        }
      }
      typingStopTimer = null
    }, 2000)
  }
)

watch(
  () => route.params.roomId,
  (value) => {
    const id = resolveConversationId(value)
    if (id) {
      store.setActiveConversation(id)
    }
  }
)

watch(
  () => userStore.user,
  (user) => {
    if (user?.id) {
      store.setCurrentUser(user.id)
      ensureSocketConnection()
    }
  },
  { immediate: true }
)

function actionKeyFromMessage(message) {
  if (!message) return null
  return (
    message.id ||
    message.tempId ||
    message.localId ||
    `${message.conversationId || store.activeConversationId || 'local'}-${message.createdAt || Date.now()}`
  ).toString()
}

function setActionLoading(messageId, type, value) {
  if (!messageId || !type) return
  const current = messageActionStates[messageId] || {}
  current[type] = value
  messageActionStates[messageId] = { ...current }
  if (!value) {
    cleanupActionLoading(messageId)
  }
}

function cleanupActionLoading(messageId) {
  const current = messageActionStates[messageId]
  if (!current) return
  const hasActive = Object.values(current).some(Boolean)
  if (!hasActive) {
    delete messageActionStates[messageId]
  }
}

function clearAllActionStates() {
  Object.keys(messageActionStates).forEach((key) => {
    delete messageActionStates[key]
  })
}

async function handleResendMessage(message) {
  const conversationId = store.activeConversationId
  if (!conversationId || !message) return
  const key = actionKeyFromMessage(message)
  setActionLoading(key, 'resend', true)
  try {
    await store.resendMessage(conversationId, message)
    ElMessage.success('已重新发送')
  } catch (error) {
    console.error('[chat] resend failed', error)
    ElMessage.error('重新发送失败，请稍后再试')
  } finally {
    setActionLoading(key, 'resend', false)
  }
}

async function handleRecallMessage(message) {
  const conversationId = store.activeConversationId
  if (!conversationId || !message) return
  const key = actionKeyFromMessage(message)
  setActionLoading(key, 'recall', true)
  try {
    await store.recallMessage(conversationId, message)
    ElMessage.success('消息已撤回')
  } catch (error) {
    console.error('[chat] recall failed', error)
    ElMessage.error('撤回失败，请稍后再试')
  } finally {
    setActionLoading(key, 'recall', false)
  }
}

function handleToggleDay(payload) {
  if (!payload?.dayKey) return
  // 占位：可用于埋点或持久化折叠状态
}

function ensureSocketConnection() {
  try {
    if (!socketService.isConnected()) {
      socketService.connect(userStore.token, userStore.user?.wsEndpoint)
    }
  } catch (error) {
    console.warn('[chat] socket connect failed', error)
  }
}

function addSocketListener(event, handler) {
  if (!event || typeof handler !== 'function') return
  socketService.on(event, handler)
  socketListeners.push([event, handler])
}

function bindSocketEvents() {
  if (socketListeners.length) return
  addSocketListener('connect', handleSocketConnect)
  addSocketListener('user-typing', handleSocketTyping)
  addSocketListener('user-joined', handleSocketUserJoined)
  addSocketListener('user-left', handleSocketUserLeft)
  addSocketListener('message-read', handleSocketMessageRead)
  addSocketListener('online-users-updated', handleOnlineUsersUpdated)
}

function teardownSocket() {
  if (typingStopTimer) {
    clearTimeout(typingStopTimer)
    typingStopTimer = null
  }

  if (joinedRoomId && socketService.isConnected()) {
    try {
      if (store.notifyTyping(joinedRoomId, false)) {
        socketService.sendTypingStatus(joinedRoomId, false)
      }
      socketService.leaveRoom(joinedRoomId)
    } catch (error) {
      console.warn('[chat] leave room failed', error)
    }
  }

  if (joinedRoomId) {
    store.clearTyping(joinedRoomId)
  }

  joinedRoomId = null

  while (socketListeners.length) {
    const [event, handler] = socketListeners.pop()
    socketService.off(event, handler)
  }
}

function currentUsername() {
  return (
    userStore.user?.nickname ||
    userStore.user?.username ||
    userStore.user?.name ||
    '我'
  )
}

function handleSocketTyping(payload) {
  const roomId = payload?.roomId ?? payload?.conversationId
  const username = payload?.username || payload?.userName || payload?.user?.name
  if (!roomId || !username) return
  if (username === currentUsername()) return
  const isTyping = payload?.isTyping !== false
  store.handleRemoteTyping(roomId, username, isTyping)
}

function handleSocketUserJoined(payload) {
  const roomId = payload?.roomId
  const user = payload?.user || payload
  if (!roomId || !user) return
  const userId = user.id ?? user.userId
  if (!userId) return

  store.upsertParticipant(roomId, {
    userId,
    username: user.name || user.username,
    avatar: user.avatar,
    role: user.role,
    status: 'online',
    lastSeen: new Date().toISOString()
  })

  store.setParticipantStatus(roomId, userId, 'online', {
    username: user.name || user.username,
    avatar: user.avatar,
    lastSeen: new Date().toISOString()
  })

  if (payload?.onlineCount != null) {
    store.updateConversationMeta(roomId, { onlineCount: payload.onlineCount })
  }
}

function handleSocketUserLeft(payload) {
  const roomId = payload?.roomId
  const user = payload?.user || payload
  if (!roomId || !user) return
  const userId = user.id ?? user.userId
  if (!userId) return

  store.setParticipantStatus(roomId, userId, 'offline', {
    lastSeen: new Date().toISOString()
  })

  if (payload?.onlineCount != null) {
    store.updateConversationMeta(roomId, { onlineCount: payload.onlineCount })
  }
}

function handleSocketConnect() {
  if (!joinedRoomId) return
  try {
    socketService.joinRoom(joinedRoomId)
  } catch (error) {
    console.warn('[chat] rejoin room failed', error)
  }
}

function handleSocketMessageRead(payload) {
  const roomId = payload?.roomId
  if (!roomId) return
  store.applyReadReceipt(roomId, {
    messageIds: payload?.messageIds,
    readerId: payload?.readerId,
    readAt: payload?.readAt
  })
}

function handleOnlineUsersUpdated(payload) {
  if (!joinedRoomId) return
  if (payload?.count == null) return
  store.updateConversationMeta(joinedRoomId, {
    onlineCount: payload.count
  })
}

function resolveConversationId(value) {
  if (!value) return null
  const numeric = Number(value)
  return Number.isNaN(numeric) ? value : numeric
}

function pushRoute(id) {
  if (route.params.roomId?.toString() === id.toString()) return
  router.replace({ name: route.name || 'ChatRoom', params: { ...route.params, roomId: id } })
}

function handleConversationSelect(id) {
  store.setActiveConversation(id)
  pushRoute(id)
}

function handleCreateConversation() {
  ElMessage.info('�����Ự���ܼ�������')
}

async function handleSend(content) {
  if (!store.activeConversationId) return
  await store.sendMessage(store.activeConversationId, content)
}

async function handleLoadPrevious() {
  if (!store.activeConversationId) return
  await store.loadOlderMessages(store.activeConversationId)
}

function handleAttachmentsSelected(files) {
  if (!store.activeConversationId || !files?.length) return
  const placeholder = store.createAttachmentPlaceholder(store.activeConversationId, files)
  if (!placeholder?.id) return
  simulateAttachmentUpload(store.activeConversationId, placeholder.id)
}

function handleAttachmentRejected(payload) {
  if (!payload) return
  if (payload.reason === 'size') {
    ElMessage.warning('���ָ���������С���ƣ��Ѻ���')
  } else if (payload.reason === 'count') {
    ElMessage.warning('���������������ƣ�������Ѻ���')
  }
}

function simulateAttachmentUpload(conversationId, messageId) {
  cleanupTask(messageId)

  let progress = 0
  const step = () => {
    progress = Math.min(progress + Math.floor(Math.random() * 20 + 15), 100)
    store.updateMessage(conversationId, messageId, (current) => {
      if (!current?.attachments?.length) return {}
      const attachments = current.attachments.map((attachment) => ({
        ...attachment,
        progress,
        status: progress >= 100 ? 'uploaded' : 'uploading'
      }))
      return {
        attachments,
        status: progress >= 100 ? 'delivered' : 'uploading',
        localOnly: progress < 100
      }
    })

    if (progress >= 100) {
      cleanupTask(messageId)
    }
  }

  const timer = setInterval(step, 400)
  uploadTasks.set(messageId, timer)
  step()
}

function cleanupTask(messageId) {
  const timer = uploadTasks.get(messageId)
  if (timer) {
    clearInterval(timer)
    uploadTasks.delete(messageId)
  }
}

function cleanupUploadTasks() {
  uploadTasks.forEach((timer) => clearInterval(timer))
  uploadTasks.clear()
}

// 会话置顶处理
async function handlePin(conversationId) {
  try {
    const conversation = store.conversations.find(c => c.id === conversationId)
    if (!conversation) return

    const newPinned = !conversation.pinned
    await pinConversation(conversationId, newPinned)

    conversation.pinned = newPinned
    ElMessage.success(newPinned ? '已置顶' : '已取消置顶')
  } catch (error) {
    console.error('Pin conversation failed:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 会话免打扰处理
async function handleMute(conversationId) {
  try {
    const conversation = store.conversations.find(c => c.id === conversationId)
    if (!conversation) return

    const newMuted = !conversation.isMuted
    await muteConversation(conversationId, newMuted)

    conversation.isMuted = newMuted
    ElMessage.success(newMuted ? '已禁言' : '已取消禁言')
  } catch (error) {
    console.error('Mute conversation failed:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 标记为已读处理
async function handleMarkRead(conversationId) {
  try {
    await markConversationRead(conversationId)
    store.markConversationRead(conversationId)
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error('Mark conversation read failed:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 删除会话处理
async function handleDeleteConversation(conversationId) {
  try {
    await deleteConversation(conversationId)
    store.conversations = store.conversations.filter(c => c.id !== conversationId)
    ElMessage.success('已删除会话')
  } catch (error) {
    console.error('Delete conversation failed:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 搜索处理
function handleSearch(query) {
  if (!query?.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({
    name: 'ChatSearch',
    query: { q: query }
  })
}
</script>

<style scoped>
.chat-room {
  position: relative;
  min-height: calc(100vh - 64px);
  background: #ecf2ff;
}

.chat-room__gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 10% 20%, rgba(123, 167, 255, 0.32), transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(255, 173, 231, 0.3), transparent 50%),
    radial-gradient(circle at 30% 80%, rgba(129, 228, 203, 0.25), transparent 55%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(219, 233, 255, 0.8));
}

.chat-room__container {
  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px 32px 48px;
  box-sizing: border-box;
}

.chat-room__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.chat-room__header-info {
  display: flex;
  gap: 14px;
  align-items: center;
}

.chat-room__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #243058;
}

.chat-room__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #7b80a1;
}

.chat-room__header-meta {
  display: flex;
  gap: 8px;
}

@media (max-width: 960px) {
  .chat-room__container {
    padding: 16px;
  }

  .chat-room__header-meta {
    display: none;
  }
}
</style>
