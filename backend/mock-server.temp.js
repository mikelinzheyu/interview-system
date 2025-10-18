/**
 * Mock API服务器 - 用于前端测试
 * 模拟后端API响应
 */
const http = require('http')
const https = require('https')
const url = require('url')
const QRCode = require('qrcode')
const { initializeWebSocket } = require('./websocket-server')
const redisClient = require('./redis-client')
require('dotenv').config()

const PORT = process.env.MOCK_PORT || 3001

// ============ Dify API 配置 ============
const DIFY_CONFIG = {
  apiKey: process.env.DIFY_API_KEY || 'app-vZlc0w5Dio2gnrTkdlblcPXG',
  baseURL: process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1',
  workflowURL: process.env.DIFY_WORKFLOW_URL || 'https://udify.app/workflow/ZJIwyB7UMouf2H9V'
}

console.log('🔧 Dify 配置:', {
  apiKey: DIFY_CONFIG.apiKey ? DIFY_CONFIG.apiKey.substring(0, 10) + '...' : '未配置',
  baseURL: DIFY_CONFIG.baseURL
})

// Mock数据
const mockData = {
  // 健康检查
  health: {
    status: 'UP',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  },

  // 用户数据
  users: [
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      phone: '13800138000',
      phoneVerified: true,
      role: 'user',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      nickname: '测试用户',
      gender: 'male',
      birthday: '1990-01-01',
      signature: '这是一个测试用户',
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowStrangerMessage: true,
        shareLocation: false
      },
      notification: {
        systemNotification: true,
        messageNotification: true,
        commentNotification: true,
        emailNotification: false,
        smsNotification: false,
        soundEnabled: true,
        vibrationEnabled: true,
        dndEnabled: false,
        dndStartTime: '22:00',
        dndEndTime: '08:00'
      },
      preferences: {
        theme: 'light',
        primaryColor: '#409EFF',
        fontSize: 'medium',
        language: 'zh-CN'
      },
      twoFactorEnabled: false
    }
  ],

  // 短信验证码缓存 (模拟Redis)
  smsCodes: new Map(), // key: phone, value: { code, expires, sendCount }

  // 滑块验证码存储
  sliderCaptchas: new Map(), // key: token, value: { x, y, timestamp }

  // OAuth状态管理 (模拟Redis)
  oauthStates: new Map(), // key: state, value: { provider, createdAt, redirectUrl }

  // 模拟微信用户数据
  wechatUsers: new Map(), // key: openid, value: { openid, unionid, nickname, avatar }

  // 模拟QQ用户数据
  qqUsers: new Map(), // key: openid, value: { openid, nickname, figureurl }

  // 领域数据 (Domain - 最高层级分类)
  domains: [
    {
      id: 1,
      name: '计算机科学',
      slug: 'computer-science',
      icon: '💻',
      description: '软件工程、算法、系统设计等计算机相关技术',
      active: true,
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: '金融学',
      slug: 'finance',
      icon: '💰',
      description: '投资分析、风险管理、金融工程、财务会计',
      active: true,
      sortOrder: 2,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: '医学',
      slug: 'medicine',
      icon: '⚕️',
      description: '临床医学、诊断学、药理学、医学影像',
      active: true,
      sortOrder: 3,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 4,
      name: '法律',
      slug: 'law',
      icon: '⚖️',
      description: '民法、刑法、商法、诉讼程序法',
      active: true,
      sortOrder: 4,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 5,
      name: '管理学',
      slug: 'management',
      icon: '📊',
      description: '企业管理、人力资源、市场营销、战略管理',
      active: true,
      sortOrder: 5,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ],

  // 领域字段配置 (用于动态表单)
  domainFieldConfigs: {
    1: {  // 计算机科学
      fields: [
        {
          name: 'languageRestrictions',
          label: '编程语言限制',
          type: 'multi-select',
          options: ['JavaScript', 'Python', 'Java', 'Go', 'C++', 'Rust', 'TypeScript']
        },
        {
          name: 'timeComplexity',
          label: '时间复杂度',
          type: 'select',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)']
        },
        {
          name: 'spaceComplexity',
          label: '空间复杂度',
          type: 'select',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)']
        },
        {
          name: 'prerequisiteKnowledge',
          label: '前置知识',
          type: 'tags',
          placeholder: '如: 闭包、作用域、异步等'
        }
      ]
    },
    2: {  // 金融学
      fields: [
        {
          name: 'marketSegment',
          label: '市场类型',
          type: 'select',
          options: ['股票市场', '债券市场', '期货市场', '外汇市场', '加密货币']
        },
        {
          name: 'analysisMethod',
          label: '分析方法',
          type: 'multi-select',
          options: ['基本面分析', '技术分析', '量化分析', '风险评估']
        },
        {
          name: 'relevantRegulations',
          label: '相关法规',
          type: 'tags',
          placeholder: '如: 证券法、公司法等'
        }
      ]
    },
    3: {  // 医学
      fields: [
        {
          name: 'relatedSymptoms',
          label: '相关症状',
          type: 'tags',
          placeholder: '如: 发热、咳嗽、头痛等'
        },
        {
          name: 'diseaseTags',
          label: '疾病分类',
          type: 'multi-select',
          options: ['呼吸系统', '心血管系统', '消化系统', '神经系统', '内分泌系统', '免疫系统']
        },
        {
          name: 'diagnosticMethods',
          label: '诊断方法',
          type: 'multi-select',
          options: ['体格检查', '实验室检查', '影像学检查', '病理检查']
        }
      ]
    },
    4: {  // 法律
      fields: [
        {
          name: 'relevantStatutes',
          label: '相关法条',
          type: 'tags',
          placeholder: '如: 民法典第123条'
        },
        {
          name: 'caseStudyType',
          label: '案例类型',
          type: 'select',
          options: ['合同纠纷', '侵权责任', '物权纠纷', '知识产权', '刑事案件', '行政诉讼']
        },
        {
          name: 'legalPrinciples',
          label: '法律原则',
          type: 'tags',
          placeholder: '如: 公平原则、诚信原则等'
        }
      ]
    },
    5: {  // 管理学
      fields: [
        {
          name: 'managementFunction',
          label: '管理职能',
          type: 'multi-select',
          options: ['计划', '组织', '领导', '控制', '协调']
        },
        {
          name: 'industryContext',
          label: '行业背景',
          type: 'select',
          options: ['制造业', '服务业', '互联网', '金融', '零售', '医疗']
        },
        {
          name: 'managementTheory',
          label: '管理理论',
          type: 'tags',
          placeholder: '如: 泰勒科学管理、马斯洛需求理论等'
        }
      ]
    }
  },

  // 题库数据
  questionCategories: [
    {
      id: 1,
      name: '前端开发',
      domainId: 1,  // 关联到"计算机科学"
      parentId: null,
      level: 1,
      slug: 'frontend',
      description: '涵盖浏览器端核心知识与框架能力'
    },
    {
      id: 2,
      name: 'JavaScript 基础',
      domainId: 1,
      parentId: 1,
      level: 2,
      slug: 'javascript-core',
      description: '语法、作用域、异步等核心概念'
    },
    {
      id: 3,
      name: 'Vue 框架',
      domainId: 1,
      parentId: 1,
      level: 2,
      slug: 'vue',
      description: 'Vue.js 生态及工程化能力'
    },
    {
      id: 4,
      name: '后端开发',
      domainId: 1,
      parentId: null,
      level: 1,
      slug: 'backend',
      description: '后端框架、数据库与系统设计'
    },
    {
      id: 5,
      name: 'Java 核心',
      domainId: 1,
      parentId: 4,
      level: 2,
      slug: 'java-core',
      description: 'Java 基础、并发、JVM 调优'
    },
    {
      id: 6,
      name: '算法与数据结构',
      domainId: 1,
      parentId: null,
      level: 1,
      slug: 'algorithms',
      description: '面试常考算法题与复杂度分析'
    },
    {
      id: 101,
      name: '金融分析',
      domainId: 2,
      parentId: null,
      level: 1,
      slug: 'financial-analysis',
      description: '财务报表分析、投资分析、估值方法'
    },
    {
      id: 102,
      name: '风险管理',
      domainId: 2,
      parentId: null,
      level: 1,
      slug: 'risk-management',
      description: '市场风险、信用风险、操作风险评估'
    },
    {
      id: 201,
      name: '临床医学',
      domainId: 3,
      parentId: null,
      level: 1,
      slug: 'clinical-medicine',
      description: '内科、外科、儿科等临床诊疗'
    },
    {
      id: 202,
      name: '药理学',
      domainId: 3,
      parentId: null,
      level: 1,
      slug: 'pharmacology',
      description: '药物作用机制、药代动力学'
    },
    {
      id: 301,
      name: '民商法',
      domainId: 4,
      parentId: null,
      level: 1,
      slug: 'civil-law',
      description: '民法典、合同法、公司法、物权法'
    },
    {
      id: 302,
      name: '刑法',
      domainId: 4,
      parentId: null,
      level: 1,
      slug: 'criminal-law',
      description: '犯罪构成、量刑、刑罚执行'
    }
  ],

  questions: [
    {
      id: 1,
      title: '解释 JavaScript 闭包并给出应用示例',
      question: '解释 JavaScript 闭包的概念，并给出一个实际的应用场景说明闭包如何解决问题。',
      type: 'short_answer',
      difficulty: 'medium',
      difficultyScore: 0.6,
      domainId: 1,  // 计算机科学
      categoryId: 2,
      categoryPath: [1, 2],
      tags: ['JavaScript', '作用域', '闭包'],
      estimatedTime: 8,
      source: 'internal',
      metadata: {
        prerequisiteKnowledge: ['作用域', '函数', '变量生命周期'],
        languageRestrictions: ['JavaScript'],
        yearRelevance: 2024
      },
      prompt: '请使用自己的语言描述闭包的行为，并分享一个你在项目中使用闭包的案例。',
      answer: '闭包是指函数能够访问其词法作用域之外定义的变量。当一个函数返回另一个函数并在后者中引用外部变量时，就形成了闭包。常见场景包括创建私有变量、在事件处理器中保存状态、或实现函数柯里化。',
      explanation: '闭包依赖于 JavaScript 的词法作用域和函数是一等公民的特性。被返回的内部函数仍然保持对定义时环境中的变量引用，因此可以跨作用域访问。',
      hints: [
        '思考函数作为返回值或参数传递时的变量访问能力',
        '考虑计数器、事件处理器等需要记住上下文的场景'
      ],
      references: [
        'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures',
        'https://javascript.info/closure'
      ],
      stats: {
        attempts: 42,
        correctCount: 18,
        averageScore: 0.66,
        likeCount: 9,
        viewCount: 128
      },
      createdAt: '2024-08-12T09:00:00Z',
      updatedAt: '2024-09-20T10:30:00Z'
    },
    {
      id: 2,
      title: '判断以下关于 Vue 响应式系统的描述是否正确',
      question: '以下哪些选项准确描述了 Vue 3 的响应式系统实现？',
      type: 'multiple_choice',
      difficulty: 'medium',
      difficultyScore: 0.55,
      domainId: 1,
      categoryId: 3,
      categoryPath: [1, 3],
      tags: ['Vue', '响应式', 'Proxy'],
      estimatedTime: 6,
      source: 'internal',
      metadata: {
        prerequisiteKnowledge: ['JavaScript', 'Vue基础', 'ES6 Proxy'],
        languageRestrictions: ['JavaScript'],
        yearRelevance: 2024
      },
      options: [
        { id: 'A', text: 'Vue 3 使用 Proxy 替代了 Object.defineProperty 实现响应式。', isCorrect: true },
        { id: 'B', text: '响应式系统通过依赖收集和触发更新来完成视图刷新。', isCorrect: true },
        { id: 'C', text: '只要修改对象的任意属性，Vue 就能自动追踪而不需要额外的 API。', isCorrect: false },
        { id: 'D', text: 'Vue 3 中的 ref 基于 Object.defineProperty 实现 getter/setter。', isCorrect: false }
      ],
      correctOptions: ['A', 'B'],
      explanation: 'Vue 3 使用 Proxy 避免了旧版本在属性新增/删除时的限制，同时依赖收集与触发机制依旧是响应式核心。对于普通对象属性，仍需确保在响应式上下文中声明；ref 借助 Proxy 包装了 value。',
      hints: [
        '回顾 Vue 2 与 Vue 3 响应式实现的差异',
        '注意响应式系统需要在创建时声明依赖'
      ],
      stats: {
        attempts: 57,
        correctCount: 31,
        averageScore: 0.72,
        likeCount: 12,
        viewCount: 96
      },
      createdAt: '2024-07-01T12:00:00Z',
      updatedAt: '2024-09-10T13:45:00Z'
    },
    {
      id: 3,
      title: '线程池核心参数的调优思路',
      question: '在 Java 项目中如何根据业务特点选择合适的线程池参数（corePoolSize、maximumPoolSize、queueCapacity）？请结合 CPU 密集型与 IO 密集型场景分别说明。',
      type: 'short_answer',
      difficulty: 'hard',
      difficultyScore: 0.78,
      domainId: 1,
      categoryId: 5,
      categoryPath: [4, 5],
      tags: ['Java', '并发', '线程池'],
      estimatedTime: 10,
      source: 'community',
      metadata: {
        prerequisiteKnowledge: ['Java并发', '线程', 'JVM'],
        languageRestrictions: ['Java'],
        yearRelevance: 2024
      },
      answer: '核心线程数应依据 CPU 核心数与任务类型决定。CPU 密集型任务建议 core≈CPU 核心数，maximum 适当加 1-2，队列使用有界队列防止 OOM。IO 密集型因线程大部分时间阻塞，core 可以为 CPU 核数的 2-4 倍，maximum 再乘以阻塞系数，队列可适当放大。还需结合任务执行时间、超时策略、拒绝策略进行配置。',
      explanation: '线程池调优的关键在于了解任务执行特性：CPU 密集型需要避免过度上下文切换；IO 密集型需要更多线程掩盖等待时间。同时监控平均响应时间、队列堆积、CPU 利用率。',
      stats: {
        attempts: 24,
        correctCount: 9,
        averageScore: 0.58,
        likeCount: 6,
        viewCount: 71
      },
      createdAt: '2024-06-15T15:30:00Z',
      updatedAt: '2024-09-05T08:20:00Z'
    },
    {
      id: 4,
      title: '在数组中查找两数之和',
      question: '给定整数数组 nums 和目标值 target，请返回数组中两个数的索引，使它们的和等于 target。假设每种输入只会对应一个答案，且同一个元素不能使用两次。',
      type: 'coding',
      difficulty: 'easy',
      difficultyScore: 0.4,
      domainId: 1,
      categoryId: 6,
      categoryPath: [6],
      tags: ['算法', '哈希表', '数组'],
      estimatedTime: 12,
      source: 'leetcode',
      metadata: {
        prerequisiteKnowledge: ['数组', '哈希表'],
        languageRestrictions: ['JavaScript', 'Python', 'Java'],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        yearRelevance: 2024
      },
      starterCode: `function twoSum(nums, target) {
  // TODO: 在此处编写代码
}`,
      testCases: [
        { input: 'twoSum([2,7,11,15], 9)', expectedOutput: '[0,1]' },
        { input: 'twoSum([3,2,4], 6)', expectedOutput: '[1,2]' }
      ],
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9'
      ],
      explanation: '使用哈希表存储已经遍历过的数字及其索引，时间复杂度 O(n)。',
      stats: {
        attempts: 63,
        correctCount: 48,
        averageScore: 0.81,
        likeCount: 22,
        viewCount: 152
      },
      createdAt: '2024-05-02T08:15:00Z',
      updatedAt: '2024-09-18T09:00:00Z'
    },
    {
      id: 100,
      title: '股票估值方法：市盈率与市净率的应用',
      question: '请解释市盈率(P/E)和市净率(P/B)在股票估值中的应用场景，并说明在什么情况下应该优先使用其中一种指标。',
      type: 'short_answer',
      difficulty: 'medium',
      difficultyScore: 0.62,
      domainId: 2,  // 金融学
      categoryId: 101,
      categoryPath: [101],
      tags: ['股票估值', '市盈率', '市净率', '投资分析'],
      estimatedTime: 10,
      source: 'internal',
      metadata: {
        marketSegment: '股票市场',
        analysisMethod: ['基本面分析'],
        relevantRegulations: ['证券法']
      },
      answer: 'P/E适用于盈利稳定的成熟企业，反映投资者为每元盈利愿意支付的价格。P/B更适合资产密集型行业(如银行、地产)，衡量市值与净资产的关系。对于高成长性企业，P/E更常用;对于周期性或亏损企业，P/B更有参考价值。',
      explanation: '不同估值指标适用场景不同，需结合行业特性、企业生命周期、盈利能力等因素综合判断。',
      stats: {
        attempts: 32,
        correctCount: 18,
        averageScore: 0.68,
        likeCount: 8,
        viewCount: 95
      },
      createdAt: '2024-08-01T10:00:00Z',
      updatedAt: '2024-09-15T14:30:00Z'
    },
    {
      id: 101,
      title: '呼吸系统疾病诊断：肺炎的鉴别',
      question: '患者出现发热、咳嗽、胸痛症状，胸片显示肺部阴影。请列出需要鉴别的常见疾病，并说明主要的鉴别要点。',
      type: 'short_answer',
      difficulty: 'hard',
      difficultyScore: 0.75,
      domainId: 3,  // 医学
      categoryId: 201,
      categoryPath: [201],
      tags: ['呼吸系统', '肺炎', '鉴别诊断'],
      estimatedTime: 15,
      source: 'internal',
      metadata: {
        relatedSymptoms: ['发热', '咳嗽', '胸痛'],
        diseaseTags: ['呼吸系统'],
        diagnosticMethods: ['体格检查', '实验室检查', '影像学检查']
      },
      answer: '需鉴别：1)细菌性肺炎(发热、脓痰、WBC升高) 2)病毒性肺炎(干咳、间质性改变) 3)肺结核(盗汗、咯血、PPD阳性) 4)肺癌(痰中带血、消瘦、CT示肿块) 5)肺栓塞(突发胸痛、呼吸困难、D-二聚体升高)。关键是结合病史、实验室检查(血常规、CRP、痰培养)、影像学特点综合判断。',
      explanation: '呼吸系统疾病诊断需要系统性思维，从症状、体征、实验室检查、影像学表现多维度分析。',
      stats: {
        attempts: 15,
        correctCount: 6,
        averageScore: 0.58,
        likeCount: 12,
        viewCount: 48
      },
      createdAt: '2024-07-15T09:30:00Z',
      updatedAt: '2024-09-10T11:20:00Z'
    },
    {
      id: 102,
      title: '合同法案例：违约责任的认定',
      question: '甲公司与乙公司签订设备采购合同，约定30日内交货。乙公司因供应商延迟，45日后才交货。甲公司要求解除合同并索赔损失。请分析：1)乙公司是否构成违约？2)甲公司能否解除合同？3)如何确定赔偿范围？',
      type: 'short_answer',
      difficulty: 'hard',
      difficultyScore: 0.72,
      domainId: 4,  // 法律
      categoryId: 301,
      categoryPath: [301],
      tags: ['合同法', '违约责任', '案例分析'],
      estimatedTime: 20,
      source: 'internal',
      metadata: {
        relevantStatutes: ['民法典第577条', '民法典第563条', '民法典第584条'],
        caseStudyType: '合同纠纷',
        legalPrinciples: ['诚信原则', '过错责任原则']
      },
      answer: '1)构成违约。乙公司未按约定期限交货，已构成违约(民法典第577条)。2)能否解除需看迟延是否导致合同目的无法实现(第563条)。若15日迟延未严重影响甲公司使用，不得解除；若影响重大项目导致损失，可解除。3)赔偿范围：直接损失+可预见的间接损失(第584条)，需甲公司举证。但乙公司若能证明因不可抗力(供应商问题不属于)可减免责任。',
      explanation: '合同违约责任分析需结合具体情形、违约严重程度、合同目的、损失因果关系等因素综合判断。',
      stats: {
        attempts: 18,
        correctCount: 7,
        averageScore: 0.55,
        likeCount: 15,
        viewCount: 62
      },
      createdAt: '2024-06-20T13:00:00Z',
      updatedAt: '2024-09-05T16:45:00Z'
    }
  ],

  questionPracticeRecords: [],

  // 学习路径数据
  learningPaths: [
    {
      id: 1,
      name: '前端工程师进阶路径',
      slug: 'frontend-advanced',
      domainId: 1,
      description: '从JavaScript基础到Vue/React框架,系统掌握前端核心技能',
      level: 'intermediate',
      estimatedHours: 80,
      icon: '🚀',
      cover: '/assets/learning-paths/frontend.jpg',
      modules: [
        {
          id: 1,
          name: 'JavaScript 核心概念',
          description: '深入理解作用域、闭包、异步编程',
          questionIds: [1],
          estimatedHours: 20,
          order: 1
        },
        {
          id: 2,
          name: 'Vue 3 进阶',
          description: 'Composition API、响应式原理、性能优化',
          questionIds: [2],
          estimatedHours: 30,
          order: 2
        },
        {
          id: 3,
          name: '前端工程化',
          description: 'Webpack、Vite、CI/CD流程',
          questionIds: [],
          estimatedHours: 15,
          order: 3
        },
        {
          id: 4,
          name: '算法与数据结构',
          description: '常见算法题解题思路',
          questionIds: [4],
          estimatedHours: 15,
          order: 4
        }
      ],
      certificate: {
        enabled: true,
        passingScore: 80,
        name: '前端工程师进阶认证'
      },
      stats: {
        enrolledCount: 1245,
        completedCount: 387,
        averageScore: 82.5
      },
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-09-20T00:00:00Z'
    },
    {
      id: 2,
      name: '金融分析师基础路径',
      slug: 'finance-fundamentals',
      domainId: 2,
      description: '掌握股票估值、财务报表分析等核心技能',
      level: 'beginner',
      estimatedHours: 60,
      icon: '💼',
      cover: '/assets/learning-paths/finance.jpg',
      modules: [
        {
          id: 1,
          name: '股票估值方法',
          description: 'P/E、P/B、DCF等估值模型',
          questionIds: [100],
          estimatedHours: 20,
          order: 1
        },
        {
          id: 2,
          name: '财务报表分析',
          description: '三大报表解读与分析',
          questionIds: [],
          estimatedHours: 25,
          order: 2
        },
        {
          id: 3,
          name: '风险管理基础',
          description: '投资组合理论、风险评估',
          questionIds: [],
          estimatedHours: 15,
          order: 3
        }
      ],
      certificate: {
        enabled: true,
        passingScore: 75,
        name: '金融分析基础认证'
      },
      stats: {
        enrolledCount: 856,
        completedCount: 243,
        averageScore: 78.3
      },
      createdAt: '2024-07-01T00:00:00Z',
      updatedAt: '2024-09-15T00:00:00Z'
    }
  ],

  // 用户学习路径进度
  userLearningPaths: [
    {
      userId: 1,
      pathId: 1,
      enrolledAt: '2024-08-01T00:00:00Z',
      currentModuleId: 2,
      progress: 0.5,
      completedModules: [1],
      totalScore: 85,
      status: 'in_progress'
    }
  ],

  // ========== Phase 3.1: 社区贡献系统 ==========

  // 题目提交记录
  questionSubmissions: [
    {
      id: 1,
      questionId: null,  // 审核通过后关联到 Question
      contributorId: 1,
      domainId: 1,
      categoryId: 1,

      // 题目内容
      title: '实现一个LRU缓存',
      content: '请实现一个 LRU (Least Recently Used) 缓存机制。要求实现 get 和 put 方法,时间复杂度为 O(1)。',
      difficulty: 'medium',
      tags: ['算法', '缓存', '数据结构'],
      hints: ['考虑使用哈希表和双向链表', '哈希表用于快速查找,双向链表用于维护顺序'],
      metadata: {
        languageRestrictions: ['JavaScript', 'Python'],
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(n)'
      },

      // 选项和答案
      options: [
        { id: 'A', text: '使用数组实现' },
        { id: 'B', text: '使用哈希表 + 双向链表' },
        { id: 'C', text: '使用单链表' },
        { id: 'D', text: '使用栈' }
      ],
      correctAnswer: 'B',
      explanation: 'LRU缓存需要O(1)时间复杂度的get和put操作。哈希表可以实现O(1)查找,双向链表可以实现O(1)的插入和删除。数组、单链表和栈都无法同时满足O(1)的要求。',

      // 审核状态
      status: 'pending',  // pending | under_review | approved | rejected | needs_revision
      submittedAt: '2024-09-20T10:30:00Z',
      reviewedAt: null,
      reviewerId: null,
      reviewComment: '',

      // 修订历史
      revisionCount: 0,
      previousVersions: []
    },
    {
      id: 2,
      questionId: 102,  // 已通过并创建题目
      contributorId: 1,
      domainId: 2,
      categoryId: 6,

      title: '股票估值方法对比',
      content: '以下哪种估值方法最适合用于成熟期、盈利稳定的公司？',
      difficulty: 'easy',
      tags: ['估值', '财务分析'],
      hints: ['考虑现金流的稳定性'],
      metadata: {
        marketSegment: '股票市场',
        analysisMethod: ['基本面分析'],
        relevantRegulations: ['证券法']
      },

      options: [
        { id: 'A', text: 'DCF模型' },
        { id: 'B', text: 'P/E估值' },
        { id: 'C', text: 'P/B估值' },
        { id: 'D', text: 'EV/EBITDA' }
      ],
      correctAnswer: 'A',
      explanation: 'DCF (Discounted Cash Flow) 现金流折现模型最适合盈利稳定、现金流可预测的成熟公司。',

      status: 'approved',
      submittedAt: '2024-09-18T14:20:00Z',
      reviewedAt: '2024-09-19T09:15:00Z',
      reviewerId: 2,
      reviewComment: '题目质量很高，建议通过',

      revisionCount: 0,
      previousVersions: []
    },
    {
      id: 3,
      questionId: null,
      contributorId: 3,
      domainId: 1,
      categoryId: 2,

      title: 'React Hooks 使用场景',
      content: '在 React 函数组件中,以下哪种情况最适合使用 useCallback hook？',
      difficulty: 'medium',
      tags: ['React', 'Hooks', '性能优化'],
      hints: [],
      metadata: {
        languageRestrictions: ['JavaScript'],
        frameworkVersion: 'React 18'
      },

      options: [
        { id: 'A', text: '所有函数都应该用 useCallback 包裹' },
        { id: 'B', text: '当函数作为 props 传递给使用 React.memo 的子组件时' },
        { id: 'C', text: '只在类组件中使用' },
        { id: 'D', text: '从不使用' }
      ],
      correctAnswer: 'B',
      explanation: 'useCallback 主要用于优化性能,当函数作为 props 传递给使用 React.memo 的子组件时,可以避免不必要的重新渲染。',

      status: 'needs_revision',
      submittedAt: '2024-09-22T16:40:00Z',
      reviewedAt: '2024-09-23T10:00:00Z',
      reviewerId: 2,
      reviewComment: '建议增加更多提示信息,选项A和D的表述可以更专业一些',

      revisionCount: 0,
      previousVersions: []
    }
  ],

  // 贡献者资料
  contributorProfiles: [
    {
      userId: 1,

      // 贡献统计
      stats: {
        totalSubmissions: 25,
        approvedCount: 18,
        rejectedCount: 3,
        pendingCount: 4,
        approvalRate: 0.72,  // 72%
        totalPoints: 185,
        rank: 12
      },

      // 徽章
      badges: [
        {
          id: 'first_contribution',
          name: '首次贡献',
          icon: '🌟',
          earnedAt: '2024-08-01T10:00:00Z',
          description: '提交第一道题目'
        },
        {
          id: 'quality_contributor',
          name: '优质贡献者',
          icon: '⭐',
          earnedAt: '2024-08-15T14:30:00Z',
          description: '审核通过率达到70%以上'
        },
        {
          id: 'ten_approved',
          name: '十全十美',
          icon: '🏅',
          earnedAt: '2024-08-20T09:00:00Z',
          description: '累计通过10道题目'
        }
      ],

      // 专长领域
      expertise: [
        {
          domainId: 1,
          domainName: '计算机科学',
          contributionCount: 15,
          approvalRate: 0.80,
          level: 'expert'  // beginner | intermediate | advanced | expert
        },
        {
          domainId: 2,
          domainName: '金融学',
          contributionCount: 10,
          approvalRate: 0.60,
          level: 'intermediate'
        }
      ],

      // 最近活动
      recentActivity: [
        {
          type: 'submit',
          submissionId: 1,
          timestamp: '2024-09-20T10:30:00Z',
          title: '实现一个LRU缓存'
        },
        {
          type: 'approved',
          submissionId: 2,
          questionId: 102,
          timestamp: '2024-09-19T09:15:00Z',
          title: '股票估值方法对比'
        }
      ]
    },
    {
      userId: 3,
      stats: {
        totalSubmissions: 8,
        approvedCount: 5,
        rejectedCount: 1,
        pendingCount: 2,
        approvalRate: 0.625,
        totalPoints: 56,
        rank: 45
      },
      badges: [
        {
          id: 'first_contribution',
          name: '首次贡献',
          icon: '🌟',
          earnedAt: '2024-09-01T11:20:00Z',
          description: '提交第一道题目'
        }
      ],
      expertise: [
        {
          domainId: 1,
          domainName: '计算机科学',
          contributionCount: 8,
          approvalRate: 0.625,
          level: 'intermediate'
        }
      ],
      recentActivity: []
    }
  ],

  // 审核队列
  reviewQueue: [
    {
      id: 1,
      submissionId: 1,
      reviewerId: null,  // 未分配
      assignedAt: null,
      status: 'pending',  // pending | in_progress | completed
      priority: 'normal'  // low | normal | high
    }
  ],

  // 徽章定义
  badgeDefinitions: [
    {
      id: 'first_contribution',
      name: '首次贡献',
      icon: '🌟',
      description: '提交第一道题目',
      requirement: 'totalSubmissions >= 1',
      points: 5
    },
    {
      id: 'quality_contributor',
      name: '优质贡献者',
      icon: '⭐',
      description: '审核通过率达到70%以上且至少通过5道题',
      requirement: 'approvalRate >= 0.7 && approvedCount >= 5',
      points: 20
    },
    {
      id: 'ten_approved',
      name: '十全十美',
      icon: '🏅',
      description: '累计通过10道题目',
      requirement: 'approvedCount >= 10',
      points: 30
    },
    {
      id: 'prolific_contributor',
      name: '多产贡献者',
      icon: '🚀',
      description: '累计提交50道题目',
      requirement: 'totalSubmissions >= 50',
      points: 50
    },
    {
      id: 'domain_expert',
      name: '领域专家',
      icon: '👑',
      description: '在单个领域通过30道题目',
      requirement: 'domainApprovedCount >= 30',
      points: 100
    },
    {
      id: 'perfect_score',
      name: '完美主义者',
      icon: '💯',
      description: '审核通过率达到100%且至少通过10道题',
      requirement: 'approvalRate === 1.0 && approvedCount >= 10',
      points: 80
    }
  ],

  // ========== Phase 3.2: 跨专业能力分析 ==========

  // 用户能力画像
  userAbilityProfiles: [
    {
      userId: 1,

      // 主攻领域
      primaryDomain: {
        domainId: 1,
        domainName: '计算机科学',
        score: 850,
        level: 'advanced',
        percentile: 0.85  // 超过85%的用户
      },

      // 各领域得分
      domainScores: {
        1: {
          domainId: 1,
          domainName: '计算机科学',
          totalScore: 850,
          questionsAttempted: 120,
          questionsCorrect: 95,
          accuracy: 0.79,
          level: 'advanced'
        },
        2: {
          domainId: 2,
          domainName: '金融学',
          totalScore: 320,
          questionsAttempted: 45,
          questionsCorrect: 28,
          accuracy: 0.62,
          level: 'intermediate'
        },
        3: {
          domainId: 3,
          domainName: '医学',
          totalScore: 150,
          questionsAttempted: 20,
          questionsCorrect: 12,
          accuracy: 0.60,
          level: 'beginner'
        },
        4: {
          domainId: 4,
          domainName: '法律',
          totalScore: 200,
          questionsAttempted: 28,
          questionsCorrect: 18,
          accuracy: 0.64,
          level: 'beginner'
        },
        5: {
          domainId: 5,
          domainName: '管理学',
          totalScore: 280,
          questionsAttempted: 35,
          questionsCorrect: 22,
          accuracy: 0.63,
          level: 'intermediate'
        }
      },

      // T型人才分析
      tShapeAnalysis: {
        index: 0.73,  // T型指数 (0-1)
        type: 'T-shaped',  // I-shaped | T-shaped | Pi-shaped | Comb-shaped
        depthScore: 850,  // 深度分数 (主攻领域)
        breadthScore: 950,  // 广度分数 (其他领域总和)
        balance: 0.89,  // 平衡度

        strengths: [
          {
            domainId: 1,
            domainName: '计算机科学',
            reason: '主攻领域，得分850，超过85%的用户'
          }
        ],

        weaknesses: [
          {
            domainId: 3,
            domainName: '医学',
            reason: '入门级别，建议加强学习'
          }
        ]
      },

      // 学习建议
      recommendations: [
        {
          type: 'strengthen_depth',
          domainId: 1,
          domainName: '计算机科学',
          suggestion: '继续深化专业知识，推荐学习高级算法和系统设计',
          learningPaths: [1],
          priority: 'high'
        },
        {
          type: 'broaden_breadth',
          domainId: 3,
          domainName: '医学',
          suggestion: '拓展医学领域知识，提升T型人才广度',
          learningPaths: [],
          priority: 'medium'
        },
        {
          type: 'maintain_balance',
          domainId: 2,
          domainName: '金融学',
          suggestion: '保持金融学知识的学习节奏',
          learningPaths: [2],
          priority: 'medium'
        }
      ],

      // 更新时间
      lastUpdated: '2024-09-25T10:00:00Z'
    }
  ],

  // ========== Phase 3.3: AI 自动出题 ==========

  // AI生成题目记录
  aiGeneratedQuestions: [
    {
      id: 1,

      // 生成参数
      promptConfig: {
        domainId: 1,
        domainName: '计算机科学',
        categoryId: 1,
        difficulty: 'medium',
        metadata: {
          languageRestrictions: ['JavaScript'],
          timeComplexity: 'O(n)'
        },
        count: 3,
        temperature: 0.7,
        model: 'gpt-4'
      },

      // 生成结果
      generatedQuestions: [
        {
          title: '实现数组去重',
          content: '请实现一个函数，对给定数组进行去重，保持原有顺序。要求时间复杂度为 O(n)。',
          options: [
            { id: 'A', text: '使用 Set' },
            { id: 'B', text: '使用 filter + indexOf' },
            { id: 'C', text: '使用双重循环' },
            { id: 'D', text: 'A 和 B 都满足要求' }
          ],
          correctAnswer: 'A',
          explanation: '使用 Set 可以实现 O(n) 时间复杂度的去重。filter + indexOf 的时间复杂度为 O(n²)，双重循环也是 O(n²)。',
          qualityScore: 8.5,
          qualityMetrics: {
            clarity: 9,
            difficulty: 8,
            relevance: 9,
            completeness: 8
          }
        },
        {
          title: '数组扁平化',
          content: '实现一个函数将多维数组扁平化为一维数组，要求时间复杂度为 O(n)。',
          options: [
            { id: 'A', text: '使用 flat()' },
            { id: 'B', text: '使用递归' },
            { id: 'C', text: '使用 reduce' },
            { id: 'D', text: '以上都可以' }
          ],
          correctAnswer: 'D',
          explanation: 'flat()、递归和reduce都可以实现数组扁平化，且在合理实现下都能达到 O(n) 时间复杂度。',
          qualityScore: 8.0,
          qualityMetrics: {
            clarity: 8,
            difficulty: 8,
            relevance: 8,
            completeness: 8
          }
        },
        {
          title: '查找数组中的重复元素',
          content: '给定一个整数数组，找出其中所有重复的元素。要求时间复杂度为 O(n)，空间复杂度为 O(n)。',
          options: [
            { id: 'A', text: '使用哈希表记录出现次数' },
            { id: 'B', text: '先排序再遍历' },
            { id: 'C', text: '双重循环暴力解' },
            { id: 'D', text: '使用二分查找' }
          ],
          correctAnswer: 'A',
          explanation: '哈希表可以在 O(n) 时间和 O(n) 空间内解决。排序需要 O(nlogn)，双重循环是 O(n²)。',
          qualityScore: 8.8,
          qualityMetrics: {
            clarity: 9,
            difficulty: 9,
            relevance: 9,
            completeness: 8
          }
        }
      ],

      // 生成信息
      generatedAt: '2024-09-25T14:30:00Z',
      generatedBy: 'gpt-4',
      tokensUsed: 1500,
      cost: 0.045,

      // 审核状态
      status: 'pending',
      approvedQuestions: [],
      rejectedQuestions: []
    }
  ],

  // AI 配置
  aiConfig: {
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-4',
      maxTokens: 2000
    },
    anthropic: {
      enabled: false,
      apiKey: '',
      model: 'claude-3-opus-20240229',
      maxTokens: 2000
    }
  },

  // 用户统计数据
  statistics: {
    summary: {
      interviewCount: 24,
      totalPracticeTime: 7890, // 秒
      averageScore: 84.5,
      rank: {
        level: 'A+',
        percentile: 88.5,
        position: 45,
        totalUsers: 392
      }
    },
    timeSeriesData: {
      monthly: [
        {
          period: '2024-07',
          interviews: 5,
          totalTime: 1800,
          score: 78.5
        },
        {
          period: '2024-08',
          interviews: 8,
          totalTime: 2850,
          score: 82.3
        },
        {
          period: '2024-09',
          interviews: 11,
          totalTime: 3240,
          score: 87.1
        }
      ],
      weekly: [
        { period: '2024-W36', interviews: 2, totalTime: 720, score: 85.0 },
        { period: '2024-W37', interviews: 3, totalTime: 1080, score: 88.2 },
        { period: '2024-W38', interviews: 4, totalTime: 1440, score: 89.5 },
        { period: '2024-W39', interviews: 2, totalTime: 900, score: 86.8 }
      ]
    },
    categoryBreakdown: {
      aiInterview: {
        count: 16,
        avgScore: 85.2,
        totalTime: 4680
      },
      mockInterview: {
        count: 8,
        avgScore: 82.8,
        totalTime: 3210
      },
      technicalInterview: {
        count: 12,
        avgScore: 86.1,
        totalTime: 3960
      }
    },
    achievements: [
      {
        id: 'first_interview',
        title: '🎯 初次面试',
        description: '完成第一次面试',
        unlocked: true,
        unlockedAt: '2024-07-15T10:30:00Z',
        tier: 'bronze'
      },
      {
        id: 'interview_veteran',
        title: '🏅 面试老手',
        description: '完成10次面试',
        unlocked: true,
        unlockedAt: '2024-08-20T14:22:00Z',
        tier: 'silver'
      },
      {
        id: 'high_achiever',
        title: '🌟 优秀表现',
        description: '平均分数达到85分',
        unlocked: true,
        unlockedAt: '2024-09-10T16:15:00Z',
        tier: 'gold'
      },
      {
        id: 'interview_master',
        title: '👑 面试大师',
        description: '完成50次面试',
        unlocked: false,
        tier: 'platinum'
      }
    ],
    recommendations: [
      {
        type: 'focus',
        title: '🤖 专注AI面试训练',
        content: 'AI面试表现优秀，建议继续保持',
        priority: 'medium',
        actionUrl: '/interview/ai'
      },
      {
        type: 'practice',
        title: '📈 挑战更高难度',
        content: '基础扎实，可以尝试更有挑战性的题目',
        priority: 'high',
        actionUrl: '/questions?difficulty=hard'
      }
    ],
    insights: [
      {
        type: 'trend',
        title: '表现稳步提升',
        content: '最近三个月平均分数持续上升，保持良好势头！',
        icon: 'TrendUp'
      },
      {
        type: 'strength',
        title: '技术理解深度',
        content: '在技术概念理解方面表现突出',
        icon: 'Star'
      }
    ]
  },

  // 排行榜数据
  leaderboard: [
    { rank: 1, username: 'TopCoder', score: 96.8, interviews: 48, avatar: null },
    { rank: 2, username: 'JSMaster', score: 94.2, interviews: 35, avatar: null },
    { rank: 3, username: 'VueExpert', score: 91.7, interviews: 42, avatar: null },
    { rank: 4, username: 'ReactPro', score: 89.5, interviews: 31, avatar: null },
    { rank: 5, username: 'FullStack', score: 87.9, interviews: 38, avatar: null },
    { rank: 6, username: 'testuser', score: 84.5, interviews: 24, avatar: null, isCurrentUser: true },
    { rank: 7, username: 'DevNinja', score: 82.3, interviews: 29, avatar: null },
    { rank: 8, username: 'CodeWizard', score: 80.1, interviews: 26, avatar: null },
    { rank: 9, username: 'TechGuru', score: 78.6, interviews: 33, avatar: null },
    { rank: 10, username: 'ScriptKid', score: 76.4, interviews: 21, avatar: null }
  ],

  // ==================== 社区论坛数据 ====================

  // 论坛板块
  forums: [
    {
      id: 1,
      name: '技术讨论',
      slug: 'tech-discussion',
      description: '分享技术经验，讨论技术问题',
      icon: '💻',
      postCount: 128,
      sortOrder: 1,
      active: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: '面试经验',
      slug: 'interview-experience',
      description: '分享面试经历，交流面试技巧',
      icon: '📝',
      postCount: 89,
      sortOrder: 2,
      active: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: '职场发展',
      slug: 'career-dev',
      description: '职业规划、晋升路径、薪资谈判',
      icon: '📈',
      postCount: 56,
      sortOrder: 3,
      active: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 4,
      name: '学习资源',
      slug: 'learning-resources',
      description: '分享优质学习资源，推荐书籍课程',
      icon: '📚',
      postCount: 72,
      sortOrder: 4,
      active: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 5,
      name: '新手指南',
      slug: 'newbie-guide',
      description: '新人提问，老鸟解答',
      icon: '🔰',
      postCount: 95,
      sortOrder: 5,
      active: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ],

  // 帖子数据
  posts: [
    {
      id: 1,
      forumId: 1,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      title: '如何优雅地处理 Vue3 中的异步请求？',
      content: '最近在项目中遇到了异步请求的问题，想请教一下大家在 Vue3 中是如何处理异步请求的？\n\n我目前的做法是使用 async/await + try/catch，但感觉代码有些冗余。有没有更好的实践方案？',
      contentType: 'markdown',
      tags: ['Vue3', '异步编程', '最佳实践'],
      isPinned: true,
      isLocked: false,
      viewCount: 156,
      likeCount: 23,
      commentCount: 8,
      status: 'approved',
      aiReviewScore: 0.95,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      forumId: 2,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      title: '字节跳动前端三面面经分享',
      content: '# 一面（基础技术面）\n\n主要考察了 JS 基础、Vue 原理、网络协议等：\n\n1. 手写防抖节流\n2. Vue3 响应式原理\n3. HTTP 缓存机制\n4. 算法题：两数之和\n\n# 二面（项目深挖）\n\n围绕简历上的项目深入提问...',
      contentType: 'markdown',
      tags: ['字节跳动', '面试经验', '前端'],
      isPinned: false,
      isLocked: false,
      viewCount: 342,
      likeCount: 56,
      commentCount: 15,
      status: 'approved',
      aiReviewScore: 0.92,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      forumId: 3,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      title: '从初级到高级前端，需要掌握哪些技能？',
      content: '作为一个工作3年的前端，最近在思考职业发展方向。想问问大家，从初级到高级前端，需要掌握哪些关键技能？\n\n目前我会：\n- Vue/React 框架\n- TypeScript\n- Webpack 基础配置\n\n还需要补充什么？',
      contentType: 'markdown',
      tags: ['职业发展', '前端', '技能树'],
      isPinned: false,
      isLocked: false,
      viewCount: 289,
      likeCount: 41,
      commentCount: 12,
      status: 'approved',
      aiReviewScore: 0.88,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      forumId: 4,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      title: '推荐几本前端进阶必读书籍',
      content: '整理了一些前端进阶书籍，分享给大家：\n\n## JavaScript 进阶\n- 《你不知道的JavaScript》\n- 《JavaScript高级程序设计》\n\n## 框架原理\n- 《深入浅出Vue.js》\n- 《React设计原理》\n\n## 工程化\n- 《前端工程化：体系设计与实践》',
      contentType: 'markdown',
      tags: ['学习资源', '书籍推荐', '前端'],
      isPinned: false,
      isLocked: false,
      viewCount: 198,
      likeCount: 34,
      commentCount: 6,
      status: 'approved',
      aiReviewScore: 0.91,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 5,
      forumId: 5,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      title: '新手提问：前端学习路线应该怎么规划？',
      content: '大家好，我是刚转行的前端新人，想请教一下学习路线应该怎么规划？\n\n目前学完了 HTML、CSS、JavaScript 基础，接下来应该学什么？是先学框架还是先深入 JS？',
      contentType: 'markdown',
      tags: ['新手提问', '学习路线', '前端'],
      isPinned: false,
      isLocked: false,
      viewCount: 145,
      likeCount: 18,
      commentCount: 11,
      status: 'approved',
      aiReviewScore: 0.85,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],

  // 评论数据
  comments: [
    {
      id: 1,
      postId: 1,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      parentId: null,
      content: '可以使用 VueUse 中的 useFetch 或 useAsyncState，封装得很好用！',
      likeCount: 5,
      floorNumber: 1,
      status: 'normal',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      postId: 1,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      parentId: 1,
      content: '感谢分享！我去试试看',
      likeCount: 2,
      floorNumber: 2,
      status: 'normal',
      createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      postId: 2,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      parentId: null,
      content: '恭喜楼主！请问三面大概多长时间？',
      likeCount: 3,
      floorNumber: 1,
      status: 'normal',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],

  // 点赞记录
  reactions: [
    {
      id: 1,
      targetType: 'post',
      targetId: 1,
      userId: 1,
      reactionType: 'like',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      targetType: 'post',
      targetId: 2,
      userId: 1,
      reactionType: 'like',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      targetType: 'comment',
      targetId: 1,
      userId: 1,
      reactionType: 'like',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],

  // 帖子ID计数器
  postIdCounter: 6,
  commentIdCounter: 4,
  reactionIdCounter: 4,

  // ==================== 实时通信数据 ====================

  // 聊天室数据
  chatRooms: [
    {
      id: 1,
      name: '公共大厅',
      type: 'public',
      avatar: null,
      description: '所有用户都可以参与的公共聊天室',
      maxMembers: 1000,
      memberCount: 45,
      createdBy: 1,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: '前端技术交流',
      type: 'group',
      avatar: null,
      description: '前端开发者交流技术的地方',
      maxMembers: 100,
      memberCount: 23,
      createdBy: 1,
      createdAt: '2024-01-10T00:00:00Z'
    },
    {
      id: 3,
      name: '面试经验分享',
      type: 'group',
      avatar: null,
      description: '分享面试技巧和经验',
      maxMembers: 100,
      memberCount: 18,
      createdBy: 1,
      createdAt: '2024-01-15T00:00:00Z'
    }
  ],

  // 聊天室成员
  roomMembers: [
    { roomId: 1, userId: 1, role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
    { roomId: 2, userId: 1, role: 'owner', joinedAt: '2024-01-10T00:00:00Z' },
    { roomId: 3, userId: 1, role: 'member', joinedAt: '2024-01-15T00:00:00Z' }
  ],

  // 消息数据
  messages: [
    {
      id: 1,
      roomId: 1,
      senderId: 1,
      senderName: 'testuser',
      senderAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      content: '大家好！欢迎来到公共大厅 👋',
      messageType: 'text',
      replyTo: null,
      status: 'read',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      roomId: 1,
      senderId: 1,
      senderName: 'testuser',
      senderAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      content: '今天学习了 Vue3 的 Composition API，感觉很不错！',
      messageType: 'text',
      replyTo: null,
      status: 'read',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      roomId: 2,
      senderId: 1,
      senderName: 'testuser',
      senderAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      content: '有人了解 Vite 的构建原理吗？',
      messageType: 'text',
      replyTo: null,
      status: 'read',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ],

  // 通知数据
  notifications: [
    {
      id: 1,
      userId: 1,
      type: 'comment',
      title: '新评论通知',
      content: '有人评论了你的帖子"如何优雅地处理 Vue3 中的异步请求？"',
      link: '/community/posts/1',
      isRead: false,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      userId: 1,
      type: 'like',
      title: '点赞通知',
      content: '你的帖子收到了新的点赞',
      link: '/community/posts/1',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    }
  ],

  // 用户兴趣标签
  userInterests: [
    { userId: 1, tag: 'Vue.js', weight: 0.9, updatedAt: new Date().toISOString() },
    { userId: 1, tag: '前端', weight: 0.85, updatedAt: new Date().toISOString() },
    { userId: 1, tag: 'JavaScript', weight: 0.8, updatedAt: new Date().toISOString() },
    { userId: 1, tag: '算法', weight: 0.6, updatedAt: new Date().toISOString() }
  ],

  // 推荐记录
  recommendations: [],

  // 关注关系
  follows: [
    { id: 1, followerId: 1, followingId: 2, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, followerId: 1, followingId: 4, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
  ],

  // 用户动态
  userFeeds: [
    {
      id: 1,
      userId: 2,
      actionType: 'post',
      targetType: 'post',
      targetId: 1,
      content: '发布了新帖子：如何优雅地处理 Vue3 中的异步请求？',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      userId: 2,
      actionType: 'comment',
      targetType: 'post',
      targetId: 2,
      content: '评论了帖子：深入理解 JavaScript 闭包',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    }
  ],

  // ID 计数器
  messageIdCounter: 4,
  notificationIdCounter: 3,
  chatRoomIdCounter: 4,
  recommendationIdCounter: 1,
  followIdCounter: 3,
  feedIdCounter: 3
}

/**
 * 时间格式化辅助函数
 */
function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0分钟'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
  }
  return `${minutes}分钟`
}

/**
 * 响应工具函数
 */
function sendResponse(res, statusCode, data, message = 'Success') {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })

  const response = {
    code: statusCode === 200 ? 200 : statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  }

  res.end(JSON.stringify(response, null, 2))
}

/**
 * 处理CORS预检请求
 */
function handleOptions(res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  })
  res.end()
}

