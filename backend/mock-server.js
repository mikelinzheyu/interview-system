/**
 * Mock API服务器 - 用于前端测试
 * 模拟后端API响应
 */
require('dotenv').config() // ⬅️ 首先加载环境变量

const http = require('http')
const https = require('https')
const url = require('url')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const QRCode = require('qrcode')
const { initializeWebSocket } = require('./websocket-server')
const redisClient = require('./redis-client')
const chatWorkflowService = require('./services/chatWorkflowService') // ⬅️ 然后加载服务

const PORT = 3001

// ============ 加载学科数据 ============
let disciplinesData = []
try {
  const disciplinesPath = path.join(__dirname, '../frontend/src/data/disciplines-complete.json')
  const disciplinesJson = fs.readFileSync(disciplinesPath, 'utf-8')
  disciplinesData = JSON.parse(disciplinesJson)
  console.log(`✓ 成功加载 ${disciplinesData.length} 个学科门类数据`)
} catch (e) {
  console.warn(`⚠️  加载学科数据失败: ${e.message}，将使用空数据`)
  disciplinesData = []
}

const CURRENT_USER_ID = 1

// ============ Dify API 配置 ============
const DIFY_CONFIG = {
  apiKey: process.env.DIFY_API_KEY || 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
  baseURL: process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1',
  workflowURL: process.env.DIFY_WORKFLOW_URL || 'https://api.dify.ai/v1/workflows/run',
  // 具体工作流配置（三个工作流，每个有独立的API Key）
  workflows: {
    generate_questions: {
      id: process.env.DIFY_WORKFLOW_1_ID || '560EB9DDSwOFc8As',
      apiKey: process.env.DIFY_API_KEY || 'app-WhLg4w9QxdY7vUqbWbYWBWYi',
      url: process.env.DIFY_WORKFLOW_1_URL || 'https://udify.app/workflow/560EB9DDSwOFc8As'
    },
    generate_answer: {
      id: process.env.DIFY_WORKFLOW_2_ID || '5X6RBtTFMCZr0r4R',
      apiKey: process.env.DIFY_WORKFLOW_2_API_KEY || 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
      url: process.env.DIFY_WORKFLOW_2_URL || 'https://udify.app/workflow/5X6RBtTFMCZr0r4R'
    },
    score_answer: {
      id: process.env.DIFY_WORKFLOW_3_ID || '7C4guOpDk2GfmIFy',
      apiKey: process.env.DIFY_WORKFLOW_3_API_KEY || 'app-Omq7PcI6P5g1CfyDnT8CNiua',
      url: process.env.DIFY_WORKFLOW_3_URL || 'https://udify.app/workflow/7C4guOpDk2GfmIFy'
    }
  }
}


const MEDIA_BASE_PATH = '/api/chat/uploads'
const MEDIA_STORAGE_ROOT = path.join(__dirname, 'uploads')
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
const CACHE_TTL_MS = 5000
const SEARCH_CACHE_TTL_MS = 8000

if (!fs.existsSync(MEDIA_STORAGE_ROOT)) {
  fs.mkdirSync(MEDIA_STORAGE_ROOT, { recursive: true })
}

const cacheStore = new Map()

function buildCacheKey(namespace, params) {
  return `${namespace}:${JSON.stringify(params)}`
}

function cacheSet(key, value, ttlMs = CACHE_TTL_MS) {
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs })
}

function cacheGet(key) {
  const record = cacheStore.get(key)
  if (!record) return null
  if (record.expiresAt <= Date.now()) {
    cacheStore.delete(key)
    return null
  }
  return record.value
}

function cacheInvalidate(prefix) {
  if (!prefix) return
  const keys = Array.from(cacheStore.keys())
  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key)
    }
  })
}

function sanitizeFileName(name) {
  if (!name) return 'file'
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function decodeBase64Payload(payload) {
  if (!payload) return null
  if (payload.includes('base64,')) {
    return Buffer.from(payload.split('base64,').pop(), 'base64')
  }
  return Buffer.from(payload, 'base64')
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

  mediaIdCounter: 1,
  mediaLibrary: [],
  mediaLookup: new Map(),
  // 错题集（内存模拟）
  wrongAnswers: [],
  wrongAnswerReviewLogs: [],
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
      twoFactorEnabled: false,
      isTwoFactorEnabled: false,
      lastPasswordChange: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      loginDevices: [
        {
          id: 'dev_current',
          deviceName: 'Chrome on Windows',
          browser: 'Chrome 120.0',
          os: 'Windows 10',
          lastActiveAt: new Date().toISOString(),
          ipAddress: '192.168.1.101',
          isCurrent: true
        },
        {
          id: 'dev_mobile',
          deviceName: 'Safari on iPhone',
          browser: 'Safari 17',
          os: 'iOS 17',
          lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
          ipAddress: '10.0.0.5',
          isCurrent: false
        }
      ]
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
          submissionCount: 15,
          approvalRate: 0.80,
          level: 'expert'  // beginner | intermediate | advanced | expert
        },
        {
          domainId: 2,
          domainName: '金融学',
          submissionCount: 10,
          approvalRate: 0.60,
          level: 'intermediate'
        }
      ],

      // 最近活动
      activityLog: [
        {
          action: 'submitted',
          submissionId: 1,
          timestamp: '2024-09-20T10:30:00Z',
          description: '提交了题目 "实现一个LRU缓存"'
        },
        {
          action: 'approved',
          submissionId: 2,
          questionId: 102,
          timestamp: '2024-09-19T09:15:00Z',
          description: '题目 "股票估值方法对比" 通过审核'
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
          submissionCount: 8,
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
    },
    {
      id: 6,
      slug: 'hot-1',
      forumId: 1,
      userId: 1,
      username: 'vue_master',
      userAvatar: 'https://cube.elemecdn.com/9/bc/1f819d1c9892da3de9a88e3c7a6fejpeg.jpeg',
      title: 'Vue 3 性能优化的完整指南',
      content: `# Vue 3 性能优化的完整指南

## 为什么需要性能优化
Vue 3 的组合式 API 让我们可以快速堆叠能力，但如果忽视性能，丰富的交互就会变成负担。

### 关键指标
- 首屏渲染 (FMP)
- 交互延迟 (TTI)
- 持续内存占用

## 编译期优化策略
### 善用 \`<script setup>\`
组合式 API 可以让 Tree-Shaking 更有效，组件运行时代码体积也能保持更小。

### 静态提升与内联事件
确保静态内容在模板编译阶段被提升，只渲染一次即可。

## 运行时优化技巧
### 拆分响应式状态
把大型对象拆成多个 ref，避免每次修改都触发整棵依赖树更新。

### 合理使用 watchEffect
在复杂副作用里，使用 \`watch\` 并设置 \`flush: 'post'\`，把计算放到 DOM 更新之后。

## 监控与排查
结合 Vue Devtools 性能面板与 Chrome Performance，配合 Web Vitals 追踪真实用户数据。

## 总结
性能优化没有银弹，建立持续的监控和回归基准，才能在版本迭代中保持敏捷表现。`,
      contentType: 'markdown',
      tags: ['Vue3', '性能优化', '前端架构'],
      isPinned: true,
      isLocked: false,
      viewCount: 15200,
      likeCount: 823,
      commentCount: 42,
      status: 'approved',
      aiReviewScore: 0.97,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      author: {
        id: 'author-vue-master',
        name: '进击的前端人',
        avatar: 'https://cube.elemecdn.com/0/88/ff94d3c6d86f60cbe2e86151d6a5cda1.png',
        bio: 'Vue 性能优化布道师 · 前端架构师',
        title: '高级前端工程师',
        level: '专家作者',
        followerCount: 9800,
        articleCount: 68,
        likeCount: 128000,
        viewCount: 1200000
      }
    },
    {
      id: 20,
      forumId: 3,
      userId: 1,
      username: 'testuser',
      userAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      title: '【Linux】【操作】Linux操作集锦系列之十五——如何安全管理加密文件',
      content: `# Linux 加密文件管理指南

本篇作为 Linux 操作集锦系列的一部分，重点介绍如何在日常工作中安全地管理和备份加密文件，而不是尝试绕过或破解他人设置的安全措施。

## 适用场景

- 自己创建的文档、压缩包等需要长期保存
- 希望防止误删或遗忘密码导致的重要数据丢失

## 安全建议

1. 使用合规工具创建加密文件，并妥善保存密码或密钥
2. 为重要资料做好多地备份，避免单点故障
3. 定期检查备份是否可用，防止误操作或介质损坏
4. 严格遵守公司和法律法规要求，不对非授权数据进行任何“破解”尝试

## 总结

合理使用加密与备份，可以在确保数据安全的前提下，降低遗忘密码、设备故障等带来的风险。请始终在合法、合规的前提下使用相关工具与技术。`,
      contentType: 'markdown',
      tags: ['linux', '加密', '备份', '安全'],
      isPinned: false,
      isLocked: false,
      viewCount: 2400,
      likeCount: 33,
      commentCount: 0,
      status: 'approved',
      aiReviewScore: 0.9,
      createdAt: '2025-11-09T10:00:00Z',
      updatedAt: '2025-11-09T10:00:00Z'
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
  postIdCounter: 7,
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
function registerMediaRecord(record) {
  const stored = { ...record, id: mockData.mediaIdCounter++ }
  mockData.mediaLibrary.push(stored)
  mockData.mediaLookup.set(String(stored.id), stored)
  mockData.mediaLookup.set(stored.storageName, stored)
  return stored
}

function findMediaRecord(key) {
  if (!key) return null
  return mockData.mediaLookup.get(String(key)) || null
}

function removeMediaRecord(key) {
  const record = findMediaRecord(key)
  if (!record) return null
  mockData.mediaLibrary = mockData.mediaLibrary.filter((item) => item.id !== record.id)
  mockData.mediaLookup.delete(String(record.id))
  mockData.mediaLookup.delete(record.storageName)
  return record
}
function storeUploadedMedia({ fileName, contentType, base64 }) {
  const buffer = decodeBase64Payload(base64)
  if (!buffer || !buffer.length) {
    throw new Error('EMPTY_FILE')
  }
  if (buffer.length > MAX_UPLOAD_SIZE) {
    throw new Error('FILE_TOO_LARGE')
  }
  const safeName = sanitizeFileName(fileName || 'file')
  const extension = path.extname(safeName)
  const storageName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`
  const filePath = path.join(MEDIA_STORAGE_ROOT, storageName)
  fs.writeFileSync(filePath, buffer)
  const record = registerMediaRecord({
    fileName: fileName || safeName,
    contentType: contentType || 'application/octet-stream',
    size: buffer.length,
    storageName,
    path: filePath,
    createdAt: new Date().toISOString()
  })
  return { ...record, url: `${MEDIA_BASE_PATH}/${record.storageName}` }
}
function resolveMediaFile(key) {
  const record = findMediaRecord(key)
  if (!record) return null
  const filePath = path.join(MEDIA_STORAGE_ROOT, record.storageName)
  if (!fs.existsSync(filePath)) {
    return null
  }
  return { record, filePath }
}
function buildSearchSnippet(content, keyword) {
  if (!content) return ''
  const lower = content.toLowerCase()
  const needle = keyword.toLowerCase()
  const index = lower.indexOf(needle)
  if (index === -1) {
    return content.length > 60 ? `${content.slice(0, 57)}...` : content
  }
  const start = Math.max(0, index - 20)
  const end = Math.min(content.length, index + needle.length + 20)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < content.length ? '...' : ''
  return `${prefix}${content.slice(start, end)}${suffix}`
}

function serializeMedia(record) {
  if (!record) return null
  const storageName = record.storageName || (record.url ? record.url.split('/').pop() : null)
  const urlPath = record.url || (storageName ? `${MEDIA_BASE_PATH}/${storageName}` : null)
  if (!urlPath) return null
  return {
    id: record.id ?? null,
    fileName: record.fileName || 'file',
    contentType: record.contentType || 'application/octet-stream',
    size: record.size || 0,
    url: urlPath,
    createdAt: record.createdAt || new Date().toISOString()
  }
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
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id'
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
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
      body += chunk.toString('utf8')
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

function handleQuestionCategoryRequest(req, res) {
  const parsedUrl = url.parse(req.url, true)
  const query = parsedUrl.query || {}
  const domainId = query.domain_id ? Number(query.domain_id) : null

  let categories = mockData.questionCategories || []

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

/**
 * 根据帖子 ID 或 slug 定位真实数据
 */
function findPostByIdentifier(identifier) {
  if (identifier === undefined || identifier === null) return null
  const normalized = String(identifier).trim()
  if (!normalized) return null

  const numericId = Number(normalized)
  if (!Number.isNaN(numericId)) {
    const numericMatch = mockData.posts.find(
      (post) => Number(post.id) === numericId
    )
    if (numericMatch) return numericMatch
  }

  return (
    mockData.posts.find((post) => {
      if (post.slug && post.slug.toLowerCase() === normalized.toLowerCase()) {
        return true
      }
      return String(post.id) === normalized
    }) || null
  )
}

// ============ Dify API 调用函数 ============

/**
 * 调用 Dify 工作流
 * @param {Object} requestData - 请求数据
 * @returns {Promise} - 返回 Dify API 响应
 */
async function callDifyWorkflow(requestData) {
  return new Promise((resolve, reject) => {
    // 根据 requestType 选择正确的工作流配置
    let workflowId = '560EB9DDSwOFc8As'
    let apiKey = DIFY_CONFIG.workflows.generate_questions.apiKey

    if (requestData.requestType === 'generate_questions') {
      workflowId = DIFY_CONFIG.workflows.generate_questions.id
      apiKey = DIFY_CONFIG.workflows.generate_questions.apiKey
    } else if (requestData.requestType === 'generate_answer') {
      workflowId = DIFY_CONFIG.workflows.generate_answer.id
      apiKey = DIFY_CONFIG.workflows.generate_answer.apiKey
    } else if (requestData.requestType === 'score_answer') {
      workflowId = DIFY_CONFIG.workflows.score_answer.id
      apiKey = DIFY_CONFIG.workflows.score_answer.apiKey
    }

    const requestBody = JSON.stringify({
      inputs: {
        job_title: requestData.jobTitle || '',
        request_type: requestData.requestType || 'generate_questions',
        question: requestData.question || '',
        question_id: requestData.questionId || '',
        standard_answer: requestData.standardAnswer || '',
        candidate_answer: requestData.candidateAnswer || '',
        session_id: requestData.sessionId || ''
      },
      response_mode: 'blocking', // 阻塞模式,等待完整响应
      user: requestData.userId || 'user-' + Date.now()
    })

    // 使用正确的 Dify 工作流 API 端点
    // 注意：Dify API 使用 /workflows/run 通用端点，工作流通过 API Key 区分
    const apiUrl = new URL(`${DIFY_CONFIG.baseURL}/workflows/run`)

    const options = {
      hostname: apiUrl.hostname,
      port: apiUrl.port || 443,
      path: apiUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
          console.log('📦 Dify 完整响应体:', data.substring(0, 500))

          const response = JSON.parse(data)
          console.log('📦 解析后的 outputs:', JSON.stringify(response.data?.outputs || {}, null, 2))

          if (res.statusCode === 200) {
            const outputs = response.data?.outputs || {}

            // 根据 request_type 返回不同的数据结构
            if (requestData.requestType === 'generate_questions') {
              // 处理 Dify 工作流1 输出 (可能是 generated_questions 或 questions)
              let questionsData = outputs.generated_questions || outputs.questions || '[]'

              // 如果是字符串，需要解析为JSON
              if (typeof questionsData === 'string') {
                try {
                  questionsData = JSON.parse(questionsData)
                } catch (e) {
                  questionsData = []
                }
              }

              resolve({
                success: true,
                data: {
                  session_id: outputs.session_id,
                  generated_questions: parseQuestions(questionsData),
                  metadata: {
                    workflowId: response.workflow_run_id,
                    processingTime: response.elapsed_time || 0
                  }
                }
              })
            } else if (requestData.requestType === 'score_answer') {
              // 工作流3 返回评分结果
              // 包含来自 Dify 工作流的输出字段
              resolve({
                success: true,
                data: {
                  session_id: requestData.sessionId || outputs.session_id,
                  question_id: requestData.questionId || outputs.question_id,
                  question: requestData.question || outputs.question,
                  comprehensive_evaluation: outputs.comprehensive_evaluation || '',
                  overall_score: outputs.overall_score || 0,
                  standard_answer: outputs.standard_answer || '',
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

// ========== Wrong Answers helpers ==========
function ensureWrongAnswersSeeded() {
  if (!Array.isArray(mockData.wrongAnswers)) mockData.wrongAnswers = []
  if (mockData.wrongAnswers.length > 0) return

  const baseQuestions = Array.isArray(mockData.questions) && mockData.questions.length
    ? mockData.questions.slice(0, 8)
    : [
        { id: 101, title: 'Java 内存模型可见性', content: 'volatile 保证了什么？', difficulty: 'medium', domainId: 1, knowledgePoints: ['JMM','并发'] },
        { id: 102, title: 'HTTP 状态码', content: '502 与 504 区别？', difficulty: 'easy', domainId: 1, knowledgePoints: ['HTTP','网关'] },
        { id: 103, title: 'MySQL 索引', content: '覆盖索引的原理？', difficulty: 'hard', domainId: 1, knowledgePoints: ['索引','存储引擎'] }
      ]

  mockData.wrongAnswers = baseQuestions.map((q, idx) => ({
    id: idx + 1,
    questionId: q.id,
    questionTitle: q.title || `Question ${idx + 1}`,
    questionContent: q.content || 'Content',
    knowledgePoints: q.knowledgePoints || ['基础'],
    difficulty: q.difficulty || 'medium',
    source: 'ai_interview',
    reviewStatus: idx % 3 === 0 ? 'mastered' : 'reviewing',
    masteryLevel: idx % 3 === 0 ? '已掌握' : '部分掌握',
    boxLevel: idx % 3 === 0 ? 4 : 2,
    nextReviewAt: new Date(Date.now() + (idx % 3 === 0 ? 3 : -1) * 24 * 3600 * 1000).toISOString(),
    lastReviewedAt: null,
    wrongCount: Math.floor(Math.random() * 3) + 1,
    correctCount: Math.floor(Math.random() * 2),
    userNotes: '',
    createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// Review scheduling (Leitner-like)
const REVIEW_INTERVALS_DAYS = [0, 1, 2, 4, 7, 15] // index = boxLevel (1..5)

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function deriveMastery(boxLevel) {
  if (boxLevel >= 4) return '已掌握'
  if (boxLevel >= 2) return '部分掌握'
  return '未掌握'
}

function scheduleOnResult(record, result) {
  const now = Date.now()
  const currentBox = Number(record.boxLevel || 1)
  let nextBox = currentBox

  if (result === 'pass') nextBox = clamp(currentBox + 1, 1, 5)
  else if (result === 'fail') nextBox = 1
  else if (result === 'doubt') nextBox = clamp(currentBox, 1, 5)

  const days = REVIEW_INTERVALS_DAYS[nextBox] || 1
  const next = new Date(now + days * 24 * 3600 * 1000)

  record.boxLevel = nextBox
  record.masteryLevel = deriveMastery(nextBox)
  record.nextReviewAt = next.toISOString()
  record.lastReviewedAt = new Date(now).toISOString()
  record.reviewStatus = record.masteryLevel === '已掌握' ? 'mastered' : 'reviewing'
  record.updatedAt = record.lastReviewedAt
}

// ==================== AI 聊天处理函数 ====================

/**
 * 处理本地聊天流 - 模拟响应
 */
function handleLocalChatStream(res) {
  const mockResponse = [
    '这是 AI 对',
    '你提问的',
    '一个回复。',
    '它会逐字',
    '显示在前',
    '端。',
  ]

  let index = 0
  const timer = setInterval(() => {
    if (index < mockResponse.length) {
      const chunk = mockResponse[index]
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk, answer: chunk })}\n\n`)
      index++
    } else {
      const conversationId = `conv-mock-${Date.now()}`
      res.write(`data: ${JSON.stringify({ type: 'end', conversationId, messageId: 'mock-msg-' + Date.now() })}\n\n`)
      res.write('event: done\n')
      res.write(`data: ${JSON.stringify({ conversationId })}\n\n`)
      res.end()
      clearInterval(timer)
    }
  }, 100)
}

