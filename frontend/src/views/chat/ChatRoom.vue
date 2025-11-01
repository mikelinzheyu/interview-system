<template>
  <div class="chat-room">
    <!-- 顶部工具栏 -->
    <TopToolbar :room="room" @menu="handleTopMenuClick" @search="handleSearchClick" />

    <!-- Phase 3: Practice Mode 指示器 -->
    <div v-if="isPracticeMode" class="practice-mode-banner">
      <el-alert
        type="success"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="practice-mode-content">
            <strong>{{ practiceModeTitle }}</strong>
            <el-progress
              :percentage="practiceProgress"
              :format="p => `进度: ${p}%`"
              style="width: 200px;"
            />
            <el-button
              type="danger"
              size="small"
              @click="exitPracticeMode"
            >
              退出练习
            </el-button>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- Phase 7D Advanced: Quick Access Bar -->
    <QuickAccessBar
      v-if="showQuickAccessBar"
      :pinned-messages="getPinnedMessages()"
      :recent-messages="getRecentMessages()"
      :filters="quickFilters"
      :important-count="5"
      :todo-count="3"
      @toggle-filter="handleToggleQuickFilter"
      @set-sort="handleSetSort"
      @clear-filters="handleClearFilters"
      @clear-recent="handleClearRecentHistory"
      @view-message="handleQuickAccessViewMessage"
    />

    <!-- 主容区（三栏布局） -->
    <div class="chat-container">
      <!-- 消息列表区 -->
      <div class="chat-main">
        <MessageListNew
          :messages="messages"
          :loading="messageLoading"
          :typing-users="typingUsers"
          @load-more="handleLoadMoreMessages"
          @message-action="handleMessageAction"
          @scroll="handleScroll"
        />

        <!-- 回复框 (当有回复目标时显示) -->
        <div v-if="messageActionStates.replyingTo" class="reply-box">
          <div class="reply-content">
            <div class="reply-header">
              <span class="reply-label">
                <el-icon><ChatDotRound /></el-icon>
                回复 {{ messageActionStates.replyingTo.senderName }}
              </span>
              <el-button
                text
                type="danger"
                size="small"
                @click="messageActionStates.replyingTo = null"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="reply-text">{{ messageActionStates.replyingTo.content }}</div>
          </div>
        </div>

        <!-- 编辑框 (当有编辑目标时显示) -->
        <div v-if="messageActionStates.editingMessage" class="edit-box">
          <div class="edit-content">
            <div class="edit-header">
              <span class="edit-label">
                <el-icon><Edit /></el-icon>
                编辑模式
              </span>
              <el-button
                text
                type="danger"
                size="small"
                @click="messageActionStates.editingMessage = null"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="edit-text">{{ messageActionStates.editingMessage.content }}</div>
          </div>
        </div>

        <!-- 转发对话框 -->
        <el-dialog
          v-model="showForwardDialog"
          title="转发消息"
          width="50%"
          @close="messageActionStates.forwardingMessage = null"
        >
          <div class="forward-dialog-content">
            <!-- 被转发消息预览 -->
            <div v-if="messageActionStates.forwardingMessage" class="forward-preview">
              <div class="preview-header">原消息</div>
              <div class="preview-message">
                <span class="preview-sender">{{ messageActionStates.forwardingMessage.senderName }}:</span>
                <span class="preview-text">{{ messageActionStates.forwardingMessage.content }}</span>
              </div>
            </div>

            <!-- 会话列表 -->
            <div class="forward-targets">
              <div class="targets-header">选择转发目标</div>
              <div class="conversation-list">
                <div
                  v-for="conv in conversations"
                  :key="conv.id"
                  class="conversation-item"
                  :class="{ selected: selectedForwardTarget?.id === conv.id }"
                  @click="selectedForwardTarget = conv"
                >
                  <el-avatar :size="32" :src="conv.avatar">
                    {{ conv.name?.charAt(0) || '?' }}
                  </el-avatar>
                  <div class="conv-info">
                    <div class="conv-name">{{ conv.name }}</div>
                    <div class="conv-type">{{ conv.isGroup ? '群聊' : '个人' }}</div>
                  </div>
                  <el-icon v-if="selectedForwardTarget?.id === conv.id" class="check-icon">
                    <Check />
                  </el-icon>
                </div>
              </div>
            </div>

            <!-- 附加信息输入 -->
            <div class="forward-message">
              <label class="message-label">附加信息（可选）</label>
              <el-input
                v-model="forwardMessage"
                type="textarea"
                :placeholder="'添加你的备注...'"
                :rows="3"
                :maxlength="500"
              />
            </div>
          </div>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="showForwardDialog = false">取消</el-button>
              <el-button
                type="primary"
                :loading="forwardLoading"
                :disabled="!selectedForwardTarget"
                @click="handleConfirmForward"
              >
                确定转发
              </el-button>
            </div>
          </template>
        </el-dialog>

        <!-- 消息输入框 -->
        <MessageInputNew
          :disabled="!connectionState.isConnected"
          :is-connected="connectionState.isConnected"
          :room-id="room && room.id != null ? String(room.id) : ''"
          :typing-users="typingUsers"
          @send="handleSendMessage"
          @upload="handleUploadFile"
          @typing="handleTypingStatus"
        />
      </div>

      <!-- 右侧栏 -->
      <RightSidebar
        v-if="showSidebar"
        :room="room"
        :members="members"
        @member-click="handleMemberClick"
        @close="showSidebar = false"
      />

      <!-- 搜索面板 (Phase 7A) -->
      <el-drawer
        v-model="showSearchPanel"
        title="搜索消息"
        :size="searchPanelWidth"
        :destroy-on-close="false"
      >
        <MessageSearch
          :messages="messages"
          :conversation-id="room.id"
          :senders="members"
          @message-found="handleSearchMessageFound"
          @forward-message="handleSearchForwardMessage"
          @collect-message="handleSearchCollectMessage"
        />
      </el-drawer>
    </div>

    <!-- 上下文菜单（消息右键菜单） -->
    <ContextMenuNew
      v-if="showContextMenu"
      :position="contextMenuPosition"
      :items="contextMenuItems"
      @select="handleContextMenuSelect"
      @close="showContextMenu = false"
    />

    <!-- 新消息提示浮窗 -->
    <FloatingNewMessageButton
      v-if="showNewMessageButton"
      :count="newMessageCount"
      @click="handleScrollToBottom"
    />

    <!-- 消息编辑覆盖层 (Phase 7B) -->
    <MessageEditOverlay
      :visible.sync="showEditOverlay"
      :message="currentEditingMessage"
      :edit-history="currentEditingMessage ? getMessageHistory(currentEditingMessage.id) : []"
      :show-history="true"
      @edit="handleMessageEdit"
      @restore="handleRestoreVersion"
      @cancel="currentEditingMessage = null"
    />

    <!-- 编辑历史抽屉 (Phase 7B) -->
    <MessageEditHistory
      :visible.sync="showEditHistoryDrawer"
      :edit-history="currentEditHistoryMessage ? getMessageHistory(currentEditHistoryMessage.id) : []"
      @restore="handleRestoreVersion"
      @close="currentEditHistoryMessage = null"
    />

    <!-- Phase 7C: Collection Panel Drawer -->
    <el-drawer
      v-model="showCollectionPanel"
      title="📌 消息收藏"
      size="40%"
      @close="showCollectionPanel = false"
    >
      <MessageCollectionPanel
        :collections="getCollections()"
        @view="handleViewCollection"
        @delete="handleDeleteCollection"
        @update-note="handleUpdateCollectionNote"
      />
    </el-drawer>

    <!-- Phase 7C: Marking Panel Drawer -->
    <el-drawer
      v-model="showMarkingPanel"
      title="🏷️ 消息标记"
      size="40%"
      @close="showMarkingPanel = false"
    >
      <MessageMarkingPanel
        :marks="marks"
        :tags="messageTags"
        :tag-statistics="tagStatistics"
        @mark="handleMarkMessage"
        @unmark="handleUnmarkMessage"
        @add-tag="handleAddTagToMessage"
        @remove-tag="handleRemoveMessageTag"
        @create-tag="handleCreateTag"
        @update-tag="handleUpdateTag"
        @delete-tag="handleDeleteTag"
      />
    </el-drawer>

    <!-- Phase 7C: Collection Detail Modal -->
    <CollectionDetailModal
      :visible="showCollectionDetailModal"
      :collection="selectedCollection"
      @close="showCollectionDetailModal = false"
      @update-note="handleUpdateCollectionNote"
      @delete-collection="handleDeleteCollection"
      @view-original="handleViewOriginalFromCollection"
    />

    <!-- Phase 7C: Tag Management Modal -->
    <TagManagementModal
      :visible="showTagManager"
      :tags="messageTags"
      :tag-statistics="tagStatistics"
      @close="handleCloseTagManager"
      @create-tag="handleCreateTag"
      @update-tag="handleUpdateTag"
      @delete-tag="handleDeleteTag"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStatusStore } from '@/stores/userStatus'
