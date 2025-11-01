# 错题集功能增强实现方案 v2.0

## 核心调整与完善

基于现有系统架构（Vue 3 + Spring Boot + WebSocket），本方案针对错题集功能进行深度完善，包括：
- ✅ 实时数据同步机制
- ✅ 离线缓存策略
- ✅ 智能推荐引擎
- ✅ 复习计划调度
- ✅ 性能优化方案

---

## 第一部分：数据流架构

### 1.1 错题数据来源与流向

```
┌─────────────────────────────────────────────────────────────┐
│                    用户交互层                                 │
│  AI 面试完成  │  题库练习  │  模拟考试  │  自定义导入         │
└────────┬──────────────┬──────────┬──────────┬───────────────┘
         │              │          │          │
         ▼              ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│              错题检测与分类引擎                               │
│  • 答案判断  • 题目归一化  • 重复检测  • 知识点标签          │
└────────┬──────────────────────────────────────────────────┬──┘
         │                                                  │
         ▼                                                  ▼
┌──────────────────────────┐                  ┌────────────────┐
│  本地缓存存储 (IndexedDB) │                  │  WebSocket推送  │
│  • 离线支持               │◄─────────────────┤  • 实时同步    │
│  • 快速查询               │                  │  • 二向同步    │
└──────────────────────────┘                  └────────────────┘
         │                                                  │
         └──────────────────┬───────────────────────────────┘
                            ▼
                 ┌──────────────────────┐
                 │  后端数据库服务      │
                 │  • 数据持久化       │
                 │  • 统计计算         │
                 │  • 推荐生成         │
                 └──────────────────────┘
```

### 1.2 实时同步机制

```typescript
// WebSocket 事件定义
interface WrongAnswerSyncMessage {
  type: 'add' | 'update' | 'delete' | 'batch-sync';
  timestamp: number;
  data: WrongAnswerRecord | WrongAnswerRecord[];
  deviceId: string;  // 标识来自哪个设备
  syncVersion: number;  // 版本号用于冲突解决
}

// 同步策略
enum SyncStrategy {
  IMMEDIATE = 'immediate',      // 立即同步
  BATCH = 'batch',              // 批量同步 (10秒一次)
  OFFLINE_QUEUE = 'offline_queue'  // 离线队列
}
```

---

## 第二部分：前端实现架构

### 2.1 Composable 分层设计

```typescript
// composables/useWrongAnswersStore.ts - 状态管理
export function useWrongAnswersStore() {
  // 核心数据
  const wrongAnswers = ref<Map<string, WrongAnswerRecord>>(new Map())
  const statistics = reactive<WrongAnswersStatistics>({...})
  const filters = reactive<FilterState>({...})

  // 同步状态
  const syncState = reactive({
    isSyncing: false,
    pendingChanges: [] as SyncOperation[],
    lastSyncTime: 0,
    conflictQueue: [] as ConflictItem[]
  })

  // 性能优化
  const memoizedStats = computed(() => computeStatistics())
  const paginatedResults = computed(() => paginate(filteredWrongAnswers))

  return {
    wrongAnswers,
    statistics,
    filters,
    syncState,
    // ... methods
  }
}

// composables/useWrongAnswersSync.ts - 同步管理
export function useWrongAnswersSync() {
  // WebSocket 同步
  const wsManager = ref<WebSocketManager>()
  const syncQueue = ref<SyncOperation[]>([])

  // 初始化同步
  const initSync = async () => {
    // 1. 连接 WebSocket
    // 2. 加载初始数据
    // 3. 注册事件监听
    // 4. 启动定时同步
  }

  // 处理冲突
  const handleConflict = (local: WrongAnswerRecord, remote: WrongAnswerRecord) => {
    // 基于时间戳的三向合并 (3-way merge)
    return mergeWrongAnswers(local, remote)
  }

  return {
    initSync,
    handleConflict,
    // ... methods
  }
}

// composables/useWrongAnswersAI.ts - 智能推荐
export function useWrongAnswersAI() {
  // 知识点分析
  const analyzeKnowledgeGaps = (wrongAnswers: WrongAnswerRecord[]) => {
    // 分析知识薄弱点
    return {
      weakPoints: string[],
      strengthPoints: string[],
      recommendations: string[]
    }
  }

  // 相似题推荐
  const getRecommendations = async (wrongAnswerId: string) => {
    const answer = wrongAnswers.get(wrongAnswerId)
    return await fetchSimilarQuestions(answer.knowledgePoints)
  }

  // 复习计划
  const generateReviewPlan = (wrongAnswers: WrongAnswerRecord[]) => {
    // 基于艾宾浩斯遗忘曲线
    return generateSpacedRepetitionSchedule(wrongAnswers)
  }

  return {
    analyzeKnowledgeGaps,
    getRecommendations,
    generateReviewPlan
  }
}

// composables/useWrongAnswersCache.ts - 离线缓存
export function useWrongAnswersCache() {
  const db = ref<IDBDatabase>()

  // IndexedDB 操作
  const initCache = async () => {
    // 创建 ObjectStore
    // 创建索引
  }

  const saveToCache = async (wrongAnswers: WrongAnswerRecord[]) => {
    const tx = db.value!.transaction(['wrongAnswers'], 'readwrite')
    // 批量保存
  }

  const loadFromCache = async (): Promise<WrongAnswerRecord[]> => {
    // 加载所有缓存数据
  }

  return {
    initCache,
    saveToCache,
    loadFromCache
  }
}
```