/**
 * 处理 Dify Chat API 流
 */
async function handleDifyChatStream(res, message, userId, conversationId, articleContent = '') {
  try {
    console.log(`[Dify Chat] 开始流式响应 - 用户: ${userId}`)

    let fullAnswer = ''
    let finalConversationId = conversationId
    let messageId = ''

    // 调用 Dify Chat API
    for await (const chunk of chatWorkflowService.sendMessage(message, userId, conversationId, articleContent)) {
      if (chunk.type === 'chunk') {
        // 发送内容块
        const content = chunk.content || chunk.answer
        fullAnswer += content
        res.write(`data: ${JSON.stringify({
          event: 'agent_message',
          type: 'chunk',
          answer: content,
          content: content,
        })}\n\n`)
      } else if (chunk.type === 'end') {
        // 保存对话ID和消息ID
        finalConversationId = chunk.conversationId
        messageId = chunk.messageId

        // 发送对话结束
        res.write(`data: ${JSON.stringify({
          event: 'message_end',
          type: 'end',
          conversationId: finalConversationId,
          messageId: messageId,
        })}\n\n`)
        res.write('event: done\n')
        res.write(`data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`)

        // 保存对话到 Redis
        if (finalConversationId && userId) {
          try {
            await redisClient.addMessageToConversation(finalConversationId, userId, {
              role: 'user',
              content: message
            })
            await redisClient.addMessageToConversation(finalConversationId, userId, {
              role: 'assistant',
              content: fullAnswer,
              messageId: messageId
            })
            console.log(`[Dify Chat] 对话已保存到 Redis: ${finalConversationId}`)
          } catch (saveError) {
            console.error(`[Dify Chat] 保存对话失败: ${saveError.message}`)
          }
        }
      }
    }

    res.end()
    console.log(`[Dify Chat] 流式响应完成 - 最终对话ID: ${finalConversationId}`)
  } catch (error) {
    console.error(`[Dify Chat] 错误: ${error.message}`)
    // 错误时降级到本地模拟
    try {
      handleLocalChatStream(res)
    } catch (e) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
      res.end()
    }
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

  // 兼容：用户进度（示例数据）
  'GET:/api/user/progress': (req, res) => {
    try {
      const query = url.parse(req.url, true).query
      const domain = query.domain || 'general'
      const completed = Math.floor(Math.random() * 60) + 20
      const total = 100
      const progressRate = Number((completed / total).toFixed(2))
      const data = {
        domain,
        completed,
        total,
        progressRate,
        recentActivity: [
          { date: new Date(Date.now() - 86400000 * 1).toISOString(), count: 5 },
          { date: new Date(Date.now() - 86400000 * 2).toISOString(), count: 7 },
          { date: new Date(Date.now() - 86400000 * 3).toISOString(), count: 4 }
        ]
      }
      sendResponse(res, 200, data)
    } catch (e) {
      sendResponse(res, 500, null, `progress 生成失败: ${e.message}`)
    }
  },

  // 兼容：推荐领域（从现有 domains 取前 N 个）
  'GET:/api/domains/recommended': (req, res) => {
    try {
      const top = (mockData.domains || []).filter(d => d.active).slice(0, 6)
      sendResponse(res, 200, top)
    } catch (e) {
      sendResponse(res, 500, null, `recommended 生成失败: ${e.message}`)
    }
  },

  // 新增：层级化域列表（用于分类浏览器）
  'GET:/api/domains/hierarchical': (req, res) => {
    try {
      // 构建层级化数据
      const hierarchical = [
        {
          id: 100,
          name: '工学',
          slug: 'engineering',
          level: 'discipline',
          icon: '🏗️',
          parentId: null,
          description: '工程应用与技术创新方向',
          children: [
            {
              id: 101,
              name: '计算机类',
              slug: 'computer',
              level: 'field',
              icon: '💻',
              parentId: 100,
              description: '计算机科学与技术核心模块',
              children: [
                {
                  id: 102,
                  name: '前端工程',
                  slug: 'frontend-engineering',
                  level: 'domain',
                  icon: '🌐',
                  parentId: 101,
                  description: '现代 Web 前端开发与工程化实践',
                  questionCount: 116,
                  children: [
                    {
                      id: 103,
                      name: 'React 进阶',
                      slug: 'react-advanced',
                      level: 'track',
                      parentId: 102,
                      icon: '⚛️',
                      description: '构建高可维护性的组件化前端应用',
                      questionCount: 48
                    },
                    {
                      id: 104,
                      name: '性能优化专题',
                      slug: 'frontend-performance',
                      level: 'track',
                      parentId: 102,
                      icon: '⚡',
                      description: '涵盖性能瓶颈定位与优化方案',
                      questionCount: 38
                    }
                  ]
                },
                {
                  id: 105,
                  name: '后端开发',
                  slug: 'backend-development',
                  level: 'domain',
                  icon: '🖥️',
                  parentId: 101,
                  description: '服务端应用与系统设计核心',
                  questionCount: 98
                }
              ]
            },
            {
              id: 106,
              name: '电子信息类',
              slug: 'electronics',
              level: 'field',
              icon: '📱',
              parentId: 100,
              description: '电子与通信技术应用',
              children: [
                {
                  id: 107,
                  name: '嵌入式系统',
                  slug: 'embedded-systems',
                  level: 'domain',
                  icon: '🔌',
                  parentId: 106,
                  description: '微控制器与实时系统设计',
                  questionCount: 52
                }
              ]
            }
          ]
        },
        {
          id: 200,
          name: '理学',
          slug: 'sciences',
          level: 'discipline',
          icon: '🔬',
          parentId: null,
          description: '基础理论与科学研究方向',
          children: [
            {
              id: 201,
              name: '数学类',
              slug: 'mathematics',
              level: 'field',
              icon: '📐',
              parentId: 200,
              description: '数学基础与应用数学',
              children: [
                {
                  id: 202,
                  name: '离散数学',
                  slug: 'discrete-mathematics',
                  level: 'domain',
                  icon: '📊',
                  parentId: 201,
                  description: '算法与数据结构基础',
                  questionCount: 64
                }
              ]
            }
          ]
        }
      ]
      sendResponse(res, 200, hierarchical)
    } catch (e) {
      sendResponse(res, 500, null, `hierarchical 生成失败: ${e.message}`)
    }
  },

  // 新增：问题聚合面向（facets） - 用于过滤器
  'GET:/api/questions/facets': (req, res) => {
    try {
      const query = url.parse(req.url, true).query
      // 从查询参数中可以获取 keyword, category_id, tags 等
      // 这里简单示例，返回固定的 facets 数据
      const facets = {
        difficulties: [
          { label: '基础', value: 'easy', count: 120 },
          { label: '进阶', value: 'medium', count: 85 },
          { label: '挑战', value: 'hard', count: 34 }
        ],
        categories: [
          { label: '前端开发', value: 'frontend', count: 116 },
          { label: '后端开发', value: 'backend', count: 98 },
          { label: '系统设计', value: 'system-design', count: 52 },
          { label: '数据库', value: 'database', count: 45 },
          { label: '网络', value: 'network', count: 38 }
        ],
        types: [
          { label: '单选题', value: 'single-choice', count: 180 },
          { label: '多选题', value: 'multiple-choice', count: 95 },
          { label: '填空题', value: 'fill-blank', count: 30 },
          { label: '编程题', value: 'coding', count: 25 }
        ]
      }
      sendResponse(res, 200, facets)
    } catch (e) {
      sendResponse(res, 500, null, `facets 生成失败: ${e.message}`)
    }
  },

  // ============ 新增：学科体系 API ============

  // 1. GET /api/disciplines - 返回所有学科门类 + 专业类 + 专业
  'GET:/api/disciplines': (req, res) => {
    try {
      if (!disciplinesData || disciplinesData.length === 0) {
        sendResponse(res, 200, [], '暂未加载学科数据')
        return
      }
      sendResponse(res, 200, disciplinesData)
    } catch (e) {
      sendResponse(res, 500, null, `学科数据加载失败: ${e.message}`)
    }
  },

  // 2. GET /api/disciplines/:id/major-groups - 返回某学科的专业类列表
  'GET:/api/disciplines/:id/major-groups': (req, res) => {
    try {
      const disciplineId = req.url.split('/')[3]
      const discipline = disciplinesData.find(d => d.id === disciplineId)

      if (!discipline) {
        sendResponse(res, 404, null, `学科 ${disciplineId} 不存在`)
        return
      }

      const majorGroups = (discipline.majorGroups || []).map(group => ({
        id: group.id,
        code: group.code,
        name: group.name,
        description: group.description,
        questionCount: group.questionCount || 0,
        majorCount: (group.majors || []).length,
        majors: (group.majors || []).map(m => ({
          id: m.id,
          code: m.code,
          name: m.name,
          icon: m.icon,
          questionCount: m.questionCount || 0
        }))
      }))

      sendResponse(res, 200, majorGroups)
    } catch (e) {
      sendResponse(res, 500, null, `查询专业类失败: ${e.message}`)
    }
  },

  // 3. GET /api/majors/:id/details - 返回专业详情 + 细分方向
  'GET:/api/majors/:id/details': (req, res) => {
    try {
      const majorId = req.url.split('/')[3]

      // 从所有学科中查找专业
      let targetMajor = null
      let parentGroup = null

      for (const discipline of disciplinesData) {
        for (const group of discipline.majorGroups || []) {
          const major = (group.majors || []).find(m => m.id === majorId)
          if (major) {
            targetMajor = major
            parentGroup = group
            break
          }
        }
        if (targetMajor) break
      }

      if (!targetMajor) {
        sendResponse(res, 404, null, `专业 ${majorId} 不存在`)
        return
      }

      const majorDetail = {
        id: targetMajor.id,
        code: targetMajor.code,
        name: targetMajor.name,
        description: targetMajor.description,
        icon: targetMajor.icon,
        questionCount: targetMajor.questionCount || 0,
        difficulty: targetMajor.difficulty || 'intermediate',
        popularity: targetMajor.popularity || 0,
        majorGroupId: parentGroup.id,
        majorGroupName: parentGroup.name,
        specializations: (targetMajor.specializations || []).map(spec => ({
          id: spec.id,
          name: spec.name,
          description: spec.description,
          coreCourses: spec.coreCourses || [],
          relatedSkills: spec.relatedSkills || [],
          questionCount: spec.questionCount || 0
        }))
      }

      sendResponse(res, 200, majorDetail)
    } catch (e) {
      sendResponse(res, 500, null, `查询专业详情失败: ${e.message}`)
    }
  },

  // 4. GET /api/specializations/:id - 返回细分方向详情
  'GET:/api/specializations/:id': (req, res) => {
    try {
      const specId = req.url.split('/')[3]

      // 从所有学科中查找细分方向
      let targetSpec = null
      let parentMajor = null

      for (const discipline of disciplinesData) {
        for (const group of discipline.majorGroups || []) {
          for (const major of group.majors || []) {
            const spec = (major.specializations || []).find(s => s.id === specId)
            if (spec) {
              targetSpec = spec
              parentMajor = major
              break
            }
          }
          if (targetSpec) break
        }
        if (targetSpec) break
      }

      if (!targetSpec) {
        sendResponse(res, 404, null, `细分方向 ${specId} 不存在`)
        return
      }

      const specDetail = {
        id: targetSpec.id,
        name: targetSpec.name,
        description: targetSpec.description,
        parentMajorId: parentMajor.id,
        parentMajorName: parentMajor.name,
        coreCourses: targetSpec.coreCourses || [],
        relatedSkills: targetSpec.relatedSkills || [],
        questionCount: targetSpec.questionCount || 0,
        learningPath: [
          {
            stage: 1,
            name: '基础阶段',
            description: '掌握基础理论和核心概念',
            estimatedDays: 30,
            topics: (targetSpec.coreCourses || []).slice(0, 2)
          },
          {
            stage: 2,
            name: '进阶阶段',
            description: '深入学习专业核心知识',
            estimatedDays: 60,
            topics: (targetSpec.coreCourses || []).slice(2)
          },
          {
            stage: 3,
            name: '实战阶段',
            description: '项目实践和技能应用',
            estimatedDays: 30,
            topics: targetSpec.relatedSkills || []
          }
        ]
      }

      sendResponse(res, 200, specDetail)
    } catch (e) {
      sendResponse(res, 500, null, `查询细分方向失败: ${e.message}`)
    }
  },

  // 会话管理 API
  'POST:/api/sessions/save': async (req, res) => {
    try {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', async () => {
        const data = JSON.parse(body)
        const { session_id, question_id, answer } = data

        if (!session_id || !question_id || !answer) {
          sendResponse(res, 400, null, '缺少必要参数: session_id, question_id, answer')
          return
        }

        try {
          // 从 Redis 读取会话数据
          const sessionData = await redisClient.loadSession(session_id)

          if (!sessionData) {
            sendResponse(res, 404, null, `会话 ${session_id} 不存在`)
            return
          }

          // 查找并更新问题的答案
          let found = false
          if (sessionData.questions && Array.isArray(sessionData.questions)) {
            for (const q of sessionData.questions) {
              if (q.id === question_id) {
                q.answer = answer
                q.hasAnswer = true
                found = true
                break
              }
            }
          }

          if (!found) {
            sendResponse(res, 404, null, `问题 ${question_id} 不存在`)
            return
          }

          // 保存更新后的会话数据回 Redis
          await redisClient.saveSession(session_id, sessionData)

          sendResponse(res, 200, { status: 'success' }, '答案保存成功')
        } catch (error) {
          console.error('Redis 操作失败:', error)
          sendResponse(res, 500, null, `Redis 操作失败: ${error.message}`)
        }
      })
    } catch (error) {
      console.error('API 处理失败:', error)
      sendResponse(res, 500, null, `API 处理失败: ${error.message}`)
    }
  },

  // 获取所有会话列表 - 前端查询
  'GET:/api/sessions': async (req, res) => {
    try {
      // 返回空列表，因为这是模拟服务器
      // 在实际应用中，应该从数据库查询当前用户的所有会话
      sendResponse(res, 200, [], '会话列表查询成功')
    } catch (error) {
      console.error('API 处理失败:', error)
      sendResponse(res, 500, null, `API 处理失败: ${error.message}`)
    }
  },

  // 加载会话数据 - workflow2、workflow3 调用
  'GET:/api/sessions/:session_id': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const segments = parsedUrl.pathname.split('/')
      const session_id = segments[segments.length - 1]

      if (!session_id) {
        sendResponse(res, 400, null, '缺少会话ID参数')
        return
      }

      try {
        // 从 Redis 读取会话数据
        const sessionData = await redisClient.loadSession(session_id)

        if (!sessionData) {
          sendResponse(res, 404, null, `会话 ${session_id} 不存在`)
          return
        }

        sendResponse(res, 200, sessionData, '会话数据加载成功')
      } catch (error) {
        console.error('Redis 操作失败:', error)
        sendResponse(res, 500, null, `Redis 操作失败: ${error.message}`)
      }
    } catch (error) {
      console.error('API 处理失败:', error)
      sendResponse(res, 500, null, `API 处理失败: ${error.message}`)
    }
  },

  // 创建新的会话 - workflow1 调用
  'POST:/api/sessions/create': async (req, res) => {
    try {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', async () => {
        try {
          const data = JSON.parse(body)
          const { session_id, job_title, questions } = data

          if (!session_id || !job_title) {
            sendResponse(res, 400, null, '缺少必要参数: session_id, job_title')
            return
          }

          if (!Array.isArray(questions) || questions.length === 0) {
            sendResponse(res, 400, null, '缺少必要参数: questions 必须是非空数组')
            return
          }

          try {
            // 准备会话数据
            const sessionData = {
              session_id,
              job_title,
              questions: questions.map(q => ({
                id: q.id,
                text: q.text,
                answer: q.answer || '',
                hasAnswer: q.hasAnswer || false
              })),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            // 保存到 Redis
            await redisClient.saveSession(session_id, sessionData)

            sendResponse(res, 200, {
              status: 'success',
              session_id
            }, '会话创建成功')
          } catch (error) {
            console.error('Redis 操作失败:', error)
            sendResponse(res, 500, null, `Redis 操作失败: ${error.message}`)
          }
        } catch (parseError) {
          console.error('JSON 解析失败:', parseError)
          sendResponse(res, 400, null, `JSON 解析失败: ${parseError.message}`)
        }
      })
    } catch (error) {
      console.error('API 处理失败:', error)
      sendResponse(res, 500, null, `API 处理失败: ${error.message}`)
    }
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

  // ========== Phase 3.3: AI 自动出题 API (已弃用，使用 POST:/api/ai/dify-workflow) ==========

  // NOTE: 旧的 POST:/api/ai/generate-questions 已删除，改为使用 POST:/api/ai/dify-workflow
  // 原因：避免路由冲突，统一使用 Dify 工作流接口

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

  // 19. 生成文章摘要（社区 AI 助手）
  'POST:/api/ai/summary': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { content, postId } = JSON.parse(body || '{}')
        if (!content || !content.trim()) {
          return sendResponse(res, 400, null, 'Content is required')
        }
        const preview = content.length > 30 ? content.substring(0, 30) + '...' : content
        const summary = `这是一篇关于“${preview}”的文章摘要。`
        sendResponse(res, 200, { summary, fromCache: false, mock: true }, 'OK')
      } catch (e) {
        sendResponse(res, 500, null, e.message || 'Failed to generate summary')
      }
    })
  },

  // 20. 提取文章关键点（社区 AI 助手）
  'POST:/api/ai/keypoints': (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { content, postId } = JSON.parse(body || '{}')
        if (!content || !content.trim()) {
          return sendResponse(res, 400, null, 'Content is required')
        }
        const keypoints = [
          '关键点1: 文章主题与背景',
          '关键点2: 核心观点与论据',
          '关键点3: 结论与启发'
        ]
        sendResponse(res, 200, { keypoints, fromCache: false, mock: true }, 'OK')
      } catch (e) {
        sendResponse(res, 500, null, e.message || 'Failed to extract keypoints')
      }
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
  'GET:/api/categories': handleQuestionCategoryRequest,
  'GET:/api/questions/categories': handleQuestionCategoryRequest,

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

    // 导出题库题目为 CSV
    'GET:/api/questions/export': (req, res) => {
      const parsedUrl = url.parse(req.url, true)
      const query = parsedUrl.query || {}

      const page = Number(query.page) || 1
      const size = Number(query.size) || 1000
      const difficultyFilter = query.difficulty
        ? query.difficulty.split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
        : []
      const typeFilter = query.type
        ? query.type.split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
        : []
      const keyword = (query.keyword || query.q || '').trim().toLowerCase()
      const tagsFilter = query.tags
        ? query.tags.split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
        : []
      const categoryId = query.category_id ? Number(query.category_id) : null
      const domainId = query.domain_id ? Number(query.domain_id) : null
      const sort = query.sort || 'recent'

      let candidates = mockData.questions.slice()

      if (domainId) {
        candidates = candidates.filter(q => q.domainId === domainId)
      }

      if (categoryId) {
        const allowedCategories = getCategoryDescendants
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
        candidates = candidates.filter(question =>
          question.difficulty &&
          difficultyFilter.includes(String(question.difficulty).toLowerCase())
        )
      }

      if (typeFilter.length) {
        candidates = candidates.filter(question =>
          question.type &&
          typeFilter.includes(String(question.type).toLowerCase())
        )
      }

      if (keyword) {
        candidates = candidates.filter(question => {
          const target = [
            question.title,
            question.question,
            question.explanation,
            Array.isArray(question.tags) ? question.tags.join(' ') : ''
          ].join(' ').toLowerCase()
          return target.includes(keyword)
        })
      }

      if (tagsFilter.length) {
        candidates = candidates.filter(question => {
          if (!Array.isArray(question.tags) || !question.tags.length) return false
          const normalizedTags = question.tags.map(tag => String(tag).toLowerCase())
          return tagsFilter.some(tag => normalizedTags.includes(tag))
        })
      }

      candidates.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()

        switch (sort) {
          case 'popular': {
            const aScore = (a.stats?.attempts || 0) + (a.stats?.viewCount || 0)
            const bScore = (b.stats?.attempts || 0) + (b.stats?.viewCount || 0)
            return bScore - aScore
          }
          case 'difficulty':
          case 'difficulty_desc':
            // 这里简单按 estimatedTime 排序，缺失则保持原顺序
            if (!a.estimatedTime || !b.estimatedTime) return 0
            return sort === 'difficulty'
              ? a.estimatedTime - b.estimatedTime
              : b.estimatedTime - a.estimatedTime
          case 'recent':
          default:
            return bTime - aTime
        }
      })

      const start = (page - 1) * size
      const end = start + size
      const pageItems = candidates.slice(start, end)

      let csv = 'id,title,difficulty,category_id,created_at\n'
      pageItems.forEach(q => {
        const id = q.id != null ? String(q.id) : ''
        const rawTitle = q.title != null ? String(q.title) : ''
        const safeTitle = rawTitle.replace(/\"/g, '\'').replace(/\r?\n/g, ' ')
        const difficulty = q.difficulty != null ? String(q.difficulty) : ''
        const category = q.categoryId != null ? String(q.categoryId) : ''
        const createdAt = q.createdAt != null ? String(q.createdAt) : ''

        const row = [
          id,
          `"${safeTitle}"`,
          difficulty,
          category,
          createdAt
        ].join(',')

        csv += `${row}\n`
      })

      const buffer = Buffer.from(csv, 'utf-8')

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=\"questions.csv\"',
        'Content-Length': buffer.length
      })
      res.end(buffer)
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
    // 生成随机位置（适当增大缺口与滑块初始位置的最小水平距离）
    const minX = 80  // 原来是 40，增大到 80
    const maxX = 260 // 保持右侧预留边距不变
    const x = Math.floor(Math.random() * (maxX - minX)) + minX
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
          <p class="countdown" id="countdown">1</p>
          <button class="btn" onclick="redirect()">立即跳转</button>
        </div>
        <script>
          let count = 1;
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
          <p class="countdown" id="countdown">1</p>
          <button class="btn" onclick="redirect()">立即跳转</button>
        </div>
        <script>
          let count = 1;
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

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body)
        console.log('🎯 智能问题生成请求:', requestData)
        console.log('📡 现在调用你的 Dify 工作流 (560EB9DDSwOFc8As)...')

        // 调用 Dify 工作流来生成真实题目
        const difyResult = await callDifyWorkflow({
          requestType: 'generate_questions',
          jobTitle: requestData.position || '前端开发工程师',
          userId: 'user-' + Date.now()
        })

        if (difyResult.success) {
          console.log('✅ Dify 工作流调用成功')

          // 从 Dify 返回的 generated_questions 中提取题目
          let questionsFromDify = difyResult.data?.generated_questions || []

          // 如果 Dify 没有返回足够的题目，用 mock 数据补充
          if (!Array.isArray(questionsFromDify) || questionsFromDify.length === 0) {
            console.log('⚠️ Dify 未返回题目')
            console.log('⚠️ 原因: Dify 工作流可能未配置正确或未返回题目数据')
            console.log('⚠️ 检查项:')
            console.log('   1. 确保 Dify 工作流 ID 正确: 560EB9DDSwOFc8As')
            console.log('   2. 确保 API Key 有权访问该工作流')
            console.log('   3. 确保工作流输出字段包含 questions 或 generated_questions')
            console.log('⚠️ 暂时使用 mock 数据补充...')
            questionsFromDify = mockData.questions.slice(0, 5)
          }

          // 确保有5道题
          while (questionsFromDify.length < 5) {
            const randomQ = mockData.questions[Math.floor(Math.random() * mockData.questions.length)]
            if (!questionsFromDify.some(q => q.id === randomQ.id)) {
              questionsFromDify.push(randomQ)
            }
          }
          questionsFromDify = questionsFromDify.slice(0, 5)

          // 使用第一道题作为当前题目
          const currentQuestion = questionsFromDify[0]

          // 判断题目来源
          const isDifyQuestions = difyResult.data?.generated_questions && difyResult.data.generated_questions.length > 0

          // 标准化格式以匹配前端期望
          const standardizedQuestion = {
            questionId: currentQuestion.id,
            question: currentQuestion.question,
            expectedAnswer: currentQuestion.answer || currentQuestion.expectedAnswer,
            keywords: currentQuestion.tags || currentQuestion.keywords || [],
            category: currentQuestion.categoryId || currentQuestion.category,
            difficulty: currentQuestion.difficulty,
            explanation: currentQuestion.explanation,
            estimatedTime: currentQuestion.estimatedTime,
            generatedBy: isDifyQuestions ? 'dify_workflow' : 'mock_data',
            confidenceScore: isDifyQuestions ? (0.85 + Math.random() * 0.15) : 0.5,
            smartGeneration: true,
            searchSource: isDifyQuestions ? 'dify_rag' : 'mock_database',
            sourceUrls: [],
            sessionId: difyResult.data?.session_id || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hasAnswer: true,
            allQuestions: questionsFromDify.map(q => ({
              id: q.id,
              question: q.question,
              difficulty: q.difficulty,
              category: q.categoryId || q.category,
              tags: q.tags || q.keywords,
              source: isDifyQuestions ? 'dify_workflow' : 'mock_data'
            })),
            generatedAt: new Date().toISOString(),
            source: isDifyQuestions ? 'dify_workflow' : 'mock_data_fallback',
            algorithmVersion: 'v2.0',
            difyMetadata: difyResult.data?.metadata,
            usingFallback: !isDifyQuestions
          }

          console.log(`🎉 成功返回 ${standardizedQuestion.allQuestions.length} 道题目`)
          sendResponse(res, 200, standardizedQuestion, '智能问题生成成功')
        } else {
          // Dify 调用失败，降级到 mock 数据
          console.warn('⚠️ Dify 工作流调用失败:', difyResult.error)
          console.log('⚠️ 降级到 mock 数据')

          const mockQuestion = mockData.questions[Math.floor(Math.random() * mockData.questions.length)]
          const allQuestions = mockData.questions
            .filter(q => q.id !== mockQuestion.id)
            .slice(0, 4)
          allQuestions.unshift(mockQuestion)

          const standardizedQuestion = {
            questionId: mockQuestion.id,
            question: mockQuestion.question,
            expectedAnswer: mockQuestion.answer,
            keywords: mockQuestion.tags || [],
            category: mockQuestion.categoryId,
            difficulty: mockQuestion.difficulty,
            explanation: mockQuestion.explanation,
            estimatedTime: mockQuestion.estimatedTime,
            generatedBy: 'mock_fallback',
            confidenceScore: 0.7,
            smartGeneration: false,
            searchSource: 'local_database',
            sourceUrls: [],
            sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            hasAnswer: true,
            allQuestions: allQuestions.map(q => ({
              id: q.id,
              question: q.question,
              difficulty: q.difficulty,
              category: q.categoryId,
              tags: q.tags
            })),
            generatedAt: new Date().toISOString(),
            source: 'mock_fallback',
            algorithmVersion: 'v2.0',
            notice: 'Dify工作流调用失败，使用本地mock数据'
          }

          sendResponse(res, 200, standardizedQuestion, '使用本地数据生成问题（Dify暂不可用）')
        }
      } catch (error) {
        console.error('❌ 智能问题生成错误:', error)
        sendResponse(res, 400, null, '请求处理失败: ' + error.message)
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
        // 确保 body 不为空
        if (!body || body.trim().length === 0) {
          sendResponse(res, 400, null, '请求体为空')
          return
        }

        console.log('📦 接收到的原始 body:', body)
        console.log('📊 Body 长度:', body.length)

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

  // 获取隐私设置
  'GET:/api/users/privacy': (req, res) => {
    const user = mockData.users[0] || {}
    const defaults = {
      onlineStatus: true,
      allowMessages: true,
      shareLocation: false,
      profileVisibility: 'public'
    }
    const privacy = { ...defaults, ...(user.privacy || user.privacySettings || {}) }
    mockData.users[0] = { ...user, privacy }
    sendResponse(res, 200, privacy, '隐私设置获取成功')
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

  // 获取通知设置
  'GET:/api/users/notification': (req, res) => {
    const user = mockData.users[0] || {}
    const defaults = {
      emailNotifications: false,
      smsNotifications: false,
      pushNotifications: true,
      commentNotifications: true,
      messageNotifications: true,
      systemNotifications: true,
      soundEnabled: true
    }
    const notification = { ...defaults, ...(user.notification || {}) }
    mockData.users[0] = { ...user, notification }
    sendResponse(res, 200, notification, '通知设置获取成功')
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

  // 获取安全信息
  'GET:/api/users/security': (req, res) => {
    const user = mockData.users[0] || {}
    const security = {
      phoneNumber: user.phone || '',
      phoneVerified: !!user.phoneVerified,
      email: user.email || '',
      emailVerified: !!user.emailVerified,
      isTwoFactorEnabled: !!(user.isTwoFactorEnabled ?? user.twoFactorEnabled),
      lastPasswordChange: user.lastPasswordChange || new Date(Date.now() - 100000000).toISOString(),
      loginDevices: user.loginDevices || []
    }
    mockData.users[0] = { ...user, isTwoFactorEnabled: security.isTwoFactorEnabled }
    sendResponse(res, 200, security, '安全信息获取成功')
  },

  // 更新界面设置
  'GET:/api/users/preferences': (req, res) => {
    const user = mockData.users[0] || {}
    const basePreferences = {
      theme: 'light',
      accentColor: user.preferences?.accentColor || user.preferences?.primaryColor || '#409EFF',
      fontSize: 'medium'
    }
    const preferences = { ...basePreferences, ...(user.preferences || {}) }
    mockData.users[0] = { ...user, preferences }

    sendResponse(res, 200, preferences, 'Preferences fetched successfully')
  },

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
    const questionId = parseInt(req.url.split('/').pop())

    // 完整的问题库数据（与前端 CommunityHub.vue 同步）
    const questionsDB = [
      {
        id: 1,
        title: '手写实现 Promise.all 和 Promise.race',
        content: '# 题目描述\n\n请实现 Promise.all 和 Promise.race 两个方法\n\n## Promise.all 要求\n1. 接收一个 Promise 数组\n2. 所有 Promise 都 resolve 时才 resolve\n3. 任意一个 reject 就立即 reject\n\n## Promise.race 要求\n1. 接收一个 Promise 数组\n2. 首先 resolve 或 reject 的 Promise 获胜\n\n## 示例\n```javascript\nconst p1 = Promise.resolve(3)\nconst p2 = new Promise(resolve => setTimeout(() => resolve(\'foo\'), 100))\n\nPromise.all([p1, p2]).then(values => {\n  console.log(values) // [3, \'foo\']\n})\n```',
        difficulty: '中等',
        category: '算法',
        tags: ['JavaScript', 'Promise', '异步编程'],
        author: '算法大师',
        views: 15234,
        discussions: 89,
        favorites: 567,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 2,
        title: 'Vue3 Composition API 最佳实践',
        content: '# Vue3 Composition API 最佳实践\n\nComposition API 是 Vue 3 的一个重要特性，提供了更灵活的代码组织方式。\n\n## 核心概念\n1. setup 函数 - 组件逻辑的入口\n2. reactive 和 ref - 数据响应式\n3. computed - 计算属性\n4. watch 和 watchEffect - 侦听器\n5. 生命周期 hooks - onMounted、onUnmounted 等\n\n## 实战建议\n- 对于复杂逻辑，优先使用 ref\n- 使用 computed 缓存计算结果\n- 合理划分 composable 功能\n- 避免过度抽象，保持代码可读性\n- 使用 TypeScript 增强类型安全\n\n## 常见模式\n```javascript\nimport { ref, computed, onMounted } from \'vue\'\n\nexport default {\n  setup() {\n    const count = ref(0)\n    const doubled = computed(() => count.value * 2)\n    \n    onMounted(() => {\n      console.log(\'Component mounted\')\n    })\n    \n    return { count, doubled }\n  }\n}\n```',
        difficulty: '中等',
        category: '前端',
        tags: ['Vue3', 'Composition API', '前端框架'],
        author: 'Vue专家',
        views: 12890,
        discussions: 67,
        favorites: 489,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 3,
        title: '前端性能优化终极指南',
        content: '# 前端性能优化完全指南\n\n性能优化是现代 Web 开发的核心话题。本文从多个维度讲解如何打造高性能应用。\n\n## 网络层优化\n- CDN 加速 - 地理位置优化\n- HTTP/2 推送 - 多路复用\n- 资源压缩 - gzip、brotli\n- 缓存策略 - 强缓存、协商缓存\n- DNS 预解析 - dns-prefetch\n\n## 代码层优化\n- 代码分割 - Code splitting\n- 懒加载 - 延迟加载非关键资源\n- Tree shaking - 移除未使用代码\n- 压缩混淆 - minify 和 uglify\n- Polyfill 优化 - 按需加载\n\n## 运行时优化\n- 虚拟滚动 - 只渲染可见区域\n- 防抖和节流 - 减少函数调用\n- 内存泄漏修复 - 及时清理引用\n- 长任务分割 - 使用 requestIdleCallback\n- 图片优化 - webp、responsive images',
        difficulty: '困难',
        category: '前端',
        tags: ['性能优化', 'Webpack', '最佳实践'],
        author: '性能优化专家',
        views: 18765,
        discussions: 234,
        favorites: 678,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 4,
        title: 'React Hooks 深度解析',
        content: '# React Hooks 深度解析\n\nHooks 是 React 16.8 引入的特性，彻底改变了 React 函数组件的编写方式。\n\n## 基础 Hooks\n- useState - 管理组件状态\n- useEffect - 处理副作用\n- useContext - 使用 Context 值\n\n## 进阶 Hooks\n- useReducer - 管理复杂状态\n- useMemo - 缓存计算结果\n- useCallback - 缓存回调函数\n- useRef - 获取 DOM 引用\n- useLayoutEffect - 同步执行副作用\n\n## 自定义 Hooks\n创建可复用的逻辑，遵循以下原则：\n- Hook 的名称必须以 use 开头\n- 只在函数组件或自定义 Hook 中调用\n- 不能在条件分支中调用\n\n## 常见陷阱\n1. 依赖数组遗漏 - 导致副作用重复执行\n2. 闭包陷阱 - 使用过期的变量值\n3. 性能问题 - 不必要的渲染\n4. 竞态条件 - 异步操作顺序问题',
        difficulty: '中等',
        category: '前端',
        tags: ['React', 'Hooks', '源码解析'],
        author: 'React狂热者',
        views: 14567,
        discussions: 178,
        favorites: 534,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 5,
        title: '算法面试高频题精讲：链表专题',
        content: '# 链表专题 - 面试必备\n\n链表是数据结构中的基础，也是面试的高频题目。掌握链表相关算法对找工作至关重要。\n\n## 基础操作\n- 链表反转 - 改变指针方向\n- 删除节点 - 跳过指针\n- 找中点 - 快慢指针\n- 检测环 - 推龟兔算法\n\n## 高频面试题\n1. **反转链表** (LeetCode 206)\n   - 递归解法\n   - 迭代解法\n   - 栈辅助解法\n\n2. **环形链表检测** (LeetCode 141)\n   - Floyd 算法\n   - 使用集合\n\n3. **合并两个有序链表** (LeetCode 21)\n   - 归并思想\n   - 递归实现\n\n4. **K 个一组翻转** (LeetCode 25)\n   - 分组处理\n   - 递归或迭代\n\n## 解题技巧\n- 使用双指针 - 快慢、前后\n- 递归解法 - 简洁优雅\n- 虚拟头节点 - 统一逻辑\n- 画图分析 - 清晰思路',
        difficulty: '中等',
        category: '算法',
        tags: ['算法', '链表', '面试'],
        author: '面试官',
        views: 23456,
        discussions: 312,
        favorites: 891,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 6,
        title: 'TypeScript 高级类型系统详解',
        content: '# TypeScript 高级类型系统\n\nTypeScript 的类型系统是其强大之处。掌握高级特性能写出更安全的代码。\n\n## 泛型 (Generics)\n- 泛型函数\n- 泛型类\n- 泛型约束\n- 泛型默认值\n\n## 条件类型 (Conditional Types)\n- 基本语法：`T extends U ? X : Y`\n- 分布式条件类型\n- `infer` 关键字\n\n## 映射类型 (Mapped Types)\n- 遍历对象属性\n- 属性修饰符\n- as 重新映射\n\n## 工具类型\n- Partial、Required、Readonly\n- Record、Pick、Omit\n- Extract、Exclude\n- Parameters、ReturnType\n\n## 实战示例\n```typescript\ntype Readonly<T> = {\n  readonly [K in keyof T]: T[K]\n}\n\ntype Getters<T> = {\n  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]\n}\n```',
        difficulty: '困难',
        category: '前端',
        tags: ['TypeScript', '类型系统', '高级技巧'],
        author: 'TS专家',
        views: 11234,
        discussions: 145,
        favorites: 423,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 7,
        title: '微服务架构设计与实践',
        content: '# 微服务架构设计与实践\n\n微服务已成为大型系统的标准架构。本文分享在实际项目中的设计经验。\n\n## 核心概念\n- 服务拆分原则\n- API 网关\n- 服务注册与发现\n- 配置中心\n\n## 关键问题\n\n### 服务拆分\n- 按业务域拆分\n- 按技术能力拆分\n- 拆分粒度权衡\n\n### 服务治理\n- 限流熔断\n- 重试机制\n- 超时控制\n- 分布式追踪\n\n### 分布式事务\n- 两阶段提交\n- 补偿事务 (Saga)\n- 基于消息队列\n- 最终一致性\n\n### 部署运维\n- 容器化部署\n- Kubernetes 编排\n- 灰度发布\n- 监控告警',
        difficulty: '困难',
        category: '系统设计',
        tags: ['微服务', '架构设计', '分布式'],
        author: '架构师',
        views: 16789,
        discussions: 201,
        favorites: 612,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 8,
        title: 'Node.js 性能调优实战',
        content: '# Node.js 性能调优实战\n\nNode.js 应用性能优化是后端开发的重要课题。\n\n## 内存管理\n- 堆内存分析\n- 内存泄漏检测\n- 垃圾回收优化\n- Buffer 使用规范\n\n## CPU 优化\n- 事件循环理解\n- CPU 密集操作处理\n- Worker Threads\n- 进程池\n\n## I/O 优化\n- 流式处理\n- 连接池\n- 异步操作\n- 缓存策略\n\n## 监控工具\n- clinic.js\n- 0x\n- node-inspect\n- chromium devtools\n\n## 性能基准测试\n```javascript\nconst benchmark = require(\'benchmark\')\nconst suite = new benchmark.Suite()\n\nsuite\n  .add(\'方案A\', () => { /* ... */ })\n  .add(\'方案B\', () => { /* ... */ })\n  .on(\'complete\', () => { /* 结果 */ })\n  .run()\n```',
        difficulty: '中等',
        category: '后端',
        tags: ['Node.js', '性能优化', '后端开发'],
        author: 'Node大神',
        views: 9876,
        discussions: 98,
        favorites: 345,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 9,
        title: '深入理解 JavaScript 事件循环机制',
        content: '# 深入理解 JavaScript 事件循环\n\n事件循环是 JavaScript 运行时的核心机制。理解它对掌握异步编程至关重要。\n\n## 调用栈\n- 函数执行上下文\n- LIFO (后进先出)\n- 栈溢出错误\n\n## 任务队列\n\n### 宏任务 (Macrotask)\n- setTimeout\n- setInterval\n- setImmediate\n- requestAnimationFrame\n- I/O 操作\n\n### 微任务 (Microtask)\n- Promise.then/catch/finally\n- async/await\n- MutationObserver\n- queueMicrotask\n\n## 事件循环流程\n1. 执行同步代码（调用栈）\n2. 执行所有微任务\n3. 执行一个宏任务\n4. 检查是否有微任务，回到第 2 步\n5. 重复直到队列为空\n\n## 经典问题\n```javascript\nconsole.log(\'1\')\n\nsetTimeout(() => {\n  console.log(\'2\')\n}, 0)\n\nPromise.resolve()\n  .then(() => {\n    console.log(\'3\')\n  })\n\nconsole.log(\'4\')\n// 输出顺序：1, 4, 3, 2\n```',
        difficulty: '困难',
        category: '算法',
        tags: ['JavaScript', '事件循环', '异步编程'],
        author: '深度学习者',
        views: 19234,
        discussions: 245,
        favorites: 756,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 10,
        title: 'CSS Grid 布局完全指南',
        content: '# CSS Grid 布局完全指南\n\nCSS Grid 是现代 Web 布局的强大工具，比 Flexbox 更适合二维布局。\n\n## 基础概念\n- Grid Container\n- Grid Item\n- Grid Line\n- Grid Track\n- Grid Area\n- Grid Cell\n\n## 常用属性\n\n### 容器属性\n- display: grid\n- grid-template-columns\n- grid-template-rows\n- grid-gap (gap)\n- justify-items\n- align-items\n\n### 项目属性\n- grid-column-start/end\n- grid-row-start/end\n- grid-column\n- grid-row\n- justify-self\n- align-self\n\n## 响应式设计\n```css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n}\n```\n\n## 实战案例\n- 圣杯布局\n- 瀑布流\n- 响应式卡片网格\n- 复杂页面布局',
        difficulty: '简单',
        category: '前端',
        tags: ['CSS', 'Grid布局', '响应式设计'],
        author: 'CSS达人',
        views: 10567,
        discussions: 87,
        favorites: 412,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 11,
        title: '如何优雅地处理错误异常',
        content: '# 如何优雅地处理错误异常\n\n错误处理是健壮应用的基础。本文详解各种错误处理模式。\n\n## 同步错误处理\n\n### try-catch-finally\n```javascript\ntry {\n  // 可能抛出错误的代码\n} catch (error) {\n  // 处理错误\n} finally {\n  // 清理资源\n}\n```\n\n## 异步错误处理\n\n### Promise 错误处理\n```javascript\nPromise.resolve()\n  .then(result => { /* ... */ })\n  .catch(error => { /* 处理错误 */ })\n  .finally(() => { /* 清理 */ })\n```\n\n### async/await 错误处理\n```javascript\nasync function main() {\n  try {\n    const result = await asyncFunction()\n  } catch (error) {\n    // 处理错误\n  }\n}\n```\n\n## 错误分类\n- SyntaxError - 语法错误\n- ReferenceError - 引用错误\n- TypeError - 类型错误\n- RangeError - 范围错误\n- CustomError - 自定义错误\n\n## 最佳实践\n1. 区分可恢复和不可恢复错误\n2. 提供有意义的错误信息\n3. 记录错误日志\n4. 优雅降级\n5. 错误边界',
        difficulty: '中等',
        category: '前端',
        tags: ['JavaScript', '错误处理', '最佳实践'],
        author: '代码卫士',
        views: 13456,
        discussions: 156,
        favorites: 521,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 12,
        title: '数据结构面试宝典：树与二叉树',
        content: '# 树与二叉树 - 面试宝典\n\n树和二叉树是数据结构的核心。这些知识对大厂面试至关重要。\n\n## 基础概念\n- 根节点、叶子节点\n- 子树、深度、高度\n- 二叉树分类\n  - 满二叉树\n  - 完全二叉树\n  - 二叉搜索树\n  - 平衡二叉树\n\n## 遍历方法\n- **前序遍历** - 中、左、右\n- **中序遍历** - 左、中、右\n- **后序遍历** - 左、右、中\n- **层序遍历** - BFS\n\n## 高频面试题\n1. **二叉树遍历** (LeetCode 94, 144, 145, 102)\n2. **二叉树构建** (LeetCode 105, 106, 889)\n3. **最近公共祖先** (LeetCode 236)\n4. **路径和** (LeetCode 112, 113, 437)\n5. **序列化反序列化** (LeetCode 297)\n6. **展平树** (LeetCode 114)\n\n## 进阶内容\n- AVL 树\n- 红黑树\n- B 树\n- 字典树 (Trie)\n- 线段树',
        difficulty: '困难',
        category: '算法',
        tags: ['算法', '数据结构', '二叉树', '面试'],
        author: '算法导师',
        views: 25678,
        discussions: 378,
        favorites: 945,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 13,
        title: 'Docker 与 Kubernetes 入门到精通',
        content: '# Docker 与 Kubernetes 入门到精通\n\n容器化技术已成为现代开发必备技能。本文详解 Docker 和 K8s。\n\n## Docker 基础\n- 镜像和容器\n- Dockerfile 编写\n- 分层存储\n- 网络驱动\n- 数据卷\n\n## Docker Compose\n- 多容器编排\n- 服务依赖\n- 环境变量\n- 网络配置\n\n## Kubernetes 核心概念\n- Pod - 最小部署单位\n- Deployment - 服务管理\n- Service - 负载均衡\n- Ingress - 路由\n- ConfigMap & Secret\n- PersistentVolume\n\n## 部署实践\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:latest\n        ports:\n        - containerPort: 80\n```',
        difficulty: '困难',
        category: '系统设计',
        tags: ['Docker', 'Kubernetes', '容器化', 'DevOps'],
        author: 'DevOps工程师',
        views: 16234,
        discussions: 198,
        favorites: 587,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 14,
        title: '数据库事务与并发控制详解',
        content: '# 数据库事务与并发控制\n\n事务和并发控制是数据库的核心特性。\n\n## ACID 特性\n- **原子性** (Atomicity) - 全部成功或全部失败\n- **一致性** (Consistency) - 数据满足完整性约束\n- **隔离性** (Isolation) - 事务间不相互影响\n- **持久性** (Durability) - 提交后永久保存\n\n## 隔离级别\n1. **READ UNCOMMITTED** - 读未提交\n   - 存在脏读\n2. **READ COMMITTED** - 读已提交\n   - 存在不可重复读\n3. **REPEATABLE READ** - 可重复读\n   - 存在幻读\n4. **SERIALIZABLE** - 序列化\n   - 完全隔离\n\n## 并发问题\n- 脏读\n- 不可重复读\n- 幻读\n- 第二类丢失更新\n\n## 锁机制\n- 共享锁 (S)\n- 排他锁 (X)\n- 意向锁\n- 死锁检测与恢复\n\n## 实战建议\n- 选择合适的隔离级别\n- 合理使用索引\n- 避免长事务\n- 监控死锁',
        difficulty: '困难',
        category: '数据结构',
        tags: ['数据库', '事务', '并发控制', 'SQL'],
        author: 'DB专家',
        views: 14876,
        discussions: 167,
        favorites: 498,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 15,
        title: 'REST API 设计最佳实践',
        content: '# REST API 设计最佳实践\n\n规范的 API 设计对项目长期维护至关重要。\n\n## RESTful 原则\n- 使用 HTTP 方法 (GET, POST, PUT, DELETE)\n- 资源导向而非操作导向\n- 使用状态码表示结果\n- 无状态设计\n\n## API 版本管理\n- URL 路径版本 `/api/v1/users`\n- 请求头版本 `Accept: application/vnd.myapi.v1+json`\n- 查询参数版本 `?version=1`\n\n## 响应格式设计\n```json\n{\n  "code": 200,\n  "message": "success",\n  "data": { /* ... */ },\n  "timestamp": 1234567890\n}\n```\n\n## 错误处理\n- 使用标准 HTTP 状态码\n- 提供详细的错误信息\n- 返回错误代码便于调试\n\n## 安全性\n- 使用 HTTPS\n- API 认证 (JWT, OAuth)\n- 速率限制\n- 输入验证\n\n## 文档和工具\n- OpenAPI/Swagger\n- API 文档自动生成\n- 在线测试工具',
        difficulty: '中等',
        category: '后端',
        tags: ['API设计', 'REST', '后端开发'],
        author: '架构设计师',
        views: 12345,
        discussions: 134,
        favorites: 467,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 16,
        title: 'Web 安全防护指南',
        content: '# Web 安全防护指南\n\n前端开发必须了解的安全知识，关系到用户数据安全。\n\n## 常见攻击类型\n\n### XSS (Cross-Site Scripting)\n- **反射型 XSS** - URL 注入\n- **存储型 XSS** - 数据库污染\n- **DOM 型 XSS** - JavaScript 操作 DOM\n\n防护方案：\n- 输入验证\n- 输出编码\n- 使用 Content Security Policy (CSP)\n\n### CSRF (Cross-Site Request Forgery)\n- Token 验证\n- SameSite Cookie\n- 自定义请求头\n\n### SQL 注入\n- 参数化查询\n- ORM 框架\n- 输入验证\n\n### XXE (XML External Entity)\n- 禁用外部实体\n- 验证 XML 内容\n\n## 安全最佳实践\n1. **HTTPS** - 传输层加密\n2. **HSTS** - 强制 HTTPS\n3. **安全头** - X-Frame-Options, X-Content-Type-Options\n4. **依赖管理** - 定期更新包\n5. **密钥管理** - 环境变量存储\n6. **日志审计** - 记录敏感操作',
        difficulty: '困难',
        category: '前端',
        tags: ['安全', 'Web安全', 'XSS防护'],
        author: '安全卫士',
        views: 18976,
        discussions: 267,
        favorites: 723,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 17,
        title: '图论算法详解与应用',
        content: '# 图论算法详解与应用\n\n图论是算法的重要分支。掌握图论算法对竞赛和面试都很重要。\n\n## 基础概念\n- 顶点和边\n- 有向图和无向图\n- 权重图\n- 邻接矩阵和邻接表\n\n## 遍历算法\n- **DFS (深度优先搜索)**\n  - 递归实现\n  - 迭代实现\n- **BFS (广度优先搜索)**\n  - 使用队列\n  - 最短路径\n\n## 最短路径\n- **Dijkstra 算法** - 单源最短路\n- **Bellman-Ford 算法** - 处理负权边\n- **Floyd-Warshall** - 全对最短路\n\n## 最小生成树\n- **Kruskal 算法** - 贪心 + 并查集\n- **Prim 算法** - 贪心优先级队列\n\n## 拓扑排序\n- DAG 检测\n- 任务调度\n\n## 高级内容\n- 二分图\n- 强连通分量 (SCC)\n- 欧拉路径/回路\n- 哈密顿路径',
        difficulty: '困难',
        category: '算法',
        tags: ['算法', '图论', '高级技巧'],
        author: '算法研究员',
        views: 17654,
        discussions: 289,
        favorites: 632,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 18,
        title: 'Python 异步编程 asyncio 完全指南',
        content: '# Python 异步编程 asyncio 完全指南\n\nasyncio 是 Python 的异步 I/O 库，适合构建高性能 I/O 密集型应用。\n\n## 核心概念\n- 事件循环\n- 协程\n- Future\n- Task\n\n## 基础用法\n```python\nimport asyncio\n\nasync def hello():\n    print(\'Hello\')\n    await asyncio.sleep(1)\n    print(\'World\')\n\nasyncio.run(hello())\n```\n\n## 异步函数\n- async def\n- await\n- async for\n- async with\n\n## 并发控制\n- asyncio.gather() - 并发执行\n- asyncio.wait() - 等待多个任务\n- Semaphore - 限制并发数\n- Lock - 互斥锁\n\n## 高级特性\n- 流 (Streams)\n- 子进程\n- 网络编程\n- 超时处理\n\n## 性能优化\n- 避免阻塞操作\n- 合理使用线程池\n- 监控事件循环\n- 调试异步代码\n\n## 实战案例\n- Web 爬虫\n- WebSocket 服务器\n- 实时数据处理',
        difficulty: '中等',
        category: '后端',
        tags: ['Python', '异步编程', 'asyncio'],
        author: 'Python高手',
        views: 11234,
        discussions: 123,
        favorites: 389,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 19,
        title: '分布式事务处理方案对比',
        content: '# 分布式事务处理方案对比\n\n分布式系统中的事务处理是难题。本文对比各种解决方案。\n\n## 两阶段提交 (2PC)\n- Prepare 阶段\n- Commit/Rollback 阶段\n- 优点：强一致性\n- 缺点：性能差、容易死锁\n\n## 补偿事务 (Saga)\n- Orchestration 模式\n- Choreography 模式\n- 优点：性能好、可扩展\n- 缺点：最终一致性、复杂度高\n\n## 本地消息表\n- 业务表和消息表\n- 定时任务轮询\n- 优点：实现简单\n- 缺点：需要定时扫描\n\n## 事件溯源 (Event Sourcing)\n- 存储所有状态变更\n- 重放事件恢复状态\n- 优点：天然支持审计\n- 缺点：存储成本大\n\n## 实际选择\n- 对一致性要求高：使用 2PC 或同步 Saga\n- 追求高可用：使用异步 Saga\n- 需要审计：使用 Event Sourcing\n- 团队能力：选择易维护方案',
        difficulty: '困难',
        category: '系统设计',
        tags: ['分布式', '事务', '架构设计'],
        author: '分布式架构师',
        views: 15432,
        discussions: 201,
        favorites: 568,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 20,
        title: '现代前端构建工具对比：Webpack vs Vite vs Turbopack',
        content: '# 现代前端构建工具对比\n\n构建工具是前端工程化的基础。选择合适的工具很重要。\n\n## Webpack\n- 市场占有率最高\n- 生态完善\n- 配置复杂\n- 构建速度较慢\n- 强大的插件系统\n\n## Vite\n- 基于 ES modules\n- 开发速度极快\n- 冷启动快\n- 生态相对较小\n- 适合新项目\n\n## Turbopack\n- Vercel 开发\n- 用 Rust 编写\n- 性能最优\n- 还在快速发展\n- 生态尚不完善\n\n## 性能对比\n| 工具 | 冷启动 | HMR | 构建 |\n|------|--------|-----|------|\n| Webpack | 很慢 | 中等 | 很慢 |\n| Vite | 快 | 很快 | 快 |\n| Turbopack | 很快 | 很快 | 很快 |\n\n## 选择建议\n- **新项目** → Vite 或 Turbopack\n- **现有项目** → 保持 Webpack（迁移成本大）\n- **企业项目** → Webpack（生态稳定）\n- **关注性能** → Turbopack\n\n## 迁移策略\n1. 评估迁移成本\n2. 先在非关键项目试用\n3. 建立完整的测试套件\n4. 逐步迁移',
        difficulty: '中等',
        category: '前端',
        tags: ['Webpack', 'Vite', '构建工具', '性能优化'],
        author: '构建工具专家',
        views: 13879,
        discussions: 156,
        favorites: 521,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 21,
        title: '五分钟掌握动态规划思想',
        content: '# 五分钟掌握动态规划思想\n\n动态规划 (Dynamic Programming) 是算法的皇冠。用最直观的方式讲解。\n\n## 核心思想\nDP = 分解子问题 + 记录状态 + 状态转移\n\n## 三个特征\n1. **最优子结构** - 大问题的最优解包含小问题的最优解\n2. **重叠子问题** - 相同的子问题重复出现\n3. **无后效性** - 当前状态只与之前状态有关\n\n## 解题步骤\n1. **定义状态** - dp[i] 表示什么？\n2. **状态转移方程** - dp[i] = f(dp[i-1], ...)\n3. **边界条件** - dp[0] = ?\n4. **计算顺序** - 通常从小到大\n\n## 经典问题\n- 斐波那契数列\n- 背包问题\n- 编辑距离\n- 最长上升子序列\n- 硬币兑换\n\n## 常见写法\n```python\n# 自顶向下 (记忆化搜索)\ndef fib(n, memo={}): \n    if n in memo: return memo[n]\n    if n <= 1: return n\n    memo[n] = fib(n-1) + fib(n-2)\n    return memo[n]\n\n# 自底向上 (递推)\ndef fib(n):\n    dp = [0] * (n + 1)\n    for i in range(1, n + 1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]\n```',
        difficulty: '中等',
        category: '算法',
        tags: ['算法', '动态规划', '面试'],
        author: '算法启蒙师',
        views: 21345,
        discussions: 298,
        favorites: 847,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 22,
        title: '从零到一实现一个 Vue 组件库',
        content: '# 从零到一实现一个 Vue 组件库\n\n设计和实现一个生产级别的 Vue 组件库是大工程。\n\n## 项目规划\n- 组件清单\n- API 设计\n- 文档计划\n- 发布策略\n\n## 技术选型\n- Vue 3 + TypeScript\n- Vite 构建\n- Storybook 文档\n- Vitest 测试\n\n## 项目结构\n```\ncomponent-lib/\n├── packages/\n│   ├── components/\n│   │   ├── Button/\n│   │   ├── Input/\n│   │   └── ...\n│   ├── utils/\n│   └── style/\n├── docs/\n├── examples/\n└── tests/\n```\n\n## 关键问题\n\n### 样式隔离\n- CSS Module\n- BEM 命名\n- CSS-in-JS\n\n### 组件通信\n- Props 验证\n- Event 定义\n- Slot 设计\n\n### 文档和示例\n- Storybook\n- VitePress\n- 代码示例\n\n### 发布和版本管理\n- npm 发布\n- 语义化版本\n- Changelog\n- CI/CD\n\n## 性能优化\n- 按需加载\n- Tree shaking\n- 代码分割\n\n## 开发流程\n1. 组件开发\n2. 单元测试\n3. 文档编写\n4. 代码审查\n5. 发布到 npm',
        difficulty: '困难',
        category: '前端',
        tags: ['Vue', '组件库', '工程化'],
        author: '开源贡献者',
        views: 14567,
        discussions: 189,
        favorites: 512,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 23,
        title: '如何进行有效的代码审查',
        content: '# 如何进行有效的代码审查\n\n代码审查 (Code Review) 不仅是为了发现 bug，更重要的是知识共享。\n\n## 为什么需要代码审查？\n- 发现潜在缺陷\n- 知识共享\n- 提高代码质量\n- 促进团队学习\n- 维持编码规范\n\n## 审查要点\n\n### 功能性\n- 是否实现了需求？\n- 是否有边界情况遗漏？\n- 是否引入新 bug？\n\n### 代码质量\n- 命名是否清晰？\n- 函数是否过长？\n- 是否有重复代码？\n\n### 性能\n- 算法复杂度是否合理？\n- 是否有性能瓶颈？\n- 是否浪费资源？\n\n### 安全性\n- 是否有安全漏洞？\n- 用户输入是否验证？\n- 敏感信息是否暴露？\n\n### 测试\n- 测试覆盖率如何？\n- 是否有测试边界情况？\n- 测试是否有效？\n\n## 最佳实践\n1. **及时反馈** - 不要延迟审查\n2. **尊重他人** - 友善的评论\n3. **重点突出** - 区分必须和建议\n4. **有则改之** - 开放接受意见\n5. **学以致用** - 不断改进\n\n## 工具和流程\n- GitHub Pull Request\n- GitLab Merge Request\n- Gerrit\n- 自动化检查 (Lint, 测试)',
        difficulty: '简单',
        category: '其他',
        tags: ['代码审查', '团队协作', '最佳实践'],
        author: '团队领导者',
        views: 9876,
        discussions: 98,
        favorites: 356,
        isFavorited: false,
        status: 'approved'
      },
      {
        id: 24,
        title: '全栈开发必知的 SQL 优化技巧',
        content: '# 全栈开发必知的 SQL 优化技巧\n\nSQL 优化是数据库性能的关键。掌握这些技巧能显著提升应用性能。\n\n## 索引设计\n\n### 索引类型\n- 聚集索引 - 决定数据物理顺序\n- 非聚集索引 - 逻辑顺序不同\n- 唯一索引 - 保证唯一性\n- 复合索引 - 多列索引\n\n### 索引原则\n- 选择性高的列\n- WHERE 和 JOIN 列\n- 避免过多索引\n- 避免在计算列建索引\n\n## 查询优化\n\n### 执行计划分析\n```sql\nEXPLAIN SELECT * FROM users WHERE id = 1\n```\n\n### 常见问题\n- 全表扫描\n- 索引失效\n- 排序不走索引\n- 类型转换\n\n### 优化技巧\n1. **避免 SELECT *** - 只选需要的列\n2. **条件下推** - 尽早过滤\n3. **Join 优化** - 驱动表选择\n4. **子查询改写** - 使用 JOIN\n5. **分页优化** - LIMIT 偏移量\n\n## 表结构优化\n- 范式设计\n- 避免冗余\n- 合理分割大表\n- 分区表\n\n## 索引失效场景\n- LIKE \'%abc\'\n- OR 条件\n- 函数调用\n- 类型不匹配\n- 复合索引不遵循最左匹配\n\n## 实战案例\n- 千万级数据查询优化\n- 批量插入优化\n- 统计查询优化\n- 实时查询优化',
        difficulty: '中等',
        category: '数据结构',
        tags: ['SQL', '数据库', '性能优化'],
        author: 'SQL优化师',
        views: 13456,
        discussions: 167,
        favorites: 478,
        isFavorited: false,
        status: 'approved'
      }
    ]

    const question = questionsDB.find(q => q.id === questionId)

    if (question) {
      sendResponse(res, 200, question)
    } else {
      sendResponse(res, 404, null, '题目不存在')
    }
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
  // NOTE: 重复的 POST:/api/ai/generate-questions 已删除（原来在此处）
  // 使用 POST:/api/ai/dify-workflow 代替以调用真实的 Dify 工作流

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

    // 关键词搜索（兼容 search/keyword/q）
    try {
      const kw = ((query.keyword || query.search || query.q || '') + '').trim().toLowerCase()
      if (kw) {
        posts = posts.filter(p =>
          ((p.title || '') + '').toLowerCase().includes(kw) ||
          ((p.content || '') + '').toLowerCase().includes(kw)
        )
      }
    } catch (_) { /* no-op */ }

    // 标签过滤
    if (query.tag) {
      posts = posts.filter(p => Array.isArray(p.tags) && p.tags.includes(query.tag))
    }

    // 排序：置顶优先，然后按更新时间
    posts.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })

    const sizeParam = query.pageSize || query.size || 20
    const paginatedResult = paginate(posts, query.page, sizeParam)
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
    try {
      const kwAll = ((query.keyword || query.search || query.q || '') + '').trim().toLowerCase()
      if (kwAll) {
        posts = posts.filter(p =>
          ((p.title || '') + '').toLowerCase().includes(kwAll) ||
          ((p.content || '') + '').toLowerCase().includes(kwAll)
        )
      }
    } catch (_) { /* no-op */ }

    // 排序
    const sortBy = query.sortBy || 'latest'
    if (sortBy === 'latest') {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === 'hot') {
      posts.sort((a, b) => (b.viewCount + b.likeCount * 2) - (a.viewCount + a.likeCount * 2))
    } else if (sortBy === 'popular') {
      posts.sort((a, b) => b.likeCount - a.likeCount)
    }

    const sizeAll = query.pageSize || query.size || 20
    const paginatedResult = paginate(posts, query.page, sizeAll)
    sendResponse(res, 200, paginatedResult, '获取帖子列表成功')
  },

  // 获取帖子详情
  'GET:/api/community/posts/:id': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const postParam = parsedUrl.pathname.split('/')[4]
    const post = findPostByIdentifier(postParam)
    if (!post) {
      sendResponse(res, 404, null, '帖子不存在')
      return
    }

    const postId = Number(post.id)

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

  // 获取帖子评论列表
  'GET:/api/community/posts/:id/comments': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const postParam = parsedUrl.pathname.split('/')[4]

    const post = findPostByIdentifier(postParam)
    if (!post) {
      sendResponse(res, 404, null, '帖子不存在')
      return
    }

    const postId = Number(post.id)
    const comments = mockData.comments.filter(c => c.postId === postId)

    sendResponse(res, 200, {
      comments,
      total: comments.length
    }, '获取评论列表成功')
  },

  // 发表评论
  'POST:/api/community/posts/:id/comments': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const postParam = parsedUrl.pathname.split('/')[4]
      const body = await parseJSONBody(req)

      const post = findPostByIdentifier(postParam)
      if (!post) {
        sendResponse(res, 404, null, '帖子不存在')
        return
      }

      const postId = Number(post.id)

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
    const postParam = parsedUrl.pathname.split('/')[4]

    const post = findPostByIdentifier(postParam)
    if (!post) {
      sendResponse(res, 404, null, '帖子不存在')
      return
    }

    const postId = Number(post.id)

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

  // 获取热门文章
  'GET:/api/community/articles/hot': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const limit = parseInt(parsedUrl.query.limit) || 5

    // 返回热门文章模拟数据
    const hotArticles = [
      {
        id: 1,
        title: '如何优化代码性能',
        content: '性能优化的10个技巧...',
        category: 'performance',
        views: 100,
        likes: 15,
        createdAt: '2025-11-05T10:00:00Z'
      },
      {
        id: 2,
        title: '现代 JavaScript 最佳实践',
        content: '2025 年 JavaScript 开发指南...',
        category: 'javascript',
        views: 80,
        likes: 12,
        createdAt: '2025-11-08T10:00:00Z'
      },
      {
        id: 3,
        title: 'React 18 新特性深度解析',
        content: 'React 18 带来的主要改进...',
        category: 'react',
        views: 75,
        likes: 10,
        createdAt: '2025-11-09T10:00:00Z'
      },
      {
        id: 4,
        title: 'Web 性能监控最佳实践',
        content: '如何监控网站性能...',
        category: 'performance',
        views: 60,
        likes: 8,
        createdAt: '2025-11-10T10:00:00Z'
      },
      {
        id: 5,
        title: '前端安全知识总结',
        content: 'XSS、CSRF 防护指南...',
        category: 'security',
        views: 55,
        likes: 7,
        createdAt: '2025-11-11T10:00:00Z'
      }
    ]

    sendResponse(res, 200, hotArticles.slice(0, limit), '获取热门文章成功')
  },

  // 获取文章归档
  'GET:/api/community/articles/archives': (req, res) => {
    // 返回按月份分类的文章归档
    const archives = [
      {
        month: '2025-11',
        articles: [
          { id: 1, title: '如何优化代码性能', date: '2025-11-05T10:00:00Z' },
          { id: 2, title: '现代 JavaScript 最佳实践', date: '2025-11-08T10:00:00Z' },
          { id: 3, title: 'React 18 新特性深度解析', date: '2025-11-09T10:00:00Z' },
          { id: 4, title: 'Web 性能监控最佳实践', date: '2025-11-10T10:00:00Z' },
          { id: 5, title: '前端安全知识总结', date: '2025-11-11T10:00:00Z' }
        ],
        count: 5
      },
      {
        month: '2025-10',
        articles: [
          { id: 6, title: 'TypeScript 进阶指南', date: '2025-10-15T10:00:00Z' },
          { id: 7, title: '微前端架构设计', date: '2025-10-20T10:00:00Z' }
        ],
        count: 2
      }
    ]

    sendResponse(res, 200, archives, '获取文章归档成功')
  },

  // 获取帖子的相关内容/集合
  'GET:/api/community/posts/:postId/collection': (req, res) => {
    const postId = parseInt(req.params.postId)
    const post = mockData.posts.find(p => p.id === postId)

    if (!post) {
      sendResponse(res, 404, null, '帖子不存在')
      return
    }

    // 返回相关帖子和评论
    const relatedPosts = mockData.posts
      .filter(p => p.id !== postId && p.category === post.category)
      .slice(0, 3)

    const collection = {
      postId,
      post,
      relatedPosts,
      comments: post.comments || [],
      total: (post.comments || []).length
    }

    sendResponse(res, 200, collection, '获取帖子集合成功')
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

  // 今日社区统计
  'GET:/api/community/stats/today': (req, res) => {
    // 生成一些稳定的模拟统计数据，便于前端展示
    const now = new Date()
    // 简单依据时间波动，避免完全固定
    const base = now.getHours() * 3 + now.getMinutes() % 5
    const stats = {
      postsCount: 25 + (base % 10),
      onlineUsers: 42 + (base % 15),
      activeUsers: 30 + (base % 12),
      newUsers: 5 + (base % 4)
    }
    sendResponse(res, 200, stats, '获取今日统计成功')
  },

  // ==================== 聊天室 API ====================

  // 获取聊天室列表
  'POST:/api/chat/uploads': async (req, res) => {
    try {
      const body = await parseJSONBody(req)
      if (!body || !body.data) {
        sendResponse(res, 400, null, 'Missing file payload')
        return
      }
      const record = storeUploadedMedia({
        fileName: body.fileName,
        contentType: body.contentType,
        base64: body.data
      })
      cacheInvalidate('search:')
      sendResponse(res, 201, record)
    } catch (error) {
      if (error.message === 'FILE_TOO_LARGE') {
        sendResponse(res, 413, null, 'File size exceeds limit')
        return
      }
      if (error.message === 'EMPTY_FILE') {
        sendResponse(res, 400, null, 'File payload is empty')
        return
      }
      console.error('[upload] failed to store media', error)
      sendResponse(res, 500, null, 'Failed to store media')
    }
  },

  'GET:/api/chat/uploads/:key': (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const key = decodeURIComponent(parsedUrl.pathname.split('/').pop())
      const resource = resolveMediaFile(key)
      if (!resource) {
        sendResponse(res, 404, null, 'File not found')
        return
      }
      const { record, filePath } = resource
      res.writeHead(200, {
        'Content-Type': record.contentType || 'application/octet-stream',
        'Content-Length': record.size || 0,
        'Cache-Control': 'public, max-age=31536000'
      })
      fs.createReadStream(filePath).pipe(res)
    } catch (error) {
      console.error('[upload] failed to read media', error)
      sendResponse(res, 500, null, 'Failed to read media')
    }
  },

  'DELETE:/api/chat/uploads/:key': (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const key = decodeURIComponent(parsedUrl.pathname.split('/').pop())
      const record = removeMediaRecord(key)
      if (!record) {
        sendResponse(res, 404, null, 'File not found')
        return
      }
      const filePath = path.join(MEDIA_STORAGE_ROOT, record.storageName)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      cacheInvalidate('messages:')
      cacheInvalidate('search:')
      sendResponse(res, 200, { success: true })
    } catch (error) {
      console.error('[upload] failed to delete media', error)
      sendResponse(res, 500, null, 'Failed to delete media')
    }
  },

  'GET:/api/chat/messages/search': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const query = parsedUrl.query || {}
    const keyword = (query.q || '').toString().trim().toLowerCase()
    if (!keyword) {
      sendResponse(res, 400, null, 'Search keyword is required')
      return
    }

    const roomId = query.roomId ? parseInt(query.roomId) : null
    const limit = Math.max(1, Math.min(Number(query.limit || 20), 100))
    const cacheKey = buildCacheKey('search', { keyword, roomId, limit })
    const cached = cacheGet(cacheKey)
    if (cached) {
      sendResponse(res, 200, cached, '搜索成功')
      return
    }

    const source = roomId
      ? mockData.messages.filter((message) => message.roomId === roomId)
      : mockData.messages

    const matches = []
    for (const message of source) {
      const attachments = Array.isArray(message.attachments)
        ? message.attachments
            .map((item) => {
              if (!item) return null
              const key = item.storageName || item.id || item.mediaId || (item.url ? item.url.split('/').pop() : null)
              const record = key ? findMediaRecord(key) : null
              if (record) return serializeMedia(record)
              const fallback = {
                id: item.id || key || null,
                fileName: item.fileName || item.name || 'file',
                contentType: item.contentType || item.mimeType || 'application/octet-stream',
                size: item.size || 0,
                url: item.url || (key ? `${MEDIA_BASE_PATH}/${key}` : null)
              }
              return fallback.url ? fallback : null
            })
            .filter(Boolean)
        : []
      const haystack = [
        message.content || '',
        attachments.map((file) => file.fileName || '').join(' ')
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(keyword)) continue

      matches.push({
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        createdAt: message.createdAt,
        attachments,
        snippet: buildSearchSnippet(message.content || '', keyword)
      })
      if (matches.length >= limit) break
    }

    const payload = { items: matches, total: matches.length }
    cacheSet(cacheKey, payload, SEARCH_CACHE_TTL_MS)

    sendResponse(res, 200, payload, '搜索成功')
  },

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
  'POST:/api/chat/rooms/:id/messages': async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      const roomId = parseInt(parsedUrl.pathname.split('/')[4])
      const room = mockData.chatRooms.find((r) => r.id === roomId)

      if (!room) {
        sendResponse(res, 404, null, 'Chat room not found')
        return
      }

      const body = await parseJSONBody(req)
      const rawContent = body?.content != null ? body.content.toString() : ''
      const trimmedContent = rawContent.trim()
      const attachmentsInput = Array.isArray(body?.attachments) ? body.attachments : []
      const attachments = []

      for (const item of attachmentsInput) {
        if (!item) continue
        try {
          if (item.data) {
            const stored = storeUploadedMedia({
              fileName: item.fileName || item.name,
              contentType: item.contentType || item.mimeType,
              base64: item.data
            })
            attachments.push(stored)
          } else if (item.mediaId || item.id || item.storageName) {
            const key = item.mediaId || item.id || item.storageName
            const found = findMediaRecord(key)
            if (found) {
              attachments.push({ ...found, url: `${MEDIA_BASE_PATH}/${found.storageName}` })
            }
          }
        } catch (uploadError) {
          console.error('[chat] attachment processing failed', uploadError)
        }
      }

      if (!trimmedContent && attachments.length === 0) {
        sendResponse(res, 400, null, 'Message content or attachment is required')
        return
      }

      const sender = mockData.users.find((user) => user.id === CURRENT_USER_ID) || mockData.users[0]
      const messageId = mockData.messageIdCounter++
      const sanitizedAttachments = attachments.map((record) => serializeMedia(record)).filter(Boolean)
      const content = trimmedContent || (body?.caption?.toString().trim() || (sanitizedAttachments.length ? '[附件]' : ''))
      const contentType = body?.contentType || (sanitizedAttachments.length && !trimmedContent ? 'attachment' : sanitizedAttachments.length ? 'mixed' : 'text')

      const newMessage = {
        id: messageId,
        roomId,
        senderId: sender?.id || CURRENT_USER_ID,
        senderName: sender?.nickname || sender?.username || 'user',
        senderAvatar: sender?.avatar || '',
        content,
        contentType,
        status: 'delivered',
        createdAt: new Date().toISOString(),
        attachments: sanitizedAttachments,
        hasAttachments: sanitizedAttachments.length > 0,
        metadata: { attachmentsCount: sanitizedAttachments.length }
      }

      mockData.messages.push(newMessage)
      room.lastMessage = { content, senderId: newMessage.senderId, senderName: newMessage.senderName }
      room.lastMessageAt = newMessage.createdAt
      room.updatedAt = newMessage.createdAt

      cacheInvalidate(`messages:${roomId}`)
      cacheInvalidate('search:')

      sendResponse(res, 200, newMessage, 'Message sent successfully')
    } catch (error) {
      console.error('Failed to send message:', error)
      sendResponse(res, 500, null, 'Failed to send message')
    }
  },

