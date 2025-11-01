<template>
  <div class="learning-path-container">
    <!-- Header -->
    <div class="path-header">
      <div class="header-content">
        <h3 class="path-title">
          <i class="el-icon-map-location"></i> 推荐学习路径
        </h3>
        <p class="path-subtitle">基于你的学习目标和当前进度推荐最优的学习顺序</p>
      </div>
    </div>

    <!-- Path Selection -->
    <div class="path-selection">
      <div class="selection-row">
        <div class="selection-group">
          <label class="selection-label">起始学科</label>
          <el-select
            v-model="startDomainId"
            placeholder="选择起始学科"
            @change="handleStartDomainChange"
            clearable
            class="selection-select"
          >
            <el-option
              v-for="domain in availableDomains"
              :key="domain.id"
              :label="domain.name"
              :value="domain.id"
            />
          </el-select>
        </div>

        <div class="selection-group">
          <label class="selection-label">目标学科</label>
          <el-select
            v-model="targetDomainId"
            placeholder="选择目标学科"
            @change="handleTargetDomainChange"
            clearable
            class="selection-select"
          >
            <el-option
              v-for="domain in availableDomains"
              :key="domain.id"
              :label="domain.name"
              :value="domain.id"
            />
          </el-select>
        </div>

        <div class="selection-actions">
          <el-button
            type="primary"
            icon="Search"
            @click="generatePath"
            :loading="pathLoading"
          >
            生成路径
          </el-button>
          <el-button icon="Refresh" @click="resetSelection">
            重置
          </el-button>
        </div>
      </div>
    </div>

    <!-- Path Display -->
    <div v-if="currentPath" class="path-display">
      <!-- Path Stats -->
      <div class="path-stats">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <span class="stat-label">学科数</span>
            <span class="stat-value">{{ currentPath.stepCount }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <span class="stat-label">总学时</span>
            <span class="stat-value">{{ currentPath.totalTime }}h</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <span class="stat-label">难度</span>
            <span class="stat-value">{{ currentPath.difficulty }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <span class="stat-label">完成时间</span>
            <span class="stat-value">{{ masteryTime.realistic }}周</span>
          </div>
        </div>
      </div>

      <!-- Path Timeline -->
      <div class="path-timeline">
        <div
          v-for="(domain, index) in currentPath.domains"
          :key="domain.id"
          class="timeline-item"
        >
          <!-- Connector Line -->
          <div
            v-if="index < currentPath.domains.length - 1"
            class="connector-line"
          ></div>

          <!-- Step Number -->
          <div class="step-badge" :class="`difficulty-${domain.difficulty}`">
            {{ index + 1 }}
          </div>

          <!-- Step Content -->
          <div class="step-content">
            <!-- Domain Card -->
            <div class="domain-card" @click="selectDomain(domain.id)">
              <div class="card-header">
                <h4 class="domain-name">{{ domain.name }}</h4>
                <el-tag
                  :type="getDifficultyType(domain.difficulty)"
                  size="small"
                >
                  {{ getDifficultyLabel(domain.difficulty) }}
                </el-tag>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <span class="info-icon">📚</span>
                  <span class="info-text">{{ domain.questionCount }} 道题目</span>
                </div>
                <div class="info-row">
                  <span class="info-icon">⏱️</span>
                  <span class="info-text">约 {{ domain.timeRequired }} 小时</span>
                </div>
                <div class="info-row">
                  <span class="info-icon">⭐</span>
                  <span class="info-text">{{ domain.rating }} / 5 分</span>
                </div>
                <div class="info-row">
                  <span class="info-icon">👥</span>
                  <span class="info-text">热度 {{ domain.popularity }}%</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress-bar">
                <span class="progress-label">学习进度</span>
                <el-progress
                  :percentage="getProgress(domain.id)"
                  :color="getProgressColor(getProgress(domain.id))"
                />
              </div>

              <!-- Actions -->
              <div class="card-actions">
                <el-button
                  v-if="!isCompleted(domain.id)"
                  size="small"
                  type="primary"
                  @click="selectDomain(domain.id)"
                >
                  <i class="el-icon-check"></i> 开始学习
                </el-button>
                <el-button
                  v-else
                  size="small"
                  type="success"
                  disabled
                >
                  <i class="el-icon-circle-check"></i> 已完成
                </el-button>
                <el-button
                  size="small"
                  @click="viewPrerequisites(domain.id)"
                >
                  <i class="el-icon-link"></i> 前置
                </el-button>
              </div>
            </div>

            <!-- Prerequisites -->
            <div
              v-if="getPrerequisites(domain.id).length > 0"
              class="prerequisites"
            >
              <span class="prereq-label">🔗 前置条件:</span>
              <el-tag
                v-for="preq in getPrerequisites(domain.id)"
                :key="preq.id"
                size="small"
                effect="light"
              >
                {{ preq.name }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Path Summary -->
      <div class="path-summary">
        <div class="summary-content">
          <h4 class="summary-title">📋 学习计划概览</h4>

          <div class="timeline-estimate">
            <div class="estimate-item">
              <span class="estimate-label">乐观估计</span>
              <span class="estimate-value">{{ masteryTime.optimistic }} 周</span>
              <span class="estimate-desc">每周15小时</span>
            </div>

            <div class="estimate-item middle">
              <span class="estimate-label">现实估计</span>
              <span class="estimate-value middle-value">{{ masteryTime.realistic }} 周</span>
              <span class="estimate-desc">每周 {{ masteryTime.recommendedWeeklyHours }} 小时</span>
            </div>

            <div class="estimate-item">
              <span class="estimate-label">保守估计</span>
              <span class="estimate-value">{{ masteryTime.pessimistic }} 周</span>
              <span class="estimate-desc">每周5小时</span>
            </div>
          </div>

          <div class="completion-timeline">
            <span class="completion-label">预计完成时间</span>
            <span class="completion-date">
              {{ formatDate(masteryTime.completionDate) }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="summary-actions">
          <el-button
            type="primary"
            size="large"
            icon="VideoPlay"
            @click="startPath"
          >
            开始学习路径
          </el-button>
          <el-button
            size="large"
            icon="Download"
            @click="downloadPath"
          >
            下载计划
          </el-button>
          <el-button
            size="large"
            icon="Share"
            @click="sharePath"
          >
            分享路径
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-illustration">🗺️</div>
      <p class="empty-text">选择起始和目标学科，为你生成最优学习路径</p>
    </div>

    <!-- Prerequisite Modal -->
    <el-dialog
      v-model="showPrereqDialog"
      title="前置课程详情"
      width="50%"
    >
      <div v-if="selectedPrereqDomain" class="prereq-content">
        <h3>{{ selectedPrereqDomain.name }}</h3>
        <div class="prereq-info">
          <p><strong>难度:</strong> {{ getDifficultyLabel(selectedPrereqDomain.difficulty) }}</p>
          <p><strong>学时:</strong> {{ selectedPrereqDomain.timeRequired }} 小时</p>
          <p><strong>问题数:</strong> {{ selectedPrereqDomain.questionCount }}</p>
          <p><strong>评分:</strong> {{ selectedPrereqDomain.rating }} / 5</p>
        </div>

        <div class="prereq-actions">
          <el-button type="primary" @click="selectDomain(selectedPrereqDomain.id)">
            选择此学科
          </el-button>
          <el-button @click="showPrereqDialog = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDomainStore } from '@/stores/domain'
import knowledgeGraphService from '@/services/knowledgeGraphService'
import { ElMessage } from 'element-plus'

const store = useDomainStore()

// Refs
const startDomainId = ref(null)
const targetDomainId = ref(null)
const currentPath = ref(null)
const masteryTime = ref(null)
const pathLoading = ref(false)
const showPrereqDialog = ref(false)
const selectedPrereqDomain = ref(null)

let knowledgeGraph = null
let prerequisites = new Map()

// Computed
const availableDomains = computed(() => store.domains)

/**
 * Initialize component
 */
const initialize = async () => {
  if (store.domains.length === 0) {
    await store.loadDomains()
  }

  // Build knowledge graph
  knowledgeGraph = knowledgeGraphService.buildKnowledgeGraph(store.domains)

  // Precompute prerequisites
  store.domains.forEach(domain => {
    const prereqs = knowledgeGraphService.getPrerequisiteChain(
      domain.id,
      knowledgeGraph
    )
    prerequisites.set(domain.id, prereqs)
  })
}

/**
 * Generate learning path
 */
const generatePath = async () => {
  if (!startDomainId.value || !targetDomainId.value) {
    ElMessage.warning('请选择起始和目标学科')
    return
  }

  if (startDomainId.value === targetDomainId.value) {
    ElMessage.warning('起始和目标学科不能相同')
    return
  }

  pathLoading.value = true

  try {
    const path = knowledgeGraphService.findLearningPath(
      startDomainId.value,
      targetDomainId.value,
      knowledgeGraph
    )

    if (path) {
      currentPath.value = path
      masteryTime.value = knowledgeGraphService.calculateMasteryTime(path)
      ElMessage.success('学习路径已生成!')
    } else {
      ElMessage.warning('无法找到连接这两个学科的路径')
    }
  } catch (err) {
    console.error('Error generating path:', err)
    ElMessage.error('生成路径失败')
  } finally {
    pathLoading.value = false
  }
}

/**
 * Reset selection
 */
const resetSelection = () => {
  startDomainId.value = null
  targetDomainId.value = null
  currentPath.value = null
  masteryTime.value = null
}

/**
 * Handle start domain change
 */
const handleStartDomainChange = () => {
  // Reset target if same as start
  if (startDomainId.value === targetDomainId.value) {
    targetDomainId.value = null
  }
}

/**
 * Handle target domain change
 */
const handleTargetDomainChange = () => {
  // Reset start if same as target
  if (startDomainId.value === targetDomainId.value) {
    startDomainId.value = null
  }
}

/**
 * Select a domain for practice
 */
const selectDomain = (domainId) => {
  const domain = store.domains.find(d => d.id === domainId)
  if (domain) {
    store.setCurrentDomain(domain)
    ElMessage.success(`已选择: ${domain.name}`)
  }
}

/**
 * Get progress for domain
 */
const getProgress = (domainId) => {
  const progress = store.derivedProgress
  return progress?.completion || 0
}

/**
 * Check if domain is completed
 */
const isCompleted = (domainId) => {
  return store.userProfile?.completedDomains?.includes(domainId) || false
}

/**
 * Get prerequisites for domain
 */
const getPrerequisites = (domainId) => {
  return prerequisites.get(domainId) || []
}

/**
 * View prerequisites
 */
const viewPrerequisites = (domainId) => {
  const prereqs = getPrerequisites(domainId)
  if (prereqs.length > 0) {
    selectedPrereqDomain.value = prereqs[0]
    showPrereqDialog.value = true
  } else {
    ElMessage.info('该学科没有前置条件')
  }
}

/**
 * Start the path
 */
const startPath = () => {
  if (currentPath.value && currentPath.value.domains.length > 0) {
    selectDomain(currentPath.value.domains[0].id)
  }
}

/**
 * Download path as PDF/JSON
 */
const downloadPath = () => {
  if (!currentPath.value) return

  const data = {
    title: '学习路径',
    description: currentPath.value.description,
    domains: currentPath.value.domains,
    totalTime: currentPath.value.totalTime,
    difficulty: currentPath.value.difficulty,
    generatedAt: new Date().toLocaleString()
  }

  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `learning-path-${Date.now()}.json`
  link.click()

  ElMessage.success('路径已下载')
}

/**
 * Share path
 */
const sharePath = () => {
  if (!currentPath.value) return

  const text = `学习路径: ${currentPath.value.description}\n总学时: ${currentPath.value.totalTime}小时`

  if (navigator.share) {
    navigator.share({
      title: '学习路径',
      text: text
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(text)
    ElMessage.success('路径信息已复制到剪贴板')
  }
}

/**
 * Get difficulty type for tag
 */
const getDifficultyType = (difficulty) => {
  const typeMap = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return typeMap[difficulty] || 'info'
}

/**
 * Get difficulty label
 */
const getDifficultyLabel = (difficulty) => {
  const labelMap = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }
  return labelMap[difficulty] || '未知'
}

/**
 * Get progress color
 */
const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 40) return '#e6a23c'
  return '#f56c6c'
}

/**
 * Format date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// Lifecycle
onMounted(initialize)
</script>

<style scoped>
.learning-path-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 12px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.path-header {
  background: linear-gradient(135deg, #5e7ce0 0%, #3c4dc0 100%);
  color: white;
  padding: 24px 20px;
  text-align: center;
}

.path-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.path-subtitle {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.path-selection {
  padding: 20px;
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
  background: rgba(248, 249, 250, 0.5);
}

.selection-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: flex-end;
}

.selection-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.selection-select {
  width: 100%;
}

.selection-actions {
  display: flex;
  gap: 8px;
}

.path-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(229, 230, 235, 0.4);
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #5e7ce0;
}

.path-timeline {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 20px;
}

.connector-line {
  position: absolute;
  left: 30px;
  top: 60px;
  width: 2px;
  height: calc(100% + 16px);
  background: linear-gradient(to bottom, #5e7ce0, transparent);
  opacity: 0.3;
}

.step-badge {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: white;
  background: #5e7ce0;
}

.step-badge.difficulty-beginner {
  background: #67c23a;
}

.step-badge.difficulty-intermediate {
  background: #e6a23c;
}

.step-badge.difficulty-advanced {
  background: #f56c6c;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.domain-card {
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.domain-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.domain-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.card-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px 0;
  border-top: 1px solid rgba(229, 230, 235, 0.3);
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.info-icon {
  font-size: 14px;
  min-width: 14px;
}

.info-text {
  color: #6b7280;
}

.progress-bar {
  margin-bottom: 12px;
}

.progress-label {
  font-size: 11px;
  color: #6b7280;
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-actions :deep(.el-button) {
  flex: 1;
}

.prerequisites {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: rgba(245, 247, 250, 0.8);
  border-radius: 6px;
  margin-top: 8px;
}

.prereq-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.path-summary {
  padding: 20px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  border-top: 2px solid rgba(229, 230, 235, 0.4);
}

.summary-content {
  margin-bottom: 20px;
}

.summary-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.timeline-estimate {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.estimate-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(229, 230, 235, 0.4);
}

.estimate-item.middle {
  border-color: #5e7ce0;
  background: rgba(94, 124, 224, 0.05);
}

.estimate-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.estimate-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #5e7ce0;
  margin-bottom: 4px;
}

.estimate-value.middle-value {
  color: #5e7ce0;
  font-size: 24px;
}

.estimate-desc {
  display: block;
  font-size: 11px;
  color: #9ca3af;
}

.completion-timeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.completion-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.completion-date {
  font-size: 14px;
  font-weight: 700;
  color: #67c23a;
}

.summary-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 40px;
  text-align: center;
  color: #9ca3af;
}

.empty-illustration {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.prereq-content {
  padding: 20px;
}

.prereq-content h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.prereq-info {
  background: rgba(245, 247, 250, 0.8);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.prereq-info p {
  margin: 8px 0;
  font-size: 13px;
  color: #6b7280;
}

.prereq-actions {
  display: flex;
  gap: 8px;
}

.prereq-actions :deep(.el-button) {
  flex: 1;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .path-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .selection-row {
    grid-template-columns: 1fr;
  }

  .timeline-estimate {
    grid-template-columns: 1fr;
  }

  .summary-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .card-body {
    grid-template-columns: 1fr;
  }

  .path-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .stat-card {
    padding: 8px;
    gap: 8px;
  }

  .stat-value {
    font-size: 14px;
  }

  .timeline-item {
    gap: 12px;
  }

  .step-badge {
    width: 50px;
    height: 50px;
    font-size: 16px;
  }
}
</style>
