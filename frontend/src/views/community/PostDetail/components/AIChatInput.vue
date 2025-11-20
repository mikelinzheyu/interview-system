<template>
  <div class="ai-chat-input">
    <!-- 输入框容器 -->
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="chat-textarea"
        placeholder="输入内容，与 AI 对话"
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

    <!-- 输入区底部控件 -->
    <div class="input-footer">
      <!-- Phase 3: 上下文切换开关 -->
      <div class="context-toggle">
        <el-switch
          v-model="useArticleContext"
          class="context-switch"
          :disabled="isLoading"
          @change="handleContextToggle"
        />
        <span class="toggle-label">结合博文对话</span>
        <span class="toggle-hint" :class="{ active: useArticleContext }">
          {{ useArticleContext ? '✓ 已启用' : '未启用' }}
        </span>
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
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
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

const emit = defineEmits(['send-message', 'select-question', 'context-toggle'])

const inputText = ref('')
const textareaRef = ref(null)

// Phase 3: 上下文切换状态
const useArticleContext = ref(true)

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

// Phase 3: 处理上下文切换
const handleContextToggle = (value) => {
  emit('context-toggle', value)
}

// 暴露方法给父组件
defineExpose({
  focus: () => textareaRef.value?.focus(),
  getContextMode: () => useArticleContext.value,
})
</script>

<style scoped lang="scss">
// AI 聊天输入容器 - 完全全宽
.ai-chat-input {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  background: #2d2d3d;
  border-top: 1px solid #3d3d4d;
  width: 100%;
}

// 输入框容器 - 全宽块级
.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 100%;
  background: #2d2d3d;
  border-top: 1px solid #3d3d4d;
  padding: 8px 16px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
}

// 文本区域 - 自适应全宽
.chat-textarea {
  flex: 1;
  width: 100%;
  max-width: none;
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
  width: 40px;
  height: 40px;
  padding: 0;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-size: 18px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
    z-index: 0;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5a9ff0 0%, #3d6fb0 100%);
    box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);

    &::before {
      width: 80px;
      height: 80px;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .send-icon,
  .loading-icon {
    position: relative;
    z-index: 1;
  }

  .loading-icon {
    animation: spin 1s linear infinite;
  }
}

// Phase 3: 输入区底部控件区域
.input-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(180deg,
    rgba(30, 30, 40, 0.5) 0%,
    rgba(25, 25, 35, 0.3) 100%);
  border-top: 1px solid rgba(74, 144, 226, 0.15);
  backdrop-filter: blur(8px);
}

// Phase 3: 上下文切换区域
.context-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 8px 12px;
  background: linear-gradient(135deg,
    rgba(74, 144, 226, 0.08) 0%,
    rgba(74, 144, 226, 0.03) 100%);
  border-radius: 6px;
  border: 1px solid rgba(74, 144, 226, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg,
      rgba(74, 144, 226, 0.12) 0%,
      rgba(74, 144, 226, 0.06) 100%);
    border-color: rgba(74, 144, 226, 0.3);
  }

  .context-switch {
    :deep(.el-switch__core) {
      background-color: rgba(61, 61, 77, 0.8);
      border-color: rgba(61, 61, 77, 0.8);

      &.is-checked {
        background-color: #4a90e2;
        border-color: #4a90e2;
      }
    }

    :deep(.el-switch.is-disabled .el-switch__core) {
      background-color: #2d2d3d;
      opacity: 0.6;
    }
  }

  .toggle-label {
    color: #d4e4ff;
    font-weight: 600;
    user-select: none;
    letter-spacing: 0.5px;
  }

  .toggle-hint {
    color: #888;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 3px 8px;
    background: transparent;
    border-radius: 4px;
    letter-spacing: 0.3px;

    &.active {
      color: #4adc6e;
      background: rgba(74, 220, 110, 0.15);
      border: 1px solid rgba(74, 220, 110, 0.3);
      font-weight: 600;
      box-shadow: 0 0 8px rgba(74, 220, 110, 0.2);
    }
  }
}

// 建议问题 - 全宽分布
.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

// 建议问题按钮
.suggestion-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg,
    rgba(74, 144, 226, 0.12) 0%,
    rgba(74, 144, 226, 0.06) 100%);
  border: 1.5px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: #a8d8ff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: none;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent);
    transition: left 0.4s ease;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg,
      rgba(74, 144, 226, 0.2) 0%,
      rgba(74, 144, 226, 0.12) 100%);
    border-color: rgba(74, 144, 226, 0.5);
    color: #e8f0ff;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
    transform: translateY(-1px);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
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
