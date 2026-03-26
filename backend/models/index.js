/**
 * 数据模型索引文件
 */

const AIConversation = require('./AIConversation')
const AIMessage = require('./AIMessage')
const OAuthConnection = require('./OAuthConnection')
const InterviewRecord = require('./InterviewRecord')
const WrongAnswerReview = require('./WrongAnswerReview')

module.exports = {
  AIConversation,
  AIMessage,
  OAuthConnection,
  InterviewRecord,
  WrongAnswerReview
}

