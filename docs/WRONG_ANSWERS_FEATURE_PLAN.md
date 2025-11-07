# 错题集功能实现方案

## 一、功能概述

在 `/home` 页面集成错题集功能，连接 **AI 模拟面试** 和 **题库练习** 的错题数据，提供统一的错题管理和复习体验。

---

## 二、系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────┐
│          Home Page 首页                   │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ 错题集    │  │ 统计概览  │  │ 快速跳转│ │
│  │ 面板      │  │ 卡片      │  │ 菜单    │ │
│  └────┬─────┘  └────┬─────┘  └────┬───┘ │
│       │             │              │     │
└───────┼─────────────┼──────────────┼─────┘
        │             │              │
        ▼             ▼              ▼
   ┌─────────────────────────────────────┐
   │   Wrong Answers Service (错题服务)   │
   │                                      │
   │  • 数据聚合（AI + 题库）              │
   │  • 错题统计                          │
   │  • 错题分类                          │
   └────────────┬──────────────────────────┘
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
    ┌─────┐ ┌──────┐ ┌──────┐
    │ AI  │ │ 题库  │ │ 本地  │
    │ 接口 │ │ 接口 │ │ 存储  │
    └─────┘ └──────┘ └──────┘
```

### 2.2 核心模块

#### 2.2.1 前端组件层次

```
Home.vue (首页)
├── WrongAnswersOverview.vue (错题集概览)
│   ├── WrongAnswersStatistics.vue (统计信息)
│   │   ├── 总错题数
│   │   ├── 错题来源分布 (AI 面试 vs 题库)
│   │   ├── 错误知识点排行
│   │   └── 错题复习进度
│   ├── WrongAnswersList.vue (错题列表)
│   │   ├── 错题卡片 (支持展开/收起)
│   │   ├── 分类筛选 (来源、知识点、难度)
│   │   ├── 排序选项 (最新、最多错、未复习)
│   │   └── 分页/虚拟滚动
│   └── WrongAnswersActions.vue (快速操作)
│       ├── 复习计划跳转
│       ├── 相似题推荐
│       └── 导出/分享
```

---

## 三、数据模型设计

### 3.1 错题记录结构

```typescript
// 通用错题对象
interface WrongAnswerRecord {
  id: string;                    // 唯一标识
  source: 'ai_interview' | 'question_bank';  // 错题来源
  sourceId: string;              // 源 ID (AI 面试 ID 或题库题目 ID)

  // 题目信息
  questionId: string;
  questionContent: string;
  questionType: string;          // 单选、多选、简答等
  questionDifficulty: number;    // 1-5
  knowledgePoints: string[];     // 关联知识点

  // 用户答案
  userAnswer: string;
  correctAnswer: string;
  answerAnalysis: string;        // 解析

  // 错题统计
  wrongCount: number;            // 错误次数
  correctCount: number;          // 正确次数
  lastWrongTime: number;         // 最后错误时间戳
  createdTime: number;           // 首次记录时间戳

  // 用户标记
  tags: string[];                // 自定义标签
  notes: string;                 // 用户笔记
  reviewedStatus: 'unreviewed' | 'reviewing' | 'mastered';

  // 扩展信息
  metadata?: {
    aiSessionId?: string;        // AI 面试会话 ID
    examName?: string;           // 考试名称
    timeSpent?: number;          // 答题耗时 (毫秒)
  }
}

// AI 面试错题映射
interface AIInterviewWrongAnswer extends WrongAnswerRecord {
  source: 'ai_interview';
  metadata: {
    aiSessionId: string;
    aiSessionName: string;
    questionSequence: number;    // 该题在面试中的序号
  }
}

// 题库错题映射
interface QuestionBankWrongAnswer extends WrongAnswerRecord {
  source: 'question_bank';
  metadata: {
    bankId: string;
    chapterId: string;
    examType?: string;           // 模拟考、专项训练等
  }
}
```

### 3.2 统计数据结构

```typescript
interface WrongAnswersStatistics {
  totalWrongCount: number;              // 总错题数

  sourceDistribution: {
    aiInterview: number;                // AI 面试错题数
    questionBank: number;               // 题库错题数
  };

  difficultyDistribution: {
    [key: number]: number;              // 难度分布
  };

  topWrongKnowledgePoints: Array<{
    name: string;
    wrongCount: number;
    percentage: number;
  }>;

  reviewProgress: {
    unreviewed: number;
    reviewing: number;
    mastered: number;
  };

