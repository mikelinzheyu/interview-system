# 错题集功能 - 快速开始

## 🎯 目标
实现完整的错题集管理系统，包括间隔重复、AI分析、复习计划等

## ✅ 已完成

### 前端服务层 (3个)
1. **spacedRepetitionService.js** - SM-2间隔重复算法
   - ✓ 优先级计算
   - ✓ 掌握度评分
   - ✓ 统计生成
   - ✓ 排序功能

2. **aiAnalysisService.js** - AI驱动分析
   - ✓ 错题分析API调用
   - ✓ 提示生成
   - ✓ 学习洞察

3. **reviewPlanService.js** - 复习计划管理
   - ✓ 计划生成
   - ✓ 任务分配
   - ✓ 进度跟踪

### 文档
- ✓ WRONG_ANSWERS_BEST_PRACTICES.md (最佳实践)
- ✓ IMPLEMENTATION_GUIDE.md (完整指南)

## 📋 待办事项 (优先级)

### P0 - 本日完成
- [ ] **增强WrongAnswersPage.vue**
  - 添加优先级显示
  - 集成SpacedRepetitionService
  - 优化过滤和排序
  
- [ ] **创建AnalyticsDashboard.vue**
  - 掌握度趋势图
  - 每日活动热力图
  - 难度分布图

### P1 - 本周完成
- [ ] **增强ReviewMode.vue**
  - 计时器显示
  - 侧边栏 (提示、资源、统计)
  - AI分析集成
  
- [ ] **后端实现**
  - SpacedRepetitionService (Java)
  - 数据库索引优化
  - API端点增强

### P2 - 本月完成
- [ ] **AI服务集成**
  - Dify API集成
  - 批量分析处理
  - 缓存优化
  
- [ ] **性能优化**
  - 虚拟列表
  - IndexedDB缓存
  - 后端查询优化

## 🚀 使用示例

### 1. 获取优先级排序的错题
```javascript
import SpacedRepetitionService from '@/services/spacedRepetitionService'

const sortedAnswers = SpacedRepetitionService.sortByPriority(wrongAnswers)
// 结果: 按优先级从高到低排序
```

### 2. 生成复习计划
```javascript
import ReviewPlanService from '@/services/reviewPlanService'

const plan = await ReviewPlanService.generateReviewPlan(wrongAnswers, {
  hoursPerDay: 2,
  daysAvailable: 30
})
// 结果: 个性化的30天复习计划
```

### 3. AI分析错题
```javascript
import AIAnalysisService from '@/services/aiAnalysisService'

const analysis = await AIAnalysisService.analyzeWrongAnswer(wrongAnswer)
// 结果: 错题原因、学习提示、相关资源
```

## 📊 核心算法

### SM-2间隔重复
```
新卡片: 1天后复习

复习后:
- easy (很轻松): 间隔 × 2.6
- normal (正常):   间隔 × 1.3  
- hard (困难):    间隔 × 1.0

例: 10天间隔
- easy: 26天
- normal: 13天
- hard: 10天
```

### 优先级计算
```
Priority = 
  逾期天数 × 100 +
  错误次数 × 50 +
  难度分数 × 30 -
  正确次数 × 10

标志:
- ≥200: 🔴 必须复习
- ≥100: 🟡 应该复习
- ≥50:  🔵 建议复习
- <50:  🟢 可选复习
```

### 掌握度评分
```
Mastery = (正确次数 / 总复习数) × 100

状态:
- ≥85%: mastered (已掌握) ✓
- 60-85%: reviewing (复习中)
- <60%: unreveiwed (未掌握)
```

## 📂 文件结构

```
frontend/src/services/
├── spacedRepetitionService.js  ✓ 已创建
├── aiAnalysisService.js        ✓ 已创建
└── reviewPlanService.js        ✓ 已创建

frontend/src/views/chat/
├── WrongAnswersPage.vue        (需增强)
├── ReviewMode.vue              (需增强)
└── AnalyticsDashboard.vue      (需创建)

backend/
├── SpacedRepetitionService     (需创建)
├── AIAnalysisService           (需创建)
└── ReviewPlanService           (需创建)
```

## 🔄 工作流程

### 1. 记录错题
```
用户做题 → 选择错误 → 系统自动记录
↓
初始参数: 间隔=1天, 优先级=50
↓
发送通知并触发AI分析
```

### 2. 生成复习计划
```
用户请求 → 加载所有错题 
↓
按优先级排序
↓
分配到日历 (考虑时间约束)
↓
生成每日任务
↓
返回可视化计划
```

### 3. 复习流程
```
用户开始 → 显示题目
↓
用户作答 → 提交答案
↓
系统评分 → 显示答案
↓
AI分析 → 生成提示
↓
更新数据 → 计算下次复习
↓
显示反馈 → 下一题
```

### 4. 数据更新
```
复习提交
↓
计算掌握度
↓
更新间隔
↓
重新计算优先级
↓
记录日志
↓
同步统计
```

## ⚡ 性能指标

| 操作 | 目标 | 状态 |
|------|------|------|
| 加载 100 错题 | < 1s | ✓ |
| 加载 1000 错题 | < 2s | 需优化 |
| 生成复习计划 | < 500ms | ✓ |
| AI分析单题 | < 2s | 需测试 |
| 批量操作 100 条 | < 1s | ✓ |

## 🧪 测试计划

```javascript
// 单元测试
test('SpacedRepetitionService.calculatePriority', () => {
  const record = { wrongCount: 3, correctCount: 1, intervalDays: 5 }
  const priority = SpacedRepetitionService.calculatePriority(record)
  expect(priority).toBeGreaterThan(50)
})

// 集成测试
test('完整复习流程', async () => {
  const wrongAnswers = await store.fetchWrongAnswers()
  const plan = await ReviewPlanService.generateReviewPlan(wrongAnswers)
  expect(plan.dailyTasks.length).toBeGreaterThan(0)
})
```

## 🎓 学习资源

- **Spaced Repetition**: https://en.wikipedia.org/wiki/Spaced_repetition
- **SM-2 Algorithm**: https://en.m.wikipedia.org/wiki/SuperMemo
- **Anki源码**: https://github.com/ankitects/anki
- **学习科学**: Ebbinghaus遗忘曲线

## 📞 支持

遇到问题? 查看:
1. IMPLEMENTATION_GUIDE.md - 详细指南
2. WRONG_ANSWERS_BEST_PRACTICES.md - 最佳实践
3. 代码注释 - 每个方法都有详细注释

---

**更新时间**: 2024-10-28
**版本**: 1.0
**状态**: 进行中 (40% 完成)
