<template>
  <div class="ability-profile-container">
    <el-row :gutter="20">
      <!-- T型指数卡片 -->
      <el-col :span="8">
        <el-card v-loading="abilityStore.profileLoading">
          <template #header>
            <h3>🎯 T型人才指数</h3>
          </template>
          <div v-if="profile" class="t-shape-card">
            <div class="index-circle">
              <div class="index-value">{{ (profile.tShapeAnalysis.index * 100).toFixed(1) }}</div>
              <div class="index-label">T型指数</div>
            </div>
            <el-progress
              :percentage="profile.tShapeAnalysis.index * 100"
              :color="getTShapeColor(profile.tShapeAnalysis.type)"
              :stroke-width="10"
            />
            <div class="type-badge">
              <el-tag
                :type="getTShapeTagType(profile.tShapeAnalysis.type)"
                size="large"
              >
                {{ getTShapeTypeName(profile.tShapeAnalysis.type) }}
              </el-tag>
            </div>
            <div class="scores-info">
              <div class="score-item">
                <span>深度得分:</span>
                <strong>{{ profile.tShapeAnalysis.depthScore }}</strong>
              </div>
              <div class="score-item">
                <span>广度得分:</span>
                <strong>{{ profile.tShapeAnalysis.breadthScore }}</strong>
              </div>
              <div class="score-item">
                <span>平衡度:</span>
                <strong>{{ (profile.tShapeAnalysis.balance * 100).toFixed(1) }}%</strong>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 主攻领域卡片 -->
      <el-col :span="16">
        <el-card v-loading="abilityStore.profileLoading">
          <template #header>
            <h3>🎓 主攻领域</h3>
          </template>
          <div v-if="profile" class="primary-domain-card">
            <div class="domain-header">
              <h2>{{ profile.primaryDomain.domainName }}</h2>
              <el-tag :type="getLevelType(profile.primaryDomain.level)" size="large">
                {{ getLevelName(profile.primaryDomain.level) }}
              </el-tag>
            </div>
            <div class="domain-stats">
              <div class="domain-stat">
                <div class="stat-label">得分</div>
                <div class="stat-value">{{ profile.primaryDomain.score }}</div>
              </div>
              <div class="domain-stat">
                <div class="stat-label">百分位</div>
                <div class="stat-value">前 {{ (profile.primaryDomain.percentile * 100).toFixed(0) }}%</div>
              </div>
            </div>
            <div class="strengths-weaknesses">
              <div class="strength-section">
                <h4>💪 优势领域</h4>
                <el-tag
                  v-for="strength in profile.tShapeAnalysis.strengths"
                  :key="strength"
                  type="success"
                  class="tag-item"
                >
                  {{ strength }}
                </el-tag>
              </div>
              <div class="weakness-section">
                <h4>📈 提升空间</h4>
                <el-tag
                  v-for="weakness in profile.tShapeAnalysis.weaknesses"
                  :key="weakness"
                  type="warning"
                  class="tag-item"
                >
                  {{ weakness }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 雷达图 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card v-loading="abilityStore.radarLoading">
          <template #header>
            <h3>📊 五维能力雷达图</h3>
          </template>
          <div ref="radarChartRef" style="width: 100%; height: 400px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 领域得分详情 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>📋 领域得分详情</h3>
          </template>
          <el-row :gutter="20">
            <el-col
              v-for="(domain, key) in profile?.domainScores"
              :key="key"
              :span="8"
              class="mb-20"
            >
              <div class="domain-score-card">
                <h4>{{ domain.domainName }}</h4>
                <div class="domain-score">{{ domain.totalScore }}</div>
                <el-progress
                  :percentage="(domain.totalScore / 1000) * 100"
                  :color="getScoreColor(domain.totalScore)"
                />
                <div class="domain-details">
                  <div class="detail-item">
                    <span>答题数:</span>
                    <strong>{{ domain.questionsAttempted }}</strong>
                  </div>
                  <div class="detail-item">
                    <span>正确数:</span>
                    <strong>{{ domain.questionsCorrect }}</strong>
                  </div>
                  <div class="detail-item">
                    <span>正确率:</span>
                    <strong>{{ (domain.accuracy * 100).toFixed(1) }}%</strong>
                  </div>
                  <div class="detail-item">
                    <span>等级:</span>
                    <el-tag :type="getLevelType(domain.level)" size="small">
                      {{ getLevelName(domain.level) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 推荐 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card v-loading="abilityStore.recommendationsLoading">
          <template #header>
            <h3>💡 个性化推荐</h3>
          </template>
          <div v-if="recommendations">
            <div
              v-for="(rec, index) in recommendations.recommendations"
              :key="index"
              class="recommendation-item"
            >
              <div class="rec-header">
                <el-tag :type="getRecType(rec.type)">
                  {{ getRecTypeName(rec.type) }}
                </el-tag>
                <el-tag type="info" size="small">{{ rec.priority }}</el-tag>
              </div>
              <p class="rec-suggestion">{{ rec.suggestion }}</p>
              <div v-if="rec.learningPaths.length > 0" class="rec-paths">
                <span>推荐学习路径:</span>
                <el-link
                  v-for="pathId in rec.learningPaths"
                  :key="pathId"
                  type="primary"
                  @click="goToPath(pathId)"
                >
                  学习路径 {{ pathId }}
                </el-link>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAbilityStore } from '@/stores/ability'
import { useUserStore } from '@/stores/user'
import * as echarts from 'echarts'

const router = useRouter()
const abilityStore = useAbilityStore()
const userStore = useUserStore()

const radarChartRef = ref(null)
let radarChart = null

const profile = computed(() => abilityStore.abilityProfile)
const radarData = computed(() => abilityStore.radarData)
const recommendations = computed(() => abilityStore.recommendations)

onMounted(async () => {
  const userId = userStore.user?.id || 1
  await Promise.all([
    abilityStore.fetchAbilityProfile(userId),
    abilityStore.fetchRadarData(userId),
    abilityStore.fetchRecommendations(userId)
  ])

  await nextTick()
  initRadarChart()
})

watch(radarData, () => {
  updateRadarChart()
})

function initRadarChart() {
  if (!radarChartRef.value) return
  radarChart = echarts.init(radarChartRef.value)
  updateRadarChart()
}

function updateRadarChart() {
  if (!radarChart || !radarData.value) return

  const option = {
    radar: {
      indicator: radarData.value.domains.map((name, index) => ({
        name,
        max: radarData.value.maxScore
      })),
      radius: '60%'
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.value.scores,
        name: '我的能力',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        }
      }]
    }]
  }

  radarChart.setOption(option)
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
    '破折号-shaped': '破折号型人才'
  }
  return map[type] || type
}

