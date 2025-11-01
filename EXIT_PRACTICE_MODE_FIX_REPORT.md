# 🐛 退出练习模式问题 - 根本原因与修复

## 问题描述
在 http://localhost:5174/chat/room/3 页面，点击"退出练习"按钮需要点击很多次才能真正退出练习模式。

## 🔍 根本原因分析

### 问题所在：URL 参数未清理
当用户点击"再答一次"进入练习模式时，URL 变成：
```
http://localhost:5174/chat/room/3?mode=practice&recordId=xxx
```

原来的 `exitPracticeMode()` 函数只做了：
```javascript
const exitPracticeMode = () => {
  isPracticeMode.value = false  // 只改变了标志
  practiceWrongAnswerId.value = null
  practiceQuestionIds.value = []
  currentPracticeQuestionIndex.value = 0
  // ❌ 没有清理 URL 中的 ?mode=practice 参数！
}
```

### 为什么需要点击多次？
1. 第一次点击"退出"：isPracticeMode 变为 false，横幅消失
2. 但 URL 仍然是 `...?mode=practice`
3. 页面任何更新、刷新或路由变更时，`onMounted` 中的 `initPracticeMode()` 被调用
4. `initPracticeMode()` 检测到 `route.query.mode === 'practice'`，再次启用练习模式
5. isPracticeMode 被重新设置为 true，横幅再次出现
6. 需要继续点击退出...形成循环

## ✅ 修复方案

### 修改文件
`D:\code7\interview-system\frontend\src\composables\usePracticeMode.js`

### 修复内容
将 `exitPracticeMode()` 函数从：
```javascript
const exitPracticeMode = () => {
  isPracticeMode.value = false
  practiceWrongAnswerId.value = null
  practiceQuestionIds.value = []
  currentPracticeQuestionIndex.value = 0
}
```

改为：
```javascript
const exitPracticeMode = () => {
  isPracticeMode.value = false
  practiceWrongAnswerId.value = null
  practiceQuestionIds.value = []
  currentPracticeQuestionIndex.value = 0

  // 重要：清除 URL 中的 mode=practice 参数，防止重新进入练习模式
  if (route.name === 'ChatRoom' && route.query.mode === 'practice') {
    const newQuery = { ...route.query }
    delete newQuery.mode
    delete newQuery.recordId

    router.replace({
      name: 'ChatRoom',
      params: route.params,
      query: newQuery  // 去掉 mode=practice
    }).catch(err => {
      console.error('Failed to clear practice mode from URL:', err)
    })
  }
}
```

### 修复的作用
1. 清除 isPracticeMode 状态
2. 同时从 URL 中删除 `mode=practice` 和 `recordId` 参数
3. 使用 `router.replace()` 静默更新 URL（不创建历史记录）
4. 防止 `initPracticeMode()` 再次触发

## 🧪 测试方法

### 步骤 1：进入练习模式
1. 访问 http://localhost:5174
2. 进入错题详情页
3. 点击"再答一次"
4. 观察 URL 变成：`...?mode=practice&recordId=xxx`

### 步骤 2：退出练习模式
1. 看到顶部显示"巩固练习"横幅
2. **点击一次**"退出练习"按钮
3. ✅ 横幅应该立即消失
4. ✅ URL 应该自动变成：`...?` (没有 mode=practice)
5. ✅ 不需要再点击！

### 预期结果
- **修复前**：需要点击多次，每次点击后横幅闪现
- **修复后**：点击一次立即退出，URL 参数清理干净

## 📊 代码变更统计
- 修改文件：1 个
- 修改函数：1 个 (exitPracticeMode)
- 增加行数：7 行（注释 + 路由清理逻辑）

## 🔗 相关文件
- 修改：`usePracticeMode.js` - 第 97-119 行
- 依赖：Vue Router (useRouter)
- 影响：ChatRoom.vue 中的"退出练习"按钮

## 💡 技术要点
- **问题根源**：状态与 URL 同步不一致
- **解决方案**：同时清理状态和 URL 参数
- **防御**：添加 try-catch，防止路由错误
- **最佳实践**：应用状态应该与 URL 参数保持同步

---

**修复日期**：2025-10-31
**状态**：✅ 已实现
**建议**：建议在所有路由导航前清理状态参数
