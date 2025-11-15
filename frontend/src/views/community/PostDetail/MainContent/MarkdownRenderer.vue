<template>
  <div class="markdown-renderer">
    <div v-html="renderedHtml" class="markdown-content" @click="handleContentClick"></div>

    <!-- LightBox 组件 -->
    <LightBox ref="lightboxRef" :images="images" />
  </div>
</template>

<script setup>
import { defineProps, computed, ref, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import { ElMessage } from 'element-plus'
import LightBox from '../components/LightBox.vue'

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
})

const lightboxRef = ref(null)
const images = ref([])

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

// 重写代码块渲染 - 使用 highlight.js 高亮
renderer.codespan = (code) => {
  return `<code class="inline-code">${DOMPurify.sanitize(code)}</code>`
}

renderer.code = (code, language) => {
  const lang = (language || 'plaintext').toLowerCase()
  try {
    const text = code || ''
    const highlighted = hljs.highlight(text, { language: lang, ignoreIllegals: true }).value
    // 编码代码内容用于 data 属性
    const encodedCode = btoa(unescape(encodeURIComponent(text)))
    return `<div class="code-block-wrapper" data-language="${DOMPurify.sanitize(lang)}" data-code="${encodedCode}"><pre class="code-block" data-language="${DOMPurify.sanitize(lang)}"><code class="language-${DOMPurify.sanitize(lang)}">${highlighted}</code></pre><div class="code-actions"><button class="code-copy-btn" title="复制代码">📋 复制</button></div></div>`
  } catch (error) {
    console.error('Highlight error:', error)
    const text = code || ''
    const encodedCode = btoa(unescape(encodeURIComponent(text)))
    return `<div class="code-block-wrapper" data-language="${DOMPurify.sanitize(lang)}" data-code="${encodedCode}"><pre class="code-block" data-language="${DOMPurify.sanitize(lang)}"><code class="language-${DOMPurify.sanitize(lang)}">${DOMPurify.sanitize(text)}</code></pre><div class="code-actions"><button class="code-copy-btn" title="复制代码">📋 复制</button></div></div>`
  }
}

// 重写图片渲染 - 支持懒加载和点击放大
renderer.image = ({ href, text }) => {
  return `<img src="${DOMPurify.sanitize(href)}" alt="${DOMPurify.sanitize(text)}" class="markdown-image" loading="lazy" data-lightbox />`
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
        'div', 'button',
      ],
      ALLOWED_ATTR: ['id', 'class', 'href', 'src', 'alt', 'target', 'rel', 'loading', 'data-language', 'data-lightbox', 'data-code', 'title'],
    })
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return `<p>${DOMPurify.sanitize(props.content)}</p>`
  }
})

/**
 * 处理内容点击事件 - 支持图片和代码块复制
 */
const handleContentClick = (event) => {
  const target = event.target

  // 处理图片点击
  if (target.tagName === 'IMG' && target.hasAttribute('data-lightbox')) {
    handleImageClick(event)
  }

  // 处理代码复制按钮
  if (target.classList.contains('code-copy-btn')) {
    handleCodeCopy(target)
  }
}

/**
 * 处理图片点击事件 - 打开 LightBox
 */
const handleImageClick = (event) => {
  const img = event.target
  if (img.tagName === 'IMG' && img.hasAttribute('data-lightbox')) {
    // 收集所有 markdown 图片
    nextTick(() => {
      const allImages = Array.from(document.querySelectorAll('.markdown-image')).map(
        (el) => el.src
      )

      const clickedImageIndex = allImages.indexOf(img.src)
      images.value = allImages

      // 打开 LightBox
      if (lightboxRef.value) {
        lightboxRef.value.open(clickedImageIndex >= 0 ? clickedImageIndex : 0)
      }
    })
  }
}

/**
 * 复制代码
 */
const handleCodeCopy = (button) => {
  const wrapper = button.closest('.code-block-wrapper')
  if (!wrapper) return

  try {
    const encodedCode = wrapper.getAttribute('data-code')
    const code = decodeURIComponent(escape(atob(encodedCode)))

    navigator.clipboard.writeText(code).then(() => {
      ElMessage.success('代码已复制到剪贴板')
      // 按钮反馈
      const originalText = button.textContent
      button.textContent = '✓ 已复制'
      setTimeout(() => {
        button.textContent = originalText
      }, 2000)
    }).catch(() => {
      ElMessage.error('复制失败，请重试')
    })
  } catch (err) {
    ElMessage.error('复制失败：' + err.message)
  }
}
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
    .code-block-wrapper {
      position: relative;
      margin: 20px 0;
      border-radius: 8px;
      overflow: hidden;
      background: #282c34;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;

      &:hover .code-actions {
        opacity: 1;
      }

      pre.code-block {
        margin: 0;
        border-radius: 0;
        padding: 16px 16px 16px 16px;
      }

      .code-actions {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 8px;
        z-index: 10;
        opacity: 0.8;
        transition: opacity 0.2s ease;

        button {
          padding: 6px 12px;
          background: rgba(64, 158, 255, 0.2);
          color: #409eff;
          border: 1px solid rgba(64, 158, 255, 0.4);
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          font-weight: 500;

          &:hover {
            background: rgba(64, 158, 255, 0.3);
            border-color: #409eff;
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
          }

          &:active {
            transform: translateY(0);
          }
        }
      }
    }

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

      // highlight.js 高亮样式
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

    // 图片 - 支持懒加载和点击放大
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s;
      display: block;

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

// 代码执行结果样式
.code-result-content {
  .result-header {
    margin-bottom: 12px;
    display: flex;
    align-items: center;

    .language-badge {
      background: #f0f0f0;
      color: #333;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
  }

  .result-output {
    background: #f5f7fa;
    border: 1px solid #e8eaed;
    border-radius: 4px;
    padding: 12px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #303133;
    max-height: 400px;
    overflow-y: auto;
    margin: 0;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;

      &:hover {
        background: #b3b3b3;
      }
    }
  }
}
</style>
