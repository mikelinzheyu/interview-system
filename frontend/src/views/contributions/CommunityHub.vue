<template>
  <div class="community-hub-container">
    <!-- 顶部欢迎区 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <el-icon class="banner-icon" :size="48"><UserFilled /></el-icon>
        <div class="banner-text">
          <h1>🌟 社区中心</h1>
          <p>分享知识，共同成长 - 打造最活跃的技术社区</p>
        </div>
      </div>
      <div class="quick-stats">
        <div class="stat-item">
          <div class="stat-value">{{ communityStats.totalContributors }}</div>
          <div class="stat-label">活跃贡献者</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ communityStats.totalSubmissions }}</div>
          <div class="stat-label">题目贡献</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ communityStats.approvalRate }}%</div>
          <div class="stat-label">通过率</div>
        </div>
      </div>
    </div>

    <!-- 筛选与搜索区 -->
    <div class="filter-section">
      <el-card>
        <div class="filter-controls">
          <el-input
            v-model="searchQuery"
            placeholder="搜索题目、用户、标签..."
            clearable
            class="search-input"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

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

          <el-select v-model="sortBy" placeholder="排序方式" class="filter-select">
            <el-option label="最新发布" value="latest" />
            <el-option label="最热门" value="popular" />
            <el-option label="最多讨论" value="most-discussed" />
            <el-option label="最多收藏" value="most-favorited" />
            <el-option label="最高评分" value="highest-rated" />
          </el-select>

          <el-select v-model="filterStatus" placeholder="状态" clearable class="filter-select">
            <el-option label="全部" value="" />
            <el-option label="已解决" value="solved" />
            <el-option label="未解决" value="unsolved" />
            <el-option label="有悬赏" value="bounty" />
          </el-select>

          <el-button type="primary" @click="applyFilters">
            <el-icon><Filter /></el-icon>
            应用筛选
          </el-button>
        </div>

        <!-- 热门标签 -->
        <div class="hot-tags">
          <el-tag
            v-for="tag in hotTags"
            :key="tag.name"
            :type="selectedTag === tag.name ? 'primary' : 'info'"
            :effect="selectedTag === tag.name ? 'dark' : 'plain'"
            class="tag-item"
            @click="selectTag(tag.name)"
          >
            {{ tag.name }} ({{ tag.count }})
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 个性化推荐区 -->
    <div v-if="recommendations.length > 0" class="recommendations-section">
      <h2>
        <el-icon><MagicStick /></el-icon>
        为你推荐
      </h2>
      <div class="recommendations-grid">
        <el-card
          v-for="item in recommendations"
          :key="item.id"
          class="recommendation-card"
          @click="navigate(`/contributions/question/${item.id}`)"
        >
          <div class="rec-header">
            <h4>{{ item.title }}</h4>
            <el-tag :type="getDifficultyType(item.difficulty)" size="small">
              {{ item.difficulty }}
            </el-tag>
          </div>
          <p class="rec-desc">{{ item.description }}</p>
          <div class="rec-meta">
            <span><el-icon><View /></el-icon> {{ item.views }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ item.discussions }}</span>
            <span><el-icon><Star /></el-icon> {{ item.favorites }}</span>
            <span class="match-score">匹配度: {{ item.matchScore }}%</span>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 功能卡片网格 -->
    <div class="features-grid">
      <!-- 提交题目 -->
      <el-card class="feature-card feature-submit" @click="navigate('/contributions/submit')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><Edit /></el-icon>
          <h3>提交题目</h3>
          <p>分享您的知识，为社区贡献优质题目</p>
          <div class="feature-badge">
            <el-tag type="success">获得积分</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 我的贡献 -->
      <el-card class="feature-card feature-mine" @click="navigate('/contributions/my-submissions')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><Document /></el-icon>
          <h3>我的贡献</h3>
          <p>查看您提交的所有题目和审核状态</p>
          <div class="feature-badge">
            <el-tag type="info">{{ myStats.totalSubmissions }} 篇</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 审核队列 -->
      <el-card class="feature-card feature-review" @click="navigate('/contributions/review-queue')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><Checked /></el-icon>
          <h3>审核队列</h3>
          <p>参与社区审核，帮助提升题目质量</p>
          <div class="feature-badge">
            <el-tag type="warning">{{ reviewStats.pendingCount }} 待审核</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 贡献排行榜 -->
      <el-card class="feature-card feature-leaderboard" @click="navigate('/contributions/leaderboard')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><Trophy /></el-icon>
          <h3>贡献排行榜</h3>
          <p>查看本月最活跃的贡献者</p>
          <div class="feature-badge">
            <el-tag type="warning">TOP {{ myStats.rank || '-' }}</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 贡献者主页 -->
      <el-card class="feature-card feature-profile" @click="navigate(`/contributions/profile/${userId}`)">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><User /></el-icon>
          <h3>我的主页</h3>
          <p>查看个人徽章、积分和成就</p>
          <div class="feature-badge">
            <el-tag type="success">{{ myStats.badges || 0 }} 枚徽章</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 徽章墙 -->
      <el-card class="feature-card feature-badges" @click="navigate('/contributions/badges')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><Medal /></el-icon>
          <h3>徽章墙</h3>
          <p>浏览所有可获得的徽章和成就</p>
          <div class="feature-badge">
            <el-tag type="info">{{ badgeStats.total || 0 }} 种徽章</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 社区论坛 -->
      <el-card class="feature-card feature-forum" @click="navigate('/community/forums')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><ChatLineRound /></el-icon>
          <h3>社区论坛</h3>
          <p>参与技术讨论，分享面试经验</p>
          <div class="feature-badge">
            <el-tag type="primary">5 个板块</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 实时聊天 -->
      <el-card class="feature-card feature-chat" @click="navigate('/chat')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><ChatDotSquare /></el-icon>
          <h3>实时聊天</h3>
          <p>加入聊天室，与其他用户实时交流</p>
          <div class="feature-badge">
            <el-tag type="success">3 个聊天室</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 关注列表 -->
      <el-card class="feature-card feature-follow" @click="navigate('/community/follow-list')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><User /></el-icon>
          <h3>关注列表</h3>
          <p>查看关注和粉丝，发现更多优秀用户</p>
          <div class="feature-badge">
            <el-tag type="primary">社交网络</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 社区排行榜 -->
      <el-card class="feature-card feature-ranking" @click="navigate('/community/leaderboard')">
        <div class="feature-content">
          <el-icon class="feature-icon" :size="48"><Trophy /></el-icon>
          <h3>社区排行榜</h3>
          <p>查看活跃度、贡献和人气排行</p>
          <div class="feature-badge">
            <el-tag type="warning">竞争激励</el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 社区动态 -->
    <div class="community-feed">
      <h2>🔥 社区动态</h2>
      <el-timeline>
        <el-timeline-item
          v-for="activity in recentActivities"
          :key="activity.id"
          :timestamp="activity.timestamp"
          :type="activity.type"
        >
          <div class="activity-content">
            <strong>{{ activity.username }}</strong>
            {{ activity.action }}
            <el-tag v-if="activity.tag" size="small" :type="activity.tagType">
              {{ activity.tag }}
            </el-tag>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  UserFilled, Edit, Document, Checked, Trophy,
  User, Medal, Search, Filter, MagicStick, View,
  ChatDotRound, Star, ChatLineRound, ChatDotSquare
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const userId = computed(() => userStore.user?.id || 1)

