# 🔍 Phase 7A: 消息搜索和过滤 - 实现指南

## 🎯 功能目标

实现一个高效、强大的消息搜索系统，支持：
- ✅ 全局搜索和会话内搜索
- ✅ 关键词匹配和高亮
- ✅ 多条件过滤
- ✅ 实时搜索建议
- ✅ 搜索历史记录

## 💻 核心实现

### 1. 搜索引擎核心类

```javascript
// composables/useMessageSearch.js
/**
 * 消息搜索引擎 - 使用倒排索引和全文搜索
 */

import { computed, ref, reactive } from 'vue'

export function useMessageSearch() {
  // 搜索状态
  const searchState = reactive({
    keyword: '',
    filters: {
      type: 'all',
      timeRange: 'all',
      senderId: null,
      conversationId: null
    },
    results: [],
    isSearching: false,
    highlightPositions: new Map()
  })

  // 索引存储
  const searchIndex = reactive({
    // 倒排索引: keyword -> Set<messageId>
    invertedIndex: new Map(),
    // 正向索引: messageId -> message
    forwardIndex: new Map(),
    // 时间戳索引: 用于时间范围查询
    timeIndex: new Map(),
    // 发送者索引: senderId -> Set<messageId>
    senderIndex: new Map()
  })

  /**
   * 构建索引 - 必须在初始化和接收新消息时调用
   */
  function buildIndex(messages) {
    messages.forEach(msg => {
      // 1. 分词处理中文
      const tokens = tokenize(msg.content)

      // 2. 添加到倒排索引
      tokens.forEach(token => {
        if (!searchIndex.invertedIndex.has(token)) {
          searchIndex.invertedIndex.set(token, new Set())
        }
        searchIndex.invertedIndex.get(token).add(msg.id)
      })

      // 3. 正向索引
      searchIndex.forwardIndex.set(msg.id, msg)

      // 4. 时间索引 (按日期分组)
      const date = new Date(msg.timestamp).toDateString()
      if (!searchIndex.timeIndex.has(date)) {
        searchIndex.timeIndex.set(date, new Set())
      }
      searchIndex.timeIndex.get(date).add(msg.id)

      // 5. 发送者索引
      if (!searchIndex.senderIndex.has(msg.senderId)) {
        searchIndex.senderIndex.set(msg.senderId, new Set())
      }
      searchIndex.senderIndex.get(msg.senderId).add(msg.id)
    })
  }

  /**
   * 中文分词处理
   */
  function tokenize(text) {
    // 简单的分词算法
    // 生产环境建议使用 jieba-js 或其他专业分词库
    const tokens = []
    const words = text.toLowerCase().split(/[\s\-_,，。！？；：「」（）\[\]{}<>\/\\|]/g)

    words.forEach(word => {
      if (word.length > 0) {
        tokens.push(word)

        // 支持子串匹配
        if (word.length > 2) {
          for (let i = 0; i < word.length - 1; i++) {
            tokens.push(word.substring(i, i + 2))
          }
        }
      }
    })

    return Array.from(new Set(tokens))
  }

  /**
   * 执行搜索
   */
  async function search() {
    searchState.isSearching = true
    try {
      const keyword = searchState.keyword.trim()

      if (!keyword) {
        searchState.results = []
        return
      }

      // 1. 获取匹配的消息 ID
      const tokens = tokenize(keyword)
      let matchedIds = null

      tokens.forEach(token => {
        const tokenMatches = searchIndex.invertedIndex.get(token) || new Set()
        if (matchedIds === null) {
          matchedIds = new Set(tokenMatches)
        } else {
          // 交集运算（所有关键词都要匹配）
          matchedIds = new Set([...matchedIds].filter(id => tokenMatches.has(id)))
        }
      })

      // 2. 应用过滤条件
      let candidates = matchedIds ? Array.from(matchedIds) : []
      candidates = applyFilters(candidates)

      // 3. 计算相关性排序
      const results = candidates
        .map(id => {
          const msg = searchIndex.forwardIndex.get(id)
          const score = calculateRelevance(msg, keyword)
          const highlights = findHighlights(msg.content, keyword)

          return {
            ...msg,
            score,
            highlights
          }
        })
        .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
        .slice(0, 50) // 最多返回 50 条结果

      searchState.results = results

      // 4. 记录搜索历史
      recordSearchHistory(keyword)

    } finally {
      searchState.isSearching = false
    }
  }

  /**
   * 应用过滤条件
   */
  function applyFilters(messageIds) {
    const { filters } = searchState

    return messageIds.filter(id => {
      const msg = searchIndex.forwardIndex.get(id)

      // 消息类型过滤
      if (filters.type !== 'all' && msg.type !== filters.type) return false

      // 时间范围过滤
      if (!isInTimeRange(msg.timestamp, filters.timeRange)) return false

      // 发送者过滤
      if (filters.senderId && msg.senderId !== filters.senderId) return false

      // 会话过滤
      if (filters.conversationId && msg.conversationId !== filters.conversationId) return false

      return true
    })
  }

  /**
   * 计算相关性评分 (TF-IDF)
   */
  function calculateRelevance(message, keyword) {
    const tokens = tokenize(keyword)
    let score = 0

    // TF (词频): 关键词在消息中出现的次数
    tokens.forEach(token => {
      const regex = new RegExp(token, 'gi')
      const matches = message.content.match(regex)
      const tf = matches ? matches.length : 0
      score += tf
    })

    // IDF (逆文档频率): 关键词的稀有程度
    tokens.forEach(token => {
      const docCount = searchIndex.invertedIndex.get(token)?.size || 1
      const idf = Math.log(searchIndex.forwardIndex.size / docCount)
      score *= idf
    })

    // 位置权重: 关键词在消息开头的权重更高
    const keywordPosition = message.content.toLowerCase().indexOf(keyword.toLowerCase())
    if (keywordPosition !== -1) {
      score += 10 / (keywordPosition + 1)
    }

    return score
  }

  /**
   * 查找高亮位置
   */
  function findHighlights(text, keyword) {
    const highlights = []
    const regex = new RegExp(keyword, 'gi')
    let match

    while ((match = regex.exec(text)) !== null) {
      highlights.push({
        start: match.index,
        end: match.index + keyword.length,
        text: match[0]
      })
    }

    return highlights
  }

  /**
   * 时间范围判断
   */
  function isInTimeRange(timestamp, range) {
    if (range === 'all') return true

    const now = Date.now()
    const date = new Date(timestamp)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    switch (range) {
      case 'today':
        return date >= today
      case 'week':
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
        return date >= weekAgo
      case 'month':
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
        return date >= monthAgo
      default:
        return true
    }
  }

  /**
   * 记录搜索历史
   */
  function recordSearchHistory(keyword) {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const index = history.indexOf(keyword)

    // 移除重复项
    if (index > -1) {
      history.splice(index, 1)
    }

    // 添加到最前面
    history.unshift(keyword)

    // 只保留最近 20 条
    history.splice(20)

    localStorage.setItem('searchHistory', JSON.stringify(history))
  }

  /**
   * 获取搜索建议
   */
  const searchSuggestions = computed(() => {
    if (!searchState.keyword) {
      // 显示搜索历史
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
      return history.slice(0, 5)
    }

    // 显示匹配的建议
    const keyword = searchState.keyword.toLowerCase()
    const suggestions = new Set()

    searchIndex.invertedIndex.forEach((_, token) => {
      if (token.includes(keyword) && suggestions.size < 5) {
        suggestions.add(token)
      }
    })

    return Array.from(suggestions)
  })

  /**
   * 更新过滤条件
   */
  function updateFilters(newFilters) {
    Object.assign(searchState.filters, newFilters)
    search()
  }

  /**
   * 清空搜索
   */
  function clearSearch() {
    searchState.keyword = ''
    searchState.results = []
  }

  return {
    searchState,
    searchIndex,
    search,
    buildIndex,
    updateFilters,
    clearSearch,
    searchSuggestions
  }
}
```

