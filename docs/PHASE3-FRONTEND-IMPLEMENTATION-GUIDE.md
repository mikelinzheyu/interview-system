# Phase 3 前端实现指南

> **日期**: 2025-10-03
> **状态**: API/Store已完成, 页面实现进行中

---

## ✅ 已完成内容

### 1. API 封装 (3个文件)

#### `frontend/src/api/contributions.js`
- ✅ submitQuestion() - 提交题目
- ✅ getMySubmissions() - 获取我的提交列表
- ✅ getSubmissionDetail() - 获取提交详情
- ✅ reviseSubmission() - 修订提交
- ✅ getReviewQueue() - 获取审核队列
- ✅ claimReviewTask() - 领取审核任务
- ✅ submitReview() - 提交审核结果
- ✅ getContributorProfile() - 获取贡献者资料
- ✅ getLeaderboard() - 获取贡献排行榜
- ✅ getBadges() - 获取徽章列表

#### `frontend/src/api/ability.js`
- ✅ getAbilityProfile() - 获取用户能力画像
- ✅ getRadarData() - 获取雷达图数据
- ✅ getTShapeLeaderboard() - 获取 T 型指数排行榜
- ✅ getCrossDomainRecommendations() - 获取跨专业推荐

#### `frontend/src/api/ai.js`
- ✅ generateQuestions() - 生成题目
- ✅ getGenerationHistory() - 获取生成历史
- ✅ reviewGeneratedQuestions() - 审核 AI 生成的题目
- ✅ configAI() - 配置 AI API Key

### 2. Store (3个文件)

#### `frontend/src/stores/contributions.js`
状态管理:
- mySubmissions - 我的提交列表
- currentSubmission - 当前提交详情
- reviewQueue - 审核队列
- contributorProfile - 贡献者资料
- leaderboard - 贡献排行榜
- badges - 徽章列表

计算属性:
- pendingCount - 待审核数量
- approvedCount - 通过数量
- approvalRate - 通过率

#### `frontend/src/stores/ability.js`
状态管理:
- abilityProfile - 用户能力画像
- radarData - 雷达图数据
- tShapeLeaderboard - T型人才排行榜
- recommendations - 跨专业推荐

计算属性:
- tShapeIndex - T 型指数
- talentType - 人才类型
- primaryDomain - 主攻领域
- domainScores - 所有领域得分

#### `frontend/src/stores/ai.js`
状态管理:
- generationHistory - 生成历史
- currentGeneration - 当前生成记录
- aiConfig - AI 配置

计算属性:
- totalTokensUsed - 总Token消耗
- totalCost - 总成本

### 3. 页面 (1个已完成)

#### ✅ `frontend/src/views/contributions/SubmitQuestion.vue`
提交题目页面,包含:
- 基本信息表单 (领域、分类、标题、内容、难度)
- 标签管理
- 选项管理 (动态添加/删除)
- 正确答案选择
- 答案解析
- 提示管理
- 专业字段 (根据领域动态显示)
- 表单验证
- 预览功能

---

## ⏳ 待实现页面

### Phase 3.1: 社区贡献系统

#### 1. 我的提交列表页面
**路径**: `frontend/src/views/contributions/MySubmissions.vue`

**功能**:
```vue
<template>
  - 提交列表表格
    - 状态筛选 (pending, under_review, approved, rejected, needs_revision)
    - 分页
  - 统计卡片
    - 总提交数
    - 通过数
    - 通过率
  - 操作按钮
    - 查看详情
    - 修订 (needs_revision 状态)
</template>

<script setup>
import { useContributionsStore } from '@/stores/contributions'

const store = useContributionsStore()

onMounted(() => {
  store.fetchMySubmissions({ page: 1, limit: 10 })
})
</script>
```

#### 2. 提交详情页面
**路径**: `frontend/src/views/contributions/SubmissionDetail.vue`

