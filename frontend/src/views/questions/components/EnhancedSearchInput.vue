<template>
  <div class="enhanced-search-wrapper">
    <!-- 搜索输入框 -->
    <div class="search-input-container">
      <el-input
        v-model="query"
        placeholder="请输入关键词全网搜索..."
        clearable
        size="large"
        class="search-input"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="handleSearch"
        @input="handleInput"
      >
        <template #prefix>
          <el-icon class="search-icon">
            <Search />
          </el-icon>
        </template>
      </el-input>
      <el-button type="primary" size="large" class="search-button" @click="handleSearch">
        搜索
      </el-button>
    </div>

    <!-- 下拉面板 -->
    <transition name="dropdown">
      <div v-if="showDropdown" class="dropdown-panel" @mousedown.prevent>
        <!-- 分类标签 -->
        <div class="tabs-container">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-item', { active: activeTab === tab.key }]"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </div>
          <div class="tab-actions">
            <el-icon v-if="activeTab === 'history'" class="delete-icon" @click="clearAllHistory">
              <Delete />
            </el-icon>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="content-container">
          <!-- 热门题目 -->
          <div v-if="activeTab === 'hot'" class="hot-list">
            <div
              v-for="(item, index) in hotQuestions"
              :key="item.id"
              class="hot-item"
              @click="selectItem(item)"
            >
              <span :class="['rank-number', getRankClass(index)]">{{ index + 1 }}</span>
              <span class="hot-title">{{ item.title }}</span>
              <el-tag v-if="item.isHot" type="danger" size="small" effect="dark">热</el-tag>
              <el-tag v-if="item.isNew" type="warning" size="small">新</el-tag>
              <span class="hot-count">{{ item.count }}人做过</span>
            </div>
          </div>

          <!-- 搜索历史 -->
          <div v-if="activeTab === 'history'" class="history-list">
            <div v-if="searchHistory.length === 0" class="empty-state">
              <el-icon class="empty-icon"><Clock /></el-icon>
              <p>暂无搜索历史</p>
            </div>
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="history-item"
              @click="selectHistory(item)"
            >
              <el-icon class="history-icon"><Clock /></el-icon>
              <span class="history-text">{{ item }}</span>
              <el-icon class="delete-icon" @click.stop="removeHistory(index)">
                <Close />
              </el-icon>
            </div>
          </div>

          <!-- 探索发现 -->
          <div v-if="activeTab === 'explore'" class="explore-container">
            <div class="explore-section">
              <div class="section-title">热门领域</div>
              <div class="tag-cloud">
                <el-tag
                  v-for="domain in hotDomains"
                  :key="domain.id"
                  class="explore-tag"
                  :type="domain.tagType"
                  @click="selectDomain(domain)"
                >
                  {{ domain.icon }} {{ domain.name }}
                </el-tag>
              </div>
            </div>

            <div class="explore-section">
              <div class="section-title">热门标签</div>
              <div class="tag-cloud">
                <div
                  v-for="tag in hotTags"
                  :key="tag.id"
                  class="tag-card"
                  @click="selectTag(tag)"
                >
                  <span class="tag-text">{{ tag.name }}</span>
                </div>
              </div>
            </div>

            <div class="explore-section">
              <div class="section-title">推荐给你</div>
              <div class="recommend-list">
                <div
                  v-for="item in recommendItems"
                  :key="item.id"
                  class="recommend-item"
                  @click="selectRecommend(item)"
                >
                  <span class="recommend-icon">{{ item.icon }}</span>
                  <div class="recommend-content">
                    <div class="recommend-title">{{ item.title }}</div>
                    <div class="recommend-desc">{{ item.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷命令 -->
          <div v-if="activeTab === 'commands'" class="commands-list">
            <div
              v-for="cmd in quickCommands"
              :key="cmd.id"
              class="command-item"
              @click="executeCommand(cmd)"
            >
              <span class="command-icon">{{ cmd.icon }}</span>
              <div class="command-content">
                <div class="command-title">{{ cmd.name }}</div>
                <div class="command-desc">{{ cmd.description }}</div>
              </div>
              <el-icon class="command-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Clock, Close, Delete, ArrowRight } from '@element-plus/icons-vue'
import { fetchTrendingQuestions, fetchQuestionList } from '@/api/questions'

const props = defineProps({
  domains: {
    type: Array,
    default: () => []
  },
  questions: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'select', 'navigate'])

// 响应式数据
const query = ref('')
const isFocused = ref(false)
const activeTab = ref('hot')
const searchHistory = ref([])

// 标签页配置
const tabs = [
  { key: 'hot', label: '全网热搜' },
  { key: 'history', label: '搜索历史' },
  { key: 'explore', label: '探索发现' },
  { key: 'commands', label: '快捷命令' }
]

// 快捷命令
const quickCommands = [
  { id: 'hot', icon: '🔥', name: '热门题库', description: '查看最受欢迎的题目' },
  { id: 'favorites', icon: '⭐', name: '我的收藏', description: '查看已收藏的领域' },
  { id: 'progress', icon: '📈', name: '学习进度', description: '打开我的学习统计' },
  { id: 'create', icon: '➕', name: '创建题目', description: '添加新的学习题目' }
]

// 计算属性
const showDropdown = computed(() => isFocused.value)

// 稳定的热门题目（从后端或降级策略获取）
const trending = ref([])
const trendingLoaded = ref(false)

const hotQuestions = computed(() => {
  const base = trendingLoaded.value && Array.isArray(trending.value) && trending.value.length
    ? trending.value
    : props.questions.slice(0, 10)

  return base.slice(0, 10).map((q, index) => ({
    id: q.id,
    title: q.title || q.name,
    // 使用稳定指标：优先 attempts，其次 popularity/views，最后 0
    count: (q.stats && (q.stats.attempts || q.stats.views)) || q.popularity || q.views || 0,
    isHot: index < 3,
    isNew: Boolean(q.isNew) || index === 0 || index === 1,
    payload: q
  }))
})

// 热门领域
const hotDomains = computed(() => {
  return props.domains.slice(0, 8).map(d => ({
    id: d.id,
    name: d.name,
    icon: d.icon || '📘',
    tagType: ['success', 'warning', 'danger', 'info'][Math.floor(Math.random() * 4)],
    payload: d
  }))
})

// 热门标签（从分类中提取）
const hotTags = computed(() => {
  const tags = []
  props.categories.forEach(cat => {
    const children = cat.items || cat.children || []
    children.slice(0, 3).forEach(item => {
      tags.push({
        id: item.id,
        name: item.name,
        payload: item
      })
    })
  })
  return tags.slice(0, 12)
})

// 推荐内容
const recommendItems = computed(() => {
  return [
    { id: 1, icon: '🎯', title: 'JavaScript 核心概念', desc: '掌握 JS 核心知识点' },
    { id: 2, icon: '🚀', title: 'Vue3 组合式 API', desc: '深入学习 Vue3 新特性' },
    { id: 3, icon: '💡', title: '算法与数据结构', desc: '提升编程思维能力' },
    { id: 4, icon: '🔧', title: '前端工程化实践', desc: '构建现代化开发流程' }
  ]
})

// 方法
function handleFocus() {
  isFocused.value = true
}

function handleBlur() {
  setTimeout(() => {
    isFocused.value = false
  }, 200)
}

function handleInput() {
  // 输入时切换到搜索历史标签
  if (query.value && activeTab.value === 'hot') {
    // 可选：根据输入内容动态切换标签
  }
}

function handleSearch() {
  const searchText = query.value.trim()
  if (!searchText) return

  // 添加到搜索历史
  addToHistory(searchText)

  // 触发搜索事件
  emit('search', searchText)

  // 关闭下拉面板
  isFocused.value = false
}

function switchTab(tabKey) {
  activeTab.value = tabKey
}

function getRankClass(index) {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}

function selectItem(item) {
  emit('select', { type: 'question', payload: item.payload })
  isFocused.value = false
}

function selectHistory(text) {
  query.value = text
  handleSearch()
}

function selectDomain(domain) {
  emit('select', { type: 'domain', payload: domain.payload })
  isFocused.value = false
}

function selectTag(tag) {
  emit('select', { type: 'tag', payload: tag.payload })
  isFocused.value = false
}

function selectRecommend(item) {
  emit('navigate', { type: 'recommend', id: item.id, title: item.title })
  isFocused.value = false
}

function executeCommand(cmd) {
  emit('navigate', { type: 'command', id: cmd.id })
  isFocused.value = false
}

function addToHistory(text) {
  // 移除重复项
  const filtered = searchHistory.value.filter(item => item !== text)
  // 添加到开头
  searchHistory.value = [text, ...filtered].slice(0, 20)
  // 保存到 localStorage
  saveHistory()
}

function removeHistory(index) {
  searchHistory.value.splice(index, 1)
  saveHistory()
}

function clearAllHistory() {
  searchHistory.value = []
  saveHistory()
}

function saveHistory() {
  try {
    localStorage.setItem('learning-search-history', JSON.stringify(searchHistory.value))
  } catch (e) {
    console.error('Failed to save search history:', e)
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('learning-search-history')
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load search history:', e)
  }
}

// 生命周期
onMounted(() => {
  loadHistory()
  // 加载趋势数据（带缓存，减少抖动）
  loadTrendingQuestions()
})

async function loadTrendingQuestions() {
  // 先尝试从本地缓存恢复（5分钟）
  try {
    const cached = localStorage.getItem('trending-questions-cache')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.items && parsed.ts && Date.now() - parsed.ts < 5 * 60 * 1000) {
        trending.value = parsed.items
        trendingLoaded.value = true
        return
      }
    }
  } catch {}

  // 请求后端标准趋势接口
  try {
    const res = await fetchTrendingQuestions({ size: 10 })
    const items = (res.data?.items || res.data || [])
    if (Array.isArray(items) && items.length) {
      trending.value = items
      trendingLoaded.value = true
      try {
        localStorage.setItem('trending-questions-cache', JSON.stringify({ ts: Date.now(), items }))
      } catch {}
      return
    }
  } catch (e) {
    // 降级：尝试 popular 排序的通用列表接口
    try {
      const res2 = await fetchQuestionList({ page: 1, size: 10, sort: 'popular' })
      const items2 = res2.data?.items || res2.data || []
      if (Array.isArray(items2) && items2.length) {
        trending.value = items2
        trendingLoaded.value = true
        try {
          localStorage.setItem('trending-questions-cache', JSON.stringify({ ts: Date.now(), items: items2 }))
        } catch {}
        return
      }
    } catch {}
  }

  // 最终降级：不标记 loaded，让 hotQuestions 回退到 props.questions（但去掉随机数）
  trendingLoaded.value = false
}

