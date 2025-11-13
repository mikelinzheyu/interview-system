<template>
  <div class="post-search-wrapper">
    <div class="search-input-container">
      <el-input
        v-model="query"
        placeholder="搜索帖子..."
        clearable
        size="large"
        class="search-input"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="handleSearch"
        @input="handleInput"
      >
        <template #prefix>
          <el-icon class="search-icon"><Search /></el-icon>
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
          <!-- 热门帖子 -->
          <div v-if="activeTab === 'hot'" class="hot-list">
            <div
              v-for="(item, index) in hotPosts"
              :key="item.id"
              class="hot-item"
              @click="selectItem(item)"
            >
              <span :class="['rank-number', getRankClass(index)]">{{ index + 1 }}</span>
              <span class="hot-title">{{ item.title }}</span>
              <el-tag v-if="index < 3" type="danger" size="small" effect="dark">热</el-tag>
              <span class="hot-count">{{ item.count }}人看过</span>
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
import { useRouter } from 'vue-router'
import { Search, Clock, Close, Delete, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search', 'filter'])

// 响应式数据
const query = ref('')
const isFocused = ref(false)
const activeTab = ref('hot')
const searchHistory = ref([])

// 标签页配置
const tabs = [
  { key: 'hot', label: '热门' },
  { key: 'history', label: '历史' },
  { key: 'explore', label: '探索' },
  { key: 'commands', label: '命令' }
]

// 快捷命令
const quickCommands = [
  { id: 'create', icon: '✍️', name: '发布新帖', description: '分享你的想法和经验' },
  { id: 'latest', icon: '📰', name: '最新帖子', description: '查看最新发布的帖子' },
  { id: 'popular', icon: '🔥', name: '热门帖子', description: '浏览当前热门话题' }
]

// 排序选项
const sortOptions = [
  { value: 'latest', label: '最新', icon: '🕐' },
  { value: 'hot', label: '最热', icon: '🔥' },
  { value: 'popular', label: '最受欢迎', icon: '👍' }
]

// 推荐内容
const recommendItems = [
  { id: 1, icon: '💡', title: '热点讨论', desc: '查看最新的热点话题' },
  { id: 2, icon: '🏆', title: '高质量帖子', desc: '精选优质讨论内容' },
  { id: 3, icon: '👥', title: '活跃话题', desc: '参与社区最活跃的讨论' },
  { id: 4, icon: '📚', title: '知识库', desc: '查看精选学习资源' }
]

// 计算属性
const showDropdown = computed(() => isFocused.value)

// 热门帖子（模拟数据）
const hotPosts = computed(() => {
  return props.posts.slice(0, 10).map((p, index) => ({
    id: p.id,
    title: p.title || p.name,
    count: p.views || Math.floor(Math.random() * 1000),
    payload: p
  }))
})

// 热门标签（从帖子中提取）
const hotTags = computed(() => {
  const tags = new Map()
  props.posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        const key = typeof tag === 'string' ? tag : tag.name
        tags.set(key, (tags.get(key) || 0) + 1)
      })
    }
  })

  return Array.from(tags.entries())
    .map(([name], id) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 12)
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
  // 可选：输入时动态切换标签
}

function handleSearch() {
  const searchText = query.value.trim()
  if (!searchText) return

  addToHistory(searchText)
  emit('search', searchText)
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
  query.value = item.title
  handleSearch()
}

function selectHistory(text) {
  query.value = text
  handleSearch()
}

function selectTag(tag) {
  emit('filter', { type: 'tag', value: tag.name })
  isFocused.value = false
}

function selectRecommend(item) {
  // 处理推荐内容点击
  query.value = item.title
  addToHistory(item.title)
  emit('search', item.title)
  isFocused.value = false
}

function selectSort(sort) {
  emit('filter', { type: 'sort', value: sort.value })
  isFocused.value = false
}

function executeCommand(cmd) {
  switch (cmd.id) {
    case 'create':
      // 导航到创建帖子
      const router = useRouter()
      router.push('/community/create-post')
      break
    case 'latest':
      emit('filter', { type: 'sort', value: 'latest' })
      break
    case 'popular':
      emit('filter', { type: 'sort', value: 'hot' })
      break
  }
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
    localStorage.setItem('post-search-history', JSON.stringify(searchHistory.value))
  } catch (e) {
    console.error('Failed to save search history:', e)
  }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('post-search-history')
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
})

// 暴露方法
defineExpose({
  setQuery: (val) => {
    query.value = val
  }
})
</script>

<style scoped lang="scss">
.post-search-wrapper {
  position: relative;
  width: 100%;
}

.search-input-container {
  display: flex;
  gap: 8px;
  align-items: center;

  .search-input {
    flex: 1;

    :deep(.el-input__wrapper) {
      border-radius: 20px;
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
  max-height: 500px;
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
  max-height: 440px;
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
    margin-bottom: 20px;

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
        background: linear-gradient(135deg, #f6f8fb 0%, #f0f4f8 100%);
        border: 1px solid #d5e4f3;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        color: #4a7ba7;
        font-weight: 500;
        white-space: nowrap;

        &:hover {
          background: linear-gradient(135deg, #f0f4f8 0%, #e8eff5 100%);
          border-color: #4a7ba7;
          box-shadow: 0 4px 12px rgba(74, 123, 167, 0.2);
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
      gap: 6px;

      .recommend-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        border-radius: 8px;
        background: #f8f9fa;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }

        .recommend-icon {
          font-size: 20px;
        }

        .recommend-content {
          flex: 1;

          .recommend-title {
            font-size: 14px;
            color: #303133;
            font-weight: 600;
            margin-bottom: 2px;
          }

          .recommend-desc {
            font-size: 12px;
            color: #606266;
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
