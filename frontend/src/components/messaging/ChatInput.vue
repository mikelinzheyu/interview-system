<template>
  <div class="chat-input-wrapper">
    <!-- 工具栏 -->
    <div class="input-toolbar">
      <el-button text circle title="表情">😀</el-button>
      <el-button text circle title="上传文件">📎</el-button>
    </div>

    <!-- 输入框 -->
    <div class="input-box">
      <el-input
        v-model="messageText"
        type="textarea"
        :rows="3"
        :maxlength="500"
        placeholder="写下你的消息... (Ctrl+Enter / Cmd+Enter 发送)"
        @keydown.ctrl.enter="handleSend"
        @keydown.meta.enter="handleSend"
        show-word-limit
        clearable
      />
    </div>

    <!-- 操作按钮 -->
    <div class="input-actions">
      <el-button
        type="primary"
        :loading="sending"
        @click="handleSend"
        :disabled="!messageText.trim() || sending"
      >
        {{ sending ? '发送中...' : '发送' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['send'])

const messageText = ref('')
const sending = ref(false)

const handleSend = async () => {
  const text = messageText.value.trim()

  if (!text) {
    ElMessage.warning('消息不能为空')
    return
  }

  if (text.length > 500) {
    ElMessage.error('消息长度不能超过 500 字符')
    return
  }

  sending.value = true

  try {
    emit('send', { content: text })
    messageText.value = ''
  } catch (error) {
    console.error('[ChatInput] Send error:', error)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped lang="scss">
.chat-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e0e0e0;

  .input-toolbar {
    display: flex;
    gap: 8px;
  }

  .input-box {
    :deep(.el-textarea__inner) {
      resize: none;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: #d9d9d9;
        border-radius: 3px;

        &:hover {
          background: #b3b3b3;
        }
      }
    }
  }

  .input-actions {
    text-align: right;

    .el-button {
      min-width: 80px;
    }
  }
}
</style>
*** End Patch>>();
