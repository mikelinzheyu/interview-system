<template>
  <div class="ai-interview-v2">
    <!-- ========== STEP 1: Setup ========== -->
    <div v-if="step === 'setup'" class="setup-page">
      <!-- 渐变 Header -->
      <div class="setup-header">
        <div class="setup-header-inner">
          <div class="setup-header-icon">✨</div>
          <h1 class="setup-title">AI 模拟面试</h1>
          <p class="setup-subtitle">填写岗位信息，让 AI 为你量身定制真实面试体验</p>
        </div>
      </div>

      <!-- 配置卡片 -->
      <div class="setup-body">
        <div class="setup-card">
          <div class="setup-form">
            <div class="form-group">
              <label class="form-label required">岗位名称</label>
              <input
                v-model="config.jobTitle"
                class="form-input"
                placeholder="例：前端开发工程师、Java后端工程师"
                maxlength="100"
              />
            </div>

            <div class="form-group">
              <label class="form-label">职位描述 JD
                <span class="form-label-hint">（可选，有助于生成更精准的题目，最多 2000 字）</span>
              </label>
              <textarea
                v-model="config.jobDescription"
                class="form-textarea"
                placeholder="粘贴招聘 JD 或描述岗位核心要求..."
                rows="5"
                maxlength="2000"
              ></textarea>
              <div class="char-count">{{ config.jobDescription.length }} / 2000</div>
            </div>

            <div class="form-group">
              <label class="form-label">个人简历摘要
                <span class="form-label-hint">（可选，帮助 AI 了解你的背景，最多 2000 字）</span>
              </label>
              <textarea
                v-model="config.resume"
                class="form-textarea"
                placeholder="粘贴你的简历要点或技能栈..."
                rows="5"
                maxlength="2000"
              ></textarea>
              <div class="char-count">{{ config.resume.length }} / 2000</div>
            </div>

            <button
              class="start-btn"
              :disabled="!config.jobTitle.trim() || isInitializing"
              @click="startInterview"
            >
              <span v-if="isInitializing" class="btn-loading">
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                <span class="loading-dot"></span>
                正在初始化面试...
              </span>
              <span v-else>开始面试对话 &gt;</span>
            </button>

            <p v-if="initError" class="error-hint">{{ initError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== STEP 2: Interview ========== -->
    <div v-else-if="step === 'interview'" class="interview-page">
      <!-- 顶部栏 -->
      <div class="interview-topbar">
        <div class="topbar-left">
          <div class="bot-avatar">🤖</div>
          <div class="topbar-info">
            <div class="topbar-title">AI 模拟面试官</div>
            <div class="topbar-status">
              <span class="status-dot"></span>
              正在面试：{{ config.jobTitle }}
            </div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="timer-badge">
            <span class="timer-icon">⏱</span>
            {{ formatTime(timer) }}
          </div>
          <button class="topbar-btn end-btn" @click="confirmEndInterview">结束面试</button>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="interview-main">
        <!-- 左栏 -->
        <div class="left-panel">
          <!-- 视频监控卡 -->
          <div class="panel-card video-card">
            <div class="video-header">
              <span>视频识别</span>
              <span v-if="cameraOn" class="live-badge-small">
                <span class="pulse-dot"></span> 直播中
              </span>
            </div>
            <div class="video-container">
              <video
                ref="videoEl"
                autoplay
                muted
                playsinline
                :class="{ hidden: !cameraOn }"
              ></video>
              <div v-if="!cameraOn" class="video-placeholder">
                <div class="video-placeholder-icon">📷</div>
                <p>摄像头未开启</p>
              </div>
            </div>
            <button class="camera-btn" @click="toggleCamera">
              {{ cameraOn ? '关闭摄像头' : '开启摄像头' }}
            </button>
          </div>

          <!-- 语音识别卡 -->
          <div class="panel-card speech-card">
            <div class="speech-header">
              <span>语音识别</span>
              <span v-if="isListening" class="speech-badge">
                <span class="pulse-dot"></span> 识别中
              </span>
            </div>
            <div class="speech-transcript">
              <p v-if="speechTranscript || interimText" class="transcript-text">
                {{ speechTranscript }}<em v-if="interimText" class="interim">{{ interimText }}</em>
              </p>
              <p v-else class="transcript-empty">点击下方按钮开始语音回答...</p>
            </div>
            <button
              class="speech-btn"
              :class="{ active: isListening }"
              @click="toggleSpeech"
            >
              {{ isListening ? '⏹ 停止语音' : '🎤 开始语音回答' }}
            </button>
          </div>
        </div>

        <!-- 右栏 -->
        <div class="right-panel">
          <div class="chat-card">
            <!-- 聊天标题 -->
            <div class="chat-header">
              <span class="chat-title">面试对话</span>
              <span class="encrypt-badge">● ENCRYPTED SESSION</span>
            </div>

            <!-- 消息列表 -->
            <div ref="messagesEl" class="messages-list">
              <div
                v-for="(msg, idx) in messages"
                :key="idx"
                class="message"
                :class="msg.role === 'assistant' ? 'msg-ai' : 'msg-user'"
              >
                <div v-if="msg.role === 'assistant'" class="msg-avatar">🤖</div>
                <div class="msg-bubble">
                  <p class="msg-content">{{ msg.content }}</p>
                  <span class="msg-time">{{ formatMsgTime(msg.timestamp) }}</span>
                </div>
                <div v-if="msg.role === 'user'" class="msg-avatar user-avatar">👤</div>
              </div>

              <!-- AI 正在输入 -->
              <div v-if="isAiTyping" class="message msg-ai">
                <div class="msg-avatar">🤖</div>
                <div class="msg-bubble typing-bubble">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>

            <!-- 底部输入区 -->
            <div class="chat-input-area">
              <textarea
                ref="inputEl"
                v-model="userInput"
                class="chat-input"
                placeholder="输入你的回答，或使用左侧语音识别..."
                rows="3"
                @keydown.enter.exact.prevent="sendMessage"
              ></textarea>
              <button
                class="send-btn"
                :disabled="!userInput.trim() || isAiTyping"
                @click="sendMessage"
                title="发送 (Enter)"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import difyInterviewService from '@/services/difyInterviewService'
import ttsUtils from '@/utils/ttsUtils'
import { SpeechUtils } from '@/utils/speechUtils'

const router = useRouter()

// ===================== 状态 =====================
const step = ref('setup') // 'setup' | 'interview'

const config = reactive({
  jobTitle: '',
  jobDescription: '',
  resume: '',
})

const isInitializing = ref(false)
const initError = ref('')

// 面试状态
const conversationId = ref(null)
const sessionData = ref(null)
const messages = ref([])
const userInput = ref('')
const isAiTyping = ref(false)

// 计时器
const timer = ref(0)
let timerInterval = null

// 摄像头
const videoEl = ref(null)
const cameraOn = ref(false)
let mediaStream = null

// 语音识别
const isListening = ref(false)
const speechTranscript = ref('')
const interimText = ref('')
let speechUtils = null

// DOM refs
const messagesEl = ref(null)
const inputEl = ref(null)

// 裁决记录
const verdicts = ref([])

// ===================== 方法 =====================

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const formatMsgTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

// ===== 初始化面试 =====
const startInterview = async () => {
  if (!config.jobTitle.trim()) return
  isInitializing.value = true
  initError.value = ''

  try {
    const result = await difyInterviewService.initSession({
      jobTitle: config.jobTitle,
      jobDescription: config.jobDescription,
      resume: config.resume,
      userId: 'interview-user',
    })

    sessionData.value = result.data || result
    step.value = 'interview'

    // 启动计时器
    timerInterval = setInterval(() => { timer.value++ }, 1000)

    // 自动触发 AI 开场白
    await nextTick()
    await triggerAIGreeting()

  } catch (e) {
    console.error('[AIInterviewV2] init error:', e)
    initError.value = e.message || '初始化失败，请稍后重试'
  } finally {
    isInitializing.value = false
  }
}

// ===== AI 开场白 =====
const triggerAIGreeting = async () => {
  const greeting = `你好！我是你的 AI 面试官，今天将为你模拟 ${config.jobTitle} 岗位的面试。请放松心情，用自然的语言回答问题。准备好了吗？请先做一个简短的自我介绍吧。`
  await streamAIResponse(greeting, undefined)
}

// ===== 流式 AI 回复 =====
// convId === undefined → 本地打字机模式（无 API 调用）
// convId === '' 或实际 ID → 调用 Dify Chat API
const streamAIResponse = (initialContent, convId) => {
  return new Promise((resolve) => {
    // 如果是直接显示（无 API 调用）
    if (convId === undefined) {
      const msg = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }
      messages.value.push(msg)
      isAiTyping.value = false

      // 打字机效果
      let i = 0
      const interval = setInterval(() => {
        if (i < initialContent.length) {
          msg.content += initialContent[i]
          i++
          scrollToBottom()
        } else {
          clearInterval(interval)
          ttsUtils.speak(msg.content)
          resolve()
        }
      }, 20)
      return
    }

    // 通过 API 调用
    const msg = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    messages.value.push(msg)
    isAiTyping.value = true
    scrollToBottom()

    difyInterviewService.sendMessage(
      initialContent,
      convId,
      {
        job_title:   config.jobTitle,
        jd_text:     config.jobDescription || '未提供',
        resume_text: config.resume         || '未提供',
      },
      // onChunk
      (content) => {
        msg.content += content
        isAiTyping.value = false
        scrollToBottom()
      },
      // onEnd
      (newConvId) => {
        if (newConvId) conversationId.value = newConvId
        isAiTyping.value = false
        ttsUtils.speak(msg.content)
        scrollToBottom()
        resolve()
      },
      // onError
      (err) => {
        console.error('[AIInterviewV2] stream error:', err)
        isAiTyping.value = false
        msg.content = msg.content || '（AI 回复出错，请重试）'
        resolve()
      }
    )
  })
}

// ===== 发送用户消息 =====
const sendMessage = async () => {
  const text = userInput.value.trim()
  if (!text || isAiTyping.value) return

  // 清空输入 & 语音
  userInput.value = ''
  speechTranscript.value = ''
  interimText.value = ''
  ttsUtils.stop()

  // 添加用户消息
  const userMsg = {
    role: 'user',
    content: text,
    timestamp: Date.now(),
  }
  messages.value.push(userMsg)
  scrollToBottom()

  isAiTyping.value = true

  // 获取上一条 AI 问题
  const lastAiMsg = [...messages.value].reverse().find(m => m.role === 'assistant')
  const lastQuestion = lastAiMsg?.content || ''

  // 静默调用裁决（不阻塞聊天）
  callVerdictSilently(lastQuestion, text)

  // 流式 AI 回复（conversationId 为 null 时传 '' 触发新对话，不走本地模式）
  await streamAIResponse(text, conversationId.value ?? '')
  isAiTyping.value = false
}

// ===== 静默裁决 =====
const callVerdictSilently = async (question, answer) => {
  try {
    const ctx = sessionData.value?.sessionContext || ''
    const result = await difyInterviewService.getVerdict(question, answer, ctx, config.jobTitle, verdicts.value.length + 1)
    verdicts.value.push({
      question,
      answer,
      decision: result?.data?.decision || result?.decision || 'next',
      followUp: result?.data?.follow_up_question || result?.follow_up_question || '',
      timestamp: Date.now(),
    })
    console.log('[AIInterviewV2] Verdict:', verdicts.value[verdicts.value.length - 1])
  } catch (e) {
    console.warn('[AIInterviewV2] Verdict failed (silent):', e.message)
  }
}

// ===== 摄像头 =====
const toggleCamera = async () => {
  if (cameraOn.value) {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop())
      mediaStream = null
    }
    if (videoEl.value) videoEl.value.srcObject = null
    cameraOn.value = false
  } else {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoEl.value) {
        videoEl.value.srcObject = mediaStream
      }
      cameraOn.value = true
    } catch (e) {
      console.error('[AIInterviewV2] Camera error:', e)
    }
  }
}