import { ElMessage, ElMessageBox, ElDrawer } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import socketService from '@/utils/socket'
import { ChatDotRound, Edit, Close, Check } from '@element-plus/icons-vue'
// New components for QQ-style chat UI
import TopToolbar from '@/components/chat/TopToolbar.vue'
import MessageListNew from '@/components/chat/MessageListNew.vue'
import MessageInputNew from '@/components/chat/MessageInputNew.vue'
import RightSidebar from '@/components/chat/RightSidebar.vue'
import ContextMenuNew from '@/components/chat/ContextMenu.vue'
import FloatingNewMessageButton from '@/components/chat/FloatingNewMessageButton.vue'
import MessageSearch from '@/components/chat/MessageSearch.vue'
import MessageEditOverlay from '@/components/chat/MessageEditOverlay.vue'
import MessageEditHistory from '@/components/chat/MessageEditHistory.vue'
import { useMessageRecall } from '@/services/messageRecallService'
import { useMessageEdit } from '@/services/messageEditService'
// Phase 7C: Message Collection & Marking Services
import { useMessageCollection } from '@/services/messageCollectionService'
import { useMessageMarking } from '@/services/messageMarkingService'
// Phase 7C: Modal & Panel Components
import MessageCollectionPanel from '@/components/chat/MessageCollectionPanel.vue'
import MessageMarkingPanel from '@/components/chat/MessageMarkingPanel.vue'
import CollectionDetailModal from '@/components/chat/CollectionDetailModal.vue'
import TagManagementModal from '@/components/chat/TagManagementModal.vue'
// Phase 7D Advanced: Message Search, Quick Access & Sorting Services
import { useMessageSearchEngine } from '@/services/messageSearchEngine'
import { useMessageQuickAccess } from '@/services/messageQuickAccessService'
import { useMessageSorting } from '@/services/messageSortingService'
// Phase 7D Advanced: UI Components
import QuickAccessBar from '@/components/chat/QuickAccessBar.vue'
import { leaveChatRoom } from '@/api/chat'

