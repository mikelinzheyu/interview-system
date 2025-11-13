# 🔐 Group Permissions System - 群组权限系统设计与实现

**版本**: 1.0
**日期**: 2025-11-12
**状态**: 规划完成 → 准备实现

---

## 一、权限系统概述

### 设计目标
- ✅ 灵活的角色定义
- ✅ 细粒度的权限控制
- ✅ 易于扩展和维护
- ✅ 高效的权限检查
- ✅ 安全的权限管理

### 核心概念

#### 1. 角色（Roles）
系统定义了 4 个基本角色：

```javascript
const ROLES = {
  ADMIN: {
    value: 'admin',
    label: '管理员',
    level: 4,
    description: '拥有所有权限，可以管理频道和成员'
  },
  MODERATOR: {
    value: 'moderator',
    label: '版主',
    level: 3,
    description: '可以管理消息和成员，但不能编辑频道设置'
  },
  MEMBER: {
    value: 'member',
    label: '成员',
    level: 2,
    description: '可以发送消息和编辑自己的消息'
  },
  GUEST: {
    value: 'guest',
    label: '访客',
    level: 1,
    description: '只读权限，不能发送消息'
  }
}
```

#### 2. 权限（Permissions）
每个权限都有明确的作用范围和限制：

```javascript
const PERMISSIONS = {
  // 频道管理权限
  CREATE_CHANNEL: 'create_channel',
  EDIT_CHANNEL: 'edit_channel',
  DELETE_CHANNEL: 'delete_channel',
  MANAGE_MEMBERS: 'manage_members',

  // 消息权限
  SEND_MESSAGE: 'send_message',
  EDIT_MESSAGE: 'edit_message',
  DELETE_MESSAGE: 'delete_message',
  DELETE_OTHERS_MESSAGE: 'delete_others_message',
  PIN_MESSAGE: 'pin_message',

  // 用户权限
  MUTE_USER: 'mute_user',
  KICK_USER: 'kick_user',
  BAN_USER: 'ban_user',

  // 频道权限
  CHANGE_TOPIC: 'change_topic',
  MANAGE_PERMISSIONS: 'manage_permissions'
}
```

#### 3. 权限矩阵

| 权限 | Admin | Moderator | Member | Guest |
|-----|-------|-----------|--------|-------|
| 创建频道 | ✅ | ❌ | ❌ | ❌ |
| 编辑频道 | ✅ | ✅ | ❌ | ❌ |
| 删除频道 | ✅ | ❌ | ❌ | ❌ |
| 管理成员 | ✅ | ✅ | ❌ | ❌ |
| 发送消息 | ✅ | ✅ | ✅ | ❌ |
| 编辑自己的消息 | ✅ | ✅ | ✅ | ❌ |
| 编辑他人的消息 | ✅ | ✅ | ❌ | ❌ |
| 删除自己的消息 | ✅ | ✅ | ✅ | ❌ |
| 删除他人的消息 | ✅ | ✅ | ❌ | ❌ |
| Pin 消息 | ✅ | ✅ | ❌ | ❌ |
| 禁言用户 | ✅ | ✅ | ❌ | ❌ |
| 踢出用户 | ✅ | ✅ | ❌ | ❌ |
| 封禁用户 | ✅ | ❌ | ❌ | ❌ |
| 管理权限 | ✅ | ❌ | ❌ | ❌ |

---

## 二、数据模型

### Permission Model
```javascript
{
  id: 'uuid',
  channelId: 'string',          // 频道 ID
  userId: 'string',             // 用户 ID
  role: 'enum[admin, moderator, member, guest]',

  // 自定义权限覆盖
  customPermissions: {
    canCreateChannel: false,
    canEditChannel: false,
    canDeleteChannel: false,
    canManageMembers: false,
    canSendMessage: true,
    canEditMessage: true,
    canDeleteMessage: true,
    canDeleteOthersMessage: false,
    canPinMessage: false,
    canMuteUser: false,
    canKickUser: false,
    canBanUser: false,
    canChangeTopicMessage: false,
    canManagePermissions: false
  },

  // 限制
  restrictions: {
    isMuted: false,
    muteUntil: null,
    isKicked: false,
    isBanned: false,
    bannedUntil: null
  },

  createdAt: 'timestamp',
  updatedAt: 'timestamp'
}
```