  mostWrongQuestions: WrongAnswerRecord[];  // Top 5 最常错的题目
}
```

---

## 四、后端 API 设计

### 4.1 API 端点

```
GET    /api/wrong-answers/statistics          # 获取错题统计
GET    /api/wrong-answers/list                # 获取错题列表 (支持分页、筛选、排序)
GET    /api/wrong-answers/:id                 # 获取单个错题详情
POST   /api/wrong-answers                     # 记录新错题
PUT    /api/wrong-answers/:id                 # 更新错题 (标签、笔记、复习状态)
DELETE /api/wrong-answers/:id                 # 删除错题记录

POST   /api/wrong-answers/:id/review          # 标记为已复习
POST   /api/wrong-answers/batch-review        # 批量标记为已复习

GET    /api/wrong-answers/export              # 导出错题列表
GET    /api/wrong-answers/recommendations    # 获取相似题推荐
```

### 4.2 API 请求/响应示例

```typescript
// 获取错题列表
GET /api/wrong-answers/list?page=1&pageSize=10&source=all&sortBy=lastWrongTime

Response: {
  code: 0,
  data: {
    total: 42,
    items: [
      {
        id: "wa_001",
        source: "ai_interview",
        questionContent: "什么是 RESTful API?",
        wrongCount: 3,
        lastWrongTime: 1697798400000,
        reviewedStatus: "unreviewed",
        // ... 其他字段
      }
    ]
  }
}

// 记录新错题
POST /api/wrong-answers
{
  source: "ai_interview",
  sourceId: "ai_session_123",
  questionId: "q_456",
  questionContent: "...",
  userAnswer: "...",
  correctAnswer: "...",
  metadata: {
    aiSessionId: "ai_session_123"
  }
}

Response: {
  code: 0,
  data: {
    id: "wa_001",
    // ... 返回完整错题记录
  }
}
```

---

## 五、前端实现方案

### 5.1 Composable 组织结构

```typescript
// composables/useWrongAnswers.ts
export function useWrongAnswers() {
  // 错题数据管理
  const wrongAnswers = ref<WrongAnswerRecord[]>([])
  const statistics = ref<WrongAnswersStatistics | null>(null)
  const loading = ref(false)

  // 筛选和排序
  const filters = reactive({
    source: 'all',           // all | ai_interview | question_bank
    difficulty: [],          // []表示所有难度
    knowledgePoint: '',
    reviewStatus: 'all',     // all | unreviewed | reviewing | mastered
    searchKeyword: ''
  })

  const sortBy = ref<'lastWrongTime' | 'wrongCount' | 'createdTime'>('lastWrongTime')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // 操作方法
  const fetchStatistics = async () => {}
  const fetchWrongAnswers = async (page: number, pageSize: number) => {}
  const addWrongAnswer = async (data: WrongAnswerRecord) => {}
  const updateWrongAnswer = async (id: string, updates: Partial<WrongAnswerRecord>) => {}
  const deleteWrongAnswer = async (id: string) => {}
  const reviewWrongAnswer = async (id: string) => {}
  const batchReviewWrongAnswers = async (ids: string[]) => {}

  // 计算属性
  const filteredWrongAnswers = computed(() => {
    return wrongAnswers.value.filter(wa => {
      // 应用所有筛选条件
    })
  })

  return {
    wrongAnswers,
    statistics,
    loading,
    filters,
    sortBy,
    sortOrder,
    filteredWrongAnswers,
    fetchStatistics,
    fetchWrongAnswers,
    // ... 其他方法
  }
}

