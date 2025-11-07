# 🚀 多专业题库系统快速启动指南

## 📋 系统概览

这是一个支持多专业领域的综合学习平台，已完成 Phase 1 & 2 开发。

**当前版本**: v2.0
**完成度**: Phase 1 (100%) + Phase 2 (100%)
**测试通过率**: 100% (19/19)

---

## 🎯 核心功能

### Phase 1: 基础架构 ✅
- ✅ 5个专业领域支持 (计算机、金融、医学、法律、管理)
- ✅ 领域专属字段配置
- ✅ 按领域筛选题目
- ✅ Metadata 动态字段支持

### Phase 2: 功能增强 ✅
- ✅ 动态表单编辑器 (8种字段类型)
- ✅ 题目管理后台
- ✅ 学习路径系统 (2个示例路径)
- ✅ 证书认证机制
- ✅ 进度追踪 (模块级 + 路径级)

---

## 🔧 系统启动

### 1️⃣ 启动后端服务器

```bash
cd D:\code7\interview-system
node backend/mock-server.js
```

**输出**:
```
🚀 Mock API服务器已启动
📍 地址: http://localhost:3001
```

### 2️⃣ 启动前端开发服务器

新开一个终端:
```bash
cd D:\code7\interview-system\frontend
npm run dev
```

**输出**:
```
VITE v4.5.14 ready in XXXms
➜ Local: http://localhost:5175/
```

### 3️⃣ 访问系统

打开浏览器访问: **http://localhost:5175**

---

## 🌐 功能演示路径

### 1. 领域选择体验

**URL**: http://localhost:5175/questions/domains

**功能演示**:
- 查看5个专业领域卡片
- 查看每个领域的题目数、分类数
- 查看难度分布统计
- 点击任意领域进入题库

### 2. 计算机科学题库

**URL**: http://localhost:5175/questions/computer-science

**功能演示**:
- 查看计算机科学领域的题目列表
- 按分类筛选 (算法与数据结构、前端开发、后端开发)
- 按难度筛选 (基础、进阶、挑战)
- 查看题目的专业字段 (编程语言、时间复杂度等)

### 3. 金融学题库

**URL**: http://localhost:5175/questions/finance

**功能演示**:
- 查看金融学领域的题目
- 专业字段: 市场细分、分析方法、相关法规

### 4. 学习路径列表

**URL**: http://localhost:5175/learning-paths

**功能演示**:
- 查看所有学习路径 (2个示例)
- 按领域筛选 (计算机科学、金融学)
- 按级别筛选 (入门、进阶、高级)
- 查看路径统计 (模块数、时长、报名人数)
- 点击"立即报名"体验报名功能

### 5. 学习路径详情

**URL**: http://localhost:5175/learning-paths/frontend-advanced

**功能演示**:
- 查看"前端工程师进阶路径"详情
- 4个学习模块展示
- 报名后查看圆环进度
- 顺序学习控制 (必须完成前置模块)
- 证书信息展示

### 6. 题目管理后台 (管理员)

**URL**: http://localhost:5175/admin/questions/new

**功能演示**:
- 选择所属领域
- 自动加载该领域的字段配置
- 动态表单渲染专业字段
- 填写题目基础信息
- 添加选项和答案

---

## 📊 API 端点测试

### Domain APIs

```bash
# 获取所有领域
curl http://localhost:3001/api/domains

# 获取领域详情
curl http://localhost:3001/api/domains/1

# 获取字段配置
curl http://localhost:3001/api/domains/1/field-config
```

### Questions APIs

```bash
# 获取所有题目
curl http://localhost:3001/api/questions

# 按领域筛选
curl http://localhost:3001/api/questions?domain_id=1

# 按 metadata 筛选
curl "http://localhost:3001/api/questions?metadata.marketSegment=股票市场"
```

### Learning Path APIs

```bash
# 获取所有学习路径
curl http://localhost:3001/api/learning-paths

# 按领域筛选
curl http://localhost:3001/api/learning-paths?domain_id=1

# 获取路径详情
curl http://localhost:3001/api/learning-paths/frontend-advanced

# 报名学习路径
curl -X POST http://localhost:3001/api/learning-paths/1/enroll

# 完成模块
curl -X PUT http://localhost:3001/api/learning-paths/1/modules/1/complete
```

---

## 🧪 运行测试

### Phase 1 测试 (领域功能)

```bash
node test-domain-feature.js
```

**预期输出**:
```
✅ 所有测试通过 (10/10)
```

### Phase 2 测试 (学习路径)

```bash
node test-learning-paths.js
```

**预期输出**:
```
✅ 所有测试通过 (9/9)
```

---