### PermissionRole Reference
```javascript
const ROLE_PERMISSIONS = {
  admin: [
    'create_channel', 'edit_channel', 'delete_channel',
    'manage_members', 'send_message', 'edit_message',
    'delete_message', 'delete_others_message', 'pin_message',
    'mute_user', 'kick_user', 'ban_user',
    'change_topic', 'manage_permissions'
  ],

  moderator: [
    'edit_channel', 'manage_members', 'send_message',
    'edit_message', 'delete_message', 'delete_others_message',
    'pin_message', 'mute_user', 'kick_user', 'change_topic'
  ],

  member: [
    'send_message', 'edit_message', 'delete_message'
  ],

  guest: []
}
```

---

## 三、权限检查系统

### 3.1 权限检查流程

```
请求
  ↓
身份验证 (Authentication)
  - 验证 JWT token
  - 获取用户信息
  ↓
权限检查 (Authorization)
  - 获取用户在该频道的角色
  - 检查是否被限制（禁言、踢出、封禁）
  - 检查是否有所需权限
  ↓
资源所有权检查 (Resource Ownership)
  - 对于编辑/删除操作，检查是否是所有者
  ↓
业务逻辑处理
  ↓
响应
```

### 3.2 权限检查函数

```javascript
/**
 * 检查用户是否有权限执行某个操作
 * @param {number} userId - 用户 ID
 * @param {number} channelId - 频道 ID
 * @param {string} permission - 权限标识
 * @returns {Promise<boolean>} 是否有权限
 */
async function hasPermission(userId, channelId, permission) {
  // 1. 获取用户在频道的权限信息
  const userPermission = await getChannelPermission(userId, channelId)

  if (!userPermission) {
    return false // 用户不在频道中
  }

  // 2. 检查是否被限制
  if (userPermission.restrictions.isMuted) {
    return false // 禁言用户不能发送消息
  }

  if (userPermission.restrictions.isBanned) {
    return false // 被封禁的用户没有任何权限
  }

  if (userPermission.restrictions.isKicked) {
    return false // 被踢出的用户没有权限
  }

  // 3. 检查自定义权限覆盖
  const permissionKey = permissionToKey(permission)
  if (userPermission.customPermissions[permissionKey] !== undefined) {
    return userPermission.customPermissions[permissionKey]
  }

  // 4. 检查角色权限
  const rolePermissions = ROLE_PERMISSIONS[userPermission.role]
  return rolePermissions.includes(permission)
}

/**
 * 检查用户是否可以编辑消息
 * @param {number} userId - 用户 ID
 * @param {number} messageId - 消息 ID
 * @param {number} channelId - 频道 ID
 * @returns {Promise<boolean>}
 */
async function canEditMessage(userId, messageId, channelId) {
  const message = await getMessage(messageId)

  // 只有消息所有者和 admin/moderator 可以编辑
  if (message.senderId === userId) {
    return hasPermission(userId, channelId, 'edit_message')
  }

  return hasPermission(userId, channelId, 'delete_others_message')
}

/**
 * 检查用户是否可以删除消息
 */
async function canDeleteMessage(userId, messageId, channelId) {
  const message = await getMessage(messageId)

  // 只有消息所有者和 admin/moderator 可以删除
  if (message.senderId === userId) {
    return hasPermission(userId, channelId, 'delete_message')
  }

  return hasPermission(userId, channelId, 'delete_others_message')
}
```

### 3.3 中间件实现