function getLevelType(level) {
  const map = {
    beginner: 'info',
    intermediate: 'primary',
    advanced: 'warning',
    expert: 'success'
  }
  return map[level] || 'info'
}

function getLevelName(level) {
  const map = {
    beginner: '初学者',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家'
  }
  return map[level] || level
}

function getScoreColor(score) {
  if (score >= 800) return '#67c23a'
  if (score >= 600) return '#e6a23c'
  if (score >= 400) return '#f56c6c'
  return '#909399'
}

function getRecType(type) {
  return type === 'strengthen_depth' ? 'primary' : 'success'
}

function getRecTypeName(type) {
  const map = {
    strengthen_depth: '深化专业',
    expand_breadth: '拓展广度'
  }
  return map[type] || type
}

function goToPath(pathId) {
  router.push(`/learning-paths/${pathId}`)
}
</script>

<style scoped>
.ability-profile-container {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.t-shape-card {
  text-align: center;
}

.index-circle {
  margin-bottom: 20px;
}

.index-value {
  font-size: 48px;
  font-weight: bold;
  color: #303133;
}

.index-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.type-badge {
  margin-top: 20px;
}

.scores-info {
  margin-top: 20px;
  text-align: left;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.primary-domain-card {
  padding: 10px;
}

.domain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.domain-header h2 {
  margin: 0;
}

.domain-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.domain-stat {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.strengths-weaknesses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.strength-section h4,
.weakness-section h4 {
  margin: 0 0 10px 0;
}

.tag-item {
  margin: 0 5px 5px 0;
}

.domain-score-card {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.domain-score-card h4 {
  margin: 0 0 10px 0;
}

.domain-score {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.domain-details {
  margin-top: 15px;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.recommendation-item {
  padding: 15px;
  margin-bottom: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.rec-header {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.rec-suggestion {
  margin: 10px 0;
  line-height: 1.6;
}

.rec-paths {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