## 📁 项目结构

```
interview-system/
├── backend/
│   └── mock-server.js          # 后端 API 服务器
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── DynamicFormRenderer.vue  # 动态表单渲染器
│   │   ├── views/
│   │   │   ├── questions/
│   │   │   │   ├── DomainSelector.vue      # 领域选择页
│   │   │   │   └── QuestionBankPage.vue    # 题库页
│   │   │   ├── learning/
│   │   │   │   ├── LearningPathList.vue    # 学习路径列表
│   │   │   │   └── LearningPathDetail.vue  # 学习路径详情
│   │   │   └── admin/
│   │   │       └── QuestionEditor.vue       # 题目编辑器
│   │   ├── stores/
│   │   │   ├── domain.js            # Domain Store
│   │   │   ├── learningPath.js      # Learning Path Store
│   │   │   └── questions.js         # Questions Store
│   │   ├── api/
│   │   │   ├── domain.js            # Domain API
│   │   │   └── learningPath.js      # Learning Path API
│   │   └── router/
│   │       └── index.js             # 路由配置
│   └── vite.config.js               # Vite 配置
├── test-domain-feature.js           # Phase 1 测试
├── test-learning-paths.js           # Phase 2 测试
├── MULTI-DOMAIN-QUESTION-BANK.md    # Phase 1 总结
├── PHASE2-COMPLETE-SUMMARY.md       # Phase 2 总结
├── COMPLETE-IMPLEMENTATION-SUMMARY.md # 完整实施总结
└── QUICK-START-GUIDE.md             # 本文档
```

---

## 🎨 UI 截图说明

### 1. 领域选择页

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 💻        │ 💰        │ 🏥        │ ⚖️         │ 📊        │
│ 计算机科学│ 金融学    │ 医学      │ 法律       │ 管理学    │
│          │          │          │          │          │
│ 2道题目   │ 1道题目   │ 1道题目   │ 1道题目   │ 1道题目   │
│ 3个分类   │ 3个分类   │ 3个分类   │ 3个分类   │ 3个分类   │
│          │          │          │          │          │
│ 基础 1    │ 基础 0    │ 基础 0    │ 基础 0    │ 基础 0    │
│ 进阶 0    │ 进阶 0    │ 进阶 0    │ 进阶 0    │ 进阶 0    │
│ 挑战 1    │ 挑战 1    │ 挑战 1    │ 挑战 1    │ 挑战 1    │
│          │          │          │          │          │
│ [进入]   │ [进入]   │ [进入]   │ [进入]   │ [进入]   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 2. 学习路径列表

```
学习路径
系统化学习,快速成长为领域专家

[领域筛选 ▼] [级别筛选 ▼]

┌───────────────────────────────┐  ┌───────────────────────────────┐
│ 🚀              [进阶]         │  │ 💰              [入门]         │
│ 前端工程师进阶路径              │  │ 金融分析师基础路径              │
│ 系统学习现代前端开发技术栈       │  │ 掌握金融分析基本技能            │
│                               │  │                               │
│ 📄 4个模块                     │  │ 📄 3个模块                     │
│ ⏰ 约80小时                    │  │ ⏰ 约60小时                    │
│ ❓ 1道题目                     │  │ ❓ 1道题目                     │
│                               │  │                               │
│ 👤 1245人已报名                │  │ 👤 856人已报名                 │
│ 完成率: 31%                    │  │ 完成率: 28%                    │
│                               │  │                               │
│ [立即报名]                     │  │ [立即报名]                     │
│ 🏅 可获得证书                   │  │ 🏅 可获得证书                   │
└───────────────────────────────┘  └───────────────────────────────┘
```

### 3. 学习路径详情

```
← 返回列表

🚀    [进阶]                          ┌────────────┐
前端工程师进阶路径                      │  学习进度   │
系统学习现代前端开发技术栈                │            │
                                      │   ●25%     │
📄 4个模块  ⏰ 80小时  👤 1245人        │            │
🏅 可获得证书                           │  已完成1/4  │
                                      │            │
                                      │ [继续学习]  │
                                      └────────────┘

学习模块

┌──────────────────────────────────────────┐
│ [1]  JavaScript 核心概念         ✓已完成 │
│      深入理解 JS 原型、闭包、异步编程     │
│      ⏰ 20小时  ❓ 1道题                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ [2]  Vue 3 进阶              [开始学习]  │
│      Composition API、响应式原理         │
│      ⏰ 30小时  ❓ 0道题                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ [3]  前端工程化              [未解锁]    │
│      构建工具、CI/CD、性能优化            │
│      ⏰ 15小时  ❓ 0道题                 │
└──────────────────────────────────────────┘

获得认证证书
┌──────────────────────────────────────────┐
│ 🏅 获得认证证书                           │
│ 完成所有模块并达到 80 分以上,即可获得:     │
│                                          │
│        前端工程师进阶认证                 │
└──────────────────────────────────────────┘
```

