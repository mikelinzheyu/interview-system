/**
 * Dify Chat API 服务
 * 处理与 Dify 聊天应用的交互
 * 支持流式响应和多轮对话
 */

const https = require('https')

class ChatWorkflowService {
  constructor() {
    this.apiKey = process.env.DIFY_CHAT_API_KEY || 'app-LzqvkItq6QOd0PH2VwXL3P16'
    this.appId = process.env.DIFY_CHAT_APP_ID || 'NF8mUftOYiGfQEzE'
    this.baseURL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'
    this.isConfigured = !!(this.apiKey && this.appId)
  }

  /**
   * 发送消息到 Dify Chat API
   * 返回异步生成器，支持流式处理
   *
   * @param {string} message - 用户消息
   * @param {string} userId - 用户 ID (post-${postId}-user-${userId})
   * @param {string} conversationId - 对话 ID（可选，用于多轮对话）
   * @returns {AsyncGenerator} 流式响应
   *
   * 响应格式:
   * {type: 'chunk', answer: '...'}  - 消息块
   * {type: 'end', conversationId: '...', messageId: '...'}  - 对话结束
   */
  async* sendMessage(message, userId, conversationId = '', articleContent = '') {
    if (!this.isConfigured) {
      throw new Error('Chat API 未配置')
    }

    const url = `${this.baseURL}/chat-messages`

    const payload = {
      inputs: {
        article_content: articleContent || '无文章内容'  // Dify Chat App 需要此字段
      },
      query: message,
      response_mode: 'streaming',
      conversation_id: conversationId || '',
      user: userId,
    }

    console.log(`[ChatWorkflow] 发送消息 - 用户: ${userId}, 对话ID: ${conversationId}`)

    try {
      const chunks = await this._callDifyAPI(url, payload)

      let lastConversationId = conversationId
      let lastMessageId = ''
      let fullAnswer = ''

      for (const chunk of chunks) {
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6)
              const data = JSON.parse(jsonStr)

              // 处理不同的事件类型
              if (data.event === 'message_start') {
                lastConversationId = data.conversation_id || conversationId
                lastMessageId = data.id || ''
              } else if (data.event === 'message' || data.event === 'agent_message' || data.event === 'text_chunk') {
                // message: Dify Chat API 的标准事件
                // agent_message 和 text_chunk: 其他 API 的事件类型
                const answer = data.answer || data.text || ''
                if (answer) {
                  fullAnswer += answer
                  yield {
                    type: 'chunk',
                    content: answer,
                    answer: answer, // 兼容旧格式
                  }
                }
                // 记录 conversation_id 和 message_id
                if (data.conversation_id) lastConversationId = data.conversation_id
                if (data.id || data.message_id) lastMessageId = data.id || data.message_id
              } else if (data.event === 'message_end') {
                lastConversationId = data.conversation_id || lastConversationId
                lastMessageId = data.id || lastMessageId
              }
            } catch (e) {
              console.error('[ChatWorkflow] 解析流数据错误:', e.message, 'line:', line)
            }
          }
        }
      }

      // 返回最终的对话 ID 和消息 ID
      yield {
        type: 'end',
        conversationId: lastConversationId,
        messageId: lastMessageId,
        fullAnswer: fullAnswer,
      }

      console.log(`[ChatWorkflow] 消息发送完成 - 新对话ID: ${lastConversationId}`)
    } catch (error) {
      console.error('[ChatWorkflow] API 调用错误:', error.message)
      throw error
    }
  }

  /**
   * 获取对话历史
   * @param {string} conversationId - 对话 ID
   * @param {string} userId - 用户 ID
   * @returns {Promise<Object>} 对话历史
   */
  async getConversation(conversationId, userId) {
    if (!this.isConfigured) {
      throw new Error('Chat API 未配置')
    }

    const url = `${this.baseURL}/conversations/${conversationId}`

    try {
      const response = await this._callDifyAPIBlocking(url, null, 'GET')
      return response
    } catch (error) {
      console.error('[ChatWorkflow] 获取对话历史错误:', error.message)
      throw error
    }
  }

  /**
   * 删除对话
   * @param {string} conversationId - 对话 ID
   * @param {string} userId - 用户 ID
   * @returns {Promise<Boolean>} 是否成功
   */
  async deleteConversation(conversationId, userId) {
    if (!this.isConfigured) {
      throw new Error('Chat API 未配置')
    }

    const url = `${this.baseURL}/conversations/${conversationId}`

    try {
      await this._callDifyAPIBlocking(url, null, 'DELETE')
      console.log(`[ChatWorkflow] 对话已删除 - ID: ${conversationId}`)
      return true
    } catch (error) {
      console.error('[ChatWorkflow] 删除对话错误:', error.message)
      throw error
    }
  }

  /**
   * 调用 Dify API - 流式响应
   * @private
   */
  async _callDifyAPI(url, payload) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }

      console.log('[ChatWorkflow] 发送请求:')
      console.log('  URL:', url)
      console.log('  API Key:', this.apiKey.substring(0, 15) + '...')
      console.log('  Payload:', JSON.stringify(payload))

      const req = https.request(url, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk.toString()
        })

        res.on('end', () => {
          if (res.statusCode >= 400) {
            console.error('[ChatWorkflow] Dify API 返回错误:')
            console.error('  状态码:', res.statusCode)
            console.error('  响应:', data)
            const error = new Error(`API 错误: ${res.statusCode}`)
            error.statusCode = res.statusCode
            error.response = data
            reject(error)
          } else {
            // 将数据分块
            const chunks = data.split('\n\n').filter(chunk => chunk.trim())
            resolve(chunks)
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`网络错误: ${error.message}`))
      })

      req.write(JSON.stringify(payload))
      req.end()
    })
  }

  /**
   * 调用 Dify API - 阻塞式响应
   * @private
   */
  async _callDifyAPIBlocking(url, payload, method = 'POST') {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }

      const req = https.request(url, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk.toString()
        })

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            if (res.statusCode >= 400) {
              const error = new Error(`API 错误: ${res.statusCode}`)
              error.statusCode = res.statusCode
              error.response = jsonData
              reject(error)
            } else {
              resolve(jsonData)
            }
          } catch (e) {
            reject(new Error(`响应解析错误: ${e.message}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(new Error(`网络错误: ${error.message}`))
      })

      if (payload) {
        req.write(JSON.stringify(payload))
      }

      req.end()
    })
  }

  /**
   * 检查 API 是否已配置
   * @returns {Boolean}
   */
  checkConfiguration() {
    return this.isConfigured
  }

  /**
   * 获取配置状态
   * @returns {Object}
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'not set',
      appId: this.appId,
      baseURL: this.baseURL,
    }
  }
}

module.exports = new ChatWorkflowService()
