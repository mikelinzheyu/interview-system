<template>
  <div class="community-hub-wrapper">
    <!-- 顶部导航栏 -->
    <CommunityHeader
      @create-post="handleCreatePost"
      @show-notifications="handleShowNotifications"
      @search="handleSearch"
    />

    <!-- 左侧导航栏 -->
    <LeftSidebar @show-settings="handleShowSettings" />

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-wrapper">
        <!-- 左侧内容区 -->
        <div class="content-left">
          <!-- 统计横幅 -->
          <div class="stats-banner">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="32"><UserFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ communityStats.totalContributors }}</div>
                <div class="stat-label">活跃贡献者</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ communityStats.totalSubmissions }}</div>
                <div class="stat-label">题目贡献</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon :size="32"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ communityStats.approvalRate }}%</div>
                <div class="stat-label">通过率</div>
              </div>
            </div>
          </div>

          <!-- 轮播横幅 -->
          <HeroBanner />

          <!-- 热门标签栏 -->
          <el-card class="hot-tags-card">
            <template #header>
              <div class="section-header">
                <el-icon class="header-icon"><PriceTag /></el-icon>
                <span class="header-title">热门标签</span>
              </div>
            </template>
            <div class="hot-tags-wrapper">
              <el-tag
                v-for="tag in hotTags"
                :key="tag.name"
                :type="selectedTag === tag.name ? 'primary' : 'info'"
                :effect="selectedTag === tag.name ? 'dark' : 'plain'"
                class="tag-item"
                size="large"
                @click="selectTag(tag.name)"
              >
                {{ tag.name }} <span class="tag-count">({{ tag.count }})</span>
              </el-tag>
            </div>
          </el-card>

          <!-- 筛选区域 -->
          <el-card class="filter-card">
            <div class="filter-controls">
              <el-select v-model="sortBy" placeholder="排序方式" class="filter-select">
                <el-option label="最新发布" value="latest">
                  <el-icon><Clock /></el-icon> 最新发布
                </el-option>
                <el-option label="最热门" value="popular">
                  <el-icon><Sunny /></el-icon> 最热门
                </el-option>
                <el-option label="最多讨论" value="most-discussed">
                  <el-icon><ChatLineRound /></el-icon> 最多讨论
                </el-option>
                <el-option label="最高评分" value="highest-rated">
                  <el-icon><Star /></el-icon> 最高评分
                </el-option>
              </el-select>

              <el-select v-model="filterCategory" placeholder="分类" clearable class="filter-select">
                <el-option label="全部" value="" />
                <el-option label="算法" value="algorithm" />
                <el-option label="数据结构" value="data-structure" />
                <el-option label="系统设计" value="system-design" />
                <el-option label="前端" value="frontend" />
                <el-option label="后端" value="backend" />
              </el-select>

              <el-select v-model="filterDifficulty" placeholder="难度" clearable class="filter-select">
                <el-option label="全部" value="" />
                <el-option label="简单" value="easy" />
                <el-option label="中等" value="medium" />
                <el-option label="困难" value="hard" />
              </el-select>

              <el-button type="primary" @click="applyFilters">
                <el-icon><Filter /></el-icon>
                应用筛选
              </el-button>
            </div>
          </el-card>

          <!-- 内容列表 -->
          <div class="content-section">
            <div class="section-header">
              <el-icon class="header-icon"><MagicStick /></el-icon>
              <h2 class="header-title">{{ sectionTitle }}</h2>
              <span class="content-count">共 {{ contentList.length }} 条内容</span>
            </div>

            <div v-loading="loading" class="content-list">
              <ContentCard
                v-for="item in contentList"
                :key="item.id"
                :content="item"
                @like="handleLike"
                @collect="handleCollect"
                @share="handleShare"
                @tag-click="handleTagClick"
              />

              <el-empty v-if="!loading && contentList.length === 0" description="暂无内容" />
            </div>

            <!-- 分页 -->
            <div v-if="contentList.length > 0" class="pagination-wrapper">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 30, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="handlePageChange"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </div>

        <!-- 右侧信息栏 -->
        <div class="content-right">
          <RightSidebar />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UserFilled, Document, TrendCharts, PriceTag,
  Clock, Sunny, ChatLineRound, Star, Filter, MagicStick
} from '@element-plus/icons-vue'

