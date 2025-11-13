<template>
  <div class="right-sidebar">
    <!-- 社区公告 -->
    <el-card class="sidebar-card notice-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><BellFilled /></el-icon>
          <span class="header-title">社区公告</span>
        </div>
      </template>
      <div class="notice-list">
        <div
          v-for="notice in notices"
          :key="notice.id"
          class="notice-item"
          @click="showNotice(notice)"
        >
          <el-icon class="notice-icon" :class="`notice-type-${notice.type}`">
            <component :is="getNoticeIcon(notice.type)" />
          </el-icon>
          <div class="notice-content">
            <div class="notice-title">{{ notice.title }}</div>
            <div class="notice-time">{{ notice.time }}</div>
          </div>
        </div>
      </div>
    </el-card>
    <!-- 今日热榜 -->
    <el-card class="sidebar-card hot-list-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><TrendCharts /></el-icon>
          <span class="header-title">今日热榜</span>
        </div>
      </template>
      <div class="hot-list">
        <div
          v-for="(item, index) in hotList"
          :key="item.id"
          class="hot-item"
          @click="navigate(`/contributions/question/${item.id}`)"
        >
          <div class="hot-rank" :class="`rank-${index + 1}`">
            {{ index + 1 }}
          </div>
          <div class="hot-content">
            <div class="hot-title">{{ item.title }}</div>
            <div class="hot-meta">
              <span>
                <el-icon><View /></el-icon>
                {{ formatNumber(item.views) }}
              </span>
              <span>
                <el-icon><ChatDotRound /></el-icon>
                {{ item.comments }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 活跃作者 -->
    <el-card class="sidebar-card author-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><UserFilled /></el-icon>
          <span class="header-title">活跃作者</span>
        </div>
      </template>
      <div class="author-list">
        <div
          v-for="author in activeAuthors"
          :key="author.id"
          class="author-item"
          @click="navigate(`/contributions/profile/${author.id}`)"
        >
          <el-avatar :size="40" :src="author.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="author-info">
            <div class="author-name">{{ author.name }}</div>
            <div class="author-stats">
              贡献 {{ author.contributions }} 题
            </div>
          </div>
          <el-button size="small" type="primary" plain @click.stop="followUser(author.id)">
            {{ author.followed ? '已关注' : '关注' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 快捷操作 -->
    <el-card class="sidebar-card quick-actions-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Lightning /></el-icon>
          <span class="header-title">快捷操作</span>
        </div>
      </template>
      <div class="quick-actions">
        <el-button
          v-for="action in quickActions"
          :key="action.key"
          :type="action.type"
          plain
          class="action-btn"
          @click="handleAction(action.action)"
        >
          <el-icon><component :is="action.icon" /></el-icon>
          {{ action.label }}
        </el-button>
      </div>
    </el-card>

    <!-- 社区统计 -->
    <el-card class="sidebar-card stats-card">
      <div class="community-stats">
        <div class="stat-row">
          <span class="stat-label">今日活跃</span>
          <span class="stat-value">{{ stats.activeToday }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">在线用户</span>
          <span class="stat-value online">{{ stats.onlineUsers }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">累计题目</span>
          <span class="stat-value">{{ stats.totalQuestions }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, UserFilled, BellFilled, Lightning,
  View, ChatDotRound, User, WarningFilled,
  InfoFilled, SuccessFilled, Edit, Upload,
  Checked, Trophy
} from '@element-plus/icons-vue'

const router = useRouter()

// 今日热榜
const hotList = ref([
  { id: 1, title: '手写实现 Promise.all', views: 15234, comments: 89 },
  { id: 2, title: 'Vue3 Composition API 最佳实践', views: 12890, comments: 67 },
  { id: 3, title: 'React Hooks 深度解析', views: 11456, comments: 54 },
  { id: 4, title: '前端性能优化终极指南', views: 9876, comments: 43 },
  { id: 5, title: 'TypeScript 高级类型技巧', views: 8765, comments: 38 },
  { id: 6, title: 'Webpack 5 配置详解', views: 7654, comments: 32 },
  { id: 7, title: '微前端架构实践', views: 6543, comments: 28 },
  { id: 8, title: 'CSS Grid 完全指南', views: 5432, comments: 24 },
  { id: 9, title: 'Node.js 性能调优', views: 4321, comments: 19 },
  { id: 10, title: 'GraphQL 入门教程', views: 3210, comments: 15 }
])

// 活跃作者
const activeAuthors = ref([
  { id: 1, name: '前端小王', avatar: '', contributions: 156, followed: false },
  { id: 2, name: '算法大师', avatar: '', contributions: 142, followed: true },
  { id: 3, name: 'Vue专家', avatar: '', contributions: 128, followed: false },
  { id: 4, name: 'React狂热者', avatar: '', contributions: 115, followed: false },
  { id: 5, name: '全栈开发者', avatar: '', contributions: 98, followed: true }
])

// 社区公告
const notices = ref([
  { id: 1, title: '社区升级公告', type: 'info', time: '2天前' },
  { id: 2, title: '题目质量规范更新', type: 'warning', time: '5天前' },
  { id: 3, title: '月度贡献者奖励发放', type: 'success', time: '1周前' }
])

// 快捷操作
const quickActions = [
  { key: 'submit', label: '提交题目', type: 'primary', icon: Edit, action: 'submit' },
  { key: 'upload', label: '上传资源', type: 'success', icon: Upload, action: 'upload' },
  { key: 'review', label: '参与审核', type: 'warning', icon: Checked, action: 'review' },
  { key: 'ranking', label: '查看排名', type: 'danger', icon: Trophy, action: 'ranking' }
]

// 社区统计
const stats = ref({
  activeToday: 1234,
  onlineUsers: 567,
  totalQuestions: 3480
})

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num
}

const navigate = (path) => {
  router.push(path)
}

const followUser = (userId) => {
  const author = activeAuthors.value.find(a => a.id === userId)
  if (author) {
    author.followed = !author.followed
    ElMessage.success(author.followed ? '关注成功' : '已取消关注')
  }
}

const showNotice = (notice) => {
  ElMessage.info(`查看公告: ${notice.title}`)
}

const getNoticeIcon = (type) => {
  const iconMap = {
    info: InfoFilled,
    warning: WarningFilled,
    success: SuccessFilled
  }
  return iconMap[type] || InfoFilled
}

const handleAction = (action) => {
  const actionMap = {
    submit: '/contributions/submit',
    upload: '/contributions/upload',
    review: '/contributions/review-queue',
    ranking: '/contributions/leaderboard'
  }
  if (actionMap[action]) {
    router.push(actionMap[action])
  }
}
</script>

<style scoped>
.right-sidebar {
  position: sticky;
  top: 85px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* 取消整个侧栏独立滚动，仅让公告区域内部滚动 */
  max-height: none;
  overflow: visible;
  padding-bottom: 20px;
}

/* 滚动条样式 */
.right-sidebar::-webkit-scrollbar {
  width: 6px;
}

.right-sidebar::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.right-sidebar::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

/* 卡片样式 */
.sidebar-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.sidebar-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  color: #409eff;
  font-size: 18px;
}

.header-title {
  font-size: 16px;
}

/* 今日热榜 */
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-item:hover {
  background: #f5f7fa;
}

.hot-rank {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #909399;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.hot-rank.rank-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.hot-rank.rank-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.hot-rank.rank-3 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.hot-content {
  flex: 1;
  min-width: 0;
}

.hot-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.hot-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 活跃作者 */
.author-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.author-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.author-item:hover {
  background: #f5f7fa;
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-stats {
  font-size: 12px;
  color: #909399;
}

/* 社区公告 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 独立滚动区域 */
  max-height: 320px;
  overflow-y: auto;
  padding-right: 6px; /* 为滚动条预留空间，避免内容抖动 */
}

/* 公告滚动条样式（仅影响公告区域） */
.notice-list::-webkit-scrollbar {
  width: 6px;
}

.notice-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.notice-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.notice-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.notice-item:hover {
  background: #f5f7fa;
}

.notice-icon {
  flex-shrink: 0;
  font-size: 20px;
}

.notice-icon.notice-type-info {
  color: #409eff;
}

.notice-icon.notice-type-warning {
  color: #e6a23c;
}

.notice-icon.notice-type-success {
  color: #67c23a;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.notice-time {
  font-size: 12px;
  color: #909399;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
}

/* 社区统计 */
.community-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.stat-value.online {
  color: #67c23a;
}
</style>
