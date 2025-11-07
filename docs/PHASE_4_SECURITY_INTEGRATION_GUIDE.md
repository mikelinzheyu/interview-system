# Phase 4 安全与实时功能集成指南

## 📋 目录
1. [WebSocket 实时通知集成](#websocket-实时通知集成)
2. [权限控制系统](#权限控制系统)
3. [API 安全与拦截](#api-安全与拦截)
4. [路由保护](#路由保护)
5. [完整集成示例](#完整集成示例)
6. [测试与验证](#测试与验证)

---

## 🔌 WebSocket 实时通知集成

### 概述
WebSocket 处理程序提供实时、双向的通信能力，支持：
- 实时通知推送
- 管理员活动监控
- 系统告警
- 自动重连机制

### 初始化

```javascript
// main.js
import { NotificationWebSocketHandler, AdminActivityWebSocketHandler } from '@/utils/NotificationWebSocketHandler'

// 应用启动时连接
const app = createApp(App)
app.config.globalProperties.$ws = NotificationWebSocketHandler

// 在用户登录后初始化 WebSocket
const initWebSocket = async (userId) => {
  try {
    await NotificationWebSocketHandler.connect(userId, 'ws://api.example.com/ws/notifications')
    AdminActivityWebSocketHandler.init(userId)
    console.log('✅ WebSocket connected and ready')
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
  }
}
```

### 监听通知事件

```javascript
// 在组件中使用
import { NotificationWebSocketHandler } from '@/utils/NotificationWebSocketHandler'

export default {
  setup() {
    const notifications = ref([])

    onMounted(() => {
      // 监听新通知
      NotificationWebSocketHandler.on('notification:new', (notification) => {
        notifications.value.unshift(notification)
        ElMessage.success('收到新通知')
      })

      // 监听内容审核事件
      NotificationWebSocketHandler.on('content:moderated', (data) => {
        console.log('内容已审核:', data)
        // 更新内容列表
      })

      // 监听用户举报
      NotificationWebSocketHandler.on('user:report', (data) => {
        console.log('收到用户举报:', data)
        // 显示举报列表
      })
    })

    onUnmounted(() => {
      // 清理监听器
      NotificationWebSocketHandler.off('notification:new', callback)
    })

    return { notifications }
  }
}
```

### 发送消息到服务器

```javascript
// 标记通知已读
NotificationWebSocketHandler.acknowledgeNotification('notification_123')

// 发送自定义消息
NotificationWebSocketHandler.sendMessage({
  type: 'CUSTOM_EVENT',
  data: {
    /* ... */
  }
})

// 保持连接活跃
NotificationWebSocketHandler.ping()
```

### 连接状态检查

```javascript
// 检查连接状态
if (NotificationWebSocketHandler.getStatus()) {
  console.log('✅ Connected')
} else {
  console.log('❌ Disconnected')
}

// 断开连接
NotificationWebSocketHandler.disconnect()
```

---

## 🔐 权限控制系统

### 概述
基于角色的访问控制（RBAC）系统，支持三个角色：
- **Admin** (管理员): 完全权限
- **VIP** (高级用户): 部分权限
- **User** (普通用户): 最小权限

### 角色和权限

```javascript
import { ROLES, ACTIONS, PermissionControl } from '@/utils/PermissionControl'

// ROLES
// - ROLES.ADMIN: '管理员'
// - ROLES.VIP: '高级用户'
// - ROLES.USER: '普通用户'

// ACTIONS
// - VIEW_USERS, CREATE_USER, EDIT_USER, DELETE_USER, MANAGE_ROLES, BAN_USER
// - VIEW_CONTENT, APPROVE_CONTENT, REJECT_CONTENT, DELETE_CONTENT
// - VIEW_NOTIFICATIONS, SEND_NOTIFICATION, BROADCAST_NOTIFICATION
// - VIEW_DASHBOARD, VIEW_ANALYTICS, EXPORT_REPORTS
// - MANAGE_SYSTEM, VIEW_LOGS, MANAGE_SETTINGS
```

### 初始化权限系统

```javascript
import { PermissionControl } from '@/utils/PermissionControl'

// 用户登录后初始化
const user = {
  id: 'user_123',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' // ROLES.ADMIN
}

PermissionControl.init(user)
```

### 权限检查

```javascript
import { PermissionControl, ACTIONS } from '@/utils/PermissionControl'

// 检查单个权限
if (PermissionControl.hasPermission(ACTIONS.DELETE_USER)) {
  // 用户可以删除用户
}

// 检查任何权限
if (PermissionControl.hasAnyPermission([
  ACTIONS.APPROVE_CONTENT,
  ACTIONS.REJECT_CONTENT
])) {
  // 用户可以审核内容
}

// 检查所有权限
if (PermissionControl.hasAllPermissions([
  ACTIONS.VIEW_USERS,
  ACTIONS.MANAGE_ROLES
])) {
  // 用户可以管理用户和角色
}

// 检查角色
if (PermissionControl.isAdmin()) {
  // 用户是管理员
}

if (PermissionControl.isVipOrAdmin()) {
  // 用户是高级用户或管理员
}

// 获取所有权限
const permissions = PermissionControl.getPermissions()
const role = PermissionControl.getRole()
```

### 在组件中使用权限

```javascript
// 在 template 中隐藏/显示元素
<button v-if="hasPermission('delete_user')" @click="deleteUser">
  删除用户
</button>

// 在 script 中使用
import { useRouteGuard } from '@/utils/RouteGuards'

export default {
  setup() {
    const { hasPermission, isAdmin } = useRouteGuard()

    const canDelete = computed(() => hasPermission('delete_user'))

    const deleteUser = async (userId) => {
      if (!canDelete.value) {
        ElMessage.error('您没有权限删除用户')
        return
      }
      // 执行删除操作
    }

    return { canDelete, isAdmin }
  }
}
```

---

## 🔒 API 安全与拦截

### 概述
API 拦截器自动处理：
- 权限验证
- 认证 Token 添加
- 敏感操作确认
- 错误处理
- 审计日志

### 设置 API 拦截器

```javascript
// main.js
import axios from 'axios'
import { APIInterceptor } from '@/utils/APIInterceptor'

const axiosInstance = axios.create({
  baseURL: 'http://api.example.com'
})

// 初始化拦截器
APIInterceptor.init(axiosInstance)

app.config.globalProperties.$http = axiosInstance
```

### 敏感操作确认

```javascript
import { ConfirmSensitiveOperation } from '@/utils/APIInterceptor'

// 删除用户
const deleteUser = async (userId) => {
  const success = await ConfirmSensitiveOperation.execute(
    'DELETE_USER',
    async () => {
      const response = await this.$http.delete(`/api/admin/users/${userId}`)
      return response.data
    }
  )

  if (success) {
    // 操作成功，刷新列表
    this.loadUsers()
  }
}

// 或者手动确认
const deleteContent = async (contentId) => {
  const confirmed = await ConfirmSensitiveOperation.confirm('DELETE_CONTENT')

  if (confirmed) {
    try {
      await this.$http.delete(`/api/admin/content/${contentId}`)
      this.loadContent()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}
```

### 审计日志

```javascript
import { AuditLogger } from '@/utils/PermissionControl'

// 手动记录操作
AuditLogger.log(
  'USER_DELETED',
  { id: 'admin_1', name: 'Admin User' },
  { id: 'user_123', name: 'User To Delete' },
  { reason: 'Spam account' }
)

// 获取审计日志
const logs = AuditLogger.getLogs({
  action: 'USER_DELETED',
  actor: 'admin_1',
  dateRange: {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31')
  }
})

// 清除日志（仅用于测试）
AuditLogger.clearLogs()
```

---

## 🛣️ 路由保护

### 概述
路由守卫提供全面的路由保护，检查：
- 认证状态
- Token 有效性
- 用户权限
- 特定路由要求

### 设置路由守卫

```javascript
// router/index.js
import { setupRouteGuards } from '@/utils/RouteGuards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... 路由定义
  ]
})

// 设置路由守卫
setupRouteGuards(router)

export default router
```

### 受保护的路由配置

```javascript
// 带元数据的路由配置
const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard,
        meta: {
          title: '管理员仪表板',
          requiresAuth: true
        }
      },
      {
        path: 'users',
        component: AdminUsers,
        meta: {
          title: '用户管理',
          requiresAuth: true
        }
      }
    ]
  }
]
```

### 在组件中使用路由守卫

```javascript
import { useRouteGuard } from '@/utils/RouteGuards'
import { ACTIONS } from '@/utils/PermissionControl'

export default {
  setup() {
    const { canAccess, hasPermission, getRole, isAdmin } = useRouteGuard()

    // 检查路由访问权限
    const canAccessDashboard = computed(() =>
      canAccess('/admin/dashboard')
    )

    // 检查操作权限
    const canDeleteUsers = computed(() =>
      hasPermission(ACTIONS.DELETE_USER)
    )

    // 检查多个权限
    const canManageUsers = computed(() =>
      hasPermission([ACTIONS.VIEW_USERS, ACTIONS.EDIT_USER])
    )

    // 检查角色
    const isAdminUser = computed(() => isAdmin())

    return {
      canAccessDashboard,
      canDeleteUsers,
      canManageUsers,
      isAdminUser
    }
  }
}
```

---

## 🔗 完整集成示例

### 完整的用户管理流程

```javascript
import { defineComponent } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PermissionControl, ACTIONS } from '@/utils/PermissionControl'
import { ConfirmSensitiveOperation } from '@/utils/APIInterceptor'
import { AuditLogger } from '@/utils/PermissionControl'
import { useRouteGuard } from '@/utils/RouteGuards'

export default defineComponent({
  name: 'AdminUsers',

  setup() {
    const { hasPermission } = useRouteGuard()
    const users = ref([])
    const loading = ref(false)

    // 加载用户列表
    const loadUsers = async () => {
      if (!hasPermission(ACTIONS.VIEW_USERS)) {
        ElMessage.error('您没有权限查看用户列表')
        return
      }

      loading.value = true
      try {
        const response = await this.$http.get('/api/admin/users')
        users.value = response.data
      } catch (error) {
        ElMessage.error('加载用户失败')
      } finally {
        loading.value = false
      }
    }

    // 删除用户
    const deleteUser = async (userId) => {
      if (!hasPermission(ACTIONS.DELETE_USER)) {
        ElMessage.error('您没有权限删除用户')
        return
      }

      // 执行敏感操作（自动显示确认对话框）
      const success = await ConfirmSensitiveOperation.execute(
        'DELETE_USER',
        async () => {
          const response = await this.$http.delete(
            `/api/admin/users/${userId}`
          )
          return response.data
        }
      )

      if (success) {
        loadUsers()
      }
    }

    // 编辑用户角色
    const editUserRole = async (userId, newRole) => {
      if (!hasPermission(ACTIONS.MANAGE_ROLES)) {
        ElMessage.error('您没有权限修改用户角色')
        return
      }

      try {
        const response = await this.$http.put(
          `/api/admin/users/${userId}/role`,
          { role: newRole }
        )

        // API 拦截器会自动记录敏感操作
        ElMessage.success('用户角色已更新')
        loadUsers()
      } catch (error) {
        ElMessage.error('更新失败')
      }
    }

    onMounted(() => {
      loadUsers()
    })

    return {
      users,
      loading,
      deleteUser,
      editUserRole,
      hasPermission,
      ACTIONS
    }
  }
})
```

---

## ✅ 测试与验证

### 权限检查测试

```javascript
// test.js
import { PermissionControl, ROLES, ACTIONS } from '@/utils/PermissionControl'

// 测试 Admin 权限
PermissionControl.init({ id: 'user_1', role: ROLES.ADMIN })
console.assert(
  PermissionControl.hasPermission(ACTIONS.DELETE_USER),
  'Admin should have delete_user permission'
)

// 测试 VIP 权限
PermissionControl.setRole(ROLES.VIP)
console.assert(
  !PermissionControl.hasPermission(ACTIONS.DELETE_USER),
  'VIP should not have delete_user permission'
)

// 测试 User 权限
PermissionControl.setRole(ROLES.USER)
console.assert(
  !PermissionControl.hasPermission(ACTIONS.VIEW_USERS),
  'User should not have view_users permission'
)

console.log('✅ All permission tests passed')
```

### WebSocket 连接测试

```javascript
// 测试 WebSocket 连接
import { NotificationWebSocketHandler } from '@/utils/NotificationWebSocketHandler'

const testWebSocket = async () => {
  try {
    await NotificationWebSocketHandler.connect('test_user_1')
    console.assert(
      NotificationWebSocketHandler.getStatus(),
      'WebSocket should be connected'
    )

    // 测试消息发送
    NotificationWebSocketHandler.sendMessage({
      type: 'TEST',
      data: { test: 'message' }
    })

    // 测试事件监听
    NotificationWebSocketHandler.on('notification:new', (data) => {
      console.log('Received notification:', data)
    })

    console.log('✅ WebSocket tests passed')
  } catch (error) {
    console.error('❌ WebSocket test failed:', error)
  }
}
```

### 审计日志测试

```javascript
// 测试审计日志
import { AuditLogger } from '@/utils/PermissionControl'

AuditLogger.log(
  'TEST_ACTION',
  { id: 'user_1', name: 'Test User' },
  { id: 'resource_1' },
  { test: true }
)

const logs = AuditLogger.getLogs()
console.assert(logs.length > 0, 'Should have audit logs')
console.assert(
  logs[0].action === 'TEST_ACTION',
  'Log should have correct action'
)

console.log('✅ Audit log tests passed')
```

---

## 🎯 集成检查清单

- [ ] WebSocket 连接已初始化
- [ ] 权限系统已配置
- [ ] API 拦截器已设置
- [ ] 路由守卫已启用
- [ ] 审计日志已实现
- [ ] 敏感操作确认已配置
- [ ] 错误处理已完善
- [ ] 测试用例已覆盖
- [ ] 文档已更新
- [ ] 代码已审查

---

## 📞 问题排查

### WebSocket 连接失败
- 检查 WebSocket 服务器 URL 是否正确
- 确认 CORS 已配置
- 检查浏览器控制台错误信息
- 验证用户 ID 是否有效

### 权限检查失败
- 确认用户角色已正确设置
- 检查权限配置是否正确
- 验证 PermissionControl 已初始化
- 查看审计日志了解权限拒绝原因

### API 请求失败
- 检查 token 是否过期
- 验证 API 端点是否正确
- 查看请求头中的认证信息
- 检查错误响应中的详细信息

---

**生成时间**: 2025-11-01
**版本**: Phase 4 - Sprint 3
**状态**: 生产就绪 ✅
