<template>
  <div class="chat-room page">
    <TopToolbar v-if="activeConversation" :room="activeConversation" @menu="handleTopMenu" />

    <div class="chat-container">
      <!-- 左侧：对话列表 -->
      <ConversationList
        :conversations="allConversations"
        :active-conversation-id="store.activeConversationId"
        :all-users="activeParticipants"
        @select-conversation="handleSelectConversation"
        @create-channel="handleCreateChannel"
        @create-dm="handleCreateDM"
      />

      <!-- 中间：主聊天区域 -->
      <div class="chat-main">
        <MessageListNew
          :messages="uiMessages"
          :loading="messagesLoading"
          :typing-users="typingUsers"
          :has-more="hasMore"
          @load-more="handleLoadMore"
          @message-action="handleMessageAction"
          @scroll="handleScroll"
        />

        <div v-if="replyingTo" class="reply-box">
          <div class="reply-content">
            <span class="reply-label">回复 {{ replyingTo.senderName }}</span>
            <div class="reply-text">{{ replyingTo.content }}</div>
            <el-button text size="small" type="danger" @click="replyingTo = null">取消</el-button>
          </div>
        </div>

        <MessageInputNew
          :disabled="!activeConversation"
          :is-connected="isConnected"
          :room-id="String(routeRoomId)"
          :typing-users="typingUsers"
          @send="handleSend"
          @upload="handleUpload"
          @typing="handleTyping"
        />
      </div>

      <RightSidebar
        v-if="showSidebar && activeConversation"
        :room="activeConversation"
        :members="activeParticipants"
        @member-click="handleMemberClick"
        @close="showSidebar = false"
      />
    </div>

    <el-drawer v-model="showSearchPanel" title="高级搜索" :size="searchPanelWidth">
      <AdvancedSearchPanel
        :messages="store.activeMessages"
        :conversation-id="String(store.activeConversationId || '')"
        :senders="activeParticipants"
        @message-found="handleSearchMessageFound"
        @forward-message="handleSearchForwardMessage"
        @collect-message="handleSearchCollectMessage"
      />
    </el-drawer>

    <el-dialog v-model="showForwardDialog" title="转发消息" width="520px">
      <div class="forward-dialog">
        <div v-if="forwardingMessage" class="forward-preview">
          <div class="preview-header">原消息</div>
          <div class="preview-body">
            <strong>{{ forwardingMessage.senderName }}:</strong>
            <span>{{ forwardingMessage.content }}</span>
          </div>
        </div>

        <div class="forward-targets">
          <div class="targets-header">选择转发目标</div>
          <div class="conversation-list">
            <div
              v-for="conv in allConversations"
              :key="conv.id"
              class="conversation-item"
              :class="{ selected: selectedForwardTarget && selectedForwardTarget.id === conv.id }"
              @click="selectedForwardTarget = conv"
            >
              <el-avatar :size="28" :src="conv.avatar">{{ conv.name?.charAt(0) || '?' }}</el-avatar>
              <div class="conv-info">
                <div class="conv-name">{{ conv.name }}</div>
                <div class="conv-meta">{{ conv.memberCount || 0 }} 人</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showForwardDialog = false">取消</el-button>
          <el-button type="primary" :disabled="!selectedForwardTarget" :loading="forwardLoading" @click="handleConfirmForward">确认转发</el-button>
        </div>
      </template>
    </el-dialog>

    <ContextMenu
      v-if="showContextMenu"
      :position="contextMenuPosition"
      :items="contextMenuItems"
      @select="handleContextMenuSelect"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import MessageListNew from '@/components/chat/MessageListNew.vue'
import MessageInputNew from '@/components/chat/MessageInputNew.vue'
import ConversationList from '@/components/chat/LeftSidebar/ConversationList.vue'
import RightSidebar from '@/components/chat/RightSidebar.vue'
import AdvancedSearchPanel from '@/components/chat/Search/AdvancedSearchPanel.vue'
import ContextMenu from '@/components/chat/ContextMenu.vue'
import TopToolbar from '@/components/chat/TopToolbar.vue'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import ChatSocketService from '@/utils/ChatSocketService'
import { useMessageMarking } from '@/services/messageMarkingService'

const route = useRoute()
const store = useChatWorkspaceStore()
const { markMessage, unmarkMessage, getMessageMarks } = useMessageMarking()

const routeRoomId = computed(() => {
  const id = route.params.roomId
  const num = Number(id)
  return Number.isFinite(num) ? num : id
})

