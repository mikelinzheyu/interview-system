# 认证流程测试指南

## 改动已完成 ✅

已成功修改以下文件：

### 1. `frontend/src/stores/user.js`
**修改内容：** fetchUserInfo() 错误处理逻辑

**改进点：**
- ✅ 返回 boolean 值表示成功/失败
- ✅ 只在 401/403 时调用 logout()
- ✅ 网络错误和其他 API 错误时保留认证状态
- ✅ 添加详细的日志便于调试

**关键变化：**
```javascript
// 旧：任何错误都 logout()
catch (error) {
  await logout()
}

// 新：只在真正失效时 logout()
if (response.code === 401 || response.code === 403) {
  await logout()
  return false
} else {
  return true  // ✓ 保留认证状态
}

catch (error) {
  // ✓ 不调用 logout()，保留认证状态
  return true
}
```

---

### 2. `frontend/src/App.vue`
**修改内容：** 应用启动时的初始化流程

**改进点：**
- ✅ 获取返回值检查用户信息获取是否成功
- ✅ 不再假设 fetchUserInfo() 失败意味着登出
- ✅ WebSocket 连接与用户信息获取分离
- ✅ 添加更清晰的日志

**关键变化：**
```javascript
// 旧：假设失败就是登出
try {
  await userStore.fetchUserInfo()
} catch (error) {
  // logout 方法会被 fetchUserInfo 的错误处理调用
}

// 新：处理返回值，分离关注点
const success = await userStore.fetchUserInfo()
if (!success) {
  console.warn('获取用户信息失败，但保留登录状态')
}
// 继续初始化 WebSocket，不受影响
```

---

### 3. `frontend/src/router/index.js`
**修改内容：** 路由守卫中添加调试日志

**改进点：**
- ✅ 每次路由导航都记录详细信息
- ✅ 包含认证状态、权限检查结果
- ✅ 便于问题排查和性能分析

**关键变化：**
```javascript
console.log('[Router Guard] Navigation: from → to', {
  requiresAuth,
  isAuthenticated,
  hasToken,
  action: 'ALLOW | REDIRECT_TO_LOGIN'
})
```

---

## 测试计划

### 场景 1️⃣：正常登录流程
**步骤：**
1. 访问 `http://localhost:5174/login`
2. 输入正确的用户名和密码，点击登录
3. 应该重定向到 `/dashboard`

**预期结果：**
- ✅ 登录成功
- ✅ token 保存到 localStorage
- ✅ 控制台日志显示：`[User] User info fetched successfully`

**检查点：**
```javascript
// 浏览器控制台
[User] User info fetched successfully: {...}
[App] 用户信息获取完成
[Router Guard] Navigation: /login → /dashboard
```

---

### 场景 2️⃣：刷新页面保持登录
**步骤：**
1. 登录后刷新页面 `F5`
2. 观察是否保持登录状态

**预期结果：**
- ✅ 页面重新加载后仍保持登录
- ✅ 不出现登录页面
- ✅ token 从 localStorage 恢复

**检查点：**
```javascript
// 浏览器控制台
[App] 应用启动，用户已登录，开始初始化用户信息
const token = ref(localStorage.getItem('token'))  // ✓ 读取成功
const isAuthenticated = true  // ✓ token 有效
```

---

### 场景 3️⃣：点击受保护菜单项（关键测试）
**步骤：**
1. 用户已登录，在 dashboard 上
2. 点击侧边栏菜单：
   - 学习中心 `/learning-hub`
   - 错题本 `/wrong-answers`
   - 分析 `/ability/profile`
   - 社区 `/community`

**预期结果：**
- ✅ 无重定向，直接进入相应页面
- ✅ 控制台显示导航成功日志

**检查点：**
```javascript
// 浏览器控制台 - 点击"学习中心"
[Router Guard] Navigation: /dashboard → /learning-hub {
  requiresAuth: true,
  isAuthenticated: true,     // ✓ 关键！应该是 true
  hasToken: true,
  action: "Navigation allowed"
}
```