/**
 * 路由处理器
 */

/**
 * 解析 JSON 请求体
 */
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', chunk => {
      body += chunk.toString()
      if (body.length > 1024 * 1024) {
        req.destroy()
        reject(new Error('REQUEST_BODY_TOO_LARGE'))
      }
    })

    req.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        const parseError = new Error('INVALID_JSON')
        parseError.cause = error
        reject(parseError)
      }
    })

    req.on('error', reject)
  })
}

function paginate(items = [], page = 1, size = 20) {
  const safeSize = Math.max(1, Math.min(Number(size) || 20, 100))
  const safePage = Math.max(1, Number(page) || 1)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / safeSize))
  const currentPage = Math.min(safePage, totalPages)
  const start = (currentPage - 1) * safeSize
  const paginatedItems = items.slice(start, start + safeSize)

  return {
    items: paginatedItems,
    page: currentPage,
    size: safeSize,
    total,
    totalPages
  }
}

function getCategoryDescendants(categoryId) {
  if (!categoryId) return []

  const descendants = new Set([categoryId])
  const queue = [categoryId]
  const categories = mockData.questionCategories || []

  while (queue.length) {
    const current = queue.shift()
    categories.forEach(category => {
      if (category.parentId === current && !descendants.has(category.id)) {
        descendants.add(category.id)
        queue.push(category.id)
      }
    })
  }

  return Array.from(descendants)
}