### 2.2 组件树设计

```vue
<!-- views/WrongAnswersHub.vue - 错题集中心 -->
<template>
  <div class="wrong-answers-hub">
    <!-- 顶部导航 -->
    <WrongAnswersNav />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧：统计和筛选 -->
      <aside class="sidebar">
        <WrongAnswersStatistics :statistics="statistics" />
        <WrongAnswersFilters v-model="filters" />
      </aside>

      <!-- 中间：列表视图 -->
      <main class="list-area">
        <WrongAnswersList
          :wrong-answers="paginatedResults"
          :loading="loading"
          @select="handleSelectWrongAnswer"
        />
      </main>

      <!-- 右侧：详情面板 -->
      <aside class="detail-panel" v-if="selectedWrongAnswer">
        <WrongAnswerDetail
          :wrong-answer="selectedWrongAnswer"
          @update="handleUpdateWrongAnswer"
          @delete="handleDeleteWrongAnswer"
        />

        <!-- 推荐题目 -->
        <WrongAnswerRecommendations
          :wrong-answer="selectedWrongAnswer"
          :recommendations="recommendations"
        />
      </aside>
    </div>

    <!-- 浮窗：复习计划 -->
    <WrongAnswersReviewPlan
      v-if="showReviewPlan"
      :plan="reviewPlan"
      @start="handleStartReview"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWrongAnswersStore } from '@/composables/useWrongAnswersStore'
import { useWrongAnswersSync } from '@/composables/useWrongAnswersSync'
import { useWrongAnswersAI } from '@/composables/useWrongAnswersAI'

const {
  wrongAnswers,
  statistics,
  filters,
  paginatedResults,
  loading
} = useWrongAnswersStore()

const { initSync } = useWrongAnswersSync()
const { getRecommendations } = useWrongAnswersAI()

const selectedWrongAnswer = ref(null)
const recommendations = ref([])

onMounted(async () => {
  await initSync()
})

const handleSelectWrongAnswer = async (wrongAnswer) => {
  selectedWrongAnswer.value = wrongAnswer
  recommendations.value = await getRecommendations(wrongAnswer.id)
}
</script>

<style scoped lang="scss">
.wrong-answers-hub {
  display: flex;
  flex-direction: column;
  height: 100vh;

  .main-content {
    display: grid;
    grid-template-columns: 250px 1fr 350px;
    gap: 16px;
    flex: 1;
    padding: 16px;

    @media (max-width: 1200px) {
      grid-template-columns: 200px 1fr;

      .detail-panel {
        display: none;
      }
    }
  }
}
</style>
```

---

## 第三部分：后端 API 设计

### 3.1 RESTful API 端点