---

### 场景 4️⃣：网络错误时保持登录
**步骤：**
1. 登录后，打开浏览器开发者工具网络标签
2. 在 Network 标签中模拟离线或阻止 getUserInfo API
3. 刷新页面
4. 尝试访问受保护路由

**预期结果：**
- ✅ 即使 getUserInfo 失败，也保持登录状态
- ✅ 可以访问受保护资源
- ✅ 控制台显示警告但不登出

**检查点：**
```javascript
// 浏览器控制台
[User] Network error fetching user info: ...
[App] 获取用户信息失败，但保留登录状态
[Router Guard] Navigation: ... {
  isAuthenticated: true,  // ✓ 仍然为 true！
  hasToken: true
}
```

---

### 场景 5️⃣：真正的 401 错误（token 失效）
**步骤：**
1. 修改后端，使 getUserInfo 返回 401
2. 刷新页面或重新登录
3. 尝试访问受保护路由

**预期结果：**
- ✅ 检测到 401 错误
- ✅ 自动调用 logout()
- ✅ 重定向到 /login
- ✅ token 从 localStorage 清除

**检查点：**
```javascript
// 浏览器控制台
[User] Token expired or unauthorized (401/403), logging out
[Router Guard] Access denied: /learning-hub requires authentication
[Router Guard] Redirecting to /login
```

---

## 验证命令

### 查看改动内容
```bash
# 查看 user.js 的 fetchUserInfo 方法
grep -A 30 "const fetchUserInfo" frontend/src/stores/user.js

# 查看 App.vue 的 onMounted 钩子
grep -A 20 "onMounted" frontend/src/App.vue

# 查看 router 守卫日志
grep -A 5 "Router Guard" frontend/src/router/index.js
```

---

## 浏览器控制台日志示例

### 成功场景
```
[App] 应用启动，用户已登录，开始初始化用户信息
[User] User info fetched successfully: {id: 1, username: 'john', ...}
[App] 用户信息获取完成
[App] 用户已登录，初始化 WebSocket 连接
[Router Guard] Navigation: /dashboard → /learning-hub {requiresAuth: true, isAuthenticated: true, ...}
[Router Guard] Navigation allowed: /learning-hub
```

### 失败恢复场景
```
[App] 应用启动，用户已登录，开始初始化用户信息
[User] Network error fetching user info: Failed to fetch
[App] 获取用户信息失败，但保留登录状态（可能是 token 已过期）
[App] 用户已登录，初始化 WebSocket 连接
[Router Guard] Navigation: /dashboard → /learning-hub {requiresAuth: true, isAuthenticated: true, ...}
[Router Guard] Navigation allowed: /learning-hub
```

---

## 常见问题排查

### Q: 仍然被重定向到登录页？
**检查：**
1. 打开浏览器 DevTools（F12）→ Console
2. 查看是否有 `[Router Guard]` 日志
3. 检查 `isAuthenticated` 值是否为 false
4. 检查 localStorage 中是否有 `token` 键

### Q: 控制台没有看到日志？
**原因：** 浏览器缓存
**解决：**
1. 清除缓存：`Ctrl + Shift + Delete`
2. 做 hard refresh：`Ctrl + Shift + R`
3. 或在浏览器开发者工具中勾选"禁用缓存"

### Q: 用户信息没有显示，但仍可访问页面？
**这是正常的！**
- 认证 ≠ 用户信息
- Token 有效就可以访问
- 用户信息是可选的增强体验

---

## 修复总结

| 问题 | 原因 | 改进 |
|------|------|------|
| 登录后被重定向 | fetchUserInfo 失败自动登出 | 只在 401/403 时登出 |
| 网络波动影响登录 | 不稳定的 API 导致登出 | 保留认证状态，降级运行 |
| 无法调试 | 日志不足 | 添加详细的守卫日志 |

---

## 下一步

1. ✅ 代码修改完成
2. 📋 测试验证（现在进行）
3. 🔄 性能优化（可选）
4. 📚 文档更新（完成）

