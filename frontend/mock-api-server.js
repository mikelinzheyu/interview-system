const http = require('http');
const url = require('url');

// 模拟数据
const mockQuestions = [
  {
    id: 1,
    question: "请介绍一下JavaScript中的闭包概念",
    category: "前端技术",
    difficulty: "中等",
    expectedAnswer: "闭包是指函数能够访问其外部作用域中的变量",
    keywords: ["闭包", "作用域", "变量", "函数"]
  },
  {
    id: 2,
    question: "说说你对Vue.js响应式原理的理解",
    category: "前端框架",
    difficulty: "中等",
    expectedAnswer: "Vue通过Object.defineProperty或Proxy劫持数据变化",
    keywords: ["响应式", "数据劫持", "Observer", "依赖收集"]
  },
  {
    id: 3,
    question: "如何优化前端应用的性能？",
    category: "性能优化",
    difficulty: "高级",
    expectedAnswer: "从代码分割、资源压缩、缓存策略等方面优化",
    keywords: ["性能优化", "代码分割", "缓存", "压缩"]
  }
];

const mockAnalysisResults = {
  overallScore: 82,
  summary: "回答较为全面，技术理解准确，表达清晰，建议在实际应用场景方面可以更深入一些。",
  technicalScore: 85,
  technicalFeedback: "对技术概念理解准确，能够举出具体例子",
  technicalStrengths: ["概念理解准确", "有实际应用经验"],
  technicalImprovements: ["可以深入讲解底层原理", "增加更多实战案例"],
  communicationScore: 78,
  communicationFeedback: "表达清晰，逻辑清楚，语速适中",
  clarity: 80,
  fluency: 76,
  logicalScore: 83,
  logicalFeedback: "回答结构合理，逻辑性强",
  structure: 85,
  coherence: 81,
  mentionedKeywords: ["闭包", "作用域", "函数"],
  missingKeywords: ["词法环境", "执行上下文"],
  keywordRelevance: 75,
  suggestions: [
    "建议深入解释闭包的内存管理机制",
    "可以举例说明闭包的实际应用场景",
    "注意避免闭包可能导致的内存泄漏问题"
  ]
};

// CORS头部
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // 设置CORS头部
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    // 路由处理
    if (path === '/api/interview/generate-question' && method === 'POST') {
      // 生成面试问题
      const randomQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        question: randomQuestion.question,
        expectedAnswer: randomQuestion.expectedAnswer,
        keywords: randomQuestion.keywords,
        category: randomQuestion.category,
        difficulty: randomQuestion.difficulty
      }));

    } else if (path === '/api/interview/analyze' && method === 'POST') {
      // 分析回答
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('收到分析请求:', data.question);
          console.log('用户回答:', data.answer);

          // 模拟AI分析延迟
          setTimeout(() => {
            res.writeHead(200);
            res.end(JSON.stringify({
              success: true,
              ...mockAnalysisResults
            }));
          }, 1500); // 1.5秒延迟模拟AI处理

        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });

    } else if (path === '/api/speech/transcribe' && method === 'POST') {
      // 语音转文本 (模拟)
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        transcript: "这是模拟的语音转文本结果，用于测试功能。",
        confidence: 0.95
      }));

    } else if (path.startsWith('/api/interview/') && path.endsWith('/feedback') && method === 'GET') {
      // 获取面试反馈
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        overallScore: 78,
        summary: "整体表现良好，技术功底扎实，沟通能力较强。",
        strengths: ["技术理解深入", "表达清晰", "思路清楚"],
        weaknesses: ["实战经验可以更丰富", "对新技术的了解可以更深入"],
        questions: [
          {
            question: "JavaScript闭包相关问题",
            answer: "用户的回答内容...",
            score: 85,
            analysis: "回答准确，理解深入",
            expectedPoints: ["闭包定义", "作用域链", "内存管理"],
            mentionedPoints: ["闭包定义", "作用域链"]
          }
        ],
        recommendations: [
          "加强实际项目经验",
          "深入学习新框架特性",
          "提高问题解决能力"
        ],
        skillGaps: ["微前端架构", "性能优化", "工程化"],
        nextSteps: ["学习TypeScript", "掌握Node.js", "了解云原生"]
      }));

    } else if (path === '/api/auth/login' && method === 'POST') {
      // 用户登录
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('用户登录:', data.username);

          // 模拟登录验证
          if (data.username && data.password) {
            res.writeHead(200);
            res.end(JSON.stringify({
              code: 200,
              message: '登录成功',
              data: {
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                  id: 1,
                  username: data.username,
                  real_name: data.username,
                  email: data.username + '@example.com',
                  avatar: null
                }
              }
            }));
          } else {
            res.writeHead(400);
            res.end(JSON.stringify({
              code: 400,
              message: '用户名或密码不能为空'
            }));
          }
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ code: 400, message: 'Invalid JSON' }));
        }
      });

    } else if (path === '/api/auth/register' && method === 'POST') {
      // 用户注册
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('用户注册:', data.username);

          res.writeHead(200);
          res.end(JSON.stringify({
            code: 200,
            message: '注册成功',
            data: {
              token: 'mock-jwt-token-' + Date.now(),
              user: {
                id: Date.now(),
                username: data.username,
                real_name: data.real_name || data.username,
                email: data.email,
                avatar: null
              }
            }
          }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ code: 400, message: 'Invalid JSON' }));
        }
      });

    } else if (path === '/api/auth/logout' && method === 'POST') {
      // 用户登出
      res.writeHead(200);
      res.end(JSON.stringify({
        code: 200,
        message: '登出成功'
      }));

    } else if (path === '/api/users/me' && method === 'GET') {
      // 获取用户信息
      res.writeHead(200);
      res.end(JSON.stringify({
        code: 200,
        data: {
          id: 1,
          username: 'testuser',
          real_name: '测试用户',
          email: 'test@example.com',
          avatar: null,
          created_at: '2025-01-01T00:00:00Z'
        }
      }));

    } else if (path === '/api/health' && method === 'GET') {
      // 健康检查
      res.writeHead(200);
      res.end(JSON.stringify({
        service: "interview-mock-api",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      }));

    } else {
      // 404 未找到
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'API endpoint not found',
        path: path,
        method: method
      }));
    }

  } catch (error) {
    console.error('服务器错误:', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }));
  }
});

// 启动服务器
const PORT = 8082;
server.listen(PORT, () => {
  console.log(`🚀 模拟API服务器已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`\n📋 可用的API端点:`);
  console.log(`   POST /api/interview/generate-question  - 生成面试问题`);
  console.log(`   POST /api/interview/analyze            - 分析回答`);
  console.log(`   POST /api/speech/transcribe           - 语音转文本`);
  console.log(`   GET  /api/interview/{id}/feedback     - 获取面试反馈`);
  console.log(`   GET  /api/health                      - 健康检查`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});