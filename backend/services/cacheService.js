/**
 * Redis 缓存服务层
 * 路径: backend/services/cacheService.js
 */

const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    // Redis 客户端配置
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 24 * 60 * 60; // 24 小时默认过期时间

    // 缓存键前缀
    this.prefixes = {
      summary: 'cache:article:summary:',
      keypoints: 'cache:article:keypoints:',
      chat: 'cache:chat:',
    };
  }

  /**
   * 初始化 Redis 连接
   */
  async init() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('[Cache] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 50, 500);
          },
        },
      });

      // 错误处理
      this.client.on('error', (err) => {
        logger.error('[Cache] Redis error:', err);
      });

      // 连接事件
      this.client.on('connect', () => {
        logger.info('[Cache] Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('[Cache] Redis disconnected');
        this.isConnected = false;
      });

      // 连接到 Redis
      await this.client.connect();
    } catch (error) {
      logger.warn(`[Cache] Failed to connect to Redis: ${error.message}`);
      logger.info('[Cache] Cache will be disabled');
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {Promise<any>} 缓存值（如果存在）
   */
  async get(key) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`[Cache] Hit: ${key}`);
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error(`[Cache] Get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   * @param {number} ttl 过期时间（秒）
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, value, ttl = null) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const expiresIn = ttl || this.defaultTTL;
      await this.client.setEx(key, expiresIn, JSON.stringify(value));
      logger.debug(`[Cache] Set: ${key} (TTL: ${expiresIn}s)`);
      return true;
    } catch (error) {
      logger.error(`[Cache] Set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   * @returns {Promise<boolean>} 是否成功
   */
  async delete(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug(`[Cache] Delete: ${key}`);
      return true;
    } catch (error) {
      logger.error(`[Cache] Delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<boolean>} 是否成功
   */
  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.info('[Cache] Flushed all cache');
      return true;
    } catch (error) {
      logger.error('[Cache] Flush error:', error);
      return false;
    }
  }

  /**
   * 获取摘要缓存
   * @param {string} postId 文章 ID
   * @returns {Promise<string|null>} 摘要
   */
  async getSummary(postId) {
    const key = this.prefixes.summary + postId;
    return this.get(key);
  }

  /**
   * 设置摘要缓存
   * @param {string} postId 文章 ID
   * @param {string} summary 摘要内容
   * @returns {Promise<boolean>} 是否成功
   */
  async setSummary(postId, summary) {
    const key = this.prefixes.summary + postId;
    return this.set(key, summary, 24 * 60 * 60); // 24 小时
  }

  /**
   * 获取关键点缓存
   * @param {string} postId 文章 ID
   * @returns {Promise<Array|null>} 关键点列表
   */
  async getKeypoints(postId) {
    const key = this.prefixes.keypoints + postId;
    return this.get(key);
  }

  /**
   * 设置关键点缓存
   * @param {string} postId 文章 ID
   * @param {Array} keypoints 关键点列表
   * @returns {Promise<boolean>} 是否成功
   */
  async setKeypoints(postId, keypoints) {
    const key = this.prefixes.keypoints + postId;
    return this.set(key, keypoints, 24 * 60 * 60); // 24 小时
  }

  /**
   * 获取对话缓存
   * @param {string} conversationId 对话 ID
   * @returns {Promise<Array|null>} 对话消息列表
   */
  async getChatHistory(conversationId) {
    const key = this.prefixes.chat + conversationId;
    return this.get(key);
  }

  /**
   * 设置对话缓存
   * @param {string} conversationId 对话 ID
   * @param {Array} messages 对话消息列表
   * @returns {Promise<boolean>} 是否成功
   */
  async setChatHistory(conversationId, messages) {
    const key = this.prefixes.chat + conversationId;
    return this.set(key, messages, 7 * 24 * 60 * 60); // 7 天
  }

  /**
   * 检查缓存是否存在
   * @param {string} key 缓存键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`[Cache] Exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 获取缓存 TTL
   * @param {string} key 缓存键
   * @returns {Promise<number>} 剩余 TTL（秒），-1 无过期时间，-2 不存在
   */
  async getTTL(key) {
    if (!this.isConnected) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`[Cache] TTL error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * 关闭 Redis 连接
   */
  async close() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('[Cache] Redis connection closed');
    }
  }
}

module.exports = new CacheService();
