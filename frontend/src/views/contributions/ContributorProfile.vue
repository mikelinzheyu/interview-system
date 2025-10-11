<template>
  <div class="contributor-profile-container">
    <el-card v-loading="store.profileLoading">
      <template #header>
        <div class="profile-header">
          <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <div class="profile-info">
            <h2>贡献者资料</h2>
            <p>用户 ID: {{ userId }}</p>
          </div>
        </div>
      </template>

      <div v-if="store.contributorProfile">
        <!-- 统计卡片 -->
        <el-row :gutter="20" class="stats-section">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">📝</div>
              <div class="stat-data">
                <div class="stat-value">{{ profile.stats.totalSubmissions }}</div>
                <div class="stat-label">总提交数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-data">
                <div class="stat-value">{{ profile.stats.approvedCount }}</div>
                <div class="stat-label">通过数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-data">
                <div class="stat-value">{{ (profile.stats.approvalRate * 100).toFixed(1) }}%</div>
                <div class="stat-label">通过率</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon">🏆</div>
              <div class="stat-data">
                <div class="stat-value">{{ profile.stats.totalPoints }}</div>
                <div class="stat-label">总积分</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-divider />

        <!-- 徽章墙 -->
        <div class="section">
          <h3>🏅 徽章墙</h3>
          <div class="badges-grid">
            <div
              v-for="badge in profile.badges"
              :key="badge.id"
              class="badge-item earned"
            >
              <div class="badge-icon">{{ badge.icon }}</div>
              <div class="badge-name">{{ badge.name }}</div>
              <div class="badge-desc">{{ badge.description }}</div>
              <div class="badge-date">{{ formatDate(badge.earnedAt) }}</div>
            </div>
          </div>
          <el-empty v-if="profile.badges.length === 0" description="还没有获得徽章" />
        </div>

        <el-divider />

        <!-- 专业领域 -->
        <div class="section">
          <h3>💡 专业领域</h3>
          <div class="expertise-list">
            <el-tag
              v-for="exp in profile.expertise"
              :key="exp.domainId"
              :type="getExpertiseType(exp.level)"
              size="large"
              class="expertise-tag"
            >
              {{ exp.domainName }} - {{ expertiseLevelMap[exp.level] }} ({{ exp.submissionCount }}道题)
            </el-tag>
          </div>
        </div>

        <el-divider />

        <!-- 活动日志 -->
        <div class="section">
          <h3>📅 最近活动</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in profile.activityLog"
              :key="index"
              :timestamp="formatDate(activity.timestamp)"
              placement="top"
            >
              <el-card>
                <p>{{ getActivityText(activity) }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'

const route = useRoute()
const store = useContributionsStore()

const userId = computed(() => route.params.userId || '1')
const profile = computed(() => store.contributorProfile)

const expertiseLevelMap = {
  beginner: '初学者',
  intermediate: '中级',
  advanced: '高级',
  expert: '专家'
}

onMounted(async () => {
  await store.fetchContributorProfile(userId.value)
})

function getExpertiseType(level) {
  const typeMap = {
    beginner: 'info',
    intermediate: '',
    advanced: 'warning',
    expert: 'success'
  }
  return typeMap[level] || ''
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

function getActivityText(activity) {
  const actionMap = {
    submitted: '提交了题目',
    approved: '题目通过审核',
    rejected: '题目被拒绝',
    revised: '修订了题目',
    badge_earned: '获得了徽章'
  }
  return `${actionMap[activity.action] || activity.action}: ${activity.description}`
}
</script>

<style scoped>
.contributor-profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-info h2 {
  margin: 0 0 5px 0;
}

.profile-info p {
  margin: 0;
  color: #666;
}

.stats-section {
  margin: 20px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3e6f5 30%);
  border-radius: 8px;
}

.stat-icon {
  font-size: 36px;
}

.stat-data {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.section {
  margin: 20px 0;
}

.section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.badge-item {
  padding: 20px;
  text-align: center;
  border: 2px solid #409eff;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3e6f5 100%);
  transition: transform 0.3s;
}

.badge-item:hover {
  transform: translateY(-5px);
}

.badge-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.badge-name {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 16px;
}

.badge-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.badge-date {
  font-size: 12px;
  color: #999;
}

.expertise-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.expertise-tag {
  padding: 10px 15px;
}
</style>
