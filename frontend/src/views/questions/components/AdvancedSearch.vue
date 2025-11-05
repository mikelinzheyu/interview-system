<template>
  <div class="advanced-search">
    <div class="search-header">
      <h3 class="title">
        <i class="el-icon-search"></i>
        高级搜索
      </h3>
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <!-- 关键词搜索 -->
      <div class="form-group">
        <label>关键词</label>
        <el-input
          v-model="searchQuery"
          placeholder="搜索学科、专业、方向..."
          @input="performSearch"
          clearable
        />
      </div>

      <!-- 难度过滤 -->
      <div class="form-group">
        <label>难度</label>
        <el-checkbox-group v-model="filters.difficulty" @change="performSearch">
          <el-checkbox label="beginner">初级</el-checkbox>
          <el-checkbox label="intermediate">中级</el-checkbox>
          <el-checkbox label="advanced">高级</el-checkbox>
          <el-checkbox label="hard">困难</el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 热度过滤 -->
      <div class="form-group">
        <label>热度范围</label>
        <el-range-slider
          v-model="filters.popularity"
          :min="0"
          :max="100"
          range
          @input="performSearch"
          class="range-slider"
        />
        <div class="range-text">{{ filters.popularity[0] }}% - {{ filters.popularity[1] }}%</div>
      </div>

      <!-- 题目数过滤 -->
      <div class="form-group">
        <label>题目数量</label>
        <el-select
          v-model="filters.questionCount"
          placeholder="选择题目数量范围"
          @change="performSearch"
        >
          <el-option label="不限" value="" />
          <el-option label="少于50道" value="<50" />
          <el-option label="50-200道" value="50-200" />
          <el-option label="200-500道" value="200-500" />
          <el-option label="超过500道" value=">500" />
        </el-select>
      </div>

      <!-- 类型过滤 -->
      <div class="form-group">
        <label>搜索类型</label>
        <el-checkbox-group v-model="filters.type" @change="performSearch">
          <el-checkbox label="discipline">学科</el-checkbox>
          <el-checkbox label="majorGroup">专业类</el-checkbox>
          <el-checkbox label="major">专业</el-checkbox>
          <el-checkbox label="specialization">细分方向</el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 搜索历史 -->
      <div class="search-history" v-if="searchHistory.length > 0">
        <label>最近搜索</label>
        <div class="history-tags">
          <el-tag
            v-for="item in searchHistory.slice(0, 5)"
            :key="item"
            closable
            @close="removeFromHistory(item)"
            @click="searchQuery = item; performSearch()"
          >
            {{ item }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searching" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="results.length > 0" class="results-section">
      <div class="results-header">
        <span class="result-count">找到 {{ results.length }} 个结果</span>
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          size="small"
          style="width: 150px"
          @change="performSearch"
        >
          <el-option label="相关度" value="relevance" />
          <el-option label="热度最高" value="popularity-desc" />
          <el-option label="题目最多" value="questions-desc" />
          <el-option label="最近更新" value="recent" />
        </el-select>
      </div>

      <div class="results-list">
        <div
          v-for="result in results"
          :key="`${result.type}-${result.id}`"
          class="result-item"
          :class="result.type"
          @click="selectResult(result)"
        >
          <div class="result-type-badge">
            {{ resultTypeLabel(result.type) }}
          </div>
          <div class="result-icon">{{ result.icon || '📚' }}</div>
          <div class="result-content">
            <h4 class="result-name">{{ result.name }}</h4>
            <p class="result-description">{{ result.description }}</p>
            <div class="result-meta">
              <span v-if="result.questionCount" class="meta-item">
                <i class="el-icon-document-copy"></i>
                {{ result.questionCount }} 道题
              </span>
              <span v-if="result.popularity" class="meta-item">
                <i class="el-icon-star"></i>
                热度 {{ result.popularity }}%
              </span>
              <span v-if="result.difficulty" class="meta-item">
                <i class="el-icon-rank"></i>
                {{ difficultyLabel(result.difficulty) }}
              </span>
            </div>
          </div>
          <div class="result-action">
            <el-button
              type="primary"
              size="small"
              text
              @click.stop="navigateToResult(result)"
            >
              查看
              <i class="el-icon-arrow-right"></i>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery || Object.values(filters).some(f => f) " class="no-results">
      <i class="el-icon-search"></i>
      <p>未找到匹配的结果</p>
    </div>

    <div v-else class="empty-state">
      <i class="el-icon-search"></i>
      <p>输入关键词或使用过滤条件进行搜索</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisciplinesStore } from '@/stores/disciplines'

const disciplinesStore = useDisciplinesStore()

const emit = defineEmits(['select'])

const searchQuery = ref('')
const searching = ref(false)
const results = ref([])
const sortBy = ref('relevance')
const searchHistory = ref([])

const filters = ref({
  difficulty: [],
  popularity: [0, 100],
  questionCount: '',
  type: ['discipline', 'majorGroup', 'major', 'specialization']
})

