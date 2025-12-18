<template>
  <div class="discipline-explorer">
    <div class="section-header">
      <h2 class="section-title">
        <i class="el-icon-school"></i>
        探索学科体系
      </h2>
      <p class="section-subtitle">4层递进式学习: 学科 → 专业类 → 专业 → 细分方向</p>
    </div>

    <!-- 面包屑导航 -->
    <BreadcrumbNavigation
      v-if="currentLevel !== 'root'"
      :show-steps="true"
      :show-quick-nav="false"
      @navigate-to-level="handleBreadcrumbNavigation"
    />

    <!-- 搜索和过滤 -->
    <DisciplineSearchFilter
      :current-level="currentLevel"
      @search="handleSearch"
      @filter-change="handleFilterChange"
      @select-result="handleSearchResultSelect"
      @expand-results="handleExpandResults"
    />

    <el-skeleton v-if="disciplinesStore.disciplinesLoading" animated :rows="6" />

    <!-- 第一层：学科门类 -->
    <template v-else-if="currentLevel === 'root'">
      <div class="disciplines-view">
        <div class="view-description">
          <p>选择一个学科门类开始探索，探索完整的学科体系和专业方向。共 {{ disciplinesStore.disciplines.length }} 个学科。</p>
        </div>

        <div class="disciplines-grid">
          <div
            v-for="(discipline, index) in disciplinesStore.disciplines"
            :key="discipline.id"
            class="discipline-card"
            :style="{ '--delay': `${index * 0.05}s` }"
            @click="selectDisciplineHandler(discipline)"
          >
            <div class="card-bg" :style="{ backgroundColor: getDisciplineColor(index) }"></div>
            <div class="card-content">
              <div class="card-icon">{{ discipline.icon }}</div>
              <h3 class="card-name">{{ discipline.name }}</h3>
              <p class="card-description">{{ discipline.description }}</p>
              <div class="card-footer">
                <span class="group-count">{{ discipline.majorGroups?.length || 0 }} 个专业类</span>
                <span class="question-count">{{ discipline.questionCount || 0 }} 道题</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 第二层：专业类 -->
    <template v-else-if="currentLevel === 'majorGroup'">
      <MajorGroupSelector
        :current-discipline="disciplinesStore.currentDiscipline"
        @back="goBack"
        @select="selectMajorGroupHandler"
      />
    </template>

    <!-- 第三层：专业 -->
    <template v-else-if="currentLevel === 'major'">
      <MajorsGrid
        :current-discipline="disciplinesStore.currentDiscipline"
        :current-major-group="disciplinesStore.currentMajorGroup"
        @back="goBack"
        @select="selectMajorHandler"
      />
    </template>

    <!-- 第四层：细分方向 -->
    <template v-else-if="currentLevel === 'specialization'">
      <SpecializationDetailPanel
        :specialization="disciplinesStore.currentSpecialization"
        :current-discipline="disciplinesStore.currentDiscipline"
        :current-major="disciplinesStore.currentMajor"
        @back="goBack"
        @start-learning="startLearning"
        @collect="collectSpecialization"
      />
    </template>

    <!-- 专业详情 -->
    <template v-else-if="currentLevel === 'majorDetail'">
      <MajorDetailPanel
        :major="disciplinesStore.currentMajor"
        :current-discipline="disciplinesStore.currentDiscipline"
        :current-major-group="disciplinesStore.currentMajorGroup"
        @back="goBack"
        @select-specialization="selectSpecializationHandler"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisciplinesStore } from '@/stores/disciplines'
import { useDomainStore } from '@/stores/domain'
import MajorGroupSelector from './MajorGroupSelector.vue'
import MajorsGrid from './MajorsGrid.vue'
import MajorDetailPanel from './MajorDetailPanel.vue'
import SpecializationDetailPanel from './SpecializationDetailPanel.vue'
import BreadcrumbNavigation from './BreadcrumbNavigation.vue'
import DisciplineSearchFilter from './DisciplineSearchFilter.vue'

const emit = defineEmits(['select-domain'])
const router = useRouter()
const domainStore = useDomainStore()

const disciplinesStore = useDisciplinesStore()

// 搜索和过滤状态
const searchQuery = ref('')
const filterOptions = ref({
  sortBy: 'default',
  difficulty: [],
  time: []
})

