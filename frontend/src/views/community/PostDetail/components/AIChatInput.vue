<template>
  <div class="ai-chat-input">
    <!-- 输入框容器 -->
    <div class="input-wrapper">
      <textarea
        v-model="inputText"
        class="chat-textarea"
        placeholder="输入你的问题..."
        :disabled="isLoading"
        @keyup.enter.ctrl="handleSend"
        @keyup.meta.enter="handleSend"
        @input="adjustHeight"
      />

      <!-- 发送按钮 -->
      <button
        class="send-btn"
        :disabled="!inputText.trim() || isLoading"
        @click="handleSend"
        :title="isLoading ? '正在处理...' : '发送 (Ctrl+Enter)'"
      >
        <el-icon v-if="!isLoading" class="send-icon">
          <Message />
        </el-icon>
        <el-icon v-else class="loading-icon">
          <Loading />
        </el-icon>
      </button>
    </div>

    <!-- 快速问题建议（可选） -->
    <div v-if="suggestedQuestions.length > 0" class="suggested-questions">
      <button
        v-for="(question, index) in suggestedQuestions"
        :key="index"
        class="suggestion-btn"
        :disabled="isLoading"
        @click="selectQuestion(question)"
      >
        {{ question }}
      </button>
    </div>

    <!-- 提示文本 -->
    <div class="input-hint">
      <span v-if="isLoading" class="hint-loading">
        <el-icon><Loading /></el-icon>
        AI 正在思考...
      </span>
      <span v-else class="hint-text">
        💡 按 Ctrl+Enter 快速发送
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Message, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  suggestedQuestions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['send-message', 'select-question'])

const inputText = ref('')
const textareaRef = ref(null)

// 调整文本框高度
const adjustHeight = (event) => {
  const textarea = event.target
  textarea.style.height = 'auto'
  const newHeight = Math.min(textarea.scrollHeight, 120)
  textarea.style.height = newHeight + 'px'
}

// 发送消息
const handleSend = () => {
  if (!inputText.value.trim() || props.isLoading) return

  emit('send-message', inputText.value.trim())
  inputText.value = ''

  // 重置高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// 选择建议问题
const selectQuestion = (question) => {
  emit('select-question', question)
}

// 暴露方法给父组件
defineExpose({
  focus: () => textareaRef.value?.focus(),
})
</script>

<style scoped lang="scss">
.ai-chat-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #2d2d3d;
  border-top: 1px solid #3d3d4d;
}

// 输入框容器
.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: #1f1f2f;
  border: 1px solid #3d3d4d;
  border-radius: 8px;
  padding: 8px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
}

// 文本区域
.chat-textarea {
  flex: 1;
  padding: 8px;
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;
  max-height: 120px;
  min-height: 40px;

  &::placeholder {
    color: #666;
  }

  &:disabled {
    color: #999;
    cursor: not-allowed;
  }
}

// 发送按钮
.send-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: #667eea;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;

  &:hover:not(:disabled) {
    background: #764ba2;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-icon {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 建议问题
.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 6px 12px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 6px;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;

  &:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 提示文本
.input-hint {
  font-size: 12px;
  color: #888;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;

  .hint-loading {
    color: #667eea;
    display: flex;
    align-items: center;
    gap: 4px;

    :deep(.el-icon) {
      animation: spin 1s linear infinite;
    }
  }
}
</style>
