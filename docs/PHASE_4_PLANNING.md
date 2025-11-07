# Phase 4: 管理员仪表板和实时功能系统 - 架构规划

## 📋 Phase 4 概览

**目标**: 为管理员提供完整的系统管理和监控能力，实现实时通知系统

**预计工作量**: 2-3 周
**优先级**: 🔴 **高** (生产环境必需)
**相关技术**: Vue 3, WebSocket, ECharts, Pinia

---

## 🏗️ 系统架构设计

### 前端结构
```
frontend/src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.vue          (主仪表板)
│   │   ├── AdminUserManager.vue        (用户管理)
│   │   ├── AdminContentModeration.vue  (内容审核)
│   │   ├── AdminActivityMonitor.vue    (活动监控)
│   │   └── AdminAnalytics.vue          (高级分析)
│   ├── notification/
│   │   ├── NotificationCenter.vue      (通知中心)
│   │   ├── RealtimeNotificationPanel.vue (实时通知)
│   │   └── NotificationBell.vue        (通知铃铛)
│   └── ...
├── services/
│   ├── adminService.js                 (管理服务)
│   ├── notificationService.js          (通知服务)
│   └── ...
├── stores/
│   ├── admin.js                        (管理员状态)
│   ├── notification.js                 (通知状态)
│   └── ...
└── router/
    └── index.js (新增管理路由)
```

### 后端结构
```
backend/src/main/java/com/interview/
├── controller/
│   ├── AdminController.java            (管理员控制器)
│   ├── NotificationController.java     (通知控制器)
│   └── ...
├── service/
│   ├── AdminService.java               (管理服务接口)
│   ├── AdminServiceImpl.java            (管理服务实现)
│   ├── NotificationService.java        (通知服务接口)
│   ├── NotificationServiceImpl.java     (通知服务实现)
│   └── ...
├── websocket/
│   ├── NotificationWebSocketHandler.java
│   ├── AdminActivityWebSocketHandler.java
│   └── ...
├── entity/
│   ├── Notification.java
│   ├── NotificationLog.java
│   ├── AdminLog.java
│   └── ...
└── ...
```

---

## 📦 主要组件详解

### 1. **AdminDashboard.vue** (主仪表板) - 500+ 行

**功能**:
- 📊 系统概览卡片 (用户数、内容数、活动数)
- 📈 实时数据图表 (用户增长、活动趋势)
- ⚠️ 告警和警告面板
- 🎯 关键指标展示
- 🔄 实时更新

**子组件**:
- SystemStats.vue (系统统计卡片)
- DashboardCharts.vue (图表展示)
- AlertsPanel.vue (告警面板)
- QuickActions.vue (快速操作)

---

### 2. **AdminUserManager.vue** (用户管理) - 450+ 行

**功能**:
- 👥 用户列表（搜索、分页、排序）
- 🔍 用户搜索和过滤
  - 按用户名搜索
  - 按状态过滤 (活跃/禁用/新用户)
  - 按角色过滤
  - 按加入日期过滤
- 👤 用户详情查看
  - 基本信息
  - 学习统计
  - 活动历史
  - 违规记录
- ⚙️ 用户管理操作
  - 启用/禁用用户
  - 修改角色
  - 发送通知
  - 导出用户数据
  - 删除账户

**数据表**:
```
用户信息表格
├── 用户名 + 头像
├── 邮箱
├── 注册日期
├── 最后活动
├── 状态 (活跃/禁用)
├── 角色 (普通用户/VIP/管理员)
├── 学习进度
└── 操作按钮
```

---

### 3. **AdminContentModeration.vue** (内容审核) - 450+ 行

**功能**:
- 📋 待审核内容队列
  - 论坛帖子
  - 用户指南
  - 用户评论
  - 报告内容
- 📄 内容预览
  - 完整内容显示
  - 作者信息
  - 报告原因
  - 用户举报数
