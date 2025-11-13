<template>
  <div class="community-enhanced-search">
    <div class="search-input-row">
      <el-input
        v-model="query"
        placeholder="搜索帖子、标签或用户..."
        clearable
        size="large"
        class="search-input"
        @focus="openDropdown"
        @click="openDropdown"
        @keyup.enter="emitSearch"
      >
        <template #prefix>
          <el-icon class="search-icon">
            <Search />
          </el-icon>
        </template>
      </el-input>
      <el-button type="primary" size="large" class="search-button" @click="emitSearch">
        搜索
      </el-button>
    </div>

    <transition name="dropdown">
      <div v-if="isFocused" class="dropdown-panel" @mousedown.prevent>
        <div class="tabs">
          <div v-for="tab in tabs" :key="tab.key" :class="['tab', { active: tab.key === activeTab }]" @click="switchTab(tab.key)">
            {{ tab.label }}
          </div>
          <div class="actions">
            <el-icon v-if="activeTab === 'history'" class="clear-history" @click="clearHistory"><Delete /></el-icon>
          </div>
        </div>

        <div class="panel-content">
          <!-- 热门搜索 -->
          <div v-if="activeTab === 'hot'" class="hot-list">
            <div v-for="(item, i) in trendingKeywords" :key="item.keyword || i" class="hot-item" @click="selectTrending(item)">
              <span :class="['rank', rankClass(i)]">{{ i + 1 }}</span>
              <span class="text">{{ item.keyword || item }}</span>
              <el-tag v-if="i < 3" type="danger" size="small" effect="dark">HOT</el-tag>
              <span class="count" v-if="item.count">{{ item.count }} hits</span>
            </div>
          </div>

          <!-- 历史 -->
          <div v-else-if="activeTab === 'history'" class="history-list">
            <div v-if="!history.length" class="empty">暂无历史</div>
            <div v-for="(text, idx) in history" :key="idx" class="history-item">
              <el-icon class="icon"><Clock /></el-icon>
              <span class="text" @click="selectHistory(text)">{{ text }}</span>
              <el-icon class="remove" @click.stop="removeHistory(idx)"><Close /></el-icon>
            </div>
          </div>

          <!-- 探索：热门板块 + 热门标签 -->
          <div v-else-if="activeTab === 'explore'" class="explore">
            <div class="section">
              <div class="title">热门板块</div>
              <div class="tags">
                <el-tag v-for="forum in hotForums" :key="forum.slug || forum.name" class="explore-tag" type="success" effect="plain" @click="selectForum(forum)">
                  🧭 {{ forum.name }}
                </el-tag>
              </div>
            </div>

            <div class="section">
              <div class="title">热门标签</div>
              <div class="tags">
                <el-tag v-for="tag in hotTags" :key="tag.name || tag" class="explore-tag" effect="plain" @click="selectTag(tag)">
                  # {{ tag.name || tag }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 命令 -->
          <div v-else class="commands">
            <div v-for="cmd in commands" :key="cmd.id" class="command" @click="runCommand(cmd)">
              <span class="icon">{{ cmd.icon }}</span>
              <div class="content">
                <div class="title">{{ cmd.name }}</div>
                <div class="desc">{{ cmd.description }}</div>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
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
import { Search, Delete, Clock, Close, ArrowRight } from '@element-plus/icons-vue'
import communityAPI from '@/api/communityWithCache'
import { useDomainStore } from '@/stores/domain'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['search'])
const router = useRouter()

const query = ref('')
const isFocused = ref(false)
const activeTab = ref('hot')
const history = ref([])
const trending = ref([])
const hotTags = ref([])
const hotForums = ref([])
// 对齐 learning-hub：使用层级分类派生热门标签
const domainStore = useDomainStore()
const { hierarchicalDomains } = storeToRefs(domainStore)

const tabs = [
  { key: 'hot', label: '热搜' },
  { key: 'history', label: '历史' },
  { key: 'explore', label: '探索' },
  { key: 'commands', label: '命令' }
]