// composables/useWrongAnswersIntegration.ts
export function useWrongAnswersIntegration() {
  // 集成 AI 面试和题库错题
  const aiWrongAnswers = ref<AIInterviewWrongAnswer[]>([])
  const questionBankWrongAnswers = ref<QuestionBankWrongAnswer[]>([])

  // 从 AI 面试获取错题
  const fetchAIInterviewWrongAnswers = async () => {
    // 调用 AI 面试历史 API，提取答错的题目
  }

  // 从题库获取错题
  const fetchQuestionBankWrongAnswers = async () => {
    // 调用题库练习记录 API，提取答错的题目
  }

  // 同步到统一的错题集
  const syncWrongAnswers = async () => {
    // 合并来自两个来源的错题，去重，统计
  }

  return {
    aiWrongAnswers,
    questionBankWrongAnswers,
    fetchAIInterviewWrongAnswers,
    fetchQuestionBankWrongAnswers,
    syncWrongAnswers
  }
}
```

### 5.2 Home 页面集成示例

```vue
<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <div class="home-header">
      <h1>学习中心</h1>
      <nav class="home-nav">
        <router-link to="/home">首页</router-link>
        <router-link to="/wrong-answers">错题集</router-link>
        <router-link to="/learning-paths">学习路径</router-link>
      </nav>
    </div>

    <!-- 主内容区 -->
    <div class="home-main">
      <!-- 错题集卡片区域 -->
      <section class="wrong-answers-section">
        <div class="section-header">
          <h2>📚 错题集</h2>
          <router-link to="/wrong-answers" class="view-all">
            查看全部 →
          </router-link>
        </div>

        <!-- 统计概览 -->
        <WrongAnswersStatistics
          v-if="statistics"
          :statistics="statistics"
          @refresh="handleRefreshStatistics"
        />

        <!-- 错题列表预览 -->
        <div class="wrong-answers-preview">
          <div class="list-header">
            <div class="filter-controls">
              <el-select v-model="filters.source" placeholder="错题来源">
                <el-option label="全部来源" value="all" />
                <el-option label="AI 面试" value="ai_interview" />
                <el-option label="题库练习" value="question_bank" />
              </el-select>

              <el-select v-model="sortBy" placeholder="排序方式">
                <el-option label="最新错误" value="lastWrongTime" />
                <el-option label="错误最多" value="wrongCount" />
                <el-option label="最早记录" value="createdTime" />
              </el-select>
            </div>
          </div>

          <!-- 错题卡片列表 -->
          <div v-if="wrongAnswersLoading" class="loading">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="filteredWrongAnswers.length === 0" class="empty">
            <el-empty description="还没有错题，继续加油！" />
          </div>
          <div v-else class="wrong-answers-cards">
            <WrongAnswerCard
              v-for="wrongAnswer in filteredWrongAnswers.slice(0, 5)"
              :key="wrongAnswer.id"
              :wrong-answer="wrongAnswer"
              @edit="handleEditWrongAnswer"
              @delete="handleDeleteWrongAnswer"
              @review="handleReviewWrongAnswer"
            />
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions">
          <el-button type="primary" @click="handleStartReview">
            开始复习
          </el-button>
          <el-button @click="handleViewAllWrongAnswers">
            查看全部错题
          </el-button>
          <el-button @click="handleExportWrongAnswers">
            导出错题
          </el-button>
        </div>
      </section>

      <!-- 其他首页内容 -->
      <section class="other-sections">
        <!-- 学习推荐 -->
        <!-- AI 面试快速链接 -->
        <!-- 题库快速链接 -->
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import WrongAnswersStatistics from '@/components/wrong-answers/WrongAnswersStatistics.vue'
import WrongAnswerCard from '@/components/wrong-answers/WrongAnswerCard.vue'
import { useWrongAnswers } from '@/composables/useWrongAnswers'

const router = useRouter()
const {
  statistics,
  filters,
  sortBy,
  wrongAnswers,
  loading: wrongAnswersLoading,
  filteredWrongAnswers,
  fetchStatistics,
  fetchWrongAnswers,
  deleteWrongAnswer,
  reviewWrongAnswer
} = useWrongAnswers()

onMounted(async () => {
  await fetchStatistics()
  await fetchWrongAnswers(1, 10)
})

// 事件处理
const handleRefreshStatistics = async () => {
  await fetchStatistics()
}

const handleEditWrongAnswer = (wrongAnswer) => {
  // 打开编辑对话框
}

const handleDeleteWrongAnswer = async (id: string) => {
  await deleteWrongAnswer(id)
  await fetchStatistics()
  await fetchWrongAnswers(1, 10)
}

const handleReviewWrongAnswer = async (id: string) => {
  await reviewWrongAnswer(id)
  await fetchStatistics()
}

const handleStartReview = () => {
  router.push('/wrong-answers/review')
}

const handleViewAllWrongAnswers = () => {
  router.push('/wrong-answers')
}

const handleExportWrongAnswers = async () => {
  // 导出为 PDF 或 Excel
}
</script>

<style scoped lang="scss">
.home-page {
  padding: 24px;
  background: #f5f7fa;
}

.wrong-answers-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #243058;
    }

    .view-all {
      color: #5c6af0;
      text-decoration: none;
      transition: color 0.3s;

      &:hover {
        color: #3a42c0;
      }
    }
  }
}

