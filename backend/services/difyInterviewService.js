/**
 * Dify 面试智能体服务
 * 三个 Dify 智能体的正确字段名（通过 /v1/parameters 确认）：
 *
 * 面试初始化 (app-84ssJ4EpkbdzBSZvA600RKxU) Workflow:
 *   Required: job_title
 *   Optional: jd_text, resume_text (default "未提供")
 *
 * 模拟面试官 (app-QiI36qHTL9hzNTLZGXJxReEn) Advanced Chat:
 *   Required inputs: job_title
 *   Optional inputs: jd_text, resume_text
 *
 * 面试裁决 (app-d2gg7CMVkkyLBVf7Br0X1iVb) Workflow:
 *   Required: focus_areas, grading_rubric, key_keywords,
 *             user_answer, current_question, structured_state,
 *             long_term_summary, short_term_history, round_count
 */

const https = require('https')

const DIFY_BASE_URL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1'
const INIT_KEY    = process.env.DIFY_INTERVIEW_INIT_KEY
const CHAT_KEY    = process.env.DIFY_INTERVIEW_CHAT_KEY
const VERDICT_KEY = process.env.DIFY_INTERVIEW_VERDICT_KEY

/**
 * Workflow 流式调用 — 收集 SSE 直到 workflow_finished 事件
 * 避免 Cloudflare 30s blocking 模式超时
 */
