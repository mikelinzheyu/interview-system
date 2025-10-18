<template>
  <div class="quick-start-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">🤖 AI智能面试系统</h1>
        <p class="hero-subtitle">
          体验最新的AI面试技术，提升您的面试技能
        </p>

        <div class="hero-features">
          <div class="feature-item">
            <el-icon><VideoCamera /></el-icon>
            <span>实时摄像头</span>
          </div>
          <div class="feature-item">
            <el-icon><Microphone /></el-icon>
            <span>语音识别</span>
          </div>
          <div class="feature-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI分析</span>
          </div>
        </div>

        <div class="hero-actions">
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="startAIInterview"
          >
            <el-icon><VideoPlay /></el-icon>
            开始AI面试
          </el-button>

          <el-button
            size="large"
            @click="viewTestPage"
          >
            <el-icon><Setting /></el-icon>
            功能测试
          </el-button>
        </div>
      </div>
    </div>

    <div class="info-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="info-card">
            <div class="info-content">
              <el-icon size="40" color="#409eff"><VideoCamera /></el-icon>
              <h3>摄像头监控</h3>
              <p>实时视频监控，模拟真实面试环境</p>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="info-card">
            <div class="info-content">
              <el-icon size="40" color="#67c23a"><Microphone /></el-icon>
              <h3>智能语音识别</h3>
              <p>准确识别您的回答，实时转换为文字</p>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="info-card">
            <div class="info-content">
              <el-icon size="40" color="#e6a23c"><ChatDotRound /></el-icon>
              <h3>AI智能分析</h3>
              <p>多维度评估您的回答质量和表现</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="status-section">
      <el-card>
        <h3>系统状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">前端服务:</span>
            <el-tag type="success">运行中</el-tag>
          </div>
          <div class="status-item">
            <span class="status-label">API服务:</span>
            <el-tag :type="apiStatus.type">{{ apiStatus.text }}</el-tag>
          </div>
          <div class="status-item">
            <span class="status-label">摄像头支持:</span>
            <el-tag :type="cameraSupport ? 'success' : 'danger'">
              {{ cameraSupport ? '支持' : '不支持' }}
            </el-tag>
          </div>
          <div class="status-item">
            <span class="status-label">语音识别:</span>
            <el-tag :type="speechSupport ? 'success' : 'danger'">
              {{ speechSupport ? '支持' : '不支持' }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  VideoCamera,
  Microphone,
  ChatDotRound,
  VideoPlay,
  Setting
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const cameraSupport = ref(false)
const speechSupport = ref(false)
const apiStatus = ref({ type: 'info', text: '检查中' })

// 开始AI面试
const startAIInterview = async () => {
  loading.value = true

  try {
    // 检查必要的支持
    if (!cameraSupport.value) {
      ElMessage.warning('您的浏览器不支持摄像头功能，建议使用Chrome或Edge浏览器')
    }

    if (!speechSupport.value) {
      ElMessage.warning('您的浏览器不支持语音识别功能，建议使用Chrome或Edge浏览器')
    }

    ElMessage.success('正在跳转到AI面试页面...')

    setTimeout(() => {
      router.push('/interview/ai')
    }, 1000)

  } catch (error) {
    ElMessage.error('跳转失败，请重试')
  } finally {
    loading.value = false
  }
}

// 查看测试页面
const viewTestPage = () => {
  window.open('/test-functionality.html', '_blank')
}

// 检查系统支持
const checkSystemSupport = () => {
  // 检查摄像头支持
  cameraSupport.value = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

  // 检查语音识别支持
  speechSupport.value = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

// 检查API状态
const checkAPIStatus = async () => {
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      apiStatus.value = { type: 'success', text: '正常' }
    } else {
      apiStatus.value = { type: 'danger', text: '异常' }
    }
  } catch (error) {
    apiStatus.value = { type: 'danger', text: '离线' }
  }
}

onMounted(() => {
  checkSystemSupport()
  checkAPIStatus()
})
</script>

<style scoped>
.quick-start-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-section {
  padding: 80px 20px 60px;
  text-align: center;
  color: white;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 20px;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-features {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
}

.feature-item .el-icon {
  font-size: 24px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.hero-actions .el-button {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
}

.info-section {
  padding: 60px 20px;
  background: white;
}

.info-card {
  height: 200px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.info-content {
  text-align: center;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.info-content h3 {
  margin: 16px 0 12px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.info-content p {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.status-section {
  padding: 40px 20px 60px;
  background: #f5f7fa;
}

.status-section .el-card {
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.status-section h3 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafbfc;
  border-radius: 8px;
}

.status-label {
  font-weight: 500;
  color: #606266;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-features {
    gap: 30px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-actions .el-button {
    width: 100%;
    max-width: 300px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 60px 15px 40px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-features {
    gap: 20px;
  }

  .info-section {
    padding: 40px 15px;
  }

  .status-section {
    padding: 30px 15px 40px;
  }
}
</style>