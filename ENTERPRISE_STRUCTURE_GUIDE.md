# 企业级项目结构整理方案

## 一、后端项目结构（Node.js - backend/）

### 标准三层架构

```
backend/
├── src/
│   ├── controllers/          # 控制层 - 处理HTTP请求
│   │   ├── userController.js
│   │   ├── questionController.js
│   │   ├── answerController.js
│   │   ├── interviewController.js
│   │   └── ...
│   │
│   ├── services/             # 业务逻辑层 - 处理业务逻辑
│   │   ├── userService.js
│   │   ├── questionService.js
│   │   ├── answerService.js
│   │   ├── interviewService.js
│   │   ├── difyService.js      # Dify AI集成
│   │   ├── redisService.js     # 缓存服务
│   │   └── ...
│   │
│   ├── models/               # 数据模型 - 数据库相关
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   ├── Interview.js
│   │   └── ...
│   │
│   ├── repositories/         # 数据访问层 - 数据库操作
│   │   ├── userRepository.js
│   │   ├── questionRepository.js
│   │   ├── answerRepository.js
│   │   └── ...
│   │
│   ├── routes/               # 路由定义
│   │   ├── userRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── answerRoutes.js
│   │   └── index.js
│   │
│   ├── middleware/           # 中间件 - 认证、日志等
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── ...
│   │
│   ├── utils/                # 工具函数
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── ...
│   │
│   ├── config/               # 配置文件
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── dify.js
│   │   └── ...
│   │
│   ├── websocket/            # WebSocket处理
│   │   ├── handlers.js
│   │   └── events.js
│   │
│   └── app.js                # 应用主文件
│
├── tests/                    # 测试文件
│   ├── unit/
│   ├── integration/
│   └── ...
│
├── package.json
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── Dockerfile
├── .dockerignore
└── .gitignore
```

---

## 二、后端项目结构（Java - backend-java/）

### 标准三层架构（Maven）

```
backend-java/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/interview/
│   │   │       ├── controller/          # 控制层
│   │   │       │   ├── UserController.java
│   │   │       │   ├── QuestionController.java
│   │   │       │   ├── AnswerController.java
│   │   │       │   └── InterviewController.java
│   │   │       │
│   │   │       ├── service/             # 业务逻辑层
│   │   │       │   ├── UserService.java
│   │   │       │   ├── QuestionService.java
│   │   │       │   ├── AnswerService.java
│   │   │       │   ├── InterviewService.java
│   │   │       │   └── impl/            # 实现类
│   │   │       │       ├── UserServiceImpl.java
│   │   │       │       ├── QuestionServiceImpl.java
│   │   │       │       └── ...
│   │   │       │
│   │   │       ├── mapper/              # 数据访问层（Mybatis）
│   │   │       │   ├── UserMapper.java
│   │   │       │   ├── QuestionMapper.java
│   │   │       │   ├── AnswerMapper.java
│   │   │       │   └── ...
│   │   │       │
│   │   │       ├── model/               # 数据模型
│   │   │       │   ├── entity/          # 数据库实体
│   │   │       │   │   ├── User.java
│   │   │       │   │   ├── Question.java
│   │   │       │   │   └── ...
│   │   │       │   └── dto/             # 数据传输对象
│   │   │       │       ├── UserDTO.java
│   │   │       │       └── ...
│   │   │       │
│   │   │       ├── util/                # 工具类
│   │   │       │   ├── Constants.java
│   │   │       │   ├── StringUtil.java
│   │   │       │   └── ...
│   │   │       │
│   │   │       ├── config/              # 配置类
│   │   │       │   ├── DatabaseConfig.java
│   │   │       │   ├── RedisConfig.java
│   │   │       │   └── ...
│   │   │       │
│   │   │       └── Application.java     # 主类
│   │   │
│   │   └── resources/
│   │       ├── application.yml          # 应用配置
│   │       ├── application-dev.yml      # 开发配置
│   │       ├── application-prod.yml     # 生产配置
│   │       ├── mapper/                  # Mybatis XML映射文件
│   │       │   ├── UserMapper.xml
│   │       │   ├── QuestionMapper.xml
│   │       │   └── ...
│   │       └── db/
│   │           └── migration/           # 数据库迁移脚本
│   │
│   └── test/
│       ├── java/
│       └── resources/
│
├── pom.xml
├── Dockerfile
├── .dockerignore
└── .gitignore
```

---

## 三、前端项目结构（Vue3 - frontend/）

### Vue3 标准开发规范