// Phase 3: Practice Mode Integration
import { usePracticeMode } from '@/composables/usePracticeMode'

const route = useRoute()
const router = useRouter()
const store = useChatWorkspaceStore()
const userStore = useUserStore()

const draft = ref('')
const uploadTasks = new Map()
const socketListeners = []
const messageActionStates = reactive({
  replyingTo: null,
  editingMessage: null,
  forwardingMessage: null
})
let joinedRoomId = null
let typingStopTimer = null

// 连接状态管理 (新增)
const connectionState = reactive({
  isConnecting: false,
  isConnected: false,
  connectionError: null,
  lastConnectAttempt: 0,
  reconnectCount: 0,
  maxReconnectAttempts: 5
})

// WebSocket 消息队列 (新增 - 处理离线消息)
const messageQueue = ref([])

// 用户在线状态实时更新 (新增)
const userOnlineStatus = reactive({})

// 消息已读状态 (新增)
const messageReadStatus = reactive({})

// New UI state for QQ-style chat
const showSidebar = ref(true)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuItems = ref([])
const showNewMessageButton = ref(false)
const newMessageCount = ref(0)
const hoveredMessageId = ref(null)
const typingUsers = computed(() => store.typingUsers?.[store.activeConversationId] || [])

// Forward dialog state
const showForwardDialog = ref(false)
const selectedForwardTarget = ref(null)
const forwardMessage = ref('')
const forwardLoading = ref(false)

// Search state (Phase 7A)
const showSearchPanel = ref(false)
const searchPanelWidth = '40%'

// Message Edit/Recall state (Phase 7B)
const {
  canRecallMessage,
  recallMessage,
  handleRecallEvent,
  getRecallTimeRemaining,
  startRecallTimeMonitor,
  stopRecallTimeMonitor,
  cleanup: cleanupRecall
} = useMessageRecall()

const {
  canEditMessage,
  editMessage,
  handleEditEvent,
  getMessageHistory,
  restoreVersion,
  cleanup: cleanupEdit
} = useMessageEdit()

const showEditOverlay = ref(false)
const currentEditingMessage = ref(null)
const showEditHistoryDrawer = ref(false)
const currentEditHistoryMessage = ref(null)

// Message Collection & Marking state (Phase 7C)
const {
  collections,
  marks,
  tags,
  collectionCount,
  collectMessage,
  uncollectMessage,
  isCollected,
  getCollections,
  updateCollectionNote,
  addCollectionTag,
  removeCollectionTag,
  clearCollections,
  batchUncollect,
  saveToLocalStorage: saveCollectionsToLocalStorage,
  loadFromLocalStorage: loadCollectionsFromLocalStorage,
  syncWithServer: syncCollectionsWithServer,
  cleanup: cleanupCollections
} = useMessageCollection()

const {
  marks: markedMessages,
  tags: messageTags,
  markMessage,
  unmarkMessage,
  hasMarkType,
  getMessageMarks,
  getMarkedMessages,
  getMarkStatistics,
  addTag,
  removeTag,
  getMessageTags,
  createTag,
  updateTag,
  deleteTag,
  getTags,
  getTagStatistics,
  cleanup: cleanupMarking,
  initialize: initializeMarking
} = useMessageMarking()

// Phase 7D Advanced: Message Search Service
const {
  advancedSearch,
  getSearchSuggestions,
  saveQuery,
  deleteQuery,
  getSavedQueries,
  clearCache: clearSearchCache,
  clearHistory: clearSearchHistory,
  getSearchStats,
  cleanup: cleanupSearch
} = useMessageSearchEngine()

// Phase 7D Advanced: Quick Access Service
const {
  pinnedMessages,
  recentMessages,
  quickFilters,
  activeFilterCount,
  pinMessage,
  unpinMessage,
  isPinned,
  getPinnedMessages,
  addToRecent,
  getRecentMessages,
  clearRecentHistory,
  toggleQuickFilter,
  getActiveFilters,
  clearFilters: clearQuickFilters,
  getQuickAccessData,
  saveToLocalStorage: saveQuickAccessToLocalStorage,
  loadFromLocalStorage: loadQuickAccessFromLocalStorage,
  cleanup: cleanupQuickAccess,
  CONFIG: quickAccessConfig
} = useMessageQuickAccess()

// Phase 7D Advanced: Sorting Service
const {
  userPreferences,
  sortMessages,
  setSortOption,
  setUserPreference,
  getUserPreferences,
  resetPreferences,
  getSortOptions,
  SORT_OPTIONS,
  savePreferences: saveSortingPreferences,
  loadPreferences: loadSortingPreferences,
  cleanup: cleanupSorting
} = useMessageSorting()

// UI state for collection & marking panels (Phase 7C)
const showCollectionPanel = ref(false)
const showMarkingPanel = ref(false)
const selectedCollection = ref(null)
const showCollectionDetailModal = ref(false)
const showTagManager = ref(false)
const tagStatistics = computed(() => getTagStatistics())

// UI state for Phase 7D Advanced features
const showQuickAccessBar = ref(true)
const currentSortBy = ref('recency')

// Room and members state
const room = computed(() => {
  const conversation = store.activeConversation
  return {
    id: conversation?.id,
    name: conversation?.name,
    avatar: conversation?.avatar,
    memberCount: store.activeParticipants?.length || 0,
    announcement: conversation?.announcement || '暂无公告',
    createdAt: conversation?.createdAt
  }
})

