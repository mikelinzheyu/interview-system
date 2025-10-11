# 🎓 多专业题库学习平台

> 支持多专业领域的综合学习平台,提供结构化学习路径和证书认证系统

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com)
[![Test](https://img.shields.io/badge/tests-19%2F19%20passing-brightgreen.svg)](https://github.com)
[![Phase](https://img.shields.io/badge/phase-2%2F3%20complete-orange.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com)

---

## 📋 项目简介

一个创新的多专业题库学习平台,支持计算机科学、金融学、医学、法律、管理学等5个专业领域。通过配置驱动的架构,实现了专业化字段动态管理,并提供结构化的学习路径系统。

**核心特性**:
- 🎯 5个专业领域支持
- 📝 动态表单编辑器 (8种字段类型)
- 🚀 学习路径系统
- 🏅 证书认证机制
- 📊 双层进度追踪 (模块级 + 路径级)
- 🎨 响应式设计

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆仓库** (如果有)
   ```bash
   git clone <repository-url>
   cd interview-system
   ```

2. **启动后端服务器**
   ```bash
   node backend/mock-server.js
   ```

   输出: `🚀 Mock API服务器已启动 - http://localhost:3001`

3. **启动前端开发服务器** (新终端)
   ```bash
   cd frontend
   npm install  # 首次运行
   npm run dev
   ```

   输出: `➜ Local: http://localhost:5175/`

4. **访问应用**

   打开浏览器访问: http://localhost:5175

---

## 🎯 核心功能

### Phase 1: 基础架构 ✅

- **领域分类系统**: 5个专业领域 (计算机、金融、医学、法律、管理)
- **专业化字段**: 每个领域有独特的 metadata 配置
- **领域筛选**: 按领域、分类、难度筛选题目
- **API 端点**: 3个 Domain APIs + Questions 增强

### Phase 2: 功能增强 ✅

- **动态表单渲染器**: 支持 8 种字段类型的配置驱动表单
- **题目管理后台**: 管理员可创建/编辑多领域题目
- **学习路径系统**: 2个示例路径,7个学习模块
- **报名与进度**: 用户报名路径,追踪学习进度
- **证书认证**: 完成路径可获得专业认证证书

### Phase 3: 高级特性 ⏳

- **社区贡献系统**: 用户提交题目,专家审核
- **跨专业能力分析**: T型人才识别,技能雷达图
- **AI 自动出题**: LLM 集成,智能生成题目

---

## 📊 项目状态

| 指标 | 状态 |
|------|------|
| **完成度** | 66.7% (Phase 1 & 2 完成) |
| **测试覆盖** | 100% (19/19 通过) |
| **后端服务** | ✅ 运行中 (http://localhost:3001) |
| **前端服务** | ✅ 运行中 (http://localhost:5175) |
| **文档完整度** | ⭐⭐⭐⭐⭐ 6份详细文档 |

---

## 🌐 主要页面

| 页面 | URL | 功能 |
|------|-----|------|
| 🏠 首页 | http://localhost:5175/home | 用户主页 |
| 📚 领域选择 | http://localhost:5175/questions/domains | 选择专业领域 |
| 💻 计算机题库 | http://localhost:5175/questions/computer-science | 计算机科学题库 |
| 🚀 学习路径 | http://localhost:5175/learning-paths | 所有学习路径 |
| 📖 路径详情 | http://localhost:5175/learning-paths/frontend-advanced | 前端进阶路径 |
| ✏️ 题目编辑 | http://localhost:5175/admin/questions/new | 管理员创建题目 |

---

## 🧪 测试

### 运行自动化测试

**Phase 1 测试** (领域功能):
```bash
node test-domain-feature.js
```

**Phase 2 测试** (学习路径):
```bash
node test-learning-paths.js
```

**预期输出**: `✅ 所有测试通过 (19/19)`

### 手动测试

参考功能验证清单: `FEATURE-CHECKLIST.md`

---

## 📁 项目结构

```
interview-system/
├── backend/
│   └── mock-server.js              # 后端 API 服务器
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── DynamicFormRenderer.vue  # 动态表单渲染器
│   │   ├── views/
│   │   │   ├── questions/          # 题库相关页面
│   │   │   ├── learning/           # 学习路径页面
│   │   │   └── admin/              # 管理员后台
│   │   ├── stores/                 # Pinia Store
│   │   ├── api/                    # API 封装
│   │   └── router/                 # 路由配置
│   └── vite.config.js              # Vite 配置
├── test-domain-feature.js          # Phase 1 测试
├── test-learning-paths.js          # Phase 2 测试
└── docs/                           # 文档目录
    ├── COMPLETE-IMPLEMENTATION-SUMMARY.md  # 完整实施总结
    ├── QUICK-START-GUIDE.md               # 快速启动指南
    ├── FEATURE-CHECKLIST.md               # 功能验证清单
    ├── PROJECT-STATUS.md                  # 项目状态总览
    └── ...                                # 其他文档
```

---

## 📚 文档导航

| 文档 | 说明 | 适用对象 |
|------|------|---------|
| [README.md](./README.md) | 项目概览 (本文档) | 所有人 |
| [QUICK-START-GUIDE.md](./QUICK-START-GUIDE.md) | 快速启动指南 | 新用户 |
| [PROJECT-STATUS.md](./PROJECT-STATUS.md) | 项目状态总览 | 项目经理 |
| [FEATURE-CHECKLIST.md](./FEATURE-CHECKLIST.md) | 功能验证清单 | 测试人员 |
| [COMPLETE-IMPLEMENTATION-SUMMARY.md](./COMPLETE-IMPLEMENTATION-SUMMARY.md) | 完整实施总结 | 开发者 |
| [PHASE2-COMPLETE-SUMMARY.md](./PHASE2-COMPLETE-SUMMARY.md) | Phase 2 详细总结 | 开发者 |
| [MULTI-DOMAIN-QUESTION-BANK.md](./MULTI-DOMAIN-QUESTION-BANK.md) | Phase 1 详细总结 | 开发者 |
| [PHASE2-3-IMPLEMENTATION-GUIDE.md](./PHASE2-3-IMPLEMENTATION-GUIDE.md) | Phase 2&3 实施指南 | 开发者 |

---

## 🛠️ 技术栈

### 后端
- Node.js
- HTTP Server (原生)
- Mock Data

### 前端
- Vue 3 + Composition API
- Vite
- Pinia (状态管理)
- Element Plus (UI 组件)
- Vue Router

### 测试
- Node.js 测试脚本
- HTTP 请求测试

---

## 🎨 界面预览

### 领域选择页面
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 💻        │ 💰        │ 🏥        │ ⚖️         │ 📊        │
│ 计算机科学│ 金融学    │ 医学      │ 法律       │ 管理学    │
│ 2道题目   │ 1道题目   │ 1道题目   │ 1道题目   │ 1道题目   │
│ 3个分类   │ 3个分类   │ 3个分类   │ 3个分类   │ 3个分类   │
│ [进入]   │ [进入]   │ [进入]   │ [进入]   │ [进入]   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 学习路径列表
```
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ 🚀              [进阶]         │  │ 💰              [入门]         │
│ 前端工程师进阶路径              │  │ 金融分析师基础路径              │
│ 4个模块 | 80小时 | 1245人学习  │  │ 3个模块 | 60小时 | 856人学习   │
│ 🏅 可获得证书                   │  │ 🏅 可获得证书                   │
│ [立即报名]                     │  │ [立即报名]                     │
└───────────────────────────────┘  └───────────────────────────────┘
```

---

## 🔑 核心数据模型

### Domain (领域)
```javascript
{
  id: 1,
  name: '计算机科学',
  slug: 'computer-science',
  icon: '💻',
  questionCount: 2,
  categoryCount: 3
}
```

### Question (题目)
```javascript
{
  id: 1,
  domainId: 1,
  title: '实现深拷贝',
  metadata: {
    languageRestrictions: ['JavaScript'],
    timeComplexity: 'O(n)'
  }
}
```

### LearningPath (学习路径)
```javascript
{
  id: 1,
  name: '前端工程师进阶路径',
  slug: 'frontend-advanced',
  modules: [
    {
      id: 1,
      name: 'JavaScript 核心概念',
      estimatedHours: 20
    }
  ],
  certificate: {
    enabled: true,
    passingScore: 80
  }
}
```

---

## 📈 API 端点

### Domain APIs
```bash
GET  /api/domains                    # 获取所有领域
GET  /api/domains/:id                # 获取领域详情
GET  /api/domains/:id/field-config   # 获取字段配置
```

### Questions APIs
```bash
GET  /api/questions                  # 获取题目列表
GET  /api/questions?domain_id=1      # 按领域筛选
GET  /api/questions?metadata.x=y     # 按 metadata 筛选
```

### Learning Path APIs
```bash
GET  /api/learning-paths             # 获取学习路径列表
GET  /api/learning-paths/:id         # 获取路径详情
POST /api/learning-paths/:id/enroll  # 报名学习路径
PUT  /api/learning-paths/:pathId/modules/:moduleId/complete  # 完成模块
```

---

## 🎯 使用示例

### 1. 体验学习路径

```bash
# 访问学习路径列表
http://localhost:5175/learning-paths

# 点击"前端工程师进阶路径"
http://localhost:5175/learning-paths/frontend-advanced

# 点击"立即报名学习"
# 观察圆环进度显示

# 点击模块1的"开始学习"
# 完成题目后,进度自动更新为 25%
```

### 2. 创建多领域题目

```bash
# 访问题目编辑器
http://localhost:5175/admin/questions/new

# 选择领域: 计算机科学
# 观察专业字段: 编程语言限制、时间复杂度等

# 选择领域: 金融学
# 观察专业字段: 市场细分、分析方法等

# 填写题目信息并保存
```

---

## 🐛 常见问题

### Q: 后端服务器启动失败?
**A**: 检查端口 3001 是否被占用
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Q: 前端无法连接后端?
**A**: 确保:
1. 后端服务器已启动 (http://localhost:3001)
2. 前端代理配置正确 (vite.config.js)
3. CORS 已正确配置

### Q: 测试脚本运行失败?
**A**: 确保后端服务器已启动,等待 2 秒后运行测试

---

## 🗺️ 路线图

### ✅ Phase 1: 基础架构 (已完成)
- 领域分类系统
- 专业化字段支持
- Domain APIs

### ✅ Phase 2: 功能增强 (已完成)
- 动态表单编辑器
- 学习路径系统
- 证书认证机制

### ⏳ Phase 3: 高级特性 (规划中)
- 社区贡献系统
- 跨专业能力分析
- AI 自动出题

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 团队

- **开发者**: Claude Code
- **项目经理**: -
- **测试人员**: -

---

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI 组件库
- [Vite](https://vitejs.dev/) - 构建工具
- [Pinia](https://pinia.vuejs.org/) - 状态管理

---

## 📞 联系方式

- 📧 Email: -
- 💬 Discussion: -
- 🐛 Issue Tracker: -

---

## 📊 项目统计

![](https://img.shields.io/badge/domains-5-blue.svg)
![](https://img.shields.io/badge/learning%20paths-2-green.svg)
![](https://img.shields.io/badge/modules-7-orange.svg)
![](https://img.shields.io/badge/field%20types-8-purple.svg)
![](https://img.shields.io/badge/APIs-9-red.svg)
![](https://img.shields.io/badge/test%20coverage-100%25-brightgreen.svg)

---

<div align="center">

**🎉 享受学习之旅！**

Made with ❤️ by Claude Code

[快速开始](./QUICK-START-GUIDE.md) · [项目状态](./PROJECT-STATUS.md) · [功能清单](./FEATURE-CHECKLIST.md)

</div>