// 暴露方法
defineExpose({
  setQuery: (val) => {
    query.value = val
  }
})
</script>

<style scoped lang="scss">
.enhanced-search-wrapper {
  position: relative;
  width: 100%;
  max-width: 1500px;
}

.search-input-container {
  display: flex;
  gap: 8px;
  align-items: center;

  .search-input {
    flex: 1;

    :deep(.el-input__wrapper) {
      border-radius: 24px;
      padding: 4px 16px;
      background: #f5f7fa;
      border: 2px solid transparent;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      &:hover {
        background: #fff;
        border-color: #409eff;
      }
    }

    :deep(.el-input.is-focus .el-input__wrapper) {
      background: #fff;
      border-color: #409eff;
      box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
    }

    :deep(.el-input__inner) {
      font-size: 15px;
    }
  }

  .search-icon {
    font-size: 18px;
    color: #909399;
  }

  .search-button {
    border-radius: 20px;
    padding: 12px 28px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
}

.dropdown-panel {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.tabs-container {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  gap: 8px;

  .tab-item {
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }

    &.active {
      color: #409eff;
      background: #ecf5ff;
      font-weight: 600;
    }
  }

  .tab-actions {
    margin-left: auto;

    .delete-icon {
      cursor: pointer;
      color: #909399;
      font-size: 16px;
      transition: color 0.2s ease;

      &:hover {
        color: #f56c6c;
      }
    }
  }
}

.content-container {
  overflow-y: auto;
  max-height: 500px;
  padding: 16px;
}

// 热门列表
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .hot-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f5f7fa;
      transform: translateX(4px);
    }

    .rank-number {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      background: #e5e7eb;
      color: #606266;
      flex-shrink: 0;

      &.rank-1 {
        background: linear-gradient(135deg, #f56565, #e53e3e);
        color: white;
      }

      &.rank-2 {
        background: linear-gradient(135deg, #ed8936, #dd6b20);
        color: white;
      }

      &.rank-3 {
        background: linear-gradient(135deg, #ecc94b, #d69e2e);
        color: white;
      }
    }

    .hot-title {
      flex: 1;
      font-size: 14px;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hot-count {
      font-size: 12px;
      color: #909399;
      margin-left: auto;
    }
  }
}

// 搜索历史
.history-list {
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #909399;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    p {
      font-size: 14px;
      margin: 0;
    }
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f5f7fa;

      .delete-icon {
        opacity: 1;
      }
    }

    .history-icon {
      font-size: 16px;
      color: #909399;
    }

    .history-text {
      flex: 1;
      font-size: 14px;
      color: #303133;
    }

    .delete-icon {
      font-size: 14px;
      color: #909399;
      opacity: 0;
      transition: all 0.2s ease;

      &:hover {
        color: #f56c6c;
      }
    }
  }
}