### 2. 搜索 UI 组件

```vue
<!-- components/chat/MessageSearch.vue -->
<template>
  <div class="message-search">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-input-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchState.keyword"
          type="text"
          class="search-input"
          placeholder="搜索消息..."
          @input="handleInput"
          @keydown.enter="search"
        />
        <el-icon
          v-if="searchState.keyword"
          class="clear-icon"
          @click="clearSearch"
        >
          <Close />
        </el-icon>
      </div>

      <el-button text @click="showFilters = !showFilters">
        <el-icon><Filter /></el-icon>
        筛选
      </el-button>
    </div>

    <!-- 搜索建议 -->
    <div v-if="!searchState.keyword || (!searchState.isSearching && searchState.results.length === 0)" class="search-suggestions">
      <div class="suggestions-title">
        {{ searchState.keyword ? '搜索建议' : '搜索历史' }}
      </div>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in searchSuggestions"
          :key="index"
          class="suggestion-item"
          @click="searchState.keyword = suggestion; search()"
        >
          <el-icon><Search /></el-icon>
          <span>{{ suggestion }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选面板 -->
    <el-collapse-transition>
      <div v-show="showFilters" class="filter-panel">
        <el-row :gutter="20">
          <!-- 消息类型 -->
          <el-col :xs="24" :sm="12">
            <div class="filter-group">
              <div class="filter-title">消息类型</div>
              <el-checkbox-group
                :model-value="[searchState.filters.type]"
                @change="(v) => updateFilters({ type: v[0] || 'all' })"
              >
                <el-checkbox label="all">全部</el-checkbox>
                <el-checkbox label="text">文本</el-checkbox>
                <el-checkbox label="image">图片</el-checkbox>
                <el-checkbox label="file">文件</el-checkbox>
              </el-checkbox-group>
            </div>
          </el-col>

          <!-- 时间范围 -->
          <el-col :xs="24" :sm="12">
            <div class="filter-group">
              <div class="filter-title">时间范围</div>
              <el-radio-group
                :model-value="searchState.filters.timeRange"
                @change="(v) => updateFilters({ timeRange: v })"
              >
                <el-radio label="all">全部</el-radio>
                <el-radio label="today">今天</el-radio>
                <el-radio label="week">本周</el-radio>
                <el-radio label="month">本月</el-radio>
              </el-radio-group>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-collapse-transition>

    <!-- 搜索结果 -->
    <div v-if="searchState.results.length > 0" class="search-results">
      <div class="results-info">
        找到 <strong>{{ searchState.results.length }}</strong> 条结果
        <span v-if="searchState.isSearching" class="loading">搜索中...</span>
      </div>

      <div class="results-list">
        <div
          v-for="result in searchState.results"
          :key="result.id"
          class="result-item"
          @click="jumpToMessage(result)"
        >
          <!-- 发送者信息 -->
          <div class="result-header">
            <div class="conversation-badge">
              {{ result.conversationName }}
            </div>
            <span class="sender-name">{{ result.senderName }}</span>
            <span class="timestamp">{{ formatTime(result.timestamp) }}</span>
          </div>

          <!-- 消息内容（带高亮） -->
          <div class="result-content">
            <span v-if="result.type === 'text'">
              <span
                v-for="(part, index) in highlightedContent(result)"
                :key="index"
                :class="{ highlight: part.isHighlight }"
              >
                {{ part.text }}
              </span>
            </span>
            <span v-else class="result-type-badge">
              {{ getTypeIcon(result.type) }} {{ result.type }}
            </span>
          </div>

          <!-- 右侧操作 -->
          <div class="result-actions">
            <el-icon @click.stop="copyContent(result)"><DocumentCopy /></el-icon>
            <el-icon @click.stop="forwardMessage(result)"><Share /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="searchState.keyword && !searchState.isSearching" class="empty-state">
      <el-empty
        description="没有找到相关消息"
        :image-size="100"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessageSearch } from '@/composables/useMessageSearch'
import { Search, Filter, Close, DocumentCopy, Share } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const { searchState, search, updateFilters, clearSearch, searchSuggestions } = useMessageSearch()
const showFilters = ref(false)

/**
 * 处理输入（防抖）
 */
let debounceTimer
function handleInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (searchState.keyword.length > 0) {
      search()
    }
  }, 300)
}

/**
 * 高亮显示匹配的文本
 */
function highlightedContent(result) {
  if (!result.highlights || result.highlights.length === 0) {
    return [{ text: result.content, isHighlight: false }]
  }

  const parts = []
  let lastIndex = 0

  result.highlights.forEach(highlight => {
    // 添加非高亮部分
    if (highlight.start > lastIndex) {
      parts.push({
        text: result.content.substring(lastIndex, highlight.start),
        isHighlight: false
      })
    }

    // 添加高亮部分
    parts.push({
      text: highlight.text,
      isHighlight: true
    })

    lastIndex = highlight.end
  })

  // 添加剩余部分
  if (lastIndex < result.content.length) {
    parts.push({
      text: result.content.substring(lastIndex),
      isHighlight: false
    })
  }

  return parts.slice(0, 100) // 限制长度
}

/**
 * 跳转到对应的消息
 */
function jumpToMessage(result) {
  // 发射事件给父组件
  emit('message-found', result)
}

/**
 * 复制消息内容
 */
function copyContent(result) {
  navigator.clipboard.writeText(result.content)
  ElMessage.success('已复制')
}

/**
 * 转发消息
 */
function forwardMessage(result) {
  emit('forward-message', result)
}

/**
 * 获取消息类型图标
 */
function getTypeIcon(type) {
  const icons = {
    image: '🖼️',
    file: '📄',
    voice: '🎤',
    video: '🎬'
  }
  return icons[type] || '📝'
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`

  return dayjs(timestamp).format('MM-DD HH:mm')
}