**功能**:
- 题目完整信息展示
- 状态流转时间线
- 审核意见显示
- 修订历史
- 操作按钮 (修订、查看题目)

#### 3. 审核队列页面
**路径**: `frontend/src/views/contributions/ReviewQueue.vue`

**功能**:
- 待审核题目列表
- 领取审核任务
- 审核表单 (通过/拒绝/需要修订)
- 审核意见输入

#### 4. 贡献者资料页面
**路径**: `frontend/src/views/contributions/ContributorProfile.vue`

**功能**:
- 个人统计卡片
- 徽章墙展示
- 专业领域标签
- 活动日志时间线
- 排名信息

#### 5. 贡献排行榜页面
**路径**: `frontend/src/views/contributions/Leaderboard.vue`

**功能**:
- 排行榜表格
  - 排名
  - 用户名
  - 总积分
  - 通过数
  - 徽章数
- 我的排名高亮显示

### Phase 3.2: 跨专业能力分析

#### 1. 能力画像页面
**路径**: `frontend/src/views/ability/AbilityProfile.vue`

**功能**:
```vue
<template>
  <div class="ability-profile">
    <!-- T型指数卡片 -->
    <el-card>
      <TShapeIndicator :index="store.tShapeIndex" :type="store.talentType" />
    </el-card>

    <!-- 雷达图 -->
    <el-card>
      <RadarChart :data="store.radarData" />
    </el-card>

    <!-- 领域得分卡片 -->
    <el-row :gutter="20">
      <el-col v-for="domain in domainScores" :key="domain.domainId" :span="8">
        <DomainScoreCard :domain="domain" />
      </el-col>
    </el-row>

    <!-- 推荐列表 -->
    <el-card>
      <RecommendationList :recommendations="store.recommendations" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAbilityStore } from '@/stores/ability'
import { useUserStore } from '@/stores/user'

const abilityStore = useAbilityStore()
const userStore = useUserStore()

onMounted(async () => {
  await abilityStore.fetchAbilityProfile(userStore.user.id)
  await abilityStore.fetchRadarData(userStore.user.id)
  await abilityStore.fetchRecommendations(userStore.user.id)
})
</script>
```

**需要的组件**:
- `RadarChart.vue` - 雷达图 (使用 ECharts)
- `TShapeIndicator.vue` - T型指数指示器
- `DomainScoreCard.vue` - 领域得分卡片
- `RecommendationList.vue` - 推荐列表

#### 2. T型人才排行榜
**路径**: `frontend/src/views/ability/TShapeLeaderboard.vue`

**功能**:
- 排行榜表格
  - 排名
  - 用户名
  - T型指数
  - 人才类型
  - 主攻领域
- 我的排名高亮

### Phase 3.3: AI 自动出题

#### 1. AI 生成题目页面
**路径**: `frontend/src/views/ai/GenerateQuestions.vue`

**功能**:
```vue
<template>
  <el-card>
    <el-form :model="form" label-width="120px">
      <el-form-item label="领域">
        <el-select v-model="form.domainId">
          <el-option v-for="d in domains" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="难度">
        <el-radio-group v-model="form.difficulty">
          <el-radio label="easy">简单</el-radio>
          <el-radio label="medium">中等</el-radio>
          <el-radio label="hard">困难</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="生成数量">
        <el-input-number v-model="form.count" :min="1" :max="10" />
      </el-form-item>

      <el-form-item label="模型">
        <el-select v-model="form.model">
          <el-option label="GPT-4" value="gpt-4" />
          <el-option label="Claude 3 Opus" value="claude-3-opus-20240229" />
        </el-select>
      </el-form-item>

      <el-form-item label="Temperature">
        <el-slider v-model="form.temperature" :min="0" :max="1" :step="0.1" show-input />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleGenerate" :loading="generating">
          生成题目
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 生成的题目展示 -->
    <div v-if="store.currentGeneration" class="generated-questions">
      <GeneratedQuestionCard
        v-for="(q, index) in store.currentGeneration.generatedQuestions"
        :key="index"
        :question="q"
        :index="index"
      />
    </div>

    <!-- Token 使用情况 -->
    <el-alert v-if="store.currentGeneration" type="info">
      Token 使用: {{ store.currentGeneration.tokensUsed }}
      | 成本: ${{ store.currentGeneration.cost }}
    </el-alert>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import { useAIStore } from '@/stores/ai'
import { ElMessage } from 'element-plus'

const store = useAIStore()
const generating = ref(false)

const form = reactive({
  domainId: 1,
  domainName: '计算机科学',
  categoryId: 1,
  difficulty: 'medium',
  count: 3,
  model: 'gpt-4',
  temperature: 0.7,
  metadata: {}
})

async function handleGenerate() {
  generating.value = true
  try {
    const response = await store.generateQuestions(form)
    if (response.code === 200) {
      ElMessage.success('题目生成成功')
    }
  } finally {
    generating.value = false
  }
}
</script>
```

