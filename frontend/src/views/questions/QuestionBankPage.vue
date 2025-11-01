<template>
  <div class="question-bank-page">
    <section class="page-header">
      <div>
        <div class="header-title-row">
          <el-button
            v-if="currentDomain"
            link
            class="back-btn"
            @click="backToDomainSelector"
          >
            <el-icon><ArrowLeft /></el-icon>
            返回领域选择
          </el-button>
        </div>
        <div v-if="currentDomain" class="domain-info">
          <span class="domain-icon">{{ currentDomain.icon }}</span>
          <h1>{{ currentDomain.name }} - 题库练习</h1>
        </div>
        <h1 v-else>题库练习</h1>
        <p class="subtitle">{{ currentDomain?.description || '按岗位、难度筛选题目，系统化巩固知识点' }}</p>
      </div>
      <div class="header-actions">
        <el-button :loading="store.loading" @click="refreshList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" plain @click="handleResetFilters">
          重置筛选
        </el-button>
      </div>
    </section>

    <el-row :gutter="20">
      <el-col :xs="24" :md="7" :lg="6">
        <div class="filter-panel">
          <h3>筛选条件</h3>

          <div class="filter-section">
            <h4>题目分类</h4>
            <el-tree
              v-if="categoryTree.length"
              :data="categoryTree"
              node-key="id"
              highlight-current
              default-expand-all
              :props="treeProps"
              @node-click="handleCategoryClick"
            />
            <el-empty v-else description="分类加载中" :image-size="80" />
            <div class="filter-actions">
              <el-button v-if="store.filters.categoryId" text size="small" @click="clearCategory">
                清除分类
              </el-button>
              <el-switch
                v-model="includeDescendants"
                active-text="包含子分类"
                @change="handleIncludeDescendants"
              />
            </div>
          </div>

          <div class="filter-section">
            <h4>难度</h4>
            <div class="tag-group">
              <el-check-tag
                v-for="item in difficultyOptions"
                :key="item"
                :checked="store.filters.difficulty.includes(item)"
                @change="() => toggleDifficulty(item)"
              >
                {{ difficultyLabel(item) }}
              </el-check-tag>
            </div>
          </div>

          <div class="filter-section">
            <h4>题型</h4>
            <div class="tag-group">
              <el-check-tag
                v-for="item in typeOptions"
                :key="item"
                :checked="store.filters.type.includes(item)"
                @change="() => toggleType(item)"
              >
                {{ typeLabel(item) }}
              </el-check-tag>
            </div>
          </div>

          <div class="filter-section">
            <h4>热门标签</h4>
            <div class="tag-group">
              <el-check-tag
                v-for="tag in tagOptions"
                :key="tag"
                :checked="store.filters.tags.includes(tag)"
                @change="() => toggleTag(tag)"
              >
                {{ tag }}
              </el-check-tag>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="17" :lg="18">
        <div class="list-panel">
          <div class="list-toolbar">
            <el-input
              v-model="keywordInput"
              placeholder="搜索题目关键词，例如 闭包 / 线程池 / 算法"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>

            <el-select
              v-model="store.filters.sort"
              class="sort-select"
              @change="handleSortChange"
            >
              <el-option label="最新更新" value="recent" />
              <el-option label="人气优先" value="popular" />
              <el-option label="难度升序" value="difficulty" />
              <el-option label="难度降序" value="difficulty_desc" />
            </el-select>
          </div>

          <div v-if="store.hasActiveFilters" class="active-filters">
            <span>已选条件：</span>
            <el-tag
              v-if="store.filters.categoryId"
              closable
              @close="clearCategory"
            >
              分类 · {{ activeCategoryName }}
            </el-tag>
            <el-tag
              v-for="item in store.filters.difficulty"
              :key="`diff-${item}`"
              closable
              @close="() => removeDifficulty(item)"
            >
              难度 · {{ difficultyLabel(item) }}
            </el-tag>
            <el-tag
              v-for="item in store.filters.type"
              :key="`type-${item}`"
              closable
              @close="() => removeType(item)"
            >
              题型 · {{ typeLabel(item) }}
            </el-tag>
            <el-tag
              v-for="tag in store.filters.tags"
              :key="`tag-${tag}`"
              closable
              @close="() => toggleTag(tag)"
            >
              标签 · {{ tag }}
            </el-tag>
            <el-button text size="small" @click="handleResetFilters">全部清除</el-button>
          </div>

          <div v-if="store.summary" class="summary-cards">
            <div class="summary-card">
              <p class="summary-title">共收录</p>
              <p class="summary-value">{{ store.summary.total }} 道题目</p>
            </div>
            <div class="summary-card">
              <p class="summary-title">热门标签</p>
              <p class="summary-value">
                <span v-for="tag in store.summary.tagCloud.slice(0, 3)" :key="tag.tag">#{{ tag.tag }} </span>
              </p>
            </div>
            <div class="summary-card">
              <p class="summary-title">预计练习时长</p>
              <p class="summary-value">约 {{ Math.ceil((store.summary.estimatedTotalPracticeTime || 0) / 60) }} 小时</p>
            </div>
          </div>

          <el-skeleton v-if="store.loading" :rows="8" animated />

          <div v-else>
            <div v-if="!store.list.length" class="empty-wrapper">
              <el-empty description="未找到符合条件的题目，试试调整筛选条件" />
            </div>

            <div v-else class="question-list">
              <el-card
                v-for="item in store.list"
                :key="item.id"
                class="question-card"
                shadow="hover"
              >
                <div class="card-header">
                  <div class="card-title">
                    <h4>{{ item.title }}</h4>
                    <p class="question-brief">{{ item.question }}</p>
                  </div>
                  <el-button type="primary" plain @click="openQuestion(item.id)">
                    开始练习
                  </el-button>
                </div>
                <div class="card-meta">
                  <div class="meta-tags">
                    <el-tag size="small" :type="difficultyTagType(item.difficulty)">
                      {{ difficultyLabel(item.difficulty) }}
                    </el-tag>
                    <el-tag size="small" type="info">{{ typeLabel(item.type) }}</el-tag>
                    <el-tag
                      v-for="tag in item.tags || []"
                      :key="tag"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div class="meta-stats">
                    <span>练习次数：{{ item.stats?.attempts || 0 }}</span>
                    <span>正确率：{{ formatRate(item.stats) }}</span>
                    <span v-if="item.estimatedTime">预计用时：{{ item.estimatedTime }} 分钟</span>
                  </div>
                </div>
              </el-card>
            </div>

            <div v-if="store.pagination.totalPages > 1" class="list-pagination">
              <el-pagination
                background
                layout="prev, pager, next, total"
                :current-page="store.pagination.page"
                :page-size="store.pagination.size"
                :total="store.pagination.total"
                @current-change="store.changePage"
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <QuestionDetailDrawer
      :visible="detailVisible"
      :question="store.currentQuestion"
      :loading="store.currentQuestionLoading"
      :practice-records="store.practiceRecords"
      :recommendations="store.recommendations"
      :submitting="store.submitting"
      @close="detailVisible = false"
      @submit="handleSubmitAnswer"
      @view-question="openQuestion"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, Search, ArrowLeft } from '@element-plus/icons-vue'
