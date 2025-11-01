<template>
  <div class="smart-filter-panel">
    <!-- Header -->
    <div class="filter-header">
      <h3 class="filter-title">
        <i class="el-icon-filter"></i> 智能过滤
      </h3>
      <el-button
        v-if="hasActiveFilters"
        text
        size="small"
        @click="handleResetFilters"
        class="reset-button"
      >
        重置
      </el-button>
    </div>

    <!-- Filter Groups -->
    <div class="filter-content">
      <!-- Difficulty Level Filter -->
      <div class="filter-group">
        <label class="filter-label">
          <i class="el-icon-mountain"></i> 难度级别
        </label>
        <el-checkbox-group
          v-model="localFilters.difficulty"
          class="checkbox-group"
          @change="handleFilterChange"
        >
          <el-checkbox label="初级" value="beginner" />
          <el-checkbox label="中级" value="intermediate" />
          <el-checkbox label="高级" value="advanced" />
        </el-checkbox-group>
      </div>

      <!-- Time Investment Filter -->
      <div class="filter-group">
        <label class="filter-label">
          <i class="el-icon-timer"></i> 学习时间
        </label>
        <el-checkbox-group
          v-model="localFilters.timeInvestment"
          class="checkbox-group"
          @change="handleFilterChange"
        >
          <el-checkbox label="1-3小时/周" value="1-3h" />
          <el-checkbox label="5-10小时/周" value="5-10h" />
          <el-checkbox label="15+小时/周" value="15+h" />
        </el-checkbox-group>
      </div>

      <!-- Popularity Filter -->
      <div class="filter-group">
        <label class="filter-label">
          <i class="el-icon-star"></i> 热度
        </label>
        <el-select
          v-model="localFilters.popularity"
          placeholder="选择热度"
          class="select-filter"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="all" />
          <el-option label="最新热门" value="trending" />
          <el-option label="高分好评" value="top-rated" />
        </el-select>
      </div>

      <!-- Sort By -->
      <div class="filter-group">
        <label class="filter-label">
          <i class="el-icon-sort"></i> 排序方式
        </label>
        <el-select
          v-model="localFilters.sortBy"
          placeholder="选择排序"
          class="select-filter"
          @change="handleFilterChange"
        >
          <el-option label="推荐度" value="recommendation" />
          <el-option label="热门度" value="popularity" />
          <el-option label="难度" value="difficulty" />
          <el-option label="时间投入" value="time-required" />
        </el-select>
      </div>
    </div>

    <!-- Filter Summary -->
    <div v-if="hasActiveFilters" class="filter-summary">
      <div class="summary-title">活跃过滤器</div>
      <div class="tags-container">
        <el-tag
          v-for="tag in filterTags"
          :key="tag"
          closable
          @close="removeFilterTag(tag)"
          class="filter-tag"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- Results Count -->
    <div class="filter-stats">
      <small>{{ resultCount }} 个学科匹配</small>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDomainStore } from '@/stores/domain'

const store = useDomainStore()

// Local filter state
const localFilters = ref({
  difficulty: [...store.filterOptions.difficulty],
  timeInvestment: [...store.filterOptions.timeInvestment],
  popularity: store.filterOptions.popularity,
  sortBy: store.filterOptions.sortBy
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return (
    localFilters.value.difficulty.length > 0 ||
    localFilters.value.timeInvestment.length > 0 ||
    localFilters.value.popularity !== 'all' ||
    localFilters.value.sortBy !== 'recommendation'
  )
})

