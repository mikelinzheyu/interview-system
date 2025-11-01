# Phase 7C: ChatRoom Integration Guide

This document provides the complete integration code for Phase 7C (Message Collection & Marking) into ChatRoom.vue.

## 1. Imports Section (Add to line ~227)

```javascript
// Phase 7C: Message Collection & Marking Services
import { useMessageCollection } from '@/services/messageCollectionService'
import { useMessageMarking } from '@/services/messageMarkingService'

// Phase 7C: Modal & Panel Components
import MessageCollectionPanel from '@/components/chat/MessageCollectionPanel.vue'
import MessageMarkingPanel from '@/components/chat/MessageMarkingPanel.vue'
import CollectionDetailModal from '@/components/chat/CollectionDetailModal.vue'
```

## 2. Service Initialization (Add to line ~302)

After the Phase 7B initialization block:

```javascript
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

// UI state for collection & marking panels
const showCollectionPanel = ref(false)
const showMarkingPanel = ref(false)
const selectedCollection = ref(null)
const showCollectionDetailModal = ref(false)
const tagStatistics = computed(() => getTagStatistics())
```

## 3. OnMounted Hook Enhancement (Add to line ~384)

Add these lines after `startRecallTimeMonitor()`:

```javascript
  // Phase 7C: Initialize marking service and load data
  initializeMarking()
  loadCollectionsFromLocalStorage()

  // Phase 7C: Start periodic sync with server
  const collectionSyncInterval = setInterval(() => {
    syncCollectionsWithServer()
  }, 30000) // Sync every 30 seconds

  // Store interval ID for cleanup
  window.__collectionSyncInterval = collectionSyncInterval
```

## 4. OnBeforeUnmount Hook Enhancement (Add to line ~405)

Add these lines before the existing cleanup:

```javascript
  // Phase 7C: Clean up collection/marking services
  if (window.__collectionSyncInterval) {
    clearInterval(window.__collectionSyncInterval)
  }
  cleanupCollections()
  cleanupMarking()
```

## 5. New Event Handlers (Add before or after existing handlers)

```javascript
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
```

## 6. Message Action Handler Integration

Modify or enhance the existing `handleMessageAction` function to include collection/marking:

```javascript
function handleMessageAction(action, message) {
  if (!message) return

  switch (action) {
    case 'reply':
      handleReply(message)
      break
    case 'edit':
      handleEditMessage(message)
      break
    case 'recall':
      handleRecallMessage(message)
      break
    case 'collect':
      if (isCollected(message.id)) {
        handleUncollectMessage(message.id)
      } else {
        handleCollectMessage(message.id)
      }
      break
    case 'mark':
      // Pass mark type from action.markType if available
      handleMarkMessage(message.id, action.markType || 'important')
      break
    // ... handle other actions
  }
}
```

## 7. Template UI Integration

Add these panel/modal components to the template (before closing `</div>` of chat-room):

```vue
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
```

## 8. MessageBubble Props Enhancement

Modify the `<MessageBubble>` component prop passing to include:

```vue
<MessageBubble
  :message="message"
  :is-group-chat="isGroupChat"
  :current-user-avatar="userStore.user?.avatar"
  :is-collected="isCollected(message.id)"
  :mark-badges="getMessageMarks(message.id)"
  :message-tags="getMessageTags(message.id)"
  @collect="handleCollectMessage(message.id)"
  @mark="(markType) => handleMarkMessage(message.id, markType)"
  @unmark="(markType) => handleUnmarkMessage(message.id, markType)"
/>
```

## 9. WebSocket Event Handlers (Optional)

Add handlers for real-time collection/marking updates:

```javascript
/**
 * Handle WebSocket collection events from other users
 */
function handleCollectionEvent(event) {
  if (event.type === 'collection-added') {
    ElMessage.info(`${event.userName} 收藏了一条消息`)
  } else if (event.type === 'collection-removed') {
    ElMessage.info(`${event.userName} 取消了一条收藏`)
  }
}

/**
 * Handle WebSocket marking events from other users
 */
function handleMarkingEvent(event) {
  if (event.type === 'mark-added') {
    ElMessage.info(`${event.userName} 标记了一条消息`)
  } else if (event.type === 'mark-removed') {
    ElMessage.info(`${event.userName} 取消了消息标记`)
  }
}

// In bindSocketEvents():
// socketService.on('collection-event', handleCollectionEvent)
// socketService.on('marking-event', handleMarkingEvent)
```

## Summary of Changes

- **Imports**: 5 new imports for services and components
- **State**: 11 new reactive variables and computed properties
- **Lifecycle Hooks**: Enhanced onMounted and onBeforeUnmount
- **Event Handlers**: 16 new handler functions
- **Template**: 3 new drawer/modal components
- **Enhancements**: MessageBubble prop integration

Total Lines Added: ~120 lines (matching the integration estimate)
