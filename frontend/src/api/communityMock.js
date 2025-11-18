/**
 * Mock数据生成器 - 用于本地开发测试
 * 当后端 API 不可用时，使用此模拟数据
 */

import webpackViteTurbopackContent from '@/content/community/webpack-vite-turbopack.md?raw'

// 论坛板块定义
export const mockForums = [
  {
    id: 'forum-1',
    name: '前端技术',
    slug: 'frontend',
    description: '讨论 Vue、React、Angular 等前端框架和最佳实践',
    icon: '🌐',
    postCount: 45,
    active: true,
    category: 'development'
  },
  {
    id: 'forum-2',
    name: '后端开发',
    slug: 'backend',
    description: 'Node.js、Python、Java 等后端技术交流',
    icon: '⚙️',
    postCount: 38,
    active: true,
    category: 'development'
  },
  {
    id: 'forum-3',
    name: '数据库与存储',
    slug: 'database',
    description: 'MySQL、MongoDB、Redis 等数据库技术讨论',
    icon: '💾',
    postCount: 28,
    active: true,
    category: 'development'
  },
  {
    id: 'forum-4',
    name: '项目分享',
    slug: 'projects',
    description: '分享你的项目、获得反馈和协作机会',
    icon: '🚀',
    postCount: 32,
    active: true,
    category: 'community'
  },
  {
    id: 'forum-5',
    name: '职业发展',
    slug: 'career',
    description: '讨论技术职业发展、面试技巧、薪资待遇等',
    icon: '📈',
    postCount: 25,
    active: true,
    category: 'community'
  },
  {
    id: 'forum-6',
    name: '学习资源',
    slug: 'resources',
    description: '分享优质的学习资源、教程和书籍',
    icon: '📚',
    postCount: 42,
    active: true,
    category: 'learning'
  }
]

