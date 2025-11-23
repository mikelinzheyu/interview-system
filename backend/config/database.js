/**
 * Sequelize 数据库配置
 * 企业级配置：连接池、日志、同步等
 */

require('dotenv').config()
const { Sequelize } = require('sequelize')
const path = require('path')

const sequelize = new Sequelize(
  process.env.DB_NAME || 'interview_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Sequelize] ${msg}`)
      }
    },
    timezone: '+08:00',
    dialectOptions: {
      decimalNumbers: true,
      supportBigNumbers: true
    }
  }
)

// 测试连接
sequelize.authenticate()
  .then(() => {
    console.log('✅ 数据库连接成功')
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err)
  })

module.exports = sequelize