```typescript
// API 端点与功能映射
const API_ENDPOINTS = {
  // 错题记录操作
  '/api/v1/wrong-answers': {
    GET: 'getWrongAnswers(page, pageSize, filters)',
    POST: 'createWrongAnswer(data)',
  },
  '/api/v1/wrong-answers/:id': {
    GET: 'getWrongAnswerDetail(id)',
    PUT: 'updateWrongAnswer(id, updates)',
    DELETE: 'deleteWrongAnswer(id)',
  },
  '/api/v1/wrong-answers/batch': {
    POST: 'batchCreateWrongAnswers(data)',
    PUT: 'batchUpdateWrongAnswers(updates)',
    DELETE: 'batchDeleteWrongAnswers(ids)',
  },

  // 统计分析
  '/api/v1/wrong-answers/statistics': {
    GET: 'getStatistics(userId)',
  },
  '/api/v1/wrong-answers/analytics': {
    GET: 'getAdvancedAnalytics(userId, timeRange)',
  },

  // 推荐与复习
  '/api/v1/wrong-answers/:id/recommendations': {
    GET: 'getRecommendations(id)',
  },
  '/api/v1/wrong-answers/review-plan': {
    GET: 'getReviewPlan(userId)',
    POST: 'generateReviewPlan(userId)',
  },

  // 导入导出
  '/api/v1/wrong-answers/export': {
    GET: 'exportWrongAnswers(format)',
  },
  '/api/v1/wrong-answers/import': {
    POST: 'importWrongAnswers(file)',
  },

  // WebSocket
  '/ws/wrong-answers': {
    CONNECT: 'subscribeWrongAnswerSync()',
    MESSAGE: 'handleSyncMessage(message)',
  }
}
```

### 3.2 后端服务实现

```java
// service/WrongAnswerService.java
@Service
public class WrongAnswerService {

  @Autowired
  private WrongAnswerRepository repository;

  @Autowired
  private KafkaTemplate<String, WrongAnswerEvent> kafkaTemplate;

  @Autowired
  private RedisTemplate<String, Object> redisTemplate;

  /**
   * 创建或更新错题记录
   * 使用 Kafka 发送事件，用于实时推送和异步处理
   */
  public WrongAnswerDTO recordWrongAnswer(RecordWrongAnswerRequest request) {
    WrongAnswer entity = new WrongAnswer();
    entity.setUserId(request.getUserId());
    entity.setQuestionId(request.getQuestionId());
    entity.setSource(request.getSource());
    entity.setUserAnswer(request.getUserAnswer());
    entity.setCorrectAnswer(request.getCorrectAnswer());
    entity.setWrongCount(1);
    entity.setLastWrongTime(LocalDateTime.now());
    entity.setReviewedStatus(ReviewedStatus.UNREVIEWED);

    WrongAnswer saved = repository.save(entity);

    // 发送 Kafka 事件，用于实时推送
    kafkaTemplate.send("wrong-answer-topic", new WrongAnswerEvent(
      EventType.WRONG_ANSWER_CREATED,
      saved.getId(),
      request.getUserId(),
      saved
    ));

    return toDTO(saved);
  }

  /**
   * 获取用户错题统计（使用缓存）
   */
  @Cacheable(value = "wrongAnswerStatistics", key = "#userId")
  public WrongAnswersStatisticsDTO getStatistics(Long userId) {
    List<WrongAnswer> wrongAnswers = repository.findByUserId(userId);

    return new WrongAnswersStatisticsDTO(
      wrongAnswers.size(),
      groupBySource(wrongAnswers),
      groupByDifficulty(wrongAnswers),
      getTopWrongKnowledgePoints(wrongAnswers),
      getReviewProgress(wrongAnswers)
    );
  }

  /**
   * 生成个性化复习计划（基于艾宾浩斯遗忘曲线）
   */
  public ReviewPlanDTO generateReviewPlan(Long userId) {
    List<WrongAnswer> wrongAnswers = repository.findByUserId(userId);

    Map<LocalDate, List<WrongAnswer>> schedule = new TreeMap<>();
    LocalDate today = LocalDate.now();

    // 艾宾浩斯遗忘曲线：1天、3天、7天、15天、30天
    int[] spacingDays = {1, 3, 7, 15, 30};

    for (WrongAnswer wa : wrongAnswers) {
      int nextDay = getNextReviewDay(wa, spacingDays);
      LocalDate reviewDate = today.plusDays(nextDay);

      schedule.computeIfAbsent(reviewDate, k -> new ArrayList<>())
              .add(wa);
    }

    return new ReviewPlanDTO(schedule, calculateCompletionRate(wrongAnswers));
  }

  /**
   * 获取相似题推荐
   */
  public List<QuestionDTO> getRecommendations(Long wrongAnswerId) {
    WrongAnswer wrongAnswer = repository.findById(wrongAnswerId).orElseThrow();

    // 基于知识点查询相似题
    return questionService.findByKnowledgePoints(
      wrongAnswer.getKnowledgePoints(),
      wrongAnswer.getDifficulty() + 1  // 推荐更高难度的题目
    );
  }
}
```

