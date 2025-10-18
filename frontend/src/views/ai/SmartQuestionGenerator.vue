<template>
  <div class="smart-generator-container">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <div>
            <h2>🎯 智能专业题目生成器</h2>
            <p class="subtitle">基于 Dify AI 工作流，支持任意专业领域的智能题目生成</p>
          </div>
          <el-tag type="success" effect="dark">RAG 增强</el-tag>
        </div>
      </template>

      <!-- 工作流程说明 -->
      <el-alert
        type="info"
        :closable="false"
        class="workflow-info"
        show-icon
      >
        <template #title>
          <strong>工作流程</strong>
        </template>
        <ol class="workflow-steps">
          <li>输入任意专业名称（如：Python后端开发工程师、UI设计师、数据分析师等）</li>
          <li>AI 自动搜索该专业的岗位要求和核心技能</li>
          <li>生成5个高质量的开放性面试问题</li>
          <li>为每个问题生成详细的标准答案（通过 RAG 检索）</li>
        </ol>
      </el-alert>
    </el-card>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧：输入配置 -->
      <el-col :span="10">
        <el-card v-loading="generating">
          <template #header>
            <h3>📝 配置专业信息</h3>
          </template>

          <el-form :model="form" label-width="120px" label-position="top">
            <!-- 专业输入 - 支持自由输入和快速选择 -->
            <el-form-item label="专业/职位名称" required>
              <el-autocomplete
                v-model="form.jobTitle"
                :fetch-suggestions="querySearch"
                placeholder="请输入任意专业名称，如：前端开发工程师"
                clearable
                style="width: 100%"
                size="large"
                @select="handleSelect"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #default="{ item }">
                  <div class="suggestion-item">
                    <span class="icon">{{ item.icon }}</span>
                    <span class="label">{{ item.value }}</span>
                  </div>
                </template>
              </el-autocomplete>
              <div class="help-text">
                💡 支持输入任何专业或职位，系统会自动搜索相关信息
              </div>
            </el-form-item>

            <!-- 快速选择常用专业 -->
            <el-form-item label="常用专业快速选择">
              <div class="quick-tags">
                <el-tag
                  v-for="prof in popularProfessions"
                  :key="prof.value"
                  :type="form.jobTitle === prof.value ? 'primary' : 'info'"
                  class="quick-tag"
                  effect="plain"
                  size="large"
                  @click="selectProfession(prof.value)"
                >
                  {{ prof.icon }} {{ prof.label }}
                </el-tag>
              </div>
            </el-form-item>

            <!-- 生成按钮 -->
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="generating"
                :disabled="!form.jobTitle.trim()"
                style="width: 100%"
                @click="handleGenerate"
              >
                <el-icon v-if="!generating"><MagicStick /></el-icon>
                {{ generating ? '正在生成中...' : '🚀 开始生成面试题目' }}
              </el-button>
              <div class="help-text" style="margin-top: 10px; text-align: center;">
                预计耗时：30-60秒（包含搜索和AI生成）
              </div>
            </el-form-item>
          </el-form>

          <!-- 生成进度 -->
          <el-card v-if="generating" class="progress-card" shadow="never">
            <div class="progress-info">
              <div class="progress-step">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>{{ currentStep }}</span>
              </div>
              <el-progress
                :percentage="progress"
                :color="progressColor"
                :stroke-width="12"
              />
            </div>
          </el-card>

          <!-- 历史记录 -->
          <el-card v-if="generationHistory.length > 0" class="history-card" shadow="never">
            <template #header>
              <div class="history-header">
                <span>📚 最近生成</span>
                <el-button text size="small" @click="clearHistory">清空</el-button>
              </div>
            </template>
            <div class="history-list">
              <div
                v-for="(item, index) in generationHistory.slice(0, 5)"
                :key="index"
                class="history-item"
                @click="loadHistory(item)"
              >
                <span>{{ item.jobTitle }}</span>
                <span class="time">{{ formatTime(item.timestamp) }}</span>
              </div>
            </div>
          </el-card>
        </el-card>
      </el-col>

      <!-- 右侧：生成结果 -->
      <el-col :span="14">
        <el-card class="result-card">
          <template #header>
            <div class="result-header">
              <h3>✨ 生成结果</h3>
              <el-space v-if="result">
                <el-tag>{{ result.jobTitle }}</el-tag>
                <el-button type="primary" size="small" @click="handleExportQuestions">
                  导出题目
                </el-button>
              </el-space>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="!result" class="empty-state">
            <el-empty description="请在左侧输入专业信息并开始生成">
              <template #image>
                <div class="empty-icon">🎨</div>
              </template>
            </el-empty>
          </div>

          <!-- 结果展示 -->
          <div v-else class="result-content">
            <!-- 元信息 -->
            <el-alert type="success" :closable="false" class="meta-info">
              <template #title>
                <div class="meta-grid">
                  <div class="meta-item">
                    <span class="label">专业领域：</span>
                    <strong>{{ result.jobTitle }}</strong>
                  </div>
                  <div class="meta-item">
                    <span class="label">生成时间：</span>
                    <span>{{ formatDateTime(result.timestamp) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">题目数量：</span>
                    <strong>{{ result.questions.length }} 题</strong>
                  </div>
                  <div class="meta-item">
                    <span class="label">会话ID：</span>
                    <el-tooltip :content="result.sessionId">
                      <span class="session-id">{{ result.sessionId.substring(0, 8) }}...</span>
                    </el-tooltip>
                  </div>
                </div>
              </template>
            </el-alert>

            <!-- 题目列表 -->
            <div class="questions-list">
              <el-collapse v-model="activeQuestions" accordion>
                <el-collapse-item
                  v-for="(q, index) in result.questions"
                  :key="index"
                  :name="index"
                >
                  <template #title>
                    <div class="question-title">
                      <el-tag type="primary" size="small">Q{{ index + 1 }}</el-tag>
                      <span class="question-text">{{ q.question }}</span>
                    </div>
                  </template>

                  <div class="question-detail">
                    <div class="detail-section">
                      <h4>📌 问题</h4>
                      <p class="question-content">{{ q.question }}</p>
                    </div>

                    <el-divider />

                    <div class="detail-section">
                      <h4>✅ 标准答案</h4>
                      <div class="answer-content">{{ q.answer }}</div>
                    </div>

                    <el-divider />

                    <div class="detail-section actions">
                      <el-space>
                        <el-button size="small" @click="copyQuestion(q)">
                          <el-icon><CopyDocument /></el-icon>
                          复制题目
                        </el-button>
                        <el-button size="small" @click="copyAnswer(q)">
                          <el-icon><Document /></el-icon>
                          复制答案
                        </el-button>
                        <el-button
                          size="small"
                          type="primary"
                          @click="startInterview(q)"
                        >
                          <el-icon><VideoCamera /></el-icon>
                          开始面试
                        </el-button>
                      </el-space>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  MagicStick,
  Search,
  Loading,
  CopyDocument,
  Document,
  VideoCamera
} from '@element-plus/icons-vue'
import * as aiApi from '@/api/ai'
import difyService from '@/services/difyService'

const router = useRouter()

// 数据
const form = reactive({
  jobTitle: ''
})

const generating = ref(false)
const progress = ref(0)
const currentStep = ref('')
const result = ref(null)
const activeQuestions = ref([0])
const generationHistory = ref([])

// 推荐的常用专业（可快速选择，但不限制用户输入）
const popularProfessions = ref([
  { value: '前端开发工程师', label: '前端开发', icon: '🌐' },
  { value: 'Python后端开发工程师', label: 'Python后端', icon: '🐍' },
  { value: 'Java开发工程师', label: 'Java开发', icon: '☕' },
  { value: '数据分析师', label: '数据分析', icon: '📊' },
  { value: 'UI/UX设计师', label: 'UI设计', icon: '🎨' },
  { value: '产品经理', label: '产品经理', icon: '📋' },
  { value: 'DevOps工程师', label: 'DevOps', icon: '🔄' },
  { value: '算法工程师', label: '算法工程', icon: '🤖' }
])

// 所有可能的专业建议（用于自动完成）
const allProfessionsSuggestions = ref([
  ...popularProfessions.value,
  { value: '全栈开发工程师', label: '全栈开发', icon: '🔧' },
  { value: 'iOS开发工程师', label: 'iOS开发', icon: '📱' },
  { value: 'Android开发工程师', label: 'Android开发', icon: '🤖' },
  { value: '机器学习工程师', label: '机器学习', icon: '🧠' },
  { value: '深度学习工程师', label: '深度学习', icon: '🔬' },
  { value: '云计算工程师', label: '云计算', icon: '☁️' },
  { value: '网络安全工程师', label: '网络安全', icon: '🔒' },
  { value: '区块链工程师', label: '区块链', icon: '⛓️' },
  { value: '测试工程师', label: '测试工程', icon: '🧪' },
  { value: '运维工程师', label: '运维', icon: '⚙️' },
  { value: '项目经理', label: '项目管理', icon: '📈' },
  { value: '技术经理', label: '技术管理', icon: '👔' }
])

// 进度条颜色
const progressColor = computed(() => {
  if (progress.value < 30) return '#409eff'
  if (progress.value < 70) return '#67c23a'
  return '#f56c6c'
})

// 从 localStorage 加载历史记录
const loadHistoryFromStorage = () => {
  try {
    const stored = localStorage.getItem('smart_generation_history')
    if (stored) {
      generationHistory.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

// 保存历史记录到 localStorage
const saveHistoryToStorage = () => {
  try {
    localStorage.setItem('smart_generation_history', JSON.stringify(generationHistory.value))
  } catch (error) {
    console.error('保存历史记录失败:', error)
  }
}

// 自动完成搜索
const querySearch = (queryString, cb) => {
  const results = queryString
    ? allProfessionsSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase()) ||
        item.label.toLowerCase().includes(queryString.toLowerCase())
      )
    : allProfessionsSuggestions.value

  cb(results)
}

// 选择建议
const handleSelect = (item) => {
  form.jobTitle = item.value
}

// 快速选择专业
const selectProfession = (profession) => {
  form.jobTitle = profession
}

// 生成题目
const handleGenerate = async () => {
  if (!form.jobTitle.trim()) {
    ElMessage.warning('请输入专业名称')
    return
  }

  generating.value = true
  progress.value = 0
  result.value = null

  try {
    // 步骤 1: 准备调用
    currentStep.value = '准备调用 Dify 工作流...'
    progress.value = 10

    // 步骤 2: 调用 Dify 工作流生成题目
    currentStep.value = `正在搜索「${form.jobTitle}」相关信息...`
    progress.value = 20

    const response = await aiApi.callDifyWorkflow({
      requestType: 'generate_questions',
      jobTitle: form.jobTitle
    })

    progress.value = 50
    currentStep.value = '正在生成面试问题...'

    await new Promise(resolve => setTimeout(resolve, 1000))

    progress.value = 70
    currentStep.value = '正在为每个问题生成标准答案...'

    await new Promise(resolve => setTimeout(resolve, 1000))

    progress.value = 90
    currentStep.value = '整理结果...'

    if (response.code === 200 && response.data) {
      // 根据工作流1的返回格式解析数据
      // 期待格式: { session_id, questions (JSON string), job_title, question_count }
      const responseData = response.data

      // 解析questions JSON字符串
      let parsedQuestions = []
      if (responseData.questions_json) {
        try {
          parsedQuestions = JSON.parse(responseData.questions_json)
        } catch (e) {
          console.error('解析questions失败:', e)
          parsedQuestions = responseData.questions || []
        }
      } else if (responseData.questions) {
        parsedQuestions = responseData.questions
      }

      // 将新格式的questions转换为前端展示格式
      // 新格式: { id, question, hasAnswer, answer }
      // 前端格式: { question, answer }
      const formattedQuestions = parsedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        answer: q.answer || '标准答案生成中...',
        hasAnswer: q.hasAnswer || false
      }))

      // 构建结果
      result.value = {
        jobTitle: form.jobTitle,
        sessionId: responseData.session_id,
        timestamp: Date.now(),
        questions: formattedQuestions
      }

      // 保存到历史记录
      generationHistory.value.unshift({
        jobTitle: form.jobTitle,
        timestamp: Date.now(),
        sessionId: responseData.session_id
      })

      // 只保留最近10条
      if (generationHistory.value.length > 10) {
        generationHistory.value = generationHistory.value.slice(0, 10)
      }

      saveHistoryToStorage()

      progress.value = 100
      currentStep.value = '生成完成！'

      ElMessage.success({
        message: `成功生成 ${result.value.questions.length} 道面试题目`,
        duration: 3000
      })
    } else {
      throw new Error(response.message || '生成失败')
    }
  } catch (error) {
    console.error('生成失败:', error)
    ElMessage.error({
      message: `生成失败: ${error.message}`,
      duration: 5000
    })
  } finally {
    generating.value = false
    progress.value = 0
    currentStep.value = ''
  }
}

