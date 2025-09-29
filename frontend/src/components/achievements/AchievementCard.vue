<template>
  <div
    class="achievement-card"
    :class="[
      `rarity-${achievement.rarity}`,
      { unlocked: achievement.progress?.unlocked, compact: compact }
    ]"
    @click="handleClick"
  >
    <!-- 成就状态标识 -->
    <div class="achievement-status">
      <div class="status-indicator" :class="statusClass">
        <el-icon :size="16">
          <component :is="statusIcon" />
        </el-icon>
      </div>
      <div class="rarity-badge" :class="`rarity-${achievement.rarity}`">
        {{ rarityText }}
      </div>
    </div>

    <!-- 成就图标 -->
    <div class="achievement-icon-wrapper">
      <div class="achievement-icon" :style="{ backgroundColor: iconBgColor }">
        <el-icon :size="compact ? 32 : 40" :color="iconColor">
          <component :is="achievement.icon || 'Trophy'" />
        </el-icon>
      </div>

      <!-- 解锁光效 -->
      <div v-if="achievement.progress?.unlocked" class="unlock-glow"></div>

      <!-- 新解锁标识 -->
      <div v-if="isRecentlyUnlocked" class="new-unlock-badge">
        <el-icon size="12"><Star /></el-icon>
        <span>新</span>
      </div>
    </div>

    <!-- 成就信息 -->
    <div class="achievement-info">
      <h4 class="achievement-title">{{ achievement.title }}</h4>
      <p class="achievement-description">{{ achievement.description }}</p>

      <!-- 进度条 -->
      <div class="achievement-progress">
        <div class="progress-info">
          <span class="progress-text">
            {{ formatProgress(achievement.progress?.progress || 0) }} / {{ formatRequirement(achievement.requirement) }}
          </span>
          <span class="progress-percentage">{{ progressPercentage }}%</span>
        </div>

        <el-progress
          :percentage="progressPercentage"
          :color="progressColor"
          :stroke-width="compact ? 4 : 6"
          :show-text="false"
          class="progress-bar"
        />
      </div>

      <!-- 解锁时间 -->
      <div v-if="achievement.progress?.unlocked && achievement.progress?.unlockedAt" class="unlock-time">
        <el-icon size="12" color="#909399"><Clock /></el-icon>
        <span class="time-text">{{ formatUnlockTime(achievement.progress.unlockedAt) }}</span>
      </div>

      <!-- 解锁条件 -->
      <div v-else-if="!achievement.progress?.unlocked" class="unlock-requirement">
        <el-icon size="12" color="#c0c4cc"><InfoFilled /></el-icon>
        <span class="requirement-text">{{ getRequirementText() }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="achievement-actions" v-if="!compact">
      <el-button
        size="small"
        type="primary"
        text
        @click.stop="handleShare"
        v-if="achievement.progress?.unlocked"
      >
        <el-icon><Share /></el-icon>
        分享
      </el-button>

      <el-button
        size="small"
        type="info"
        text
        @click.stop="handleViewDetail"
      >
        <el-icon><View /></el-icon>
        详情
      </el-button>
    </div>

    <!-- 点击波纹效果 -->
    <div class="click-ripple" ref="rippleRef"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Trophy, Star, Clock, InfoFilled, Share, View,
  CircleCheckFilled, Lock, Loading
} from '@element-plus/icons-vue'

const props = defineProps({
  achievement: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'share', 'view-detail'])

const rippleRef = ref(null)

// 计算属性
const isRecentlyUnlocked = computed(() => {
  if (!props.achievement.progress?.unlockedAt) return false
  const unlockTime = new Date(props.achievement.progress.unlockedAt)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return unlockTime > oneDayAgo
})

const progressPercentage = computed(() => {
  const progress = props.achievement.progress?.progress || 0
  const requirement = props.achievement.requirement
  return Math.min(100, Math.round((progress / requirement) * 100))
})

const progressColor = computed(() => {
  if (props.achievement.progress?.unlocked) return '#67c23a'

  const percentage = progressPercentage.value
  if (percentage >= 80) return '#409eff'
  if (percentage >= 60) return '#e6a23c'
  if (percentage >= 40) return '#f56c6c'
  return '#c0c4cc'
})

const statusClass = computed(() => {
  if (props.achievement.progress?.unlocked) return 'status-unlocked'
  if ((props.achievement.progress?.progress || 0) > 0) return 'status-progress'
  return 'status-locked'
})

const statusIcon = computed(() => {
  if (props.achievement.progress?.unlocked) return 'CircleCheckFilled'
  if ((props.achievement.progress?.progress || 0) > 0) return 'Loading'
  return 'Lock'
})

const rarityText = computed(() => {
  const rarityMap = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return rarityMap[props.achievement.rarity] || '普通'
})