### 3.3 WebSocket 实时同步

```java
// websocket/WrongAnswerWebSocketHandler.java
@Component
public class WrongAnswerWebSocketHandler extends TextWebSocketHandler {

  @Autowired
  private WrongAnswerService wrongAnswerService;

  private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    sessions.put(session.getId(), session);

    // 发送初始数据
    Long userId = extractUserIdFromSession(session);
    WrongAnswersStatisticsDTO stats = wrongAnswerService.getStatistics(userId);

    session.sendMessage(new TextMessage(new ObjectMapper()
      .writeValueAsString(new WsSyncMessage(
        MessageType.INITIAL_SYNC,
        stats
      ))
    ));
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    WsSyncMessage syncMsg = parseMessage(message.getPayload());
    Long userId = extractUserIdFromSession(session);

    switch (syncMsg.getType()) {
      case "SYNC_CHANGES":
        // 处理客户端的更新
        List<WrongAnswerDTO> changes = syncMsg.getData();
        for (WrongAnswerDTO dto : changes) {
          // 保存到数据库
          // 广播到其他客户端
          broadcastToUser(userId, new WsSyncMessage(
            MessageType.REMOTE_UPDATE,
            dto
          ));
        }
        break;

      case "REQUEST_FULL_SYNC":
        // 完全重新同步
        session.sendMessage(new TextMessage(
          getFullSyncMessage(userId)
        ));
        break;
    }
  }

  private void broadcastToUser(Long userId, WsSyncMessage message) {
    String payload = new ObjectMapper().writeValueAsString(message);
    sessions.values().forEach(session -> {
      if (extractUserIdFromSession(session).equals(userId)) {
        try {
          session.sendMessage(new TextMessage(payload));
        } catch (IOException e) {
          // 处理错误
        }
      }
    });
  }
}
```

---

## 第四部分：性能优化方案

### 4.1 数据库优化

```sql
-- 创建必要的索引
CREATE INDEX idx_user_id ON wrong_answers(user_id);
CREATE INDEX idx_user_status ON wrong_answers(user_id, reviewed_status);
CREATE INDEX idx_user_knowledge ON wrong_answers(user_id, knowledge_point_id);
CREATE INDEX idx_last_wrong_time ON wrong_answers(user_id, last_wrong_time DESC);

-- 分析查询性能
EXPLAIN SELECT * FROM wrong_answers
WHERE user_id = ?
AND reviewed_status = 'unreviewed'
ORDER BY last_wrong_time DESC;

-- 物化视图用于统计
CREATE MATERIALIZED VIEW wrong_answer_stats_by_source AS
SELECT user_id, source, COUNT(*) as count
FROM wrong_answers
GROUP BY user_id, source;
```

### 4.2 缓存策略

