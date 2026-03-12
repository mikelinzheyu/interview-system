/**
 * 前端面试 AI 服务层
 * 对接后端 /api/interview-ai/* 三个接口
 */

const BASE = '/api/interview-ai'

/**
 * 初始化面试会话
 * @param {{ jobTitle, jobDescription, resume, userId }} config
 */
async function initSession(config) {
  const resp = await fetch(`${BASE}/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error || `Init failed: ${resp.status}`)
  }
  return resp.json()
}

/**
 * 发送消息并以 ReadableStream 方式消费 SSE 响应
 * @param {string} message
 * @param {string|null} conversationId
 * @param {Object} inputs
 * @param {Function} onChunk - (content: string) => void
 * @param {Function} onEnd   - (conversationId: string) => void
 * @param {Function} onError - (error: Error) => void
 */
async function sendMessage(message, conversationId, inputs, onChunk, onEnd, onError) {
  let response
  try {
    response = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId: conversationId || '',
        inputs: inputs || {},
        userId: 'interview-user',
      }),
    })
  } catch (e) {
    onError && onError(e)
    return
  }

  if (!response.ok) {
    onError && onError(new Error(`Chat failed: ${response.status}`))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const jsonStr = trimmed.substring(6)
        try {
          const data = JSON.parse(jsonStr)
          if (data.type === 'chunk' && data.content) {
            onChunk && onChunk(data.content)
          } else if (data.type === 'end') {
            onEnd && onEnd(data.conversationId || '')
          } else if (data.type === 'error') {
            onError && onError(new Error(data.error || 'Stream error'))
          }
        } catch {
          // Ignore non-JSON lines
        }
      }
    }
  } catch (e) {
    onError && onError(e)
  }
}

/**
 * 获取面试裁决
 * @param {string} question
 * @param {string} answer
 * @param {string} sessionContext
 */
async function getVerdict(question, answer, sessionContext, jobTitle, roundCount) {
  const resp = await fetch(`${BASE}/verdict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question, answer, sessionContext,
      jobTitle: jobTitle || '',
      roundCount: roundCount || 1,
      userId: 'interview-user',
    }),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error || `Verdict failed: ${resp.status}`)
  }
  return resp.json()
}

export default { initSession, sendMessage, getVerdict }
