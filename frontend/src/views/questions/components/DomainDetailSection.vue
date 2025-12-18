<template>
  <div class="domain-detail-section" v-loading="loading">
    <div class="hero" :style="{ backgroundColor: domain.color || '#667eea' }">
      <div class="hero-inner">
        <el-button link class="back" @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>

        <div class="hero-main">
          <span class="icon">{{ domain.icon || '📚' }}</span>
          <div class="texts">
            <h1 class="title">{{ domain.name || '领域名称' }}</h1>
            <p class="subtitle">{{ domain.description || '掌握这门学科，开启职业新阶段' }}</p>
          </div>
        </div>

        <el-button type="primary" size="large" class="cta" @click="startLearning">
          开启学习路径
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="content">
      <div class="main">
        <div class="overview">
          <div class="card">
            <div class="emoji">📚</div>
            <div>
              <p class="label">题目总数</p>
              <p class="value">{{ stats.total }}</p>
            </div>
          </div>
          <div class="card">
            <div class="emoji">⏱️</div>
            <div>
              <p class="label">预计学习时间</p>
              <p class="value">{{ estimatedHours }} 小时</p>
            </div>
          </div>
          <div class="card">
            <div class="emoji">🎯</div>
            <div>
              <p class="label">难度分布</p>
              <p class="value">{{ difficultyLabel(domain.difficulty) }}</p>
            </div>
          </div>
          <div class="card">
            <div class="emoji">👥</div>
            <div>
              <p class="label">学习人数</p>
              <p class="value">{{ learnerCount }}</p>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-bar">
            <h3>题库预览</h3>
            <el-button link type="primary" @click="viewAllQuestions">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="previewQuestionsComputed.length" class="grid">
            <div
              v-for="q in previewQuestionsComputed"
              :key="q.id"
              class="q-item"
              @click="openQuestion(q)"
            >
              <div class="q-head">
                <h4>{{ q.title }}</h4>
                <el-tag :type="difficultyTagType(q.difficulty)" size="small">
                  {{ difficultyLabel(q.difficulty) }}
                </el-tag>
              </div>
              <p class="q-brief">{{ q.brief }}</p>
              <div class="q-meta">
                <span v-if="q.type" class="meta">{{ typeLabel(q.type) }}</span>
                <span class="meta">{{ q.stats?.attempts || 0 }} 人练习</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂时没有可预览的题目" />
        </div>
      </div>

      <aside class="side">
        <div class="card-block">
          <h4 class="card-title">你的学习进度</h4>
          <div class="progress-line">
            <div class="progress-label">
              <span>完成度</span>
              <span class="progress-value">{{ progressData.completion }}%</span>
            </div>
            <el-progress :percentage="progressData.completion" :color="progressColor" />
          </div>
          <div class="stats2">
            <div class="stat2">
              <div class="num">{{ progressData.attempted }}</div>
              <div class="lab">已做题目</div>
            </div>
            <div class="stat2">
              <div class="num">{{ progressData.accuracy }}%</div>
              <div class="lab">正确率</div>
            </div>
          </div>
        </div>

        <div class="card-block">
          <h4 class="card-title">快速操作</h4>
          <el-button type="primary" class="w" @click="startLearning">
            <el-icon><VideoPlay /></el-icon>
            继续学习
          </el-button>
          <el-button plain class="w" :class="{ active: isFavorited }" @click="toggleFavorite">
            <el-icon><Star /></el-icon>
            {{ isFavorited ? '已收藏' : '收藏' }}
          </el-button>
          <el-button plain class="w" @click="exportPlan">
            <el-icon><Download /></el-icon>
            导出计划
          </el-button>
          <el-button plain class="w" @click="shareDomain">
            <el-icon><Share /></el-icon>
            分享
          </el-button>
        </div>

        <div class="card-block">
          <h4 class="card-title">推荐资源</h4>
          <a
            v-for="resource in recommendedResources"
            :key="resource.label"
            class="res"
            @click.prevent="openResource(resource)"
          >
            <span>{{ resource.icon }} {{ resource.label }}</span>
            <el-icon><ArrowRight /></el-icon>
          </a>
        </div>

        <div class="card-block">
          <h4 class="card-title">💡 今日提示</h4>
          <p class="tip">{{ dailyTip }}</p>
        </div>
      </aside>
    </div>

    <el-dialog v-model="showExportDialog" title="导出学习计划" width="480px" align-center>
      <div class="export-options">
        <el-radio-group v-model="exportFormat">
          <el-radio label="pdf">导出为 PDF</el-radio>
          <el-radio label="csv">导出为 CSV</el-radio>
          <el-radio label="json">导出为 JSON</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showExportDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmExport">导出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, VideoPlay, Star, Download, Share } from '@element-plus/icons-vue'

const props = defineProps({
  domain: {
    type: Object,
    required: true
  },
  progress: {
    type: Object,
    default: () => null
  },
  previewQuestions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'start-learning', 'toggle-favorite', 'export-plan', 'share', 'view-question'])

const isFavorited = ref(false)
const showExportDialog = ref(false)
const exportFormat = ref('pdf')

watch(
  () => props.domain,
  domain => {
    if (!domain) return
    if (typeof domain.isFavorited === 'boolean') {
      isFavorited.value = domain.isFavorited
    }
  },
  { immediate: true }
)

const stats = computed(() => {
  const base = props.domain?.stats || {}
  return {
    total: base.total ?? props.domain?.questionCount ?? 0,
    attempts: base.attempts ?? base.completed ?? 0,
    accuracy: base.accuracy ?? base.correctRate ?? 0
  }
})

