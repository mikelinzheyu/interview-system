<template>
  <ErrorBoundary @error="handleError" @retry="retryOperation">
    <div class="ai-interview-container">
      <div class="interview-header">
        <el-card class="header-card">
          <!-- 流程指示器 -->
          <div class="flow-indicator">
            <div class="flow-steps">
              <div
                v-for="(step, index) in flowState.steps"
                :key="step.id"
                class="flow-step"
                :class="{
                  'active': flowState.currentStep === index,
                  'completed': step.completed,
                  'pending': step.status === 'pending'
                }"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-name">{{ step.name }}</div>
                <div class="step-description">{{ step.description }}</div>
              </div>
            </div>
          </div>

          <div class="header-content">
            <div class="interview-info">
              <h2>AI智能面试</h2>
              <div class="status-row">
                <el-button
                  :type="statusButtonType"
                  size="large"
                  :disabled="isProcessing"
                  :loading="isStarting"
                  class="status-button"
                  @click="handleStatusClick"
                >
                  <el-icon v-if="statusIcon" class="status-icon">
                    <component :is="statusIcon" />
                  </el-icon>
                  {{ statusText }}
                </el-button>
                <div v-if="interviewTimer > 0" class="interview-timer">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(interviewTimer) }}
                </div>
              </div>
            </div>
            <div class="interview-controls">
              <el-button-group>
                <el-button
                  :type="cameraEnabled ? 'success' : 'info'"
                  :icon="cameraEnabled ? VideoPause : VideoPlay"
                  :disabled="isProcessing"
                  @click="toggleCamera"
                >
                  {{ cameraEnabled ? '关闭摄像头' : '开启摄像头' }}
                </el-button>
                <el-button
                  :type="isListening ? 'warning' : 'primary'"
                  :icon="isListening ? Microphone : Microphone"
                  :disabled="!cameraEnabled || isProcessing"
                  :loading="isProcessing"
                  @click="toggleSpeechRecognition"
                >
                  {{ isListening ? '停止录音' : '开始录音' }}
                </el-button>
              </el-button-group>
              <el-button
                v-if="interviewSession.status === 'active'"
                type="danger"
                style="margin-left: 12px"
                @click="endInterview"
              >
                结束面试
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="interview-main">
        <!-- 智能专业题目生成版块 -->
        <el-row style="margin-bottom: 20px;">
          <el-col :span="24">
            <el-card class="profession-search-card">
              <template #header>
                <div class="card-header">
                  <span>🎯 智能专业题目生成</span>
                  <el-tag size="small" type="success">AI驱动</el-tag>
                </div>
              </template>
              <div class="profession-search-content">
                <div class="search-input-group">
                  <el-autocomplete
                    v-model="selectedProfession"
                    :fetch-suggestions="queryProfessionSuggestions"
                    placeholder="输入任意专业名称，如：前端开发工程师"
                    clearable
                    class="profession-select"
                    size="large"
                    @select="handleProfessionChange"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                    <template #default="{ item }">
                      <div class="suggestion-item">
                        <span class="icon">{{ item.icon }}</span>
                        <span class="label">{{ item.label }}</span>
                      </div>
                    </template>
                  </el-autocomplete>
                  <el-select
                    v-model="selectedDifficulty"
                    placeholder="难度"
                    class="difficulty-select"
                    size="large"
                  >
                    <el-option label="初级" value="初级"></el-option>
                    <el-option label="中级" value="中级"></el-option>
                    <el-option label="高级" value="高级"></el-option>
                  </el-select>
                  <el-button
                    type="primary"
                    :loading="smartQuestionLoading"
                    :disabled="!selectedProfession || !selectedProfession.trim()"
                    class="generate-btn"
                    size="large"
                    @click="generateSmartQuestion"
                  >
                    <el-icon><MagicStick /></el-icon>
                    智能生成题目
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 视频监控和面试问题版块 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="video-card">
              <template #header>
                <div class="card-header">
                  <span>视频监控</span>
                  <el-tag v-if="cameraEnabled" type="success" size="small">
                    <el-icon><VideoCamera /></el-icon>
                    摄像头已启用
                  </el-tag>
                </div>
              </template>
              <div class="video-container">
                <video
                  ref="videoElement"
                  class="video-preview"
                  autoplay
                  muted
                  playsinline
                ></video>
                <div v-if="!cameraEnabled" class="video-placeholder">
                  <el-icon size="60"><VideoCamera /></el-icon>
                  <p>点击开启摄像头</p>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="question-card">
              <template #header>
                <div class="card-header">
                  <span>面试问题</span>
                  <div class="question-actions">
                    <!-- 题目进度显示 -->
                    <el-tag v-if="questionQueue.length > 0" size="small" type="info">
                      第 {{ currentQuestionIndex + 1 }} / {{ questionQueue.length }} 题
                    </el-tag>
                    <el-button
                      v-if="currentQuestion && currentQuestion.generatedBy === 'dify_workflow'"
                      size="small"
                      type="success"
                      disabled
                    >
                      <el-icon><Star /></el-icon>
                      AI智能生成
                    </el-button>
                    <!-- 下一题/生成新题按钮 -->
                    <el-button
                      type="primary"
                      size="small"
                      :loading="questionLoading"
                      @click="handleNextQuestion"
                    >
                      {{ hasMoreQuestions ? '下一题' : '生成新题' }}
                    </el-button>
                  </div>
                </div>
              </template>
              <div class="question-content">
                <div v-if="currentQuestion" class="question">
                  <h3>{{ currentQuestion.question }}</h3>
                  <el-divider />
                  <div class="question-info">
                    <el-tag size="small">{{ currentQuestion.category || '综合能力' }}</el-tag>
                    <el-tag size="small" type="info">难度: {{ currentQuestion.difficulty || '中等' }}</el-tag>
                  </div>
                </div>
                <div v-else class="question-placeholder">
                  <el-empty description="点击生成问题开始面试" />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card class="speech-card">
              <template #header>
                <div class="card-header">
                  <span>语音识别</span>
                  <el-tag
                    v-if="isListening"
                    type="warning"
                    class="listening-indicator"
                    effect="dark"
                  >
                    <el-icon class="pulse"><Microphone /></el-icon>
                    正在录音...
                  </el-tag>
                </div>
              </template>
              <div class="speech-content">
                <div class="transcript-area">
                  <div v-if="finalTranscript" class="final-transcript">
                    <h4>最终文本：</h4>
                    <p>{{ finalTranscript }}</p>
                  </div>
                  <div v-if="interimTranscript && isListening" class="interim-transcript">
                    <h4>实时识别：</h4>
                    <p class="interim-text">{{ interimTranscript }}</p>
                  </div>
                  <div v-if="!finalTranscript && !interimTranscript" class="transcript-placeholder">
                    <el-icon><Microphone /></el-icon>
                    <p>开始录音后，语音识别结果将显示在这里</p>
                  </div>
                </div>
                <div class="speech-controls">
                  <el-button
                    v-if="finalTranscript"
                    type="primary"
                    :loading="analysisLoading"
                    :disabled="!currentQuestion"
                    @click="analyzeAnswer"
                  >
                    分析回答
                  </el-button>
                  <el-button
                    v-if="finalTranscript"
                    :disabled="analysisLoading"
                    @click="clearTranscript"
                  >
                    清空文本
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span>AI分析结果</span>
                  <div v-if="questionQueue.length > 0" class="question-counter">
                    <el-tag size="small" type="info">
                      已回答 {{ interviewSession.answers.length }} / {{ questionQueue.length }} 题
                    </el-tag>
                  </div>
                </div>
              </template>
              <div class="analysis-content">
                <LoadingSpinner v-if="analysisLoading" text="AI正在分析您的回答..." />
                <div v-else-if="analysisResult" class="analysis-result">
                  <div class="overall-score">
                    <el-progress
                      :percentage="analysisResult.overallScore || analysisResult.overall?.score || 0"
                      :color="getScoreColor(analysisResult.overallScore || analysisResult.overall?.score || 0)"
                      :stroke-width="20"
                      text-inside
                    >
                      <template #default="{ percentage }">
                        {{ percentage }}分
                      </template>
                    </el-progress>
                  </div>

                  <el-divider />

                  <!-- 简化的能力评估 -->
                  <div class="simplified-scores">
                    <div class="score-item">
                      <span>技术能力:</span>
                      <el-progress
                        :percentage="analysisResult.technicalScore || 0"
                        :color="getScoreColor(analysisResult.technicalScore || 0)"
                        :stroke-width="8"
                        :show-text="true"
                      />
                    </div>
                    <div class="score-item">
                      <span>表达能力:</span>
                      <el-progress
                        :percentage="analysisResult.communicationScore || 0"
                        :color="getScoreColor(analysisResult.communicationScore || 0)"
                        :stroke-width="8"
                        :show-text="true"
                      />
                    </div>
                    <div class="score-item">
                      <span>逻辑思维:</span>
                      <el-progress
                        :percentage="analysisResult.logicalScore || 0"
                        :color="getScoreColor(analysisResult.logicalScore || 0)"
                        :stroke-width="8"
                        :show-text="true"
                      />
                    </div>
                  </div>

                  <!-- AI分析引擎信息 -->
                  <div v-if="analysisResult.difyAnalysis" class="analysis-meta">
                    <el-divider />
                    <div class="analysis-engine-info">
                      <el-tag type="success" size="small">
                        <el-icon><MagicStick /></el-icon>
                        Dify AI工作流分析
                      </el-tag>
                      <span v-if="analysisResult.processingTime" class="processing-time">
                        处理时间: {{ analysisResult.processingTime }}ms
                      </span>
                    </div>
                  </div>

                  <el-divider />

                  <div class="analysis-summary">
                    <h4>总结:</h4>
                    <p>{{ analysisResult.summary || analysisResult.overall?.summary || '分析完成' }}</p>
                  </div>

                  <div v-if="analysisResult.suggestions?.length" class="suggestions">
                    <h4>改进建议:</h4>
                    <ul>
                      <li v-for="suggestion in analysisResult.suggestions" :key="suggestion">
                        {{ suggestion }}
                      </li>
                    </ul>
                  </div>
                </div>
                <div v-else class="analysis-placeholder">
                  <el-icon><ChatDotRound /></el-icon>
                  <p>回答问题后，AI分析结果将显示在这里</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </ErrorBoundary>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoPlay,
  VideoPause,
  Microphone,
  VideoCamera,
  ChatDotRound,
  Clock,
  CaretRight,    // 替代 Play
  Select,        // 替代 Check
  WarningFilled, // 替代 Warning
  Loading,       // Loading 应该存在
  MagicStick,    // 魔法棒图标
  Star,          // 星星图标
  Search         // 搜索图标
} from '@element-plus/icons-vue'
import MediaUtils from '@/utils/mediaUtils'
import SpeechUtils from '@/utils/speechUtils'
import aiAnalysisService from '@/services/aiAnalysisService'
import difyService from '@/services/difyService'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

