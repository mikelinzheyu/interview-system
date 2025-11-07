# 错题集系统 - 快速参考指南

## 📋 项目快速导航

### 文件位置速查

#### 前端核心文件
```
frontend/src/
├── views/chat/
│   ├── WrongAnswersPage.vue         ← 错题列表页
│   ├── AnalyticsDashboard.vue       ← 分析仪表板
│   └── ChatRoom.vue                 ← 首页集成
├── components/chat/
│   ├── WrongAnswerDetail.vue        ← 错题详情
│   ├── ReviewMode.vue               ← 复习模式
│   ├── BatchOperationDialog.vue     ← 批量操作
│   └── RecommendationPanel.vue      ← AI推荐面板
├── services/
│   ├── messageBatchOperationService.js    ← 批量操作服务
│   ├── messageAIRecommendationService.js  ← AI推荐服务
│   └── ChatSocketService.js               ← WebSocket服务
├── stores/
│   └── wrongAnswers.js              ← Pinia状态存储
├── utils/
│   └── WrongAnswersWebSocket.js     ← WebSocket客户端
├── composables/
│   └── useWrongAnswersOfflineCache.js   ← IndexedDB缓存
└── router/index.js                  ← 路由配置
```

#### 后端核心文件
```
backend/src/main/java/com/interview/
├── entity/
│   └── WrongAnswerRecord.java
├── dto/
│   ├── WrongAnswerDto.java
│   ├── WrongAnswerStatisticsDto.java
│   └── RecordWrongAnswerRequest.java
├── mapper/
│   ├── WrongAnswerMapper.java
│   └── WrongAnswerMapper.xml
├── service/
│   ├── WrongAnswerService.java
│   ├── WrongAnswerServiceImpl.java
│   └── WrongAnswerEventListener.java
├── controller/
│   └── WrongAnswerController.java
├── config/
│   └── WebSocketConfig.java
└── websocket/
    └── WrongAnswersWebSocketHandler.java
```

---

## 🚀 使用指南

### 用户工作流

#### 1. 查看错题统计 (首页)
```
首页 (Home.vue)
  → WrongAnswerStatisticsCard 显示4个统计指标
  → 点击"查看详情"进入列表
```

#### 2. 管理错题列表
```
错题列表 (WrongAnswersPage.vue)
  → 筛选: 状态、来源、难度
  → 排序: 最近、最常复习、优先级、下次复习
  → 卡片/表格两种视图
  → 选中错题后可批量操作
```

#### 3. 查看错题详情
```
错题详情 (WrongAnswerDetail.vue)
  → 问题内容展示
  → 错误分析 (错误次数、正确次数、掌握率)
  → 复习时间轴
  → 编辑笔记和标签
  → 相似问题推荐
  → 手动同步选项
  → 删除记录
```

#### 4. 开始复习
```
复习模式 (ReviewMode.vue)
  → 全屏沉浸式界面
  → 进度条和计时器
  → 问题展示和用户笔记
  → 两个操作按钮:
    - "还是不会" (标记为复习中)
    - "已掌握" (标记为已掌握)
  → 自动进度跳转
  → 完成后展示成就
```

#### 5. 分析学习数据
```
分析仪表板 (AnalyticsDashboard.vue)
  → KPI指标: 总数、掌握、时间、复习次数
  → 趋势图表: 掌握进度、来源分布、日活动、难度
  → 数据表格: 知识点排行、最近活动
  → 性能指标: 效率、完成率、保留率
  → 日期范围选择和导出
```

#### 6. 批量操作
```
选择多个错题 → 点击"批量操作"按钮
  → 选择操作类型:
    - 更新状态
    - 添加/移除标签
    - 删除记录
    - 导出数据 (PDF/Excel/CSV/JSON)
  → 确认操作 → 执行
```

