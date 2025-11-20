# 性能卡死问题诊断指南

## 问题描述
点击"为你推荐"中的帖子，整个网站直接卡死（无响应）。

## 立即诊断步骤

### 1. **打开浏览器开发者工具** (F12)

### 2. **按照下面的步骤来排查问题**

#### A. 检查 Console 标签
- [ ] 是否有红色错误？
- [ ] 是否有警告信息？
- [ ] 是否看到无限循环的日志消息？

**操作**：点击一个帖子，观察 Console 输出，是否有这样的循环日志：
```
[AI Assistant] 组件已挂载...
[AI Assistant] 组件已挂载...
[AI Assistant] 组件已挂载...
```
如果看到这种，说明组件在无限循环挂载。

#### B. 检查 Network 标签
- [ ] 设置 Network 为 "Slow 3G"（模拟慢速网络）
- [ ] 点击一个帖子，观察网络请求
- [ ] 是否有大量重复的请求？
- [ ] 是否有失败的请求（红色）？

**预期**：应该看到 1-2 个主要请求（获取帖子详情）

**异常**：如果看到 10+ 个请求或重复请求，说明有问题。

#### C. 检查 Performance 标签（最重要）
1. 点击红色的"Record"按钮
2. 点击一个帖子
3. 等待 5 秒后停止录制
4. 观察火焰图：
   - [ ] JavaScript 执行时间是否超过 50ms？
   - [ ] 是否看到 Long Task（长任务）？
   - [ ] Main Thread 是否被占满？

---

## 根据症状诊断

### 症状 1: Console 显示错误
```
Error: Maximum call stack size exceeded
```
→ **原因**：无限递归或死循环
→ **解决**：检查 watch/computed 是否互相依赖

### 症状 2: Network 显示大量重复请求
```
GET /api/community/posts/123  (多次)
GET /api/ai/conversations    (多次)
```
→ **原因**：API 调用在无限循环中
→ **解决**：检查 onMounted 中的 watch/computed 逻辑

### 症状 3: Performance 显示 JavaScript 占用 > 80%
→ **原因**：同步阻塞操作
→ **解决**：检查是否有大数据处理或复杂计算

---

## 快速修复清单

### 修复 1: 禁用 AI 助手的懒加载功能
编辑 `NewAIAssistant.vue`，临时改为注释掉 watch：

```javascript
// watch(showHistory, async (newVal) => {
//   if (newVal && !historyLoaded.value) {
//     await loadConversationHistory()
//     historyLoaded.value = true
//   }
// })
```

然后测试，看是否还卡。如果不卡了，说明是 AI 助手的问题。

### 修复 2: 禁用热门文章加载
编辑 `NewPostDetail.vue`，注释掉加载热门文章：

```javascript
onMounted(() => {
  // setTimeout(() => {
  //   loadHotArticles()
  // }, 500)
})
```

然后测试，看是否还卡。

### 修复 3: 禁用专栏/归档加载
编辑 `NewRightSidebar.vue`，注释掉 setTimeout：

```javascript
onMounted(() => {
  // setTimeout(() => {
  //   loadCollection()
  //   loadArchives()
  // }, 500)
})
```

然后测试。

---

## 收集诊断信息后，需要提供

请在尝试上述诊断后，提供：

1. **Console 中看到的错误信息**（完整截图或文本）
2. **Network 标签中的请求列表**（有多少个请求，分别是什么）
3. **Performance 火焰图的截图**（或者最耗时的函数名）
4. **是否通过注释代码修复了问题**（如果是，说明是哪一部分）

---

## 最可能的原因

基于"整个网站卡死"的症状，最可能的原因是：

1. **🔴 最可能（80%）**：AI 助手的 watch 逻辑有问题，导致无限重新加载
2. **🟡 可能（15%）**：多个 API 请求堆积，网络竞争导致主线程被占用
3. **🟢 较少（5%）**：Router 导航守卫有问题

---

## 深度排查（如果上面都没问题）

如果上面的都不行，检查这些文件：

```bash
# 检查是否有路由守卫导致问题
grep -r "router.beforeEach\|guard\|meta.requiresAuth" frontend/src

# 检查是否有 watch 互相依赖
grep -r "watch(" frontend/src/views/community/PostDetail

# 检查是否有 computed 互相依赖
grep -r "computed(" frontend/src/views/community/PostDetail
```

---

## 完成诊断后

一旦确定了问题所在，我们可以：
1. 精确定位导致卡死的代码行
2. 应用针对性的修复
3. 验证性能改进

**请立即按上面的步骤诊断，并告诉我结果！**
