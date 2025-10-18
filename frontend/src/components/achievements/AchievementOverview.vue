<template>
  <div class="achievement-overview">
    <div class="overview-header">
      <h2 class="section-title">成就总览</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleViewProgress">
          <el-icon><TrendCharts /></el-icon>
          查看进度
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <!-- 总成就数 -->
      <EnhancedStatsCard
        type="total"
        label="总成就数"
        :value="stats.total"
        :value-unit="'个'"
        icon="Trophy"
        icon-color="#909399"
        :loading="loading"
        :clickable="false"
        :show-trend="false"
      />

      <!-- 已解锁成就 -->
      <EnhancedStatsCard
        type="unlocked"
        label="已解锁"
        :value="stats.unlocked"
        :value-unit="'个'"
        icon="Trophy"
        icon-color="#67c23a"
        :loading="loading"
        :clickable="true"
        :show-trend="false"
        @click="handleStatsClick('unlocked')"
      />

      <!-- 解锁率 -->
      <EnhancedStatsCard
        type="rate"
        label="解锁率"
        :value="stats.unlockedRate"
        :value-unit="'%'"
        icon="TrendCharts"
        icon-color="#409eff"
        :loading="loading"
        :clickable="false"
        :show-trend="false"
        :show-progress="true"
        :progress-data="{
          percentage: stats.unlockedRate,
          color: getProgressColor(stats.unlockedRate),
          strokeWidth: 8,
          text: `${stats.unlocked}/${stats.total}`,
          target: null
        }"
      />

      <!-- 待解锁成就 -->
      <EnhancedStatsCard
        type="locked"
        label="待解锁"
        :value="stats.locked"
        :value-unit="'个'"
        icon="Lock"
        icon-color="#f56c6c"
        :loading="loading"
        :clickable="true"
        :show-trend="false"
        @click="handleStatsClick('locked')"
      />
    </div>

    <!-- 成就等级展示 -->
    <div v-if="!loading" class="achievement-level">
      <div class="level-info">
        <div class="level-icon">
          <el-icon :size="48" :color="levelData.color">
            <component :is="levelData.icon" />
          </el-icon>
        </div>
        <div class="level-details">
          <h3 class="level-title">{{ levelData.title }}</h3>
          <p class="level-description">{{ levelData.description }}</p>
          <div class="level-progress">
            <span class="progress-text">距离下一等级还需</span>
            <span class="progress-value">{{ levelData.nextLevelRequirement }}</span>
            <span class="progress-unit">个成就</span>
          </div>
        </div>
      </div>

      <div class="level-progress-bar">
        <el-progress
          :percentage="levelData.progressPercentage"
          :color="levelData.color"
          :stroke-width="12"
          :show-text="false"
          class="custom-progress"
        />
        <div class="progress-labels">
          <span class="current-level">{{ levelData.title }}</span>
          <span class="next-level">{{ levelData.nextLevel }}</span>
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div v-if="!loading" class="quick-stats">
      <div class="stat-item">
        <div class="stat-icon">
          <el-icon :color="'#67c23a'"><Medal /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ rarityStats.legendary || 0 }}</span>
          <span class="stat-label">传说成就</span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon">
          <el-icon :color="'#e6a23c'"><Star /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ rarityStats.epic || 0 }}</span>
          <span class="stat-label">史诗成就</span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon">
          <el-icon :color="'#409eff'"><Gem /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ rarityStats.rare || 0 }}</span>
          <span class="stat-label">稀有成就</span>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon">
          <el-icon :color="'#909399'"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ rarityStats.common || 0 }}</span>
          <span class="stat-label">普通成就</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Trophy, Lock, TrendCharts,
  Medal, Star, CircleCheck, GoldMedal, Gem
} from '@element-plus/icons-vue'

const iconRegistry = {
  Trophy,
  Lock,
  TrendCharts,
  Medal,
  Star,
  CircleCheck,
  GoldMedal,
  Gem
}

const resolveIcon = (iconName, fallback) => {
  if (!iconName) return fallback
  if (typeof iconName === 'string') {
    return iconRegistry[iconName] || fallback
  }
  return iconName
}

