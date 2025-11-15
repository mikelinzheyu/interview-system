/**
 * AI 中转路由 - 前端通过这些接口与 Dify 通信
 * 路径: backend/routes/ai.js
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const cacheService = require('../services/cacheService');
const difyService = require('../services/difyService');
const chatWorkflowService = require('../services/chatWorkflowService');
const logger = require('../utils/logger');

/**
 * 生成摘要
 * POST /api/ai/summary
 * Body: { content: string, postId: string }
 */
router.post('/summary', auth, rateLimit(10, 60), async (req, res) => {
  try {
    const { content, postId } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    logger.info(`[AI/Summary] Request from user ${userId}`, { postId, contentLength: content.length });

    // 检查缓存
    const cached = await cacheService.getSummary(postId);
    if (cached) {
      logger.info(`[AI/Summary] Returning cached result for postId ${postId}`);
      return res.json({
        code: 200,
        message: 'OK',
        data: {
          summary: cached,
          fromCache: true,
        },
      });
    }

    // 调用 Dify 服务生成摘要
    if (!difyService.isConfigured()) {
      logger.warn('[AI/Summary] Dify service not configured, using mock data');
      const summary = `这是一篇关于"${content.substring(0, 30)}..."的文章摘要。`;
      await cacheService.setSummary(postId, summary);
      return res.json({
        code: 200,
        message: 'OK',
        data: {
          summary,
          fromCache: false,
          mock: true,
        },
      });
    }

    const summary = await difyService.generateSummary(content, userId);

    // 保存到缓存
    await cacheService.setSummary(postId, summary);

    logger.info(`[AI/Summary] Generated summary successfully`, { postId, summaryLength: summary.length });

    res.json({
      code: 200,
      message: 'OK',
      data: {
        summary,
        fromCache: false,
      },
    });
  } catch (error) {
    logger.error('[AI/Summary] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate summary',
    });
  }
});

/**
 * 提取关键点
 * POST /api/ai/keypoints
 * Body: { content: string, postId: string }
 */
router.post('/keypoints', auth, rateLimit(10, 60), async (req, res) => {
  try {
    const { content, postId } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    logger.info(`[AI/Keypoints] Request from user ${userId}`, { postId, contentLength: content.length });

    // 检查缓存
    const cached = await cacheService.getKeypoints(postId);
    if (cached) {
      logger.info(`[AI/Keypoints] Returning cached result for postId ${postId}`);
      return res.json({
        code: 200,
        message: 'OK',
        data: {
          keypoints: cached,
          fromCache: true,
        },
      });
    }

    // 调用 Dify 服务提取关键点
    if (!difyService.isConfigured()) {
      logger.warn('[AI/Keypoints] Dify service not configured, using mock data');
      const keypoints = [
        '关键点 1: 这是内容的第一个要点',
        '关键点 2: 这是内容的第二个要点',
        '关键点 3: 这是内容的第三个要点',
      ];
      await cacheService.setKeypoints(postId, keypoints);
      return res.json({
        code: 200,
        message: 'OK',
        data: {
          keypoints,
          fromCache: false,
          mock: true,
        },
      });
    }

    const keypoints = await difyService.extractKeypoints(content, userId);

    // 保存到缓存
    await cacheService.setKeypoints(postId, keypoints);

    logger.info(`[AI/Keypoints] Extracted keypoints successfully`, { postId });

    res.json({
      code: 200,
      message: 'OK',
      data: {
        keypoints,
        fromCache: false,
      },
    });
  } catch (error) {
    logger.error('[AI/Keypoints] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to extract keypoints',
    });
  }
});

/**
 * AI 问答（流式）
 * GET /api/ai/chat/stream?message=...&articleContent=...&conversationId=...
 * 使用 Server-Sent Events (SSE) 推送流式数据（支持 EventSource）
 */
