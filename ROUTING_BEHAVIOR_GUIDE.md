# Interview-System 路由行为文档

**日期：** 2025-10-27
**配置选项：** 选项1（已登录用户无法访问Landing和Login页面）
**状态：** ✅ 工作正常

---

## 当前路由配置

### 路由定义
```javascript
{
  path: '/',
  name: 'Landing',
  component: () => import('@/views/marketing/Landing.vue'),
  meta: { requiresAuth: false }  // 任何人都可以访问
},
{
  path: '/login',
  name: 'Login',
  component: () => import('@/views/auth/Login.vue'),
  meta: { requiresGuest: true }  // 仅未登录用户可访问
}
```

### 路由守卫逻辑
```javascript
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  // 已登录用户访问Landing页面时重定向到Home
  if (to.name === 'Landing' && isAuthenticated) {
    next('/home')
    return
  }

  // 未登录用户访问受保护页面时重定向到Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // 已登录用户访问Guest-only页面（如Login）时重定向到Home
    next('/home')
  } else {
    next()
  }
})
```

---

## 路由跳转行为

### 未登录用户的访问行为
| 访问URL | 目标页面 | 跳转行为 | 最终页面 |
|---------|---------|---------|---------|
| `/` | Landing | ✅ 允许 | Landing |
| `/login` | Login | ✅ 允许 | Login |
| `/register` | Register | ✅ 允许 | Register |
| `/home` | Home | ❌ 拒绝 | → `/login` |
| `/questions` | Questions | ❌ 拒绝 | → `/login` |
| `/interview/ai` | AIInterview | ✅ 允许 | AIInterview |

### 已登录用户的访问行为
| 访问URL | 目标页面 | 跳转行为 | 最终页面 |
|---------|---------|---------|---------|
| `/` | Landing | ❌ 拒绝 | → `/home` |
| `/login` | Login | ❌ 拒绝 | → `/home` |
| `/register` | Register | ❌ 拒绝 | → `/home` |
| `/home` | Home | ✅ 允许 | Home |
| `/questions` | Questions | ✅ 允许 | Questions |
| `/interview/ai` | AIInterview | ✅ 允许 | AIInterview |

---

## 设计理由

### 为什么已登录用户无法访问 Landing 页面？
- Landing 页面是面向新用户的欢迎页面
- 已登录用户应该在主应用界面（/home）中工作
- 避免已登录用户看到"注册"等不相关的信息

### 为什么已登录用户无法访问 Login 页面？
- Login 页面显示登录表单，已登录用户不需要看到它
- 防止用户意外重新登录
- 提高应用的一致性和用户体验

### 为什么某些页面无需认证（如 AIInterview）？
- `/interview/ai` 和 `/interview/new` 配置为 `requiresAuth: false`
- 允许未登录用户预览AI面试功能
- 作为免费的演示/体验功能

---

## 用户流程

### 1. 新用户注册/登录流程
```
┌─────────────────────────────────────────────────┐
│ 访问 http://localhost/                           │
│ ↓                                               │
│ Landing 页面 (欢迎页面)                         │
│ ↓                                               │
│ 点击 "登录" 按钮                                │
│ ↓                                               │
│ Login 页面 (登录表单)                           │
│ ↓                                               │
│ 输入用户名/密码或使用OAuth登录                 │
│ ↓                                               │
│ 后端验证成功 → userStore.isAuthenticated = true│
│ ↓                                               │
│ 自动跳转到 /home (主页面)                      │
└─────────────────────────────────────────────────┘
```

### 2. 已登录用户的行为
```
┌─────────────────────────────────────────────────┐
│ 已登录用户访问 http://localhost/               │
│ ↓                                               │
│ 路由守卫检测：isAuthenticated = true            │
│ ↓                                               │
│ to.name === 'Landing' → 触发重定向              │
│ ↓                                               │
│ next('/home')                                  │
│ ↓                                               │
│ 最终显示：Home 页面                            │
└─────────────────────────────────────────────────┘
```

