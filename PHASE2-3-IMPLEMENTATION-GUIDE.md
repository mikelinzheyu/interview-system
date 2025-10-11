# Phase 2 & 3 实施指南

## ✅ Phase 1 完成总结

已完成功能:
- ✅ Domain 领域表设计与 API
- ✅ Category 关联 domainId
- ✅ Question metadata JSON 字段
- ✅ 前端 Domain 选择器页面
- ✅ 动态按领域筛选题目
- ✅ Metadata 筛选支持

测试: 所有 API 和前端功能测试通过

---

## 📦 Phase 2 - 增强功能实施

### 1. 多专业内容录入工具 ✅

#### 已创建文件
```
frontend/src/components/DynamicFormRenderer.vue
frontend/src/views/admin/QuestionEditor.vue
```

#### 核心功能
- **动态表单渲染器** (`DynamicFormRenderer.vue`)
  - 根据领域字段配置动态渲染表单
  - 支持: select, multi-select, tags, text, number, date, switch, textarea
  - v-model 双向绑定

- **题目编辑器** (`QuestionEditor.vue`)
  - 选择领域后自动加载字段配置
  - 动态渲染专业特定 metadata 输入框
  - 支持标签、提示信息等管理

#### 使用示例
```vue
<DynamicFormRenderer
  :fields="domainFieldConfig"
  v-model="questionMetadata"
/>
```

### 2. 学习路径管理功能 ✅

#### 后端数据模型
```javascript
learningPaths: [
  {
    id, name, slug, domainId,
    description, level, estimatedHours,
    modules: [
      { id, name, description, questionIds, estimatedHours, order }
    ],
    certificate: { enabled, passingScore, name },
    stats: { enrolledCount, completedCount, averageScore }
  }
]

userLearningPaths: [
  {
    userId, pathId,
    enrolledAt, currentModuleId,
    progress, completedModules,
    totalScore, status
  }
]
```

#### API 接口
```
GET /api/learning-paths                      获取学习路径列表
GET /api/learning-paths/:id                  获取路径详情
POST /api/learning-paths/:id/enroll          报名学习路径
PUT /api/learning-paths/:pathId/modules/:moduleId/complete  完成模块
```

#### 示例数据
- 前端工程师进阶路径 (4个模块, 80小时)
- 金融分析师基础路径 (3个模块, 60小时)

### 3. 专业化推荐算法 (待完成前端)

#### 后端已支持
```javascript
// 在 Questions API 中
GET /api/questions/recommendations?user_profile={...}
```

#### 推荐策略
```javascript
function getPersonalizedRecommendations(userProfile) {
  const score = calculateScore({
    domainMatch: 40%,        // 领域匹配度
    weaknessArea: 30%,       // 薄弱环节
    trendingTopics: 20%,     // 热门/趋势
    diversity: 10%           // 多样性
  })

  return sortedQuestions
}
```

---

## 🚀 Phase 3 - 高级功能规划

### 1. 社区贡献系统 (TODO)

#### 数据模型设计
```javascript
{
  contributedQuestions: [
    {
      id, questionData,
      contributorId, contributorProfile,
      status: 'pending' | 'approved' | 'rejected',
      reviewComments, reviewedBy,
      submittedAt, reviewedAt
    }
  ],

  contributors: [
    {
      userId, domainExpertise: [domainId],
      expertLevel: 'junior' | 'senior' | 'expert',
      contributedCount, approvalRate,
      badges: ['Top Contributor', 'Domain Expert']
    }
  ]
}
```

#### 功能点
- [ ] 用户提交题目功能
- [ ] 专家审核工作流
- [ ] 贡献者积分与徽章系统
- [ ] 题目修订建议功能

### 2. 跨专业能力分析 (TODO)

#### T型人才识别
```javascript
{
  userSkillProfile: {
    primaryDomain: { domainId, proficiencyScore },
    secondaryDomains: [
      { domainId, proficiencyScore }
    ],
    skillRadarChart: {
      domains: ['前端', '后端', '算法', '系统设计'],
      scores: [90, 65, 75, 55]
    },
    crossDomainIndex: 0.72  // 跨专业综合指数
  }
}
```

#### API 设计
```
GET /api/users/skill-profile          获取用户技能画像
GET /api/users/cross-domain-analysis  跨专业能力分析
POST /api/users/skill-recommendations 技能提升建议
```

### 3. AI 自动出题功能 (TODO)

#### 设计方案
```javascript
POST /api/ai/generate-question
{
  domainId: 1,
  difficulty: 'medium',
  topics: ['闭包', '异步编程'],
  questionType: 'short_answer',
  metadata: {
    languageRestrictions: ['JavaScript']
  }
}

Response: {
  generatedQuestion: {
    title, question, answer,
    explanation, hints,
    metadata, confidenceScore: 0.87
  }
}
```

#### 实现思路
1. 调用 LLM API (如 OpenAI, Claude)
2. 结合领域 field-config 构造 prompt
3. 生成题目后人工审核
4. 自动评估质量分数

---

## 📋 待完成任务清单

### Phase 2 剩余
- [x] 动态表单编辑器
- [x] 题目管理后台页面
- [x] 学习路径后端数据与 API
- [ ] 学习路径前端展示页面
- [ ] 学习路径报名与进度追踪UI
- [ ] 专业化推荐算法前端集成

### Phase 3 任务
- [ ] 社区贡献提交表单
- [ ] 专家审核后台
- [ ] 贡献者积分系统
- [ ] 跨专业能力分析页面
- [ ] 技能雷达图可视化
- [ ] AI 出题集成 (需 API Key)
- [ ] AI 生成题目审核流程

---

## 🔧 下一步实施建议

### 优先级1 (本周完成)
1. 完成学习路径展示页面
2. 实现学习路径报名功能
3. 专业化推荐算法前端接入

### 优先级2 (两周内)
4. 社区贡献基础功能
5. 跨专业能力分析原型

### 优先级3 (一个月内)
6. AI 自动出题 POC
7. 完善审核流程

---

## 📊 当前架构优势

### 可扩展性
- Domain 作为顶级抽象,易于新增领域
- metadata JSON 字段,无需改表结构
- 配置驱动的动态表单,适应各专业需求

### 模块化
- 前后端分离,API 设计 RESTful
- 组件化设计 (DynamicFormRenderer 可复用)
- Store 分离管理 (domain, questions, learningPath)

### 用户体验
- 领域选择器直观
- 动态表单减少认知负担
- 学习路径提供结构化学习体验

---

## 📚 技术栈

### 后端
- Node.js + HTTP Server
- Mock Data (可升级为真实数据库)
- RESTful API 设计

### 前端
- Vue 3 + Composition API
- Pinia (状态管理)
- Element Plus (UI 组件)
- Vite (构建工具)

### 未来集成
- LLM API (AI 出题)
- ElasticSearch (高级搜索)
- Redis (缓存)
- PostgreSQL (生产数据库)

---

## ✨ 核心创新点

1. **配置驱动的专业化**: 通过 domainFieldConfigs 实现不同专业的差异化管理
2. **学习路径设计**: 结构化学习替代零散练习
3. **社区驱动内容**: 专家贡献 + 审核机制保证质量
4. **AI 赋能**: 自动出题减轻运营负担

---

**文档版本**: v2.0
**更新日期**: 2025-10-03
**状态**: Phase 1 完成, Phase 2 进行中
