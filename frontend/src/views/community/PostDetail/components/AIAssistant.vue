<template>
  <div class="ai-assistant-panel">
    <!-- AI 摘要 -->
    <el-card class="ai-summary-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-icon">✨</span>
          <span class="header-title">AI 智能摘要</span>
          <el-button
            v-if="!summary && !loadingSummary"
            size="small"
            type="primary"
            @click="generateSummary"
          >
            生成摘要
          </el-button>
        </div>
      </template>

      <div v-if="loadingSummary" class="loading-state">
        <el-skeleton :rows="3" animated />
        <p class="loading-text">AI 正在分析文章内容...</p>
      </div>

      <div v-else-if="summary" class="summary-content">
        <div class="summary-bullets">
          <div
            v-for="(point, index) in summary.keyPoints"
            :key="index"
            class="bullet-point"
          >
            <span class="bullet-icon">💡</span>
            <span class="bullet-text">{{ point }}</span>
          </div>
        </div>

        <div v-if="summary.metaDescription" class="meta-description">
          <h5>文章简介</h5>
          <p>{{ summary.metaDescription }}</p>
        </div>
      </div>

      <el-empty
        v-else
        description="点击按钮生成 AI 摘要"
        :image-size="60"
      />
    </el-card>

    <!-- AI 问答 -->
    <el-card class="ai-qa-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-icon">💬</span>
          <span class="header-title">AI 智能问答</span>
        </div>
      </template>

      <!-- 历史对话 -->
      <div class="qa-history" ref="qaHistoryRef">
        <div
          v-for="(item, index) in qaHistory"
          :key="index"
          class="qa-item"
          :class="{ 'qa-question': item.type === 'question', 'qa-answer': item.type === 'answer' }"
        >
          <div class="qa-avatar">
            {{ item.type === 'question' ? '🧑' : '🤖' }}
          </div>
          <div class="qa-content">
            <p v-if="item.type === 'answer' && item.streaming" class="streaming-indicator">
              正在思考<span class="dots">...</span>
            </p>
            <p v-else>{{ item.content }}</p>
          </div>
        </div>

        <el-empty
          v-if="qaHistory.length === 0"
          description="向 AI 提问关于本文的任何问题"
          :image-size="80"
        />
      </div>

      <!-- 输入框 -->
      <div class="qa-input-container">
        <el-input
          v-model="userQuestion"
          placeholder="请输入您的问题..."
          @keyup.enter="askQuestion"
          :disabled="loadingAnswer"
        >
          <template #append>
            <el-button
              :icon="loadingAnswer ? '' : 'ChatDotRound'"
              :loading="loadingAnswer"
              @click="askQuestion"
              type="primary"
            >
              {{ loadingAnswer ? '思考中' : '提问' }}
            </el-button>
          </template>
        </el-input>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  postId: {
    type: [String, Number],
    required: true
  },
  content: {
    type: String,
    default: ''
  }
})

// AI 摘要相关
const loadingSummary = ref(false)
const summary = ref(null)

// AI 问答相关
const userQuestion = ref('')
const loadingAnswer = ref(false)
const qaHistory = ref([])
const qaHistoryRef = ref(null)

/**
 * 生成 AI 摘要
 */
const generateSummary = async () => {
  loadingSummary.value = true

  try {
    // TODO: 调用真实的 AI API
    // const response = await fetch('/api/ai/summarize', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     postId: props.postId,
    //     content: props.content
    //   })
    // })
    // const data = await response.json()

    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 模拟 AI 摘要数据
    summary.value = {
      keyPoints: [
        '本文详细介绍了社区帖子详情页面的重构方案',
        '采用组件化和模块化的设计思路，提高代码可维护性',
        '引入了 AI 辅助功能，提升用户阅读体验'
      ],
      metaDescription:
        '一份全面的社区详情页重构指南，包含前端架构优化、性能提升和 AI 功能集成的最佳实践。'
    }

    ElMessage.success('摘要生成成功')
  } catch (error) {
    console.error('生成摘要失败:', error)
    ElMessage.error('生成摘要失败，请重试')
  } finally {
    loadingSummary.value = false
  }
}

