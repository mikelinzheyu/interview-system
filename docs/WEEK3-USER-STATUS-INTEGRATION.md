# 第3周 - 用户状态增强功能集成指南

**完成日期**: 2024年
**功能状态**: ✅ 完成
**版本**: 1.0

---

## 📋 功能概述

第3周实现了用户状态管理的完整解决方案，包括：

### 核心功能
1. **自动状态管理** - 基于用户活动自动转换状态
2. **自定义状态消息** - 用户可设置个性化状态消息
3. **状态持久化** - 使用 localStorage 保存用户状态
4. **实时同步** - 支持与服务器的状态同步
5. **状态历史追踪** - 完整的状态变化历史记录

---

## 📦 新增文件清单

### 服务层
- `frontend/src/services/userStatusEnhancedService.js` (400+行)
  - UserStatusManager 类
  - 完整的状态管理逻辑
  - 自动状态检测和转换
  - 状态持久化接口

### 后端 API
- `backend/mock-server.js` - 新增 5 个用户状态 API 端点
  ```
  GET /api/chat/users/me/status
  PUT /api/chat/users/me/status
  GET /api/chat/users/:userId/status
  POST /api/chat/users/statuses
  PUT /api/chat/users/me/status-message
  GET /api/chat/users/me/status-history
  ```

### 前端 API 层
- `frontend/src/api/chat.js` - 新增 6 个 API 函数
  ```javascript
  getCurrentUserStatus()
  updateUserStatus(data)
  getUserStatus(userId)
  getUserStatuses(userIds)
  setStatusMessage(message)
  getStatusHistory(params)
  ```

### UI 组件
- `frontend/src/components/chat/UserStatusIndicator.vue` (400+行)
  - 当前用户状态显示和控制
  - 状态选择面板
  - 自定义消息编辑
  - 状态历史显示
  - 服务器同步功能

- `frontend/src/components/chat/UserStatusBadge.vue` (100+行)
  - 用户状态徽章展示
  - 支持其他用户状态显示
  - 自定义消息显示
  - 可配置样式和尺寸

---

## 🚀 集成步骤

### 步骤1：在 ChatRoom.vue 中导入组件

```vue
<script setup>
import UserStatusIndicator from '@/components/chat/UserStatusIndicator.vue'
import UserStatusBadge from '@/components/chat/UserStatusBadge.vue'
</script>
```

### 步骤2：在模板中使用状态指示器

在 ChatRoom.vue 的适当位置添加用户状态指示器：

```vue
<template>
  <div class="chat-room">
    <!-- 顶部状态栏 -->
    <div class="chat-header">
      <h2>{{ roomName }}</h2>
      <!-- 添加用户状态指示器 -->
      <UserStatusIndicator />
    </div>

    <!-- 聊天内容区 -->
    <div class="chat-main">
      <!-- 现有的聊天内容 -->
    </div>

    <!-- 聊天输入区 -->
    <div class="chat-footer">
      <!-- 现有的输入框 -->
    </div>
  </div>
</template>
```

### 步骤3：在会话列表中显示其他用户状态

在 ConversationListEnhanced.vue 或 ConversationListItem.vue 中使用状态徽章：

```vue
<template>
  <div class="conversation-item">
    <div class="conversation-header">
      <h3>{{ conversation.name }}</h3>
      <!-- 显示用户状态徽章 -->
      <UserStatusBadge
        :status="userStatus"
        :customStatus="userCustomStatus"
        :showLabel="true"
        show-custom-message
      />
    </div>
    <div class="conversation-preview">
      {{ conversation.lastMessage }}
    </div>
  </div>
</template>
```

---

## 🔧 使用示例

### 示例1：获取当前用户状态

```javascript
import { getCurrentUserStatus } from '@/api/chat'

async function checkMyStatus() {
  try {
    const response = await getCurrentUserStatus()
    console.log('My Status:', response.data)
    // 输出: { userId: 1, status: 'online', customStatus: '在忙碌中...', ... }
  } catch (error) {
    console.error('Failed to get status:', error)
  }
}
```

### 示例2：更新用户状态

```javascript
import { updateUserStatus } from '@/api/chat'

async function setMyStatus() {
  try {
    await updateUserStatus({
      status: 'busy',
      customStatus: '在开会中，稍后回复'
    })
    console.log('Status updated successfully')
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}
```

### 示例3：批量获取多个用户状态

```javascript
import { getUserStatuses } from '@/api/chat'

async function getTeamStatuses() {
  try {
    const response = await getUserStatuses([1, 2, 3, 4, 5])
    console.log('Team statuses:', response.data.statuses)
    // 输出: [
    //   { userId: 1, status: 'online', ... },
    //   { userId: 2, status: 'away', ... },
    //   ...
    // ]
  } catch (error) {
    console.error('Failed to get team statuses:', error)
  }
}
```

