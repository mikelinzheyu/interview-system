/**
 * 速率限制中间件
 * 防止 API 滥用
 */

const logger = require('../utils/logger');

// 存储用户请求记录
const requestRecords = new Map();

/**
 * 速率限制中间件工厂函数
 * @param {number} limit - 限制次数（如 10 表示 10 次请求）
 * @param {number} windowSeconds - 时间窗口（秒，如 60 表示 60 秒内）
 * @returns {Function} 中间件函数
 */
const rateLimit = (limit = 10, windowSeconds = 60) => {
  return (req, res, next) => {
    try {
      // 使用用户 ID 或 IP 地址作为标识
      const userId = req.user?.id || req.ip || req.socket.remoteAddress;
      const now = Date.now();
      const windowMs = windowSeconds * 1000;

      // 初始化或获取用户的请求记录
      if (!requestRecords.has(userId)) {
        requestRecords.set(userId, []);
      }

      const records = requestRecords.get(userId);

      // 清除过期的请求记录
      const activeRecords = records.filter((timestamp) => now - timestamp < windowMs);

      // 检查是否超过限制
      if (activeRecords.length >= limit) {
        logger.warn(`[RateLimit] User ${userId} exceeded rate limit (${limit}/${windowSeconds}s)`);
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded: ${limit} requests per ${windowSeconds} seconds`,
          retryAfter: windowSeconds,
        });
      }

      // 添加当前请求时间戳
      activeRecords.push(now);
      requestRecords.set(userId, activeRecords);

      logger.debug(`[RateLimit] User ${userId}: ${activeRecords.length}/${limit} requests`);

      // 继续处理请求
      next();
    } catch (error) {
      logger.error('[RateLimit] Middleware error:', error);
      // 错误情况下允许请求通过
      next();
    }
  };
};

/**
 * 清理过期的请求记录
 * 定期清理以防止内存泄漏
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 分钟

  for (const [userId, records] of requestRecords.entries()) {
    const activeRecords = records.filter((timestamp) => now - timestamp < maxAge);
    if (activeRecords.length === 0) {
      requestRecords.delete(userId);
    } else {
      requestRecords.set(userId, activeRecords);
    }
  }

  logger.debug(`[RateLimit] Cleanup: ${requestRecords.size} users tracked`);
}, 5 * 60 * 1000); // 每 5 分钟清理一次

module.exports = {
  rateLimit,
};