'GET:/api/chat/rooms/:id/messages': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const roomId = parseInt(parsedUrl.pathname.split('/')[4])
    const query = parsedUrl.query || {}
    const page = Number(query.page || 1)
    const size = Number(query.size || 50)
    const cacheKey = buildCacheKey(`messages:${roomId}`, { page, size })
    const cached = cacheGet(cacheKey)
    if (cached) {
      sendResponse(res, 200, cached, '获取历史消息成功')
      return
    }

    let messages = mockData.messages.filter((m) => m.roomId === roomId)

    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const paginatedResult = paginate(messages, page, size)
    paginatedResult.items.reverse()

    const items = paginatedResult.items.map((message) => {
      const attachments = Array.isArray(message.attachments)
        ? message.attachments
            .map((item) => {
              if (!item) return null
              const key = item.storageName || item.id || item.mediaId || (item.url ? item.url.split('/').pop() : null)
              const record = key ? findMediaRecord(key) : null
              if (record) {
                return serializeMedia(record)
              }
              const fallback = {
                id: item.id || key || null,
                fileName: item.fileName || item.name || 'file',
                contentType: item.contentType || item.mimeType || 'application/octet-stream',
                size: item.size || 0,
                url: item.url || (key ? `${MEDIA_BASE_PATH}/${key}` : null),
                createdAt: item.createdAt || message.createdAt
              }
              return fallback.url ? fallback : null
            })
            .filter(Boolean)
        : []

      return {
        ...message,
        attachments,
        hasAttachments: attachments.length > 0,
        metadata: {
          ...(message.metadata || {}),
          attachmentsCount: attachments.length
        }
      }
    })

