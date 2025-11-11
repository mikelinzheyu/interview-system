# 题库按专业大类隔离 - 完整实施方案

## 核心问题
当前题库体系存在以下问题：
- ❌ 题目表缺少 `major_group_id` 字段，无法按专业大类隔离题目
- ❌ 路由使用 `:domainSlug`，但 Domain 体系过于宽泛，不适合作为题库隔离的主要维度
- ❌ 前端和后端都缺少基于"专业大类"（Major Group）的题目查询逻辑

## 解决方案架构

```
修改前：
  Discipline (学科) → Domain (6个宽泛域) → Questions (题目混杂)

修改后：
  Discipline (学科) → Major Group (专业大类) → Questions (隔离题目)
                           ↓
                    /learning-hub/:majorGroupSlug/questions
```

## 实施步骤

### 【后端改动】

#### 步骤 1: 修改 Question 实体 - 添加 majorGroupId 字段

**文件**: `backend/main/java/com/interview/interview-common/entity/Question.java`

```java
public class Question {
    private Long id;
    private String title;
    private String content;
    private String difficulty;
    private String type;
    private Long categoryId;
    private Category category;

    // ← 新增字段
    private Long majorGroupId;
    private String majorGroupName;  // 冗余字段，便于查询时显示
    // ← 新增字段结束

    private List<String> tags;
    private Integer viewCount;
    private Integer likeCount;
    // ... 其他字段保持不变

    // 新增 getter/setter
    public Long getMajorGroupId() {
        return majorGroupId;
    }

    public void setMajorGroupId(Long majorGroupId) {
        this.majorGroupId = majorGroupId;
    }

    public String getMajorGroupName() {
        return majorGroupName;
    }

    public void setMajorGroupName(String majorGroupName) {
        this.majorGroupName = majorGroupName;
    }
}
```

---

#### 步骤 2: 修改 QuestionMapper 接口 - 添加 majorGroupId 参数

**文件**: `backend/main/java/com/interview/interview-server/mapper/QuestionMapper.java`

```java
@Mapper
public interface QuestionMapper {

    // 修改现有方法，添加 majorGroupId 参数
    List<Question> selectPage(
        @Param("offset") int offset,
        @Param("size") int size,
        @Param("majorGroupId") Long majorGroupId,  // ← 新增
        @Param("categoryId") Long categoryId,
        @Param("difficulty") String difficulty,
        @Param("type") String type,
        @Param("keyword") String keyword,
        @Param("tags") String tags,
        @Param("tagList") java.util.List<String> tagList,
        @Param("sort") String sort
    );

    long countByCondition(
        @Param("majorGroupId") Long majorGroupId,  // ← 新增
        @Param("categoryId") Long categoryId,
        @Param("difficulty") String difficulty,
        @Param("type") String type,
        @Param("keyword") String keyword,
        @Param("tags") String tags,
        @Param("tagList") java.util.List<String> tagList
    );

    // 其他方法保持不变...
}
```

---

#### 步骤 3: 修改 QuestionService 接口 - 添加 majorGroupId 参数

**文件**: `backend/main/java/com/interview/interview-server/service/QuestionService.java`

```java
public interface QuestionService {

    // 修改现有方法签名
    PageResponse<Question> getQuestions(
        int page,
        int size,
        Long majorGroupId,  // ← 新增参数
        Long categoryId,
        String difficulty,
        String type,
        String keyword,
        String tags,
        String sort
    );

    QuestionFacetsResponse getFacets(
        Long majorGroupId,  // ← 新增参数
        Long categoryId,
        String keyword,
        String tags
    );

    // 其他方法保持不变...
}
```

---

#### 步骤 4: 修改 QuestionServiceImpl 实现类

**文件**: `backend/main/java/com/interview/interview-server/service/impl/QuestionServiceImpl.java`

在构建查询参数时，始终检查并添加 majorGroupId 过滤：