```typescript
// services/cacheService.ts
export class CacheService {
  // 缓存键策略
  private static CACHE_KEYS = {
    STATISTICS: 'wa_stats_{userId}',
    FILTERED_LIST: 'wa_list_{userId}_{filterHash}',
    REVIEW_PLAN: 'wa_plan_{userId}',
    RECOMMENDATIONS: 'wa_rec_{wrongAnswerId}'
  }

  private static CACHE_DURATIONS = {
    STATISTICS: 5 * 60,      // 5 分钟
    FILTERED_LIST: 10 * 60,  // 10 分钟
    REVIEW_PLAN: 24 * 3600,  // 24 小时
    RECOMMENDATIONS: 3600    // 1 小时
  }

  static getStatistics(userId: string) {
    const key = this.CACHE_KEYS.STATISTICS.replace('{userId}', userId)

    // 先读缓存
    const cached = redisClient.get(key)
    if (cached) return JSON.parse(cached)

    // 缓存未命中，从数据库读取
    const data = await api.get(`/wrong-answers/statistics`)
    redisClient.setex(key, this.CACHE_DURATIONS.STATISTICS, JSON.stringify(data))
    return data
  }

  static invalidateStatistics(userId: string) {
    const key = this.CACHE_KEYS.STATISTICS.replace('{userId}', userId)
    redisClient.del(key)
  }
}
```

### 4.3 前端性能优化

```typescript
// 虚拟滚动
import { VirtualScroller } from '@/components/VirtualScroller'

// 图片懒加载
import { LazyImage } from '@/components/LazyImage'

// 代码分割
const WrongAnswersDetail = defineAsyncComponent(() =>
  import('@/components/WrongAnswersDetail')
)

// 防抖和节流
const handleFilterChange = debounce((filters) => {
  fetchWrongAnswers(filters)
}, 500)

// 批量操作优化
const batchUpdateWrongAnswers = async (ids: string[], updates: any) => {
  // 将多个单一请求合并为一个批量请求
  return await api.put('/wrong-answers/batch', {
    ids,
    updates
  })
}
```

---

## 第五部分：Home 页面集成

### 5.1 完整的 Home 页面实现