```javascript
/**
 * 权限检查中间件
 * 使用示例: router.post('/messages', checkPermission('send_message'), sendMessage)
 */
function checkPermission(permission) {
  return async (req, res, next) => {
    const { userId } = req.user
    const { channelId } = req.params

    try {
      const allowed = await hasPermission(userId, channelId, permission)

      if (!allowed) {
        return res.status(403).json({
          code: 403,
          message: 'Permission denied',
          permission,
          channelId
        })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({
        code: 500,
        message: 'Internal server error'
      })
    }
  }
}

/**
 * 检查资源所有权的中间件
 */
function checkResourceOwnership(resourceType) {
  return async (req, res, next) => {
    const { userId } = req.user
    const { [resourceType + 'Id']: resourceId } = req.params

    try {
      const resource = await getResource(resourceType, resourceId)

      if (!resource) {
        return res.status(404).json({
          code: 404,
          message: `${resourceType} not found`
        })
      }

      if (resource.ownerId !== userId && !isAdmin(userId)) {
        return res.status(403).json({
          code: 403,
          message: 'You are not the owner of this resource'
        })
      }

      req.resource = resource
      next()
    } catch (error) {
      console.error('Ownership check error:', error)
      res.status(500).json({
        code: 500,
        message: 'Internal server error'
      })
    }
  }
}
```

---

## 四、权限管理 API

### 获取权限信息
```javascript
GET /api/channels/:channelId/permissions/:userId

Response:
{
  code: 200,
  data: {
    userId,
    channelId,
    role: 'member',
    permissions: ['send_message', 'edit_message'],
    restrictions: {
      isMuted: false,
      isKicked: false,
      isBanned: false
    }
  }
}
```

### 设置用户角色
```javascript
PUT /api/channels/:channelId/permissions/:userId/role

Request:
{
  role: 'moderator'  // admin, moderator, member, guest
}

Response:
{
  code: 200,
  message: 'Role updated successfully'
}
```

### 禁言用户
```javascript
POST /api/channels/:channelId/permissions/:userId/mute

Request:
{
  duration: 3600  // 秒数，null 表示永久
}

Response:
{
  code: 200,
  message: 'User muted successfully'
}
```

### 踢出用户
```javascript
POST /api/channels/:channelId/permissions/:userId/kick

Response:
{
  code: 200,
  message: 'User kicked from channel'
}
```

### 封禁用户
```javascript
POST /api/channels/:channelId/permissions/:userId/ban

Request:
{
  duration: null  // null 表示永久
}

Response:
{
  code: 200,
  message: 'User banned successfully'
}
```

### 解除限制
```javascript
DELETE /api/channels/:channelId/permissions/:userId/restrictions/:type

// :type = mute | kick | ban

Response:
{
  code: 200,
  message: 'Restriction removed'
}
```

---

## 五、实现清单

### 后端实现

- [ ] Permission Model（数据模型）
- [ ] Permission Service（权限检查服务）
- [ ] Permission Middleware（中间件）
- [ ] Permission Routes（API 路由）
- [ ] Permission Controller（业务逻辑控制器）

### 前端实现

- [ ] Permission Store（权限状态管理）
- [ ] usePermissions Composable（组合式函数）
- [ ] 权限检查 Guards（路由守卫）
- [ ] 权限相关 UI 组件

---

## 六、安全考虑

### 6.1 安全原则

1. **最小权限原则**: 默认拒绝，明确允许
2. **权限继承**: 更高权限继承更低权限
3. **权限分离**: 关键操作需要多人批准
4. **审计日志**: 记录所有权限相关操作

### 6.2 防护措施

```javascript
// 1. 权限检查缓存（防止数据库过载）
const permissionCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

function getCachedPermission(userId, channelId) {
  const key = `${userId}:${channelId}`
  const cached = permissionCache.get(key)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  return null
}

// 2. 权限操作审计
async function auditPermissionChange(userId, operation, details) {
  await AuditLog.create({
    userId,
    operation,
    details,
    timestamp: new Date(),
    ipAddress: getClientIP()
  })
}

// 3. 速率限制
function rateLimit(operation, userId, limit = 10, window = 60000) {
  const key = `ratelimit:${operation}:${userId}`
  const count = cache.get(key) || 0

  if (count >= limit) {
    throw new Error('Too many requests')
  }

  cache.set(key, count + 1, window)
}
```

---

## 七、权限检查示例

### 发送消息
```javascript
router.post('/channels/:channelId/messages',
  checkPermission('send_message'),
  async (req, res) => {
    // 用户已通过权限检查
    const { channelId } = req.params
    const { content } = req.body
    const userId = req.user.id

    const message = await createMessage({
      channelId,
      senderId: userId,
      content,
      createdAt: new Date()
    })

    res.json({ code: 200, data: { message } })
  }
)
```

