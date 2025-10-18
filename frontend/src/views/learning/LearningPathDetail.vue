<template>
  <div class="learning-path-detail-page">
    <el-skeleton v-if="pathStore.loading" :rows="10" animated />

    <div v-else-if="path" class="path-content">
      <!-- 页头 -->
      <div class="path-hero">
        <el-button link class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>

        <div class="hero-content">
          <div class="hero-left">
            <div class="path-icon-large">{{ path.icon }}</div>
            <div class="path-info">
              <el-tag :type="getLevelTagType(path.level)" size="large">
                {{ getLevelLabel(path.level) }}
              </el-tag>
              <h1>{{ path.name }}</h1>
              <p class="description">{{ path.description }}</p>

              <div class="path-meta">
                <div class="meta-item">
                  <el-icon><Document /></el-icon>
                  <span>{{ path.moduleCount }} 个模块</span>
                </div>
                <div class="meta-item">
                  <el-icon><Clock /></el-icon>
                  <span>预计 {{ path.estimatedHours }} 小时</span>
                </div>
                <div class="meta-item">
                  <el-icon><User /></el-icon>
                  <span>{{ path.stats.enrolledCount }} 人学习</span>
                </div>
                <div v-if="path.certificate?.enabled" class="meta-item certificate">
                  <el-icon><Medal /></el-icon>
                  <span>可获得证书</span>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-right">
            <el-card class="enroll-card" shadow="always">
              <template v-if="!isEnrolled">
                <h3>开始学习此路径</h3>
                <div class="stats">
                  <div class="stat">
                    <span class="stat-value">{{ path.stats.averageScore }}</span>
                    <span class="stat-label">平均分</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">{{ completionRate }}%</span>
                    <span class="stat-label">完成率</span>
                  </div>
                </div>
                <el-button type="primary" size="large" :loading="enrolling" @click="handleEnroll">
                  立即报名学习
                </el-button>
              </template>

              <template v-else>
                <h3>学习进度</h3>
                <div class="progress-display">
                  <el-progress
                    type="circle"
                    :percentage="Math.round(userProgress.progress * 100)"
                    :width="120"
                    :color="progressColors"
                  />
                </div>
                <div class="progress-stats">
                  <p>已完成 {{ userProgress.completedModules.length }} / {{ path.moduleCount }} 个模块</p>
                  <p v-if="userProgress.totalScore > 0">当前得分: {{ userProgress.totalScore }}</p>
                </div>
                <el-button type="success" size="large" @click="continueLearning">
                  继续学习
                </el-button>
              </template>
            </el-card>
          </div>
        </div>
      </div>

      <!-- 学习模块 -->
      <div class="modules-section">
        <h2>学习模块</h2>
        <div class="modules-list">
          <el-card
            v-for="module in sortedModules"
            :key="module.id"
            class="module-card"
            :class="{ completed: isModuleCompleted(module.id), current: isCurrentModule(module.id) }"
          >
            <div class="module-header">
              <div class="module-left">
                <div class="module-number">{{ module.order }}</div>
                <div class="module-info">
                  <h4>{{ module.name }}</h4>
                  <p>{{ module.description }}</p>
                </div>
              </div>

              <div class="module-right">
                <div class="module-meta">
                  <el-icon><Clock /></el-icon>
                  <span>{{ module.estimatedHours }} 小时</span>
                </div>
                <div class="module-meta">
                  <el-icon><QuestionFilled /></el-icon>
                  <span>{{ module.questionIds.length }} 道题</span>
                </div>
              </div>
            </div>

            <div v-if="isEnrolled" class="module-actions">
              <el-button
                v-if="!isModuleCompleted(module.id)"
                type="primary"
                :disabled="!canStartModule(module)"
                @click="startModule(module)"
              >
                {{ isCurrentModule(module.id) ? '继续学习' : '开始学习' }}
              </el-button>
              <el-tag v-else type="success" size="large">
                <el-icon><Check /></el-icon>
                已完成
              </el-tag>
            </div>

            <!-- 完成标记 -->
            <div v-if="isModuleCompleted(module.id)" class="completed-badge">
              <el-icon><CircleCheck /></el-icon>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 证书信息 -->
      <el-card v-if="path.certificate?.enabled" class="certificate-info" shadow="never">
        <h3>
          <el-icon><Medal /></el-icon>
          获得认证证书
        </h3>
        <p>完成所有模块并达到 {{ path.certificate.passingScore }} 分以上,即可获得:</p>
        <div class="certificate-name">{{ path.certificate.name }}</div>
        <div v-if="canGetCertificate" class="certificate-action">
          <el-button type="warning" size="large">
            <el-icon><Download /></el-icon>
            下载证书
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Document, Clock, User, Medal, QuestionFilled,
  Check, CircleCheck, Download
} from '@element-plus/icons-vue'
import { useLearningPathStore } from '@/stores/learningPath'