const commands = [
  { id: 'create', icon: '✍️', name: '发布帖子', description: '创建新的社区帖子' },
  { id: 'mine', icon: '📁', name: '我的帖子', description: '查看我发布和参与的帖子' },
  { id: 'hot', icon: '🔥', name: '热门帖子', description: '浏览当前热门帖子' }
]

const trendingKeywords = computed(() => {
  const items = trending.value || []
  return items.slice(0, 10)
})

function emitSearch() {
  const text = (query.value || '').trim()
  if (!text) return
  addHistory(text)
  emit('search', { query: text, type: 'search' })
  isFocused.value = false
}

function selectTrending(item) {
  const text = item.keyword || String(item)
  query.value = text
  emitSearch()
}

function selectHistory(text) {
  query.value = text
  emitSearch()
}

function selectTag(tag) {
  const name = typeof tag === 'string' ? tag : (tag?.name || tag?.slug || '')
  addHistory('#' + name)
  emit('search', { query: name, type: 'tag' })
  isFocused.value = false
}

function selectForum(forum) {
  const slug = forum?.slug || forum?.name
  if (slug) router.push(`/community/forums/${encodeURIComponent(slug)}`)
  isFocused.value = false
}

function runCommand(cmd) {
  switch (cmd.id) {
    case 'create':
      router.push('/community/create-post')
      break
    case 'mine':
      router.push('/community/posts?mine=1')
      break
    case 'hot':
      router.push('/community/posts?sortBy=hot')
      break
  }
  isFocused.value = false
}

function openDropdown() {
  isFocused.value = true
}

function rankClass(i) {
  if (i === 0) return 'r1'
  if (i === 1) return 'r2'
  if (i === 2) return 'r3'
  return ''
}

function addHistory(text) {
  const list = history.value.filter(i => i !== text)
  history.value = [text, ...list].slice(0, 20)
  try { localStorage.setItem('community-search-history', JSON.stringify(history.value)) } catch {}
}

function removeHistory(idx) {
  history.value.splice(idx, 1)
  try { localStorage.setItem('community-search-history', JSON.stringify(history.value)) } catch {}
}

function clearHistory() {
  history.value = []
  try { localStorage.setItem('community-search-history', JSON.stringify(history.value)) } catch {}
}

async function loadTrending() {
  try {
    const res = await communityAPI.getTrendingSearches()
    const list = res.data?.items || res.data || []
    trending.value = Array.isArray(list) ? list : []
  } catch { trending.value = [] }
  if (!trending.value.length) {
    trending.value = [
      { keyword: 'React Hooks', count: 1280 },
      { keyword: 'Promise 实现', count: 980 },
      { keyword: '系统设计', count: 860 },
      { keyword: 'TypeScript', count: 790 },
      { keyword: 'Node.js 性能优化', count: 720 },
      { keyword: 'Vue3 Composition API', count: 680 },
      { keyword: '算法 动态规划', count: 640 },
      { keyword: '数据库 事务', count: 590 },
      { keyword: '前端 安全', count: 560 },
      { keyword: 'Docker Kubernetes', count: 520 }
    ]
  }
}

async function loadHotTags() {
  try {
    const res = await communityAPI.getHotTags()
    const list = res.data?.items || res.data || []
    hotTags.value = Array.isArray(list) ? list.slice(0, 12) : []
  } catch { hotTags.value = [] }
  if (!hotTags.value.length) {
    hotTags.value = [
      { name: 'JavaScript' }, { name: 'Vue' }, { name: 'React' }, { name: 'Node.js' },
      { name: 'TypeScript' }, { name: '算法' }, { name: '系统设计' }, { name: '数据结构' },
      { name: '微服务' }, { name: 'Kubernetes' }, { name: '性能优化' }, { name: '安全' }
    ]
  }
}

