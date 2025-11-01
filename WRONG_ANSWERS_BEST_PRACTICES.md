# 错题集功能 - 最佳实践方案

## 一、架构设计

### 1.1 总体架构
```
前端 (Vue 3 + Pinia)
├── Views
│   ├── WrongAnswersPage (主页)
│   ├── WrongAnswerDetail (详情页)
│   ├── ReviewMode (复习模式)
│   └── AnalyticsDashboard (分析仪表板)
├── Services
│   ├── wrongAnswersService.js (API调用)
│   ├── aiAnalysisService.js (AI分析)
│   ├── spacedRepetitionService.js (间隔重复)
│   └── reviewPlanService.js (复习计划)
└── Stores
    └── wrongAnswers.js (Pinia状态管理)

后端 (Spring Boot + Java)
├── Controller
│   ├── WrongAnswerController (REST API)
│   └── ReviewController (复习逻辑)
├── Service
│   ├── WrongAnswerService (业务逻辑)
│   ├── AIAnalysisService (AI分析)
│   ├── SpacedRepetitionService (间隔重复)
│   └── ReviewPlanService (复习计划)
├── Entity
│   ├── WrongAnswerRecord (错题记录)
│   ├── WrongAnswerReviewLog (复习日志)
│   └── ReviewPlan (复习计划)
└── Mapper
    └── WrongAnswerMapper (数据访问)
```

### 1.2 核心特性

#### 功能层级
- **Level 1: 基础功能** (已有)
  - 记录错题、分类、搜索
  - 复习状态管理
  - 统计信息

- **Level 2: 高级功能** (实现中)
  - 间隔重复算法 (Spaced Repetition)
  - AI智能分析
  - 复习计划生成
  - 性能分析

- **Level 3: 智能功能** (未来)
  - 机器学习预测
  - 个性化推荐
  - 协作学习

## 二、关键算法

### 2.1 间隔重复 (Spaced Repetition)
```
SM-2 算法实现:
- 新卡片: 1天后复习
- 复习状态:
  * easy (困难度<2): interval * 2.6
  * normal (困难度2-4): interval * 1.3
  * hard (困难度>4): interval * 1.0

例: 10天间隔
  - easy: 26天
  - normal: 13天
  - hard: 10天
```

### 2.2 复习优先级计算
```
Priority =
  (days_overdue * 100) +
  (wrongCount * 50) +
  (difficulty_score * 30) -
  (correctCount * 10)

优先级应用:
- P >= 200: 必须复习 (红色)
- P >= 100: 应该复习 (黄色)
- P >= 50: 建议复习 (蓝色)
- P < 50: 可选复习 (绿色)
```

### 2.3 掌握度评分
```
Mastery Score = (correct_count / total_reviews) * 100

状态判断:
- score >= 85%: mastered (已掌握)
- score >= 60%: reviewing (复习中)
- score < 60%: unreveiwed (未掌握)
```

## 三、前端实现指南

### 3.1 核心服务层

#### wrongAnswersService.js
```javascript
- recordWrongAnswer()      // 记录错题
- fetchWrongAnswers()      // 获取列表
- fetchStatistics()        // 获取统计
- recordReview()           // 记录复习
- updatePriority()         // 更新优先级
- batchOperations()        // 批量操作
```

#### aiAnalysisService.js (NEW)
```javascript
- analyzeWrongAnswer()     // 分析错题原因
- generateHints()          // 生成提示
- suggestRelatedQuestions()// 推荐相关题目
- predictReviewScore()     // 预测复习分数
```

#### spacedRepetitionService.js (NEW)
```javascript
- calculateNextReview()    // 计算下次复习时间
- calculateIntervalDays()  // 计算间隔天数
- calculatePriority()      // 计算优先级
- needsReviewToday()       // 是否需要今天复习
```

#### reviewPlanService.js (NEW)
```javascript
- generateReviewPlan()     // 生成复习计划
- getReviewsByDate()       // 获取日期复习计划
- updateReviewProgress()   // 更新复习进度
- suggestDailyTarget()     // 建议每日复习目标
```

### 3.2 前端组件架构

#### Pages
1. **WrongAnswersPage.vue** (已有, 需增强)
   - 新增: 高级搜索、多维度分析
   - 优化: 虚拟列表、缓存优化

2. **ReviewMode.vue** (NEW)
   - 计时器和进度追踪
   - 卡片翻转动画
   - 实时反馈

3. **AnalyticsDashboard.vue** (NEW)
   - 掌握度曲线
   - 每日活动热力图
   - 题目难度分布

### 3.3 State Management (Pinia)

```javascript
// wrongAnswers.js
state:
  - wrongAnswers[]         // 错题列表
  - statistics             // 统计信息
  - reviewPlan             // 复习计划
  - currentReview          // 当前复习
  - analyticsData          // 分析数据
  - filters                // 过滤条件
  - sortOptions            // 排序选项

getters:
  - filteredAnswers()      // 过滤后的错题
  - overdueAnswers()       // 逾期未复习
  - todayReviewTarget()    // 今日复习目标
  - masteryRate()          // 掌握率

actions:
  - recordWrongAnswer()
  - fetchWrongAnswers()
  - startReviewSession()
  - completeReviewSession()
  - generateReviewPlan()
  - updateAnalytics()
```

## 四、后端实现指南

### 4.1 SpacedRepetitionService

