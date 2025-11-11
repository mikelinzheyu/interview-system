# 题库按专业大类隔离 - 实施进度总结

## ✅ 已完成的步骤 (1-9)

### 后端改动
- ✅ 步骤 1: Question.java - 添加 majorGroupId 和 majorGroupName 字段
- ✅ 步骤 2: QuestionMapper.java - 添加 majorGroupId 参数到 selectPage 和 countByCondition
- ✅ 步骤 3: QuestionService.java - 更新方法签名，添加 majorGroupId 参数
- ✅ 步骤 4: QuestionServiceImpl.java - 实现 majorGroupId 过滤逻辑，修改 getQuestions 和 getFacets
- ✅ 步骤 5: QuestionController.java - 添加 major_group_id API 参数到 GET /questions 和 /questions/facets
- ✅ 步骤 6: QuestionMapper.xml - 添加 majorGroupId 字段映射和过滤条件（selectPage、countByCondition、countByDifficulty、countByCategory）
- ✅ 步骤 7: 数据库迁移脚本 - 创建 V2.0__add_major_group_id.sql

### 前端改动
- ✅ 步骤 8: router/index.js - 修改路由为 `/learning-hub/:majorGroupSlug/questions`
- ✅ 步骤 9: questions.js Store - 替换 domainId 为 majorGroupId，添加 initializeWithMajorGroup 方法

---

## 🔄 待完成的步骤 (10-12)

### 步骤 10: 修改 QuestionBankPage.vue

**文件**: `frontend/src/views/questions/QuestionBankPage.vue`

关键改动:
1. 修改 props，将 `domainSlug` 改为 `majorGroupSlug`
2. 修改路由监听，侦听 `route.params.majorGroupSlug`
3. 修改 `preloadDomainContext` 函数：
   - 从 disciplines store 加载 major group
   - 调用 `store.initializeWithMajorGroup(majorGroup.id)` 而不是 `initializeWithDomain`

**代码参考**:
```vue
<script setup>
const props = defineProps({
  majorGroupSlug: {
    type: String,
    required: false
  }
})

watch(
  () => route.params.majorGroupSlug,
  async newSlug => {
    if (newSlug) await preloadDomainContext(newSlug)
  }
)

async function preloadDomainContext(slug = props.majorGroupSlug || route.params.majorGroupSlug) {
  try {
    // 使用 disciplines store 加载 major group
    const majorGroup = await disciplinesStore.loadMajorGroupBySlug(slug)

    if (majorGroup) {
      currentDomain.value = majorGroup
      // 关键：使用 initializeWithMajorGroup
      await store.initializeWithMajorGroup(majorGroup.id)
      return
    }
  } catch (error) {
    // 错误处理
  }
}
</script>
```

---

### 步骤 11: 修改 disciplines.js Store - 添加 loadMajorGroupBySlug 方法

**文件**: `frontend/src/stores/disciplines.js`

需要添加方法：
```javascript
// 通过 slug 获取 major group
async function loadMajorGroupBySlug(slug) {
  if (!slug) return null

  // 确保已加载 disciplines
  if (!disciplines.value.length) {
    await loadDisciplines()
  }

  // 遍历所有学科，查找对应的 majorGroup
  for (const discipline of disciplines.value) {
    const id = discipline.id
    if (!majorGroupsCache[id]) {
      await loadMajorGroups(id)
    }

    const groups = majorGroupsCache[id] || []
    const found = groups.find(g => g.slug === slug || slugify(g.name) === slug)

    if (found) return found
  }

  return null
}
```

并导出：`loadMajorGroupBySlug`

---

### 步骤 12: 修改 LearningHubDashboard.vue - 显示 Major Groups

**文件**: `frontend/src/views/questions/LearningHubDashboard.vue`

关键改动:
1. 使用 disciplines store 获取 major groups（而不是 domains）
2. 修改导航逻辑，路由参数改为 `majorGroupSlug`
3. 更新卡片显示逻辑

**代码参考**:
```vue
<script setup>
const disciplinesStore = useDisciplinesStore()

// 从 disciplines 中收集所有 major groups
const majorGroups = computed(() => {
  const all = []
  disciplinesStore.disciplines.forEach(discipline => {
    const groups = disciplinesStore.majorGroupsCache[discipline.id] || []
    all.push(...groups)
  })
  return all
})

function handleSelectDomain(majorGroup) {
  router.push({
    name: 'QuestionBankPage',
    params: { majorGroupSlug: majorGroup.slug }
  })
}
</script>

<template>
  <div class="domains-grid">
    <div
      v-for="majorGroup in majorGroups"
      :key="majorGroup.id"
      class="domain-card"
      @click="handleSelectDomain(majorGroup)"
    >
      <h3>{{ majorGroup.name }}</h3>
      <p>{{ majorGroup.description }}</p>
      <div class="stats">
        约 {{ majorGroup.questionCount || 0 }} 道题目
      </div>
    </div>
  </div>
</template>
```

---

## 实施检查清单

### 后端
- [x] Question.java 添加 majorGroupId
- [x] QuestionMapper 接口更新
- [x] QuestionService 接口更新
- [x] QuestionServiceImpl 实现更新
- [x] QuestionController API 更新
- [x] QuestionMapper.xml SQL 查询更新
- [x] 数据库迁移脚本创建
- [ ] **执行数据库迁移脚本**（需要手动运行）
- [ ] **迁移现有题目数据**（如果需要补填 major_group_id）
- [ ] **测试后端 API**：
  - GET /api/questions?major_group_id=1
  - GET /api/questions/facets?major_group_id=1

### 前端
- [x] router/index.js 路由更新
- [x] questions.js store 更新
- [ ] QuestionBankPage.vue 页面更新
- [ ] disciplines.js store 添加 loadMajorGroupBySlug 方法
- [ ] LearningHubDashboard.vue 首页更新
- [ ] **本地测试**：
  - 点击学习中心的 major group 卡片
  - 验证路由跳转到 `/learning-hub/:majorGroupSlug/questions`
  - 验证题目列表只显示该 major group 的题目
  - 验证筛选功能正常

### 集成测试
- [ ] 后端编译并启动
- [ ] 前端开发服务器启动
- [ ] 端到端测试：
  - 登录系统
  - 进入学习中心
  - 选择一个 major group
  - 验证题库只显示该 major group 的题目
  - 测试筛选（难度、题型、标签）
  - 测试搜索功能

---

## 数据迁移注意事项

执行数据库迁移脚本后，需要补填现有题目的 major_group_id：

```sql
-- 根据 category_id 和 major_groups 表的关系补填
UPDATE questions q
SET q.major_group_id = (
  SELECT mg.id FROM major_groups mg
  JOIN categories c ON c.major_group_id = mg.id
  WHERE c.id = q.category_id
)
WHERE q.major_group_id IS NULL
  AND q.category_id IS NOT NULL;
```

**注意**：确保 categories 表已有 major_group_id 字段和正确的关联关系。

---

## 关键要点

1. **物理隔离**：每个 API 查询都强制带上 major_group_id，防止跨 group 污染
2. **单一归属**：每道题归属于唯一的 major group
3. **向下兼容**：保留 categoryId 等字段用于内部分类
4. **清晰导航**：路由直观反映"专业大类"概念

---

## 下一步行动

1. **立即执行**：
   - 编译后端，运行数据库迁移脚本
   - 补填现有题目的 major_group_id

2. **完成前端改动**：
   - 按照步骤 10-12 修改前端文件
   - 运行前端开发服务器

3. **测试**：
   - 验证后端 API 正常工作
   - 验证前端题库页面隔离有效
   - 进行完整的端到端测试