import CommunityHeader from './components/CommunityHeader.vue'
import LeftSidebar from './components/LeftSidebar.vue'
import RightSidebar from './components/RightSidebar.vue'
import HeroBanner from './components/HeroBanner.vue'
import ContentCard from './components/ContentCard.vue'

const router = useRouter()

// 社区统计
const communityStats = ref({
  totalContributors: 1250,
  totalSubmissions: 3480,
  approvalRate: 76
})

// 热门标签
const hotTags = ref([
  { name: 'JavaScript', count: 234 },
  { name: 'Vue.js', count: 189 },
  { name: 'React', count: 156 },
  { name: 'Node.js', count: 143 },
  { name: '算法', count: 312 },
  { name: '数据结构', count: 278 },
  { name: '系统设计', count: 167 },
  { name: 'TypeScript', count: 198 }
])

// 筛选条件
const selectedTag = ref('')
const sortBy = ref('latest')
const filterCategory = ref('')
const filterDifficulty = ref('')

// 内容列表
const loading = ref(false)
const contentList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const sectionTitle = computed(() => {
  if (selectedTag.value) return `标签: ${selectedTag.value}`
  if (filterCategory.value) return `分类: ${filterCategory.value}`
  return '为你推荐'
})

// 模拟数据
const mockContentList = [
  {
    id: 1,
    title: '手写实现 Promise.all 和 Promise.race',
    description: '深入理解 Promise 并发控制机制，学习如何手写实现 Promise.all 和 Promise.race 方法，掌握异步编程核心技能。',
    category: '算法',
    difficulty: '中等',
    tags: ['JavaScript', 'Promise', '异步编程'],
    author: '算法大师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 2),
    views: 15234,
    comments: 89,
    likes: 567,
    liked: false,
    collected: false
  },
  {
    id: 2,
    title: 'Vue3 Composition API 最佳实践',
    description: '详细讲解 Vue3 Composition API 的使用方法和最佳实践，包括 setup、reactive、ref、computed、watch 等核心 API。',
    category: '前端',
    difficulty: '中等',
    tags: ['Vue3', 'Composition API', '前端框架'],
    author: 'Vue专家',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 5),
    views: 12890,
    comments: 67,
    likes: 489,
    liked: true,
    collected: false
  },
  {
    id: 3,
    title: '前端性能优化终极指南',
    description: '全方位性能优化策略，涵盖打包优化、渲染优化、网络优化、代码优化等多个维度，助你打造高性能 Web 应用。',
    category: '前端',
    difficulty: '困难',
    tags: ['性能优化', 'Webpack', '最佳实践'],
    author: '性能优化专家',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 24),
    views: 18765,
    comments: 234,
    likes: 678,
    liked: false,
    collected: true
  },
  {
    id: 4,
    title: 'React Hooks 深度解析',
    description: '深入剖析 React Hooks 的实现原理和使用场景，学习如何编写自定义 Hooks，提升 React 开发技能。',
    category: '前端',
    difficulty: '中等',
    tags: ['React', 'Hooks', '源码解析'],
    author: 'React狂热者',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 12),
    views: 14567,
    comments: 178,
    likes: 534,
    liked: false,
    collected: false
  },
  {
    id: 5,
    title: '算法面试高频题精讲：链表专题',
    description: 'BAT 大厂算法面试真题详解，涵盖链表反转、环形链表、合并链表等经典问题，配有详细的题解和代码实现。',
    category: '算法',
    difficulty: '中等',
    tags: ['算法', '链表', '面试'],
    author: '面试官',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 18),
    views: 23456,
    comments: 312,
    likes: 891,
    liked: true,
    collected: true
  },
  {
    id: 6,
    title: 'TypeScript 高级类型系统详解',
    description: '深入学习 TypeScript 高级类型特性，包括泛型、条件类型、映射类型、工具类型等，提升类型编程能力。',
    category: '前端',
    difficulty: '困难',
    tags: ['TypeScript', '类型系统', '高级技巧'],
    author: 'TS专家',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 8),
    views: 11234,
    comments: 145,
    likes: 423,
    liked: false,
    collected: false
  },
  {
    id: 7,
    title: '微服务架构设计与实践',
    description: '从零到一构建微服务架构，涵盖服务拆分、服务治理、分布式事务、API 网关等核心内容。',
    category: '系统设计',
    difficulty: '困难',
    tags: ['微服务', '架构设计', '分布式'],
    author: '架构师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 36),
    views: 16789,
    comments: 201,
    likes: 612,
    liked: false,
    collected: false
  },
  {
    id: 8,
    title: 'Node.js 性能调优实战',
    description: 'Node.js 应用性能优化实战经验分享，包括内存管理、CPU 优化、I/O 优化等方面。',
    category: '后端',
    difficulty: '中等',
    tags: ['Node.js', '性能优化', '后端开发'],
    author: 'Node大神',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 6),
    views: 9876,
    comments: 98,
    likes: 345,
    liked: false,
    collected: false
  }
]