// 社区统计数据
const communityStats = ref({
  totalContributors: 1250,
  totalSubmissions: 3480,
  approvalRate: 76
})

// 个人统计
const myStats = ref({
  totalSubmissions: 0,
  rank: null,
  badges: 0
})

// 审核统计
const reviewStats = ref({
  pendingCount: 0
})

// 徽章统计
const badgeStats = ref({
  total: 0
})

// 社区动态
const recentActivities = ref([
  {
    id: 1,
    username: '张三',
    action: '提交了新题目《实现红黑树》',
    timestamp: '2分钟前',
    type: 'primary',
    tag: '算法',
    tagType: 'success'
  },
  {
    id: 2,
    username: '李四',
    action: '的题目通过审核',
    timestamp: '10分钟前',
    type: 'success',
    tag: '已通过',
    tagType: 'success'
  },
  {
    id: 3,
    username: '王五',
    action: '获得徽章',
    timestamp: '30分钟前',
    type: 'warning',
    tag: '首次贡献',
    tagType: 'warning'
  },
  {
    id: 4,
    username: '赵六',
    action: '成为本周贡献榜第一名',
    timestamp: '1小时前',
    type: 'danger',
    tag: 'TOP 1',
    tagType: 'danger'
  }
])

// 导航到指定页面
const navigate = (path) => {
  router.push(path)
}