function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter(category => (category.parentId ?? null) === parentId)
    .map(category => ({
      ...category,
      children: buildCategoryTree(categories, category.id)
    }))
}

function buildQuestionListItem(question) {
  const stats = question.stats || {}
  return {
    id: question.id,
    title: question.title,
    question: question.question,
    type: question.type,
    difficulty: question.difficulty,
    difficultyScore: typeof question.difficultyScore === 'number' ? question.difficultyScore : null,
    domainId: question.domainId || null,
    tags: question.tags || [],
    categoryId: question.categoryId,
    categoryPath: question.categoryPath || (question.categoryId ? [question.categoryId] : []),
    estimatedTime: question.estimatedTime || null,
    source: question.source || 'internal',
    metadata: question.metadata || {},
    updatedAt: question.updatedAt || null,
    createdAt: question.createdAt || null,
    stats: {
      attempts: stats.attempts || 0,
      correctCount: stats.correctCount || 0,
      averageScore: typeof stats.averageScore === 'number' ? stats.averageScore : 0,
      likeCount: stats.likeCount || 0,
      viewCount: stats.viewCount || 0
    },
    hasAnswer: Boolean(
      question.answer ||
      (Array.isArray(question.correctOptions) && question.correctOptions.length > 0) ||
      question.starterCode
    ),
    hasExplanation: Boolean(question.explanation),
    estimatedImpact: question.estimatedImpact || null
  }
}

function computeQuestionSummary(questions) {
  const summary = {
    total: questions.length,
    difficultyDistribution: {},
    tagCloud: {},
    categoryDistribution: {},
    estimatedTotalPracticeTime: 0
  }

  const categories = mockData.questionCategories || []
  const categoryMap = categories.reduce((acc, category) => {
    acc[category.id] = category
    return acc
  }, {})

  questions.forEach(question => {
    const difficultyKey = question.difficulty || 'unknown'
    summary.difficultyDistribution[difficultyKey] = (summary.difficultyDistribution[difficultyKey] || 0) + 1

    if (Array.isArray(question.tags)) {
      question.tags.forEach(tag => {
        const normalized = tag.trim()
        if (!normalized) return
        summary.tagCloud[normalized] = (summary.tagCloud[normalized] || 0) + 1
      })
    }

    const relatedCategories = question.categoryPath && question.categoryPath.length
      ? question.categoryPath
      : [question.categoryId].filter(Boolean)

    relatedCategories.forEach(catId => {
      summary.categoryDistribution[catId] = (summary.categoryDistribution[catId] || 0) + 1
    })

    summary.estimatedTotalPracticeTime += question.estimatedTime || 0
  })

  summary.difficultyDistribution = Object.entries(summary.difficultyDistribution).map(([difficulty, count]) => ({
    difficulty,
    count
  }))

  summary.tagCloud = Object.entries(summary.tagCloud)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)

  summary.categoryDistribution = Object.entries(summary.categoryDistribution).map(([categoryId, count]) => ({
    categoryId: Number(categoryId),
    name: categoryMap[categoryId] ? categoryMap[categoryId].name : '未分类',
    count
  }))

  summary.estimatedTotalPracticeTime = Number(summary.estimatedTotalPracticeTime.toFixed(2))

  return summary
}

function evaluateQuestionSubmission(question, submission = {}) {
  const result = {
    isCorrect: null,
    score: null,
    feedback: [],
    normalizedAnswer: null
  }

  if (!question) {
    result.feedback.push('题目不存在，无法评估作答。')
    return result
  }

  if (question.type === 'multiple_choice') {
    const expected = new Set((question.correctOptions || []).map(option => String(option).trim()))
    const providedOptions = Array.isArray(submission.answerOptions)
      ? submission.answerOptions
      : Array.isArray(submission.answer)
        ? submission.answer
        : typeof submission.answer === 'string'
          ? submission.answer.split(',').map(value => value.trim()).filter(Boolean)
          : []

    const received = new Set(providedOptions.map(option => String(option).trim()))

    const totalExpected = expected.size
    const hits = [...expected].filter(option => received.has(option)).length

    result.normalizedAnswer = Array.from(received)

    if (totalExpected > 0) {
      result.score = Number((hits / totalExpected).toFixed(2))
      result.isCorrect = hits === totalExpected && received.size === totalExpected

      if (result.isCorrect) {
        result.feedback.push('选项选择正确，继续保持！')
      } else if (hits > 0) {
        result.feedback.push(`部分选项正确（${hits}/${totalExpected}），建议复习相关知识点。`)
      } else {
        result.feedback.push('未命中正确选项，请重温题目对应的知识点。')
      }
    }
  } else if (question.type === 'short_answer') {
    const answerText = (submission.answer || '').toString().trim()
    result.normalizedAnswer = answerText

    if (!answerText) {
      result.feedback.push('答案为空，请尝试描述你的思路或答案。')
    } else {
      const reference = (question.answer || question.explanation || '').toString().trim()
      if (reference) {
        const lowerAnswer = answerText.toLowerCase()
        const keyPhrases = reference
          .replace(/[。；；,.]/g, '|')
          .split('|')
          .map(phrase => phrase.trim())
          .filter(Boolean)
          .slice(0, 5)

        const hits = keyPhrases.reduce((count, phrase) => {
          return lowerAnswer.includes(phrase.toLowerCase()) ? count + 1 : count
        }, 0)

        if (keyPhrases.length) {
          result.score = Number((hits / keyPhrases.length).toFixed(2))
          result.isCorrect = result.score >= 0.6

          if (result.isCorrect) {
            result.feedback.push('回答涵盖了主要要点，可以进一步补充细节。')
          } else {
            result.feedback.push('建议补充更多关键词，例如：' + keyPhrases.slice(0, 3).join('、') + '。')
          }
        }
      }
    }
  } else if (question.type === 'coding') {
    const code = (submission.code || submission.answer || '').toString()
    result.normalizedAnswer = code

    if (!code.trim()) {
      result.feedback.push('尚未提供代码，请编写解题代码。')
      result.isCorrect = false
      result.score = 0
    } else {
      result.feedback.push('代码已提交，建议在本地运行题目提供的测试用例验证。')
      result.isCorrect = null
      result.score = null
    }
  }

  return result
}

function getNextPracticeRecommendations(questionId, limit = 3) {
  const currentQuestion = mockData.questions.find(item => item.id === questionId)
  if (!currentQuestion) {
    return []
  }

  const related = mockData.questions
    .filter(item => item.id !== questionId)
    .map(item => {
      let score = 0

      if (currentQuestion.categoryId && item.categoryId === currentQuestion.categoryId) {
        score += 2
      }

      if (currentQuestion.tags && item.tags) {
        const overlap = currentQuestion.tags.filter(tag => item.tags.includes(tag)).length
        score += overlap
      }

      score += Math.max(0, (item.difficultyScore || 0) - (currentQuestion.difficultyScore || 0)) * 0.5

      return {
        score,
        payload: buildQuestionListItem(item)
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => entry.payload)

  return related
}

/**
 * 模拟 AI 内容审核
 * 返回 0-1 之间的分数，越高表示内容质量越好
 */
function mockAIReview(content) {
  // 敏感词检测
  const sensitiveWords = ['广告', '垃圾', '违法', '色情', '暴力']
  const hasSensitiveWords = sensitiveWords.some(word => content.includes(word))
  if (hasSensitiveWords) {
    return 0.3 // 低分，需要审核
  }

  // 内容长度检测
  if (content.length < 10) {
    return 0.5 // 内容太短
  }

  // 模拟质量评分
  let score = 0.7 // 基础分

  // 内容丰富度加分
  if (content.length > 100) score += 0.1
  if (content.includes('\n')) score += 0.05 // 有换行，格式较好
  if (content.includes('#')) score += 0.05 // 有标题
  if (content.includes('```')) score += 0.05 // 有代码块

  return Math.min(score, 1.0)
}

// ============ Dify API 调用函数 ============

/**
 * 调用 Dify 工作流
 * @param {Object} requestData - 请求数据
 * @returns {Promise} - 返回 Dify API 响应
 */
async function callDifyWorkflow(requestData) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      inputs: {
        job_title: requestData.jobTitle || '',
        request_type: requestData.requestType || 'generate_questions',
        question: requestData.question || '',
        candidate_answer: requestData.candidateAnswer || '',
        session_id: requestData.sessionId || ''
      },
      response_mode: 'blocking', // 阻塞模式,等待完整响应
      user: requestData.userId || 'user-' + Date.now()
    })

    const apiUrl = new URL(`${DIFY_CONFIG.baseURL}/workflows/run`)

    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }

    console.log('📡 调用 Dify API:', {
      url: apiUrl.href,
      requestType: requestData.requestType,
      jobTitle: requestData.jobTitle
    })

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          console.log('📥 Dify 响应状态:', res.statusCode)

          const response = JSON.parse(data)

          if (res.statusCode === 200) {
            const outputs = response.data?.outputs || {}

            // 根据 request_type 返回不同的数据结构
            if (requestData.requestType === 'generate_questions') {
              resolve({
                success: true,
                data: {
                  session_id: outputs.session_id,
                  generated_questions: parseQuestions(outputs.generated_questions),
                  metadata: {
                    workflowId: response.workflow_run_id,
                    processingTime: response.elapsed_time || 0
                  }
                }
              })
            } else if (requestData.requestType === 'score_answer') {
              resolve({
                success: true,
                data: {
                  comprehensive_evaluation: outputs.comprehensive_evaluation,
                  overall_score: outputs.overall_score,
                  metadata: {
                    workflowId: response.workflow_run_id,
                    processingTime: response.elapsed_time || 0
                  }
                }
              })
            }
          } else {
            reject({
              success: false,
              error: {
                code: 'DIFY_API_ERROR',
                message: response.message || '调用 Dify API 失败',
                statusCode: res.statusCode
              }
            })
          }
        } catch (error) {
          console.error('❌ 解析 Dify 响应失败:', error)
          reject({
            success: false,
            error: {
              code: 'DIFY_PARSE_ERROR',
              message: '解析 Dify 响应失败: ' + error.message
            }
          })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Dify API 请求失败:', error)
      reject({
        success: false,
        error: {
          code: 'DIFY_NETWORK_ERROR',
          message: '网络请求失败: ' + error.message
        }
      })
    })

    // 设置超时(90秒) - 支持长时间工作流执行
    req.setTimeout(90000, () => {
      req.destroy()
      reject({
        success: false,
        error: {
          code: 'DIFY_TIMEOUT',
          message: 'Dify API 请求超时（90秒）- 工作流执行时间过长'
        }
      })
    })

    req.write(requestBody)
    req.end()
  })
}

/**
 * 解析 Dify 返回的题目列表
 */
function parseQuestions(questionsData) {
  if (!questionsData) return []

  try {
    // Dify 返回的是 JSON 数组字符串
    if (typeof questionsData === 'string') {
      const parsed = JSON.parse(questionsData)

      // 提取 question 字段
      if (Array.isArray(parsed)) {
        return parsed.map(item => {
          if (typeof item === 'object' && item.question) {
            return item.question
          }
          return item
        })
      }
    }

    if (Array.isArray(questionsData)) {
      return questionsData
    }

    return []
  } catch (error) {
    console.error('❌ 解析题目失败:', error)
    return []
  }
}

