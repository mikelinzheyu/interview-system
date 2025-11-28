/**
 * Dify Chat API 服务
 * 处理与 Dify 聊天应用的交互
 * 支持流式响应和多轮对话
 */

const https = require('https')

class ChatWorkflowService {
  constructor() {
    // 从环境变量读取配置（生产环境必须配置，不允许使用硬编码默认值）
    this.apiKey = process.env.DIFY_CHAT_API_KEY
    this.appId = process.env.DIFY_CHAT_APP_ID
    this.baseURL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1'
    this.isConfigured = !!(this.apiKey && this.appId)

    // 增强的配置日志
    console.log('\n========== Dify Chat API 配置信息 ==========')
    if (this.isConfigured) {
      console.log('✅ 状态: Dify API 已配置')
      console.log(`   API Key: ${this.apiKey.substring(0, 15)}...${this.apiKey.substring(this.apiKey.length - 5)}`)
      console.log(`   App ID: ${this.appId}`)
      console.log(`   Base URL: ${this.baseURL}`)
      console.log('   ⚡ 将使用 Dify API 进行实时对话')
    } else {
      console.log('❌ 状态: Dify API 未配置')
      console.log('   原因: API Key 或 App ID 缺失')
      console.log('\n   ⚠️  将使用 Mock 模式代替')
      console.log('\n   💡 要启用 Dify API，请设置以下环境变量:')
      console.log('      DIFY_CHAT_API_KEY=app-Bj1UccX9v9X1aw6st7OW5paG')
      console.log('      DIFY_CHAT_APP_ID=NF8mUftOYiGfQEzE')
      console.log('      DIFY_API_URL=https://api.dify.ai/v1')
    }
    console.log('==========================================\n')
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

    // 始终使用同一个端点,conversationId 在 request body 中
    const url = `${this.baseURL}/chat-messages`

    const payload = {
      inputs: {
        article_content: articleContent || '无文章内容'  // Dify Chat App 需要此字段
      },
      query: message,
      response_mode: 'streaming',
      conversation_id: conversationId || '',  // 在 body 中发送 conversationId
      user: userId,
    }

    console.log(`[ChatWorkflow] 发送消息 - 用户: ${userId}, 对话ID: "${conversationId}"`)
    console.log(`[ChatWorkflow] 消息内容: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`)
    console.log(`[ChatWorkflow] API Key: ${this.apiKey.substring(0, 15)}...${this.apiKey.substring(this.apiKey.length - 5)}`)
    console.log(`[ChatWorkflow] App ID: ${this.appId}`)

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

      console.log('\n[ChatWorkflow] ======== Dify API 请求详情 ========')
      console.log('  URL:', url)
      console.log('  Auth Bearer:', this.apiKey.substring(0, 20) + '...' + this.apiKey.substring(this.apiKey.length - 10))
      console.log('  Conversation ID:', payload.conversation_id || '(empty - 新会话)')
      console.log('  User ID:', payload.user)
      console.log('  Message:', JSON.stringify(payload.query).substring(0, 80))
      console.log('  Payload:', JSON.stringify(payload, null, 2).substring(0, 200))

      const req = https.request(url, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk.toString()
        })

        res.on('end', () => {
          if (res.statusCode >= 400) {
            console.error('\n[ChatWorkflow] ❌ Dify API 错误响应')
            console.error('  状态码:', res.statusCode)
            console.error('  状态消息:', res.statusMessage)
            console.error('  响应数据:', data.substring(0, 500))
            console.error('  响应头:', JSON.stringify(res.headers, null, 2))
            const error = new Error(`API 错误: ${res.statusCode}`)
            error.statusCode = res.statusCode
            error.response = data
            reject(error)
          } else {
            console.log('[ChatWorkflow] ✅ Dify API 响应成功')
            console.log('  状态码:', res.statusCode)
            console.log('  响应数据块数:', data.split('\n\n').length)
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
    // 在开发环境中，如果 Dify API 不可用，优先使用 Mock 模式
    // 这确保即使 Dify API 返回 404，系统也会使用 Mock 数据而不是崩溃

    if (!this.apiKey || !this.appId) {
      console.log('[ChatWorkflow] 配置检查: API Key 或 App ID 缺失，使用 Mock 模式')
      return false
    }

    if (this.apiKey === 'undefined' || this.appId === 'undefined') {
      console.log('[ChatWorkflow] 配置检查: API Key 或 App ID 为 undefined，使用 Mock 模式')
      return false
    }

    // ✅ 只在非开发环境中检查默认示例 Key
    // 在开发环境中允许使用示例 Key 进行测试
    const isDefaultExample = this.apiKey === 'app-Bj1UccX9v9X1aw6st7OW5paG'

    if (isDefaultExample && process.env.NODE_ENV === 'production') {
      console.log('[ChatWorkflow] 配置检查: 生产环境不允许使用示例 API Key，使用 Mock 模式')
      return false
    }

    if (isDefaultExample && process.env.NODE_ENV !== 'production') {
      console.log('[ChatWorkflow] ⚠️  配置检查: 开发环境使用示例 API Key，注意 Dify API 可能不可用')
      console.log('[ChatWorkflow] 提示: 要使用真实的 Dify API，请在 .env 中设置真实的 Key')
    }

    console.log('[ChatWorkflow] 配置检查: API 配置有效，将尝试使用 Dify API')
    return true
  }

  /**
   * 测试 Dify API 连接
   * @returns {Promise<Object>} {success: boolean, message: string}
   */
  async testConnection() {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'API 未配置',
      }
    }

    try {
      console.log('[ChatWorkflow] 开始测试 Dify API 连接...')

      const testPayload = {
        inputs: { article_content: '测试连接' },
        query: '你好',
        response_mode: 'blocking',
        user: 'test-user',
      }

      const response = await this._callDifyAPIBlocking(
        `${this.baseURL}/chat-messages`,
        testPayload,
        'POST'
      )

      console.log('[ChatWorkflow] ✅ Dify API 连接成功!')
      return {
        success: true,
        message: 'Dify API 连接正常',
        data: response,
      }
    } catch (error) {
      console.error('[ChatWorkflow] ❌ Dify API 连接失败:', error.message)
      return {
        success: false,
        message: `Dify API 连接失败: ${error.message}`,
        error: error,
      }
    }
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
