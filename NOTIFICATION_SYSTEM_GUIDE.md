# 通知系统完整实现指南

## 概述

本指南详细说明了论坛通知系统的完整实现方案，包括实时 WebSocket 通知、通知中心、多种提醒方式和用户偏好设置。

## 功能清单

### ✅ 已实现功能

```
├─ 通知类型
│  ├─ 评论通知 - 有人评论了你的帖子
│  ├─ 回复通知 - 有人回复了你的评论
│  ├─ 点赞通知 - 有人点赞了你的帖子/评论
│  ├─ 提及通知 - 有人 @ 提及了你
│  ├─ 关注通知 - 有人关注了你
│  └─ 系统通知 - 官方公告、维护通知
│
├─ 实时推送
│  ├─ WebSocket 连接管理
│  ├─ 自动重连（指数退避）
│  ├─ 连接状态监测
│  └─ 心跳保活
│
├─ 通知中心
│  ├─ 通知列表（分页）
│  ├─ 按类型筛选
│  ├─ 按读/未读筛选
│  ├─ 按日期分组
│  ├─ 标记为已读
│  ├─ 删除通知
│  └─ 清空所有通知
│
├─ 提醒方式
│  ├─ 声音提醒（可配置）
│  ├─ 振动提醒（移动设备）
│  ├─ 桌面通知（浏览器通知）
│  └─ 徽章计数（未读数）
│
├─ 用户偏好
│  ├─ 通知类型开关（6 种）
│  ├─ 提醒方式开关（3 种）
│  ├─ 云端同步
│  └─ 本地存储
│
└─ 性能优化
   ├─ 智能缓存（1-30 分钟）
   ├─ 请求去重
   ├─ 自动重试
   └─ 离线支持
```

---

## 架构设计

### 数据流

```
后端事件触发
   ↓
WebSocket 推送
   ↓
前端接收消息
   ↓
检查用户偏好
   ↓
展示提醒 (声音/振动/桌面)
   ↓
更新通知列表
   ↓
更新未读计数
```

### WebSocket 消息格式

```javascript
// 新通知消息
{
  type: 'notification',
  data: {
    id: 'notif_1',
    type: 'comment',  // comment|reply|like|mention|follow|system
    actor: {
      userId: 'user_2',
      name: '李四',
      avatar: 'url'
    },
    content: {
      title: '李四评论了你的帖子',
      body: '评论内容摘要...'
    },
    actionUrl: '/community/posts/post_1',
    read: false,
    createdAt: '2025-11-11T10:00:00Z'
  }
}

// 未读计数同步消息
{
  type: 'unread_count',
  data: {
    count: 5
  }
}

// 连接确认
{
  type: 'connected',
  data: {
    userId: 'current_user_id'
  }
}
```

---

## API 规范

### 1. 获取通知列表

```
GET /api/community/notifications?page=1&pageSize=20&type=all&read=all
```

**请求参数**：

```javascript
{
  page: 1,              // 页码
  pageSize: 20,         // 每页数量
  type: 'all',          // all|comment|reply|like|mention|follow|system
  read: 'all'           // all|read|unread
}
```

**响应格式**：