#### 2. 生成历史页面
**路径**: `frontend/src/views/ai/GenerationHistory.vue`

**功能**:
- 生成记录列表
- 筛选 (状态、模型)
- 查看详情
- 审核操作

#### 3. 审核AI生成题目页面
**路径**: `frontend/src/views/ai/ReviewGenerated.vue`

**功能**:
- 题目列表展示
- 质量评分显示
- 批量选择 (通过/拒绝)
- 提交审核

#### 4. AI 配置页面
**路径**: `frontend/src/views/ai/AIConfig.vue`

**功能**:
- OpenAI 配置
  - API Key 输入
  - 模型选择
  - 启用/禁用
- Anthropic 配置
  - API Key 输入
  - 模型选择
  - 启用/禁用

---

## 📦 需要创建的组件

### 社区贡献组件

#### 1. `SubmissionCard.vue`
提交卡片组件
```vue
<template>
  <el-card class="submission-card">
    <div class="header">
      <span class="title">{{ submission.title }}</span>
      <el-tag :type="statusTypeMap[submission.status]">
        {{ statusTextMap[submission.status] }}
      </el-tag>
    </div>
    <div class="meta">
      <span>{{ submission.domainName }}</span>
      <span>{{ submission.difficulty }}</span>
      <span>{{ formatDate(submission.submittedAt) }}</span>
    </div>
    <div class="actions">
      <el-button size="small" @click="$emit('view')">查看详情</el-button>
      <el-button v-if="submission.status === 'needs_revision'" size="small" type="primary" @click="$emit('revise')">
        修订
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
defineProps(['submission'])
defineEmits(['view', 'revise'])

const statusTypeMap = {
  pending: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  needs_revision: 'warning'
}

const statusTextMap = {
  pending: '待审核',
  under_review: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
  needs_revision: '需要修订'
}
</script>
```

#### 2. `BadgeDisplay.vue`
徽章展示组件
```vue
<template>
  <div class="badge-wall">
    <div
      v-for="badge in badges"
      :key="badge.id"
      class="badge-item"
      :class="{ earned: badge.earned }"
    >
      <div class="badge-icon">{{ badge.icon }}</div>
      <div class="badge-name">{{ badge.name }}</div>
      <div class="badge-desc">{{ badge.description }}</div>
      <div v-if="badge.earnedAt" class="badge-date">
        {{ formatDate(badge.earnedAt) }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['badges'])
</script>

<style scoped>
.badge-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

.badge-item {
  padding: 20px;
  text-align: center;
  border: 2px solid #ddd;
  border-radius: 8px;
  opacity: 0.5;
  transition: all 0.3s;
}

.badge-item.earned {
  opacity: 1;
  border-color: #409eff;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3e6f5 100%);
}

.badge-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.badge-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.badge-desc {
  font-size: 12px;
  color: #666;
}
</style>
```

#### 3. `ReviewForm.vue`
审核表单组件

