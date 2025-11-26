/**
 * Dify 服务层 - 统一处理 Dify API 调用
 * 路径: backend/services/difyService.js
 *
 * 使用 Dify 工作流 API（Workflow）而不是应用 API
 */

const axios = require('axios');
const logger = require('../utils/logger');

class DifyService {
  constructor() {
    // 从环境变量加载配置，生产环境必须配置
    this.apiKey = process.env.DIFY_WORKFLOW_API_KEY
    this.baseURL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1'

    // 工作流 ID（单一工作流处理所有任务）
    this.workflowId = process.env.DIFY_WORKFLOW_ID

    // 创建 axios 客户端
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // 验证必要的配置
    if (!this.apiKey || !this.workflowId) {
      logger.warn('[Dify] Workflow API Key or Workflow ID not configured. AI features (summary, keypoints) will be disabled.');
    }

    logger.info('[Dify Workflow] Service initialized', {
      baseURL: this.baseURL,
      workflowId: this.workflowId ? this.workflowId.substring(0, 10) + '...' : 'NOT SET',
      configured: !!this.apiKey && !!this.workflowId,
    });
  }

  /**
   * 检查 Dify 是否已配置
   */
  isConfigured() {
    return !!this.apiKey && !!this.workflowId;
  }

  /**
   * 调用工作流
   * @param {string} taskType - 任务类型: summary, key_points, seo_keywords
   * @param {string} articleContent - 文章内容
   * @returns {Promise<string>} - 工作流返回的结果
   */
  async callWorkflow(taskType, articleContent) {
    if (!this.isConfigured()) {
      throw new Error('Dify API is not configured');
    }

    try {
      logger.debug(`[Dify] Calling workflow`, { taskType, contentLength: articleContent.length });

      const response = await this.client.post('/workflows/run', {
        workflow_id: this.workflowId,
        inputs: {
          article_content: articleContent,
          task_type: taskType,
        },
        response_mode: 'blocking', // 阻塞模式，等待完整响应
      });

      // 提取工作流输出
      const result = response.data?.data?.outputs?.result;

      if (!result) {
        logger.warn(`[Dify] Empty result from workflow`, {
          taskType,
          responseData: response.data,
        });
        throw new Error('Workflow returned empty result');
      }

      logger.info(`[Dify] Workflow executed successfully`, {
        taskType,
        resultLength: result.length,
      });

      return result;
    } catch (error) {
      logger.error(`[Dify] Workflow call failed`, {
        taskType,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      throw new Error(`Dify workflow failed: ${error.message}`);
    }
  }

  /**
   * 生成文章摘要
   * @param {string} content - 文章完整内容
   * @param {string} userId - 用户 ID（用于追踪和分析）
   * @returns {Promise<string>} 摘要文本
   */
  async generateSummary(content, userId = 'anonymous') {
    if (!this.isConfigured()) {
      throw new Error('Dify API is not configured');
    }

    try {
      logger.info(`[Dify] Generating summary for user ${userId}`);
      const summary = await this.callWorkflow('summary', content);
      return summary;
    } catch (error) {
      logger.error(`[Dify] Summary generation failed: ${error.message}`);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * 提取关键点
   * @param {string} content - 文章完整内容
   * @param {string} userId - 用户 ID
   * @returns {Promise<string>} 关键点列表（Markdown格式）
   */
  async extractKeypoints(content, userId = 'anonymous') {
    if (!this.isConfigured()) {
      throw new Error('Dify API is not configured');
    }

    try {
      logger.info(`[Dify] Extracting keypoints for user ${userId}`);
      const keypoints = await this.callWorkflow('key_points', content);
      return keypoints;
    } catch (error) {
      logger.error(`[Dify] Keypoint extraction failed: ${error.message}`);
      throw new Error('Failed to extract keypoints');
    }
  }

  /**
   * 提取 SEO 关键词
   * @param {string} content - 文章完整内容
   * @param {string} userId - 用户 ID
   * @returns {Promise<string>} 关键词列表
   */
  async extractKeywords(content, userId = 'anonymous') {
    if (!this.isConfigured()) {
      throw new Error('Dify API is not configured');
    }

    try {
      logger.info(`[Dify] Extracting SEO keywords for user ${userId}`);
      const keywords = await this.callWorkflow('seo_keywords', content);
      return keywords;
    } catch (error) {
      logger.error(`[Dify] Keywords extraction failed: ${error.message}`);
      throw new Error('Failed to extract keywords');
    }
  }

  /**
   * 流式对话（支持 SSE）
   * @param {string} message - 用户消息
   * @param {string} articleContent - 文章内容（上下文）
   * @param {string} conversationId - 对话 ID（用于多轮对话）
   * @param {string} userId - 用户 ID
   * @returns {AsyncGenerator} 异步生成器，逐字返回流数据
   */
  async *streamChat(message, articleContent, conversationId = '', userId = 'anonymous') {
    if (!this.isConfigured()) {
      throw new Error('Dify API is not configured');
    }

    try {
      const payload = {
        inputs: {
          message: message,
          article_context: articleContent,
        },
        response_mode: 'streaming',
        user: userId,
      };

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const response = await axios.post(
        `${this.baseURL}/chat-messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
          responseType: 'stream',
        }
      );

      // 逐行处理流数据
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.substring(5));

              if (data.event === 'message' || data.event === 'message_stream') {
                yield {
                  type: 'chunk',
                  content: data.answer || data.text || '',
                };
              } else if (data.event === 'message_end') {
                yield {
                  type: 'end',
                  conversationId: data.conversation_id,
                  metadata: data.metadata,
                };
              }
            } catch (e) {
              // 忽略 JSON 解析错误
            }
          }
        }
      }

      logger.info(`[Dify] Stream chat completed for user ${userId}`);
    } catch (error) {
      logger.error(`[Dify] Stream chat failed: ${error.message}`);
      throw new Error('Failed to stream chat response');
    }
  }
}

module.exports = new DifyService();
