<template>
  <section class="domain-hero-card">
    <el-skeleton v-if="loading" animated class="hero-skeleton">
      <template #template>
        <div class="skeleton-illustration" />
        <div class="skeleton-content">
          <el-skeleton-item variant="h1" style="width: 60%; height: 24px" />
          <el-skeleton-item variant="text" style="width: 80%" />
          <el-skeleton-item variant="text" style="width: 72%" />
          <div class="skeleton-metrics">
            <el-skeleton-item v-for="i in 3" :key="i" variant="button" style="width: 120px; height: 56px" />
          </div>
        </div>
      </template>
    </el-skeleton>

    <template v-else>
      <div v-if="domain" class="hero-content">
        <div class="hero-illustration">
          <div class="glow" />
          <span class="hero-icon">{{ displayIcon }}</span>
        </div>

        <header class="hero-header">
          <el-tag size="large" effect="plain" class="hero-tag">精选学习路径</el-tag>
          <h1 class="hero-title">{{ domain.name }}</h1>
          <p class="hero-description">{{ domain.description || '开始探索该领域的核心知识体系，逐步构建专业能力。' }}</p>
        </header>

        <!-- 数据指标 -->
        <section class="hero-metrics">
          <article v-if="isPresent(domain.questionCount)" class="metric">
            <span class="metric-label">题目数量</span>
            <span class="metric-value">{{ formatNumber(domain.questionCount) }}</span>
          </article>
          <article v-if="isPresent(domain.categoryCount)" class="metric">
            <span class="metric-label">分类数量</span>
            <span class="metric-value">{{ formatNumber(domain.categoryCount) }}</span>
          </article>
          <article v-if="progress && isPresent(progress.completion)" class="metric">
            <span class="metric-label">完成度</span>
            <span class="metric-value">{{ formatPercent(progress.completion) }}<small>%</small></span>
          </article>
        </section>

        <!-- 难度标签 -->
        <section v-if="difficultyTags.length" class="difficulty-tags">
          <el-tag
            v-for="item in difficultyTags"
            :key="item.label"
            size="small"
            :type="item.type"
            effect="dark"
          >
            {{ item.label }} {{ item.value }}
          </el-tag>
        </section>

        <!-- 核心课程 -->
        <section v-if="coreCourses.length" class="core-courses">
          <h3 class="section-title">核心课程</h3>
          <div class="courses-grid">
            <div v-for="course in coreCourses" :key="course" class="course-item">
              <span class="course-icon">📖</span>
              <span class="course-name">{{ course }}</span>
            </div>
          </div>
        </section>

        <!-- 学习路径 -->
        <section v-if="highlights.length" class="learning-path">
          <h3 class="section-title">学习建议</h3>
          <ul class="path-list">
            <li v-for="highlight in highlights" :key="highlight" class="path-item">
              <span class="path-icon">→</span>
              <span class="path-text">{{ highlight }}</span>
            </li>
          </ul>
        </section>

        <!-- 操作按钮 -->
        <div class="hero-actions">
          <el-button type="primary" size="large" class="hero-cta" @click="handleEnter">
            进入该领域
          </el-button>
          <el-button plain size="large" class="hero-secondary-cta">
            保存收藏
          </el-button>
        </div>
      </div>
      <el-empty v-else description="请选择一个领域开始学习" />
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const numberFormatter = new Intl.NumberFormat('en-US')

