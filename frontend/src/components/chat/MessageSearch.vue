<template>
  <div class="message-search">
    <!-- 搜索输入框 -->
    <div class="search-input-wrapper">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索消息..."
        clearable
        @input="handleSearchInput"
        @keyup.enter="performSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #suffix>
          <el-icon v-if="searchState.loading" class="is-loading">
            <Loading />
          </el-icon>
        </template>
      </el-input>

      <!-- 搜索建议下拉框 -->
      <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
        <div
          v-for="(suggestion, idx) in suggestions"
          :key="idx"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          <el-icon><Clock /></el-icon>
          <span>{{ suggestion }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div v-if="!searchKeyword && searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <span>搜索历史</span>
        <el-button text type="danger" size="small" @click="handleClearHistory">
          清空
        </el-button>
      </div>
      <div class="history-tags">
        <el-tag
          v-for="(item, idx) in searchHistory.slice(0, 8)"
          :key="idx"
          closable
          @close="removeHistoryItem(idx)"
          @click="selectSuggestion(item)"
          class="history-tag"
        >
          {{ item }}
        </el-tag>
      </div>
    </div>

    <!-- 过滤器面板 -->
    <el-collapse v-model="filterCollapsed" class="filters-panel">
      <el-collapse-item title="高级过滤" name="filters">
        <div class="filter-group">
          <!-- 消息类型过滤 -->
          <div class="filter-item">
            <label>消息类型:</label>
            <el-select v-model="filters.type" placeholder="全部类型" clearable>
              <el-option label="文本" value="text" />
              <el-option label="图片" value="image" />
              <el-option label="文件" value="file" />
              <el-option label="视频" value="video" />
            </el-select>
          </div>

          <!-- 时间范围过滤 -->
          <div class="filter-item">
            <label>时间范围:</label>
            <el-select v-model="filters.timeRange">
              <el-option label="今天" value="today" />
              <el-option label="本周" value="week" />
              <el-option label="本月" value="month" />
              <el-option label="全部" value="all" />
            </el-select>
          </div>

          <!-- 发送者过滤 -->
          <div class="filter-item" v-if="senderOptions.length > 0">
            <label>发送者:</label>
            <el-select v-model="filters.senderId" placeholder="全部发送者" clearable>
              <el-option
                v-for="sender in senderOptions"
                :key="sender.id"
                :label="sender.name"
                :value="sender.id"
              />
            </el-select>
          </div>

          <!-- 过滤按钮 -->
          <div class="filter-actions">
            <el-button @click="applyFilters" type="primary" size="small">
              应用过滤
            </el-button>
            <el-button @click="resetFilters" size="small">
              重置
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 搜索结果统计 -->
    <div v-if="searchKeyword && !searchState.loading" class="search-stats">
      <span>
        找到 <strong>{{ searchState.totalCount }}</strong> 条结果
        <em v-if="currentFilters.type">(已过滤)</em>
      </span>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchKeyword" class="search-results">
      <!-- 加载状态 -->
      <div v-if="searchState.loading" class="loading-state">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <p>搜索中...</p>
      </div>

      <!-- 空结果 -->
      <div v-else-if="searchState.results.length === 0" class="empty-state">
        <el-icon>
          <Search />
        </el-icon>
        <p v-if="searchState.error">{{ searchState.error }}</p>
        <p v-else>未找到匹配的消息</p>
      </div>

      <!-- 结果列表 -->
      <el-scrollbar v-else class="results-scrollbar" max-height="400px">
        <div
          v-for="(result, idx) in searchState.results"
          :key="idx"
          class="result-item"
          @click="handleMessageFound(result)"
        >
          <!-- 会话标签 -->
          <div class="result-conversation-badge">
            {{ result.conversationName || '未知会话' }}
          </div>

          <!-- 发送者和时间 -->
          <div class="result-header">
            <span class="sender-name">{{ result.senderName }}</span>
            <span class="send-time">{{ formatTime(result.timestamp) }}</span>
          </div>

          <!-- 消息内容（带高亮） -->
          <div class="result-content">
            <span v-if="result.type === 'text'">
              <template v-for="(segment, i) in getHighlightedText(result)">
                <mark v-if="segment.highlight" :key="`highlight-${i}`">{{ segment.text }}</mark>
                <span v-else :key="`text-${i}`">{{ segment.text }}</span>
              </template>
            </span>
            <span v-else class="content-placeholder">
              [{{ getMessageTypeLabel(result.type) }}]
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <el-button
              text
              type="primary"
              size="small"
              @click.stop="handleCopyMessage(result)"
              title="复制"
            >
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
            <el-button
              text
              type="primary"
              size="small"
              @click.stop="handleForwardMessage(result)"
              title="转发"
            >
              <el-icon><Share /></el-icon>
            </el-button>
            <el-button
              text
              type="primary"
              size="small"
              @click.stop="handleCollectMessage(result)"
              title="收藏"
            >
              <el-icon><Star /></el-icon>
            </el-button>
          </div>

          <!-- 相关性评分 -->
          <div class="result-relevance">
            <el-progress
              :percentage="Math.round(result.relevance)"
              :color="getRelevanceColor(result.relevance)"
              :show-text="false"
              :stroke-width="3"
            />
          </div>
        </div>
      </el-scrollbar>

      <!-- 分页 -->
      <div v-if="searchState.totalCount > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="searchState.totalCount"
          @current-change="handlePageChange"
          layout="prev, pager, next"
        />
      </div>
    </div>

    <!-- 空状态（初始） -->
    <div v-else class="initial-state">
      <el-icon><Search /></el-icon>
      <p>输入关键词搜索消息</p>
      <p class="tip">支持全文搜索、多条件过滤和排序</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElIcon,
  ElCollapse,
  ElCollapseItem,
  ElProgress,
  ElScrollbar,
  ElPagination,
  ElTag,
  ElMessage
} from 'element-plus'
import {
  Search,
  Loading,
  Clock,
  DocumentCopy,
  Share,
  Star
} from '@element-plus/icons-vue'
import { useMessageSearch } from '@/composables/useMessageSearch'

