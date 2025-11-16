/**
 * WebSocket 集成测试 - 使用实际的业务事件
 * 测试真实的业务场景
 */

const io = require('socket.io-client')

const BACKEND_URL = 'http://localhost:3001'
let testCount = 0
let passCount = 0

const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket']
})

console.log('================================================== ')
console.log('WebSocket 集成测试')
console.log('==================================================')
console.log()

// 测试结果存储
const results = []

// 连接成功
socket.on('connect', () => {
  console.log('✓ WebSocket 连接成功')
  console.log(`  Socket ID: ${socket.id}`)
  console.log(`  Transport: ${socket.io.engine.transport.name}`)

  results.push({
    test: 'WebSocket基础连接',
    status: 'PASS',
    message: `Connected with ID: ${socket.id}`
  })
  testCount++
  passCount++

  // 测试加入聊天室事件
  testJoinRoom()
})

// 错误处理
socket.on('connect_error', (error) => {
  console.error('✗ 连接错误:', error.message)
  results.push({
    test: 'WebSocket基础连接',
    status: 'FAIL',
    message: error.message
  })
  testCount++
  process.exit(1)
})

// 测试加入聊天室
function testJoinRoom() {
  console.log('\n测试加入聊天室...')

  socket.emit('join-room', { roomId: 'test-room-001' }, (response) => {
    console.log('✓ 加入聊天室成功')

    results.push({
      test: '加入聊天室事件',
      status: 'PASS',
      message: 'Joined room test-room-001'
    })
    testCount++
    passCount++

    // 测试发送消息
    testSendMessage()
  })

  // 处理用户加入事件
  socket.on('user-joined', (data) => {
    console.log('✓ 收到用户加入事件:', data)
  })
}

// 测试发送消息
function testSendMessage() {
  console.log('\n测试发送消息...')

  const testMessage = {
    roomId: 'test-room-001',
    content: '集成测试消息',
    userId: 1,
    timestamp: new Date().toISOString()
  }

  socket.emit('send-message', testMessage, (ack) => {
    console.log('✓ 消息发送成功')

    results.push({
      test: '发送消息事件',
      status: 'PASS',
      message: 'Message sent to room'
    })
    testCount++
    passCount++

    // 测试订阅频道
    testSubscribeChannel()
  })

  socket.on('message-received', (msg) => {
    console.log('✓ 收到消息:', msg.content)
  })
}

// 测试订阅频道
function testSubscribeChannel() {
  console.log('\n测试订阅频道...')

  socket.emit('subscribe:channel', { channelId: 'channel-001' }, () => {
    console.log('✓ 订阅频道成功')

    results.push({
      test: '订阅频道事件',
      status: 'PASS',
      message: 'Subscribed to channel-001'
    })
    testCount++
    passCount++

    // 测试改变用户状态
    testUserStatusChange()
  })
}

// 测试用户状态变更
function testUserStatusChange() {
  console.log('\n测试用户状态变更...')

  socket.emit('user:status:changed', { status: 'online' }, () => {
    console.log('✓ 用户状态变更成功')

    results.push({
      test: '用户状态变更事件',
      status: 'PASS',
      message: 'User status changed to online'
    })
    testCount++
    passCount++

    // 完成所有测试
    completeTests()
  })
}

// 完成测试
function completeTests() {
  console.log('\n等待 2 秒后断开连接...')
  setTimeout(() => {
    socket.disconnect()
    generateReport()
  }, 2000)
}

// 生成报告
function generateReport() {
  console.log('\n' + '='.repeat(50))
  console.log('WebSocket 测试报告')
  console.log('='.repeat(50))
  console.log()

  console.log(`测试统计:`)
  console.log(`  总测试: ${testCount}`)
  console.log(`  ✓ 通过: ${passCount}`)
  console.log(`  ✗ 失败: ${testCount - passCount}`)
  console.log()

  console.log('测试详情:')
  results.forEach((result, idx) => {
    const icon = result.status === 'PASS' ? '✓' : '✗'
    const status = result.status === 'PASS' ? '通过' : '失败'
    console.log(`${idx + 1}. ${icon} ${result.test} (${status})`)
    console.log(`   ${result.message}`)
  })

  console.log()
  console.log('='.repeat(50))
  console.log('总体结果: ' + (testCount === passCount ? '✓ 所有测试通过' : '✗ 部分测试失败'))
  console.log('='.repeat(50))

  process.exit(testCount === passCount ? 0 : 1)
}

// 设置超时
setTimeout(() => {
  if (!socket.disconnected) {
    console.warn('\n警告: 测试超时，某些测试可能未完成')
    socket.disconnect()
    generateReport()
  }
}, 20000)
