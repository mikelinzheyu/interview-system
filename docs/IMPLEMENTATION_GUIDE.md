# 错题集功能实现 - 完整指南

## 已完成的工作

### 1. 最佳实践文档 ✓
- 文件: `WRONG_ANSWERS_BEST_PRACTICES.md`
- 包含: 架构设计、算法说明、实现指南

### 2. 核心服务库

#### ✓ spacedRepetitionService.js
- **SM-2 算法实现**
  - 间隔计算: easy (×2.6) | normal (×1.3) | hard (×1.0)
  - 优先级计算: 综合考虑逾期天数、错误数、难度
  - 掌握度评分: correct_count / total_reviews
  - 状态判断: mastered (≥85%) | reviewing (60-85%) | unreveiwed (<60%)

- **核心功能**
  ```javascript
  calculateNextReviewDate()     // 计算下次复习日期
  calculateIntervalDays()       // 计算间隔天数
  calculatePriority()           // 计算优先级分数
  calculateMasteryScore()       // 计算掌握度
  needsReviewToday()            // 是否今日需复习
  generateStatistics()          // 生成统计数据
  sortByPriority()              // 按优先级排序
  getRecommendedDailyCount()    // 建议每日复习数
  ```

#### ✓ aiAnalysisService.js
- **AI驱动分析**
  - analyzeWrongAnswer()        // Dify API分析错题
  - generatePersonalizedHints()  // 生成个性化提示
  - getLearningInsights()        // 获取学习洞察
  - generateAIReviewPlan()       // 生成AI复习计划

#### ✓ reviewPlanService.js
- **复习计划管理**
  - generateReviewPlan()        // 生成个性化复习计划
  - calculateReviewSchedule()   // 计算复习时间表
  - getTodayTasks()             // 获取今日任务
  - getUpcomingTasks()          // 获取即将任务
  - getPlanProgress()           // 获取计划进度
  - suggestAdjustments()        // 建议调整计划

### 3. 已有组件
- WrongAnswersPage.vue (列表页)
- WrongAnswersWebSocket.js (WebSocket支持)
- wrongAnswers.js (Pinia状态管理)
- WrongAnswerController.java (后端API)

## 待完成的工作

### 1. 增强前端组件

#### ReviewMode.vue (需增强)
- 添加计时器显示
- 添加侧边栏 (提示、资源、统计)
- 优化答案显示
- 集成AI分析

#### AnalyticsDashboard.vue (NEW)
需要创建新页面，包含:
- 掌握度趋势曲线
- 每日活动热力图
- 题目难度分布
- 学习效率分析

#### WrongAnswerDetail.vue (需增强)
- 显示详细分析
- 相关题目推荐
- 学习资源推荐

### 2. 后端服务

#### SpacedRepetitionService (Java)
需要在后端实现:
```java
calculateNextReviewTime()
calculatePriority()
generateStatistics()
```

#### AIAnalysisService (Java)
- 集成Dify API
- 错题分析
- 提示生成

#### ReviewPlanService (Java)
- 复习计划生成
- 任务分配
- 进度跟踪

### 3. 数据库优化

#### 索引优化
```sql
CREATE INDEX idx_user_status ON wrong_answer_record(user_id, review_status);
CREATE INDEX idx_next_review ON wrong_answer_record(user_id, next_review_time);
CREATE INDEX idx_priority ON wrong_answer_record(user_id, review_priority);
```

#### 新表
- review_plans (复习计划)
- review_sessions (复习会话)
- review_analytics (分析数据)

### 4. API端点

#### 需添加
```
POST   /wrong-answers/analyze                  // AI分析
POST   /wrong-answers/generate-hints           // 生成提示
POST   /wrong-answers/learning-insights        // 学习洞察
POST   /wrong-answers/generate-ai-plan         // AI计划
GET    /review-plans/current                   // 获取当前计划
POST   /review-plans                           // 保存计划
GET    /review-plans/{id}/progress             // 计划进度
GET    /analytics/dashboard                    // 分析仪表板
```

## 快速启动指南

### 第1步: 在错题列表页增强显示

编辑 `frontend/src/views/chat/WrongAnswersPage.vue`:

```vue
<script setup>
import SpacedRepetitionService from '@/services/spacedRepetitionService'

// 增强统计显示
const enhancedStats = computed(() => {
  const stats = SpacedRepetitionService.generateStatistics(wrongAnswers.value)
  return {
    ...stats,
    overduePercentage: Math.round((stats.overdueCount / stats.total) * 100)
  }
})

// 优先级排序
const sortByPriority = () => {
  wrongAnswers.value = SpacedRepetitionService.sortByPriority(wrongAnswers.value)
}
</script>
```

### 第2步: 增强复习模式

编辑 `frontend/src/views/chat/ReviewMode.vue`:

