/**
 * Mock API服务器 - 用于前端测试
 * 模拟后端API响应
 */
const http = require('http')
const url = require('url')

const PORT = 3001

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
      role: 'user'
    }
  ],

  // 面试问题
  questions: [
    {
      id: 1,
      question: 'JavaScript闭包的概念及其应用场景？',
      category: 'JavaScript',
      difficulty: 'medium',
      skills: ['JavaScript', '闭包', '作用域'],
      answer: '闭包是指有权访问另一个函数作用域中变量的函数...'
    },
    {
      id: 2,
      question: 'Vue.js的响应式原理是什么？',
      category: 'Vue.js',
      difficulty: 'medium',
      skills: ['Vue.js', '响应式', 'MVVM'],
      answer: 'Vue.js使用数据劫持结合发布者-订阅者模式...'
    }
  ],

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
  ]
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
const routes = {
  // 健康检查
  'GET:/api/actuator/health': (req, res) => {
    sendResponse(res, 200, mockData.health)
  },

  'GET:/api/health': (req, res) => {
    sendResponse(res, 200, mockData.health)
  },

  // Sessions list for WrongAnswersPage sidebar
  'GET:/api/sessions': (req, res) => {
    const sessions = [
      { sessionId: 'ai-2024-10-001', jobTitle: '前端开发工程师面试（AI）' },
      { sessionId: 'ai-2024-10-002', jobTitle: '全栈工程师面试（AI）' },
      { sessionId: 'ai-2024-10-003', jobTitle: '后端工程师面试（AI）' }
    ]
    sendResponse(res, 200, sessions, '获取会话列表成功')
  },

  // Wrong answers core endpoints for preview/list pages
  'GET:/api/wrong-answers': (req, res) => {
    const now = Date.now()
    const items = [
      {
        id: 'wa-001',
        questionTitle: '什么是闭包？在实际项目中如何应用？',
        questionContent: '请解释JavaScript闭包的概念，并给出两个常见使用场景。',
        errorType: 'knowledge',
        mastery: 45,
        wrongCount: 3,
        correctCount: 1,
        difficulty: 'medium',
        reviewStatus: 'reviewing',
        source: 'ai_interview',
        sessionId: 'ai-2024-10-001',
        lastWrongTime: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
        nextReviewTime: new Date(now + 1000 * 60 * 60 * 6).toISOString()
      },
      {
        id: 'wa-002',
        questionTitle: 'Vue3中的响应式原理是怎样的？',
        questionContent: '基于Proxy的依赖收集与触发机制，简述核心流程。',
        errorType: 'logic',
        mastery: 62,
        wrongCount: 2,
        correctCount: 3,
        difficulty: 'hard',
        reviewStatus: 'unreviewed',
        source: 'question_bank',
        sessionId: null,
        lastWrongTime: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        nextReviewTime: new Date(now + 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'wa-003',
        questionTitle: 'HTTP缓存控制策略有哪些？',
        questionContent: '对比强缓存与协商缓存，说明适用场景与常见Header。',
        errorType: 'incomplete',
        mastery: 30,
        wrongCount: 5,
        correctCount: 0,
        difficulty: 'medium',
        reviewStatus: 'unreviewed',
        source: 'ai_interview',
        sessionId: 'ai-2024-10-002',
        lastWrongTime: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        nextReviewTime: new Date(now + 1000 * 60 * 60 * 2).toISOString()
      }
    ]
    sendResponse(res, 200, items, '获取错题列表成功')
  },

  'GET:/api/wrong-answers/statistics': (req, res) => {
    const stats = {
      totalWrongCount: 10,
      totalCorrectCount: 25,
      masteredCount: 4,
      reviewingCount: 3,
      unreviewedCount: 3,
      masteredPercentage: 40
    }
    sendResponse(res, 200, stats, '获取错题统计成功')
  },

  'POST:/api/wrong-answers/generate-review-plan': (req, res) => {
    // Simulate plan generation
    sendResponse(res, 200, { ok: true, generatedAt: new Date().toISOString() }, '复习计划已生成')
  },

  // 用户相关
  'GET:/api/users/me': (req, res) => {
    sendResponse(res, 200, mockData.users[0])
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
  const routeKey = `${method}:${path}`

  // dynamic route: /api/domains/:slug/graph
  const graphMatch = path && path.match(/^\/api\/domains\/([^/]+)\/graph$/)
  if (method === 'GET' && graphMatch) {
    try {
      const slug = graphMatch[1]
      const fs = require('fs')
      const p = require('path')
      const file = p.resolve(__dirname, 'src', 'data', 'graphs', `${slug}.json`)
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'))
        sendResponse(res, 200, data, 'ok')
      } else {
        sendResponse(res, 404, null, 'Graph not found')
      }
    } catch (e) {
      sendResponse(res, 500, null, 'Graph load error')
    }
    return
  }

  console.log(`[${new Date().toISOString()}] ${method} ${path}`)

  // 处理CORS预检请求
  if (method === 'OPTIONS') {
    handleOptions(res)
    return
  }

  // 查找对应的路由处理器
  const handler = routes[routeKey] || routes['default']

  try {
    handler(req, res)
  } catch (error) {
    console.error('路由处理错误:', error)
    sendResponse(res, 500, null, '服务器内部错误')
  }
})

/**
 * 启动服务器
 */
server.listen(PORT, () => {
  console.log(`🚀 Mock API服务器已启动`)
  console.log(`📍 地址: http://localhost:${PORT}`)
  console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`)
  console.log(`📝 可用接口:`)
  console.log(`   GET  /api/health - 健康检查`)
  console.log(`   GET  /api/actuator/health - Spring Boot风格健康检查`)
  console.log(`   POST /api/auth/login - 用户登录`)
  console.log(`   GET  /api/users/me - 获取用户信息`)
  console.log(`   POST /api/interview/generate-question - 生成面试问题`)
  console.log(`   POST /api/interview/generate-question-smart - 智能生成面试问题`)
  console.log(`   POST /api/interview/analyze - 分析回答`)
  console.log(`   POST /api/interview/analyze-advanced - 五维度分析回答`)
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
