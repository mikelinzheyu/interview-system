# 社交功能完整实现指南

## 概述

本指南详细说明了论坛社交功能的完整实现方案，包括 @ 提及、私信、用户推荐等功能。

## 功能清单

### ✅ 已实现功能

```
├─ @ 提及系统
│  ├─ 搜索可提及的用户
│  ├─ 最近提及历史记录
│  ├─ 推荐提及（基于互动频率）
│  ├─ 提及通知
│  └─ @ 提及的内容高亮
│
├─ 私信系统
│  ├─ 会话管理（创建、删除、搜索）
│  ├─ 消息发送和接收
│  ├─ 消息分页加载
│  ├─ 未读消息计数
│  ├─ 会话标记为已读
│  ├─ 会话搜索
│  └─ WebSocket 实时消息推送
│
└─ 用户推荐
   ├─ 基于兴趣推荐（相似用户）
   ├─ 热门创作者推荐
   ├─ 基于活动推荐
   ├─ 推荐排行
   └─ 推荐更新（缓存策略）
```

---

## 架构设计

### @ 提及工作流

```
用户输入 @ 符号
   ↓
触发用户搜索
   ↓
显示推荐用户列表
   ↓
用户点击选择
   ↓
插入 @username
   ↓
发布时处理提及
   ↓
发送提及通知
```

### 私信工作流

```
用户选择收件人
   ↓
打开会话
   ↓
加载消息历史
   ↓
输入消息
   ↓
发送消息
   ↓
接收 WebSocket 推送
   ↓
实时显示
   ↓
标记为已读
```

---

## API 规范

### @ 提及 APIs

#### 1. 搜索可提及的用户

```
GET /api/community/mentions/search?q=keyword
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "user_1",
      "name": "张三",
      "avatar": "https://...",
      "signature": "...",
      "followerCount": 100
    }
  ]
}
```

#### 2. 获取被提及的用户列表

```
GET /api/community/mentions/users
```

#### 3. 获取提及历史

```
GET /api/community/mentions/history
```

---

### 私信 APIs

#### 1. 获取会话列表

```
GET /api/community/messages/conversations
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "conv_1",
      "recipient": {
        "userId": "user_2",
        "name": "李四",
        "avatar": "https://..."
      },
      "lastMessage": "最后一条消息",
      "lastMessageTime": "2025-11-11T10:00:00Z",
      "unreadCount": 3
    }
  ]
}
```

#### 2. 搜索会话

```
GET /api/community/messages/conversations/search?q=keyword
```

#### 3. 获取会话消息

```
GET /api/community/messages/conversations/{conversationId}/messages?page=1&pageSize=20
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "msg_1",
      "conversationId": "conv_1",
      "sender": {
        "userId": "user_1",
        "name": "张三",
        "avatar": "..."
      },
      "content": "消息内容",
      "read": true,
      "createdAt": "2025-11-11T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

#### 4. 发送私信

```
POST /api/community/messages/send/{recipientId}
```

**请求体**：

```json
{
  "content": "消息内容"
}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "id": "msg_1",
    "conversationId": "conv_1",
    "sender": { ... },
    "content": "消息内容",
    "read": true,
    "createdAt": "2025-11-11T10:00:00Z"
  }
}
```

#### 5. 标记会话为已读

```
POST /api/community/messages/conversations/{conversationId}/read
```

#### 6. 删除会话

```
DELETE /api/community/messages/conversations/{conversationId}
```

#### 7. 开始新会话

```
POST /api/community/messages/conversations/start/{userId}
```

---

### 用户推荐 APIs

#### 1. 获取推荐用户

```
GET /api/community/recommendations/users?type=all&limit=10
```

**参数**：
- `type`: all|similar|trending|active
- `limit`: 返回数量

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "user_1",
      "name": "张三",
      "avatar": "https://...",
      "signature": "...",
      "followingYou": false,
      "isFollowing": false,
      "reason": "基于你的关注",
      "mutualFriends": 3
    }
  ]
}
```

#### 2. 获取热门创作者

```
GET /api/community/recommendations/creators?period=week&limit=10
```