const members = computed(() => {
  return (store.activeParticipants || []).map(participant => ({
    userId: participant.id,
    name: participant.name,
    avatar: participant.avatar,
    role: participant.role || 'member',
    isOnline: participant.isOnline !== false
  }))
})

const messages = computed(() => {
  return (store.activeMessages || []).map(msg => ({
    id: msg.id || msg.tempId,
    type: msg.type || 'text',
    content: msg.content,
    timestamp: msg.createdAt || Date.now(),
    senderName: msg.senderName,
    senderAvatar: msg.senderAvatar,
    isOwn: msg.isOwn || msg.senderId === store.currentUserId,
    status: msg.status || 'delivered',
    attachments: msg.attachments || [],
    isRecalled: msg.isRecalled || false
  }))
})

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

// 会话列表（用于转发对话框）
const conversations = computed(() => {
  return (store.conversations || []).filter(conv => {
    // 不能转发到当前会话
    return conv.id !== store.activeConversationId
  })
})

// User status management
const statusStore = useUserStatusStore()
const userStatusMap = computed(() => statusStore.userStatusMap)

// Phase 3: Practice Mode Integration
const {
  isPracticeMode,
  practiceWrongAnswerId,
  practiceQuestionIds,
  currentPracticeQuestionIndex,
  practiceProgress,
  practiceModeTitle,
  initPracticeMode: initPracticeModeComposable,
  getCurrentPracticeQuestion,
  moveToNextPracticeQuestion,
  completePracticeMode,
  exitPracticeMode
} = usePracticeMode()

