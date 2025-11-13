<template>
  <div class="markdown-renderer">
    <div v-html="renderedHtml" class="markdown-content"></div>
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

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
  smartLists: true,
  smartypants: true,
})

// 自定义渲染器用于处理代码块
const renderer = new marked.Renderer()

// 重写代码块渲染
renderer.codespan = (code) => {
  return `<code class="inline-code">${DOMPurify.sanitize(code)}</code>`
}

renderer.code = ({ text, lang }) => {
  const language = lang || 'plaintext'
  return `<pre class="code-block" data-language="${DOMPurify.sanitize(language)}"><code class="language-${DOMPurify.sanitize(language)}">${DOMPurify.sanitize(text)}</code></pre>`
}

// 重写图片渲染
renderer.image = ({ href, text }) => {
  return `<img src="${DOMPurify.sanitize(href)}" alt="${DOMPurify.sanitize(text)}" class="markdown-image" loading="lazy" />`
}

// 重写标题渲染（添加 id 用于目录跳转）
renderer.heading = ({ text, depth }) => {
  const id = generateHeadingId(text)
  return `<h${depth} id="${id}" class="markdown-heading">${text}</h${depth}>`
}

// 重写链接渲染
renderer.link = ({ href, text }) => {
  return `<a href="${DOMPurify.sanitize(href)}" target="_blank" rel="noopener noreferrer" class="markdown-link">${text}</a>`
}

marked.setOptions({ renderer })

/**
 * 生成标题 ID（用于目录锚点）
 */
const generateHeadingId = (text) => {
  if (!text || typeof text !== 'string') {
    return 'heading-' + Date.now() + Math.random().toString(36).substr(2, 9)
  }
  return 'heading-' + text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
}

const renderedHtml = computed(() => {
  try {
    // 使用 marked 渲染 Markdown
    const html = marked(props.content)
    // 使用 DOMPurify 清理 HTML，防止 XSS 攻击
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's',
        'a', 'img', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'td', 'th',
      ],
      ALLOWED_ATTR: ['id', 'class', 'href', 'src', 'alt', 'target', 'rel', 'loading', 'data-language'],
    })
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return `<p>${DOMPurify.sanitize(props.content)}</p>`
  }
})
</script>

<style scoped lang="scss">
.markdown-renderer {
  .markdown-content {
    font-size: 16px;
    line-height: 1.8;
    color: #303133;

    // 标题样式
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 32px 0 16px 0;
      font-weight: 600;
      line-height: 1.35;
      color: #000;

      &::before {
        content: '';
        display: block;
        visibility: hidden;
        height: 80px;
        margin-top: -80px;
        pointer-events: none;
      }
    }

    h1 {
      font-size: 32px;
    }

    h2 {
      font-size: 24px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 12px;
    }

    h3 {
      font-size: 20px;
    }

    h4 {
      font-size: 18px;
    }

    h5 {
      font-size: 16px;
    }

    h6 {
      font-size: 14px;
    }

    // 段落
    p {
      margin: 16px 0;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    // 列表
    ul,
    ol {
      margin: 16px 0;
      padding-left: 24px;

      li {
        margin: 8px 0;

        p {
          margin: 8px 0;
        }
      }
    }

    ul li::marker {
      color: #409eff;
    }

    ol li::marker {
      color: #409eff;
      font-weight: 600;
    }

    // 引用块
    blockquote {
      margin: 20px 0;
      padding: 12px 16px;
      background: #f5f7fa;
      border-left: 4px solid #409eff;
      border-radius: 0 4px 4px 0;

      p {
        margin: 0;
      }
    }

    // 行内代码
    code {
      background: #f5f7fa;
      border-radius: 4px;
      padding: 2px 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      color: #c41d7f;

      &.inline-code {
        white-space: nowrap;
      }
    }

    // 代码块
    pre {
      background: #282c34;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
      overflow-x: auto;
      color: #abb2bf;

      code {
        background: none;
        color: inherit;
        padding: 0;
        font-size: 14px;
        font-family: 'Monaco', 'Courier New', monospace;
      }
    }

    // 链接
    a {
      color: #409eff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.3s;

      &:hover {
        border-bottom-color: #409eff;
        opacity: 0.8;
      }
    }

    // 图片
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: scale(1.02);
      }

      &.markdown-image {
        max-width: 100%;
      }
    }

    // 表格
    table {
      margin: 20px 0;
      border-collapse: collapse;
      width: 100%;
      border: 1px solid #ddd;

      th,
      td {
        border: 1px solid #ddd;
        padding: 12px 16px;
        text-align: left;
      }

      th {
        background: #f5f7fa;
        font-weight: 600;
        color: #303133;
      }

      tbody tr:nth-child(odd) {
        background: #fafbfc;
      }

      tbody tr:hover {
        background: #f0f7ff;
      }
    }

    // 水平线
    hr {
      margin: 32px 0;
      border: none;
      height: 2px;
      background: linear-gradient(to right, #f0f0f0, #ccc, #f0f0f0);
    }

    // 强调、删除线等
    strong {
      font-weight: 600;
      color: #000;
    }

    em {
      font-style: italic;
      color: #666;
    }

    u {
      text-decoration: underline;
    }

    s {
      text-decoration: line-through;
      color: #999;
    }
  }
}
</style>
