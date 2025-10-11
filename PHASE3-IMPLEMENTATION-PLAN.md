# 🚀 Phase 3 高级功能实施计划

## 📋 Phase 3 概览

**目标**: 实现社区贡献、跨专业能力分析和 AI 自动出题三大高级功能

**预估工时**: 8天

**优先级**:
1. 🔥 高优先级: 社区贡献系统
2. 🔶 中优先级: 跨专业能力分析
3. 🔷 低优先级: AI 自动出题

---

## 🎯 Phase 3.1: 社区贡献系统

### 功能目标

让用户参与内容创作，通过专家审核机制保证质量，并建立贡献者激励体系。

### 核心功能

1. **用户提交题目**
   - 表单界面提交题目
   - 自动填充专业字段
   - 提交后进入待审核状态

2. **专家审核流程**
   - 审核队列管理
   - 批量审核操作
   - 审核意见反馈
   - 通过/拒绝/需修改

3. **贡献者激励**
   - 积分系统 (提交+1, 通过+10)
   - 徽章系统 (新手贡献者、优质贡献者、专家)
   - 贡献排行榜
   - 贡献者主页

### 数据模型设计

#### QuestionSubmission (题目提交)
```javascript
{
  id: 1,
  questionId: null,  // 审核通过后关联到 Question
  contributorId: 100,
  domainId: 1,
  categoryId: 1,

  // 题目内容
  title: '实现一个 LRU 缓存',
  content: '...',
  difficulty: 'medium',
  tags: ['算法', '缓存'],
  hints: ['考虑使用哈希表和双向链表'],
  metadata: {
    languageRestrictions: ['JavaScript', 'Python'],
    timeComplexity: 'O(1)'
  },

  // 选项和答案
  options: [
    { id: 'A', text: '选项A' },
    { id: 'B', text: '选项B' },
    { id: 'C', text: '选项C' },
    { id: 'D', text: '选项D' }
  ],
  correctAnswer: 'A',
  explanation: '详细解析...',

  // 审核状态
  status: 'pending',  // pending | under_review | approved | rejected | needs_revision
  submittedAt: '2025-10-03T10:00:00Z',
  reviewedAt: null,
  reviewerId: null,
  reviewComment: '',

  // 修订历史
  revisionCount: 0,
  previousVersions: []
}
```

#### ContributorProfile (贡献者资料)
```javascript
{
  userId: 100,

  // 贡献统计
  stats: {
    totalSubmissions: 25,
    approvedCount: 18,
    rejectedCount: 3,
    pendingCount: 4,
    approvalRate: 0.72,  // 72%
    totalPoints: 185,
    rank: 12
  },

  // 徽章
  badges: [
    {
      id: 'first_contribution',
      name: '首次贡献',
      icon: '🌟',
      earnedAt: '2025-09-01T...'
    },
    {
      id: 'quality_contributor',
      name: '优质贡献者',
      icon: '⭐',
      earnedAt: '2025-09-15T...',
      description: '审核通过率达到70%以上'
    }
  ],

  // 专长领域
  expertise: [
    {
      domainId: 1,
      domainName: '计算机科学',
      contributionCount: 15,
      approvalRate: 0.80
    }
  ]
}
```

#### ReviewQueue (审核队列)
```javascript
{
  id: 1,
  submissionId: 1,
  reviewerId: 200,
  assignedAt: '2025-10-03T11:00:00Z',
  status: 'in_progress',  // pending | in_progress | completed
  priority: 'normal'  // low | normal | high
}
```

### API 端点设计

#### 题目提交相关

```javascript
// 1. 提交题目
POST /api/contributions/submit
Request:
{
  domainId: 1,
  categoryId: 1,
  title: '...',
  content: '...',
  // ... 其他字段
}
Response:
{
  success: true,
  data: {
    id: 1,
    status: 'pending',
    submittedAt: '...'
  }
}

// 2. 获取我的提交列表
GET /api/contributions/my-submissions?status=pending&page=1&limit=10
Response:
{
  success: true,
  data: {
    items: [...],
    total: 25,
    page: 1,
    pageSize: 10
  }
}

// 3. 获取提交详情
GET /api/contributions/submissions/:id
Response:
{
  success: true,
  data: {
    id: 1,
    // ... 完整提交信息
  }
}

// 4. 修订题目
PUT /api/contributions/submissions/:id
Request:
{
  title: '修改后的标题',
  // ... 其他修改字段
}
Response:
{
  success: true,
  data: {
    id: 1,
    revisionCount: 1
  }
}
```