onMounted(async () => {
  store.setCurrentUser(userStore.user?.id || 1)
  ensureSocketConnection()
  bindSocketEvents()

  // Phase 7B: 启动撤回时间监听
  startRecallTimeMonitor()

  // Phase 7C: Initialize marking service and load data
  initializeMarking()
  loadCollectionsFromLocalStorage()

  // Phase 7C: Start periodic sync with server
  const collectionSyncInterval = setInterval(() => {
    syncCollectionsWithServer()
  }, 30000) // Sync every 30 seconds

  // Store interval ID for cleanup
  window.__collectionSyncInterval = collectionSyncInterval

  // Phase 7D Advanced: Initialize search, quick access and sorting services
  loadQuickAccessFromLocalStorage()
  loadSortingPreferences()
  currentSortBy.value = getUserPreferences().defaultSort || 'recency'

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
  // Phase 7B: 清理服务资源
  stopRecallTimeMonitor()
  cleanupRecall()
  cleanupEdit()
  // Phase 7C: Clean up collection/marking services
  if (window.__collectionSyncInterval) {
    clearInterval(window.__collectionSyncInterval)
  }
  cleanupCollections()
  cleanupMarking()
  // Phase 7D Advanced: Clean up advanced feature services
  saveQuickAccessToLocalStorage()
  saveSortingPreferences()
  cleanupSearch()
  cleanupQuickAccess()
  cleanupSorting()
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
  // Phase 7B: 消息撤回和编辑事件监听
  addSocketListener('message-recalled', handleRecallWebSocketEvent)
  addSocketListener('message-edited', handleEditWebSocketEvent)
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

// Phase 7B: WebSocket 撤回事件处理
function handleRecallWebSocketEvent(event) {
  if (!event) return
  // 使用 useMessageRecall 服务处理撤回事件
  // handleRecallEvent 来自 useMessageRecall composable
}

// Phase 7B: WebSocket 编辑事件处理
function handleEditWebSocketEvent(event) {
  if (!event) return
  // 使用 useMessageEdit 服务处理编辑事件
  // handleEditEvent 来自 useMessageEdit composable
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

// New event handlers for QQ-style chat UI
function handleTopMenuClick(action) {
  switch (action) {
    case 'search':
      showSearchPanel.value = true
      break
    case 'call':
      ElMessage.info('语音通话功能开发中...')
      break
    case 'video':
      ElMessage.info('视频通话功能开发中...')
      break
    case 'mute':
      ElMessage.info('禁言设置开发中...')
      break
    case 'info':
      showSidebar.value = !showSidebar.value
      break
    case 'exit':
      ElMessageBox.confirm('确定要退出该群组吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            const roomId = room.value?.id
            if (roomId) {
              try {
                await leaveChatRoom(roomId)
              } catch (e) {
                // 允许后端未实现时继续退出流程
                console.warn('[chat] leaveChatRoom failed, continue locally', e)
              }
              try {
                socketService.leaveRoom(roomId)
              } catch (e) {
                console.warn('[chat] socket leaveRoom failed', e)
              }
            }
            ElMessage.success('已退出群组')
          } finally {
            // 等待路由导航完成，并处理可能的错误
            try {
              await router.push('/chat')
            } catch (navError) {
              console.error('[chat] Navigation to /chat failed:', navError)
              ElMessage.error('跳转失败，请检查网络或稍后重试')
            }
          }
        })
        .catch(() => {
          console.log('[chat] User cancelled exit confirmation')
        })
      break
  }
}

/**
 * 处理搜索按钮点击
 */
function handleSearchClick() {
  showSearchPanel.value = true
}

/**
 * 处理搜索到消息（Phase 7A）
 */
function handleSearchMessageFound(result) {
  if (!result || !result.conversationId) {
    ElMessage.warning('无法跳转到消息')
    return
  }

  // 跳转到对应会话
  if (result.conversationId !== store.activeConversationId) {
    store.setActiveConversation(result.conversationId)
  }

  // 滚动到该消息
  setTimeout(() => {
    const messageElement = document.querySelector(`[data-message-id="${result.id}"]`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 高亮消息
      messageElement.classList.add('highlight')
      setTimeout(() => {
        messageElement.classList.remove('highlight')
      }, 2000)
    }
  }, 100)
}

/**
 * 处理搜索结果的转发
 */
function handleSearchForwardMessage(result) {
  messageActionStates.forwardingMessage = {
    id: result.id,
    conversationId: result.conversationId,
    content: result.content,
    type: result.type,
    senderName: result.senderName
  }
  showForwardDialog.value = true
}

/**
 * 处理搜索结果的收藏（Phase 7C）
 */
function handleSearchCollectMessage(result) {
  // 这将在 Phase 7C 中实现
  ElMessage.success(`消息已添加到收藏（功能即将推出）`)
}

function handleSendMessage(content) {
  if (!store.activeConversationId) return
  store.sendMessage(store.activeConversationId, content)
}

function handleUploadFile(files) {
  if (!store.activeConversationId || !files?.length) return
  files.forEach(file => {
    const placeholder = store.createAttachmentPlaceholder(store.activeConversationId, [file])
    if (placeholder?.id) {
      simulateAttachmentUpload(store.activeConversationId, placeholder.id)
    }
  })
}

function handleTypingStatus(isTyping) {
  if (!store.activeConversationId) return
  const hasContent = isTyping
  if (socketService.isConnected()) {
    try {
      if (store.notifyTyping(store.activeConversationId, hasContent)) {
        socketService.sendTypingStatus(store.activeConversationId, hasContent)
      }
    } catch (error) {
      console.warn('[chat] typing status emit failed', error)
    }
  }
}

function handleLoadMoreMessages() {
  if (!store.activeConversationId) return
  store.loadOlderMessages(store.activeConversationId)
}

function handleMessageAction(payload) {
  if (!payload?.message) return

  // 存储选中的消息
  messageActionStates.selectedMessage = payload.message

  showContextMenu.value = true
  contextMenuPosition.value = payload.position || { x: 0, y: 0 }

  const message = payload.message
  const isOwn = message.isOwn

  // Build context menu items based on message type and ownership
  const items = []

  items.push({
    action: 'reply',
    label: '回复',
    icon: 'ChatDotRound'
  })

  items.push({
    action: 'copy',
    label: '复制',
    icon: 'DocumentCopy'
  })

  if (isOwn) {
    items.push({
      action: 'edit',
      label: '编辑',
      icon: 'Edit'
    })

    items.push({
      action: 'recall',
      label: '撤回',
      icon: 'Delete',
      danger: true
    })
  }

  items.push({
    action: 'forward',
    label: '转发',
    icon: 'Share'
  })

  if (!isOwn) {
    items.push({
      action: 'block',
      label: '屏蔽',
      icon: 'Close',
      danger: true
    })
  }

  contextMenuItems.value = items
}

function handleContextMenuSelect(action) {
  showContextMenu.value = false

  // Get current selected message from MessageListNew
  const payload = messageActionStates.selectedMessage
  if (!payload) {
    ElMessage.warning('操作失败：消息未找到')
    return
  }

  switch (action) {
    case 'reply':
      handleReplyMessage(payload)
      break
    case 'copy':
      handleCopyMessage(payload)
      break
    case 'edit':
      handleEditMessage(payload)
      break
    case 'recall':
      handleMessageRecall(payload)
      break
    case 'forward':
      handleForwardMessage(payload)
      break
    case 'block':
      handleBlockUser(payload)
      break
    default:
      ElMessage.warning('未知操作')
  }
}

// 回复消息处理
function handleReplyMessage(message) {
  if (!message || !message.id) return

  messageActionStates.replyingTo = {
    id: message.id,
    content: message.content?.substring(0, 100) || '(消息)',
    senderName: message.senderName || '用户'
  }

  ElMessage.info(`正在回复 ${message.senderName} 的消息`)
}

// 复制消息处理
function handleCopyMessage(message) {
  if (!message || !message.content) {
    ElMessage.warning('无法复制：消息内容为空')
    return
  }

  try {
    // 使用 Clipboard API 复制
    navigator.clipboard.writeText(message.content).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => {
      // 降级方案：使用传统方法
      copyToClipboardFallback(message.content)
    })
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 降级方案：兼容较旧浏览器
function copyToClipboardFallback(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  ElMessage.success('已复制到剪贴板')
}

// 编辑消息处理 (Phase 7B)
function handleEditMessage(payload) {
  const message = payload?.message || payload
  if (!message) return

  if (!message.isOwn) {
    ElMessage.error('只能编辑自己的消息')
    return
  }

  if (!canEditMessage(message)) {
    ElMessage.error('此消息无法编辑')
    return
  }

  currentEditingMessage.value = message
  showEditOverlay.value = true
}

// 消息编辑事件处理 (Phase 7B)
async function handleMessageEdit(payload) {
  try {
    const { messageId, conversationId, newContent } = payload
    if (!messageId || !conversationId || !newContent) return

    const success = await editMessage(messageId, conversationId, newContent)
    if (success) {
      // 关闭编辑覆盖层
      showEditOverlay.value = false
      currentEditingMessage.value = null
      ElMessage.success('消息已编辑')
    }
  } catch (error) {
    console.error('编辑消息失败:', error)
    ElMessage.error('编辑失败，请稍后重试')
  }
}

// 版本恢复处理 (Phase 7B)
async function handleRestoreVersion(payload) {
  try {
    const { messageId, versionNumber } = payload
    if (!messageId || !versionNumber) return

    const currentConvId = store.activeConversationId
    const success = await restoreVersion(messageId, versionNumber)
    if (success) {
      showEditOverlay.value = false
      showEditHistoryDrawer.value = false
      ElMessage.success('已恢复到该版本')
    }
  } catch (error) {
    console.error('恢复版本失败:', error)
    ElMessage.error('恢复失败，请稍后重试')
  }
}

// 显示编辑历史处理 (Phase 7B)
async function handleEditHistory(message) {
  if (!message) return

  if (!message.isOwn) {
    ElMessage.error('只能查看自己消息的编辑历史')
    return
  }

  currentEditHistoryMessage.value = message
  showEditHistoryDrawer.value = true
}

// 撤回消息处理
async function handleMessageRecall(message) {
  if (!message) return

  if (!message.isOwn) {
    ElMessage.error('只能撤回自己的消息')
    return
  }

  // 检查是否在撤回时限内（通常 2 分钟）
  const now = Date.now()
  const messageTime = message.timestamp || 0
  const timeDiff = now - messageTime
  const recallTimeLimit = 2 * 60 * 1000 // 2 分钟

  if (timeDiff > recallTimeLimit) {
    ElMessage.error('消息已过期，无法撤回（仅支持 2 分钟内的消息）')
    return
  }

  try {
    // 调用已有的 handleRecallMessage 方法
    const conversationId = store.activeConversationId
    if (conversationId) {
      await store.recallMessage(conversationId, message)
      ElMessage.success('消息已撤回')
    }
  } catch (error) {
    ElMessage.error('撤回失败，请稍后重试')
  }
}

// 转发消息处理
function handleForwardMessage(message) {
  if (!message) return

  messageActionStates.messageToForward = message
  ElMessage.info(`准备转发: ${message.content?.substring(0, 50)}...`)
}

// 屏蔽用户处理
function handleBlockUser(message) {
  if (!message) return

  if (message.isOwn) {
    ElMessage.error('无法屏蔽自己')
    return
  }

  const userId = message.senderId
  const userName = message.senderName || '用户'

  ElMessage.confirm(
    `确定要屏蔽 ${userName} 的消息吗？屏蔽后将不再看到此用户的消息`,
    '屏蔽用户',
    {
      confirmButtonText: '屏蔽',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 添加到屏蔽列表
    if (!messageActionStates.blockedUsers) {
      messageActionStates.blockedUsers = []
    }
    messageActionStates.blockedUsers.push(userId)

    // 存储到本地存储
    localStorage.setItem('blockedUsers', JSON.stringify(messageActionStates.blockedUsers))

    // 通知服务器
    if (socketService.isConnected()) {
      socketService.send({
        type: 'user:block',
        payload: {
          userId: userId,
          timestamp: Date.now()
        }
      })
    }

    ElMessage.success(`已屏蔽 ${userName}`)
  }).catch(() => {
    // 用户取消
  })
}

function handleScroll(event) {
  if (!event) return
  const element = event.target
  const { scrollTop, scrollHeight, clientHeight } = element

  // Show floating button when not at bottom
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
  showNewMessageButton.value = !isAtBottom
}

function handleScrollToBottom() {
  showNewMessageButton.value = false
  newMessageCount.value = 0
  // Scroll to bottom logic handled by MessageListNew component
}

function handleMemberClick(member) {
  ElMessage.info(`查看 ${member.name} 的资料`)
}

// 转发消息处理
function handleOpenForwardDialog(message) {
  messageActionStates.forwardingMessage = message
  selectedForwardTarget.value = null
  forwardMessage.value = ''
  showForwardDialog.value = true
}

// 确认转发
async function handleConfirmForward() {
  if (!selectedForwardTarget.value || !messageActionStates.forwardingMessage) {
    ElMessage.warning('请选择转发目标')
    return
  }

  forwardLoading.value = true
  try {
    // 构建转发消息
    const forwardedMessage = {
      type: 'forward',
      originalContent: messageActionStates.forwardingMessage.content,
      originalSender: messageActionStates.forwardingMessage.senderName,
      attachMessage: forwardMessage.value || ''
    }

    // 发送到目标会话
    await store.sendMessage(
      selectedForwardTarget.value.id,
      JSON.stringify(forwardedMessage)
    )

    ElMessage.success(`已转发给 ${selectedForwardTarget.value.name}`)
    showForwardDialog.value = false
    messageActionStates.forwardingMessage = null
    selectedForwardTarget.value = null
    forwardMessage.value = ''
  } catch (error) {
    console.error('Forward message failed:', error)
    ElMessage.error('转发失败，请重试')
  } finally {
    forwardLoading.value = false
  }
}

/**
 * Phase 7C: Message Collection & Marking Handlers
 */

/**
 * 收藏消息
 */
async function handleCollectMessage(messageId) {
  const message = store.getMessageById(messageId)
  if (!message) {
    ElMessage.error('消息不存在')
    return
  }

  const success = await collectMessage(messageId, store.activeConversationId, {
    content: message.content,
    type: message.type || 'text',
    senderName: message.senderName,
    senderId: message.senderId,
    conversationId: store.activeConversationId,
    attachments: message.attachments || [],
    quotedMessage: message.quotedMessage || null,
    editCount: message.editCount || 0,
    isRecalled: message.isRecalled || false
  })

  if (success) {
    ElMessage.success('已收藏消息')
  }
}

/**
 * 取消收藏
 */
async function handleUncollectMessage(messageId) {
  const success = await uncollectMessage(messageId)
  if (success) {
    ElMessage.success('已取消收藏')
  }
}

/**
 * 查看收藏详情
 */
function handleViewCollection(collection) {
  selectedCollection.value = collection
  showCollectionDetailModal.value = true
}

/**
 * 更新收藏备注
 */
function handleUpdateCollectionNote(messageId, note) {
  updateCollectionNote(messageId, note)
  ElMessage.success('备注已保存')
}

/**
 * 删除收藏
 */
async function handleDeleteCollection(messageId) {
  const success = await uncollectMessage(messageId)
  if (success) {
    ElMessage.success('已删除收藏')
  }
}

/**
 * 标记消息
 */
function handleMarkMessage(messageId, markType) {
  const success = markMessage(messageId, markType)
  if (success) {
    ElMessage.success(`已标记为 ${markType}`)
  }
}

/**
 * 取消标记
 */
function handleUnmarkMessage(messageId, markType) {
  const success = unmarkMessage(messageId, markType)
  if (success) {
    ElMessage.success('已取消标记')
  }
}

/**
 * 添加标签到消息
 */
function handleAddTagToMessage(messageId, tag) {
  const success = addTag(messageId, tag)
  if (success) {
    ElMessage.success(`已添加标签: ${tag.name}`)
  }
}

/**
 * 移除消息标签
 */
function handleRemoveMessageTag(messageId, tagId) {
  const success = removeTag(messageId, tagId)
  if (success) {
    ElMessage.success('标签已移除')
  }
}

/**
 * 创建新标签
 */
function handleCreateTag(name, color) {
  const newTag = createTag(name, color)
  if (newTag) {
    ElMessage.success(`已创建标签: ${name}`)
  }
}

/**
 * 更新标签
 */
function handleUpdateTag(tagId, name, color) {
  const success = updateTag(tagId, name, color)
  if (success) {
    ElMessage.success('标签已更新')
  }
}

/**
 * 删除标签
 */
function handleDeleteTag(tagId) {
  const success = deleteTag(tagId)
  if (success) {
    ElMessage.success('标签已删除')
  }
}

/**
 * 切换收藏面板
 */
function handleToggleCollectionPanel() {
  showCollectionPanel.value = !showCollectionPanel.value
}

/**
 * 切换标记面板
 */
function handleToggleMarkingPanel() {
  showMarkingPanel.value = !showMarkingPanel.value
}

/**
 * 处理查看原消息（从收藏详情）
 */
function handleViewOriginalFromCollection(messageId) {
  const message = store.getMessageById(messageId)
  if (message) {
    // Scroll to message
    const element = document.querySelector(`[data-message-id="${messageId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ElMessage.success('已定位到原消息')
    } else {
      ElMessage.warning('原消息已删除或不在当前视图')
    }
  }
  showCollectionDetailModal.value = false
}

/**
 * 关闭标签管理器
 */
function handleCloseTagManager() {
  showTagManager.value = false
}

// ========== Phase 7D Advanced: Quick Access Event Handlers ==========

/**
 * 处理切换快速过滤
 */
function handleToggleQuickFilter(filterName) {
  toggleQuickFilter(filterName)
  ElMessage.info(`已${getActiveFilters().includes(filterName) ? '启用' : '禁用'} ${filterName}`)
}

/**
 * 处理设置排序方式
 */
function handleSetSort(sortOption) {
  currentSortBy.value = sortOption
  setSortOption(sortOption)
  ElMessage.success(`已设置按 ${sortOption} 排序`)
}

/**
 * 处理清除过滤器
 */
function handleClearFilters() {
  clearQuickFilters()
  ElMessage.success('已清除所有过滤器')
}

/**
 * 处理清除最近消息历史
 */
function handleClearRecentHistory() {
  clearRecentHistory()
  ElMessage.success('已清除最近消息历史')
}

/**
 * 处理查看消息（来自快速访问）
 */
function handleQuickAccessViewMessage(messageId) {
  const message = store.getMessageById(messageId)
  if (message) {
    addToRecent(messageId, {
      content: message.content,
      senderName: message.senderName,
      timestamp: message.createdAt || Date.now(),
      type: message.type || 'text'
    })
    const element = document.querySelector(`[data-message-id="${messageId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ElMessage.success('已定位到消息')
    } else {
      ElMessage.warning('消息不在当前视图')
    }
  }
}

/**
 * 处理钉住消息
 */
function handlePinMessage(messageId) {
  const message = store.getMessageById(messageId)
  if (message) {
    const result = pinMessage(messageId, {
      content: message.content,
      senderName: message.senderName,
      timestamp: message.createdAt || Date.now(),
      type: message.type || 'text'
    })
    if (result) {
      ElMessage.success('消息已钉住')
    } else {
      ElMessage.warning('钉住消息数已达上限（最多10条）')
    }
  }
}

/**
 * 处理取消钉住
 */
function handleUnpinMessage(messageId) {
  const result = unpinMessage(messageId)
  if (result) {
    ElMessage.success('消息已取消钉住')
  }
}

/**
 * 处理用户偏好设置更新
 */
function handleUpdateSortingPreference(key, value) {
  const result = setUserPreference(key, value)
  if (result) {
    ElMessage.success('偏好设置已更新')
  }
}

/**
 * 处理重置排序偏好
 */
function handleResetSortingPreferences() {
  resetPreferences()
  currentSortBy.value = 'recency'
  ElMessage.success('排序偏好已重置为默认值')
}

/**
 * 获取排序后的消息列表
 */
function getSortedMessages() {
  const userMarks = marks.value || {}
  const userCollections = collections.value || {}
  return sortMessages(messages.value, currentSortBy.value, userMarks, userCollections)
}

/**
 * Phase 3: Practice Mode AI Feedback Handler
 * 当接收到 AI 反馈时调用此函数，根据 Practice Mode 状态决定反馈策略
 */
async function handlePracticeModeAIFeedback(feedback) {
  if (!isPracticeMode.value) {
    // 普通模式：显示完整反馈
    return
  }

  try {
    // Practice Mode: 检查是否还有更多题目
    if (moveToNextPracticeQuestion()) {
      // 还有更多题目
      ElMessage.info('开始下一题，继续加油！')
      // 可以在这里预加载下一题的内容
      const nextQuestionId = getCurrentPracticeQuestion()
      console.log('[practice-mode] Moving to next question:', nextQuestionId)
    } else {
      // 全部完成
      await completePracticeMode(feedback)
      ElMessage.success('练习完成！你的进度已自动保存')
      // 可以选择返回错题详情页或列表页
      setTimeout(() => {
        router.back()
      }, 2000)
    }
  } catch (error) {
    console.error('[practice-mode] Error handling feedback:', error)
    ElMessage.error('处理反馈时出错，请稍后重试')
  }
}

</script>

<style scoped>
.chat-room {
  position: relative;
  height: 100vh;
  width: 100vw;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  width: 100%;
  height: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.qq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(224, 229, 255, 0.5);
}

.qq-header-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.qq-avatar {
  flex-shrink: 0;
}

.qq-header-info {
  flex: 1;
  min-width: 0;
}

.qq-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #243058;
  margin: 0;
}

.qq-subtitle {
  font-size: 12px;
  color: #7b80a1;
  margin: 4px 0 0;
}

.qq-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.qq-online-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #5d688f;
}

.qq-online-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 回复框样式 */
.reply-box {
  padding: 12px 16px;
  background: #f5f7fa;
  border-left: 3px solid #5c6af0;
  border-radius: 4px;
  animation: slideInDown 0.3s ease-out;
}

.reply-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.reply-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #5c6af0;
}

