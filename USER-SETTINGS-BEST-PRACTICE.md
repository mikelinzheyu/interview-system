# 个人设置功能 - 最佳实践文档

## 功能概览

本项目已完整实现个人设置功能，涵盖账户信息、安全设置、隐私设置、通知设置、界面设置等核心模块。

## 项目结构

```
interview-system/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── user.js                 # 用户设置相关API接口
│   │   ├── views/
│   │   │   └── settings/
│   │   │       └── UserSettings.vue    # 个人设置页面
│   │   ├── stores/
│   │   │   └── user.js                 # 用户状态管理（已扩展）
│   │   └── router/
│   │       └── index.js                # 路由配置（已添加设置路由）
└── backend/
    └── mock-server.js                  # Mock API服务器（已添加设置接口）
```

## 核心功能模块

### 1. 账户信息管理

**功能点：**
- ✅ 头像上传/更换
- ✅ 昵称修改
- ✅ 性别选择（男/女/保密）
- ✅ 生日设置
- ✅ 个性签名（100字限制）

**API接口：**
```javascript
// 更新个人资料
PUT /api/users/profile
{
  "nickname": "新昵称",
  "gender": "male",
  "birthday": "1990-01-01",
  "signature": "个性签名"
}

// 上传头像
POST /api/users/avatar
Content-Type: multipart/form-data
```

**前端调用：**
```javascript
import { userAPI } from '@/api/user'

// 更新资料
await userAPI.updateProfile(profileData)

// 上传头像
const formData = new FormData()
formData.append('avatar', file)
await userAPI.uploadAvatar(formData)
```

### 2. 安全设置

**功能点：**
- ✅ 修改密码（需验证旧密码）
- ✅ 绑定/更换手机号（验证码验证）
- ✅ 绑定/更换邮箱（验证码验证）
- ✅ 两步验证开关
- ✅ 登录设备管理（查看/强制下线）

**API接口：**
```javascript
// 修改密码
PUT /api/users/password
{
  "oldPassword": "旧密码",
  "newPassword": "新密码"
}

// 绑定手机号
POST /api/users/phone/bind
{
  "phone": "13800138000",
  "code": "123456"
}

// 获取验证码
POST /api/users/phone/code
{ "phone": "13800138000" }

// 两步验证
POST /api/users/2fa/enable
POST /api/users/2fa/disable

// 设备管理
GET /api/users/devices
DELETE /api/users/devices/:id
```

**验证码流程：**
1. 用户输入手机号/邮箱
2. 调用发送验证码API
3. 60秒倒计时，防止频繁发送
4. 用户输入验证码
5. 提交绑定/验证

### 3. 隐私设置

**功能点：**
- ✅ 个人资料可见性（公开/好友/私密）
- ✅ 在线状态显示开关
- ✅ 允许陌生人消息开关
- ✅ 位置信息共享开关

**API接口：**
```javascript
PUT /api/users/privacy
{
  "profileVisibility": "public",
  "showOnlineStatus": true,
  "allowStrangerMessage": true,
  "shareLocation": false
}
```

### 4. 通知设置

**功能点：**
- ✅ 系统通知开关
- ✅ 消息通知开关
- ✅ 评论通知开关
- ✅ 邮件通知开关
- ✅ 短信通知开关
- ✅ 声音提示开关
- ✅ 震动提示开关
- ✅ 免打扰模式（时间段设置）

**API接口：**
```javascript
PUT /api/users/notification
{
  "systemNotification": true,
  "messageNotification": true,
  "commentNotification": true,
  "emailNotification": false,
  "smsNotification": false,
  "soundEnabled": true,
  "vibrationEnabled": true,
  "dndEnabled": true,
  "dndStartTime": "22:00",
  "dndEndTime": "08:00"
}
```

### 5. 界面设置

**功能点：**
- ✅ 主题模式（浅色/深色/跟随系统）
- ✅ 主题色选择
- ✅ 字体大小（小/中/大）
- ✅ 语言切换（中文/英文）

**API接口：**
```javascript
PUT /api/users/preferences
{
  "theme": "light",
  "primaryColor": "#409EFF",
  "fontSize": "medium",
  "language": "zh-CN"
}
```

**主题切换实现：**
```javascript
const handleThemeChange = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    // 跟随系统
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  }
}
```

### 6. 账户管理

**功能点：**
- ✅ 注销账户（需密码确认 + 二次文本确认）

**API接口：**
```javascript
POST /api/users/account/delete
{
  "password": "用户密码"
}
```

**安全措施：**
- 需要输入密码验证
- 需要输入"删除账户"文本确认
- 警告提示数据不可恢复

## 使用方法

### 1. 访问设置页面

```javascript
// 在导航栏或菜单中添加链接
<router-link to="/settings">个人设置</router-link>

// 或使用编程式导航
router.push('/settings')
```

### 2. 页面结构

设置页面使用 `el-tabs` 组件实现多标签切换：

```vue
<el-tabs v-model="activeTab">
  <el-tab-pane label="账户信息" name="profile">...</el-tab-pane>
  <el-tab-pane label="安全设置" name="security">...</el-tab-pane>
  <el-tab-pane label="隐私设置" name="privacy">...</el-tab-pane>
  <el-tab-pane label="通知设置" name="notification">...</el-tab-pane>
  <el-tab-pane label="界面设置" name="preferences">...</el-tab-pane>
  <el-tab-pane label="账户管理" name="account">...</el-tab-pane>
</el-tabs>
```

### 3. 状态管理

用户信息由 Pinia store 统一管理：

```javascript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 获取用户信息
await userStore.fetchUserInfo()

// 访问用户数据
console.log(userStore.user)

// 更新用户信息
await userStore.updateUserInfo(data)
```

