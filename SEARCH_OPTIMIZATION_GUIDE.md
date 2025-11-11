# 搜索系统优化完整指南

## 概述

本指南详细说明了论坛搜索系统的完整实现方案，包括全文搜索、高级过滤、搜索历史和智能建议。

## 功能清单

### ✅ 已实现功能

```
├─ 基础搜索
│  ├─ 全文搜索（标题、内容、作者）
│  ├─ 搜索关键词高亮
│  ├─ 实时搜索建议
│  └─ 搜索自动完成（Autocomplete）
│
├─ 高级搜索
│  ├─ 按内容类型过滤（帖子、用户、标签）
│  ├─ 按日期范围过滤（开始日期、结束日期）
│  ├─ 按作者过滤
│  ├─ 按标签过滤（多选）
│  ├─ 按板块过滤
│  └─ 组合过滤（同时多条件）
│
├─ 搜索排序
│  ├─ 相关度排序（默认）
│  ├─ 最新发布排序
│  ├─ 热度排序（点赞/评论）
│  └─ 浏览量排序
│
├─ 搜索历史
│  ├─ 保存搜索历史（本地 + 云端同步）
│  ├─ 显示历史记录（最近 30 条）
│  ├─ 删除单条历史
│  ├─ 清空所有历史
│  └─ 快速重搜
│
└─ 搜索优化
   ├─ 热门搜索显示
   ├─ 搜索建议（智能推荐）
   ├─ 搜索结果统计
   ├─ 分页查看结果
   └─ 搜索去重
```

---

## 架构设计

### 搜索流程

```
用户输入
   ↓
去抖动（300ms）
   ↓
检查缓存
   ↓
调用后端 API
   ↓
返回结果 + 保存历史
   ↓
显示结果 + 建议
```

### 缓存策略

```
┌─────────────────────────────────────┐
│         Search Cache Strategy        │
├─────────────────────────────────────┤
│                                      │
│ 搜索结果缓存: 3 分钟                 │
│ ├─ 相同关键词 + 过滤条件              │
│ ├─ 快速重复搜索时使用缓存             │
│ └─ 翻页时不清除缓存                   │
│                                      │
│ 搜索建议缓存: 1 分钟                 │
│ ├─ 更新频率高                        │
│ └─ 实时显示新建议                    │
│                                      │
│ 热门搜索缓存: 10 分钟                │
│ ├─ 变化较小                          │
│ └─ 定期更新                          │
│                                      │
│ 搜索历史缓存: 本地存储                │
│ ├─ localStorage 持久化                │
│ ├─ 同时同步到后端                    │
│ └─ 支持离线访问历史                  │
│                                      │
└─────────────────────────────────────┘
```

---

## API 规范

### 1. 全文搜索

```
GET /api/community/search?q=keyword&page=1&pageSize=20&sortBy=relevance&type=all
```

**请求参数**：

```javascript
{
  q: 'Vue',              // 搜索关键词
  page: 1,               // 页码
  pageSize: 20,          // 每页数量
  type: 'all',           // 搜索类型: all|post|user|tag
  sortBy: 'relevance',   // 排序: relevance|latest|hot|views
  startDate: null,       // 开始日期 (YYYY-MM-DD)
  endDate: null,         // 结束日期 (YYYY-MM-DD)
  author: null,          // 作者 ID
  tags: [],              // 标签列表
  forumId: null          // 论坛 ID
}
```

**响应格式**：

```json
{
  "code": 0,
  "data": {
    "results": [
      {
        "id": "post_1",
        "type": "post",
        "title": "如何深入理解 Vue 3 的响应式系统？",
        "content": "...",
        "preview": "内容预览，首 100 个字...",
        "author": {
          "userId": "user_1",
          "name": "张三",
          "avatar": "url"
        },
        "tags": ["Vue3", "响应式"],
        "likes": 15,
        "comments": 3,
        "views": 120,
        "createdAt": "2025-11-11T08:00:00Z",
        "relevance": 0.95,  // 相关度评分 0-1
        "highlights": {     // 关键词高亮位置
          "title": "如何深入理解 **Vue 3** 的响应式系统？",
          "content": "...讨论 **Vue 3** 的特性..."
        }
      }
    ],
    "total": 125,
    "page": 1,
    "pageSize": 20,
    "pages": 7
  }
}
```

### 2. 搜索建议

```
GET /api/community/search/suggestions?q=Vue
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "text": "Vue 3 响应式原理",
      "type": "popular",
      "count": 150,
      "icon": "🔥"
    },
    {
      "text": "Vue Router 路由管理",
      "type": "popular",
      "count": 100,
      "icon": "📍"
    },
    {
      "text": "Vue 性能优化",
      "type": "suggested",
      "count": 45,
      "icon": "⚡"
    }
  ]
}
```

### 3. 热门搜索

```
GET /api/community/search/trending
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "rank": 1,
      "keyword": "React Hooks",
      "trend": "up",
      "count": 2500,
      "changePercent": 25
    },
    {
      "rank": 2,
      "keyword": "TypeScript",
      "trend": "stable",
      "count": 2200,
      "changePercent": 0
    }
  ]
}
```

