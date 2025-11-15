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

      <!-- 分栏编辑器（新设计） -->
      <div class="split-editor">
        <!-- 左侧：编辑区 -->
        <div class="editor-column">
          <!-- 编辑器头部 -->
          <div class="editor-header">
            <span class="editor-title">✏️ 编辑</span>
            <span class="char-count">{{ content.length }}/2000</span>
          </div>

          <!-- 编辑输入框 -->
          <el-input
            ref="textareaRef"
            v-model="content"
            type="textarea"
            :rows="8"
            placeholder="写下你的评论... 支持 Markdown 格式 (Ctrl/Cmd + Enter 快速提交)"
            :maxlength="2000"
            show-word-limit
            @keydown.ctrl.enter="handleKeyboardSubmit"
            @keydown.meta.enter="handleKeyboardSubmit"
            class="editor-textarea"
          />

          <!-- Markdown 快速工具栏 -->
          <div class="markdown-toolbar">
            <el-button-group>
              <el-button size="small" @click="insertMarkdown('**', '**', '粗体')" title="粗体">
                <el-icon><EditPen /></el-icon> B
              </el-button>
              <el-button size="small" @click="insertMarkdown('*', '*', '斜体')" title="斜体">
                <el-icon><Edit /></el-icon> I
              </el-button>
              <el-button size="small" @click="insertMarkdown('[', '](url)', '链接')" title="链接">
                <el-icon><Link /></el-icon>
              </el-button>
              <el-button size="small" @click="insertMarkdown('`', '`', '代码')" title="代码">
                <el-icon><Cpu /></el-icon>
              </el-button>
            </el-button-group>

            <el-button-group style="margin-left: 12px">
              <el-button size="small" @click="insertMarkdown('- ', '', '列表项')" title="列表">
                <el-icon><List /></el-icon>
              </el-button>
              <el-button size="small" @click="insertMarkdown('> ', '', '引用')" title="引用">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
              <el-button size="small" @click="insertMarkdown('![', '](url)', '图片')" title="图片">
                <el-icon><Picture /></el-icon>
              </el-button>
            </el-button-group>

            <el-button-group style="margin-left: 12px">
              <el-popover placement="bottom" trigger="click" :width="400">
                <template #reference>
                  <el-button size="small" title="表情">
                    😀 表情
                  </el-button>
                </template>
                <EmojiPicker @select="insertEmoji" />
              </el-popover>
            </el-button-group>
          </div>
        </div>

        <!-- 右侧：实时预览区 -->
        <div class="preview-column">
          <!-- 预览器头部 -->
          <div class="preview-header">
            <span class="preview-title">👁️ 预览</span>
          </div>

          <!-- 实时预览内容 -->
          <div class="preview-content">
            <MarkdownPreview :content="content" />
          </div>
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
import EmojiPicker from '@/components/EmojiPicker.vue'
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
  } catch (error) {
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  content.value = ''
  clearDraftFromStorage()
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

  // 分栏编辑器布局
  .split-editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    min-height: 500px;

    // 响应式：平板设备折叠为单栏
    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
      min-height: auto;
    }

    // 响应式：手机设备
    @media (max-width: 768px) {
      gap: 0;
      min-height: auto;
    }
  }

  // 编辑列
  .editor-column {
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e0e0e0;

    @media (max-width: 1200px) {
      border-right: none;
      border-bottom: 1px solid #e0e0e0;
    }

    @media (max-width: 768px) {
      border-bottom: none;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f9f9f9;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 500;
      font-size: 14px;
      color: #606266;

      .editor-title {
        font-weight: 600;
      }

      .char-count {
        font-size: 12px;
        color: #909399;
      }
    }

    .editor-textarea {
      flex: 1;
      border: none !important;

      :deep(.el-textarea__inner) {
        border: none;
        resize: none;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 13px;
      }
    }

    .markdown-toolbar {
      border-top: 1px solid #e0e0e0;
      padding: 12px 16px;
      background: #fafafa;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      :deep(.el-button-group) {
        display: flex;

        .el-button {
          flex: none;
          font-size: 12px;
          padding: 6px 8px;
          min-width: auto;
        }
      }
    }
  }

  // 预览列
  .preview-column {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .preview-header {
      padding: 12px 16px;
      background: #f9f9f9;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 600;
      font-size: 14px;
      color: #606266;

      .preview-title {
        font-weight: 600;
      }
    }

    .preview-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: white;

      :deep(.markdown-preview) {
        font-size: 14px;
        line-height: 1.6;
        color: #303133;

        p {
          margin: 8px 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        strong {
          font-weight: 600;
          color: #000;
        }

        em {
          font-style: italic;
        }

        code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          color: #c41d7f;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        a {
          color: #409eff;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        ul, ol {
          margin: 8px 0 8px 20px;

          li {
            margin: 4px 0;
          }
        }

        blockquote {
          margin: 8px 0;
          padding: 8px 12px;
          background: #f0f0f0;
          border-left: 3px solid #409eff;
          color: #666;
        }
      }
    }
  }

  // 操作按钮
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }
}
</style>
