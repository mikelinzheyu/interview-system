<template>
  <div class="quick-access-bar">
    <!-- 快速过滤按钮 -->
    <div class="filter-buttons">
      <el-button
        :type="filters.showPinned ? 'primary' : 'info'"
        size="small"
        @click="toggleFilter('showPinned')"
        :plain="!filters.showPinned"
      >
        📌 钉住 ({{ pinnedCount }})
      </el-button>

      <el-button
        :type="filters.showRecent ? 'primary' : 'info'"
        size="small"
        @click="toggleFilter('showRecent')"
        :plain="!filters.showRecent"
      >
        🕐 最近 ({{ recentCount }})
      </el-button>

      <el-button
        :type="filters.showImportant ? 'primary' : 'info'"
        size="small"
        @click="toggleFilter('showImportant')"
        :plain="!filters.showImportant"
      >
        ⭐ 重要 ({{ importantCount }})
      </el-button>

      <el-button
        :type="filters.showTodo ? 'primary' : 'info'"
        size="small"
        @click="toggleFilter('showTodo')"
        :plain="!filters.showTodo"
      >
        ✓ 待办 ({{ todoCount }})
      </el-button>

      <el-divider direction="vertical" />

      <el-dropdown trigger="click">
        <el-button size="small" type="info">
          排序 ⬇️
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="setSortBy('recency')">最近</el-dropdown-item>
            <el-dropdown-item @click="setSortBy('importance')">重要性</el-dropdown-item>
            <el-dropdown-item @click="setSortBy('engagement')">参与度</el-dropdown-item>
            <el-dropdown-item @click="setSortBy('oldest')">最旧</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        v-if="hasActiveFilters"
        link
        text
        size="small"
        type="danger"
        @click="clearFilters"
      >
        清除过滤
      </el-button>
    </div>

    <!-- 钉住消息 Dropdown -->
    <el-dropdown v-if="pinnedMessages.length > 0" trigger="click">
      <el-button link text size="small">
        📌 钉住消息 ({{ pinnedMessages.length }})
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="msg in pinnedMessages"
            :key="msg.messageId"
            @click="viewMessage(msg.messageId)"
          >
            <span class="pinned-item">
              {{ truncateText(msg.content, 30) }}
            </span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 最近消息 Dropdown -->
    <el-dropdown v-if="recentMessages.length > 0" trigger="click">
      <el-button link text size="small">
        🕐 最近消息 ({{ recentMessages.length }})
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="msg in recentMessages"
            :key="msg.messageId"
            @click="viewMessage(msg.messageId)"
          >
            <span class="recent-item">
              {{ truncateText(msg.content, 30) }}
            </span>
          </el-dropdown-item>
          <el-divider />
          <el-dropdown-item @click="clearRecent">
            清除历史
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  pinnedMessages: {
    type: Array,
    default: () => []
  },
  recentMessages: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    default: () => ({
      showPinned: false,
      showRecent: false,
      showImportant: false,
      showTodo: false
    })
  },
  importantCount: {
    type: Number,
    default: 0
  },
  todoCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'toggle-filter',
  'set-sort',
  'clear-filters',
  'clear-recent',
  'view-message'
])

const pinnedCount = computed(() => props.pinnedMessages.length)
const recentCount = computed(() => props.recentMessages.length)
const hasActiveFilters = computed(() => {
  return Object.values(props.filters).some(v => v === true)
})

/**
 * 切换过滤器
 */
function toggleFilter(filterName) {
  emit('toggle-filter', filterName)
  const state = props.filters[filterName]
  ElMessage.info(`${state ? '启用' : '禁用'} ${filterName}`)
}

/**
 * 设置排序方式
 */
function setSortBy(option) {
  emit('set-sort', option)
  ElMessage.info(`按 ${option} 排序`)
}

/**
 * 清除过滤器
 */
function clearFilters() {
  emit('clear-filters')
  ElMessage.success('已清除所有过滤器')
}

/**
 * 清除最近消息
 */
function clearRecent() {
  emit('clear-recent')
  ElMessage.success('已清除最近消息历史')
}

/**
 * 查看消息
 */
function viewMessage(messageId) {
  emit('view-message', messageId)
  ElMessage.info('正在查看消息...')
}

/**
 * 截断文本
 */
function truncateText(text, maxLength) {
  if (!text) return '(空消息)'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.quick-access-bar {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
  align-items: center;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-buttons :deep(.el-button) {
  font-size: 12px;
}

.filter-buttons :deep(.el-divider--vertical) {
  margin: 0 4px;
}

.pinned-item,
.recent-item {
  font-size: 12px;
  color: #606266;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
  font-size: 12px;
}
</style>