### 示例4：使用服务层直接管理状态

```javascript
import {
  getStatusManager,
  getCurrentUserStatus,
  setUserStatus,
  setStatusMessage
} from '@/services/userStatusEnhancedService'

// 获取管理器实例
const manager = getStatusManager()

// 获取当前状态
const status = getCurrentUserStatus()
console.log('Current status:', status)

// 设置新状态
setUserStatus('away', '午休中')

// 只设置自定义消息
setStatusMessage('在处理紧急任务...')

// 监听状态变化
manager.onStatusChange((data) => {
  console.log(`Status changed: ${data.oldStatus} -> ${data.newStatus}`)
})

// 获取状态历史
const history = manager.getStatusHistory(10)
console.log('Status history:', history)
```

---

## 📊 状态类型说明

| 状态 | 图标 | 描述 | 自动转换条件 |
|------|------|------|------------|
| online | 🟢 | 在线 | 用户正在活动 |
| away | 🟡 | 离开 | 5分钟无活动 |
| busy | 🔴 | 忙碌 | 用户手动设置 |
| offline | ⚫ | 离线 | 30分钟无活动 |

### 活动事件
以下事件会更新活动时间：
- 鼠标点击 (mousedown)
- 键盘输入 (keydown)
- 触摸屏操作 (touchstart)
- 通用点击 (click)

---

## ⚙️ 配置参数

在 `userStatusEnhancedService.js` 中可以调整以下参数：

```javascript
const USER_STATUS_CONFIG = {
  STATUS_TYPES: { /* 状态定义 */ },
  STATUS_TIMEOUT: 5 * 60 * 1000,      // 自动 away 时间(默认5分钟)
  AUTO_OFFLINE: 30 * 60 * 1000,       // 自动 offline 时间(默认30分钟)
  SYNC_INTERVAL: 30 * 1000,           // 与服务器同步周期(默认30秒)
  STORAGE_KEY: 'user_status_custom'   // localStorage 存储键
}
```

### 调整示例

如需修改自动离开的时间间隔：

```javascript
// 改为10分钟
STATUS_TIMEOUT: 10 * 60 * 1000

// 改为1小时自动离线
AUTO_OFFLINE: 60 * 60 * 1000

// 改为每5秒同步一次
SYNC_INTERVAL: 5 * 1000
```

---

## 🔄 自动状态管理流程

```
┌─ 用户活动 (鼠标/键盘/触摸)
│
├─ 记录活动时间
│
├─ 每60秒检查一次
│  ├─ 如果无活动 > 5分钟 且状态为online
│  │  └─ 自动转换为 away
│  │
│  ├─ 如果无活动 > 30分钟 且状态非offline
│  │  └─ 自动转换为 offline
│  │
│  └─ 如果恢复活动 且状态为away
│     └─ 自动恢复为 online
│
└─ 状态变化时
   ├─ 触发所有回调函数
   ├─ 记录状态历史
   └─ 持久化到 localStorage
```

---

## 💾 数据持久化

### localStorage 存储结构

状态数据存储在 localStorage 中，键为 `user_status_custom`：

```javascript
{
  status: 'online',              // 当前状态
  customStatus: '在忙碌中...',    // 自定义消息
  lastUpdateTime: '2024-01-15T10:30:00.000Z'
}
```

### 恢复规则
- 页面刷新时自动恢复上次保存的状态
- 如果保存状态为 offline，启动时恢复为 online
- 其他状态保持原样恢复

---

## 🎯 API 端点详解

### GET /api/chat/users/me/status
获取当前用户状态

**请求**: 无需参数

**响应示例**:
```json
{
  "userId": 1,
  "status": "online",
  "customStatus": "在忙碌中...",
  "lastActivityTime": "2024-01-15T10:35:00.000Z",
  "inactiveTime": 300000,
  "statusInfo": {
    "label": "在线",
    "icon": "🟢",
    "priority": 1
  }
}
```

### PUT /api/chat/users/me/status
更新当前用户状态

**请求体**:
```json
{
  "status": "away",
  "customStatus": "午休中"
}
```

**响应示例**:
```json
{
  "userId": 1,
  "status": "away",
  "customStatus": "午休中",
  "lastActivityTime": "2024-01-15T10:35:00.000Z",
  "updatedAt": "2024-01-15T10:36:00.000Z",
  "message": "状态已更新"
}
```

### POST /api/chat/users/statuses
批量获取多个用户状态