const props = defineProps({
  domain: {
    type: Object,
    default: null
  },
  stats: {
    type: Object,
    default: () => ({})
  },
  progress: {
    type: Object,
    default: null
  },
  highlights: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['enter'])

const displayIcon = computed(() => {
  if (props.domain?.icon) {
    return props.domain.icon
  }

  return '🎓'
})

const coreCourses = computed(() => {
  if (props.domain?.coreCourses && Array.isArray(props.domain.coreCourses)) {
    return props.domain.coreCourses.slice(0, 4)
  }
  return []
})

const difficultyTags = computed(() => {
  const stats = props.stats || {}
  const tags = []

  if (isPresent(stats.easy)) {
    tags.push({ label: '基础', value: stats.easy, type: 'success' })
  }

  if (isPresent(stats.medium)) {
    tags.push({ label: '进阶', value: stats.medium, type: 'warning' })
  }

  if (isPresent(stats.hard)) {
    tags.push({ label: '挑战', value: stats.hard, type: 'danger' })
  }

  return tags
})

function formatNumber(value) {
  if (!isPresent(value)) {
    return '0'
  }

  return numberFormatter.format(Number(value))
}

function formatPercent(value) {
  if (!isPresent(value)) {
    return '0'
  }

  return Math.round(Number(value))
}

function isPresent(value) {
  return value !== undefined && value !== null
}

function handleEnter() {
  if (!props.domain) {
    return
  }

  emit('enter', props.domain)
}
</script>

<style scoped>
.domain-hero-card {
  position: relative;
  border-radius: 28px;
  padding: 32px;
  background: linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  min-height: 600px;
  display: flex;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.hero-illustration {
  position: absolute;
  top: 40px;
  right: 40px;
  width: 160px;
  height: 160px;
  border-radius: 32px;
  background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.32), transparent 60%),
    linear-gradient(145deg, rgba(96, 165, 250, 0.35), rgba(14, 165, 233, 0.25));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  font-size: 68px;
  box-shadow: 0 18px 40px rgba(59, 130, 246, 0.25);
}

.hero-illustration .glow {
  position: absolute;
  inset: -35%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.35) 0%, transparent 70%);
  filter: blur(40px);
  opacity: 0.8;
}

.hero-icon {
  position: relative;
  z-index: 1;
}

.hero-header {
  max-width: 60%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-tag {
  align-self: flex-start;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.12);
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.hero-description {
  margin: 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.metric {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-label {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.metric-value {
  font-size: 30px;
  font-weight: 700;
  color: #1e293b;
}

.metric-value small {
  font-size: 16px;
  margin-left: 4px;
  color: #38bdf8;
}

.difficulty-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.difficulty-tags :deep(.el-tag) {
  border-radius: 999px;
  padding: 6px 14px;
  font-weight: 600;
}

/* 核心课程 */
.core-courses {
  background: rgba(15, 23, 42, 0.03);
  border-radius: 18px;
  padding: 20px 24px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  transition: all 0.25s ease;
}

.course-item:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.course-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.course-name {
  font-size: 14px;
  color: #0f172a;
  font-weight: 500;
  word-break: break-word;
}

/* 学习路径 */
.learning-path {
  background: linear-gradient(160deg, rgba(16, 185, 129, 0.08) 0%, rgba(45, 212, 191, 0.08) 100%);
  border-radius: 18px;
  padding: 20px 24px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.path-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.path-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}

.path-icon {
  font-size: 16px;
  color: #10b981;
  flex-shrink: 0;
  margin-top: 2px;
}

.path-text {
  font-size: 14px;
  color: #0f172a;
  line-height: 1.6;
}

/* 操作按钮 */
.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.hero-cta,
.hero-secondary-cta {
  padding: 12px 28px;
  font-size: 16px;
  border-radius: 14px;
}

.hero-cta {
  box-shadow: 0 16px 32px rgba(59, 130, 246, 0.25);
}

/* 骨架屏 */
.hero-skeleton {
  width: 100%;
}

.skeleton-illustration {
  width: 160px;
  height: 160px;
  border-radius: 32px;
  background: rgba(203, 213, 225, 0.45);
  margin-bottom: 20px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-metrics {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* 响应式布局 */
@media (max-width: 1280px) {
  .domain-hero-card {
    min-height: 520px;
  }

  .hero-header {
    max-width: 100%;
  }

  .hero-illustration {
    position: static;
    align-self: center;
    margin-bottom: 18px;
  }
}

@media (max-width: 768px) {
  .domain-hero-card {
    padding: 24px;
    min-height: auto;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-illustration {
    width: 120px;
    height: 120px;
    font-size: 48px;
  }

  .hero-metrics {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-cta,
  .hero-secondary-cta {
    width: 100%;
  }
}
</style>
