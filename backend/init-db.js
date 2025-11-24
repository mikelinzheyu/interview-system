/**
 * 初始化数据库 - 创建数据库并同步表
 */

const mysql = require('mysql2/promise')
require('dotenv').config()

async function initDatabase() {
  let connection
  try {
    console.log('📊 正在初始化数据库...')

    // 第一步：连接到MySQL（不指定数据库）
    console.log('\n[Step 1] 连接到MySQL服务器...')
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root'
    })
    console.log('✅ MySQL连接成功')

    // 第二步：创建数据库
    const dbName = process.env.DB_NAME || 'interview_system'
    console.log(`\n[Step 2] 创建数据库 '${dbName}'...`)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    console.log(`✅ 数据库 '${dbName}' 已创建或已存在`)

    await connection.end()

    // 第三步：使用Sequelize同步表
    console.log('\n[Step 3] 同步数据库表...')
    // 重要：使用共享的Sequelize实例，这样模型会被正确注册
    const sequelize = require('./config/database')

    // 加载模型（会在共享实例上注册）
    const { AIConversation, AIMessage } = require('./models')

    // 现在与已注册的模型同步
    await sequelize.sync({ alter: true })
    console.log('✅ 数据库表同步成功')

    // 验证
    console.log('\n[Step 4] 验证数据库...')
    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log('✅ 数据库表列表:', tables)

    console.log('\n✅ 数据库初始化完成！')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    if (error.stack) {
      console.error('📋 堆栈跟踪:', error.stack)
    }
    process.exit(1)
  }
}

initDatabase()
