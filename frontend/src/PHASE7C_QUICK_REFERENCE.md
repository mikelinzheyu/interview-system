# Phase 7C: Quick Reference Guide

## File Locations

```
Services:
  - frontend/src/services/messageCollectionService.js
  - frontend/src/services/messageMarkingService.js

Components:
  - frontend/src/components/chat/MessageCollectionPanel.vue
  - frontend/src/components/chat/MessageMarkingPanel.vue
  - frontend/src/components/chat/CollectionDetailModal.vue
  - frontend/src/components/chat/TagManagementModal.vue

Tests:
  - frontend/src/__tests__/services/messageCollectionService.spec.js
  - frontend/src/__tests__/services/messageMarkingService.spec.js

Integration:
  - frontend/src/views/chat/CHATROOM_INTEGRATION_PHASE7C.md
  - frontend/src/views/chat/ChatRoom.vue (needs integration)
  - frontend/src/components/chat/MessageBubble.vue (needs enhancement)

Documentation:
  - frontend/src/PHASE7C_COMPLETE_SUMMARY.md
  - frontend/src/PHASE7C_QUICK_REFERENCE.md (this file)
```

## Key Imports

```javascript
import { useMessageCollection } from '@/services/messageCollectionService'
import { useMessageMarking } from '@/services/messageMarkingService'
import MessageCollectionPanel from '@/components/chat/MessageCollectionPanel.vue'
import MessageMarkingPanel from '@/components/chat/MessageMarkingPanel.vue'
import CollectionDetailModal from '@/components/chat/CollectionDetailModal.vue'
import TagManagementModal from '@/components/chat/TagManagementModal.vue'
```

## Service APIs

### Message Collection

```javascript
const {
  // State
  collections,           // Map of collections
  collectionCount,       // Computed count
  hasPendingSyncs,       // Pending sync status

  // Core operations
  collectMessage(messageId, conversationId, message)
  uncollectMessage(messageId)
  isCollected(messageId)

  // Retrieval
  getCollections(filter)  // Filter: type, keyword, date, tags, senderId, sortBy
  getCollection(messageId)

  // Management
  updateCollectionNote(messageId, note)
  addCollectionTag(messageId, tag)
  removeCollectionTag(messageId, tag)

  // Batch operations
  batchUncollect(messageIds)
  clearCollections()

  // Storage
  saveToLocalStorage()
  loadFromLocalStorage()
  syncWithServer()

  // Events
  handleCollectionEvent(event)
  cleanup()
} = useMessageCollection()
```

### Message Marking

```javascript
const {
  // State
  marks,                 // Map of marks
  tags,                  // Array of tags
  totalMarkedMessages,   // Computed count
  totalTags,             // Computed count

  // Mark operations
  markMessage(messageId, markType)     // Toggle important/urgent/todo/done
  unmarkMessage(messageId, markType)
  hasMarkType(messageId, markType)
  getMessageMarks(messageId)           // Get array of active marks
  getMarkedMessages(markType)          // Get all messages with mark
  getMarkStatistics()                  // Get counts per type

  // Tag operations
  addTag(messageId, tag)
  removeTag(messageId, tagId)
  getMessageTags(messageId)

  // Tag CRUD
  createTag(name, color, icon = 'tag')
  updateTag(tagId, name, color)
  deleteTag(tagId)                     // Cascades to all messages
  getTags()
  getTagStatistics()                   // Get usage per tag

  // Storage
  saveToLocalStorage()
  loadFromLocalStorage()
  saveTagsToLocalStorage()
  loadTagsFromLocalStorage()

  // Events & lifecycle
  handleMarkingEvent(event)
  initialize()
  cleanup()
} = useMessageMarking()
```

## Common Tasks

### Collect a Message