const activeConversation = computed(() => store.activeConversation)
const typingUsers = computed(() => store.activeTypingUsers)
const activeParticipants = computed(() => store.activeParticipants)
const hasMore = computed(() => store.activeHasMore)
const messagesLoading = computed(() => {
  const id = store.activeConversationId
  return id ? Boolean(store.messageLoadingMap[id]) : false
})

const uiMessages = computed(() => {
  const items = store.activeMessages || []
  return items.map((m) => {
    const type = (() => {
      const t = (m.contentType || '').toLowerCase()
      if (t === 'attachment' || (m.attachments && m.attachments.length)) {
        const first = m.attachments && m.attachments[0]
        if (first && (first.type || '').startsWith('image/')) return 'image'
        return 'file'
      }
      return t || 'text'
    })()

    const attachments = Array.isArray(m.attachments)
      ? m.attachments.map((a) => ({ id: a.id, url: a.url || a.previewUrl, fileName: a.name, fileSize: a.size }))
      : []

    return {
      id: m.id,
      content: m.content,
      type,
      attachments,
      senderId: m.senderId,
      senderName: m.senderName,
      senderAvatar: m.senderAvatar,
      isOwn: Boolean(m.isOwn),
      status: m.status || 'delivered',
      timestamp: m.createdAt || m.timestamp || new Date().toISOString()
    }
  })
})

const isConnected = computed(() => ChatSocketService.connectionState?.isConnected ?? true)

// UI state
const showSidebar = ref(false)
const showSearchPanel = ref(false)
const searchPanelWidth = '40%'
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuItems = ref([])
const contextMenuMessage = ref(null)
const forwardingMessage = ref(null)
const showForwardDialog = ref(false)
const selectedForwardTarget = ref(null)
const forwardLoading = ref(false)
const replyingTo = ref(null)

const allConversations = computed(() => store.conversations || [])

async function initialize() {
  const id = routeRoomId.value
  store.activeConversationId = id
  await store.ensureConversation(id)
  try { await store.fetchConversations() } catch {}
  try {
    if (!ChatSocketService.connectionState.isConnected && !ChatSocketService.connectionState.isConnecting) {
      await ChatSocketService.connect(store.currentUserId?.value || 1)
    }
  } catch {}
}

onMounted(() => { initialize() })

watch(() => routeRoomId.value, async (newId, oldId) => {
  if (newId !== oldId) {
    store.activeConversationId = newId
    await store.ensureConversation(newId)
  }
})

function handleLoadMore() {
  const id = store.activeConversationId
  if (id) store.loadOlderMessages(id)
}

function handleMessageAction(payload) {
  const { message, position } = payload
  contextMenuMessage.value = message
  contextMenuPosition.value = position || { x: 0, y: 0 }
  contextMenuItems.value = [
    { action: 'reply', label: '回复' },
    { action: 'forward', label: '转发' },
    { action: 'copy', label: '复制' },
    { action: 'divider', label: '', divider: true },
    { action: 'mark-important', label: '标记为重要' },
    { action: 'mark-todo', label: '标记为待办' },
    { action: 'unmark-all', label: '取消所有标记' },
    { action: 'divider', label: '', divider: true },
    { action: 'delete', label: '删除', danger: true }
  ]
  showContextMenu.value = true
}

function handleScroll() { }

async function handleSend(content) {
  const id = store.activeConversationId
  if (!id) return
  try {
    const text = replyingTo.value ? `回复 ${replyingTo.value.senderName}: ${replyingTo.value.content}\n${content}` : content
    await store.sendMessage(id, text)
    replyingTo.value = null
  } catch {}
}

function handleUpload(files) {
  const id = store.activeConversationId
  if (!id || !files?.length) return
  files.forEach((f) => store.createAttachmentPlaceholder(id, f))
}

function handleTyping(isTyping) {
  const id = store.activeConversationId
  if (!id) return
  store.notifyTyping(id, isTyping)
}

function handleTopMenu(action) {
  if (action === 'search') showSearchPanel.value = true
  else if (action === 'info') showSidebar.value = !showSidebar.value
}

function handleSelectConversation(conversationId) {
  store.activeConversationId = conversationId
  store.ensureConversation(conversationId)
}

function handleCreateChannel(channelData) {
  const channel = {
    id: Date.now(),
    name: channelData.name,
    description: channelData.description,
    type: 'channel',
    memberCount: 1,
    createdAt: new Date().toISOString()
  }
  store.conversations.push(channel)
  handleSelectConversation(channel.id)
}

