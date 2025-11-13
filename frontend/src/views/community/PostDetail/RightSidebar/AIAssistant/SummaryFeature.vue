<template>
  <div class="summary-feature">
    <!-- 生成按钮 -->
    <el-button
      v-if="!summary"
      type="primary"
      :loading="isLoading"
      @click="handleGenerateSummary"
      class="generate-btn"
    >
      {{ isLoading ? '生成中...' : '✨ 生成摘要' }}
    </el-button>

    <!-- 摘要展示 -->
    <div v-if="summary" class="summary-result">
      <div class="summary-header">
        <span class="badge">AI 摘要</span>
        <div class="summary-actions">
          <el-button text type="primary" size="small" @click="handleCopy">
            <el-icon><DocumentCopy /></el-icon> 复制
          </el-button>
          <el-button text type="danger" size="small" @click="handleReset">
            <el-icon><Refresh /></el-icon> 重新生成
          </el-button>
        </div>
      </div>
      <p class="summary-text">{{ summary }}</p>
      <span v-if="fromCache" class="cache-info">
        <el-icon><SuccessFilled /></el-icon>
        来自缓存（24小时内）
      </span>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="error = null"
      class="error-alert"
    />

    <!-- 加载动画 -->
    <div v-if="isLoading" class="loading-skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Refresh, SuccessFilled } from '@element-plus/icons-vue'
import { generateArticleSummary } from '@/api/ai'

const props = defineProps({
  articleContent: {
    type: String,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  },
})

const isLoading = ref(false)
const summary = ref('')
const fromCache = ref(false)
const error = ref(null)

const handleGenerateSummary = async () => {
  if (!props.articleContent) {
    error.value = '文章内容为空'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await generateArticleSummary({
      content: props.articleContent,
      postId: props.postId,
    })

    summary.value = response.data.summary
    fromCache.value = response.data.fromCache || false
    ElMessage.success('摘要生成成功')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || '摘要生成失败，请稍后重试'
    console.error('Generate summary error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleCopy = () => {
  navigator.clipboard.writeText(summary.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请重试')
  })
}

const handleReset = () => {
  summary.value = ''
  fromCache.value = false
}
</script>

<style scoped lang="scss">
.summary-feature {
  padding: 12px 0;

  .generate-btn {
    width: 100%;
  }

  .summary-result {
    margin-top: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    border-left: 3px solid #409eff;

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .badge {
        background: #e6f7ff;
        color: #0050b3;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }

      .summary-actions {
        display: flex;
        gap: 6px;
      }
    }

    .summary-text {
      font-size: 13px;
      line-height: 1.6;
      color: #303133;
      margin: 8px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .cache-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #52c41a;

      :deep(.el-icon) {
        font-size: 12px;
      }
    }
  }

  .error-alert {
    margin-top: 12px;
  }

  .loading-skeleton {
    margin-top: 12px;

    .skeleton-line {
      height: 12px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0.3) 100%
      );
      border-radius: 4px;
      margin-bottom: 8px;
      animation: loading 1.5s infinite;

      &.short {
        width: 80%;
      }
    }
  }
}

@keyframes loading {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}
</style>