const route = useRoute()
const router = useRouter()
const pathStore = useLearningPathStore()

const enrolling = ref(false)

const path = computed(() => pathStore.currentPath)
const isEnrolled = computed(() => {
  return path.value && pathStore.isEnrolled(path.value.id)
})
const userProgress = computed(() => {
  return path.value ? pathStore.getUserProgress(path.value.id) : null
})

const sortedModules = computed(() => {
  if (!path.value) return []
  return [...path.value.modules].sort((a, b) => a.order - b.order)
})

const completionRate = computed(() => {
  if (!path.value) return 0
  return Math.round((path.value.stats.completedCount / path.value.stats.enrolledCount) * 100)
})

const canGetCertificate = computed(() => {
  if (!path.value || !userProgress.value) return false
  return userProgress.value.status === 'completed' &&
         userProgress.value.totalScore >= path.value.certificate.passingScore
})

const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

onMounted(async () => {
  const pathSlug = route.params.pathSlug
  await pathStore.fetchPathDetail(pathSlug)
})

function getLevelLabel(level) {
  const map = { beginner: '入门', intermediate: '进阶', advanced: '高级' }
  return map[level] || level
}

function getLevelTagType(level) {
  const map = { beginner: 'success', intermediate: 'warning', advanced: 'danger' }
  return map[level] || 'info'
}

async function handleEnroll() {
  if (!path.value) return
  enrolling.value = true
  try {
    await pathStore.enrollPath(path.value.id)
  } finally {
    enrolling.value = false
  }
}

function isModuleCompleted(moduleId) {
  return userProgress.value?.completedModules.includes(moduleId)
}

function isCurrentModule(moduleId) {
  return userProgress.value?.currentModuleId === moduleId
}

function canStartModule(module) {
  if (!userProgress.value) return false
  // 第一个模块总是可以开始
  if (module.order === 1) return true
  // 前一个模块必须完成
  const prevModule = sortedModules.value.find(m => m.order === module.order - 1)
  return prevModule && isModuleCompleted(prevModule.id)
}

function startModule(module) {
  // TODO: 跳转到模块练习页面
  console.log('Start module:', module)
  // 示例: 跳转到该模块的第一道题
  if (module.questionIds.length > 0) {
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug: path.value.slug }
    })
  }
}

function continueLearning() {
  const currentModule = sortedModules.value.find(m => m.id === userProgress.value.currentModuleId)
  if (currentModule) {
    startModule(currentModule)
  }
}

function goBack() {
  router.push({ name: 'LearningPathList' })
}
</script>

<style scoped>
.learning-path-detail-page {
  padding: 24px 20px 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 16px;
}

.path-hero {
  margin-bottom: 40px;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 40px;
}

.hero-left {
  display: flex;
  gap: 24px;
}

.path-icon-large {
  font-size: 80px;
}

.path-info h1 {
  margin: 8px 0 12px;
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.description {
  margin: 0 0 24px;
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
}

.path-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.meta-item.certificate {
  color: #e6a23c;
  font-weight: 600;
}

.enroll-card {
  position: sticky;
  top: 80px;
}

.enroll-card h3 {
  margin: 0 0 20px;
  text-align: center;
  font-size: 18px;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.progress-display {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.progress-stats {
  text-align: center;
  margin-bottom: 20px;
  color: #606266;
}

.progress-stats p {
  margin: 8px 0;
}

.enroll-card .el-button {
  width: 100%;
}

.modules-section h2 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 700;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-card {
  position: relative;
  transition: all 0.3s ease;
}

.module-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.module-card.current {
  border: 2px solid #409EFF;
}

.module-card.completed {
  background: #f0f9ff;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.module-left {
  display: flex;
  gap: 16px;
  flex: 1;
}

.module-number {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.module-info h4 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #303133;
}

.module-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.module-right {
  display: flex;
  gap: 16px;
}

.module-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.module-actions {
  display: flex;
  justify-content: flex-end;
}

.completed-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 32px;
  color: #67c23a;
}

.certificate-info {
  margin-top: 40px;
  background: linear-gradient(135deg, #fff9e6 0%, #fff 100%);
  border: 2px solid #e6a23c;
}

.certificate-info h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 20px;
  color: #e6a23c;
}

.certificate-name {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 16px 0;
  text-align: center;
}

.certificate-action {
  text-align: center;
  margin-top: 24px;
}

@media (max-width: 992px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .hero-left {
    flex-direction: column;
  }

  .enroll-card {
    position: static;
  }
}
</style>