import { useQuestionBankStore } from '@/stores/questions'
import { useDomainStore } from '@/stores/domain'
import QuestionDetailDrawer from '@/views/questions/components/QuestionDetailDrawer.vue'

const props = defineProps({
  domainSlug: {
    type: String,
    required: false
  }
})

const route = useRoute()
const router = useRouter()
const store = useQuestionBankStore()
const domainStore = useDomainStore()
const detailVisible = ref(false)
const activeQuestionId = ref(null)
const keywordInput = ref('')
const currentDomain = ref(null)

const treeProps = {
  label: 'name',
  children: 'children'
}

const categoryTree = computed(() => store.categoriesTree || [])

const includeDescendants = computed({
  get: () => store.filters.includeDescendants,
  set: value => store.setIncludeDescendants(value)
})

const difficultyOptions = computed(() => store.availableFilters.difficulties.length ? store.availableFilters.difficulties : ['easy', 'medium', 'hard'])
const typeOptions = computed(() => store.availableFilters.types.length ? store.availableFilters.types : ['short_answer', 'multiple_choice', 'coding'])
const tagOptions = computed(() => store.availableFilters.tags.length ? store.availableFilters.tags : store.tags.map(tag => tag.tag))

const activeCategoryName = computed(() => {
  if (!store.filters.categoryId) return ''
  const match = store.categoriesFlat.find(item => item.id === store.filters.categoryId)
  return match ? match.name : '未分类'
})