```
frontend/
├── src/
│   ├── components/           # 可复用组件
│   │   ├── common/          # 通用组件
│   │   │   ├── Header.vue
│   │   │   ├── Sidebar.vue
│   │   │   ├── Footer.vue
│   │   │   └── ...
│   │   │
│   │   ├── questions/       # 题库相关组件
│   │   │   ├── QuestionList.vue
│   │   │   ├── QuestionDetail.vue
│   │   │   └── ...
│   │   │
│   │   ├── interview/       # 面试相关组件
│   │   │   ├── InterviewRoom.vue
│   │   │   ├── ChatBox.vue
│   │   │   └── ...
│   │   │
│   │   ├── user/           # 用户相关组件
│   │   │   ├── UserProfile.vue
│   │   │   ├── Settings.vue
│   │   │   └── ...
│   │   │
│   │   └── ...
│   │
│   ├── views/                # 页面组件（路由对应）
│   │   ├── Home.vue
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── QuestionBank.vue
│   │   ├── Interview.vue
│   │   ├── UserCenter.vue
│   │   └── ...
│   │
│   ├── stores/               # Pinia 状态管理
│   │   ├── modules/
│   │   │   ├── user.js       # 用户状态
│   │   │   ├── interview.js  # 面试状态
│   │   │   ├── questions.js  # 题库状态
│   │   │   └── ...
│   │   └── index.js
│   │
│   ├── router/               # Vue Router 路由
│   │   ├── modules/          # 模块化路由
│   │   │   ├── userRoutes.js
│   │   │   ├── interviewRoutes.js
│   │   │   └── ...
│   │   └── index.js
│   │
│   ├── services/             # API 调用服务
│   │   ├── api/
│   │   │   ├── user.js       # 用户API
│   │   │   ├── questions.js  # 题库API
│   │   │   ├── interview.js  # 面试API
│   │   │   └── ...
│   │   ├── http.js           # HTTP客户端
│   │   └── websocket.js      # WebSocket服务
│   │
│   ├── utils/                # 工具函数
│   │   ├── common.js         # 通用工具
│   │   ├── validators.js     # 验证函数
│   │   ├── formatters.js     # 格式化函数
│   │   ├── storage.js        # 本地存储
│   │   └── ...
│   │
│   ├── styles/               # 全局样式
│   │   ├── variables.css     # CSS变量
│   │   ├── global.css        # 全局样式
│   │   ├── reset.css         # 重置样式
│   │   └── ...
│   │
│   ├── assets/               # 静态资源
│   │   ├── images/
│   │   ├── icons/
│   │   ├── fonts/
│   │   └── ...
│   │
│   ├── i18n/                 # 国际化
│   │   ├── locales/
│   │   │   ├── zh_CN.js
│   │   │   ├── en_US.js
│   │   │   └── ...
│   │   └── index.js
│   │
│   ├── composables/          # 组合式函数（Composition API）
│   │   ├── useAuth.js
│   │   ├── useWebSocket.js
│   │   ├── useQuestions.js
│   │   └── ...
│   │
│   ├── directives/           # 自定义指令
│   │   └── ...
│   │
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
│
├── public/                   # 公共资源
│   ├── favicon.ico
│   └── ...
│
├── tests/                    # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── vite.config.js            # Vite配置
├── vitest.config.js          # 测试配置（如使用Vitest）
├── package.json
├── Dockerfile
├── .dockerignore
└── .gitignore
```

---

## 四、命名规范

### Node.js/JavaScript
- **文件名**: camelCase (例: userController.js, userService.js)
- **文件夹**: camelCase (例: controllers/, services/, repositories/)
- **变量/函数**: camelCase (例: getUserList(), userData)
- **类**: PascalCase (例: UserService, DatabaseConfig)

### Java
- **文件名**: PascalCase (例: UserController.java, UserService.java)
- **包名**: 小写 (例: com.example.interview.controller)
- **类名**: PascalCase (例: UserController, UserService)
- **方法名**: camelCase (例: getUserList(), saveUser())
- **常量**: UPPER_SNAKE_CASE (例: MAX_SIZE, DEFAULT_TIMEOUT)

### Vue
- **组件文件**: PascalCase (例: UserProfile.vue, ChatBox.vue)
- **文件夹**: kebab-case (例: user-profile/, chat-box/)
- **变量/方法**: camelCase (例: userData, handleClick())
- **常量**: UPPER_SNAKE_CASE (例: MAX_LENGTH, API_TIMEOUT)

---

## 五、关键说明

### Node.js 后端三层架构
- **Controllers**: 直接处理HTTP请求，调用Service
- **Services**: 包含所有业务逻辑，调用Repository
- **Repositories**: 数据库操作，返回原始数据或模型
- **Models**: 数据库字段定义

### Java 后端三层架构
- **Controller**: 处理HTTP请求，调用Service
- **Service/ServiceImpl**: 业务逻辑处理
- **Mapper**: 数据库操作（使用Mybatis）
- **Model/Entity**: 数据库实体
- **Model/DTO**: 数据传输对象

### Vue3 前端规范
- **Views**: 整个页面，与路由一一对应
- **Components**: 可复用的UI组件，按功能分类
- **Services**: API调用和业务逻辑
- **Stores**: 全局状态管理（Pinia）
- **Router**: 路由定义和守卫
- **Utils**: 通用工具函数
- **Composables**: 可复用的逻辑（Composition API）

---

## 六、目录优先级（快速查找）

| 需要找什么 | 位置 |
|-----------|------|
| HTTP端点处理 | controllers/ 或 controller/ |
| 业务逻辑 | services/ 或 service/ |
| 数据操作 | repositories/ 或 mapper/ |
| 数据模型 | models/ 或 model/entity/ |
| API调用 | services/api/ 或 utils/ |
| 路由 | routes/ 或 router/ |
| 页面 | views/ |
| 可复用组件 | components/ |
| 状态管理 | stores/ |
| 工具函数 | utils/ 或 composables/ |

---

**建议**: 按照此结构进行项目重组，将会大大提高代码可维护性和团队协作效率。