### 能力分析组件

#### 1. `RadarChart.vue`
雷达图组件 (ECharts)
```vue
<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps(['data'])
const chartRef = ref(null)
let chartInstance = null

onMounted(() => {
  chartInstance = echarts.init(chartRef.value)
  updateChart()
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

function updateChart() {
  if (!props.data || !chartInstance) return

  const option = {
    radar: {
      indicator: props.data.domains.map((name, index) => ({
        name,
        max: props.data.maxScore
      }))
    },
    series: [{
      type: 'radar',
      data: [{
        value: props.data.scores,
        name: '我的能力'
      }]
    }]
  }

  chartInstance.setOption(option)
}
</script>
```

#### 2. `TShapeIndicator.vue`
T型指数指示器
```vue
<template>
  <div class="t-shape-indicator">
    <div class="index-value">{{ (index * 100).toFixed(1) }}</div>
    <el-progress
      :percentage="index * 100"
      :color="getColor(type)"
    />
    <div class="type-label">
      <el-tag :type="getTagType(type)">{{ typeTextMap[type] }}</el-tag>
    </div>
  </div>
</template>

<script setup>
defineProps(['index', 'type'])

const typeTextMap = {
  'T-shaped': 'T型人才',
  'I-shaped': 'I型人才',
  '破折号-shaped': '破折号型人才'
}

function getColor(type) {
  return type === 'T-shaped' ? '#67c23a' : type === 'I-shaped' ? '#e6a23c' : '#909399'
}

function getTagType(type) {
  return type === 'T-shaped' ? 'success' : type === 'I-shaped' ? 'warning' : 'info'
}
</script>

<style scoped>
.t-shape-indicator {
  text-align: center;
}

.index-value {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
}

.type-label {
  margin-top: 20px;
}
</style>
```

#### 3. `DomainScoreCard.vue`
领域得分卡片

#### 4. `RecommendationList.vue`
推荐列表

### AI 出题组件

#### 1. `GeneratedQuestionCard.vue`
AI生成的题目卡片
```vue
<template>
  <el-card class="generated-question-card">
    <template #header>
      <div class="card-header">
        <span>{{ question.title }}</span>
        <el-tag>质量得分: {{ question.qualityScore }}</el-tag>
      </div>
    </template>

    <div class="content">{{ question.content }}</div>

    <div class="options">
      <div v-for="opt in question.options" :key="opt.id" class="option">
        <strong>{{ opt.id }}.</strong> {{ opt.text }}
      </div>
    </div>

    <div class="explanation">
      <strong>答案解析:</strong> {{ question.explanation }}
    </div>

    <div class="quality-metrics">
      <el-progress :percentage="question.qualityMetrics.clarity * 10" text-inside>清晰度</el-progress>
      <el-progress :percentage="question.qualityMetrics.difficulty * 10" text-inside>难度匹配</el-progress>
      <el-progress :percentage="question.qualityMetrics.relevance * 10" text-inside>相关性</el-progress>
      <el-progress :percentage="question.qualityMetrics.completeness * 10" text-inside>完整性</el-progress>
    </div>
  </el-card>
</template>

<script setup>
defineProps(['question', 'index'])
</script>
```

#### 2. `QualityMetrics.vue`
质量指标展示

---

## 🔗 路由配置

需要在 `frontend/src/router/index.js` 中添加以下路由:

