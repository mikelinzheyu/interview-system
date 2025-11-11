# 社区论坛 API 集成指南

## 当前状态

✅ **前端已完成**：
- 完整的论坛 UI 组件
- 数据获取逻辑（Composables）
- 缓存、重试、去重机制
- 模拟数据支持

❌ **后端尚需实现**：
- `/community/posts` - 获取帖子列表 (GET)
- `/community/forums/:slug/posts` - 获取板块帖子 (GET)
- `/community/posts` - 创建帖子 (POST)
- `/community/posts/:id/comments` - 发表评论 (POST)
- `/community/posts/:id/like` - 点赞 (POST)

---

## 当前使用模拟数据

当后端 API 不可用时，前端会自动使用 **Mock 数据**：

```javascript
// 文件: frontend/src/api/communityMock.js
// 包含 5 条示例帖子，支持搜索、排序、分页
```

**触发条件**：
- 后端 API 返回 404 或其他错误
- 网络请求失败
- API 不可用

**特点**：
- 透明化：前端无需修改代码
- 即插即用：有真实 API 时自动使用
- 完整功能：支持搜索、排序、分页、过滤

---

## 后端 API 实现指南

### 1. 获取所有帖子列表

```
GET /community/posts
```

**请求参数**：
```javascript
{
  page: 1,           // 页码
  pageSize: 20,      // 每页数量
  sortBy: 'latest',  // 排序方式: latest, hot, popular
  search: '',        // 搜索关键词
  tag: '',           // 标签过滤
  forumSlug: ''      // 论坛板块
}
```

**响应格式**：
```json
{
  "code": 0,
  "data": [
    {
      "id": "post_1",
      "title": "帖子标题",
      "content": "帖子内容",
      "author": {
        "userId": "user_1",
        "name": "用户名",
        "avatar": "头像URL"
      },
      "tags": ["标签1", "标签2"],
      "likes": 10,
      "commentCount": 5,
      "viewCount": 100,
      "createdAt": "2025-11-11T10:00:00Z",
      "solved": false,
      "pinned": false
    }
  ],
  "total": 100,      // 总数
  "page": 1,
  "pageSize": 20,
  "pages": 5
}
```

---

### 2. 获取板块的帖子列表

```
GET /community/forums/{slug}/posts
```

**请求参数**：同上

**响应格式**：同上

---

### 3. 创建帖子

```
POST /community/posts
```

**请求体**：
```json
{
  "title": "帖子标题",
  "content": "帖子内容",
  "forumId": "forum_1",
  "tags": ["标签1", "标签2"],
  "aiReview": true
}
```

**响应格式**：
```json
{
  "code": 0,
  "data": {
    "id": "post_1",
    "title": "...",
    "..."
  }
}
```

---

### 4. 发表评论

```
POST /community/posts/{postId}/comments
```

**请求体**：
```json
{
  "content": "评论内容"
}
```

**响应格式**：
```json
{
  "code": 0,
  "data": {
    "id": "comment_1",
    "content": "...",
    "..."
  }
}
```

---

### 5. 点赞帖子

```
POST /community/posts/{postId}/like
```

**请求体**：空

**响应格式**：
```json
{
  "code": 0,
  "data": {
    "liked": true,
    "likeCount": 11
  }
}
```

---

## 从模拟数据切换到真实 API

### 方法 1：在后端完成后（推荐）

后端实现上述 API 后，前端会**自动优先使用**真实 API：

```javascript
// 不需要修改前端代码！
// communityWithCache.js 的工作流：
// 1. 尝试调用真实 API (GET /community/posts)
// 2. 若成功 ✅ - 使用真实数据
// 3. 若失败 ❌ - 降级使用模拟数据
```

### 方法 2：手动禁用模拟数据

如果希望强制使用后端 API（不使用模拟数据），可以修改：

```javascript
// frontend/src/api/communityWithCache.js
// 在 getPosts() 方法中，注释掉模拟数据降级：

getPosts(params) {
  return this.getCached(
    key,
    () => this.retryRequest(() =>
      api({ url: '/community/posts', method: 'get', params })
      // 移除 catch 块中的模拟数据逻辑
    )
  )
}
```

---

## 现有数据构造参考

### Mock 数据来源

```javascript
// 文件: frontend/src/api/communityMock.js

mockPosts = [
  {
    id: '1',
    title: '如何深入理解 Vue 3 的响应式系统？',
    content: '今天我学习了 Vue 3 的响应式原理...',
    author: {
      userId: 'user1',
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'
    },
    tags: ['Vue3', '响应式', 'JavaScript'],
    likes: 15,
    commentCount: 3,
    viewCount: 120,
    createdAt: '2025-11-11T08:00:00Z',
    solved: false,
    pinned: false
  },
  // ... 5 条示例帖子
]
```

可参照此格式构建真实数据库数据。

---

## 调试 API 连接

### 查看 API 请求日志

打开浏览器开发者工具 (F12)，在 **Network** 标签查看：

```
GET /community/posts
- Status: 404 或 200?
- Response: 真实数据或错误?
```

### 查看控制台日志

```javascript
// 若显示此日志，说明正在使用模拟数据：
"Community posts API not available, using mock data"

// 若无此日志，说明使用真实 API
```

---

## 完整的后端实现示例 (Java/Spring)

```java
@RestController
@RequestMapping("/api/community")
public class CommunityController {

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String forumSlug) {

        // 查询数据库
        List<Post> posts = postService.getPosts(page, pageSize, sortBy, search, tag, forumSlug);
        int total = postService.countPosts(search, tag, forumSlug);

        return ResponseEntity.ok(new ApiResponse(
            posts,
            total,
            page,
            pageSize,
            (int) Math.ceil((double) total / pageSize)
        ));
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody CreatePostRequest request) {
        Post post = postService.createPost(request);
        return ResponseEntity.ok(new ApiResponse(post));
    }

    @PostMapping("/posts/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable String id) {
        Post post = postService.toggleLike(id);
        return ResponseEntity.ok(new ApiResponse(new LikeResponse(
            post.isLikedByCurrentUser(),
            post.getLikeCount()
        )));
    }
}
```

---

## 时间线

- ✅ **已完成**：前端 UI + Mock 数据
- ⏳ **待做**：后端 API 实现
- 🎯 **目标**：两者完全对接，用户看到真实数据

---

## 常见问题

### Q: 为什么看不到帖子？
A: 后端 API 尚未实现或未返回数据。前端会自动显示 Mock 数据。

### Q: Mock 数据是怎么工作的？
A: 当后端 API 失败时，前端自动降级使用 `communityMock.js` 中的示例数据。

### Q: 如何强制使用真实 API？
A: 实现后端 API 后，前端会自动优先使用。或手动禁用 Mock 数据。

### Q: 点赞等操作会持久化吗？
A: Mock 数据不会持久化。实现后端 API 后才会真正保存。

---

## 相关文件

- 前端 API 层：`frontend/src/api/communityWithCache.js`
- Mock 数据：`frontend/src/api/communityMock.js`
- Composables：`frontend/src/composables/usePostList.js`
- 视图组件：`frontend/src/views/community/PostList.vue`

---

**下一步**：实现上述后端 API 端点，前端会自动识别并使用真实数据！
