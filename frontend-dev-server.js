/**
 * Frontend SPA Dev Server
 * Express server with SPA routing and API proxy
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = 5174;
const FRONTEND_DIR = path.resolve(__dirname, 'frontend');
const INDEX_PATH = path.join(FRONTEND_DIR, 'index.html');

console.log('[Frontend Dev Server] 启动配置:');
console.log(`  📁 前端目录: ${FRONTEND_DIR}`);
console.log(`  🔌 端口: ${PORT}`);
console.log(`  📄 Index: ${INDEX_PATH}\n`);

// ============================================
// 第1层: API代理
// ============================================
app.use('/api', (req, res) => {
  const method = req.method;
  const url = req.url;

  console.log(`[API] ${method} ${url}`);

  const proxyReq = http.request({
    hostname: 'localhost',
    port: 3001,
    path: url,
    method: method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error(`[API ERROR] ${error.message}`);
    res.status(502).json({ error: 'Backend unavailable' });
  });

  req.pipe(proxyReq);
});

// ============================================
// 第2层: 静态文件
// ============================================
app.use((req, res, next) => {
  const ext = path.extname(req.path);

  // 如果有文件扩展名，尝试服务静态文件
  if (ext) {
    const filePath = path.join(FRONTEND_DIR, req.path);

    // 安全检查
    if (!path.resolve(filePath).startsWith(FRONTEND_DIR)) {
      return res.status(403).end();
    }

    if (fs.existsSync(filePath)) {
      console.log(`[STATIC] ${req.path}`);
      return res.sendFile(filePath);
    }
  }

  next();
});

// ============================================
// 第3层: SPA路由fallback
// ============================================
app.use((req, res) => {
  // 只处理GET请求
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  console.log(`[SPA] ${req.method} ${req.path} -> index.html`);

  try {
    const html = fs.readFileSync(INDEX_PATH, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// 启动服务器
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 前端开发服务器已启动!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`\n✅ 已启用功能:`);
  console.log(`  1. 静态文件服务`);
  console.log(`  2. API代理 (/api -> http://localhost:3001)`);
  console.log(`  3. SPA路由fallback\n`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
  } else {
    console.error(`❌ 错误: ${error.message}`);
  }
  process.exit(1);
});
