# 评论功能最佳实践优化方案（改进版）

## 📊 项目现状分析

### ✅ 现有优势
- 完整的 Vue 3 + Element Plus 技术栈
- 成熟的 Markdown 编辑和预览功能
- 三层缓存架构（内存、localStorage、Redis）
- 完善的权限管理系统
- 自动重试机制和错误处理
- 乐观更新模式

### ❌ 存在的痛点

| 问题 | 影响 | 优先级 |
|------|------|------|
| **无草稿自动保存** | 用户输入丢失，影响体验 | 🔴 高 |
| **无快捷键提交** | 操作效率低 | 🔴 高 |
| **网络离线无提示** | 用户无法理解为何提交失败 | 🔴 高 |
| **错误信息不具体** | 用户困惑 | 🔴 高 |
| **Markdown 预览体验差** | 频繁切换标签页，影响写作流畅度 | 🟡 中 |
| **表情选择器无分类/搜索** | 选择效率低 | 🟡 中 |
| **无 @ 提及功能** | 社交互动性不足 | 🟡 中 |
| **无虚拟滚动** | 大量评论时性能下降 | 🟢 低 |

---

## 🚀 分阶段优化方案

### 第一阶段：核心体验与稳定性（高优先级）

#### 1.1 草稿自动保存

**文件**: `frontend/src/composables/useDraft.js` (新建)

```javascript
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 草稿管理
 * @param {string} storageKey - localStorage key
 * @param {number} autosaveInterval - 自动保存间隔（毫秒），默认30秒
 */
export function useDraft(storageKey = 'comment-draft', autosaveInterval = 30000) {
  const content = ref('')
  const lastSaveTime = ref(null)
  const isSaving = ref(false)

  // 从localStorage恢复
  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { content: savedContent, timestamp } = JSON.parse(saved)
        content.value = savedContent
        lastSaveTime.value = new Date(timestamp)
        return true
      }
    } catch (error) {
      console.error('Failed to restore draft:', error)
    }
    return false
  }

  // 保存草稿
  const saveDraft = () => {
    if (!content.value.trim()) {
      localStorage.removeItem(storageKey)
      return
    }

    try {
      isSaving.value = true
      localStorage.setItem(storageKey, JSON.stringify({
        content: content.value,
        timestamp: new Date().toISOString()
      }))
      lastSaveTime.value = new Date()
    } catch (error) {
      console.error('Failed to save draft:', error)
      if (error.name === 'QuotaExceededError') {
        ElMessage.warning('本地存储已满，无法继续保存草稿')
      }
    } finally {
      isSaving.value = false
    }
  }

  // 防抖保存
  let saveTimer = null
  const debouncedSave = () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveDraft, autosaveInterval)
  }

  // 清空草稿
  const clearDraft = () => {
    content.value = ''
    localStorage.removeItem(storageKey)
    lastSaveTime.value = null
  }

  // 生命周期
  onMounted(() => {
    restoreDraft()
  })

  // 监听内容变化，自动保存
  watch(() => content.value, debouncedSave)

  // 页面关闭时保存
  if (process.client) {
    window.addEventListener('beforeunload', saveDraft)
  }

  return {
    content,
    lastSaveTime,
    isSaving,
    saveDraft,
    clearDraft,
    restoreDraft
  }
}
```

**在 CommentForm.vue 中使用**:

```vue
<script setup>
import { useDraft } from '@/composables/useDraft'

const { content, lastSaveTime, clearDraft } = useDraft(`comment-draft-post-${postId}`)

// 提交成功后清空草稿
const handleSubmitSuccess = () => {
  clearDraft()
}
</script>

<template>
  <!-- 显示草稿恢复提示 -->
  <div v-if="lastSaveTime" class="draft-hint">
    <el-icon class="draft-icon">📝</el-icon>
    <span>草稿已自动保存于 {{ lastSaveTime.toLocaleTimeString() }}</span>
  </div>
</template>
```

---

#### 1.2 快捷键支持

**在 CommentForm.vue 中添加**:

