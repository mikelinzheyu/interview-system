import api from './index'

export const interviewAPI = {
  // 创建面试会话
  createSession: (data) => api.post('/sessions', data),
  
  // 获取会话信息
  getSession: (sessionId) => api.get(`/sessions/${sessionId}`),
  
  // 开始面试
  startInterview: (sessionId) => api.post(`/sessions/${sessionId}/start`),
  
  // 发送消息
  sendMessage: (sessionId, data) => api.post(`/sessions/${sessionId}/messages`, data),
  
  // 获取对话历史
  getMessages: (sessionId) => api.get(`/sessions/${sessionId}/messages`),
  
  // 结束面试
  endInterview: (sessionId) => api.post(`/sessions/${sessionId}/end`),
  
  // 获取面试报告
  getReport: (sessionId) => api.get(`/sessions/${sessionId}/report`),

  // 列出面试会话（storage-service 提供）
  listSessions: (params = {}) => api.get('/sessions', { params })
}

// 模拟AI接口（后端未开发时使用）
export const mockAI = {
  // 模拟发送消息到AI
  chat: async (message) => {
    if (message) { /* noop */ }
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const responses = [
      '这是一个很好的问题。让我来为您详细解答...',
      '根据您的回答，我建议您可以从以下几个方面来思考...',
      '您提到的这个概念很重要，能否进一步说明一下...',
      '让我们换个角度来看这个问题...',
      '很好的思路！不过我想了解您对于这个问题的深层理解...'
    ]
    
    return {
      code: 200,
      data: {
        content: responses[Math.floor(Math.random() * responses.length)],
        type: 'text',
        timestamp: Date.now()
      }
    }
  }
}
