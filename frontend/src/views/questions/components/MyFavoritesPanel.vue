<template>
  <div class="favorites-panel">
    <el-skeleton v-if="loading" animated :rows="6" />

    <template v-else>
      <div v-if="items.length" class="favorites-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="favorite-card"
        >
          <div class="card-header">
            <div class="card-title-section">
              <span class="card-icon">{{ item.icon }}</span>
              <div>
                <h4>{{ item.name }}</h4>
                <p>{{ item.category }}</p>
              </div>
            </div>
            <el-button
              link
              type="danger"
              size="small"
              @click="$emit('remove', item.id)"
            >
              取消收藏
            </el-button>
          </div>

          <div class="card-stats">
            <span>{{ item.questionCount }} 道题</span>
            <span class="divider" />
            <span>{{ item.progress }}% 完成</span>
            <span class="divider" />
            <span>{{ item.lastAccessed }}</span>
          </div>

          <div class="card-progress">
            <el-progress :percentage="item.progress" :show-text="false" size="small" />
          </div>

          <div class="card-actions">
            <el-button type="primary" text size="small" @click="$emit('continue', item)">
              继续学习
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button text size="small" @click="$emit('view', item)">
              查看详情
            </el-button>
          </div>
        </div>
      </div>
      <el-empty v-else description="还没有收藏任何学科，快去探索吧！" />

      <div v-if="items.length" class="favorites-stats">
        <el-card shadow="hover">
          <template #header>
            <div class="stats-header">
              <span>收藏统计</span>
            </div>
          </template>
          <div class="stats-content">
            <div class="stat">
              <span class="stat-number">{{ items.length }}</span>
              <span class="stat-label">已收藏</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ averageProgress }}%</span>
              <span class="stat-label">平均进度</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ totalQuestions }}</span>
              <span class="stat-label">题目总数</span>
            </div>
          </div>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['continue', 'remove', 'view'])

const averageProgress = computed(() => {
  if (!props.items.length) return 0
  const sum = props.items.reduce((acc, item) => acc + (Number(item.progress) || 0), 0)
  return Math.round(sum / props.items.length)
})

const totalQuestions = computed(() =>
  props.items.reduce((acc, item) => acc + (Number(item.questionCount) || 0), 0)
)
</script>

<style scoped lang="scss">
.favorites-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorite-card {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 20px 38px rgba(15, 23, 42, 0.12);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title-section {
  display: flex;
  gap: 12px;
  align-items: center;

  h4 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 13px;
  }
}

.card-icon {
  font-size: 28px;
}

.card-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  color: #4b5563;
  font-size: 13px;
}

.divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #d1d5db;
}

.card-progress {
  width: 100%;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.favorites-stats {
  .stats-header {
    font-weight: 600;
    color: #1f2937;
  }

  .stats-content {
    display: flex;
    gap: 24px;
    justify-content: space-between;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;

    .stat-number {
      font-size: 20px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }
  }
}
</style>