import EnhancedStatsCard from '@/components/statistics/EnhancedStatsCard.vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      unlocked: 0,
      locked: 0,
      unlockedRate: 0
    })
  },
  loading: {
    type: Boolean,
    default: false
  },
  achievements: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['view-progress', 'stats-click'])

// 计算各稀有度成就统计
const rarityStats = computed(() => {
  const stats = {}
  props.achievements.forEach(achievement => {
    if (achievement.progress?.unlocked) {
      const rarity = achievement.rarity || 'common'
      stats[rarity] = (stats[rarity] || 0) + 1
    }
  })
  return stats
})

// 计算成就等级数据
const levelData = computed(() => {
  const unlocked = props.stats.unlocked || 0

  // 定义等级系统
  const levels = [
    { threshold: 0, title: '新手探索者', icon: 'CircleCheck', color: '#909399', description: '刚开始成就之旅' },
    { threshold: 5, title: '成就学徒', icon: 'Star', color: '#409eff', description: '已经掌握基础技能' },
    { threshold: 15, title: '成就专家', icon: 'Trophy', color: '#67c23a', description: '在多个领域都有建树' },
    { threshold: 30, title: '成就大师', icon: 'Medal', color: '#e6a23c', description: '技能娴熟，经验丰富' },
    { threshold: 50, title: '传奇收集者', icon: 'GoldMedal', color: '#f56c6c', description: '成就收集的传奇人物' },
    { threshold: 100, title: '至尊成就王', icon: 'GoldMedal', color: '#722ed1', description: '站在成就系统的巅峰' }
  ]

  let currentLevel = levels[0]
  let nextLevel = levels[1]

  for (let i = levels.length - 1; i >= 0; i--) {
    if (unlocked >= levels[i].threshold) {
      currentLevel = levels[i]
      nextLevel = levels[i + 1] || { threshold: levels[i].threshold, title: '已达巅峰' }
      break
    }
  }

  const nextLevelRequirement = nextLevel.threshold - unlocked
  const currentLevelProgress = unlocked - currentLevel.threshold
  const levelRange = nextLevel.threshold - currentLevel.threshold
  const progressPercentage = levelRange > 0 ? Math.min(100, (currentLevelProgress / levelRange) * 100) : 100

  const resolvedIcon = resolveIcon(currentLevel.icon, Trophy)
  return {
    ...currentLevel,
    icon: resolvedIcon,
    nextLevel: nextLevel.title,
    nextLevelRequirement: Math.max(0, nextLevelRequirement),
    progressPercentage: Math.round(progressPercentage)
  }
})

// 进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#409eff'
  if (percentage >= 40) return '#e6a23c'
  if (percentage >= 20) return '#f56c6c'
  return '#909399'
}

// 事件处理
const handleViewProgress = () => {
  emit('view-progress')
}

const handleStatsClick = (type) => {
  emit('stats-click', type)
}
</script>

<style scoped>
.achievement-overview {
  margin-bottom: 32px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.achievement-level {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.level-info {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.level-icon {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.level-details {
  flex: 1;
}

.level-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.level-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 16px 0;
}

.level-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #909399;
}

.progress-value {
  font-weight: 600;
  color: #409eff;
}

.level-progress-bar {
  position: relative;
}

.custom-progress {
  margin-bottom: 12px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #909399;
}

.current-level {
  font-weight: 600;
}

.next-level {
  color: #409eff;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .achievement-level {
    padding: 24px 20px;
  }

  .level-info {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .level-icon {
    width: 64px;
    height: 64px;
  }

  .level-title {
    font-size: 24px;
  }

  .quick-stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .stat-item {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 20px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .achievement-level,
  .stat-item {
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e2e 100%);
  }

  .level-title {
    color: #fff;
  }

  .level-description,
  .stat-label {
    color: #ccc;
  }

  .stat-value {
    color: #fff;
  }

  .progress-labels {
    color: #ccc;
  }

  .next-level {
    color: #409eff;
  }
}
</style>