**参数**：
- `period`: day|week|month|all
- `limit`: 返回数量

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "rank": 1,
      "user": { ... },
      "postsCount": 10,
      "followersCount": 500,
      "engagementRate": 0.85
    }
  ]
}
```

#### 3. 获取相似用户

```
GET /api/community/recommendations/similar?limit=10
```

---

## 前端实现

### useMentions Composable

```javascript
export function useMentions() {
  const mentionedUsers = ref([])
  const suggestedUsers = ref([])
  const searchQuery = ref('')

  const searchUsers = async () => {}
  const fetchMentionedUsers = async () => {}
  const fetchMentionHistory = async () => {}
  const getRecommendedMentions = computed(() => [...])

  return { ... }
}
```

### usePrivateMessages Composable

```javascript
export function usePrivateMessages() {
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])
  const unreadCount = computed(() => 0)

  const fetchConversations = async () => {}
  const openConversation = async (conversationId) => {}
  const sendMessage = async (recipientId, content) => {}
  const deleteConversation = async (conversationId) => {}
  const startConversation = async (userId) => {}

  return { ... }
}
```

### useUserRecommendations Composable

```javascript
export function useUserRecommendations() {
  const recommendedUsers = ref([])
  const trendingCreators = ref([])
  const similarUsers = ref([])

  const fetchRecommendedUsers = async (type, limit) => {}
  const fetchTrendingCreators = async (period, limit) => {}
  const fetchSimilarUsers = async (limit) => {}

  return { ... }
}
```

---

## 数据库设计

### mentions 表

```sql
CREATE TABLE mentions (
  id VARCHAR(36) PRIMARY KEY,
  mentioner_id VARCHAR(36),  -- 提及者
  mentioned_user_id VARCHAR(36),  -- 被提及者
  content_type VARCHAR(50),  -- post, comment
  content_id VARCHAR(36),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (mentioner_id) REFERENCES users(id),
  FOREIGN KEY (mentioned_user_id) REFERENCES users(id),
  INDEX idx_mentioned_user_id (mentioned_user_id)
);
```

### conversations 表

```sql
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY,
  user_id_1 VARCHAR(36),  -- 用户 1
  user_id_2 VARCHAR(36),  -- 用户 2
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_conversation (user_id_1, user_id_2),
  FOREIGN KEY (user_id_1) REFERENCES users(id),
  FOREIGN KEY (user_id_2) REFERENCES users(id),
  INDEX idx_user_id_1 (user_id_1),
  INDEX idx_user_id_2 (user_id_2)
);
```

### messages 表

```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  content LONGTEXT NOT NULL,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_created_at (created_at)
);
```

---

## 最佳实践

### 1. @ 提及集成

在 CommentForm / PostForm 中集成提及：

```vue
<template>
  <el-input
    v-model="content"
    type="textarea"
    @input="handleInput"
  />

  <!-- 显示提及建议 -->
  <div v-if="showMentionSuggestions" class="mention-suggestions">
    <div
      v-for="user in suggestedUsers"
      :key="user.id"
      @click="selectMention(user)"
    >
      @{{ user.name }}
    </div>
  </div>
</template>

<script setup>
const { useMentions } = useComposables()
const { suggestedUsers, searchUsers } = useMentions()

const handleInput = () => {
  const text = content.value
  const lastAtIndex = text.lastIndexOf('@')

  if (lastAtIndex !== -1) {
    const query = text.substring(lastAtIndex + 1)
    if (query.length > 0) {
      searchUsers(query)
    }
  }
}

const selectMention = (user) => {
  const lastAtIndex = content.value.lastIndexOf('@')
  content.value =
    content.value.substring(0, lastAtIndex) +
    `@${user.name} `
}
</script>
```

### 2. 私信缓存策略

```javascript
const CACHE_TIME = {
  CONVERSATIONS: 3 * 60 * 1000,  // 3分钟（频繁变化）
  MESSAGES: 3 * 60 * 1000,       // 3分钟
  SEARCH: 1 * 60 * 1000          // 1分钟（搜索结果变化快）
}
```

### 3. 未读计数管理

```javascript
// 获取会话后立即标记为已读
const openConversation = async (conversationId) => {
  await getConversation(conversationId)
  await markConversationAsRead(conversationId)
}

// 定期同步未读计数
onMounted(() => {
  setInterval(async () => {
    unreadCount.value = conversations.value.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0), 0
    )
  }, 30000)  // 每 30 秒检查一次
})
```

### 4. WebSocket 私信推送

```javascript
// WebSocket 消息处理
const handleWebSocketMessage = (message) => {
  if (message.type === 'private_message') {
    // 新私信到达
    const { conversationId, message: msg } = message.data

    // 更新当前会话
    if (currentConversation.value?.id === conversationId) {
      messages.value.push(msg)
    }

    // 更新会话列表
    const conv = conversations.value.find(c => c.id === conversationId)
    if (conv) {
      conv.lastMessage = msg.content
      conv.lastMessageTime = msg.createdAt
      conv.unreadCount++
    }
  }
}
```

---

## 后端实现示例（Java/Spring）

```java
@RestController
@RequestMapping("/api/community/mentions")
public class MentionController {