// 加载内容列表
const loadContentList = () => {
  loading.value = true
  setTimeout(() => {
    contentList.value = mockContentList
    total.value = mockContentList.length
    loading.value = false
  }, 500)
}

// 选择标签
const selectTag = (tagName) => {
  selectedTag.value = selectedTag.value === tagName ? '' : tagName
  applyFilters()
}

// 应用筛选
const applyFilters = () => {
  console.log('应用筛选:', {
    tag: selectedTag.value,
    sortBy: sortBy.value,
    category: filterCategory.value,
    difficulty: filterDifficulty.value
  })
  loadContentList()
}

// 处理分页
const handlePageChange = () => {
  loadContentList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 处理点赞
const handleLike = (id) => {
  const item = contentList.value.find(i => i.id === id)
  if (item) {
    item.liked = !item.liked
    item.likes += item.liked ? 1 : -1
    ElMessage.success(item.liked ? '点赞成功' : '已取消点赞')
  }
}

// 处理收藏
const handleCollect = (id) => {
  const item = contentList.value.find(i => i.id === id)
  if (item) {
    item.collected = !item.collected
    ElMessage.success(item.collected ? '收藏成功' : '已取消收藏')
  }
}

// 处理分享
const handleShare = (id) => {
  ElMessage.success('分享链接已复制')
}

// 处理标签点击
const handleTagClick = (tag) => {
  selectedTag.value = tag
  applyFilters()
}

// 处理搜索
const handleSearch = ({ query, type }) => {
  console.log('搜索:', query, type)
  ElMessage.info(`搜索: ${query}`)
}

// 处理创建帖子
const handleCreatePost = () => {
  router.push('/contributions/submit')
}

// 显示通知
const handleShowNotifications = () => {
  ElMessage.info('通知功能开发中')
}

// 显示设置
const handleShowSettings = () => {
  router.push('/settings')
}

onMounted(() => {
  loadContentList()
})
</script>

<style scoped>
.community-hub-wrapper {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  margin-left: 220px;
  padding-top: 65px;
  transition: margin-left 0.3s;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

.content-left {
  flex: 1;
  min-width: 0;
}

.content-right {
  width: 320px;
  flex-shrink: 0;
}

/* 统计横幅 */
.stats-banner {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card:nth-child(2) .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card:nth-child(3) .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 热门标签 */
.hot-tags-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.hot-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  padding: 8px 16px;
}

.tag-item:hover {
  transform: scale(1.05);
}

.tag-count {
  opacity: 0.7;
  margin-left: 4px;
}

/* 筛选区域 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  width: 150px;
}

/* 内容区域 */
.content-section {
  background: transparent;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 0 4px;
}

.header-icon {
  color: #409eff;
  font-size: 24px;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-count {
  margin-left: auto;
  font-size: 14px;
  color: #909399;
}

.content-list {
  min-height: 400px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 响应式 */
@media (max-width: 1200px) {
  .content-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 64px;
  }

  .content-wrapper {
    padding: 12px;
  }

  .stats-banner {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
