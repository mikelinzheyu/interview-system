<template>
  <div class="achievement-categories">
    <div class="categories-header">
      <h3 class="categories-title">成就分类</h3>
      <div class="categories-actions">
        <el-button
          type="text"
          :class="{ active: activeCategory === 'all' }"
          class="category-all-btn"
          @click="handleCategoryChange('all')"
        >
          全部分类
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="categories-grid">
      <div
        v-for="category in categoriesWithStats"
        :key="category.id"
        class="category-card"
        :class="[
          `category-${category.id}`,
          { active: activeCategory === category.id, disabled: category.count === 0 }
        ]"
        @click="handleCategoryChange(category.id)"
      >
        <div class="category-icon" :style="{ backgroundColor: category.bgColor }">
          <el-icon :size="32" :color="category.color">
            <component :is="category.icon" />
          </el-icon>
        </div>

        <div class="category-content">
          <h4 class="category-name">{{ category.name }}</h4>
          <p class="category-description">{{ category.description }}</p>

          <div class="category-stats">
            <div class="stat-item">
              <span class="stat-value">{{ category.unlockedCount }}</span>
              <span class="stat-separator">/</span>
              <span class="stat-total">{{ category.totalCount }}</span>
              <span class="stat-label">已解锁</span>
            </div>

            <div class="completion-rate">
              <el-progress
                :percentage="category.completionRate"
                :color="category.color"
                :stroke-width="6"
                :show-text="false"
                class="progress-mini"
              />
              <span class="rate-text">{{ category.completionRate }}%</span>
            </div>
          </div>

          <!-- 稀有成就标识 -->
          <div v-if="category.rareAchievements.length > 0" class="rare-badges">
            <el-tag
              v-for="rare in category.rareAchievements"
              :key="rare.rarity"
              :type="getRarityTagType(rare.rarity)"
              size="small"
              class="rare-tag"
            >
              {{ getRarityText(rare.rarity) }} {{ rare.count }}
            </el-tag>
          </div>
        </div>

        <!-- 活跃指示器 -->
        <div v-if="activeCategory === category.id" class="category-indicator">
          <div class="indicator-dot"></div>
        </div>

        <!-- 最新解锁提示 -->
        <div v-if="category.hasRecentUnlock" class="recent-unlock">
          <el-icon color="#67c23a" size="16">
            <CircleCheckFilled />
          </el-icon>
          <span class="recent-text">最新</span>
        </div>
      </div>
    </div>

    <!-- 分类统计摘要 -->
    <div v-if="!loading" class="categories-summary">
      <div class="summary-item">
        <el-icon color="#409eff"><FolderOpened /></el-icon>
        <span class="summary-text">{{ totalCategories }} 个分类</span>
      </div>

      <div class="summary-item">
        <el-icon color="#67c23a"><Trophy /></el-icon>
        <span class="summary-text">{{ totalUnlocked }} 个已解锁</span>
      </div>

      <div class="summary-item">
        <el-icon color="#e6a23c"><Star /></el-icon>
        <span class="summary-text">{{ averageCompletionRate }}% 平均完成度</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star, Trophy, CircleCheckFilled, FolderOpened } from '@element-plus/icons-vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  achievements: {
    type: Array,
    default: () => []
  },
  userProgress: {
    type: Object,
    default: () => ({})
  },
  activeCategory: {
    type: String,
    default: 'all'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['category-change'])

