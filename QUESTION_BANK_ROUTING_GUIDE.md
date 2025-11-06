# 题库功能路由导航指南

## 路由结构概览

```
/questions                           # 主入口（自动重定向到 /learning-hub）
├── /learning-hub                    # 学习中心（仪表板首页）
│   └── /learning-hub/:domainSlug    # 题库页面（具体学科）
├── /learning-paths                  # 学习路径列表
│   └── /learning-paths/:pathSlug    # 学习路径详情
└── /admin/questions                 # 管理员题目管理
    ├── /admin/questions/new         # 创建新题目
    └── /admin/questions/:id/edit    # 编辑题目
```

## 详细路由说明

### 1️⃣ 学习中心入口

#### 路由：`/learning-hub`
**名称**: LearningHub
**组件**: `LearningHubDashboard.vue`
**认证**: 需要登录 ✅
**描述**: 学习中心首页仪表板，展示：
- 📚 推荐题目
- 🎯 继续学习
- 📊 学习进度
- 💫 我的收藏
- 🏆 学习路径建议

**访问方式**:
```javascript
// 路由链接
this.$router.push('/learning-hub')

// 或使用路由名
this.$router.push({ name: 'LearningHub' })

// 或直接访问
http://localhost:5173/learning-hub
```

**使用场景**:
- ✅ 用户首次进入题库
- ✅ 查看个人学习概览
- ✅ 浏览推荐的题目和路径

---

### 2️⃣ 题库页面（特定学科）

#### 路由：`/learning-hub/:domainSlug`
**名称**: QuestionBankPage
**组件**: `QuestionBankPage.vue`
**认证**: 需要登录 ✅
**参数**: `domainSlug` - 学科/专业的URL别名（如：`computer-science`）
**描述**: 显示特定学科的所有题目，包括：
- 📋 题目列表
- 🔍 搜索和过滤
- 📌 题目收藏/标记
- 💬 题目讨论

**访问方式**:
```javascript
// 方式1：使用路由名和参数
this.$router.push({
  name: 'QuestionBankPage',
  params: { domainSlug: 'computer-science' }
})

// 方式2：直接访问路径
this.$router.push('/learning-hub/computer-science')

// 或直接在浏览器中访问
http://localhost:5173/learning-hub/computer-science
```

**参数示例**:
```
/learning-hub/computer-science       # 计算机科学
/learning-hub/mathematics            # 数学
/learning-hub/physics                # 物理
/learning-hub/chemistry              # 化学
```

**使用场景**:
- ✅ 用户选择学科后浏览题目
- ✅ 在学习中心点击某个学科
- ✅ 从推荐题目点击进入

---

### 3️⃣ 学习路径列表

#### 路由：`/learning-paths`
**名称**: LearningPathList
**组件**: `LearningPathList.vue`
**认证**: 需要登录 ✅
**描述**: 展示所有推荐的学习路径：
- 🗺️ 学习路径列表
- 📈 难度等级
- ⏱️ 预计时长
- ✨ 路径特色

**访问方式**:
```javascript
// 方式1：使用路由名
this.$router.push({ name: 'LearningPathList' })

// 方式2：直接访问路径
this.$router.push('/learning-paths')

// 或在浏览器中访问
http://localhost:5173/learning-paths
```

**使用场景**:
- ✅ 用户想要系统化地学习
- ✅ 选择适合的学习路径
- ✅ 查看学习计划

---

### 4️⃣ 学习路径详情

#### 路由：`/learning-paths/:pathSlug`
**名称**: LearningPathDetail
**组件**: `LearningPathDetail.vue`
**认证**: 需要登录 ✅
**参数**: `pathSlug` - 学习路径的URL别名
**描述**: 显示学习路径的详细信息：
- 📚 学习阶段
- 📝 每个阶段的题目
- 🎯 学习目标
- 🏅 完成证书

**访问方式**:
```javascript
// 方式1：使用路由名和参数
this.$router.push({
  name: 'LearningPathDetail',
  params: { pathSlug: 'full-stack-developer' }
})

// 方式2：直接访问路径
this.$router.push('/learning-paths/full-stack-developer')

// 或直接在浏览器中访问
http://localhost:5173/learning-paths/full-stack-developer
```