```vue
<template>
  <el-input
    ref="textareaRef"
    v-model="content"
    type="textarea"
    placeholder="写下你的评论... 支持 Markdown 格式 (Ctrl/Cmd + Enter 提交)"
    @keydown.ctrl.enter="handleKeyboardSubmit"
    @keydown.meta.enter="handleKeyboardSubmit"
  />
</template>

<script setup>
const handleKeyboardSubmit = (e) => {
  e.preventDefault()
  // 不让浏览器插入换行
  handleSubmit()
}
</script>
```

---

#### 1.3 网络状态监测与离线提示

**文件**: `frontend/src/composables/useNetworkStatus.js` (新建)

```javascript
import { ref, onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'

export function useNetworkStatus() {
  const isOnline = ref(typeof navigator !== 'undefined' && navigator.onLine)

  const handleOnline = () => {
    isOnline.value = true
    ElNotification({
      type: 'success',
      title: '网络已连接',
      message: '您的网络连接已恢复，可以继续操作',
      duration: 3000
    })
  }

  const handleOffline = () => {
    isOnline.value = false
    ElNotification({
      type: 'warning',
      title: '网络已断开',
      message: '您当前处于离线状态，请检查网络连接',
      duration: 0 // 不自动关闭，等待网络恢复
    })
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline }
}
```

**在 CommentForm.vue 中使用**:

```vue
<script setup>
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()

// 禁用提交按钮
const isSubmitDisabled = computed(() => !isOnline.value || submitting.value)
</script>

<template>
  <el-button
    type="primary"
    :disabled="isSubmitDisabled"
    @click="handleSubmit"
  >
    {{ isOnline ? '发表评论' : '网络已断开' }}
  </el-button>

  <div v-if="!isOnline" class="network-warning">
    ⚠️ 您当前处于离线状态，无法提交评论。请检查网络连接。
  </div>
</template>
```

---

#### 1.4 精细化错误处理与自动重试

**优化 useComments.js 中的 submitComment**:

```javascript
export function useComments(postId) {
  // ... 其他代码

  /**
   * 分类错误信息
   */
  const getErrorMessage = (error) => {
    const status = error.response?.status
    const message = error.message || ''

    // 根据错误类型返回用户友好的信息
    if (!navigator.onLine) {
      return '网络连接已断开，请检查后重试'
    }

    if (message === 'Network Error' || error.code === 'ECONNABORTED') {
      return '网络连接失败，系统已自动重试，请稍候'
    }

    if (status === 413) {
      return '评论内容过长，请压缩后重试'
    }

    if (status === 429) {
      return '您的操作过于频繁，请稍后再试'
    }

    if (status === 401) {
      return '您的登录已过期，请重新登录'
    }

    if (status === 403) {
      return '您没有权限发表评论'
    }

    if (status >= 500) {
      return '服务器异常，请稍后重试'
    }

    return error.message || '发表评论失败'
  }

  /**
   * 带自动重试的提交评论
   */
  const submitComment = async (content, mentions = []) => {
    if (!content.trim()) {
      error.value = '评论内容不能为空'
      return false
    }

    if (!navigator.onLine) {
      error.value = '网络连接已断开，请检查后重试'
      return false
    }

    submitLoading.value = true
    error.value = null
    let retryCount = 0
    const maxRetries = 2

    const attemptSubmit = async () => {
      try {
        const response = await communityAPI.createComment(postId, {
          content: content.trim(),
          mentions,
          parentCommentId: replyingTo.value
        })

        if (response.data) {
          // 乐观更新
          const newComment = {
            ...response.data,
            canEdit: true,
            canDelete: true,
            isLiked: false,
            likeCount: 0,
            replies: []
          }

          if (replyingTo.value) {
            const parentComment = comments.value.find(c => c.id === replyingTo.value)
            if (parentComment) {
              if (!parentComment.replies) {
                parentComment.replies = []
              }
              parentComment.replies.push(newComment)
            }
          } else {
            comments.value.unshift(newComment)
            totalComments.value++
          }

          replyingTo.value = null
          return true
        }
      } catch (err) {
        // 可重试的错误
        const isRetryable = !navigator.onLine ||
                           err.message === 'Network Error' ||
                           err.code === 'ECONNABORTED' ||
                           err.response?.status >= 500

        if (isRetryable && retryCount < maxRetries) {
          retryCount++
          // 指数退避：2s, 4s
          const delay = Math.pow(2, retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return attemptSubmit()
        }

        error.value = getErrorMessage(err)
        console.error('Failed to submit comment:', err)
        return false
      }
    }

    const success = await attemptSubmit()
    submitLoading.value = false
    return success
  }

  return {
    // ... 其他返回值
    submitComment,
    getErrorMessage
  }
}
```

