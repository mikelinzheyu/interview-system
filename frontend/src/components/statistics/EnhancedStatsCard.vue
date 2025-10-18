<template>
  <el-card
    class="enhanced-stats-card"
    :class="[
      `stats-card-${type}`,
      { 'interactive': clickable, 'loading': loading }
    ]"
    @click="handleClick"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="stats-loading">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-content">
            <el-skeleton-item variant="circle" style="width: 40px; height: 40px;" />
            <div class="skeleton-text">
              <el-skeleton-item variant="h3" style="width: 60px;" />
              <el-skeleton-item variant="text" style="width: 80px;" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <!-- 正常内容 -->
    <div v-else class="stats-content">
      <!-- 趋势指示器 -->
      <div
        v-if="showTrend && trendData"
        class="trend-indicator"
        :class="`trend-${trendData.trend}`"
      >
        <el-icon :color="trendData.color" size="12">
          <TrendCharts v-if="trendData.trend === 'up'" />
          <TrendCharts v-else-if="trendData.trend === 'down'" style="transform: rotate(180deg);" />
          <Minus v-else />
        </el-icon>
        <span class="trend-text">{{ trendData.trendText }}</span>
      </div>

      <!-- 主要内容区域 -->
      <div class="stats-main">
        <div class="stats-icon-section">
          <div class="stats-icon" :style="{ backgroundColor: iconBgColor }">
            <el-icon :size="iconSize" :color="iconColor">
              <component :is="iconComponent" />
            </el-icon>
          </div>
        </div>

        <div class="stats-info">
          <div class="stats-value">
            <span class="value-main">{{ displayValue }}</span>
            <span v-if="valueUnit" class="value-unit">{{ valueUnit }}</span>
          </div>
          <div class="stats-label">{{ label }}</div>

          <!-- 副标题信息 -->
          <div v-if="subtitle" class="stats-subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress && progressData" class="stats-progress">
        <el-progress
          :percentage="progressData.percentage"
          :color="progressData.color"
          :stroke-width="progressData.strokeWidth || 6"
          :show-text="false"
          class="progress-bar"
        />
        <div class="progress-info">
          <span class="progress-text">{{ progressData.text }}</span>
          <span v-if="progressData.target" class="progress-target">
            / {{ progressData.target }}
          </span>
        </div>
      </div>

      <!-- 额外信息 -->
      <div v-if="extraInfo" class="stats-extra">
        <div v-for="(info, index) in extraInfo" :key="index" class="extra-item">
          <span class="extra-label">{{ info.label }}:</span>
          <span class="extra-value" :style="{ color: info.color }">{{ info.value }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="actions && actions.length > 0" class="stats-actions">
        <el-button
          v-for="action in actions"
          :key="action.key"
          :type="action.type || 'text'"
          :size="action.size || 'small'"
          @click.stop="handleAction(action)"
        >
          <el-icon v-if="resolveActionIcon(action.icon)">\r\n            <component :is="resolveActionIcon(action.icon)" />\r\n          </el-icon>
          {{ action.text }}
        </el-button>
      </div>

      <!-- 悬停详情 -->
      <el-tooltip
        v-if="tooltip"
        :content="tooltip"
        placement="top"
        :show-after="500"
      >
        <div class="tooltip-trigger"></div>
      </el-tooltip>
    </div>

    <!-- 点击波纹效果 -->
    <div v-if="clickable" ref="rippleRef" class="click-ripple"></div>
  </el-card>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import {
  TrendCharts, Minus, VideoCamera, Clock, Trophy, Star,
  ArrowRight, Refresh
} from '@element-plus/icons-vue'

const props = defineProps({
  // 基础属性
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['interviews', 'time', 'score', 'rank', 'default'].includes(value)
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  valueUnit: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: [String, Object, Function],
    default: 'VideoCamera'
  },
  iconColor: {
    type: String,
    default: '#409eff'
  },
  iconSize: {
    type: Number,
    default: 28
  },

  // 交互属性
  clickable: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },

  // 趋势相关
  showTrend: {
    type: Boolean,
    default: true
  },
  trendData: {
    type: Object,
    default: null
  },

  // 进度条
  showProgress: {
    type: Boolean,
    default: false
  },
  progressData: {
    type: Object,
    default: null
  },

  // 额外信息
  extraInfo: {
    type: Array,
    default: () => []
  },

  // 操作按钮
  actions: {
    type: Array,
    default: () => []
  },

  // 提示信息
  tooltip: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click', 'action'])

const rippleRef = ref(null)
const iconRegistry = {
  VideoCamera: markRaw(VideoCamera),
  Clock: markRaw(Clock),
  Trophy: markRaw(Trophy),
  Star: markRaw(Star),
  ArrowRight: markRaw(ArrowRight),
  Refresh: markRaw(Refresh),
  TrendCharts: markRaw(TrendCharts),
  Minus: markRaw(Minus)
}

const defaultIcon = iconRegistry.VideoCamera

const iconComponent = computed(() => {
  if (typeof props.icon === 'string') {
    return iconRegistry[props.icon] || defaultIcon
  }
  return props.icon ? markRaw(props.icon) : defaultIcon
})

const resolveActionIcon = (iconName) => {
  if (!iconName) return null
  if (typeof iconName === 'string') {
    return iconRegistry[iconName] || iconRegistry.ArrowRight
  }
  return markRaw(iconName)
}

// 计算属性
const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    // 数字格式化
    if (props.type === 'score') {
      return props.value.toFixed(1)
    } else if (props.value >= 1000000) {
      return (props.value / 1000000).toFixed(1) + 'M'
    } else if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + 'K'
    }
    return props.value.toString()
  }
  return props.value
})

