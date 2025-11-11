# 论坛功能 - 快速参考指南

## 🎯 快速开始

### 1. 获取论坛列表
```javascript
import { useForumList } from '@/composables/useForumList'

const { forums, loading } = useForumList()
// ✅ 自动缓存，支持刷新
```

### 2. 获取帖子列表
```javascript
import { usePostList } from '@/composables/usePostList'

const { posts, loading, currentPage, total } = usePostList()
// ✅ 自动分页、搜索、排序
```

### 3. 点赞帖子
```javascript
import { usePostActions } from '@/composables/usePostActions'

const { toggleLikePost } = usePostActions()
await toggleLikePost(post)
// ✅ 乐观更新，失败自动回滚
```

### 4. 检查权限
```javascript
import { useAuth } from '@/composables/useAuth'

const { canEdit, canDelete } = useAuth()
if (canEdit(post)) { /* 显示编辑按钮 */ }
```

---

## 📋 Composables 对照表

| Composable | 主要功能 | 自动初始化 |
|-----------|--------|---------|
| `useForumList` | 论坛列表管理 | ✅ |
| `usePostList` | 帖子列表管理 | ✅ |
| `usePostActions` | 点赞、删除、举报 | ❌ |
| `useForumStats` | 实时统计数据 | ✅ |
| `useRecommendations` | 推荐系统 | ✅ |
| `useForumNotifications` | 实时通知 | ✅ |
| `useAuth` | 权限管理 | ❌ |
| `useDebounce` | 防抖/节流 | ❌ |
| `useVirtualScroll` | 虚拟滚动 | ❌ |

---

## 🔗 API 方法一览

### communityAPI 方法

```javascript
import communityAPI from '@/api/communityWithCache'

// 查询方法（有缓存）
await communityAPI.getForums()
await communityAPI.getForumPosts(slug, params)
await communityAPI.getPosts(params)
await communityAPI.getPostDetail(id)
await communityAPI.getHotTags()
await communityAPI.getTodayStats()
await communityAPI.getRecommendedPosts(userId)

// 修改方法（无缓存，自动清除相关缓存）
await communityAPI.createPost(data)
await communityAPI.updatePost(id, data)
await communityAPI.deletePost(id)
await communityAPI.createComment(postId, data)
await communityAPI.likePost(postId)
await communityAPI.likeComment(commentId)
await communityAPI.reportContent(type, id, reason)
await communityAPI.trackPostView(postId, viewTime)

// 缓存管理
communityAPI.invalidateCache(pattern)
communityAPI.clearCache()
communityAPI.getCacheStats()
```

---

## ⚡ 常用代码片段

### 刷新列表
```javascript
const { refreshPosts } = usePostList()
await refreshPosts()  // 清除缓存并重新获取
```

### 搜索防抖
```javascript
import { useDebounceFn } from '@/composables/useDebounce'

const debouncedSearch = useDebounceFn(() => {
  handleSearch()
}, 500)

<el-input @input="debouncedSearch" />
```

### 删除帖子
```javascript
import { usePostActions } from '@/composables/usePostActions'

const { deletePost } = usePostActions()
try {
  await deletePost(postId)
  // 自动清除缓存
  removePost(postId)  // 从列表移除
} catch (error) {
  ElMessage.error(error.message)
}
```

### 举报内容
```javascript
const { reportContent } = usePostActions()
await reportContent('post', postId, 'spam')
// ✅ 自动显示提示
```

### 分享帖子
```javascript
const url = `${location.origin}/community/posts/${postId}`
if (navigator.share) {
  navigator.share({ title: 'Share', url })
} else {
  navigator.clipboard.writeText(url)
}
```

---

## 🎨 组件 Props / Emits

### PostCard Props
```javascript
{
  post: Object,      // 帖子对象
  loading: Boolean   // 加载中
}

emit: ['like', 'tag-click', 'delete']
```

### PostCard 帖子对象结构
```javascript
{
  id: string,
  title: string,
  content: string,
  author: {
    userId: string,
    name: string,
    avatar: string
  },
  tags: string[],
  likes: number,
  commentCount: number,
  viewCount: number,
  createdAt: string,
  solved: boolean,
  pinned: boolean
}
```

---

## 🐛 调试技巧

### 查看缓存状态
```javascript
const stats = communityAPI.getCacheStats()
console.table(stats.cacheKeys)
```

### 关闭缓存（开发时）
```javascript
communityAPI.clearCache()
// 每次都重新获取数据
```

### 查看网络请求
```javascript
// Chrome DevTools > Network tab
// 过滤 'posts' 或 'forums'
```

### 性能分析
```javascript
performance.mark('fetch-start')
await communityAPI.getPosts(params)
performance.mark('fetch-end')
performance.measure('fetch', 'fetch-start', 'fetch-end')
```

---

## ✅ 检查清单

### 集成新功能时：
- [ ] 使用 `communityAPI` 而不是直接 API
- [ ] 使用 composable 管理状态
- [ ] 添加错误处理和加载态
- [ ] 检查权限
- [ ] 测试缓存失效

### 性能优化：
- [ ] 大列表使用虚拟滚动
- [ ] 搜索使用防抖
- [ ] 检查缓存是否合理
- [ ] 监控加载时间

### 用户体验：
- [ ] 点赞/删除使用乐观更新
- [ ] 及时显示加载态和错误提示
- [ ] 操作后刷新相关数据
- [ ] 支持撤销重要操作

---

## 📞 常见问题速查

| 问题 | 解决方案 |
|-----|--------|
| 数据不更新 | 调用 `refreshPosts()` 清除缓存 |
| 请求太多 | 使用缓存 + 防抖 |
| 点赞失败 | 自动回滚，显示错误提示 |
| 权限不生效 | 确保设置了 `currentUser` |
| 性能差 | 对大列表使用虚拟滚动 |
| 通知不到 | 检查 WebSocket 连接状态 |

---

## 🔗 相关文件

| 文件 | 说明 |
|-----|-----|
| `/api/communityWithCache.js` | API 缓存层 |
| `/composables/useForumList.js` | 论坛列表 |
| `/composables/usePostList.js` | 帖子列表 |
| `/composables/usePostActions.js` | 帖子操作 |
| `/composables/useAuth.js` | 权限管理 |
| `/composables/useForumStats.js` | 统计数据 |
| `/composables/useForumNotifications.js` | 实时通知 |
| `/composables/useRecommendations.js` | 推荐系统 |
| `/composables/useDebounce.js` | 防抖/节流 |
| `/composables/useVirtualScroll.js` | 虚拟滚动 |
| `/views/community/ForumList.vue` | 论坛首页 |
| `/views/community/PostList.vue` | 帖子列表 |
| `/views/community/components/PostCard.vue` | 帖子卡片 |

---

**更新时间**：2025-11-11
**最后修改**：优化完善指南