```java
public interface SpacedRepetitionService {
    // 计算下次复习时间
    LocalDateTime calculateNextReviewTime(
        WrongAnswerRecord record,
        String difficulty
    );

    // 计算优先级
    int calculatePriority(WrongAnswerRecord record);

    // 获取应复习列表
    List<WrongAnswerRecord> getDueForReview(
        Long userId,
        LocalDate date
    );

    // 更新间隔参数
    void updateIntervalParameters(
        WrongAnswerRecord record,
        String reviewResult
    );
}
```

### 4.2 AIAnalysisService

```java
public interface AIAnalysisService {
    // 分析错题
    ErrorAnalysis analyzeWrongAnswer(
        Long questionId,
        String userAnswer
    );

    // 生成学习建议
    List<LearningHint> generateHints(
        Long recordId
    );

    // 推荐相关题目
    List<QuestionDTO> suggestRelatedQuestions(
        WrongAnswerRecord record
    );
}
```

### 4.3 ReviewPlanService

```java
public interface ReviewPlanService {
    // 生成复习计划
    ReviewPlan generatePlan(
        Long userId,
        LocalDate startDate
    );

    // 获取今日任务
    List<ReviewTask> getTodayTasks(Long userId);

    // 获取计划统计
    PlanStatistics getPlanStatistics(
        Long userId,
        LocalDate date
    );
}
```

### 4.4 数据库优化

```sql
-- WrongAnswerRecord 表
ALTER TABLE wrong_answer_record ADD INDEX idx_user_status (user_id, review_status);
ALTER TABLE wrong_answer_record ADD INDEX idx_next_review (user_id, next_review_time);
ALTER TABLE wrong_answer_record ADD INDEX idx_priority (user_id, review_priority);

-- WrongAnswerReviewLog 表
ALTER TABLE wrong_answer_review_log ADD INDEX idx_record_user (record_id, user_id, review_date);

-- 分区策略: 按用户和月份分区
PARTITION BY HASH(user_id) PARTITIONS 32;
PARTITION BY RANGE(YEAR_MONTH(created_at)) ...
```

## 五、业务流程

### 5.1 错题记录流程
```
1. 用户做题 → 错误
2. 系统自动或手动记录
3. 初始化参数:
   - 间隔: 1天
   - 困难度: normal
   - 优先级: 50
4. 发送通知
5. 触发分析
```

### 5.2 复习流程
```
1. 获取复习计划
2. 开始复习会话
   a. 加载题目
   b. 启动计时器
   c. 用户作答
   d. 提交结果
3. 系统处理:
   a. 计算掌握度
   b. 更新间隔
   c. 重新计算优先级
   d. 记录日志
   e. 更新统计
4. 显示反馈
5. 生成建议
```

### 5.3 数据分析流程
```
1. 聚合数据
   - 按状态分组
   - 按难度分组
   - 按来源分组
2. 计算指标
   - 掌握率
   - 每日复习量
   - 平均用时
3. 生成趋势
   - 近7天趋势
   - 近30天趋势
4. 输出报告
```

## 六、性能优化策略

### 6.1 前端优化
```
1. 虚拟滚动 (Vue Virtual Scroller)
   - 列表超过500条时启用
   - 渲染窗口: 20条数据

2. 缓存策略
   - LocalStorage: 统计数据
   - IndexedDB: 完整列表 (>10000)
   - Service Worker: 离线访问

3. 批量加载
   - 分页加载: 20/50/100条
   - 预加载: 网络空闲时加载下页

4. 路由懒加载
   - ReviewMode.vue
   - AnalyticsDashboard.vue
```

### 6.2 后端优化
```
1. 数据库查询优化
   - 使用索引
   - 联合查询
   - 缓存热数据

2. API响应优化
   - 分页返回
   - 字段筛选 (GraphQL)
   - 压缩响应

3. 异步处理
   - 使用消息队列
   - 定时任务
   - 后台线程

4. 缓存层
   - Redis缓存统计
   - 热数据预热
   - TTL策略
```

### 6.3 算法优化
```
1. 优先级计算
   - 增量计算
   - 批量更新
   - 定时同步

2. 间隔计算
   - 预计算常用值
   - 缓存结果
   - 异步刷新
```

## 七、测试计划

### 7.1 单元测试
```
- SpacedRepetitionService
- AIAnalysisService
- ReviewPlanService
```

### 7.2 集成测试
```
- 错题记录 → 获取 → 复习 → 统计
- 批量操作完整流程
- 缓存一致性
```

### 7.3 性能测试
```
- 100K+ 错题列表加载时间 < 2s
- 批量操作 1000条 < 5s
- API响应时间 < 500ms
```

### 7.4 用户测试
```
- 复习界面易用性
- 算法有效性评估
- 性能反馈收集
```

## 八、部署检查清单

- [ ] 数据库迁移脚本准备
- [ ] 缓存预热脚本
- [ ] 监控告警配置
- [ ] 备份恢复计划
- [ ] 灾难恢复方案
- [ ] A/B测试框架
- [ ] 灰度发布计划

## 九、参考资源

1. Spaced Repetition: SM-2算法
   - https://en.wikipedia.org/wiki/Spaced_repetition
   - https://en.m.wikipedia.org/wiki/SuperMemo

2. 学习科学
   - 遗忘曲线 (Ebbinghaus)
   - 检索强化效应
   - 间隔学习

3. 相关开源项目
   - Anki (间隔重复)
   - Quizlet (学习平台)
   - Khan Academy (教育平台)