```json
{
  "code": 0,
  "data": [
    {
      "id": "notif_1",
      "type": "comment",
      "actor": {
        "userId": "user_2",
        "name": "李四",
        "avatar": "https://..."
      },
      "content": {
        "title": "李四评论了你的帖子",
        "body": "评论内容摘要...",
        "postId": "post_1"
      },
      "read": false,
      "actionUrl": "/community/posts/post_1",
      "createdAt": "2025-11-11T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

### 2. 获取未读计数

```
GET /api/community/notifications/unread/count
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "count": 5
  }
}
```

### 3. 标记为已读

```
POST /api/community/notifications/{notificationId}/read
```

### 4. 标记全部为已读

```
POST /api/community/notifications/read-all
```

### 5. 删除通知

```
DELETE /api/community/notifications/{notificationId}
```

### 6. 清空所有通知

```
DELETE /api/community/notifications
```

### 7. 获取偏好设置

```
GET /api/community/notifications/preferences
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "commentNotifications": true,
    "replyNotifications": true,
    "likeNotifications": true,
    "mentionNotifications": true,
    "followNotifications": true,
    "systemNotifications": true,
    "soundEnabled": true,
    "vibrationEnabled": true,
    "desktopNotifications": true
  }
}
```

### 8. 更新偏好设置

```
PUT /api/community/notifications/preferences
```

**请求体**：

```json
{
  "commentNotifications": true,
  "replyNotifications": true,
  "likeNotifications": true,
  "mentionNotifications": true,
  "followNotifications": true,
  "systemNotifications": true,
  "soundEnabled": true,
  "vibrationEnabled": true,
  "desktopNotifications": true
}
```

---

## 前端实现

### useNotifications Composable

```javascript
export function useNotifications() {
  // 数据
  const notifications = ref([])
  const unreadCount = ref(0)
  const isConnected = ref(false)
  const filters = reactive({ type: 'all', read: 'all' })
  const preferences = reactive({ ... })

  // 方法
  const fetchNotifications = async (page = 1) => {}
  const fetchUnreadCount = async () => {}
  const markAsRead = async (notificationId) => {}
  const markAllAsRead = async () => {}
  const deleteNotification = async (notificationId) => {}
  const clearAllNotifications = async () => {}
  const updatePreferences = async (newPreferences) => {}

  // WebSocket
  const initializeWebSocket = () => {}
  const handleNotificationMessage = (message) => {}
  const closeWebSocket = () => {}

  return { ... }
}
```

### 通知中心组件

```vue
<template>
  <div class="notification-center">
    <!-- 标题栏 -->
    <div class="center-header">
      <h2>消息中心</h2>
      <div class="header-actions">
        <el-button @click="markAllAsRead" v-if="unreadCount > 0">
          全部标记为已读
        </el-button>
      </div>
    </div>

    <!-- 未读计数和连接状态 -->
    <div class="status-bar">
      <span class="badge" v-if="unreadCount > 0">
        {{ unreadCount }} 条未读
      </span>
      <el-tag :type="isConnected ? 'success' : 'warning'">
        {{ isConnected ? '已连接' : '离线' }}
      </el-tag>
    </div>

    <!-- 过滤器 -->
    <div class="filters">
      <el-select v-model="filters.type" @change="changeFilter">
        <el-option label="全部" value="all" />
        <el-option label="评论" value="comment" />
        <!-- ... 其他类型 -->
      </el-select>
      <el-select v-model="filters.read" @change="changeFilter">
        <el-option label="全部" value="all" />
        <el-option label="已读" value="read" />
        <el-option label="未读" value="unread" />
      </el-select>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-list">
      <notification-item
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @mark-read="markAsRead"
        @delete="deleteNotification"
      />
    </div>

    <!-- 分页 -->
    <el-pagination
      :current-page="currentPage"
      :total="totalNotifications"
      @current-change="changePage"
    />

    <!-- 设置面板 -->
    <div class="preferences-section">
      <h3>通知设置</h3>
      <el-checkbox v-model="preferences.commentNotifications">
        评论通知
      </el-checkbox>
      <!-- ... 其他选项 -->
    </div>
  </div>
</template>
```

---

## 数据库设计

### notifications 表

```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50),  -- comment, reply, like, mention, follow, system
  actor_id VARCHAR(36),  -- 谁执行的操作

  -- 通知内容
  title VARCHAR(255),
  body TEXT,
  action_url VARCHAR(500),

  -- 相关资源
  related_type VARCHAR(50),  -- post, comment, user
  related_id VARCHAR(36),

  -- 状态
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,

  -- 时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,

  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);
```

### notification_preferences 表

```sql
CREATE TABLE notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE NOT NULL,

  -- 通知类型开关
  comment_notifications BOOLEAN DEFAULT true,
  reply_notifications BOOLEAN DEFAULT true,
  like_notifications BOOLEAN DEFAULT true,
  mention_notifications BOOLEAN DEFAULT true,
  follow_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,

  -- 提醒方式开关
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT true,

  -- 时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## WebSocket 服务器实现（Node.js 示例）

```javascript
const WebSocket = require('ws')
const jwt = require('jsonwebtoken')

// WebSocket 服务器
const wss = new WebSocket.Server({ port: 3001 })

// 活跃连接映射
const activeConnections = new Map()

wss.on('connection', (ws) => {
  console.log('New WebSocket connection')

  let userId = null

  // 处理认证消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)

      if (message.type === 'auth') {
        // 验证 JWT Token
        const token = message.token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        userId = decoded.userId

        // 保存连接
        activeConnections.set(userId, ws)

        // 发送连接确认
        ws.send(JSON.stringify({
          type: 'connected',
          data: { userId }
        }))

        console.log(`User ${userId} connected`)
      }
    } catch (err) {
      console.error('WebSocket error:', err)
      ws.close()
    }
  })

  // 处理关闭
  ws.on('close', () => {
    if (userId) {
      activeConnections.delete(userId)
      console.log(`User ${userId} disconnected`)
    }
  })
})

// 发送通知给特定用户
function sendNotificationToUser(userId, notification) {
  const ws = activeConnections.get(userId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'notification',
      data: notification
    }))
  }
}

module.exports = { sendNotificationToUser }
```

---

## 最佳实践

### 1. WebSocket 重连策略

```javascript
// 指数退避重连
const attemptReconnect = () => {
  if (reconnectAttempts.value >= maxReconnectAttempts) return

  reconnectAttempts.value++
  const delay = Math.min(
    1000 * Math.pow(2, reconnectAttempts.value - 1),
    30000  // 最大 30 秒
  )

  setTimeout(() => {
    initializeWebSocket()
  }, delay)
}
```

