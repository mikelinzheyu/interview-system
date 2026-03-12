<template>
  <div class="report-container">
    <!-- 头部 -->
    <div class="report-header">
      <el-card class="header-card">
        <div class="header-content">
          <div class="header-left">
            <h1>面试报告</h1>
            <div class="meta-info">
              <el-tag type="info" size="small">{{ report.profession || '综合面试' }}</el-tag>
              <el-tag type="info" size="small">{{ report.difficulty || '中级' }}</el-tag>
              <span class="duration">
                <el-icon><Clock /></el-icon>
                用时 {{ formatTime(report.duration) }}
              </span>
              <span class="date">{{ formatDate(report.endTime) }}</span>
            </div>
          </div>
          <div class="header-right">
            <div class="overall-score-circle" :style="{ '--score-color': getScoreColor(report.overallScore) }">
              <span class="score-num">{{ report.overallScore }}</span>
              <span class="score-label">综合评分</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 能力雷达 / 三项评分 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8">
        <el-card class="score-card">
          <div class="score-card-inner">
            <el-icon size="32" color="#409EFF"><Cpu /></el-icon>
            <div class="score-card-value">{{ report.technicalScore }}</div>
            <div class="score-card-label">技术能力</div>
            <el-progress
              :percentage="report.technicalScore"
              :color="getScoreColor(report.technicalScore)"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="score-card">
          <div class="score-card-inner">
            <el-icon size="32" color="#67C23A"><ChatDotRound /></el-icon>
            <div class="score-card-value">{{ report.communicationScore }}</div>
            <div class="score-card-label">表达能力</div>
            <el-progress
              :percentage="report.communicationScore"
              :color="getScoreColor(report.communicationScore)"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="score-card">
          <div class="score-card-inner">
            <el-icon size="32" color="#E6A23C"><Connection /></el-icon>
            <div class="score-card-value">{{ report.logicalScore }}</div>
            <div class="score-card-label">逻辑思维</div>
            <el-progress
              :percentage="report.logicalScore"
              :color="getScoreColor(report.logicalScore)"
              :stroke-width="6"
              :show-text="false"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 题目逐题详情 -->
    <el-card style="margin-bottom: 20px;">
      <template #header>
        <div class="card-header">
          <span>逐题详情</span>
          <el-tag size="small" type="info">共 {{ report.answers.length }} 题</el-tag>
        </div>
      </template>

      <div v-if="report.answers.length === 0" class="empty-answers">
        <el-empty description="本次面试未提交任何回答" />
      </div>

      <div
        v-for="(item, index) in report.answers"
        :key="index"
        class="answer-item"
      >
        <div class="answer-item-header">
          <span class="question-num">第 {{ index + 1 }} 题</span>
          <el-tag size="small" :type="getScoreTagType(item.analysis?.overallScore)">
            {{ item.analysis?.overallScore ?? '-' }} 分
          </el-tag>
          <el-tag size="small" type="info">{{ item.profession || report.profession }}</el-tag>
        </div>
        <div class="question-text">{{ item.question }}</div>
        <el-collapse class="answer-collapse">
          <el-collapse-item title="查看我的回答 & AI分析">
            <div class="answer-body">
              <div class="my-answer">
                <h4>我的回答</h4>
                <p>{{ item.answer || '（未录入回答）' }}</p>
              </div>
              <el-divider />
              <div v-if="item.analysis" class="analysis-detail">
                <div class="analysis-summary-text">
                  <h4>AI总结</h4>
                  <p>{{ item.analysis.summary }}</p>
                </div>
                <div v-if="item.analysis.suggestions?.length" class="suggestions-list">
                  <h4>改进建议</h4>
                  <ul>
                    <li v-for="s in item.analysis.suggestions" :key="s">{{ s }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>

    <!-- 整体建议 -->
    <el-card style="margin-bottom: 20px;">
      <template #header><span>综合建议</span></template>
      <div v-if="report.globalSuggestions.length">
        <el-alert
          v-for="(s, i) in report.globalSuggestions"
          :key="i"
          :title="s"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 10px;"
        />
      </div>
      <el-empty v-else description="本次面试表现良好，继续保持！" />
    </el-card>

    <!-- 操作按钮 -->
    <div class="report-actions">
      <el-button size="large" @click="goBack">返回首页</el-button>
      <el-button type="primary" size="large" @click="restartInterview">再次面试</el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, ChatDotRound, Connection, Cpu } from '@element-plus/icons-vue'

