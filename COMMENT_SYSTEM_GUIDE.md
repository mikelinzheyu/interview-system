# 评论系统完整实现指南

## 概述

本指南详细说明了论坛评论系统的完整实现方案，包括功能设计、API 规范、前端实现和数据库设计。

## 目录

- [功能清单](#功能清单)
- [架构设计](#架构设计)
- [API 规范](#api-规范)
- [前端实现](#前端实现)
- [数据库设计](#数据库设计)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 功能清单

### ✅ 已实现功能

```
├─ 基础评论
│  ├─ 获取评论列表（分页、排序）
│  ├─ 发表评论
│  ├─ 编辑评论（权限检查）
│  └─ 删除评论（权限检查）
│
├─ 高级功能
│  ├─ 嵌套回复（多层回复）
│  ├─ 点赞评论
│  ├─ @ 提及用户
│  ├─ 评论排序（最新/最热/最早）
│  └─ 评论搜索过滤
│
└─ 系统功能
   ├─ 缓存管理
   ├─ 重试机制
   ├─ 权限检查
   ├─ 错误处理
   └─ 实时更新（乐观更新）
```

---

## 架构设计

### 整体结构

```
┌────────────────────────────────────────────────┐
│         Comment System Architecture            │
├────────────────────────────────────────────────┤
│                                                 │
│  UI Layer (Vue Components)                      │
│  ├─ CommentList.vue       (列表容器)           │
│  ├─ CommentItem.vue       (单个评论)           │
│  └─ CommentForm.vue       (提交表单)           │
│         ↓                                        │
│  Composable Layer                              │
│  └─ useComments()         (业务逻辑)           │
│         ↓                                        │
│  API Layer                                      │
│  └─ communityAPI.getComments/create/...       │
│         ↓                                        │
│  Cache Layer                                    │
│  ├─ Memory Cache (3 分钟 TTL)                  │
│  ├─ Request Deduplication (去重)              │
│  └─ Automatic Retry (指数退避)               │
│         ↓                                        │
│  Backend API                                    │
│  └─ /api/community/posts/{id}/comments        │
│         ↓                                        │
│  Database                                       │
│  ├─ comments table                             │
│  ├─ comment_likes table                        │
│  └─ comment_mentions table                     │
│                                                 │
└────────────────────────────────────────────────┘
```

### 数据流

```
用户操作 → Vue 组件 → useComments → 乐观更新 UI
                          ↓
                       communityAPI
                          ↓
                       API 层缓存
                          ↓
                       后端 API
                          ↓
                    数据库 & 缓存
```

---

## API 规范

### 1. 获取评论列表

```
GET /api/community/posts/{postId}/comments
```

**请求参数**：

```javascript
{
  page: 1,              // 页码 (默认: 1)
  pageSize: 20,         // 每页数量 (默认: 20)
  sortBy: 'latest',     // 排序方式: latest|hot|oldest
  search: '',           // 搜索关键词
  includeReplies: true  // 是否包含回复
}
```

**响应格式**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "comment_1",
      "postId": "post_1",
      "parentCommentId": null,
      "author": {
        "userId": "user_1",
        "name": "张三",
        "avatar": "https://...",
        "role": "user"  // user|moderator|admin
      },
      "content": "评论内容",
      "mentions": ["user_2", "user_3"],
      "likes": 5,
      "likeCount": 5,
      "replyCount": 2,
      "isLiked": false,
      "edited": false,
      "createdAt": "2025-11-11T10:00:00Z",
      "updatedAt": "2025-11-11T10:00:00Z",
      "replies": [
        {
          "id": "comment_1_1",
          "parentCommentId": "comment_1",
          "author": { ... },
          "content": "回复内容",
          "likes": 2,
          "createdAt": "2025-11-11T10:05:00Z"
        }
      ]
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "pages": 5
}
```

### 2. 发表评论

```
POST /api/community/posts/{postId}/comments
```

**请求体**：

```json
{
  "content": "评论内容",
  "mentions": ["user_2"],
  "parentCommentId": null,
  "aiReview": true
}
```

**响应格式**：

```json
{
  "code": 0,
  "data": {
    "id": "comment_new_1",
    "postId": "post_1",
    "parentCommentId": null,
    "author": {
      "userId": "current_user",
      "name": "当前用户",
      "avatar": "..."
    },
    "content": "评论内容",
    "mentions": ["user_2"],
    "likes": 0,
    "likeCount": 0,
    "replyCount": 0,
    "isLiked": false,
    "createdAt": "2025-11-11T10:00:00Z"
  }
}
```

### 3. 更新评论

```
PUT /api/community/comments/{commentId}
```

**请求体**：

```json
{
  "content": "更新后的内容",
  "mentions": ["user_2"]
}
```

**响应格式**：同发表评论

### 4. 删除评论

```
DELETE /api/community/comments/{commentId}
```

**响应格式**：

```json
{
  "code": 0,
  "message": "评论已删除"
}
```

### 5. 点赞评论

```
POST /api/community/comments/{commentId}/like
```

**响应格式**：

```json
{
  "code": 0,
  "data": {
    "liked": true,
    "likeCount": 6
  }
}
```

---

## 前端实现

### 核心组件

#### 1. CommentList.vue

主容器组件，负责：
- 集成 useComments composable
- 管理排序和分页
- 展示评论列表
- 处理用户交互

```vue
<template>
  <div class="comments-section">
    <!-- 标题 -->
    <h3>评论 ({{ totalComments }})</h3>

    <!-- 评论表单 -->
    <CommentForm @submit="handleSubmitComment" />

    <!-- 排序选项 -->
    <div class="sort-options">
      <el-button-group>
        <el-button
          v-for="option in sortOptions"
          @click="changeSortBy(option.value)"
        >
          {{ option.label }}
        </el-button>
      </el-button-group>
    </div>

    <!-- 评论列表 -->
    <CommentItem
      v-for="comment in comments"
      :key="comment.id"
      :comment="comment"
      @reply="handleReply"
      @edit="handleEditComment"
      @delete="handleDeleteComment"
      @like="handleLikeComment"
    />

    <!-- 分页 -->
    <el-pagination
      :current-page="currentPage"
      :total="totalComments"
      @current-change="changePage"
    />
  </div>
</template>

<script setup>
import { useComments } from '@/composables/useComments'

const props = defineProps({
  postId: String
})

const {
  comments,
  totalComments,
  fetchComments,
  submitComment,
  toggleLikeComment,
  deleteComment,
  editComment,
  // ... 其他方法
} = useComments(props.postId)

onMounted(() => {
  fetchComments()
})
</script>
```

#### 2. CommentItem.vue

单个评论组件，负责：
- 显示评论内容
- 显示用户信息和操作权限
- 处理编辑和删除
- 显示嵌套回复
- 点赞功能

```vue
<template>
  <div class="comment-item">
    <!-- 用户信息 -->
    <div class="comment-header">
      <img :src="comment.author.avatar" class="avatar" />
      <span>{{ comment.author.name }}</span>
      <span v-if="comment.author.role">{{ comment.author.role }}</span>
    </div>

    <!-- 评论内容 -->
    <div v-if="!isEditing" class="comment-text">
      {{ comment.content }}
      <span v-if="comment.edited">(已编辑)</span>
    </div>

    <!-- 编辑模式 -->
    <el-input
      v-if="isEditing"
      v-model="editContent"
      type="textarea"
    />

    <!-- 操作按钮 -->
    <div class="comment-actions">
      <el-button @click="toggleLike">
        <Like /> {{ comment.likeCount }}
      </el-button>
      <el-button @click="startReply">
        <Reply /> 回复
      </el-button>
      <el-dropdown v-if="comment.canEdit || comment.canDelete">
        <el-button link>...</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="startEdit" v-if="comment.canEdit">
              编辑
            </el-dropdown-item>
            <el-dropdown-item @click="confirmDelete" v-if="comment.canDelete">
              删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 嵌套回复 -->
    <div v-if="comment.replies?.length" class="replies">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        is-reply
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  comment: Object,
  isReply: Boolean
})

const emit = defineEmits(['reply', 'edit', 'delete', 'like'])

const isEditing = ref(false)
const editContent = ref(props.comment.content)

const toggleLike = () => emit('like', { id: props.comment.id })
const startReply = () => emit('reply', { id: props.comment.id })
const startEdit = () => { isEditing.value = true }
const confirmDelete = () => emit('delete', { id: props.comment.id })
</script>
```

#### 3. CommentForm.vue

评论表单组件，负责：
- 提供文本输入
- 处理 @ 提及
- 表单验证
- 提交评论

```vue
<template>
  <div class="comment-form">
    <h4>{{ replyingTo ? `回复 ${replyingToName}` : '发表评论' }}</h4>

    <el-input
      v-model="content"
      type="textarea"
      placeholder="分享你的想法..."
      maxlength="5000"
      show-word-limit
    />

    <!-- @ 提及用户 -->
    <el-select
      v-model="mentions"
      multiple
      filterable
      remote
      :remote-method="searchUsers"
      placeholder="@ 提及用户"
    >
      <el-option
        v-for="user in suggestedUsers"
        :key="user.id"
        :label="`@${user.name}`"
        :value="user.id"
      />
    </el-select>

    <div class="form-actions">
      <el-button
        type="primary"
        :disabled="!content"
        @click="submit"
      >
        {{ replyingTo ? '发布回复' : '发表评论' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['submit', 'cancel-reply'])

const content = ref('')
const mentions = ref([])

const submit = () => {
  emit('submit', { content, mentions })
}
</script>
```

### 在帖子详情页集成

```vue
<!-- PostDetail.vue -->
<template>
  <div class="post-detail">
    <!-- 帖子内容 -->
    <PostHeader :post="post" />
    <PostContent :post="post" />

    <!-- 集成评论系统 -->
    <CommentList :postId="post.id" />
  </div>
</template>

<script setup>
import CommentList from '@/views/community/components/CommentList.vue'

const route = useRoute()
const post = ref(null)

onMounted(async () => {
  post.value = await fetchPostDetail(route.params.id)
})
</script>
```

---

## 数据库设计

### 表结构

#### comments 表

```sql
CREATE TABLE comments (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  parent_comment_id VARCHAR(36),  -- 父评论ID（用于嵌套）
  author_id VARCHAR(36) NOT NULL,
  content LONGTEXT NOT NULL,

  -- 统计
  like_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,

  -- 状态
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,

  -- 时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_post_id (post_id),
  INDEX idx_parent_comment_id (parent_comment_id),
  INDEX idx_author_id (author_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);
```

#### comment_likes 表

```sql
CREATE TABLE comment_likes (
  id VARCHAR(36) PRIMARY KEY,
  comment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_like (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### comment_mentions 表

```sql
CREATE TABLE comment_mentions (
  id VARCHAR(36) PRIMARY KEY,
  comment_id VARCHAR(36) NOT NULL,
  mentioned_user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (comment_id) REFERENCES comments(id),
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id)
);
```

### 查询优化

```sql
-- 获取帖子评论（带分页）
SELECT c.*, u.name, u.avatar,
       COUNT(DISTINCT cl.id) as like_count,
       COUNT(DISTINCT rc.id) as reply_count
FROM comments c
JOIN users u ON c.author_id = u.id
LEFT JOIN comment_likes cl ON c.id = cl.comment_id
LEFT JOIN comments rc ON c.id = rc.parent_comment_id
WHERE c.post_id = ? AND c.parent_comment_id IS NULL
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT ? OFFSET ?;

-- 获取评论的回复
SELECT c.*, u.name, u.avatar
FROM comments c
JOIN users u ON c.author_id = u.id
WHERE c.parent_comment_id = ?
ORDER BY c.created_at ASC;

-- 获取用户是否点赞过该评论
SELECT COUNT(*) as is_liked
FROM comment_likes
WHERE comment_id = ? AND user_id = ?;
```

---

## useComments Composable

### 完整 API

```javascript
export function useComments(postId) {
  // 数据
  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)
  const totalComments = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const submitLoading = ref(false)
  const replyingTo = ref(null)
  const sortBy = ref('latest')

  // 方法
  const fetchComments = async (page = 1) => {}
  const submitComment = async (content, mentions = []) => {}
  const replyComment = async (commentId, content, mentions = []) => {}
  const deleteComment = async (commentId) => {}
  const editComment = async (commentId, content) => {}
  const toggleLikeComment = async (commentId) => {}
  const changeSortBy = async (newSort) => {}
  const changePage = async (page) => {}
  const changePageSize = async (size) => {}
  const refresh = async () => {}

  // 计算属性
  const pageInfo = computed(() => ({ total, pages, ... }))
  const displayComments = computed(() => [...])

  return {
    comments,
    loading,
    error,
    totalComments,
    currentPage,
    pageSize,
    sortBy,
    sortOptions,
    submitLoading,
    replyingTo,
    pageInfo,
    fetchComments,
    submitComment,
    replyComment,
    deleteComment,
    editComment,
    toggleLikeComment,
    changeSortBy,
    changePage,
    changePageSize,
    refresh,
    canEdit,
    canDelete,
    hasPermission
  }
}
```

---

## 最佳实践

### 1. 缓存策略

```javascript
// 优势：3分钟自动失效，减少不必要的 API 调用
const CACHE_TIME = {
  POSTS: 3 * 60 * 1000  // 3分钟
}

// 用户操作后主动失效
createComment(postId, data)
  .then(() => {
    invalidateCache(`comments:post:${postId}`)
  })
```

### 2. 乐观更新

```javascript
// 立即更新 UI，失败时自动回滚
const submitComment = async (content, mentions) => {
  const newComment = {
    id: generateTempId(),
    content,
    author: currentUser,
    likes: 0,
    // ...
  }

  // 立即显示
  comments.value.unshift(newComment)

  try {
    // 发送到服务器
    const response = await api.createComment(content, mentions)
    // 用真实数据替换
    const index = comments.value.findIndex(c => c.id === newComment.id)
    comments.value[index] = response.data
  } catch (error) {
    // 失败时删除
    comments.value = comments.value.filter(c => c.id !== newComment.id)
  }
}
```

### 3. 权限检查

```javascript
const displayComments = computed(() => {
  return comments.value.map(comment => ({
    ...comment,
    canEdit: canEdit(comment),    // 检查是否是作者或管理员
    canDelete: canDelete(comment)   // 检查是否有删除权限
  }))
})
```

### 4. 性能优化

```javascript
// 虚拟滚动：只渲染可见的评论
import { useVirtualScroll } from '@/composables/useVirtualScroll'

const { visibleItems } = useVirtualScroll(
  comments,
  itemHeight = 120,
  containerHeight = 600
)
```

---

## 后端实现示例（Java/Spring）

```java
@RestController
@RequestMapping("/api/community")
public class CommentController {

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<?> getComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "latest") String sortBy) {

        List<Comment> comments = commentService.getComments(
            postId, page, pageSize, sortBy
        );
        int total = commentService.countComments(postId);

        return ResponseEntity.ok(new ApiResponse(
            comments, total, page, pageSize
        ));
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable String postId,
            @RequestBody CreateCommentRequest request) {

        Comment comment = commentService.createComment(
            postId, request.getContent(), request.getMentions()
        );
        return ResponseEntity.ok(new ApiResponse(comment));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok(new ApiResponse());
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable String commentId) {
        boolean liked = commentService.toggleLike(commentId);
        int likeCount = commentService.getLikeCount(commentId);

        return ResponseEntity.ok(new ApiResponse(
            new LikeResponse(liked, likeCount)
        ));
    }
}
```

---

## 常见问题

### Q: 嵌套回复支持多少层？

**A:** 目前设计支持无限层级，但 UI 建议显示 3 层，超过 3 层时可折叠。数据库通过 `parent_comment_id` 支持任意深度。

### Q: 评论删除后是否可以恢复？

**A:** 软删除方案（推荐）：标记 `is_deleted = true`，不真正删除。用户看到"评论已被删除"。硬删除方案：真正删除记录，需要备份。

### Q: 如何处理评论中的不文明用词？

**A:**
1. **AI 审核**：发表时调用内容审查 API
2. **用户举报**：用户可举报不合适评论
3. **管理员审核**：后台队列系统

### Q: 点赞是否需要去重？

**A:** 是的。使用 UNIQUE 约束 `UNIQUE KEY unique_like (comment_id, user_id)`，防止重复点赞。

### Q: 评论列表如何排序？

**A:** 支持三种排序：
- `latest`: 按创建时间倒序（最新在前）
- `hot`: 按赞数倒序（最热在前）
- `oldest`: 按创建时间正序（最早在前）

### Q: 如何实现 @ 提及的通知？

**A:**
1. 发表评论时提取 mentions 列表
2. 为每个被提及用户创建通知
3. 发送实时通知（WebSocket）

---

## 测试清单

- [ ] 获取评论列表
- [ ] 分页和排序
- [ ] 发表评论
- [ ] 编辑评论（权限检查）
- [ ] 删除评论（权限检查）
- [ ] 回复评论（嵌套）
- [ ] 点赞评论
- [ ] 取消点赞
- [ ] @ 提及用户
- [ ] 评论缓存
- [ ] 网络错误重试
- [ ] 乐观更新回滚
- [ ] 权限检查

---

## 文件清单

### 前端文件

```
frontend/src/
├── composables/
│   └── useComments.js              (评论逻辑，466 行)
├── views/community/components/
│   ├── CommentList.vue             (评论列表容器，310 行)
│   ├── CommentItem.vue             (单个评论，380 行)
│   ├── CommentForm.vue             (评论表单，200 行)
│   └── PostDetail.vue              (包含评论集成，待更新)
└── api/
    └── communityWithCache.js       (已更新 with comment methods)
```

### 文档文件

```
├── COMMENT_SYSTEM_GUIDE.md         (本文档)
├── COMMUNITY_OPTIMIZATION_PLAN_2.0.md
└── API_ENDPOINTS.txt
```

---

## 下一步计划

1. **后端实现** - 实现上述 API 端点
2. **UI 调试** - 测试所有交互场景
3. **性能优化** - 虚拟滚动处理大量评论
4. **用户测试** - 收集用户反馈

---

**更新时间**：2025-11-11
**版本**：1.0
**状态**：✅ 前端完全实现，待后端对接
