/**
 * 初始化数据库 - 创建数据库并同步表
 */

const mysql = require('mysql2/promise')
const { Sequelize } = require('sequelize')
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
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'interview_system',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || 'root',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql'
      }
    )

    const { AIConversation, AIMessage } = require('./models')
    
    await sequelize.sync({ alter: true })
    console.log('✅ 数据库表同步成功')

    // 验证
    console.log('\n[Step 4] 验证数据库...')
    const tables = await sequelize.getQueryInterface().showAllTables()
    console.log('✅ 数据库表列表:', tables)

    await sequelize.close()
    console.log('\n✅ 数据库初始化完成！')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  }
}

initDatabase()