```javascript
// Phase 3.1: 社区贡献系统
{
  path: '/contributions',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: 'submit',
      name: 'SubmitQuestion',
      component: () => import('@/views/contributions/SubmitQuestion.vue'),
      meta: { title: '提交题目' }
    },
    {
      path: 'my-submissions',
      name: 'MySubmissions',
      component: () => import('@/views/contributions/MySubmissions.vue'),
      meta: { title: '我的提交' }
    },
    {
      path: 'submissions/:id',
      name: 'SubmissionDetail',
      component: () => import('@/views/contributions/SubmissionDetail.vue'),
      meta: { title: '提交详情' }
    },
    {
      path: 'review-queue',
      name: 'ReviewQueue',
      component: () => import('@/views/contributions/ReviewQueue.vue'),
      meta: { title: '审核队列' }
    },
    {
      path: 'profile/:userId',
      name: 'ContributorProfile',
      component: () => import('@/views/contributions/ContributorProfile.vue'),
      meta: { title: '贡献者资料' }
    },
    {
      path: 'leaderboard',
      name: 'ContributionLeaderboard',
      component: () => import('@/views/contributions/Leaderboard.vue'),
      meta: { title: '贡献排行榜' }
    }
  ]
},

// Phase 3.2: 跨专业能力分析
{
  path: '/ability',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: 'profile',
      name: 'AbilityProfile',
      component: () => import('@/views/ability/AbilityProfile.vue'),
      meta: { title: '能力画像' }
    },
    {
      path: 'leaderboard',
      name: 'TShapeLeaderboard',
      component: () => import('@/views/ability/TShapeLeaderboard.vue'),
      meta: { title: 'T型人才排行榜' }
    }
  ]
},

// Phase 3.3: AI 自动出题
{
  path: '/ai',
  component: () => import('@/layouts/MainLayout.vue'),
  children: [
    {
      path: 'generate',
      name: 'GenerateQuestions',
      component: () => import('@/views/ai/GenerateQuestions.vue'),
      meta: { title: 'AI生成题目' }
    },
    {
      path: 'history',
      name: 'GenerationHistory',
      component: () => import('@/views/ai/GenerationHistory.vue'),
      meta: { title: '生成历史' }
    },
    {
      path: 'review/:id',
      name: 'ReviewGenerated',
      component: () => import('@/views/ai/ReviewGenerated.vue'),
      meta: { title: '审核AI生成题目' }
    },
    {
      path: 'config',
      name: 'AIConfig',
      component: () => import('@/views/ai/AIConfig.vue'),
      meta: { title: 'AI配置' }
    }
  ]
}
```

---

## 📝 导航菜单更新

在主导航中添加 Phase 3 功能入口:

```vue
<!-- 在 MainLayout.vue 或导航组件中 -->
<el-menu-item index="/contributions/submit">
  <el-icon><Edit /></el-icon>
  <span>提交题目</span>
</el-menu-item>

<el-menu-item index="/contributions/my-submissions">
  <el-icon><Document /></el-icon>
  <span>我的提交</span>
</el-menu-item>

<el-menu-item index="/contributions/leaderboard">
  <el-icon><Trophy /></el-icon>
  <span>贡献排行榜</span>
</el-menu-item>

<el-menu-item index="/ability/profile">
  <el-icon><PieChart /></el-icon>
  <span>能力画像</span>
</el-menu-item>

<el-menu-item index="/ai/generate">
  <el-icon><MagicStick /></el-icon>
  <span>AI生成题目</span>
</el-menu-item>
```

---

## 🎨 样式建议

使用统一的设计语言:
- 卡片间距: 20px
- 圆角: 8px
- 主色调: #409eff (Element Plus 默认蓝)
- 成功色: #67c23a
- 警告色: #e6a23c
- 危险色: #f56c6c

---

## 📊 预计工作量

| 模块 | 页面数 | 组件数 | 预计工时 |
|------|--------|--------|----------|
| 社区贡献系统 | 6 | 3 | 2天 |
| 跨专业能力分析 | 2 | 4 | 1.5天 |
| AI 自动出题 | 4 | 2 | 1天 |
| 路由配置 | - | - | 0.5天 |
| **总计** | **12** | **9** | **5天** |

---

## ✅ 下一步行动

1. 创建剩余的页面文件
2. 创建必要的组件
3. 更新路由配置
4. 更新导航菜单
5. 测试所有功能
6. 优化样式和交互

---

**文档生成时间**: 2025-10-03