// 筛选和搜索
const searchQuery = ref('')
const filterCategory = ref('')
const filterDifficulty = ref('')
const sortBy = ref('latest')
const filterStatus = ref('')
const selectedTag = ref('')

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

// 个性化推荐
const recommendations = ref([
  {
    id: 1,
    title: '实现一个防抖函数',
    description: '手写实现防抖函数，要求支持立即执行模式',
    difficulty: '中等',
    views: 1234,
    discussions: 45,
    favorites: 89,
    matchScore: 95
  },
  {
    id: 2,
    title: 'Vue3 响应式原理解析',
    description: '深入理解 Vue3 的 Proxy 响应式实现机制',
    difficulty: '困难',
    views: 2341,
    discussions: 78,
    favorites: 156,
    matchScore: 92
  },
  {
    id: 3,
    title: 'LeetCode 二叉树遍历',
    description: '实现二叉树的前序、中序、后序遍历（迭代和递归）',
    difficulty: '简单',
    views: 3456,
    discussions: 123,
    favorites: 234,
    matchScore: 88
  }
])

// 处理搜索
const handleSearch = () => {
  console.log('搜索:', searchQuery.value)
  // 调用 API 进行搜索
}

// 应用筛选
const applyFilters = () => {
  console.log('筛选条件:', {
    category: filterCategory.value,
    difficulty: filterDifficulty.value,
    sortBy: sortBy.value,
    status: filterStatus.value,
    tag: selectedTag.value
  })
  // 调用 API 应用筛选
}

// 选择标签
const selectTag = (tagName) => {
  selectedTag.value = selectedTag.value === tagName ? '' : tagName
  applyFilters()
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  const map = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return map[difficulty] || 'info'
}

// 加载数据
onMounted(() => {
  // 这里可以调用API加载真实数据
})
</script>

<style scoped>
.community-hub-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 40px;
  color: white;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.banner-icon {
  color: white;
  opacity: 0.9;
}

.banner-text h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: bold;
}

.banner-text p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.quick-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

/* 功能卡片网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.feature-submit:hover {
  border-color: #67c23a;
}

.feature-mine:hover {
  border-color: #409eff;
}

.feature-review:hover {
  border-color: #e6a23c;
}

.feature-leaderboard:hover {
  border-color: #f56c6c;
}

.feature-profile:hover {
  border-color: #9b59b6;
}

.feature-badges:hover {
  border-color: #e6a23c;
}

.feature-forum:hover {
  border-color: #409eff;
}

.feature-chat:hover {
  border-color: #67c23a;
}

.feature-follow:hover {
  border-color: #409eff;
}

.feature-ranking:hover {
  border-color: #f56c6c;
}

.feature-content {
  text-align: center;
  padding: 20px;
}

.feature-icon {
  color: #409eff;
  margin-bottom: 15px;
}

.feature-submit .feature-icon {
  color: #67c23a;
}

.feature-review .feature-icon {
  color: #e6a23c;
}

.feature-leaderboard .feature-icon {
  color: #f56c6c;
}

.feature-profile .feature-icon {
  color: #9b59b6;
}

.feature-badges .feature-icon {
  color: #e6a23c;
}

.feature-forum .feature-icon {
  color: #409eff;
}

.feature-chat .feature-icon {
  color: #67c23a;
}

.feature-follow .feature-icon {
  color: #409eff;
}

.feature-ranking .feature-icon {
  color: #f56c6c;
}

.feature-content h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #303133;
}

.feature-content p {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
  min-height: 40px;
}

.feature-badge {
  display: flex;
  justify-content: center;
}

/* 社区动态 */
.community-feed {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.community-feed h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #303133;
}

.activity-content {
  color: #606266;
  line-height: 1.8;
}

.activity-content strong {
  color: #303133;
  font-weight: 600;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 30px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.filter-select {
  width: 150px;
}

.hot-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: scale(1.05);
}

/* 推荐区域 */
.recommendations-section {
  margin-bottom: 30px;
}

.recommendations-section h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.recommendation-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.recommendation-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rec-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.rec-desc {
  color: #606266;
  font-size: 14px;
  margin: 10px 0;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rec-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #909399;
  align-items: center;
}

.rec-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-score {
  margin-left: auto;
  color: #67c23a;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .filter-controls {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recommendations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