```vue
<script setup>
import SpacedRepetitionService from '@/services/spacedRepetitionService'
import AIAnalysisService from '@/services/aiAnalysisService'

// 提交答案后更新
const submitAnswer = async () => {
  // ... 现有逻辑

  // 新增: 计算下次复习时间
  const nextReviewDate = SpacedRepetitionService.calculateNextReviewDate(
    currentQuestion.value,
    difficulty
  )

  // 新增: 获取AI提示
  const hints = await AIAnalysisService.generatePersonalizedHints([currentQuestion.value])
}
</script>
```

### 第3步: 创建分析仪表板

创建 `frontend/src/views/chat/AnalyticsDashboard.vue`:

```vue
<template>
  <div class="analytics-dashboard">
    <!-- 掌握度趋势 -->
    <div class="chart-card">
      <div class="chart" id="masteryTrend"></div>
    </div>

    <!-- 每日活动热力图 -->
    <div class="chart-card">
      <div class="chart" id="activityHeatmap"></div>
    </div>

    <!-- 难度分布 -->
    <div class="chart-card">
      <div class="chart" id="difficultyDist"></div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'

// 初始化图表
onMounted(() => {
  initMasteryTrendChart()
  initActivityHeatmap()
  initDifficultyChart()
})
</script>
```

## 优化建议

### 前端优化
1. **虚拟列表** - 超过500条数据时
   ```vue
   <virtual-list :data-items="filteredAnswers" />
   ```

2. **缓存策略** - 使用IndexedDB存储
   ```javascript
   // 离线访问支持
   const db = new Dexie('InterviewDB')
   db.wrongAnswers.bulkPut(wrongAnswers)
   ```

3. **预加载** - 网络空闲时加载下页
   ```javascript
   if ('requestIdleCallback' in window) {
     requestIdleCallback(() => preloadNextPage())
   }
   ```

### 后端优化
1. **数据库分区** - 按用户和时间分区
2. **缓存层** - Redis缓存统计数据
3. **异步处理** - 使用消息队列处理分析任务

## 测试清单

- [ ] 单元测试: SpacedRepetitionService
- [ ] 集成测试: 错题记录 → 复习 → 统计
- [ ] 性能测试: 1000+ 错题加载 < 2s
- [ ] 用户测试: 复习界面易用性

## 下一步行动

1. **立即** (今天完成)
   - ✓ 创建spacedRepetitionService.js
   - ✓ 创建aiAnalysisService.js
   - ✓ 创建reviewPlanService.js
   - [ ] 增强WrongAnswersPage.vue

2. **本周** (1-2天)
   - [ ] 增强ReviewMode.vue
   - [ ] 创建AnalyticsDashboard.vue
   - [ ] 后端实现SpacedRepetitionService
   - [ ] 数据库索引优化

3. **本月** (1-2周)
   - [ ] 后端实现AIAnalysisService
   - [ ] Dify API集成
   - [ ] 性能测试和优化
   - [ ] 用户体验测试

## 代码示例

### 使用SpacedRepetitionService

```javascript
import SpacedRepetitionService from '@/services/spacedRepetitionService'

// 获取待复习列表
const dueQuestions = SpacedRepetitionService.getDueForReview(
  allWrongAnswers,
  new Date()
)

// 计算优先级并排序
const sorted = SpacedRepetitionService.sortByPriority(dueQuestions)

// 生成统计
const stats = SpacedRepetitionService.generateStatistics(allWrongAnswers)
console.log(stats)
// 输出:
// {
//   total: 100,
//   mastered: 45,
//   reviewing: 35,
//   unreveiwed: 20,
//   averagePriority: 85,
//   averageMastery: 68,
//   nextReviewCount: 12,
//   overdueCount: 3
// }
```

### 使用ReviewPlanService

```javascript
import ReviewPlanService from '@/services/reviewPlanService'

// 生成复习计划
const plan = await ReviewPlanService.generateReviewPlan(
  wrongAnswers,
  {
    hoursPerDay: 2,
    daysAvailable: 30
  }
)

// 获取今日任务
const todayTasks = ReviewPlanService.getTodayTasks(plan)

// 获取计划进度
const progress = ReviewPlanService.getPlanProgress(plan)
console.log(progress)
// 输出:
// {
//   completedTasks: 20,
//   totalTasks: 100,
//   completedPercentage: 20,
//   estimatedDaysToCompletion: 40
// }
```

### 使用AIAnalysisService

```javascript
import AIAnalysisService from '@/services/aiAnalysisService'

// 分析错题
const analysis = await AIAnalysisService.analyzeWrongAnswer(wrongAnswer)
console.log(analysis)
// 输出:
// {
//   rootCauses: [{ name: '概念理解不足', severity: 'high' }],
//   learningHints: ['建议复习...'],
//   similarQuestions: [...]
// }

// 获取学习洞察
const insights = await AIAnalysisService.getLearningInsights(wrongAnswers)
```

## 参考资源

- [SM-2算法介绍](https://en.wikipedia.org/wiki/Spaced_repetition)
- [Anki文档](https://docs.ankiweb.net/)
- [Vue 3 性能优化](https://v3.vuejs.org/guide/optimization.html)

---

**最后更新**: 2024年10月28日
**版本**: 1.0.0
**作者**: AI Assistant