#### 7. 查看推荐
```
推荐面板 (RecommendationPanel.vue)
  → AI推荐的5个错题
  → 每个推荐显示:
    - 题目标题
    - 推荐理由标签
    - 元数据 (来源、难度、错次)
  → 快速操作: 现在复习 / 查看详情
  → 弱点分析: 显示主要弱点知识点
  → 生成优化计划按钮
```

---

## 🔧 开发指南

### 常见任务

#### 添加新API端点
1. 在 `WrongAnswerController.java` 中添加方法
2. 在对应的 `Service` 中实现逻辑
3. 在 `Mapper.xml` 中编写SQL
4. 在前端的 `store` 中调用API
5. 更新 WebSocket 处理器 (如需实时)

#### 修改UI样式
```vue
<!-- 使用 scoped CSS -->
<style scoped lang="css">
.my-class {
  /* 仅作用于此组件 */
}
</style>

<!-- Element Plus 主题变量 -->
--el-color-primary: #409eff;
--el-color-success: #67c23a;
--el-color-warning: #e6a23c;
--el-color-danger: #f56c6c;
```

#### 添加新的WebSocket消息类型
1. 在 `WrongAnswersWebSocketHandler.java` 添加 `@MessageMapping`
2. 在 `WrongAnswersWebSocket.js` 添加处理函数
3. 在前端调用 `sendMessage()` 发送

#### 添加本地存储
```javascript
// 使用 IndexedDB 缓存
import { useWrongAnswersOfflineCache } from '@/composables/useWrongAnswersOfflineCache'

const { saveToCache, getFromCache } = useWrongAnswersOfflineCache()
await saveToCache(data)
const cached = await getFromCache(id)
```

#### 实现AI推荐
```javascript
// 使用本地算法
import messageAIRecommendationService from '@/services/messageAIRecommendationService'

const recs = messageAIRecommendationService.generateLocalRecommendations(data, 5)
const weaknesses = messageAIRecommendationService.analyzeLocalWeaknesses(data)
```

---

## 📊 数据模型速查

### WrongAnswerRecord (核心表)
```
字段名                  类型        说明
id                   BIGINT      主键
user_id              BIGINT      用户ID
question_id          BIGINT      题目ID
wrong_count          INT         错误次数
correct_count        INT         正确次数
review_status        VARCHAR     复习状态(unreveiwed/reviewing/mastered)
next_review_time     TIMESTAMP   下次复习时间
review_priority      INT         复习优先级(0-100)
user_notes           TEXT        用户笔记
user_tags            JSON        用户标签
question_title       VARCHAR     题目标题
question_content     LONGTEXT    题目内容
source               VARCHAR     来源(ai_interview/question_bank/mock_exam)
difficulty           VARCHAR     难度(easy/medium/hard)
knowledge_points     JSON        知识点列表
created_at           TIMESTAMP   创建时间
updated_at           TIMESTAMP   更新时间
```

### Pinia Store 状态
```javascript
state: {
  wrongAnswers: [],           // 错题列表
  statistics: {},             // 统计数据
  loading: false,             // 加载状态
  error: null,                // 错误信息
  filters: {                  // 筛选条件
    selectedStatus: '',
    selectedSource: ''
  },
  pagination: {               // 分页
    current: 1,
    pageSize: 20,
    total: 0
  }
}

computed: {
  filteredWrongAnswers,       // 筛选后数据
  paginatedWrongAnswers,      // 分页数据
  masteredCount,              // 已掌握数
  reviewingCount,             // 复习中数
  unreviewedCount,            // 未复习数
  masteredPercentage          // 掌握百分比
}

actions: {
  recordWrongAnswer(),        // 记录新错题
  fetchWrongAnswers(),        // 获取列表
  fetchByStatus(),            // 按状态筛选
  markAsMastered(),           // 标记为已掌握
  updateUserNotes(),          // 更新笔记
  deleteWrongAnswer(),        // 删除
  generateReviewPlan()        // 生成计划
}
```