// Get filter tags for display
const filterTags = computed(() => {
  const tags = []

  // Add difficulty tags
  if (localFilters.value.difficulty.length > 0) {
    const diffMap = { beginner: '初级', intermediate: '中级', advanced: '高级' }
    localFilters.value.difficulty.forEach(d => {
      tags.push(`难度:${diffMap[d]}`)
    })
  }

  // Add time investment tags
  if (localFilters.value.timeInvestment.length > 0) {
    localFilters.value.timeInvestment.forEach(t => {
      tags.push(`时间:${t}`)
    })
  }

  // Add popularity tag
  if (localFilters.value.popularity !== 'all') {
    const popMap = { trending: '最新热门', 'top-rated': '高分好评' }
    tags.push(`热度:${popMap[localFilters.value.popularity]}`)
  }

  // Add sort tag
  if (localFilters.value.sortBy !== 'recommendation') {
    const sortMap = {
      popularity: '按热门度排序',
      difficulty: '按难度排序',
      'time-required': '按时间排序'
    }
    tags.push(sortMap[localFilters.value.sortBy])
  }

  return tags
})

// Get result count
const resultCount = computed(() => {
  return store.filteredAndSortedDomains.length
})

// Handle filter changes
const handleFilterChange = () => {
  store.applyFilters({
    difficulty: localFilters.value.difficulty,
    timeInvestment: localFilters.value.timeInvestment,
    popularity: localFilters.value.popularity,
    sortBy: localFilters.value.sortBy
  })
}

// Reset filters
const handleResetFilters = () => {
  localFilters.value = {
    difficulty: [],
    timeInvestment: [],
    popularity: 'all',
    sortBy: 'recommendation'
  }
  store.resetFilters()
}

// Remove individual filter tag
const removeFilterTag = (tag) => {
  if (tag.startsWith('难度:')) {
    const diffMap = { '初级': 'beginner', '中级': 'intermediate', '高级': 'advanced' }
    const difficulty = tag.split(':')[1]
    const value = diffMap[difficulty]
    localFilters.value.difficulty = localFilters.value.difficulty.filter(d => d !== value)
  } else if (tag.startsWith('时间:')) {
    const time = tag.split(':')[1]
    localFilters.value.timeInvestment = localFilters.value.timeInvestment.filter(t => t !== time)
  } else if (tag.startsWith('热度:')) {
    localFilters.value.popularity = 'all'
  } else if (tag.includes('排序')) {
    localFilters.value.sortBy = 'recommendation'
  }
  handleFilterChange()
}

// Watch for external store changes
watch(
  () => store.filterOptions,
  (newValue) => {
    localFilters.value = {
      difficulty: [...newValue.difficulty],
      timeInvestment: [...newValue.timeInvestment],
      popularity: newValue.popularity,
      sortBy: newValue.sortBy
    }
  },
  { deep: true }
)
</script>

<style scoped>
.smart-filter-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.smart-filter-panel:hover {
  border-color: rgba(94, 124, 224, 0.2);
  box-shadow: 0 4px 16px rgba(94, 124, 224, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-title i {
  color: #5e7ce0;
}

.reset-button {
  color: #5e7ce0;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  color: #3c4dc0;
}

.filter-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label i {
  color: #9ca3af;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-group :deep(.el-checkbox) {
  font-size: 13px;
  color: #4b5563;
}

.checkbox-group :deep(.el-checkbox__label) {
  color: #4b5563;
}

.select-filter {
  width: 100%;
  height: 32px;
}

.select-filter :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(209, 213, 219, 0.6);
}

.select-filter :deep(.el-input__wrapper:hover) {
  border-color: rgba(94, 124, 224, 0.4);
}

.filter-summary {
  background: rgba(245, 247, 250, 0.8);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.summary-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag {
  font-size: 12px;
  height: 24px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
  border: 1px solid rgba(94, 124, 224, 0.3);
  color: #5e7ce0;
}

.filter-stats {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid rgba(229, 230, 235, 0.3);
  color: #9ca3af;
}

.filter-stats small {
  font-size: 12px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .smart-filter-panel {
    padding: 12px;
  }

  .filter-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-title {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .smart-filter-panel {
    padding: 10px;
  }

  .filter-header {
    margin-bottom: 12px;
    padding-bottom: 10px;
  }

  .filter-label {
    font-size: 12px;
  }

  .checkbox-group {
    gap: 4px;
  }
}
</style>