#### 审核相关

```javascript
// 5. 获取待审核队列
GET /api/contributions/review-queue?status=pending&page=1
Response:
{
  success: true,
  data: {
    items: [
      {
        id: 1,
        submission: { /* 提交详情 */ },
        contributor: { /* 贡献者信息 */ }
      }
    ],
    total: 15
  }
}

// 6. 领取审核任务
POST /api/contributions/review-queue/:submissionId/claim
Response:
{
  success: true,
  data: {
    queueId: 1,
    assignedAt: '...'
  }
}

// 7. 提交审核结果
POST /api/contributions/submissions/:id/review
Request:
{
  action: 'approve',  // approve | reject | request_revision
  comment: '题目质量很高，建议通过',
  suggestions: ['建议增加一个提示']
}
Response:
{
  success: true,
  data: {
    submissionId: 1,
    newStatus: 'approved',
    questionId: 101  // 如果通过，返回新创建的题目ID
  }
}
```

#### 贡献者相关

```javascript
// 8. 获取贡献者资料
GET /api/contributions/profile/:userId
Response:
{
  success: true,
  data: {
    userId: 100,
    stats: { /* 统计数据 */ },
    badges: [ /* 徽章列表 */ ],
    expertise: [ /* 专长领域 */ ]
  }
}

// 9. 获取贡献排行榜
GET /api/contributions/leaderboard?timeRange=month&limit=20
Response:
{
  success: true,
  data: {
    items: [
      {
        rank: 1,
        userId: 100,
        username: 'Alice',
        avatar: '...',
        totalPoints: 350,
        approvedCount: 30
      }
    ]
  }
}

// 10. 获取徽章列表
GET /api/contributions/badges
Response:
{
  success: true,
  data: {
    items: [
      {
        id: 'first_contribution',
        name: '首次贡献',
        icon: '🌟',
        description: '提交第一道题目',
        requirement: 'totalSubmissions >= 1'
      }
    ]
  }
}
```

### 前端实现

#### 页面结构

```
contributions/
├── ContributionSubmit.vue          # 提交题目页面
├── MyContributions.vue             # 我的提交列表
├── ContributionDetail.vue          # 提交详情页面
├── ReviewQueue.vue                 # 审核队列 (管理员/专家)
├── ReviewDetail.vue                # 审核详情页面
├── ContributorProfile.vue          # 贡献者主页
└── Leaderboard.vue                 # 贡献排行榜
```

#### Store

```javascript
// stores/contribution.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as contributionApi from '@/api/contribution'

export const useContributionStore = defineStore('contribution', () => {
  const mySubmissions = ref([])
  const reviewQueue = ref([])
  const leaderboard = ref([])
  const profile = ref(null)
  const loading = ref(false)

  // 提交题目
  async function submitQuestion(data) {
    loading.value = true
    try {
      const response = await contributionApi.submitQuestion(data)
      return response.data
    } finally {
      loading.value = false
    }
  }

  // 获取我的提交
  async function fetchMySubmissions(params = {}) {
    loading.value = true
    try {
      const response = await contributionApi.getMySubmissions(params)
      mySubmissions.value = response.data.items
    } finally {
      loading.value = false
    }
  }

  // 获取审核队列
  async function fetchReviewQueue(params = {}) {
    loading.value = true
    try {
      const response = await contributionApi.getReviewQueue(params)
      reviewQueue.value = response.data.items
    } finally {
      loading.value = false
    }
  }

  // 审核提交
  async function reviewSubmission(submissionId, data) {
    const response = await contributionApi.reviewSubmission(submissionId, data)
    return response.data
  }

  // 获取排行榜
  async function fetchLeaderboard(params = {}) {
    loading.value = true
    try {
      const response = await contributionApi.getLeaderboard(params)
      leaderboard.value = response.data.items
    } finally {
      loading.value = false
    }
  }

  // 获取贡献者资料
  async function fetchProfile(userId) {
    loading.value = true
    try {
      const response = await contributionApi.getContributorProfile(userId)
      profile.value = response.data
    } finally {
      loading.value = false
    }
  }

  return {
    mySubmissions,
    reviewQueue,
    leaderboard,
    profile,
    loading,
    submitQuestion,
    fetchMySubmissions,
    fetchReviewQueue,
    reviewSubmission,
    fetchLeaderboard,
    fetchProfile
  }
})
```

