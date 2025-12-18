<template>
  <div class="enhanced-comment-form">
    <div class="form-header">
      <h3>{{ replyTo ? `回复 @${replyTo}` : '发表评论' }}</h3>
      <div class="editor-tabs">
        <button
          :class="{ active: mode === 'edit' }"
          @click="mode = 'edit'"
          type="button"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </button>
        <button
          :class="{ active: mode === 'preview' }"
          @click="mode = 'preview'"
          type="button"
        >
          <el-icon><View /></el-icon>
          预览
        </button>
      </div>
    </div>

    <!-- 编辑模式 -->
    <div v-show="mode === 'edit'" class="editor-container">
      <textarea
        ref="textareaRef"
        v-model="content"
        placeholder="支持 Markdown 语法，可以使用 **粗体**、*斜体*、`代码`、[链接](url) 等格式..."
        class="comment-textarea"
        :rows="rows"
        @keydown.ctrl.enter="handleSubmit"
        @keydown.meta.enter="handleSubmit"
      ></textarea>

      <div class="editor-toolbar">
        <div class="toolbar-left">
          <el-tooltip content="粗体 (Ctrl+B)" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('**', '**', '粗体文本')"
            >
              <strong>B</strong>
            </button>
          </el-tooltip>

          <el-tooltip content="斜体 (Ctrl+I)" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('*', '*', '斜体文本')"
            >
              <em>I</em>
            </button>
          </el-tooltip>

          <el-tooltip content="删除线" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('~~', '~~', '删除线')"
            >
              <s>S</s>
            </button>
          </el-tooltip>

          <div class="toolbar-divider"></div>

          <el-tooltip content="代码" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('`', '`', '代码')"
            >
              <el-icon><Document /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="代码块" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('```\n', '\n```', '代码块')"
            >
              <el-icon><FolderOpened /></el-icon>
            </button>
          </el-tooltip>

          <div class="toolbar-divider"></div>

          <el-tooltip content="链接" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('[', '](url)', '链接文本')"
            >
              <el-icon><Link /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="引用" placement="top">
            <button
              type="button"
              class="toolbar-btn"
              @click="insertMarkdown('> ', '', '引用内容')"
            >
              <el-icon><ChatLineSquare /></el-icon>
            </button>
          </el-tooltip>

          <div class="toolbar-divider"></div>

          <el-upload
            :show-file-list="false"
            :before-upload="handleImageUpload"
            accept="image/*"
            :disabled="uploading"
          >
            <el-tooltip content="上传图片" placement="top">
              <button type="button" class="toolbar-btn" :disabled="uploading">
                <el-icon v-if="!uploading"><Picture /></el-icon>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </button>
            </el-tooltip>
          </el-upload>

          <el-tooltip content="表情" placement="top">
            <el-popover
              placement="top"
              :width="320"
              trigger="click"
            >
              <template #reference>
                <button type="button" class="toolbar-btn">
                  <el-icon><Sunny /></el-icon>
                </button>
              </template>
              <div class="emoji-picker">
                <button
                  v-for="emoji in commonEmojis"
                  :key="emoji"
                  type="button"
                  class="emoji-btn"
                  @click="insertEmoji(emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </el-popover>
          </el-tooltip>
        </div>

        <div class="toolbar-right">
          <span class="char-count" :class="{ warning: content.length > 4500, error: content.length > 5000 }">
            {{ content.length }}/5000
          </span>
        </div>
      </div>
    </div>

    <!-- 预览模式 -->
    <div v-show="mode === 'preview'" class="preview-container">
      <div v-if="content.trim()" class="preview-content">
        <MarkdownRendererEnhanced :content="content" />
      </div>
      <div v-else class="empty-preview">
        <el-empty description="暂无内容可预览" :image-size="80" />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <div class="left-actions">
        <el-tooltip content="Ctrl+Enter 快速提交" placement="top">
          <el-icon class="shortcut-hint"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>

      <div class="right-actions">
        <el-button @click="handleCancel" :disabled="submitting">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '发表评论' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Edit,
  View,
  Document,
  FolderOpened,
  Link,
  ChatLineSquare,
  Picture,
  Sunny,
  InfoFilled,
  Loading
} from '@element-plus/icons-vue'
import MarkdownRendererEnhanced from './MarkdownRendererEnhanced.vue'

const props = defineProps({
  replyTo: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 6
  }
})

const emit = defineEmits(['submit', 'cancel'])

const content = ref('')
const mode = ref('edit')
const submitting = ref(false)
const uploading = ref(false)
const textareaRef = ref(null)

const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '🎉', '🎊',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎'
]

const canSubmit = computed(() => {
  return content.value.trim().length > 0 && content.value.length <= 5000
})

// 插入 Markdown 格式
const insertMarkdown = (before, after, placeholder = '') => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  const textToInsert = selectedText || placeholder

  const newText = before + textToInsert + after
  const newContent = content.value.substring(0, start) + newText + content.value.substring(end)

  content.value = newContent

  // 设置光标位置
  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + before.length + textToInsert.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

// 插入表情
const insertEmoji = (emoji) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  content.value = content.value.substring(0, start) + emoji + content.value.substring(end)

  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + emoji.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