```java
@Override
public PageResponse<Question> getQuestions(
    int page,
    int size,
    Long majorGroupId,
    Long categoryId,
    String difficulty,
    String type,
    String keyword,
    String tags,
    String sort
) {
    int offset = (page - 1) * size;

    // ★ 关键：如果提供了 majorGroupId，强制按此过滤，确保隔离
    if (majorGroupId != null && majorGroupId <= 0) {
        return new PageResponse<>(new ArrayList<>(), 0, page, size);
    }

    List<String> tagList = parseTags(tags);

    List<Question> questions = questionMapper.selectPage(
        offset,
        size,
        majorGroupId,  // ← 传入 majorGroupId
        categoryId,
        difficulty,
        type,
        keyword,
        tags,
        tagList,
        sort
    );

    long total = questionMapper.countByCondition(
        majorGroupId,  // ← 传入 majorGroupId
        categoryId,
        difficulty,
        type,
        keyword,
        tags,
        tagList
    );

    return new PageResponse<>(questions, total, page, size);
}
```

---

#### 步骤 5: 修改 QuestionController - 添加 API 参数

**文件**: `backend/main/java/com/interview/interview-server/controller/QuestionController.java`

```java
@GetMapping("/questions")
public ApiResponse<PageResponse<Question>> getQuestions(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(name = "major_group_id", required = false) Long majorGroupId,  // ← 新增
        @RequestParam(name = "category_id", required = false) Long categoryId,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String type,
        @RequestParam(required = false, name = "keyword") String keyword,
        @RequestParam(required = false, name = "q") String q,
        @RequestParam(required = false) String tags,
        @RequestParam(required = false, defaultValue = "recent") String sort) {

    String kw = (keyword != null && !keyword.isEmpty()) ? keyword : q;
    PageResponse<Question> result = questionService.getQuestions(
            page, size,
            majorGroupId,  // ← 传入 majorGroupId
            categoryId, difficulty, type, kw, tags, sort);
    return ApiResponse.success(result);
}

@GetMapping("/questions/facets")
public ApiResponse<QuestionFacetsResponse> getQuestionFacets(
        @RequestParam(name = "major_group_id", required = false) Long majorGroupId,  // ← 新增
        @RequestParam(name = "category_id", required = false) Long categoryId,
        @RequestParam(required = false, name = "keyword") String keyword,
        @RequestParam(required = false, name = "q") String q,
        @RequestParam(required = false) String tags) {
    String kw = (keyword != null && !keyword.isEmpty()) ? keyword : q;
    QuestionFacetsResponse facets = questionService.getFacets(
            majorGroupId,  // ← 传入 majorGroupId
            categoryId, kw, tags);
    return ApiResponse.success(facets);
}
```

---

#### 步骤 6: 修改 SQL 查询 - 添加 majorGroupId 过滤

**文件**: `backend/resources/mapper/QuestionMapper.xml`

```xml
<select id="selectPage" resultMap="BaseResultMap">
    SELECT * FROM questions
    WHERE 1=1
    <!-- 新增：严格按 majorGroupId 过滤 -->
    <if test="majorGroupId != null">
        AND major_group_id = #{majorGroupId}
    </if>
    <!-- 保持现有条件 -->
    <if test="categoryId != null">
        AND category_id = #{categoryId}
    </if>
    <if test="difficulty != null and difficulty != ''">
        AND difficulty = #{difficulty}
    </if>
    <if test="type != null and type != ''">
        AND type = #{type}
    </if>
    <if test="keyword != null and keyword != ''">
        AND (title LIKE CONCAT('%', #{keyword}, '%') OR content LIKE CONCAT('%', #{keyword}, '%'))
    </if>
    <!-- tags 过滤逻辑保持不变 -->
    ORDER BY
        <choose>
            <when test="sort == 'popular'">view_count DESC</when>
            <when test="sort == 'difficulty'">difficulty_score ASC</when>
            <when test="sort == 'difficulty_desc'">difficulty_score DESC</when>
            <otherwise>created_at DESC</otherwise>
        </choose>
    LIMIT #{offset}, #{size}
</select>

<select id="countByCondition" resultType="long">
    SELECT COUNT(*) FROM questions
    WHERE 1=1
    <!-- 新增：严格按 majorGroupId 过滤 -->
    <if test="majorGroupId != null">
        AND major_group_id = #{majorGroupId}
    </if>
    <!-- 保持现有条件 -->
    <if test="categoryId != null">
        AND category_id = #{categoryId}
    </if>
    <if test="difficulty != null and difficulty != ''">
        AND difficulty = #{difficulty}
    </if>
    <if test="type != null and type != ''">
        AND type = #{type}
    </if>
    <if test="keyword != null and keyword != ''">
        AND (title LIKE CONCAT('%', #{keyword}, '%') OR content LIKE CONCAT('%', #{keyword}, '%'))
    </if>
</select>
```