- ✅ 审核操作
  - 批准发布
  - 拒绝发布（附加理由）
  - 删除内容
  - 标记为垃圾
  - 警告用户
- 📊 审核统计
  - 审核队列长度
  - 平均审核时间
  - 通过率
  - 被拒内容趋势

---

### 4. **NotificationCenter.vue** (通知中心) - 350+ 行

**功能**:
- 🔔 通知列表（分类显示）
  - 系统通知
  - 用户互动
  - 内容更新
  - 审核结果
- 🏷️ 通知分类和过滤
  - 全部通知
  - 未读通知
  - 已读通知
  - 重要通知
- 📝 通知详情
  - 标题和内容
  - 时间戳
  - 发件人/来源
  - 操作按钮
- 🗑️ 通知管理
  - 标记为已读
  - 删除通知
  - 清空全部
  - 搜索通知

---

### 5. **RealtimeNotificationPanel.vue** (实时通知) - 300+ 行

**功能**:
- ⚡ 实时通知显示
  - 系统事件
  - 用户动作
  - 内容更新
  - 告警信息
- 🎯 通知优先级
  - 紧急（红色）
  - 重要（橙色）
  - 信息（蓝色）
  - 普通（灰色）
- 🔊 通知提醒
  - 声音提醒
  - 桌面通知
  - 浏览器标题闪烁
- ⌚ 实时更新
  - WebSocket 推送
  - 自动刷新
  - 中断恢复

---

### 6. **后端服务**

#### **adminService.js** (400+ 行)
```javascript
// 用户管理
getUsers(filters, pagination)          // 获取用户列表
getUserDetails(userId)                 // 获取用户详情
updateUserStatus(userId, status)       // 更新用户状态
updateUserRole(userId, role)           // 更新用户角色
deleteUser(userId)                     // 删除用户

// 内容审核
getPendingContent(filters)             // 获取待审核内容
getContentDetails(contentId)           // 获取内容详情
approveContent(contentId)              // 批准内容
rejectContent(contentId, reason)       // 拒绝内容
deleteContent(contentId)               // 删除内容

// 统计和分析
getSystemStats()                       // 获取系统统计
getUserStats(timeRange)                // 获取用户统计
getContentStats(timeRange)             // 获取内容统计
getActivityStats(timeRange)            // 获取活动统计

// 管理员日志
getAdminLogs(filters)                  // 获取管理员操作日志
logAdminAction(action, details)        // 记录管理员操作
```

#### **notificationService.js** (400+ 行)
```javascript
// 通知管理
createNotification(type, data)         // 创建通知
getNotifications(filters)              // 获取通知列表
getUnreadCount()                       // 获取未读数
markAsRead(notificationId)             // 标记已读
deleteNotification(notificationId)     // 删除通知

// 批量操作
markAllAsRead()                        // 全部标记已读
deleteAllNotifications()               // 删除全部通知
deleteOldNotifications(days)           // 删除旧通知

// WebSocket
subscribeNotifications(userId)         // 订阅通知
unsubscribeNotifications(userId)       // 取消订阅
broadcastNotification(notification)    // 广播通知

// 通知类型
sendSystemNotification(message)        // 系统通知
sendUserInteractionNotification(...)   // 用户互动通知
sendContentNotification(...)           // 内容更新通知
sendAuditNotification(...)             // 审核结果通知
```

---

## 🔌 WebSocket 实时更新

### 实时推送的事件类型

```javascript
// 系统事件
'system:user-login'                    // 用户登录
'system:user-logout'                   // 用户登出
'system:content-created'               // 新内容创建
'system:content-deleted'               // 内容删除

// 用户交互
'user:post-created'                    // 发布新帖
'user:comment-created'                 // 新评论
'user:like-received'                   // 获赞
'user:follow'                          // 被关注

// 内容审核
'audit:content-approved'               // 内容已批准
'audit:content-rejected'               // 内容已拒绝
'audit:content-deleted'                // 内容已删除

// 系统告警
'alert:high-error-rate'                // 高错误率告警
'alert:server-slow'                    // 服务器缓慢
'alert:disk-full'                      // 磁盘满告警
```

