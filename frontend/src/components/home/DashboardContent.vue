<template>
  <section class="dashboard-content">
    <!-- Learning Dynamics & Error Notes -->
    <div class="content-grid">
      <div class="content-card chart-card">
        <div class="card-header">
          <h3>学习动态</h3>
          <p>过去 7 天的学习进度</p>
        </div>
        <ProgressChart v-if="chartData" :data="chartData" />
      </div>

      <div class="content-card error-card">
        <div class="card-header">
          <div>
            <h3>错题本</h3>
            <p>回顾你最近的错误</p>
          </div>
          <button class="view-all-btn" @click="handleViewWrongAnswers">查看全部</button>
        </div>
        <div class="error-list">
          <div class="error-item">
            <el-icon><Document /></el-icon>
            <span>React useEffect 依赖项</span>
          </div>
          <div class="error-item">
            <el-icon><Document /></el-icon>
            <span>Java HashMap 内部实现</span>
          </div>
          <div class="error-item">
            <el-icon><Document /></el-icon>
            <span>SQL 索引优化</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Interview History -->
    <div class="content-card history-card">
      <div class="card-header">
        <h3>面试历史</h3>
        <p>查看你过去的模拟面试记录</p>
      </div>
      <InterviewHistory v-if="interviewHistory" :data="interviewHistory" @toggle-favorite="toggleFavorite" />
    </div>

    <!-- Ability & Activities -->
    <div class="content-grid">
      <div class="content-card ability-card">
        <div class="card-header">
          <h3>能力画像</h3>
          <p>基于表现的技能细分</p>
        </div>
        <SkillDistributionChart v-if="skillData" :data="skillData" />
      </div>

      <div class="content-card activity-card">
        <div class="card-header">
          <h3>最近活动</h3>
          <button class="view-all-btn">查看全部</button>
        </div>
        <ActivityTimeline v-if="activities" :data="activities" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import ProgressChart from '@/components/charts/ProgressChart.vue'
import SkillDistributionChart from '@/components/charts/SkillDistributionChart.vue'
import InterviewHistory from '@/components/home/InterviewHistory.vue'
import ActivityTimeline from '@/components/home/ActivityTimeline.vue'

defineProps<{
  chartData?: any
  skillData?: any
  interviewHistory?: any
  activities?: any
}>()

const emit = defineEmits(['toggle-favorite', 'view-wrong-answers'])

const toggleFavorite = (id: number) => {
  emit('toggle-favorite', id)
}

const handleViewWrongAnswers = () => {
  emit('view-wrong-answers')
}
</script>

<style scoped lang="scss">
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;

  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}

.card-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
    margin: 0 0 4px;
  }

  p {
    font-size: 12px;
    color: #909399;
    margin: 0;
  }
}

.view-all-btn {
  background: none;
  border: none;
  color: #0071e3;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fef3e6;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;

  :deep(.el-icon) {
    font-size: 16px;
    color: #e6a23c;
    flex-shrink: 0;
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .content-card {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
  }

  .dashboard-content {
    gap: 16px;
  }

  .content-grid {
    gap: 16px;
  }
}
</style>
