<template>
  <div class="error-boundary">
    <!-- 正常内容显示 -->
    <div v-if="!hasError" class="content-wrapper">
      <slot />
    </div>

    <!-- 错误回退UI -->
    <div v-else class="error-fallback">
      <!-- MediaUtils相关错误的特殊处理 -->
      <div v-if="errorType === 'media'" class="media-error-fallback">
        <el-card class="error-card">
          <div class="error-icon">
            <el-icon size="48" color="#f56c6c"><VideoCameraFilled /></el-icon>
          </div>
          <div class="error-content">
            <h3>媒体设备访问失败</h3>
            <p>{{ errorMessage }}</p>
            <div class="error-suggestions">
              <h4>可能的解决方案：</h4>
              <ul>
                <li>检查浏览器是否允许摄像头和麦克风权限</li>
                <li>确保摄像头和麦克风设备正常连接</li>
                <li>尝试关闭其他正在使用摄像头的应用程序</li>
                <li>使用HTTPS协议访问页面</li>
              </ul>
            </div>
            <div class="error-actions">
              <el-button type="primary" @click="retryMediaAccess">
                <el-icon><Refresh /></el-icon>
                重试访问设备
              </el-button>
              <el-button @click="switchToTextMode">
                <el-icon><Edit /></el-icon>
                切换到文字模式
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- API相关错误的特殊处理 -->
      <div v-else-if="errorType === 'api'" class="api-error-fallback">
        <el-card class="error-card">
          <div class="error-icon">
            <el-icon size="48" color="#e6a23c"><Connection /></el-icon>
          </div>
          <div class="error-content">
            <h3>服务连接失败</h3>
            <p>{{ errorMessage }}</p>
            <div class="error-details" v-if="showDetails">
              <p><strong>错误类型:</strong> {{ errorDetails.type }}</p>
              <p><strong>状态码:</strong> {{ errorDetails.status }}</p>
              <p><strong>请求URL:</strong> {{ errorDetails.url }}</p>
              <p><strong>时间戳:</strong> {{ errorDetails.timestamp }}</p>
            </div>
            <div class="error-actions">
              <el-button type="primary" @click="retryAPICall">
                <el-icon><Refresh /></el-icon>
                重试请求
              </el-button>
              <el-button @click="switchToOfflineMode">
                <el-icon><OfflinePin /></el-icon>
                离线模式
              </el-button>
              <el-button @click="showDetails = !showDetails">
                <el-icon><Info /></el-icon>
                {{ showDetails ? '隐藏' : '显示' }}详情
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 通用错误处理 -->
      <div v-else class="generic-error-fallback">
        <el-card class="error-card">
          <div class="error-icon">
            <el-icon size="48" color="#f56c6c"><WarningFilled /></el-icon>
          </div>
          <div class="error-content">
            <h3>程序运行异常</h3>
            <p>{{ errorMessage }}</p>
            <div class="error-actions">
              <el-button type="primary" @click="retry">
                <el-icon><Refresh /></el-icon>
                重新加载
              </el-button>
              <el-button @click="goHome">
                <el-icon><HomeFilled /></el-icon>
                返回首页
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import {
  VideoCameraFilled,
  Connection,
  WarningFilled,
  Refresh,
  Edit,
  OfflinePin,
  Info,
  HomeFilled
} from '@element-plus/icons-vue'

const emit = defineEmits(['error', 'retry'])
const props = defineProps({
  // 是否自动重试
  autoRetry: {
    type: Boolean,
    default: false
  },
  // 最大重试次数
  maxRetries: {
    type: Number,
    default: 3
  }
})

const router = useRouter()

// 错误状态
const hasError = ref(false)
const errorMessage = ref('')
const errorType = ref('generic')
const errorDetails = ref({})
const showDetails = ref(false)
const retryCount = ref(0)

/**
 * 捕获子组件错误
 */
onErrorCaptured((error, instance, errorInfo) => {
  console.error('ErrorBoundary捕获到错误:', error, errorInfo)

  hasError.value = true
  errorMessage.value = error.message || '未知错误'

  // 智能错误分类
  classifyError(error)

  // 记录错误详情
  recordErrorDetails(error, errorInfo)

  // 触发错误事件
  emit('error', {
    error,
    errorInfo,
    type: errorType.value,
    details: errorDetails.value
  })

  // 自动重试逻辑
  if (props.autoRetry && retryCount.value < props.maxRetries) {
    setTimeout(() => {
      autoRetry()
    }, 2000 * Math.pow(2, retryCount.value)) // 指数退避
  }

  // 阻止错误向上传播
  return false
})

/**
 * 智能错误分类
 */