### 编辑消息
```javascript
router.put('/messages/:messageId',
  checkResourceOwnership('message'),
  async (req, res) => {
    const { messageId } = req.params
    const { content } = req.body
    const userId = req.user.id

    const message = req.resource
    const channelId = message.channelId

    // 检查编辑权限
    if (!await canEditMessage(userId, messageId, channelId)) {
      return res.status(403).json({
        code: 403,
        message: 'You do not have permission to edit this message'
      })
    }

    await updateMessage(messageId, { content })
    res.json({ code: 200, message: 'Updated' })
  }
)
```

### 删除消息
```javascript
router.delete('/messages/:messageId',
  async (req, res) => {
    const { messageId } = req.params
    const userId = req.user.id

    const message = await getMessage(messageId)
    const channelId = message.channelId

    // 检查删除权限
    if (!await canDeleteMessage(userId, messageId, channelId)) {
      return res.status(403).json({
        code: 403,
        message: 'You do not have permission to delete this message'
      })
    }

    await deleteMessage(messageId)
    res.json({ code: 200, message: 'Deleted' })
  }
)
```

---

## 八、前端权限 Guards

### 路由守卫
```javascript
// router guards
router.beforeEach(async (to, from, next) => {
  const permissionStore = usePermissions()

  // 检查路由是否需要权限
  if (to.meta.requiredPermission) {
    const channelId = to.params.channelId
    const permission = to.meta.requiredPermission

    const hasAccess = await permissionStore.check(permission, channelId)

    if (!hasAccess) {
      next({ name: 'Unauthorized' })
      return
    }
  }

  next()
})
```

### 条件渲染
```vue
<template>
  <div class="message">
    <!-- 只有有权限的用户才能看到编辑/删除按钮 -->
    <div v-if="canEditMessage" class="actions">
      <button @click="editMessage">编辑</button>
      <button @click="deleteMessage">删除</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePermissions } from '@/stores/permissions'

const props = defineProps({
  message: Object,
  channelId: String
})

const permissionStore = usePermissions()

const canEditMessage = computed(() => {
  return permissionStore.check('edit_message', props.channelId)
})
</script>
```

---

## 九、审计和日志

### 权限操作审计日志
```javascript
{
  id: 'uuid',
  timestamp: '2025-11-12T10:00:00Z',
  operation: 'mute_user',
  actor: {
    userId: 1,
    username: 'admin'
  },
  target: {
    userId: 2,
    username: 'user2',
    channelId: 1
  },
  details: {
    duration: 3600,
    reason: 'Spam'
  },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
}
```

---

## 十、迁移和升级

### 从无权限系统到有权限系统

```javascript
// Migration script
async function migrateToPermissionSystem() {
  const channels = await Channel.find()

  for (const channel of channels) {
    // 为频道创建者设置为 admin
    await Permission.create({
      channelId: channel.id,
      userId: channel.creatorId,
      role: 'admin'
    })

    // 为其他成员设置为 member
    for (const memberId of channel.memberIds) {
      if (memberId !== channel.creatorId) {
        await Permission.create({
          channelId: channel.id,
          userId: memberId,
          role: 'member'
        })
      }
    }
  }
}
```

---

## 十一、性能优化

### 权限缓存策略
```javascript
const permissionCache = new Map()

function cachePermission(key, data, ttl = 5 * 60 * 1000) {
  permissionCache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  })
}

function getCachedPermission(key) {
  const cached = permissionCache.get(key)

  if (!cached) return null
  if (cached.expiresAt < Date.now()) {
    permissionCache.delete(key)
    return null
  }

  return cached.data
}

// 使用
const cacheKey = `${userId}:${channelId}`
let permission = getCachedPermission(cacheKey)

if (!permission) {
  permission = await getPermissionFromDB(userId, channelId)
  cachePermission(cacheKey, permission)
}
```

---

## 总结

该权限系统提供了：
- ✅ 灵活的角色和权限定义
- ✅ 细粒度的访问控制
- ✅ 高效的权限检查
- ✅ 安全的限制管理
- ✅ 完整的审计日志
- ✅ 易于扩展的架构

可以满足从简单的团队到复杂的企业级应用的需求。
