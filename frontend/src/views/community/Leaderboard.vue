<template>
  <div class="leaderboard-container">
    <el-card class="leaderboard-card">
      <template #header>
        <div class="card-header">
          <h2>
            <el-icon><Trophy /></el-icon>
            社区排行榜
          </h2>
          <div class="time-range">
            <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="all">总榜</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 活跃度排行 -->
        <el-tab-pane label="活跃排行" name="activity">
          <template #label>
            <span class="tab-label">
              <el-icon><TrendCharts /></el-icon>
              活跃排行
            </span>
          </template>

          <div v-loading="loading" class="leaderboard-content">
            <div v-if="activityList.length === 0" class="empty-state">
              <el-empty description="暂无数据" />
            </div>

            <div v-else class="ranking-list">
              <div
                v-for="(user, index) in activityList"
                :key="user.id"
                class="ranking-item"
                :class="{ 'top-three': index < 3 }"
              >
                <div class="rank-badge" :class="`rank-${index + 1}`">
                  <template v-if="index < 3">
                    <el-icon class="medal-icon">
                      <Medal />
                    </el-icon>
                  </template>
                  <template v-else>
                    <span class="rank-number">{{ index + 1 }}</span>
                  </template>
                </div>

                <el-avatar :src="user.avatar" :size="50" class="user-avatar">
                  {{ user.username?.[0] || 'U' }}
                </el-avatar>

                <div class="user-info">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-stats">
                    <span class="stat-item">
                      <el-icon><Document /></el-icon>
                      {{ user.postCount || 0 }} 帖子
                    </span>
                    <span class="stat-item">
                      <el-icon><ChatDotRound /></el-icon>
                      {{ user.commentCount || 0 }} 评论
                    </span>
                  </div>
                </div>

                <div class="score-info">
                  <div class="score-label">活跃度</div>
                  <div class="score-value">{{ user.activityScore || 0 }}</div>
                </div>

                <FollowButton
                  v-if="user.id !== currentUserId"
                  :user-id="user.id"
                  :initial-following="user.isFollowing || false"
                  size="small"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 贡献排行 -->
        <el-tab-pane label="贡献排行" name="contribution">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              贡献排行
            </span>
          </template>

          <div v-loading="loading" class="leaderboard-content">
            <div v-if="contributionList.length === 0" class="empty-state">
              <el-empty description="暂无数据" />
            </div>

            <div v-else class="ranking-list">
              <div
                v-for="(user, index) in contributionList"
                :key="user.id"
                class="ranking-item"
                :class="{ 'top-three': index < 3 }"
              >
                <div class="rank-badge" :class="`rank-${index + 1}`">
                  <template v-if="index < 3">
                    <el-icon class="medal-icon">
                      <Medal />
                    </el-icon>
                  </template>
                  <template v-else>
                    <span class="rank-number">{{ index + 1 }}</span>
                  </template>
                </div>

                <el-avatar :src="user.avatar" :size="50" class="user-avatar">
                  {{ user.username?.[0] || 'U' }}
                </el-avatar>

                <div class="user-info">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-stats">
                    <span class="stat-item">
                      <el-icon><Select /></el-icon>
                      {{ user.submittedCount || 0 }} 提交
                    </span>
                    <span class="stat-item">
                      <el-icon><Check /></el-icon>
                      {{ user.approvedCount || 0 }} 通过
                    </span>
                  </div>
                </div>

                <div class="score-info">
                  <div class="score-label">贡献分</div>
                  <div class="score-value">{{ user.contributionScore || 0 }}</div>
                </div>

                <FollowButton
                  v-if="user.id !== currentUserId"
                  :user-id="user.id"
                  :initial-following="user.isFollowing || false"
                  size="small"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 粉丝排行 -->
        <el-tab-pane label="人气排行" name="followers">
          <template #label>
            <span class="tab-label">
              <el-icon><UserFilled /></el-icon>
              人气排行
            </span>
          </template>

          <div v-loading="loading" class="leaderboard-content">
            <div v-if="followersList.length === 0" class="empty-state">
              <el-empty description="暂无数据" />
            </div>

            <div v-else class="ranking-list">
              <div
                v-for="(user, index) in followersList"
                :key="user.id"
                class="ranking-item"
                :class="{ 'top-three': index < 3 }"
              >
                <div class="rank-badge" :class="`rank-${index + 1}`">
                  <template v-if="index < 3">
                    <el-icon class="medal-icon">
                      <Medal />
                    </el-icon>
                  </template>
                  <template v-else>
                    <span class="rank-number">{{ index + 1 }}</span>
                  </template>
                </div>

                <el-avatar :src="user.avatar" :size="50" class="user-avatar">
                  {{ user.username?.[0] || 'U' }}
                </el-avatar>

                <div class="user-info">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-stats">
                    <span class="stat-item">
                      <el-icon><User /></el-icon>
                      {{ user.followingCount || 0 }} 关注
                    </span>
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ user.totalViews || 0 }} 浏览
                    </span>
                  </div>
                </div>

                <div class="score-info">
                  <div class="score-label">粉丝数</div>
                  <div class="score-value">{{ user.followerCount || 0 }}</div>
                </div>

                <FollowButton
                  v-if="user.id !== currentUserId"
                  :user-id="user.id"
                  :initial-following="user.isFollowing || false"
                  size="small"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Trophy, TrendCharts, Star, UserFilled, Medal,
  Document, ChatDotRound, Select, Check, User, View
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import FollowButton from '@/components/FollowButton.vue'
import api from '@/api'

