# QQ 风格聊天中心 - 完整实现指南

## 目录
1. [消息搜索功能](#消息搜索功能)
2. [用户在线状态管理](#用户在线状态管理)
3. [消息编辑和撤回](#消息编辑和撤回)
4. [文件上传和下载](#文件上传和下载)
5. [引用消息功能](#引用消息功能)

---

## 消息搜索功能

### 功能描述
实现全局消息搜索，包括：
- 关键词搜索消息内容
- 按发送者筛选
- 按时间范围筛选
- 搜索结果高亮展示

### 前端实现

#### 1. 创建搜索服务 (`frontend/src/services/messageSearchService.js`)

```javascript
/**
 * 消息搜索服务
 */

export class MessageSearchService {
  constructor() {
    this.searchCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 全局搜索消息
   * @param {string} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>}
   */
  async searchMessages(keyword, options = {}) {
    const cacheKey = this._getCacheKey(keyword, options)

    // 检查缓存
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      // 本地搜索（优先）
      const localResults = this._searchLocal(keyword, options)
      if (localResults.length > 0) {
        this._updateCache(cacheKey, localResults)
        return localResults
      }

      // 从服务器搜索
      const results = await this._searchRemote(keyword, options)
      this._updateCache(cacheKey, results)
      return results
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }

  /**
   * 本地搜索（在已加载的消息中搜索）
   */
  _searchLocal(keyword, options = {}) {
    if (!keyword?.trim()) return []

    const query = keyword.toLowerCase()
    const results = []

    // 从所有对话中搜索
    options.conversations?.forEach((conversation) => {
      const messages = options.messages?.[conversation.id] || []
      messages.forEach((msg) => {
        if (
          msg.content?.toLowerCase().includes(query) &&
          (!options.senderId || msg.senderId === options.senderId) &&
          this._isInDateRange(msg.createdAt, options.dateRange)
        ) {
          results.push({
            ...msg,
            conversationId: conversation.id,
            conversationName: conversation.name,
            highlight: this._highlightKeyword(msg.content, query)
          })
        }
      })
    })

    // 按时间倒序排列
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return results
  }

  /**
   * 远程搜索（从服务器搜索）
   */
  async _searchRemote(keyword, options = {}) {
    const response = await fetch('/api/chat/messages/search', {
      method: 'GET',
      params: {
        q: keyword,
        senderId: options.senderId,
        startDate: options.dateRange?.[0],
        endDate: options.dateRange?.[1],
        limit: options.limit || 50
      }
    })
    return response.data?.items || []
  }

  /**
   * 检查消息是否在日期范围内
   */
  _isInDateRange(messageDate, dateRange) {
    if (!dateRange) return true
    const [start, end] = dateRange
    const msgTime = new Date(messageDate).getTime()
    return msgTime >= start.getTime() && msgTime <= end.getTime()
  }

  /**
   * 高亮关键词
   */
  _highlightKeyword(text, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  /**
   * 生成缓存键
   */
  _getCacheKey(keyword, options) {
    return `${keyword}:${JSON.stringify(options)}`
  }

  /**
   * 更新缓存
   */
  _updateCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.searchCache.clear()
  }
}

export default new MessageSearchService()
```

#### 2. 创建搜索页面组件 (`frontend/src/views/chat/ChatSearch.vue`)

```vue
<template>
  <div class="chat-search">
    <!-- 搜索条件 -->
    <div class="chat-search__filters">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索消息内容..."
        clearable
        :prefix-icon="Search"
        @input="handleSearch"
        @keyup.enter="performSearch"
      />

      <el-select
        v-model="selectedConversation"
        placeholder="所有对话"
        clearable
        filterable
        @change="performSearch"
      >
        <el-option
          v-for="conversation in conversations"
          :key="conversation.id"
          :label="conversation.name"
          :value="conversation.id"
        />
      </el-select>

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="performSearch"
      />
    </div>

    <!-- 搜索结果 -->
    <div class="chat-search__results">
      <div v-if="loading" class="chat-search__loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="searchResults.length === 0" class="chat-search__empty">
        <el-empty
          :description="searchKeyword ? '未找到匹配的消息' : '输入关键词开始搜索'"
          :image-size="60"
        />
      </div>

      <div v-else class="chat-search__list">
        <div
          v-for="(result, idx) in searchResults"
          :key="idx"
          class="chat-search__item"
          @click="handleResultClick(result)"
        >
          <!-- 对话信息 -->
          <div class="chat-search__item-conversation">
            <el-avatar
              :size="40"
              :src="getConversationAvatar(result.conversationId)"
            >
              {{ result.conversationName?.slice(0, 1) || '?' }}
            </el-avatar>
            <div>
              <div class="chat-search__item-name">
                {{ result.conversationName }}
              </div>
              <div class="chat-search__item-time">
                {{ formatTime(result.createdAt) }}
              </div>
            </div>
          </div>

          <!-- 消息预览 -->
          <div class="chat-search__item-preview">
            <div class="chat-search__item-sender">
              {{ result.senderName }}
            </div>
            <div class="chat-search__item-content" v-html="result.highlight || result.content" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import messageSearchService from '@/services/messageSearchService'

const router = useRouter()
const store = useChatWorkspaceStore()

const searchKeyword = ref('')
const selectedConversation = ref(null)
const dateRange = ref([])
const searchResults = ref([])
const loading = ref(false)
const searchTimeout = ref(null)

const conversations = computed(() => store.conversations)

async function handleSearch(value) {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)

  searchTimeout.value = setTimeout(() => {
    performSearch()
  }, 500)
}

async function performSearch() {
  if (!searchKeyword.value?.trim()) {
    searchResults.value = []
    return
  }

  loading.value = true
  try {
    searchResults.value = await messageSearchService.searchMessages(
      searchKeyword.value,
      {
        conversations: conversations.value,
        messages: store.messagesMap,
        conversationId: selectedConversation.value,
        dateRange: dateRange.value.length === 2 ? dateRange.value : null
      }
    )
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    loading.value = false
  }
}

function handleResultClick(result) {
  // 导航到对话，自动定位到该消息
  router.push({
    name: 'ChatRoom',
    params: { roomId: result.conversationId },
    query: { messageId: result.id }
  })
}

function getConversationAvatar(conversationId) {
  const conversation = conversations.value.find((c) => c.id === conversationId)
  return conversation?.avatar || ''
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

onMounted(() => {
  if (!store.conversationsLoaded) {
    store.fetchConversations()
  }
})
</script>

<style scoped>
.chat-search {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding: 16px;
}

.chat-search__filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.chat-search__filters > * {
  flex: 1;
  min-width: 200px;
}

.chat-search__results {
  flex: 1;
  overflow-y: auto;
}

.chat-search__loading,
.chat-search__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.chat-search__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-search__item {
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chat-search__item:hover {
  background: rgba(0, 0, 0, 0.02);
  border-color: var(--el-color-primary);
}

.chat-search__item-conversation {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.chat-search__item-name {
  font-weight: 500;
  color: #333;
}

.chat-search__item-time {
  font-size: 12px;
  color: #999;
}

.chat-search__item-preview {
  padding-left: 52px;
}

.chat-search__item-sender {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.chat-search__item-content {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.chat-search__item-content ::v-deep mark {
  background: #ffeb3b;
  padding: 2px 4px;
  border-radius: 2px;
}
</style>
```

#### 3. 在 router 中添加路由

```javascript
// frontend/src/router/index.js
{
  path: '/chat/search',
  name: 'ChatSearch',
  component: () => import('@/views/chat/ChatSearch.vue'),
  meta: { requiresAuth: true }
}
```

### 后端实现

#### 创建搜索 API 端点

```java
// backend/src/main/java/com/interview/interview-server/controller/ChatSearchController.java
@RestController
@RequestMapping("/api/chat/messages")
@CrossOrigin
public class ChatSearchController {

  @Autowired
  private ChatMessageService chatMessageService;

  /**
   * 搜索消息
   * @param keyword 关键词
   * @param senderId 发送者ID (可选)
   * @param startDate 开始日期 (可选)
   * @param endDate 结束日期 (可选)
   * @param limit 返回数量限制
   */
  @GetMapping("/search")
  public ResponseEntity<?> searchMessages(
    @RequestParam String keyword,
    @RequestParam(required = false) Long senderId,
    @RequestParam(required = false) LocalDateTime startDate,
    @RequestParam(required = false) LocalDateTime endDate,
    @RequestParam(defaultValue = "50") Integer limit
  ) {
    try {
      List<ChatMessage> results = chatMessageService.searchMessages(
        keyword,
        senderId,
        startDate,
        endDate,
        limit
      );

      return ResponseEntity.ok(new ApiResponse<>(
        "success",
        ResultCode.SUCCESS.getCode(),
        Collections.singletonMap("items", results)
      ));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(new ApiResponse<>(
        "error",
        ResultCode.ERROR.getCode(),
        e.getMessage()
      ));
    }
  }
}
```

```java
// backend/src/main/java/com/interview/interview-server/service/ChatMessageService.java
@Service
public class ChatMessageService {

  @Autowired
  private ChatMessageRepository chatMessageRepository;

  /**
   * 搜索消息
   */
  public List<ChatMessage> searchMessages(
    String keyword,
    Long senderId,
    LocalDateTime startDate,
    LocalDateTime endDate,
    Integer limit
  ) {
    Specification<ChatMessage> spec = (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      // 关键词搜索
      if (keyword != null && !keyword.isEmpty()) {
        predicates.add(
          cb.like(root.get("content"), "%" + keyword + "%")
        );
      }

      // 发送者过滤
      if (senderId != null) {
        predicates.add(cb.equal(root.get("senderId"), senderId));
      }

      // 日期范围过滤
      if (startDate != null) {
        predicates.add(
          cb.greaterThanOrEqualTo(root.get("createdAt"), startDate)
        );
      }
      if (endDate != null) {
        predicates.add(
          cb.lessThanOrEqualTo(root.get("createdAt"), endDate)
        );
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };

    return chatMessageRepository.findAll(
      spec,
      PageRequest.of(0, limit, Sort.by("createdAt").descending())
    ).getContent();
  }
}
```

---

## 用户在线状态管理

### 功能描述
- 实时更新用户在线/离线状态
- 支持多种状态：online, away, busy, offline
- 自定义状态消息
- 状态变化通知

### 前端实现

#### 1. 创建用户状态 Store

```javascript
// frontend/src/stores/userStatus.js
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useUserStatusStore = defineStore('user-status', () => {
  const userStatusMap = reactive({})
  const statusUpdateTime = reactive({})

  /**
   * 更新用户状态
   */
  function updateUserStatus(userId, status, customMessage = '') {
    userStatusMap[userId] = {
      status, // online | away | busy | offline
      customMessage,
      lastUpdated: new Date()
    }
    statusUpdateTime[userId] = Date.now()
  }

  /**
   * 获取用户状态
   */
  function getUserStatus(userId) {
    return userStatusMap[userId] || { status: 'offline' }
  }

  /**
   * 批量更新用户状态
   */
  function updateMultipleUserStatus(statusMap) {
    Object.entries(statusMap).forEach(([userId, status]) => {
      updateUserStatus(userId, status)
    })
  }

  /**
   * 清空离线超过指定时间的用户状态
   */
  function cleanupOfflineStatus(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now()
    Object.entries(statusUpdateTime).forEach(([userId, lastUpdate]) => {
      if (now - lastUpdate > maxAge) {
        delete userStatusMap[userId]
        delete statusUpdateTime[userId]
      }
    })
  }

  return {
    userStatusMap,
    updateUserStatus,
    getUserStatus,
    updateMultipleUserStatus,
    cleanupOfflineStatus
  }
})
```

#### 2. 集成到 Socket 服务

```javascript
// frontend/src/utils/socket.js (增强部分)
import { useUserStatusStore } from '@/stores/userStatus'

class SocketService {
  // ... 其他代码 ...

  bindStatusEvents() {
    const statusStore = useUserStatusStore()

    // 用户上线
    this.socket.on('user-online', (data) => {
      statusStore.updateUserStatus(data.userId, 'online', data.customMessage)
      this.emit('user-status-changed', {
        userId: data.userId,
        status: 'online'
      })
    })

    // 用户离线
    this.socket.on('user-offline', (data) => {
      statusStore.updateUserStatus(data.userId, 'offline')
      this.emit('user-status-changed', {
        userId: data.userId,
        status: 'offline'
      })
    })

    // 用户状态改变
    this.socket.on('user-status-changed', (data) => {
      statusStore.updateUserStatus(
        data.userId,
        data.status,
        data.customMessage
      )
    })

    // 批量用户状态同步
    this.socket.on('users-status-sync', (data) => {
      statusStore.updateMultipleUserStatus(data.statusMap)
    })
  }

  /**
   * 更新自己的状态
   */
  setMyStatus(status, customMessage = '') {
    if (!this.socket) return

    this.socket.emit('set-status', {
      status,
      customMessage,
      timestamp: Date.now()
    })
  }
}
```

---

## 消息编辑和撤回

### 功能描述
- 消息编辑（限制时间内，如15分钟）
- 消息撤回（完全移除消息）
- 操作时间戳和操作者信息记录

### 前端实现

```javascript
// frontend/src/components/chat/MessageBubble.vue (新增方法)
async function handleEdit() {
  // 只能编辑自己发送的消息
  if (!props.message.isOwn) return

  // 检查是否超过编辑时限（比如15分钟）
  const editTimeLimit = 15 * 60 * 1000
  const timeDiff = Date.now() - new Date(props.message.createdAt).getTime()

  if (timeDiff > editTimeLimit) {
    ElMessage.warning('消息已超过编辑时限')
    return
  }

  emit('edit', props.message)
}

async function handleRecall() {
  // 检查撤回权限
  if (!props.message.isOwn && !props.canRecallOthers) {
    ElMessage.error('没有权限撤回此消息')
    return
  }

  ElMessage.confirm('确定要撤回这条消息吗？', '提示', {
    confirmButtonText: '撤回',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('recall', props.message)
    })
    .catch(() => {})
}
```

---

## 文件上传和下载

### 功能描述
- 支持多文件上传
- 显示上传进度
- 支持文件预览（图片、文档等）
- 文件下载管理

### 前端实现

```javascript
// frontend/src/services/uploadService.js
export class UploadService {
  /**
   * 上传文件
   * @param {File} file - 文件对象
   * @param {string} conversationId - 对话ID
   * @param {Function} onProgress - 进度回调
   */
  async uploadFile(file, conversationId, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversationId', conversationId)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          )
          onProgress?.(percentComplete)
        }
      })

      // 上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      // 上传失败
      xhr.addEventListener('error', () => {
        reject(new Error('Upload error'))
      })

      xhr.open('POST', '/api/chat/uploads')
      xhr.send(formData)
    })
  }

  /**
   * 下载文件
   */
  downloadFile(url, filename) {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export default new UploadService()
```

---

## 引用消息功能

### 功能描述
- 在消息中引用之前的消息
- 显示被引用消息的内容
- 点击引用消息可以跳转到原消息

### 数据模型

```typescript
interface QuotedMessage {
  id: string | number
  senderName: string
  content: string
  contentType: 'text' | 'image' | 'attachment'
  createdAt: string
}

interface ChatMessage {
  id: string | number
  conversationId: string | number
  content: string
  contentType: string
  senderId: number
  senderName: string
  senderAvatar: string
  createdAt: string
  status: 'pending' | 'delivered' | 'read' | 'failed' | 'recalled'
  quotedMessage?: QuotedMessage // 新增：被引用的消息
  attachments?: Attachment[]
  isOwn?: boolean
  isRecalled?: boolean
  // ... 其他字段
}
```

---

## 总结

通过实现以上功能，你的聊天系统将达到 QQ 级别的用户体验。关键点：

1. **搜索功能**：优先本地搜索，再向服务器查询
2. **状态管理**：使用 Socket 实时同步用户状态
3. **编辑和撤回**：设置合理的时间限制
4. **文件上传**：显示进度，支持断点续传
5. **消息引用**：增强消息可读性和可追溯性

希望本指南能帮助你成功实现这些功能！