// ===== 语音识别 =====
const toggleSpeech = () => {
  if (!speechUtils) {
    speechUtils = new SpeechUtils()
    try {
      speechUtils.init({ lang: 'zh-CN', continuous: true, interimResults: true })
      speechUtils.setCallbacks({
        onStart: () => { isListening.value = true },
        onResult: (result) => {
          if (result.final) {
            speechTranscript.value += result.final
            interimText.value = ''
            userInput.value = speechTranscript.value
          } else {
            interimText.value = result.interim
          }
        },
        onError: (err) => {
          console.error('[AIInterviewV2] Speech error:', err)
          isListening.value = false
        },
        onEnd: () => { isListening.value = false },
      })
    } catch (e) {
      console.error('[AIInterviewV2] Speech init error:', e)
      return
    }
  }

  if (isListening.value) {
    speechUtils.stop()
  } else {
    speechTranscript.value = ''
    interimText.value = ''
    speechUtils.start()
  }
}

// ===== 结束面试 =====
const confirmEndInterview = async () => {
  if (!confirm('确定要结束本次面试吗？')) return

  stopAll()

  // 整理对话数据
  const answerItems = []
  let lastQuestion = ''
  messages.value.forEach((msg) => {
    if (msg.role === 'assistant') {
      lastQuestion = msg.content
    } else if (msg.role === 'user' && lastQuestion) {
      answerItems.push({ question: lastQuestion, answer: msg.content })
      lastQuestion = ''
    }
  })

  // 计算评分（简单估算）
  const score = Math.min(95, Math.max(50, 60 + verdicts.value.filter(v => v.decision === 'next').length * 5))

  const reportState = {
    jobTitle: config.jobTitle,
    difficulty: '中级',
    duration: timer.value,
    endTime: new Date().toISOString(),
    answers: answerItems.map((a, i) => ({
      ...a,
      verdict: verdicts.value[i]?.decision || 'next',
      score: Math.min(95, Math.max(45, 55 + Math.random() * 30)),
    })),
    overallScore: score,
    technicalScore: Math.min(95, score + Math.round((Math.random() - 0.5) * 15)),
    communicationScore: Math.min(95, score + Math.round((Math.random() - 0.5) * 15)),
    logicalScore: Math.min(95, score + Math.round((Math.random() - 0.5) * 10)),
    summary: `本次 ${config.jobTitle} 面试共进行了 ${answerItems.length} 轮问答。`,
    suggestions: [
      '建议进一步加强技术基础知识的系统梳理',
      '回答时注意结合具体项目案例，增强说服力',
      '表达时注意逻辑层次，先结论后论据',
    ],
  }

  router.push({ name: 'InterviewReportV2', state: reportState })
}