// 用户库
const users = [
  { userId: 'user1', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1' },
  { userId: 'user2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2' },
  { userId: 'user3', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3' },
  { userId: 'user4', name: '赵六', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4' },
  { userId: 'user5', name: '孙七', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5' },
  { userId: 'user6', name: '周八', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user6' },
  { userId: 'user7', name: '吴九', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user7' },
  { userId: 'user8', name: '郑十', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user8' },
  { userId: 'user9', name: '刘十一', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user9' },
  { userId: 'user10', name: '陈十二', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user10' },
  { userId: 'user11', name: '杨十三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user11' },
  { userId: 'user12', name: '黄十四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user12' }
]

const mockPosts = [
  // 前端技术板块
  {
    id: '1',
    title: '如何深入理解 Vue 3 的响应式系统？',
    content: '今天我学习了 Vue 3 的响应式原理，使用了 Proxy 和 Reflect 来实现数据的响应式追踪。让我分享一下核心概念和实现细节，包括 effect、track、trigger 等关键函数的工作流程...',
    author: users[0],
    forumSlug: 'frontend',
    tags: ['Vue3', '响应式', 'JavaScript'],
    likes: 15,
    commentCount: 3,
    viewCount: 120,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '2',
    title: 'React Hooks 最佳实践总结',
    content: '在实际项目中使用 React Hooks 有哪些最佳实践？我总结了以下几点：\n1. 遵循 Hooks 的使用规则\n2. 合理使用 useEffect\n3. 自定义 Hooks 的设计模式\n4. 性能优化技巧\n详细讨论每一点...',
    author: users[1],
    forumSlug: 'frontend',
    tags: ['React', 'Hooks', 'Best Practices'],
    likes: 28,
    commentCount: 5,
    viewCount: 250,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '3',
    title: '前端性能优化从入门到精通',
    content: '性能优化是前端开发的重要课题。本文涵盖以下内容：\n- 网络优化（CDN、HTTP2、资源压缩）\n- 渲染优化（重排重绘、虚拟滚动）\n- JavaScript 执行优化（代码分割、懒加载）\n- 内存管理（垃圾回收、内存泄漏检测）',
    author: users[2],
    forumSlug: 'frontend',
    tags: ['性能优化', '前端', '最佳实践'],
    likes: 42,
    commentCount: 8,
    viewCount: 380,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: false
  },
  {
    id: '4',
    title: 'TypeScript 高级特性详解',
    content: '让我们深入探讨 TypeScript 的高级特性，包括：\n- 泛型（Generics）和约束条件\n- 条件类型（Conditional Types）\n- 映射类型（Mapped Types）\n- 工具类型的实现原理\n附带实战代码示例...',
    author: users[3],
    forumSlug: 'frontend',
    tags: ['TypeScript', '类型系统', 'Advanced'],
    likes: 34,
    commentCount: 6,
    viewCount: 210,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '5',
    title: 'Webpack 5 构建优化终极指南',
    content: '分享我在大型项目中优化 Webpack 构建性能的经验：\n1. 使用 esbuild 加速构建\n2. 合理配置 splitChunks\n3. 动态导入和预加载\n4. 构建时间从 2 分钟优化到 20 秒的完整过程',
    author: users[4],
    forumSlug: 'frontend',
    tags: ['Webpack', '构建', '性能优化'],
    likes: 38,
    commentCount: 7,
    viewCount: 280,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: false
  },
  {
    id: '6',
    title: '微前端架构设计思路分享',
    content: '在多个团队开发的大型单页应用中，我们采用了微前端架构。本文介绍：\n- qiankun 框架的应用\n- 应用间的通信机制\n- 样式隔离和 JS 隔离\n- 实战中的踩坑和解决方案',
    author: users[5],
    forumSlug: 'frontend',
    tags: ['微前端', '架构', 'qiankun'],
    likes: 26,
    commentCount: 4,
    viewCount: 195,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },

  // 后端开发板块
  {
    id: '10',
    title: 'Node.js 服务器最佳实践',
    content: '构建高效稳定的 Node.js 服务器需要注意哪些问题？讨论：\n1. 错误处理和日志记录\n2. 性能监控和调试\n3. 并发控制和队列处理\n4. 内存泄漏检测\n5. 优雅关闭',
    author: users[5],
    forumSlug: 'backend',
    tags: ['Node.js', '后端', '最佳实践'],
    likes: 22,
    commentCount: 4,
    viewCount: 180,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '11',
    title: 'Express 中间件开发完全指南',
    content: '深入讲解如何在 Express 中开发自定义中间件：\n- 中间件的执行流程\n- 错误处理中间件\n- 异步中间件的正确写法\n- 性能优化技巧\n- 常见的中间件开发陷阱',
    author: users[6],
    forumSlug: 'backend',
    tags: ['Express', 'Middleware', 'Node.js'],
    likes: 19,
    commentCount: 3,
    viewCount: 145,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: false
  },
  {
    id: '12',
    title: '如何设计高可用的 API 接口',
    content: '分享设计可扩展、高可用的 RESTful API 的经验：\n- API 版本管理策略\n- 错误响应标准化\n- 速率限制和认证\n- 缓存策略\n- API 文档生成工具',
    author: users[7],
    forumSlug: 'backend',
    tags: ['API设计', '架构', 'RESTful'],
    likes: 31,
    commentCount: 6,
    viewCount: 215,
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '13',
    title: 'Python Flask 与 Django 框架对比',
    content: '经过多个项目实战，总结两个 Python 框架的优缺点：\n- 框架设计哲学的差异\n- 性能对比测试\n- 项目适用场景选择\n- 学习曲线对比\n- 社区生态对比',
    author: users[8],
    forumSlug: 'backend',
    tags: ['Python', 'Flask', 'Django'],
    likes: 25,
    commentCount: 5,
    viewCount: 175,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '14',
    title: 'Java 微服务架构实战经验',
    content: '介绍我们团队使用 Spring Boot 和 Spring Cloud 构建微服务系统的经验：\n- 服务拆分策略\n- 配置中心和服务注册\n- 分布式事务处理\n- API 网关设计\n- 容器化部署',
    author: users[9],
    forumSlug: 'backend',
    tags: ['Java', '微服务', 'Spring Cloud'],
    likes: 28,
    commentCount: 7,
    viewCount: 220,
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },

  // 数据库与存储板块
  {
    id: '20',
    title: 'MySQL 性能优化实战总结',
    content: '分享在高并发场景下优化 MySQL 的经验：\n- 索引设计原则\n- 慢查询日志分析\n- 查询优化技巧\n- 表分区和分库分表\n- 主从复制和读写分离\n- 备份和恢复策略',
    author: users[10],
    forumSlug: 'database',
    tags: ['MySQL', '性能优化', '数据库'],
    likes: 35,
    commentCount: 8,
    viewCount: 280,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: true
  },
  {
    id: '21',
    title: 'MongoDB 在大规模应用中的使用',
    content: '讨论在生产环境中使用 MongoDB 的最佳实践：\n- 文档设计原则\n- 索引优化和查询优化\n- 副本集配置\n- 分片集群架构\n- 备份恢复方案\n- 性能监控',
    author: users[11],
    forumSlug: 'database',
    tags: ['MongoDB', 'NoSQL', '分布式'],
    likes: 20,
    commentCount: 4,
    viewCount: 160,
    createdAt: new Date(Date.now() - 84 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '22',
    title: 'Redis 缓存策略详解',
    content: '深入讲解如何在实际项目中合理使用 Redis：\n- 数据结构选择\n- 缓存穿透、击穿、雪崩解决方案\n- 缓存更新策略\n- 分布式锁的实现\n- 高可用架构（哨兵、集群）\n- 监控和性能调优',
    author: users[0],
    forumSlug: 'database',
    tags: ['Redis', '缓存', '性能优化'],
    likes: 42,
    commentCount: 9,
    viewCount: 315,
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: true
  },
  {
    id: '23',
    title: 'PostgreSQL 与 MySQL 选型指南',
    content: '对比两个关系型数据库的特点和应用场景：\n- 功能特性对比\n- 性能测试数据\n- 扩展性和可靠性\n- 成本和运维考虑\n- 迁移经验分享',
    author: users[1],
    forumSlug: 'database',
    tags: ['PostgreSQL', 'MySQL', '数据库选型'],
    likes: 18,
    commentCount: 3,
    viewCount: 140,
    createdAt: new Date(Date.now() - 108 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },

  // 项目分享板块
  {
    id: '30',
    title: '我开发的开源项目分享：智能表单生成器',
    content: '经过 3 个月的开发和打磨，我发布了一个完整的开源项目。\n\n项目介绍：\n- 支持 JSON 配置化生成复杂表单\n- 集成 30+ 常用表单组件\n- 支持自定义验证规则\n- 响应式设计，移动端友好\n\n技术栈：Vue 3 + TypeScript + Vite\n\n项目地址：https://github.com/example/form-builder\n欢迎 Star 和 提交 Issue！',
    author: users[2],
    forumSlug: 'projects',
    tags: ['开源', '表单', 'Vue3'],
    likes: 45,
    commentCount: 12,
    viewCount: 380,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '31',
    title: '分享我的个人博客系统，欢迎参考',
    content: '利用业余时间开发的个人博客系统，已经运营 2 年。\n\n功能特性：\n- Markdown 文章编辑\n- 评论系统\n- 访客统计\n- SEO 优化\n- 全文搜索\n\n技术选型：Next.js + Prisma + PostgreSQL\n亮点：\n- 性能优化到 Lighthouse 98 分\n- 集成 AI 自动生成摘要\n- 支持社交分享\n\n博客地址：https://example-blog.com',
    author: users[3],
    forumSlug: 'projects',
    tags: ['博客', 'Next.js', '个人项目'],
    likes: 32,
    commentCount: 8,
    viewCount: 240,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '32',
    title: '团队内部协作工具开发总结',
    content: '我们团队自主开发的一个内部协作工具，已在公司内部推广使用 6 个月。\n\n解决的问题：\n- 项目进度跟踪\n- 团队文档管理\n- 代码评审流程\n- 知识库积累\n\n技术方案：\n前端：React + Ant Design\n后端：Node.js + Express + MongoDB\n部署：Docker + Kubernetes\n\n取得的成果：\n- 团队沟通效率提升 40%\n- 代码质量明显改善\n- 知识库文档增加 500 篇\n\n经验总结分享给大家！',
    author: users[4],
    forumSlug: 'projects',
    tags: ['协作工具', 'React', '团队项目'],
    likes: 28,
    commentCount: 6,
    viewCount: 200,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '33',
    title: '我的第一个全栈项目：在线教学平台',
    content: '作为学习全栈开发的总结项目，我开发了一个在线教学平台。\n\n核心功能：\n- 用户认证和权限管理\n- 课程管理和学生学习进度跟踪\n- 视频播放和评论\n- 作业提交和批改\n\n技术栈：\n前端：Vue 3 + Element Plus\n后端：Express + MySQL\n部署：Vercel + Render\n\n学到的东西：\n- 前后端分离开发流程\n- 数据库设计\n- 文件上传和处理\n- 实时通知\n\n项目地址和部署地址已放在资料中，欢迎访问和反馈！',
    author: users[5],
    forumSlug: 'projects',
    tags: ['全栈', '教学平台', '学习项目'],
    likes: 25,
    commentCount: 7,
    viewCount: 185,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },

  // 职业发展板块
  {
    id: '40',
    title: '面试被问的高频 JavaScript 题目总结',
    content: '整理了这一年面试过程中遇到的高频 JavaScript 题目，分享给大家。\n\n包含内容：\n1. 闭包和作用域链（5 道题）\n2. 原型链和继承（6 道题）\n3. 异步编程（Promise、async/await）（7 道题）\n4. 事件循环（8 道题）\n5. this 指向问题（4 道题）\n\n每道题都有详细的解答和扩展讨论。\n\n这套题目帮助我成功拿到了几个大厂 offer，希望对大家也有帮助！',
    author: users[6],
    forumSlug: 'career',
    tags: ['面试', 'JavaScript', '学习资料'],
    likes: 68,
    commentCount: 15,
    viewCount: 520,
    createdAt: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: true
  },
  {
    id: '41',
    title: '从小厂到大厂的职业发展经历分享',
    content: '我的职业发展历程：\n\n2018 年：应届毕业，入职小创业公司\n- 一人完成前端开发，学会了快速学习\n- 参与产品设计，了解了业务思维\n\n2020 年：跳槽到中等规模公司\n- 参与架构设计，提升了系统思维\n- 带领团队做技术改造，学会了团队管理\n\n2022 年：入职大厂\n- 参与核心业务开发\n- 完成了重要的性能优化项目\n- 积累了大规模系统的经验\n\n关键经验：\n- 不断学习新技术\n- 参与架构决策\n- 重视代码质量\n- 建立个人品牌\n\n期望和大家交流，共同成长！',
    author: users[7],
    forumSlug: 'career',
    tags: ['职业发展', '经验分享', '跳槽'],
    likes: 55,
    commentCount: 18,
    viewCount: 420,
    createdAt: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '42',
    title: '技术人如何进阶为技术管理者',
    content: '从技术专家到技术管理者的转变过程分享。\n\n面临的挑战：\n- 时间分配：如何平衡代码和管理工作\n- 心态调整：接受不再只做一线开发\n- 团队管理：激励和培养团队成员\n- 决策制定：面对更复杂的问题\n\n解决方案：\n- 制定清晰的团队 OKR\n- 定期进行 1 对 1 沟通\n- 建立技术评审制度\n- 投入时间培养新人\n\n心得体会：\n- 管理是一项新的技能，需要专门学习\n- 要保持对技术的热情，不能完全脱离一线\n- 团队的成长比个人成就更有意义\n\n欢迎讨论和建议！',
    author: users[8],
    forumSlug: 'career',
    tags: ['管理', '职业发展', '领导力'],
    likes: 42,
    commentCount: 11,
    viewCount: 310,
    createdAt: new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '43',
    title: '2024 前端薪资和市场行情分析',
    content: '基于我接触的 50+ 个候选人和市场数据的整理分析。\n\n一线城市行情：\n初级前端（0-2 年）：15-25k\n中级前端（3-5 年）：25-40k\n高级前端（5-8 年）：40-60k\n专家级（8+ 年）：60k+\n\n影响薪资的因素：\n- 公司规模和融资情况\n- 技术栈和是否掌握热门技术\n- 个人品牌和开源贡献\n- 面试表现和谈判技巧\n\n建议：\n- 不要只关注薪资，要看发展空间\n- 定期了解市场行情\n- 维护好人脉和个人品牌\n- 持续提升技术深度\n\n欢迎大家分享自己的薪资信息（匿名），一起了解市场现状！',
    author: users[9],
    forumSlug: 'career',
    tags: ['薪资', '求职', '市场分析'],
    likes: 78,
    commentCount: 22,
    viewCount: 680,
    createdAt: new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },

  // 学习资源板块
  {
    id: '50',
    title: '推荐 5 本必读的 JavaScript 经典书籍',
    content: '这 5 本书籍帮助我系统地理解了 JavaScript，强烈推荐给大家。\n\n1. 《你不知道的 JavaScript》系列\n   - 深度讲解 this、作用域、闭包等难点\n   - 对原型链的解释特别清晰\n   - 适合有一定基础的开发者\n\n2. 《JavaScript 高级程序设计》\n   - 全面系统的 JavaScript 教程\n   - 适合初学者到中级开发者\n   - 第四版更新了现代特性\n\n3. 《深入浅出 Node.js》\n   - 讲解 Node.js 原理\n   - 包含性能优化的实用内容\n   - 对服务端开发很有帮助\n\n4. 《算法导论》\n   - 虽然不是 JS 专著，但算法知识很重要\n   - 对准备大厂面试很有帮助\n\n5. 《代码整洁之道》\n   - 提升代码质量的经典著作\n   - 适合所有开发者阅读\n\n这些书都有电子版和纸质版，大家可以根据习惯选择。',
    author: users[10],
    forumSlug: 'resources',
    tags: ['书籍', '学习资源', 'JavaScript'],
    likes: 52,
    commentCount: 13,
    viewCount: 380,
    createdAt: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '51',
    title: '免费的高质量在线课程和教程汇总',
    content: '整理了一些免费或很便宜的高质量学习资源，包括视频课程和文字教程。\n\n前端学习：\n- freeCodeCamp（YouTube）：从 0 开始学习各种技术\n- MDN Web Docs：最权威的 Web 技术文档\n- 慕课网：中文视频课程，很多免费内容\n- Codecademy：交互式学习平台\n\n后端学习：\n- The Odin Project：全栈开发免费课程\n- Node.js 官方文档：非常详细\n- Django 和 Rails 官方教程：质量很高\n\n算法和数据结构：\n- LeetCode 官方教程\n- YouTube - MIT OpenCourseWare\n- GeeksforGeeks：图文并茂\n\n系统设计：\n- System Design Interview 系列视频\n- Designing Data-Intensive Applications（书）\n\n持续更新，欢迎大家补充推荐！',
    author: users[11],
    forumSlug: 'resources',
    tags: ['学习资源', '教程', '免费'],
    likes: 48,
    commentCount: 10,
    viewCount: 350,
    createdAt: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '52',
    title: '2024 年前端框架和技术栈选择指南',
    content: '对目前流行的前端框架和技术进行了深入对比和分析。\n\n框架选择：\nVue 3 vs React 18 vs Angular 17\n- 学习曲线\n- 开发效率\n- 社区生态\n- 长期维护\n\n构建工具：\nVite vs Webpack vs esbuild\n- 性能对比\n- 配置复杂度\n- 生态支持\n\n状态管理：\nPinia vs Redux vs MobX\n- API 设计\n- 学习成本\n- 性能影响\n\n测试框架：\nVitest vs Jest vs Cypress\n- 测试类型覆盖\n- 开发体验\n- 运行速度\n\n建议：\n- 没有完美的框架，只有最适合的选择\n- 考虑团队现状和项目需求\n- 定期评估和升级\n- 保持对新技术的学习',
    author: users[0],
    forumSlug: 'resources',
    tags: ['技术选型', '前端', '框架对比'],
    likes: 61,
    commentCount: 16,
    viewCount: 440,
    createdAt: new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: true
  }
]

/**
 * 根据条件过滤和排序帖子
 */
export function generateMockPosts(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'latest',
    search = '',
    tag = null,
    forumSlug = null
  } = params

  let filtered = [...mockPosts]

  // 板块过滤
  if (forumSlug) {
    filtered = filtered.filter(p => p.forumSlug === forumSlug)
  }

  // 搜索过滤
  if (search) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
    )
  }

  // 标签过滤
  if (tag) {
    filtered = filtered.filter(p => p.tags.includes(tag))
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return b.likes - a.likes
      case 'popular':
        return b.viewCount - a.viewCount
      case 'latest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  // 分页
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paged = filtered.slice(start, end)

  return {
    data: paged,
    total: filtered.length,
    page,
    pageSize,
    pages: Math.ceil(filtered.length / pageSize)
  }
}

/**
 * 生成论坛板块列表
 */
export function generateMockForums() {
  return {
    code: 0,
    data: mockForums,
    message: 'success'
  }
}

/**
 * 生成热门标签
 */
export function generateMockHotTags() {
  // 统计所有标签
  const tagMap = new Map()

  mockPosts.forEach(post => {
    post.tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
    })
  })

  // 转换为数组并排序
  const tags = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return {
    code: 0,
    data: tags,
    message: 'success'
  }
}

/**
 * 获取帖子详情（包含完整内容和评论）
 */
export function getPostDetailMock(postId) {
  const detailedMap = {
    '7': {
      title: '微服务架构设计与实践',
      forumSlug: 'backend',
      tags: ['微服务', '架构设计', '分布式'],
      content: `# 微服务架构设计与实践

从单体系统演进到微服务，看似是技术栈升级，本质上是组织结构和业务边界一起重塑的过程。设计不好，容易从单体地狱走进分布式地狱。

## 一、服务拆分的原则

设计服务边界时，可以重点关注：

- 是否围绕清晰的业务能力来拆分，而不是按技术层拆分  
- 同一个服务内部的数据是否高度内聚  
- 跨服务强一致场景是否可控  
- 团队边界和服务边界是否大致匹配

缺少这些考量，微服务很容易变成部署在不同机器上的一堆小单体。`
    },
    '8': {
      title: 'Node.js 性能调优实战',
      forumSlug: 'backend',
      tags: ['Node.js', '性能优化', '后端开发'],
      content: `# Node.js 性能调优实战

Node.js 的优势在于处理大量并发 IO，但如果对事件循环和线程池缺乏认识，很容易写出看起来异步、实际上阻塞的代码。

## 一、先弄清执行模型

在调优之前，需要先理解：

- 单线程主要负责执行 JavaScript 和调度回调  
- IO 操作交给操作系统或线程池，完成后再把回调放回事件循环队列  
- CPU 密集型代码会阻塞事件循环，导致所有请求排队

## 二、常见优化思路

- 避免在请求链路中使用同步文件操作  
- 对计算密集任务使用子进程或工作线程  
- 利用性能分析工具定位真正的热点函数  
- 合理设置连接池与复用策略`
    },
    '9': {
      title: '深入理解 JavaScript 事件循环机制',
      forumSlug: 'frontend',
      tags: ['JavaScript', '事件循环', '异步编程'],
      content: `# 深入理解 JavaScript 事件循环机制

事件循环是前端和 Node.js 中所有异步行为的基础。如果不了解它，就很难解释代码的真实执行顺序。

## 一、同步任务、宏任务和微任务

可以把一次完整的事件循环大致理解为：

1. 执行当前宏任务中的所有同步代码  
2. 清空本轮中产生的所有微任务队列  
3. 必要时触发界面渲染  
4. 进入下一轮循环`
    },
    '15': {
      title: 'REST API 设计最佳实践',
      forumSlug: 'backend',
      tags: ['API设计', 'REST', '后端开发'],
      content: `# REST API 设计最佳实践

一个好的 REST API 能够做到看接口名字就大概知道是做什么的，并且在演进过程中尽量保持兼容。

## 一、围绕资源建模

设计接口时，不要一开始就纠结路径，而是先想清楚：

- 系统中有哪些核心资源，例如用户、订单、文章等  
- 资源之间的从属和关联关系  
- 每个资源有哪些典型操作`
    },
    '16': {
      title: 'Web 安全防护指南',
      forumSlug: 'frontend',
      tags: ['安全', 'Web安全', 'XSS防护'],
      content: `# Web 安全防护指南

Web 应用面临的安全风险非常多样，但大部分问题都可以归结为对输入不可信和边界缺乏控制。

## 一、前端侧常见风险

- 跨站脚本攻击，通过注入脚本窃取用户信息  
- 跨站请求伪造，利用现有登录态发起恶意请求  
- 不安全的本地存储和错误使用浏览器接口`
    },
    '17': {
      title: '图论算法详解与应用',
      forumSlug: 'frontend',
      tags: ['算法', '图论', '高级技巧'],
      content: `# 图论算法详解与应用

图论看起来抽象，但在实际工程中处处可见：社交关系、推荐系统、路径规划和依赖分析都可以建模为图。

## 一、常见的图算法家族

- 深度优先遍历和广度优先遍历  
- 单源最短路算法，例如 Dijkstra  
- 最小生成树算法`
    },
    '18': {
      title: 'Python 异步编程 asyncio 完全指南',
      forumSlug: 'backend',
      tags: ['Python', '异步编程', 'asyncio'],
      content: `# Python 异步编程 asyncio 完全指南

在需要处理大量网络请求或 IO 操作时，asyncio 提供了一种高效且可控的并发方式。它的核心是事件循环和协程。

## 一、几个关键概念

- 协程函数，通过 async 关键字定义  
- await 表达式，用来挂起当前协程等待异步结果  
- 事件循环，负责调度协程和回调执行`
    },
    '19': {
      title: '分布式事务处理方案对比',
      forumSlug: 'backend',
      tags: ['分布式', '事务', '架构设计'],
      content: `# 分布式事务处理方案对比

当一次业务操作跨越多个服务或多个数据库时，仅依赖单机事务已经无法保证整体一致性。此时就需要分布式事务方案来兜底。

## 一、常见的几种思路

- 两阶段提交，追求强一致但对基础设施要求较高  
- TCC，将预留和确认逻辑显式抽出来交给业务方实现  
- 基于本地消息表或事务消息的最终一致性方案`
    },
    '24': {
      title: '全栈开发必知的 SQL 优化技巧',
      forumSlug: 'database',
      tags: ['SQL', '数据库', '性能优化'],
      content: `# 全栈开发必知的 SQL 优化技巧

很多接口变慢的根本原因在数据库层。即使作为前端或全栈开发，也有必要掌握一套基础的 SQL 优化思路。

## 一、合理使用索引

- 为高频查询条件字段建立合适的索引  
- 注意联合索引的顺序和最左前缀原则  
- 避免在索引列上进行计算和函数调用`
    }
  }

  const idStr = String(postId)

  const overrideContentMap = {
    '1': {
      content: `详细解析 Promise.all 和 Promise.race 的实现思路、并发行为以及常见面试变体，附带伪代码和注意事项，帮助你真正吃透 Promise 的状态流转机制。`
    },
    '2': {
      content: `从抽离业务逻辑、组织 composable，到结合 TypeScript 做类型推导，系统梳理 Vue3 Composition API 的最佳实践，并给出可复制的项目落地模板。`
    },
    '3': {
      content: `围绕“度量 → 分析瓶颈 → 有针对性优化 → 持续监控”这一闭环，从网络、渲染和脚本三个层面构建前端性能优化清单，并结合真实指标给出优化前后的对比。`
    },
    '4': {
      content: `通过可视化时间线和简化版源码，拆解 useState、useEffect、useMemo 等核心 Hook 的运行流程，并展示如何通过自定义 Hook 实现逻辑复用与工程化沉淀。`
    },
    '5': {
      content: `以反转链表、环检测、合并有序链表等高频题为主线，总结链表解题的指针操作模板和边界处理套路，配合多张示意图帮助你建立指针直觉。`
    },
    '6': {
      content: `结合实际业务场景，讲解泛型、条件类型、映射类型和工具类型的设计思路，展示如何用 TypeScript 在大型前端项目中构建可维护的“类型 API”。`
    },
    '10': {
      content: `从错误处理、日志规范、健康检查到优雅关闭与限流熔断，总结生产环境下构建高可用 Node.js 服务器的实战经验，并附部署与监控建议。`
    },
    '11': {
      content: `围绕 Express 中间件的执行链路，手把手实现日志、鉴权、错误捕获等常用中间件，讨论同步与异步中间件的写法差异以及常见踩坑点。`
    },
    '12': {
      content: `从资源建模、错误语义、限流与幂等，到缓存策略与版本管理，系统梳理高可用 RESTful API 的设计要点，并给出接口文档与协作流程的建议。`
    },
    '13': {
      content: `通过多个真实项目对比 Flask 与 Django 在开发体验、扩展性、性能和生态上的差异，给出不同体量与阶段下的框架选型建议。`
    },
    '14': {
      content: `基于 Spring Boot �?Spring Cloud 的微服务实践总结，涵盖服务拆分、配置中心、注册发现、链路追踪以及在容器环境中的部署经验。`
    },
    '20': {
      content: `从使用体验、生态成熟度、构建性能和迁移成本四个维度深入比较 Webpack、Vite 与 Turbopack，并结合不同团队和项目阶段给出选型建议。`
    },
    '21': {
      content: `通过爬楼梯、背包和编辑距离三类经典问题，拆解动态规划的“状态设计 + 转移方程”套路，帮助你在短时间内建立 DP 题目的通用思维框架。`
    },
    '22': {
      content: `以一个实际的组件库为例，从按模块规划组件、设计主题系统、搭建设计文档，到发布 npm 与版本管理，完整走一遍 Vue 组件库的落地流程。`
    },
    '23': {
      content: `给出一份可直接落地的 Code Review 检查清单，涵盖正确性、可读性、可维护性、安全与性能等维度，并讨论如何在团队内建立健康的评审文化。`
    }
  }

  if (detailedMap[idStr] && !mockPosts.find(p => String(p.id) === idStr)) {
    const custom = detailedMap[idStr]
    const author = custom.author || {
      userId: 'user-default',
      name: '社区作者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=recommend'
    }

    return {
      id: idStr,
      title: custom.title,
      content: custom.content,
      tags: custom.tags || [],
      likes: 0,
      viewCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      pinned: false,
      isPinned: false,
      author,
      userAvatar: author.avatar,
      username: author.name,
      comments: []
    }
  }

  const post = mockPosts.find(p => String(p.id) === String(postId))

  if (!post) {
    // 如果找不到，返回一个占位的帖子详情，避免触发额外的 API 请求
    return {
      id: String(postId),
      title: `示例帖子 #${postId}`,
      content: '该帖子暂无真实数据，当前显示的是本地模拟内容。',
      tags: [],
      likes: 0,
      viewCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      pinned: false,
      isPinned: false,
      author: { userId: 'user-default', name: '社区用户', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
      userAvatar: null,
      username: '社区用户',
      comments: []
    }
  }

  // 为帖子详情生成额外的数据
  const isBuildToolsPost = String(post.id) === '20'

  const content = isBuildToolsPost
    ? webpackViteTurbopackContent
    : post.content

  const title = isBuildToolsPost
    ? '前端构建工具对决：Webpack、Vite 与 Turbopack 全方位评测'
    : post.title

  const tags = isBuildToolsPost
    ? ['Webpack', 'Vite', 'Turbopack', '构建工具']
    : post.tags

  const forumSlug = isBuildToolsPost ? 'frontend' : post.forumSlug

  const author = isBuildToolsPost
    ? { ...post.author, name: post.author?.name || '构建工具专家' }
    : post.author

  const override = overrideContentMap[idStr]

  return {
    ...post,
    title,
    content: override && override.content ? override.content : content,
    tags,
    forumSlug,
    author,
    // 添加评论数据
    comments: [
      {
        id: 'comment-1',
        author: users[1],
        content: '这是一个很有价值的讨论，感谢分享！',
        likes: 3,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        floorNumber: 1
      },
      {
        id: 'comment-2',
        author: users[2],
        content: '完全同意，这个方案确实很实用。我们团队也正在使用类似的方案。',
        likes: 5,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        floorNumber: 2
      }
    ],
    // 添加详情页面需要的字段
    userAvatar: post.author?.avatar,
    username: post.author?.name,
    likeCount: post.likes || 0,
    viewCount: post.viewCount || 0,
    commentCount: post.commentCount || 0,
    isPinned: post.pinned || false
  }
}

export default mockPosts