const iconBgColor = computed(() => {
  const color = props.iconColor || '#409eff'
  // 根据图标颜色生成对应的半透明背景，保持视觉层次
  const colorMap = {
    '#409eff': 'rgba(64, 158, 255, 0.1)',     // 蓝色
    '#67c23a': 'rgba(103, 194, 58, 0.1)',     // 绿色
    '#e6a23c': 'rgba(230, 162, 60, 0.1)',     // 橙色
    '#f56c6c': 'rgba(245, 108, 108, 0.1)'     // 红色
  }
  return colorMap[color] || 'rgba(64, 158, 255, 0.1)'
})
// 事件处理
const handleClick = (event) => {
  if (!props.clickable) return

  // 创建波纹效果
  createRipple(event)

  // 触发点击事件
  emit('click', {
    type: props.type,
    value: props.value,
    label: props.label
  })
}

const handleAction = (action) => {
  emit('action', {
    action: action.key,
    data: action.data
  })
}
// 波纹效果
const createRipple = async (event) => {
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
.enhanced-stats-card {
  position: relative;
  border-radius: 16px;
  border: none;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.enhanced-stats-card.interactive {
  cursor: pointer;
}

.enhanced-stats-card.interactive:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 1);
}

.enhanced-stats-card.loading {
  pointer-events: none;
}

/* 不同类型的卡片样式 */
.stats-card-interviews {
  border-left: 4px solid #409eff;
}

.stats-card-time {
  border-left: 4px solid #67c23a;
}

.stats-card-score {
  border-left: 4px solid #e6a23c;
}

.stats-card-rank {
  border-left: 4px solid #f56c6c;
}

/* 加载状态 */
.stats-loading {
  padding: 20px;
}

.skeleton-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 趋势指示器 */
.trend-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  z-index: 2;
}

.trend-up {
  background: rgba(103, 194, 58, 0.15);
  color: #67c23a;
}

.trend-down {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
}

.trend-stable {
  background: rgba(144, 147, 153, 0.15);
  color: #909399;
}

.trend-text {
  font-weight: 600;
}

/* 主要内容 */
.stats-content {
  position: relative;
  padding: 24px;
}

.stats-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.stats-icon-section {
  flex-shrink: 0;
}

.stats-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.stats-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
}

.stats-info {
  flex: 1;
  min-width: 0;
}

.stats-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.value-main {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
  letter-spacing: -0.5px;
}

.value-unit {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.stats-label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  margin-bottom: 4px;
}

.stats-subtitle {
  font-size: 14px;
  color: #999;
}

/* 进度条 */
.stats-progress {
  margin-top: 16px;
  margin-bottom: 12px;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.progress-text {
  font-weight: 500;
}

.progress-target {
  color: #999;
}

/* 额外信息 */
.stats-extra {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.extra-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.extra-label {
  color: #666;
}

.extra-value {
  font-weight: 600;
  color: #333;
}

/* 操作按钮 */
.stats-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 点击波纹效果 */
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
  .stats-content {
    padding: 20px;
  }

  .stats-main {
    gap: 12px;
  }

  .stats-icon {
    width: 48px;
    height: 48px;
  }

  .value-main {
    font-size: 28px;
  }

  .stats-label {
    font-size: 14px;
  }

  .trend-indicator {
    position: static;
    align-self: flex-start;
    margin-bottom: 12px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .enhanced-stats-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e2e 100%);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .value-main {
    color: #fff;
  }

  .stats-label {
    color: #ccc;
  }

  .stats-subtitle {
    color: #999;
  }
}

/* 工具提示触发区域 */
.tooltip-trigger {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>






