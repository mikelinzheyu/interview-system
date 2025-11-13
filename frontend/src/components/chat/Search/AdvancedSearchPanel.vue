<template>
  <div class="advanced-search-panel">
    <!-- 搜索输入 -->
    <div class="search-section">
      <el-input
        v-model="searchText"
        placeholder="搜索消息内容..."
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 过滤选项 -->
    <div class="filter-section">
      <!-- 发送者过滤 -->
      <div class="filter-item">
        <label>发送者</label>
        <el-select
          v-model="selectedSender"
          placeholder="所有用户"
          clearable
          @change="handleSearch"
        >
          <el-option label="所有用户" value=""></el-option>
          <el-option
            v-for="sender in senders"
            :key="sender.userId"
            :label="sender.name"
            :value="sender.userId"
          />
        </el-select>
      </div>

      <!-- 消息类型过滤 -->
      <div class="filter-item">
        <label>消息类型</label>
        <el-select
          v-model="selectedType"
          placeholder="所有类型"
          clearable
          @change="handleSearch"
        >
          <el-option label="所有类型" value=""></el-option>
          <el-option label="文本" value="text" />
          <el-option label="代码" value="code" />
          <el-option label="图片" value="image" />
          <el-option label="文件" value="file" />
        </el-select>
      </div>

      <!-- 标记过滤 -->
      <div class="filter-item">
        <label>标记状态</label>
        <el-select
          v-model="selectedMark"
          placeholder="所有消息"
          clearable
          @change="handleSearch"
        >
          <el-option label="所有消息" value=""></el-option>
          <el-option label="重要" value="important" />
          <el-option label="待办" value="todo" />
          <el-option label="未标记" value="unmarked" />
        </el-select>
      </div>

      <!-- 时间范围 -->
      <div class="filter-item">
        <label>时间范围</label>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleSearch"
        />
      </div>
    </div>

    <!-- 高级选项 -->
    <div class="advanced-options">
      <el-checkbox v-model="searchInCode" @change="handleSearch">
        搜索代码内容
      </el-checkbox>
      <el-checkbox v-model="exactMatch" @change="handleSearch">
        精确匹配
      </el-checkbox>
      <el-checkbox v-model="caseInsensitive" @change="handleSearch">
        忽略大小写
      </el-checkbox>
    </div>

    <!-- 搜索结果 -->
    <div class="results-section">
      <div class="results-header">
        <span>搜索结果 ({{ filteredMessages.length }})</span>
        <el-button text size="small" @click="clearFilters">清空筛选</el-button>
      </div>

      <div v-if="filteredMessages.length > 0" class="results-list">
        <div
          v-for="msg in filteredMessages"
          :key="msg.id"
          class="result-item"
          @click="$emit('message-found', msg)"
        >
          <!-- 发送者信息 -->
          <div class="result-header">
            <el-avatar :size="28" :src="msg.senderAvatar" class="avatar">
              {{ msg.senderName?.charAt(0) || '?' }}
            </el-avatar>
            <div class="sender-info">
              <span class="sender-name">{{ msg.senderName }}</span>
              <span class="time">{{ formatTime(msg.timestamp) }}</span>
            </div>
          </div>

          <!-- 消息内容 -->
          <div class="result-content">
            <MarkdownRenderer
              :content="highlightSearchText(msg.content)"
              :content-type="msg.contentType || 'text'"
            />
          </div>

          <!-- 标签 -->
          <div v-if="msg.marks && msg.marks.length > 0" class="result-marks">
            <el-tag
              v-for="mark in msg.marks"
              :key="mark"
              :type="getMarkType(mark)"
              size="small"
            >
              {{ getMarkLabel(mark) }}
            </el-tag>
          </div>

          <!-- 操作 -->
          <div class="result-actions">
            <el-button text size="small" @click.stop="$emit('forward-message', msg)">
              转发
            </el-button>
            <el-button text size="small" @click.stop="$emit('collect-message', msg)">
              收藏
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty :description="searchText ? '未找到匹配的消息' : '输入搜索内容'" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import MarkdownRenderer from '../MessageEnhancements/MarkdownRenderer.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  senders: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['message-found', 'forward-message', 'collect-message'])

// 搜索参数
const searchText = ref('')
const selectedSender = ref('')
const selectedType = ref('')
const selectedMark = ref('')
const dateRange = ref([])

// 高级选项
const searchInCode = ref(true)
const exactMatch = ref(false)
const caseInsensitive = ref(true)

// 过滤消息
const filteredMessages = computed(() => {
  return props.messages.filter(msg => {
    // 文本搜索
    if (searchText.value) {
      const searchTerm = caseInsensitive.value
        ? searchText.value.toLowerCase()
        : searchText.value
      const content = caseInsensitive.value
        ? (msg.content || '').toLowerCase()
        : msg.content || ''

      if (exactMatch.value) {
        if (content !== searchTerm) return false
      } else {
        if (!content.includes(searchTerm)) return false
      }
    }

    // 发送者过滤
    if (selectedSender.value && msg.senderId !== selectedSender.value) {
      return false
    }

    // 消息类型过滤
    if (selectedType.value && msg.type !== selectedType.value) {
      return false
    }

    // 标记过滤
    if (selectedMark.value) {
      if (selectedMark.value === 'unmarked') {
        if (msg.marks && msg.marks.length > 0) return false
      } else {
        if (!msg.marks || !msg.marks.includes(selectedMark.value)) {
          return false
        }
      }
    }

    // 时间范围过滤
    if (dateRange.value && dateRange.value.length === 2) {
      const msgTime = dayjs(msg.timestamp)
      const [startDate, endDate] = dateRange.value
      if (!msgTime.isBetween(dayjs(startDate), dayjs(endDate), null, '[]')) {
        return false
      }
    }

    return true
  })
})

// 高亮搜索词
function highlightSearchText(content) {
  if (!searchText.value) return content

  const regex = new RegExp(
    `(${searchText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    caseInsensitive.value ? 'gi' : 'g'
  )

  return content.replace(regex, '**$1**')
}

function handleSearch() {
  // 触发搜索事件，可以用于实时搜索
}

function clearFilters() {
  searchText.value = ''
  selectedSender.value = ''
  selectedType.value = ''
  selectedMark.value = ''
  dateRange.value = []
}

function formatTime(timestamp) {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

function getMarkType(mark) {
  const types = {
    important: 'danger',
    todo: 'warning'
  }
  return types[mark] || 'info'
}

function getMarkLabel(mark) {
  const labels = {
    important: '重要',
    todo: '待办'
  }
  return labels[mark] || mark
}
</script>

<style scoped>
.advanced-search-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.search-section {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.filter-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.filter-item :deep(.el-input),
.filter-item :deep(.el-select),
.filter-item :deep(.el-date-editor) {
  width: 100%;
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 12px;
}

.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  font-size: 13px;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.result-item:hover {
  background: #f0f0f0;
  border-left-color: #409eff;
  transform: translateX(4px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.avatar {
  flex-shrink: 0;
}

.sender-info {
  flex: 1;
  min-width: 0;
}

.sender-name {
  font-weight: 500;
  color: #333;
  display: block;
}

.time {
  font-size: 11px;
  color: #999;
  display: block;
  margin-top: 2px;
}

.result-content {
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.result-marks {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.result-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* 响应式 */
@media (max-width: 768px) {
  .filter-section {
    grid-template-columns: 1fr;
  }
}
</style>
