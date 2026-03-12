require('dotenv').config()
const https = require('https')

const INIT_KEY = process.env.DIFY_INTERVIEW_INIT_KEY
const DIFY_BASE_URL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1'
console.log('INIT_KEY:', INIT_KEY ? INIT_KEY.substring(0, 20) + '...' : 'MISSING')

const body = {
  inputs: { job_title: '前端开发工程师', jd_text: '熟悉Vue3', resume_text: '5年经验' },
  response_mode: 'streaming', user: 'debug'
}
const bodyStr = JSON.stringify(body)

const req = https.request({
  hostname: 'api.dify.ai', port: 443, path: '/v1/workflows/run', method: 'POST',
  headers: {
    Authorization: `Bearer ${INIT_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyStr)
  }
}, (res) => {
  console.log('HTTP Status:', res.statusCode)
  let buffer = ''
  res.on('data', chunk => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.trim().startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.trim().substring(6))
        if (data.event === 'workflow_finished') {
          const outputs = data.data?.outputs || {}
          console.log('\n=== OUTPUTS ===')
          console.log('keys:', Object.keys(outputs))
          for (const [k, v] of Object.entries(outputs)) {
            console.log(`  [${k}]:`, typeof v === 'string' ? v.substring(0, 300) : JSON.stringify(v).substring(0, 300))
          }
        }
      } catch {}
    }
  })
  res.on('end', () => console.log('\nDone'))
})
req.setTimeout(180000)
req.on('error', e => console.error('Error:', e.message))
req.write(bodyStr)
req.end()