const routes = {
  // 健康检查
  'GET:/api/actuator/health': (req, res) => {
    sendResponse(res, 200, mockData.health)
  },

  'GET:/api/health': (req, res) => {
    sendResponse(res, 200, mockData.health)
  },

  // 用户相关
  'GET:/api/users/me': (req, res) => {
    sendResponse(res, 200, mockData.users[0])
  },

  // 领域管理 API
  'GET:/api/domains': (req, res) => {
    const activeDomains = mockData.domains
      .filter(d => d.active)
      .map(domain => {
        const categories = mockData.questionCategories.filter(c => c.domainId === domain.id)
        const questions = mockData.questions.filter(q => q.domainId === domain.id)

        return {
          ...domain,
          categoryCount: categories.length,
          questionCount: questions.length,
          stats: {
            easyCount: questions.filter(q => q.difficulty === 'easy').length,
            mediumCount: questions.filter(q => q.difficulty === 'medium').length,
            hardCount: questions.filter(q => q.difficulty === 'hard').length
          }
        }
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)

    sendResponse(res, 200, {
      items: activeDomains,
      total: activeDomains.length
    }, '获取领域列表成功')
  },

  'GET:/api/domains/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const idOrSlug = segments[segments.length - 1]

    const domain = mockData.domains.find(d =>
      d.id === Number(idOrSlug) || d.slug === idOrSlug
    )

    if (!domain) {
      sendResponse(res, 404, null, '领域不存在')
      return
    }

    const categories = mockData.questionCategories.filter(c => c.domainId === domain.id)
    const questions = mockData.questions.filter(q => q.domainId === domain.id)

    sendResponse(res, 200, {
      ...domain,
      categoryCount: categories.length,
      questionCount: questions.length,
      categories: categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
    }, '获取领域详情成功')
  },

  'GET:/api/domains/:id/field-config': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const domainId = Number(segments[3])

    const config = mockData.domainFieldConfigs[domainId] || { fields: [] }

    sendResponse(res, 200, config, '获取领域字段配置成功')
  },

  // 学习路径 API
  'GET:/api/learning-paths': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const domainId = query.domain_id ? Number(query.domain_id) : null
    const level = query.level || null

    let paths = mockData.learningPaths.slice()

    if (domainId) {
      paths = paths.filter(p => p.domainId === domainId)
    }

    if (level) {
      paths = paths.filter(p => p.level === level)
    }

    const items = paths.map(path => ({
      ...path,
      moduleCount: path.modules.length,
      totalQuestions: path.modules.reduce((sum, m) => sum + m.questionIds.length, 0)
    }))

    sendResponse(res, 200, {
      items,
      total: items.length
    }, '获取学习路径列表成功')
  },

  'GET:/api/learning-paths/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const idOrSlug = segments[segments.length - 1]

    const path = mockData.learningPaths.find(p =>
      p.id === Number(idOrSlug) || p.slug === idOrSlug
    )

    if (!path) {
      sendResponse(res, 404, null, '学习路径不存在')
      return
    }

    // 获取用户进度
    const userProgress = mockData.userLearningPaths.find(up =>
      up.pathId === path.id && up.userId === 1
    )

    sendResponse(res, 200, {
      ...path,
      userProgress: userProgress || null,
      moduleCount: path.modules.length,
      totalQuestions: path.modules.reduce((sum, m) => sum + m.questionIds.length, 0)
    }, '获取学习路径详情成功')
  },

  'POST:/api/learning-paths/:id/enroll': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const pathId = Number(segments[segments.length - 2])

    const path = mockData.learningPaths.find(p => p.id === pathId)

    if (!path) {
      sendResponse(res, 404, null, '学习路径不存在')
      return
    }

    // 检查是否已报名
    const existing = mockData.userLearningPaths.find(up =>
      up.pathId === pathId && up.userId === 1
    )

    if (existing) {
      sendResponse(res, 400, null, '您已报名此学习路径')
      return
    }

    const enrollment = {
      userId: 1,
      pathId: pathId,
      enrolledAt: new Date().toISOString(),
      currentModuleId: path.modules[0]?.id || null,
      progress: 0,
      completedModules: [],
      totalScore: 0,
      status: 'in_progress'
    }

    mockData.userLearningPaths.push(enrollment)
    path.stats.enrolledCount += 1

    sendResponse(res, 200, enrollment, '报名成功')
  },

  'PUT:/api/learning-paths/:pathId/modules/:moduleId/complete': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const pathId = Number(segments[segments.length - 4])
    const moduleId = Number(segments[segments.length - 2])

    const userPath = mockData.userLearningPaths.find(up =>
      up.pathId === pathId && up.userId === 1
    )

    if (!userPath) {
      sendResponse(res, 404, null, '未找到学习记录')
      return
    }

    if (!userPath.completedModules.includes(moduleId)) {
      userPath.completedModules.push(moduleId)
    }

    const path = mockData.learningPaths.find(p => p.id === pathId)
    if (path) {
      userPath.progress = userPath.completedModules.length / path.modules.length

      // 检查是否完成所有模块
      if (userPath.progress >= 1) {
        userPath.status = 'completed'
        path.stats.completedCount += 1
      }
    }

    sendResponse(res, 200, userPath, '模块完成进度已更新')
  },

  // ========== Phase 3.1: 社区贡献系统 API ==========

  // 1. 提交题目
  'POST:/api/contributions/submit': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const data = JSON.parse(body)

      const newSubmission = {
        id: mockData.questionSubmissions.length + 1,
        questionId: null,
        contributorId: 1,  // 当前登录用户
        domainId: data.domainId,
        categoryId: data.categoryId,
        title: data.title,
        content: data.content,
        difficulty: data.difficulty,
        tags: data.tags || [],
        hints: data.hints || [],
        metadata: data.metadata || {},
        options: data.options || [],
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewerId: null,
        reviewComment: '',
        revisionCount: 0,
        previousVersions: []
      }

      mockData.questionSubmissions.push(newSubmission)

      // 更新贡献者资料
      let profile = mockData.contributorProfiles.find(p => p.userId === 1)
      if (!profile) {
        profile = {
          userId: 1,
          stats: {
            totalSubmissions: 0,
            approvedCount: 0,
            rejectedCount: 0,
            pendingCount: 0,
            approvalRate: 0,
            totalPoints: 0,
            rank: 0
          },
          badges: [],
          expertise: [],
          recentActivity: []
        }
        mockData.contributorProfiles.push(profile)
      }

      profile.stats.totalSubmissions++
      profile.stats.pendingCount++
      profile.recentActivity.unshift({
        type: 'submit',
        submissionId: newSubmission.id,
        timestamp: newSubmission.submittedAt,
        title: newSubmission.title
      })

      sendResponse(res, 200, newSubmission, '题目提交成功，等待审核')
    })
  },

  // 2. 获取我的提交列表
  'GET:/api/contributions/my-submissions': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const status = query.status
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10

    let submissions = mockData.questionSubmissions.filter(s => s.contributorId === 1)

    if (status) {
      submissions = submissions.filter(s => s.status === status)
    }

    const total = submissions.length
    const start = (page - 1) * limit
    const items = submissions.slice(start, start + limit)

    sendResponse(res, 200, {
      items,
      total,
      page,
      pageSize: limit
    }, '获取提交列表成功')
  },

  // 3. 获取提交详情
  'GET:/api/contributions/submissions/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 1])

    const submission = mockData.questionSubmissions.find(s => s.id === id)

    if (!submission) {
      sendResponse(res, 404, null, '提交不存在')
      return
    }

    sendResponse(res, 200, submission, '获取提交详情成功')
  },

  // 4. 修订题目
  'PUT:/api/contributions/submissions/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 1])

    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const data = JSON.parse(body)

      const submission = mockData.questionSubmissions.find(s => s.id === id)

      if (!submission) {
        sendResponse(res, 404, null, '提交不存在')
        return
      }

      // 保存旧版本（避免循环引用）
      const {previousVersions, ...submissionData} = submission
      submission.previousVersions.push({
        version: submission.revisionCount,
        data: submissionData,
        timestamp: new Date().toISOString()
      })

      // 更新提交
      Object.assign(submission, data)
      submission.revisionCount++
      submission.status = 'pending'  // 重新进入待审核状态

      // 返回时不包含previousVersions避免数据过大
      const {previousVersions: _, ...result} = submission
      sendResponse(res, 200, result, '修订成功，重新进入审核队列')
    })
  },

  // 5. 获取待审核队列 (管理员/专家)
  'GET:/api/contributions/review-queue': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const status = query.status || 'pending'
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10

    let submissions = mockData.questionSubmissions.filter(s => s.status === status)

    const items = submissions.map(sub => {
      const contributor = mockData.contributorProfiles.find(p => p.userId === sub.contributorId)
      return {
        id: sub.id,
        submission: sub,
        contributor: contributor ? {
          userId: contributor.userId,
          stats: contributor.stats,
          expertise: contributor.expertise
        } : null
      }
    })

    const total = items.length
    const start = (page - 1) * limit
    const paginatedItems = items.slice(start, start + limit)

    sendResponse(res, 200, {
      items: paginatedItems,
      total,
      page,
      pageSize: limit
    }, '获取审核队列成功')
  },

  // 6. 领取审核任务
  'POST:/api/contributions/review-queue/:submissionId/claim': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const submissionId = Number(segments[segments.length - 2])

    const submission = mockData.questionSubmissions.find(s => s.id === submissionId)

    if (!submission) {
      sendResponse(res, 404, null, '提交不存在')
      return
    }

    if (submission.status !== 'pending') {
      sendResponse(res, 400, null, '该题目已被领取或已审核')
      return
    }

    submission.status = 'under_review'

    const queueItem = {
      id: mockData.reviewQueue.length + 1,
      submissionId,
      reviewerId: 2,  // 模拟审核员
      assignedAt: new Date().toISOString(),
      status: 'in_progress',
      priority: 'normal'
    }

    mockData.reviewQueue.push(queueItem)

    sendResponse(res, 200, queueItem, '领取审核任务成功')
  },

  // 7. 提交审核结果
  'POST:/api/contributions/submissions/:id/review': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 2])

    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const { action, comment, suggestions } = JSON.parse(body)

      const submission = mockData.questionSubmissions.find(s => s.id === id)

      if (!submission) {
        sendResponse(res, 404, null, '提交不存在')
        return
      }

      submission.reviewedAt = new Date().toISOString()
      submission.reviewerId = 2
      submission.reviewComment = comment || ''

      let questionId = null

      if (action === 'approve') {
        submission.status = 'approved'

        // 创建新题目
        questionId = mockData.questions.length + 1
        const newQuestion = {
          id: questionId,
          domainId: submission.domainId,
          categoryId: submission.categoryId,
          title: submission.title,
          content: submission.content,
          difficulty: submission.difficulty,
          tags: submission.tags,
          hints: submission.hints,
          metadata: submission.metadata,
          options: submission.options,
          correctAnswer: submission.correctAnswer,
          explanation: submission.explanation,
          createdAt: new Date().toISOString()
        }

        mockData.questions.push(newQuestion)
        submission.questionId = questionId

        // 更新贡献者统计
        const profile = mockData.contributorProfiles.find(p => p.userId === submission.contributorId)
        if (profile) {
          profile.stats.approvedCount++
          profile.stats.pendingCount--
          profile.stats.totalPoints += 10
          profile.stats.approvalRate = profile.stats.approvedCount / profile.stats.totalSubmissions

          // 添加活动记录
          profile.recentActivity.unshift({
            type: 'approved',
            submissionId: submission.id,
            questionId,
            timestamp: submission.reviewedAt,
            title: submission.title
          })
        }
      } else if (action === 'reject') {
        submission.status = 'rejected'

        const profile = mockData.contributorProfiles.find(p => p.userId === submission.contributorId)
        if (profile) {
          profile.stats.rejectedCount++
          profile.stats.pendingCount--
          profile.stats.approvalRate = profile.stats.approvedCount / profile.stats.totalSubmissions
        }
      } else if (action === 'request_revision') {
        submission.status = 'needs_revision'
      }

      sendResponse(res, 200, {
        submissionId: submission.id,
        newStatus: submission.status,
        questionId
      }, '审核完成')
    })
  },

  // 7. 领取奖励
  'POST:/api/contributions/submissions/:id/claim-reward': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 2])

    const submission = mockData.questionSubmissions.find(s => s.id === id)

    if (!submission) {
      return sendResponse(res, 404, null, '提交不存在')
    }

    if (submission.status !== 'approved') {
      return sendResponse(res, 400, null, '只有已通过的题目才能领取奖励')
    }

    // 计算奖励积分
    const basePoints = { easy: 10, medium: 20, hard: 30 }
    const pointsAwarded = basePoints[submission.difficulty] || 15

    // 更新用户积分
    let profile = mockData.contributorProfiles.find(p => p.userId === submission.contributorId)
    if (profile) {
      profile.stats.totalPoints += pointsAwarded
    }

    // 检查并授予徽章
    const newBadges = []
    if (profile && profile.stats.approvedCount === 1) {
      newBadges.push('first_contribution')
    }
    if (profile && profile.stats.approvedCount === 10) {
      newBadges.push('contributor_10')
    }

    sendResponse(res, 200, {
      pointsAwarded,
      newTotalPoints: profile?.stats.totalPoints || 0,
      newBadges
    }, '奖励领取成功')
  },

  // 8. 获取贡献者资料
  'GET:/api/contributions/profile/:userId': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const userId = Number(segments[segments.length - 1])

    const profile = mockData.contributorProfiles.find(p => p.userId === userId)

    if (!profile) {
      sendResponse(res, 404, null, '贡献者资料不存在')
      return
    }

    sendResponse(res, 200, profile, '获取贡献者资料成功')
  },

  // 9. 获取贡献排行榜
  'GET:/api/contributions/leaderboard': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const timeRange = query.timeRange || 'all'  // all | month | week
    const limit = Number(query.limit) || 20

    const profiles = mockData.contributorProfiles
      .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
      .slice(0, limit)

    const items = profiles.map((profile, index) => {
      const user = mockData.users.find(u => u.id === profile.userId)
      return {
        rank: index + 1,
        userId: profile.userId,
        username: user?.username || `user${profile.userId}`,
        avatar: user?.avatar || '',
        totalPoints: profile.stats.totalPoints,
        approvedCount: profile.stats.approvedCount,
        approvalRate: profile.stats.approvalRate
      }
    })

    sendResponse(res, 200, { items }, '获取排行榜成功')
  },

  // 10. 获取徽章列表
  'GET:/api/contributions/badges': (req, res) => {
    sendResponse(res, 200, {
      items: mockData.badgeDefinitions
    }, '获取徽章列表成功')
  },

  // ========== Phase 3.2: 跨专业能力分析 API ==========

  // 11. 获取用户能力画像
  'GET:/api/ability/profile/:userId': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const userId = Number(segments[segments.length - 1])

    const profile = mockData.userAbilityProfiles.find(p => p.userId === userId)

    if (!profile) {
      sendResponse(res, 404, null, '能力画像不存在')
      return
    }

    sendResponse(res, 200, profile, '获取能力画像成功')
  },

  // 12. 获取雷达图数据
  'GET:/api/ability/radar/:userId': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const userId = Number(segments[segments.length - 1])

    const profile = mockData.userAbilityProfiles.find(p => p.userId === userId)

    if (!profile) {
      sendResponse(res, 404, null, '能力画像不存在')
      return
    }

    const domains = []
    const scores = []
    const percentiles = []

    Object.values(profile.domainScores).forEach(domain => {
      domains.push(domain.domainName)
      scores.push(domain.totalScore)
      percentiles.push(domain.accuracy)
    })

    sendResponse(res, 200, {
      domains,
      scores,
      maxScore: 1000,
      percentiles
    }, '获取雷达图数据成功')
  },

  // 13. 对比能力分析
  'GET:/api/ability/compare': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const userIds = query.userIds ? query.userIds.split(',').map(Number) : []

    const compareData = userIds.map(userId => {
      const profile = mockData.userAbilityProfiles.find(p => p.userId === userId)
      const user = mockData.users.find(u => u.id === userId)

      if (!profile) {
        return null
      }

      return {
        userId,
        username: user?.username || `user${userId}`,
        avatar: user?.avatar || '',
        tShapeAnalysis: profile.tShapeAnalysis,
        domainScores: profile.domainScores,
        primaryDomain: profile.primaryDomain
      }
    }).filter(Boolean)

    sendResponse(res, 200, compareData, '能力对比分析成功')
  },

  // 14. 获取学习建议
  'GET:/api/ability/recommendations/:userId': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const userId = Number(segments[segments.length - 1])

    const profile = mockData.userAbilityProfiles.find(p => p.userId === userId)

    if (!profile) {
      return sendResponse(res, 404, null, '用户能力档案不存在')
    }

    // 根据用户能力生成推荐
    const recommendations = []

    // 如果是I型（专才），推荐拓宽广度
    if (profile.tShapeAnalysis.type === 'I-shaped') {
      const learnedDomainIds = Object.keys(profile.domainScores).map(Number)
      recommendations.push({
        type: 'breadth',
        priority: 'high',
        title: '拓宽知识广度',
        description: '建议学习其他领域的基础知识，成为T型人才',
        suggestedDomains: mockData.domains
          .filter(d => !learnedDomainIds.includes(d.id))
          .slice(0, 3)
          .map(d => ({ id: d.id, name: d.name }))
      })
    }

    // 如果是-型（通才），推荐加深某一领域
    if (profile.tShapeAnalysis.type === 'generalist') {
      recommendations.push({
        type: 'depth',
        priority: 'high',
        title: '深化专业深度',
        description: '建议选择一个感兴趣的领域进行深入学习',
        suggestedDomains: Object.values(profile.domainScores)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 2)
          .map(ds => {
            const domain = mockData.domains.find(d => d.id === ds.domainId)
            return { id: ds.domainId, name: domain?.name || '' }
          })
      })
    }

    // 针对弱项领域的推荐
    const weakDomains = Object.values(profile.domainScores)
      .filter(ds => ds.totalScore < 600)
      .sort((a, b) => a.totalScore - b.totalScore)
      .slice(0, 2)

    if (weakDomains.length > 0) {
      weakDomains.forEach(ds => {
        const domain = mockData.domains.find(d => d.id === ds.domainId)
        recommendations.push({
          type: 'improve',
          priority: 'medium',
          title: `提升${domain?.name || ''}能力`,
          description: `当前得分${ds.totalScore}，建议加强该领域的学习`,
          suggestedDomains: [{ id: ds.domainId, name: domain?.name || '' }]
        })
      })
    }

    sendResponse(res, 200, recommendations, '获取学习建议成功')
  },

  // 15. 获取 T 型指数排行
  'GET:/api/ability/t-shape-leaderboard': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const limit = Number(query.limit) || 20

    const profiles = mockData.userAbilityProfiles
      .sort((a, b) => b.tShapeAnalysis.index - a.tShapeAnalysis.index)
      .slice(0, limit)

    const items = profiles.map((profile, index) => {
      const user = mockData.users.find(u => u.id === profile.userId)
      return {
        rank: index + 1,
        userId: profile.userId,
        username: user?.username || `user${profile.userId}`,
        tShapeIndex: profile.tShapeAnalysis.index,
        primaryDomain: profile.primaryDomain.domainName,
        depthScore: profile.tShapeAnalysis.depthScore,
        breadthScore: profile.tShapeAnalysis.breadthScore
      }
    })

    sendResponse(res, 200, { items }, '获取T型指数排行成功')
  },

  // 14. 获取跨专业推荐
  'GET:/api/ability/cross-domain-recommendations/:userId': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const userId = Number(segments[segments.length - 1])

    const profile = mockData.userAbilityProfiles.find(p => p.userId === userId)

    if (!profile) {
      sendResponse(res, 404, null, '能力画像不存在')
      return
    }

    // 推荐弱项领域的题目
    const weakDomains = Object.values(profile.domainScores)
      .filter(d => d.level === 'beginner')
      .map(d => d.domainId)

    const recommendedQuestions = mockData.questions
      .filter(q => weakDomains.includes(q.domainId))
      .slice(0, 10)

    // 推荐相关学习路径
    const recommendedPaths = profile.recommendations
      .filter(r => r.learningPaths.length > 0)
      .flatMap(r => r.learningPaths)
      .map(pathId => mockData.learningPaths.find(p => p.id === pathId))
      .filter(p => p)

    sendResponse(res, 200, {
      questions: recommendedQuestions,
      learningPaths: recommendedPaths
    }, '获取跨专业推荐成功')
  },

  // ========== Phase 3.3: AI 自动出题 API ==========

  // 15. 生成题目
  'POST:/api/ai/generate-questions': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const config = JSON.parse(body)

      // 模拟 AI 生成 (实际应调用 OpenAI/Claude API)
      const mockGenerated = {
        id: mockData.aiGeneratedQuestions.length + 1,
        promptConfig: config,
        generatedQuestions: [
          {
            title: `AI生成题目示例 - ${config.difficulty}`,
            content: `这是一道关于${config.domainName}的${config.difficulty}难度题目...`,
            options: [
              { id: 'A', text: '选项A' },
              { id: 'B', text: '选项B' },
              { id: 'C', text: '选项C' },
              { id: 'D', text: '选项D' }
            ],
            correctAnswer: 'A',
            explanation: 'AI生成的详细解析...',
            qualityScore: 8.0,
            qualityMetrics: {
              clarity: 8,
              difficulty: 8,
              relevance: 8,
              completeness: 8
            }
          }
        ],
        generatedAt: new Date().toISOString(),
        generatedBy: config.model || 'gpt-4',
        tokensUsed: 1000,
        cost: 0.03,
        status: 'pending',
        approvedQuestions: [],
        rejectedQuestions: []
      }

      mockData.aiGeneratedQuestions.push(mockGenerated)

      sendResponse(res, 200, mockGenerated, 'AI题目生成成功')
    })
  },

  // 16. 获取生成历史
  'GET:/api/ai/generation-history': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10

    const total = mockData.aiGeneratedQuestions.length
    const start = (page - 1) * limit
    const items = mockData.aiGeneratedQuestions.slice(start, start + limit)

    sendResponse(res, 200, {
      items,
      total,
      page,
      pageSize: limit
    }, '获取生成历史成功')
  },

  // 17. 获取生成详情
  'GET:/api/ai/generations/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 1])

    const generation = mockData.aiGeneratedQuestions.find(g => g.id === id)

    if (!generation) {
      return sendResponse(res, 404, null, '生成记录不存在')
    }

    sendResponse(res, 200, {
      taskId: generation.id,
      status: generation.status,
      requestedCount: generation.promptConfig?.count || 0,
      generatedCount: generation.generatedQuestions?.length || 0,
      questions: generation.generatedQuestions,
      createdAt: generation.generatedAt
    }, '获取生成详情成功')
  },

  // 18. 评估题目质量
  'POST:/api/ai/evaluate': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const { questionId, feedback } = JSON.parse(body)

      // 计算总分
      const totalScore = (feedback.clarity || 0) +
                        (feedback.difficulty || 0) +
                        (feedback.relevance || 0) +
                        (feedback.completeness || 0)

      // 保存评估结果（实际应存入数据库）
      sendResponse(res, 200, {
        questionId,
        totalScore,
        maxScore: 20,
        feedback,
        evaluatedAt: new Date().toISOString()
      }, '题目质量评估成功')
    })
  },

  // 19. 审核AI生成的题目
  'POST:/api/ai/generated-questions/:id/review': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 2])

    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const { approvedIndices, rejectedIndices } = JSON.parse(body)

      const record = mockData.aiGeneratedQuestions.find(r => r.id === id)

      if (!record) {
        sendResponse(res, 404, null, '生成记录不存在')
        return
      }

      const approvedQuestions = []

      // 处理通过的题目
      approvedIndices.forEach(index => {
        const question = record.generatedQuestions[index]
        if (question) {
          const newQuestion = {
            id: mockData.questions.length + 1,
            domainId: record.promptConfig.domainId,
            categoryId: record.promptConfig.categoryId,
            title: question.title,
            content: question.content,
            difficulty: record.promptConfig.difficulty,
            metadata: record.promptConfig.metadata || {},
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            createdAt: new Date().toISOString(),
            source: 'ai_generated'
          }

          mockData.questions.push(newQuestion)
          approvedQuestions.push(newQuestion.id)
        }
      })

      record.approvedQuestions = approvedQuestions
      record.rejectedQuestions = rejectedIndices
      record.status = 'reviewed'

      sendResponse(res, 200, {
        approvedQuestions,
        approvedCount: approvedQuestions.length,
        rejectedCount: rejectedIndices.length
      }, 'AI题目审核完成')
    })
  },

  // 18. 配置 API Key
  'POST:/api/ai/config': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const { provider, apiKey, enabled } = JSON.parse(body)

      if (provider === 'openai') {
        mockData.aiConfig.openai.apiKey = apiKey
        mockData.aiConfig.openai.enabled = enabled
      } else if (provider === 'anthropic') {
        mockData.aiConfig.anthropic.apiKey = apiKey
        mockData.aiConfig.anthropic.enabled = enabled
      }

      sendResponse(res, 200, null, 'API配置已更新')
    })
  },

  // 题库分类与标签
  'GET:/api/questions/categories': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const domainId = query.domain_id ? Number(query.domain_id) : null

    let categories = mockData.questionCategories || []

    // 按领域筛选
    if (domainId) {
      categories = categories.filter(c => c.domainId === domainId)
    }

    const categoryStats = categories.map(category => {
      const questionCount = mockData.questions.filter(question => {
        if (Array.isArray(question.categoryPath) && question.categoryPath.length) {
          return question.categoryPath.includes(category.id)
        }
        return question.categoryId === category.id
      }).length

      const children = categories
        .filter(child => child.parentId === category.id)
        .map(child => child.id)

      return {
        ...category,
        questionCount,
        childCount: children.length,
        children
      }
    })

    const tree = buildCategoryTree(categoryStats.map(category => ({ ...category })))

    sendResponse(res, 200, {
      tree,
      flat: categoryStats.map(category => ({
        ...category,
        children: undefined
      })),
      meta: {
        total: categories.length,
        lastUpdated: mockData.questions.reduce((latest, item) => {
          if (!item.updatedAt) return latest
          return !latest || item.updatedAt > latest ? item.updatedAt : latest
        }, null)
      }
    }, '获取题库分类成功')
  },

  'GET:/api/questions/tags': (req, res) => {
    const tagCounter = {}

    mockData.questions.forEach(question => {
      (question.tags || []).forEach(tag => {
        const normalized = tag.trim()
        if (!normalized) return
        const key = normalized.toLowerCase()
        if (!tagCounter[key]) {
          tagCounter[key] = { tag: normalized, count: 0 }
        }
        tagCounter[key].count += 1
      })
    })

    const items = Object.values(tagCounter)
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({ ...item, rank: index + 1 }))

    sendResponse(res, 200, {
      items,
      total: items.length
    }, '获取题库标签成功')
  },

  'GET:/api/questions': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}

    const page = Number(query.page) || 1
    const size = Number(query.size) || 20
    const difficultyFilter = query.difficulty ? query.difficulty.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : []
    const typeFilter = query.type ? query.type.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : []
    const keyword = (query.keyword || '').trim().toLowerCase()
    const tagsFilter = query.tags ? query.tags.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : []
    const tagMode = (query.tag_mode || '').toLowerCase() === 'all' ? 'all' : 'any'
    const categoryId = query.category_id ? Number(query.category_id) : null
    const includeCategoryDescendants = query.include_descendants !== 'false'
    const sort = query.sort || 'recent'
    const domainId = query.domain_id ? Number(query.domain_id) : null

    let candidates = mockData.questions.slice()

    // 按领域筛选
    if (domainId) {
      candidates = candidates.filter(q => q.domainId === domainId)
    }

    if (categoryId) {
      const allowedCategories = includeCategoryDescendants
        ? getCategoryDescendants(categoryId)
        : [categoryId]

      candidates = candidates.filter(question => {
        const path = Array.isArray(question.categoryPath) && question.categoryPath.length
          ? question.categoryPath
          : [question.categoryId].filter(Boolean)
        return path.some(catId => allowedCategories.includes(catId))
      })
    }

    if (difficultyFilter.length) {
      candidates = candidates.filter(question => question.difficulty && difficultyFilter.includes(question.difficulty.toLowerCase()))
    }

    if (typeFilter.length) {
      candidates = candidates.filter(question => question.type && typeFilter.includes(question.type.toLowerCase()))
    }

    if (keyword) {
      candidates = candidates.filter(question => {
        const target = [
          question.title,
          question.question,
          question.explanation,
          question.tags ? question.tags.join(' ') : ''
        ].join(' ').toLowerCase()
        return target.includes(keyword)
      })
    }

    if (tagsFilter.length) {
      candidates = candidates.filter(question => {
        if (!Array.isArray(question.tags) || !question.tags.length) return false
        const normalizedTags = question.tags.map(tag => tag.toLowerCase())
        if (tagMode === 'all') {
          return tagsFilter.every(tag => normalizedTags.includes(tag))
        }
        return tagsFilter.some(tag => normalizedTags.includes(tag))
      })
    }

    // metadata 筛选支持
    Object.keys(query).forEach(key => {
      if (key.startsWith('metadata.')) {
        const metaKey = key.replace('metadata.', '')
        const metaValue = query[key]

        candidates = candidates.filter(question => {
          if (!question.metadata) return false

          const questionMetaValue = question.metadata[metaKey]
          if (!questionMetaValue) return false

          // 支持数组类型的 metadata (如 languageRestrictions)
          if (Array.isArray(questionMetaValue)) {
            return questionMetaValue.includes(metaValue)
          }

          // 支持字符串匹配
          return questionMetaValue === metaValue ||
                 questionMetaValue.toString().toLowerCase() === metaValue.toLowerCase()
        })
      }
    })

    candidates.sort((a, b) => {
      if (sort === 'popular') {
        const aScore = (a.stats?.viewCount || 0) + (a.stats?.likeCount || 0) * 2
        const bScore = (b.stats?.viewCount || 0) + (b.stats?.likeCount || 0) * 2
        return bScore - aScore
      }
      if (sort === 'difficulty') {
        return (a.difficultyScore || 0) - (b.difficultyScore || 0)
      }
      if (sort === 'difficulty_desc') {
        return (b.difficultyScore || 0) - (a.difficultyScore || 0)
      }
      const aUpdated = a.updatedAt || a.createdAt || ''
      const bUpdated = b.updatedAt || b.createdAt || ''
      return bUpdated.localeCompare(aUpdated)
    })

    const pagination = paginate(candidates, page, size)
    const items = pagination.items.map(buildQuestionListItem)
    const summary = computeQuestionSummary(candidates)

    const availableDifficulties = Array.from(new Set(mockData.questions.map(question => question.difficulty).filter(Boolean)))
    const availableTypes = Array.from(new Set(mockData.questions.map(question => question.type).filter(Boolean)))

    sendResponse(res, 200, {
      items,
      page: pagination.page,
      size: pagination.size,
      total: pagination.total,
      totalPages: pagination.totalPages,
      summary,
      availableFilters: {
        difficulties: availableDifficulties,
        types: availableTypes,
        tags: summary.tagCloud.map(tag => tag.tag)
      }
    }, '获取题库列表成功')
  },

  'GET:/api/questions/recommendations': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const baseId = query.base_id ? Number(query.base_id) : null
    const limit = Math.min(10, Number(query.limit) || 5)

    const items = baseId
      ? getNextPracticeRecommendations(baseId, limit)
      : mockData.questions.slice(0, limit).map(buildQuestionListItem)

    sendResponse(res, 200, {
      items,
      total: items.length
    }, '获取推荐题目成功')
  },

  'GET:/api/questions/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 1])

    if (!id) {
      sendResponse(res, 400, null, '题目 ID 不合法')
      return
    }

    const question = mockData.questions.find(item => item.id === id)
    if (!question) {
      sendResponse(res, 404, null, '题目不存在')
      return
    }

    question.stats = question.stats || {}
    question.stats.viewCount = (question.stats.viewCount || 0) + 1

    const recommendations = getNextPracticeRecommendations(id, 3)

    sendResponse(res, 200, {
      ...question,
      stats: question.stats,
      recommendations,
      relatedTags: question.tags || [],
      practiceSummary: mockData.questionPracticeRecords
        .filter(record => record.questionId === id)
        .slice(-5)
    }, '获取题目详情成功')
  },

  'POST:/api/questions/:id/submit': async (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 1])

    if (!id) {
      sendResponse(res, 400, null, '题目 ID 不合法')
      return
    }

    const question = mockData.questions.find(item => item.id === id)
    if (!question) {
      sendResponse(res, 404, null, '题目不存在')
      return
    }

    try {
      const payload = await parseJSONBody(req)
      const userId = payload.userId || mockData.users[0]?.id || 0
      const timeTaken = typeof payload.timeTaken === 'number' ? payload.timeTaken : null

      const evaluation = evaluateQuestionSubmission(question, payload)

      question.stats = question.stats || { attempts: 0, correctCount: 0, averageScore: 0, likeCount: 0, viewCount: 0 }
      question.stats.attempts = (question.stats.attempts || 0) + 1

      if (evaluation.isCorrect === true) {
        question.stats.correctCount = (question.stats.correctCount || 0) + 1
      }

      if (typeof evaluation.score === 'number') {
        const previousTotal = (question.stats.averageScore || 0) * (question.stats.attempts - 1)
        question.stats.averageScore = Number(((previousTotal + evaluation.score) / question.stats.attempts).toFixed(2))
      } else if (question.stats.attempts > 0) {
        question.stats.averageScore = Number(((question.stats.correctCount || 0) / question.stats.attempts).toFixed(2))
      }

      const record = {
        id: mockData.questionPracticeRecords.length + 1,
        questionId: id,
        userId,
        submittedAt: new Date().toISOString(),
        timeTaken,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        answer: evaluation.normalizedAnswer,
        rawAnswer: payload.answer ?? payload.code ?? payload.answerOptions ?? null,
        metadata: {
          source: payload.source || 'practice',
          device: payload.device || 'web',
          context: payload.context || {},
          tags: payload.tags || []
        }
      }

      mockData.questionPracticeRecords.push(record)

      const recommendations = getNextPracticeRecommendations(id, 3)

      sendResponse(res, 200, {
        evaluation,
        record,
        recommendations,
        questionStats: question.stats
      }, '题目作答已记录')
    } catch (error) {
      if (error.message === 'INVALID_JSON') {
        sendResponse(res, 400, null, '请求体必须为合法的 JSON')
        return
      }
      if (error.message === 'REQUEST_BODY_TOO_LARGE') {
        sendResponse(res, 413, null, '请求体过大')
        return
      }
      console.error('题目作答提交失败:', error)
      sendResponse(res, 500, null, '题目作答提交失败')
    }
  },

  'GET:/api/questions/:id/practice-records': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = Number(segments[segments.length - 2])

    if (!id) {
      sendResponse(res, 400, null, '题目 ID 不合法')
      return
    }

    const records = mockData.questionPracticeRecords
      .filter(record => record.questionId === id)
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))

    sendResponse(res, 200, {
      items: records.slice(0, 20),
      total: records.length
    }, '获取题目练习记录成功')
  },

  'POST:/api/auth/login': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const loginData = JSON.parse(body)
        console.log('登录请求:', loginData)

        // 简单验证
        if (loginData.username && loginData.password) {
          sendResponse(res, 200, {
            token: 'mock_jwt_token_' + Date.now(),
            user: mockData.users[0],
            expires: Date.now() + 24 * 60 * 60 * 1000
          }, '登录成功')
        } else {
          sendResponse(res, 400, null, '用户名或密码不能为空')
        }
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 登出接口
  'POST:/api/auth/logout': (req, res) => {
    console.log('登出请求')
    sendResponse(res, 200, { success: true }, '登出成功')
  },

  // ========== 滑块验证码接口 ==========

  // 获取滑块验证码
  'GET:/api/captcha/get': (req, res) => {
    // 生成随机位置
    const x = Math.floor(Math.random() * (260 - 40)) + 40 // 40-300之间
    const y = Math.floor(Math.random() * 50) + 20 // 20-70之间

    // 生成token
    const token = 'captcha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

    // 存储验证码信息
    mockData.sliderCaptchas.set(token, {
      x,
      y,
      timestamp: Date.now(),
      expires: Date.now() + 2 * 60 * 1000 // 2分钟过期
    })

    console.log(`生成滑块验证码: token=${token}, x=${x}, y=${y}`)

    sendResponse(res, 200, {
      token,
      y, // 前端需要知道 y 坐标来定位拼图块
      // 实际项目中这里应该返回背景图片和拼图块的 base64
      // 为简化实现，我们使用vue3-puzzle-vcode库，它会在前端生成图片
    }, '获取验证码成功')
  },

  // 验证滑块
  'POST:/api/captcha/check': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { token, x } = JSON.parse(body)
        console.log(`验证滑块: token=${token}, x=${x}`)

        if (!token || x === undefined) {
          sendResponse(res, 400, null, '参数错误')
          return
        }

        // 获取验证码信息
        const captcha = mockData.sliderCaptchas.get(token)
        if (!captcha) {
          sendResponse(res, 400, null, '验证码不存在或已过期')
          return
        }

        // 检查是否过期
        if (Date.now() > captcha.expires) {
          mockData.sliderCaptchas.delete(token)
          sendResponse(res, 400, null, '验证码已过期')
          return
        }

        // 验证位置（允许5px误差）
        const tolerance = 5
        const isValid = Math.abs(x - captcha.x) <= tolerance

        if (isValid) {
          // 验证成功，生成验证通过token
          const verifyToken = 'verify_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

          // 存储验证通过状态（5分钟有效）
          mockData.sliderCaptchas.set(verifyToken, {
            verified: true,
            timestamp: Date.now(),
            expires: Date.now() + 5 * 60 * 1000
          })

          // 删除旧的验证码
          mockData.sliderCaptchas.delete(token)

          console.log(`✅ 滑块验证成功: verifyToken=${verifyToken}`)

          sendResponse(res, 200, {
            verifyToken,
            expiresIn: 300
          }, '验证成功')
        } else {
          console.log(`❌ 滑块验证失败: 期望x=${captcha.x}, 实际x=${x}, 误差=${Math.abs(x - captcha.x)}px`)
          sendResponse(res, 400, null, '验证失败，请重试')
        }
      } catch (error) {
        console.error('滑块验证错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 验证 verifyToken 是否有效
  'POST:/api/captcha/verify': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { verifyToken } = JSON.parse(body)

        if (!verifyToken) {
          sendResponse(res, 400, null, '参数错误')
          return
        }

        const verification = mockData.sliderCaptchas.get(verifyToken)

        if (!verification || !verification.verified) {
          sendResponse(res, 400, null, '验证令牌无效')
          return
        }

        if (Date.now() > verification.expires) {
          mockData.sliderCaptchas.delete(verifyToken)
          sendResponse(res, 400, null, '验证令牌已过期')
          return
        }

        sendResponse(res, 200, { valid: true }, '令牌有效')
      } catch (error) {
        console.error('验证令牌错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 用户注册接口
  'POST:/api/auth/register': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { username, phone, code, real_name, password, captchaToken } = JSON.parse(body)
        console.log('用户注册请求:', { username, phone, real_name })

        // 验证滑块验证码（前端vue3-puzzle-vcode完成验证）
        if (!captchaToken) {
          sendResponse(res, 400, null, '请先完成滑块验证')
          return
        }

        // 简化验证：前端滑块组件已完成验证，这里只检查token格式
        if (!captchaToken.startsWith('verified_')) {
          sendResponse(res, 400, null, '滑块验证令牌无效')
          return
        }

        // 验证必填字段
        if (!username || !phone || !code || !password) {
          sendResponse(res, 400, null, '请填写完整的注册信息')
          return
        }

        // 验证用户名格式
        const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/
        if (!usernamePattern.test(username)) {
          sendResponse(res, 400, null, '用户名只能包含字母、数字和下划线，长度3-20个字符')
          return
        }

        // 验证手机号格式
        const phonePattern = /^1[3-9]\d{9}$/
        if (!phonePattern.test(phone)) {
          sendResponse(res, 400, null, '请输入有效的手机号码')
          return
        }

        // 验证验证码
        const cached = mockData.smsCodes.get(phone)
        if (!cached) {
          sendResponse(res, 400, null, '请先获取验证码')
          return
        }

        if (cached.expires < Date.now()) {
          mockData.smsCodes.delete(phone)
          sendResponse(res, 400, null, '验证码已过期')
          return
        }

        if (cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        // 检查用户名是否已存在
        const existingUser = mockData.users.find(u => u.username === username)
        if (existingUser) {
          sendResponse(res, 400, null, '用户名已被使用')
          return
        }

        // 检查手机号是否已注册
        const existingPhone = mockData.users.find(u => u.phone === phone)
        if (existingPhone) {
          sendResponse(res, 400, null, '该手机号已注册')
          return
        }

        // 创建新用户
        const newUser = {
          id: mockData.users.length + 1,
          username,
          phone,
          phoneVerified: true,
          real_name: real_name || username,
          email: null,
          role: 'user',
          createdAt: new Date().toISOString()
        }

        mockData.users.push(newUser)

        // 删除已使用的验证码
        mockData.smsCodes.delete(phone)

        // 生成token
        const token = 'mock_jwt_token_register_' + Date.now()

        console.log('新用户注册成功:', newUser)

        sendResponse(res, 200, {
          token,
          user: newUser,
          expires: Date.now() + 24 * 60 * 60 * 1000
        }, '注册成功')
      } catch (error) {
        console.error('注册错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 发送短信验证码
  'POST:/api/auth/sms/send': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { phone } = JSON.parse(body)
        console.log('发送短信验证码请求:', phone)

        // 验证手机号格式
        const phonePattern = /^1[3-9]\d{9}$/
        if (!phone || !phonePattern.test(phone)) {
          sendResponse(res, 400, null, '请输入有效的手机号码')
          return
        }

        // 检查发送频率（60秒内只能发送一次）
        const cached = mockData.smsCodes.get(phone)
        if (cached && cached.sendAt) {
          const timeSinceSend = Date.now() - cached.sendAt
          if (timeSinceSend < 60 * 1000) { // 60秒内
            const remainingTime = Math.ceil((60 * 1000 - timeSinceSend) / 1000)
            sendResponse(res, 429, { remainingTime }, `请${remainingTime}秒后再试`)
            return
          }
        }

        // 生成6位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expires = Date.now() + 5 * 60 * 1000 // 5分钟过期

        // 存储验证码（模拟Redis）
        mockData.smsCodes.set(phone, {
          code,
          expires,
          sendAt: Date.now()
        })

        console.log(`📱 验证码已生成: ${phone} -> ${code} (5分钟有效)`)

        // 模拟短信发送延迟
        setTimeout(() => {
          sendResponse(res, 200, {
            phone,
            expiresIn: 300, // 秒
            // 开发环境下返回验证码（生产环境应该删除）
            devCode: process.env.NODE_ENV === 'development' ? code : undefined
          }, '验证码发送成功')
        }, 500)
      } catch (error) {
        console.error('发送验证码错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 短信验证码登录
  'POST:/api/auth/login/sms': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { phone, code } = JSON.parse(body)
        console.log('短信验证码登录请求:', phone, code)

        // 验证手机号格式
        const phonePattern = /^1[3-9]\d{9}$/
        if (!phone || !phonePattern.test(phone)) {
          sendResponse(res, 400, null, '请输入有效的手机号码')
          return
        }

        // 验证码校验
        const cached = mockData.smsCodes.get(phone)
        if (!cached) {
          sendResponse(res, 400, null, '验证码不存在或已过期')
          return
        }

        if (cached.expires < Date.now()) {
          mockData.smsCodes.delete(phone)
          sendResponse(res, 400, null, '验证码已过期，请重新获取')
          return
        }

        if (cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        // 验证成功，删除验证码
        mockData.smsCodes.delete(phone)

        // 查找或创建用户
        let user = mockData.users.find(u => u.phone === phone)
        if (!user) {
          // 自动注册新用户
          user = {
            id: mockData.users.length + 1,
            username: `user_${phone.slice(-4)}`,
            phone: phone,
            phoneVerified: true,
            email: null,
            role: 'user'
          }
          mockData.users.push(user)
          console.log('新用户自动注册:', user)
        }

        // 生成token
        const token = 'mock_jwt_token_sms_' + Date.now()

        sendResponse(res, 200, {
          token,
          user,
          expires: Date.now() + 24 * 60 * 60 * 1000
        }, '登录成功')
      } catch (error) {
        console.error('短信登录错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // ========== 忘记密码功能 ==========

  // 发送密码重置验证码
  'POST:/api/auth/password/reset/send': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { phone } = JSON.parse(body)
        console.log('密码重置验证码请求:', phone)

        // 验证手机号格式
        const phonePattern = /^1[3-9]\d{9}$/
        if (!phone || !phonePattern.test(phone)) {
          sendResponse(res, 400, null, '请输入有效的手机号码')
          return
        }

        // 检查发送频率（60秒内只能发送一次）
        const cached = mockData.smsCodes.get(phone)
        if (cached && cached.sendAt) {
          const timeSinceSend = Date.now() - cached.sendAt
          if (timeSinceSend < 60 * 1000) { // 60秒内
            const remainingTime = Math.ceil((60 * 1000 - timeSinceSend) / 1000)
            sendResponse(res, 429, { remainingTime }, `请${remainingTime}秒后再试`)
            return
          }
        }

        // 生成6位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expires = Date.now() + 5 * 60 * 1000 // 5分钟过期

        // 存储验证码
        mockData.smsCodes.set(phone, {
          code,
          expires,
          sendAt: Date.now(),
          type: 'password_reset'
        })

        console.log(`📱 密码重置验证码: ${phone} -> ${code} (5分钟有效)`)

        sendResponse(res, 200, {
          phone,
          expiresIn: 300
        }, '验证码发送成功')
      } catch (error) {
        console.error('发送验证码错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 验证验证码（不重置密码）
  'POST:/api/auth/password/reset/verify': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { phone, code } = JSON.parse(body)
        console.log('验证码校验请求:', phone, code)

        // 验证手机号格式
        const phonePattern = /^1[3-9]\d{9}$/
        if (!phone || !phonePattern.test(phone)) {
          sendResponse(res, 400, null, '请输入有效的手机号码')
          return
        }

        // 验证码校验
        const cached = mockData.smsCodes.get(phone)
        if (!cached || cached.type !== 'password_reset') {
          sendResponse(res, 400, null, '验证码不存在或已过期')
          return
        }

        if (cached.expires < Date.now()) {
          mockData.smsCodes.delete(phone)
          sendResponse(res, 400, null, '验证码已过期，请重新获取')
          return
        }

        if (cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        // 验证成功，不删除验证码（等待重置密码时使用）
        console.log(`✅ 验证码校验成功: ${phone}`)

        sendResponse(res, 200, {
          success: true,
          phone
        }, '验证码验证成功')
      } catch (error) {
        console.error('验证码校验错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 验证验证码并重置密码
  'POST:/api/auth/password/reset': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { phone, code, newPassword } = JSON.parse(body)
        console.log('密码重置请求:', phone, code)

        // 验证手机号格式
        const phonePattern = /^1[3-9]\d{9}$/
        if (!phone || !phonePattern.test(phone)) {
          sendResponse(res, 400, null, '请输入有效的手机号码')
          return
        }

        // 验证密码
        if (!newPassword || newPassword.length < 6) {
          sendResponse(res, 400, null, '密码长度至少6位')
          return
        }

        // 验证码校验
        const cached = mockData.smsCodes.get(phone)
        if (!cached || cached.type !== 'password_reset') {
          sendResponse(res, 400, null, '验证码不存在或已过期')
          return
        }

        if (cached.expires < Date.now()) {
          mockData.smsCodes.delete(phone)
          sendResponse(res, 400, null, '验证码已过期，请重新获取')
          return
        }

        if (cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        // 验证成功，删除验证码
        mockData.smsCodes.delete(phone)

        // 查找用户并更新密码（实际应用中需要加密）
        let user = mockData.users.find(u => u.phone === phone)
        if (!user) {
          sendResponse(res, 404, null, '该手机号未注册')
          return
        }

        // 模拟密码更新（实际应该加密存储）
        console.log(`✅ 用户 ${user.username} 密码已重置`)

        sendResponse(res, 200, {
          success: true,
          message: '密码重置成功，请使用新密码登录'
        }, '密码重置成功')
      } catch (error) {
        console.error('密码重置错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // ========== 微信OAuth登录 ==========

  // 生成微信授权URL
  'GET:/api/auth/oauth/wechat/authorize': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    // 生成随机state（防CSRF）
    const state = 'wx_' + Math.random().toString(36).substring(2, 15) + Date.now()
    const redirectUrl = query.redirect || '/home'

    // 存储state（实际应用中存Redis，这里用Map模拟）
    mockData.oauthStates.set(state, {
      provider: 'wechat',
      createdAt: Date.now(),
      redirectUrl,
      expires: Date.now() + 10 * 60 * 1000 // 10分钟有效
    })

    console.log(`生成微信授权state: ${state}`)

    // 模拟微信授权URL（实际环境需要真实的微信AppID）
    const mockAppId = 'mock_wechat_appid_12345'
    const callbackUrl = encodeURIComponent('http://localhost:5174/auth/callback/wechat')
    const authorizeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${mockAppId}&redirect_uri=${callbackUrl}&response_type=code&scope=snsapi_login&state=${state}`

    sendResponse(res, 200, {
      authorizeUrl,
      state,
      qrCodeUrl: `http://localhost:3001/api/auth/oauth/wechat/qrcode?state=${state}`,
      expiresIn: 600
    }, '微信授权URL生成成功')
  },

  // 生成微信二维码（开发环境）
  'GET:/api/auth/oauth/wechat/qrcode': async (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const { state } = parsedUrl.query

    if (!state || !mockData.oauthStates.has(state)) {
      sendResponse(res, 400, null, '无效的state参数')
      return
    }

    // 模拟扫码URL（开发环境）
    const mockScanUrl = `http://localhost:3001/api/auth/oauth/wechat/mock-scan?state=${state}`

    try {
      // 生成真实的二维码图片（Base64格式）
      const qrCodeDataUrl = await QRCode.toDataURL(mockScanUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      sendResponse(res, 200, {
        qrCodeImage: qrCodeDataUrl, // Base64图片：data:image/png;base64,iVBORw0KG...
        qrContent: mockScanUrl,
        state,
        tip: '请使用微信扫描二维码登录'
      }, '二维码生成成功')
    } catch (error) {
      console.error('生成二维码失败:', error)
      sendResponse(res, 500, null, '二维码生成失败')
    }
  },

  // 模拟扫码授权（开发环境）
  'GET:/api/auth/oauth/wechat/mock-scan': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const { state } = parsedUrl.query

    if (!state || !mockData.oauthStates.has(state)) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>无效的授权请求</h1><p>state参数无效或已过期</p>')
      return
    }

    // 生成模拟授权码
    const code = 'mock_wx_code_' + Date.now()
    const callbackUrl = `http://localhost:5174/auth/callback/wechat?code=${code}&state=${state}`

    console.log(`模拟微信扫码授权: state=${state}, code=${code}`)

    // 返回HTML页面自动跳转
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>微信授权 - 开发模式</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
          }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #333; margin: 20px 0; }
          p { color: #666; line-height: 1.6; }
          .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
          .countdown { font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>微信授权成功</h1>
          <p>正在跳转回应用...</p>
          <p class="countdown" id="countdown">3</p>
          <button class="btn" onclick="redirect()">立即跳转</button>
        </div>
        <script>
          let count = 3;
          const countdownEl = document.getElementById('countdown');
          const timer = setInterval(() => {
            count--;
            countdownEl.textContent = count;
            if (count <= 0) {
              clearInterval(timer);
              redirect();
            }
          }, 1000);

          function redirect() {
            window.location.href = '${callbackUrl}';
          }
        </script>
      </body>
      </html>
    `)
  },

  // 微信OAuth回调处理
  'POST:/api/auth/oauth/wechat/callback': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { code, state } = JSON.parse(body)
        console.log('微信回调请求:', { code, state })

        // 验证state
        const stateData = mockData.oauthStates.get(state)
        if (!stateData) {
          sendResponse(res, 400, null, 'State参数无效或已过期')
          return
        }

        if (stateData.expires < Date.now()) {
          mockData.oauthStates.delete(state)
          sendResponse(res, 400, null, 'State已过期')
          return
        }

        // 删除已使用的state
        mockData.oauthStates.delete(state)

        // 模拟用微信code换取access_token和openid
        const mockOpenId = 'wx_openid_' + Math.random().toString(36).substring(2, 10)
        const mockUnionId = 'wx_unionid_' + Math.random().toString(36).substring(2, 10)
        const mockAccessToken = 'wx_access_token_' + Date.now()

        // 模拟获取微信用户信息
        const wechatUserInfo = {
          openid: mockOpenId,
          unionid: mockUnionId,
          nickname: '微信用户' + Math.floor(Math.random() * 1000),
          headimgurl: 'https://thirdwx.qlogo.cn/mmopen/mock_avatar.jpg',
          sex: 1,
          country: '中国',
          province: '广东',
          city: '深圳'
        }

        // 存储微信用户信息
        mockData.wechatUsers.set(mockOpenId, wechatUserInfo)

        console.log('模拟微信用户信息:', wechatUserInfo)

        // 查找是否已绑定系统用户
        let systemUser = mockData.users.find(u => {
          // 实际应用中应该查询user_oauth_bindings表
          return u.wechatOpenId === mockOpenId
        })

        if (!systemUser) {
          // 自动注册新用户
          systemUser = {
            id: mockData.users.length + 1,
            username: 'wx_' + mockOpenId.substring(10),
            wechatOpenId: mockOpenId,
            wechatUnionId: mockUnionId,
            nickname: wechatUserInfo.nickname,
            avatar: wechatUserInfo.headimgurl,
            email: null,
            phone: null,
            phoneVerified: false,
            role: 'user'
          }
          mockData.users.push(systemUser)
          console.log('微信用户自动注册:', systemUser)
        }

        // 生成系统token
        const token = 'mock_jwt_token_wechat_' + Date.now()

        sendResponse(res, 200, {
          token,
          user: systemUser,
          wechatInfo: {
            openid: wechatUserInfo.openid,
            unionid: wechatUserInfo.unionid,
            nickname: wechatUserInfo.nickname,
            avatar: wechatUserInfo.headimgurl
          },
          isNewUser: mockData.users[mockData.users.length - 1].id === systemUser.id,
          expires: Date.now() + 24 * 60 * 60 * 1000
        }, '微信登录成功')
      } catch (error) {
        console.error('微信回调错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // ========== QQ OAuth登录 ==========

  // 生成QQ授权URL
  'GET:/api/auth/oauth/qq/authorize': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    const state = 'qq_' + Math.random().toString(36).substring(2, 15) + Date.now()
    const redirectUrl = query.redirect || '/home'

    mockData.oauthStates.set(state, {
      provider: 'qq',
      createdAt: Date.now(),
      redirectUrl,
      expires: Date.now() + 10 * 60 * 1000
    })

    console.log(`生成QQ授权state: ${state}`)

    const mockAppId = 'mock_qq_appid_67890'
    const callbackUrl = encodeURIComponent('http://localhost:5174/auth/callback/qq')
    const authorizeUrl = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${mockAppId}&redirect_uri=${callbackUrl}&state=${state}`

    sendResponse(res, 200, {
      authorizeUrl,
      state,
      qrCodeUrl: `http://localhost:3001/api/auth/oauth/qq/qrcode?state=${state}`,
      expiresIn: 600
    }, 'QQ授权URL生成成功')
  },

  // 生成QQ二维码（开发环境）
  'GET:/api/auth/oauth/qq/qrcode': async (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const { state } = parsedUrl.query

    if (!state || !mockData.oauthStates.has(state)) {
      sendResponse(res, 400, null, '无效的state参数')
      return
    }

    const mockScanUrl = `http://localhost:3001/api/auth/oauth/qq/mock-scan?state=${state}`

    try {
      // 生成真实的二维码图片（Base64格式）
      const qrCodeDataUrl = await QRCode.toDataURL(mockScanUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#12B7F5', // QQ蓝色
          light: '#FFFFFF'
        }
      })

      sendResponse(res, 200, {
        qrCodeImage: qrCodeDataUrl,
        qrContent: mockScanUrl,
        state,
        tip: '请使用手机QQ扫描二维码登录'
      }, 'QQ二维码生成成功')
    } catch (error) {
      console.error('生成二维码失败:', error)
      sendResponse(res, 500, null, '二维码生成失败')
    }
  },

  // 模拟QQ扫码授权
  'GET:/api/auth/oauth/qq/mock-scan': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const { state } = parsedUrl.query

    if (!state || !mockData.oauthStates.has(state)) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>无效的授权请求</h1>')
      return
    }

    const code = 'mock_qq_code_' + Date.now()
    const callbackUrl = `http://localhost:5174/auth/callback/qq?code=${code}&state=${state}`

    console.log(`模拟QQ扫码授权: state=${state}, code=${code}`)

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>QQ授权 - 开发模式</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #12B7F5 0%, #0C8EC7 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
          }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #333; margin: 20px 0; }
          p { color: #666; line-height: 1.6; }
          .btn {
            background: linear-gradient(135deg, #12B7F5 0%, #0C8EC7 100%);
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
          .countdown { font-weight: bold; color: #12B7F5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>QQ授权成功</h1>
          <p>正在跳转回应用...</p>
          <p class="countdown" id="countdown">3</p>
          <button class="btn" onclick="redirect()">立即跳转</button>
        </div>
        <script>
          let count = 3;
          const countdownEl = document.getElementById('countdown');
          const timer = setInterval(() => {
            count--;
            countdownEl.textContent = count;
            if (count <= 0) {
              clearInterval(timer);
              redirect();
            }
          }, 1000);

          function redirect() {
            window.location.href = '${callbackUrl}';
          }
        </script>
      </body>
      </html>
    `)
  },

  // QQ OAuth回调处理
  'POST:/api/auth/oauth/qq/callback': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const { code, state } = JSON.parse(body)
        console.log('QQ回调请求:', { code, state })

        const stateData = mockData.oauthStates.get(state)
        if (!stateData) {
          sendResponse(res, 400, null, 'State参数无效或已过期')
          return
        }

        if (stateData.expires < Date.now()) {
          mockData.oauthStates.delete(state)
          sendResponse(res, 400, null, 'State已过期')
          return
        }

        mockData.oauthStates.delete(state)

        const mockOpenId = 'qq_openid_' + Math.random().toString(36).substring(2, 10)
        const mockAccessToken = 'qq_access_token_' + Date.now()

        const qqUserInfo = {
          openid: mockOpenId,
          nickname: 'QQ用户' + Math.floor(Math.random() * 1000),
          figureurl_qq_2: 'https://qlogo.qq.com/mock_avatar.jpg',
          gender: '男',
          province: '广东',
          city: '深圳'
        }

        mockData.qqUsers.set(mockOpenId, qqUserInfo)
        console.log('模拟QQ用户信息:', qqUserInfo)

        let systemUser = mockData.users.find(u => u.qqOpenId === mockOpenId)

        if (!systemUser) {
          systemUser = {
            id: mockData.users.length + 1,
            username: 'qq_' + mockOpenId.substring(9),
            qqOpenId: mockOpenId,
            nickname: qqUserInfo.nickname,
            avatar: qqUserInfo.figureurl_qq_2,
            email: null,
            phone: null,
            phoneVerified: false,
            role: 'user'
          }
          mockData.users.push(systemUser)
          console.log('QQ用户自动注册:', systemUser)
        }

        const token = 'mock_jwt_token_qq_' + Date.now()

        sendResponse(res, 200, {
          token,
          user: systemUser,
          qqInfo: {
            openid: qqUserInfo.openid,
            nickname: qqUserInfo.nickname,
            avatar: qqUserInfo.figureurl_qq_2
          },
          isNewUser: mockData.users[mockData.users.length - 1].id === systemUser.id,
          expires: Date.now() + 24 * 60 * 60 * 1000
        }, 'QQ登录成功')
      } catch (error) {
        console.error('QQ回调错误:', error)
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 面试相关
  'POST:/api/interview/generate-question': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body)
        console.log('问题生成请求:', requestData)

        const question = mockData.questions[Math.floor(Math.random() * mockData.questions.length)]

        sendResponse(res, 200, {
          ...question,
          generatedAt: new Date().toISOString(),
          source: 'mock_api'
        }, '问题生成成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  'POST:/api/interview/generate-question-smart': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body)
        console.log('智能问题生成请求:', requestData)

        const question = mockData.questions[Math.floor(Math.random() * mockData.questions.length)]

        sendResponse(res, 200, {
          ...question,
          generatedAt: new Date().toISOString(),
          source: 'mock_smart_api',
          smartGeneration: true,
          algorithmVersion: 'v2.0',
          confidenceScore: 0.85 + Math.random() * 0.15
        }, '智能问题生成成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  'POST:/api/interview/analyze': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body)
        console.log('回答分析请求:', requestData)

        // 模拟AI分析结果
        const mockAnalysis = {
          overallScore: Math.floor(70 + Math.random() * 25), // 70-95分
          dimensions: {
            technical: Math.floor(65 + Math.random() * 30),
            communication: Math.floor(70 + Math.random() * 25),
            logic: Math.floor(68 + Math.random() * 27),
            comprehensive: Math.floor(72 + Math.random() * 23),
            innovation: Math.floor(60 + Math.random() * 35)
          },
          feedback: '回答思路清晰，技术理解到位，建议在实际应用场景方面多举例说明。',
          suggestions: [
            '可以结合具体的项目经验来说明',
            '建议补充相关的最佳实践',
            '可以提及一些常见的陷阱和解决方案'
          ],
          analyzedAt: new Date().toISOString(),
          processingTime: Math.floor(1000 + Math.random() * 2000) // 1-3秒
        }

        sendResponse(res, 200, mockAnalysis, '回答分析完成')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  'POST:/api/interview/analyze-advanced': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body)
        console.log('五维度分析请求:', requestData)

        // 模拟高级AI分析结果
        const mockAnalysisAdvanced = {
          overallScore: Math.floor(75 + Math.random() * 20), // 75-95分
          dimensions: {
            technical: Math.floor(70 + Math.random() * 25),
            communication: Math.floor(75 + Math.random() * 20),
            logic: Math.floor(72 + Math.random() * 23),
            comprehensive: Math.floor(78 + Math.random() * 17),
            innovation: Math.floor(68 + Math.random() * 27)
          },
          detailAnalysis: {
            strengths: [
              '技术概念理解准确',
              '表达逻辑清晰',
              '回答结构完整'
            ],
            weaknesses: [
              '实际应用场景举例不足',
              '深度分析可进一步加强'
            ],
            improvements: [
              '建议结合具体项目经验',
              '可以补充相关技术对比',
              '增加最佳实践说明'
            ]
          },
          feedback: '回答展现出良好的技术基础，逻辑思维清晰。建议在实际应用和深度分析方面进一步完善。',
          suggestions: [
            '结合具体的项目场景进行说明',
            '补充技术方案的优缺点对比',
            '提及相关的最佳实践和注意事项',
            '可以分享一些实际遇到的问题和解决方案'
          ],
          smartGeneration: true,
          algorithmVersion: 'v3.0',
          confidenceScore: 0.88 + Math.random() * 0.12,
          analyzedAt: new Date().toISOString(),
          processingTime: Math.floor(1500 + Math.random() * 2500) // 1.5-4秒
        }

        sendResponse(res, 200, mockAnalysisAdvanced, '五维度分析完成')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // Dify 工作流调用接口
  'POST:/api/ai/dify-workflow': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body)
        console.log('🔄 收到 Dify 工作流请求:', requestData)

        // 调用 Dify 工作流
        const result = await callDifyWorkflow(requestData)

        if (result.success) {
          console.log('✅ Dify 工作流调用成功')
          sendResponse(res, 200, result.data, '调用成功')
        } else {
          console.error('❌ Dify 工作流调用失败:', result.error)
          sendResponse(res, 500, null, result.error.message)
        }
      } catch (error) {
        console.error('❌ Dify 路由处理失败:', error)
        if (error.error) {
          sendResponse(res, 500, null, error.error.message)
        } else {
          sendResponse(res, 400, null, '请求数据格式错误')
        }
      }
    })
  },

  // ============ Redis 会话存储 API ============

  // 保存会话数据
  'POST:/api/interview/sessions': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body)
        const { sessionId, sessionData } = requestData

        if (!sessionId) {
          sendResponse(res, 400, null, '缺少必需参数: sessionId')
          return
        }

        if (!sessionData) {
          sendResponse(res, 400, null, '缺少必需参数: sessionData')
          return
        }

        console.log('💾 保存会话数据:', { sessionId, dataKeys: Object.keys(sessionData) })

        const success = await redisClient.saveSession(sessionId, sessionData)

        if (success) {
          sendResponse(res, 200, { sessionId, saved: true }, '会话数据保存成功')
        } else {
          sendResponse(res, 500, null, '会话数据保存失败')
        }
      } catch (error) {
        console.error('❌ 保存会话失败:', error)
        sendResponse(res, 400, null, '请求数据格式错误: ' + error.message)
      }
    })
  },

  // 加载会话数据
  'GET:/api/interview/sessions/:sessionId': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const segments = parsedUrl.pathname.split('/')
      const sessionId = segments[segments.length - 1]

      if (!sessionId) {
        sendResponse(res, 400, null, '缺少会话ID')
        return
      }

      console.log('📂 加载会话数据:', sessionId)

      const sessionData = await redisClient.loadSession(sessionId)

      if (sessionData) {
        sendResponse(res, 200, { sessionId, sessionData }, '会话数据加载成功')
      } else {
        sendResponse(res, 404, null, '会话不存在或已过期')
      }
    } catch (error) {
      console.error('❌ 加载会话失败:', error)
      sendResponse(res, 500, null, '加载会话失败: ' + error.message)
    }
  },

  // 删除会话数据
  'DELETE:/api/interview/sessions/:sessionId': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const segments = parsedUrl.pathname.split('/')
      const sessionId = segments[segments.length - 1]

      if (!sessionId) {
        sendResponse(res, 400, null, '缺少会话ID')
        return
      }

      console.log('🗑️  删除会话数据:', sessionId)

      const success = await redisClient.deleteSession(sessionId)

      if (success) {
        sendResponse(res, 200, { sessionId, deleted: true }, '会话数据删除成功')
      } else {
        sendResponse(res, 500, null, '会话数据删除失败')
      }
    } catch (error) {
      console.error('❌ 删除会话失败:', error)
      sendResponse(res, 500, null, '删除会话失败: ' + error.message)
    }
  },

  // 更新会话TTL（延长过期时间）
  'PUT:/api/interview/sessions/:sessionId/touch': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const segments = parsedUrl.pathname.split('/')
      const sessionId = segments[3] // /api/interview/sessions/:sessionId/touch

      if (!sessionId) {
        sendResponse(res, 400, null, '缺少会话ID')
        return
      }

      console.log('⏱️  更新会话TTL:', sessionId)

      const success = await redisClient.touchSession(sessionId)

      if (success) {
        sendResponse(res, 200, { sessionId, touched: true }, '会话TTL更新成功')
      } else {
        sendResponse(res, 404, null, '会话不存在')
      }
    } catch (error) {
      console.error('❌ 更新会话TTL失败:', error)
      sendResponse(res, 500, null, '更新会话TTL失败: ' + error.message)
    }
  },

  // 获取所有会话ID列表（用于管理和调试）
  'GET:/api/interview/sessions': async (req, res) => {
    try {
      console.log('📋 获取所有会话ID')

      const sessionIds = await redisClient.getAllSessionIds()

      sendResponse(res, 200, { sessionIds, total: sessionIds.length }, '获取会话列表成功')
    } catch (error) {
      console.error('❌ 获取会话列表失败:', error)
      sendResponse(res, 500, null, '获取会话列表失败: ' + error.message)
    }
  },

  // 统计相关接口
  'GET:/api/users/statistics': (req, res) => {
    const url = require('url')
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    console.log('用户统计查询:', query)

    // 模拟根据查询参数返回不同数据
    const timeRange = query.timeRange || 'all'
    const detail = query.detail !== 'false'

    let statisticsData = { ...mockData.statistics }

    // 确保返回的数据结构与前端期望一致
    statisticsData = {
      ...statisticsData,
      // 确保有formatted字段用于前端显示
      formatted: {
        interviewCount: {
          value: statisticsData.summary.interviewCount,
          formatted: `${statisticsData.summary.interviewCount}次`
        },
        practiceTime: {
          value: statisticsData.summary.totalPracticeTime,
          formatted: formatTime(statisticsData.summary.totalPracticeTime)
        },
        averageScore: {
          value: statisticsData.summary.averageScore,
          formatted: `${statisticsData.summary.averageScore.toFixed(1)}分`
        },
        rank: {
          level: statisticsData.summary.rank.level,
          percentile: statisticsData.summary.rank.percentile,
          formatted: `${statisticsData.summary.rank.level} (前${(100 - statisticsData.summary.rank.percentile).toFixed(1)}%)`
        }
      }
    }

    // 根据时间范围过滤数据
    if (timeRange !== 'all') {
      // 这里可以根据timeRange过滤时间序列数据
      console.log(`过滤时间范围: ${timeRange}`)
    }

    if (!detail) {
      // 如果不需要详细信息，只返回summary
      statisticsData = {
        summary: statisticsData.summary,
        formatted: statisticsData.formatted
      }
    }

    sendResponse(res, 200, statisticsData, '获取统计数据成功')
  },

  'POST:/api/users/statistics/events': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const eventData = JSON.parse(body)
        console.log('统计事件记录:', eventData)

        // 模拟更新统计数据（实际应用中会写入数据库）
        if (eventData.type === 'interview_completed') {
          console.log('面试完成事件已记录')
          // 这里可以更新mockData.statistics
        }

        sendResponse(res, 200, { recorded: true }, '事件记录成功')
      } catch (error) {
        sendResponse(res, 400, null, '事件数据格式错误')
      }
    })
  },

  'GET:/api/users/leaderboard': (req, res) => {
    const url = require('url')
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    console.log('排行榜查询:', query)

    const limit = parseInt(query.limit) || 10
    const timeRange = query.timeRange || 'monthly'

    // 根据限制返回排行榜数据
    const leaderboardData = mockData.leaderboard.slice(0, limit)

    sendResponse(res, 200, {
      leaderboard: leaderboardData,
      timeRange,
      totalCount: mockData.leaderboard.length,
      lastUpdated: new Date().toISOString()
    }, '获取排行榜成功')
  },

  'GET:/api/users/trends': (req, res) => {
    const url = require('url')
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    console.log('趋势数据查询:', query)

    const timeRange = query.timeRange || 'monthly'

    // 根据时间范围返回相应的趋势数据
    const trendsData = {
      trends: mockData.statistics.timeSeriesData[timeRange] || mockData.statistics.timeSeriesData.monthly,
      insights: mockData.statistics.insights,
      summary: {
        totalPeriods: mockData.statistics.timeSeriesData.monthly.length,
        averageGrowthRate: 0.12, // 12% 增长率
        bestPeriod: mockData.statistics.timeSeriesData.monthly[mockData.statistics.timeSeriesData.monthly.length - 1],
        timeRange
      }
    }

    sendResponse(res, 200, trendsData, '获取趋势数据成功')
  },

  // ============= 用户个人设置相关 API =============

  // 更新个人资料
  'PUT:/api/users/profile': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const updates = JSON.parse(body)
        const user = mockData.users[0]

        // 更新允许的字段
        if (updates.nickname !== undefined) user.nickname = updates.nickname
        if (updates.gender !== undefined) user.gender = updates.gender
        if (updates.birthday !== undefined) user.birthday = updates.birthday
        if (updates.signature !== undefined) user.signature = updates.signature
        if (updates.avatar !== undefined) user.avatar = updates.avatar

        console.log('✅ 个人资料已更新:', updates)
        sendResponse(res, 200, user, '个人资料更新成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 上传头像
  'POST:/api/users/avatar': (req, res) => {
    // 模拟文件上传
    const mockAvatarUrl = `https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png?t=${Date.now()}`
    mockData.users[0].avatar = mockAvatarUrl

    console.log('✅ 头像已上传:', mockAvatarUrl)
    sendResponse(res, 200, { url: mockAvatarUrl }, '头像上传成功')
  },

  // 修改密码
  'PUT:/api/users/password': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { oldPassword, code, newPassword } = JSON.parse(body)

        if (!oldPassword || !code || !newPassword) {
          sendResponse(res, 400, null, '缺少必要参数')
          return
        }

        if (newPassword.length < 6) {
          sendResponse(res, 400, null, '新密码长度不能小于6位')
          return
        }

        // 验证验证码
        const user = mockData.users[0]
        const cached = mockData.smsCodes.get(user.phone)

        if (!cached || cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        if (cached.expires < Date.now()) {
          mockData.smsCodes.delete(user.phone)
          sendResponse(res, 400, null, '验证码已过期')
          return
        }

        // 验证码使用后删除
        mockData.smsCodes.delete(user.phone)

        console.log('✅ 密码已修改（已验证验证码）')
        sendResponse(res, 200, {}, '密码修改成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 发送手机验证码
  'POST:/api/users/phone/code': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { phone } = JSON.parse(body)
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        mockData.smsCodes.set(phone, {
          code,
          expires: Date.now() + 5 * 60 * 1000,
          sendAt: Date.now(),
          type: 'bind_phone'
        })

        console.log(`📱 手机验证码: ${phone} -> ${code}`)
        sendResponse(res, 200, { expiresIn: 300 }, '验证码已发送')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 绑定手机号
  'POST:/api/users/phone/bind': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { phone, code } = JSON.parse(body)
        const cached = mockData.smsCodes.get(phone)

        if (!cached || cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        if (cached.expires < Date.now()) {
          sendResponse(res, 400, null, '验证码已过期')
          return
        }

        mockData.users[0].phone = phone
        mockData.smsCodes.delete(phone)

        console.log('✅ 手机号已绑定:', phone)
        sendResponse(res, 200, {}, '手机号绑定成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 发送邮箱验证码
  'POST:/api/users/email/code': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body)
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // 存储到smsCodes（复用）
        mockData.smsCodes.set(email, {
          code,
          expires: Date.now() + 5 * 60 * 1000,
          sendAt: Date.now(),
          type: 'bind_email'
        })

        console.log(`📧 邮箱验证码: ${email} -> ${code}`)
        sendResponse(res, 200, { expiresIn: 300 }, '验证码已发送')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 绑定邮箱
  'POST:/api/users/email/bind': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { email, code } = JSON.parse(body)
        const cached = mockData.smsCodes.get(email)

        if (!cached || cached.code !== code) {
          sendResponse(res, 400, null, '验证码错误')
          return
        }

        if (cached.expires < Date.now()) {
          sendResponse(res, 400, null, '验证码已过期')
          return
        }

        mockData.users[0].email = email
        mockData.smsCodes.delete(email)

        console.log('✅ 邮箱已绑定:', email)
        sendResponse(res, 200, {}, '邮箱绑定成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 更新隐私设置
  'PUT:/api/users/privacy': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const privacy = JSON.parse(body)
        mockData.users[0].privacy = { ...mockData.users[0].privacy, ...privacy }

        console.log('✅ 隐私设置已更新:', privacy)
        sendResponse(res, 200, mockData.users[0].privacy, '隐私设置更新成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 更新通知设置
  'PUT:/api/users/notification': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const notification = JSON.parse(body)
        mockData.users[0].notification = { ...mockData.users[0].notification, ...notification }

        console.log('✅ 通知设置已更新:', notification)
        sendResponse(res, 200, mockData.users[0].notification, '通知设置更新成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 更新界面设置
  'PUT:/api/users/preferences': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const preferences = JSON.parse(body)
        mockData.users[0].preferences = { ...mockData.users[0].preferences, ...preferences }

        console.log('✅ 界面设置已更新:', preferences)
        sendResponse(res, 200, mockData.users[0].preferences, '界面设置更新成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 开启两步验证
  'POST:/api/users/2fa/enable': (req, res) => {
    mockData.users[0].twoFactorEnabled = true
    console.log('✅ 两步验证已开启')
    sendResponse(res, 200, {}, '两步验证已开启')
  },

  // 关闭两步验证
  'POST:/api/users/2fa/disable': (req, res) => {
    mockData.users[0].twoFactorEnabled = false
    console.log('✅ 两步验证已关闭')
    sendResponse(res, 200, {}, '两步验证已关闭')
  },

  // 获取登录设备列表
  'GET:/api/users/devices': (req, res) => {
    const devices = [
      {
        id: 1,
        deviceName: 'Chrome on Windows',
        location: '北京市',
        lastLoginTime: '2025-10-02 10:30:00',
        isCurrent: true
      },
      {
        id: 2,
        deviceName: 'Safari on iPhone',
        location: '上海市',
        lastLoginTime: '2025-10-01 15:20:00',
        isCurrent: false
      }
    ]

    sendResponse(res, 200, devices, '获取设备列表成功')
  },

  // 移除登录设备
  'DELETE:/api/users/devices/:id': (req, res) => {
    const deviceId = req.url.split('/').pop()
    console.log('✅ 设备已下线:', deviceId)
    sendResponse(res, 200, {}, '设备已下线')
  },

  // 注销账户
  'POST:/api/users/account/delete': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body)

        if (!password) {
          sendResponse(res, 400, null, '请输入密码')
          return
        }

        console.log('⚠️ 账户已注销')
        sendResponse(res, 200, {}, '账户已注销')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // ==================== 社区中心 API ====================

  // 获取社区题目列表
  'GET:/api/contributions/questions': (req, res) => {
    const mockQuestions = [
      {
        id: 1,
        title: '实现一个防抖函数',
        description: '手写实现防抖函数，要求支持立即执行模式',
        difficulty: '中等',
        category: 'frontend',
        tags: ['JavaScript', 'Performance'],
        author: '张三',
        authorId: 1,
        views: 1234,
        discussions: 45,
        favorites: 89,
        status: 'approved',
        publishedAt: '2024-10-01',
        bounty: null
      },
      {
        id: 2,
        title: 'Vue3 响应式原理解析',
        description: '深入理解 Vue3 的 Proxy 响应式实现机制',
        difficulty: '困难',
        category: 'frontend',
        tags: ['Vue.js', 'TypeScript'],
        author: '李四',
        authorId: 2,
        views: 2341,
        discussions: 78,
        favorites: 156,
        status: 'approved',
        publishedAt: '2024-09-28',
        bounty: { points: 100, deadline: '2024-10-15' }
      }
    ]

    sendResponse(res, 200, { items: mockQuestions, total: mockQuestions.length })
  },

  // 获取题目详情
  'GET:/api/contributions/questions/:id': (req, res) => {
    const questionId = req.url.split('/').pop()
    const mockQuestion = {
      id: parseInt(questionId),
      title: '实现一个防抖函数',
      content: '# 题目描述\n\n请实现一个防抖函数 `debounce`，要求：\n\n1. 支持立即执行模式\n2. 支持取消功能\n3. 支持返回值\n\n## 示例\n\n```javascript\nconst debounced = debounce(fn, 300)\ndebounced() // 调用\n```',
      difficulty: '中等',
      category: 'frontend',
      tags: ['JavaScript', 'Performance'],
      author: '张三',
      authorId: 1,
      views: 1234,
      discussions: 45,
      favorites: 89,
      isFavorited: false,
      status: 'approved',
      publishedAt: '2024-10-01',
      bounty: null
    }

    sendResponse(res, 200, mockQuestion)
  },

  // 收藏题目
  'POST:/api/contributions/questions/:id/favorite': (req, res) => {
    sendResponse(res, 200, {}, '收藏成功')
  },

  // 取消收藏
  'DELETE:/api/contributions/questions/:id/favorite': (req, res) => {
    sendResponse(res, 200, {}, '已取消收藏')
  },

  // 获取我的收藏
  'GET:/api/contributions/favorites': (req, res) => {
    const mockFavorites = [
      {
        id: 1,
        title: '实现一个防抖函数',
        description: '手写实现防抖函数，要求支持立即执行模式',
        difficulty: '中等',
        category: 'frontend',
        views: 1234,
        discussions: 45,
        favoritedAt: '2024-10-02'
      }
    ]

    sendResponse(res, 200, { items: mockFavorites, total: mockFavorites.length })
  },

  // 发布讨论
  'POST:/api/contributions/questions/:id/discussions': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      sendResponse(res, 200, { id: Date.now() }, '发布成功')
    })
  },

  // 获取讨论列表
  'GET:/api/contributions/questions/:id/discussions': (req, res) => {
    const mockDiscussions = [
      {
        id: 1,
        author: '王五',
        authorId: 3,
        content: '这个实现很不错，学习了！',
        likes: 12,
        isLiked: false,
        createdAt: '2分钟前',
        replies: [
          {
            id: 101,
            author: '张三',
            content: '谢谢鼓励！',
            createdAt: '1分钟前'
          }
        ]
      }
    ]

    sendResponse(res, 200, { items: mockDiscussions, total: mockDiscussions.length })
  },

  // 点赞讨论
  'POST:/api/contributions/discussions/:id/like': (req, res) => {
    sendResponse(res, 200, {}, '点赞成功')
  },

  // 回复讨论
  'POST:/api/contributions/discussions/:id/replies': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      sendResponse(res, 200, { id: Date.now() }, '回复成功')
    })
  },

  // 获取个性化推荐
  'GET:/api/contributions/recommendations': (req, res) => {
    const mockRecommendations = [
      {
        id: 1,
        title: '实现一个防抖函数',
        description: '手写实现防抖函数，要求支持立即执行模式',
        difficulty: '中等',
        views: 1234,
        discussions: 45,
        favorites: 89,
        matchScore: 95
      },
      {
        id: 2,
        title: 'Vue3 响应式原理解析',
        description: '深入理解 Vue3 的 Proxy 响应式实现机制',
        difficulty: '困难',
        views: 2341,
        discussions: 78,
        favorites: 156,
        matchScore: 92
      }
    ]

    sendResponse(res, 200, { items: mockRecommendations })
  },

  // 关注用户
  'POST:/api/contributions/users/:id/follow': (req, res) => {
    sendResponse(res, 200, {}, '关注成功')
  },

  // 取消关注
  'DELETE:/api/contributions/users/:id/follow': (req, res) => {
    sendResponse(res, 200, {}, '已取消关注')
  },

  // 发布悬赏
  'POST:/api/contributions/questions/:id/bounty': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      sendResponse(res, 200, {}, '悬赏发布成功')
    })
  },

  // 获取通知列表
  'GET:/api/notifications': (req, res) => {
    const mockNotifications = [
      {
        id: 1,
        type: 'comment',
        title: '新评论',
        content: '张三评论了你的题目《实现防抖函数》',
        link: '/contributions/question/1',
        read: false,
        createdAt: '2分钟前'
      }
    ]

    sendResponse(res, 200, { items: mockNotifications, unreadCount: 1 })
  },

  // 标记通知已读
  'PUT:/api/notifications/:id/read': (req, res) => {
    sendResponse(res, 200, {}, '标记成功')
  },

  // 全部标记已读
  'PUT:/api/notifications/read-all': (req, res) => {
    sendResponse(res, 200, {}, '全部标记成功')
  },

  // 获取用户积分
  'GET:/api/gamification/points': (req, res) => {
    const mockPoints = {
      total: 256,
      available: 256,
      used: 0,
      level: 2,
      levelName: '助理',
      nextLevelPoints: 300,
      progress: 52
    }

    sendResponse(res, 200, mockPoints)
  },

  // 获取用户徽章
  'GET:/api/gamification/badges': (req, res) => {
    const mockBadges = [
      {
        id: 'first_contribution',
        name: '首次贡献',
        description: '提交第一个题目',
        icon: '🎉',
        earnedAt: '2024-01-15'
      }
    ]

    sendResponse(res, 200, { items: mockBadges })
  },

  // 每日签到
  'POST:/api/gamification/signin': (req, res) => {
    sendResponse(res, 200, {
      points: 5,
      consecutiveDays: 3,
      totalDays: 15
    }, '签到成功')
  },

  // ==================== AI 自动出题系统 ====================

  // AI 生成题目
  'POST:/api/ai/generate-questions': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        // 模拟生成延迟（实际应调用 AI API）
        setTimeout(() => {
          const generatedQuestions = []
          for (let i = 0; i < body.count; i++) {
            generatedQuestions.push({
              title: `AI生成题目 ${i + 1} - ${body.domainName}`,
              content: `这是一道关于${body.domainName}的${body.difficulty}难度题目。\n\n请回答以下问题：\n\n假设你正在开发一个大型分布式系统...`,
              type: 'multiple_choice',
              difficulty: body.difficulty,
              options: [
                { id: 'A', text: '选项 A - 正确答案' },
                { id: 'B', text: '选项 B' },
                { id: 'C', text: '选项 C' },
                { id: 'D', text: '选项 D' }
              ],
              correctAnswer: 'A',
              explanation: `这道题考察的是${body.domainName}中的核心概念。正确答案是 A，因为...`,
              tags: ['AI生成', body.domainName],
              metadata: body.metadata || {},
              qualityScore: Math.floor(Math.random() * 30) + 70,
              qualityMetrics: {
                clarity: Math.floor(Math.random() * 3) + 7,
                difficulty: Math.floor(Math.random() * 3) + 7,
                relevance: Math.floor(Math.random() * 3) + 7,
                completeness: Math.floor(Math.random() * 3) + 7
              }
            })
          }

          const generationRecord = {
            id: Date.now(),
            domainId: body.domainId,
            domainName: body.domainName,
            categoryId: body.categoryId,
            difficulty: body.difficulty,
            count: body.count,
            generatedBy: body.model,
            temperature: body.temperature,
            generatedQuestions: generatedQuestions,
            generatedAt: new Date().toISOString(),
            tokensUsed: Math.floor(Math.random() * 2000) + 1000,
            cost: (Math.random() * 0.5 + 0.1).toFixed(4),
            status: 'pending_review'
          }

          sendResponse(res, 200, generationRecord, 'AI 题目生成成功')
        }, 2000)
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 获取生成历史
  'GET:/api/ai/generation-history': (req, res) => {
    const mockHistory = [
      {
        id: 1,
        domainName: '计算机科学',
        difficulty: 'medium',
        count: 5,
        generatedBy: 'gpt-4',
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        tokensUsed: 1520,
        cost: 0.0456,
        status: 'completed',
        approvedCount: 3,
        rejectedCount: 2
      },
      {
        id: 2,
        domainName: '金融学',
        difficulty: 'hard',
        count: 3,
        generatedBy: 'claude-3-opus-20240229',
        generatedAt: new Date(Date.now() - 172800000).toISOString(),
        tokensUsed: 2340,
        cost: 0.0702,
        status: 'completed',
        approvedCount: 2,
        rejectedCount: 1
      },
      {
        id: 3,
        domainName: '医学',
        difficulty: 'easy',
        count: 10,
        generatedBy: 'gpt-4',
        generatedAt: new Date(Date.now() - 259200000).toISOString(),
        tokensUsed: 3100,
        cost: 0.093,
        status: 'completed',
        approvedCount: 8,
        rejectedCount: 2
      }
    ]

    const parsedUrl = url.parse(req.url, true)
    const page = parseInt(parsedUrl.query.page) || 1
    const limit = parseInt(parsedUrl.query.limit) || 10

    sendResponse(res, 200, {
      items: mockHistory,
      total: mockHistory.length,
      page,
      limit
    }, '获取生成历史成功')
  },

  // 获取单条生成记录详情
  'GET:/api/ai/generation-history/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const segments = parsedUrl.pathname.split('/')
    const id = segments[segments.length - 1]

    const mockDetail = {
      id: parseInt(id),
      domainName: '计算机科学',
      difficulty: 'medium',
      count: 5,
      generatedBy: 'gpt-4',
      generatedAt: new Date(Date.now() - 86400000).toISOString(),
      tokensUsed: 1520,
      cost: 0.0456,
      status: 'completed',
      generatedQuestions: [
        {
          title: 'AI生成题目 1 - 分布式系统',
          content: '在分布式系统中...',
          difficulty: 'medium',
          qualityScore: 85,
          qualityMetrics: { clarity: 8, difficulty: 9, relevance: 8, completeness: 9 },
          reviewResult: 'approved'
        }
      ]
    }

    sendResponse(res, 200, mockDetail, '获取详情成功')
  },

  // 审核 AI 生成的题目
  'POST:/api/ai/generated-questions/:id/review': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        sendResponse(res, 200, {
          approvedCount: body.approvedIndices?.length || 0,
          rejectedCount: body.rejectedIndices?.length || 0
        }, '审核完成')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 获取 Prompt 模板列表
  'GET:/api/ai/prompt-templates': (req, res) => {
    const mockTemplates = [
      {
        id: 1,
        name: '基础选择题模板',
        description: '适用于生成基础知识点的选择题',
        category: 'multiple_choice',
        template: '请生成一道关于{{domain}}的{{difficulty}}难度选择题，要求：\n1. 题目清晰明确\n2. 4个选项，只有一个正确答案\n3. 提供详细解析',
        variables: ['domain', 'difficulty'],
        usageCount: 156,
        successRate: 0.92,
        createdAt: '2024-01-15T10:00:00Z',
        isDefault: true
      },
      {
        id: 2,
        name: '编程实战题模板',
        description: '生成需要编写代码的实战题目',
        category: 'coding',
        template: '请生成一道{{domain}}领域的{{difficulty}}难度编程题：\n\n要求：\n1. 提供清晰的问题描述\n2. 包含输入输出示例\n3. 给出时间复杂度要求：{{timeComplexity}}\n4. 支持语言：{{languages}}',
        variables: ['domain', 'difficulty', 'timeComplexity', 'languages'],
        usageCount: 89,
        successRate: 0.88,
        createdAt: '2024-01-20T14:30:00Z',
        isDefault: false
      },
      {
        id: 3,
        name: '案例分析模板',
        description: '生成实际案例分析题',
        category: 'case_study',
        template: '请基于{{domain}}领域，生成一个{{difficulty}}难度的案例分析题：\n\n1. 提供真实场景描述\n2. 设置3-5个分析问题\n3. 每个问题提供参考答案和评分标准',
        variables: ['domain', 'difficulty'],
        usageCount: 45,
        successRate: 0.85,
        createdAt: '2024-02-01T09:00:00Z',
        isDefault: false
      }
    ]

    sendResponse(res, 200, {
      items: mockTemplates,
      total: mockTemplates.length
    }, '获取模板列表成功')
  },

  // 创建 Prompt 模板
  'POST:/api/ai/prompt-templates': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const newTemplate = {
          id: Date.now(),
          ...body,
          usageCount: 0,
          successRate: 0,
          createdAt: new Date().toISOString(),
          isDefault: false
        }
        sendResponse(res, 200, newTemplate, '模板创建成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 更新 Prompt 模板
  'PUT:/api/ai/prompt-templates/:id': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        sendResponse(res, 200, { ...body }, '模板更新成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 删除 Prompt 模板
  'DELETE:/api/ai/prompt-templates/:id': (req, res) => {
    sendResponse(res, 200, null, '模板删除成功')
  },

  // 成本预估
  'POST:/api/ai/estimate-cost': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const modelPrices = {
          'gpt-4': { input: 0.03, output: 0.06 },
          'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
          'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
          'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 }
        }

        const price = modelPrices[body.model] || modelPrices['gpt-4']
        const estimatedInputTokens = body.count * 500
        const estimatedOutputTokens = body.count * 800
        const estimatedCost = (estimatedInputTokens * price.input + estimatedOutputTokens * price.output) / 1000

        sendResponse(res, 200, {
          model: body.model,
          questionCount: body.count,
          estimatedInputTokens,
          estimatedOutputTokens,
          estimatedTotalTokens: estimatedInputTokens + estimatedOutputTokens,
          estimatedCost: estimatedCost.toFixed(4),
          pricePerQuestion: (estimatedCost / body.count).toFixed(4),
          currency: 'USD'
        }, '成本预估成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 批量导出生成的题目
  'POST:/api/ai/export-questions': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const format = body.format || 'json'
        const questions = body.questions || []

        let exportData = ''
        if (format === 'json') {
          exportData = JSON.stringify(questions, null, 2)
        } else if (format === 'csv') {
          exportData = 'ID,标题,难度,类型,正确答案\n'
          questions.forEach((q, i) => {
            exportData += `${i + 1},${q.title},${q.difficulty},${q.type},${q.correctAnswer}\n`
          })
        } else if (format === 'markdown') {
          questions.forEach((q, i) => {
            exportData += `## ${i + 1}. ${q.title}\n\n${q.content}\n\n`
            if (q.options) {
              q.options.forEach(opt => {
                exportData += `- ${opt.id}. ${opt.text}\n`
              })
            }
            exportData += `\n**正确答案**: ${q.correctAnswer}\n\n**解析**: ${q.explanation}\n\n---\n\n`
          })
        }

        sendResponse(res, 200, {
          format,
          data: exportData,
          filename: `ai-generated-questions-${Date.now()}.${format}`,
          size: exportData.length
        }, '导出成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 获取 AI 使用统计
  'GET:/api/ai/statistics': (req, res) => {
    sendResponse(res, 200, {
      totalGenerations: 156,
      totalQuestionsGenerated: 523,
      totalTokensUsed: 245600,
      totalCost: 7.368,
      averageQualityScore: 82.5,
      approvalRate: 0.78,
      modelUsage: {
        'gpt-4': 89,
        'gpt-3.5-turbo': 23,
        'claude-3-opus-20240229': 44
      },
      monthlyTrend: [
        { month: '2024-01', generations: 45, cost: 2.15 },
        { month: '2024-02', generations: 67, cost: 3.22 },
        { month: '2024-03', generations: 44, cost: 1.998 }
      ]
    }, '获取统计数据成功')
  },

  // 智能推荐参数
  'POST:/api/ai/recommend-params': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const recommendations = {
          temperature: 0.7,
          model: 'gpt-4',
          promptTemplate: 1,
          reasoning: '基于您的领域和难度设置，建议使用 GPT-4 模型，temperature 设为 0.7 可以保证创意性的同时保持准确性。'
        }

        if (body.difficulty === 'hard') {
          recommendations.temperature = 0.5
          recommendations.reasoning = '对于困难题目，建议降低 temperature 以提高准确性。'
        }

        sendResponse(res, 200, recommendations, '推荐参数成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // ==================== 社区论坛 API ====================

  // 获取论坛板块列表
  'GET:/api/community/forums': (req, res) => {
    const forums = mockData.forums
      .filter(f => f.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    sendResponse(res, 200, forums, '获取板块列表成功')
  },

  // 获取指定板块的帖子列表
  'GET:/api/community/forums/:slug/posts': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const pathParts = parsedUrl.pathname.split('/')
    const slug = pathParts[4]
    const query = parsedUrl.query

    const forum = mockData.forums.find(f => f.slug === slug)
    if (!forum) {
      sendResponse(res, 404, null, '板块不存在')
      return
    }

    let posts = mockData.posts.filter(p => p.forumId === forum.id)

    // 排序：置顶优先，然后按更新时间
    posts.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })

    const paginatedResult = paginate(posts, query.page, query.size || 20)
    sendResponse(res, 200, paginatedResult, '获取帖子列表成功')
  },

  // 获取所有帖子列表（支持搜索和筛选）
  'GET:/api/community/posts': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    let posts = [...mockData.posts]

    // 按板块筛选
    if (query.forumId) {
      posts = posts.filter(p => p.forumId === parseInt(query.forumId))
    }

    // 按标签筛选
    if (query.tag) {
      posts = posts.filter(p => p.tags && p.tags.includes(query.tag))
    }

    // 关键词搜索
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(keyword) ||
        p.content.toLowerCase().includes(keyword)
      )
    }

    // 排序
    const sortBy = query.sortBy || 'latest'
    if (sortBy === 'latest') {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'hot') {
      posts.sort((a, b) => (b.viewCount + b.likeCount * 2) - (a.viewCount + a.likeCount * 2))
    } else if (sortBy === 'popular') {
      posts.sort((a, b) => b.likeCount - a.likeCount)
    }

    const paginatedResult = paginate(posts, query.page, query.size || 20)
    sendResponse(res, 200, paginatedResult, '获取帖子列表成功')
  },

  // 获取帖子详情
  'GET:/api/community/posts/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const postId = parseInt(parsedUrl.pathname.split('/')[4])

    const post = mockData.posts.find(p => p.id === postId)
    if (!post) {
      sendResponse(res, 404, null, '帖子不存在')
      return
    }

    // 增加浏览量
    post.viewCount++

    // 获取评论
    const comments = mockData.comments
      .filter(c => c.postId === postId && c.status === 'normal')
      .sort((a, b) => a.floorNumber - b.floorNumber)

    const result = {
      ...post,
      comments
    }

    sendResponse(res, 200, result, '获取帖子详情成功')
  },

  // 创建帖子（带 AI 审核）
  'POST:/api/community/posts': async (req, res) => {
    try {
      const body = await parseJSONBody(req)

      // 验证必填字段
      if (!body.forumId || !body.title || !body.content) {
        sendResponse(res, 400, null, '缺少必填字段')
        return
      }

      // AI 内容审核
      const aiReviewScore = mockAIReview(body.content)
      const status = aiReviewScore >= 0.6 ? 'approved' : 'pending'

      // 创建帖子
      const newPost = {
        id: mockData.postIdCounter++,
        forumId: body.forumId,
        userId: 1, // 默认当前用户
        username: 'testuser',
        userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        title: body.title,
        content: body.content,
        contentType: body.contentType || 'markdown',
        tags: body.tags || [],
        isPinned: false,
        isLocked: false,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        status,
        aiReviewScore,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockData.posts.unshift(newPost)

      // 更新板块帖子数
      const forum = mockData.forums.find(f => f.id === body.forumId)
      if (forum) {
        forum.postCount++
      }

      sendResponse(res, 200, newPost, status === 'approved' ? '发帖成功' : '发帖成功，等待审核')
    } catch (error) {
      sendResponse(res, 400, null, '请求数据格式错误')
    }
  },

  // 发表评论
  'POST:/api/community/posts/:id/comments': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const postId = parseInt(parsedUrl.pathname.split('/')[4])
      const body = await parseJSONBody(req)

      const post = mockData.posts.find(p => p.id === postId)
      if (!post) {
        sendResponse(res, 404, null, '帖子不存在')
        return
      }

      if (!body.content) {
        sendResponse(res, 400, null, '评论内容不能为空')
        return
      }

      // 计算楼层号
      const postComments = mockData.comments.filter(c => c.postId === postId)
      const floorNumber = postComments.length + 1

      const newComment = {
        id: mockData.commentIdCounter++,
        postId,
        userId: 1,
        username: 'testuser',
        userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        parentId: body.parentId || null,
        content: body.content,
        likeCount: 0,
        floorNumber,
        status: 'normal',
        createdAt: new Date().toISOString()
      }

      mockData.comments.push(newComment)
      post.commentCount++

      sendResponse(res, 200, newComment, '评论发表成功')
    } catch (error) {
      sendResponse(res, 400, null, '请求数据格式错误')
    }
  },

  // 点赞/取消点赞帖子
  'POST:/api/community/posts/:id/like': async (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const postId = parseInt(parsedUrl.pathname.split('/')[4])

    const post = mockData.posts.find(p => p.id === postId)
    if (!post) {
      sendResponse(res, 404, null, '帖子不存在')
      return
    }

    const userId = 1 // 当前用户
    const existingReaction = mockData.reactions.find(
      r => r.targetType === 'post' && r.targetId === postId && r.userId === userId
    )

    if (existingReaction) {
      // 取消点赞
      const index = mockData.reactions.indexOf(existingReaction)
      mockData.reactions.splice(index, 1)
      post.likeCount = Math.max(0, post.likeCount - 1)
      sendResponse(res, 200, { liked: false, likeCount: post.likeCount }, '已取消点赞')
    } else {
      // 点赞
      const newReaction = {
        id: mockData.reactionIdCounter++,
        targetType: 'post',
        targetId: postId,
        userId,
        reactionType: 'like',
        createdAt: new Date().toISOString()
      }
      mockData.reactions.push(newReaction)
      post.likeCount++
      sendResponse(res, 200, { liked: true, likeCount: post.likeCount }, '点赞成功')
    }
  },

  // 点赞/取消点赞评论
  'POST:/api/community/comments/:id/like': async (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const commentId = parseInt(parsedUrl.pathname.split('/')[4])

    const comment = mockData.comments.find(c => c.id === commentId)
    if (!comment) {
      sendResponse(res, 404, null, '评论不存在')
      return
    }

    const userId = 1
    const existingReaction = mockData.reactions.find(
      r => r.targetType === 'comment' && r.targetId === commentId && r.userId === userId
    )

    if (existingReaction) {
      const index = mockData.reactions.indexOf(existingReaction)
      mockData.reactions.splice(index, 1)
      comment.likeCount = Math.max(0, comment.likeCount - 1)
      sendResponse(res, 200, { liked: false, likeCount: comment.likeCount }, '已取消点赞')
    } else {
      const newReaction = {
        id: mockData.reactionIdCounter++,
        targetType: 'comment',
        targetId: commentId,
        userId,
        reactionType: 'like',
        createdAt: new Date().toISOString()
      }
      mockData.reactions.push(newReaction)
      comment.likeCount++
      sendResponse(res, 200, { liked: true, likeCount: comment.likeCount }, '点赞成功')
    }
  },

  // 获取热门标签
  'GET:/api/community/tags/hot': (req, res) => {
    const tagCount = {}
    mockData.posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })

    const hotTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    sendResponse(res, 200, hotTags, '获取热门标签成功')
  },

  // ==================== 聊天室 API ====================

  // 获取聊天室列表
  'GET:/api/chat/rooms': (req, res) => {
    const rooms = mockData.chatRooms.map(room => ({
      ...room,
      isJoined: mockData.roomMembers.some(m => m.roomId === room.id && m.userId === 1)
    }))
    sendResponse(res, 200, rooms, '获取聊天室列表成功')
  },

  // 获取聊天室详情
  'GET:/api/chat/rooms/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const roomId = parseInt(parsedUrl.pathname.split('/')[4])

    const room = mockData.chatRooms.find(r => r.id === roomId)
    if (!room) {
      sendResponse(res, 404, null, '聊天室不存在')
      return
    }

    // 获取成员列表
    const members = mockData.roomMembers
      .filter(m => m.roomId === roomId)
      .map(m => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        // 实际应该从 users 表查询用户信息
        username: 'testuser',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
      }))

    const result = {
      ...room,
      members
    }

    sendResponse(res, 200, result, '获取聊天室详情成功')
  },

  // 创建聊天室
  'POST:/api/chat/rooms': async (req, res) => {
    try {
      const body = await parseJSONBody(req)

      if (!body.name) {
        sendResponse(res, 400, null, '聊天室名称不能为空')
        return
      }

      const newRoom = {
        id: mockData.chatRoomIdCounter++,
        name: body.name,
        type: body.type || 'group',
        avatar: body.avatar || null,
        description: body.description || '',
        maxMembers: body.maxMembers || 100,
        memberCount: 1,
        createdBy: 1,
        createdAt: new Date().toISOString()
      }

      mockData.chatRooms.push(newRoom)

      // 创建者自动加入
      mockData.roomMembers.push({
        roomId: newRoom.id,
        userId: 1,
        role: 'owner',
        joinedAt: new Date().toISOString()
      })

      sendResponse(res, 200, newRoom, '创建聊天室成功')
    } catch (error) {
      sendResponse(res, 400, null, '请求数据格式错误')
    }
  },

  // 获取聊天室历史消息
  'GET:/api/chat/rooms/:id/messages': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const roomId = parseInt(parsedUrl.pathname.split('/')[4])
    const query = parsedUrl.query

    let messages = mockData.messages.filter(m => m.roomId === roomId)

    // 按时间倒序排列
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const paginatedResult = paginate(messages, query.page, query.size || 50)
    // 返回时再按时间正序
    paginatedResult.items.reverse()

    sendResponse(res, 200, paginatedResult, '获取历史消息成功')
  },

  // 获取聊天室成员列表
  'GET:/api/chat/rooms/:id/members': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const roomId = parseInt(parsedUrl.pathname.split('/')[4])

    const members = mockData.roomMembers
      .filter(m => m.roomId === roomId)
      .map(m => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        username: 'testuser',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
      }))

    sendResponse(res, 200, members, '获取成员列表成功')
  },

  // 加入聊天室
  'POST:/api/chat/rooms/:id/join': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const roomId = parseInt(parsedUrl.pathname.split('/')[4])

    const room = mockData.chatRooms.find(r => r.id === roomId)
    if (!room) {
      sendResponse(res, 404, null, '聊天室不存在')
      return
    }

    // 检查是否已加入
    const alreadyJoined = mockData.roomMembers.some(
      m => m.roomId === roomId && m.userId === 1
    )

    if (alreadyJoined) {
      sendResponse(res, 400, null, '已经加入该聊天室')
      return
    }

    // 检查人数限制
    if (room.memberCount >= room.maxMembers) {
      sendResponse(res, 400, null, '聊天室已满')
      return
    }

    // 加入聊天室
    mockData.roomMembers.push({
      roomId,
      userId: 1,
      role: 'member',
      joinedAt: new Date().toISOString()
    })

    room.memberCount++

    sendResponse(res, 200, { roomId }, '加入聊天室成功')
  },

  // 离开聊天室
  'POST:/api/chat/rooms/:id/leave': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const roomId = parseInt(parsedUrl.pathname.split('/')[4])

    const memberIndex = mockData.roomMembers.findIndex(
      m => m.roomId === roomId && m.userId === 1
    )

    if (memberIndex === -1) {
      sendResponse(res, 400, null, '未加入该聊天室')
      return
    }

    // 移除成员
    mockData.roomMembers.splice(memberIndex, 1)

    const room = mockData.chatRooms.find(r => r.id === roomId)
    if (room) {
      room.memberCount = Math.max(0, room.memberCount - 1)
    }

    sendResponse(res, 200, { roomId }, '离开聊天室成功')
  },

  // ==================== 通知 API ====================

  // 获取通知列表
  'GET:/api/notifications': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query

    let notifications = mockData.notifications.filter(n => n.userId === 1)

    // 按类型筛选
    if (query.type) {
      notifications = notifications.filter(n => n.type === query.type)
    }

    // 按已读状态筛选
    if (query.isRead !== undefined) {
      const isRead = query.isRead === 'true'
      notifications = notifications.filter(n => n.isRead === isRead)
    }

    // 按时间倒序
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const paginatedResult = paginate(notifications, query.page, query.size || 20)
    sendResponse(res, 200, paginatedResult, '获取通知列表成功')
  },

  // 标记通知为已读
  'PUT:/api/notifications/:id/read': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const notificationId = parseInt(parsedUrl.pathname.split('/')[3])

    const notification = mockData.notifications.find(n => n.id === notificationId)
    if (!notification) {
      sendResponse(res, 404, null, '通知不存在')
      return
    }

    notification.isRead = true
    sendResponse(res, 200, notification, '标记已读成功')
  },

  // 删除通知
  'DELETE:/api/notifications/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const notificationId = parseInt(parsedUrl.pathname.split('/')[3])

    const index = mockData.notifications.findIndex(n => n.id === notificationId)
    if (index === -1) {
      sendResponse(res, 404, null, '通知不存在')
      return
    }

    mockData.notifications.splice(index, 1)
    sendResponse(res, 200, null, '删除通知成功')
  },

  // 全部标记为已读
  'POST:/api/notifications/read-all': (req, res) => {
    mockData.notifications
      .filter(n => n.userId === 1)
      .forEach(n => { n.isRead = true })

    sendResponse(res, 200, null, '全部标记已读成功')
  },

  // 获取未读通知数
  'GET:/api/notifications/unread-count': (req, res) => {
    const count = mockData.notifications.filter(n => n.userId === 1 && !n.isRead).length
    sendResponse(res, 200, { count }, '获取未读数成功')
  },

  // ==================== 推荐流 API ====================

  // 获取推荐流
  'GET:/api/recommendations': (req, res) => {
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { page = 1, size = 20 } = query
    const userId = 1

    // 获取用户兴趣标签
    const userTags = mockData.userInterests
      .filter(i => i.userId === userId)
      .map(i => i.tag)

    // 生成推荐内容（基于标签匹配）
    const recommendations = []

    // 推荐帖子
    mockData.posts.forEach(post => {
      const matchScore = post.tags.filter(t => userTags.includes(t)).length / Math.max(post.tags.length, 1)
      if (matchScore > 0) {
        recommendations.push({
          id: mockData.recommendationIdCounter++,
          userId: userId,
          targetType: 'post',
          targetId: post.id,
          target: post,
          score: matchScore * 0.9 + Math.random() * 0.1,
          reason: `基于你的兴趣：${post.tags.filter(t => userTags.includes(t)).join(', ')}`,
          createdAt: new Date().toISOString()
        })
      }
    })

    // 推荐聊天室
    mockData.chatRooms.forEach(room => {
      recommendations.push({
        id: mockData.recommendationIdCounter++,
        userId: userId,
        targetType: 'chatroom',
        targetId: room.id,
        target: room,
        score: 0.7 + Math.random() * 0.3,
        reason: '活跃的社区讨论',
        createdAt: new Date().toISOString()
      })
    })

    // 按分数排序
    recommendations.sort((a, b) => b.score - a.score)

    // 分页
    const start = (page - 1) * size
    const end = start + parseInt(size)
    const items = recommendations.slice(start, end)

    sendResponse(res, 200, {
      items,
      page: parseInt(page),
      size: parseInt(size),
      total: recommendations.length,
      totalPages: Math.ceil(recommendations.length / size)
    }, '获取推荐流成功')
  },

  // 刷新推荐
  'GET:/api/recommendations/refresh': (req, res) => {
    // 简单返回成功，实际中会重新计算推荐
    sendResponse(res, 200, { refreshed: true }, '推荐已刷新')
  },

  // 推荐反馈
  'POST:/api/recommendations/feedback': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })
    req.on('end', () => {
      const body = JSON.parse(bodyStr)
      const { recommendationId, feedback } = body // feedback: 'like' | 'dislike'

      // 根据反馈调整用户兴趣权重（简化版）
      console.log(`用户反馈：推荐ID ${recommendationId}, 反馈 ${feedback}`)

      sendResponse(res, 200, null, '反馈已记录')
    })
  },

  // 获取用户兴趣标签
  'GET:/api/users/interests': (req, res) => {
    const userId = 1
    const interests = mockData.userInterests.filter(i => i.userId === userId)
    sendResponse(res, 200, interests, '获取兴趣标签成功')
  },

  // 更新用户兴趣标签
  'PUT:/api/users/interests': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })
    req.on('end', () => {
      const body = JSON.parse(bodyStr)
      const { tags } = body // tags: [{ tag: 'Vue.js', weight: 0.9 }]
      const userId = 1

      // 更新兴趣标签
      mockData.userInterests = mockData.userInterests.filter(i => i.userId !== userId)
      tags.forEach(t => {
        mockData.userInterests.push({
          userId: userId,
          tag: t.tag,
          weight: t.weight || 0.5,
          updatedAt: new Date().toISOString()
        })
      })

      sendResponse(res, 200, null, '兴趣标签已更新')
    })
  },

  // ==================== 关注系统 API ====================

  // 关注用户
  'POST:/api/users/:id/follow': (req, res) => {
    const targetUserId = parseInt(req.params.id)
    const userId = 1

    // 检查是否已关注
    const existing = mockData.follows.find(f => f.followerId === userId && f.followingId === targetUserId)
    if (existing) {
      sendResponse(res, 400, null, '已经关注该用户')
      return
    }

    // 添加关注关系
    mockData.follows.push({
      id: mockData.followIdCounter++,
      followerId: userId,
      followingId: targetUserId,
      createdAt: new Date().toISOString()
    })

    sendResponse(res, 200, null, '关注成功')
  },

  // 取消关注
  'DELETE:/api/users/:id/follow': (req, res) => {
    const targetUserId = parseInt(req.params.id)
    const userId = 1

    const index = mockData.follows.findIndex(f => f.followerId === userId && f.followingId === targetUserId)
    if (index === -1) {
      sendResponse(res, 400, null, '未关注该用户')
      return
    }

    mockData.follows.splice(index, 1)
    sendResponse(res, 200, null, '取消关注成功')
  },

  // 获取粉丝列表
  'GET:/api/users/:id/followers': (req, res) => {
    const targetUserId = parseInt(req.params.id)
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { page = 1, size = 20 } = query

    const followers = mockData.follows
      .filter(f => f.followingId === targetUserId)
      .map(f => ({
        id: f.followerId,
        username: `user${f.followerId}`,
        avatar: null,
        followedAt: f.createdAt
      }))

    const start = (page - 1) * size
    const end = start + parseInt(size)

    sendResponse(res, 200, {
      items: followers.slice(start, end),
      page: parseInt(page),
      size: parseInt(size),
      total: followers.length
    }, '获取粉丝列表成功')
  },

  // 获取关注列表
  'GET:/api/users/:id/following': (req, res) => {
    const targetUserId = parseInt(req.params.id)
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { page = 1, size = 20 } = query

    const following = mockData.follows
      .filter(f => f.followerId === targetUserId)
      .map(f => ({
        id: f.followingId,
        username: `user${f.followingId}`,
        avatar: null,
        followedAt: f.createdAt
      }))

    const start = (page - 1) * size
    const end = start + parseInt(size)

    sendResponse(res, 200, {
      items: following.slice(start, end),
      page: parseInt(page),
      size: parseInt(size),
      total: following.length
    }, '获取关注列表成功')
  },

  // 获取用户动态
  'GET:/api/users/:id/feeds': (req, res) => {
    const targetUserId = parseInt(req.params.id)
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { page = 1, size = 20 } = query

    const feeds = mockData.userFeeds
      .filter(f => f.userId === targetUserId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const start = (page - 1) * size
    const end = start + parseInt(size)

    sendResponse(res, 200, {
      items: feeds.slice(start, end),
      page: parseInt(page),
      size: parseInt(size),
      total: feeds.length
    }, '获取用户动态成功')
  },

  // 获取关注动态流
  'GET:/api/feeds/timeline': (req, res) => {
    const userId = 1
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { page = 1, size = 20 } = query

    // 获取关注的用户
    const followingIds = mockData.follows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId)

    // 获取这些用户的动态
    const feeds = mockData.userFeeds
      .filter(f => followingIds.includes(f.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const start = (page - 1) * size
    const end = start + parseInt(size)

    sendResponse(res, 200, {
      items: feeds.slice(start, end),
      page: parseInt(page),
      size: parseInt(size),
      total: feeds.length
    }, '获取关注动态流成功')
  },

  // ==================== 排行榜系统 ====================

  // 活跃度排行榜
  'GET:/api/leaderboard/activity': (req, res) => {
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { timeRange = 'month', limit = 50 } = query

    // 模拟活跃度排行数据
    const users = [
      {
        id: 2,
        username: '技术达人',
        avatar: '',
        bio: '专注前端技术分享',
        postCount: 156,
        commentCount: 423,
        activityScore: 1580,
        isFollowing: false
      },
      {
        id: 3,
        username: '算法高手',
        avatar: '',
        bio: '算法竞赛爱好者',
        postCount: 98,
        commentCount: 287,
        activityScore: 985,
        isFollowing: false
      },
      {
        id: 4,
        username: '全栈工程师',
        avatar: '',
        bio: '全栈开发经验分享',
        postCount: 134,
        commentCount: 356,
        activityScore: 1290,
        isFollowing: true
      },
      {
        id: 5,
        username: 'Java专家',
        avatar: '',
        bio: 'Java核心技术研究',
        postCount: 89,
        commentCount: 234,
        activityScore: 823,
        isFollowing: false
      },
      {
        id: 6,
        username: 'Python达人',
        avatar: '',
        bio: 'Python开发者',
        postCount: 67,
        commentCount: 189,
        activityScore: 656,
        isFollowing: false
      }
    ]

    // 按活跃度排序
    users.sort((a, b) => b.activityScore - a.activityScore)

    sendResponse(res, 200, users.slice(0, parseInt(limit)), '获取活跃度排行成功')
  },

  // 贡献排行榜
  'GET:/api/leaderboard/contribution': (req, res) => {
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { timeRange = 'month', limit = 50 } = query

    // 模拟贡献排行数据
    const users = [
      {
        id: 2,
        username: '技术达人',
        avatar: '',
        bio: '专注前端技术分享',
        submittedCount: 45,
        approvedCount: 42,
        contributionScore: 840,
        isFollowing: false
      },
      {
        id: 4,
        username: '全栈工程师',
        avatar: '',
        bio: '全栈开发经验分享',
        submittedCount: 38,
        approvedCount: 36,
        contributionScore: 720,
        isFollowing: true
      },
      {
        id: 3,
        username: '算法高手',
        avatar: '',
        bio: '算法竞赛爱好者',
        submittedCount: 32,
        approvedCount: 30,
        contributionScore: 600,
        isFollowing: false
      },
      {
        id: 5,
        username: 'Java专家',
        avatar: '',
        bio: 'Java核心技术研究',
        submittedCount: 28,
        approvedCount: 25,
        contributionScore: 500,
        isFollowing: false
      },
      {
        id: 6,
        username: 'Python达人',
        avatar: '',
        bio: 'Python开发者',
        submittedCount: 23,
        approvedCount: 21,
        contributionScore: 420,
        isFollowing: false
      }
    ]

    // 按贡献分排序
    users.sort((a, b) => b.contributionScore - a.contributionScore)

    sendResponse(res, 200, users.slice(0, parseInt(limit)), '获取贡献排行成功')
  },

  // 粉丝排行榜
  'GET:/api/leaderboard/followers': (req, res) => {
    const query = req.parsedUrl ? req.parsedUrl.query : {}
    const { timeRange = 'month', limit = 50 } = query

    // 模拟粉丝排行数据
    const users = [
      {
        id: 2,
        username: '技术达人',
        avatar: '',
        bio: '专注前端技术分享',
        followerCount: 2345,
        followingCount: 456,
        totalViews: 45678,
        isFollowing: false
      },
      {
        id: 4,
        username: '全栈工程师',
        avatar: '',
        bio: '全栈开发经验分享',
        followerCount: 1890,
        followingCount: 234,
        totalViews: 38901,
        isFollowing: true
      },
      {
        id: 3,
        username: '算法高手',
        avatar: '',
        bio: '算法竞赛爱好者',
        followerCount: 1567,
        followingCount: 178,
        totalViews: 32456,
        isFollowing: false
      },
      {
        id: 5,
        username: 'Java专家',
        avatar: '',
        bio: 'Java核心技术研究',
        followerCount: 1234,
        followingCount: 156,
        totalViews: 28901,
        isFollowing: false
      },
      {
        id: 6,
        username: 'Python达人',
        avatar: '',
        bio: 'Python开发者',
        followerCount: 987,
        followingCount: 123,
        totalViews: 21345,
        isFollowing: false
      }
    ]

    // 按粉丝数排序
    users.sort((a, b) => b.followerCount - a.followerCount)

    sendResponse(res, 200, users.slice(0, parseInt(limit)), '获取粉丝排行成功')
  },

  // 配置 AI
  'POST:/api/ai/config': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        sendResponse(res, 200, {
          apiKey: body.apiKey?.substring(0, 10) + '...',
          model: body.model,
          maxTokens: body.maxTokens || 4096,
          updatedAt: new Date().toISOString()
        }, 'AI 配置保存成功')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 默认404处理
  'default': (req, res) => {
    sendResponse(res, 404, null, 'API接口不存在')
  }
}

/**
 * 创建HTTP服务器
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const method = req.method
  const path = parsedUrl.pathname
  let routeKey = `${method}:${path}`

  console.log(`[${new Date().toISOString()}] ${method} ${path}`)

  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    handleOptions(res)
    return
  }

  // 查找对应的路由处理器
  let handler = routes[routeKey]

  // 如果没找到精确匹配，尝试匹配动态路由（如 DELETE:/api/users/devices/:id）
  if (!handler) {
    req.params = {} // 初始化 params 对象
    for (const route in routes) {
      if (route.includes('/:')) {
        const parts = route.split(':')
        const routeMethod = parts[0]
        const routePath = parts.slice(1).join(':')

        if (routeMethod === method) {
          // 提取路由中的参数名
          const paramNames = []
          const routePattern = routePath.replace(/\/:[^/]+/g, (match) => {
            paramNames.push(match.substring(2)) // 去掉 /:
            return '/([^/]+)'
          })
          const regex = new RegExp(`^${routePattern}$`)
          const matchResult = path.match(regex)

          if (matchResult) {
            handler = routes[route]
            // 将匹配的参数值赋给 req.params
            paramNames.forEach((name, index) => {
              req.params[name] = matchResult[index + 1]
            })
            break
          }
        }
      }
    }
  }

  handler = handler || routes['default']

  try {
    handler(req, res)
  } catch (error) {
    console.error('路由处理错误:', error)
    sendResponse(res, 500, null, '服务器内部错误')
  }
})

/**
 * 初始化 WebSocket 服务
 */
const io = initializeWebSocket(server, mockData)

/**
 * 启动服务器
 */
server.listen(PORT, async () => {
  console.log(`🚀 Mock API服务器已启动`)
  console.log(`📍 地址: http://localhost:${PORT}`)
  console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`)

  // 初始化 Redis 客户端
  console.log('\n🔄 正在初始化 Redis 客户端...')
  await redisClient.initRedisClient()

  console.log(`\n📝 可用接口:`)
  console.log(`   GET  /api/health - 健康检查`)
  console.log(`   GET  /api/actuator/health - Spring Boot风格健康检查`)
  console.log(`   POST /api/auth/login - 用户名密码登录`)
  console.log(`   POST /api/auth/register - 用户注册 🆕`)
  console.log(`   POST /api/auth/login/sms - 短信验证码登录 🆕`)
  console.log(`   POST /api/auth/sms/send - 发送短信验证码 🆕`)
  console.log(`   GET  /api/captcha/get - 获取滑块验证码 🆕`)
  console.log(`   POST /api/captcha/check - 验证滑块 🆕`)
  console.log(`   POST /api/captcha/verify - 验证令牌 🆕`)
  console.log(`   GET  /api/auth/oauth/wechat/authorize - 微信授权登录 🆕`)
  console.log(`   GET  /api/auth/oauth/wechat/qrcode - 获取微信二维码 🆕`)
  console.log(`   POST /api/auth/oauth/wechat/callback - 微信回调处理 🆕`)
  console.log(`   GET  /api/auth/oauth/qq/authorize - QQ授权登录 🆕`)
  console.log(`   GET  /api/auth/oauth/qq/qrcode - 获取QQ二维码 🆕`)
  console.log(`   POST /api/auth/oauth/qq/callback - QQ回调处理 🆕`)
  console.log(`   GET  /api/users/me - 获取用户信息`)
  console.log(`   POST /api/interview/generate-question - 生成面试问题`)
  console.log(`   POST /api/interview/generate-question-smart - 智能生成面试问题`)
  console.log(`   POST /api/interview/analyze - 分析回答`)
  console.log(`   POST /api/interview/analyze-advanced - 五维度分析回答`)
  console.log(`   POST /api/interview/sessions - 保存会话数据 🆕`)
  console.log(`   GET  /api/interview/sessions - 获取所有会话ID 🆕`)
  console.log(`   GET  /api/interview/sessions/:id - 加载会话数据 🆕`)
  console.log(`   DELETE /api/interview/sessions/:id - 删除会话数据 🆕`)
  console.log(`   PUT  /api/interview/sessions/:id/touch - 更新会话TTL 🆕`)
  console.log(`   GET  /api/questions - 获取题库列表 🆕`)
  console.log(`   GET  /api/questions/categories - 获取题库分类 🆕`)
  console.log(`   GET  /api/questions/tags - 获取题库标签 🆕`)
  console.log(`   GET  /api/questions/:id - 获取题目详情 🆕`)
  console.log(`   POST /api/questions/:id/submit - 提交题目作答 🆕`)
  console.log(`   GET  /api/questions/:id/practice-records - 获取题目练习记录 🆕`)
  console.log(`   GET  /api/questions/recommendations - 获取题目推荐 🆕`)
  console.log(`   GET  /api/users/statistics - 获取用户统计数据`)
  console.log(`   POST /api/users/statistics/events - 记录统计事件`)
  console.log(`   GET  /api/users/leaderboard - 获取排行榜`)
  console.log(`   GET  /api/users/trends - 获取趋势数据`)
  console.log(`\n🎯 开始API测试...`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n📴 正在关闭Mock API服务器...')
  server.close(() => {
    console.log('✅ Mock API服务器已关闭')
    process.exit(0)
  })
})

module.exports = server