// 计算带统计信息的分类数据
const categoriesWithStats = computed(() => {
  return props.categories.map(category => {
    const categoryAchievements = props.achievements.filter(a => a.category === category.id)
    const unlockedAchievements = categoryAchievements.filter(a =>
      props.userProgress[a.id]?.unlocked
    )

    const totalCount = categoryAchievements.length
    const unlockedCount = unlockedAchievements.length
    const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

    // 检查是否有最近解锁的成就
    const hasRecentUnlock = unlockedAchievements.some(a => {
      const unlockedAt = props.userProgress[a.id]?.unlockedAt
      if (!unlockedAt) return false
      const unlockTime = new Date(unlockedAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return unlockTime > oneDayAgo
    })

    // 统计稀有成就
    const rarityCount = {}
    unlockedAchievements.forEach(achievement => {
      const rarity = achievement.rarity
      if (rarity !== 'common') {
        rarityCount[rarity] = (rarityCount[rarity] || 0) + 1
      }
    })

    const rareAchievements = Object.entries(rarityCount)
      .map(([rarity, count]) => ({ rarity, count }))
      .sort((a, b) => getRarityOrder(b.rarity) - getRarityOrder(a.rarity))

    // 生成背景色
    const bgColor = category.color ? `${category.color}20` : 'rgba(64, 158, 255, 0.1)'

    return {
      ...category,
      totalCount,
      unlockedCount,
      completionRate,
      hasRecentUnlock,
      rareAchievements,
      bgColor
    }
  })
})

// 计算总体统计
const totalCategories = computed(() => props.categories.length)

const totalUnlocked = computed(() => {
  return categoriesWithStats.value.reduce((sum, cat) => sum + cat.unlockedCount, 0)
})

const averageCompletionRate = computed(() => {
  if (categoriesWithStats.value.length === 0) return 0
  const total = categoriesWithStats.value.reduce((sum, cat) => sum + cat.completionRate, 0)
  return Math.round(total / categoriesWithStats.value.length)
})

// 工具函数
const getRarityOrder = (rarity) => {
  const order = { legendary: 4, epic: 3, rare: 2, common: 1 }
  return order[rarity] || 0
}

const getRarityText = (rarity) => {
  const texts = { legendary: '传说', epic: '史诗', rare: '稀有', common: '普通' }
  return texts[rarity] || rarity
}

const getRarityTagType = (rarity) => {
  const types = { legendary: 'danger', epic: 'warning', rare: 'primary', common: 'info' }
  return types[rarity] || 'info'
}

// 事件处理
const handleCategoryChange = (categoryId) => {
  emit('category-change', categoryId)
}
</script>

<style scoped>
.achievement-categories {
  margin-bottom: 32px;
}

.categories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.categories-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.category-all-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.category-all-btn:hover,
.category-all-btn.active {
  color: #409eff;
  background-color: rgba(255, 255, 255, 0.9);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.category-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.category-card.active {
  border-color: #409eff;
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

.category-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.category-card.disabled:hover {
  transform: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.category-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;
}

.category-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
}

.category-content {
  flex: 1;
}

.category-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.category-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.stat-value {
  font-weight: 700;
  color: #67c23a;
}

.stat-separator {
  color: #c0c4cc;
}

.stat-total {
  font-weight: 500;
  color: #909399;
}

.stat-label {
  color: #909399;
  margin-left: 4px;
}

.completion-rate {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 120px;
}

.progress-mini {
  flex: 1;
}

.rate-text {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
  min-width: 32px;
  text-align: right;
}

.rare-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rare-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 8px;
}

.category-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 12px;
  height: 12px;
}

.indicator-dot {
  width: 100%;
  height: 100%;
  background: #409eff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.recent-unlock {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(103, 194, 58, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.recent-text {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
}

.categories-summary {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.summary-text {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .categories-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .categories-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .category-card {
    padding: 20px;
  }

  .category-icon {
    width: 56px;
    height: 56px;
  }

  .category-stats {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .completion-rate {
    max-width: none;
  }

  .categories-summary {
    flex-direction: column;
    gap: 16px;
  }

  .summary-item {
    justify-content: center;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .category-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #1e1e2e 100%);
  }

  .category-name {
    color: #fff;
  }

  .category-description {
    color: #ccc;
  }

  .rate-text {
    color: #ccc;
  }

  .categories-summary {
    background: rgba(0, 0, 0, 0.2);
  }

  .summary-text {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>