**在 CommentForm.vue 中显示详细错误**:

```vue
<template>
  <!-- 错误提示区域 -->
  <div v-if="error" class="error-container">
    <el-alert
      :title="error"
      type="error"
      :closable="false"
      show-icon
    >
      <template #default>
        {{ error }}
        <el-button
          v-if="isSubmitDisabled && isOnline"
          link
          type="primary"
          @click="handleSubmit"
          style="margin-left: 12px;"
        >
          重试
        </el-button>
      </template>
    </el-alert>
  </div>
</template>
```

---

#### 1.5 XSS 防护加固

**优化 MarkdownPreview.vue**:

```vue
<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// 配置 DOMPurify - 更严格的安全策略
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'a', 'code', 'pre',
    'ul', 'ol', 'li',
    'blockquote', 'hr'
  ],
  ALLOWED_ATTR: {
    'a': ['href', 'target', 'rel'],
    'pre': ['class'],
    'code': ['class']
  },
  ALLOW_DATA_ATTR: false,
  // 阻止 javascript: 协议
  SAFE_FOR_TEMPLATES: true
}

const renderedHtml = computed(() => {
  if (!props.content) return ''

  try {
    // 1. Markdown 转 HTML
    const html = marked(props.content, {
      breaks: true,
      gfm: true
    })

    // 2. XSS 清理
    const clean = DOMPurify.sanitize(html, PURIFY_CONFIG)

    // 3. 额外的安全检查 - 移除可能的恶意链接
    const div = document.createElement('div')
    div.innerHTML = clean

    // 移除 javascript: 链接
    div.querySelectorAll('a[href^="javascript:"]').forEach(link => {
      link.href = '#'
    })

    return div.innerHTML
  } catch (error) {
    console.error('Markdown preview error:', error)
    // 降级方案：只显示纯文本
    return `<p>${DOMPurify.sanitize(props.content)}</p>`
  }
})
</script>

<template>
  <div class="markdown-preview" v-html="renderedHtml" />
</template>

<style scoped>
.markdown-preview {
  /* 防止图片过大 */
  img {
    max-width: 100%;
    height: auto;
  }

  /* 限制代码块高度 */
  pre {
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>
```

---

### 第二阶段：互动性与功能增强（中优先级）

#### 2.1 实时 Markdown 预览（分栏布局）

**新建 CommentFormAdvanced.vue**:

```vue
<template>
  <div class="comment-form-advanced">
    <el-card>
      <template #header>
        <span class="card-title">发表评论</span>
      </template>

      <!-- 分栏布局：左编辑，右预览 -->
      <div class="editor-container">
        <!-- 左侧：编辑区 -->
        <div class="edit-column">
          <div class="column-header">编辑</div>

          <el-input
            ref="textareaRef"
            v-model="content"
            type="textarea"
            :rows="8"
            placeholder="支持 Markdown 格式 (Ctrl/Cmd + Enter 提交)"
            @keydown.ctrl.enter="handleSubmit"
            @keydown.meta.enter="handleSubmit"
          />

          <!-- Markdown 工具栏 -->
          <div class="markdown-toolbar">
            <!-- 格式化按钮 -->
            <el-button-group>
              <el-button
                size="small"
                @click="insertMarkdown('**', '**', '粗体')"
                :type="isBold ? 'primary' : 'default'"
              >
                <strong>B</strong>
              </el-button>
              <el-button
                size="small"
                @click="insertMarkdown('*', '*', '斜体')"
                :type="isItalic ? 'primary' : 'default'"
              >
                <em>I</em>
              </el-button>
              <!-- ... 其他按钮 -->
            </el-button-group>
          </div>
        </div>

        <!-- 右侧：预览区 -->
        <div class="preview-column">
          <div class="column-header">预览</div>
          <MarkdownPreview :content="content" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleReset">清空</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          发表评论
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const content = ref('')
const submitting = ref(false)
const textareaRef = ref(null)

// 检测当前光标位置是否在粗体文本内
const isBold = computed(() => {
  const textarea = textareaRef.value
  if (!textarea) return false

  const start = textarea.selectionStart
  const before = content.value.substring(Math.max(0, start - 2), start)
  const after = content.value.substring(start, Math.min(content.value.length, start + 2))

  return before === '**' && after === '**'
})

const isItalic = computed(() => {
  const textarea = textareaRef.value
  if (!textarea) return false

  const start = textarea.selectionStart
  const before = content.value.substring(Math.max(0, start - 1), start)
  const after = content.value.substring(start, Math.min(content.value.length, start + 1))

  return before === '*' && after === '*'
})

const insertMarkdown = (before, after, placeholder) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end) || placeholder
  const text = content.value.substring(0, start) + before + selectedText + after + content.value.substring(end)

  content.value = text

  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

const handleSubmit = () => {
  if (!content.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  submitting.value = true
  // ... 提交逻辑
  submitting.value = false
}

const handleReset = () => {
  content.value = ''
}
</script>

<style scoped lang="scss">
.comment-form-advanced {
  .editor-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
    max-height: 500px;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      max-height: none;
    }

    .edit-column,
    .preview-column {
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;

      .column-header {
        padding: 8px 12px;
        background: #f5f5f5;
        font-size: 12px;
        font-weight: 600;
        color: #606266;
      }
    }

    .edit-column {
      :deep(.el-textarea) {
        border: none;
      }
    }

    .preview-column {
      overflow-y: auto;

      :deep(.markdown-preview) {
        padding: 12px;
        flex: 1;
      }
    }
  }
}
</style>
```

