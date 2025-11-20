/**
 * AI 对话模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const AIConversation = sequelize.define('ai_conversation', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    comment: '对话唯一标识'
  },
  postId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '所属文章ID',
    index: true
  },
  userId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '用户ID',
    index: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '对话标题/第一条消息摘要'
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '消息总数'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否激活（软删除）',
    index: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'ai_conversations',
  timestamps: true,
  comment: '用户与AI的对话记录',
  indexes: [
    {
      fields: ['postId', 'userId', 'isActive'],
      name: 'idx_post_user_active'
    }
  ]
})

module.exports = AIConversation
