<template>
  <div class="t-shape-leaderboard-container">
    <el-card>
      <template #header>
        <div class="header">
          <h2>🎯 T型人才排行榜</h2>
          <div class="header-info">
            <el-tag type="info">T型指数 = 深度 × 0.6 + 广度 × 0.4</el-tag>
          </div>
        </div>
      </template>

      <!-- 榜单说明 -->
      <el-alert type="success" :closable="false" class="mb-20">
        <template #title>
          <div class="alert-content">
            <span>🏆 T型人才：在某一专业领域有深厚造诣，同时具备跨学科知识的复合型人才</span>
          </div>
        </template>
      </el-alert>

      <el-table
        :data="store.tShapeLeaderboard"
        v-loading="store.leaderboardLoading"
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

        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar" />
              <div class="user-details">
                <div class="username">{{ row.username }}</div>
                <el-tag
                  :type="getTShapeTagType(row.tShapeAnalysis.type)"
                  size="small"
                >
                  {{ getTShapeTypeName(row.tShapeAnalysis.type) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="T型指数" width="200" align="center" sortable>
          <template #default="{ row }">
            <div class="t-index-display">
              <div class="t-index-value">
                {{ (row.tShapeAnalysis.index * 100).toFixed(1) }}
              </div>
              <el-progress
                :percentage="row.tShapeAnalysis.index * 100"
                :color="getTShapeColor(row.tShapeAnalysis.type)"
                :stroke-width="6"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="主攻领域" width="150" align="center">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.primaryDomain.domainName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="深度得分" width="120" align="center">
          <template #default="{ row }">
            <strong style="color: #409eff">
              {{ row.tShapeAnalysis.depthScore }}
            </strong>
          </template>
        </el-table-column>

        <el-table-column label="广度得分" width="120" align="center">
          <template #default="{ row }">
            <strong style="color: #67c23a">
              {{ row.tShapeAnalysis.breadthScore }}
            </strong>
          </template>
        </el-table-column>

        <el-table-column label="平衡度" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              type="circle"
              :percentage="row.tShapeAnalysis.balance * 100"
              :width="50"
              :stroke-width="4"
            />
          </template>
        </el-table-column>

        <el-table-column label="领域覆盖" width="150">
          <template #default="{ row }">
            <div class="domain-coverage">
              <el-tag
                v-for="domain in row.tShapeAnalysis.strengths"
                :key="domain"
                size="small"
                type="success"
                class="domain-tag"
              >
                {{ domain }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewProfile(row.userId)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 我的排名 -->
      <div class="my-rank-section" v-if="myRank">
        <el-divider />
        <div class="my-rank-card">
          <div class="my-rank-header">
            <h3>我的 T 型指数</h3>
            <el-tag
              :type="getTShapeTagType(myRank.tShapeAnalysis.type)"
              size="large"
            >
              {{ getTShapeTypeName(myRank.tShapeAnalysis.type) }}
            </el-tag>
          </div>
          <div class="my-rank-content">
            <div class="rank-section">
              <div class="rank-label">我的排名</div>
              <div class="rank-value">#{{ myRank.rank }}</div>
            </div>
            <div class="index-section">
              <div class="index-label">T型指数</div>
              <div class="index-value">
                {{ (myRank.tShapeAnalysis.index * 100).toFixed(1) }}
              </div>
              <el-progress
                :percentage="myRank.tShapeAnalysis.index * 100"
                :color="getTShapeColor(myRank.tShapeAnalysis.type)"
                :stroke-width="10"
              />
            </div>
            <div class="scores-section">
              <div class="score-item">
                <div class="score-label">深度得分</div>
                <div class="score-value">{{ myRank.tShapeAnalysis.depthScore }}</div>
              </div>
              <div class="score-item">
                <div class="score-label">广度得分</div>
                <div class="score-value">{{ myRank.tShapeAnalysis.breadthScore }}</div>
              </div>
              <div class="score-item">
                <div class="score-label">平衡度</div>
                <div class="score-value">
                  {{ (myRank.tShapeAnalysis.balance * 100).toFixed(0) }}%
                </div>
              </div>
            </div>
          </div>
          <div class="my-rank-footer">
            <el-button type="primary" @click="router.push('/ability/profile')">
              查看完整能力画像
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAbilityStore } from '@/stores/ability'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useAbilityStore()
const userStore = useUserStore()

const myRank = computed(() => {
  const currentUserId = userStore.user?.id
  if (!currentUserId) return null

  const index = store.tShapeLeaderboard.findIndex(item => item.userId === currentUserId)
  if (index === -1) return null

  return {
    rank: index + 1,
    ...store.tShapeLeaderboard[index]
  }
})

onMounted(async () => {
  await store.fetchTShapeLeaderboard({ limit: 100 })
})

function viewProfile(userId) {
  router.push(`/ability/profile?userId=${userId}`)
}

function tableRowClassName({ row }) {
  const currentUserId = userStore.user?.id
  if (row && row.userId === currentUserId) {
    return 'my-row'
  }
  return ''
}

function getTShapeColor(type) {
  return type === 'T-shaped' ? '#67c23a' : type === 'I-shaped' ? '#e6a23c' : '#909399'
}

function getTShapeTagType(type) {
  return type === 'T-shaped' ? 'success' : type === 'I-shaped' ? 'warning' : 'info'
}

function getTShapeTypeName(type) {
  const map = {
    'T-shaped': 'T型人才',
    'I-shaped': 'I型人才',
    '破折号-shaped': '破折号型'
  }
  return map[type] || type
}
</script>

<style scoped>
.t-shape-leaderboard-container {
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

.mb-20 {
  margin-bottom: 20px;
}

.alert-content {
  font-size: 14px;
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

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.t-index-display {
  padding: 0 20px;
}

.t-index-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.domain-coverage {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.domain-tag {
  margin: 2px;
}

.my-rank-section {
  margin-top: 30px;
}

.my-rank-card {
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.my-rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.my-rank-header h3 {
  margin: 0;
  font-size: 24px;
}

.my-rank-content {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr;
  gap: 30px;
  margin-bottom: 25px;
}

.rank-section {
  text-align: center;
}

.rank-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.rank-value {
  font-size: 56px;
  font-weight: bold;
}

.index-section {
  text-align: center;
}

.index-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.index-value {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 15px;
}

.scores-section {
  display: flex;
  justify-content: space-around;
}

.score-item {
  text-align: center;
}

.score-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.score-value {
  font-size: 28px;
  font-weight: bold;
}

.my-rank-footer {
  text-align: center;
}

:deep(.my-row) {
  background-color: #ecf5ff;
  font-weight: bold;
}

:deep(.my-row:hover > td) {
  background-color: #d9ecff !important;
}
</style>
