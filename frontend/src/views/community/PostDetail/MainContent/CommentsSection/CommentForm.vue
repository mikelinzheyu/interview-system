<template>
  <div class="comment-form-container">
    <el-card class="comment-form-card">
      <template #header>
        <span class="card-title">发表评论</span>
      </template>

      <!-- 草稿恢复提示 -->
      <div v-if="lastSaveTime" class="draft-hint">
        <el-alert
          title="检测到草稿"
          type="info"
          :closable="true"
          show-icon
        >
          <template #default>
            📝 您在此处有未提交的草稿，最后保存于 {{ lastSaveTime.toLocaleTimeString() }}
          </template>
        </el-alert>
      </div>

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
          ref="textareaRef"
          v-model="content"
          type="textarea"
          :rows="6"
          placeholder="写下你的评论... 支持 Markdown 格式 (Ctrl/Cmd + Enter 快速提交)"
          :maxlength="2000"
          show-word-limit
          @keydown.ctrl.enter="handleKeyboardSubmit"
          @keydown.meta.enter="handleKeyboardSubmit"
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
            <el-button size="small" @click="insertMarkdown('![', '](url)', '图片')">
              <el-icon><Picture /></el-icon> 图片
            </el-button>
          </el-button-group>
          <el-button-group style="margin-left: 12px">
            <el-popover placement="bottom" trigger="click" :width="300">
              <template #reference>
                <el-button size="small">
                  😀 表情
                </el-button>
              </template>
              <div class="emoji-picker">
                <div v-for="emoji in emojis" :key="emoji" class="emoji-item" @click="insertEmoji(emoji)">
                  {{ emoji }}
                </div>
              </div>
            </el-popover>
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
import { EditPen, Edit, Link, Cpu, List, DocumentCopy, Picture } from '@element-plus/icons-vue'
import MarkdownPreview from './MarkdownPreview.vue'
import { useDraft } from '@/composables/useDraft'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['submit'])

// 使用草稿保存（为每个帖子单独保存草稿）
const { content, lastSaveTime, clearDraft: clearDraftFromStorage } = useDraft(`comment-draft-post-${props.postId}`)

const isPreview = ref(false)
const submitting = ref(false)
const textareaRef = ref(null)

// 常用表情符号
const emojis = ref([
  '😀', '😂', '😍', '🤔', '😍', '🎉', '✨', '🔥',
  '👍', '👌', '💪', '🙌', '💯', '❤️', '😘', '😁',
  '😢', '😡', '😱', '😴', '🤨', '😏', '🙂', '😎',
  '🚀', '💡', '⚡', '🎯', '📝', '🎨', '📚', '💻',
])

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

// 插入表情符号
const insertEmoji = (emoji) => {
  const textarea = document.querySelector('.comment-form-container textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = content.value.substring(0, start) + emoji + content.value.substring(end)

  content.value = text

  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + emoji.length
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
    // 发表成功后清空草稿
    clearDraftFromStorage()
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
  clearDraftFromStorage()
  isPreview.value = false
}

/**
 * 处理快捷键提交（Ctrl/Cmd + Enter）
 */
const handleKeyboardSubmit = (e) => {
  // 防止在textarea中插入换行
  e.preventDefault()
  handleSubmit()
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

  // 草稿恢复提示
  .draft-hint {
    margin-bottom: 16px;

    :deep(.el-alert) {
      padding: 12px 16px;
      border-radius: 4px;
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

  .emoji-picker {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    padding: 8px;

    .emoji-item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      font-size: 20px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background: #f0f0f0;
        transform: scale(1.1);
      }
    }
  }
}
</style>