const iconColor = computed(() => {
  const colorMap = {
    VideoCamera: '#409eff',
    Clock: '#67c23a',
    Trophy: '#e6a23c',
    Star: '#f56c6c',
    Medal: '#722ed1',
    GoldMedal: '#fa8c16'
  }
  return colorMap[props.achievement.icon] || '#409eff'
})

const iconBgColor = computed(() => {
  const color = iconColor.value
  return `${color}20`
})

// 方法
const formatProgress = (progress) => {
  if (props.achievement.type === 'time') {
    return formatTime(progress)
  } else if (props.achievement.type === 'score') {
    return progress.toFixed(1)
  }
  return progress.toString()
}

const formatRequirement = (requirement) => {
  if (props.achievement.type === 'time') {
    return formatTime(requirement)
  } else if (props.achievement.type === 'score') {
    return requirement.toFixed(1)
  }
  return requirement.toString()
}

const formatTime = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`
  }
  return `${minutes}分钟`
}

const formatUnlockTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}天前`
  } else if (diffHours > 0) {
    return `${diffHours}小时前`
  } else {
    return '刚刚'
  }
}

const getRequirementText = () => {
  const typeMap = {
    count: '完成次数',
    time: '累计时长',
    score: '达到分数',
    single_score: '单次分数',
    streak: '连续天数'
  }
  const typeText = typeMap[props.achievement.type] || '完成条件'
  return `${typeText}: ${formatRequirement(props.achievement.requirement)}`
}

// 事件处理
const handleClick = (event) => {
  createRipple(event)
  emit('click', props.achievement)
}

const handleShare = () => {
  emit('share', props.achievement)
}

const handleViewDetail = () => {
  emit('view-detail', props.achievement)
}

// 波纹效果
const createRipple = (event) => {
  if (!rippleRef.value) return

  const ripple = rippleRef.value
  const rect = ripple.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  // 清除之前的波纹
  ripple.innerHTML = ''

  // 创建新的波纹
  const circle = document.createElement('span')
  circle.className = 'ripple-circle'
  circle.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
  `

  ripple.appendChild(circle)

  // 自动清理
  setTimeout(() => {
    if (ripple.contains(circle)) {
      ripple.removeChild(circle)
    }
  }, 600)
}
</script>

<style scoped>
.achievement-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.achievement-card.compact {
  padding: 16px;
}

.achievement-card.unlocked {
  border-color: rgba(103, 194, 58, 0.3);
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
}

/* 稀有度样式 */
.achievement-card.rarity-rare {
  border-left: 4px solid #409eff;
}

.achievement-card.rarity-epic {
  border-left: 4px solid #e6a23c;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.achievement-card.rarity-legendary {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%);
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.2);
}

.achievement-status {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.status-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.status-unlocked {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-progress {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.status-locked {
  background: rgba(192, 196, 204, 0.2);
  color: #c0c4cc;
}

.rarity-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rarity-badge.rarity-common {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.rarity-badge.rarity-rare {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.rarity-badge.rarity-epic {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.rarity-badge.rarity-legendary {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.achievement-icon-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.achievement-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.compact .achievement-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
}

.achievement-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
}

.unlock-glow {
  position: absolute;
  inset: -4px;
  border-radius: 24px;
  background: linear-gradient(45deg, #67c23a, #85ce61);
  opacity: 0.3;
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  0% { opacity: 0.2; transform: scale(1); }
  100% { opacity: 0.4; transform: scale(1.05); }
}

.new-unlock-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #f56c6c, #ff7875);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
}

.achievement-info {
  text-align: center;
  margin-bottom: 16px;
}

.achievement-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.compact .achievement-title {
  font-size: 16px;
}

.achievement-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.compact .achievement-description {
  font-size: 13px;
}

.achievement-progress {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 8px;
}

.progress-text {
  color: #606266;
}

.progress-percentage {
  color: #409eff;
  font-weight: 600;
}

.progress-bar {
  margin-bottom: 8px;
}

.unlock-time,
.unlock-requirement {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.time-text,
.requirement-text {
  font-size: 12px;
}

.achievement-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 波纹效果 */
.click-ripple {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 16px;
}

.ripple-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.2);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
}

@keyframes ripple-animation {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .achievement-card {
    padding: 20px 16px;
  }

  .compact {
    padding: 14px 12px;
  }

  .achievement-icon {
    width: 64px;
    height: 64px;
  }

  .compact .achievement-icon {
    width: 48px;
    height: 48px;
  }

  .achievement-title {
    font-size: 16px;
  }

  .achievement-description {
    font-size: 13px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .achievement-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e2e 100%);
  }

  .achievement-title {
    color: #fff;
  }

  .achievement-description {
    color: #ccc;
  }

  .progress-text {
    color: #ccc;
  }

  .unlock-time,
  .unlock-requirement {
    color: #999;
  }
}
</style>