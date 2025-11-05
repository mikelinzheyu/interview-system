#!/usr/bin/env node

// Full-stack smoke test via Nginx proxy
// Base URL defaults to http://localhost:8088

const BASE = process.env.FRONTEND_BASE || 'http://localhost:8088'
const API_PREFIX = process.env.API_PREFIX || '/api'
const TIMEOUT_MS = parseInt(process.env.SMOKE_TIMEOUT || '15000', 10)

function log(msg) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${msg}`)
}

async function request(path, { method = 'GET', headers = {}, body, token, timeout = TIMEOUT_MS } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const h = { ...headers }
  if (token) h['Authorization'] = `Bearer ${token}`
  if (body && !h['Content-Type']) h['Content-Type'] = 'application/json'

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(new Error('timeout')), timeout)
  try {
    const res = await fetch(url, {
      method,
      headers: h,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal
    })
    const text = await res.text()
    let data
    try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }
    return { ok: res.ok, status: res.status, data }
  } finally {
    clearTimeout(id)
  }
}

function assertApiOk(resp, name) {
  if (!resp.ok) throw new Error(`${name} HTTP ${resp.status}`)
  const code = resp?.data?.code
  if (code != null && code !== 200) throw new Error(`${name} API code ${code}`)
}

function randUser() {
  const n = Math.floor(Date.now() / 1000) % 1000000
  return {
    username: `testuser_${n}`,
    password: 'Passw0rd!',
    email: `test_${n}@example.com`
  }
}

async function main() {
  const results = []
  const add = (name, status, extra = {}) => {
    const { status: ignored, ...rest } = extra // avoid clobbering status string
    results.push({ name, status, ...rest })
  }

  log(`Smoke test via ${BASE}`)

  // 1) Backend health via Nginx mapping to /api/v1
  try {
    const r = await request(`${API_PREFIX}/actuator/health`)
    assertApiOk(r, 'health')
    add('Health', 'pass', { httpStatus: r.status, data: r.data })
  } catch (e) {
    add('Health', 'fail', { error: String(e) })
  }

  // 2) Register (best-effort) then Login
  let token = ''
  let user = randUser()
  try {
    const rr = await request(`${API_PREFIX}/auth/register`, { method: 'POST', body: user })
    // allow non-200 (duplicate) then try login
    try { assertApiOk(rr, 'register') } catch {}
  } catch (e) {
    // ignore, try login anyway
  }
  try {
    const lr = await request(`${API_PREFIX}/auth/login`, { method: 'POST', body: { username: user.username, password: user.password } })
    assertApiOk(lr, 'login')
    token = lr?.data?.data?.token || lr?.data?.token
    if (!token) throw new Error('missing token in response')
    add('Auth/Login', 'pass')
  } catch (e) {
    add('Auth/Login', 'fail', { error: String(e) })
  }

  // 3) Categories & Questions
  try {
    const catPath = process.env.MOCK_MODE === 'true' ? `${API_PREFIX}/questions/categories` : `${API_PREFIX}/categories`
    const cr = await request(catPath)
    assertApiOk(cr, 'categories')
    add('Categories', 'pass', { count: Array.isArray(cr?.data?.data) ? cr.data.data.length : undefined })
  } catch (e) {
    add('Categories', 'fail', { error: String(e) })
  }
  try {
    const qr = await request(`${API_PREFIX}/questions?page=1&size=5`)
    assertApiOk(qr, 'questions')
    add('Questions', 'pass')
  } catch (e) {
    add('Questions', 'fail', { error: String(e) })
  }

  // 4) Interview session flow
  if (token) {
    if (process.env.MOCK_MODE === 'true') {
      add('Session/Flow', 'skip', { reason: 'mock mode - custom session API' })
    } else {
      let sessionId
      try {
        const cr = await request(`${API_PREFIX}/sessions`, { method: 'POST', token, body: { category_id: 1, difficulty: 'medium' } })
        assertApiOk(cr, 'create session')
        sessionId = cr?.data?.data?.id || cr?.data?.data?.session?.id || cr?.data?.data?.session_id
        if (!sessionId) throw new Error('missing session id')
        add('Session/Create', 'pass', { sessionId })
      } catch (e) {
        add('Session/Create', 'fail', { error: String(e) })
      }
      if (sessionId) {
        try {
          const sr = await request(`${API_PREFIX}/sessions/${sessionId}/start`, { method: 'POST' })
          assertApiOk(sr, 'start session')
          add('Session/Start', 'pass')
        } catch (e) {
          add('Session/Start', 'fail', { error: String(e) })
        }
        try {
          const mr = await request(`${API_PREFIX}/sessions/${sessionId}/message`, { method: 'POST', body: { type: 'answer', content: '这是我的回答' } })
          assertApiOk(mr, 'send message')
          add('Session/Message', 'pass')
        } catch (e) {
          add('Session/Message', 'fail', { error: String(e) })
        }
        try {
          const gr = await request(`${API_PREFIX}/sessions/${sessionId}`)
          assertApiOk(gr, 'get session')
          add('Session/Get', 'pass')
        } catch (e) {
          add('Session/Get', 'fail', { error: String(e) })
        }
        try {
          const er = await request(`${API_PREFIX}/sessions/${sessionId}/end`, { method: 'POST' })
          assertApiOk(er, 'end session')
          add('Session/End', 'pass')
        } catch (e) {
          add('Session/End', 'fail', { error: String(e) })
        }
      }
    }
  } else {
    add('Session/Flow', 'skip', { reason: 'no token' })
  }

  // 5) Wrong answers (optional, may fail if tables not initialized)
  if (token) {
    try {
      const lr = await request(`${API_PREFIX}/wrong-answers`, { token })
      assertApiOk(lr, 'wrong-answers/list')
      add('WrongAnswers/List', 'pass', { count: Array.isArray(lr?.data?.data) ? lr.data.data.length : undefined })
    } catch (e) {
      add('WrongAnswers/List', 'warn', { error: String(e) })
    }
    try {
      const pr = await request(`${API_PREFIX}/wrong-answers`, { method: 'POST', token, body: { questionId: 1, source: 'interview', knowledgePoint: 'JS闭包', userNotes: '记一下' } })
      assertApiOk(pr, 'wrong-answers/create')
      add('WrongAnswers/Create', 'pass')
    } catch (e) {
      add('WrongAnswers/Create', 'warn', { error: String(e) })
    }
    try {
      const ar = await request(`${API_PREFIX}/wrong-answers/analytics?days=7`, { token })
      if (ar.ok && (ar?.data?.code == null || ar?.data?.code === 200)) {
        add('WrongAnswers/Analytics', 'pass')
      } else {
        add('WrongAnswers/Analytics', 'warn', { status: ar.status })
      }
    } catch (e) {
      add('WrongAnswers/Analytics', 'warn', { error: String(e) })
    }
  }

  // 6) WebSocket connectivity test
  try {
    if (process.env.MOCK_MODE === 'true') {
      // Try socket.io client from frontend's node_modules
      const path = require('path')
      let io
      try {
        io = require(path.join(__dirname, '../frontend/node_modules/socket.io-client'))
      } catch (e) {
        add('WebSocket', 'skip', { reason: 'socket.io-client not found in frontend/node_modules' })
        throw new Error('skip')
      }
      const { io: IO } = io
      const connectUrl = BASE // e.g., http://localhost:3001
      await new Promise((resolve, reject) => {
        const socket = IO(connectUrl, {
          auth: { token: '1' },
          transports: ['websocket'],
          timeout: 5000
        })
        const timer = setTimeout(() => { try{socket.close()}catch{}; reject(new Error('ws timeout')) }, 6000)
        socket.on('connect', () => { clearTimeout(timer); try{socket.close()}catch{}; resolve() })
        socket.on('connect_error', (err) => { clearTimeout(timer); try{socket.close()}catch{}; reject(err) })
      })
      add('WebSocket', 'pass')
    } else {
      // SockJS info probe for Spring endpoint
      const info = await request(`${API_PREFIX}/v1/ws/wrong-answers/info`)
      if (info.status >= 500) throw new Error(`ws info HTTP ${info.status}`)
      add('WebSocket', 'pass', { httpStatus: info.status })
    }
  } catch (e) {
    if (String(e) !== 'Error: skip') {
      add('WebSocket', 'warn', { error: String(e) })
    }
  }

  // Summary
  const counts = results.reduce((acc, r) => { acc[r.status] = (acc[r.status]||0)+1; return acc }, {})
  console.log('\n===== Smoke Test Summary =====')
  Object.entries(counts).forEach(([k,v]) => console.log(`${k}: ${v}`))
  console.log('------------------------------')
  results.forEach(r => console.log(`${r.status.padEnd(5)} | ${r.name}${r.sessionId?` (#${r.sessionId})`:''}${r.error?` -> ${r.error}`:''}${r.reason?` -> ${r.reason}`:''}`))

  // Exit code: fail if any 'fail' exists
  process.exit(counts.fail ? 1 : 0)
}

main().catch(e => { console.error('Smoke test crashed:', e); process.exit(2) })