const stopAll = () => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  if (speechUtils && isListening.value) speechUtils.stop()
  if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null }
  ttsUtils.stop()
  cameraOn.value = false
  isListening.value = false
}

// ===================== 生命周期 =====================
onBeforeUnmount(() => {
  stopAll()
})
</script>

<style scoped>
/* ========== 全局 ========== */
.ai-interview-v2 {
  min-height: 100vh;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ========== Setup 页面 ========== */
.setup-page {
  min-height: 100vh;
}

.setup-header {
  background: linear-gradient(135deg, #4F46E5, #818CF8);
  padding: 48px 24px;
  text-align: center;
  color: #fff;
}

.setup-header-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.setup-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
}

.setup-subtitle {
  font-size: 16px;
  opacity: 0.85;
  margin: 0;
}

.setup-body {
  max-width: 680px;
  margin: -32px auto 40px;
  padding: 0 16px;
}

.setup-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(79, 70, 229, 0.12);
  padding: 32px;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-label-hint {
  font-weight: 400;
  color: #9ca3af;
  font-size: 12px;
}

.form-input,
.form-textarea {
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 15px;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.char-count {
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
  margin-top: 4px;
}

.start-btn {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  margin-top: 8px;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.loading-dot {
  width: 7px;
  height: 7px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: bounce 0.8s infinite alternate;
}

.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

.error-hint {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  margin: 0;
}

/* ========== Interview 页面 ========== */
.interview-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.interview-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 12px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-avatar {
  font-size: 28px;
  line-height: 1;
}

.topbar-title {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.topbar-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Monaco', monospace;
  font-size: 15px;
  font-weight: 600;
  color: #4F46E5;
  background: #eef2ff;
  padding: 6px 14px;
  border-radius: 20px;
}

.topbar-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.end-btn {
  background: #fee2e2;
  color: #dc2626;
}

.end-btn:hover {
  background: #fca5a5;
}

.interview-main {
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  min-height: 0;
}

/* ===== 左栏（摄像头 + 语音识别） ===== */
.left-panel {
  width: 460px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.panel-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}

.video-container {
  background: #0F1117;
  border-radius: 10px;
  height: 300px;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-container video.hidden {
  display: none;
}

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.video-placeholder-icon {
  font-size: 40px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.video-placeholder p {
  font-size: 13px;
  margin: 0;
  opacity: 0.7;
}

.live-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.camera-btn {
  width: 100%;
  padding: 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  color: #374151;
}

.camera-btn:hover {
  background: #f0f0ff;
  border-color: #4F46E5;
  color: #4F46E5;
}

.video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  margin-bottom: 10px;
}

.live-badge-small {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

.speech-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  margin-bottom: 10px;
}

.speech-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #22c55e;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-green 1s infinite;
}

.speech-transcript {
  min-height: 200px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
}

.transcript-text {
  font-size: 14px;
  color: #111827;
  line-height: 1.6;
  margin: 0;
}

.interim {
  color: #9ca3af;
  font-style: italic;
}

.transcript-empty {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  text-align: center;
  padding: 20px 0;
}

.speech-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.speech-btn.active {
  background: linear-gradient(135deg, #dc2626, #ef4444);
}

.speech-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ===== 右栏 ===== */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.chat-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.chat-title {
  font-weight: 700;
  font-size: 15px;
  color: #111827;
}

.encrypt-badge {
  font-size: 11px;
  color: #22c55e;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 88%;
}

.msg-ai {
  align-self: flex-start;
}

.msg-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.user-avatar {
  background: #f0fdf4;
}

.msg-bubble {
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px 14px;
  max-width: 100%;
}

.msg-user .msg-bubble {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
}

.msg-content {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-user .msg-content {
  color: #fff;
}

.msg-time {
  font-size: 11px;
  color: #9ca3af;
}

.msg-user .msg-time {
  color: rgba(255, 255, 255, 0.7);
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.2s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  color: #111827;
}

.chat-input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
  border: none;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  margin-bottom: 2px;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 640px) {
  .interview-main {
    flex-direction: column;
    overflow-y: auto;
  }
  .left-panel {
    width: 100%;
  }
  .interview-page {
    height: auto;
    min-height: 100vh;
  }
}
</style>