// 探索发现
.explore-container {
  .explore-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .tag-card {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        border-radius: 20px;
        background: linear-gradient(135deg, #ecf5ff 0%, #e0eaff 100%);
        border: 1px solid #b3d8ff;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        color: #409eff;
        font-weight: 500;
        white-space: nowrap;

        &:hover {
          background: linear-gradient(135deg, #e0eaff 0%, #d5dfff 100%);
          border-color: #409eff;
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
          transform: translateY(-2px);
        }

        &:active {
          transform: translateY(0);
        }

        .tag-text {
          display: inline;
        }
      }
    }

    .recommend-list {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .recommend-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #f8f9fa;

        &:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .recommend-icon {
          font-size: 24px;
        }

        .recommend-content {
          flex: 1;

          .recommend-title {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 2px;
          }

          .recommend-desc {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

// 快捷命令
.commands-list {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .command-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);

    &:hover {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      transform: translateX(4px);

      .command-arrow {
        transform: translateX(4px);
      }
    }

    .command-icon {
      font-size: 28px;
    }

    .command-content {
      flex: 1;

      .command-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 2px;
      }

      .command-desc {
        font-size: 12px;
        color: #606266;
      }
    }

    .command-arrow {
      font-size: 16px;
      color: #909399;
      transition: all 0.2s ease;
    }
  }
}
</style>
