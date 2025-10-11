/**
 * Redis 连接测试脚本
 * 用于验证 Redis 服务器是否正常运行并可连接
 */

const redis = require('redis')

async function testRedis() {
  console.log('🧪 Redis 连接测试\n')
  console.log('=' .repeat(60))

  const client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined
  })

  client.on('error', (err) => {
    console.error('\n❌ Redis 客户端错误:', err.message)
    console.log('\n提示: 请确保 Redis 服务器正在运行')
    console.log('      - Docker: docker start interview-redis')
    console.log('      - WSL: sudo service redis-server start')
    process.exit(1)
  })

  client.on('connect', () => {
    console.log('🔗 正在连接 Redis...')
  })

  client.on('ready', () => {
    console.log('✅ Redis 客户端就绪')
  })

  try {
    console.log('\n📡 连接配置:')
    console.log(`   主机: ${process.env.REDIS_HOST || 'localhost'}`)
    console.log(`   端口: ${process.env.REDIS_PORT || 6379}`)
    console.log(`   密码: ${process.env.REDIS_PASSWORD ? '已设置' : '未设置'}`)
    console.log()

    await client.connect()
    console.log('✅ Redis 连接成功!\n')

    // 测试 1: PING
    console.log('📝 测试 1: PING 命令')
    console.log('-'.repeat(60))
    const pong = await client.ping()
    console.log(`   响应: ${pong}`)
    console.log('   ✅ PING 测试通过\n')

    // 测试 2: 写入数据
    console.log('📝 测试 2: 写入数据')
    console.log('-'.repeat(60))
    const testKey = 'test:connection:' + Date.now()
    const testValue = 'Hello Redis from Interview System!'
    await client.set(testKey, testValue)
    console.log(`   键: ${testKey}`)
    console.log(`   值: ${testValue}`)
    console.log('   ✅ 写入测试数据成功\n')

    // 测试 3: 读取数据
    console.log('📝 测试 3: 读取数据')
    console.log('-'.repeat(60))
    const value = await client.get(testKey)
    console.log(`   读取到的值: ${value}`)
    if (value === testValue) {
      console.log('   ✅ 读取测试数据成功，数据一致\n')
    } else {
      console.log('   ❌ 数据不一致\n')
      throw new Error('数据不一致')
    }

    // 测试 4: 设置 TTL
    console.log('📝 测试 4: 设置 TTL')
    console.log('-'.repeat(60))
    await client.expire(testKey, 300) // 5分钟
    const ttl = await client.ttl(testKey)
    console.log(`   TTL: ${ttl} 秒`)
    console.log('   ✅ TTL 设置成功\n')

    // 测试 5: 删除数据
    console.log('📝 测试 5: 删除数据')
    console.log('-'.repeat(60))
    await client.del(testKey)
    const deleted = await client.get(testKey)
    if (deleted === null) {
      console.log('   ✅ 清理测试数据完成\n')
    } else {
      console.log('   ❌ 删除失败\n')
    }

    // 测试 6: 查看会话键
    console.log('📝 测试 6: 查看现有会话')
    console.log('-'.repeat(60))
    const sessionKeys = await client.keys('interview:session:*')
    console.log(`   会话数量: ${sessionKeys.length}`)
    if (sessionKeys.length > 0) {
      console.log('   会话列表:')
      sessionKeys.forEach((key, index) => {
        console.log(`     ${index + 1}. ${key}`)
      })
    } else {
      console.log('   当前没有会话数据')
    }
    console.log('   ✅ 查询成功\n')

    // 测试 7: 获取 Redis 信息
    console.log('📝 测试 7: Redis 服务器信息')
    console.log('-'.repeat(60))
    const info = await client.info('server')
    const lines = info.split('\r\n')
    const versionLine = lines.find(line => line.startsWith('redis_version:'))
    const modeLine = lines.find(line => line.startsWith('redis_mode:'))
    console.log(`   ${versionLine}`)
    console.log(`   ${modeLine}`)
    console.log('   ✅ 信息获取成功\n')

    await client.quit()
    console.log('👋 已断开 Redis 连接')

    console.log('\n' + '='.repeat(60))
    console.log('🎉 所有测试通过! Redis 服务器工作正常!')
    console.log('='.repeat(60))
    console.log('\n📝 下一步:')
    console.log('   1. 重启后端服务器以使用 Redis')
    console.log('   2. 运行: node test-redis-session.js')
    console.log('   3. 查看后端日志应显示 "Redis 连接成功"\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('\n请检查:')
    console.error('   1. Redis 服务器是否运行')
    console.error('   2. 端口 6379 是否可访问')
    console.error('   3. 防火墙设置')
    console.error('   4. Redis 密码配置\n')
    try {
      await client.quit()
    } catch (e) {
      // ignore
    }
    process.exit(1)
  }
}

// 显示启动信息
console.log('启动时间:', new Date().toISOString())
console.log()

// 运行测试
testRedis()
