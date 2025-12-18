<template>
  <div class="leaderboard-container">
    <div class="page-header">
      <h2 class="page-title">🏆 社区贡献名人堂</h2>
      <p class="page-subtitle">感谢每一位为社区贡献知识的开发者</p>
    </div>

    <!-- 筛选控制栏 -->
    <div class="controls-card">
      <div class="control-group">
        <span class="control-label">榜单类型：</span>
        <el-radio-group v-model="selectedType" size="default" @change="fetchData">
          <el-radio-button label="global">全球总榜</el-radio-button>
          <el-radio-button label="friends">好友榜</el-radio-button>
          <el-radio-button label="domain">学科榜</el-radio-button>
        </el-radio-group>
      </div>

      <div class="control-group" v-if="selectedType !== 'friends'">
        <span class="control-label">时间范围：</span>
        <el-radio-group v-model="timeRange" size="default" @change="fetchData">
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="all">全部</el-radio-button>
        </el-radio-group>
      </div>

      <div class="control-group" v-if="selectedType === 'domain'">
        <el-select v-model="selectedDomain" placeholder="选择学科" style="width: 180px" @change="fetchData">
          <el-option v-for="d in domains" :key="d" :label="d" :value="d" />
        </el-select>
      </div>
    </div>

    <!-- Top 3 领奖台 -->
    <TopPodium 
      v-if="podiumUsers.length > 0" 
      :users="podiumUsers" 
      @view-profile="viewProfile" 
    />

    <!-- 列表展示 -->
    <el-card class="list-card" shadow="hover">
      <el-table
        v-loading="store.leaderboardLoading"
        :data="listUsers"
        :row-class-name="tableRowClassName"
        style="width: 100%"
      >
        <el-table-column label="排名" width="100" align="center">
          <template #default="{ $index }">
            <span class="rank-number">#{{ $index + 4 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="贡献者" min-width="200">
          <template #default="{ row }">
            <div class="contributor-info">
              <el-avatar :size="40" :src="row.avatar" class="user-avatar" />
              <div class="contributor-details">
                <div class="name-row">
                  <el-link type="primary" class="username" @click="viewProfile(row.userId)">
                    {{ row.username }}
                  </el-link>
                  <el-tag v-if="row.level" size="small" effect="plain" round>
                    Lv.{{ row.level || 1 }}
                  </el-tag>
                </div>
                <div class="contributor-badges">
                  <span v-if="row.badgeCount > 0">🏅 {{ row.badgeCount }} 徽章</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="总积分" width="150" align="center" sortable prop="totalPoints">
          <template #default="{ row }">
            <div class="points-display">
              <span class="points-value">{{ row.totalPoints }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="通过率" width="180">
          <template #default="{ row }">
            <div class="rate-info">
              <el-progress 
                :percentage="Math.round((row.approvalRate || 0) * 100)" 
                :color="getProgressColor(row.approvalRate)"
                :stroke-width="6"
              />
              <span class="submission-count">{{ row.approvedCount }}/{{ row.totalSubmissions }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
             <el-button 
               v-if="row.userId !== userStore.user?.id"
               size="small" 
               :type="isFollowing(row.userId) ? '' : 'primary'"
               plain
               round
               @click="toggleFollow(row)"
             >
               {{ isFollowing(row.userId) ? '已关注' : '+ 关注' }}
             </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 底部悬浮：我的战绩 -->
    <div v-if="myRank" class="sticky-footer">
      <div class="footer-content">
        <div class="my-info">
          <div class="my-rank-badge">
            <span class="label">当前排名</span>
            <span class="value">#{{ myRank.rank }}</span>
          </div>
          <el-avatar :size="40" :src="userStore.user?.avatar" />
          <div class="my-details">
            <div class="my-name">我 ({{ userStore.user?.username || '我' }})</div>
            <div class="my-points">积分: {{ myRank.totalPoints }}</div>
          </div>
        </div>
        
        <div class="gap-info" v-if="prevRankUser">
          <span>距离上一名 <strong style="color: #409EFF">{{ prevRankUser.username }}</strong> 还差</span>
          <span class="gap-points">{{ prevRankUser.totalPoints - myRank.totalPoints + 1 }} 分</span>
          <el-button type="primary" link size="small" @click="router.push('/contributions/submit')">去贡献 ></el-button>
        </div>
        <div class="gap-info" v-else>
          <span>🎉 您已经是第一名了！继续保持！</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import TopPodium from './components/TopPodium.vue'

const router = useRouter()
const store = useContributionsStore()
const userStore = useUserStore()

// State
const selectedType = ref('global')
const timeRange = ref('all')
const selectedDomain = ref('')
const followingList = ref([]) // Mock following list for UI state

const domains = [
  'Java', 'Python', 'Frontend', 'System Design', 'Algorithms', 'Database'
]

// Computed
const podiumUsers = computed(() => {
  return store.leaderboard.slice(0, 3)
})

const listUsers = computed(() => {
  return store.leaderboard.slice(3)
})

const myRank = computed(() => {
  const currentUserId = userStore.user?.id
  if (!currentUserId) return null

  const index = store.leaderboard.findIndex(item => item.userId === currentUserId)
  if (index === -1) return null

  return {
    rank: index + 1,
    ...store.leaderboard[index]
  }
})

const prevRankUser = computed(() => {
  if (!myRank.value || myRank.value.rank <= 1) return null
  return store.leaderboard[myRank.value.rank - 2] // rank is 1-based, array is 0-based. Prev is rank-2.
})

// Methods
onMounted(() => {
  fetchData()
})

async function fetchData() {
  await store.fetchLeaderboard({ 
    limit: 100, 
    timeRange: timeRange.value,
    type: selectedType.value,
    domain: selectedDomain.value 
  })
}

function viewProfile(userId) {
  router.push(`/contributions/profile/${userId}`)
}

function tableRowClassName({ row }) {
  if (row.userId === userStore.user?.id) {
    return 'my-row'
  }
  return ''
}

function getProgressColor(rate) {
  if (rate >= 0.8) return '#67c23a'
  if (rate >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

// Social Actions
function isFollowing(userId) {
  return followingList.value.includes(userId)
}

function toggleFollow(user) {
  if (isFollowing(user.userId)) {
    followingList.value = followingList.value.filter(id => id !== user.userId)
    ElMessage.info(`已取消关注 ${user.username}`)
  } else {
    followingList.value.push(user.userId)
    ElMessage.success(`已关注 ${user.username}`)
  }
}
</script>

<style scoped>
.leaderboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 100px; /* Space for sticky footer */
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(45deg, #303133, #606266);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
}

/* Controls */
.controls-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  margin-bottom: 40px;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  font-weight: bold;
  color: #606266;
  font-size: 14px;
}

/* List */
.list-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.rank-number {
  font-weight: bold;
  color: #909399;
  font-size: 16px;
}

.contributor-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 600;
  font-size: 15px;
}

.contributor-badges {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.points-value {
  font-weight: 800;
  color: #409EFF;
  font-size: 16px;
}

.rate-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.submission-count {
  font-size: 12px;
  color: #909399;
  min-width: 60px;
}

:deep(.my-row) {
  background-color: #f0f9eb !important;
}

/* Sticky Footer */
.sticky-footer {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 1000px;
  background: white;
  border-radius: 50px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  padding: 10px 30px;
  z-index: 100;
  border: 1px solid #ebeef5;
  animation: slideUp 0.5s ease-out;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.my-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.my-rank-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #303133;
  color: #fff;
  padding: 5px 15px;
  border-radius: 20px;
}

.my-rank-badge .label {
  font-size: 10px;
  opacity: 0.8;
}

.my-rank-badge .value {
  font-size: 18px;
  font-weight: bold;
  line-height: 1.2;
}

.my-details {
  display: flex;
  flex-direction: column;
}

.my-name {
  font-weight: bold;
  color: #303133;
}

.my-points {
  font-size: 12px;
  color: #606266;
}

.gap-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

.gap-points {
  font-weight: bold;
  color: #F56C6C;
  font-size: 16px;
}

@keyframes slideUp {
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

@media (max-width: 768px) {
  .sticky-footer {
    width: 95%;
    border-radius: 12px;
    bottom: 10px;
    padding: 15px;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .controls-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
