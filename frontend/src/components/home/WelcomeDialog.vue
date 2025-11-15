<template>
  <el-dialog
    v-model="isVisible"
    title="欢迎使用系统"
    width="500px"
    :before-close="handleClose"
    center
    @close="handleDialogClose"
  >
    <!-- 欢迎内容 -->
    <div class="welcome-content">
      <!-- 欢迎图标 -->
      <div class="welcome-icon">
        <el-icon :size="80" color="#667eea">
          <CircleCheckFilled />
        </el-icon>
      </div>

      <!-- 欢迎文本 -->
      <h2 class="welcome-title">欢迎加入AI面试官</h2>
      <p class="welcome-subtitle">准备好开始您的面试之旅了吗？</p>

      <!-- 功能亮点 -->
      <div class="features-list">
        <div class="feature-item">
          <el-icon class="feature-icon">
            <VideoPlay />
          </el-icon>
          <span>与AI进行真实的面试对话</span>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon">
            <Document />
          </el-icon>
          <span>海量题库和分类练习</span>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon">
            <DataAnalysis />
          </el-icon>
          <span>详细的成绩分析和建议</span>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon">
            <Trophy />
          </el-icon>
          <span>排行榜和成就系统</span>
        </div>
      </div>

      <!-- 快速开始提示 -->
      <div class="quick-start-tip">
        <el-icon class="tip-icon">
          <InfoFilled />
        </el-icon>
        <div>
          <div class="tip-title">快速开始</div>
          <div class="tip-text">点击下方"开始面试"按钮开始您的第一次面试体验</div>
        </div>
      </div>
    </div>

    <!-- Dialog 页脚 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">稍后再看</el-button>
        <el-button type="primary" size="default" @click="handleStartInterview">
          开始面试
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  CircleCheckFilled,
  VideoPlay,
  Document,
  DataAnalysis,
  Trophy,
  InfoFilled
} from '@element-plus/icons-vue'

const router = useRouter()

// 是否显示对话框
const isVisible = ref(false)

// 检查是否应该显示欢迎对话框
const shouldShowWelcome = () => {
  // 从 localStorage 检查是否已显示过
  const hasShownWelcome = localStorage.getItem('hasShownWelcomeDialog')
  return !hasShownWelcome
}

// 标记已显示欢迎对话框
const markWelcomeAsShown = () => {
  localStorage.setItem('hasShownWelcomeDialog', 'true')
  localStorage.setItem('welcomeDialogShownAt', new Date().toISOString())
}

// 关闭对话框处理
const handleClose = () => {
  isVisible.value = false
  markWelcomeAsShown()
}

// Dialog关闭事件
const handleDialogClose = () => {
  markWelcomeAsShown()
}

// 开始面试处理
const handleStartInterview = () => {
  handleClose()
  router.push('/interview/new')
}

// 可选：手动显示欢迎对话框（用于设置中的"重新显示"）
const showWelcome = () => {
  isVisible.value = true
}

// 清除已显示标记（用于测试）
const resetWelcome = () => {
  localStorage.removeItem('hasShownWelcomeDialog')
  localStorage.removeItem('welcomeDialogShownAt')
}

// 挂载时检查是否应该显示
onMounted(() => {
  if (shouldShowWelcome()) {
    // 使用 setTimeout 确保 DOM 完全渲染后再显示
    setTimeout(() => {
      isVisible.value = true
    }, 500)
  }
})

// 暴露方法给父组件
defineExpose({
  showWelcome,
  resetWelcome,
  markWelcomeAsShown
})
</script>

<style scoped>
/* Dialog 容器 */
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  padding: 24px;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

:deep(.el-dialog__close) {
  color: white;
}

:deep(.el-dialog__close:hover) {
  color: rgba(255, 255, 255, 0.8);
}

/* 欢迎内容 */
.welcome-content {
  padding: 24px;
  text-align: center;
}

.welcome-icon {
  margin-bottom: 20px;
  animation: bounceIn 0.6s ease-out;
}

.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0 0 28px 0;
}

/* 功能列表 */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: #e8edf5;
  transform: translateX(4px);
}

.feature-icon {
  flex-shrink: 0;
  color: #667eea;
  font-size: 18px;
}

.feature-item span {
  font-size: 14px;
  color: #606266;
}

/* 快速开始提示 */
.quick-start-tip {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.tip-icon {
  flex-shrink: 0;
  color: #667eea;
  font-size: 20px;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.tip-text {
  font-size: 13px;
  color: #606266;
}

/* Dialog 页脚 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

:deep(.el-dialog__footer) {
  padding: 0 24px 24px 24px;
}

/* 动画 */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 !important;
  }

  .welcome-content {
    padding: 16px;
  }

  .welcome-title {
    font-size: 18px;
  }

  .dialog-footer {
    flex-direction: column;
  }

  :deep(.el-dialog__footer .el-button) {
    width: 100%;
  }
}
</style>
