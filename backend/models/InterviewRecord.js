/**
 * 面试记录模型
 */

const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const InterviewRecord = sequelize.define('interview_record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: '面试记录ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
    index: true
  },
  jobTitle: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '岗位名称'
  },
  difficulty: {
    type: DataTypes.STRING(50),
    defaultValue: '中级',
    comment: '难度等级：初级/中级/高级'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '面试耗时（秒）'
  },
  answers: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '问答记录 JSON'
  },
  overallScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '综合评分'
  },
  technicalScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '技术评分'
  },
  communicationScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '表达评分'
  },
  logicalScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '逻辑评分'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '面试总结'
  },
  suggestions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '改进建议 JSON'
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
  tableName: 'interview_records',
  timestamps: true,
  comment: '面试记录表',
  indexes: [
    {
      fields: ['userId', 'createdAt'],
      name: 'idx_user_created'
    }
  ]
})

module.exports = InterviewRecord
