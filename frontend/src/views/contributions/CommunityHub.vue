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
  },
  {
    id: 9,
    title: '深入理解 JavaScript 事件循环机制',
    description: '彻底掌握 JavaScript 事件循环，理解宏任务、微任务、调用栈、事件队列的关系，解决异步编程难题。',
    category: '算法',
    difficulty: '困难',
    tags: ['JavaScript', '事件循环', '异步编程'],
    author: '深度学习者',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 3),
    views: 19234,
    comments: 245,
    likes: 756,
    liked: false,
    collected: false
  },
  {
    id: 10,
    title: 'CSS Grid 布局完全指南',
    description: 'CSS Grid 是现代 Web 布局的强大工具，本文详细讲解 Grid 的各种用法和高级技巧，助你掌握响应式布局。',
    category: '前端',
    difficulty: '简单',
    tags: ['CSS', 'Grid布局', '响应式设计'],
    author: 'CSS达人',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 7),
    views: 10567,
    comments: 87,
    likes: 412,
    liked: false,
    collected: false
  },
  {
    id: 11,
    title: '如何优雅地处理错误异常',
    description: '系统讲解 JavaScript 中错误处理的最佳实践，包括 try-catch、Promise.catch、async-await 错误处理等。',
    category: '前端',
    difficulty: '中等',
    tags: ['JavaScript', '错误处理', '最佳实践'],
    author: '代码卫士',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 15),
    views: 13456,
    comments: 156,
    likes: 521,
    liked: true,
    collected: false
  },
  {
    id: 12,
    title: '数据结构面试宝典：树与二叉树',
    description: '树和二叉树是数据结构的核心，本篇涵盖二叉树遍历、构建、最近公共祖先、路径和等高频面试题。',
    category: '算法',
    difficulty: '困难',
    tags: ['算法', '数据结构', '二叉树', '面试'],
    author: '算法导师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 11),
    views: 25678,
    comments: 378,
    likes: 945,
    liked: false,
    collected: true
  },
  {
    id: 13,
    title: 'Docker 与 Kubernetes 入门到精通',
    description: '容器化技术已成为现代开发必备技能，详解 Docker 基础、镜像构建、Kubernetes 编排等核心概念。',
    category: '系统设计',
    difficulty: '困难',
    tags: ['Docker', 'Kubernetes', '容器化', 'DevOps'],
    author: 'DevOps工程师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 20),
    views: 16234,
    comments: 198,
    likes: 587,
    liked: false,
    collected: false
  },
  {
    id: 14,
    title: '数据库事务与并发控制详解',
    description: '深入理解数据库事务的 ACID 特性、隔离级别、锁机制和并发控制，提升数据库应用设计能力。',
    category: '数据结构',
    difficulty: '困难',
    tags: ['数据库', '事务', '并发控制', 'SQL'],
    author: 'DB专家',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 10),
    views: 14876,
    comments: 167,
    likes: 498,
    liked: false,
    collected: false
  },
  {
    id: 15,
    title: 'REST API 设计最佳实践',
    description: '规范的 API 设计对项目长期维护至关重要，详解 RESTful 设计原则、版本管理、文档生成等实战经验。',
    category: '后端',
    difficulty: '中等',
    tags: ['API设计', 'REST', '后端开发'],
    author: '架构设计师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 9),
    views: 12345,
    comments: 134,
    likes: 467,
    liked: true,
    collected: false
  },
  {
    id: 16,
    title: 'Web 安全防护指南',
    description: '前端开发必须了解的安全知识，包括 XSS、CSRF、SQL 注入、安全头设置等常见安全问题和防护方案。',
    category: '前端',
    difficulty: '困难',
    tags: ['安全', 'Web安全', 'XSS防护'],
    author: '安全卫士',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 4),
    views: 18976,
    comments: 267,
    likes: 723,
    liked: false,
    collected: true
  },
  {
    id: 17,
    title: '图论算法详解与应用',
    description: '从 BFS、DFS 到最短路径、最小生成树，详解图论核心算法及其在实际场景中的应用。',
    category: '算法',
    difficulty: '困难',
    tags: ['算法', '图论', '高级技巧'],
    author: '算法研究员',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 22),
    views: 17654,
    comments: 289,
    likes: 632,
    liked: false,
    collected: false
  },
  {
    id: 18,
    title: 'Python 异步编程 asyncio 完全指南',
    description: '深入讲解 Python asyncio 库的使用，从基础概念到高级技巧，掌握异步编程在 I/O 密集型应用的优势。',
    category: '后端',
    difficulty: '中等',
    tags: ['Python', '异步编程', 'asyncio'],
    author: 'Python高手',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 14),
    views: 11234,
    comments: 123,
    likes: 389,
    liked: false,
    collected: false
  },
  {
    id: 19,
    title: '分布式事务处理方案对比',
    description: '系统对比两阶段提交、补偿事务、本地消息表等分布式事务方案，帮你选择最适合的解决方案。',
    category: '系统设计',
    difficulty: '困难',
    tags: ['分布式', '事务', '架构设计'],
    author: '分布式架构师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 25),
    views: 15432,
    comments: 201,
    likes: 568,
    liked: true,
    collected: true
  },
  {
    id: 20,
    title: '现代前端构建工具对比：Webpack vs Vite vs Turbopack',
    description: '对比三种现代前端构建工具的性能、功能和使用场景，帮助你选择最合适的构建工具。',
    category: '前端',
    difficulty: '中等',
    tags: ['Webpack', 'Vite', '构建工具', '性能优化'],
    author: '构建工具专家',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 1),
    views: 13879,
    comments: 156,
    likes: 521,
    liked: false,
    collected: false
  },
  {
    id: 21,
    title: '五分钟掌握动态规划思想',
    description: '动态规划是算法的皇冠，本文用最直观的方式讲解 DP 的核心思想，附带经典问题详解。',
    category: '算法',
    difficulty: '中等',
    tags: ['算法', '动态规划', '面试'],
    author: '算法启蒙师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 19),
    views: 21345,
    comments: 298,
    likes: 847,
    liked: false,
    collected: false
  },
  {
    id: 22,
    title: '从零到一实现一个 Vue 组件库',
    description: '详细讲解如何设计和实现一个生产级别的 Vue 组件库，包括组件设计、文档生成、自动化测试等。',
    category: '前端',
    difficulty: '困难',
    tags: ['Vue', '组件库', '工程化'],
    author: '开源贡献者',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 30),
    views: 14567,
    comments: 189,
    likes: 512,
    liked: false,
    collected: false
  },
  {
    id: 23,
    title: '如何进行有效的代码审查',
    description: '代码审查不仅是为了发现 bug，更重要的是知识共享和团队成长。学习如何进行高效的 Code Review。',
    category: '其他',
    difficulty: '简单',
    tags: ['代码审查', '团队协作', '最佳实践'],
    author: '团队领导者',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 16),
    views: 9876,
    comments: 98,
    likes: 356,
    liked: false,
    collected: false
  },
  {
    id: 24,
    title: '全栈开发必知的 SQL 优化技巧',
    description: '索引使用、查询优化、执行计划分析、避免全表扫描等 SQL 优化核心技能一网打尽。',
    category: '数据结构',
    difficulty: '中等',
    tags: ['SQL', '数据库', '性能优化'],
    author: 'SQL优化师',
    authorAvatar: '',
    publishTime: new Date(Date.now() - 3600000 * 13),
    views: 13456,
    comments: 167,
    likes: 478,
    liked: true,
    collected: false
  }
]

