<template>
  <div class="user-guides">
    <!-- Header -->
    <div class="guides-header">
      <h3 class="guides-title">
        <span class="guides-icon">📚</span> 学习指南
      </h3>
      <el-button type="primary" @click="showCreateGuideDialog">
        创建指南
      </el-button>
    </div>

    <!-- Search and Filter -->
    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索指南标题或内容..."
        prefix-icon="Search"
        @input="handleSearch"
        clearable
      />

      <el-select v-model="selectedDomain" placeholder="按领域筛选" clearable @change="handleDomainFilter">
        <el-option
          v-for="domain in domains"
          :key="domain"
          :label="domain"
          :value="domain"
        />
      </el-select>

      <el-select v-model="selectedType" placeholder="按类型筛选" clearable @change="handleTypeFilter">
        <el-option label="初学者指南" value="初学者指南" />
        <el-option label="最佳实践" value="最佳实践" />
        <el-option label="常见陷阱" value="常见陷阱" />
        <el-option label="性能优化" value="性能优化" />
        <el-option label="调试技巧" value="调试技巧" />
      </el-select>

      <el-select v-model="selectedDifficulty" placeholder="按难度筛选" clearable @change="handleDifficultyFilter">
        <el-option label="初级" value="初级" />
        <el-option label="中级" value="中级" />
        <el-option label="高级" value="高级" />
      </el-select>
    </div>

    <!-- Guides List -->
    <div class="guides-list">
      <div
        v-for="guide in filteredGuides"
        :key="guide.id"
        class="guide-card"
        @click="selectGuide(guide)"
      >
        <div class="card-header">
          <div class="guide-info">
            <h4 class="guide-title">{{ guide.title }}</h4>
            <p class="guide-domain">{{ guide.domain }} • {{ guide.type }}</p>
          </div>
          <div class="guide-rating">
            <div class="rating-stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(guide.rating) }">
                ★
              </span>
            </div>
            <span class="rating-value">{{ guide.rating }}</span>
          </div>
        </div>

        <div class="card-description">
          {{ guide.description }}
        </div>

        <div class="card-badges">
          <el-tag effect="light" :type="getDifficultyType(guide.difficulty)">
            {{ guide.difficulty }}
          </el-tag>
          <el-tag effect="plain" type="info">{{ guide.sections }} 个章节</el-tag>
          <el-tag effect="plain" type="info">⏱️ {{ guide.readTime }} 分钟</el-tag>
        </div>

        <div class="card-footer">
          <div class="author-info">
            <img :src="guide.author.avatar" :alt="guide.author.userName" class="author-avatar" />
            <div class="author-details">
              <div class="author-name">{{ guide.author.userName }}</div>
              <div class="author-rep">⭐ {{ guide.author.reputation }}</div>
            </div>
          </div>

          <div class="guide-stats">
            <span class="stat">👁️ {{ guide.views }}</span>
            <span class="stat">👍 {{ guide.likes }}</span>
            <span class="stat">💬 {{ guide.comments || 0 }}</span>
          </div>
        </div>
      </div>

      <div v-if="filteredGuides.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">还没有找到符合条件的指南</div>
        <el-button type="primary" @click="showCreateGuideDialog" style="margin-top: 16px">
          创建第一个指南
        </el-button>
      </div>
    </div>

    <!-- Create Guide Dialog -->
    <el-dialog v-model="createGuideVisible" title="创建新指南" width="700px" center>
      <div class="create-form">
        <el-form :model="newGuide" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="newGuide.title" placeholder="输入指南标题" />
          </el-form-item>

          <el-form-item label="描述">
            <el-input
              v-model="newGuide.description"
              type="textarea"
              rows="2"
              placeholder="输入指南简短描述"
            />
          </el-form-item>

          <el-form-item label="领域">
            <el-select v-model="newGuide.domain" placeholder="选择学习领域">
              <el-option
                v-for="domain in domains"
                :key="domain"
                :label="domain"
                :value="domain"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="内容">
            <el-input
              v-model="newGuide.content"
              type="textarea"
              rows="6"
              placeholder="输入指南详细内容（支持 Markdown）"
            />
          </el-form-item>

          <el-form-item label="标签">
            <el-input
              v-model="newGuide.tagsInput"
              placeholder="用逗号分隔，例如：异步,Promise,async/await"
            />
          </el-form-item>

          <el-form-item label="难度">
            <el-select v-model="newGuide.difficulty" placeholder="选择难度等级">
              <el-option label="初级" value="初级" />
              <el-option label="中级" value="中级" />
              <el-option label="高级" value="高级" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="createGuideVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateGuide">创建指南</el-button>
      </template>
    </el-dialog>

    <!-- Guide Detail Dialog -->
    <el-dialog v-model="guideDetailVisible" :title="selectedGuide?.title" width="800px" center>
      <div v-if="selectedGuide" class="guide-detail">
        <!-- Author and Meta Info -->
        <div class="detail-header">
          <img :src="selectedGuide.author.avatar" :alt="selectedGuide.author.userName" class="author-avatar" />
          <div class="header-info">
            <div class="author-section">
              <div class="author-name">{{ selectedGuide.author.userName }}</div>
              <div class="author-rep">⭐ {{ selectedGuide.author.reputation }} 声誉值</div>
            </div>
            <div class="meta-section">
              <span>📅 {{ formatDate(selectedGuide.createdAt) }}</span>
              <span>📝 更新于 {{ formatDate(selectedGuide.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- Content Info -->
        <div class="content-info">
          <div class="info-item">
            <span class="label">类型</span>
            <el-tag type="info" effect="light">{{ selectedGuide.type }}</el-tag>
          </div>
          <div class="info-item">
            <span class="label">难度</span>
            <el-tag :type="getDifficultyType(selectedGuide.difficulty)" effect="light">
              {{ selectedGuide.difficulty }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">章节</span>
            <span class="value">{{ selectedGuide.sections }}</span>
          </div>
          <div class="info-item">
            <span class="label">阅读时间</span>
            <span class="value">{{ selectedGuide.readTime }} 分钟</span>
          </div>
        </div>

        <el-divider />

        <!-- Description -->
        <div class="guide-description">
          <h5>简介</h5>
          <p>{{ selectedGuide.description }}</p>
        </div>

        <!-- Content Preview -->
        <div class="guide-content">
          <h5>内容预览</h5>
          <div class="content-text">
            {{ selectedGuide.content.substring(0, 300) }}...
          </div>
        </div>

        <!-- Tags -->
        <div v-if="selectedGuide.tags && selectedGuide.tags.length > 0" class="guide-tags">
          <h5>标签</h5>
          <div class="tags-list">
            <el-tag v-for="tag in selectedGuide.tags" :key="tag" effect="plain">
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <!-- Rating and Stats -->
        <div class="engagement-section">
          <div class="stats">
            <div class="stat-item">
              <div class="stat-icon">👁️</div>
              <div class="stat-content">
                <div class="stat-label">浏览</div>
                <div class="stat-value">{{ selectedGuide.views }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">👍</div>
              <div class="stat-content">
                <div class="stat-label">点赞</div>
                <div class="stat-value">{{ selectedGuide.likes }}</div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⭐</div>
              <div class="stat-content">
                <div class="stat-label">评分</div>
                <div class="stat-value">{{ selectedGuide.rating }}/5</div>
              </div>
            </div>
          </div>

          <div class="rating-controls">
            <span>对你有帮助吗？</span>
            <div class="rating-buttons">
              <el-button link type="primary" @click="rateGuide(selectedGuide, 5)">👍 有用</el-button>
              <el-button link type="primary" @click="rateGuide(selectedGuide, 3)">😐 一般</el-button>
              <el-button link type="primary" @click="rateGuide(selectedGuide, 1)">👎 没帮助</el-button>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- Action Buttons -->
        <div class="action-buttons">
          <el-button type="primary" @click="markUseful(selectedGuide)">
            ✓ 标记为有用
          </el-button>
          <el-button type="success" @click="shareGuide(selectedGuide)">
            分享此指南
          </el-button>
          <el-button @click="downloadGuide(selectedGuide)">
            ⬇️ 下载
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityService from '@/services/communityService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const guides = ref([])
const selectedGuide = ref(null)
const createGuideVisible = ref(false)
const guideDetailVisible = ref(false)
const searchQuery = ref('')
const selectedDomain = ref('')
const selectedType = ref('')
const selectedDifficulty = ref('')
const usefulGuides = ref([])

const newGuide = ref({
  title: '',
  description: '',
  content: '',
  domain: 'JavaScript',
  tagsInput: '',
  difficulty: '中级'
})

const domains = ['JavaScript', 'Python', 'React', 'Vue.js', 'Web Development', 'TypeScript']

// Computed
const filteredGuides = computed(() => {
  return guides.value.filter((guide) => {
    let matches = true

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      matches = matches && (
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query) ||
        guide.content.toLowerCase().includes(query)
      )
    }

    if (selectedDomain.value) {
      matches = matches && guide.domain === selectedDomain.value
    }

    if (selectedType.value) {
      matches = matches && guide.type === selectedType.value
    }

    if (selectedDifficulty.value) {
      matches = matches && guide.difficulty === selectedDifficulty.value
    }

    return matches
  })
})

// Methods
const loadGuides = () => {
  guides.value = communityService.getUserGuides(null, 20)
}

const showCreateGuideDialog = () => {
  newGuide.value = {
    title: '',
    description: '',
    content: '',
    domain: 'JavaScript',
    tagsInput: '',
    difficulty: '中级'
  }
  createGuideVisible.value = true
}

const submitCreateGuide = () => {
  if (!newGuide.value.title || !newGuide.value.content) {
    ElMessage.warning('请填写指南标题和内容')
    return
  }

  const tags = newGuide.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t)

  const guide = communityService.createUserGuide(
    props.userId,
    newGuide.value.title,
    newGuide.value.content,
    newGuide.value.domain,
    tags
  )

  // Set additional fields
  guide.description = newGuide.value.description
  guide.difficulty = newGuide.value.difficulty

  guides.value.unshift(guide)
  createGuideVisible.value = false
  ElMessage.success('指南创建成功！')
}

const selectGuide = (guide) => {
  selectedGuide.value = {
    ...guide,
    // Ensure guide has all necessary properties
    comments: guide.comments || 0
  }
  guideDetailVisible.value = true
}

const rateGuide = (guide, rating) => {
  const updatedGuide = communityService.rateGuide(guide.id, rating)
  if (updatedGuide) {
    selectedGuide.value = updatedGuide
    ElMessage.success('感谢您的评分！')
  }
}

const markUseful = (guide) => {
  const idx = usefulGuides.value.findIndex(g => g.id === guide.id)
  if (idx === -1) {
    usefulGuides.value.push(guide)
    ElMessage.success('已添加到有用指南')
  } else {
    usefulGuides.value.splice(idx, 1)
    ElMessage.success('已从有用指南移除')
  }
}

const shareGuide = (guide) => {
  const url = `${window.location.origin}?guideId=${guide.id}`
  navigator.clipboard.writeText(url)
  ElMessage.success('分享链接已复制到剪贴板')
}

const downloadGuide = (guide) => {
  const content = `
# ${guide.title}

**作者**: ${guide.author.userName}
**领域**: ${guide.domain}
**难度**: ${guide.difficulty}
**阅读时间**: ${guide.readTime} 分钟

---

## 简介

${guide.description}

---

## 内容

${guide.content}

---

**标签**: ${(guide.tags || []).join(', ')}
**创建时间**: ${new Date(guide.createdAt).toLocaleString('zh-CN')}
  `.trim()

  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${guide.title}.md`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('指南已下载')
}

const handleSearch = () => {
  // Filter is automatic through computed property
}

const handleDomainFilter = () => {
  // Filter is automatic through computed property
}

const handleTypeFilter = () => {
  // Filter is automatic through computed property
}

const handleDifficultyFilter = () => {
  // Filter is automatic through computed property
}

const getDifficultyType = (difficulty) => {
  const types = {
    '初级': 'success',
    '中级': 'warning',
    '高级': 'danger'
  }
  return types[difficulty] || 'info'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadGuides()
})
</script>

<style scoped>
.user-guides {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.guides-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.guides-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.guides-icon {
  font-size: 24px;
}

/* Search Filter Section */
.search-filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-filter-section :deep(.el-input) {
  flex: 1;
  min-width: 200px;
}

.search-filter-section :deep(.el-select) {
  min-width: 140px;
}

/* Guides List */
.guides-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-card {
  padding: 16px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.guide-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.02);
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 16px;
}

.guide-info {
  flex: 1;
}

.guide-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.guide-domain {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.guide-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 14px;
  color: #d1d5db;
}

.star.filled {
  color: #fbbf24;
}

.rating-value {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.card-description {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.6;
}

.card-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(229, 230, 235, 0.3);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
}

.author-rep {
  font-size: 10px;
  color: #6b7280;
}

.guide-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

/* Create Form */
.create-form {
  padding: 12px 0;
}

/* Guide Detail */
.guide-detail {
  padding: 12px 0;
}

.detail-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-header .author-avatar {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
}

.author-section {
  margin-bottom: 8px;
}

.author-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.author-rep {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.meta-section {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #6b7280;
}

/* Content Info */
.content-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.value {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

/* Description */
.guide-description h5 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.guide-description p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Content */
.guide-content h5 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.content-text {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
  margin-bottom: 16px;
}

/* Tags */
.guide-tags h5 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Engagement Section */
.engagement-section {
  margin-bottom: 16px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.stat-icon {
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 10px;
  color: #6b7280;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.rating-controls {
  padding: 12px;
  background: rgba(94, 124, 224, 0.05);
  border-radius: 6px;
}

.rating-controls > span {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 8px;
}

.rating-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .search-filter-section {
    flex-direction: column;
  }

  .search-filter-section :deep(.el-input),
  .search-filter-section :deep(.el-select) {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
  }

  .guide-rating {
    width: 100%;
  }

  .card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .guide-stats {
    width: 100%;
  }

  .detail-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .rating-buttons {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .user-guides {
    padding: 16px;
  }

  .guides-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .guide-stats {
    flex-direction: column;
    gap: 4px;
  }

  .content-info {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    width: 100%;
  }

  .action-buttons :deep(.el-button) {
    width: 100%;
  }
}
</style>