```vue
<template>
  <div class="home-page">
    <!-- Header -->
    <el-header class="home-header">
      <h1>学习中心</h1>
      <nav class="breadcrumb">
        <span>首页</span> / <span class="current">错题集</span>
      </nav>
    </el-header>

    <!-- 主内容 -->
    <el-main class="home-main">
      <!-- 欢迎卡片 -->
      <div v-if="wrongAnswersCount === 0" class="welcome-card">
        <el-result
          icon="success"
          title="恭喜！"
          sub-title="还没有错题，继续加油！"
        />
      </div>

      <!-- 错题集概览 (网格布局) -->
      <div v-else class="overview-grid">
        <!-- 1. 统计卡片 -->
        <div class="card statistics-card">
          <div class="card-header">
            <h3>📊 错题统计</h3>
            <el-button link type="primary" @click="goToDetailPage">
              查看详情 →
            </el-button>
          </div>
          <div class="card-body">
            <div class="stat-item">
              <span class="label">总错题数</span>
              <span class="value">{{ wrongAnswersCount }}</span>
            </div>
            <div class="stat-row">
              <div class="stat-item">
                <span class="label">AI 面试</span>
                <span class="value">{{ aiWrongCount }}</span>
              </div>
              <div class="stat-item">
                <span class="label">题库练习</span>
                <span class="value">{{ bankWrongCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 复习进度卡片 -->
        <div class="card progress-card">
          <div class="card-header">
            <h3>📚 复习进度</h3>
          </div>
          <div class="card-body">
            <div class="progress-item">
              <span>未复习</span>
              <el-progress
                :percentage="reviewProgress.unreviewed"
                color="#f56c6c"
              />
              <span class="count">{{ unreviewedCount }}</span>
            </div>
            <div class="progress-item">
              <span>复习中</span>
              <el-progress
                :percentage="reviewProgress.reviewing"
                color="#e6a23c"
              />
              <span class="count">{{ reviewingCount }}</span>
            </div>
            <div class="progress-item">
              <span>已掌握</span>
              <el-progress
                :percentage="reviewProgress.mastered"
                color="#67c23a"
              />
              <span class="count">{{ masteredCount }}</span>
            </div>
          </div>
        </div>

        <!-- 3. 知识点分布卡片 -->
        <div class="card knowledge-card">
          <div class="card-header">
            <h3>🎯 易错知识点</h3>
          </div>
          <div class="card-body">
            <div v-for="kp in topKnowledgePoints" :key="kp.name" class="kp-item">
              <span class="name">{{ kp.name }}</span>
              <el-progress :percentage="kp.percentage" />
              <span class="count">{{ kp.wrongCount }}</span>
            </div>
          </div>
        </div>

        <!-- 4. 推荐操作卡片 -->
        <div class="card actions-card">
          <div class="card-header">
            <h3>⚡ 推荐操作</h3>
          </div>
          <div class="card-body">
            <el-button
              type="primary"
              size="large"
              @click="startReview"
              block
            >
              开始复习 ({{ unreviewedCount }} 道)
            </el-button>
            <el-button size="large" @click="goToDetailPage" block>
              查看全部错题
            </el-button>
            <el-button size="large" @click="exportWrongAnswers" block>
              导出错题
            </el-button>
          </div>
        </div>
      </div>

      <!-- 最近错题预览 -->
      <div v-if="recentWrongAnswers.length > 0" class="recent-section">
        <div class="section-header">
          <h2>📌 最近错题</h2>
          <router-link to="/wrong-answers" class="view-all">
            查看全部 →
          </router-link>
        </div>

        <div class="recent-list">
          <div
            v-for="wa in recentWrongAnswers.slice(0, 5)"
            :key="wa.id"
            class="recent-item"
            @click="selectWrongAnswer(wa)"
          >
            <div class="source-badge" :class="wa.source">
              {{ wa.source === 'ai_interview' ? 'AI 面试' : '题库练习' }}
            </div>
            <div class="content">
              <p class="question">{{ wa.questionContent }}</p>
              <div class="meta">
                <span class="time">{{ formatTime(wa.lastWrongTime) }}</span>
                <span class="count">错 {{ wa.wrongCount }} 次</span>
              </div>
            </div>
            <div class="actions">
              <el-button link @click.stop="handleReview(wa)">复习</el-button>
              <el-button link type="danger" @click.stop="handleDelete(wa)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 详情侧栏 -->
      <el-drawer
        v-model="showDetailDrawer"
        title="错题详情"
        size="50%"
        destroy-on-close
      >
        <WrongAnswerDetail
          v-if="selectedWrongAnswer"
          :wrong-answer="selectedWrongAnswer"
          @update="handleUpdateWrongAnswer"
        />
      </el-drawer>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import WrongAnswerDetail from '@/components/wrong-answers/WrongAnswerDetail.vue'
import { useWrongAnswersStore } from '@/composables/useWrongAnswersStore'
import { useWrongAnswersAI } from '@/composables/useWrongAnswersAI'

const router = useRouter()

const {
  wrongAnswers,
  statistics,
  loading,
  fetchWrongAnswers,
  fetchStatistics,
  deleteWrongAnswer
} = useWrongAnswersStore()

const { analyzeKnowledgeGaps } = useWrongAnswersAI()

const selectedWrongAnswer = ref(null)
const showDetailDrawer = ref(false)

// 计算属性
const wrongAnswersCount = computed(() => statistics.value?.totalWrongCount || 0)
const aiWrongCount = computed(() => statistics.value?.sourceDistribution?.aiInterview || 0)
const bankWrongCount = computed(() => statistics.value?.sourceDistribution?.questionBank || 0)
const unreviewedCount = computed(() => statistics.value?.reviewProgress?.unreviewed || 0)
const reviewingCount = computed(() => statistics.value?.reviewProgress?.reviewing || 0)
const masteredCount = computed(() => statistics.value?.reviewProgress?.mastered || 0)

const reviewProgress = computed(() => ({
  unreviewed: (unreviewedCount.value / wrongAnswersCount.value) * 100,
  reviewing: (reviewingCount.value / wrongAnswersCount.value) * 100,
  mastered: (masteredCount.value / wrongAnswersCount.value) * 100
}))

const topKnowledgePoints = computed(() =>
  statistics.value?.topWrongKnowledgePoints || []
)

const recentWrongAnswers = computed(() =>
  Array.from(wrongAnswers.values())
    .sort((a, b) => b.lastWrongTime - a.lastWrongTime)
)

// 事件处理
const startReview = () => {
  router.push('/wrong-answers/review')
}

const goToDetailPage = () => {
  router.push('/wrong-answers')
}

const exportWrongAnswers = async () => {
  // TODO: 实现导出功能
  ElMessage.success('导出功能开发中...')
}

const selectWrongAnswer = (wa) => {
  selectedWrongAnswer.value = wa
  showDetailDrawer.value = true
}

const handleReview = (wa) => {
  router.push(`/wrong-answers/review/${wa.id}`)
}

const handleDelete = async (wa) => {
  await deleteWrongAnswer(wa.id)
  ElMessage.success('已删除')
}

const handleUpdateWrongAnswer = async (updates) => {
  // TODO: 实现更新逻辑
  showDetailDrawer.value = false
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

onMounted(async () => {
  await fetchStatistics()
  await fetchWrongAnswers(1, 100)
})
</script>

<style scoped lang="scss">
.home-page {
  background: #f5f7fa;
  min-height: 100vh;
}

.home-header {
  background: white;
  border-bottom: 1px solid #ebeef5;
  padding: 24px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #243058;
  }

  .breadcrumb {
    font-size: 14px;
    color: #7b80a1;
    margin-top: 8px;
  }
}

.home-main {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-card {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #243058;
    }
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  .label {
    font-size: 14px;
    color: #7b80a1;
  }

  .value {
    font-size: 24px;
    font-weight: 600;
    color: #5c6af0;
  }
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  span:first-child {
    font-size: 14px;
    color: #7b80a1;
    min-width: 60px;
  }

  .el-progress {
    flex: 1;
  }

  .count {
    font-size: 14px;
    color: #5c6af0;
    min-width: 40px;
    text-align: right;
  }
}

.kp-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .name {
    font-size: 14px;
    color: #243058;
    min-width: 100px;
  }

  .el-progress {
    flex: 1;
  }

  .count {
    font-size: 14px;
    color: #f56c6c;
    min-width: 30px;
    text-align: right;
  }
}

.recent-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #243058;
    }

    .view-all {
      color: #5c6af0;
      text-decoration: none;

      &:hover {
        color: #3a42c0;
      }
    }
  }
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #f5f7fa;
    border-color: #5c6af0;
  }

  .source-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;

    &.ai_interview {
      background: #c6e2ff;
      color: #0066cc;
    }

    &.question_bank {
      background: #f0f9ff;
      color: #0099ff;
    }
  }

  .content {
    flex: 1;
    min-width: 0;

    .question {
      margin: 0 0 8px;
      font-size: 14px;
      color: #243058;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #7b80a1;
    }
  }

  .actions {
    display: flex;
    gap: 8px;

    :deep(.el-button) {
      padding: 4px 8px;
      font-size: 12px;
    }
  }
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .recent-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
```