### 4. 搜索历史

```
GET /api/community/user/search-history
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "keyword": "Vue 3",
      "timestamp": "2025-11-11T10:00:00Z",
      "resultCount": 150
    }
  ]
}
```

---

## 前端实现

### useSearch Composable

```javascript
export function useSearch() {
  // 搜索状态
  const searchKeyword = ref('')
  const searchResults = ref([])
  const searchHistory = ref([])
  const trendingSearches = ref([])
  const loading = ref(false)

  // 过滤器
  const filters = reactive({
    type: 'all',
    sortBy: 'relevance',
    startDate: null,
    endDate: null,
    author: null,
    tags: [],
    forumId: null
  })

  // 方法
  const performSearch = async (page = 1) => {}
  const selectSuggestion = (suggestion) => {}
  const fetchSearchHistory = async () => {}
  const clearSearchHistory = async () => {}
  const changeFilter = async (filterName, value) => {}
  const changeSortBy = async (sortBy) => {}
  const changePage = async (page) => {}
  const resetSearch = () => {}

  // 计算属性
  const pageInfo = computed(() => ({ ... }))
  const showNoResults = computed(() => ({ ... }))
  const resultStats = computed(() => ({ ... }))

  return { ... }
}
```

### 搜索页面示例（SearchPage.vue）

```vue
<template>
  <div class="search-page">
    <!-- 搜索框 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索帖子、用户、标签..."
        clearable
        @clear="resetSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <!-- 搜索建议 -->
      <div v-if="showSuggestions && suggestions.length > 0" class="suggestions">
        <div
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion.text }}
          <span class="count">{{ suggestion.count }}</span>
        </div>
      </div>
    </div>

    <!-- 搜索历史和热门搜索 -->
    <div v-if="!hasSearched" class="search-init">
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="history-section">
        <h3>搜索历史</h3>
        <div class="history-tags">
          <el-tag
            v-for="(item, index) in searchHistory.slice(0, 10)"
            :key="index"
            closable
            @click="selectSuggestion({ text: item.keyword })"
            @close="removeFromHistory(index)"
          >
            {{ item.keyword }}
          </el-tag>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div v-if="trendingSearches.length > 0" class="trending-section">
        <h3>热门搜索</h3>
        <div class="trending-list">
          <div
            v-for="(item, index) in trendingSearches.slice(0, 10)"
            :key="index"
            class="trending-item"
            @click="selectSuggestion({ text: item.keyword })"
          >
            <span class="rank">{{ item.rank }}</span>
            <span class="keyword">{{ item.keyword }}</span>
            <span class="trend" :class="item.trend">
              {{ item.changePercent }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="hasSearched" class="search-results">
      <!-- 结果统计 -->
      <div class="result-stats">{{ resultStats }}</div>

      <!-- 高级搜索过滤 -->
      <div class="filters">
        <el-select v-model="filters.type" @change="changeFilter('type', $event)">
          <el-option label="全部" value="all" />
          <el-option label="帖子" value="post" />
          <el-option label="用户" value="user" />
          <el-option label="标签" value="tag" />
        </el-select>

        <el-select v-model="filters.sortBy" @change="changeSortBy($event)">
          <el-option label="相关度" value="relevance" />
          <el-option label="最新" value="latest" />
          <el-option label="最热" value="hot" />
          <el-option label="浏览量" value="views" />
        </el-select>

        <el-date-picker v-model="dateRange" type="daterange" />
      </div>

      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="5" animated />

      <!-- 空结果 -->
      <el-empty v-if="showNoResults" description="未找到相关内容" />

      <!-- 结果列表 -->
      <div v-if="searchResults.length > 0" class="results-list">
        <search-result-item
          v-for="result in searchResults"
          :key="result.id"
          :result="result"
        />
      </div>

      <!-- 分页 -->
      <div v-if="pageInfo.pages > 1" class="pagination">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalResults"
          @current-change="changePage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSearch } from '@/composables/useSearch'
import { onMounted } from 'vue'

const {
  searchKeyword,
  searchResults,
  searchHistory,
  trendingSearches,
  suggestions,
  showSuggestions,
  loading,
  hasSearched,
  currentPage,
  pageSize,
  totalResults,
  pageInfo,
  showNoResults,
  resultStats,
  filters,
  performSearch,
  selectSuggestion,
  removeFromHistory,
  changeSortBy,
  changePage,
  resetSearch,
  initialize
} = useSearch()

onMounted(() => {
  initialize()
})
</script>

<style scoped>
.search-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-bar {
  position: relative;
  margin-bottom: 30px;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: #f5f5f5;
  }

  .count {
    font-size: 12px;
    color: #999;
  }
}

.search-init {
  background: #fafafa;
  padding: 40px;
  border-radius: 8px;

  h3 {
    margin: 30px 0 15px 0;
    font-size: 16px;
    color: #333;
  }
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  :deep(.el-tag) {
    cursor: pointer;
  }
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trending-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #f0f0f0;
  }

  .rank {
    width: 30px;
    font-weight: bold;
    color: #409eff;
    font-size: 18px;
  }

  .keyword {
    flex: 1;
    margin-left: 16px;
  }

  .trend {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 2px;
    background: #f0f0f0;

    &.up {
      color: #f5222d;
      background: #fff1f0;
    }

    &.down {
      color: #52c41a;
    }

    &.stable {
      color: #666;
    }
  }
}

.search-results {
  .result-stats {
    margin-bottom: 20px;
    color: #666;
    font-size: 14px;
  }

  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 30px;
  }
}
</style>
```