.wrong-answers-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
```

---

## 六、关键集成点

### 6.1 与 AI 面试的集成

```typescript
// services/aiInterviewWrongAnswersIntegration.ts
export class AIInterviewWrongAnswersIntegration {
  /**
   * 从 AI 面试历史中提取错题
   */
  static async extractWrongAnswersFromAISession(sessionId: string) {
    // 1. 获取 AI 面试会话数据
    const session = await getAIInterviewSession(sessionId)

    // 2. 遍历所有答题记录
    const wrongAnswers: AIInterviewWrongAnswer[] = []

    session.questions.forEach((q, index) => {
      if (!q.isCorrect) {
        wrongAnswers.push({
          id: `wa_ai_${sessionId}_${q.id}`,
          source: 'ai_interview',
          sourceId: sessionId,
          questionId: q.id,
          questionContent: q.content,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          answerAnalysis: q.analysis,
          wrongCount: 1,
          correctCount: 0,
          lastWrongTime: Date.now(),
          createdTime: Date.now(),
          tags: ['AI 面试'],
          notes: '',
          reviewedStatus: 'unreviewed',
          metadata: {
            aiSessionId: sessionId,
            aiSessionName: session.name,
            questionSequence: index + 1
          }
        })
      }
    })

    // 3. 保存到后端
    return await Promise.all(
      wrongAnswers.map(wa => saveWrongAnswer(wa))
    )
  }

  /**
   * 监听 AI 面试完成事件，自动记录错题
   */
  static setupAutoRecording() {
    // 订阅 AI 面试完成事件
    EventBus.on('ai-interview-completed', async (sessionData) => {
      await this.extractWrongAnswersFromAISession(sessionData.sessionId)
    })
  }
}
```

### 6.2 与题库练习的集成

```typescript
// services/questionBankWrongAnswersIntegration.ts
export class QuestionBankWrongAnswersIntegration {
  /**
   * 从题库练习历史中提取错题
   */
  static async extractWrongAnswersFromPractice(practiceId: string) {
    const practice = await getQuestionBankPractice(practiceId)

    const wrongAnswers: QuestionBankWrongAnswer[] = []

    practice.answers.forEach((answer) => {
      if (!answer.isCorrect) {
        wrongAnswers.push({
          id: `wa_qb_${practiceId}_${answer.questionId}`,
          source: 'question_bank',
          sourceId: answer.questionId,
          questionId: answer.questionId,
          questionContent: answer.question.content,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.question.answer,
          answerAnalysis: answer.question.analysis,
          wrongCount: 1,
          correctCount: 0,
          lastWrongTime: Date.now(),
          createdTime: Date.now(),
          tags: ['题库练习'],
          notes: '',
          reviewedStatus: 'unreviewed',
          metadata: {
            bankId: practice.bankId,
            chapterId: answer.question.chapterId,
            examType: practice.examType
          }
        })
      }
    })

    return await Promise.all(
      wrongAnswers.map(wa => saveWrongAnswer(wa))
    )
  }

  /**
   * 监听练习完成事件
   */
  static setupAutoRecording() {
    EventBus.on('practice-completed', async (practiceData) => {
      await this.extractWrongAnswersFromPractice(practiceData.practiceId)
    })
  }
}
```

---

## 七、实现优先级

### Phase 1: 基础功能 (第 1-2 周)
- [ ] 后端: 错题集 CRUD API
- [ ] 前端: Home 页面错题集统计卡片
- [ ] 前端: 基础错题列表组件
- [ ] 集成: AI 面试错题自动记录

### Phase 2: 增强功能 (第 3-4 周)
- [ ] 前端: 完整的错题详情页面
- [ ] 前端: 筛选、排序、搜索功能
- [ ] 集成: 题库练习错题自动记录
- [ ] 功能: 错题复习计划

### Phase 3: 高级功能 (第 5-6 周)
- [ ] 功能: 相似题推荐引擎
- [ ] 功能: 错题分析报告
- [ ] 功能: 错题导出 (PDF/Excel)
- [ ] 功能: 错题分享和讨论

---

## 八、技术栈建议

| 层级 | 技术 | 用途 |
|------|------|------|
| **前端** | Vue 3 + TypeScript | UI 框架 |
| | Element Plus | 组件库 |
| | Pinia | 状态管理 |
| | VueUse | 工具 |
| **后端** | Spring Boot | 应用框架 |
| | Spring Data JPA | ORM |
| | MySQL | 主数据库 |
| | Redis | 缓存 |
| **部署** | Docker | 容器化 |
| | Nginx | 反向代理 |
| | GitHub Actions | CI/CD |

---

## 九、性能优化建议

1. **虚拟滚动**: 错题列表超过 100 条时使用虚拟滚动
2. **缓存策略**: Redis 缓存热点统计数据
3. **懒加载**: 错题详情按需加载
4. **分页**: 后端分页，避免一次加载过多数据
5. **搜索优化**: 使用全文搜索索引加快查询速度

---

## 十、参考资源

- [Vue 3 官方文档](https://v3.vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [错题集最佳实践](D:\code7\test3\7.txt)
