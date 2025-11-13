<template>
  <div class="comment-form-container">
    <el-card class="comment-form-card">
      <template #header>
        <span class="card-title">发表评论</span>
      </template>

      <!-- Markdown 编辑器和预览切换 -->
      <div class="editor-tabs">
        <div :class="['tab-button', { active: isPreview === false }]" @click="isPreview = false">
          ✏️ 编辑
        </div>
        <div :class="['tab-button', { active: isPreview === true }]" @click="isPreview = true">
          👁️ 预览
        </div>
        <span class="char-count">{{ content.length }}/2000</span>
      </div>

      <!-- 编辑模式 -->
      <div v-if="!isPreview" class="edit-mode">
        <el-input
          v-model="content"
          type="textarea"
          :rows="6"
          placeholder="写下你的评论... 支持 Markdown 格式"
          :maxlength="2000"
          show-word-limit
        />

        <!-- Markdown 快速工具栏 -->
        <div class="markdown-toolbar">
          <el-button-group>
            <el-button size="small" @click="insertMarkdown('**', '**', '粗体')">
              <el-icon><EditPen /></el-icon> 粗体
            </el-button>
            <el-button size="small" @click="insertMarkdown('*', '*', '斜体')">
              <el-icon><Edit /></el-icon> 斜体
            </el-button>
            <el-button size="small" @click="insertMarkdown('[', '](url)', '链接')">
              <el-icon><Link /></el-icon> 链接
            </el-button>
            <el-button size="small" @click="insertMarkdown('`', '`', '代码')">
              <el-icon><Cpu /></el-icon> 代码
            </el-button>
          </el-button-group>
          <el-button-group style="margin-left: 12px">
            <el-button size="small" @click="insertMarkdown('- ', '', '列表项')">
              <el-icon><List /></el-icon> 列表
            </el-button>
            <el-button size="small" @click="insertMarkdown('> ', '', '引用')">
              <el-icon><DocumentCopy /></el-icon> 引用
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 预览模式 -->
      <div v-else class="preview-mode">
        <div class="preview-content">
          <MarkdownPreview :content="content" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleReset">清空</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          发表评论
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, Edit, Link, Cpu, List, DocumentCopy } from '@element-plus/icons-vue'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['submit'])

const content = ref('')
const isPreview = ref(false)
const submitting = ref(false)
const textareaRef = ref(null)

const insertMarkdown = (before, after, placeholder) => {
  const textarea = document.querySelector('.comment-form-container textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end) || placeholder
  const text = content.value.substring(0, start) + before + selectedText + after + content.value.substring(end)

  content.value = text

  // 恢复光标位置
  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

const handleSubmit = async () => {
  const trimmed = content.value.trim()

  if (!trimmed) {
    ElMessage.warning('请输入评论内容')
    return
  }

  if (trimmed.length > 2000) {
    ElMessage.warning('评论长度不能超过 2000 字符')
    return
  }

  submitting.value = true

  try {
    emit('submit', {
      content: trimmed,
      markdown: true,
    })
    content.value = ''
    isPreview.value = false
  } catch (error) {
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  content.value = ''
  isPreview.value = false
}
</script>

<style scoped lang="scss">
.comment-form-container {
  margin-bottom: 32px;

  .comment-form-card {
    :deep(.el-card__header) {
      padding: 16px;
      background: #f5f7fa;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .editor-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;

    .tab-button {
      padding: 6px 12px;
      background: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #606266;
      transition: all 0.3s;

      &:hover {
        background: #e0e0e0;
      }

      &.active {
        background: #409eff;
        color: white;
      }
    }

    .char-count {
      margin-left: auto;
      font-size: 12px;
      color: #909399;
    }
  }

  .edit-mode {
    :deep(.el-textarea) {
      margin-bottom: 12px;
    }
  }

  .preview-mode {
    .preview-content {
      padding: 16px;
      background: #f9f9f9;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      min-height: 200px;
    }
  }

  .markdown-toolbar {
    margin-bottom: 16px;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 4px;

    :deep(.el-button-group) {
      display: flex;

      .el-button {
        flex: 1;
        font-size: 12px;
        padding: 6px 8px;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }
}
</style>