**请求体**:
```json
{
  "userIds": [1, 2, 3, 4]
}
```

**响应示例**:
```json
{
  "statuses": [
    {
      "userId": 1,
      "status": "online",
      "customStatus": null,
      "statusInfo": { "label": "在线", "icon": "🟢" }
    },
    {
      "userId": 2,
      "status": "away",
      "customStatus": "午休",
      "statusInfo": { "label": "离开", "icon": "🟡" }
    }
  ]
}
```

---

## 🧪 测试用例

### 测试1：状态自动转换

```javascript
// 1. 获取初始状态(应为online)
const initial = getCurrentUserStatus()
console.assert(initial.status === 'online', 'Initial status should be online')

// 2. 等待5分钟不操作
setTimeout(() => {
  // 3. 检查状态(应为away)
  const after5min = getCurrentUserStatus()
  console.assert(after5min.status === 'away', 'Status should be away after 5 mins')
}, 5 * 60 * 1000)
```

### 测试2：手动状态设置

```javascript
// 设置忙碌状态
setUserStatus('busy', '在开会')

// 验证状态
const current = getCurrentUserStatus()
console.assert(current.status === 'busy', 'Status should be busy')
console.assert(current.customStatus === '在开会', 'Custom message should match')
```

### 测试3：状态历史记录

```javascript
// 变更多个状态
setUserStatus('online')
setUserStatus('busy')
setUserStatus('away')

// 获取历史
const history = getStatusHistory(10)
console.assert(history.length >= 3, 'Should have at least 3 history records')
console.assert(history[0].to === 'away', 'Latest status should be away')
```

---

## 📚 文件位置快速参考

```
frontend/
├── src/
│   ├── api/
│   │   └── chat.js ..................... ✅ 6个新API函数
│   │
│   ├── components/chat/
│   │   ├── UserStatusIndicator.vue ..... ✅ 新增(400+行)
│   │   └── UserStatusBadge.vue ......... ✅ 新增(100+行)
│   │
│   └── services/
│       └── userStatusEnhancedService.js  ✅ 新增(400+行)
│
backend/
└── mock-server.js ...................... ✅ +6个API端点

文档/
└── WEEK3-USER-STATUS-INTEGRATION.md ... ✅ 本文件
```

---

## ✅ 质量检查清单

- [x] 服务层完整实现
- [x] 后端API端点实现
- [x] 前端API函数实现
- [x] UI组件完整
- [x] 状态自动转换逻辑
- [x] 数据持久化
- [x] 事件回调系统
- [x] 错误处理
- [x] 文档完整

---

## 🚨 常见问题

### Q1: 如何手动触发状态同步？

```javascript
import { getStatusManager } from '@/services/userStatusEnhancedService'
const manager = getStatusManager()
await manager.syncStatusToServer()
```

### Q2: 如何禁用自动状态转换？

在组件中加载服务后，可以管理活动监听：

```javascript
const manager = getStatusManager()
// 停止同步(会停止自动检查)
manager.stopStatusSync()
```

### Q3: 如何清除所有状态数据？

```javascript
import { getStatusManager } from '@/services/userStatusEnhancedService'
const manager = getStatusManager()
manager.clear()  // 清除本地数据
manager.destroy() // 销毁管理器
```

### Q4: 自定义消息有长度限制吗？

是的，限制为50个字符。在 `userStatusEnhancedService.js` 中的 `setCustomMessage()` 方法验证。

---

## 📈 性能考虑

### 优化点
1. **活动检查间隔** - 每60秒检查一次(可调整)
2. **状态同步频率** - 每30秒同步一次(可调整)
3. **历史记录限制** - 最多保存100条记录，超出自动删除
4. **localStorage使用** - 仅保存必要数据，占用空间<1KB

### 监控建议
- 监控状态变化事件频率
- 监控API调用频率
- 定期检查localStorage使用量

---

## 🔐 安全建议

1. **验证用户身份** - 只允许用户修改自己的状态
2. **输入验证** - 自定义消息长度和内容验证
3. **API认证** - 所有状态API应需要有效的身份认证
4. **速率限制** - 限制状态更新频率防止滥用

---

## 📞 后续工作

### 即将实现的功能
1. WebSocket 实时状态推送
2. 状态变化通知系统
3. 团队成员在线状态显示
4. 状态相关的提示和提醒

### 下一阶段计划
- [ ] 集成测试编写
- [ ] 性能基准测试
- [ ] 用户体验优化
- [ ] 文档完善

---

**项目状态**: ✅ 第3周完成
**下一个里程碑**: 第4周 - 集成测试和性能优化
**预计完成**: 6-8周内

🎉 **第3周用户状态增强功能已完成！**