const payload = { ...paginatedResult, items }
    cacheSet(cacheKey, payload)

    sendResponse(res, 200, payload, '获取历史消息成功')
  },

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

  // 聊天 API - 会话置顶
  'POST:/api/chat/conversations/:id/pin': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const conversationId = url.parse(req.url, true).pathname.split('/')[4]

        sendResponse(res, 200, {
          id: conversationId,
          pinned: body.pinned === true,
          updatedAt: new Date().toISOString()
        }, body.pinned ? '已置顶会话' : '已取消置顶')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 聊天 API - 会话免打扰
  'POST:/api/chat/conversations/:id/mute': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const conversationId = url.parse(req.url, true).pathname.split('/')[4]

        sendResponse(res, 200, {
          id: conversationId,
          muted: body.muted === true,
          duration: body.duration,
          updatedAt: new Date().toISOString()
        }, body.muted ? '已禁言会话' : '已取消禁言')
      } catch (error) {
        sendResponse(res, 400, null, '请求数据格式错误')
      }
    })
  },

  // 聊天 API - 标记会话为已读
  'POST:/api/chat/conversations/:id/mark-read': (req, res) => {
    const conversationId = url.parse(req.url, true).pathname.split('/')[4]

    sendResponse(res, 200, {
      id: conversationId,
      markedRead: true,
      readAt: new Date().toISOString()
    }, '会话已标记为已读')
  },

  // 聊天 API - 删除会话
  'DELETE:/api/chat/conversations/:id': (req, res) => {
    const conversationId = url.parse(req.url, true).pathname.split('/')[4]

    sendResponse(res, 200, {
      id: conversationId,
      deleted: true,
      deletedAt: new Date().toISOString()
    }, '会话已删除')
  },

  // 聊天 API - 文件上传
  'POST:/api/chat/uploads': (req, res) => {
    // 模拟文件上传，实际应用中应处理multipart/form-data
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        // 生成模拟的文件上传响应
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        sendResponse(res, 200, {
          id: uploadId,
          url: `/api/chat/uploads/${uploadId}`,
          size: Math.floor(Math.random() * 10000000),
          mimeType: 'application/octet-stream',
          uploadedAt: new Date().toISOString()
        }, '文件上传成功')
      } catch (error) {
        sendResponse(res, 400, null, '文件上传失败')
      }
    })
  },

  // 聊天 API - 获取上传文件
  'GET:/api/chat/uploads/:id': (req, res) => {
    const fileId = url.parse(req.url, true).pathname.split('/')[4]

    sendResponse(res, 200, {
      id: fileId,
      url: `/files/${fileId}`,
      size: Math.floor(Math.random() * 10000000),
      mimeType: 'application/octet-stream',
      uploadedAt: new Date().toISOString()
    }, '获取文件信息成功')
  },

  // 聊天 API - 删除上传文件
  'DELETE:/api/chat/uploads/:id': (req, res) => {
    const fileId = url.parse(req.url, true).pathname.split('/')[4]

    sendResponse(res, 200, {
      id: fileId,
      deleted: true,
      deletedAt: new Date().toISOString()
    }, '文件已删除')
  },

  // 聊天 API - 编辑消息
  'PUT:/api/chat/conversations/:conversationId/messages/:messageId': (req, res) => {
    let bodyStr = ''
    req.on('data', chunk => {
      bodyStr += chunk.toString()
    })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr)
        const conversationId = url.parse(req.url, true).pathname.split('/')[4]
        const messageId = url.parse(req.url, true).pathname.split('/')[6]

        sendResponse(res, 200, {
          id: messageId,
          conversationId,
          content: body.content,
          edited: true,
          editedAt: new Date().toISOString(),
          editCount: 1,
          history: [{
            version: 1,
            content: body.content,
            editedAt: new Date().toISOString()
          }]
        }, '消息已编辑')
      } catch (error) {
        sendResponse(res, 400, null, '编辑消息失败')
      }
    })
  },

  // 聊天 API - 撤回消息
  'POST:/api/chat/conversations/:conversationId/messages/:messageId/recall': (req, res) => {
    const conversationId = url.parse(req.url, true).pathname.split('/')[4]
    const messageId = url.parse(req.url, true).pathname.split('/')[6]

    sendResponse(res, 200, {
      id: messageId,
      conversationId,
      recalled: true,
      recalledAt: new Date().toISOString(),
      recallReason: '用户撤回了这条消息',
      originalContent: '[消息已撤回]'
    }, '消息已撤回')
  },

  // ==================== 用户状态 API ====================

  // 用户状态 API - 获取当前用户状态
  'GET:/api/chat/users/me/status': (req, res) => {
    const userStatuses = mockData.userStatuses || {}
    const currentStatus = userStatuses[CURRENT_USER_ID] || {
      status: 'online',
      customStatus: null,
      lastActivityTime: new Date().toISOString()
    }

    sendResponse(res, 200, {
      userId: CURRENT_USER_ID,
      ...currentStatus,
      statusInfo: {
        online: { label: '在线', icon: '🟢', priority: 1 },
        away: { label: '离开', icon: '🟡', priority: 2 },
        busy: { label: '忙碌', icon: '🔴', priority: 3 },
        offline: { label: '离线', icon: '⚫', priority: 4 }
      }[currentStatus.status]
    }, '获取用户状态成功')
  },

  // 用户状态 API - 更新当前用户状态
  'PUT:/api/chat/users/me/status': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        if (!mockData.userStatuses) {
          mockData.userStatuses = {}
        }

        mockData.userStatuses[CURRENT_USER_ID] = {
          status: data.status || 'online',
          customStatus: data.customStatus || null,
          lastActivityTime: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        sendResponse(res, 200, {
          userId: CURRENT_USER_ID,
          ...mockData.userStatuses[CURRENT_USER_ID],
          message: '状态已更新'
        }, '用户状态已更新')
      } catch (error) {
        sendResponse(res, 400, null, '更新状态失败')
      }
    })
  },

  // 用户状态 API - 获取指定用户状态
  'GET:/api/chat/users/:userId/status': (req, res) => {
    const userId = url.parse(req.url, true).pathname.split('/')[4]
    const userStatuses = mockData.userStatuses || {}
    const userStatus = userStatuses[userId] || {
      status: 'offline',
      customStatus: null,
      lastActivityTime: new Date().toISOString()
    }

    sendResponse(res, 200, {
      userId,
      ...userStatus,
      statusInfo: {
        online: { label: '在线', icon: '🟢', priority: 1 },
        away: { label: '离开', icon: '🟡', priority: 2 },
        busy: { label: '忙碌', icon: '🔴', priority: 3 },
        offline: { label: '离线', icon: '⚫', priority: 4 }
      }[userStatus.status]
    }, '获取用户状态成功')
  },

  // 用户状态 API - 批量获取多个用户状态
  'POST:/api/chat/users/statuses': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const userIds = data.userIds || []
        const userStatuses = mockData.userStatuses || {}

        const result = userIds.map(userId => {
          const status = userStatuses[userId] || {
            status: 'offline',
            customStatus: null,
            lastActivityTime: new Date().toISOString()
          }
          return {
            userId,
            ...status,
            statusInfo: {
              online: { label: '在线', icon: '🟢', priority: 1 },
              away: { label: '离开', icon: '🟡', priority: 2 },
              busy: { label: '忙碌', icon: '🔴', priority: 3 },
              offline: { label: '离线', icon: '⚫', priority: 4 }
            }[status.status]
          }
        })

        sendResponse(res, 200, { statuses: result }, '批量获取用户状态成功')
      } catch (error) {
        sendResponse(res, 400, null, '批量获取状态失败')
      }
    })
  },

  // 用户状态 API - 设置自定义状态消息
  'PUT:/api/chat/users/me/status-message': (req, res) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
    })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        if (!mockData.userStatuses) {
          mockData.userStatuses = {}
        }
        if (!mockData.userStatuses[CURRENT_USER_ID]) {
          mockData.userStatuses[CURRENT_USER_ID] = {
            status: 'online',
            customStatus: null,
            lastActivityTime: new Date().toISOString()
          }
        }

        mockData.userStatuses[CURRENT_USER_ID].customStatus = data.message || null
        mockData.userStatuses[CURRENT_USER_ID].updatedAt = new Date().toISOString()

        sendResponse(res, 200, {
          userId: CURRENT_USER_ID,
          customStatus: data.message,
          updatedAt: mockData.userStatuses[CURRENT_USER_ID].updatedAt
        }, '自定义状态消息已更新')
      } catch (error) {
        sendResponse(res, 400, null, '更新自定义消息失败')
      }
    })
  },

  // 用户状态 API - 获取用户状态历史
  'GET:/api/chat/users/me/status-history': (req, res) => {
    const statusHistory = mockData.statusHistory || []
    const limit = url.parse(req.url, true).query.limit || 20

    sendResponse(res, 200, {
      userId: CURRENT_USER_ID,
      history: statusHistory.slice(-limit).reverse()
    }, '获取状态历史成功')
  },

  // 错题管理 API - 获取错题统计
  'GET:/api/wrong-answers/statistics': (req, res) => {
    const statistics = {
      totalWrongCount: 5,
      masteredCount: 2,
      reviewingCount: 1,
      unreviewedCount: 2,
      sourceBreakdown: {
        'ai_interview': 3,
        'question_bank': 2
      },
      difficultyBreakdown: {
        'easy': 1,
        'medium': 2,
        'hard': 2
      }
    }
    sendResponse(res, 200, statistics, '获取错题统计成功')
  },
  // 错题管理 API - 列表
  'GET:/api/wrong-answers': (req, res) => {
    ensureWrongAnswersSeeded()
    sendResponse(res, 200, mockData.wrongAnswers, '获取错题列表成功')
  },
  // 错题管理 API - 到期复习集合
  'GET:/api/wrong-answers/due-for-review': (req, res) => {
    ensureWrongAnswersSeeded()
    const now = new Date()
    const due = mockData.wrongAnswers.filter(item => {
      if (!item.nextReviewAt) return true
      try { return new Date(item.nextReviewAt) <= now } catch { return true }
    })
    sendResponse(res, 200, due, '获取待复习错题成功')
  },
  // 错题管理 API - 复习一次并调度
  'POST:/api/wrong-answers/:id/review': async (req, res) => {
    ensureWrongAnswersSeeded()
    const id = Number(req.params.id)
    const record = mockData.wrongAnswers.find(r => r.id === id)
    if (!record) return sendResponse(res, 404, null, '记录不存在')

    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const { result = 'pass', timeSpentSec = 0, notes = '' } = body ? JSON.parse(body) : {}
        if (result === 'pass') record.correctCount = (record.correctCount || 0) + 1
        else if (result === 'fail') record.wrongCount = (record.wrongCount || 0) + 1
        // 'doubt' 不增减计数，仅调度

        scheduleOnResult(record, result)

        if (!Array.isArray(mockData.wrongAnswerReviewLogs)) mockData.wrongAnswerReviewLogs = []
        mockData.wrongAnswerReviewLogs.push({
          id: mockData.wrongAnswerReviewLogs.length + 1,
          wrongAnswerId: id,
          userId: CURRENT_USER_ID,
          result,
          timeSpentSec,
          notes,
          boxLevel: record.boxLevel,
          masteryLevel: record.masteryLevel,
          createdAt: new Date().toISOString()
        })

        sendResponse(res, 200, record, '复习记录已保存')
      } catch (e) {
        sendResponse(res, 400, null, '请求体格式错误')
      }
    })
  },
  // 错题管理 API - 标记已掌握（等价于 review: pass）
  'PUT:/api/wrong-answers/:id/mark-mastered': async (req, res) => {
    ensureWrongAnswersSeeded()
    const id = Number(req.params.id)
    const record = mockData.wrongAnswers.find(r => r.id === id)
    if (!record) return sendResponse(res, 404, null, '记录不存在')
    record.correctCount = (record.correctCount || 0) + 1
    scheduleOnResult(record, 'pass')
    sendResponse(res, 200, record, '已标记为已掌握')
  },
  // 错题管理 API - 标记继续复习（等价于 review: fail）
  'PUT:/api/wrong-answers/:id/mark-reviewing': async (req, res) => {
    ensureWrongAnswersSeeded()
    const id = Number(req.params.id)
    const record = mockData.wrongAnswers.find(r => r.id === id)
    if (!record) return sendResponse(res, 404, null, '记录不存在')
    record.wrongCount = (record.wrongCount || 0) + 1
    scheduleOnResult(record, 'fail')
    sendResponse(res, 200, record, '已标记为继续复习')
  },
  // 错题管理 API - 复习日志
  'GET:/api/wrong-answers/review/logs': (req, res) => {
    const parsedUrl = url.parse(req.url, true)
    const q = parsedUrl.query || {}
    const recordId = q.recordId ? Number(q.recordId) : null
    const items = (mockData.wrongAnswerReviewLogs || [])
      .filter(l => !recordId || l.wrongAnswerId === recordId)
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    sendResponse(res, 200, { items, total: items.length }, '获取复习日志成功')
  },
  // 错题管理 API - 列表
  'GET:/api/wrong-answers': (req, res) => {
    ensureWrongAnswersSeeded()
    sendResponse(res, 200, mockData.wrongAnswers, '获取错题列表成功')
  },
  // 错题管理 API - 到期复习集合
  'GET:/api/wrong-answers/due-for-review': (req, res) => {
    ensureWrongAnswersSeeded()
    const due = mockData.wrongAnswers.filter(item => item.reviewStatus !== 'mastered')
    sendResponse(res, 200, due, '获取待复习错题成功')
  },
  // 错题管理 API - 生成复习计划（将未掌握题目按当前间隔重新调度下一次复习时间）
  'POST:/api/wrong-answers/generate-review-plan': (req, res) => {
    ensureWrongAnswersSeeded()
    try {
      const now = new Date().toISOString()
      mockData.wrongAnswers.forEach(record => {
        if (record && record.reviewStatus !== 'mastered') {
          // 使用“保留间隔”的方式更新下一次复习时间，不提升也不降级盒子
          scheduleOnResult(record, 'doubt')
          record.updatedAt = now
        }
      })
      // 计划生成后，返回一个简单的确认对象，保持与前端期望一致
      sendResponse(res, 200, { status: 'ok' }, '复习计划已生成')
    } catch (e) {
      sendResponse(res, 500, null, `生成复习计划失败: ${e.message}`)
    }
  },
  // 错题管理 API - 标记已掌握
  'PUT:/api/wrong-answers/:id/mark-mastered': async (req, res) => {
    ensureWrongAnswersSeeded()
    const id = Number(req.params.id)
    const record = mockData.wrongAnswers.find(r => r.id === id)
    if (!record) return sendResponse(res, 404, null, '记录不存在')
    record.reviewStatus = 'mastered'
    record.correctCount = (record.correctCount || 0) + 1
    record.updatedAt = new Date().toISOString()
    sendResponse(res, 200, record, '已标记为已掌握')
  },
  // 错题管理 API - 标记继续复习
  'PUT:/api/wrong-answers/:id/mark-reviewing': async (req, res) => {
    ensureWrongAnswersSeeded()
    const id = Number(req.params.id)
    const record = mockData.wrongAnswers.find(r => r.id === id)
    if (!record) return sendResponse(res, 404, null, '记录不存在')
    record.reviewStatus = 'reviewing'
    record.wrongCount = (record.wrongCount || 0) + 1
    record.updatedAt = new Date().toISOString()
    sendResponse(res, 200, record, '已标记为继续复习')
  },

  // ==================== AI 工作流 API ====================

  'POST:/api/ai/summary': (req, res) => {
    try {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', () => {
        try {
          const { content, postId } = JSON.parse(body)
          if (!content) {
            return sendResponse(res, 400, null, 'Content is required')
          }

          // 生成摘要（模拟）
          const summary = `这是一篇关于"${content.substring(0, 30)}..."的文章摘要。`
          sendResponse(res, 200, {
            summary,
            fromCache: false,
            mock: true,
          }, 'OK')
        } catch (e) {
          sendResponse(res, 500, null, e.message)
        }
      })
    } catch (e) {
      sendResponse(res, 500, null, e.message)
    }
  },

  'POST:/api/ai/keypoints': (req, res) => {
    try {
      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', () => {
        try {
          const { content, postId } = JSON.parse(body)
          if (!content) {
            return sendResponse(res, 400, null, 'Content is required')
          }

          // 提取关键点（模拟）
          const keypoints = [
            '关键点 1: 这是内容的第一个要点',
            '关键点 2: 这是内容的第二个要点',
            '关键点 3: 这是内容的第三个要点'
          ]
          sendResponse(res, 200, {
            keypoints,
            fromCache: false,
            mock: true,
          }, 'OK')
        } catch (e) {
          sendResponse(res, 500, null, e.message)
        }
      })
    } catch (e) {
      sendResponse(res, 500, null, e.message)
    }
  },

  'GET:/api/ai/chat/stream': (req, res) => {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // 解析查询参数
    const parsedUrl = url.parse(req.url, true)
    const { workflow = 'local', message, articleContent, conversationId, postId } = parsedUrl.query

    const userId = `post-${postId || 'unknown'}-user-anonymous`

    console.log(`[AI Chat] GET 请求 - 工作流: '${workflow}' (type: ${typeof workflow}), 用户: ${userId}, 消息长度: ${message ? message.length : 0}`)
    console.log(`[AI Chat] 是否 workflow==='chat'? ${workflow === 'chat'}`)
    console.log(`[AI Chat] ChatService configured? ${chatWorkflowService.checkConfiguration()}`)

    // 根据工作流类型路由
    if (workflow === 'chat') {
      // 使用 Dify Chat API
      if (!chatWorkflowService.checkConfiguration()) {
        console.warn('[AI Chat] Chat API 未配置，降级到本地模拟')
        handleLocalChatStream(res)
        return
      }

      console.log('[AI Chat] ✅ 调用 Dify Chat API')
      handleDifyChatStream(res, message, userId, conversationId, articleContent)
    } else {
      // 使用本地模拟数据
      console.log(`[AI Chat] ❌ workflow不是'chat'，使用本地模拟。实际值: '${workflow}'`)
      handleLocalChatStream(res)
    }
  },

  'POST:/api/ai/chat/stream': (req, res) => {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // 从请求体读取数据
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        const { workflow = 'local', message, articleContent, conversationId, postId } = JSON.parse(body)

        const userId = `post-${postId || 'unknown'}-user-anonymous`

        console.log(`[AI Chat] POST 请求 - 工作流: ${workflow}, 用户: ${userId}, 消息长度: ${message ? message.length : 0}`)

        // 根据工作流类型路由
        if (workflow === 'chat') {
          // 使用 Dify Chat API
          if (!chatWorkflowService.checkConfiguration()) {
            console.warn('[AI Chat] Chat API 未配置，降级到本地模拟')
            handleLocalChatStream(res)
            return
          }

          handleDifyChatStream(res, message, userId, conversationId, articleContent)
        } else {
          // 使用本地模拟数据
          handleLocalChatStream(res)
        }
      } catch (error) {
        console.error('[AI Chat] 解析请求体错误:', error.message)
        res.write(`data: ${JSON.stringify({ type: 'error', error: '请求格式错误' })}\n\n`)
        res.end()
      }
    })
  },

  'GET:/api/ai/chat/:conversationId': async (req, res) => {
    try {
      const conversationId = req.params.conversationId
      const userId = req.query.userId || `post-${req.query.postId || 'unknown'}-user-anonymous`

      console.log(`[AI Chat] 获取对话历史 - 对话ID: ${conversationId}, 用户: ${userId}`)

      // 从 Redis 加载对话
      const conversation = await redisClient.loadConversation(conversationId, userId)

      if (conversation) {
        sendResponse(res, 200, conversation, 'OK')
      } else {
        sendResponse(res, 404, null, '对话不存在或已过期')
      }
    } catch (error) {
      console.error('[AI Chat] 获取对话历史失败:', error.message)
      sendResponse(res, 500, null, '获取对话失败')
    }
  },

  'DELETE:/api/ai/chat/:conversationId': async (req, res) => {
    try {
      const conversationId = req.params.conversationId
      const userId = req.query.userId || `post-${req.query.postId || 'unknown'}-user-anonymous`

      console.log(`[AI Chat] 删除对话 - 对话ID: ${conversationId}, 用户: ${userId}`)

      // 从 Redis 删除对话
      const success = await redisClient.deleteConversation(conversationId, userId)

      if (success) {
        sendResponse(res, 200, { conversationId }, '对话已删除')
      } else {
        sendResponse(res, 500, null, '删除对话失败')
      }
    } catch (error) {
      console.error('[AI Chat] 删除对话失败:', error.message)
      sendResponse(res, 500, null, '删除对话失败')
    }
  },

  // 默认404处理
  'default': (req, res) => {
    sendResponse(res, 404, null, 'API接口不存在')
  }
}

