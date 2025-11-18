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

        // 生成基于消息内容的 mock 响应，实现多轮对话
        const lowerMessage = message.toLowerCase();

        // 更丰富的 Mock 响应库，支持多轮对话上下文
        const generateMockResponse = (msg, userMessage) => {
          // 继续对话的响应（检测是否是第二轮及以后）
          if (msg.includes('继续') || msg.includes('然后') || msg.includes('具体') || msg.includes('例子')) {
            const continuationResponses = [
              `很好的补充问题！基于前面的讨论，我可以进一步补充：实际上，在实际项目中，我们通常会结合使用多个技术来解决更复杂的问题。例如，可以结合使用第三方库如 axios、fetch API 等，配合适当的错误处理和重试机制。`,
              `这是一个非常实际的考虑。在生产环境中，我们需要考虑性能优化、缓存策略、超时控制等多个方面。同时，还要考虑浏览器兼容性和网络稳定性的问题。`,
              `好的，让我详细解释一下。这个技术不仅适用于当前场景，还可以扩展到更复杂的场景中。关键是要理解底层原理，然后根据具体需求进行适配和优化。`,
              `完全同意你的想法。实际上，很多开发者在开始时都会遇到类似的问题。解决的关键在于不断学习和实践，并积极参考社区中的最佳实践和案例。`
            ];
            return continuationResponses[Math.floor(Math.random() * continuationResponses.length)];
          }

          // 关键词匹配的响应
          const keywordResponses = {
            '异步': '异步编程是现代 JavaScript 开发的核心。你可以通过回调函数、Promise、async/await 等多种方式实现异步操作。其中 async/await 是目前最推荐的方式，因为它让异步代码看起来更像同步代码，易于理解和维护。',
            'vue': 'Vue3 相比 Vue2 有了很大的改进。Vue3 的 Composition API 提供了更灵活的逻辑组织方式，特别是在处理复杂组件时优势明显。同时，Vue3 在性能和 TypeScript 支持方面也有显著提升。',
            'react': 'React 的函数式编程思想非常强大。使用 Hooks 可以让你以更函数式的方式组织组件逻辑。关键是要理解 Hooks 的规则，特别是依赖数组的概念，这对于避免性能问题和内存泄漏至关重要。',
            '性能': '性能优化是一个持续的过程。通常我们会从代码层面、网络层面、缓存层面等多个角度来优化。使用浏览器开发者工具的 Performance 标签页可以帮助我们识别性能瓶颈。',
            '安全': '安全是开发的重要考虑。常见的安全问题包括 XSS、CSRF、SQL 注入等。防御这些攻击需要在前后端都采取相应的措施，比如输入验证、HTML 转义、使用安全的 HTTP 头等。',
            '测试': '编写测试是保证代码质量的重要手段。单元测试、集成测试、端到端测试各有其用处。在前端，我们常用 Jest、Vitest、Cypress 等测试框架。',
            '代码': '代码质量直接影响项目的可维护性和扩展性。遵循 SOLID 原则、使用设计模式、编写清晰的代码注释都很重要。同时，使用 ESLint 等工具可以帮助我们自动检查代码质量。',
            '数据': '数据管理是现代应用的核心。根据数据的复杂程度，可以选择不同的解决方案：简单情况下可以用 React Context/Vue 的 reactive，复杂情况下使用 Redux/Pinia 等状态管理库。',
            'api': 'API 设计应该遵循 RESTful 原则。同时，良好的 API 设计需要考虑版本控制、错误处理、文档等多个方面。在前端，我们需要合理处理 API 调用的加载状态、错误情况等。',
            'typescript': 'TypeScript 可以让 JavaScript 开发更加安全和高效。通过类型定义，你可以在开发阶段就发现很多潜在的错误。特别是在大型项目中，TypeScript 的价值更加显著。'
          };

          // 查找匹配的关键词
          for (const [keyword, response] of Object.entries(keywordResponses)) {
            if (msg.includes(keyword)) {
              return response;
            }
          }

          // 默认响应
          const defaultResponses = [
            `关于你的问题"${userMessage}"，这是一个很好的问题。在实际开发中，这个话题涉及多个方面。我的建议是：1. 首先深入理解核心概念 2. 通过实际项目来练习 3. 参考社区的最佳实践和经验分享。希望这能对你有所帮助！`,
            `非常感谢你提出这个问题。这个话题在开发社区中经常被讨论。一个好的解决方案应该考虑到代码的可读性、可维护性和性能。我建议你可以查看一些开源项目的实现方式，从中学习经验。`,
            `这是一个深度的问题。要完全掌握这个知识点，需要从理论到实践都有充分的理解。建议你：第一步了解基本原理，第二步看一些实际案例，第三步自己尝试实现。这样循序渐进会更有效果。`,
            `很好的观察！这个问题触及了开发的很多核心要素。实际上，没有绝对的"最佳实践"，关键是要根据你的具体场景和需求来选择合适的方案。在决策时，可以综合考虑：项目规模、团队能力、维护成本等因素。`
          ];
          return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        };

        let response = generateMockResponse(lowerMessage, message);

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

        // 生成基于消息内容的 mock 响应，实现多轮对话
        const lowerMessage = message.toLowerCase();

        // 更丰富的 Mock 响应库，支持多轮对话上下文
        const generateMockResponse = (msg, userMessage) => {
          // 继续对话的响应（检测是否是第二轮及以后）
          if (msg.includes('继续') || msg.includes('然后') || msg.includes('具体') || msg.includes('例子')) {
            const continuationResponses = [
              `很好的补充问题！基于前面的讨论，我可以进一步补充：实际上，在实际项目中，我们通常会结合使用多个技术来解决更复杂的问题。例如，可以结合使用第三方库如 axios、fetch API 等，配合适当的错误处理和重试机制。`,
              `这是一个非常实际的考虑。在生产环境中，我们需要考虑性能优化、缓存策略、超时控制等多个方面。同时，还要考虑浏览器兼容性和网络稳定性的问题。`,
              `好的，让我详细解释一下。这个技术不仅适用于当前场景，还可以扩展到更复杂的场景中。关键是要理解底层原理，然后根据具体需求进行适配和优化。`,
              `完全同意你的想法。实际上，很多开发者在开始时都会遇到类似的问题。解决的关键在于不断学习和实践，并积极参考社区中的最佳实践和案例。`
            ];
            return continuationResponses[Math.floor(Math.random() * continuationResponses.length)];
          }

          // 关键词匹配的响应
          const keywordResponses = {
            '异步': '异步编程是现代 JavaScript 开发的核心。你可以通过回调函数、Promise、async/await 等多种方式实现异步操作。其中 async/await 是目前最推荐的方式，因为它让异步代码看起来更像同步代码，易于理解和维护。',
            'vue': 'Vue3 相比 Vue2 有了很大的改进。Vue3 的 Composition API 提供了更灵活的逻辑组织方式，特别是在处理复杂组件时优势明显。同时，Vue3 在性能和 TypeScript 支持方面也有显著提升。',
            'react': 'React 的函数式编程思想非常强大。使用 Hooks 可以让你以更函数式的方式组织组件逻辑。关键是要理解 Hooks 的规则，特别是依赖数组的概念，这对于避免性能问题和内存泄漏至关重要。',
            '性能': '性能优化是一个持续的过程。通常我们会从代码层面、网络层面、缓存层面等多个角度来优化。使用浏览器开发者工具的 Performance 标签页可以帮助我们识别性能瓶颈。',
            '安全': '安全是开发的重要考虑。常见的安全问题包括 XSS、CSRF、SQL 注入等。防御这些攻击需要在前后端都采取相应的措施，比如输入验证、HTML 转义、使用安全的 HTTP 头等。',
            '测试': '编写测试是保证代码质量的重要手段。单元测试、集成测试、端到端测试各有其用处。在前端，我们常用 Jest、Vitest、Cypress 等测试框架。',
            '代码': '代码质量直接影响项目的可维护性和扩展性。遵循 SOLID 原则、使用设计模式、编写清晰的代码注释都很重要。同时，使用 ESLint 等工具可以帮助我们自动检查代码质量。',
            '数据': '数据管理是现代应用的核心。根据数据的复杂程度，可以选择不同的解决方案：简单情况下可以用 React Context/Vue 的 reactive，复杂情况下使用 Redux/Pinia 等状态管理库。',
            'api': 'API 设计应该遵循 RESTful 原则。同时，良好的 API 设计需要考虑版本控制、错误处理、文档等多个方面。在前端，我们需要合理处理 API 调用的加载状态、错误情况等。',
            'typescript': 'TypeScript 可以让 JavaScript 开发更加安全和高效。通过类型定义，你可以在开发阶段就发现很多潜在的错误。特别是在大型项目中，TypeScript 的价值更加显著。'
          };

          // 查找匹配的关键词
          for (const [keyword, response] of Object.entries(keywordResponses)) {
            if (msg.includes(keyword)) {
              return response;
            }
          }

          // 默认响应
          const defaultResponses = [
            `关于你的问题"${userMessage}"，这是一个很好的问题。在实际开发中，这个话题涉及多个方面。我的建议是：1. 首先深入理解核心概念 2. 通过实际项目来练习 3. 参考社区的最佳实践和经验分享。希望这能对你有所帮助！`,
            `非常感谢你提出这个问题。这个话题在开发社区中经常被讨论。一个好的解决方案应该考虑到代码的可读性、可维护性和性能。我建议你可以查看一些开源项目的实现方式，从中学习经验。`,
            `这是一个深度的问题。要完全掌握这个知识点，需要从理论到实践都有充分的理解。建议你：第一步了解基本原理，第二步看一些实际案例，第三步自己尝试实现。这样循序渐进会更有效果。`,
            `很好的观察！这个问题触及了开发的很多核心要素。实际上，没有绝对的"最佳实践"，关键是要根据你的具体场景和需求来选择合适的方案。在决策时，可以综合考虑：项目规模、团队能力、维护成本等因素。`
          ];
          return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        };

        let response = generateMockResponse(lowerMessage, message);

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