function classifyError(error) {
  const errorMsg = error.message?.toLowerCase() || ''

  if (errorMsg.includes('mediutils') || errorMsg.includes('camera') || errorMsg.includes('microphone')) {
    errorType.value = 'media'
  } else if (errorMsg.includes('404') || errorMsg.includes('network') || errorMsg.includes('api')) {
    errorType.value = 'api'
  } else {
    errorType.value = 'generic'
  }
}

/**
 * 记录错误详情
 */
function recordErrorDetails(error, errorInfo) {
  errorDetails.value = {
    type: error.name || 'Unknown',
    message: error.message || '无详细信息',
    stack: error.stack?.substring(0, 500) || '无堆栈信息',
    status: error.response?.status || 'N/A',
    url: error.config?.url || 'N/A',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.substring(0, 100),
    retryCount: retryCount.value
  }
}

/**
 * 重试媒体设备访问
 */
async function retryMediaAccess() {
  try {
    // 重新检查媒体支持
    const MediaUtils = (await import('@/utils/mediaUtils.js')).default
    const support = MediaUtils.checkSupport()

    if (!support.video || !support.audio) {
      throw new Error('浏览器不支持所需的媒体功能')
    }

    // 尝试重新获取权限
    const permissions = await MediaUtils.requestPermissions()
    if (permissions.camera && permissions.microphone) {
      resetErrorState()
      ElMessage.success('媒体设备访问成功')
    } else {
      throw new Error('无法获取媒体设备权限')
    }
  } catch (error) {
    ElMessage.error('媒体设备访问仍然失败: ' + error.message)
  }
}

/**
 * 切换到文字模式
 */
function switchToTextMode() {
  // 触发父组件切换到文字输入模式
  emit('retry', { mode: 'text' })
  resetErrorState()
}

/**
 * 重试API调用
 */
async function retryAPICall() {
  try {
    retryCount.value++
    resetErrorState()

    // 等待一小段时间让组件重新渲染
    await nextTick()

    ElNotification.info({
      title: '正在重试',
      message: `第${retryCount.value}次重试中...`,
      duration: 2000
    })

    // 触发重试事件
    emit('retry', {
      type: 'api',
      retryCount: retryCount.value
    })

  } catch (error) {
    hasError.value = true
    errorMessage.value = '重试失败: ' + error.message
    ElMessage.error('重试失败，请稍后再试')
  }
}

/**
 * 切换到离线模式
 */
function switchToOfflineMode() {
  ElNotification.warning({
    title: '离线模式',
    message: '已切换到离线模式，部分功能可能受限',
    duration: 3000
  })

  emit('retry', { mode: 'offline' })
  resetErrorState()
}

/**
 * 通用重试
 */
function retry() {
  retryCount.value++
  resetErrorState()
  emit('retry', {
    type: 'generic',
    retryCount: retryCount.value
  })
}

/**
 * 自动重试
 */
function autoRetry() {
  retryCount.value++
  console.log(`自动重试第${retryCount.value}次`)

  resetErrorState()
  emit('retry', {
    type: 'auto',
    retryCount: retryCount.value
  })
}

/**
 * 返回首页
 */
function goHome() {
  router.push('/home')
}

/**
 * 重置错误状态
 */
function resetErrorState() {
  hasError.value = false
  errorMessage.value = ''
  errorType.value = 'generic'
  errorDetails.value = {}
  showDetails.value = false
}

/**
 * 暴露重置方法供父组件使用
 */
defineExpose({
  resetErrorState,
  hasError,
  errorType,
  retryCount
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.content-wrapper {
  width: 100%;
  height: 100%;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.error-card {
  max-width: 600px;
  width: 100%;
}

.error-icon {
  text-align: center;
  margin-bottom: 20px;
}

.error-content {
  text-align: center;
}

.error-content h3 {
  color: #303133;
  margin-bottom: 10px;
  font-size: 20px;
}

.error-content p {
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.6;
}

.error-suggestions {
  text-align: left;
  margin: 20px 0;
  padding: 15px;
  background: #fdf6ec;
  border-radius: 4px;
  border-left: 4px solid #e6a23c;
}

.error-suggestions h4 {
  color: #e6a23c;
  margin-bottom: 10px;
  font-size: 14px;
}

.error-suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.error-suggestions li {
  color: #606266;
  margin-bottom: 5px;
  font-size: 13px;
}

.error-details {
  text-align: left;
  margin: 15px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
}

.error-details p {
  margin: 5px 0;
  color: #606266;
}

.error-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.error-actions .el-button {
  min-width: 120px;
}

@media (max-width: 768px) {
  .error-fallback {
    padding: 10px;
    min-height: 300px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions .el-button {
    width: 200px;
  }
}
</style>