**参数示例**:
```
/learning-paths/full-stack-developer     # 全栈开发
/learning-paths/frontend-master          # 前端工程师
/learning-paths/backend-engineer         # 后端工程师
/learning-paths/data-science-path        # 数据科学
```

**使用场景**:
- ✅ 用户选择学习路径后查看详情
- ✅ 跟踪学习进度
- ✅ 获取路径中的题目推荐

---

### 5️⃣ 创建新题目（管理员）

#### 路由：`/admin/questions/new`
**名称**: QuestionCreate
**组件**: `QuestionEditor.vue`
**认证**: 需要登录且是管理员 ✅👨‍💼
**描述**: 创建新的考试题目：
- ✏️ 题目编辑器
- 📚 选择学科/专业
- 🏷️ 添加标签
- 📋 设置难度和分值

**访问方式**:
```javascript
// 使用路由名
this.$router.push({ name: 'QuestionCreate' })

// 或直接访问路径
this.$router.push('/admin/questions/new')

// 或在浏览器中访问
http://localhost:5173/admin/questions/new
```

**使用场景**:
- ✅ 管理员添加新题目
- ✅ 建设题库内容

**权限要求**: 必须是管理员，否则跳转到登录页

---

### 6️⃣ 编辑题目（管理员）

#### 路由：`/admin/questions/:id/edit`
**名称**: QuestionEdit
**组件**: `QuestionEditor.vue`
**认证**: 需要登录且是管理员 ✅👨‍💼
**参数**: `id` - 题目的唯一标识符
**描述**: 编辑已有的考试题目：
- ✏️ 修改题目内容
- 🔄 更新答案选项
- 📊 调整难度分值
- 💾 保存修改

**访问方式**:
```javascript
// 方式1：使用路由名和参数
this.$router.push({
  name: 'QuestionEdit',
  params: { id: '12345' }
})

// 方式2：直接访问路径
this.$router.push('/admin/questions/12345/edit')

// 或在浏览器中访问
http://localhost:5173/admin/questions/12345/edit
```

**参数示例**:
```
/admin/questions/1/edit              # 编辑ID为1的题目
/admin/questions/abc-123/edit        # 编辑ID为abc-123的题目
```

**使用场景**:
- ✅ 管理员修改题目
- ✅ 更新题目内容
- ✅ 纠正题目错误

**权限要求**: 必须是管理员，否则跳转到登录页

---

## 🔄 路由导航流程图

```
用户进入应用
    ↓
/questions (重定向)
    ↓
/learning-hub (学习中心首页)
    ├─→ 点击推荐题目
    │   ↓
    │   /learning-hub/:domainSlug (特定学科题库)
    │
    ├─→ 查看学习路径
    │   ↓
    │   /learning-paths (学习路径列表)
    │   ↓
    │   /learning-paths/:pathSlug (路径详情)
    │
    └─→ 管理员操作
        ├─→ 创建新题目
        │   /admin/questions/new
        │
        └─→ 编辑题目
            /admin/questions/:id/edit
```

---

## 📋 路由参数说明

### domainSlug
- **类型**: String
- **描述**: 学科/专业的URL别名
- **示例**: `computer-science`, `mathematics`, `physics`
- **来源**: 通常由域名数据的 slug 字段提供

### pathSlug
- **类型**: String
- **描述**: 学习路径的URL别名
- **示例**: `full-stack-developer`, `frontend-master`
- **来源**: 通常由学习路径数据的 slug 字段提供

### id
- **类型**: String 或 Number
- **描述**: 题目的唯一标识符
- **示例**: `1`, `123`, `abc-def-123`
- **来源**: 数据库中题目的 ID 字段

---

## 🔒 认证和权限

### 认证要求

| 路由 | 需要登录 | 需要管理员 |
|------|--------|---------|
| `/learning-hub` | ✅ | ❌ |
| `/learning-hub/:domainSlug` | ✅ | ❌ |
| `/learning-paths` | ✅ | ❌ |
| `/learning-paths/:pathSlug` | ✅ | ❌ |
| `/admin/questions/new` | ✅ | ✅ |
| `/admin/questions/:id/edit` | ✅ | ✅ |

### 路由守卫逻辑

