<template>
  <div class="leaderboard-container">
    <el-card>
      <template #header>
        <div class="header">
          <h2>🏆 社区贡献排行榜</h2>
          <el-select v-model="timeRange" style="width: 150px" @change="fetchData">
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="全部时间" value="all" />
          </el-select>
        </div>
      </template>

      <el-table
        v-loading="store.leaderboardLoading"
        :data="store.leaderboard"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <div class="rank-badge">
              <span v-if="$index === 0" class="medal gold">🥇</span>
              <span v-else-if="$index === 1" class="medal silver">🥈</span>
              <span v-else-if="$index === 2" class="medal bronze">🥉</span>
              <span v-else class="rank-number">{{ $index + 1 }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="贡献者" min-width="200">
          <template #default="{ row }">
            <div class="contributor-info">
              <el-avatar :size="40" :src="row.avatar" />
              <div class="contributor-details">
                <el-link
                  type="primary"
                  @click="viewProfile(row.userId)"
                >
                  {{ row.username }}
                </el-link>
                <div class="contributor-level">
                  <el-tag
                    v-if="row.level"
                    :type="getLevelType(row.level)"
                    size="small"
                  >
                    {{ getLevelText(row.level) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="总积分" width="120" align="center" sortable>
          <template #default="{ row }">
            <div class="points-display">
              <strong>{{ row.totalPoints }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="提交数" width="100" align="center">
          <template #default="{ row }">
            {{ row.totalSubmissions }}
          </template>
        </el-table-column>

        <el-table-column label="通过数" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #67c23a">{{ row.approvedCount }}</span>
          </template>
        </el-table-column>

        <el-table-column label="通过率" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.approvalRate * 100"
              :color="getProgressColor(row.approvalRate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>

        <el-table-column label="徽章数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.badgeCount }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewProfile(row.userId)">
              查看资料
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 我的排名 -->
      <div v-if="myRank" class="my-rank-section">
        <el-divider />
        <div class="my-rank-card">
          <div class="my-rank-label">我的排名</div>
          <div class="my-rank-content">
            <div class="rank-info">
              <span class="rank-value">#{{ myRank.rank }}</span>
              <span class="rank-total">/ {{ store.leaderboard.length }}</span>
            </div>
            <div class="my-stats">
              <div class="stat">
                <span class="stat-label">总积分</span>
                <span class="stat-value">{{ myRank.totalPoints }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">通过率</span>
                <span class="stat-value">{{ (myRank.approvalRate * 100).toFixed(1) }}%</span>
              </div>
              <div class="stat">
                <span class="stat-label">徽章</span>
                <span class="stat-value">{{ myRank.badgeCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useContributionsStore()
const userStore = useUserStore()

const timeRange = ref('all')

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

onMounted(() => {
  fetchData()
})

async function fetchData() {
  await store.fetchLeaderboard({ limit: 100, timeRange: timeRange.value })
}

function viewProfile(userId) {
  router.push(`/contributions/profile/${userId}`)
}

function tableRowClassName({ $index }) {
  const currentUserId = userStore.user?.id
  const row = store.leaderboard[$index]
  if (row && row.userId === currentUserId) {
    return 'my-row'
  }
  return ''
}

function getLevelType(level) {
  const typeMap = {
    beginner: 'info',
    intermediate: '',
    advanced: 'warning',
    expert: 'success'
  }
  return typeMap[level] || ''
}

function getLevelText(level) {
  const textMap = {
    beginner: '初学者',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家'
  }
  return textMap[level] || level
}

function getProgressColor(rate) {
  if (rate >= 0.8) return '#67c23a'
  if (rate >= 0.6) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.leaderboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
}

.rank-badge {
  display: flex;
  justify-content: center;
  align-items: center;
}

.medal {
  font-size: 32px;
}

.rank-number {
  font-size: 18px;
  font-weight: bold;
  color: #606266;
}

.contributor-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.contributor-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.contributor-level {
  margin-top: 5px;
}

.points-display strong {
  font-size: 18px;
  color: #303133;
}

.my-rank-section {
  margin-top: 20px;
}

.my-rank-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.my-rank-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.my-rank-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-info {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.rank-value {
  font-size: 48px;
  font-weight: bold;
}

.rank-total {
  font-size: 18px;
  opacity: 0.8;
}

.my-stats {
  display: flex;
  gap: 40px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

:deep(.my-row) {
  background-color: #ecf5ff;
  font-weight: bold;
}

:deep(.my-row:hover > td) {
  background-color: #d9ecff !important;
}
</style>