const emit = defineEmits(['message-found', 'forward-message'])
</script>

<style scoped>
.message-search {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #999;
  }
}

.search-icon,
.clear-icon {
  color: #999;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
}

.filter-panel {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.filter-group {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.search-suggestions {
  padding: 16px;
  background: #fafafa;
}

.suggestions-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  .el-icon {
    color: #999;
  }
}

.search-results {
  flex: 1;
  overflow-y: auto;
}

.results-info {
  padding: 12px 16px;
  font-size: 12px;
  color: #999;
}

.loading {
  margin-left: 8px;
  color: #5c6af0;
}

.results-list {
  display: flex;
  flex-direction: column;
}

.result-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f7fa;

    .result-actions {
      opacity: 1;
    }
  }
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}

.conversation-badge {
  padding: 2px 8px;
  background: #e6ebff;
  color: #5c6af0;
  border-radius: 4px;
  font-size: 11px;
}

.sender-name {
  font-weight: 600;
  color: #333;
}

.timestamp {
  color: #999;
  margin-left: auto;
}

.result-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  .highlight {
    background: #fff3cd;
    color: #d46b08;
    font-weight: 600;
    padding: 0 2px;
  }
}

.result-type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #999;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;

  .el-icon {
    cursor: pointer;
    color: #999;
    transition: color 0.2s;

    &:hover {
      color: #5c6af0;
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}
</style>
```

## 📊 性能优化

```javascript
/**
 * 性能优化方案：
 * 1. 虚拟滚动：大量搜索结果
 * 2. 索引缓存：避免重复构建
 * 3. Web Worker：后台搜索
 * 4. 增量更新：只更新变化的索引
 */

// 使用 Web Worker 进行搜索
const searchWorker = new Worker('/search-worker.js')

function searchInWorker(keyword, filters) {
  return new Promise((resolve) => {
    searchWorker.postMessage({ keyword, filters })
    searchWorker.onmessage = (event) => {
      resolve(event.data.results)
    }
  })
}
```

## 🧪 测试用例

```javascript
// tests/unit/services/messageSearch.spec.js
describe('MessageSearch', () => {
  it('应该正确构建倒排索引', () => {
    // 测试索引构建
  })

  it('应该支持多关键词搜索', () => {
    // 测试多关键词匹配
  })

  it('应该正确过滤结果', () => {
    // 测试各种过滤条件
  })

  it('应该正确排序结果', () => {
    // 测试相关性排序
  })

  it('应该支持中文分词', () => {
    // 测试分词处理
  })
})
```

---

**状态**: 🔄 实现中
**预期完成**: 2025-10-25
**工时**: 12 小时
**测试覆盖**: 90%+