// 加载学科数据
onMounted(async () => {
  try {
    // 加载学科数据
    await disciplinesStore.loadDisciplines()

    // 预加载领域数据，用于映射
    if (!domainStore.domains || domainStore.domains.length === 0) {
      await domainStore.loadDomains({ selectFirst: false })
    }
  } catch (err) {
    console.error('Failed to load disciplines:', err)
  }
})

const currentLevel = computed(() => {
  let level = 'root'

  if (disciplinesStore.currentSpecialization) {
    level = 'specialization'
  } else if (disciplinesStore.currentMajor) {
    level = 'majorDetail'
  } else if (disciplinesStore.currentMajorGroup) {
    level = 'major'
  } else if (disciplinesStore.currentDiscipline) {
    level = 'majorGroup'
  }

  console.log('[DisciplineExplorer] currentLevel 计算结果:', {
    level,
    hasDiscipline: !!disciplinesStore.currentDiscipline,
    hasMajorGroup: !!disciplinesStore.currentMajorGroup,
    hasMajor: !!disciplinesStore.currentMajor,
    hasSpecialization: !!disciplinesStore.currentSpecialization
  })

  return level
})

// 应用过滤和排序
const filteredDisciplines = computed(() => {
  let items = disciplinesStore.disciplines

  // 根据排序方式排序
  if (filterOptions.value.sortBy === 'popularity') {
    items = [...items].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
  } else if (filterOptions.value.sortBy === 'questionCount') {
    items = [...items].sort((a, b) => (b.questionCount || 0) - (a.questionCount || 0))
  } else if (filterOptions.value.sortBy === 'difficulty') {
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, hard: 4 }
    items = [...items].sort((a, b) => {
      const aOrder = difficultyOrder[a.difficulty] || 0
      const bOrder = difficultyOrder[b.difficulty] || 0
      return aOrder - bOrder
    })
  }

  return items
})

// 处理搜索
function handleSearch(event) {
  searchQuery.value = event.query
}

// 处理过滤变更
function handleFilterChange(options) {
  filterOptions.value = options
}

// 处理搜索结果选择
function handleSearchResultSelect(result) {
  // 搜索已处理导航，此处可做额外处理
  console.log('Selected search result:', result)
}

// 展开搜索结果
function handleExpandResults(results) {
  // 打开全量搜索结果模态框
  console.log('Expand results:', results)
}

// 处理面包屑导航
function handleBreadcrumbNavigation(event) {
  console.log('Navigate to level:', event)
}

// 学科/专业到 domain slug 的映射
function getDomainSlugFromDiscipline(discipline) {
  // 学科ID或名称到 domain slug 的映射表
  const mappings = {
    // 学科门类映射
    '08': 'computer-science', // 工学 -> 计算机科学与技术
    '工学': 'computer-science',
    '02': 'data-science', // 经济学 -> 数据科学
    '经济学': 'data-science',
    '07': 'data-science', // 理学 -> 数据科学
    '理学': 'data-science',

    // 专业类映射
    '0809': 'computer-science', // 计算机类
    '计算机类': 'computer-science',

    // 专业映射
    '080901': 'computer-science', // 计算机科学与技术
    '计算机科学与技术': 'computer-science',
    '080902': 'computer-science', // 软件工程
    '软件工程': 'computer-science',
    '080903': 'computer-science', // 网络工程
    '网络工程': 'computer-science',
    '080904': 'computer-science', // 信息安全
    '信息安全': 'computer-science',
    '080905': 'computer-science', // 物联网工程
    '物联网工程': 'computer-science',
    '080906': 'artificial-intelligence', // 数字媒体技术
    '数字媒体技术': 'artificial-intelligence',
    '080907': 'artificial-intelligence', // 智能科学与技术
    '智能科学与技术': 'artificial-intelligence',
    '080910': 'data-science', // 数据科学与大数据技术
    '数据科学与大数据技术': 'data-science',

    // 前端相关专业
    '前端': 'frontend-engineering',
    '前端工程': 'frontend-engineering',
    '前端开发': 'frontend-engineering',

    // 后端相关专业
    '后端': 'backend-engineering',
    '后端工程': 'backend-engineering',
    '后端开发': 'backend-engineering',

    // 云计算相关
    '云计算': 'cloud-native',
    '云原生': 'cloud-native',

    // AI相关
    '人工智能': 'artificial-intelligence',
    '机器学习': 'artificial-intelligence',
    '深度学习': 'artificial-intelligence',
  }

  // 优先使用映射表
  if (mappings[discipline.id]) {
    return mappings[discipline.id]
  }
  if (mappings[discipline.code]) {
    return mappings[discipline.code]
  }
  if (mappings[discipline.name]) {
    return mappings[discipline.name]
  }

  // 如果没有映射，使用学科ID
  return discipline.id || discipline.code || 'all'
}

