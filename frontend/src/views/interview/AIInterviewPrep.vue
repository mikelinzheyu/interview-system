<template>
  <div class="ai-interview-prep-container">
    <div class="prep-header">
      <el-card class="header-card">
        <div class="header-content">
          <div class="back-btn">
            <el-button @click="$router.back()" icon="ArrowLeft" circle />
          </div>
          <div class="header-title">
            <h1>🤖 AI智能面试</h1>
            <p>准备开始您的AI面试之旅</p>
          </div>
        </div>
      </el-card>
    </div>

    <div class="prep-main">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="intro-card">
            <h2>🎯 面试介绍</h2>
            <div class="intro-content">
              <p>欢迎使用AI智能面试系统！我们将为您提供专业的模拟面试体验：</p>

              <div class="features-list">
                <div class="feature-item">
                  <el-icon size="20" color="#409eff"><VideoCamera /></el-icon>
                  <div class="feature-text">
                    <h4>实时视频监控</h4>
                    <p>通过摄像头监控面试状态，模拟真实面试环境</p>
                  </div>
                </div>

                <div class="feature-item">
                  <el-icon size="20" color="#67c23a"><Microphone /></el-icon>
                  <div class="feature-text">
                    <h4>智能语音识别</h4>
                    <p>实时识别您的语音回答，准确转换为文字进行分析</p>
                  </div>
                </div>

                <div class="feature-item">
                  <el-icon size="20" color="#e6a23c"><ChatDotRound /></el-icon>
                  <div class="feature-text">
                    <h4>AI智能评估</h4>
                    <p>多维度分析您的回答，提供专业的改进建议</p>
                  </div>
                </div>

                <div class="feature-item">
                  <el-icon size="20" color="#f56c6c"><TrendCharts /></el-icon>
                  <div class="feature-text">
                    <h4>详细分析报告</h4>
                    <p>获得技术能力、表达能力、逻辑思维的综合评分</p>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="flow-card">
            <h2>📋 面试流程</h2>
            <div class="flow-steps">
              <div class="step-item" v-for="(step, index) in interviewSteps" :key="index">
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-content">
                  <h4>{{ step.title }}</h4>
                  <p>{{ step.description }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="requirements-card">
            <h2>⚙️ 系统要求</h2>
            <div class="requirements-list">
              <div class="requirement-item">
                <el-icon :color="browserSupport.camera ? '#67c23a' : '#f56c6c'">
                  <component :is="browserSupport.camera ? 'Check' : 'Close'" />
                </el-icon>
                <span>摄像头权限</span>
                <el-tag :type="browserSupport.camera ? 'success' : 'danger'" size="small">
                  {{ browserSupport.camera ? '支持' : '不支持' }}
                </el-tag>
              </div>

              <div class="requirement-item">
                <el-icon :color="browserSupport.microphone ? '#67c23a' : '#f56c6c'">
                  <component :is="browserSupport.microphone ? 'Check' : 'Close'" />
                </el-icon>
                <span>麦克风权限</span>
                <el-tag :type="browserSupport.microphone ? 'success' : 'danger'" size="small">
                  {{ browserSupport.microphone ? '支持' : '不支持' }}
                </el-tag>
              </div>

              <div class="requirement-item">
                <el-icon :color="browserSupport.speech ? '#67c23a' : '#f56c6c'">
                  <component :is="browserSupport.speech ? 'Check' : 'Close'" />
                </el-icon>
                <span>语音识别</span>
                <el-tag :type="browserSupport.speech ? 'success' : 'danger'" size="small">
                  {{ browserSupport.speech ? '支持' : '不支持' }}
                </el-tag>
              </div>

              <div class="requirement-item">
                <el-icon :color="apiStatus.healthy ? '#67c23a' : '#f56c6c'">
                  <component :is="apiStatus.healthy ? 'Check' : 'Close'" />
                </el-icon>
                <span>AI服务</span>
                <el-tag :type="apiStatus.healthy ? 'success' : 'danger'" size="small">
                  {{ apiStatus.text }}
                </el-tag>
              </div>
            </div>

            <div class="browser-tips">
              <el-alert
                title="浏览器建议"
                type="info"
                :closable="false"
                description="为了获得最佳体验，建议使用 Chrome 或 Edge 浏览器"
                show-icon
              />
            </div>
          </el-card>

          <el-card class="action-card">
            <h2>🚀 开始面试</h2>
            <div class="action-content">
              <p>确认以上系统要求后，点击下方按钮开始AI面试：</p>

              <el-button
                type="primary"
                size="large"
                @click="startInterview"
                :disabled="!canStartInterview"
                :loading="starting"
                class="start-btn"
              >
                <el-icon><VideoPlay /></el-icon>
                开始面试
              </el-button>

              <div v-if="!canStartInterview" class="warning-tips">
                <el-alert
                  title="系统检查未通过"
                  type="warning"
                  :closable="false"
                  description="请确保摄像头、麦克风权限正常，并使用支持的浏览器"
                  show-icon
                />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  VideoCamera,
  Microphone,
  ChatDotRound,
  TrendCharts,
  VideoPlay,
  Check,
  Close,
  ArrowLeft
} from '@element-plus/icons-vue'

