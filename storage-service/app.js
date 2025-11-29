#!/usr/bin/env node

/**
 * 存储服务 - Node.js 实现
 * 替代 Java 版本，快速解决 /api/sessions 404 问题
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// 内存存储（Redis 可选）
const memoryStorage = {};

// 可选的 Redis 客户端
let redisClient = null;
try {
  const redis = require('redis');
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    database: process.env.REDIS_DB || 0,
    retry_strategy: () => null
  });
} catch (e) {
  // Redis 模块不可用，仅使用内存存储
}

const PORT = process.env.SERVER_PORT || 8081;
const API_KEY = process.env.SESSION_STORAGE_API_KEY || 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// 记录
function log(level, msg) {
  console.log(`[${new Date().toISOString()}] [${level}] ${msg}`);
}

/**
 * 验证 API 密钥
 */
function validateApiKey(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;

  // 支持 Bearer token 和直接 key 两种方式
  const token = auth.replace('Bearer ', '').trim();
  return token === API_KEY;
}

/**
 * 从 Redis 获取数据（带备份）
 */
async function getFromRedis(key) {
  return new Promise((resolve) => {
    if (!redisClient) {
      // Redis 不可用，直接从内存读取
      return resolve(memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null);
    }

    redisClient.get(key, (err, data) => {
      if (err || !data) {
        // 从内存备份读取
        return resolve(memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null);
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve(null);
      }
    });
  });
}

/**
 * 保存到 Redis（带备份）
 */
async function saveToRedis(key, value, expiresIn = 86400) {
  const jsonValue = JSON.stringify(value);

  // 保存到内存备份
  memoryStorage[key] = jsonValue;

  // 尝试保存到 Redis
  if (redisClient) {
    redisClient.setex(key, expiresIn, jsonValue, (err) => {
      if (err) {
        log('WARN', `Redis save failed for ${key}, using memory storage`);
      }
    });
  }
}

/**
 * 处理 POST /api/sessions - 创建/更新会话
 */
async function handlePostSession(req, res, sessionId) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const sessionData = JSON.parse(body);

      // 支持 sessionId 和 session_id 两种命名
      const id = sessionData.sessionId || sessionData.session_id || sessionId || `session_${Date.now()}`;

      // 标准化问题字段，支持多种格式和字符串解析
      let questions = sessionData.questions || sessionData.qaData || sessionData.qa_data ||
                     sessionData.questionList || sessionData.question_list || [];

      log('DEBUG', `Questions received - Type: ${typeof questions}, Value: ${typeof questions === 'string' ? questions.substring(0, 100) : 'array'}`);

      // 如果问题是 JSON 字符串（来自工作流1的输出），需要解析
      if (typeof questions === 'string') {
        try {
          log('DEBUG', `Attempting to parse questions string: ${questions.substring(0, 100)}`);
          questions = JSON.parse(questions);
          log('INFO', `Parsed questions from string format - found ${questions.length} questions`);
        } catch (e) {
          log('WARN', `Failed to parse questions string: ${e.message}`);
          questions = [];
        }
      } else if (Array.isArray(questions)) {
        log('DEBUG', `Questions already array with ${questions.length} items`);
      } else {
        log('DEBUG', `Questions is unexpected type: ${typeof questions}`);
      }

      // 支持 job_title 和 jobTitle 两种命名
      const jobTitle = sessionData.jobTitle || sessionData.job_title || 'Unknown';

      const session = {
        sessionId: id,
        jobTitle: jobTitle,
        status: sessionData.status || 'active',
        questions: Array.isArray(questions) ? questions : [],
        createdAt: sessionData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: sessionData.metadata || {}
      };

      // 保存到存储
      await saveToRedis(`session:${id}`, session, 86400); // 24小时过期

      log('INFO', `Session created/updated: ${id} with ${session.questions.length} questions`);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 201,
        message: 'Session created successfully',
        data: session,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      log('ERROR', `Failed to create session: ${error.message}`);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 400,
        message: 'Invalid session data',
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

/**
 * 处理 GET /api/sessions/{sessionId} - 获取会话
 */
async function handleGetSession(req, res, sessionId) {
  try {
    const session = await getFromRedis(`session:${sessionId}`);

    if (!session) {
      log('WARN', `Session not found: ${sessionId}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 404,
        message: 'Session not found',
        data: null,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    log('INFO', `Session retrieved: ${sessionId}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 200,
      message: 'Session retrieved successfully',
      data: session,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    log('ERROR', `Failed to retrieve session: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * 处理 DELETE /api/sessions/{sessionId} - 删除会话
 */
async function handleDeleteSession(req, res, sessionId) {
  try {
    // 从内存删除
    delete memoryStorage[`session:${sessionId}`];

    // 从 Redis 删除（如果可用）
    if (redisClient) {
      redisClient.del(`session:${sessionId}`, (err) => {
        if (err) {
          log('WARN', `Redis delete failed for ${sessionId}, but memory storage cleared`);
        }
      });
    }

    log('INFO', `Session deleted: ${sessionId}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 200,
      message: 'Session deleted successfully',
      data: null,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    log('ERROR', `Failed to delete session: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * 主服务器
 */
const server = http.createServer(async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 健康检查
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 验证 API 密钥
  if (!validateApiKey(req)) {
    log('WARN', `Unauthorized request: ${req.method} ${req.url}`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 401,
      message: 'Unauthorized - Invalid or missing API key',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 解析 URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 路由处理
  try {
    // /api/sessions - 列表或创建
    if (pathname === '/api/sessions' || pathname === '/api/sessions/') {
      if (req.method === 'POST') {
        await handlePostSession(req, res);
      } else if (req.method === 'GET') {
        // 列出所有会话（演示用）
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          code: 200,
          message: 'Sessions listed',
          data: [],
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          code: 405,
          message: 'Method not allowed',
          timestamp: new Date().toISOString()
        }));
      }
      return;
    }

    // /api/sessions/{sessionId} - 获取/删除
    const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];

      if (req.method === 'GET') {
        await handleGetSession(req, res, sessionId);
      } else if (req.method === 'DELETE') {
        await handleDeleteSession(req, res, sessionId);
      } else if (req.method === 'POST') {
        await handlePostSession(req, res, sessionId);
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          code: 405,
          message: 'Method not allowed',
          timestamp: new Date().toISOString()
        }));
      }
      return;
    }

    // 404 - 端点不存在
    log('WARN', `404 Not Found: ${req.method} ${pathname}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 404,
      message: 'API endpoint not found',
      data: null,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    log('ERROR', `Internal error: ${error.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      code: 500,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
});

// 启动服务器
server.listen(PORT, () => {
  log('INFO', `Storage Service started on http://localhost:${PORT}`);
  log('INFO', `API Base Path: /api/sessions`);
  log('INFO', `Health Check: /health`);
  log('INFO', `API Key: ${API_KEY}`);
  log('INFO', `Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM received, shutting down gracefully');
  server.close(() => {
    if (redisClient) {
      redisClient.quit();
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('INFO', 'SIGINT received, shutting down gracefully');
  server.close(() => {
    if (redisClient) {
      redisClient.quit();
    }
    process.exit(0);
  });
});

// 错误处理
if (redisClient) {
  redisClient.on('error', (err) => {
    log('ERROR', `Redis connection error: ${err.message}`);
    log('WARN', 'Falling back to memory storage');
  });

  redisClient.on('connect', () => {
    log('INFO', 'Connected to Redis');
  });
}