---

## 数据库设计

### 搜索历史表

```sql
CREATE TABLE search_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  keyword VARCHAR(255) NOT NULL,
  result_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at)
);
```

### 搜索索引（用于全文搜索）

```sql
-- MySQL 全文索引
ALTER TABLE posts ADD FULLTEXT INDEX ft_search (title, content);
ALTER TABLE comments ADD FULLTEXT INDEX ft_search (content);

-- 或使用 Elasticsearch
-- 需在后端配置 ES 连接
```

---

## 最佳实践

### 1. 去抖动搜索

```javascript
// 300ms 延迟，避免频繁调用 API
const debouncedSearch = debounceFn(async () => {
  await performSearch()
}, 300)

watch(searchKeyword, () => {
  debouncedSearch()
})
```

### 2. 缓存结果

```javascript
// 同一关键词 + 过滤条件的搜索结果缓存 3 分钟
const key = `search:${keyword}:${JSON.stringify(params)}`
return this.getCached(key, fetcher, 3 * 60 * 1000)
```

### 3. 搜索历史管理

```javascript
// 本地保存（localStorage）+ 云端同步
const addToSearchHistory = async (keyword) => {
  // 本地存储
  let history = JSON.parse(localStorage.getItem('search_history') || '[]')
  history = history.filter(h => h.keyword !== keyword)
  history.unshift({ keyword, timestamp: Date.now() })
  history = history.slice(0, 30)
  localStorage.setItem('search_history', JSON.stringify(history))

  // 云端同步
  await api.recordSearchHistory(keyword)
}
```

### 4. 关键词高亮

```javascript
// 返回结果中高亮匹配的关键词
const highlights = {
  title: "如何深入理解 **Vue 3** 的响应式系统？",
  content: "...讨论 **Vue 3** 的特性..."
}

// 前端渲染
<div v-html="highlightKeywords(result.title, keyword)" />
```

---

## 后端实现示例（Java/Spring）

```java
@RestController
@RequestMapping("/api/community/search")
public class SearchController {

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "relevance") String sortBy,
            @RequestParam(defaultValue = "all") String type) {

        // 使用 Elasticsearch 进行全文搜索
        SearchResults results = searchService.search(q, page, pageSize, sortBy, type);
        return ResponseEntity.ok(new ApiResponse(results));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> suggestions(@RequestParam String q) {
        List<Suggestion> suggestions = searchService.getSuggestions(q);
        return ResponseEntity.ok(new ApiResponse(suggestions));
    }

    @GetMapping("/trending")
    public ResponseEntity<?> trending() {
        List<TrendingSearch> trending = searchService.getTrendingSearches();
        return ResponseEntity.ok(new ApiResponse(trending));
    }
}
```

---

## 常见问题

### Q: 如何实现全文搜索？

**A:**
1. **MySQL**: 使用 FULLTEXT 索引 (简单但功能有限)
2. **Elasticsearch**: 专业搜索引擎 (推荐，功能强大)
3. **Solr**: 另一个搜索引擎选项
4. **Algolia**: 第三方搜索服务

### Q: 搜索结果排序如何实现？

**A:**
- **相关度**: 使用 BM25 算法评分
- **最新**: ORDER BY created_at DESC
- **最热**: 根据点赞+评论数排序
- **浏览量**: ORDER BY view_count DESC

### Q: 如何处理拼写错误？

**A:**
1. **模糊匹配**: 使用 Levenshtein 距离
2. **自动纠正**: 维护常见错误字典
3. **建议修正**: 搜索建议中展示可能的正确拼写

### Q: 搜索性能如何优化？

**A:**
1. 使用专业搜索引擎 (Elasticsearch)
2. 添加适当的数据库索引
3. 缓存热门搜索结果
4. 异步处理搜索分析
5. 使用 CDN 分发搜索结果

---

## 文件清单

### 前端文件

```
frontend/src/
├── composables/
│   └── useSearch.js                (400 行)
├── views/
│   ├── SearchPage.vue              (待创建)
│   └── components/
│       ├── SearchBar.vue           (待创建)
│       ├── SearchResults.vue       (待创建)
│       ├── SearchResultItem.vue    (待创建)
│       └── SearchFilters.vue       (待创建)
└── api/
    └── communityWithCache.js       (已更新 with search methods)
```

---

**更新时间**：2025-11-11
**版本**：1.0
**状态**：✅ 前端完全实现，待后端对接
