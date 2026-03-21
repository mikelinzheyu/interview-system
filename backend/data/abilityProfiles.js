/**
 * Ability profile mock data for cross-domain capability analysis.
 * This is used by the Express backend (routes/api.js) so that
 * Phase 3 ability pages work even when the full mock-server.js
 * is not running.
 */

/**
 * In a real production setup this data should come from a database
 * or analytics service. For now we keep a single in-memory profile
 * that matches the frontend's expectations.
 */
const userAbilityProfiles = [
  {
    userId: 1,

    // Primary domain summary
    primaryDomain: {
      domainId: 1,
      domainName: '计算机科学',
      score: 850,
      level: 'advanced',
      percentile: 0.85
    },

    // Per-domain scores
    domainScores: {
      1: {
        domainId: 1,
        domainName: '计算机科学',
        totalScore: 850,
        questionsAttempted: 120,
        questionsCorrect: 95,
        accuracy: 0.79,
        level: 'advanced'
      },
      2: {
        domainId: 2,
        domainName: '金融学',
        totalScore: 320,
        questionsAttempted: 45,
        questionsCorrect: 28,
        accuracy: 0.62,
        level: 'intermediate'
      },
      3: {
        domainId: 3,
        domainName: '医学',
        totalScore: 150,
        questionsAttempted: 20,
        questionsCorrect: 12,
        accuracy: 0.6,
        level: 'beginner'
      },
      4: {
        domainId: 4,
        domainName: '法律',
        totalScore: 200,
        questionsAttempted: 28,
        questionsCorrect: 18,
        accuracy: 0.64,
        level: 'beginner'
      },
      5: {
        domainId: 5,
        domainName: '管理学',
        totalScore: 280,
        questionsAttempted: 35,
        questionsCorrect: 22,
        accuracy: 0.63,
        level: 'intermediate'
      }
    },

    // T-shaped talent analysis
    tShapeAnalysis: {
      index: 0.73,
      type: 'T-shaped',
      depthScore: 850,
      breadthScore: 950,
      balance: 0.89,
      strengths: [
        '在计算机科学领域拥有扎实的理论基础和实践经验',
        '算法与系统设计能力突出，能独立完成复杂系统设计'
      ],
      weaknesses: [
        '医学与法律等跨学科领域仍处于入门阶段',
        '需要进一步提升金融与管理相关的综合应用能力'
      ]
    },

    // High-level learning recommendations (used by cross-domain endpoint)
    recommendations: [
      {
        type: 'strengthen_depth',
        domainId: 1,
        domainName: '计算机科学',
        suggestion: '继续深化核心领域的专业能力，系统学习高阶算法、分布式系统与性能优化相关课程。',
        learningPaths: [1],
        priority: 'high'
      },
      {
        type: 'expand_breadth',
        domainId: 3,
        domainName: '医学',
        suggestion: '适度拓展医学相关基础知识，了解医疗行业常见业务与数据特点，提升跨学科协作能力。',
        learningPaths: [],
        priority: 'medium'
      },
      {
        type: 'maintain_balance',
        domainId: 2,
        domainName: '金融学',
        suggestion: '保持对金融与管理领域的持续关注，定期复盘相关知识，维持当前综合能力结构的平衡。',
        learningPaths: [2],
        priority: 'medium'
      }
    ],

    lastUpdated: '2024-09-25T10:00:00Z'
  }
]

function getUserAbilityProfile(userId) {
  const numericId = Number(userId)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null
  }
  return userAbilityProfiles.find((p) => p.userId === numericId) || null
}

module.exports = {
  userAbilityProfiles,
  getUserAbilityProfile
}