---

## 🔑 核心数据模型

### 领域 (Domain)
```javascript
{
  id: 1,
  name: '计算机科学',
  slug: 'computer-science',
  icon: '💻',
  description: '软件工程、算法、系统设计等',
  questionCount: 2,
  categoryCount: 3
}
```

### 题目 (Question)
```javascript
{
  id: 1,
  domainId: 1,
  categoryId: 1,
  title: '实现深拷贝',
  difficulty: 'easy',
  metadata: {  // 专业字段
    languageRestrictions: ['JavaScript'],
    timeComplexity: 'O(n)'
  }
}
```

### 学习路径 (Learning Path)
```javascript
{
  id: 1,
  name: '前端工程师进阶路径',
  slug: 'frontend-advanced',
  domainId: 1,
  level: 'intermediate',
  modules: [
    {
      id: 1,
      name: 'JavaScript 核心概念',
      questionIds: [1],
      estimatedHours: 20,
      order: 1
    }
  ],
  certificate: {
    enabled: true,
    passingScore: 80,
    name: '前端工程师进阶认证'
  }
}
```

### 用户学习进度 (User Learning Path)
```javascript
{
  userId: 1,
  pathId: 1,
  enrolledAt: '2025-10-03T...',
  currentModuleId: 2,
  progress: 0.25,  // 25%
  completedModules: [1],
  totalScore: 85,
  status: 'in_progress'
}
```

---

## 💡 使用技巧

### 1. 体验完整学习流程

1. 访问 http://localhost:5175/learning-paths
2. 点击"前端工程师进阶路径"
3. 点击"立即报名"
4. 观察进度卡片出现
5. 点击模块1的"开始学习"
6. 完成题目后,进度自动更新为 25%
7. 模块2按钮解锁,可以继续学习

### 2. 测试动态表单

1. 访问 http://localhost:5175/admin/questions/new
2. 选择不同领域 (计算机、金融、医学、法律、管理)
3. 观察表单动态变化
4. 填写专业字段 (如计算机的编程语言限制、时间复杂度)
5. 保存题目

### 3. 测试领域筛选

1. 访问 http://localhost:5175/questions/domains
2. 选择"金融学"领域
3. 在题库页面,观察 metadata 字段显示市场细分、分析方法等
4. 返回领域选择页,选择"计算机科学"
5. 观察 metadata 字段变为编程语言、时间复杂度等

---

## 🐛 常见问题

### Q1: 后端服务器启动失败?

**A**: 检查端口 3001 是否被占用

```bash
# Windows
netstat -ano | findstr :3001

# 杀掉占用进程
taskkill /PID <PID> /F
```

### Q2: 前端启动失败?

**A**: 检查端口 5175 是否被占用,或运行:

```bash
npm install  # 重新安装依赖
npm run dev
```

### Q3: API 请求失败?

**A**: 确保:
1. 后端服务器已启动 (http://localhost:3001)
2. 前端代理配置正确 (vite.config.js)
3. CORS 已正确配置

### Q4: 测试脚本运行失败?

**A**: 确保后端服务器已启动,等待2秒后运行测试

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| `COMPLETE-IMPLEMENTATION-SUMMARY.md` | 完整实施总结 |
| `PHASE2-COMPLETE-SUMMARY.md` | Phase 2 详细总结 |
| `MULTI-DOMAIN-QUESTION-BANK.md` | Phase 1 详细总结 |
| `PHASE2-3-IMPLEMENTATION-GUIDE.md` | Phase 2&3 实施指南 |
| `QUICK-START-GUIDE.md` | 本文档 |

---

## 🚀 下一步开发 (Phase 3)

如果您想继续开发 Phase 3 高级功能:

### 1. 社区贡献系统
- 用户提交题目
- 专家审核流程
- 贡献者积分与徽章

### 2. 跨专业能力分析
- T型人才识别
- 技能雷达图
- 能力提升建议

### 3. AI 自动出题
- LLM API 集成
- 智能生成题目
- 质量评分与审核

详见: `PHASE2-3-IMPLEMENTATION-GUIDE.md`

---

## 📞 支持

**项目状态**: ✅ Phase 1 & 2 完成

**测试覆盖**: 100% (19/19)

**下一步**: 等待用户确认是否启动 Phase 3 开发

---

**快速启动指南版本**: v1.0
**最后更新**: 2025-10-03

🎉 享受学习之旅！
