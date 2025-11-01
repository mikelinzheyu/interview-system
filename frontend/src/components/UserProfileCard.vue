<template>
  <div class="user-profile-card">
    <!-- Cover Background -->
    <div class="profile-cover">
      <div class="cover-gradient"></div>
    </div>

    <!-- Profile Content -->
    <div class="profile-content">
      <!-- Avatar and Basic Info -->
      <div class="profile-header">
        <div class="avatar-section">
          <img :src="user.avatar" :alt="user.userName" class="avatar" />
          <div v-if="user.isVerified" class="verified-badge">✓</div>
        </div>

        <div class="user-basic-info">
          <h2 class="user-name">{{ user.userName }}</h2>
          <p v-if="user.bio" class="user-bio">{{ user.bio }}</p>
          <div class="user-join-date">
            加入于 {{ formatDate(user.joinDate) }}
          </div>
        </div>

        <div class="profile-actions" v-if="isOtherUser">
          <el-button
            :type="isFollowing ? 'default' : 'primary'"
            @click="toggleFollow"
            size="small"
          >
            {{ isFollowing ? '已关注' : '关注' }}
          </el-button>
          <el-button type="default" @click="sendMessage" size="small">
            发消息
          </el-button>
        </div>
      </div>

      <!-- Stats Section -->
      <el-divider />

      <div class="stats-section">
        <div class="stat-group">
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-label">积分</span>
            <span class="stat-value">{{ user.points }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📊</span>
            <span class="stat-label">等级</span>
            <span class="stat-value">Lv.{{ user.level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🔥</span>
            <span class="stat-label">连续</span>
            <span class="stat-value">{{ user.streak }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🏆</span>
            <span class="stat-label">成就</span>
            <span class="stat-value">{{ user.achievements }}/15</span>
          </div>
        </div>

        <div class="stat-group">
          <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-label">学科</span>
            <span class="stat-value">{{ user.domainsCompleted }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👥</span>
            <span class="stat-label">粉丝</span>
            <span class="stat-value">{{ user.followers }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👤</span>
            <span class="stat-label">关注</span>
            <span class="stat-value">{{ user.following }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💬</span>
            <span class="stat-label">分享</span>
            <span class="stat-value">{{ shareCount }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs Section -->
      <el-divider />

      <el-tabs v-model="activeTab" class="profile-tabs">
        <!-- About Tab -->
        <el-tab-pane label="个人简介" name="about">
          <div class="tab-content">
            <div class="about-section">
              <h4 class="section-title">个人介绍</h4>
              <p class="about-text">
                {{ user.bio || '这个用户还没有添加个人介绍' }}
              </p>
            </div>

            <div class="about-section">
              <h4 class="section-title">学习目标</h4>
              <div class="goals-list">
                <div v-for="(goal, idx) in userGoals" :key="idx" class="goal-item">
                  <span class="goal-icon">{{ goal.icon }}</span>
                  <div class="goal-info">
                    <div class="goal-title">{{ goal.title }}</div>
                    <div class="goal-progress">
                      <el-progress
                        :percentage="goal.progress"
                        :color="goal.progress >= 80 ? '#67c23a' : '#e6a23c'"
                        :show-text="false"
                        size="small"
                      />
                      <span class="progress-text">{{ goal.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="about-section">
              <h4 class="section-title">正在学习</h4>
              <div class="learning-list">
                <el-tag v-for="domain in learningDomains" :key="domain" effect="light">
                  {{ domain }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Achievements Tab -->
        <el-tab-pane label="成就徽章" name="achievements">
          <div class="tab-content">
            <div class="achievements-container">
              <h4 class="section-title">已解锁的成就 ({{ user.achievements }})</h4>
              <div class="achievements-grid">
                <div
                  v-for="i in user.achievements"
                  :key="i"
                  class="achievement-card"
                  @click="showAchievementDetail(i)"
                >
                  <div class="achievement-icon">🏅</div>
                  <div class="achievement-text">
                    <div class="achievement-name">成就 {{ i }}</div>
                    <div class="achievement-date">最近解锁</div>
                  </div>
                </div>
              </div>

              <h4 class="section-title" style="margin-top: 20px">还需努力</h4>
              <div class="locked-achievements">
                <div v-for="i in (15 - user.achievements)" :key="`locked-${i}`" class="locked-badge">
                  🔒
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Learning Path Tab -->
        <el-tab-pane label="学习路径" name="paths">
          <div class="tab-content">
            <div class="paths-container">
              <div v-for="path in learningPaths" :key="path.id" class="path-item">
                <div class="path-header">
                  <div class="path-info">
                    <h5 class="path-title">{{ path.title }}</h5>
                    <p class="path-description">{{ path.description }}</p>
                  </div>
                  <el-tag
                    :type="path.status === 'completed' ? 'success' : 'info'"
                    effect="light"
                  >
                    {{ path.statusLabel }}
                  </el-tag>
                </div>

                <div class="path-progress">
                  <el-progress
                    :percentage="path.progress"
                    :color="getPathColor(path.progress)"
                    :show-text="false"
                  />
                  <span class="progress-text">{{ path.progress }}%</span>
                </div>

                <div class="path-domains">
                  <span v-for="domain in path.domains.slice(0, 3)" :key="domain" class="domain-badge">
                    {{ domain }}
                  </span>
                  <span v-if="path.domains.length > 3" class="domain-more">
                    +{{ path.domains.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Activity Tab -->
        <el-tab-pane label="最近活动" name="activity">
          <div class="tab-content">
            <div class="activity-list">
              <div v-for="activity in userActivities" :key="activity.id" class="activity-item">
                <div class="activity-icon">{{ activity.icon }}</div>
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-details">{{ activity.details }}</div>
                </div>
                <div class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Social Tab -->
        <el-tab-pane label="社交圈子" name="social">
          <div class="tab-content">
            <div class="social-container">
              <div class="social-section">
                <h4 class="section-title">粉丝 ({{ user.followers }})</h4>
                <div class="users-grid">
                  <div v-for="i in Math.min(6, user.followers)" :key="`follower-${i}`" class="user-mini-card">
                    <img
                      :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=follower${i}`"
                      :alt="`Follower ${i}`"
                      class="mini-avatar"
                    />
                    <div class="mini-name">粉丝 {{ i }}</div>
                  </div>
                </div>
              </div>

              <el-divider />

              <div class="social-section">
                <h4 class="section-title">关注 ({{ user.following }})</h4>
                <div class="users-grid">
                  <div v-for="i in Math.min(6, user.following)" :key="`following-${i}`" class="user-mini-card">
                    <img
                      :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=following${i}`"
                      :alt="`Following ${i}`"
                      class="mini-avatar"
                    />
                    <div class="mini-name">关注 {{ i }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import socialCollaborationService from '@/services/socialCollaborationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  onFollowChange: {
    type: Function,
    default: () => {}
  }
})

// Refs
const activeTab = ref('about')

// Computed
const isOtherUser = computed(() => props.userId !== props.currentUserId)

const isFollowing = ref(false)

// Load user profile
const user = computed(() => {
  const profile = socialCollaborationService.getUserProfile(props.userId)
  return profile
})

// Share count (mock)
const shareCount = computed(() => {
  const shares = socialCollaborationService.getUserShares(props.userId)
  return shares.length
})

// Mock data
const userGoals = [
  { icon: '📱', title: '掌握 React 框架', progress: 85 },
  { icon: '🐍', title: '学习 Python 数据科学', progress: 60 },
  { icon: '⚙️', title: '精通后端开发', progress: 72 }
]

const learningDomains = ['JavaScript', 'React', 'Vue.js', 'TypeScript', 'Node.js']

const learningPaths = [
  {
    id: 1,
    title: 'Web 全栈开发',
    description: '从前端到后端的完整学习路径',
    status: 'in_progress',
    statusLabel: '进行中',
    progress: 65,
    domains: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB']
  },
  {
    id: 2,
    title: '数据科学基础',
    description: '数据分析和机器学习基础',
    status: 'in_progress',
    statusLabel: '进行中',
    progress: 45,
    domains: ['Python', 'Pandas', 'NumPy', 'Matplotlib']
  },
  {
    id: 3,
    title: '云计算与DevOps',
    description: '云服务和容器化技术',
    status: 'completed',
    statusLabel: '已完成',
    progress: 100,
    domains: ['Docker', 'Kubernetes', 'AWS']
  }
]

const userActivities = [
  { id: 1, icon: '🏅', title: '解锁成就', details: '完成了 "连续学习7天" 成就', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 2, icon: '✅', title: '完成学科', details: '完成了 React 学科的学习', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: 3, icon: '📤', title: '分享成就', details: '分享了学习进度', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: 4, icon: '👥', title: '获得粉丝', details: '新增 5 个粉丝', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: 5, icon: '🔥', title: '保持连续', details: '连续学习达到 30 天', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
]

// Methods
const formatDate = (date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatRelativeTime = (timestamp) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(timestamp)) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const getPathColor = (progress) => {
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#e6a23c'
  return '#5e7ce0'
}

const toggleFollow = () => {
  if (isFollowing.value) {
    socialCollaborationService.unfollowUser(props.currentUserId, props.userId)
    isFollowing.value = false
    ElMessage.success('已取消关注')
  } else {
    socialCollaborationService.followUser(props.currentUserId, props.userId)
    isFollowing.value = true
    ElMessage.success('已关注该用户')
  }
  props.onFollowChange?.(props.userId, isFollowing.value)
}

const sendMessage = () => {
  ElMessage.info('消息功能将在后续版本开放')
}

const showAchievementDetail = (index) => {
  ElMessage.info(`成就 ${index} 的详细信息`)
}
</script>

<style scoped>
.user-profile-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.profile-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.cover-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.8;
}

.profile-content {
  padding: 24px;
  position: relative;
  margin-top: -40px;
}

/* Header */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  position: relative;
  z-index: 10;
  margin-bottom: 24px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.verified-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: #67c23a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  border: 3px solid white;
}

.user-basic-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.user-bio {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.user-join-date {
  font-size: 12px;
  color: #9ca3af;
}

.profile-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-group {
  display: contents;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(229, 230, 235, 0.4);
}

.stat-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 600;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

/* Tabs */
.profile-tabs {
  margin-top: 24px;
}

.tab-content {
  padding: 16px 0;
}

/* About Tab */
.about-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.about-text {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
}

.goal-icon {
  font-size: 24px;
  min-width: 32px;
}

.goal-info {
  flex: 1;
}

.goal-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.goal-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.goal-progress :deep(.el-progress) {
  flex: 1;
  min-width: 100px;
}

.progress-text {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  min-width: 30px;
}

.learning-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.learning-list :deep(.el-tag) {
  margin: 0;
}

/* Achievements Tab */
.achievements-container {
  padding-bottom: 24px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.achievement-card {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.achievement-card:hover {
  border-color: #FFD700;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.achievement-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.achievement-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.achievement-date {
  font-size: 10px;
  color: #6b7280;
}

.locked-achievements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.locked-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background: rgba(209, 213, 219, 0.3);
  border: 2px dashed rgba(209, 213, 219, 0.6);
  border-radius: 8px;
  font-size: 24px;
  color: #d1d5db;
}

/* Paths Tab */
.paths-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.path-item {
  padding: 16px;
  background: rgba(245, 247, 250, 0.6);
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  transition: all 0.3s;
}

.path-item:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.05);
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.path-info {
  flex: 1;
}

.path-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.path-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.path-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.path-progress :deep(.el-progress) {
  flex: 1;
}

.path-domains {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.domain-badge {
  padding: 4px 8px;
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.4);
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
}

.domain-more {
  padding: 4px 8px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 600;
}

/* Activity Tab */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
}

.activity-icon {
  font-size: 24px;
  min-width: 32px;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2px;
}

.activity-details {
  font-size: 12px;
  color: #6b7280;
}

.activity-time {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}

/* Social Tab */
.social-container {
  padding: 12px 0;
}

.social-section {
  margin-bottom: 24px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.user-mini-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.user-mini-card:hover {
  transform: translateY(-4px);
}

.mini-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
  border: 2px solid rgba(229, 230, 235, 0.6);
}

.mini-name {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-basic-info {
    width: 100%;
  }

  .profile-actions {
    justify-content: center;
    width: 100%;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .achievements-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

@media (max-width: 480px) {
  .profile-content {
    padding: 16px;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }

  .user-name {
    font-size: 18px;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .stat-item {
    padding: 8px;
  }

  .stat-icon {
    font-size: 16px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-value {
    font-size: 14px;
  }
}
</style>