```javascript
const message = store.getMessageById(messageId)
const success = await collectMessage(messageId, conversationId, {
  content: message.content,
  type: message.type || 'text',
  senderName: message.senderName,
  senderId: message.senderId,
  attachments: message.attachments || [],
  editCount: message.editCount || 0
})

if (success) {
  ElMessage.success('已收藏消息')
}
```

### Search Collections

```javascript
const results = getCollections({
  keyword: 'important',
  type: 'text',
  sortBy: 'recent'
})
```

### Mark a Message

```javascript
const success = markMessage('msg123', 'important')
// Toggle: marking twice removes the mark

if (success) {
  ElMessage.success('已标记')
}
```

### Create Custom Tag

```javascript
const newTag = createTag('会议', '#409EFF')
if (newTag) {
  // Tag created successfully
  // Can now add to messages
  addTag('msg123', newTag)
}
```

### Add Tag to Marked Message

```javascript
const tag = tags.find(t => t.name === '工作')
if (tag) {
  const success = addTag('msg123', tag)
  if (success) {
    ElMessage.success('标签已添加')
  }
}
```

### Get Mark Statistics

```javascript
const stats = getMarkStatistics()
console.log(stats)
// { important: 5, urgent: 3, todo: 2, done: 1 }
```

## Component Usage

### MessageCollectionPanel

```vue
<MessageCollectionPanel
  :collections="getCollections()"
  @view="handleViewCollection"
  @delete="handleDeleteCollection"
  @update-note="handleUpdateCollectionNote"
/>
```

### MessageMarkingPanel

```vue
<MessageMarkingPanel
  :marks="marks"
  :tags="tags"
  :tag-statistics="getTagStatistics()"
  @mark="handleMarkMessage"
  @unmark="handleUnmarkMessage"
  @add-tag="handleAddTagToMessage"
  @remove-tag="handleRemoveMessageTag"
  @create-tag="handleCreateTag"
  @update-tag="handleUpdateTag"
  @delete-tag="handleDeleteTag"
/>
```

### CollectionDetailModal

```vue
<CollectionDetailModal
  :visible="showModal"
  :collection="selectedCollection"
  @close="showModal = false"
  @update-note="updateCollectionNote"
  @delete-collection="uncollectMessage"
  @view-original="navigateToMessage"
/>
```

### TagManagementModal

```vue
<TagManagementModal
  :visible="showTagModal"
  :tags="tags"
  :tag-statistics="getTagStatistics()"
  @close="showTagModal = false"
  @create-tag="createTag"
  @update-tag="updateTag"
  @delete-tag="deleteTag"
/>
```

## Data Structures

### CollectionRecord

```javascript
{
  id: 'collection_1634...9123',
  messageId: 'msg123',
  conversationId: 'conv456',
  messageContent: 'Hello world',
  messageType: 'text',
  senderName: 'John Doe',
  senderId: 'user789',
  collectedAt: 1699999999999,
  collectedBy: 'currentUserId',
  notes: 'Important meeting',
  tags: ['会议', '紧急'],
  metadata: {
    type: 'text',
    attachments: [],
    quoted: null,
    editCount: 0,
    isRecalled: false
  },
  updatedAt: 1699999999999
}
```

### MarkRecord

```javascript
{
  messageId: 'msg123',
  marks: {
    important: true,
    urgent: false,
    todo: true,
    done: false
  },
  tags: [
    { id: 'tag_123', name: '工作', color: '#409EFF' }
  ],
  createdAt: 1699999999999,
  updatedAt: 1699999999999
}
```

### Tag

```javascript
{
  id: 'tag_1634...',
  name: '工作',
  color: '#409EFF',
  icon: 'briefcase',
  createdAt: 1699999999999,
  updatedAt: 1699999999999
}
```

## Filter Examples

### Get Recently Collected Important Messages

```javascript
getCollections({
  keyword: 'important',
  sortBy: 'recent'
})
```

### Get Collections from Specific User

```javascript
getCollections({
  senderId: 'user123',
  sortBy: 'oldest'
})
```