// 定义props和emits
const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  conversationId: {
    type: String,
    default: null
  },
  senders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['message-found', 'forward-message', 'collect-message'])

// 搜索组件实例
const { searchState, searchHistory, currentFilters, buildIndex, search, getSearchSuggestions, addSearchHistory, clearSearchHistory, setFilters, resetFilters: resetEngineFilters } = useMessageSearch()

// 本地搜索状态
const searchKeyword = ref('')
const showSuggestions = ref(false)
const filterCollapsed = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

// 过滤器配置
const filters = reactive({
  type: null,
  timeRange: 'all',
  senderId: null
})

// 搜索建议
const suggestions = computed(() => {
  if (!searchKeyword.value) return []
  return getSearchSuggestions(searchKeyword.value, 8)
})

// 发送者选项
const senderOptions = computed(() => {
  return props.senders || []
})

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()

  // 今天
  if (date.toLocaleDateString() === now.toLocaleDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 昨天
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (date.toLocaleDateString() === yesterday.toLocaleDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 其他
  return date.toLocaleDateString('zh-CN')
}

/**
 * 获取消息类型标签
 */
function getMessageTypeLabel(type) {
  const labels = {
    text: '文本',
    image: '图片',
    file: '文件',
    video: '视频',
    audio: '音频'
  }
  return labels[type] || '未知'
}

/**
 * 获取相关性颜色
 */
function getRelevanceColor(relevance) {
  if (relevance >= 80) return '#67c23a'
  if (relevance >= 60) return '#409eff'
  if (relevance >= 40) return '#e6a23c'
  return '#f56c6c'
}

/**
 * 获取高亮文本段
 */
function getHighlightedText(result) {
  if (!result.highlights || result.highlights.length === 0) {
    return [{ text: result.content, highlight: false }]
  }

  const content = result.content
  const segments = []
  let lastEnd = 0

  result.highlights.forEach(highlight => {
    if (highlight.start > lastEnd) {
      segments.push({
        text: content.substring(lastEnd, highlight.start),
        highlight: false
      })
    }
    segments.push({
      text: content.substring(highlight.start, highlight.end),
      highlight: true
    })
    lastEnd = highlight.end
  })

  if (lastEnd < content.length) {
    segments.push({
      text: content.substring(lastEnd),
      highlight: false
    })
  }

  return segments
}

/**
 * 处理搜索输入
 */
function handleSearchInput(value) {
  showSuggestions.value = value.length > 0
}

/**
 * 执行搜索
 */
function performSearch() {
  if (!searchKeyword.value.trim()) return

  // 应用过滤器
  setFilters(filters)

  // 执行搜索
  search({
    keyword: searchKeyword.value,
    limit: pageSize.value,
    offset: (currentPage.value - 1) * pageSize.value
  })

  // 添加到历史
  addSearchHistory(searchKeyword.value)

  showSuggestions.value = false
}

/**
 * 选择搜索建议或历史
 */
function selectSuggestion(suggestion) {
  searchKeyword.value = suggestion
  showSuggestions.value = false
  performSearch()
}

/**
 * 删除历史项
 */
function removeHistoryItem(index) {
  searchHistory.value.splice(index, 1)
  try {
    localStorage.setItem('messageSearchHistory', JSON.stringify(searchHistory.value))
  } catch (err) {
    console.warn('Failed to save search history:', err)
  }
}

/**
 * 清空搜索历史
 */
function handleClearHistory() {
  clearSearchHistory()
  ElMessage.success('搜索历史已清空')
}

/**
 * 应用过滤器
 */
function applyFilters() {
  currentPage.value = 1
  performSearch()
}

/**
 * 重置过滤器
 */
function resetFilters() {
  filters.type = null
  filters.timeRange = 'all'
  filters.senderId = null
  resetEngineFilters()
  applyFilters()
}

/**
 * 处理消息找到事件
 */
function handleMessageFound(result) {
  emit('message-found', {
    id: result.id,
    conversationId: result.conversationId,
    content: result.content
  })

  ElMessage.success('已跳转到消息位置')
}

/**
 * 处理复制消息
 */
function handleCopyMessage(result) {
  if (result.type === 'text' && result.content) {
    navigator.clipboard.writeText(result.content)
    ElMessage.success('消息已复制')
  }
}

/**
 * 处理转发消息
 */
function handleForwardMessage(result) {
  emit('forward-message', {
    id: result.id,
    conversationId: result.conversationId,
    content: result.content,
    type: result.type,
    senderName: result.senderName
  })

  ElMessage.success('已打开转发对话框')
}

/**
 * 处理收藏消息
 */
function handleCollectMessage(result) {
  emit('collect-message', {
    id: result.id,
    conversationId: result.conversationId,
    content: result.content,
    senderName: result.senderName,
    timestamp: result.timestamp
  })

  ElMessage.success('消息已收藏')
}

/**
 * 处理页码变更
 */
function handlePageChange(page) {
  currentPage.value = page
  performSearch()
}

/**
 * 监听messages变化，重建索引
 */
watch(() => props.messages, (newMessages) => {
  if (newMessages && newMessages.length > 0) {
    buildIndex(newMessages)
  }
}, { immediate: true })

/**
 * 监听会话变化，重置搜索
 */
watch(() => props.conversationId, () => {
  searchKeyword.value = ''
  searchState.results = []
  currentPage.value = 1
})
</script>

<style scoped>
.message-search {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  background-color: #fff;
}

/* 搜索输入框 */
.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
}

