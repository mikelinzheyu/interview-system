/**
 * AI 面试代理路由
 *
 * POST /api/interview-ai/init    — 面试初始化 Workflow
 * POST /api/interview-ai/chat    — 模拟面试官实时流式对话 (SSE)
 * POST /api/interview-ai/verdict — 面试裁决 Workflow
 */

const express = require('express')
const router  = express.Router()
const { initInterview, createChatStream, getVerdict } = require('../services/difyInterviewService')

/**
 * POST /api/interview-ai/init
 */
router.post('/init', async (req, res) => {
  const { jobTitle, jobDescription, resume, userId } = req.body

  if (!jobTitle || !jobTitle.trim()) {
    return res.status(400).json({ error: '岗位名称不能为空' })
  }

  // 验证字段长度
  if (jobTitle.length > 200) {
    return res.status(400).json({ error: '岗位名称过长（最多 200 字）' })
  }
  if (jobDescription && jobDescription.length > 3000) {
    return res.status(400).json({ error: '职位描述过长（最多 3000 字）' })
  }
  if (resume && resume.length > 3000) {
    return res.status(400).json({ error: '个人简历过长（最多 3000 字）' })
  }

  try {
    console.log(`[InterviewAI Route/Init] jobTitle=${jobTitle}`)
    const result = await initInterview(
      jobTitle.trim(),
      jobDescription || '',
      resume        || '',
      userId        || 'anonymous'
    )
    res.json({ code: 200, message: 'OK', data: result })
  } catch (error) {
    console.error('[InterviewAI Route/Init] Error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/interview-ai/chat
 * 实时 SSE 流式转发 Dify streaming 响应
 */
router.post('/chat', async (req, res) => {
  const { message, conversationId, inputs, userId } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  // 确保 inputs 包含 job_title（Chat App 必填）
  const safeInputs = {
    job_title:   inputs?.job_title   || inputs?.jobTitle || '',
    jd_text:     inputs?.jd_text     || inputs?.jobDescription || '未提供',
    resume_text: inputs?.resume_text || inputs?.resume || '未提供',
  }
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  console.log(`[InterviewAI Route/Chat] msg="${message.substring(0, 40)}" conv=${conversationId}`)

  let difyStream
  try {
    difyStream = await createChatStream(
      message.trim(),
      conversationId || '',
      safeInputs,
      userId         || 'anonymous'
    )
  } catch (error) {
    console.error('[InterviewAI Route/Chat] Stream create error:', error.message)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
    return res.end()
  }

  // 实时解析 SSE 并转发
  let buffer      = ''
  let lastConvId  = conversationId || ''

  difyStream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() // 保留未完整的行

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue

      const jsonStr = trimmed.substring(6)
      if (jsonStr === '[DONE]') continue

      try {
        const data = JSON.parse(jsonStr)

        if (data.event === 'message' || data.event === 'agent_message') {
          if (data.answer) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: data.answer })}\n\n`)
          }
          if (data.conversation_id) lastConvId = data.conversation_id
        } else if (data.event === 'message_end') {
          if (data.conversation_id) lastConvId = data.conversation_id
        } else if (data.event === 'error') {
          res.write(`data: ${JSON.stringify({ type: 'error', error: data.message || 'Dify error' })}\n\n`)
        }
      } catch {
        // 忽略非 JSON 行
      }
    }
  })

  difyStream.on('end', () => {
    console.log(`[InterviewAI Route/Chat] 流式完成 - conv: ${lastConvId}`)
    res.write(`data: ${JSON.stringify({ type: 'end', conversationId: lastConvId })}\n\n`)
    res.end()
  })

  difyStream.on('error', (err) => {
    console.error('[InterviewAI Route/Chat] Stream error:', err.message)
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`)
    res.end()
  })

  // 客户端断开时销毁流
  req.on('close', () => {
    if (difyStream && !difyStream.destroyed) difyStream.destroy()
  })
})

/**
 * POST /api/interview-ai/verdict
 */
router.post('/verdict', async (req, res) => {
  const { question, answer, sessionContext, userId, jobTitle, roundCount } = req.body

  if (!question || !answer) {
    return res.status(400).json({ error: '问题和回答不能为空' })
  }

  try {
    console.log(`[InterviewAI Route/Verdict] question="${question.substring(0, 40)}"`)
    const result = await getVerdict(
      question,
      answer,
      sessionContext || '',
      userId         || 'anonymous',
      jobTitle       || '',
      roundCount     || 1
    )
    res.json({ code: 200, message: 'OK', data: result })
  } catch (error) {
    console.error('[InterviewAI Route/Verdict] Error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