router.get('/chat/stream', auth, rateLimit(30, 60), (req, res) => {
  const { message, articleContent, conversationId, postId } = req.query;
  const userId = req.user?.id || 'anonymous';

  if (!message || !articleContent) {
    return res.status(400).json({
      error: 'Message and articleContent are required',
    });
  }

  logger.info(`[AI/Chat] Stream request from user ${userId}`, { messageLength: message.length, conversationId });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 异步处理流式响应
  (async () => {
    try {
      let finalConversationId = conversationId || `conv-${postId}-${userId}-${Date.now()}`;
      let hasStarted = false;

      // 调试：记录配置状态
      const isChatConfigured = chatWorkflowService.checkConfiguration();
      logger.info(`[AI/Chat] Configuration check: ${isChatConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);

      if (!isChatConfigured) {
        logger.warn('[AI/Chat] Chat API not configured, using mock data');

        // 生成基于消息内容的 mock 响应，实现多轮对话的错觉
        const mockResponses = {
          'java': '在 Vue3 中处理异步请求，你可以使用 async/await 结合 try/catch。这样可以让代码更简洁易读。如果需要错误处理，catch 块会捕获所有异常。',
          'async': '你提到的异步问题确实常见。建议使用 Promise.all() 处理多个异步操作，或者使用 async/await 的并发模式来提高效率。',
          'vue': 'Vue3 的 Composition API 在处理异步时很强大。你可以在 setup() 中使用 async 函数，然后返回响应式数据。',
          'default': `关于你的问题"${message}"，这是一个很好的问题。根据文章内容和最佳实践，我的建议是：1. 深入学习相关概念 2. 通过项目实践来加深理解 3. 查阅官方文档获取最新信息。希望这能有所帮助！`
        };

        // 根据关键词选择响应
        let response = mockResponses['default'];
        const lowerMessage = message.toLowerCase();
        for (const [key, value] of Object.entries(mockResponses)) {
          if (key !== 'default' && lowerMessage.includes(key)) {
            response = value;
            break;
          }
        }

        // 分块发送响应，实现打字机效果
        const chunkSize = 15;
        for (let i = 0; i < response.length; i += chunkSize) {
          const chunk = response.substring(i, Math.min(i + chunkSize, response.length));
          res.write(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
          );
          hasStarted = true;
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        res.write(
          `data: ${JSON.stringify({ type: 'end', conversationId: finalConversationId })}\n\n`
        );
        res.write('event: done\n');
        res.write(
          `data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`
        );

        // 保存对话到缓存（支持对话历史）
        const mockMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        const mockAssistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };

        // 获取或初始化对话历史
        const conversationKey = `chat:${finalConversationId}`;
        (async () => {
          try {
            await cacheService.appendChatMessage(conversationKey, mockMessage);
            await cacheService.appendChatMessage(conversationKey, mockAssistantMessage);
            logger.info(`[AI/Chat] Mock conversation saved: ${finalConversationId}`);
          } catch (err) {
            logger.warn(`[AI/Chat] Failed to save mock conversation: ${err.message}`);
          }
        })();

        res.end();
        return;
      }

      // 使用真实的 Dify Chat API 进行流式对话
      const userId_generated = `post-${req.query.postId || 'unknown'}-user-${userId}`;
      for await (const chunk of chatWorkflowService.sendMessage(message, userId_generated, conversationId, articleContent)) {
        if (chunk.type === 'chunk') {
          res.write(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`
          );
          hasStarted = true;
        } else if (chunk.type === 'end') {
          finalConversationId = chunk.conversationId;
          res.write(
            `data: ${JSON.stringify({ type: 'end', conversationId: finalConversationId })}\n\n`
          );
        }
      }

      logger.info(`[AI/Chat] Stream completed for user ${userId}`, { conversationId: finalConversationId });

      if (hasStarted) {
        res.write('event: done\n');
        res.write(
          `data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`
        );
      }

      res.end();
    } catch (error) {
      logger.error('[AI/Chat] Stream error:', error);
      res.write('event: error\n');
      res.write(
        `data: ${JSON.stringify({ error: error.message })}\n\n`
      );
      res.end();
    }
  })();
});

/**
 * AI 问答（流式）
 * POST /api/ai/chat/stream
 * Body: { message: string, articleContent: string, conversationId?: string }
 * 使用 Server-Sent Events (SSE) 推送流式数据
 */