.reply-label :deep(.el-icon) {
  font-size: 14px;
}

.reply-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 编辑框样式 */
.edit-box {
  padding: 12px 16px;
  background: #fffae6;
  border-left: 3px solid #ff9500;
  border-radius: 4px;
  animation: slideInDown 0.3s ease-out;
}

.edit-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.edit-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #ff9500;
}

.edit-label :deep(.el-icon) {
  font-size: 14px;
}

.edit-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 转发对话框样式 */
.forward-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 原消息预览 */
.forward-preview {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #5c6af0;
}

.preview-header {
  font-size: 12px;
  font-weight: 600;
  color: #7b80a1;
  margin-bottom: 8px;
}

.preview-message {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}

.preview-sender {
  font-weight: 600;
  color: #5c6af0;
  margin-right: 4px;
}

.preview-text {
  color: #666;
}

/* 转发目标选择 */
.forward-targets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.targets-header {
  font-size: 14px;
  font-weight: 600;
  color: #243058;
}

.conversation-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e5ff;
  border-radius: 6px;
  background: #fff;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f1f5;
}

.conversation-item:last-child {
  border-bottom: none;
}

.conversation-item:hover {
  background: #f5f7fa;
}

.conversation-item.selected {
  background: #e6ebff;
  border-left: 3px solid #5c6af0;
  padding-left: 9px;
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-name {
  font-size: 13px;
  font-weight: 500;
  color: #243058;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-type {
  font-size: 12px;
  color: #7b80a1;
}

.check-icon {
  color: #67c23a;
  font-size: 18px;
  flex-shrink: 0;
}

/* 附加信息输入 */
.forward-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-label {
  font-size: 13px;
  font-weight: 600;
  color: #243058;
}

.forward-message :deep(.el-textarea) {
  border-color: #e0e5ff;
}

.forward-message :deep(.el-textarea__inner) {
  font-size: 13px;
  color: #333;
  font-family: inherit;
}

.forward-message :deep(.el-textarea__inner:focus) {
  border-color: #5c6af0;
  box-shadow: 0 0 0 2px rgba(92, 106, 240, 0.1);
}

/* 对话框页脚 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 动画效果 */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Phase 3: Practice Mode Banner Styles */
.practice-mode-banner {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  padding: 12px 20px;
  margin: 0 0 16px 0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideInDown 0.3s ease-out;
}

.practice-mode-banner :deep(.el-alert) {
  background: transparent;
  border: none;
  padding: 0;
}

.practice-mode-banner :deep(.el-alert__content) {
  display: flex;
  align-items: center;
  gap: 20px;
}

.practice-mode-banner :deep(.el-alert__icon) {
  color: #fff;
  margin-right: 0;
}

.practice-mode-content {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
  width: 100%;
}

.practice-mode-content strong {
  font-size: 15px;
  font-weight: 600;
  min-width: 150px;
  white-space: nowrap;
}

.practice-mode-content :deep(.el-progress) {
  flex: 1;
  max-width: 200px;
}

.practice-mode-content :deep(.el-progress__bar) {
  background-color: rgba(255, 255, 255, 0.3);
}

.practice-mode-content :deep(.el-progress__fill) {
  background-color: #fff;
}

.practice-mode-content :deep(.el-button) {
  padding: 5px 15px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .practice-mode-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .practice-mode-content strong {
    min-width: auto;
  }

  .practice-mode-content :deep(.el-progress) {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 960px) {
  .chat-room__container {
    padding: 16px;
  }

  .qq-header-right {
    display: none;
  }
}
</style>