export default {
  name: 'AIInterviewSession',
  components: {
    VideoPlay,
    VideoPause,
    Microphone,
    VideoCamera,
    ChatDotRound,
    LoadingSpinner,
    ErrorBoundary
  },
  setup() {
    // 基础状态
    const cameraEnabled = ref(false)
    const isListening = ref(false)
    const isProcessing = ref(false)
    const questionLoading = ref(false)
    const analysisLoading = ref(false)
    const isStarting = ref(false)
    const smartQuestionLoading = ref(false)

    // 专业搜索相关数据
    const selectedProfession = ref('')
    const selectedDifficulty = ref('中级')
    const recommendedProfessions = ref(difyService.getRecommendedProfessions())

    // 常用专业（用于快速选择）
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

    // 所有专业建议（用于自动完成）
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
      { value: '运维工程师', label: '运维', icon: '⚙️' }
    ])

    // 媒体相关
    const videoElement = ref(null)

    // 语音识别
    const finalTranscript = ref('')
    const interimTranscript = ref('')

    // 面试数据
    const currentQuestion = ref(null)
    const analysisResult = ref(null)
    const currentQuestionIndex = ref(0) // 当前题目在队列中的索引
    const questionQueue = ref([]) // 题目队列（从工作流获取的5道题）
    const interviewSession = reactive({
      id: Date.now(),
      sessionId: null,
      jobTitle: '',
      questions: [],
      answers: [],
      allQuestions: [],
      startTime: null,
      endTime: null,
      status: 'idle' // idle, active, paused, completed
    })

    // 引导流程状态管理
    const flowState = reactive({
      currentStep: 0,
      steps: [
        {
          id: 'preparation',
          name: '面试准备',
          status: 'active', // 第一步默认激活
          description: '检查设备，准备开始面试',
          action: '点击准备面试',
          completed: false
        },
        {
          id: 'systemCheck',
          name: '系统检查',
          status: 'pending',
          description: '检查摄像头和麦克风权限',
          action: '点击检查设备',
          completed: false
        },
        {
          id: 'interview',
          name: '开始面试',
          status: 'pending',
          description: '正式开始AI面试流程',
          action: '点击开始面试',
          completed: false
        },
        {
          id: 'analysis',
          name: '结果分析',
          status: 'pending',
          description: '面试完成，查看分析结果',
          action: '查看结果',
          completed: false
        }
      ],
      canProgress: true,
      showGuideModal: false,
      currentGuideContent: null
    })

    // 错误状态
    const error = ref(null)
    const hasError = ref(false)

    // 面试计时器
    const interviewTimer = ref(0)
    const timerInterval = ref(null)

    // 计算属性
    const statusText = computed(() => {
      if (isStarting.value) return '正在启动...'
      if (isProcessing.value) return '处理中...'
      if (isListening.value) return '正在录音'

      // 基于引导流程的状态文本
      const currentStepData = flowState.steps[flowState.currentStep]
      if (currentStepData && !currentStepData.completed) {
        return currentStepData.action
      }

      if (cameraEnabled.value) {
        return currentQuestion.value ? '准备就绪' : '点击生成问题'
      }
      return '点击开始面试'
    })

    const statusButtonType = computed(() => {
      if (isStarting.value) return 'info'
      if (isProcessing.value) return 'warning'
      if (isListening.value) return 'danger'

      // 基于引导流程的按钮类型
      const currentStepData = flowState.steps[flowState.currentStep]
      if (currentStepData) {
        switch(currentStepData.id) {
          case 'preparation': return 'primary'
          case 'systemCheck': return 'warning'
          case 'interview': return 'success'
          case 'analysis': return 'info'
          default: return 'primary'
        }
      }

      if (cameraEnabled.value) return currentQuestion.value ? 'success' : 'primary'
      return 'primary'
    })

    const statusIcon = computed(() => {
      if (isStarting.value || isProcessing.value) return Loading
      if (isListening.value) return Microphone

      // 基于引导流程的图标
      const currentStepData = flowState.steps[flowState.currentStep]
      if (currentStepData) {
        switch(currentStepData.id) {
          case 'preparation': return Clock
          case 'systemCheck': return VideoCamera
          case 'interview': return ChatDotRound
          case 'analysis': return Select
          default: return CaretRight
        }
      }

      if (cameraEnabled.value) return currentQuestion.value ? Select : ChatDotRound
      return CaretRight
    })

    // 保持向后兼容
    const statusTagType = computed(() => statusButtonType.value)

    // 是否还有更多题目
    const hasMoreQuestions = computed(() => {
      return currentQuestionIndex.value < questionQueue.value.length - 1
    })

    // 摄像头控制
    const toggleCamera = async () => {
      try {
        if (cameraEnabled.value) {
          MediaUtils.stopCamera()
          cameraEnabled.value = false
          ElMessage.success('摄像头已关闭')
        } else {
          await MediaUtils.startCamera(videoElement.value)
          cameraEnabled.value = true
          ElMessage.success('摄像头已开启')
        }
      } catch (error) {
        ElMessage.error(error.message || '摄像头操作失败')
      }
    }

    // 语音识别控制
    const toggleSpeechRecognition = async () => {
      if (!SpeechUtils.isWebSpeechSupported()) {
        ElMessage.error('当前浏览器不支持语音识别')
        return
      }

      try {
        if (isListening.value) {
          SpeechUtils.stop()
        } else {
          if (!SpeechUtils.recognition) {
            initSpeechRecognition()
          }
          SpeechUtils.start()
        }
      } catch (error) {
        ElMessage.error(error.message || '语音识别操作失败')
      }
    }

    // 初始化语音识别
    const initSpeechRecognition = () => {
      SpeechUtils.init({
        lang: 'zh-CN',
        continuous: true,
        interimResults: true
      })

      SpeechUtils.setCallbacks({
        onStart: () => {
          isListening.value = true
          interimTranscript.value = ''
        },
        onResult: (result) => {
          if (result.final) {
            finalTranscript.value += result.final
            interimTranscript.value = ''
          } else {
            interimTranscript.value = result.interim
          }
        },
        onError: (error) => {
          isListening.value = false
          ElMessage.error(`语音输入未捕获: ${error.message}`)
        },
        onEnd: () => {
          isListening.value = false
        }
      })
    }

    // 开始面试计时器
    const startTimer = () => {
      if (timerInterval.value) return
      interviewSession.startTime = new Date()
      interviewSession.status = 'active'
      timerInterval.value = setInterval(() => {
        interviewTimer.value++
      }, 1000)
    }

    // 停止计时器
    const stopTimer = () => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
      interviewSession.endTime = new Date()
      interviewSession.status = 'completed'
    }

    // 格式化时间
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // 生成新问题（获取一批5道题目）
    const generateNewQuestion = async () => {
      questionLoading.value = true
      hasError.value = false

      try {
        // 构建智能问题生成请求参数
        const requestParams = {
          position: getUserPosition(), // 获取用户职位偏好
          level: getUserLevel(),       // 获取用户技术水平
          skills: getUserSkills(),     // 获取用户技能列表
          previousQuestions: interviewSession.questions.map(q => q.id),
          includeMetadata: true,
          includeDifficulty: true
        }

        console.log('发起智能问题生成请求:', requestParams)

        // 优先使用智能问题生成API，失败则降级
        let result
        try {
          result = await aiAnalysisService.generateQuestionSmart(requestParams)
        } catch (smartError) {
          console.warn('智能问题生成失败，降级到传统方法:', smartError)
          result = await aiAnalysisService.generateQuestion(requestParams)
        }

        if (result.success && result.data) {
          const questionData = result.data

          // 验证必需字段
          if (!questionData.question) {
            throw new Error('后端返回的题目文本为空')
          }

          // 更新会话信息
          interviewSession.sessionId = questionData.sessionId || `session-${Date.now()}`
          interviewSession.jobTitle = questionData.jobTitle || selectedProfession.value

          // 处理题目队列：如果有allQuestions就用，否则只用当前题目
          let questionsToUse = []

          if (questionData.allQuestions && Array.isArray(questionData.allQuestions) && questionData.allQuestions.length > 0) {
            // Dify工作流返回的5道题目
            questionsToUse = questionData.allQuestions
            interviewSession.allQuestions = questionData.allQuestions
            console.log(`✅ 从Dify工作流获取${questionData.allQuestions.length}道题目`)
          } else {
            // 只有当前题目
            questionsToUse = [questionData]
          }

          // 清空题目队列并重新填充
          questionQueue.value = questionsToUse.map((q, index) => {
            return {
              id: q.questionId || q.id || `q_${index}_${Date.now()}`,
              question: q.question,
              expectedAnswer: q.expectedAnswer || q.answer || '',
              keywords: q.keywords || q.tags || [],
              category: q.category || q.categoryId || selectedProfession.value,
              difficulty: q.difficulty || selectedDifficulty.value,
              generatedBy: q.generatedBy || 'dify_workflow',
              confidenceScore: q.confidenceScore || 0.9,
              smartGeneration: true,
              profession: selectedProfession.value,
              searchSource: q.searchSource || 'dify_rag',
              sourceUrls: q.sourceUrls || [],
              workflowId: result.metadata?.workflowRunId,
              sessionId: questionData.sessionId || interviewSession.sessionId,
              hasAnswer: q.hasAnswer !== undefined ? q.hasAnswer : true,
              explanation: q.explanation,
              estimatedTime: q.estimatedTime
            }
          })

          // 重置索引到第一题
          currentQuestionIndex.value = 0
          currentQuestion.value = questionQueue.value[0]

          // 添加到会话questions（用于回答记录）
          questionQueue.value.forEach(q => {
            const exists = interviewSession.questions.find(item => item.id === q.id)
            if (!exists) {
              interviewSession.questions.push(q)
            }
          })

          if (interviewSession.questions.length > 0 && interviewSession.status !== 'active') {
            startTimer()
            interviewSession.startTime = new Date()
            interviewSession.status = 'active'
          }

          const processingTime = result.metadata?.processingTime || 0
          ElMessage.success({
            message: `🎉 获取${questionQueue.value.length}道题目成功! (处理时间: ${processingTime}ms)`,
            duration: 3000
          })

          console.log('题目队列初始化:', {
            count: questionQueue.value.length,
            current: currentQuestion.value
          })

        } else {
          throw new Error(result.message || result.error || '生成问题失败')
        }
      } catch (err) {
        error.value = err.message || '生成问题失败'
        hasError.value = true

        // 如果所有方法都失败，使用默认问题
        if (questionQueue.value.length === 0) {
          const defaultQ = getDefaultQuestion()
          questionQueue.value = [defaultQ]
          currentQuestionIndex.value = 0
          currentQuestion.value = defaultQ
          ElMessage.warning('使用默认问题，请检查网络连接')
        } else {
          ElMessage.error(error.value)
        }
      } finally {
        questionLoading.value = false
      }
    }

    // 下一题处理函数（新增）
    const handleNextQuestion = async () => {
      if (hasMoreQuestions.value) {
        // 如果还有更多题目，直接显示下一道
        await showNextQuestion()
      } else {
        // 如果没有更多题目，生成新一批题目
        await generateNewQuestion()
      }
    }

    // 显示下一题（从队列中取）
    const showNextQuestion = async () => {
      // 先保存当前题目的答案
      if (finalTranscript.value && currentQuestion.value) {
        const alreadySaved = interviewSession.answers.find(
          a => a.questionId === currentQuestion.value.id
        )
        if (!alreadySaved) {
          // 如果还没有分析，提示先分析
          if (!analysisResult.value) {
            ElMessage.warning('请先分析当前题目的回答后再进入下一题')
            return
          }
        }
      }

      // 清空当前回答数据
      finalTranscript.value = ''
      interimTranscript.value = ''
      analysisResult.value = null

      // 显示下一题
      currentQuestionIndex.value++
      if (currentQuestionIndex.value < questionQueue.value.length) {
        currentQuestion.value = questionQueue.value[currentQuestionIndex.value]
        ElMessage.success({
          message: `📝 已切换到第 ${currentQuestionIndex.value + 1} 题`,
          duration: 2000
        })
        console.log(`切换到第 ${currentQuestionIndex.value + 1} 题:`, currentQuestion.value.question)
      }
    }

    // 获取用户职位偏好
    const getUserPosition = () => {
      return localStorage.getItem('userPosition') || '前端开发工程师'
    }

    // 获取用户技术水平
    const getUserLevel = () => {
      return localStorage.getItem('userLevel') || '中级'
    }

    // 获取用户技能列表
    const getUserSkills = () => {
      const skillsStr = localStorage.getItem('userSkills')
      return skillsStr ? JSON.parse(skillsStr) : ['JavaScript', 'Vue.js', 'HTML', 'CSS']
    }

    // 获取默认问题（降级方案）
    const getDefaultQuestion = () => {
      return {
        id: Date.now(),
        question: '请简单介绍一下您最近参与的一个项目，以及您在其中承担的角色和使用的技术栈。',
        expectedAnswer: '这是一个开放性问题，主要考察候选人的项目经验、技术实践和沟通表达能力。',
        keywords: ['项目经验', '技术栈', '团队协作'],
        category: '项目经验',
        difficulty: '初级',
        generatedBy: 'default-fallback',
        confidenceScore: 0.6,
        smartGeneration: false
      }
    }

    // 智能生成专业题目
    const generateSmartQuestion = async () => {
      if (!selectedProfession.value) {
        ElMessage.warning('请先选择专业领域')
        return
      }

      smartQuestionLoading.value = true
      hasError.value = false

      try {
        ElMessage.info(`🔍 正在为${selectedProfession.value}专业智能生成${selectedDifficulty.value}难度题目...`)

        // 调用Dify工作流生成题目
        const result = await difyService.generateQuestionByProfession(
          selectedProfession.value,
          {
            level: selectedDifficulty.value,
            count: 1,
            excludeQuestions: interviewSession.questions.map(q => q.id)
          }
        )

        if (result.success && result.data) {
          const questionData = result.data

          currentQuestion.value = {
            id: Date.now(),
            question: questionData.question,
            expectedAnswer: questionData.expectedAnswer,
            keywords: questionData.keywords || [],
            category: questionData.category || selectedProfession.value,
            difficulty: questionData.difficulty || selectedDifficulty.value,
            // Dify特有字段
            generatedBy: 'dify_workflow',
            confidenceScore: questionData.confidenceScore || 0.9,
            smartGeneration: true,
            profession: selectedProfession.value,
            searchSource: questionData.searchSource,
            sourceUrls: questionData.sourceUrls || [],
            workflowId: result.metadata?.workflowId
          }

          interviewSession.questions.push(currentQuestion.value)

          // 如果是第一题，开始计时
          if (interviewSession.questions.length === 1) {
            startTimer()
            interviewSession.startTime = new Date()
            interviewSession.status = 'active'
          }

          const processingTime = result.metadata?.processingTime || 0
          ElMessage.success({
            message: `🎉 智能题目生成成功！(处理时间: ${processingTime}ms)`,
            duration: 3000
          })

          console.log('Dify智能生成题目成功:', currentQuestion.value)

        } else {
          // Dify失败，使用降级方案
          console.warn('Dify题目生成失败，使用传统生成方法:', result.error)

          ElMessage.warning('智能生成失败，使用传统方法生成题目')
          await generateNewQuestion()
        }

      } catch (error) {
        console.error('智能题目生成错误:', error)
        ElMessage.error('智能题目生成失败: ' + (error.message || error))

        // 降级到传统生成方法
        try {
          await generateNewQuestion()
        } catch (fallbackError) {
          // 如果传统方法也失败，使用默认问题
          currentQuestion.value = getDefaultQuestion()
          ElMessage.warning('使用默认问题，请检查网络连接')
        }
      } finally {
        smartQuestionLoading.value = false
      }
    }

    // 自动完成查询
    const queryProfessionSuggestions = (queryString, cb) => {
      const results = queryString
        ? allProfessionsSuggestions.value.filter(item =>
            item.value.toLowerCase().includes(queryString.toLowerCase()) ||
            item.label.toLowerCase().includes(queryString.toLowerCase())
          )
        : allProfessionsSuggestions.value

      cb(results)
    }

    // 快速选择专业
    const selectQuickProfession = (profession) => {
      selectedProfession.value = profession
      ElMessage.info(`已选择: ${profession}`)
    }

    // 处理专业选择变化
    const handleProfessionChange = (item) => {
      if (item && item.value) {
        selectedProfession.value = item.value
        console.log('选择专业:', item.value)
      }
    }

    // 设备权限检查
    const checkDevicePermissions = async () => {
      try {
        // 检查摄像头权限
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        stream.getTracks().forEach(track => track.stop())
        return true
      } catch (error) {
        throw new Error('设备访问受限： 无法使用摄像头或麦克风，可能由于设备正在被其他应用程序占用,  请检查并关闭占用相关设备的程序后重试')
      }
    }

    // 智能引导式面试启动
    const startInterviewGuide = async () => {
      isStarting.value = true

      try {
        // Step 1: 设备检查引导
        await ElMessageBox.confirm(
          '开始AI面试前需要检查设备权限（摄像头和麦克风）。\n\n✨ 面试流程：\n1. 检查设备权限\n2. 开启摄像头\n3. 生成智能面试题\n4. 开始语音回答\n\n是否现在开始？',
          '🚀 AI智能面试引导', {
            confirmButtonText: '开始面试',
            cancelButtonText: '稍后再说',
            type: 'info',
            center: true
          }
        )

        // Step 2: 设备权限检查
        ElMessage.info('🔍 正在检查设备权限...')
        await checkDevicePermissions()
        ElMessage.success('✅ 设备权限检查通过')

        // Step 3: 启动摄像头
        if (!cameraEnabled.value) {
          ElMessage.info('📹 正在启动摄像头...')
          await toggleCamera()
        }

        // Step 4: 生成第一个问题
        ElMessage.info('🤖 正在生成智能面试题...')
        await generateNewQuestion()

        // Step 5: 完成引导
        await ElMessageBox.alert(
          '🎉 面试准备完成！\n\n📋 接下来您可以：\n• 仔细阅读生成的问题\n• 点击"开始录音"回答问题\n• 系统会实时进行AI分析\n• 获得详细的评分反馈\n\n祝您面试顺利！',
          '✨ 准备完成', {
            confirmButtonText: '开始回答',
            type: 'success',
            center: true
          }
        )

        ElMessage.success('🎊 面试已开始，请开始回答问题！')

      } catch (error) {
        if (error === 'cancel') {
          ElMessage.info('已取消面试启动')
          return
        }

        console.error('面试启动失败:', error)
        ElMessage.error('启动失败: ' + (error.message || error))

        // 失败时的友好提示
        try {
          await ElMessageBox.alert(
            '面试启动失败，可能的原因：\n• 设备权限被拒绝\n• 摄像头或麦克风被占用\n• 网络连接问题\n\n请检查后重试，或联系技术支持。',
            '⚠️ 启动失败', {
              confirmButtonText: '我知道了',
              type: 'warning'
            }
          )
        } catch {}
      } finally {
        isStarting.value = false
      }
    }

    // 处理引导流程步骤点击
    const handleFlowStepClick = async (stepId) => {
      isStarting.value = true

      try {
        switch (stepId) {
          case 'preparation':
            await handlePreparationStep()
            break
          case 'systemCheck':
            await handleSystemCheckStep()
            break
          case 'interview':
            await handleInterviewStep()
            break
          case 'analysis':
            await handleAnalysisStep()
            break
        }
      } finally {
        isStarting.value = false
      }
    }

    // 各个流程步骤的处理方法
    const handlePreparationStep = async () => {
      // 显示准备引导
      await ElMessageBox.confirm(
        '🎯 欢迎使用AI面试系统！\n\n请确保您处于安静的环境中，准备好开始面试。接下来我们将检查您的设备。\n\n是否准备好了？',
        '面试准备',
        {
          confirmButtonText: '我准备好了',
          cancelButtonText: '稍后再试',
          type: 'info'
        }
      )

      // 完成准备步骤
      completeCurrentStep()
      ElMessage.success('✅ 面试准备完成')
    }

    const handleSystemCheckStep = async () => {
      // 检查摄像头和麦克风权限
      try {
        ElMessage.info('🔍 正在检查设备权限...')
        await checkDevicePermissions()
        if (!cameraEnabled.value) {
          await toggleCamera()
        }

        ElMessage.success('✅ 设备检查完成')
        completeCurrentStep()
      } catch (error) {
        ElMessage.error('❌ 设备检查失败: ' + error.message)
        throw error
      }
    }

    const handleInterviewStep = async () => {
      // 开始面试
      try {
        ElMessage.info('🤖 正在生成智能面试题...')
        await generateNewQuestion()

        ElMessage.success('🎉 面试已开始！请仔细阅读问题后开始录音回答')
        completeCurrentStep()
      } catch (error) {
        ElMessage.error('面试启动失败: ' + error.message)
        throw error
      }
    }

    const handleAnalysisStep = async () => {
      // 查看分析结果
      if (analysisResult.value) {
        const formatted = formatAnalysisResult(analysisResult.value)
        await ElMessageBox.alert(formatted, '📊 面试分析结果', {
          confirmButtonText: '确定',
          type: 'info'
        })
      } else {
        ElMessage.info('🔄 分析结果正在生成中，请稍候...')
      }
      completeCurrentStep()
    }

    // 工具方法
    const completeCurrentStep = () => {
      if (flowState.currentStep < flowState.steps.length) {
        flowState.steps[flowState.currentStep].completed = true
        flowState.steps[flowState.currentStep].status = 'completed'

        // 进入下一步
        if (flowState.currentStep + 1 < flowState.steps.length) {
          flowState.currentStep++
          flowState.steps[flowState.currentStep].status = 'active'
        }
      }
    }

    const formatAnalysisResult = (result) => {
      if (!result) return '暂无分析结果'

      let formatted = `📊 面试分析报告\n\n`
      if (result.technicalAccuracy) formatted += `技术准确性: ${result.technicalAccuracy}/100\n`
      if (result.completeness) formatted += `完整性: ${result.completeness}/100\n`
      if (result.clarity) formatted += `表达清晰度: ${result.clarity}/100\n`
      if (result.professionalTerms) formatted += `专业术语使用: ${result.professionalTerms}/100\n`
      if (result.fluency) formatted += `语言流畅性: ${result.fluency}/100\n\n`

      if (result.suggestions && result.suggestions.length > 0) {
        formatted += `💡 改进建议:\n${result.suggestions.join('\n')}`
      }

      return formatted
    }

    // 快速生成问题（无引导）
    const quickGenerateQuestion = async () => {
      try {
        if (!currentQuestion.value) {
          await generateNewQuestion()
        } else {
          // 如果已有问题，开始录音
          await toggleSpeechRecognition()
        }
      } catch (error) {
        ElMessage.error('操作失败: ' + error.message)
      }
    }

    // 状态按钮点击处理 (增强引导流程)
    const handleStatusClick = async () => {
      if (isProcessing.value || isStarting.value) {
        return // 正在处理中，不响应点击
      }

      const currentStepData = flowState.steps[flowState.currentStep]

      try {
        // 基于引导流程处理点击
        if (currentStepData && !currentStepData.completed) {
          await handleFlowStepClick(currentStepData.id)
          return
        }

        // 兼容原有逻辑
        const currentStatus = statusText.value
        switch (currentStatus) {
          case '点击生成问题':
            await generateNewQuestion()
            break

          case '准备就绪':
            await toggleSpeechRecognition()
            break

          case '正在录音':
            await toggleSpeechRecognition()
            break

          default:
            ElMessage.info('当前状态：' + currentStatus)
            break
        }
      } catch (error) {
        console.error('状态处理失败:', error)
        ElMessage.error('操作失败: ' + (error.message || error))
      }
    }

    // 分析回答 (使用Dify工作流)
    const analyzeAnswer = async () => {
      if (!currentQuestion.value || !finalTranscript.value) {
        ElMessage.warning('请先选择问题并完成录音')
        return
      }

      analysisLoading.value = true
      try {
        ElMessage.info('🤖 AI正在分析您的回答...')

        // 构建Dify分析请求
        const analysisRequest = {
          question: currentQuestion.value.question,
          questionId: currentQuestion.value.id,
          answer: finalTranscript.value,
          profession: selectedProfession.value || currentQuestion.value.profession || '??',
          sessionId: interviewSession.sessionId
        }

        console.log('开始Dify工作流分析:', analysisRequest)

        // 优先使用Dify工作流分析
        let result
        try {
          result = await difyService.analyzeAnswerWithDify(analysisRequest)

          if (result.success) {
            ElMessage.success(`🎉 AI分析完成 (处理时间: ${result.processingTime || 0}ms)`)
          }
        } catch (difyError) {
          console.warn('Dify分析失败，使用传统分析:', difyError)

          // 降级到传统分析
          result = await aiAnalysisService.analyzeAnswer({
            question: currentQuestion.value.question,
            answer: finalTranscript.value,
            interviewId: interviewSession.id
          })

          if (result.success) {
            ElMessage.success('✅ 回答分析完成（传统模式）')
          }
        }

        if (result.success) {
          // 设置分析结果（简化版，移除五维度）
          analysisResult.value = {
            // 核心评分
            overallScore: result.data?.overallScore || result.overallScore || 75,
            summary: result.data?.summary || result.summary || '回答基本符合要求',
            suggestions: result.data?.suggestions || result.suggestions || [],

            // 简化的能力评估
            technicalScore: result.data?.technicalAccuracy || Math.floor((result.data?.overallScore || 75) * 0.9),
            communicationScore: result.data?.fluency || Math.floor((result.data?.overallScore || 75) * 1.05),
            logicalScore: result.data?.logicClarity || Math.floor((result.data?.overallScore || 75) * 1.1),

            // 元数据
            analysisEngine: result.source || 'dify_workflow',
            processingTime: result.processingTime || 0,
            difyAnalysis: result.source === 'dify_workflow',
            standardAnswer: result.data?.standardAnswer || '',
            sessionId: result.data?.sessionId || interviewSession.sessionId,
            strengths: result.data?.strengths || ['回答较为完整'],
            weaknesses: result.data?.weaknesses || ['可以更加深入']
          }

          // 保存回答记录
          interviewSession.answers.push({
            questionId: currentQuestion.value.id,
            answer: finalTranscript.value,
            analysis: analysisResult.value,
            standardAnswer: analysisResult.value.standardAnswer || '',
            timestamp: Date.now(),
            analysisType: result.source === 'dify_workflow' ? 'dify' : 'traditional',
            profession: selectedProfession.value
          })

          console.log('简化分析结果:', analysisResult.value)

          // 如果是面试流程的最后一步，自动进入分析结果步骤
          if (flowState.currentStep === 2) { // interview step
            completeCurrentStep()
          }

        } else {
          // 处理分析失败的详细错误信息
          const errorInfo = result.error || {}
          console.error('分析回答详细错误:', errorInfo)

          let userMessage = '分析回答失败'
          if (errorInfo.code === 'DIFY_AUTH_ERROR') {
            userMessage = 'Dify API认证失败，请检查配置'
          } else if (errorInfo.code === 'DIFY_NETWORK_ERROR') {
            userMessage = '网络连接失败，请检查网络状态'
          } else if (errorInfo.code === 'DIFY_RATE_LIMIT') {
            userMessage = '请求过于频繁，请稍后再试'
          } else if (errorInfo.message) {
            userMessage = errorInfo.message
          }

          throw new Error(userMessage)
        }
      } catch (error) {
        ElMessage.error(error.message || '分析回答失败')
        console.error('分析回答失败详情:', {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        })
      } finally {
        analysisLoading.value = false
      }
    }

    // 清空转录文本
    const clearTranscript = () => {
      finalTranscript.value = ''
      interimTranscript.value = ''
      analysisResult.value = null
    }

    // 获取分数颜色
    const getScoreColor = (score) => {
      if (score >= 85) return '#67c23a'
      if (score >= 70) return '#e6a23c'
      if (score >= 60) return '#f56c6c'
      return '#f56c6c'
    }

    // 结束面试
    const endInterview = async () => {
      try {
        await ElMessageBox.confirm('确定要结束面试吗？', '结束面试确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        stopTimer()
        SpeechUtils.stop()
        MediaUtils.stopCamera()
        cameraEnabled.value = false
        isListening.value = false

        ElMessage.success('面试已结束')
        // 可以导航到结果页面或保存面试数据
      } catch {
        // 用户取消操作
      }
    }

    // 错误处理
    const handleError = (err) => {
      error.value = err.message || '系统错误'
      hasError.value = true
    }

    // 重试操作
    const retryOperation = () => {
      hasError.value = false
      error.value = null
    }

    // 生命周期
    onMounted(() => {
      // 检查浏览器支持
      const support = MediaUtils.checkSupport()
      if (!support.video) {
        ElMessage.error('当前浏览器不支持摄像头访问')
      }

      // 显示欢迎提示（替代自动生成问题）
      setTimeout(() => {
        ElMessage.info({
          message: '👋 欢迎使用AI智能面试系统！点击"点击开始面试"按钮开始您的面试体验。',
          duration: 5000,
          showClose: true
        })
      }, 1000)

      // 暴露全局 demo 方法供演示脚本使用
      window.runAIInterviewDemo = async () => {
        console.clear()
        console.log('%c🎬 AI面试系统演示开始...', 'font-size: 20px; font-weight: bold; color: #667eea;')

        function sleep(ms) {
          return new Promise(resolve => setTimeout(resolve, ms))
        }

        // 第一步：选择专业
        console.log('%c📌 第一步：选择专业和难度', 'font-size: 14px; font-weight: bold; color: #409eff; margin-top: 15px;')
        selectedProfession.value = '前端开发工程师'
        selectedDifficulty.value = '中级'
        console.log('✅ 已选择: 前端开发工程师 (中级难度)')
        await sleep(1000)

        // 第二步：生成题目
        console.log('%c📌 第二步：生成AI面试题', 'font-size: 14px; font-weight: bold; color: #409eff; margin-top: 15px;')
        console.log('🔄 正在生成题目...')

        currentQuestion.value = {
          id: Date.now(),
          question: '请详细解释React中虚拟DOM的工作原理，以及为什么虚拟DOM能够提高应用的性能？',
          expectedAnswer: '虚拟DOM是React的核心概念，它在内存中创建真实DOM的轻量级副本。当状态变化时，React会创建新的虚拟DOM树，通过Diff算法比较新旧树的差异，最后只更新必要的真实DOM元素。',
          keywords: ['虚拟DOM', 'Diff算法', '性能优化'],
          category: '前端开发',
          difficulty: '中级',
          generatedBy: 'dify_workflow',
          confidenceScore: 0.92,
          smartGeneration: true
        }

        console.log('✅ 题目生成成功！')
        console.log('📝 问题: ' + currentQuestion.value.question)
        await sleep(1500)

        // 第三步：语音识别
        console.log('%c📌 第三步：模拟语音识别', 'font-size: 14px; font-weight: bold; color: #409eff; margin-top: 15px;')

        const mockTexts = ['虚拟DOM是', '虚拟DOM是React的一个', '虚拟DOM是React的一个重要概念']
        for (const text of mockTexts) {
          interimTranscript.value = text
          console.log('  [实时识别] ' + text + '...')
          await sleep(500)
        }

        finalTranscript.value = '虚拟DOM是React的一个重要概念。它在内存中创建真实DOM的轻量级副本。当状态变化时，React会创建新的虚拟DOM树，通过Diff算法比较新旧树的差异，最后只更新那些确实发生了变化的DOM元素，这样就减少了对真实DOM的操作次数。虚拟DOM能够提高应用的性能主要有三个原因：第一，减少了直接操作真实DOM的开销；第二，虚拟DOM支持跨平台应用的开发；第三，方便实现服务端渲染。'
        interimTranscript.value = ''

        console.log('✅ 语音识别完成！')
        console.log('📄 识别文本已显示在左下角语音识别卡片')
        await sleep(1000)

        // 第四步：AI分析
        console.log('%c📌 第四步：AI分析回答', 'font-size: 14px; font-weight: bold; color: #409eff; margin-top: 15px;')
        analysisLoading.value = true

        const progresses = ['▁', '▃', '▄', '▅', '▆']
        for (let i = 0; i < progresses.length; i++) {
          console.log('  [进度] ' + (i * 25) + '% ' + progresses[i])
          await sleep(400)
        }

        // 第五步：显示分析结果
        analysisResult.value = {
          overallScore: 82,
          summary: '回答整体思路清晰，概念理解准确。能够全面阐述虚拟DOM的核心作用和优势。',
          suggestions: [
            '可以深入讨论Diff算法的具体实现机制',
            '可以举具体代码示例来说明虚拟DOM与真实DOM的关系',
            '可以补充讲解Fiber架构如何优化React的性能'
          ],
          technicalScore: 85,
          communicationScore: 80,
          logicalScore: 82,
          processingTime: 2847,
          strengths: ['概念理解深入', '表达清晰流畅', '逻辑思路完整'],
          weaknesses: ['缺少代码示例', '未涉及Fiber架构']
        }

        analysisLoading.value = false
        console.log('✅ AI分析完成！')

        console.log('%c📊 分析结果', 'font-size: 14px; font-weight: bold; color: #409eff; margin-top: 15px;')
        console.log('总体评分: 82分 | 技术: 85分 | 表达: 80分 | 逻辑: 82分')
        console.log('处理时间: 2,847ms')

        console.log('%c💡 改进建议', 'font-size: 14px; font-weight: bold; color: #409eff; margin-top: 10px;')
        analysisResult.value.suggestions.forEach((s, i) => console.log('  ' + (i + 1) + '. ' + s))

        await sleep(500)

        console.log('%c🎬 演示完成！', 'font-size: 18px; font-weight: bold; color: #67c23a; margin-top: 20px;')
        console.log('✅ 所有数据已显示在右下角的分析结果卡片中')
      }
    })

    onBeforeUnmount(() => {
      // 清理资源
      MediaUtils.stopCamera()
      SpeechUtils.stop()
    })

    return {
      // 状态
      cameraEnabled,
      isListening,
      isProcessing,
      questionLoading,
      analysisLoading,
      isStarting,
      smartQuestionLoading,
      statusText,
      statusTagType,
      statusButtonType,
      statusIcon,

      // 专业搜索相关
      selectedProfession,
      selectedDifficulty,
      recommendedProfessions,
      popularProfessions,
      allProfessionsSuggestions,
      queryProfessionSuggestions,
      selectQuickProfession,

      // 元素引用
      videoElement,

      // 语音识别
      finalTranscript,
      interimTranscript,

      // 面试数据
      currentQuestion,
      currentQuestionIndex,
      questionQueue,
      analysisResult,
      interviewSession,
      interviewTimer,
      hasMoreQuestions,

      // 引导流程状态
      flowState,

      // 错误状态
      error,
      hasError,

      // 方法
      toggleCamera,
      toggleSpeechRecognition,
      generateNewQuestion,
      handleNextQuestion,
      showNextQuestion,
      analyzeAnswer,
      clearTranscript,
      getScoreColor,
      formatTime,
      endInterview,
      handleError,
      retryOperation,
      handleStatusClick,
      startInterviewGuide,
      quickGenerateQuestion,
      handleFlowStepClick,
      handlePreparationStep,
      handleSystemCheckStep,
      handleInterviewStep,
      handleAnalysisStep,
      completeCurrentStep,
      formatAnalysisResult,
      getUserPosition,
      getUserLevel,
      getUserSkills,
      getDefaultQuestion,
      generateSmartQuestion,
      handleProfessionChange,

      // 图标
      VideoPlay,
      VideoPause,
      Microphone,
      VideoCamera,
      ChatDotRound,
      Clock,
      CaretRight,    // 替代 Play
      Select,        // 替代 Check
      WarningFilled, // 替代 Warning
      Loading,
      MagicStick,    // 魔法棒图标
      Star,          // 星星图标
      Search         // 搜索图标
    }
  }
}
</script>

