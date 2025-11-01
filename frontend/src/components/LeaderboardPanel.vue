<template>
  <div class="leaderboard-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="trophy-icon">🏆</span> 排行榜
      </h3>
      <el-button
        icon="Refresh"
        circle
        size="small"
        @click="refreshLeaderboard"
      />
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div class="control-group">
        <span class="control-label">类型：</span>
        <el-button-group>
          <el-button
            v-for="type in leaderboardTypes"
            :key="type.value"
            :type="selectedType === type.value ? 'primary' : 'default'"
            size="small"
            @click="selectedType = type.value"
          >
            {{ type.label }}
          </el-button>
        </el-button-group>
      </div>

      <div class="control-group" v-if="selectedType !== 'friends'">
        <span class="control-label">时间：</span>
        <el-button-group>
          <el-button
            v-for="frame in timeframes"
            :key="frame.value"
            :type="selectedTimeframe === frame.value ? 'primary' : 'default'"
            size="small"
            @click="selectedTimeframe = frame.value"
          >
            {{ frame.label }}
          </el-button>
        </el-button-group>
      </div>

      <div class="control-group" v-if="selectedType === 'domain'">
        <span class="control-label">学科：</span>
        <el-select
          v-model="selectedDomain"
          placeholder="选择学科"
          size="small"
          style="width: 150px"
        >
          <el-option
            v-for="domain in domains"
            :key="domain"
            :label="domain"
            :value="domain"
          />
        </el-select>
      </div>
    </div>

    <!-- User Position Card -->
    <div v-if="userPosition" class="user-position-card">
      <div class="position-badge">
        <span class="position-rank">第 {{ userPosition.userRank.rank }}</span>
        <span class="position-medal">{{ userPosition.userRank.medal }}</span>
      </div>

      <div class="position-info">
        <div class="position-name">{{ userPosition.userRank.userName }}</div>
        <div class="position-stats">
          <span class="stat">{{ userPosition.userRank.points }} 分</span>
          <span class="stat">Lv.{{ userPosition.userRank.level }}</span>
          <span class="stat">🔥{{ userPosition.userRank.streak }}</span>
        </div>
      </div>

      <div class="position-progress">
        <el-progress
          :percentage="Math.min(100, (userPosition.userRank.points / maxPoints) * 100)"
          :show-text="false"
        />
      </div>
    </div>

    <!-- Leaderboard Table -->
    <div class="leaderboard-table">
      <div class="table-header">
        <div class="col col-rank">排名</div>
        <div class="col col-user">用户</div>
        <div class="col col-points">积分</div>
        <div class="col col-level">等级</div>
        <div class="col col-streak">连续</div>
        <div class="col col-action">操作</div>
      </div>

      <div
        v-for="user in leaderboardData"
        :key="user.userId"
        class="table-row"
        :class="{ 'is-current-user': user.userId === currentUserId }"
      >
        <div class="col col-rank">
          <span v-if="user.medal" class="medal">{{ user.medal }}</span>
          <span v-else class="rank-number">{{ user.rank }}</span>
        </div>

        <div class="col col-user">
          <div class="user-info">
            <img :src="user.avatar" :alt="user.userName" class="avatar" />
            <div class="user-detail">
              <div class="user-name">{{ user.userName }}</div>
              <div class="user-achievements">
                ⭐ {{ user.achievementCount }} | 学科 {{ user.domainsCompleted }}
              </div>
            </div>
          </div>
        </div>

        <div class="col col-points">
          <span class="points-value">{{ user.points }}</span>
        </div>

        <div class="col col-level">
          <el-tag :type="getLevelColor(user.level)" effect="light">
            Lv.{{ user.level }}
          </el-tag>
        </div>

        <div class="col col-streak">
          <span class="streak-badge" v-if="user.streak > 0">
            🔥{{ user.streak }}
          </span>
          <span v-else class="no-streak">-</span>
        </div>

        <div class="col col-action">
          <el-button
            link
            type="primary"
            size="small"
            @click="viewUserProfile(user)"
          >
            查看
          </el-button>
          <el-button
            v-if="user.userId !== currentUserId"
            link
            type="primary"
            size="small"
            @click="toggleFollow(user)"
          >
            {{ isFollowing(user.userId) ? '已关注' : '关注' }}
          </el-button>
        </div>
      </div>

      <div v-if="leaderboardData.length === 0" class="table-empty">
        暂无排行榜数据
      </div>
    </div>

    <!-- Trending Users Section -->
    <div v-if="selectedType === 'global'" class="trending-section">
      <h4 class="section-title">📈 本周上升之星</h4>
      <div class="trending-cards">
        <div
          v-for="user in trendingUsers"
          :key="user.userId"
          class="trending-card"
        >
          <div class="card-header">
            <img :src="user.avatar" :alt="user.userName" class="avatar" />
            <div class="user-info">
              <div class="user-name">{{ user.userName }}</div>
              <div class="trend-badge" :class="user.trend">
                {{ user.trend === 'up' ? '📈 上升' : '📉 下降' }}
              </div>
            </div>
          </div>

          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">积分</span>
              <span class="stat-value">{{ user.points }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">粉丝</span>
              <span class="stat-value">{{ user.followers }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">原因</span>
              <span class="stat-reason">{{ user.reason }}</span>
            </div>
          </div>

          <el-button
            type="primary"
            size="small"
            @click="viewUserProfile(user)"
            style="width: 100%"
          >
            查看详情
          </el-button>
        </div>
      </div>
    </div>

    <!-- User Profile Dialog -->
    <el-dialog
      v-model="profileDialogVisible"
      title="用户详情"
      width="500px"
      center
    >
      <div v-if="selectedUser" class="user-profile-dialog">
        <div class="profile-header">
          <img :src="selectedUser.avatar" :alt="selectedUser.userName" class="avatar" />
          <div class="profile-info">
            <h3 class="profile-name">{{ selectedUser.userName }}</h3>
            <div class="profile-stats">
              <div class="stat">
                <span class="stat-icon">🏆</span>
                <span>排名：第 {{ selectedUser.rank }} 名</span>
              </div>
              <div class="stat">
                <span class="stat-icon">⭐</span>
                <span>积分：{{ selectedUser.points }}</span>
              </div>
              <div class="stat">
                <span class="stat-icon">📊</span>
                <span>等级：Lv.{{ selectedUser.level }}</span>
              </div>
              <div class="stat">
                <span class="stat-icon">🔥</span>
                <span>连续：{{ selectedUser.streak }} 天</span>
              </div>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="profile-achievements">
          <h4 class="achievements-title">成就徽章</h4>
          <div class="achievements-list">
            <span v-for="i in selectedUser.achievementCount" :key="i" class="achievement-badge">
              🏅
            </span>
          </div>
          <p class="achievements-count">已解锁 {{ selectedUser.achievementCount }}/15 个成就</p>
        </div>

        <el-divider />

        <div class="profile-domains">
          <h4 class="domains-title">完成学科</h4>
          <p class="domains-count">已完成 {{ selectedUser.domainsCompleted }} 个学科</p>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="profileDialogVisible = false">关闭</el-button>
            <el-button
              v-if="selectedUser.userId !== currentUserId"
              type="primary"
              @click="toggleFollow(selectedUser)"
            >
              {{ isFollowing(selectedUser.userId) ? '取消关注' : '关注用户' }}
            </el-button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import socialCollaborationService from '@/services/socialCollaborationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['follow-user', 'unfollow-user', 'view-profile'])

// Refs
const selectedType = ref('global')
const selectedTimeframe = ref('month')
const selectedDomain = ref('')
const leaderboardData = ref([])
const userPosition = ref(null)
const trendingUsers = ref([])
const profileDialogVisible = ref(false)
const selectedUser = ref(null)
const followingUsers = ref([])

// Data
const leaderboardTypes = [
  { value: 'global', label: '全球' },
  { value: 'domain', label: '学科' },
  { value: 'friends', label: '好友' }
]

const timeframes = [
  { value: 'all', label: '全部' },
  { value: 'month', label: '本月' },
  { value: 'week', label: '本周' }
]

const domains = [
  'JavaScript', 'Python', 'React', 'Vue.js', 'TypeScript',
  'Node.js', 'SQL', 'MongoDB', 'Docker', 'Kubernetes'
]

// Current user ID
const currentUserId = ref(props.userId)

// Computed
const maxPoints = computed(() => {
  if (leaderboardData.value.length === 0) return 5000
  return Math.max(...leaderboardData.value.map(u => u.points))
})

// Methods
const loadLeaderboard = () => {
  let leaderboard = []

  if (selectedType.value === 'global' || selectedType.value === 'domain') {
    leaderboard = socialCollaborationService.getLeaderboard(
      selectedType.value,
      selectedTimeframe.value,
      selectedType.value === 'domain' ? selectedDomain.value : null
    )
  } else {
    // Friends leaderboard
    const friendsIds = socialCollaborationService.getFollowing(currentUserId.value)
    leaderboard = socialCollaborationService.getLeaderboard('global', 'month')
      .filter(u => friendsIds.includes(u.userId))
  }

  leaderboardData.value = leaderboard
  loadUserPosition()
  loadTrendingUsers()
}

const loadUserPosition = () => {
  const position = socialCollaborationService.getUserLeaderboardPosition(
    currentUserId.value,
    selectedType.value,
    selectedTimeframe.value
  )
  userPosition.value = position
}

const loadTrendingUsers = () => {
  if (selectedType.value === 'global') {
    trendingUsers.value = socialCollaborationService.getTrendingUsers(6)
  }
}

const refreshLeaderboard = () => {
  loadLeaderboard()
  ElMessage.success('排行榜已刷新')
}

const getLevelColor = (level) => {
  if (level >= 6) return 'success'
  if (level >= 4) return 'warning'
  return 'info'
}

const viewUserProfile = (user) => {
  selectedUser.value = user
  profileDialogVisible.value = true
  emit('view-profile', user)
}

const isFollowing = (userId) => {
  return followingUsers.value.includes(userId)
}

const toggleFollow = (user) => {
  if (isFollowing(user.userId)) {
    socialCollaborationService.unfollowUser(currentUserId.value, user.userId)
    const idx = followingUsers.value.indexOf(user.userId)
    if (idx > -1) followingUsers.value.splice(idx, 1)
    ElMessage.success(`已取消关注 ${user.userName}`)
    emit('unfollow-user', user.userId)
  } else {
    socialCollaborationService.followUser(currentUserId.value, user.userId)
    followingUsers.value.push(user.userId)
    ElMessage.success(`已关注 ${user.userName}`)
    emit('follow-user', user.userId)
  }
}

onMounted(() => {
  followingUsers.value = socialCollaborationService.getFollowing(currentUserId.value)
  loadLeaderboard()
})
</script>

<style scoped>
.leaderboard-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.trophy-icon {
  font-size: 24px;
}

/* Controls */
.controls-section {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

/* User Position Card */
.user-position-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.position-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.position-rank {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.position-medal {
  font-size: 28px;
}

.position-info {
  flex: 1;
}

.position-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}

.position-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.position-progress {
  min-width: 100px;
}

/* Leaderboard Table */
.leaderboard-table {
  margin-bottom: 24px;
}

.table-header {
  display: grid;
  grid-template-columns: 50px 1fr 80px 80px 80px 120px;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.8);
  border-radius: 8px;
  font-weight: 700;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.col {
  display: flex;
  align-items: center;
}

.col-rank {
  justify-content: center;
}

.col-user {
  min-width: 0;
}

.col-points {
  justify-content: center;
}

.col-level {
  justify-content: center;
}

.col-streak {
  justify-content: center;
}

.col-action {
  justify-content: flex-end;
}

.table-row {
  display: grid;
  grid-template-columns: 50px 1fr 80px 80px 80px 120px;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(229, 230, 235, 0.4);
  align-items: center;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.table-row:hover {
  background: rgba(94, 124, 224, 0.05);
  border-color: rgba(94, 124, 224, 0.2);
}

.table-row.is-current-user {
  background: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.3);
  font-weight: 600;
}

.medal {
  font-size: 20px;
}

.rank-number {
  font-weight: 700;
  color: #5e7ce0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-detail {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.user-achievements {
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.points-value {
  font-size: 14px;
  font-weight: 700;
  color: #5e7ce0;
}

.streak-badge {
  font-size: 13px;
  font-weight: 700;
  color: #f56c6c;
}

.no-streak {
  color: #d1d5db;
}

.table-empty {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

/* Trending Section */
.trending-section {
  margin-top: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.trending-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.trending-card {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  transition: all 0.3s;
}

.trending-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 4px 8px rgba(94, 124, 224, 0.1);
}

.card-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.card-header .avatar {
  width: 40px;
  height: 40px;
}

.card-header .user-info {
  flex: 1;
  min-width: 0;
}

.card-header .user-name {
  font-size: 13px;
  font-weight: 700;
}

.trend-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  font-weight: 600;
}

.trend-badge.down {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.stat-reason {
  font-size: 10px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* User Profile Dialog */
.user-profile-dialog {
  display: flex;
  flex-direction: column;
}

.profile-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.profile-header .avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.profile-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-stats .stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.stat-icon {
  font-size: 16px;
}

.achievements-title,
.domains-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.achievements-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.achievement-badge {
  font-size: 20px;
}

.achievements-count,
.domains-count {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .controls-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-group {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 40px 1fr 70px 70px;
    gap: 8px;
  }

  .col-streak,
  .col-action {
    display: none;
  }

  .trending-cards {
    grid-template-columns: 1fr;
  }

  .user-position-card {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .leaderboard-panel {
    padding: 16px;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .col {
    justify-content: space-between;
    padding: 4px 0;
  }

  .col::before {
    content: attr(data-label);
    font-weight: 600;
    color: #6b7280;
  }

  .col-rank::before {
    content: '排名：';
  }

  .col-points::before {
    content: '积分：';
  }

  .col-level::before {
    content: '等级：';
  }

  .col-streak::before {
    content: '连续：';
  }

  .col-action::before {
    content: '';
  }
}
</style>