router.post('/chat/stream', auth, rateLimit(30, 60), (req, res) => {
  const { message, articleContent, conversationId, postId } = req.body;
  const userId = req.user?.id || 'anonymous';

  if (!message || !articleContent) {
    return res.status(400).json({
      error: 'Message and articleContent are required',
    });
  }

  logger.info(`[AI/Chat] Stream request from user ${userId}`, { messageLength: message.length, conversationId });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 异步处理流式响应
  (async () => {
    try {
      let finalConversationId = conversationId || `conv-${postId}-${userId}-${Date.now()}`;
      let hasStarted = false;

      // 调试：记录配置状态
      const isChatConfigured = chatWorkflowService.checkConfiguration();
      logger.info(`[AI/Chat] Configuration check: ${isChatConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);

      if (!isChatConfigured) {
        logger.warn('[AI/Chat] Chat API not configured, using mock data');

        // 生成基于消息内容的 mock 响应，实现多轮对话的错觉
        const mockResponses = {
          'java': '在 Vue3 中处理异步请求，你可以使用 async/await 结合 try/catch。这样可以让代码更简洁易读。如果需要错误处理，catch 块会捕获所有异常。',
          'async': '你提到的异步问题确实常见。建议使用 Promise.all() 处理多个异步操作，或者使用 async/await 的并发模式来提高效率。',
          'vue': 'Vue3 的 Composition API 在处理异步时很强大。你可以在 setup() 中使用 async 函数，然后返回响应式数据。',
          'default': `关于你的问题"${message}"，这是一个很好的问题。根据文章内容和最佳实践，我的建议是：1. 深入学习相关概念 2. 通过项目实践来加深理解 3. 查阅官方文档获取最新信息。希望这能有所帮助！`
        };

        // 根据关键词选择响应
        let response = mockResponses['default'];
        const lowerMessage = message.toLowerCase();
        for (const [key, value] of Object.entries(mockResponses)) {
          if (key !== 'default' && lowerMessage.includes(key)) {
            response = value;
            break;
          }
        }

        // 分块发送响应，实现打字机效果
        const chunkSize = 15;
        for (let i = 0; i < response.length; i += chunkSize) {
          const chunk = response.substring(i, Math.min(i + chunkSize, response.length));
          res.write(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
          );
          hasStarted = true;
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        res.write(
          `data: ${JSON.stringify({ type: 'end', conversationId: finalConversationId })}\n\n`
        );
        res.write('event: done\n');
        res.write(
          `data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`
        );

        // 保存对话到缓存（支持对话历史）
        const mockMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        const mockAssistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };

        // 获取或初始化对话历史
        const conversationKey = `chat:${finalConversationId}`;
        (async () => {
          try {
            await cacheService.appendChatMessage(conversationKey, mockMessage);
            await cacheService.appendChatMessage(conversationKey, mockAssistantMessage);
            logger.info(`[AI/Chat] Mock conversation saved: ${finalConversationId}`);
          } catch (err) {
            logger.warn(`[AI/Chat] Failed to save mock conversation: ${err.message}`);
          }
        })();

        res.end();
        return;
      }

      // 使用真实的 Dify Chat API 进行流式对话
      const userId_generated = `post-${req.body.postId || 'unknown'}-user-${userId}`;
      for await (const chunk of chatWorkflowService.sendMessage(message, userId_generated, conversationId, articleContent)) {
        if (chunk.type === 'chunk') {
          res.write(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk.content })}\n\n`
          );
          hasStarted = true;
        } else if (chunk.type === 'end') {
          finalConversationId = chunk.conversationId;
          res.write(
            `data: ${JSON.stringify({ type: 'end', conversationId: finalConversationId })}\n\n`
          );
        }
      }

      logger.info(`[AI/Chat] Stream completed for user ${userId}`, { conversationId: finalConversationId });

      if (hasStarted) {
        res.write('event: done\n');
        res.write(
          `data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`
        );
      }

      res.end();
    } catch (error) {
      logger.error('[AI/Chat] Stream error:', error);
      res.write('event: error\n');
      res.write(
        `data: ${JSON.stringify({ error: error.message })}\n\n`
      );
      res.end();
    }
  })();
});

/**
 * 获取对话历史（可选）
 * GET /api/ai/chat/:conversationId
 */
router.get('/chat/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // 从缓存中获取对话历史
    const messages = await cacheService.getChatHistory(conversationId);

    res.json({
      conversationId,
      messages: messages || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