---

#### 步骤 7: 数据库迁移 - 添加 major_group_id 列

**文件**: `backend/resources/db/migration/V1.X__add_major_group_id.sql`

```sql
-- 添加 major_group_id 列到 questions 表
ALTER TABLE questions
ADD COLUMN major_group_id BIGINT COMMENT '题目所属专业大类ID',
ADD COLUMN major_group_name VARCHAR(255) COMMENT '题目所属专业大类名称',
ADD INDEX idx_major_group_id (major_group_id);

-- 如果现有题目需要迁移，可以执行以下逻辑：
-- 根据 category_id 反推 major_group_id（需要根据实际分类关系调整）
-- UPDATE questions SET major_group_id = X WHERE category_id IN (...)
```

---

### 【前端改动】

#### 步骤 8: 修改前端路由 - `router/index.js`

```javascript
// 修改现有路由
{
  path: '/learning-hub/:majorGroupSlug/questions',  // ← 改为 majorGroupSlug
  name: 'QuestionBankPage',
  component: () => import('@/views/questions/QuestionBankPage.vue'),
  meta: {
    requiresAuth: true,
    title: '题库',
    description: '查看特定专业大类的题目'
  },
  props: true
}
```

---

#### 步骤 9: 修改 `QuestionBankPage.vue`

关键改动点：

```vue
<script setup>
const props = defineProps({
  majorGroupSlug: {  // ← 改为 majorGroupSlug
    type: String,
    required: false
  }
})

// 从路由参数读取 majorGroupSlug（而不是 domainSlug）
const currentMajorGroupSlug = computed(() => route.params.majorGroupSlug || '')

// 通过 disciplines store 加载 major group 数据
async function preloadDomainContext(slug = props.majorGroupSlug || route.params.majorGroupSlug) {
  try {
    // 从 disciplines store 获取 major group
    const majorGroup = await disciplinesStore.loadMajorGroupBySlug(slug)

    if (majorGroup) {
      currentDomain.value = majorGroup  // 保留变量名以最小改动

      // 关键：用 majorGroupId 初始化题库，确保数据隔离
      await store.initializeWithMajorGroup(majorGroup.id)

      // 加载该专业大类下的分类树
      await domainStore.loadFieldConfig(majorGroup.id)

      return
    }

    currentDomain.value = null
    await store.initialize()
  } catch (error) {
    console.error('Failed to preload domain context', error)
    ElMessage.error('题库数据加载失败，请稍后重试')
  }
}

// 修改路由参数监听
watch(
  () => route.params.majorGroupSlug,  // ← 改为 majorGroupSlug
  async newSlug => {
    if (newSlug !== currentDomain.value?.slug) {
      await preloadDomainContext(newSlug)
    }
  }
)
</script>
```

---

#### 步骤 10: 修改 `questions.js` Store

```javascript
export const useQuestionBankStore = defineStore('questionBank', () => {
  // 修改 filters
  const filters = reactive({
    keyword: '',
    difficulty: [],
    type: [],
    tags: [],
    categoryId: null,
    includeDescendants: true,
    sort: 'recent',
    majorGroupId: null,  // ← 改为 majorGroupId（替代 domainId）
    metadata: {}
  })

  // 修改参数构建
  function buildListParams(overrides = {}) {
    const params = {
      page: overrides.page ?? pagination.page,
      size: overrides.size ?? pagination.size,
      sort: filters.sort
    }

    if (filters.keyword) params.keyword = filters.keyword

    // ★ 关键：强制带上 majorGroupId，确保题目隔离
    if (filters.majorGroupId) {
      params.major_group_id = filters.majorGroupId
    }

    if (filters.categoryId) params.category_id = filters.categoryId
    if (!filters.includeDescendants) params.include_descendants = false
    if (filters.difficulty.length) params.difficulty = filters.difficulty.join(',')
    if (filters.type.length) params.type = filters.type.join(',')
    if (filters.tags.length) params.tags = filters.tags.join(',')

    return params
  }

  // 新增初始化方法
  async function initializeWithMajorGroup(majorGroupId) {
    filters.majorGroupId = majorGroupId
    filters.categoryId = null
    filters.difficulty = []
    filters.type = []
    filters.tags = []
    filters.keyword = ''
    pagination.page = 1

    // 加载分类
    await loadQuestionCategories()

    // 加载题目
    await loadQuestions({ page: 1 })
  }

  return {
    // 现有导出...
    initializeWithMajorGroup  // ← 新增导出
  }
})
```