function handleCreateDM(userId) {
  const user = activeParticipants.value.find(u => u.id === userId)
  if (!user) return
  const dm = {
    id: `dm_${userId}`,
    name: user.name,
    avatar: user.avatar,
    type: 'dm',
    participantId: userId,
    participantCount: 2,
    createdAt: new Date().toISOString()
  }
  const existing = store.conversations.find(c => c.participantId === userId)
  if (!existing) {
    store.conversations.push(dm)
  }
  handleSelectConversation(dm.id)
}

function handleMemberClick(member) { console.log('member-click', member) }

function closeContextMenu() { showContextMenu.value = false; contextMenuItems.value = [] }

async function handleContextMenuSelect(action) {
  const id = store.activeConversationId
  const msg = contextMenuMessage.value
  if (!id || !msg) return
  switch (action) {
    case 'reply': replyingTo.value = msg; break
    case 'forward': forwardingMessage.value = msg; selectedForwardTarget.value = null; showForwardDialog.value = true; break
    case 'copy': try { await navigator.clipboard.writeText(msg.content || '') } catch {}; break
    case 'mark-important': markMessage(msg.id, 'important'); break
    case 'mark-todo': markMessage(msg.id, 'todo'); break
    case 'unmark-all': (getMessageMarks(msg.id) || []).forEach(t => unmarkMessage(msg.id, t)); break
    case 'delete': try { await store.removeMessage(id, msg.id) } catch {}; break
  }
  closeContextMenu()
}

async function handleConfirmForward() {
  if (!selectedForwardTarget.value || !forwardingMessage.value) return
  forwardLoading.value = true
  try {
    const targetId = selectedForwardTarget.value.id
    const origin = forwardingMessage.value
    const text = `【转发】${origin.senderName}: ${origin.content}`
    await store.sendMessage(targetId, text)
    showForwardDialog.value = false
    forwardingMessage.value = null
    selectedForwardTarget.value = null
  } finally { forwardLoading.value = false }
}

function handleSearchMessageFound(result) {
  if (result.conversationId && result.conversationId !== store.activeConversationId) {
    store.activeConversationId = result.conversationId
    store.ensureConversation(result.conversationId)
  }
}

function handleSearchForwardMessage(result) {
  forwardingMessage.value = { id: result.id, senderName: result.senderName, content: result.content }
  selectedForwardTarget.value = null
  showForwardDialog.value = true
}

function handleSearchCollectMessage(result) { console.log('collect from search', result) }
</script>

<style scoped>
.chat-room.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg, #ffffff);
  color: var(--color-text, #333);
}

.chat-container {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  background: var(--color-bg, #ffffff);
  flex: 1;
  overflow: hidden;
}

.chat-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: calc(100vh - 120px);
  max-width: 100%;
  padding: 12px 12px 24px 12px;
  background: var(--color-bg, #ffffff);
  border-left: 1px solid var(--color-border, #e0e0e0);
  border-right: 1px solid var(--color-border, #e0e0e0);
}

.reply-box {
  padding: 8px 12px;
  margin: 0 12px 8px 12px;
  background: var(--color-bg-secondary, #f5f7fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.reply-content {
  display: flex;
  gap: 8px;
  align-items: center;
}

.reply-label {
  font-weight: 600;
  color: var(--color-text-secondary, #606266);
}

.reply-text {
  color: var(--color-text-tertiary, #909399);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forward-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forward-preview {
  padding: 8px;
  background: var(--color-bg-secondary, #f5f7fa);
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
}

.preview-header {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text, #333);
}

.forward-targets {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.targets-header {
  font-weight: 600;
  color: var(--color-text-secondary, #606266);
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #f0f0f0);
  cursor: pointer;
  color: var(--color-text, #333);
  transition: all 0.2s;
}

.conversation-item.selected {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.08);
}

.conversation-item:hover {
  background: var(--color-bg-secondary, #f5f5f5);
}

.conv-info {
  display: flex;
  flex-direction: column;
}

.conv-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #333);
}

.conv-meta {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

/* 响应式 - 隐藏侧栏当屏幕太小 */
@media (max-width: 1400px) {
  .chat-container {
    grid-template-columns: 240px 1fr 240px;
  }
}

@media (max-width: 1200px) {
  .chat-container {
    grid-template-columns: 1fr 240px;
  }

  .chat-main {
    border-left: none;
  }
}

@media (max-width: 768px) {
  .chat-container {
    grid-template-columns: 1fr;
  }

  .chat-main {
    border-right: none;
  }
}
</style>