---

## 📊 数据模型

### Notification Entity
```javascript
{
  id: string,
  userId: string,
  type: 'system' | 'user' | 'content' | 'audit',
  title: string,
  content: string,
  priority: 'urgent' | 'important' | 'info' | 'normal',
  read: boolean,
  data: object,                        // 关联数据
  createdAt: timestamp,
  updatedAt: timestamp,
  expiresAt: timestamp                 // 过期时间
}
```

### AdminLog Entity
```javascript
{
  id: string,
  adminId: string,
  action: string,                      // 操作类型
  targetType: string,                  // 目标类型 (user/content)
  targetId: string,
  details: object,
  status: 'success' | 'failed',
  createdAt: timestamp
}
```

---

## 🔐 权限控制

### 路由权限
```javascript
{
  path: '/admin',
  component: AdminLayout,
  meta: { requiresAuth: true, roles: ['admin'] },
  children: [
    { path: 'dashboard', component: AdminDashboard },
    { path: 'users', component: AdminUserManager },
    { path: 'moderation', component: AdminContentModeration },
    { path: 'analytics', component: AdminAnalytics }
  ]
}
```

### API权限检查
- 仅允许管理员访问 `/api/admin/*` 端点
- 所有管理操作必须记录日志
- 敏感操作需要确认

---

## 🎯 集成点

### 与现有系统的集成
1. **用户系统**: 获取用户信息、修改用户状态
2. **论坛系统**: 获取待审核帖子、批准/拒绝
3. **指南系统**: 获取待审核指南、管理指南
4. **通知系统**: 创建和发送通知
5. **WebSocket**: 实时推送事件

---

## 📱 响应式设计

- 桌面: 完整功能
- 平板: 优化布局
- 手机: 简化视图，核心功能可用

---

## 🧪 测试计划

### 单元测试
- [ ] 用户管理逻辑
- [ ] 内容审核逻辑
- [ ] 通知创建和推送
- [ ] 权限检查

### 集成测试
- [ ] API 端点测试
- [ ] WebSocket 实时推送
- [ ] 数据库操作
- [ ] 日志记录

### E2E 测试
- [ ] 管理员登录流程
- [ ] 用户管理流程
- [ ] 内容审核流程
- [ ] 实时通知流程

---

## 📚 文档计划

1. **P4_ADMIN_DASHBOARD_GUIDE.md** - 管理员仪表板完全指南
2. **P4_NOTIFICATION_SYSTEM_GUIDE.md** - 实时通知系统指南
3. **P4_WEBSOCKET_INTEGRATION.md** - WebSocket 集成文档
4. **P4_COMPLETION_REPORT.md** - Phase 4 完成报告

---

## 🚀 实现顺序

1. **第一步**: 实现 adminService.js 和 notificationService.js
2. **第二步**: 实现 AdminDashboard.vue 主仪表板
3. **第三步**: 实现 AdminUserManager.vue 用户管理
4. **第四步**: 实现 AdminContentModeration.vue 内容审核
5. **第五步**: 实现 NotificationCenter.vue 通知中心
6. **第六步**: 实现 RealtimeNotificationPanel.vue 实时通知
7. **第七步**: WebSocket 集成和实时推送
8. **第八步**: 测试和文档
9. **第九步**: Git 提交

---

## ✅ 验收标准

- ✅ 所有 9 个 React 组件完全实现
- ✅ 所有 2 个服务完全实现
- ✅ WebSocket 实时推送工作正常
- ✅ 权限控制正确实现
- ✅ 响应式设计在各设备上工作良好
- ✅ 单元测试覆盖率 > 80%
- ✅ 完整的 API 文档
- ✅ 完整的用户文档

---

**准备开始实现？** 🚀

接下来将实现: adminService.js → AdminDashboard.vue → ...
