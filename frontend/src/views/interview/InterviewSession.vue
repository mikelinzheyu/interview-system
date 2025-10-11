<template>
  <div class="interview-session-container">
    <!-- 顶部状态栏 -->
    <div class="interview-header">
      <div class="header-left">
        <el-button 
          type="text" 
          @click="handleEndInterview"
          :disabled="sessionStatus === 'ended'"
        >
          <el-icon><Close /></el-icon>
          结束面试
        </el-button>
        <div class="session-info">
          <span class="session-title">{{ sessionData.title || 'AI面试会话' }}</span>
          <el-tag :type="getStatusTagType(sessionStatus)" size="small">
            {{ getStatusText(sessionStatus) }}
          </el-tag>
        </div>
      </div>
      
      <div class="header-right">
        <div class="timer">
          <el-icon><Timer /></el-icon>
          <span>{{ formatTime(elapsedTime) }}</span>
        </div>
        <div class="progress-info">
          第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题
        </div>
      </div>
    </div>

    <!-- 主要聊天区域 -->
    <div class="chat-container">
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message"
          :class="{ 'message-user': message.role === 'user', 'message-ai': message.role === 'ai' }"
        >
          <div class="message-avatar">
            <el-avatar :size="36" v-if="message.role === 'ai'">
              <el-icon><Robot /></el-icon>
            </el-avatar>
            <el-avatar :size="36" :src="userStore.user?.avatar" v-else>
              {{ userStore.user?.real_name?.[0] || 'U' }}
            </el-avatar>
          </div>
          
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">
                {{ message.role === 'ai' ? 'AI面试官' : (userStore.user?.real_name || '您') }}
              </span>
              <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
            </div>
            
            <div class="message-text" v-html="formatMessageContent(message.content)"></div>
            
            <!-- AI消息的操作按钮 -->
            <div class="message-actions" v-if="message.role === 'ai'">
              <el-button size="small" type="text" @click="likeMessage(message.id)">
                <el-icon><CircleCheck /></el-icon>
                有用
              </el-button>
              <el-button size="small" type="text" @click="regenerateResponse(message.id)">
                <el-icon><Refresh /></el-icon>
                重新生成
              </el-button>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isAiTyping" class="message message-ai">
          <div class="message-avatar">
            <el-avatar :size="36">
              <el-icon><Robot /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-container">
        <div class="input-tools">
          <el-button size="small" type="text" @click="toggleVoiceInput">
            <el-icon><Microphone /></el-icon>
            语音输入
          </el-button>
          <el-button size="small" type="text" @click="insertCodeBlock">
            <el-icon><DocumentAdd /></el-icon>
            插入代码
          </el-button>
        </div>
        
        <div class="input-area">
          <el-input
            v-model="currentMessage"
            type="textarea"
            placeholder="请输入您的回答..."
            :autosize="{ minRows: 2, maxRows: 6 }"
            @keydown.ctrl.enter="sendMessage"
            @keydown.meta.enter="sendMessage"
            :disabled="sessionStatus === 'ended'"
          />
          
          <div class="input-actions">
            <div class="input-tips">
              <span>Ctrl + Enter 发送</span>
            </div>
            <el-button 
              type="primary" 
              @click="sendMessage"
              :loading="isSending"
              :disabled="!currentMessage.trim() || sessionStatus === 'ended'"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧边栏（可选） -->
    <el-drawer
      v-model="showSidebar"
      title="面试详情"
      direction="rtl"
      size="400px"
    >
      <div class="sidebar-content">
        <el-card class="session-card">
          <template #header>
            <span>会话信息</span>
          </template>
          <div class="session-details">
            <div class="detail-item">
              <label>面试类型：</label>
              <span>{{ sessionData.type || '技术面试' }}</span>
            </div>
            <div class="detail-item">
              <label>技术领域：</label>
              <span>{{ sessionData.category || 'Java开发' }}</span>
            </div>
            <div class="detail-item">
              <label>难度等级：</label>
              <span>{{ sessionData.difficulty || '中级' }}</span>
            </div>
            <div class="detail-item">
              <label>开始时间：</label>
              <span>{{ formatDateTime(sessionData.startTime) }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="notes-card">
          <template #header>
            <span>面试笔记</span>
          </template>
          <el-input
            v-model="interviewNotes"
            type="textarea"
            placeholder="记录重要信息..."
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </el-card>
      </div>
    </el-drawer>

    <!-- 结束面试确认对话框 -->
    <el-dialog
      v-model="showEndDialog"
      title="结束面试"
      width="500px"
      center
    >
      <div class="end-dialog-content">
        <el-icon size="48" color="#e6a23c"><WarningFilled /></el-icon>
        <p>确定要结束本次面试吗？结束后将生成面试报告。</p>
      </div>
      
      <template #footer>
        <el-button @click="showEndDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEndInterview">
          确定结束
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { mockAI } from '@/api/interview'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Close, Timer, Robot, CircleCheck, Refresh, Microphone, DocumentAdd,
  WarningFilled
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 组件状态
const sessionStatus = ref('running') // init, running, paused, ended
const currentMessage = ref('')
const isSending = ref(false)
const isAiTyping = ref(false)
const showSidebar = ref(false)
const showEndDialog = ref(false)
const interviewNotes = ref('')
const messagesContainer = ref()

// 计时器相关
const elapsedTime = ref(0)
const timerInterval = ref(null)

// 面试进度
const currentQuestionIndex = ref(0)
const totalQuestions = ref(10)

// 会话数据
const sessionData = reactive({
  id: route.query.session || Date.now(),
  title: 'Java工程师技术面试',
  type: '技术面试',
  category: 'Java开发',
  difficulty: '中级',
  startTime: new Date()
})

// 消息列表
const messages = ref([
  {
    id: 1,
    role: 'ai',
    content: '您好！欢迎参加今天的面试。我是您的AI面试官，接下来我将通过一系列问题来了解您的技术能力和项目经验。请放松心情，展现您最好的一面。\n\n首先，请您简单介绍一下自己，包括您的技术背景和工作经验。',
    timestamp: Date.now() - 60000
  }
])

// 计算属性
const getStatusTagType = (status) => {
  const types = {
    init: 'info',
    running: 'success',
    paused: 'warning',
    ended: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    init: '准备中',
    running: '进行中',
    paused: '已暂停',
    ended: '已结束'
  }
  return texts[status] || '未知'
}

// 格式化时间
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatMessageTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const formatMessageContent = (content) => {
  // 简单的markdown解析
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

// 发送消息
const sendMessage = async () => {
  if (!currentMessage.value.trim() || isSending.value) return
  
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: currentMessage.value.trim(),
    timestamp: Date.now()
  }
  
  messages.value.push(userMessage)
  const messageToSend = currentMessage.value
  currentMessage.value = ''
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 模拟AI回复
  isSending.value = true
  isAiTyping.value = true
  
  try {
    const response = await mockAI.chat(messageToSend)
    
    await new Promise(resolve => setTimeout(resolve, 1500)) // 模拟思考时间
    
    const aiMessage = {
      id: Date.now() + 1,
      role: 'ai',
      content: response.data.content,
      timestamp: Date.now()
    }
    
    messages.value.push(aiMessage)
    currentQuestionIndex.value++
    
    await nextTick()
    scrollToBottom()
    
  } catch (error) {
    ElMessage.error('发送失败，请重试')
  } finally {
    isSending.value = false
    isAiTyping.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 点赞消息
const likeMessage = (messageId) => {
  ElMessage.success('感谢您的反馈')
}

// 重新生成回复
const regenerateResponse = async (messageId) => {
  const messageIndex = messages.value.findIndex(m => m.id === messageId)
  if (messageIndex === -1) return
  
  isAiTyping.value = true
  
  try {
    const response = await mockAI.chat('请重新回答')
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    messages.value[messageIndex].content = response.data.content
    messages.value[messageIndex].timestamp = Date.now()
    
  } catch (error) {
    ElMessage.error('重新生成失败')
  } finally {
    isAiTyping.value = false
  }
}

// 语音输入（占位）
const toggleVoiceInput = () => {
  ElMessage.info('语音输入功能正在开发中...')
}

// 插入代码块
const insertCodeBlock = () => {
  const codeTemplate = '\n```javascript\n// 在这里输入代码\n\n```\n'
  currentMessage.value += codeTemplate
}

// 结束面试
const handleEndInterview = () => {
  if (sessionStatus.value === 'ended') return
  showEndDialog.value = true
}

const confirmEndInterview = async () => {
  showEndDialog.value = false
  sessionStatus.value = 'ended'
  
  // 停止计时器
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  ElMessage.success('面试已结束，正在生成报告...')
  
  // 模拟生成报告
  setTimeout(() => {
    router.push({
      path: '/interview/report',
      query: { session: sessionData.id }
    })
  }, 2000)
}

// 启动计时器
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    if (sessionStatus.value === 'running') {
      elapsedTime.value++
    }
  }, 1000)
}

