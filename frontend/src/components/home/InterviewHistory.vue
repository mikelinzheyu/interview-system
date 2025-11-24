<template>
  <div class="interview-history">
    <div class="history-header">
      <div>
        <h3 class="history-title">面试历史</h3>
        <p class="history-subtitle">查看你过去的模拟面试记录</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="error" class="error-state">
      <el-alert
        type="error"
        :title="error"
        show-icon
        closable
        @close="clearError"
      />
    </div>

    <div v-else-if="historyData.length === 0" class="empty-state">
      <el-empty description="暂无面试历史" :image-size="100" />
    </div>

    <div v-else class="table-wrapper">
      <table class="history-table">
        <thead>
          <tr>
            <th class="col-topic">话题</th>
            <th class="col-date">日期</th>
            <th class="col-duration">时长</th>
            <th class="col-score">评分</th>
            <th class="col-status">状态</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in historyData" :key="item.id" class="history-row">
            <td class="col-topic">
              <div class="topic-cell">
                <button
                  class="favorite-btn"
                  @click="handleToggleFavorite(item.id)"
                  :class="{ favorited: item.isFavorite }"
                  :title="item.isFavorite ? '取消收藏' : '收藏'"
                >
                  <el-icon><Star /></el-icon>
                </button>
                <span class="topic-text">{{ item.topic }}</span>
              </div>
            </td>
            <td class="col-date">
              <div class="date-cell">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(item.date) }}
              </div>
            </td>
            <td class="col-duration">
              <div class="duration-cell">
                <el-icon><Clock /></el-icon>
                {{ item.duration }}
              </div>
            </td>
            <td class="col-score">
              <span class="score-badge" :class="getScoreBadgeClass(item.score)">
                {{ item.score }} 分
              </span>
            </td>
            <td class="col-status">
              <span class="status-badge" :class="getStatusClass(item.status)">
                {{ item.status }}
              </span>
            </td>
            <td class="col-actions">
              <button class="action-link" @click="handleViewDetail(item)">
                查看详情
                <el-icon><ArrowRight /></el-icon>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Calendar, Clock, Star } from '@element-plus/icons-vue'

interface HistoryItem {
  id: number
  topic: string
  date: string
  duration: string
  score: number
  status: string
  isFavorite: boolean
}

const props = defineProps<{
  data: HistoryItem[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite', id: number): void
  (e: 'view-detail', item: HistoryItem): void
  (e: 'clear-error'): void
}>()

const historyData = computed(() => props.data)
const loading = computed(() => props.loading ?? false)
const error = computed(() => props.error ?? null)

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString('zh-CN')
  } catch {
    return date
  }
}

const getScoreBadgeClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  return 'score-normal'
}

const getStatusClass = (status: string) => {
  if (status.includes('复习')) return 'needs-review'
  if (status.includes('完成')) return 'completed'
  return ''
}

const handleToggleFavorite = (id: number) => {
  emit('toggle-favorite', id)
}

const handleViewDetail = (item: HistoryItem) => {
  emit('view-detail', item)
}

const clearError = () => {
  emit('clear-error')
}
</script>

<style scoped lang="scss">
.interview-history {
  width: 100%;
}

.history-header {
  margin-bottom: 12px;
}

.history-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2430;
  margin: 0;
}

.history-subtitle {
  font-size: 12px;
  color: #9aa0ad;
  margin: 4px 0 0;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.error-state {
  margin-bottom: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: #f7f8fa;

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #8b93a3;
      border-bottom: 1px solid #eef0f3;
      white-space: nowrap;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f2f5;
      transition: background 0.2s ease;

      &:hover {
        background: #fafbfc;
      }

      td {
        padding: 12px;
        color: #1f2430;
      }
    }
  }
}

.col-topic {
  width: 32%;
}

.col-date,
.col-duration,
.col-score,
.col-status,
.col-actions {
  text-align: left;
}

.topic-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.favorite-btn {
  background: #fff;
  border: 1px solid #f0f2f5;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c9cdd4;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;

  &:hover,
  &.favorited {
    color: #f5a524;
    border-color: rgba(245, 165, 36, 0.35);
    background: #fffaf1;
    transform: translateY(-1px);
  }

  .el-icon {
    font-size: 16px;
  }
}

.topic-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-cell,
.duration-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4a5060;

  .el-icon {
    font-size: 14px;
    flex-shrink: 0;
    opacity: 0.7;
  }
}

.score-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;

  &.score-excellent {
    background: #e8f8ef;
    color: #22c55e;
  }

  &.score-good {
    background: #eaf2ff;
    color: #1d4ed8;
  }

  &.score-normal {
    background: #fff3e6;
    color: #f59e0b;
  }
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  background: #f3f4f6;

  &.completed {
    color: #22c55e;
    background: #e8f8ef;
  }

  &.needs-review {
    color: #f59e0b;
    background: #fff3e6;
  }
}

.col-actions {
  width: 14%;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #0071e3;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 8px;
  border-radius: 10px;
  transition: all 0.2s;

  &:hover {
    background: #eef4ff;

    .el-icon {
      transform: translateX(2px);
    }
  }

  .el-icon {
    font-size: 12px;
    transition: transform 0.2s;
  }
}

@media (max-width: 768px) {
  .col-topic {
    width: 40%;
  }

  .history-table {
    font-size: 12px;

    th,
    td {
      padding: 10px 8px;
    }
  }
}
</style>
