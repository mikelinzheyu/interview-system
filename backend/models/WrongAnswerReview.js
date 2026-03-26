/**
 * 错题复盘记录模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const WrongAnswerReview = sequelize.define('wrong_answer_review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: '复盘记录ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
    index: true
  },
  recordId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '关联的面试记录ID',
    index: true
  },
  questionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '问题ID'
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '问题内容'
  },
  originalAnswer: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '原始答案'
  },
  originalScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '原始得分'
  },
  retryAnswers: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '复盘重试记录 [{attempt, userAnswer, score, notes, timestamp}]'
  },
  masterLevel: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: '掌握度：0-100'
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '复盘次数'
  },
  learningNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '学习笔记'
  },
  lastReviewAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后复盘时间'
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
  tableName: 'wrong_answer_reviews',
  timestamps: true,
  comment: '错题复盘记录表',
  indexes: [
    {
      fields: ['userId', 'recordId'],
      name: 'idx_user_record'
    },
    {
      fields: ['userId', 'lastReviewAt'],
      name: 'idx_user_review_time'
    }
  ]
})

module.exports = WrongAnswerReview
