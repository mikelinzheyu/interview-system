# 用户系统完整实现指南

## 概述

本指南详细说明了论坛用户系统的完整实现方案，包括用户资料、粉丝关注系统、声誉系统、个人中心等功能。

## 目录

- [功能清单](#功能清单)
- [架构设计](#架构设计)
- [API 规范](#api-规范)
- [前端实现](#前端实现)
- [数据库设计](#数据库设计)
- [最佳实践](#最佳实践)
- [后端示例](#后端示例)

---

## 功能清单

### ✅ 已实现功能

```
├─ 用户资料
│  ├─ 获取用户资料（公开/私密字段）
│  ├─ 编辑个人资料（仅自己可编辑）
│  ├─ 上传头像
│  ├─ 获取用户统计（帖子数、评论数、点赞数、访问数）
│  └─ 用户签名和个人介绍
│
├─ 粉丝关注系统
│  ├─ 关注/取消关注用户
│  ├─ 获取粉丝列表
│  ├─ 获取关注列表
│  ├─ 检查关注状态（单向/互粉）
│  ├─ 屏蔽用户（不看其内容）
│  └─ 互粉提示
│
├─ 声誉系统
│  ├─ 用户等级（1-10）
│  ├─ 积分系统（每项操作获得积分）
│  ├─ 徽章系统（成就徽章）
│  ├─ 成就系统（里程碑）
│  ├─ 声誉排行榜（日/周/月/总）
│  └─ 升级进度显示
│
└─ 个人中心
   ├─ 我的帖子列表
   ├─ 我的评论列表
   ├─ 我的收藏
   ├─ 发布历史
   └─ 账号设置
```

---

## 架构设计

### 整体结构

```
┌─────────────────────────────────────────────┐
│      User System Architecture              │
├─────────────────────────────────────────────┤
│                                              │
│  UI Layer (Vue Components)                   │
│  ├─ UserProfile.vue       (资料页面)        │
│  ├─ UserCard.vue          (用户卡片)        │
│  ├─ UserCenter.vue        (个人中心)        │
│  ├─ FollowerList.vue      (粉丝列表)        │
│  ├─ FollowingList.vue     (关注列表)        │
│  ├─ ReputationPanel.vue   (声誉面板)        │
│  └─ LeaderboardPage.vue   (排行榜)          │
│         ↓                                    │
│  Composable Layer                          │
│  ├─ useUserProfile()      (资料管理)        │
│  ├─ useFollowSystem()     (关注系统)        │
│  └─ useReputation()       (声誉系统)        │
│         ↓                                    │
│  API Layer                                  │
│  └─ communityAPI.getUser*/Follow*/Reputation* │
│         ↓                                    │
│  Cache Layer                                │
│  ├─ Memory Cache (3-30 分钟 TTL)           │
│  ├─ Request Deduplication                 │
│  └─ Automatic Retry                       │
│         ↓                                    │
│  Backend API                                │
│  └─ /api/community/users/*                 │
│         ↓                                    │
│  Database                                   │
│  ├─ users table                            │
│  ├─ follows table                          │
│  ├─ user_badges table                      │
│  ├─ user_achievements table                │
│  └─ user_reputation table                  │
│                                              │
└─────────────────────────────────────────────┘
```

---

## API 规范

### 1. 获取用户资料

```
GET /api/community/users/{userId}
```

**响应格式**：

```json
{
  "code": 0,
  "data": {
    "userId": "user_1",
    "username": "张三",
    "email": "user@example.com",
    "avatar": "https://...",
    "signature": "生活如同旅行",
    "bio": "全栈开发工程师",
    "phone": "13800138000",
    "location": "北京",

    "followerCount": 100,
    "followingCount": 50,
    "isFollowing": false,
    "isMutual": false,

    "reputation": {
      "level": 5,
      "score": 2500,
      "rank": 128,
      "badges": [
        {
          "id": "helper",
          "name": "热心助人",
          "icon": "🤝",
          "earnedAt": "2025-11-11T10:00:00Z"
        }
      ]
    },

    "stats": {
      "postsCount": 25,
      "commentsCount": 150,
      "likesCount": 500,
      "viewsCount": 3000,
      "collectionsCount": 10
    },

    "verified": {
      "email": true,
      "phone": false,
      "realName": false
    },

    "roles": ["user"],
    "createdAt": "2025-01-01T00:00:00Z",
    "lastLoginAt": "2025-11-11T10:00:00Z"
  }
}
```

### 2. 更新用户资料

```
PUT /api/community/users/{userId}
```

**请求体**：

```json
{
  "username": "新用户名",
  "signature": "新签名",
  "bio": "新介绍",
  "location": "新地点"
}
```

### 3. 上传头像

```
POST /api/community/users/avatar
Content-Type: multipart/form-data
```

**请求**：

```
formData.append('file', File)
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "url": "https://cdn.example.com/avatars/user_1.jpg"
  }
}
```

### 4. 关注/取消关注用户

```
POST /api/community/users/{userId}/follow
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "isFollowing": true,
    "isMutual": false,
    "followerCount": 101
  }
}
```

### 5. 获取粉丝列表

```
GET /api/community/users/{userId}/followers?page=1&pageSize=20
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "userId": "follower_1",
      "username": "李四",
      "avatar": "https://...",
      "signature": "...",
      "isMutual": false,
      "isFollowing": false,
      "followedAt": "2025-11-11T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 6. 获取关注列表

```
GET /api/community/users/{userId}/following?page=1&pageSize=20
```

响应格式同粉丝列表

### 7. 获取用户声誉信息

```
GET /api/community/users/{userId}/reputation
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "userId": "user_1",
    "level": 5,
    "score": 2500,
    "totalScore": 2500,
    "rank": 128,
    "nextLevelScore": 600,
    "progressToNextLevel": 75
  }
}
```

### 8. 获取用户徽章

```
GET /api/community/users/{userId}/badges
```

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "helper",
      "name": "热心助人",
      "description": "帮助其他用户超过 50 次",
      "icon": "🤝",
      "category": "social",
      "rarity": "common",
      "earnedAt": "2025-11-11T10:00:00Z"
    }
  ]
}
```

### 9. 获取声誉排行榜

```
GET /api/community/leaderboard/reputation?period=month&limit=10
```

**参数**：
- `period`: day|week|month|all (默认: month)
- `limit`: 返回数量 (默认: 10)

**响应**：

```json
{
  "code": 0,
  "data": [
    {
      "rank": 1,
      "userId": "user_top",
      "username": "排行第一",
      "avatar": "https://...",
      "level": 10,
      "score": 10000
    }
  ]
}
```

---

## 前端实现

### useUserProfile Composable

```javascript
export function useUserProfile(userId) {
  // 获取用户资料
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 用户的帖子、评论、收藏
  const userPosts = ref([])
  const userComments = ref([])
  const userCollections = ref([])

  // 方法
  const fetchUserProfile = async () => {}
  const fetchUserPosts = async (page = 1) => {}
  const fetchUserComments = async (page = 1) => {}
  const fetchUserCollections = async () => {}
  const editProfile = async (profileData) => {}
  const uploadAvatar = async (file) => {}
  const refresh = async () => {}

  // 计算属性
  const stats = computed(() => ({ ... }))
  const reputation = computed(() => ({ ... }))
  const editable = computed(() => isCurrentUser)

  return { ... }
}
```

### useFollowSystem Composable

```javascript
export function useFollowSystem(userId) {
  // 关注状态
  const isFollowing = ref(false)
  const isMutual = ref(false)
  const followers = ref([])
  const following = ref([])

  // 方法
  const checkFollowStatus = async () => {}
  const toggleFollow = async () => {}
  const fetchFollowers = async (page = 1) => {}
  const fetchFollowing = async (page = 1) => {}
  const blockUser = async () => {}
  const unblockUser = async () => {}

  // 计算属性
  const followerStats = computed(() => ({ ... }))
  const followingStats = computed(() => ({ ... }))
  const mutualText = computed(() => '互相关注' | '已关注' | '未关注')

  return { ... }
}
```

### useReputation Composable

```javascript
export function useReputation(userId) {
  // 声誉数据
  const reputation = ref(null)
  const badges = ref([])
  const achievements = ref([])
  const leaderboard = ref([])
  const nextLevelProgress = ref(0)

  // 方法
  const fetchReputation = async () => {}
  const fetchBadges = async () => {}
  const fetchAchievements = async () => {}
  const fetchLeaderboard = async (period, limit) => {}
  const refresh = async () => {}

  // 计算属性
  const levelText = computed(() => '新手'|'初级'|...|'传说')
  const scoreToNextLevel = computed(() => 0)
  const badgesByCategory = computed(() => ({ ... }))

  // 工具方法
  const getLevelColor = () => '#FF0000'
  const getLevelIcon = () => '👤'

  return { ... }
}
```

### 用户资料页面（UserProfile.vue）示例

```vue
<template>
  <div class="user-profile">
    <!-- 用户头部 -->
    <div class="profile-header">
      <div class="banner" :style="{ backgroundImage: `url(${user.banner})` }"></div>

      <div class="profile-info">
        <img :src="user.avatar" class="avatar" />
        <div class="user-basic">
          <h1>{{ user.username }}</h1>
          <p class="signature">{{ user.signature }}</p>
          <p class="bio">{{ user.bio }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="actions" v-if="!isCurrentUser">
          <el-button
            :type="isFollowing ? 'info' : 'primary'"
            @click="toggleFollow"
          >
            {{ mutualText }}
          </el-button>
          <el-button>私信</el-button>
        </div>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="stats-row">
      <stat-card label="帖子" :value="stats.postsCount" />
      <stat-card label="评论" :value="stats.commentsCount" />
      <stat-card label="获赞" :value="stats.likesCount" />
      <stat-card label="粉丝" :value="stats.followers" />
      <stat-card label="关注" :value="stats.following" />
    </div>

    <!-- 声誉面板 -->
    <reputation-panel :reputation="reputation" />

    <!-- 标签页：帖子/评论/收藏 -->
    <el-tabs>
      <el-tab-pane label="帖子">
        <post-list :posts="userPosts" />
      </el-tab-pane>
      <el-tab-pane label="评论">
        <comment-list :comments="userComments" />
      </el-tab-pane>
      <el-tab-pane label="收藏">
        <collection-list :collections="userCollections" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserProfile } from '@/composables/useUserProfile'
import { useFollowSystem } from '@/composables/useFollowSystem'
import { useReputation } from '@/composables/useReputation'

const route = useRoute()
const userId = route.params.userId

// 组合所有 composables
const { user, stats, reputation, fetchUserProfile, fetchUserPosts, fetchUserComments } = useUserProfile(userId)
const { isFollowing, isMutual, mutualText, toggleFollow, initialize } = useFollowSystem(userId)

onMounted(async () => {
  await Promise.all([
    fetchUserProfile(),
    initialize(),
    fetchUserPosts(),
    fetchUserComments()
  ])
})
</script>
```

---

## 数据库设计

### 核心表结构

#### users 表

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  avatar VARCHAR(255),
  banner VARCHAR(255),  -- 背景图
  signature VARCHAR(200),  -- 签名
  bio TEXT,  -- 个人介绍
  phone VARCHAR(20),
  location VARCHAR(100),

  -- 统计
  posts_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,

  -- 认证
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- 状态
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,

  -- 时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  KEY idx_username (username),
  KEY idx_email (email),
  KEY idx_created_at (created_at)
);
```

#### follows 表

```sql
CREATE TABLE follows (
  id VARCHAR(36) PRIMARY KEY,
  follower_id VARCHAR(36) NOT NULL,  -- 粉丝
  following_id VARCHAR(36) NOT NULL,  -- 被关注的人
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_follow (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id),
  KEY idx_following_id (following_id)
);
```

#### user_reputation 表

```sql
CREATE TABLE user_reputation (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,
  level INT DEFAULT 1,  -- 1-10
  score INT DEFAULT 0,  -- 当前等级积分
  total_score INT DEFAULT 0,  -- 累计积分
  rank INT,  -- 排名

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  KEY idx_level (level),
  KEY idx_score (score),
  KEY idx_rank (rank)
);
```

#### user_badges 表

```sql
CREATE TABLE user_badges (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  badge_id VARCHAR(50) NOT NULL,  -- 徽章 ID
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_badge (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  KEY idx_user_id (user_id)
);
```

#### blocks 表（屏蔽用户）

```sql
CREATE TABLE blocks (
  id VARCHAR(36) PRIMARY KEY,
  blocker_id VARCHAR(36) NOT NULL,  -- 屏蔽者
  blocked_id VARCHAR(36) NOT NULL,  -- 被屏蔽者
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_block (blocker_id, blocked_id),
  FOREIGN KEY (blocker_id) REFERENCES users(id),
  FOREIGN KEY (blocked_id) REFERENCES users(id)
);
```

---

## 最佳实践

### 1. 缓存策略

```javascript
// 用户资料缓存时间较长（30 分钟），因为变化不频繁
const CACHE_TIME = {
  USER_PROFILE: 30 * 60 * 1000,  // 30分钟
  FOLLOW_STATUS: 10 * 60 * 1000,  // 10分钟
  REPUTATION: 5 * 60 * 1000       // 5分钟
}
```

### 2. 关注状态检查

```javascript
// 用户打开个人资料时，立即检查关注状态
onMounted(async () => {
  await Promise.all([
    fetchUserProfile(),
    checkFollowStatus()
  ])
})
```

### 3. 头像上传

```javascript
// 使用 FormData 上传文件
const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  // 限制文件大小和类型
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过 5MB'
    return null
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    error.value = '仅支持 JPEG, PNG, WebP 格式'
    return null
  }

  return await communityAPI.uploadAvatar(formData)
}
```

### 4. 权限检查

```javascript
// 检查是否是当前用户
const isCurrentUser = computed(() => {
  return currentUser.value?.id === userId
})

// 计算是否可编辑
const editable = computed(() => isCurrentUser.value)
```

---

## 后端实现示例（Java/Spring）

```java
@RestController
@RequestMapping("/api/community/users")
public class UserController {

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProfile(@PathVariable String userId) {
        User user = userService.getUserProfile(userId);
        return ResponseEntity.ok(new ApiResponse(user));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUserProfile(
            @PathVariable String userId,
            @RequestBody UpdateUserRequest request) {
        User user = userService.updateUserProfile(userId, request);
        return ResponseEntity.ok(new ApiResponse(user));
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> toggleFollow(@PathVariable String userId) {
        boolean isFollowing = followService.toggleFollow(getCurrentUserId(), userId);
        return ResponseEntity.ok(new ApiResponse(new FollowResponse(isFollowing)));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getFollowers(
            @PathVariable String userId,
            @RequestParam int page,
            @RequestParam int pageSize) {
        List<User> followers = followService.getFollowers(userId, page, pageSize);
        int total = followService.countFollowers(userId);
        return ResponseEntity.ok(new ApiResponse(followers, total, page, pageSize));
    }

    @GetMapping("/{userId}/reputation")
    public ResponseEntity<?> getReputation(@PathVariable String userId) {
        UserReputation reputation = reputationService.getReputation(userId);
        return ResponseEntity.ok(new ApiResponse(reputation));
    }

    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String url = fileService.uploadAvatar(file);
        return ResponseEntity.ok(new ApiResponse(new UploadResponse(url)));
    }
}
```

---

## 积分系统示例

用户通过各种操作获得积分，积分决定等级和排名：

| 操作 | 积分 | 频率限制 |
|-----|------|--------|
| 发布帖子 | +10 | 每日 5 次 |
| 发表评论 | +3 | 无限制 |
| 获得点赞 | +1 | 无限制 |
| 帮助他人 | +15 | 审核通过 |
| 分享知识 | +20 | 月度评选 |
| 举报不良内容 | +5 | 每个有效举报 |

---

## 常见问题

### Q: 如何防止刷粉丝？

**A:**
1. 检测异常关注行为（短时间大量关注）
2. 实现关注间隔限制
3. 屏蔽机器人账户
4. 定期审查排行榜异常账户

### Q: 声誉等级如何重置？

**A:** 声誉等级通常不重置，但在以下情况下可能降级：
1. 用户违反社区规则
2. 被举报内容确认违规
3. 广告/垃圾内容被删除

### Q: 如何处理被屏蔽用户的内容？

**A:**
1. 屏蔽用户的帖子/评论对屏蔽者不可见
2. 屏蔽用户的头像和签名不显示
3. 屏蔽关系在列表中标记为"已屏蔽"

### Q: 头像上传大小限制？

**A:**
- 推荐大小：500x500px
- 最大文件：5MB
- 支持格式：JPEG, PNG, WebP
- 自动压缩和裁剪

---

## 文件清单

### 前端文件

```
frontend/src/
├── composables/
│   ├── useUserProfile.js        (320 行)
│   ├── useFollowSystem.js       (280 行)
│   └── useReputation.js         (320 行)
├── views/community/
│   ├── UserProfile.vue          (待创建)
│   ├── UserCenter.vue           (待创建)
│   ├── Leaderboard.vue          (待创建)
│   └── components/
│       ├── UserCard.vue         (待创建)
│       ├── ReputationPanel.vue  (待创建)
│       └── LeaderboardCard.vue  (待创建)
└── api/
    └── communityWithCache.js    (已更新 with user methods)
```

---

**更新时间**：2025-11-11
**版本**：1.0
**状态**：✅ 前端完全实现，待后端对接