// 组件挂载
onMounted(() => {
  startTimer()
  // 模拟面试开始
  sessionStatus.value = 'running'
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

// 组件卸载
onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// 监听页面离开
window.addEventListener('beforeunload', (e) => {
  if (sessionStatus.value === 'running') {
    e.preventDefault()
    e.returnValue = '面试正在进行中，确定要离开吗？'
  }
})
</script>

<style scoped>
.interview-session-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.interview-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.session-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.session-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.progress-info {
  font-size: 14px;
  color: #909399;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
  gap: 12px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 70%;
  min-width: 200px;
}

.message-user .message-content {
  background: #409eff;
  color: white;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
}

.message-ai .message-content {
  background: white;
  border: 1px solid #e4e7ed;
  padding: 16px;
  border-radius: 16px 16px 16px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-sender {
  font-size: 12px;
  font-weight: 600;
  color: #909399;
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
}

.message-user .message-header {
  color: rgba(255, 255, 255, 0.8);
}

.message-text {
  line-height: 1.6;
  word-break: break-word;
}

.message-actions {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  gap: 8px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #c0c4cc;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input-container {
  background: white;
  border-top: 1px solid #e4e7ed;
  padding: 16px 24px;
}

.input-tools {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-tips {
  font-size: 12px;
  color: #909399;
}

.sidebar-content {
  padding: 20px;
}

.session-card,
.notes-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.session-details {
  padding: 0;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  margin-right: 12px;
}

.end-dialog-content {
  text-align: center;
  padding: 20px;
}

.end-dialog-content p {
  margin: 16px 0 0 0;
  color: #606266;
  font-size: 16px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  transition: border-color 0.3s;
}

:deep(.el-textarea__inner:focus) {
  border-color: #409eff;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .interview-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header-left,
  .header-right {
    justify-content: space-between;
  }
  
  .chat-messages {
    padding: 16px 12px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .chat-input-container {
    padding: 12px 16px;
  }
}
</style>