---

## 🎯 Phase 3.2: 跨专业能力分析

### 功能目标

识别 T 型人才，提供跨专业能力分析和个性化学习建议。

### 核心功能

1. **T 型人才识别**
   - 主攻领域深度分析
   - 跨领域广度统计
   - T 型指数计算

2. **技能雷达图**
   - 5维雷达图 (5个领域)
   - 每个领域的得分
   - 可视化展示

3. **能力提升建议**
   - 弱项领域推荐学习路径
   - 跨专业题目推荐
   - 个性化学习计划

### 数据模型设计

#### UserAbilityProfile (用户能力画像)
```javascript
{
  userId: 1,

  // 主攻领域
  primaryDomain: {
    domainId: 1,
    domainName: '计算机科学',
    score: 850,  // 总分
    level: 'advanced',  // beginner | intermediate | advanced | expert
    percentile: 0.85  // 超过85%的用户
  },

  // 各领域得分
  domainScores: {
    1: {  // 计算机科学
      domainId: 1,
      domainName: '计算机科学',
      totalScore: 850,
      questionsAttempted: 120,
      questionsCorrect: 95,
      accuracy: 0.79,
      level: 'advanced'
    },
    2: {  // 金融学
      domainId: 2,
      domainName: '金融学',
      totalScore: 320,
      questionsAttempted: 45,
      questionsCorrect: 28,
      accuracy: 0.62,
      level: 'intermediate'
    },
    3: {  // 医学
      domainId: 3,
      domainName: '医学',
      totalScore: 150,
      questionsAttempted: 20,
      questionsCorrect: 12,
      accuracy: 0.60,
      level: 'beginner'
    },
    4: {  // 法律
      domainId: 4,
      domainName: '法律',
      totalScore: 200,
      questionsAttempted: 28,
      questionsCorrect: 18,
      accuracy: 0.64,
      level: 'beginner'
    },
    5: {  // 管理学
      domainId: 5,
      domainName: '管理学',
      totalScore: 280,
      questionsAttempted: 35,
      questionsCorrect: 22,
      accuracy: 0.63,
      level: 'intermediate'
    }
  },

  // T型人才分析
  tShapeAnalysis: {
    index: 0.73,  // T型指数 (0-1)
    type: 'T-shaped',  // I-shaped | T-shaped | Pi-shaped | Comb-shaped
    depthScore: 850,  // 深度分数 (主攻领域)
    breadthScore: 950,  // 广度分数 (其他领域总和)
    balance: 0.89,  // 平衡度

    strengths: [
      {
        domainId: 1,
        domainName: '计算机科学',
        reason: '主攻领域，得分850，超过85%的用户'
      }
    ],

    weaknesses: [
      {
        domainId: 3,
        domainName: '医学',
        reason: '入门级别，建议加强学习'
      }
    ]
  },

  // 学习建议
  recommendations: [
    {
      type: 'strengthen_depth',
      domainId: 1,
      domainName: '计算机科学',
      suggestion: '继续深化专业知识，推荐学习高级算法',
      learningPaths: [1],  // 推荐学习路径ID
      priority: 'high'
    },
    {
      type: 'broaden_breadth',
      domainId: 3,
      domainName: '医学',
      suggestion: '拓展医学领域知识，提升T型人才广度',
      learningPaths: [],
      priority: 'medium'
    }
  ],

  // 更新时间
  lastUpdated: '2025-10-03T10:00:00Z'
}
```

### API 端点设计

```javascript
// 1. 获取用户能力画像
GET /api/ability/profile/:userId
Response:
{
  success: true,
  data: {
    userId: 1,
    primaryDomain: { /* ... */ },
    domainScores: { /* ... */ },
    tShapeAnalysis: { /* ... */ },
    recommendations: [ /* ... */ ]
  }
}

// 2. 获取雷达图数据
GET /api/ability/radar/:userId
Response:
{
  success: true,
  data: {
    domains: ['计算机科学', '金融学', '医学', '法律', '管理学'],
    scores: [850, 320, 150, 200, 280],
    maxScore: 1000,
    percentiles: [0.85, 0.45, 0.25, 0.30, 0.40]
  }
}

// 3. 获取 T 型指数排行
GET /api/ability/t-shape-leaderboard?limit=20
Response:
{
  success: true,
  data: {
    items: [
      {
        rank: 1,
        userId: 1,
        username: 'Alice',
        tShapeIndex: 0.89,
        primaryDomain: '计算机科学',
        depthScore: 920,
        breadthScore: 1100
      }
    ]
  }
}

// 4. 获取跨专业推荐
GET /api/ability/cross-domain-recommendations/:userId
Response:
{
  success: true,
  data: {
    questions: [ /* 推荐的跨专业题目 */ ],
    learningPaths: [ /* 推荐的学习路径 */ ]
  }
}
```