## 最佳实践建议

### 1. 安全性

✅ **密码修改后强制重新登录**
```javascript
if (response.code === 200) {
  ElMessage.success('密码修改成功，请重新登录')
  setTimeout(() => {
    userStore.logout()
    router.push('/login')
  }, 1000)
}
```

✅ **验证码60秒倒计时防刷**
```javascript
const sendPhoneCode = async () => {
  // 发送验证码
  phoneCodeCountdown.value = 60
  const timer = setInterval(() => {
    phoneCodeCountdown.value--
    if (phoneCodeCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}
```

✅ **敏感信息脱敏显示**
```javascript
// 手机号脱敏
const maskPhone = (phone) => {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 邮箱脱敏
const maskEmail = (email) => {
  const [name, domain] = email.split('@')
  return name[0] + '***' + name[name.length - 1] + '@' + domain
}
```

### 2. 用户体验

✅ **表单验证**
```javascript
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码长度不能小于6位' }
  ],
  confirmPassword: [
    { validator: (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }}
  ]
}
```

✅ **Loading状态**
```javascript
const loading = reactive({
  profile: false,
  password: false,
  phone: false,
  email: false
})

// 使用
<el-button :loading="loading.profile" @click="saveProfile">
  保存修改
</el-button>
```

✅ **操作反馈**
```javascript
// 成功提示
ElMessage.success('保存成功')

// 错误提示
ElMessage.error('保存失败')

// 警告确认
await ElMessageBox.confirm('确定要执行此操作吗？', '提示', {
  confirmButtonText: '确定',
  cancelButtonText: '取消',
  type: 'warning'
})
```

### 3. 数据持久化

✅ **用户设置本地缓存**
```javascript
// 主题设置可以存储到 localStorage
localStorage.setItem('theme', theme)

// 页面加载时读取
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  preferencesForm.theme = savedTheme
  handleThemeChange(savedTheme)
}
```

### 4. 代码组织

✅ **工具函数抽离**
```javascript
// utils/format.js
export const maskPhone = (phone) => { ... }
export const maskEmail = (email) => { ... }

// 在组件中导入使用
import { maskPhone, maskEmail } from '@/utils/format'
```

✅ **API统一管理**
```javascript
// api/user.js
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData),
  // ...
}
```

## 测试指南

### 启动服务

```bash
# 启动后端Mock服务器
cd backend
node mock-server.js

# 启动前端开发服务器
cd frontend
npm run dev
```

### 测试场景

1. **账户信息**
   - 修改昵称、性别、生日、签名
   - 上传头像

2. **安全设置**
   - 修改密码（验证旧密码输入错误、新密码长度、确认密码不一致）
   - 绑定手机号（验证码60秒倒计时、验证码错误、验证码过期）
   - 绑定邮箱（同手机号）
   - 开启/关闭两步验证
   - 查看登录设备、强制下线设备

3. **隐私设置**
   - 切换各项隐私开关
   - 保存后刷新页面验证数据持久化

4. **通知设置**
   - 切换各项通知开关
   - 设置免打扰时间段

5. **界面设置**
   - 切换主题（浅色/深色/自动）
   - 修改主题色
   - 调整字体大小
   - 切换语言

6. **账户管理**
   - 注销账户（验证密码、确认文本输入）

## 扩展建议

### 1. 添加实名认证

```javascript
// api/user.js
realNameAuth: (data) => api.post('/users/real-name-auth', data)

// 字段
{
  realName: '真实姓名',
  idCard: '身份证号',
  idCardFront: '身份证正面照',
  idCardBack: '身份证背面照'
}
```

### 2. 添加第三方账号绑定

```javascript
// 绑定微信、QQ、GitHub等
bindWechat: () => api.post('/users/bind/wechat'),
bindQQ: () => api.post('/users/bind/qq'),
bindGithub: () => api.post('/users/bind/github')
```

### 3. 添加数据导出功能

```javascript
// 导出个人数据
exportData: () => api.get('/users/export', { responseType: 'blob' })
```

### 4. 添加操作日志

```javascript
// 查看账户操作历史
getActivityLog: (params) => api.get('/users/activity-log', { params })
```

## 常见问题

### Q1: 修改密码后是否需要重新登录？
A: 是的，修改密码后会强制用户重新登录，以确保账户安全。

### Q2: 验证码有效期多久？
A: 验证码有效期为5分钟，60秒内不能重复发送。

### Q3: 主题设置是否会持久化？
A: 是的，主题设置会保存到服务器，并在用户下次登录时自动应用。

### Q4: 注销账户后数据能恢复吗？
A: 不能，注销账户后所有数据将被永久删除且无法恢复。

### Q5: 如何在导航栏添加设置入口？
```vue
<!-- 在导航菜单中添加 -->
<el-menu-item index="/settings">
  <el-icon><Setting /></el-icon>
  <span>个人设置</span>
</el-menu-item>
```

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **后端Mock**: Node.js HTTP Server

## 文件位置参考

- **前端API**: `frontend/src/api/user.js`
- **设置页面**: `frontend/src/views/settings/UserSettings.vue`
- **用户Store**: `frontend/src/stores/user.js`
- **路由配置**: `frontend/src/router/index.js`
- **后端Mock**: `backend/mock-server.js`

## 总结

本实现完整涵盖了个人设置的核心功能，遵循以下原则：

1. **安全第一**: 敏感操作需验证、密码修改强制重登、验证码防刷
2. **用户友好**: 清晰的表单验证、及时的操作反馈、直观的UI设计
3. **代码规范**: API统一管理、组件化设计、状态集中管理
4. **可扩展性**: 模块化设计，便于后续功能扩展

可以根据实际业务需求，在此基础上进行定制化开发。
