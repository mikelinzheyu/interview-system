<template>
  <div class="markdown-renderer">
    <!-- 代码块特殊处理 -->
    <template v-if="contentType === 'code'">
      <div class="code-block">
        <div class="code-header">
          <span class="code-language">{{ getLanguageName(language) }}</span>
          <el-button text size="small" @click="copyCode">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-button>
        </div>
        <pre class="code-content"><code v-html="highlightedCode"></code></pre>
      </div>
    </template>

    <!-- Markdown 内容 -->
    <template v-else-if="contentType === 'markdown'">
      <div class="markdown-content" v-html="renderedHtml"></div>
    </template>

    <!-- 纯文本，支持链接检测 -->
    <template v-else>
      <div class="text-content">{{ displayContent }}</div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import MessageFormattingService from '@/services/messageFormattingService'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    default: 'text',
    validator: (value) => ['text', 'markdown', 'code', 'link'].includes(value)
  }
})

// 获取渲染后的 HTML
const renderedHtml = computed(() => {
  if (props.contentType === 'markdown') {
    return MessageFormattingService.markdownToHtml(props.content)
  }
  return ''
})

// 代码块信息
const codeBlockInfo = computed(() => {
  if (props.contentType === 'code') {
    const blocks = MessageFormattingService.getCodeBlockInfo(props.content)
    return blocks.length > 0 ? blocks[0] : null
  }
  return null
})

const language = computed(() => codeBlockInfo.value?.language || 'text')

// 代码高亮
const highlightedCode = computed(() => {
  if (codeBlockInfo.value) {
    return MessageFormattingService.highlightCode(
      codeBlockInfo.value.code,
      codeBlockInfo.value.language
    )
  }
  return MessageFormattingService.highlightCode(props.content)
})

// 纯文本显示
const displayContent = computed(() => {
  return props.content
})

// 获取语言的显示名称
function getLanguageName(lang) {
  const langNames = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'python': 'Python',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'go': 'Go',
    'rust': 'Rust',
    'sql': 'SQL',
    'html': 'HTML',
    'css': 'CSS',
    'bash': 'Bash',
    'shell': 'Shell',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'markdown': 'Markdown',
    'md': 'Markdown',
    'text': 'Text'
  }
  return langNames[lang?.toLowerCase()] || lang || 'Code'
}

// 复制代码
function copyCode() {
  const code = codeBlockInfo.value?.code || props.content
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success('代码已复制')
  })
}
</script>

<style scoped>
.markdown-renderer {
  width: 100%;
}

/* 代码块样式 */
.code-block {
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;
  border: 1px solid #e0e0e0;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
}

.code-language {
  font-weight: 500;
  text-transform: uppercase;
}

.code-content {
  padding: 12px;
  margin: 0;
  overflow-x: auto;
  background: #f5f5f5;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.code-content code {
  color: #333;
}

/* Markdown 样式 */
.markdown-content {
  width: 100%;
  word-break: break-word;
  overflow-wrap: break-word;
}

.markdown-content :deep(p) {
  margin: 6px 0;
  line-height: 1.6;
}

.markdown-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #c41d7f;
}

.markdown-content :deep(pre) {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  color: #333;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid #409eff;
  padding-left: 10px;
  margin: 8px 0;
  color: #666;
  font-style: italic;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #333;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #666;
}

.markdown-content :deep(a) {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 12px 0 8px 0;
  font-weight: 600;
  color: #333;
}

.markdown-content :deep(h1) {
  font-size: 24px;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 20px;
}

.markdown-content :deep(h3) {
  font-size: 18px;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e0e0e0;
  padding: 8px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 12px 0;
}

/* 文本内容 */
.text-content {
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
}

/* 代码高亮 主题 */
:deep(.hljs) {
  background: #f5f5f5;
  padding: 0;
  border-radius: 0;
}

:deep(.hljs-string) { color: #22863a; }
:deep(.hljs-number) { color: #005cc5; }
:deep(.hljs-literal) { color: #005cc5; }
:deep(.hljs-attr) { color: #6f42c1; }
:deep(.hljs-attribute) { color: #6f42c1; }
:deep(.hljs-title) { color: #6f42c1; }
:deep(.hljs-function) { color: #005cc5; }
:deep(.hljs-keyword) { color: #d73a49; }
:deep(.hljs-built_in) { color: #005cc5; }
:deep(.hljs-name) { color: #6f42c1; }
:deep(.hljs-type) { color: #005cc5; }
:deep(.hljs-comment) { color: #999; font-style: italic; }
</style>