// 导出题目
const handleExportQuestions = () => {
  if (!result.value) return

  const content = {
    jobTitle: result.value.jobTitle,
    sessionId: result.value.sessionId,
    generatedAt: new Date(result.value.timestamp).toISOString(),
    questions: result.value.questions
  }

  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${result.value.jobTitle}-面试题目-${Date.now()}.json`
  link.click()
  window.URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 复制题目
const copyQuestion = async (question) => {
  try {
    await navigator.clipboard.writeText(question.question)
    ElMessage.success('题目已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 复制答案
const copyAnswer = async (question) => {
  try {
    await navigator.clipboard.writeText(question.answer)
    ElMessage.success('答案已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 开始面试
const startInterview = (question) => {
  // 这里可以跳转到面试页面，并传递问题和sessionId
  ElMessage.info('面试功能开发中...')
  // TODO: 实现跳转到面试页面
  // router.push({
  //   path: '/interview/session',
  //   query: {
  //     question: question.question,
  //     sessionId: result.value.sessionId
  //   }
  // })
}

// 加载历史记录
const loadHistory = (item) => {
  form.jobTitle = item.jobTitle
  ElMessage.info(`已加载：${item.jobTitle}`)
}

// 清空历史
const clearHistory = () => {
  ElMessageBox.confirm('确定要清空所有历史记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    generationHistory.value = []
    saveHistoryToStorage()
    ElMessage.success('历史记录已清空')
  }).catch(() => {})
}

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 初始化
loadHistoryFromStorage()
</script>

<style scoped>
.smart-generator-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.workflow-info {
  margin-top: 20px;
}

.workflow-steps {
  margin: 10px 0 0 0;
  padding-left: 20px;
  line-height: 1.8;
}

.workflow-steps li {
  margin-bottom: 5px;
}

.main-content {
  margin-top: 20px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.suggestion-item .icon {
  font-size: 18px;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px 16px;
  font-size: 14px;
}

.quick-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-card {
  margin-top: 20px;
  background: #f5f7fa;
}

.progress-info {
  padding: 10px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
}

.history-card {
  margin-top: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item .time {
  font-size: 12px;
  color: #909399;
}

.result-card {
  min-height: 600px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h3 {
  margin: 0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-icon {
  font-size: 80px;
}

.result-content {
  padding: 10px 0;
}

.meta-info {
  margin-bottom: 20px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.meta-item .label {
  color: #909399;
}

.session-id {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
}

.questions-list {
  margin-top: 20px;
}

.question-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.question-text {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.question-detail {
  padding: 20px;
  background: #f9fafc;
  border-radius: 8px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.question-content {
  margin: 0;
  line-height: 1.8;
  font-size: 15px;
  color: #303133;
}

.answer-content {
  line-height: 1.8;
  font-size: 14px;
  color: #606266;
  white-space: pre-wrap;
  background: white;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #67c23a;
}

.detail-section.actions {
  margin-top: 15px;
}
</style>