---

## 🔌 API 速查表

### REST API 端点

| 方法 | 端点 | 功能 |
|------|------|------|
| POST | /api/v1/wrong-answers | 记录新错题 |
| GET | /api/v1/wrong-answers | 获取列表 |
| GET | /api/v1/wrong-answers/{id} | 获取详情 |
| PUT | /api/v1/wrong-answers/{id} | 更新记录 |
| DELETE | /api/v1/wrong-answers/{id} | 删除记录 |
| GET | /api/v1/wrong-answers/status/{status} | 按状态筛选 |
| GET | /api/v1/wrong-answers/source/{source} | 按来源筛选 |
| GET | /api/v1/wrong-answers/due | 获取应复习 |
| PUT | /api/v1/wrong-answers/{id}/status | 更新状态 |
| PUT | /api/v1/wrong-answers/{id}/notes | 更新笔记 |
| PUT | /api/v1/wrong-answers/{id}/tags | 更新标签 |
| GET | /api/v1/wrong-answers/statistics | 获取统计 |
| POST | /api/v1/wrong-answers/review-plan | 生成计划 |
| GET | /api/v1/wrong-answers/{id}/similar | 相似问题 |

### WebSocket 端点

| 消息类型 | 目标 | 说明 |
|---------|------|------|
| RECORD_WRONG_ANSWER | /app/wrong-answers/record | 记录新错题 |
| UPDATE_STATUS | /app/wrong-answers/update-status | 更新状态 |
| UPDATE_NOTES | /app/wrong-answers/update-notes | 更新笔记 |
| UPDATE_TAGS | /app/wrong-answers/update-tags | 更新标签 |
| DELETE_RECORD | /app/wrong-answers/delete | 删除记录 |
| SYNC_REQUEST | /app/wrong-answers/sync-request | 请求同步 |
| HEARTBEAT | /app/wrong-answers/heartbeat | 心跳保活 |

### 批量操作 API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/v1/wrong-answers/batch/update-status | POST | 批量更新状态 |
| /api/v1/wrong-answers/batch/add-tags | POST | 批量添加标签 |
| /api/v1/wrong-answers/batch/remove-tags | POST | 批量移除标签 |
| /api/v1/wrong-answers/batch/delete | POST | 批量删除 |
| /api/v1/wrong-answers/batch/export-pdf | POST | 导出PDF |
| /api/v1/wrong-answers/batch/export-excel | POST | 导出Excel |
| /api/v1/wrong-answers/batch/export-csv | POST | 导出CSV |
| /api/v1/wrong-answers/batch/progress/{id} | GET | 获取进度 |
| /api/v1/wrong-answers/batch/cancel/{id} | POST | 取消操作 |

### AI推荐 API

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/v1/wrong-answers/ai/review-plan | GET | 推荐复习计划 |
| /api/v1/wrong-answers/ai/learning-path | POST | 推荐学习路径 |
| /api/v1/wrong-answers/{id}/similar-questions | GET | 相似问题 |
| /api/v1/wrong-answers/ai/weakness-analysis | GET | 弱点分析 |
| /api/v1/wrong-answers/ai/personalized-recommendations | GET | 个性化推荐 |
| /api/v1/wrong-answers/ai/predict-progress | POST | 进度预测 |
| /api/v1/wrong-answers/ai/optimal-review-times | GET | 最优复习时间 |
| /api/v1/wrong-answers/ai/learning-style | GET | 学习风格分析 |

---

## ⚙️ 配置参考

### 艾宾浩斯复习间隔
```java
private static final int[] REVIEW_INTERVALS = {1, 3, 7, 14, 30}; // 天数
// 每次错误后，下次复习时间 = 当前时间 + REVIEW_INTERVALS[次数]
```