function callDifyWorkflowStreaming(apiKey, inputs, userId) {
  return new Promise((resolve, reject) => {
    const body    = { inputs, response_mode: 'streaming', user: userId || 'anonymous' }
    const bodyStr = JSON.stringify(body)
    const urlObj  = new URL(DIFY_BASE_URL + '/workflows/run')

    const options = {
      hostname: urlObj.hostname,
      port:     urlObj.port || 443,
      path:     urlObj.pathname,
      method:   'POST',
      headers: {
        Authorization:    `Bearer ${apiKey}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }

    const req = https.request(options, (res) => {
      if (res.statusCode >= 400) {
        let errBody = ''
        res.on('data', c => { errBody += c.toString() })
        res.on('end', () => {
          try {
            const j = JSON.parse(errBody)
            reject(new Error(j.message || j.code || `HTTP ${res.statusCode}`))
          } catch {
            reject(new Error(`HTTP ${res.statusCode}: ${errBody.substring(0, 120)}`))
          }
        })
        return
      }

      let buffer  = ''
      let outputs = null

      res.on('data', chunk => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim().startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.trim().substring(6))
            if (data.event === 'workflow_finished') {
              outputs = data.data?.outputs || {}
            } else if (data.event === 'error') {
              reject(new Error(data.message || 'Workflow error'))
            }
          } catch { /* 忽略非 JSON */ }
        }
      })

      res.on('end', () => {
        if (outputs !== null) resolve(outputs)
        else reject(new Error('Workflow 未返回 outputs'))
      })
      res.on('error', reject)
    })

    req.setTimeout(180000, () => {
      req.destroy()
      reject(new Error('Workflow request timeout (180s)'))
    })
    req.on('error', e => reject(new Error(`网络错误: ${e.message}`)))
    req.write(bodyStr)
    req.end()
  })
}

/**
 * 面试初始化 — Workflow 流式
 * 正确字段名：job_title / jd_text / resume_text
 */
async function initInterview(jobTitle, jd, resume, userId) {
  if (!INIT_KEY) throw new Error('DIFY_INTERVIEW_INIT_KEY 未配置')

  const inputs = {
    job_title:   jobTitle || '',
    jd_text:     jd       || '未提供',
    resume_text: resume   || '未提供',
  }

  console.log(`[InterviewAI/Init] 岗位: ${jobTitle}`)
  const outputs = await callDifyWorkflowStreaming(INIT_KEY, inputs, userId)
  console.log('[InterviewAI/Init] 成功，outputs keys:', Object.keys(outputs))

  // Init Workflow 返回 result_json 字段（JSON 字符串）
  let parsed = {}
  if (outputs.result_json) {
    try { parsed = JSON.parse(outputs.result_json) } catch { parsed = { raw: outputs.result_json } }
  } else {
    parsed = outputs
  }

  return {
    questions:      parsed.questions      || [],
    sessionContext: parsed.session_context || parsed.context || JSON.stringify(parsed),
    raw: parsed,
  }
}

/**
 * 创建实时聊天流 — 返回 Node.js IncomingMessage（供路由层实时管道转发）
 * 正确字段名：inputs 中 job_title / jd_text / resume_text
 */
function createChatStream(message, conversationId, inputs, userId) {
  if (!CHAT_KEY) return Promise.reject(new Error('DIFY_INTERVIEW_CHAT_KEY 未配置'))

  const payload = {
    inputs:          inputs || {},
    query:           message,
    response_mode:   'streaming',
    conversation_id: conversationId || '',
    user:            userId || 'anonymous',
  }

  const bodyStr = JSON.stringify(payload)
  const urlObj  = new URL(DIFY_BASE_URL + '/chat-messages')

  console.log(`[InterviewAI/Chat] conv: "${conversationId}"`)

  return new Promise((resolve, reject) => {
    const options = {
      hostname: urlObj.hostname,
      port:     urlObj.port || 443,
      path:     urlObj.pathname,
      method:   'POST',
      headers: {
        Authorization:    `Bearer ${CHAT_KEY}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }

    const req = https.request(options, (res) => {
      if (res.statusCode >= 400) {
        let errBody = ''
        res.on('data', c => { errBody += c.toString() })
        res.on('end', () => {
          try {
            const j = JSON.parse(errBody)
            reject(new Error(`Chat API 错误: ${j.message || j.code || res.statusCode}`))
          } catch {
            reject(new Error(`Chat HTTP ${res.statusCode}: ${errBody.substring(0, 120)}`))
          }
        })
        return
      }
      resolve(res)
    })

    req.setTimeout(60000, () => {
      req.destroy()
      reject(new Error('Chat request timeout (60s)'))
    })
    req.on('error', e => reject(new Error(`网络错误: ${e.message}`)))
    req.write(bodyStr)
    req.end()
  })
}

/**
 * 面试裁决 — Workflow 流式
 * 正确字段名（通过 /v1/parameters 确认的全部 required 字段）
 */
async function getVerdict(question, answer, sessionContext, userId, jobTitle, roundCount) {
  if (!VERDICT_KEY) throw new Error('DIFY_INTERVIEW_VERDICT_KEY 未配置')

  const inputs = {
    focus_areas:       jobTitle || '综合能力评估',
    grading_rubric:    '根据技术深度、表达清晰度、逻辑结构、实际经验综合评分，满分100分',
    key_keywords:      jobTitle || '专业技能',
    user_answer:       answer   || '',
    current_question:  question || '',
    structured_state:  sessionContext || '{}',
    long_term_summary: sessionContext || '面试进行中',
    short_term_history: sessionContext || '暂无历史',
    round_count:       roundCount || 1,
  }

  console.log(`[InterviewAI/Verdict] 第${roundCount || 1}轮裁决`)
  const outputs = await callDifyWorkflowStreaming(VERDICT_KEY, inputs, userId)

  // Verdict Workflow 返回 judge_result 字段（JSON 字符串）
  let judgeResult = {}
  if (outputs.judge_result) {
    try { judgeResult = JSON.parse(outputs.judge_result) } catch { judgeResult = { decision: 'next' } }
  }

  const rawDecision = judgeResult.decision || outputs.decision || 'next'
  // 统一格式：FOLLOW_UP → follow_up, NEXT/next → next
  const decision = rawDecision.toLowerCase().includes('follow') ? 'follow_up' : 'next'

  console.log('[InterviewAI/Verdict] 成功，decision:', decision, '| score:', judgeResult.score)
  return {
    decision,
    follow_up_question: judgeResult.next_action_text || outputs.follow_up_question || '',
    score:              judgeResult.score || 0,
    judgement:          judgeResult.judgement || '',
    raw: judgeResult,
  }
}

module.exports = { initInterview, createChatStream, getVerdict }