const router = useRouter()
const starting = ref(false)

// 面试流程步骤
const interviewSteps = ref([
  {
    title: '系统检查',
    description: '确认摄像头和麦克风权限，检查浏览器兼容性'
  },
  {
    title: '开启摄像头',
    description: '启动视频监控，进入面试状态'
  },
  {
    title: 'AI生成问题',
    description: '系统自动生成适合您的面试题目'
  },
  {
    title: '语音回答',
    description: '使用语音回答问题，系统实时转录文字'
  },
  {
    title: '智能分析',
    description: 'AI分析您的回答质量，给出评分和建议'
  },
  {
    title: '查看结果',
    description: '获得详细的面试报告和改进建议'
  }
])

// 浏览器支持状态
const browserSupport = reactive({
  camera: false,
  microphone: false,
  speech: false
})

// API服务状态
const apiStatus = reactive({
  healthy: false,
  text: '检查中...'
})

// 是否可以开始面试
const canStartInterview = computed(() => {
  return browserSupport.camera && browserSupport.microphone && apiStatus.healthy
})

// 检查浏览器支持
const checkBrowserSupport = () => {
  // 检查摄像头支持
  browserSupport.camera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

  // 检查麦克风支持（与摄像头API相同）
  browserSupport.microphone = browserSupport.camera

  // 检查语音识别支持
  browserSupport.speech = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

// 检查API服务状态
const checkAPIStatus = async () => {
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      apiStatus.healthy = true
      apiStatus.text = '正常'
    } else {
      apiStatus.healthy = false
      apiStatus.text = '异常'
    }
  } catch (error) {
    apiStatus.healthy = false
    apiStatus.text = '离线'
  }
}

// 开始面试
const startInterview = async () => {
  console.log('开始面试按钮被点击')
  console.log('canStartInterview:', canStartInterview.value)
  console.log('browserSupport:', browserSupport)
  console.log('apiStatus:', apiStatus)

  if (!canStartInterview.value) {
    ElMessage.warning('请确保系统要求都已满足')
    console.log('系统要求检查失败')
    return
  }

  starting.value = true
  console.log('开始跳转到AI面试页面')

  try {
    ElMessage.success('正在进入AI面试页面...')

    // 延迟跳转，让用户看到反馈
    setTimeout(() => {
      console.log('执行路由跳转')
      router.push('/interview/ai')
    }, 1000)

  } catch (error) {
    console.error('跳转失败:', error)
    ElMessage.error('跳转失败，请重试')
    starting.value = false
  }
}

onMounted(() => {
  console.log('AIInterviewPrep 组件已挂载')
  checkBrowserSupport()
  checkAPIStatus()

  // 监听系统状态变化
  setTimeout(() => {
    console.log('系统检查完成:')
    console.log('- camera:', browserSupport.camera)
    console.log('- microphone:', browserSupport.microphone)
    console.log('- speech:', browserSupport.speech)
    console.log('- apiStatus:', apiStatus.healthy, apiStatus.text)
    console.log('- canStartInterview:', canStartInterview.value)
  }, 2000)
})
</script>

<style scoped>
.ai-interview-prep-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.prep-header {
  margin-bottom: 20px;
}

.header-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-title h1 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 24px;
}

.header-title p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.prep-main .el-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.prep-main h2 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.features-list {
  margin-top: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #fafbfc;
  border-radius: 8px;
}

.feature-text h4 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.feature-text p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.flow-steps {
  position: relative;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
  position: relative;
}

.step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 15px;
  top: 35px;
  width: 2px;
  height: 25px;
  background: #e4e7ed;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.step-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.requirements-list {
  margin-bottom: 20px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background: #fafbfc;
  border-radius: 6px;
}

.requirement-item span {
  flex: 1;
  color: #606266;
  font-weight: 500;
}

.browser-tips {
  margin-bottom: 20px;
}

.action-content {
  text-align: center;
}

.action-content p {
  margin-bottom: 20px;
  color: #606266;
  line-height: 1.6;
}

.start-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
}

.warning-tips {
  margin-top: 15px;
}

.intro-content p {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

:deep(.el-card__body) {
  padding: 24px;
}

@media (max-width: 1200px) {
  .prep-main .el-col:first-child {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .ai-interview-prep-container {
    padding: 15px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .feature-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .requirement-item {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>