### 前端实现

#### 页面结构

```
ability/
├── AbilityProfile.vue              # 能力画像页面
├── RadarChart.vue                  # 雷达图组件
├── TShapeAnalysis.vue              # T型分析页面
├── Recommendations.vue             # 学习建议页面
└── TShapeLeaderboard.vue          # T型人才排行榜
```

#### ECharts 雷达图实现

```vue
<template>
  <div class="radar-chart" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

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
  const option = {
    title: {
      text: '跨专业能力雷达图'
    },
    tooltip: {},
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

---

## 🎯 Phase 3.3: AI 自动出题

### 功能目标

利用大语言模型 (LLM) 自动生成高质量题目，提升题库建设效率。

### 核心功能

1. **LLM API 集成**
   - 支持 OpenAI GPT-4
   - 支持 Anthropic Claude
   - 可配置 API Key

2. **智能生成**
   - 基于领域和难度生成
   - 结合 metadata 字段配置
   - 生成题目 + 选项 + 解析

3. **质量保障**
   - AI 质量评分 (1-10)
   - 人工审核流程
   - 反馈循环优化

### 数据模型设计

#### AIGeneratedQuestion (AI生成题目)
```javascript
{
  id: 1,

  // 生成参数
  promptConfig: {
    domainId: 1,
    domainName: '计算机科学',
    categoryId: 1,
    difficulty: 'medium',
    metadata: {
      languageRestrictions: ['JavaScript'],
      timeComplexity: 'O(n)'
    },
    count: 5,  // 生成数量
    temperature: 0.7,  // LLM 温度参数
    model: 'gpt-4'  // 使用的模型
  },

  // 生成结果
  generatedQuestions: [
    {
      title: '实现数组去重',
      content: '请实现一个函数，对给定数组进行去重...',
      options: [
        { id: 'A', text: '使用 Set' },
        { id: 'B', text: '使用 filter' },
        { id: 'C', text: '使用 reduce' },
        { id: 'D', text: '以上都可以' }
      ],
      correctAnswer: 'D',
      explanation: 'JavaScript 中有多种数组去重方法...',

      // AI 质量评分
      qualityScore: 8.5,
      qualityMetrics: {
        clarity: 9,  // 清晰度
        difficulty: 8,  // 难度匹配
        relevance: 9,  // 相关性
        completeness: 8  // 完整性
      }
    }
  ],

  // 生成信息
  generatedAt: '2025-10-03T10:00:00Z',
  generatedBy: 'gpt-4',
  tokensUsed: 1500,
  cost: 0.045,  // 成本(美元)

  // 审核状态
  status: 'pending',  // pending | approved | rejected
  approvedQuestions: [],  // 已通过的题目ID
  rejectedQuestions: []  // 已拒绝的题目索引
}
```

### API 端点设计

```javascript
// 1. 生成题目
POST /api/ai/generate-questions
Request:
{
  domainId: 1,
  categoryId: 1,
  difficulty: 'medium',
  metadata: {
    languageRestrictions: ['JavaScript'],
    timeComplexity: 'O(n)'
  },
  count: 5,
  model: 'gpt-4',  // 可选: gpt-4 | claude-3-opus
  temperature: 0.7
}
Response:
{
  success: true,
  data: {
    id: 1,
    generatedQuestions: [ /* ... */ ],
    tokensUsed: 1500,
    cost: 0.045
  }
}

// 2. 获取生成历史
GET /api/ai/generation-history?page=1&limit=10
Response:
{
  success: true,
  data: {
    items: [ /* 生成记录 */ ],
    total: 25
  }
}

// 3. 审核AI生成的题目
POST /api/ai/generated-questions/:id/review
Request:
{
  approvedIndices: [0, 2, 4],  // 通过的题目索引
  rejectedIndices: [1, 3]  // 拒绝的题目索引
}
Response:
{
  success: true,
  data: {
    approvedQuestions: [101, 102, 103],  // 新创建的题目ID
    approvedCount: 3,
    rejectedCount: 2
  }
}