export default {
  name: 'InterviewReport',
  components: { Clock, ChatDotRound, Connection, Cpu },
  setup() {
    const route = useRoute()
    const router = useRouter()

    // 从路由 state 接收面试数据
    const sessionData = history.state?.sessionData || null

    const report = computed(() => {
      if (!sessionData) {
        return {
          profession: '',
          difficulty: '',
          overallScore: 0,
          technicalScore: 0,
          communicationScore: 0,
          logicalScore: 0,
          duration: 0,
          endTime: new Date(),
          answers: [],
          globalSuggestions: []
        }
      }

      const answers = sessionData.answers || []

      // 计算综合分
      const scoredAnswers = answers.filter(a => a.analysis?.overallScore != null)
      const avgOverall = scoredAnswers.length
        ? Math.round(scoredAnswers.reduce((sum, a) => sum + a.analysis.overallScore, 0) / scoredAnswers.length)
        : 0
      const avgTechnical = scoredAnswers.length
        ? Math.round(scoredAnswers.reduce((sum, a) => sum + (a.analysis.technicalScore || 0), 0) / scoredAnswers.length)
        : 0
      const avgCommunication = scoredAnswers.length
        ? Math.round(scoredAnswers.reduce((sum, a) => sum + (a.analysis.communicationScore || 0), 0) / scoredAnswers.length)
        : 0
      const avgLogical = scoredAnswers.length
        ? Math.round(scoredAnswers.reduce((sum, a) => sum + (a.analysis.logicalScore || 0), 0) / scoredAnswers.length)
        : 0

      // 汇总所有建议（去重）
      const allSuggestions = [...new Set(
        answers.flatMap(a => a.analysis?.suggestions || [])
      )]

      return {
        profession: sessionData.jobTitle || sessionData.profession || '',
        difficulty: sessionData.difficulty || '',
        overallScore: avgOverall,
        technicalScore: avgTechnical,
        communicationScore: avgCommunication,
        logicalScore: avgLogical,
        duration: sessionData.duration || 0,
        endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(),
        answers,
        globalSuggestions: allSuggestions.slice(0, 5)
      }
    })

    const getScoreColor = (score) => {
      if (score >= 85) return '#67c23a'
      if (score >= 70) return '#e6a23c'
      return '#f56c6c'
    }

    const getScoreTagType = (score) => {
      if (score == null) return 'info'
      if (score >= 85) return 'success'
      if (score >= 70) return 'warning'
      return 'danger'
    }

    const formatTime = (seconds) => {
      if (!seconds) return '0分0秒'
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}分${s}秒`
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }

    const goBack = () => router.push('/')
    const restartInterview = () => router.push('/interview/ai')

    return {
      report,
      getScoreColor,
      getScoreTagType,
      formatTime,
      formatDate,
      goBack,
      restartInterview,
      Clock, ChatDotRound, Connection, Cpu
    }
  }
}
</script>

<style scoped>
.report-container {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 12px;
  font-size: 24px;
  color: #303133;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.duration, .date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.overall-score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid var(--score-color, #409EFF);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
}

.score-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--score-color, #409EFF);
  line-height: 1;
}

.score-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.score-card {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.score-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.score-card-value {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.score-card-label {
  font-size: 13px;
  color: #606266;
}

.score-card-inner .el-progress {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-answers {
  padding: 20px 0;
}

.answer-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafbfc;
}

.answer-item:last-child {
  margin-bottom: 0;
}

.answer-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.question-num {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.question-text {
  font-size: 15px;
  color: #303133;
  line-height: 1.6;
  font-weight: 500;
  margin-bottom: 10px;
}

.answer-collapse {
  border: none;
}

.answer-body {
  padding: 4px 0;
}

.my-answer h4, .analysis-detail h4 {
  font-size: 13px;
  color: #606266;
  margin: 0 0 8px;
}

.my-answer p {
  color: #303133;
  line-height: 1.7;
  font-size: 14px;
}

.analysis-summary-text p {
  color: #606266;
  line-height: 1.7;
  font-size: 14px;
}

.suggestions-list ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions-list li {
  color: #606266;
  line-height: 1.7;
  font-size: 14px;
  margin-bottom: 4px;
}

.report-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-bottom: 40px;
}
</style>
