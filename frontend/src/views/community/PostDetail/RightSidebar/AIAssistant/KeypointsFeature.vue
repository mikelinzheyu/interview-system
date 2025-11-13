<template>
  <div class="keypoints-feature">
    <!-- 提取按钮 -->
    <el-button
      v-if="keypoints.length === 0"
      type="primary"
      :loading="isLoading"
      @click="handleExtractKeypoints"
      class="extract-btn"
    >
      {{ isLoading ? '提取中...' : '📌 提取关键点' }}
    </el-button>

    <!-- 关键点展示 -->
    <div v-if="keypoints.length > 0" class="keypoints-result">
      <div class="keypoints-header">
        <span class="badge">关键点</span>
        <div class="keypoints-actions">
          <el-button text type="primary" size="small" @click="handleCopy">
            <el-icon><DocumentCopy /></el-icon> 复制
          </el-button>
          <el-button text type="danger" size="small" @click="handleReset">
            <el-icon><Refresh /></el-icon> 重新提取
          </el-button>
        </div>
      </div>

      <ul class="keypoints-list">
        <li v-for="(point, idx) in keypoints" :key="idx" class="keypoint-item">
          <span class="point-number">{{ idx + 1 }}</span>
          <span class="point-text">{{ point }}</span>
        </li>
      </ul>

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
      <div v-for="i in 3" :key="i" class="skeleton-item">
        <div class="skeleton-dot"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Refresh, SuccessFilled } from '@element-plus/icons-vue'
import { extractArticleKeypoints } from '@/api/ai'

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
const keypoints = ref([])
const fromCache = ref(false)
const error = ref(null)

const handleExtractKeypoints = async () => {
  if (!props.articleContent) {
    error.value = '文章内容为空'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await extractArticleKeypoints({
      content: props.articleContent,
      postId: props.postId,
    })

    keypoints.value = response.data.keypoints
    fromCache.value = response.data.fromCache || false
    ElMessage.success('关键点提取成功')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || '关键点提取失败，请稍后重试'
    console.error('Extract keypoints error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleCopy = () => {
  const text = keypoints.value
    .map((point, idx) => `${idx + 1}. ${point}`)
    .join('\n')

  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请重试')
  })
}

const handleReset = () => {
  keypoints.value = []
  fromCache.value = false
}
</script>

<style scoped lang="scss">
.keypoints-feature {
  padding: 12px 0;

  .extract-btn {
    width: 100%;
  }

  .keypoints-result {
    margin-top: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 6px;
    border-left: 3px solid #409eff;

    .keypoints-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .badge {
        background: #e6f7ff;
        color: #0050b3;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }

      .keypoints-actions {
        display: flex;
        gap: 6px;
      }
    }

    .keypoints-list {
      margin: 0;
      padding: 0;
      list-style: none;

      .keypoint-item {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }

        .point-number {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #409eff;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
        }

        .point-text {
          color: #303133;
          word-wrap: break-word;
        }
      }
    }

    .cache-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #52c41a;
      margin-top: 8px;

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

    .skeleton-item {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      .skeleton-dot {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.3) 0%,
          rgba(255, 255, 255, 0.6) 50%,
          rgba(255, 255, 255, 0.3) 100%
        );
        border-radius: 50%;
        animation: loading 1.5s infinite;
      }

      .skeleton-line {
        flex: 1;
        height: 12px;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.3) 0%,
          rgba(255, 255, 255, 0.6) 50%,
          rgba(255, 255, 255, 0.3) 100%
        );
        border-radius: 4px;
        animation: loading 1.5s infinite;
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