// 加载内容列表（实现真正的分页）
const loadContentList = () => {
  loading.value = true
  setTimeout(() => {
    // 计算分页范围
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value

    // 根据筛选条件过滤数据
    let filteredList = mockContentList

    // 按标签过滤
    if (selectedTag.value) {
      filteredList = filteredList.filter(item => item.tags.includes(selectedTag.value))
    }

    // 按分类过滤
    if (filterCategory.value) {
      filteredList = filteredList.filter(item => item.category === filterCategory.value)
    }

    // 按难度过滤
    if (filterDifficulty.value) {
      filteredList = filteredList.filter(item => item.difficulty === filterDifficulty.value)
    }

    // 按排序方式排序
    if (sortBy.value === 'latest') {
      filteredList.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
    } else if (sortBy.value === 'popular') {
      filteredList.sort((a, b) => b.likes - a.likes)
    } else if (sortBy.value === 'most-discussed') {
      filteredList.sort((a, b) => b.comments - a.comments)
    } else if (sortBy.value === 'highest-rated') {
      filteredList.sort((a, b) => (b.views + b.likes + b.comments) - (a.views + a.likes + a.comments))
    }

    // 设置总数（用于分页器）
    total.value = filteredList.length

    // 截取当前页的数据，并根据标题注入差异化描述
    contentList.value = filteredList.slice(start, end).map(enrichContentByTitle)
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
  // 应用筛选时重置到第一页
  currentPage.value = 1
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

// 处理搜索：跳转到帖子列表并携带搜索关键词/标签
const handleSearch = ({ query, type }) => {
  const q = (query || '').trim()
  if (!q) return
  if (type === 'tag') {
    router.push(`/community/posts?tag=${encodeURIComponent(q)}`)
    return
  }
  router.push(`/community/posts?search=${encodeURIComponent(q)}`)
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

// 根据标题生成差异化描述，避免内容重复
function enrichContentByTitle(item) {
  const t = (item.title || '').toLowerCase()
  const desc = generateDescriptionFromTitle(item.title)
  return { ...item, description: desc }
}

function generateDescriptionFromTitle(title = '') {
  const t = title.toLowerCase()
  if (t.includes('promise')) return '从微任务与宏任务入手，手写实现 Promise 关键静态方法，附完整测试用例与常见陷阱解析。'
  if (t.includes('vue3')) return '系统拆解 Composition API 的最佳实践：逻辑复用、类型推断、解耦状态与副作用，提供可复用的示例代码片段。'
  if (t.includes('性能') || t.includes('优化')) return '覆盖构建优化、网络传输、渲染性能与交互体验的全链路优化清单，结合真实案例逐步量化收益。'
  if (t.includes('react') && t.includes('hooks')) return '围绕 useEffect/useMemo/useCallback 等核心 Hook，讲清闭包、依赖数组与渲染时机，辅以自定义 Hook 工程化模板。'
  if (t.includes('链表')) return '精选高频链表面试题，配图剖析指针操作与边界条件，提供多语言解法与复杂度对比。'
  if (t.includes('typescript')) return '用实际业务类型推导案例讲透条件类型、映射类型与工具类型，给出渐进式类型增强策略。'
  if (t.includes('微服务')) return '从服务拆分、注册发现到观测治理，结合网关、熔断限流与分布式事务，提供可落地的服务模板。'
  if (t.includes('node')) return '覆盖事件循环、V8 与内存模型，从 CPU/IO 维度给出诊断与优化手段，附常见性能问题排查指南。'
  if (t.includes('事件循环')) return '以实际调度序列还原浏览器/Node 的事件循环，澄清宏微任务与渲染阶段的关系。'
  if (t.includes('css grid')) return '通过示例掌握 Grid 的区域布局、轨道尺寸与自动布局，附响应式技巧与常见坑位说明。'
  if (t.includes('错误') || t.includes('异常')) return '总结前后端错误边界与异常链路治理策略，提供统一上报、聚类与告警的工程实践。'
  if (t.includes('动态规划') || t.includes('dp')) return '以表格推导与状态压缩为主线，拆解 DP 解题的套路与可视化思维路径。'
  if (t.includes('组件') && t.includes('库')) return '从设计体系到工程化发布，覆盖文档生成、按需加载、可访问性与单元测试等关键细节。'
  if (t.includes('代码审') || t.includes('review')) return '建立可执行的 Code Review 清单，覆盖一致性、复杂度、可维护性与安全性的评审维度。'
  if (t.includes('sql')) return '结合执行计划与索引原理，提供典型慢 SQL 的诊断与改写手册，附常见反模式清单。'
  if (t.includes('docker') || t.includes('kubernetes')) return '从容器镜像到集群编排，逐步搭建 CI/CD 流水线与可观察性，给出生产化配置模板。'
  if (t.includes('事务') && t.includes('数据库')) return '对比锁与隔离级别，解释幻读/不可重复读成因，提供业务友好的并发控制策略。'
  if (t.includes('rest')) return '落地资源建模、幂等设计、版本策略与错误语义，附 OpenAPI 驱动的协作流程。'
  if (t.includes('安全') || t.includes('xss') || t.includes('csrf')) return '覆盖前后端常见安全风险与隔离手段，提供输入校验、内容安全与鉴权的系统方案。'
  if (t.includes('图论')) return '从遍历到最短路/最小生成树，配合可视化示意与模板化代码，强化抽象建模能力。'
  if (t.includes('python') && t.includes('asyncio')) return '基于协程与事件循环的 I/O 模型，给出网络服务与爬虫的异步化改造步骤。'
  if (t.includes('分布式') && t.includes('事务')) return '对比 2PC/补偿事务/本地消息等方案的边界与成本，给出选型建议与落地清单。'
  if (t.includes('webpack') || t.includes('vite') || t.includes('turbopack')) return '多维度评测三大构建工具的冷/热启动与增量性能，附迁移评估建议。'
  return '精选高质量内容，围绕标题主题提供由浅入深的系统讲解与实战案例。'
}
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