<style scoped>
.ai-interview-container {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.interview-header {
  margin-bottom: 20px;
}

.header-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.interview-info h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 状态按钮样式 */
.status-button {
  position: relative;
  min-width: 140px;
  font-weight: 600;
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.status-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
}

.status-button:active:not(:disabled) {
  transform: translateY(0);
}

.status-button .status-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 不同状态的按钮样式 */
.status-button.el-button--primary {
  background: linear-gradient(135deg, #409EFF 0%, #36A9E1 100%);
  border-color: #409EFF;
}

.status-button.el-button--success {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
  border-color: #67C23A;
}

.status-button.el-button--warning {
  background: linear-gradient(135deg, #E6A23C 0%, #F1C40F 100%);
  border-color: #E6A23C;
}

.status-button.el-button--danger {
  background: linear-gradient(135deg, #F56C6C 0%, #E74C3C 100%);
  border-color: #F56C6C;
}

.status-button.el-button--info {
  background: linear-gradient(135deg, #909399 0%, #B0B3B8 100%);
  border-color: #909399;
}

/* 加载状态样式 */
.status-button.is-loading {
  pointer-events: none;
}

.status-button.is-loading .status-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.interview-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  background: #f0f9ff;
  padding: 4px 12px;
  border-radius: 16px;
}

.question-counter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-card,
.question-card,
.speech-card,
.analysis-card {
  height: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.video-container {
  height: 320px;
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
}

.video-placeholder p {
  margin-top: 10px;
  font-size: 14px;
}

.question-content {
  height: 320px;
  overflow-y: auto;
}

.question h3 {
  color: #303133;
  line-height: 1.6;
  margin-bottom: 15px;
}

.question-info {
  display: flex;
  gap: 10px;
}

.speech-content {
  height: 320px;
  display: flex;
  flex-direction: column;
}

.transcript-area {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 15px;
}

.final-transcript h4,
.interim-transcript h4 {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.final-transcript p {
  color: #303133;
  line-height: 1.6;
}

.interim-text {
  color: #909399;
  font-style: italic;
  line-height: 1.6;
}

.transcript-placeholder {
  text-align: center;
  color: #c0c4cc;
  padding: 60px 0;
}

.transcript-placeholder p {
  margin-top: 10px;
  font-size: 14px;
}

.speech-controls {
  display: flex;
  gap: 10px;
}

.analysis-content {
  height: 320px;
  overflow-y: auto;
}

.overall-score {
  margin-bottom: 20px;
}

.score-breakdown {
  margin-bottom: 20px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.score-item span {
  color: #606266;
  font-weight: 500;
}

.analysis-summary h4,
.suggestions h4 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 14px;
}

.analysis-summary p {
  color: #606266;
  line-height: 1.6;
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions li {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 5px;
}

.analysis-placeholder {
  text-align: center;
  color: #c0c4cc;
  padding: 120px 0;
}

.analysis-placeholder p {
  margin-top: 10px;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.listening-indicator {
  animation: pulse 1.5s infinite;
}

.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.el-progress {
  margin-bottom: 10px;
}

.el-rate {
  display: flex;
  align-items: center;
}

/* 流程指示器样式 */
.flow-indicator {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f6f9fc 0%, #eef4f7 100%);
  border-radius: 12px;
  border: 1px solid #e1e8ed;
}

.flow-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.flow-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 40px;
  right: 40px;
  height: 2px;
  background: #e1e8ed;
  z-index: 1;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  position: relative;
  z-index: 2;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  border: 2px solid #e1e8ed;
  background: white;
  color: #909399;
  transition: all 0.3s ease;
}

.flow-step.active .step-number {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

.flow-step.completed .step-number {
  background: var(--el-color-success);
  border-color: var(--el-color-success);
  color: white;
}

.step-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.flow-step.active .step-name {
  color: var(--el-color-primary);
}

.flow-step.completed .step-name {
  color: var(--el-color-success);
}

.step-description {
  font-size: 12px;
  color: #909399;
  max-width: 120px;
}

.flow-step.active .step-description {
  color: #606266;
  font-weight: 500;
}

/* 简化评分样式 */
.simplified-scores {
  margin-top: 16px;
}

.simplified-scores .score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
}

.simplified-scores .score-item span {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  min-width: 80px;
}

.simplified-scores .el-progress {
  flex: 1;
  margin-left: 16px;
}

/* AI分析引擎信息 */
.analysis-meta {
  margin-top: 16px;
}

.analysis-engine-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.processing-time {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 自动完成建议项样式 */
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.suggestion-item .icon {
  font-size: 18px;
}

.suggestion-item .label {
  font-size: 14px;
}


/* 专业搜索框样式 */
.profession-search-card {
  border: 2px solid #e1f5fe;
  background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%);
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.1);
}

.profession-search-card .el-card__header {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  padding: 16px 24px;
}

.profession-search-content {
  padding: 20px 24px 16px 24px;
}

.search-input-group {
  display: flex;
  gap: 12px;
  align-items: stretch;
  justify-content: flex-start;
}

.profession-select {
  flex: 1;
  min-width: 300px;
}

.difficulty-select {
  width: 120px;
  flex-shrink: 0;
}

.generate-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  border-color: #ff9800;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 160px;
  font-size: 14px;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
}

.generate-btn .el-icon {
  margin-right: 8px;
}

/* 问题卡片增强样式 */
.question-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.question-card .el-button--success {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border-color: #4caf50;
  color: white;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .profession-select,
  .difficulty-select {
    flex: none;
    width: 100%;
  }

  .generate-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
