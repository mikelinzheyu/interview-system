/**
 * 认证中间件
 * 验证用户 token 并从 localStorage 中获取用户信息
 */

const logger = require('../utils/logger');

/**
 * 简单的认证中间件
 * 从 Authorization header 或查询参数中提取 token
 * 在开发环境中，允许匿名访问（设置 req.user.id = 'anonymous'）
 */
const auth = (req, res, next) => {
  try {
    // 从 header 获取 token
    let token = req.headers.authorization?.split(' ')[1];

    // 如果 header 中没有，尝试从查询参数获取
    if (!token) {
      token = req.query.token || req.body?.token;
    }

    // 在开发环境中，允许没有 token 的请求
    if (process.env.NODE_ENV === 'development' || process.env.VITE_APP_ENV === 'development') {
      if (!token) {
        // 开发环境中允许匿名访问
        req.user = {
          id: 'anonymous',
          email: 'dev@example.com',
          name: 'Dev User',
          token: 'dev-token',
        };
        logger.debug('[Auth] Development mode: allowing anonymous access');
        return next();
      }
    }

    // 生产环境中验证 token
    if (token) {
      // 简单的 token 验证（实际应用中应使用 JWT 验证）
      try {
        // 这里可以添加真正的 JWT 验证逻辑
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;

        // 暂时：简单的 token 验证
        req.user = {
          id: `user-${Math.random().toString(36).substr(2, 9)}`,
          email: 'user@example.com',
          name: 'User',
          token: token,
        };

        logger.debug('[Auth] Token verified successfully');
        return next();
      } catch (error) {
        logger.warn('[Auth] Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // 没有 token 且不是开发环境
    logger.warn('[Auth] No token provided and not in development mode');
    return res.status(401).json({ error: 'No token provided' });
  } catch (error) {
    logger.error('[Auth] Middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * 可选认证中间件
 * 如果有 token 则验证，没有 token 也允许继续（但 req.user 为 null）
 */
const optionalAuth = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      token = req.query.token || req.body?.token;
    }

    if (token) {
      try {
        req.user = {
          id: `user-${Math.random().toString(36).substr(2, 9)}`,
          email: 'user@example.com',
          name: 'User',
          token: token,
        };
        logger.debug('[OptionalAuth] Token verified');
      } catch (error) {
        logger.warn('[OptionalAuth] Token verification failed, continuing without auth');
        req.user = null;
      }
    } else {
      // 允许匿名访问
      if (process.env.NODE_ENV === 'development' || process.env.VITE_APP_ENV === 'development') {
        req.user = {
          id: 'anonymous',
          email: 'dev@example.com',
          name: 'Dev User',
        };
      } else {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    logger.error('[OptionalAuth] Middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  auth,
  optionalAuth,
};
