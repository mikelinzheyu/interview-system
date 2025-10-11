<template>
  <div class="learning-path-list-page">
    <section class="page-header">
      <div>
        <h1>学习路径</h1>
        <p class="subtitle">系统化学习,快速成长为领域专家</p>
      </div>
      <div class="header-actions">
        <el-select v-model="selectedDomain" placeholder="筛选领域" clearable @change="handleDomainFilter">
          <el-option label="全部领域" :value="null" />
          <el-option
            v-for="domain in domainStore.domains"
            :key="domain.id"
            :label="`${domain.icon} ${domain.name}`"
            :value="domain.id"
          />
        </el-select>
        <el-select v-model="selectedLevel" placeholder="筛选级别" clearable @change="handleLevelFilter">
          <el-option label="全部级别" :value="null" />
          <el-option label="入门" value="beginner" />
          <el-option label="进阶" value="intermediate" />
          <el-option label="高级" value="advanced" />
        </el-select>
      </div>
    </section>

    <el-skeleton v-if="pathStore.loading" :rows="6" animated />

    <div v-else class="paths-grid">
      <el-card
        v-for="path in pathStore.paths"
        :key="path.id"
        class="path-card"
        shadow="hover"
        @click="goToPathDetail(path)"
      >
        <div class="path-header">
          <div class="path-icon">{{ path.icon }}</div>
          <el-tag :type="getLevelTagType(path.level)" size="small">
            {{ getLevelLabel(path.level) }}
          </el-tag>
        </div>

        <h3 class="path-title">{{ path.name }}</h3>
        <p class="path-description">{{ path.description }}</p>

        <div class="path-stats">
          <div class="stat-item">
            <el-icon><Document /></el-icon>
            <span>{{ path.moduleCount }} 个模块</span>
          </div>
          <div class="stat-item">
            <el-icon><Clock /></el-icon>
            <span>约 {{ path.estimatedHours }} 小时</span>
          </div>
          <div class="stat-item">
            <el-icon><QuestionFilled /></el-icon>
            <span>{{ path.totalQuestions }} 道题目</span>
          </div>
        </div>

        <div class="path-popularity">
          <div class="enrolled-count">
            <el-icon><User /></el-icon>
            <span>{{ path.stats.enrolledCount }} 人已报名</span>
          </div>
          <div class="completion-rate">
            完成率: {{ Math.round((path.stats.completedCount / path.stats.enrolledCount) * 100) }}%
          </div>
        </div>

        <!-- 用户进度 -->
        <div v-if="pathStore.isEnrolled(path.id)" class="user-progress">
          <div class="progress-label">
            <span>学习进度</span>
            <span>{{ Math.round(pathStore.getUserProgress(path.id)?.progress * 100) }}%</span>
          </div>
          <el-progress
            :percentage="Math.round((pathStore.getUserProgress(path.id)?.progress || 0) * 100)"
            :color="progressColors"
          />
        </div>

        <div class="path-actions">
          <el-button
            v-if="!pathStore.isEnrolled(path.id)"
            type="primary"
            @click.stop="handleEnroll(path)"
          >
            立即报名
          </el-button>
          <el-button
            v-else
            type="success"
            @click.stop="goToPathDetail(path)"
          >
            继续学习
          </el-button>
        </div>

        <!-- 证书标记 -->
        <div v-if="path.certificate?.enabled" class="certificate-badge">
          <el-icon><Medal /></el-icon>
          <span>可获得证书</span>
        </div>
      </el-card>
    </div>

    <el-empty v-if="!pathStore.loading && !pathStore.paths.length" description="暂无学习路径" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Clock, QuestionFilled, User, Medal } from '@element-plus/icons-vue'
import { useLearningPathStore } from '@/stores/learningPath'
import { useDomainStore } from '@/stores/domain'

const router = useRouter()
const pathStore = useLearningPathStore()
const domainStore = useDomainStore()

const selectedDomain = ref(null)
const selectedLevel = ref(null)

const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

onMounted(async () => {
  await domainStore.loadDomains()
  await loadPaths()
})

async function loadPaths() {
  const params = {}
  if (selectedDomain.value) {
    params.domain_id = selectedDomain.value
  }
  if (selectedLevel.value) {
    params.level = selectedLevel.value
  }
  await pathStore.fetchPaths(params)
}

function handleDomainFilter() {
  loadPaths()
}

function handleLevelFilter() {
  loadPaths()
}

function getLevelLabel(level) {
  const map = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级'
  }
  return map[level] || level
}

function getLevelTagType(level) {
  const map = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return map[level] || 'info'
}

async function handleEnroll(path) {
  try {
    await pathStore.enrollPath(path.id)
    goToPathDetail(path)
  } catch (error) {
    // Error handled in store
  }
}

function goToPathDetail(path) {
  router.push({
    name: 'LearningPathDetail',
    params: { pathSlug: path.slug }
  })
}
</script>

<style scoped>
.learning-path-list-page {
  padding: 24px 20px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.subtitle {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.paths-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.path-card {
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.path-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.path-icon {
  font-size: 48px;
}

.path-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.path-description {
  margin: 0 0 20px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  min-height: 42px;
}

.path-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.path-popularity {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
  color: #909399;
}

.enrolled-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-progress {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}

.path-actions {
  margin-top: 16px;
}

.path-actions .el-button {
  width: 100%;
}

.certificate-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #8b6914;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

@media (max-width: 768px) {
  .paths-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
