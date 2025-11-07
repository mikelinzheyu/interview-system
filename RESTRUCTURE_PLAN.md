# 三层架构整理方案 - 快速指南

## 快速对比：现在 vs 整理后

### Node.js 后端（backend/）

**现在的混乱状态：**
```
backend/
├── mock-server.js          (1个大文件，包含所有逻辑)
├── websocket-server.js
├── redis-client.js
├── controllers/            (空目录)
├── routes/                 (空目录)
├── models/                 (空目录)
├── middleware/             (空目录)
├── utils/                  (空目录)
└── src/                    (空目录)
```

**整理后的标准三层架构：**
```
backend/
├── src/
│   ├── controllers/        ← 所有HTTP请求处理
│   ├── services/           ← 所有业务逻辑
│   ├── repositories/       ← 数据库操作
│   ├── models/             ← 数据模型定义
│   ├── routes/             ← 路由配置
│   ├── middleware/         ← 认证、日志等
│   ├── utils/              ← 工具函数
│   ├── config/             ← 配置文件
│   ├── websocket/          ← WebSocket处理
│   └── app.js              ← 应用入口
├── tests/                  ← 测试文件
├── package.json
└── .env
```

---

## 当前问题分析

### backend（Node.js）
- ❌ 所有代码塞在 mock-server.js（单个大文件）
- ❌ Controllers/services/models 目录都是空的
- ❌ 代码不符合三层架构
- ✅ 需要拆分代码到不同层级

### backend-java（Java Spring Boot）
- ⚠️ 结构不完整
- ❌ controller/service/mapper 层级可能不清晰
- ✅ 需要按标准三层架构重新组织

### frontend（Vue3）
- ✅ 已有基本结构（src/, components/, views/等）
- ⚠️ 可能需要优化分类和组织

---

## 整理计划（三个步骤）

### 第1步：后端代码拆分（backend/）
需要将 mock-server.js 的代码拆分到：
```
src/
├── controllers/       ← 路由处理、请求验证
├── services/          ← 业务逻辑、调用Dify
├── repositories/      ← 数据库/Redis操作
├── models/            ← 数据模型定义
├── config/            ← 配置管理
├── middleware/        ← 认证、错误处理
└── utils/             ← 辅助函数
```

### 第2步：Java项目整理（backend-java/）
确保目录结构完整：
```
src/main/java/com/example/interview/
├── controller/        ← @RestController 注解类
├── service/           ← @Service 业务类
│   └── impl/          ← 实现类
├── mapper/            ← @Mapper 数据访问类
├── model/
│   ├── entity/        ← @Entity 实体类
│   └── dto/           ← DTO 传输对象
├── util/              ← 工具类
└── config/            ← 配置类
```

### 第3步：前端优化（frontend/）
确保组件和功能模块清晰分类：
```
src/
├── components/        ← 按功能分类（common/, questions/, interview/）
├── views/             ← 页面文件（对应路由）
├── stores/            ← Pinia 状态管理
├── services/api/      ← API调用
├── utils/             ← 工具函数
└── composables/       ← 可复用逻辑
```

---

## 实现建议

### 选项 A：自动化整理（推荐）
我可以帮你写脚本自动执行这个整理，但需要：
1. 清楚地知道代码应该怎么拆分
2. 确认备份已完成
3. 逐个模块重组

### 选项 B：手动整理（更安全）
1. 先阅读 ENTERPRISE_STRUCTURE_GUIDE.md
2. 逐个文件夹手动整理
3. 确保不破坏现有功能

---

## 关键问题

**我需要确认以下问题，才能帮你更好地整理：**

1. **backend（Node.js）的 mock-server.js 中：**
   - 有哪些路由处理函数？（应该放到 controllers/）
   - 有哪些业务逻辑？（应该放到 services/）
   - 有哪些数据库/Redis操作？（应该放到 repositories/）

2. **backend-java 项目：**
   - 是否已有基本的 controller/service/mapper 目录？
   - 还是需要从头创建这些目录？

3. **前端项目：**
   - components/ 目录有多少个文件？需要按功能分类吗？
   - stores/ 中的状态管理是否完整？

4. **优先级：**
   - 是先整理 Node.js 后端，还是所有项目一起整理？
   - 是否需要保留当前的运行功能不中断？

---

## 建议的行动方案

✅ **第一步：备份** - 确保有完整备份
✅ **第二步：分析** - 理解代码结构（尤其是 mock-server.js）
✅ **第三步：规划** - 确定哪些代码放在哪个层级
✅ **第四步：执行** - 逐步重组（按模块）
✅ **第五步：测试** - 确保所有功能正常

---

## 下一步

请告诉我：

1. **是否要我帮助自动整理？** 如果是，需要告诉我代码该怎么分层
2. **优先整理哪个项目？** backend 还是 frontend 还是都要？
3. **是否需要代码拆分帮助？** 比如从 mock-server.js 中提取某个功能到 service

选择你的方向，我会相应地帮助你完成项目结构整理！