### 优先级权重
```javascript
score = wrongCount * 2 +        // 错误次数 (权重2)
        reviewStatusWeight +    // 复习状态 (新:5, 中:3, 掌:0)
        difficultyWeight +      // 难度 (hard:3, medium:1, easy:0)
        urgencyWeight +         // 紧急度 (立即:10, 3天:5, 普通:0)
        reviewPriority / 10     // 已计算优先级 (权重0.1)
```

### 弱点识别阈值
```javascript
掌握率 < 40%  → 关键领域
掌握率 < 60%  → 需要关注
掌握率 >= 80% → 基本掌握
```

### 缓存配置
```javascript
IndexedDB {
  name: 'interview-system',
  version: 1,
  stores: {
    wrongAnswers: { keyPath: 'id' },
    syncQueue: { autoIncrement: true },
    metadata: { keyPath: 'key' }
  }
}
```

---

## 🐛 调试技巧

### 查看本地缓存
```javascript
// 浏览器控制台
db = await indexedDB.databases()
// 查看 IDB Inspector 插件中的数据
```

### 查看 Pinia 状态
```javascript
// Vue DevTools → Pinia
// 可以看到所有状态和mutations历史
```

### 检查 WebSocket 连接
```javascript
// 浏览器控制台
window.wsClient  // WrongAnswersWebSocket 实例
window.wsClient.isConnected  // 连接状态
```

### 查看网络请求
```
F12 → Network 标签
过滤 websocket / fetch / xhr
查看请求和响应内容
```

### 性能监测
```javascript
// 浏览器控制台
performance.mark('start')
// 执行操作
performance.mark('end')
performance.measure('operation', 'start', 'end')
performance.getEntriesByName('operation')[0].duration
```

---

## 📚 学习资源

### 核心技术文档
- [Vue 3 官方文档](https://vuejs.org)
- [Vue Router 文档](https://router.vuejs.org)
- [Pinia 状态管理](https://pinia.vuejs.org)
- [Element Plus 组件库](https://element-plus.org)
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [MyBatis 官方文档](https://mybatis.org)

### 相关算法和概念
- [艾宾浩斯遗忘曲线](https://en.wikipedia.org/wiki/Spacing_effect)
- [WebSocket 协议](https://en.wikipedia.org/wiki/WebSocket)
- [IndexedDB 文档](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

## 📞 常见问题

### Q: 如何添加新的错题来源?
A: 修改 `source` 枚举值: ai_interview / question_bank / mock_exam。在 EventListener 中添加新的事件类型监听。

### Q: WebSocket 断开连接了怎么办?
A: 系统会自动重连,最多重试5次,间隔逐步增加(3s→6s→12s→24s→48s)。可以手动点击"同步"按钮。

### Q: 离线状态下可以使用吗?
A: 可以!所有数据存储在 IndexedDB 中,联网后会自动同步。

### Q: 如何导出数据?
A: 在列表选中错题,点击"批量操作"→选择"导出数据"→选择格式→下载。

### Q: 推荐是如何生成的?
A: 优先考虑:错误次数多、复习状态新/中、难度高、应复习时间近等因素。

### Q: 如何删除错题?
A: 进入详情页点击删除按钮,或在列表中批量删除(需二次确认)。

---

## 📝 贡献指南

### 代码风格
- 使用 Prettier 格式化代码
- 遵循项目现有的命名规范
- 为复杂逻辑添加注释
- 提交前运行 lint 检查

### 提交规范
```
git commit -m "feat: 添加新功能描述"
git commit -m "fix: 修复bug描述"
git commit -m "docs: 文档更新"
git commit -m "style: 格式化代码"
```

### Pull Request
1. 创建特性分支
2. 提交清晰的代码
3. 编写单元测试
4. 更新相关文档
5. 创建 PR 描述

---

**最后更新**: 2025年10月22日
**文档版本**: 1.0
**项目版本**: Phase 3 Complete

---

*欢迎使用错题集系统!有问题请参考本指南或查阅完整文档。*