async function performSearch() {
  if (!searchQuery.value && !Object.values(filters.value).some(f => f)) {
    results.value = []
    return
  }

  searching.value = true

  try {
    // 如果有关键词，加到搜索历史
    if (searchQuery.value && searchHistory.value[0] !== searchQuery.value) {
      searchHistory.value.unshift(searchQuery.value)
      searchHistory.value = searchHistory.value.slice(0, 10)
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    }

    // 调用 Store 的搜索功能
    const allResults = await disciplinesStore.search(searchQuery.value)

    // 应用过滤条件
    let filtered = allResults.filter(result => {
      // 类型过滤
      if (filters.value.type.length > 0 && !filters.value.type.includes(result.type)) {
        return false
      }

      // 难度过滤
      if (filters.value.difficulty.length > 0 && result.data?.difficulty) {
        if (!filters.value.difficulty.includes(result.data.difficulty)) {
          return false
        }
      }

      // 热度过滤
      if (result.data?.popularity !== undefined) {
        const pop = result.data.popularity
        if (pop < filters.value.popularity[0] || pop > filters.value.popularity[1]) {
          return false
        }
      }

      // 题目数过滤
      if (filters.value.questionCount && result.data?.questionCount) {
        const count = result.data.questionCount
        const range = filters.value.questionCount
        if (range === '<50' && count >= 50) return false
        if (range === '50-200' && (count < 50 || count > 200)) return false
        if (range === '200-500' && (count < 200 || count > 500)) return false
        if (range === '>500' && count <= 500) return false
      }

      return true
    })

    // 应用排序
    filtered = applySort(filtered)

    results.value = filtered
  } catch (err) {
    console.error('Search error:', err)
  } finally {
    searching.value = false
  }
}

function applySort(items) {
  const sorted = [...items]

  if (sortBy.value === 'popularity-desc') {
    sorted.sort((a, b) => (b.data?.popularity || 0) - (a.data?.popularity || 0))
  } else if (sortBy.value === 'questions-desc') {
    sorted.sort((a, b) => (b.data?.questionCount || 0) - (a.data?.questionCount || 0))
  } else if (sortBy.value === 'recent') {
    // 按更新时间排序（实际应该有时间戳）
    sorted.reverse()
  }
  // relevance - 保持原顺序

  return sorted
}

function removeFromHistory(item) {
  const index = searchHistory.value.indexOf(item)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  }
}

function resultTypeLabel(type) {
  const labels = {
    discipline: '学科',
    majorGroup: '专业类',
    major: '专业',
    specialization: '细分方向'
  }
  return labels[type] || type
}

function difficultyLabel(difficulty) {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

async function navigateToResult(result) {
  if (result.type === 'discipline') {
    disciplinesStore.selectDiscipline(result.data)
  } else if (result.type === 'majorGroup') {
    const discipline = disciplinesStore.disciplines.find(d => d.id === result.parentId)
    if (discipline) {
      disciplinesStore.selectDiscipline(discipline)
      await disciplinesStore.loadMajorGroups(discipline.id)
      disciplinesStore.selectMajorGroup(result.data)
    }
  }

  emit('select', result)
}

function selectResult(result) {
  // 可以在这里触发自定义事件或导航
  navigateToResult(result)
}

// 初始化搜索历史
function initSearchHistory() {
  try {
    const saved = localStorage.getItem('searchHistory')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('Failed to load search history:', err)
  }
}

initSearchHistory()
</script>

<style scoped lang="scss">
.advanced-search {
  padding: 24px;
  background: white;
  border-radius: 12px;
  min-height: 400px;
}

.search-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;

  .title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.search-form {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;

  .form-group {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    ::v-deep(.el-checkbox-group) {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .range-slider {
      width: 100%;
    }

    .range-text {
      font-size: 12px;
      color: #999;
      text-align: right;
    }
  }

  .search-history {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .history-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      ::v-deep(.el-tag) {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
      }
    }
  }
}

.results-section {
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 8px;

    .result-count {
      font-weight: 500;
      color: #333;
    }
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);

    .result-action button {
      opacity: 1;
    }
  }

  &.discipline {
    border-left: 4px solid #667eea;
  }

  &.majorGroup {
    border-left: 4px solid #764ba2;
  }

  &.major {
    border-left: 4px solid #f093fb;
  }

  &.specialization {
    border-left: 4px solid #4facfe;
  }

  .result-type-badge {
    flex-shrink: 0;
    width: 60px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: white;
    background: #667eea;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .result-icon {
    flex-shrink: 0;
    font-size: 32px;
  }

  .result-content {
    flex: 1;
    min-width: 0;

    .result-name {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .result-description {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .result-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #999;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .result-action {
    flex-shrink: 0;

    button {
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }
  }
}

.loading,
.no-results,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
  }
}
</style>