/**
 * 向 AI 提问
 */
const askQuestion = async () => {
  if (!userQuestion.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  const question = userQuestion.value.trim()

  // 添加用户问题到历史
  qaHistory.value.push({
    type: 'question',
    content: question
  })

  // 添加 AI 回答占位符
  qaHistory.value.push({
    type: 'answer',
    content: '',
    streaming: true
  })

  userQuestion.value = ''
  loadingAnswer.value = true

  // 滚动到底部
  nextTick(() => {
    if (qaHistoryRef.value) {
      qaHistoryRef.value.scrollTop = qaHistoryRef.value.scrollHeight
    }
  })

  try {
    // TODO: 调用真实的 AI API（支持流式响应）
    // const response = await fetch('/api/ai/qa', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     postId: props.postId,
    //     content: props.content,
    //     question: question,
    //     history: qaHistory.value
    //   })
    // })

    // 模拟流式响应
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockAnswer = `根据文章内容，${question} 的答案是：这是一个关于社区详情页重构的技术方案，重点在于提升用户体验和代码质量。建议采用模块化设计和性能优化策略。`

    // 更新最后一条回答
    const lastIndex = qaHistory.value.length - 1
    qaHistory.value[lastIndex] = {
      type: 'answer',
      content: mockAnswer,
      streaming: false
    }

    // 滚动到底部
    nextTick(() => {
      if (qaHistoryRef.value) {
        qaHistoryRef.value.scrollTop = qaHistoryRef.value.scrollHeight
      }
    })
  } catch (error) {
    console.error('AI 问答失败:', error)
    ElMessage.error('提问失败，请重试')

    // 移除失败的回答
    qaHistory.value.pop()
  } finally {
    loadingAnswer.value = false
  }
}
</script>

<style scoped lang="scss">
.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;

  /* 卡片头部 */
  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      font-size: 20px;
    }

    .header-title {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  /* AI 摘要卡片 */
  .ai-summary-card {
    .loading-state {
      .loading-text {
        margin-top: 16px;
        text-align: center;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .summary-content {
      .summary-bullets {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 20px;

        .bullet-point {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px;
          background: var(--el-fill-color-light);
          border-radius: 8px;
          transition: transform 0.2s, box-shadow 0.2s;

          &:hover {
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .bullet-icon {
            font-size: 18px;
            flex-shrink: 0;
          }

          .bullet-text {
            flex: 1;
            font-size: 14px;
            line-height: 1.6;
            color: var(--el-text-color-primary);
          }
        }
      }

      .meta-description {
        padding: 16px;
        background: linear-gradient(
          135deg,
          rgba(64, 158, 255, 0.1) 0%,
          rgba(103, 194, 58, 0.1) 100%
        );
        border-radius: 8px;
        border-left: 3px solid var(--el-color-primary);

        h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        p {
          margin: 0;
          font-size: 14px;
          line-height: 1.8;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  /* AI 问答卡片 */
  .ai-qa-card {
    .qa-history {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;

      /* 滚动条样式 */
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--el-fill-color);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 3px;

        &:hover {
          background: var(--el-border-color-dark);
        }
      }

      .qa-item {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        align-items: flex-start;

        .qa-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          background: var(--el-bg-color);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .qa-content {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
          word-wrap: break-word;

          p {
            margin: 0;
          }

          .streaming-indicator {
            color: var(--el-text-color-secondary);
            font-style: italic;

            .dots {
              display: inline-block;
              animation: dots 1.5s infinite;
            }
          }
        }

        &.qa-question {
          flex-direction: row-reverse;

          .qa-content {
            background: var(--el-color-primary-light-9);
            color: var(--el-text-color-primary);
          }
        }

        &.qa-answer {
          .qa-content {
            background: var(--el-bg-color);
            border: 1px solid var(--el-border-color-light);
          }
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .qa-input-container {
      margin-top: 12px;
    }
  }
}

/* 动画 */
@keyframes dots {
  0%,
  20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60%,
  100% {
    content: '...';
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-assistant-panel {
    .ai-qa-card {
      .qa-history {
        max-height: 300px;
      }
    }
  }
}
</style>
