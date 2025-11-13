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
  const { message, articleContent, conversationId } = req.query;
  const userId = req.user?.id || 'anonymous';

  if (!message || !articleContent) {
    return res.status(400).json({
      error: 'Message and articleContent are required',
    });
  }

  logger.info(`[AI/Chat] Stream request from user ${userId}`, { messageLength: message.length });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 异步处理流式响应
  (async () => {
    try {
      let finalConversationId = conversationId;
      let hasStarted = false;

      if (!difyService.isConfigured()) {
        logger.warn('[AI/Chat] Dify service not configured, using mock data');
        // 使用模拟响应
        const mockResponse = [
          '这是 AI 对',
          '你提问的',
          '一个回复。',
          '它会逐字',
          '显示在前',
          '端。',
        ];

        for (const chunk of mockResponse) {
          res.write(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
          );
          hasStarted = true;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        finalConversationId = `conv-mock-${Date.now()}`;
        res.write(
          `data: ${JSON.stringify({ type: 'end', conversationId: finalConversationId })}\n\n`
        );
        res.write('event: done\n');
        res.write(
          `data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`
        );
        res.end();
        return;
      }

      // 使用真实的 Dify 服务进行流式对话
      for await (const chunk of difyService.streamChat(message, articleContent, conversationId, userId)) {
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
  const { message, articleContent, conversationId } = req.body;
  const userId = req.user?.id || 'anonymous';

  if (!message || !articleContent) {
    return res.status(400).json({
      error: 'Message and articleContent are required',
    });
  }

  logger.info(`[AI/Chat] Stream request from user ${userId}`, { messageLength: message.length });

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 异步处理流式响应
  (async () => {
    try {
      let finalConversationId = conversationId;
      let hasStarted = false;

      if (!difyService.isConfigured()) {
        logger.warn('[AI/Chat] Dify service not configured, using mock data');
        // 使用模拟响应
        const mockResponse = [
          '这是 AI 对',
          '你提问的',
          '一个回复。',
          '它会逐字',
          '显示在前',
          '端。',
        ];

        for (const chunk of mockResponse) {
          res.write(
            `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
          );
          hasStarted = true;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        finalConversationId = `conv-mock-${Date.now()}`;
        res.write(
          `data: ${JSON.stringify({ type: 'end', conversationId: finalConversationId })}\n\n`
        );
        res.write('event: done\n');
        res.write(
          `data: ${JSON.stringify({ conversationId: finalConversationId })}\n\n`
        );
        res.end();
        return;
      }

      // 使用真实的 Dify 服务进行流式对话
      for await (const chunk of difyService.streamChat(message, articleContent, conversationId, userId)) {
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
