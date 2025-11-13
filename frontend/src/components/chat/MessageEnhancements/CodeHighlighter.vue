<template>
  <div class="code-highlighter">
    <div class="code-header">
      <div class="code-info">
        <span class="code-language">{{ languageName }}</span>
        <span v-if="lineCount > 0" class="line-count">{{ lineCount }} 行</span>
      </div>
      <div class="code-actions">
        <el-button text size="small" @click="handleCopy">
          <el-icon><DocumentCopy /></el-icon>
          {{ copied ? '已复制' : '复制' }}
        </el-button>
      </div>
    </div>
    <pre class="code-container"><code v-html="highlightedCode"></code></pre>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy } from '@element-plus/icons-vue'
import MessageFormattingService from '@/services/messageFormattingService'

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'text'
  }
})

const copied = ref(false)

// 获取语言显示名称
const languageName = computed(() => {
  const names = {
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
    'text': 'Text',
    'vue': 'Vue',
    'jsx': 'JSX',
    'tsx': 'TSX',
    'scss': 'SCSS',
    'sass': 'SASS',
    'less': 'Less',
    'r': 'R'
  }
  return names[props.language?.toLowerCase()] || props.language || 'Code'
})

// 计算行数
const lineCount = computed(() => {
  return props.code.split('\n').length
})

// 高亮代码
const highlightedCode = computed(() => {
  return MessageFormattingService.highlightCode(props.code, props.language)
})

// 复制代码
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    ElMessage.success('代码已复制到剪贴板')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    ElMessage.error('复制失败，请重试')
  }
}
</script>

<style scoped>
.code-highlighter {
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  margin: 8px 0;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
}

.code-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-language {
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.line-count {
  color: #999;
  font-size: 11px;
}

.code-actions {
  display: flex;
  gap: 6px;
}

.code-container {
  padding: 14px;
  margin: 0;
  overflow-x: auto;
  background: #f5f5f5;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.code-container code {
  color: #333;
}

/* 代码高亮主题 (GitHub Light) */
:deep(.hljs) {
  background: none;
  padding: 0;
}

:deep(.hljs-string) { color: #22863a; }
:deep(.hljs-number) { color: #005cc5; }
:deep(.hljs-literal) { color: #005cc5; }
:deep(.hljs-attr) { color: #6f42c1; }
:deep(.hljs-attribute) { color: #6f42c1; }
:deep(.hljs-title) { color: #6f42c1; }
:deep(.hljs-title.class_) { color: #6f42c1; }
:deep(.hljs-function) { color: #005cc5; }
:deep(.hljs-keyword) { color: #d73a49; }
:deep(.hljs-built_in) { color: #005cc5; }
:deep(.hljs-name) { color: #6f42c1; }
:deep(.hljs-type) { color: #005cc5; }
:deep(.hljs-comment) { color: #6a737d; font-style: italic; }
:deep(.hljs-subst) { color: #333; }
:deep(.hljs-variable) { color: #333; }
:deep(.hljs-symbol) { color: #005cc5; }
:deep(.hljs-doctag) { color: #005cc5; }
:deep(.hljs-tag) { color: #d73a49; }
:deep(.hljs-attr) { color: #6f42c1; }
:deep(.hljs-meta) { color: #999; }
:deep(.hljs-section) { color: #005cc5; }

/* 滚动条美化 */
.code-container::-webkit-scrollbar {
  height: 6px;
}

.code-container::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.code-container::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.code-container::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
