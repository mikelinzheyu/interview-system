<template>
  <div class="code-block-enhanced">
    <!-- 代码块头部 -->
    <div class="code-header">
      <span v-if="language" class="language-badge">{{ language }}</span>
      <div class="code-actions">
        <el-button
          v-if="supportsLineNumbers"
          text
          size="small"
          @click="toggleLineNumbers"
          :icon="showLineNumbers ? Check : Copy"
        >
          {{ showLineNumbers ? '✓ 行号' : '+ 行号' }}
        </el-button>
        <el-button
          text
          size="small"
          :icon="Copy"
          @click="handleCopy"
        >
          {{ copyText }}
        </el-button>
      </div>
    </div>

    <!-- 代码内容 -->
    <div class="code-content" :class="{ 'with-line-numbers': showLineNumbers }">
      <pre><code
        v-html="highlightedCode"
        :class="`language-${language || 'plaintext'}`"
      ></code></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Copy, Check } from '@element-plus/icons-vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'javascript',
  },
})

const showLineNumbers = ref(false)
const copyText = ref('复制')

const supportsLineNumbers = computed(() => {
  // 支持行号的语言
  const supportedLangs = ['javascript', 'python', 'java', 'cpp', 'go', 'rust']
  return supportedLangs.includes(props.language?.toLowerCase())
})

const highlightedCode = computed(() => {
  try {
    if (props.language) {
      return hljs.highlight(props.code, { language: props.language, ignoreIllegals: true }).value
    }
    return hljs.highlightAuto(props.code).value
  } catch (error) {
    console.error('Highlight error:', error)
    return props.code
  }
})

const toggleLineNumbers = () => {
  showLineNumbers.value = !showLineNumbers.value
}

const handleCopy = () => {
  navigator.clipboard.writeText(props.code).then(() => {
    copyText.value = '已复制 ✓'
    setTimeout(() => {
      copyText.value = '复制'
    }, 2000)
    ElMessage.success('代码已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请重试')
  })
}
</script>

<style scoped lang="scss">
.code-block-enhanced {
  background: #282c34;
  border-radius: 6px;
  overflow: hidden;
  margin: 20px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #21252b;
    border-bottom: 1px solid #3e4451;

    .language-badge {
      font-size: 12px;
      font-weight: 600;
      color: #61afef;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .code-actions {
      display: flex;
      gap: 8px;

      :deep(.el-button) {
        color: #abb2bf;
        font-size: 12px;

        &:hover {
          color: #61afef;
        }
      }
    }
  }

  .code-content {
    overflow-x: auto;
    overflow-y: hidden;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #282c34;
    }

    &::-webkit-scrollbar-thumb {
      background: #3e4451;
      border-radius: 3px;

      &:hover {
        background: #4a5568;
      }
    }

    &.with-line-numbers {
      pre {
        display: block;
        counter-reset: line;

        code {
          display: block;
          counter-increment: line;

          &::before {
            content: counter(line);
            display: inline-block;
            width: 3em;
            margin-right: 1em;
            padding-right: 1em;
            text-align: right;
            color: #6a7582;
            border-right: 1px solid #3e4451;
          }
        }
      }
    }

    pre {
      margin: 0;
      padding: 16px;
      background: #282c34;
      color: #abb2bf;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;

      code {
        font-size: 14px;
      }
    }
  }

  // Atom One Dark 主题的高亮颜色
  :deep {
    .hljs-attr,
    .hljs-attribute {
      color: #e06c75;
    }

    .hljs-string {
      color: #98c379;
    }

    .hljs-number {
      color: #d19a66;
    }

    .hljs-literal {
      color: #56b6c2;
    }

    .hljs-function {
      color: #61afef;
    }

    .hljs-keyword {
      color: #c678dd;
    }

    .hljs-comment {
      color: #5c6370;
    }
  }
}
</style>