onMounted(async () => {
  // 根据 domainSlug 初始化
  if (props.domainSlug || route.params.domainSlug) {
    const slug = props.domainSlug || route.params.domainSlug
    const domain = domainStore.findDomainBySlug(slug)

    if (!domain) {
      // 如果 domains 还未加载,先加载
      await domainStore.loadDomains()
      currentDomain.value = domainStore.findDomainBySlug(slug)
    } else {
      currentDomain.value = domain
    }

    if (currentDomain.value) {
      await store.initializeWithDomain(currentDomain.value.id)
      // 加载领域的字段配置
      await domainStore.loadFieldConfig(currentDomain.value.id)
    }
  } else {
    await store.initialize()
  }

  keywordInput.value = store.filters.keyword
})

// 监听 domain 变化
watch(() => route.params.domainSlug, async (newSlug) => {
  if (newSlug && newSlug !== currentDomain.value?.slug) {
    const domain = domainStore.findDomainBySlug(newSlug)
    if (domain) {
      currentDomain.value = domain
      await store.initializeWithDomain(domain.id)
      await domainStore.loadFieldConfig(domain.id)
    }
  }
})

function backToDomainSelector() {
  // Use replace so the history back does not return to this domain page
  router.replace({ name: 'DomainSelector' })
}

function handleSearch() {
  store.setKeyword(keywordInput.value)
  store.applyFilters({ resetPage: true })
}

function refreshList() {
  store.loadQuestions()
}

function handleResetFilters() {
  store.resetFilters()
  keywordInput.value = ''
  store.applyFilters({ resetPage: true })
}

function handleSortChange(value) {
  store.setSort(value)
  store.applyFilters({ resetPage: true })
}

function toggleDifficulty(value) {
  store.toggleFilterValue('difficulty', value)
  store.applyFilters({ resetPage: true })
}

function toggleType(value) {
  store.toggleFilterValue('type', value)
  store.applyFilters({ resetPage: true })
}

function toggleTag(tag) {
  store.toggleFilterValue('tags', tag)
  store.applyFilters({ resetPage: true })
}

function removeDifficulty(value) {
  toggleDifficulty(value)
}

function removeType(value) {
  toggleType(value)
}

function handleCategoryClick(node) {
  store.setCategory(node.id)
  store.applyFilters({ resetPage: true })
}

function clearCategory() {
  store.setCategory(null)
  store.applyFilters({ resetPage: true })
}

function handleIncludeDescendants() {
  store.applyFilters({ resetPage: true })
}

function difficultyLabel(value) {
  const map = { easy: '基础', medium: '进阶', hard: '挑战' }
  return map[value] || value || '难度'
}

function difficultyTagType(value) {
  const map = { easy: 'success', medium: 'warning', hard: 'danger' }
  return map[value] || 'info'
}

function typeLabel(value) {
  const map = { short_answer: '简答题', multiple_choice: '多选题', coding: '编程题' }
  return map[value] || value || '题型'
}

function formatRate(stats = {}) {
  if (!stats.attempts) return '—'
  const rate = stats.correctCount ? (stats.correctCount / stats.attempts) * 100 : 0
  return `${rate.toFixed(0)}%`
}

async function openQuestion(id) {
  activeQuestionId.value = id
  detailVisible.value = true
  try {
    await store.fetchQuestionDetailData(id)
  } catch (error) {
    detailVisible.value = false
  }
}

function handleSubmitAnswer(payload) {
  if (!activeQuestionId.value) return
  store.submitAnswer(activeQuestionId.value, payload)
}
</script>

<style scoped>
.question-bank-page {
  padding: 24px 20px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-title-row {
  margin-bottom: 8px;
}

.back-btn {
  font-size: 14px;
  padding: 0;
}

.domain-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.domain-icon {
  font-size: 32px;
}

.domain-info h1 {
  margin: 0;
}

.page-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #303133;
}

.subtitle {
  margin: 6px 0 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-panel h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-section h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.list-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  min-height: 560px;
}

.list-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.sort-select {
  width: 160px;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #606266;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 12px;
}

.summary-title {
  margin: 0 0 6px;
  color: #909399;
  font-size: 13px;
}

.summary-value {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  border-radius: 12px;
  border: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.card-title h4 {
  margin: 0 0 6px;
  font-size: 18px;
  color: #303133;
}

.question-brief {
  margin: 0;
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
  max-height: 60px;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

.meta-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-stats {
  display: flex;
  gap: 12px;
  color: #909399;
  font-size: 13px;
}

.list-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.empty-wrapper {
  padding: 40px 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .meta-stats {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
