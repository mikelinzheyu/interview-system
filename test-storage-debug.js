#!/usr/bin/env node

const http = require('http');

const testData = {
  sessionId: 'debug-test-003',
  jobTitle: 'Test Engineer',
  questions: '[{"id": "q1", "question": "Test Q1", "hasAnswer": false}, {"id": "q2", "question": "Test Q2"}]'
};

const postData = JSON.stringify(testData);
console.log('[TEST] Sending test data with JSON string questions...');
console.log('Data:', JSON.stringify(testData, null, 2));

const options = {
  hostname: 'localhost',
  port: 8081,
  path: '/api/sessions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const response = JSON.parse(body);
    console.log('\n[RESPONSE] Status:', res.statusCode);
    console.log('[RESPONSE] Questions saved:', response.data.questions.length, 'items');
    if (response.data.questions.length > 0) {
      console.log('[SUCCESS] ✅ Questions parsed and saved correctly!');
      console.log('[RESPONSE] First question:', response.data.questions[0]);
    } else {
      console.log('[FAILED] ❌ Questions still empty - parsing not working');
    }
  });
});

req.on('error', (e) => console.error('[ERROR]', e.message));
req.write(postData);
req.end();
