/**
 * AI 消息模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const AIMessage = sequelize.define('ai_message', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '消息ID'
  },
  conversationId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '所属对话ID',
    index: true
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false,
    comment: '消息角色'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '消息内容'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'ai_messages',
  timestamps: true,
  comment: 'AI对话消息记录',
  indexes: [
    {
      fields: ['conversationId', 'createdAt'],
      name: 'idx_conv_created'
    }
  ]
})

module.exports = AIMessage