// 获取领域的第一道题目ID
async function getFirstQuestionId(domainSlug) {
  try {
    // 尝试从 domainStore 获取领域信息
    const domain = domainStore.findDomainBySlug?.(domainSlug)
    if (domain && domain.id) {
      // 这里可以调用 API 获取第一道题目，暂时返回 null
      // 让页面显示题目列表而不是打开具体题目
      return null
    }
    return null
  } catch (err) {
    console.error('获取题目ID失败:', err)
    return null
  }
}

// 选择学科处理
async function selectDisciplineHandler(discipline) {
  console.log('[DisciplineExplorer] 选择学科点击事件:', discipline.name)
  try {
    // 获取对应的 domain slug
    const domainSlug = getDomainSlugFromDiscipline(discipline)
    console.log('[DisciplineExplorer] 映射到 domainSlug:', domainSlug)

    // 获取第一道题目ID（可选）
    const questionId = await getFirstQuestionId(domainSlug)

    // 跳转到题库页面
    const query = questionId ? { questionId } : {}
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug },
      query
    })
  } catch (err) {
    console.error('[DisciplineExplorer] 选择学科出错:', err)
  }
}

// 选择专业类处理
async function selectMajorGroupHandler(majorGroup) {
  try {
    // 获取对应的 domain slug
    const domainSlug = getDomainSlugFromDiscipline(majorGroup)
    console.log('[DisciplineExplorer] 专业类映射到 domainSlug:', domainSlug)

    // 跳转到题库页面
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug }
    })
  } catch (err) {
    console.error('Failed to select major group:', err)
  }
}

// 选择专业处理
async function selectMajorHandler(major) {
  try {
    // 获取对应的 domain slug
    const domainSlug = getDomainSlugFromDiscipline(major)
    console.log('[DisciplineExplorer] 专业映射到 domainSlug:', domainSlug)

    // 跳转到题库页面
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug }
    })
  } catch (err) {
    console.error('Failed to select major:', err)
  }
}

// 选择细分方向处理
async function selectSpecializationHandler(spec) {
  try {
    // 获取对应的 domain slug
    const domainSlug = getDomainSlugFromDiscipline(spec)
    console.log('[DisciplineExplorer] 细分方向映射到 domainSlug:', domainSlug)

    // 跳转到题库页面
    router.push({
      name: 'QuestionBankPage',
      params: { domainSlug }
    })
  } catch (err) {
    console.error('Failed to select specialization:', err)
  }
}

// 返回上一层
function goBack() {
  disciplinesStore.goBack()
}

// 开始学习
function startLearning() {
  const spec = disciplinesStore.currentSpecialization
  const major = disciplinesStore.currentMajor
  emit('select-domain', {
    type: 'specialization',
    id: spec.id,
    name: spec.name,
    majorId: major.id,
    majorName: major.name
  })
}

// 收藏课程
function collectSpecialization() {
  console.log('Collecting specialization:', disciplinesStore.currentSpecialization)
}

// 获取学科颜色
function getDisciplineColor(index) {
  const colors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#00f2fe',
    '#43e97b',
    '#fa709a',
    '#fee140',
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#96ceb4'
  ]
  return colors[index % colors.length]
}
</script>

<style scoped lang="scss">
.discipline-explorer {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.debug-panel {
  background: #fff9e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  font-size: 12px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;

  span:first-child {
    color: #666;
    font-weight: 500;
  }

  .debug-value {
    color: #ff9800;
    font-weight: 600;
    font-family: monospace;
  }
}

.section-header {
  .section-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      color: #667eea;
    }
  }

  .section-subtitle {
    margin: 8px 0 0;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
  }
}

.disciplines-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-description {
  color: #4b5563;
  padding: 12px 0;
}

.disciplines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.discipline-card {
  position: relative;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  padding: 24px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #f3f4f6;
  animation: slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: var(--delay, 0s);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #667eea;
    opacity: 0.8;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
    border-color: rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(-4px);
  }

  &:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
}

.card-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  opacity: 0.1;
  border-radius: 0 16px 0 40px;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-icon {
  font-size: 40px;
  line-height: 1;
}

.card-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.card-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
  color: #9ca3af;

  .group-count,
  .question-count {
    display: flex;
    align-items: center;
  }
}

/* 动画关键帧 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
