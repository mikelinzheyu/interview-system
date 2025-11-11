# 社区论坛（Forums）功能 - 最佳实践完善指南

## 📚 文档导航
1. [架构概述](#架构概述)
2. [API 层改进](#api-层改进)
3. [Composables 使用指南](#composables-使用指南)
4. [组件优化](#组件优化)
5. [性能优化](#性能优化)
6. [常见问题](#常见问题)
7. [代码示例](#代码示例)

---

## 架构概述

### 改进前后对比

| 方面 | 改进前 | 改进后 |
|-----|-------|-------|
| **数据缓存** | 无 | ✅ 多层缓存 + TTL |
| **错误处理** | 基础 | ✅ 重试机制 + 降级方案 |
| **代码组织** | 分散 | ✅ Composables 集中管理 |
| **权限控制** | 无 | ✅ 细粒度权限检查 |
| **用户体验** | 基础 | ✅ 乐观更新 + 实时通知 |
| **性能** | 无优化 | ✅ 虚拟滚动 + 防抖节流 |

### 新增文件结构

```
src/
├── api/
│   ├── community.js                 // 原始 API（保留兼容）
│   └── communityWithCache.js         // ✨ 新增：API 缓存层
├── composables/
│   ├── useForumList.js              // ✨ 新增：论坛列表管理
│   ├── usePostList.js               // ✨ 新增：帖子列表管理
│   ├── usePostActions.js            // ✨ 新增：帖子操作
│   ├── useForumStats.js             // ✨ 新增：统计数据
│   ├── useRecommendations.js        // ✨ 新增：推荐系统
│   ├── useForumNotifications.js     // ✨ 新增：实时通知
│   ├── useAuth.js                   // ✨ 新增：权限管理
│   ├── useDebounce.js               // ✨ 新增：防抖/节流
│   └── useVirtualScroll.js          // ✨ 新增：虚拟滚动
└── views/community/
    ├── ForumList.vue                // 已优化
    ├── PostList.vue                 // 已优化
    └── components/
        └── PostCard.vue             // 已优化
```

---

## API 层改进

### 1. 缓存机制

```javascript
// src/api/communityWithCache.js

import communityAPI from '@/api/communityWithCache'

// 自动缓存，无需在组件中考虑
const res = await communityAPI.getForums()

// 支持不同 TTL
const CACHE_TIME = {
  FORUMS: 10 * 60 * 1000,      // 10分钟
  POSTS: 3 * 60 * 1000,        // 3分钟
  POST_DETAIL: 5 * 60 * 1000,  // 5分钟
  STATS: 1 * 60 * 1000         // 1分钟
}
```

### 2. 自动重试

```javascript
// 自动重试 3 次，指数退避（1秒、2秒、4秒）
// 仅重试 5xx 错误和网络错误
await communityAPI.retryRequest(fn, 3, 1000)
```

### 3. 请求去重

```javascript
// 同时发起多个相同请求时，自动去重
const promise1 = communityAPI.getPosts(params)
const promise2 = communityAPI.getPosts(params)  // 复用 promise1

await Promise.all([promise1, promise2])  // 只发送一个请求
```

### 4. 缓存失效管理

```javascript
// 创建帖子后自动清除相关缓存
await communityAPI.createPost(data)  // 自动清除 posts:list

// 手动清除缓存
communityAPI.invalidateCache('posts:list')  // 清除所有 posts:list:* 的缓存
communityAPI.clearCache()  // 清除所有缓存
```

### 5. API 统计

```javascript
const stats = communityAPI.getCacheStats()
console.log(stats)
// {
//   cacheSize: 5,
//   pendingRequests: 0,
//   cacheKeys: ['forums:list', 'posts:list:...', ...]
// }
```

---

## Composables 使用指南

### 1. useForumList - 论坛列表

```vue
<script setup>
import { useForumList } from '@/composables/useForumList'

const {
  forums,           // 论坛列表
  loading,          // 加载中
  error,            // 错误信息
  totalPosts,       // 计算属性：总帖子数
  activeForums,     // 计算属性：活跃板块数
  forumsByActivity, // 计算属性：按活跃度排序
  fetchForums,      // 方法：获取列表
  refreshForums,    // 方法：刷新（清除缓存）
  getForumById,     // 方法：按 ID 查询
  getForumBySlug    // 方法：按 slug 查询
} = useForumList()
</script>
```

### 2. usePostList - 帖子列表

```vue
<script setup>
import { usePostList } from '@/composables/usePostList'

const {
  posts,               // 帖子列表
  loading,             // 加载中
  currentPage,         // 当前页码
  pageSize,            // 页面大小
  total,               // 总数
  sortBy,              // 排序方式
  searchKeyword,       // 搜索关键词
  isEmpty,             // 计算属性：是否为空
  hasMore,             // 计算属性：是否有更多
  startIndex,          // 计算属性：开始索引
  endIndex,            // 计算属性：结束索引
  handleSearch,        // 方法：执行搜索
  handleSortChange,    // 方法：切换排序
  handlePageChange,    // 方法：翻页
  handlePageSizeChange,// 方法：改变页大小
  clearSearch,         // 方法：清空搜索
  refreshPosts,        // 方法：刷新列表
  updatePost,          // 方法：更新单个帖子
  removePost           // 方法：删除单个帖子
} = usePostList({
  defaultPageSize: 20,
  onError: (error) => console.error(error),
  autoFetch: true      // 挂载时自动获取
})
</script>
```

### 3. usePostActions - 帖子操作

```vue
<script setup>
import { usePostActions } from '@/composables/usePostActions'

const {
  likedPostIds,        // Set：点赞的帖子 ID
  likedCommentIds,     // Set：点赞的评论 ID
  canEditPost,         // 方法：检查能否编辑
  canDeletePost,       // 方法：检查能否删除
  isPostLiked,         // 方法：检查是否点赞
  isCommentLiked,      // 方法：检查评论是否点赞
  isLoading,           // 方法：检查是否在加载
  toggleLikePost,      // 方法：点赞/取消赞
  toggleLikeComment,   // 方法：点赞评论
  deletePost,          // 方法：删除帖子
  reportContent,       // 方法：举报内容
  initializeLikeStatus,// 方法：初始化点赞状态
  clearLikeStatus      // 方法：清空点赞状态
} = usePostActions()

// 乐观更新示例
await toggleLikePost(post)  // UI 即时更新，失败自动回滚
</script>
```

### 4. useForumStats - 统计数据

```vue
<script setup>
import { useForumStats } from '@/composables/useForumStats'

const {
  todayStats,      // { postsCount, onlineUsers, activeUsers, newUsers }
  loading,         // 加载中
  fetchTodayStats, // 方法：获取统计
  refreshStats,    // 方法：刷新统计
  startAutoRefresh,// 方法：启动自动刷新
  stopAutoRefresh  // 方法：停止自动刷新
} = useForumStats()

// 自动每 30 秒刷新一次统计
// onMounted 时自动启动，onUnmounted 时自动停止
</script>
```

### 5. useRecommendations - 推荐系统

```vue
<script setup>
import { useRecommendations } from '@/composables/useRecommendations'

const {
  recommendedPosts,    // 推荐的帖子列表
  loading,             // 加载中
  fetchRecommendations,// 获取推荐
  trackPostView,       // 记录浏览（用于算法学习）
  refreshRecommendations
} = useRecommendations(userId)

// 用户浏览帖子时记录
const viewStartTime = ref(Date.now())
onUnmounted(() => {
  const viewTime = Date.now() - viewStartTime.value
  trackPostView(postId, viewTime)
})
</script>
```

### 6. useForumNotifications - 实时通知

```vue
<script setup>
import { useForumNotifications } from '@/composables/useForumNotifications'

const {
  notifications,      // 通知列表
  isConnected,        // WebSocket 连接状态
  unreadCount,        // 未读数
  unreadNotifications,// 未读通知列表
  connect,            // 连接
  disconnect,         // 断开
  send,               // 发送消息
  markAsRead,         // 标记为已读
  markAllAsRead,      // 标记全部已读
  clearNotifications  // 清空通知
} = useForumNotifications(userId)

// 自动连接和断开
// 支持自动重连（3秒尝试一次）
</script>
```

### 7. useAuth - 权限管理

```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const {
  currentUser,        // 当前用户对象
  isLoggedIn,         // 是否登录
  isAdmin,            // 是否管理员
  hasPermission,      // 检查权限
  canEdit,            // 能否编辑资源
  canDelete,          // 能否删除资源
  canModerate,        // 能否审核
  canAccessAdmin,     // 能否访问后台
  setCurrentUser      // 设置用户
} = useAuth()

// 权限检查
if (canEdit(post, currentUser)) {
  // 显示编辑按钮
}
</script>
```

### 8. useDebounce - 防抖/节流

```javascript
import { useDebounceFn, useThrottle } from '@/composables/useDebounce'

// 防抖搜索（延迟 500ms 执行）
const debouncedSearch = useDebounceFn(() => {
  handleSearch()
}, 500)

// 使用
input.addEventListener('input', debouncedSearch)

// 取消防抖
debouncedSearch.cancel()

// 立即执行
debouncedSearch.flush()

// 节流（每 500ms 最多执行一次）
const throttledScroll = useThrottle(() => {
  handleScroll()
}, 500)
```

### 9. useVirtualScroll - 虚拟滚动

```vue
<template>
  <div
    class="virtual-list"
    ref="containerRef"
    @scroll="handleScroll"
    :style="{ height: actualContainerHeight + 'px' }"
  >
    <div :style="{ height: totalHeight + 'px' }">
      <div
        v-for="(item, index) in visibleItems"
        :key="item.id"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useVirtualScroll } from '@/composables/useVirtualScroll'

const {
  containerRef,
  visibleItems,
  handleScroll,
  scrollToIndex,
  scrollToTop,
  scrollToBottom
} = useVirtualScroll(items, 100, 600)
</script>
```

---

## 组件优化

### 1. ForumList.vue 改进

```vue
<script setup>
import { useForumList } from '@/composables/useForumList'
import { useForumStats } from '@/composables/useForumStats'

const { forums, loading, totalPosts, activeForums } = useForumList()
const { todayStats } = useForumStats()

// 统计数据现在是实时的！（每 30 秒自动更新）
</script>

<template>
  <!-- 显示实时统计 -->
  <el-statistic title="今日新帖" :value="todayStats.postsCount" />
  <el-statistic title="在线用户" :value="todayStats.onlineUsers" />
</template>
```

### 2. PostList.vue 改进

```vue
<script setup>
import { usePostList } from '@/composables/usePostList'
import { usePostActions } from '@/composables/usePostActions'

const {
  posts,
  loading,
  currentPage,
  pageSize,
  total,
  isEmpty,
  handlePageChange,
  handlePageSizeChange,
  handleSearch,
  handleSortChange
} = usePostList()

const { toggleLikePost } = usePostActions()

// 所有列表操作都自动处理了：
// - 缓存管理
// - 错误处理
// - 路由同步
// - 状态管理
</script>
```

### 3. PostCard.vue 改进

```vue
<script setup>
import { usePostActions } from '@/composables/usePostActions'
import { useAuth } from '@/composables/useAuth'

const { canEdit, canDelete } = useAuth()
const { toggleLikePost, reportContent } = usePostActions()

// 新增功能：
// ✅ 编辑帖子
// ✅ 删除帖子
// ✅ 举报内容
// ✅ 分享帖子（Web Share API + 降级）
// ✅ 收藏帖子
// ✅ 乐观更新点赞（失败自动回滚）
// ✅ 权限检查
</script>
```

---

## 性能优化

### 1. 缓存优化

```javascript
// 问题：频繁的网络请求
const forum1 = await getForums()  // 请求 1
const forum2 = await getForums()  // 请求 2（重复）

// 解决：自动缓存 + 去重
const forum1 = await communityAPI.getForums()  // 请求 1
const forum2 = await communityAPI.getForums()  // 复用缓存（无请求）

// 同时发送多个相同请求时自动去重
const [f1, f2] = await Promise.all([
  communityAPI.getForums(),
  communityAPI.getForums()
])  // 只发送 1 个请求
```

### 2. 防抖优化

```vue
<template>
  <!-- 问题：每输入一个字符都发一个请求 -->
  <el-input @input="handleSearch" />

  <!-- 解决：防抖搜索 -->
  <el-input @input="debouncedSearch" />
</template>

<script setup>
import { useDebounceFn } from '@/composables/useDebounce'

const debouncedSearch = useDebounceFn(() => {
  handleSearch()
}, 300)  // 停止输入 300ms 后执行搜索
</script>
```

### 3. 虚拟滚动

```javascript
// 问题：渲染 10000 个列表项，页面卡顿
// 解决：只渲染可见区域的项（通常 20-50 个）

import { useVirtualScroll } from '@/composables/useVirtualScroll'

// 即使有 10000 个项目，也只渲染可见的 50 个
// 轻松达到 60fps
const { visibleItems } = useVirtualScroll(items, itemHeight)
```

### 4. 图片优化

```html
<!-- 问题：加载高分辨率原图 -->
<img src="avatar.jpg" />

<!-- 解决：WebP 格式 + 懒加载 -->
<picture>
  <source srcset="avatar.webp" type="image/webp" />
  <img src="avatar.jpg" loading="lazy" />
</picture>
```

### 5. 代码分割

```javascript
// 动态导入大型组件
const PostDetail = defineAsyncComponent(() =>
  import('@/views/community/PostDetail.vue')
)
```

---

## 常见问题

### Q1: 如何禁用缓存？

```javascript
// 方案 1：清除缓存后重新获取
communityAPI.invalidateCache('forums')
const res = await communityAPI.getForums()

// 方案 2：自定义 TTL = 0（不缓存）
const res = await communityAPI.getCached(
  'forums',
  () => api.get('/forums'),
  0  // TTL = 0
)
```

### Q2: 如何处理缓存过期？

```javascript
// 自动处理：超过 TTL 时自动移除
// 手动处理：
communityAPI.invalidateCache('pattern')  // 清除匹配的缓存
communityAPI.clearCache()                // 清除所有缓存
```

### Q3: 点赞失败了怎么办？

```javascript
// 自动处理：乐观更新失败时自动回滚
await toggleLikePost(post)
// 如果请求失败：
// 1. UI 自动恢复到点赞前状态
// 2. 显示错误提示
// 3. 用户可以重试
```

### Q4: 如何实现搜索防抖？

```vue
<script setup>
import { useDebounceFn } from '@/composables/useDebounce'

const debouncedSearch = useDebounceFn(() => {
  handleSearch()
}, 500)
</script>

<template>
  <!-- 停止输入 500ms 后执行搜索 -->
  <el-input @input="debouncedSearch" placeholder="搜索帖子..." />
</template>
```

### Q5: 权限检查总是返回 false？

```javascript
// 确保已登录并设置了用户信息
import { useAuth } from '@/composables/useAuth'

const { setCurrentUser } = useAuth()

// 在登录后设置用户
setCurrentUser({
  id: '123',
  name: '张三',
  isAdmin: false,
  permissions: ['read_posts', 'create_posts']
})
```

---

## 代码示例

### 完整示例：论坛首页

```vue
<template>
  <div class="forum-page">
    <!-- 统计卡片 -->
    <el-card class="stats-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic
            title="总帖子数"
            :value="totalPosts"
            suffix="篇"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="活跃板块"
            :value="activeForums"
            suffix="个"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="今日新帖"
            :value="todayStats.postsCount"
            suffix="篇"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="在线用户"
            :value="todayStats.onlineUsers"
            suffix="人"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 论坛列表 -->
    <el-card class="forums-card">
      <template #header>
        <div class="card-header">
          <span>讨论板块</span>
          <el-button type="primary" @click="$router.push('/community/create-post')">
            发布新帖
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <forum-item
          v-for="forum in forums"
          :key="forum.id"
          :forum="forum"
          @click="$router.push(`/community/forums/${forum.slug}`)"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useForumList } from '@/composables/useForumList'
import { useForumStats } from '@/composables/useForumStats'

const { forums, loading, totalPosts, activeForums } = useForumList()
const { todayStats } = useForumStats()
</script>
```

### 完整示例：帖子列表页面

```vue
<template>
  <div class="posts-page">
    <!-- 控制栏 -->
    <div class="controls">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索帖子..."
        @keyup.enter="handleSearch"
      />
      <el-select v-model="sortBy" @change="handleSortChange">
        <el-option label="最新" value="latest" />
        <el-option label="最热" value="hot" />
      </el-select>
      <el-button type="primary" @click="handleRefresh">刷新</el-button>
    </div>

    <!-- 帖子列表 -->
    <div v-loading="loading">
      <post-card
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like="toggleLikePost"
      />
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePostList } from '@/composables/usePostList'
import { usePostActions } from '@/composables/usePostActions'

const {
  posts,
  loading,
  currentPage,
  pageSize,
  total,
  sortBy,
  searchKeyword,
  handleSearch,
  handleSortChange,
  handlePageChange,
  handlePageSizeChange,
  refreshPosts
} = usePostList()

const { toggleLikePost } = usePostActions()

const handleRefresh = async () => {
  await refreshPosts()
  ElMessage.success('刷新成功')
}
</script>
```

---

## 总结

### ✅ 已完成的改进

- [x] API 缓存 + 重试 + 去重机制
- [x] Composables 提取通用逻辑
- [x] 权限控制 + 乐观更新
- [x] 实时统计数据
- [x] 防抖/节流优化
- [x] 虚拟滚动支持
- [x] WebSocket 实时通知
- [x] 推荐系统框架
- [x] 完整的错误处理

### 🚀 下一步建议

1. **测试**：为 composables 编写单元测试
2. **文档**：完善 API 文档和使用示例
3. **监控**：添加性能监控和分析
4. **优化**：根据真实数据优化 TTL 时间
5. **扩展**：添加更多高级功能

### 📖 相关资源

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Element Plus 文档](https://element-plus.org/)
- [Web API 最佳实践](https://developer.mozilla.org/)
- [性能优化指南](https://web.dev/performance/)

---

**最后更新**：2025-11-11
**版本**：1.0
**作者**：Claude Code