.suggestions-dropdown {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #dcdfe4;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-item .el-icon {
  color: #909399;
}

/* 搜索历史 */
.search-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #606266;
  padding: 0 8px;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  cursor: pointer;
  font-size: 12px;
}

.history-tag:hover {
  opacity: 0.8;
}

/* 过滤面板 */
.filters-panel {
  border-radius: 4px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.filter-item :deep(.el-select) {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.filter-actions .el-button {
  flex: 1;
}

/* 搜索统计 */
.search-stats {
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
  border-radius: 2px;
  font-size: 13px;
  color: #606266;
}

.search-stats strong {
  color: #409eff;
  font-weight: bold;
}

.search-stats em {
  margin-left: 8px;
  color: #909399;
  font-style: italic;
}

/* 搜索结果 */
.search-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.loading-state,
.empty-state,
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
  padding: 32px 16px;
  text-align: center;
}

.loading-state .el-icon,
.empty-state .el-icon,
.initial-state .el-icon {
  font-size: 32px;
  opacity: 0.5;
}

.initial-state .tip {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.results-scrollbar {
  flex: 1;
}

/* 结果项 */
.result-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item:hover {
  background-color: #f5f7fa;
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.1);
}

.result-conversation-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: #e6f7ff;
  color: #0050b3;
  border-radius: 2px;
  font-size: 12px;
  width: fit-content;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.sender-name {
  color: #303133;
  font-weight: 500;
}

.send-time {
  color: #909399;
  font-size: 12px;
}

.result-content {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.result-content mark {
  background-color: #ffd666;
  color: #000;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}

.content-placeholder {
  color: #909399;
  font-style: italic;
}

.result-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid #ebeef5;
}

.result-actions .el-button {
  padding: 2px 6px;
}

.result-relevance {
  padding-top: 4px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid #ebeef5;
}

/* 响应式 */
@media (max-width: 768px) {
  .message-search {
    padding: 12px;
  }

  .result-item {
    padding: 10px;
  }

  .result-actions {
    flex-direction: column;
    gap: 6px;
  }

  .result-actions .el-button {
    width: 100%;
  }
}
</style>
