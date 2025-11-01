#!/usr/bin/env node

/**
 * 存储服务 - Node.js 实现
 * 为Workflow2提供会话数据存储API
 * 监听端口: 8081
 */

const http = require('http');
const url = require('url');

// 内存数据库 (简单实现)
const sessionDatabase = {};

// API密钥验证
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// 日志函数
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (data) {
    console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// 验证API密钥
function validateApiKey(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (token !== API_KEY) {
    log('WARN', '未授权的API访问，密钥不匹配', {
      provided: token ? token.substring(0, 10) + '...' : '未提供',
      expected: API_KEY.substring(0, 10) + '...'
    });
    return false;
  }

  return true;
}

// 处理 GET /api/sessions/{sessionId}
function handleGetSession(sessionId, res) {
  log('INFO', `获取会话数据`, { sessionId });

  if (sessionDatabase[sessionId]) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      sessionId,
      data: sessionDatabase[sessionId],
      timestamp: new Date().toISOString(),
      status: 'success'
    }));
    log('INFO', `会话数据已返回`, { sessionId });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Session not found',
      sessionId,
      status: 'error'
    }));
    log('WARN', `会话不存在`, { sessionId });
  }
}

// 处理 POST /api/sessions
function handleCreateOrUpdateSession(req, res, body) {
  log('INFO', '创建/更新会话数据');

  try {
    const sessionData = JSON.parse(body);
    const sessionId = sessionData.sessionId || sessionData.session_id || 'unknown';

    // 保存到内存数据库
    sessionDatabase[sessionId] = {
      ...sessionDatabase[sessionId],
      ...sessionData,
      lastUpdated: new Date().toISOString()
    };

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      sessionId,
      data: sessionDatabase[sessionId],
      status: 'success',
      message: '会话数据已保存'
    }));

    log('INFO', `会话数据已保存`, { sessionId });
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: error.message,
      status: 'error'
    }));
    log('ERROR', `处理请求失败: ${error.message}`);
  }
}

// 处理 GET /api/sessions (列出所有会话)
function handleListSessions(res) {
  log('INFO', '列出所有会话');

  const sessions = Object.keys(sessionDatabase).map(id => ({
    sessionId: id,
    dataSize: JSON.stringify(sessionDatabase[id]).length,
    lastUpdated: sessionDatabase[id].lastUpdated
  }));

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    sessions,
    total: sessions.length,
    status: 'success'
  }));
}

// 处理 GET /api/health
function handleHealth(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    service: 'interview-storage-service',
    timestamp: new Date().toISOString(),
    sessionCount: Object.keys(sessionDatabase).length
  }));
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // 处理预检请求
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  log('INFO', `${method} ${pathname}`, { ip: req.socket.remoteAddress });

  // 健康检查端点 (无需认证)
  if (pathname === '/api/sessions' && method === 'GET' && !parsedUrl.query.action) {
    // 检查是否是健康检查请求
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('curl') || !req.headers.authorization) {
      // 这可能是健康检查，返回列表
      handleListSessions(res);
      return;
    }
  }

  if (pathname === '/api/health') {
    handleHealth(res);
    return;
  }

  // 验证API密钥
  if (!validateApiKey(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      status: 'error'
    }));
    return;
  }

  // 路由处理
  if (pathname.startsWith('/api/sessions/')) {
    const sessionId = pathname.replace('/api/sessions/', '').split('?')[0];

    if (method === 'GET') {
      handleGetSession(sessionId, res);
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } else if (pathname === '/api/sessions') {
    if (method === 'POST') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        handleCreateOrUpdateSession(req, res, body);
      });
    } else if (method === 'GET') {
      handleListSessions(res);
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      path: pathname,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/sessions',
        'GET /api/sessions/{sessionId}',
        'POST /api/sessions'
      ]
    }));
  }
});

// 启动服务器
const PORT = process.env.SERVER_PORT || 8081;

server.listen(PORT, '0.0.0.0', () => {
  log('INFO', `✅ 存储服务已启动`, {
    port: PORT,
    address: `http://0.0.0.0:${PORT}`,
    endpoints: [
      'GET /api/health',
      'GET /api/sessions',
      'GET /api/sessions/{sessionId}',
      'POST /api/sessions'
    ],
    apiKey: API_KEY.substring(0, 15) + '...',
    uptime: process.uptime()
  });

  console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║         Interview Storage Service - Node.js                  ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
  console.log(`🚀 服务运行在: http://localhost:${PORT}`);
  console.log(`📍 ngrok隧道: https://phrenologic-preprandial-jesica.ngrok-free.dev`);
  console.log(`🔑 API密钥: ${API_KEY.substring(0, 20)}...`);
  console.log(`\n💾 内存数据库 - 会话总数: ${Object.keys(sessionDatabase).length}`);
  console.log(`\n✅ 准备好处理Workflow2的请求\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  log('INFO', '收到SIGINT信号，正在关闭...');
  server.close(() => {
    log('INFO', '服务已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  log('INFO', '收到SIGTERM信号，正在关闭...');
  server.close(() => {
    log('INFO', '服务已关闭');
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (error) => {
  log('ERROR', `未捕获的异常: ${error.message}`);
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('ERROR', `未处理的Promise拒绝`, { reason });
  console.error(promise);
  process.exit(1);
});