// 4. 配置 API Key
POST /api/ai/config
Request:
{
  provider: 'openai',  // openai | anthropic
  apiKey: 'sk-...',
  enabled: true
}
Response:
{
  success: true,
  message: 'API配置已更新'
}
```

### LLM Prompt 设计

```javascript
// 题目生成 Prompt 模板
function buildPrompt(config) {
  const { domainName, difficulty, metadata, count } = config

  return `你是一个专业的${domainName}题目出题专家。

请生成 ${count} 道${difficultyMap[difficulty]}难度的选择题。

要求：
1. 题目必须与${domainName}领域相关
2. 难度: ${difficulty}
3. 每道题目包含:
   - 清晰的题目标题和描述
   - 4个选项 (A/B/C/D)
   - 正确答案
   - 详细的解析说明

${metadata ? `
4. 专业要求:
${Object.entries(metadata).map(([key, value]) =>
  `   - ${key}: ${Array.isArray(value) ? value.join(', ') : value}`
).join('\n')}
` : ''}

请以 JSON 格式返回，格式如下:
[
  {
    "title": "题目标题",
    "content": "题目描述",
    "options": [
      {"id": "A", "text": "选项A"},
      {"id": "B", "text": "选项B"},
      {"id": "C", "text": "选项C"},
      {"id": "D", "text": "选项D"}
    ],
    "correctAnswer": "A",
    "explanation": "详细解析"
  }
]`
}
```

### 前端实现

#### 页面结构

```
ai/
├── AIQuestionGenerator.vue         # AI 生成题目页面
├── GenerationHistory.vue           # 生成历史
├── AIQuestionReview.vue            # AI 题目审核
└── AIConfig.vue                    # API 配置页面
```

---

## 📅 实施时间表

| 阶段 | 任务 | 预估工时 | 开始日期 | 完成日期 |
|------|------|---------|---------|---------|
| **Phase 3.1** | 社区贡献系统 | 3天 | Day 1 | Day 3 |
| 3.1.1 | 数据模型 + API | 1天 | Day 1 | Day 1 |
| 3.1.2 | 前端页面 | 1.5天 | Day 2 | Day 2.5 |
| 3.1.3 | 测试 + 文档 | 0.5天 | Day 2.5 | Day 3 |
| **Phase 3.2** | 跨专业能力分析 | 2天 | Day 4 | Day 5 |
| 3.2.1 | 数据模型 + API | 0.5天 | Day 4 | Day 4.5 |
| 3.2.2 | 雷达图组件 | 0.5天 | Day 4.5 | Day 5 |
| 3.2.3 | 前端页面 | 0.5天 | Day 5 | Day 5.5 |
| 3.2.4 | 测试 + 文档 | 0.5天 | Day 5.5 | Day 6 |
| **Phase 3.3** | AI 自动出题 | 2天 | Day 6 | Day 8 |
| 3.3.1 | LLM 集成 + API | 1天 | Day 6 | Day 7 |
| 3.3.2 | 前端页面 | 0.5天 | Day 7 | Day 7.5 |
| 3.3.3 | 测试 + 文档 | 0.5天 | Day 7.5 | Day 8 |

**总预估工时**: 8天

---

## 🎯 成功标准

### Phase 3.1: 社区贡献系统
- ✅ 用户可以提交题目
- ✅ 管理员可以审核题目
- ✅ 积分和徽章系统正常工作
- ✅ 排行榜正确显示
- ✅ 所有API测试通过

### Phase 3.2: 跨专业能力分析
- ✅ 能力画像正确计算
- ✅ T型指数准确
- ✅ 雷达图正确渲染
- ✅ 学习建议合理
- ✅ 所有API测试通过

### Phase 3.3: AI 自动出题
- ✅ LLM API集成成功
- ✅ 能够生成高质量题目
- ✅ 质量评分机制工作
- ✅ 审核流程完整
- ✅ 所有API测试通过

---

## 📝 下一步行动

1. ✅ Phase 3 规划完成
2. ⏭️ 开始实施 Phase 3.1 社区贡献系统
3. ⏭️ 实施 Phase 3.2 跨专业能力分析
4. ⏭️ 实施 Phase 3.3 AI 自动出题
5. ⏭️ 集成测试
6. ⏭️ 文档编写
7. ⏭️ v3.0 发布

---

**Phase 3 实施计划版本**: v1.0
**创建日期**: 2025-10-03
**预计完成日期**: 2025-10-11

🚀 让我们开始 Phase 3 的实施！