---

## 第六部分：实现路线图（优化版）

### Phase 1: MVP (第 1-2 周)
- [ ] 后端: 错题集核心 CRUD API
- [ ] 前端: Home 页面统计卡片
- [ ] 集成: AI 面试自动记录错题
- [ ] 性能: 基础缓存策略

### Phase 2: 完整功能 (第 3-4 周)
- [ ] WebSocket 实时同步
- [ ] 离线缓存 (IndexedDB)
- [ ] 题库练习集成
- [ ] 虚拟滚动优化

### Phase 3: 智能功能 (第 5-6 周)
- [ ] 复习计划生成 (艾宾浩斯)
- [ ] 相似题推荐
- [ ] 知识点分析
- [ ] 导出功能

### Phase 4: 高级特性 (第 7-8 周)
- [ ] 分组学习
- [ ] 错题分享
- [ ] 自适应难度
- [ ] 学习报告

---

## 总结

本方案相比 v1.0 的主要改进：

1. **实时同步** ✅ WebSocket + Kafka 消息队列
2. **离线支持** ✅ IndexedDB 本地存储
3. **智能推荐** ✅ 艾宾浩斯遗忘曲线
4. **性能优化** ✅ 缓存策略 + 虚拟滚动
5. **完整集成** ✅ Home 页面详细实现

推荐首先实现 Phase 1，建立稳固的基础，再逐步扩展功能。