// 处理图片上传
const handleImageUpload = async (file) => {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、GIF、WebP 格式的图片')
    return false
  }

  // 验证文件大小 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }

  uploading.value = true

  try {
    // TODO: 实现真实的图片上传
    // const formData = new FormData()
    // formData.append('image', file)
    // const response = await uploadImage(formData)
    // const imageUrl = response.data.url

    // 临时方案：使用 base64
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟上传延迟

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target.result
      const markdown = `\n![${file.name}](${imageUrl})\n`

      const textarea = textareaRef.value
      const start = textarea.selectionStart
      content.value = content.value.substring(0, start) + markdown + content.value.substring(start)

      ElMessage.success('图片插入成功')
      uploading.value = false

      setTimeout(() => {
        textarea.focus()
        const cursorPos = start + markdown.length
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Upload error:', error)
    ElMessage.error('图片上传失败')
    uploading.value = false
  }

  return false // 阻止默认上传
}

// 提交评论
const handleSubmit = async () => {
  if (!canSubmit.value) {
    if (content.value.trim().length === 0) {
      ElMessage.warning('评论内容不能为空')
    } else if (content.value.length > 5000) {
      ElMessage.warning('评论内容不能超过 5000 字')
    }
    return
  }

  submitting.value = true

  try {
    await emit('submit', {
      content: content.value.trim(),
      replyTo: props.replyTo
    })

    content.value = ''
    mode.value = 'edit'
    ElMessage.success('评论发表成功')
  } catch (error) {
    console.error('Submit error:', error)
    ElMessage.error('评论发表失败')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = () => {
  content.value = ''
  mode.value = 'edit'
  emit('cancel')
}
</script>

<style scoped lang="scss">
.enhanced-comment-form {
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .editor-tabs {
      display: flex;
      gap: 0;

      button {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 16px;
        border: 1px solid #dcdfe6;
        background: white;
        color: #606266;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 13px;

        &:first-child {
          border-radius: 4px 0 0 4px;
        }

        &:last-child {
          border-radius: 0 4px 4px 0;
          border-left: none;
        }

        &.active {
          background: #409eff;
          color: white;
          border-color: #409eff;
          z-index: 1;
        }

        &:hover:not(.active) {
          background: #f5f7fa;
        }
      }
    }
  }

  .editor-container {
    .comment-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
      }

      &::placeholder {
        color: #c0c4cc;
      }
    }

    .editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding: 8px;
      background: #f5f7fa;
      border-radius: 4px;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;

        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          background: white;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: #606266;

          &:hover:not(:disabled) {
            background: #ecf5ff;
            border-color: #409eff;
            color: #409eff;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .is-loading {
            animation: rotating 1s linear infinite;
          }
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: #dcdfe6;
          margin: 0 4px;
        }
      }

      .toolbar-right {
        .char-count {
          font-size: 12px;
          color: #909399;
          font-weight: 500;

          &.warning {
            color: #e6a23c;
          }

          &.error {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .preview-container {
    min-height: 200px;
    padding: 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: #fafafa;

    .preview-content {
      :deep(.markdown-body-enhanced) {
        font-size: 14px;
      }
    }

    .empty-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;

    .left-actions {
      .shortcut-hint {
        color: #909399;
        font-size: 14px;
        cursor: help;
      }
    }

    .right-actions {
      display: flex;
      gap: 12px;
    }
  }

  .emoji-picker {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    max-height: 240px;
    overflow-y: auto;
    padding: 8px;

    .emoji-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font-size: 20px;
      transition: all 0.2s;

      &:hover {
        background: #f5f7fa;
        transform: scale(1.2);
      }
    }
  }
}

// 暗黑模式
.dark .enhanced-comment-form {
  background: #1a1a1a;
  border-color: #3f3f46;

  .form-header {
    h3 {
      color: #e4e4e7;
    }

    .editor-tabs button {
      background: #2d2d2d;
      border-color: #3f3f46;
      color: #a1a1aa;

      &.active {
        background: #409eff;
        color: white;
        border-color: #409eff;
      }

      &:hover:not(.active) {
        background: #3f3f46;
      }
    }
  }

  .editor-container {
    .comment-textarea {
      background: #2d2d2d;
      border-color: #3f3f46;
      color: #e4e4e7;

      &:focus {
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }

      &::placeholder {
        color: #71717a;
      }
    }

    .editor-toolbar {
      background: #2d2d2d;

      .toolbar-btn {
        background: #1a1a1a;
        border-color: #3f3f46;
        color: #a1a1aa;

        &:hover:not(:disabled) {
          background: #3f3f46;
          border-color: #409eff;
          color: #409eff;
        }
      }

      .toolbar-divider {
        background: #3f3f46;
      }
    }
  }

  .preview-container {
    background: #2d2d2d;
    border-color: #3f3f46;
  }

  .form-actions {
    border-top-color: #3f3f46;
  }

  .emoji-picker {
    background: #2d2d2d;

    .emoji-btn:hover {
      background: #3f3f46;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .enhanced-comment-form {
    padding: 12px;

    .form-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      .editor-tabs {
        width: 100%;

        button {
          flex: 1;
        }
      }
    }

    .editor-toolbar .toolbar-left {
      .toolbar-btn {
        width: 32px;
        height: 32px;
      }
    }
  }

  .emoji-picker {
    grid-template-columns: repeat(6, 1fr);
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