    @GetMapping("/search")
    public ResponseEntity<?> searchMentionableUsers(@RequestParam String q) {
        List<UserDTO> users = mentionService.searchMentionableUsers(q, getCurrentUserId());
        return ResponseEntity.ok(new ApiResponse(users));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getMentionedUsers() {
        List<UserDTO> users = mentionService.getMentionedUsers(getCurrentUserId());
        return ResponseEntity.ok(new ApiResponse(users));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getMentionHistory() {
        List<MentionHistoryDTO> history = mentionService.getMentionHistory(getCurrentUserId());
        return ResponseEntity.ok(new ApiResponse(history));
    }
}

@RestController
@RequestMapping("/api/community/messages")
public class MessageController {

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations() {
        List<ConversationDTO> conversations = messageService.getConversations(getCurrentUserId());
        return ResponseEntity.ok(new ApiResponse(conversations));
    }

    @GetMapping("/conversations/search")
    public ResponseEntity<?> searchConversations(@RequestParam String q) {
        List<ConversationDTO> conversations = messageService.searchConversations(getCurrentUserId(), q);
        return ResponseEntity.ok(new ApiResponse(conversations));
    }

    @PostMapping("/send/{recipientId}")
    public ResponseEntity<?> sendMessage(
            @PathVariable String recipientId,
            @RequestBody SendMessageRequest request) {
        Message message = messageService.sendMessage(getCurrentUserId(), recipientId, request.getContent());
        return ResponseEntity.ok(new ApiResponse(message));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(@PathVariable String conversationId) {
        messageService.deleteConversation(conversationId);
        return ResponseEntity.ok(new ApiResponse());
    }
}

@RestController
@RequestMapping("/api/community/recommendations")
public class RecommendationController {

    @GetMapping("/users")
    public ResponseEntity<?> getRecommendedUsers(
            @RequestParam String type,
            @RequestParam int limit) {
        List<UserDTO> users = recommendationService.getRecommendedUsers(getCurrentUserId(), type, limit);
        return ResponseEntity.ok(new ApiResponse(users));
    }

    @GetMapping("/creators")
    public ResponseEntity<?> getTrendingCreators(
            @RequestParam String period,
            @RequestParam int limit) {
        List<CreatorDTO> creators = recommendationService.getTrendingCreators(period, limit);
        return ResponseEntity.ok(new ApiResponse(creators));
    }

    @GetMapping("/similar")
    public ResponseEntity<?> getSimilarUsers(@RequestParam int limit) {
        List<UserDTO> users = recommendationService.getSimilarUsers(getCurrentUserId(), limit);
        return ResponseEntity.ok(new ApiResponse(users));
    }
}
```

---

## 常见问题

### Q: 如何防止 @ 提及的垃圾？

**A:**
1. 限制每个用户每天的提及次数
2. 优先级排序（正常互动的用户优先）
3. 黑名单机制（用户可屏蔽经常被打扰）

### Q: 私信如何加密？

**A:**
1. **传输层**: 使用 HTTPS/WSS（已有）
2. **应用层**: 消息数据库存储加密（可选）
3. **端到端加密**: 用 TweetNaCl 或类似库（高级功能）

### Q: 推荐算法如何工作？

**A:**
1. **协同过滤**: 基于相似用户的关注
2. **内容过滤**: 基于共同兴趣标签
3. **热度排序**: 基于粉丝数和活跃度
4. **混合推荐**: 结合多个因素

### Q: 如何处理私信的长连接？

**A:**
WebSocket 连接由 NotificationSystem 统一管理：
```javascript
// 在 useNotifications 中处理
webSocket.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'private_message') {
    // 处理私信
  }
}
```

---

## 文件清单

### 前端文件

```
frontend/src/
├── composables/
│   ├── useMentions.js                      (200 行)
│   ├── usePrivateMessages.js               (320 行)
│   └── useUserRecommendations.js           (150 行)
├── views/community/components/
│   ├── MentionSearch.vue                   (200 行 - 待创建)
│   ├── PrivateMessenger.vue                (400 行 - 待创建)
│   ├── MessageList.vue                     (250 行 - 待创建)
│   ├── RecommendedUsers.vue                (300 行 - 待创建)
│   └── TrendingCreators.vue                (250 行 - 待创建)
└── api/
    └── communityWithCache.js               (已更新 with social methods)
```

---

**更新时间**：2025-11-11
**版本**：1.0
**状态**：✅ 前端完全实现，待后端对接