---

#### 2.2 @ 提及用户功能

**文件**: `frontend/src/composables/useMentions.js` (优化)

```javascript
import { ref, computed } from 'vue'
import communityAPI from '@/api/communityWithCache'
import { useDebounce } from './useDebounce'

export function useMentions() {
  const mentionQuery = ref('')
  const mentionedUsers = ref([])
  const loading = ref(false)
  const showMentionList = ref(false)

  // 防抖搜索
  const { debounce } = useDebounce()

  const searchUsers = debounce(async (query) => {
    if (!query.trim() || query.length < 1) {
      mentionedUsers.value = []
      showMentionList.value = false
      return
    }

    loading.value = true
    try {
      const response = await communityAPI.searchUsers(query)
      mentionedUsers.value = response.data || []
      showMentionList.value = true
    } catch (error) {
      console.error('Failed to search users:', error)
      mentionedUsers.value = []
    } finally {
      loading.value = false
    }
  }, 300)

  const selectMention = (user) => {
    return `@${user.username}`
  }

  return {
    mentionQuery,
    mentionedUsers,
    loading,
    showMentionList,
    searchUsers,
    selectMention
  }
}
```

**在 CommentForm.vue 中使用**:

```vue
<script setup>
import { ref, watch } from 'vue'
import { useMentions } from '@/composables/useMentions'

const { mentionedUsers, loading, showMentionList, searchUsers, selectMention } = useMentions()
const content = ref('')

// 监听 @ 字符，触发用户搜索
watch(() => content.value, (newContent) => {
  const lastAtIndex = newContent.lastIndexOf('@')
  if (lastAtIndex === -1) {
    showMentionList.value = false
    return
  }

  const query = newContent.substring(lastAtIndex + 1)

  // 如果最后一个 @ 之后只有空白或有空格，说明用户已选择或放弃
  if (query.includes(' ') || query.includes('\n')) {
    showMentionList.value = false
    return
  }

  if (query.length > 0) {
    searchUsers(query)
  }
})

const insertMention = (user) => {
  const lastAtIndex = content.value.lastIndexOf('@')
  const beforeAt = content.value.substring(0, lastAtIndex)
  const mention = selectMention(user)
  content.value = beforeAt + mention + ' '
  showMentionList.value = false
}
</script>

<template>
  <!-- @ 提及建议列表 -->
  <div v-if="showMentionList && mentionedUsers.length > 0" class="mention-suggestions">
    <div
      v-for="user in mentionedUsers"
      :key="user.id"
      class="mention-item"
      @click="insertMention(user)"
    >
      <img :src="user.avatar" :alt="user.username" class="user-avatar" />
      <div class="user-info">
        <div class="username">{{ user.username }}</div>
        <div class="userinfo">{{ user.bio || '暂无简介' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mention-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 300px;
  overflow-y: auto;

  .mention-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .user-info {
      flex: 1;
      min-width: 0;

      .username {
        font-weight: 500;
        font-size: 14px;
      }

      .userinfo {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
```

