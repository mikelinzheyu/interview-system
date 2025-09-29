<template>
  <div class="achievement-grid" v-loading="loading">
    <!-- 空状态 -->
    <div v-if="!loading && achievements.length === 0" class="empty-state">
      <el-empty
        description="没有找到符合条件的成就"
        :image-size="120"
      >
        <template #image>
          <el-icon size="120" color="#c0c4cc">
            <Box />
          </el-icon>
        </template>
        <el-button type="primary" @click="handleResetFilters">
          重置筛选条件
        </el-button>
      </el-empty>
    </div>

    <!-- 成就网格 -->
    <div v-else class="grid-container">
      <!-- 虚拟滚动支持 -->
      <el-virtual-list
        v-if="enableVirtualScroll && achievements.length > virtualScrollThreshold"
        :data="achievements"
        :height="virtualScrollHeight"
        :item-size="itemSize"
        class="virtual-scroll-container"
      >
        <template #default="{ item, index }">
          <div class="virtual-item-wrapper" :key="`virtual-${item.id}`">
            <AchievementCard
              :achievement="item"
              @click="handleAchievementClick"
              @share="handleAchievementShare"
              @view-detail="handleViewDetail"
            />
          </div>
        </template>
      </el-virtual-list>

      <!-- 常规网格布局 -->
      <div v-else class="regular-grid">
        <transition-group
          name="achievement-fade"
          tag="div"
          class="achievement-list"
          appear
        >
          <div
            v-for="(achievement, index) in achievements"
            :key="achievement.id"
            class="achievement-item"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <AchievementCard
              :achievement="achievement"
              @click="handleAchievementClick"
              @share="handleAchievementShare"
              @view-detail="handleViewDetail"
            />
          </div>
        </transition-group>
      </div>

      <!-- 加载更多按钮 -->
      <div v-if="showLoadMore" class="load-more-section">
        <el-button
          type="primary"
          size="large"
          :loading="loadingMore"
          @click="handleLoadMore"
          class="load-more-btn"
        >
          <template #loading>
            <div class="loading-spinner">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              <span>加载中...</span>
            </div>
          </template>
          <el-icon><ArrowDown /></el-icon>
          加载更多成就
        </el-button>
      </div>
    </div>

    <!-- 快捷操作浮动按钮 -->
    <div class="floating-actions" v-if="achievements.length > 0">
      <el-tooltip content="回到顶部" placement="left">
        <el-button
          circle
          type="primary"
          @click="scrollToTop"
          class="float-btn scroll-top"
          :class="{ visible: showScrollTop }"
        >
          <el-icon><Top /></el-icon>
        </el-button>
      </el-tooltip>

      <el-tooltip content="随机查看成就" placement="left">
        <el-button
          circle
          type="info"
          @click="handleRandomAchievement"
          class="float-btn random-btn"
        >
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>

      <el-tooltip content="网格视图设置" placement="left">
        <el-button
          circle
          type="success"
          @click="showGridSettings = true"
          class="float-btn settings-btn"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 网格设置对话框 -->
    <el-dialog
      v-model="showGridSettings"
      title="网格视图设置"
      width="400px"
      center
    >
      <div class="grid-settings">
        <div class="setting-item">
          <label class="setting-label">列数设置</label>
          <el-slider
            v-model="gridColumns"
            :min="2"
            :max="6"
            :step="1"
            show-stops
            show-tooltip
            @change="updateGridColumns"
          />
        </div>

        <div class="setting-item">
          <label class="setting-label">卡片间距</label>
          <el-slider
            v-model="gridGap"
            :min="12"
            :max="32"
            :step="4"
            show-tooltip
            @change="updateGridGap"
          />
        </div>

        <div class="setting-item">
          <label class="setting-label">启用虚拟滚动</label>
          <el-switch
            v-model="enableVirtualScroll"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>

        <div class="setting-item">
          <label class="setting-label">显示动画</label>
          <el-switch
            v-model="enableAnimations"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="resetGridSettings">重置设置</el-button>
        <el-button type="primary" @click="showGridSettings = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box, ArrowDown, Loading, Top, Refresh, Setting
} from '@element-plus/icons-vue'
import AchievementCard from './AchievementCard.vue'

const props = defineProps({
  achievements: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  enableVirtualScroll: {
    type: Boolean,
    default: false
  },
  virtualScrollThreshold: {
    type: Number,
    default: 50
  },
  showLoadMore: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'achievement-click',
  'achievement-share',
  'view-detail',
  'load-more',
  'reset-filters'
])