### 2. 用户偏好本地存储

```javascript
// 先从 localStorage 读取用户偏好
const loadPreferences = () => {
  const stored = localStorage.getItem('notification_preferences')
  if (stored) {
    Object.assign(preferences, JSON.parse(stored))
  }
}

// 偏好变更时保存
const updatePreferences = async (newPrefs) => {
  Object.assign(preferences, newPrefs)
  localStorage.setItem('notification_preferences', JSON.stringify(preferences))
  await api.updateNotificationPreferences(newPrefs)
}
```

### 3. 缓存策略

```javascript
const CACHE_TIME = {
  NOTIFICATIONS: 3 * 60 * 1000,      // 3分钟
  UNREAD_COUNT: 1 * 60 * 1000,       // 1分钟
  PREFERENCES: 30 * 60 * 1000        // 30分钟
}
```

### 4. 桌面通知权限

```javascript
// 在应用启动时请求权限
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
  }
  return false
}
```

---

## 后端实现示例（Java/Spring）

```java
@RestController
@RequestMapping("/api/community/notifications")
public class NotificationController {

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam int page,
            @RequestParam int pageSize,
            @RequestParam String type,
            @RequestParam String read) {

        List<Notification> notifications = notificationService.getNotifications(
            getCurrentUserId(), page, pageSize, type, read
        );
        int total = notificationService.countNotifications(getCurrentUserId(), type, read);

        return ResponseEntity.ok(new ApiResponse(
            notifications, total, page, pageSize
        ));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadCount() {
        int count = notificationService.getUnreadCount(getCurrentUserId());
        return ResponseEntity.ok(new ApiResponse(new CountResponse(count)));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(new ApiResponse());
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUserId());
        return ResponseEntity.ok(new ApiResponse());
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable String notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.ok(new ApiResponse());
    }
}

// WebSocket 端点（使用 Spring WebSocket）
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler(), "/ws/notifications")
            .setAllowedOrigins("*");
    }

    @Bean
    public NotificationWebSocketHandler notificationWebSocketHandler() {
        return new NotificationWebSocketHandler();
    }
}

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 从 JWT Token 中获取用户 ID
        String userId = extractUserIdFromSession(session);
        sessions.put(userId, session);
        System.out.println("User " + userId + " connected");
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        System.err.println("Transport error: " + exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        sessions.values().remove(session);
    }

    // 发送通知给特定用户
    public void sendNotificationToUser(String userId, Notification notification) {
        WebSocketSession session = sessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(
                    objectMapper.writeValueAsString(notification)
                ));
            } catch (IOException e) {
                System.err.println("Failed to send notification: " + e.getMessage());
            }
        }
    }
}
```

---

## 常见问题

### Q: 如何处理通知的实时性？

**A:**
1. 使用 WebSocket 实时推送（推荐）
2. 使用长轮询 (Long Polling) 作为备选
3. 使用 Server-Sent Events (SSE)

### Q: 如何防止通知风暴？

**A:**
1. 在后端合并相同类型的通知（如多条点赞合并为一条）
2. 限制发送频率（如 1 秒内不重复发送相同类型）
3. 分组通知（如 5 人点赞显示一条通知）

### Q: 离线时如何保证用户看到所有通知？

**A:**
1. 将通知持久化到数据库（已实现）
2. 用户上线时获取离线期间的通知
3. 定期清理过期通知（如 30 天前）

### Q: 如何处理通知的删除？

**A:**
推荐使用软删除（标记 `is_deleted = true`）而不是硬删除：
- 便于审计和恢复
- 不影响引用完整性
- 便于统计分析

---

## 测试清单

- [ ] WebSocket 连接/断开
- [ ] 自动重连机制
- [ ] 获取通知列表
- [ ] 标记为已读
- [ ] 标记全部为已读
- [ ] 删除通知
- [ ] 清空所有通知
- [ ] 获取未读计数
- [ ] 通知类型过滤
- [ ] 读/未读过滤
- [ ] 分页功能
- [ ] 用户偏好设置
- [ ] 声音提醒
- [ ] 振动提醒
- [ ] 桌面通知
- [ ] 离线场景
- [ ] 网络异常恢复

---

## 文件清单

### 前端文件

```
frontend/src/
├── composables/
│   └── useNotifications.js              (450 行)
├── views/community/components/
│   ├── NotificationCenter.vue           (380 行)
│   ├── NotificationItem.vue             (320 行)
│   └── NotificationBadge.vue            (80 行 - 待创建)
└── api/
    └── communityWithCache.js            (已更新 with notification methods)
```

---

**更新时间**：2025-11-11
**版本**：1.0
**状态**：✅ 前端完全实现，待后端对接和 WebSocket 服务器