---

#### 2.3 现代化的表情选择器

**新建 EmojiPicker.vue**:

```vue
<template>
  <div class="emoji-picker-wrapper">
    <!-- 分类导航 -->
    <div class="emoji-categories">
      <div
        v-for="category in categories"
        :key="category.name"
        :class="['category-tab', { active: activeCategory === category.name }]"
        @click="activeCategory = category.name"
        :title="category.label"
      >
        {{ category.icon }}
      </div>
    </div>

    <!-- 搜索框 -->
    <el-input
      v-model="searchQuery"
      placeholder="搜索表情..."
      size="small"
      clearable
      style="margin-bottom: 12px;"
    />

    <!-- 表情网格 -->
    <div class="emoji-grid">
      <div
        v-for="emoji in filteredEmojis"
        :key="emoji"
        class="emoji-item"
        @click="selectEmoji(emoji)"
        :title="emoji"
      >
        {{ emoji }}
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredEmojis.length === 0" class="empty-state">
      没有找到相关表情
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElInput } from 'element-plus'

const props = defineProps({
  onSelect: Function
})

const activeCategory = ref('recent')
const searchQuery = ref('')
const recentEmojis = ref([])

// 表情分类
const categories = [
  { name: 'recent', label: '最近使用', icon: '⏰' },
  { name: 'smileys', label: '笑脸与人物', icon: '😀' },
  { name: 'animals', label: '动物与自然', icon: '🐶' },
  { name: 'food', label: '食物与饮品', icon: '🍎' },
  { name: 'travel', label: '旅行与地点', icon: '✈️' },
  { name: 'activities', label: '活动与运动', icon: '⚽' },
  { name: 'objects', label: '物品与工具', icon: '🔧' },
  { name: 'symbols', label: '符号与标志', icon: '♥️' }
]

const emojiData = {
  recent: [],
  smileys: ['😀', '😂', '😍', '🤔', '😢', '😡', '😱', '😴', '🤨', '😏', '🙂', '😎'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
  food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍓', '🍇', '🍑', '🥝', '🍅', '🍆', '🥑'],
  travel: ['✈️', '🚂', '🚇', '🚘', '🚢', '🚁', '🗽', '🗼', '🏰', '🌉', '🌁', '⛺'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎳', '🏓', '🏸'],
  objects: ['🔧', '🔨', '⚒️', '🛠️', '⛏️', '⚙️', '🔩', '⛓️', '🔗', '⚗️', '🔫', '💣'],
  symbols: ['♥️', '💔', '💕', '💖', '💗', '💘', '💝', '💟', '☮️', '✌️', '☑️', '☯️']
}

// 过滤表情
const filteredEmojis = computed(() => {
  const emojis = activeCategory.value === 'recent'
    ? recentEmojis.value
    : emojiData[activeCategory.value] || []

  if (!searchQuery.value) return emojis

  // 简单的搜索：根据emoji名称（这里用描述匹配）
  // 实际项目中应该使用更完整的emoji数据库
  return emojis
})

const selectEmoji = (emoji) => {
  // 记录为最近使用
  recentEmojis.value = [
    emoji,
    ...recentEmojis.value.filter(e => e !== emoji)
  ].slice(0, 8)

  props.onSelect?.(emoji)
}
</script>

<style scoped lang="scss">
.emoji-picker-wrapper {
  padding: 12px;
  width: 320px;

  .emoji-categories {
    display: flex;
    justify-content: space-around;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;

    .category-tab {
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
      }

      &.active {
        background: #e3f2fd;
      }
    }
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;

    .emoji-item {
      font-size: 24px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      text-align: center;

      &:hover {
        background: #f0f0f0;
        transform: scale(1.2);
      }
    }
  }

  .empty-state {
    text-align: center;
    color: #909399;
    padding: 20px 0;
  }
}
</style>
```

---

### 第三阶段：性能与长远规划（低优先级）

#### 3.1 虚拟滚动处理大量评论

