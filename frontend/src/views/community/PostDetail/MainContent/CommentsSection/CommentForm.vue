<template>
  <div class="comment-form-wrapper">
    <el-card class="comment-form-card">
      <!-- 标题栏 -->
      <template #header>
        <div class="form-header">
          <span class="header-title">✍️ 发表评论</span>
          <span class="draft-indicator" v-if="lastSaveTime">
            💾 自动保存于 {{ lastSaveTime.toLocaleTimeString() }}
          </span>
        </div>
      </template>

      <!-- 内容区 -->
      <div class="form-content">
        <!-- 分栏编辑器 -->
        <div class="split-editor">
          <!-- 左侧编辑区 -->
          <div class="editor-section">
            <div class="section-header">
              <span class="section-title">✏️ 编辑</span>
              <div class="info-group">
                <span class="char-count" :class="{ warning: content.length > 1800 }">
                  {{ content.length }}/2000
                </span>
              </div>
            </div>

            <!-- 文本输入框 -->
            <el-input
              ref="textareaRef"
              v-model="content"
              type="textarea"
              :rows="10"
              placeholder="写下你的评论... &#10;支持 Markdown | 按 Ctrl+Enter 快速发表 | 输入 @ 提及用户"
              :maxlength="2000"
              show-word-limit
              @keydown.ctrl.enter="handleQuickSubmit"
              @keydown.meta.enter="handleQuickSubmit"
              @input="onContentChange"
              class="form-textarea"
            />

            <!-- 功能工具栏 -->
            <div class="toolbar-section">
              <!-- Markdown工具栏 - 改进版 -->
              <div class="markdown-toolbar">
                <div class="toolbar-group">
                  <span class="group-label">文本格式</span>
                  <el-button-group>
                    <el-button size="small" @click="insertMarkdown('**', '**', '粗体')"
                      title="粗体 (Ctrl+B)">
                      <el-icon><EditPen /></el-icon> B
                    </el-button>
                    <el-button size="small" @click="insertMarkdown('*', '*', '斜体')"
                      title="斜体 (Ctrl+I)">
                      <el-icon><Edit /></el-icon> I
                    </el-button>
                    <el-button size="small" @click="insertMarkdown('~~', '~~', '删除线')"
                      title="删除线">
                      S
                    </el-button>
                    <el-button size="small" @click="insertMarkdown('`', '`', '代码')"
                      title="行内代码">
                      <el-icon><Cpu /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>

                <div class="toolbar-group">
                  <span class="group-label">区块</span>
                  <el-button-group>
                    <el-button size="small" @click="insertBlock('- ', '')"
                      title="无序列表">
                      <el-icon><List /></el-icon>
                    </el-button>
                    <el-button size="small" @click="insertBlock('> ', '')"
                      title="引用">
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                    <el-button size="small" @click="insertBlock('```', '```')"
                      title="代码块">
                      代码块
                    </el-button>
                  </el-button-group>
                </div>

                <div class="toolbar-group">
                  <span class="group-label">插入</span>
                  <el-button-group>
                    <el-button size="small" @click="insertMarkdown('[', '](url)', '链接')"
                      title="链接">
                      <el-icon><Link /></el-icon>
                    </el-button>
                    <el-button size="small" @click="insertMarkdown('![', '](url)', '图片')"
                      title="图片">
                      <el-icon><Picture /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>

                <div class="toolbar-group">
                  <el-popover placement="bottom" trigger="click" :width="400">
                    <template #reference>
                      <el-button size="small" title="表情符号">
                        😀 表情
                      </el-button>
                    </template>
                    <EmojiPicker @select="insertEmoji" />
                  </el-popover>
                </div>
              </div>

              <!-- 快捷键提示 -->
              <div class="shortcut-hint">
                <span class="hint-icon">⌨️</span>
                <span class="hint-text">Ctrl+Enter 快速发表</span>
              </div>
            </div>
          </div>

          <!-- 右侧预览区 -->
          <div class="preview-section">
            <div class="section-header">
              <span class="section-title">👁️ 预览</span>
              <el-switch
                v-model="previewEnabled"
                inline-prompt
                active-text="开"
                inactive-text="关"
                size="small"
              />
            </div>

            <!-- 预览内容 -->
            <div class="preview-box" v-if="previewEnabled">
              <MarkdownPreview v-if="content" :content="content" />
              <div v-else class="empty-preview">
                <span>开始输入预览内容...</span>
              </div>
            </div>
            <div v-else class="preview-disabled">
              <el-empty description="预览已关闭" />
            </div>
          </div>
        </div>

        <!-- @mention 下拉菜单 -->
        <MentionDropdown
          :show="showMentionList"
          :suggestions="mentionedUsers"
          :position="mentionDropdownPosition"
          :query="mentionQuery"
          @select="handleMentionSelect"
          @close="showMentionList = false"
        />
      </div>

      <!-- 底部操作栏 -->
      <div class="form-footer">
        <!-- 左侧：高级选项 -->
        <div class="action-group-left">
          <el-dropdown @command="handleAdvancedCommand">
            <el-button text type="info" size="small">
              ⚙️ 更多选项 <el-icon class="is-icon"><CaretBottom /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="save-draft">
                  💾 保存草稿
                </el-dropdown-item>
                <el-dropdown-item v-if="hasDraft" command="view-draft">
                  📋 查看草稿
                </el-dropdown-item>
                <el-dropdown-item command="clear-all">
                  🗑️ 清空全部
                </el-dropdown-item>
                <el-dropdown-item divided disabled>
                  ----------------
                </el-dropdown-item>
                <el-dropdown-item command="markdown-help">
                  📖 Markdown 帮助
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 右侧：主要操作 -->
        <div class="action-group-right">
          <el-button @click="handleReset">取消</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!content.trim()"
            @click="handleSubmit"
            class="submit-btn"
          >
            <el-icon v-if="!submitting"><Check /></el-icon>
            {{ submitting ? '发表中...' : '发表评论' }}
          </el-button>
        </div>
      </div>

      <!-- 动画反馈 -->
      <transition name="fade">
        <div v-if="showSuccessMessage" class="success-feedback">
          <el-icon><SuccessFilled /></el-icon>
          <span>评论发表成功！</span>
        </div>
      </transition>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen, Edit, Link, Picture, List, DocumentCopy,
  Cpu, CaretBottom, Check, SuccessFilled
} from '@element-plus/icons-vue'
import MarkdownPreview from './MarkdownPreview.vue'
import EmojiPicker from '@/components/EmojiPicker.vue'
import MentionDropdown from '@/components/MentionDropdown.vue'
import { useDraft } from '@/composables/useDraft'
import { useMentions } from '@/composables/useMentions'