const estimatedHours = computed(() => {
  const minutes = props.domain?.estimatedTime ?? props.domain?.stats?.estimatedMinutes ?? stats.value.total * 8
  return Math.max(1, Math.round(Number(minutes || 0) / 60))
})

const learnerCount = computed(() => {
  if (props.domain?.stats?.learners) {
    return props.domain.stats.learners
  }
  if (props.domain?.learnerCount) {
    return props.domain.learnerCount
  }
  return '---'
})

const progressData = computed(() => {
  const source = props.progress || props.domain?.progress || {}
  const completion = Math.min(100, Math.max(0, Number(source.completion ?? source.percent ?? 0)))
  const attempted = source.attempted ?? stats.value.attempts ?? '--'
  const accuracy = Math.min(100, Math.max(0, Number(source.accuracy ?? source.correctRate ?? stats.value.accuracy ?? 0)))
  return {
    completion: Number.isFinite(completion) ? Math.round(completion) : 0,
    attempted: Number.isFinite(Number(attempted)) ? attempted : '--',
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : '--'
  }
})

const progressColor = computed(() => {
  const completion = progressData.value.completion
  if (completion >= 80) return '#22c55e'
  if (completion >= 50) return '#f59e0b'
  return '#ef4444'
})

const previewQuestionsComputed = computed(() =>
  (props.previewQuestions || []).map(question => ({
    id: question.id,
    title: question.title || question.name || '未命名题目',
    brief: question.brief || question.question || question.description || '点击查看详情',
    type: question.type,
    difficulty: question.difficulty,
    stats: question.stats || { attempts: question.attempts }
  }))
)

const recommendedResources = computed(() => {
  const resources = props.domain?.resources || []
  if (resources.length) {
    return resources.map(item => ({
      label: item.label || item.name,
      icon: item.icon || '🔗',
      url: item.url
    }))
  }

  return [
    { label: '学习指南', icon: '📖' },
    { label: '精选书单', icon: '📚' },
    { label: '视频课程', icon: '🎥' }
  ]
})

const dailyTip = computed(() => props.domain?.dailyTip || '建议每天保持 30~45 分钟的专注学习，逐步巩固核心知识。')

function difficultyLabel(value) {
  const map = { easy: '基础', medium: '进阶', hard: '挑战', beginner: '基础', intermediate: '进阶', advanced: '专家' }
  return map[value] || value || '—'
}

function difficultyTagType(value) {
  const map = { easy: 'success', medium: 'warning', hard: 'danger' }
  return map[value] || 'info'
}

function typeLabel(value) {
  const map = {
    coding: '编程题',
    theory: '理论题',
    short_answer: '简答题',
    multiple_choice: '多选题',
    single_choice: '单选题'
  }
  return map[value] || value || '题型'
}

function startLearning() {
  emit('start-learning', props.domain)
}

function toggleFavorite() {
  isFavorited.value = !isFavorited.value
  emit('toggle-favorite', { domain: props.domain, favorited: isFavorited.value })
  ElMessage.success(isFavorited.value ? '已收藏该领域' : '已取消收藏')
}

function exportPlan() {
  showExportDialog.value = true
}

function shareDomain() {
  emit('share', props.domain)
  ElMessage.success('已复制分享链接到剪贴板')
}

function viewAllQuestions() {
  emit('start-learning', props.domain)
}

function openQuestion(question) {
  emit('view-question', question)
}

function confirmExport() {
  emit('export-plan', { domain: props.domain, format: exportFormat.value })
  showExportDialog.value = false
  ElMessage.success(`已导出为 ${exportFormat.value.toUpperCase()}`)
}

function openResource(resource) {
  if (resource.url) {
    window.open(resource.url, '_blank')
  }
}
</script>

<style scoped>
.domain-detail-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero {
  color: #fff;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.hero-inner {
  padding: 40px 24px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.back {
  align-self: flex-start;
  color: rgba(255, 255, 255, 0.9);
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.icon {
  font-size: 52px;
}

.texts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.85;
}

.cta {
  align-self: flex-start;
}

.content {
  display: flex;
  gap: 24px;
  margin-top: -40px;
  padding: 0 24px 40px;
  flex-wrap: wrap;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.side {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.card {
  display: flex;
  gap: 12px;
  align-items: center;
}

.emoji {
  font-size: 28px;
}

.label {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.value {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.q-item {
  border-radius: 12px;
  padding: 16px;
  background: #f9fafb;
  box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.q-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(17, 24, 39, 0.08);
}

.q-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.q-head h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.q-brief {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
  font-size: 13px;
  min-height: 48px;
}

.q-meta {
  display: flex;
  gap: 12px;
  color: #6b7280;
  font-size: 12px;
}

.card-block {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.progress-line {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  color: #4b5563;
  font-size: 13px;
}

.progress-value {
  font-weight: 600;
}

.stats2 {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.stat2 {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.stat2 .num {
  font-size: 18px;
  font-weight: 700;
}

.stat2 .lab {
  font-size: 12px;
  color: #6b7280;
}

.w {
  width: 100%;
}

.w.active {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.4);
}

.res {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #2563eb;
  text-decoration: none;
  cursor: pointer;
}

.tip {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.export-options {
  padding: 12px 0;
}

@media (max-width: 1024px) {
  .content {
    flex-direction: column;
  }

  .side {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .card-block {
    flex: 1 1 240px;
  }
}

@media (max-width: 640px) {
  .hero-inner {
    padding: 32px 20px;
  }

  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .content {
    padding: 0 16px 32px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