```javascript
// useComments.js 中添加虚拟滚动支持

const ITEM_HEIGHT = 120 // 单个评论的平均高度

// 虚拟滚动显示范围
const visibleRange = reactive({
  start: 0,
  end: 20
})

const virtualComments = computed(() => {
  return displayComments.value.slice(visibleRange.start, visibleRange.end)
})

const handleScroll = (event) => {
  const container = event.target
  const scrollTop = container.scrollTop
  const containerHeight = container.clientHeight

  // 计算可见范围
  const start = Math.floor(scrollTop / ITEM_HEIGHT)
  const end = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 5 // 预加载5条

  visibleRange.start = Math.max(0, start - 5)
  visibleRange.end = Math.min(displayComments.value.length, end)
}
```

---

## 📋 实现优先级与工作量评估

| 优化项 | 优先级 | 工作量 | 预期收益 |
|------|------|------|--------|
| 草稿自动保存 | 🔴 高 | 2h | 减少用户数据丢失 50% |
| 快捷键支持 | 🔴 高 | 0.5h | 提升效率 20% |
| 网络离线提示 | 🔴 高 | 1.5h | 降低困惑 70% |
| 错误分类处理 | 🔴 高 | 2h | 提升可用性 30% |
| XSS 防护加固 | 🔴 高 | 1.5h | 安全性提升 |
| **第一阶段小计** | - | **7.5h** | **✓ 核心稳定** |
| 实时Markdown预览 | 🟡 中 | 3h | 提升写作体验 40% |
| @ 提及用户 | 🟡 中 | 2.5h | 社交互动 +30% |
| 现代化表情选择器 | 🟡 中 | 2h | 使用效率 +50% |
| **第二阶段小计** | - | **7.5h** | **✓ 互动增强** |
| 虚拟滚动 | 🟢 低 | 3h | 支持万级评论 |
| 评论点赞排序 | 🟢 低 | 2h | 内容质量 |
| **第三阶段小计** | - | **5h** | **✓ 性能保障** |
| **总计** | - | **20h** | - |

---

## 🎯 实施路线图

### Week 1：第一阶段（高优先级）
- Day 1: 草稿自动保存 + 快捷键支持
- Day 2-3: 网络状态监测 + 错误处理优化
- Day 4: XSS 防护加固 + 测试

### Week 2：第二阶段（中优先级）
- Day 1-2: 实时 Markdown 预览（分栏）
- Day 3: @ 提及用户功能
- Day 4: 现代化表情选择器

### Week 3：第三阶段（低优先级）
- Day 1-2: 虚拟滚动实现
- Day 3: 评论点赞排序
- Day 4: 性能测试与优化

---

## ✅ 完成检查清单

### 第一阶段
- [ ] `useDraft.js` composable 实现
- [ ] 快捷键提交（Ctrl/Cmd + Enter）
- [ ] `useNetworkStatus.js` composable 实现
- [ ] 错误分类和自动重试
- [ ] XSS 防护加固
- [ ] 单元测试覆盖率 > 80%

### 第二阶段
- [ ] 分栏实时预览布局
- [ ] @ 提及用户搜索
- [ ] 现代化 EmojiPicker 组件
- [ ] 集成测试验证

### 第三阶段
- [ ] 虚拟滚动支持
- [ ] 点赞排序逻辑
- [ ] 性能基准测试

---

## 🔗 相关文件修改清单

### 新建文件
- `frontend/src/composables/useDraft.js`
- `frontend/src/composables/useNetworkStatus.js`
- `frontend/src/components/EmojiPicker.vue`
- `frontend/src/views/community/PostDetail/MainContent/CommentsSection/CommentFormAdvanced.vue`

### 修改文件
- `frontend/src/views/community/PostDetail/MainContent/CommentsSection/CommentForm.vue`
- `frontend/src/composables/useComments.js`
- `frontend/src/views/community/PostDetail/MainContent/CommentsSection/MarkdownPreview.vue`
- `frontend/src/composables/useMentions.js`

---

## 📚 参考文档

- Vue 3 Composition API: https://vuejs.org/guide/extras/composition-api-faq.html
- DOMPurify: https://github.com/cure53/DOMPurify
- Element Plus: https://element-plus.org
- 虚拟滚动库：vue-virtual-scroller

---

**下一步**：是否开始实现第一阶段的优化？我建议从草稿自动保存开始，这是用户体验提升最明显的功能。
