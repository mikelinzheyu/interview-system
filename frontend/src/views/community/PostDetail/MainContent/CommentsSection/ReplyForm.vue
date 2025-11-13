<template>
  <div class="reply-form">
    <div class="form-wrapper">
      <el-input
        v-model="content"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        @keydown.ctrl.enter="handleSubmit"
      />

      <!-- Markdown 快速工具栏 -->
      <div class="markdown-toolbar">
        <el-button-group size="small">
          <el-button @click="insertMarkdown('**', '**', '粗体')">
            <el-icon><EditPen /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('*', '*', '斜体')">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button @click="insertMarkdown('`', '`', '代码')">
            <el-icon><Cpu /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <span class="char-count">{{ content.length }}/500</span>
        <div>
          <el-button size="small" @click="handleCancel">取消</el-button>
          <el-button type="primary" size="small" :loading="submitting" @click="handleSubmit">
            回复
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Edit, Cpu } from '@element-plus/icons-vue'

const props = defineProps({
  commentId: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: '写下你的回复...',
  },
})

const emit = defineEmits(['submit', 'cancel'])

const content = ref('')
const submitting = ref(false)

const insertMarkdown = (before, after, placeholder) => {
  const textarea = document.querySelector('.reply-form textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end) || placeholder
  const text = content.value.substring(0, start) + before + selectedText + after + content.value.substring(end)

  content.value = text

  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

const handleSubmit = async () => {
  const trimmed = content.value.trim()

  if (!trimmed) {
    ElMessage.warning('请输入回复内容')
    return
  }

  if (trimmed.length > 500) {
    ElMessage.warning('回复长度不能超过 500 字符')
    return
  }

  submitting.value = true

  try {
    emit('submit', {
      content: trimmed,
    })
    content.value = ''
  } catch (error) {
    ElMessage.error('回复失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  content.value = ''
  emit('cancel')
}
</script>

<style scoped lang="scss">
.reply-form {
  margin: 12px 0 0 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;

  .form-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;

    :deep(.el-textarea) {
      margin-bottom: 0;
    }
  }

  .markdown-toolbar {
    display: flex;
    gap: 8px;

    :deep(.el-button-group) {
      display: flex;
      gap: 0;

      .el-button {
        padding: 6px 10px;
        font-size: 12px;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .char-count {
      font-size: 12px;
      color: #909399;
    }

    > div {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