// 响应式数据
const showScrollTop = ref(false)
const showGridSettings = ref(false)
const gridColumns = ref(3)
const gridGap = ref(20)
const enableVirtualScroll = ref(props.enableVirtualScroll)
const enableAnimations = ref(true)

// 虚拟滚动配置
const virtualScrollHeight = ref(600)
const itemSize = ref(320) // 每个成就卡片的高度

// 计算属性
const gridStyles = computed(() => ({
  '--grid-columns': gridColumns.value,
  '--grid-gap': `${gridGap.value}px`
}))

// 方法
const handleAchievementClick = (achievement) => {
  emit('achievement-click', achievement)
}

const handleAchievementShare = (achievement) => {
  emit('achievement-share', achievement)
}

const handleViewDetail = (achievement) => {
  emit('view-detail', achievement)
}

const handleLoadMore = () => {
  emit('load-more')
}

const handleResetFilters = () => {
  emit('reset-filters')
}

const handleRandomAchievement = () => {
  if (props.achievements.length === 0) {
    ElMessage.info('暂无可查看的成就')
    return
  }

  const randomIndex = Math.floor(Math.random() * props.achievements.length)
  const randomAchievement = props.achievements[randomIndex]
  handleAchievementClick(randomAchievement)
}

const scrollToTop = () => {
  const container = document.querySelector('.main-content') || window
  container.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const updateGridColumns = (value) => {
  gridColumns.value = value
  localStorage.setItem('achievement-grid-columns', value)
}

const updateGridGap = (value) => {
  gridGap.value = value
  localStorage.setItem('achievement-grid-gap', value)
}

const resetGridSettings = () => {
  gridColumns.value = 3
  gridGap.value = 20
  enableVirtualScroll.value = false
  enableAnimations.value = true

  // 清除本地存储
  localStorage.removeItem('achievement-grid-columns')
  localStorage.removeItem('achievement-grid-gap')

  ElMessage.success('设置已重置')
}

const loadGridSettings = () => {
  const savedColumns = localStorage.getItem('achievement-grid-columns')
  const savedGap = localStorage.getItem('achievement-grid-gap')

  if (savedColumns) {
    gridColumns.value = parseInt(savedColumns)
  }
  if (savedGap) {
    gridGap.value = parseInt(savedGap)
  }
}

// 滚动监听
const handleScroll = () => {
  const container = document.querySelector('.main-content')
  if (container) {
    showScrollTop.value = container.scrollTop > 500
  } else {
    showScrollTop.value = window.scrollY > 500
  }
}

// 生命周期
onMounted(() => {
  loadGridSettings()

  // 添加滚动监听
  const container = document.querySelector('.main-content')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  } else {
    window.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  // 移除滚动监听
  const container = document.querySelector('.main-content')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  } else {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.achievement-grid {
  position: relative;
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 60px 20px;
}

.grid-container {
  position: relative;
}

.virtual-scroll-container {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.virtual-item-wrapper {
  padding: 10px;
}

.regular-grid {
  width: 100%;
}

.achievement-list {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns, 3), 1fr);
  gap: var(--grid-gap, 20px);
  width: 100%;
}

.achievement-item {
  animation: achievementFadeIn 0.6s ease-out both;
}

@keyframes achievementFadeIn {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 过渡动画 */
.achievement-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.achievement-fade-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.achievement-fade-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 加载更多 */
.load-more-section {
  display: flex;
  justify-content: center;
  margin-top: 48px;
  padding: 32px;
}

.load-more-btn {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 32px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 浮动按钮 */
.floating-actions {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
}

.float-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.float-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.scroll-top {
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
}

.scroll-top.visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.random-btn {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.settings-btn {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

/* 网格设置对话框 */
.grid-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .achievement-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .achievement-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .achievement-list {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .floating-actions {
    right: 16px;
    bottom: 16px;
  }

  .float-btn {
    width: 48px;
    height: 48px;
  }

  .load-more-btn {
    padding: 12px 24px;
    font-size: 14px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .virtual-scroll-container {
    background: rgba(0, 0, 0, 0.2);
  }

  .setting-label {
    color: #fff;
  }

  .grid-settings {
    background: #1e1e1e;
  }
}

/* 动画禁用状态 */
.no-animations .achievement-item {
  animation: none;
}

.no-animations .achievement-fade-enter-active,
.no-animations .achievement-fade-leave-active,
.no-animations .achievement-fade-move {
  transition: none;
}
</style>