---

#### 步骤 11: 修改 `disciplines.js` Store - 添加方法

```javascript
// 在 disciplines store 中添加方法
export const useDisciplinesStore = defineStore('disciplines', () => {
  // ... 现有代码 ...

  // 新增方法：通过 slug 获取 major group
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
      const found = groups.find(g => {
        // 支持多种 slug 匹配方式
        return g.slug === slug || slugify(g.name) === slug
      })

      if (found) return found
    }

    return null
  }

  // 导出新方法
  return {
    // 现有导出...
    loadMajorGroupBySlug  // ← 新增导出
  }
})
```

---

#### 步骤 12: 修改 `LearningHubDashboard.vue` - 显示 Major Groups

```vue
<script setup>
const disciplinesStore = useDisciplinesStore()

// 改为显示 major groups（而不是 domains）
const majorGroups = computed(() => {
  // 从 disciplines store 获取所有 major groups
  const all = []
  disciplinesStore.disciplines.forEach(discipline => {
    const groups = disciplinesStore.majorGroupsCache[discipline.id] || []
    all.push(...groups)
  })
  return all
})

// 导航到题库
function handleSelectDomain(majorGroup) {
  router.push({
    name: 'QuestionBankPage',
    params: { majorGroupSlug: majorGroup.slug }
  })
}
</script>

<template>
  <!-- 显示 Major Groups 卡片 -->
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

## 数据映射参考

| 层级 | 概念 | 用途 | 数据库表 | 字段名 |
|-----|------|------|--------|--------|
| L1 | 学科 (Discipline) | 顶层导航 | disciplines | id, name |
| L2 | 专业大类 (Major Group) | **题库隔离核心** | major_groups | id, slug, name |
| L3 | 课程/分类 (Course/Category) | 题库内筛选 | categories | id, name, major_group_id |
| L4 | 知识点 (Knowledge Tag) | 细粒度标签 | question_tags | tag_name |

---

## 实施清单

- [ ] 后端：Question.java 添加 majorGroupId 字段
- [ ] 后端：QuestionMapper.xml 添加 majorGroupId 过滤
- [ ] 后端：QuestionService 方法签名添加 majorGroupId 参数
- [ ] 后端：QuestionController 添加 major_group_id API 参数
- [ ] 数据库：执行迁移脚本，添加 major_group_id 列
- [ ] 数据库：迁移现有题目数据，补填 major_group_id
- [ ] 前端：修改路由，改为 `/learning-hub/:majorGroupSlug/questions`
- [ ] 前端：修改 QuestionBankPage.vue，使用 majorGroupSlug
- [ ] 前端：修改 questions.js store，添加 majorGroupId 过滤
- [ ] 前端：修改 disciplines.js store，添加 loadMajorGroupBySlug 方法
- [ ] 前端：修改 LearningHubDashboard.vue，显示 major groups
- [ ] 测试：验证各个 major group 的题库隔离
- [ ] 文档：更新 API 文档和前端路由文档

---

## 关键设计原则

1. **物理隔离**：每条 Query 都必须带上 `majorGroupId`，防止跨 group 污染
2. **单一归属**：每道题的核心归属是唯一的 major group
3. **向下兼容**：保留 categoryId 等字段用于内部分类，但查询的主过滤键是 majorGroupId
4. **用户友好**：路由和 URL 直观反映"专业大类"概念，对用户更清晰