```javascript
// 路由守卫检查
1. 检查是否需要认证 (meta.requiresAuth)
   - 如果需要但未登录 → 跳转到 /login
   - 如果不需要且已登录且是Landing页面 → 跳转到 /home

2. 检查是否需要管理员权限 (meta.requiresAdmin)
   - 如果需要但不是管理员 → 跳转到 /home 或显示无权限提示

3. 检查 meta.requiresGuest
   - 用于登录/注册页面，已登录用户不能访问
```

---

## 🧭 组件间导航示例

### 从学习中心导航到题库

**LearningHubDashboard.vue**:
```javascript
// 用户点击推荐的学科
handleSelectDomain(domain) {
  this.$router.push({
    name: 'QuestionBankPage',
    params: { domainSlug: domain.slug }
  })
}
```

### 从学习路径列表导航到详情

**LearningPathList.vue**:
```javascript
// 用户点击学习路径
goToPathDetail(path) {
  this.$router.push({
    name: 'LearningPathDetail',
    params: { pathSlug: path.slug }
  })
}
```

### 从题库返回到学习中心

**QuestionBankPage.vue**:
```javascript
// 用户点击返回按钮
goBackToHub() {
  this.$router.push({ name: 'LearningHub' })
}
```

### 管理员编辑题目

**题目列表或题目卡片**:
```javascript
// 编辑按钮
editQuestion(questionId) {
  this.$router.push({
    name: 'QuestionEdit',
    params: { id: questionId }
  })
}

// 创建新题目
createNewQuestion() {
  this.$router.push({ name: 'QuestionCreate' })
}
```

---

## 🧪 测试路由连通性

### 路由访问检查清单

- [ ] `/learning-hub` - 显示学习中心仪表板
- [ ] `/learning-hub/computer-science` - 显示计算机科学题库
- [ ] `/learning-paths` - 显示学习路径列表
- [ ] `/learning-paths/full-stack-developer` - 显示路径详情
- [ ] `/admin/questions/new` - 显示题目创建表单（需管理员）
- [ ] `/admin/questions/1/edit` - 显示题目编辑表单（需管理员）

### 路由重定向检查

- [ ] 访问 `/questions` → 重定向到 `/learning-hub` ✅
- [ ] 未登录访问 `/learning-hub` → 重定向到 `/login` ✅
- [ ] 非管理员访问 `/admin/questions/new` → 拒绝访问 ✅

---

## 📱 路由别名（快捷访问）

建议在导航菜单中添加这些常用路由：

```javascript
const navigationLinks = [
  {
    label: '学习中心',
    path: '/learning-hub',
    icon: 'book'
  },
  {
    label: '学习路径',
    path: '/learning-paths',
    icon: 'map'
  },
  {
    label: '创建题目',
    path: '/admin/questions/new',
    icon: 'plus',
    requiresAdmin: true
  }
]
```

---

## 🎯 常见问题排查

### 问题1: 访问 `/learning-hub/:domainSlug` 显示404

**可能原因**:
- domainSlug 拼写错误
- 域名数据未加载
- 组件未正确导入

**解决方案**:
1. 检查 domainSlug 是否正确
2. 确认 QuestionBankPage.vue 存在且导入正确
3. 检查数据加载逻辑

### 问题2: 管理员路由无法访问

**可能原因**:
- 未登录
- 用户不是管理员
- 权限验证失败

**解决方案**:
1. 先登录账户
2. 确保账户具有管理员权限
3. 检查路由守卫的权限逻辑

### 问题3: 路由参数丢失

**可能原因**:
- 参数未通过 props 传递
- 参数名称与定义不匹配

**解决方案**:
1. 确保路由定义中有 `props: true`
2. 组件中正确接收 props
3. 使用 `this.$route.params` 访问参数

---

## 📚 相关文件

- **路由配置**: `frontend/src/router/index.js`
- **学习中心**: `frontend/src/views/questions/LearningHubDashboard.vue`
- **题库页面**: `frontend/src/views/questions/QuestionBankPage.vue`
- **学习路径列表**: `frontend/src/views/learning/LearningPathList.vue`
- **学习路径详情**: `frontend/src/views/learning/LearningPathDetail.vue`
- **题目编辑器**: `frontend/src/views/admin/QuestionEditor.vue`

---

**最后更新**: 2024年12月
**版本**: 1.0
**状态**: 已清晰整理 ✅

