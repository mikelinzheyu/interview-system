const http = require('http')

const BASE_URL = 'http://localhost:3001'
const AUTH_TOKEN = 'user-123'
const POST_ID = '20'
const CONV_ID = 'debug-conv-' + Date.now()

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    }

    const req = http.request(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ statusCode: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ statusCode: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
    setTimeout(() => reject(new Error('timeout')), 10000)
  })
}

async function test() {
  console.log('\n=== DEBUG TEST ===')
  console.log(`Token: ${AUTH_TOKEN}`)
  console.log(`PostId: ${POST_ID}`)
  console.log(`ConvId: ${CONV_ID}\n`)

  console.log('[1] POST message...')
  let res = await makeRequest('POST', `/api/ai-history/conversations/${CONV_ID}/messages`, {
    role: 'user',
    content: 'Test',
    postId: POST_ID
  })
  console.log(`Status: ${res.statusCode}`)

  console.log('\n[2] Wait 1 second...')
  await new Promise(r => setTimeout(r, 1000))

  console.log('[3] GET conversations...')
  res = await makeRequest('GET', `/api/ai-history/conversations?postId=${POST_ID}`)
  console.log(`Status: ${res.statusCode}`)
  console.log(`Found: ${res.data.data?.length} conversations`)
  console.log(`Conversations:`, JSON.stringify(res.data.data, null, 2))

  process.exit(0)
}

test().catch(e => { console.error(e); process.exit(1) })