/**
 * 创建HTTP服务器
 */
// 为“计算机科学与技术”领域补充额外简答题（用于 /learning-hub/computer-science 页面）
const EXTRA_CS_SHORT_ANSWER_QUESTIONS = [
  {
    title: '操作系统中进程和线程的区别',
    question: '简要说明操作系统中进程和线程的定义及主要区别。',
    difficulty: 'easy',
    difficultyScore: 0.35,
    categoryId: 4,
    tags: ['操作系统', '进程', '线程'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['操作系统基础'],
    languageRestrictions: [],
    answer: '进程是操作系统进行资源分配和调度的基本单位，拥有独立的地址空间和系统资源；线程是进程内的执行单元，同一进程内的多个线程共享进程的内存和资源。进程之间相互独立，一个进程崩溃通常不影响其他进程；而同一进程内的线程相互影响，一个线程异常可能导致整个进程终止。创建和切换进程的开销通常大于线程。',
    explanation: '理解进程和线程的区别有助于合理设计并发模型。进程强调资源隔离和稳定性，线程强调轻量级并发和资源共享。现代操作系统通常采用多进程+多线程的混合模型来兼顾可靠性和性能。'
  },
  {
    title: '死锁产生的四个必要条件',
    question: '简要说明系统产生死锁的四个必要条件。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['操作系统', '并发', '死锁'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['并发编程', '互斥锁'],
    languageRestrictions: [],
    answer: '死锁产生的四个必要条件是：互斥条件、占有且等待条件、不剥夺条件和循环等待条件。互斥条件指资源一次只能被一个进程占有；占有且等待指进程至少持有一个资源，同时申请新的资源；不剥夺指已获得的资源在未使用完之前不能被强制抢占；循环等待指存在一个进程环路，每个进程都在等待下一个进程占有的资源。',
    explanation: '只有在四个条件同时满足时才可能产生死锁，因此预防死锁的常用思路就是破坏其中至少一个条件，例如通过资源有序分配破坏循环等待条件，通过可剥夺锁设计破坏不剥夺条件。'
  },
  {
    title: '虚拟内存与分页机制的作用',
    question: '简要说明虚拟内存和分页机制解决了哪些问题。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['操作系统', '内存管理', '虚拟内存'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['内存管理基础'],
    languageRestrictions: [],
    answer: '虚拟内存通过在逻辑地址和物理地址之间增加一层映射，使每个进程看到的是连续的大地址空间，而实际物理内存可以较小且不连续。分页机制将虚拟地址空间和物理内存划分为固定大小的页和页框，按页进行映射和调度。这样可以提高内存利用率，支持进程间隔离，减少外部碎片，并允许程序大于物理内存容量。',
    explanation: '虚拟内存和分页是现代操作系统的核心机制，结合页表、TLB 和页面置换算法，能够在有限物理内存上运行多个大程序，同时保证安全隔离和较好的性能。'
  },
  {
    title: '常见页面置换算法比较',
    question: '简要比较 FIFO、LRU 和 LFU 三种页面置换算法的特点和适用场景。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['操作系统', '页面置换', '算法'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['虚拟内存', '缓存策略'],
    languageRestrictions: [],
    answer: 'FIFO 按进入内存的先后顺序淘汰页面，简单但可能出现 Belady 异常；LRU 根据最近最少使用原则淘汰最长时间未被访问的页面，通常能取得较好命中率，但实现需要维护访问时间或近似结构；LFU 根据访问频率淘汰使用次数最少的页面，适合访问模式稳定的场景，但对热点突变不敏感。实际系统中常采用 LRU 的近似实现或结合多种算法的改进策略。',
    explanation: '选择页面置换算法时需要在实现复杂度、内存开销和命中率之间权衡。理解三种算法的特点有助于在缓存、数据库和操作系统中选择合适的策略。'
  },
  {
    title: 'TCP 和 UDP 的主要区别',
    question: '从可靠性、连接方式和使用场景等维度简要比较 TCP 和 UDP。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['计算机网络', 'TCP', 'UDP'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['网络模型基础'],
    languageRestrictions: [],
    answer: 'TCP 是面向连接的可靠传输协议，提供字节流服务，通过三次握手建立连接，具备重传、流量控制和拥塞控制机制，适合对数据可靠性要求高的场景，如网页加载、文件传输。UDP 是无连接的、不保证可靠性的报文传输协议，开销小、延迟低，不保证顺序和不重传，适合对实时性要求高且应用层可容忍丢包或自定义可靠性的场景，如视频直播、在线游戏和实时语音。',
    explanation: '在系统设计时，选择 TCP 还是 UDP 取决于对可靠性、延迟和实现复杂度的权衡。很多实时应用使用 UDP 并在应用层实现部分可靠机制。'
  },
  {
    title: 'TCP 三次握手的目的',
    question: '简要说明 TCP 建立连接时为什么需要三次握手而不是两次。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['计算机网络', 'TCP', '握手'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['TCP 基础'],
    languageRestrictions: [],
    answer: '三次握手的主要目的是双方确认彼此的发送和接收能力正常，并避免历史失效连接请求造成混乱。第一次握手客户端发送 SYN，表明希望建立连接并发送初始序列号；第二次握手服务端回复 SYN+ACK，确认收到客户端的 SYN 并给出自己的初始序列号；第三次握手客户端再次发送 ACK，确认收到服务端的 SYN。三次交互确保了双方的收发方向都可用，如果只有两次握手，服务端难以确认客户端是否能正常接收，从而可能导致资源浪费或状态不一致。',
    explanation: '三次握手是 TCP 可靠连接建立的基础，理解每一步的含义有助于分析连接建立过程中的超时、半连接和 SYN 攻击等问题。'
  },
  {
    title: 'HTTP 与 HTTPS 的区别',
    question: '简要说明 HTTP 和 HTTPS 在安全性和传输方式上的主要区别。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['计算机网络', 'HTTP', 'HTTPS', '安全'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['网络协议基础'],
    languageRestrictions: [],
    answer: 'HTTP 是基于明文的应用层协议，请求和响应内容在网络中以明文传输，容易被中间人窃听和篡改；HTTPS 在 HTTP 之下增加了 TLS 加密层，通过证书校验和对称加密结合非对称加密，实现通信加密、身份认证和数据完整性校验。HTTPS 使用专门的端口和握手流程，在安全性上明显优于 HTTP，但握手过程会带来一定性能开销。',
    explanation: '在实际系统设计中，所有涉及用户敏感数据的接口都应使用 HTTPS，以防止中间人攻击和数据泄漏。理解 TLS 握手流程有助于排查证书配置和加密套件相关问题。'
  },
  {
    title: '常见 HTTP 状态码含义',
    question: '简要说明 200、301、400、401、403、404 和 500 这几个常见 HTTP 状态码的含义。',
    difficulty: 'easy',
    difficultyScore: 0.35,
    categoryId: 4,
    tags: ['HTTP', '状态码', 'Web 开发'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['HTTP 基础'],
    languageRestrictions: [],
    answer: '200 表示请求成功；301 表示永久重定向，资源已被移动到新的 URL；400 表示客户端请求格式错误；401 表示未授权，通常需要提供认证信息；403 表示已认证但无访问权限；404 表示请求的资源不存在；500 表示服务器内部错误。通过状态码可以快速判断请求的大致处理结果。',
    explanation: '合理使用状态码有助于前后端协作和问题排查，同时也是设计良好 API 的重要部分。区分客户端错误和服务端错误可以帮助定位责任边界。'
  },
  {
    title: '数据库事务的 ACID 特性',
    question: '简要解释数据库事务的 ACID 四个特性分别指什么。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['数据库', '事务', 'ACID'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['数据库基础'],
    languageRestrictions: [],
    answer: 'ACID 分别表示原子性、一致性、隔离性和持久性。原子性指事务中操作要么全部成功要么全部失败；一致性指事务执行前后数据库从一个一致状态转变到另一个一致状态，不违反约束；隔离性指并发事务之间的执行应互不干扰，效果与串行执行等价；持久性指事务提交后对数据的修改是持久保存的，即使系统故障也能通过日志或备份恢复。',
    explanation: 'ACID 是关系型数据库设计和实现的重要原则，很多锁机制、日志机制和恢复策略都是围绕保证这四个特性展开的。'
  },
  {
    title: '数据库隔离级别与常见并发问题',
    question: '简要说明常见的数据库隔离级别以及它们与脏读、不可重复读和幻读的关系。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['数据库', '事务', '隔离级别'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['事务', '锁机制'],
    languageRestrictions: [],
    answer: '常见隔离级别从低到高依次为读未提交、读已提交、可重复读和串行化。读未提交可能产生脏读、不可重复读和幻读；读已提交避免了脏读，但仍可能出现不可重复读和幻读；可重复读避免了脏读和不可重复读，在某些实现中仍可能有幻读；串行化通过加锁或多版本控制，使并发事务的效果等同于串行执行，可以避免三种问题，但并发性能较差。',
    explanation: '选择隔离级别需要在数据一致性和系统性能之间平衡。大部分业务系统选用读已提交或可重复读，同时结合业务逻辑和悲观锁、乐观锁来处理关键场景。'
  },
  {
    title: 'B+ 树索引的特点',
    question: '简要说明为什么关系型数据库常用 B+ 树作为索引结构，以及它的几个关键特性。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['数据库', '索引', 'B+ 树'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['数据结构', '磁盘 IO'],
    languageRestrictions: [],
    answer: 'B+ 树是一种多路平衡搜索树，所有数据都存储在叶子节点，非叶子节点只存储键值用于索引。它的关键特性包括高度低、磁盘友好和范围查询高效。由于每个节点可以包含大量键值，树的高度通常很小，一次查找需要的磁盘 IO 次数有限；叶子节点通过链表相连，适合顺序扫描和范围查询；节点大小通常与磁盘页大小对齐，减少了磁盘读取的浪费。',
    explanation: '与二叉搜索树相比，B+ 树在大规模数据和磁盘环境下更适用，是 MySQL 等数据库默认的索引结构。了解其特性有助于设计合理的索引方案。'
  },
  {
    title: 'SQL 与 NoSQL 的差异',
    question: '简要比较关系型数据库和常见 NoSQL 数据库在数据模型和适用场景上的区别。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['数据库', 'SQL', 'NoSQL'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['数据库基础', '系统架构'],
    languageRestrictions: [],
    answer: '关系型数据库以表格和关系为核心，遵循严格的模式和 ACID 事务，适合强一致性需求和复杂查询场景。NoSQL 数据库包括键值存储、文档数据库、列式数据库和图数据库等，更强调可扩展性和灵活的数据模型，通常采用弱一致性或最终一致性，适合高并发、大数据量和灵活结构的场景，如缓存、日志、社交关系等。',
    explanation: '在现代系统中，常见做法是关系型数据库负责核心事务数据，NoSQL 负责高并发或特定结构的数据，形成多种存储引擎组合的架构。'
  },
  {
    title: '时间复杂度和空间复杂度的含义',
    question: '简要说明大 O 记号中时间复杂度和空间复杂度分别描述什么。',
    difficulty: 'easy',
    difficultyScore: 0.35,
    categoryId: 6,
    tags: ['算法', '时间复杂度', '空间复杂度'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['算法基础'],
    languageRestrictions: [],
    answer: '时间复杂度描述算法在输入规模 n 增大时，执行步骤数量随 n 增长的数量级，常见有 O(1)、O(log n)、O(n)、O(n log n) 等，用于估计算法运行时间随规模变化的趋势。空间复杂度描述算法在运行过程中额外占用的存储空间随输入规模 n 的增长情况，用于衡量算法对内存的消耗。大 O 记号关注的是最高阶项和常数无关的增长趋势。',
    explanation: '分析复杂度有助于在多种解法之间进行选择，特别是在输入规模较大时，可以预估性能瓶颈并进行优化。'
  },
  {
    title: '常见排序算法的比较',
    question: '从时间复杂度、空间复杂度和稳定性角度比较快速排序、归并排序和堆排序。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 6,
    tags: ['算法', '排序', '复杂度'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['常见排序算法'],
    languageRestrictions: [],
    answer: '快速排序平均时间复杂度 O(n log n)，最坏 O(n²)，空间复杂度平均 O(log n)，通常原地排序，不稳定；归并排序时间复杂度稳定为 O(n log n)，空间复杂度 O(n)，需要额外数组，稳定；堆排序时间复杂度为 O(n log n)，空间复杂度 O(1)，原地排序，不稳定。在工程实践中，快速排序因常数因子小而常用，但在最坏情况或稳定性要求高的场景会选择归并排序。',
    explanation: '理解不同排序算法的特性有助于根据数据规模、数据分布和稳定性要求选择合适实现，很多库排序采用混合策略。'
  },
  {
    title: '哈希表冲突处理方法',
    question: '简要说明开放地址法和链地址法处理哈希冲突的基本思路。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 6,
    tags: ['数据结构', '哈希表', '冲突处理'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['哈希函数', '数组和链表'],
    languageRestrictions: [],
    answer: '开放地址法在发生冲突时通过探查数组中的下一个或多个位置寻找空槽，例如线性探查、二次探查和双重哈希。链地址法则在每个桶中维护一个链表或其他结构，所有哈希到同一位置的元素存储在该桶的链表中。开放地址法节省指针开销但对装载因子较敏感，删除操作复杂；链地址法更灵活，适合动态扩展，但会有额外的指针和内存碎片开销。',
    explanation: '实际工程中通常使用链地址法的变种（例如哈希桶+红黑树），在高装载因子情况下仍能保持较好的性能。'
  },
  {
    title: '栈和队列的典型应用场景',
    question: '分别举例说明栈和队列在程序设计中的一到两个典型应用。',
    difficulty: 'easy',
    difficultyScore: 0.35,
    categoryId: 6,
    tags: ['数据结构', '栈', '队列'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['线性结构基础'],
    languageRestrictions: [],
    answer: '栈遵循后进先出，典型应用包括函数调用栈、表达式求值和括号匹配等。队列遵循先进先出，典型应用包括任务调度、消息队列和广度优先搜索中的节点遍历。通过栈和队列可以简化很多算法的状态管理。',
    explanation: '理解栈和队列的性质可以帮助把握许多算法的核心思想，例如 DFS 与 BFS 的差异本质上就在于使用栈还是队列来管理待处理节点。'
  },
  {
    title: '深度优先搜索与广度优先搜索',
    question: '简要说明深度优先搜索和广度优先搜索在实现方式和适用场景上的区别。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 6,
    tags: ['算法', '图论', '搜索'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['图的遍历'],
    languageRestrictions: [],
    answer: '深度优先搜索使用栈或递归实现，每次尽可能向下探索到路径末端再回溯，适合解决连通性、拓扑排序和求解所有路径等问题。广度优先搜索使用队列，从起点开始一层一层向外扩展，适合求解最短路径（在无权图中）和层序遍历等问题。DFS 更节省空间但可能陷入深层分支，BFS 空间开销较大但能保证最短步数。',
    explanation: '在设计搜索算法时，需要根据问题是否关心路径长度、搜索空间规模以及对递归深度的约束等因素选择 DFS 或 BFS，很多复杂算法是两者的组合或变体。'
  },
  {
    title: '面向对象的三大特性',
    question: '简要说明封装、继承和多态三大面向对象特性的含义。',
    difficulty: 'easy',
    difficultyScore: 0.35,
    categoryId: 5,
    tags: ['面向对象', '封装', '继承', '多态'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['面向对象编程基础'],
    languageRestrictions: [],
    answer: '封装是将数据和行为组合在一起，通过访问控制隐藏内部实现细节，只暴露必要接口；继承是子类复用父类属性和方法的机制，可以在不修改父类代码的前提下扩展行为；多态是指在统一接口下，根据实际对象类型执行不同实现，例如通过方法重写和接口实现，使调用方只依赖抽象而不关心具体类型。',
    explanation: '面向对象的三大特性为复杂系统建模提供了良好的抽象能力，有助于降低耦合度、提高可维护性和扩展性。'
  },
  {
    title: '单一职责原则的含义',
    question: '简要说明单一职责原则的定义，并举一个简单示例。',
    difficulty: 'easy',
    difficultyScore: 0.35,
    categoryId: 5,
    tags: ['设计原则', '单一职责', '面向对象'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['面向对象设计'],
    languageRestrictions: [],
    answer: '单一职责原则指一个类或模块应该仅有一个引起它变化的原因，即只负责一项职责。这样一旦需求变更，只会影响到少量的类，降低修改风险。例如，将日志记录与业务处理拆分成两个类，一个专门负责业务逻辑，另一个负责写日志，而不是在同一个类里同时做两件事。',
    explanation: '单一职责原则有助于控制类的规模和复杂度，使代码更易于理解和测试，也是很多重构手法的指导原则。'
  },
  {
    title: '常见设计模式举例',
    question: '简要说明工厂模式和单例模式解决的典型问题。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 5,
    tags: ['设计模式', '工厂模式', '单例模式'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['面向对象设计', '创建型模式'],
    languageRestrictions: [],
    answer: '工厂模式通过引入工厂类或工厂方法，将对象创建与使用解耦，调用方只依赖抽象接口，具体产品类型的选择由工厂统一管理，适合经常扩展新实现的场景。单例模式保证系统中某个类只有一个实例，并提供全局访问点，常用于配置管理、连接池、缓存等场景，但需要注意线程安全和测试可替换性。',
    explanation: '设计模式的本质是总结在特定上下文中经验证的设计经验，需要结合具体场景权衡使用，避免过度设计。'
  },
  {
    title: 'MVC 与 MVVM 架构的区别',
    question: '简要比较 MVC 和 MVVM 两种前后端常见架构模式的核心差异。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 1,
    tags: ['架构模式', 'MVC', 'MVVM'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['前端框架基础'],
    languageRestrictions: [],
    answer: 'MVC 将应用分为模型、视图和控制器三部分，控制器负责接收用户输入并协调模型和视图；MVVM 引入 ViewModel 作为视图和模型之间的中介，通过数据绑定机制自动同步视图和状态。MVC 中视图和控制器耦合较紧，而 MVVM 借助双向绑定或单向数据流，使视图逻辑更多集中在 ViewModel 中，更适合前端组件化开发。',
    explanation: '在现代前端框架中，更多采用基于 MVVM 或其变体的架构，以提高可测试性和组件复用性；而在后端 Web 框架中依然常见基于 MVC 的路由和控制器设计。'
  },
  {
    title: '微服务架构的优点和挑战',
    question: '简要说明微服务架构相对于单体应用的主要优点和带来的新挑战。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['系统架构', '微服务', '分布式'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['分布式系统基础'],
    languageRestrictions: [],
    answer: '微服务架构将单体应用拆分为多个围绕业务能力构建的小服务，每个服务可以独立部署和扩展，技术栈也可不同，有利于提高团队自治和发布效率。它的主要挑战包括分布式事务、一致性、服务发现、链路追踪、接口兼容和运维复杂度提升等，需要引入服务注册、配置中心、网关、监控和自动化运维等配套设施。',
    explanation: '是否采用微服务需要结合团队规模、业务复杂度和运维能力综合评估，盲目拆分可能带来比单体更大的复杂度。'
  },
  {
    title: 'CAP 定理的三个要素',
    question: '简要说明 CAP 定理中的一致性、可用性和分区容错性分别指什么。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['分布式系统', 'CAP', '一致性'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['分布式基础'],
    languageRestrictions: [],
    answer: '一致性指在同一时间所有节点对外展示的数据视图相同；可用性指每个请求都能在有限时间内获得响应，即使响应可能不是最新数据；分区容错性指系统在出现网络分区等通信失败时仍能继续提供服务。CAP 定理指出在出现网络分区的情况下，一个分布式系统无法同时完全满足一致性和可用性，只能在两者之间做权衡。',
    explanation: '理解 CAP 有助于分析不同分布式存储系统的设计取向，例如某些系统偏向 CP，另一些偏向 AP，工程实践中常用最终一致性和补偿机制来平衡用户体验与数据正确性。'
  },
  {
    title: '常见缓存问题：穿透、击穿和雪崩',
    question: '简要说明缓存穿透、缓存击穿和缓存雪崩三种问题及常见解决思路。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['缓存', '系统架构', '性能优化'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['缓存设计', '高并发基础'],
    languageRestrictions: [],
    answer: '缓存穿透指大量请求访问不存在的数据，缓存和数据库都要查，常见做法是对不存在的键也进行短期缓存或使用布隆过滤器拦截。缓存击穿指某个热点键在过期瞬间有大量并发请求直接击中数据库，可以通过互斥锁或逻辑过期控制重建。缓存雪崩指大量缓存键在同一时间集中过期或缓存服务整体不可用导致数据库被打爆，可以通过过期时间随机化、多级缓存和限流降级来缓解。',
    explanation: '在高并发场景下合理设计缓存策略非常关键，需要从访问模式和故障模式两个维度考虑防护措施。'
  },
  {
    title: '幂等性的概念与实现',
    question: '简要说明接口幂等性的含义，并举例说明如何实现一个幂等的订单支付接口。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['分布式系统', '接口设计', '幂等'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['HTTP 接口设计', '事务处理'],
    languageRestrictions: [],
    answer: '幂等性指对同一操作多次执行，其对系统的影响与执行一次的效果相同。在订单支付场景中，可以通过业务唯一标识（如订单号）和支付状态表来保证幂等：每次请求根据订单号查询支付记录，如果已成功则直接返回成功，不重复扣款；如果处于处理中则返回相应状态；只有在未支付状态才发起真正的扣款流程。也可以结合幂等令牌和去重表进一步控制。',
    explanation: '幂等性是分布式环境下应对重试、网络抖动和重复提交的重要手段，接口设计时应显式考虑哪些操作需要保证幂等。'
  },
  {
    title: '消息队列在系统中的作用',
    question: '简要说明引入消息队列可以解决哪些问题，并举两个典型使用场景。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['消息队列', '系统解耦', '异步'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['系统架构基础'],
    languageRestrictions: [],
    answer: '消息队列可以将调用方和被调用方解耦，通过异步处理提高系统吞吐，并具备一定的削峰填谷能力。典型场景包括订单下单后异步发送短信或邮件通知、用户上传图片后异步生成缩略图等。通过队列可以避免请求直接阻塞在耗时操作上，同时在消费端异常时也可以缓冲请求。',
    explanation: '消息队列引入后需要考虑消息可靠性、顺序性和重复消费等问题，通常需要配合幂等性和重试策略一起设计。'
  },
  {
    title: '单元测试、集成测试与端到端测试',
    question: '简要说明单元测试、集成测试和端到端测试的关注点和差异。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['测试', '质量保障', '工程实践'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['软件工程基础'],
    languageRestrictions: [],
    answer: '单元测试关注单个函数或类的正确性，强调快速和稳定，通常隔离外部依赖；集成测试关注多个模块或服务之间的协同行为，验证接口契约和数据流是否正确；端到端测试从用户视角验证整个系统的关键业务流程，覆盖 UI、接口和后端，通常最慢也最脆弱。三者层层递进，合理的测试金字塔应该单元测试最多，端到端测试最少。',
    explanation: '合理的测试策略可以在保证质量的同时控制维护成本，过多依赖端到端测试会导致反馈缓慢且难以定位问题。'
  },
  {
    title: '持续集成与持续交付的核心价值',
    question: '简要说明持续集成（CI）和持续交付（CD）的核心目标各是什么。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['DevOps', 'CI', 'CD'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['软件工程实践'],
    languageRestrictions: [],
    answer: '持续集成的核心目标是让代码频繁合入主干，并在每次集成时自动运行构建和测试，以尽早发现集成问题和回归缺陷。持续交付在持续集成基础上，将构建、测试、打包和部署过程自动化，使软件随时处于可以安全发布的状态，减少人工操作和发布风险。',
    explanation: 'CI/CD 通过自动化流水线缩短了从开发到上线的周期，是现代软件工程的重要实践，能显著提升交付效率和稳定性。'
  },
  {
    title: '容器与虚拟机的区别',
    question: '简要比较容器和虚拟机在资源隔离方式和启动开销上的差异。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['容器技术', '虚拟化', 'Docker'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['操作系统', '虚拟化基础'],
    languageRestrictions: [],
    answer: '虚拟机通过在宿主机上运行一个完整的虚拟化层，为每个虚拟机提供独立的操作系统实例，隔离性强但资源开销大、启动较慢。容器基于操作系统内核的命名空间和 cgroup 等机制，在同一个内核上运行多个相互隔离的进程，镜像通常只包含运行时和应用，启动速度快、资源利用率高，但隔离粒度略弱。',
    explanation: '容器更适合云原生场景和弹性扩缩容，而虚拟机适合需要强隔离或多操作系统共存的场景，实际部署中常用“虚拟机+容器”的组合。'
  },
  {
    title: 'Kubernetes 中常见核心对象',
    question: '简要说明 Pod、Deployment 和 Service 在 Kubernetes 集群中的作用。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['Kubernetes', '容器编排', '云原生'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['容器技术基础'],
    languageRestrictions: [],
    answer: 'Pod 是 Kubernetes 中最小的调度单位，通常封装一个或多个紧密关联的容器；Deployment 用于管理一组无状态 Pod 的副本数、滚动更新和回滚等，是声明式管理应用的核心对象；Service 提供一组 Pod 的稳定访问入口，通过标签选择器将请求负载均衡到后端 Pod 上，屏蔽 Pod IP 的变化。',
    explanation: '理解这三个对象的关系是使用 Kubernetes 的基础，它们共同构建了弹性扩缩容和服务发现的能力。'
  },
  {
    title: '常见 Web 安全攻击类型',
    question: '简要说明 XSS 和 CSRF 攻击的基本原理以及常见防御措施。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['Web 安全', 'XSS', 'CSRF'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['Web 基础', '浏览器安全模型'],
    languageRestrictions: [],
    answer: 'XSS 攻击通过向页面注入恶意脚本代码，在用户浏览页面时在其浏览器中执行，从而窃取 Cookie、伪造操作或加载恶意内容。防御措施包括对输出进行严格的转义、使用内容安全策略和避免信任用户输入。CSRF 攻击则利用浏览器自动附带 Cookie 的特点，引导用户在已登录的站点上发起恶意请求。防御措施包括使用 CSRF Token、检查 Referer 或 Origin 头以及对关键操作使用双重确认。',
    explanation: 'Web 安全问题往往是工程实现中的薄弱环节，理解攻击原理有助于在设计接口和前端页面时主动加固安全策略。'
  },
  {
    title: 'DNS 解析过程',
    question: '简要说明浏览器访问一个域名时，DNS 解析大致会经历哪些步骤。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['计算机网络', 'DNS', '域名解析'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['网络基础'],
    languageRestrictions: [],
    answer: '浏览器首先在本地缓存中查找域名对应的 IP，如果没有命中，则查询操作系统缓存；若仍未命中，会向本地域名服务器发送查询请求，本地域名服务器可能再次查本地缓存或转向根服务器。根服务器返回顶级域名服务器地址，随后递归地查询权威域名服务器，最终获得目标域名的 IP 地址。整个过程中各级服务器会缓存结果以提高后续查询效率。',
    explanation: '理解 DNS 解析过程有助于分析访问延迟和 DNS 污染等问题，合理配置缓存时间和使用权威 DNS 可以改善访问体验。'
  },
  {
    title: '日志与链路追踪在分布式系统中的作用',
    question: '简要说明集中日志和分布式链路追踪对定位问题的帮助。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['可观测性', '日志', '链路追踪'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['分布式系统', '运维监控'],
    languageRestrictions: [],
    answer: '集中日志系统可以将各个服务的日志统一采集、存储和检索，方便跨服务查询和统计，便于快速定位某个时间段或某个用户的异常行为。分布式链路追踪通过在请求链路上传播 TraceId 和 SpanId，将一次用户请求在多个服务间的调用关系串联起来，直观展示调用拓扑和延迟分布，有助于定位性能瓶颈和故障点。',
    explanation: '在微服务架构下，仅依靠单个服务的本地日志很难快速排查问题，可观测性体系（日志、指标和链路）是保障稳定性的基础设施。'
  },
  {
    title: 'REST API 设计的几个基本原则',
    question: '简要说明设计 REST 风格 API 时常见的几条基本原则。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['REST', 'API 设计', '后端开发'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['HTTP 基础'],
    languageRestrictions: [],
    answer: '常见原则包括：使用资源名而不是动作词设计路径，例如 /users 而不是 /getUsers；合理使用 HTTP 方法表达语义，如 GET 查询、POST 新增、PUT 替换、PATCH 部分更新、DELETE 删除；使用合适的状态码反馈结果；接口应保持无状态，所有必要信息通过请求参数或头部传递；对列表接口支持分页和过滤参数；通过版本号或向后兼容策略管理接口演进。',
    explanation: '遵循基本 REST 原则可以提高接口的一致性和可理解性，降低前后端沟通成本，也便于后续维护和扩展。'
  },
  {
    title: '软件性能优化的常见方向',
    question: '简要列举在优化一个后端系统性能时常见的几个方向。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['性能优化', '后端开发', '系统架构'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['系统分析', '性能测试'],
    languageRestrictions: [],
    answer: '常见优化方向包括：减少不必要的网络往返和序列化开销，例如接口合并和使用高效协议；优化数据库访问，如合理建索引、使用批量操作和读写分离；引入缓存降低热点数据访问延迟；通过异步化和消息队列提高吞吐；优化算法和数据结构降低时间复杂度；通过水平扩展和负载均衡提高系统整体处理能力。同时需要通过压测和监控找到真正的瓶颈点。',
    explanation: '性能优化应以数据为依据，避免盲目微调代码细节，优先处理对整体性能影响最大的瓶颈。'
  },
  {
    title: '线程池的核心参数含义',
    question: '简要说明线程池中核心线程数、最大线程数和队列容量等参数的含义及作用。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 5,
    tags: ['并发编程', '线程池', 'Java'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['多线程基础'],
    languageRestrictions: ['Java'],
    answer: '核心线程数是线程池长期维持的基本线程数量，当有新任务到达且当前线程数小于核心线程数时会创建新线程；最大线程数是线程池允许创建的线程上限，当队列已满且线程数小于最大值时，会继续创建新线程以应对高峰；队列容量用于缓存等待执行的任务过多时的排队长度。合理配置这些参数可以在吞吐量和资源占用之间取得平衡，避免频繁创建销毁线程或任务积压。',
    explanation: '线程池参数配置需要结合机器核心数、任务类型（CPU 密集或 IO 密集）以及响应时间要求综合考虑，常需通过压测进行调优。'
  },
  {
    title: '数据库连接池的作用',
    question: '简要说明为什么需要数据库连接池，它解决了什么性能问题。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['数据库', '连接池', '性能优化'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['数据库访问基础'],
    languageRestrictions: [],
    answer: '数据库连接的建立和释放是一个相对昂贵的操作，如果每次请求都新建连接，会产生大量资源开销和延迟。连接池通过预先创建并复用一定数量的数据库连接，避免频繁创建销毁，显著降低延迟并提高吞吐。同时可以通过最大连接数限制保护数据库不被过载。',
    explanation: '几乎所有生产环境的应用都会使用数据库连接池，合理配置池大小和超时参数是系统性能调优的重要一环。'
  },
  {
    title: '索引失效的常见原因',
    question: '简要列举几个可能导致数据库查询索引失效的原因。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 4,
    tags: ['数据库', '索引', '性能优化'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['索引原理', 'SQL 编写'],
    languageRestrictions: [],
    answer: '常见原因包括：在索引列上使用函数或表达式导致无法使用索引；在组合索引上没有按照最左前缀规则使用条件；对字符串列进行前后模糊匹配如 %key% 导致无法利用普通索引；类型隐式转换使索引列被当作函数处理；统计信息不准确导致优化器选择了全表扫描。',
    explanation: '在编写 SQL 时应注意索引友好性，必要时可以通过执行计划分析确认查询是否正确走索引。'
  },
  {
    title: '一致性哈希的基本思想',
    question: '简要说明一致性哈希在分布式缓存或存储中的作用和基本思想。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['分布式系统', '一致性哈希', '负载均衡'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['哈希', '分布式缓存'],
    languageRestrictions: [],
    answer: '一致性哈希通过将节点和数据映射到一个逻辑环上，数据沿顺时针方向存储到第一个大于等于其哈希值的节点上。当节点增加或减少时，只需要重新分配环上相邻区间的数据，从而将迁移数据量控制在总量的较小比例。为了避免数据倾斜，会为每个物理节点创建多个虚拟节点分布在环上。',
    explanation: '一致性哈希常用于分布式缓存、存储和负载均衡场景，可以在节点变动频繁的情况下保持较好的数据分布和稳定性。'
  },
  {
    title: '水平拆分与垂直拆分',
    question: '简要说明数据库或服务做水平拆分和垂直拆分的区别。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['系统架构', '拆分策略', '扩展性'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['系统设计基础'],
    languageRestrictions: [],
    answer: '垂直拆分是按功能或模块将数据库表或服务拆分到不同的节点或应用中，例如将用户、订单和日志拆成不同的库或服务；水平拆分是按数据范围或规则将同一张表的数据切分到多个节点上，例如按用户 ID 取模分片。垂直拆分主要解决单点压力过大和职责边界问题，水平拆分主要解决单表数据量过大和吞吐不足的问题。',
    explanation: '实际系统演化中往往先做垂直拆分，再在热点数据上进行水平拆分，逐步提升系统的可扩展性。'
  },
  {
    title: '分布式事务的基本挑战',
    question: '简要说明分布式事务相比本地事务额外增加了哪些复杂性。',
    difficulty: 'hard',
    difficultyScore: 0.75,
    categoryId: 4,
    tags: ['分布式系统', '事务', '一致性'],
    estimatedTime: 8,
    prerequisiteKnowledge: ['事务原理', '网络故障模型'],
    languageRestrictions: [],
    answer: '分布式事务涉及多个服务或数据源，在网络不可靠、节点可能故障的环境下，要同时保证原子性和一致性非常困难。额外复杂性包括：需要协调者组件来管理多方提交和回滚；需要处理网络超时、部分节点失败和重复请求；需要解决锁粒度和长事务对性能的影响。传统的两阶段提交协议在可靠性和性能上存在局限，因此实际工程中常通过本地事务加补偿、可靠消息、TCC 等模式来折衷处理。',
    explanation: '理解分布式事务的本质是在不可靠网络环境下维护跨节点状态的一致性，有助于在系统设计时避免过度依赖强一致，而是采用最终一致性和幂等设计。'
  },
  {
    title: '二叉搜索树与平衡二叉树',
    question: '简要说明普通二叉搜索树与平衡二叉树（如 AVL、红黑树）的差异，以及为什么需要“平衡”。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 6,
    tags: ['数据结构', '二叉树', '平衡树'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['二叉搜索树', '递归'],
    languageRestrictions: [],
    answer: '二叉搜索树要求左子树所有节点小于根节点，右子树所有节点大于根节点，但不保证树的高度接近对数级，如果插入数据接近有序，树会退化成链表，查找复杂度变为 O(n)。平衡二叉树通过在插入和删除时进行旋转调整，使树的高度保持在 O(log n) 范围内，从而保证查找、插入和删除等操作的时间复杂度稳定在 O(log n)。',
    explanation: '“平衡”的目标是控制树的高度，避免极端数据分布导致性能退化，红黑树等平衡树在标准库和数据库索引实现中应用广泛。'
  },
  {
    title: '编译型语言与解释型语言',
    question: '简要比较编译型语言和解释型语言在执行方式和典型代表上的差异。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 5,
    tags: ['编程语言', '编译', '解释'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['程序执行流程基础'],
    languageRestrictions: [],
    answer: '编译型语言在执行前会将源代码整体编译为机器码或中间代码，再由操作系统或运行时直接执行，典型代表有 C/C++、Go 等；解释型语言通常在运行时由解释器逐行读取和执行源代码或字节码，典型代表有 Python、JavaScript 等。编译型语言启动前开销较大但运行效率高，解释型语言启动快、开发迭代方便但执行速度相对较慢。',
    explanation: '现代语言往往采用“编译+解释”或 JIT 的混合方式，例如 Java 和 JavaScript 引擎，通过热点代码编译提升性能，同时保留一定的灵活性。'
  },
  {
    title: '垃圾回收机制解决了什么问题',
    question: '简要说明自动垃圾回收（GC）机制主要解决了哪些问题，同时带来了哪些新的开销。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 5,
    tags: ['内存管理', '垃圾回收', '编程语言'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['堆内存', '对象生命周期'],
    languageRestrictions: [],
    answer: '垃圾回收自动负责回收不再被引用的对象，解决了手动内存管理中常见的内存泄漏和悬空指针问题，简化了开发者的内存管理负担。但 GC 需要定期扫描对象图并回收内存，会引入额外的 CPU 开销和停顿时间，对延迟敏感的系统需要精心调优或搭配其他技术。',
    explanation: '理解 GC 的基本原理和触发时机有助于在 Java、Go 等语言中编写更友好的代码，例如减少短命对象的创建或避免大对象频繁分配释放。'
  },
  {
    title: '不可变对象的优势',
    question: '简要说明在多线程或函数式编程中使用不可变对象的好处。',
    difficulty: 'medium',
    difficultyScore: 0.55,
    categoryId: 5,
    tags: ['并发编程', '不可变对象', '函数式编程'],
    estimatedTime: 6,
    prerequisiteKnowledge: ['对象引用', '线程安全'],
    languageRestrictions: [],
    answer: '不可变对象一旦创建，其内部状态在整个生命周期内不会发生变化，因此在多线程环境中可安全共享，无需加锁也不会出现竞态条件；在函数式编程中配合纯函数使用，可以简化推理和调试。代价是频繁创建新对象可能增加内存分配和 GC 压力，需要结合持久化数据结构或结构共享技术来优化。',
    explanation: '合理使用不可变对象可以在很多场景下用空间换时间，换取更简单的并发模型和更可靠的程序行为。'
  },
  {
    title: '事件驱动架构的核心思想',
    question: '简要说明事件驱动架构（EDA）的核心思想和适用场景。',
    difficulty: 'medium',
    difficultyScore: 0.6,
    categoryId: 4,
    tags: ['系统架构', '事件驱动', '异步'],
    estimatedTime: 7,
    prerequisiteKnowledge: ['消息队列', '发布订阅'],
    languageRestrictions: [],
    answer: '事件驱动架构以“事件”作为系统中各组件交互的核心抽象，生产者在发生业务变化时发布事件，消费者订阅感兴趣的事件并做出相应处理，从而实现松耦合和异步处理。它适合业务流程复杂、需要对业务行为进行审计和扩展的场景，如订单状态变化触发库存扣减、积分发放和消息通知等。',
    explanation: 'EDA 可以与消息队列和日志系统结合，实现可重放的事件流，但也带来了数据一致性、幂等性和事件顺序管理等新挑战。'
  },
  {
    title: '领域驱动设计中的“实体”和“值对象”',
    question: '简要说明在领域驱动设计（DDD）中实体（Entity）和值对象（Value Object）的区别。',
    difficulty: 'hard',
    difficultyScore: 0.7,
    categoryId: 5,
    tags: ['DDD', '实体', '值对象', '建模'],
    estimatedTime: 8,
    prerequisiteKnowledge: ['面向对象分析', '业务建模'],
    languageRestrictions: [],
    answer: '实体具有持久的唯一标识，其身份在生命周期中相对稳定，即使属性发生变化也被视为同一个对象，例如订单或用户。值对象没有独立身份，仅由其属性值定义，例如金额、地址或时间区间，相同值对象可以被重用且通常是不可变的。区分两者有助于更清晰地建模业务，简化持久化和对象比较逻辑。',
    explanation: '合理使用值对象可以减少领域模型中的“贫血”数据结构，让大量与业务含义紧密相关的规则聚合在一起，提高可读性和可维护性。'
  },
  {
    title: '代码重构的常见动机',
    question: '简要说明在什么情况下应该考虑对现有代码进行重构，并举一两个常见信号。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 5,
    tags: ['重构', '代码质量', '软件工程'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['软件维护'],
    languageRestrictions: [],
    answer: '当修改一个需求需要在多个看似无关的地方反复修改、或者难以理解某个模块的行为、或者 bug 频繁出现在同一块代码时，往往意味着设计已不再适应当前需求，需要重构。常见信号包括：重复代码大量存在、方法或类过于臃肿、依赖关系混乱以及过多的条件分支等。',
    explanation: '重构的目的是在不改变外部行为的前提下改善内部结构，通常应配合测试用例一起进行，以降低引入新缺陷的风险。'
  },
  {
    title: '技术债务的概念',
    question: '简要解释“技术债务”的含义，以及为什么需要在项目过程中刻意管理技术债。',
    difficulty: 'easy',
    difficultyScore: 0.4,
    categoryId: 4,
    tags: ['技术债务', '软件工程', '项目管理'],
    estimatedTime: 5,
    prerequisiteKnowledge: ['项目开发流程'],
    languageRestrictions: [],
    answer: '技术债务指在开发过程中为了快速交付而做出的不理想技术决策或临时性实现，这些选择就像借来的“债”，以后需要通过重构、优化或重写来“还”。如果长期忽视技术债，系统的复杂度和缺陷率会逐渐上升，新功能开发速度会越来越慢。刻意管理技术债可以在业务迭代和代码质量之间取得平衡。',
    explanation: '良好的团队实践会在迭代计划中预留一定比例的时间用于偿还技术债，例如重构核心模块、补充测试或升级依赖。'
  }
]

if (Array.isArray(mockData.questions)) {
  const baseId = mockData.questions.reduce((maxId, q) => {
    const id = Number(q.id) || 0
    return id > maxId ? id : maxId
  }, 0)

  EXTRA_CS_SHORT_ANSWER_QUESTIONS.forEach((item, index) => {
    const now = new Date().toISOString()
    mockData.questions.push({
      id: baseId + index + 1,
      title: item.title,
      question: item.question,
      type: 'short_answer',
      difficulty: item.difficulty || 'medium',
      difficultyScore: item.difficultyScore != null ? item.difficultyScore : 0.5,
      domainId: 1,
      categoryId: item.categoryId || 6,
      categoryPath: [item.categoryId || 6],
      tags: item.tags || [],
      estimatedTime: item.estimatedTime || 6,
      source: 'manual',
      metadata: {
        prerequisiteKnowledge: item.prerequisiteKnowledge || [],
        languageRestrictions: item.languageRestrictions || [],
        yearRelevance: item.yearRelevance || 2024
      },
      answer: item.answer,
      explanation: item.explanation,
      stats: {
        attempts: 0,
        correctCount: 0,
        averageScore: 0,
        likeCount: 0,
        viewCount: 0
      },
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now
    })
  })
}

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

  // 检查 Dify Chat API 配置
  console.log('\n🤖 Dify Chat API 配置状态:')
  const chatStatus = chatWorkflowService.getStatus()
  console.log(`   已配置: ${chatStatus.configured ? '✅' : '❌'}`)
  console.log(`   API Key: ${chatStatus.apiKey}`)
  console.log(`   App ID: ${chatStatus.appId}`)
  console.log(`   Base URL: ${chatStatus.baseURL}`)
  if (chatStatus.configured) {
    console.log(`   🎉 Dify Chat API 已就绪，将使用真实 API`)
  } else {
    console.log(`   ⚠️  Dify Chat API 未配置，将降级到本地模拟`)
  }

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
  console.log(`   GET  /api/disciplines - 获取所有学科门类 🆕🎓`)
  console.log(`   GET  /api/disciplines/:id/major-groups - 获取学科专业类 🆕🎓`)
  console.log(`   GET  /api/majors/:id/details - 获取专业详情 + 细分方向 🆕🎓`)
  console.log(`   GET  /api/specializations/:id - 获取细分方向详情 🆕🎓`)
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