### Get Collections with Multiple Tags

```javascript
getCollections({
  tags: ['会议', '重要'],
  sortBy: 'recent'
})
```

### Search by Date Range

```javascript
getCollections({
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,  // Last 7 days
  endDate: Date.now(),
  sortBy: 'recent'
})
```

## Storage Keys

```javascript
// localStorage keys
'message_collections'  // Collections data
'message_marks'        // Marks and tags data
'message_tags'         // Tag definitions
```

## Event Types

### WebSocket Events

```javascript
// Collection events
{
  messageId: 'msg123',
  type: 'collection-added' | 'collection-removed',
  data: { ... }
}

// Marking events
{
  messageId: 'msg123',
  type: 'mark-added' | 'mark-removed',
  data: { markType: 'important', ... }
}

// Tag events
{
  messageId: 'msg123',
  type: 'tag-added' | 'tag-removed',
  data: { tag: { ... } }
}
```

## Configuration

### Collection Config

```javascript
{
  STORAGE_KEY: 'message_collections',
  MAX_COLLECTIONS: 1000,
  SYNC_INTERVAL: 30000  // 30 seconds
}
```

### Marking Config

```javascript
{
  STORAGE_KEY: 'message_marks',
  TAGS_STORAGE_KEY: 'message_tags',
  MARK_TYPES: ['important', 'urgent', 'todo', 'done'],
  DEFAULT_TAGS: [
    { id: 'tag_work', name: '工作', color: '#409EFF', icon: 'briefcase' },
    { id: 'tag_personal', name: '个人', color: '#67C23A', icon: 'user' },
    { id: 'tag_urgent', name: '紧急', color: '#F56C6C', icon: 'warning' },
    { id: 'tag_important', name: '重要', color: '#E6A23C', icon: 'star' }
  ]
}
```

## Troubleshooting

### Collections Not Persisting

Check localStorage availability:
```javascript
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
} catch (e) {
  console.error('localStorage not available')
}
```

### Marks Not Syncing

Check WebSocket connection:
```javascript
if (socketService.isConnected()) {
  syncCollectionsWithServer()
}
```

### Tags Not Appearing

Ensure initialization:
```javascript
service.initialize()  // Load default tags
```

## Testing

```bash
# Run collection tests
npm run test -- messageCollectionService.spec.js

# Run marking tests
npm run test -- messageMarkingService.spec.js

# Run with coverage
npm run test:coverage -- --include='messageCollection*','messageMarking*'
```

## Integration Checklist

- [ ] Import services in ChatRoom.vue
- [ ] Initialize services on mount
- [ ] Add UI state variables
- [ ] Add event handlers (16 functions)
- [ ] Add drawer/modal components to template
- [ ] Connect message action handlers
- [ ] Update MessageBubble props
- [ ] Test collection operations
- [ ] Test marking operations
- [ ] Test WebSocket sync
- [ ] Verify localStorage persistence
- [ ] Test UI interactions

## Performance Tips

1. **Pagination**: Use 20 items per page for large collections
2. **Search**: Debounce search input (300ms)
3. **Filtering**: Apply client-side filters (fast)
4. **Virtual Scrolling**: Implement for 500+ items
5. **Batch Operations**: Use batchUncollect() for multiple deletes
6. **Sync Timing**: Increase interval in high-traffic scenarios

## Next Steps

1. **Phase 7D**: Implement remaining features (based on roadmap)
2. **Backend Integration**: Add server-side persistence
3. **Cloud Sync**: Implement cross-device synchronization
4. **Analytics**: Track collection/marking usage
5. **Performance**: Optimize for large datasets

---

**Quick Links**:
- [Full Documentation](./PHASE7C_COMPLETE_SUMMARY.md)
- [Integration Guide](../views/chat/CHATROOM_INTEGRATION_PHASE7C.md)
- [Service Tests](../../__tests__/services/)