async function loadForums() {
  try {
    const res = await communityAPI.getForums()
    const list = res.data?.items || res.data || []
    const forums = Array.isArray(list) ? list : []
    hotForums.value = forums.slice(0, 8).map(f => ({ name: f.name || f.slug, slug: f.slug || f.name }))
  } catch {
    hotForums.value = [
      { name: '前端', slug: 'frontend' },
      { name: '后端', slug: 'backend' },
      { name: '算法', slug: 'algorithm' },
      { name: '系统设计', slug: 'system-design' },
      { name: '数据库', slug: 'database' },
      { name: 'DevOps', slug: 'devops' }
    ]
  }
}

function switchTab(key) {
  activeTab.value = key
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('community-search-history')
    if (saved) history.value = JSON.parse(saved)
  } catch {}
  loadTrending()
  loadHotTags()
  loadForums()
  // 从学习中心层级分类派生热门标签，保证一致性
  if (domainStore.loadHierarchicalDomains) {
    domainStore.loadHierarchicalDomains().then(() => {
      const derived = deriveTagsFromHierarchical(hierarchicalDomains.value)
      if (derived.length) hotTags.value = derived
    }).catch(() => {})
  }
})

function deriveTagsFromHierarchical(nodes = []) {
  if (!Array.isArray(nodes) || !nodes.length) return []
  const result = []
  nodes.forEach(cat => {
    const children = cat.items || cat.children || []
    children.slice(0, 3).forEach(item => {
      result.push({ id: item.id, name: item.name, payload: item })
    })
  })
  return result.slice(0, 12)
}
</script>

<style scoped>
.community-enhanced-search { position: relative; width: 100%; }
.search-input-row { display: flex; align-items: center; gap: 8px; }
.search-input { flex: 1; }
.search-icon { font-size: 18px; color: #909399; }
.search-button { border-radius: 20px; padding: 10px 22px; }

.dropdown-panel { position: absolute; top: calc(100% + 10px); left: 0; right: 0; background: #fff; border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,.12); z-index: 1000; overflow: hidden; }
.tabs { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid #eee; background: #fafafa; }
.tab { padding: 6px 12px; border-radius: 8px; cursor: pointer; color: #606266; font-size: 14px; }
.tab.active, .tab:hover { color: #409eff; background: #ecf5ff; }
.actions { margin-left: auto; }
.clear-history { cursor: pointer; color: #909399; }
.panel-content { max-height: 460px; overflow-y: auto; padding: 12px; }

.hot-list { display: flex; flex-direction: column; gap: 6px; }
.hot-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; }
.hot-item:hover { background: #f5f7fa; transform: translateX(4px); }
.rank { width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: #fff; background: #c0c4cc; }
.rank.r1 { background: linear-gradient(135deg, #f56565, #e53e3e); }
.rank.r2 { background: linear-gradient(135deg, #ed8936, #dd6b20); }
.rank.r3 { background: linear-gradient(135deg, #ecc94b, #d69e2e); }
.hot-item .text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hot-item .count { font-size: 12px; color: #909399; }

.history-list .empty { text-align: center; color: #909399; padding: 40px 0; }
.history-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; }
.history-item:hover { background: #f5f7fa; }
.history-item .icon { color: #909399; }
.history-item .text { flex: 1; cursor: pointer; }
.history-item .remove { color: #909399; cursor: pointer; }

.explore .title { font-size: 13px; color: #606266; margin-bottom: 8px; font-weight: 600; }
.explore .tags { display: flex; flex-wrap: wrap; gap: 8px; }
.explore .section { margin-bottom: 16px; }
.explore .section:last-child { margin-bottom: 0; }
.explore .explore-tag { cursor: pointer; transition: all 0.2s ease; }
.explore .explore-tag:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.commands { display: flex; flex-direction: column; gap: 6px; }
.command { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); cursor: pointer; }
.command:hover { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); transform: translateX(4px); }
.command .icon { font-size: 22px; }
.command .content { flex: 1; }
.command .title { font-size: 14px; font-weight: 600; }
.command .desc { font-size: 12px; color: #606266; }
.command .arrow { color: #909399; }

.dropdown-enter-active, .dropdown-leave-active { transition: all .2s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-8px); }
.dropdown-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