### 3. 未登录用户访问受保护页面
```
┌─────────────────────────────────────────────────┐
│ 未登录用户访问 http://localhost/home            │
│ ↓                                               │
│ 路由守卫检测：requiresAuth = true, isAuth = false│
│ ↓                                               │
│ next('/login')                                 │
│ ↓                                               │
│ 最终显示：Login 页面                           │
└─────────────────────────────────────────────────┘
```

---

## 路由元标记说明

### 元标记类型
```javascript
meta: {
  requiresAuth: false    // 默认：任何人都可以访问
  requiresAuth: true     // 仅已登录用户可访问
  requiresGuest: true    // 仅未登录用户可访问
  requiresAdmin: true    // 仅管理员可访问
}
```

### 应用场景

| 元标记 | 使用页面 | 说明 |
|--------|---------|------|
| `requiresAuth: false` | Landing, Login, Register, AIInterview, NewInterview | 公开访问 |
| `requiresAuth: true` | Home, Questions, ChatRoom, Achievements, Community | 需要登录 |
| `requiresGuest: true` | Login, Register, OAuthCallback | 仅未登录用户 |
| `requiresAdmin: true` | QuestionCreate, QuestionEdit | 仅管理员 |

---

## 代码位置

### 路由配置文件
**文件：** `/frontend/src/router/index.js`

- **路由定义：** 第 4-328 行
- **Landing 路由：** 第 4-10 行
- **Login 路由：** 第 12-16 行
- **路由守卫：** 第 350-366 行

### 用户状态存储
**文件：** `/frontend/src/stores/user.js`

用户认证状态通过 Pinia store 管理：
```javascript
const userStore = useUserStore()
const isAuthenticated = userStore.isAuthenticated
```

### 页面组件

| 路由 | 组件文件 |
|------|---------|
| `/` | `/frontend/src/views/marketing/Landing.vue` |
| `/login` | `/frontend/src/views/auth/Login.vue` |
| `/register` | `/frontend/src/views/auth/Register.vue` |
| `/home` | `/frontend/src/views/Home.vue` |

---

## 常见问题

### Q: 为什么已登录用户访问 / 被重定向到 /home？
**A:** 这是符合预期的行为（选项1）。Landing 页面是给新用户的，已登录用户应该在应用主界面工作。

### Q: 如何让已登录用户能够访问 /login？
**A:** 需要修改为选项2，具体步骤：
1. 移除 `/login` 的 `requiresGuest: true` 限制
2. 修改路由守卫逻辑
3. 让 Login 页面进行条件渲染（已登录显示不同内容）

### Q: 未登录用户可以访问 AIInterview 页面吗？
**A:** 是的，因为该页面配置为 `requiresAuth: false`，允许未登录用户预览。

### Q: 如何检查当前用户是否已登录？
**A:** 在任何组件中使用：
```javascript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
if (userStore.isAuthenticated) {
  // 用户已登录
}
```

---

## 测试路由行为

### 未登录状态测试
```bash
# 1. 清除浏览器 localStorage（模拟未登录）
# 2. 访问各个 URL
curl http://localhost/           # ✅ 显示 Landing
curl http://localhost/login      # ✅ 显示 Login
curl http://localhost/home       # ❌ 重定向到 /login
```

### 已登录状态测试
```bash
# 1. 完成登录（localStorage 中保存 token）
# 2. 访问各个 URL
http://localhost/          # ❌ 重定向到 /home
http://localhost/login     # ❌ 重定向到 /home
http://localhost/home      # ✅ 显示 Home
```

---

## 变更历史

| 日期 | 内容 | 状态 |
|------|------|------|
| 2025-10-27 | 路由行为文档创建（选项1） | ✅ 完成 |

---

## 总结

✅ **当前配置：选项1**
- 已登录用户无法访问 Landing 和 Login 页面
- 自动重定向到 /home
- 符合应用设计意图

✅ **路由跳转正常工作**
- 未登录用户可以自由浏览公开页面
- 未登录用户访问受保护页面时自动重定向到登录
- 已登录用户可以访问所有受保护页面
- 已登录用户无法回到 Landing 或 Login 页面

---

**文档状态：** ✅ 完成
**最后更新：** 2025-10-27 10:30 UTC+8
**审核状态：** 已验证