const userStore = useUserStore()

// 当前用户ID
const currentUserId = computed(() => userStore.user?.id || 1)

// 当前激活的标签页
const activeTab = ref('activity')

// 时间范围
const timeRange = ref('month')

// 加载状态
const loading = ref(false)

// 排行榜数据
const activityList = ref([])
const contributionList = ref([])
const followersList = ref([])

// 加载活跃度排行
const loadActivityRanking = async () => {
  loading.value = true

  try {
    const response = await api({
      url: '/leaderboard/activity',
      method: 'get',
      params: {
        timeRange: timeRange.value,
        limit: 50
      }
    })

    if (response.code === 200) {
      activityList.value = response.data
    }
  } catch (error) {
    console.error('加载活跃度排行失败:', error)
    ElMessage.error('加载活跃度排行失败')
  } finally {
    loading.value = false
  }
}

// 加载贡献排行
const loadContributionRanking = async () => {
  loading.value = true

  try {
    const response = await api({
      url: '/leaderboard/contribution',
      method: 'get',
      params: {
        timeRange: timeRange.value,
        limit: 50
      }
    })

    if (response.code === 200) {
      contributionList.value = response.data
    }
  } catch (error) {
    console.error('加载贡献排行失败:', error)
    ElMessage.error('加载贡献排行失败')
  } finally {
    loading.value = false
  }
}

// 加载粉丝排行
const loadFollowersRanking = async () => {
  loading.value = true

  try {
    const response = await api({
      url: '/leaderboard/followers',
      method: 'get',
      params: {
        timeRange: timeRange.value,
        limit: 50
      }
    })

    if (response.code === 200) {
      followersList.value = response.data
    }
  } catch (error) {
    console.error('加载粉丝排行失败:', error)
    ElMessage.error('加载粉丝排行失败')
  } finally {
    loading.value = false
  }
}

// 切换标签页
const handleTabChange = (tabName) => {
  if (tabName === 'activity' && activityList.value.length === 0) {
    loadActivityRanking()
  } else if (tabName === 'contribution' && contributionList.value.length === 0) {
    loadContributionRanking()
  } else if (tabName === 'followers' && followersList.value.length === 0) {
    loadFollowersRanking()
  }
}

// 切换时间范围
const handleTimeRangeChange = () => {
  // 重新加载当前标签页的数据
  if (activeTab.value === 'activity') {
    loadActivityRanking()
  } else if (activeTab.value === 'contribution') {
    loadContributionRanking()
  } else if (activeTab.value === 'followers') {
    loadFollowersRanking()
  }
}

onMounted(() => {
  // 默认加载活跃度排行
  loadActivityRanking()
})
</script>

<style scoped>
.leaderboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.leaderboard-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.card-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.time-range {
  display: flex;
  align-items: center;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.leaderboard-content {
  min-height: 500px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: #ecf5ff;
  transform: translateX(4px);
}

.ranking-item.top-three {
  background: linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%);
  border: 1px solid #ffd666;
}

.ranking-item.top-three:hover {
  background: linear-gradient(135deg, #fff4d9 0%, #ffe7e3 100%);
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  font-weight: 600;
  font-size: 16px;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #dcdfe6;
  color: #606266;
}

.medal-icon {
  font-size: 24px;
}

.rank-number {
  font-size: 18px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-info {
  text-align: center;
  min-width: 80px;
}

.score-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}

.top-three .score-value {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .leaderboard-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ranking-item {
    flex-wrap: wrap;
    gap: 12px;
  }

  .user-info {
    flex-basis: 100%;
    order: 3;
  }

  .score-info {
    margin-left: auto;
  }

  .user-stats {
    flex-wrap: wrap;
  }
}
</style>
