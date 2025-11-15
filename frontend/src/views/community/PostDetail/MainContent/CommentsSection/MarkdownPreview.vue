<template>
  <div class="markdown-preview">
    <div v-html="renderedHtml" class="preview-content"></div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

/**
 * 严格的 DOMPurify 配置
 * 防止 XSS 攻击
 */
const PURIFY_CONFIG = {
  // 允许的HTML标签（最小化原则）
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'a', 'code', 'pre',
    'ul', 'ol', 'li',
    'blockquote', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],

  // 允许的属性（严格限制）
  ALLOWED_ATTR: {
    'a': ['href', 'target', 'rel', 'title'],
    'pre': ['class'],
    'code': ['class'],
  },

  // 不允许数据属性
  ALLOW_DATA_ATTR: false,

  // 为模板安全
  SAFE_FOR_TEMPLATES: true,

  // 保留标签内容（即使标签被删除）
  KEEP_CONTENT: true,

  // 强制所有链接在新标签页打开
  FORCE_BODY: false,
}

/**
 * 设置 marked 配置
 */
marked.setOptions({
  breaks: true,
  gfm: true, // GitHub Flavored Markdown
})

/**
 * 安全链接检查
 * 防止 javascript: 协议等恶意链接
 */
const isSafeUrl = (url) => {
  if (!url) return true

  // 禁止的协议
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:']
  const lowerUrl = url.toLowerCase().trim()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`[MarkdownPreview] Blocked unsafe URL protocol: ${protocol}`)
      return false
    }
  }

  return true
}

/**
 * 后处理HTML：检查并修复任何不安全的链接
 */
const postProcessHtml = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html

  // 检查所有链接
  div.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href')

    if (!isSafeUrl(href)) {
      // 如果链接不安全，移除href
      link.removeAttribute('href')
      link.classList.add('unsafe-link')
      console.warn(`[MarkdownPreview] Removed unsafe link: ${href}`)
    } else if (href && !href.startsWith('#') && !href.startsWith('/')) {
      // 外部链接添加安全属性
      link.setAttribute('rel', 'noopener noreferrer')
      link.setAttribute('target', '_blank')
    }
  })

  return div.innerHTML
}

const renderedHtml = computed(() => {
  try {
    // 1. Markdown 转 HTML
    let html = marked(props.content)

    // 2. 使用 DOMPurify 清理 HTML
    const sanitized = DOMPurify.sanitize(html, PURIFY_CONFIG)

    // 3. 后处理：检查并修复链接
    const postProcessed = postProcessHtml(sanitized)

    // 4. 最终清理（二次防护）
    const final = DOMPurify.sanitize(postProcessed, PURIFY_CONFIG)

    console.log('[MarkdownPreview] HTML rendered and sanitized successfully')
    return final
  } catch (error) {
    console.error('[MarkdownPreview] Rendering error:', error)
    // 降级方案：仅显示纯文本（安全性最高）
    const plainText = DOMPurify.sanitize(props.content)
    return `<p>${plainText}</p>`
  }
})
</script>

<style scoped lang="scss">
.markdown-preview {
  .preview-content {
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

    u {
      text-decoration: underline;
    }

    s {
      text-decoration: line-through;
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
      border-radius: 0 4px 4px 0;
      color: #666;
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      color: #c41d7f;
      word-break: break-all;
    }

    pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;

      code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
    }

    a {
      color: #409eff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.3s;

      &:hover {
        border-bottom-color: #409eff;
      }

      // 标记不安全的链接
      &.unsafe-link {
        color: #f56c6c;
        cursor: not-allowed;

        &:hover {
          border-bottom-color: #f56c6c;
        }
      }
    }

    hr {
      margin: 12px 0;
      border: none;
      border-top: 1px solid #e0e0e0;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 12px 0 8px 0;
      font-weight: 600;
      line-height: 1.4;
    }

    h1 {
      font-size: 24px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 8px;
    }

    h2 {
      font-size: 20px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 6px;
    }

    h3 {
      font-size: 18px;
    }

    h4 {
      font-size: 16px;
    }

    h5 {
      font-size: 14px;
    }

    h6 {
      font-size: 12px;
      color: #606266;
    }
  }
}
</style>