const props = defineProps({
  postId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['submit'])

// 状态管理
const content = ref('')
const submitting = ref(false)
const previewEnabled = ref(true)
const showSuccessMessage = ref(false)
const textareaRef = ref(null)

// 草稿管理
const {
  content: draftContent,
  lastSaveTime,
  clearDraft: clearDraftFromStorage,
  saveDraft: saveDraftToStorage
} = useDraft(`comment-draft-post-${props.postId}`)

// 初始化草稿
const hasDraft = computed(() => !!draftContent.value)
if (draftContent.value) {
  content.value = draftContent.value
}

// @mention 功能
const {
  mentionQuery,
  mentionedUsers,
  showMentionList,
  mentionStartPos,
  searchUsers,
  selectMention,
  clearMentions
} = useMentions()

const mentionDropdownPosition = ref({ top: 0, left: 0 })

/**
 * 改进的 Markdown 插入 - 修复了原始版本的问题
 */
const insertMarkdown = (before, after, placeholder = '') => {
  if (!textareaRef.value) return

  const textarea = textareaRef.value.$el.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  // 获取选中的文本，如果没有选中则使用占位符
  const selectedText = content.value.substring(start, end) || placeholder

  // 构造新的内容
  const newContent =
    content.value.substring(0, start) +
    before +
    selectedText +
    after +
    content.value.substring(end)

  content.value = newContent

  // 恢复光标位置
  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

/**
 * 插入区块（单独一行）
 */
const insertBlock = (prefix, suffix = '') => {
  if (!textareaRef.value) return

  const textarea = textareaRef.value.$el.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  // 检查是否在行首
  const beforeText = content.value.substring(0, start)
  const lastNewlineIndex = beforeText.lastIndexOf('\n')
  const isLineStart = lastNewlineIndex === start - 1 || start === 0

  // 如果不在行首，先换行
  const needsNewline = start > 0 && content.value[start - 1] !== '\n'
  const prefix_with_newline = needsNewline ? '\n' + prefix : prefix

  const newContent =
    content.value.substring(0, start) +
    prefix_with_newline +
    content.value.substring(end) +
    (suffix ? '\n' + suffix : '')

  content.value = newContent

  setTimeout(() => {
    textarea.focus()
    const insertedLength = prefix_with_newline.length
    textarea.setSelectionRange(start + insertedLength, start + insertedLength)
  }, 0)
}

/**
 * 插入表情
 */
const insertEmoji = (emoji) => {
  if (!textareaRef.value) return

  const textarea = textareaRef.value.$el.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  const newContent =
    content.value.substring(0, start) +
    emoji +
    content.value.substring(end)

  content.value = newContent

  setTimeout(() => {
    textarea.focus()
    const cursorPos = start + emoji.length
    textarea.setSelectionRange(cursorPos, cursorPos)
  }, 0)
}

/**
 * 内容变化处理 - @mention 支持
 */
const onContentChange = (value) => {
  searchUsers(content.value)

  if (mentionStartPos.value !== null && mentionStartPos.value !== -1) {
    setTimeout(() => {
      const textarea = textareaRef.value?.$el?.querySelector('textarea')
      if (!textarea) return

      const textareaRect = textarea.getBoundingClientRect()
      const container = document.querySelector('.comment-form-wrapper')
      const containerRect = container?.getBoundingClientRect() || { top: 0, left: 0 }

      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
      const lines = content.value.substring(0, mentionStartPos.value).split('\n').length

      mentionDropdownPosition.value = {
        top: textareaRect.top - containerRect.top + (lines - 1) * lineHeight + lineHeight + 8,
        left: textareaRect.left - containerRect.left + 16
      }
    }, 0)
  }
}

/**
 * 处理 @mention 选择
 */
const handleMentionSelect = (user) => {
  const beforeMention = content.value.substring(0, mentionStartPos.value)
  const afterMention = content.value.substring(mentionStartPos.value + mentionQuery.value.length + 1)

  content.value = beforeMention + '@' + user.username + ' ' + afterMention
  showMentionList.value = false

  setTimeout(() => {
    const textarea = textareaRef.value?.$el?.querySelector('textarea')
    if (textarea) {
      const newCursorPos = beforeMention.length + user.username.length + 2
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }
  }, 0)
}

/**
 * 提交评论
 */
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

    // 发表成功
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 2000)

    clearDraftFromStorage()
    content.value = ''
  } catch (error) {
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

/**
 * 重置表单
 */
const handleReset = async () => {
  if (!content.value.trim()) return

  try {
    await ElMessageBox.confirm(
      '确定要清空评论内容吗？',
      '确认',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    content.value = ''
    clearDraftFromStorage()
    ElMessage.success('已清空')
  } catch {
    // 用户取消
  }
}

/**
 * 快速提交（Ctrl+Enter）
 */
const handleQuickSubmit = (e) => {
  e.preventDefault()
  handleSubmit()
}

/**
 * 高级选项处理
 */
const handleAdvancedCommand = (command) => {
  switch (command) {
    case 'save-draft':
      saveDraftToStorage()
      ElMessage.success('草稿已保存')
      break
    case 'view-draft':
      ElMessage.info(`草稿：${draftContent.value.substring(0, 100)}...`)
      break
    case 'clear-all':
      handleReset()
      break
    case 'markdown-help':
      ElMessage.info('Markdown 语法：** 粗体 ** | * 斜体 * | ` 代码 ` | > 引用 | - 列表')
      break
  }
}
</script>

<style scoped lang="scss">
.comment-form-wrapper {
  margin: 24px 0;

  .comment-form-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    :deep(.el-card__header) {
      padding: 16px 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #e0e0e0;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .draft-indicator {
      font-size: 12px;
      color: #909399;
    }
  }

  .form-content {
    margin-bottom: 16px;
  }

  // 分栏编辑器
  .split-editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }

  // 编辑区
  .editor-section,
  .preview-section {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &:first-child {
      border-right: 1px solid #e0e0e0;

      @media (max-width: 1200px) {
        border-right: none;
      }
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9f9f9;
    border-bottom: 1px solid #e0e0e0;

    .section-title {
      font-weight: 600;
      font-size: 14px;
      color: #606266;
    }

    .info-group {
      display: flex;
      gap: 12px;
      align-items: center;

      .char-count {
        font-size: 12px;
        color: #909399;

        &.warning {
          color: #e6a23c;
          font-weight: 600;
        }
      }
    }
  }

  .form-textarea {
    :deep(.el-textarea__inner) {
      border: none;
      resize: none;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
    }
  }

  // 工具栏
  .toolbar-section {
    border-top: 1px solid #e0e0e0;
    padding: 12px 16px;
    background: #fafafa;
  }

  .markdown-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 8px;

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 6px;

      .group-label {
        font-size: 11px;
        color: #909399;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      :deep(.el-button-group) {
        display: flex;

        .el-button {
          flex: none;
          font-size: 12px;
          padding: 6px 10px;
          min-width: auto;
          border-color: #dcdfe6;

          &:hover {
            color: #409eff;
            border-color: #409eff;
          }
        }
      }
    }
  }

  .shortcut-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;

    .hint-icon {
      font-size: 14px;
    }
  }

  // 预览区
  .preview-box {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: white;

    :deep(.markdown-preview) {
      .preview-content {
        font-size: 14px;
        line-height: 1.6;
        color: #303133;

        p {
          margin: 8px 0;
          word-wrap: break-word;
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
          border-radius: 3px;
          font-size: 12px;
          color: #c41d7f;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;

          code {
            background: none;
            color: #666;
            padding: 0;
          }
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

  .empty-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #909399;
    font-size: 14px;
  }

  .preview-disabled {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #fafafa;
  }

  // 底部操作栏
  .form-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;

    .action-group-left,
    .action-group-right {
      display: flex;
      gap: 8px;
    }

    .action-group-right {
      .submit-btn {
        min-width: 120px;
      }
    }
  }

  // 成功反馈
  .success-feedback {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #f0f9ff;
    border: 1px solid #b3e5fc;
    border-radius: 4px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0277bd;
    font-size: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
    z-index: 1000;

    :deep(.el-icon) {
      font-size: 18px;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
