<template>
  <div class="markdown-renderer">
    <div
      v-html="renderedHtml"
      class="markdown-content"
      @click="handleContentClick"
    ></div>

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
    required: true
  }
})

const lightboxRef = ref(null)
const images = ref([])

// 基础配置
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
  smartLists: true,
  smartypants: true
})

const renderer = new marked.Renderer()

// 行内代码
renderer.codespan = (code) => {
  const safe = code || ''
  return `<code class="inline-code">${DOMPurify.sanitize(safe)}</code>`
}

// 代码块 + 高亮 + 语言标签 + 复制按钮
renderer.code = (code, language) => {
  const lang = (language || 'plaintext').toLowerCase()
  const text = code || ''

  // 语言名称映射
  const langNames = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sql: 'SQL',
    bash: 'Bash',
    shell: 'Shell',
    json: 'JSON',
    yaml: 'YAML',
    xml: 'XML',
    markdown: 'Markdown',
    plaintext: 'Plain Text'
  }

  const displayLang = langNames[lang] || lang.toUpperCase()

  try {
    const highlighted = hljs.highlight(text, {
      language: lang,
      ignoreIllegals: true
    }).value

    const encodedCode = btoa(unescape(encodeURIComponent(text)))
    return `<div class="code-block-wrapper" data-language="${DOMPurify.sanitize(
      lang
    )}" data-code="${encodedCode}">
      <div class="code-header">
        <span class="code-language">${DOMPurify.sanitize(displayLang)}</span>
        <button class="code-copy-btn" title="复制代码">
          <span class="copy-icon">📋</span>
          <span class="copy-text">复制</span>
        </button>
      </div>
      <pre class="code-block" data-language="${DOMPurify.sanitize(lang)}">
        <code class="language-${DOMPurify.sanitize(lang)}">${highlighted}</code>
      </pre>
    </div>`
  } catch (error) {
    console.error('Highlight error:', error)
    const encodedCode = btoa(unescape(encodeURIComponent(text)))
    return `<div class="code-block-wrapper" data-language="${DOMPurify.sanitize(
      lang
    )}" data-code="${encodedCode}">
      <div class="code-header">
        <span class="code-language">${DOMPurify.sanitize(displayLang)}</span>
        <button class="code-copy-btn" title="复制代码">
          <span class="copy-icon">📋</span>
          <span class="copy-text">复制</span>
        </button>
      </div>
      <pre class="code-block" data-language="${DOMPurify.sanitize(lang)}">
        <code class="language-${DOMPurify.sanitize(lang)}">${DOMPurify.sanitize(
          text
        )}</code>
      </pre>
    </div>`
  }
}

// 图片渲染：懒加载 + LightBox
renderer.image = (href, title, text) => {
  const safeSrc = href || ''
  const safeAlt = text || ''
  return `<img src="${DOMPurify.sanitize(
    safeSrc
  )}" alt="${DOMPurify.sanitize(
    safeAlt
  )}" class="markdown-image" loading="lazy" data-lightbox />`
}

// 标题渲染：添加 id，避免 undefined
renderer.heading = (text, level) => {
  const safeText = typeof text === 'string' ? text : ''
  const depth = level || 1
  const id = generateHeadingId(safeText)

  return `<h${depth} id="${id}" class="markdown-heading">${DOMPurify.sanitize(
    safeText
  )}</h${depth}>`
}

// 链接渲染
renderer.link = (href, title, text) => {
  const safeHref = href || ''
  const safeText = text || ''
  return `<a href="${DOMPurify.sanitize(
    safeHref
  )}" target="_blank" rel="noopener noreferrer" class="markdown-link">${DOMPurify.sanitize(
    safeText
  )}</a>`
}

marked.setOptions({ renderer })

// 生成标题 ID（用于目录锚点）
const generateHeadingId = (text) => {
  if (!text || typeof text !== 'string') {
    return 'heading-' + Date.now() + Math.random().toString(36).slice(2)
  }

  return (
    'heading-' +
    text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
  )
}

const renderedHtml = computed(() => {
  try {
    const raw = typeof props.content === 'string' ? props.content : ''
    const html = marked(raw)

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'strong',
        'em',
        'u',
        's',
        'a',
        'img',
        'code',
        'pre',
        'ul',
        'ol',
        'li',
        'blockquote',
        'table',
        'thead',
        'tbody',
        'tr',
        'td',
        'th',
        'div',
        'button'
      ],
      ALLOWED_ATTR: [
        'id',
        'class',
        'href',
        'src',
        'alt',
        'target',
        'rel',
        'loading',
        'data-language',
        'data-lightbox',
        'data-code',
        'title'
      ]
    })
  } catch (error) {
    console.error('Markdown rendering error:', error)
    const fallback = typeof props.content === 'string' ? props.content : ''
    return `<p>${DOMPurify.sanitize(fallback)}</p>`
  }
})

// 处理内容点击事件（图片预览 + 代码复制）
const handleContentClick = (event) => {
  const target = event.target

  if (target.tagName === 'IMG' && target.hasAttribute('data-lightbox')) {
    handleImageClick(event)
    return
  }

  if (target.classList.contains('code-copy-btn')) {
    handleCodeCopy(target)
  }
}

// 图片点击 -> LightBox
const handleImageClick = (event) => {
  const img = event.target
  if (!img || img.tagName !== 'IMG') return

  nextTick(() => {
    const allImages = Array.from(
      document.querySelectorAll('.markdown-image')
    ).map((el) => el.src)

    const index = allImages.indexOf(img.src)
    images.value = allImages

    if (lightboxRef.value && allImages.length > 0) {
      lightboxRef.value.open(index >= 0 ? index : 0)
    }
  })
}

// 复制代码
const handleCodeCopy = (button) => {
  const wrapper = button.closest('.code-block-wrapper')
  if (!wrapper) return

  try {
    const encodedCode = wrapper.getAttribute('data-code') || ''
    const code = decodeURIComponent(escape(atob(encodedCode)))

    if (!navigator.clipboard) {
      ElMessage.error('当前环境不支持剪贴板')
      return
    }

    navigator.clipboard
      .writeText(code)
      .then(() => {
        ElMessage.success('代码已复制到剪贴板')
        const originalText = button.textContent
        button.textContent = '✅ 已复制'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      })
      .catch(() => {
        ElMessage.error('复制失败，请重试')
      })
  } catch (err) {
    ElMessage.error('复制失败：' + (err?.message || '未知错误'))
  }
}
</script>

<style scoped lang="scss">
.markdown-renderer {
  /* 使用 :deep() 选择器以穿透 scoped 样式作用于 v-html 内容 */
  :deep(.markdown-content) {
    font-size: 18px;
    line-height: 1.8;
    color: #2c3e50;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    word-wrap: break-word;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 40px 0 24px 0;
      font-weight: 700;
      line-height: 1.4;
      color: #1a1a1a;
      letter-spacing: -0.01em;

      &::before {
        content: '';
        display: block;
        visibility: hidden;
        height: 80px;
        margin-top: -80px;
        pointer-events: none;
      }

      &:first-child {
        margin-top: 0;
      }
    }

    h1 {
      font-size: 36px;
    }

    h2 {
      font-size: 28px;
      border-bottom: 1px solid #eaeaea;
      padding-bottom: 16px;
    }

    h3 {
      font-size: 24px;
    }

    h4 {
      font-size: 20px;
    }

    h5 {
      font-size: 18px;
    }

    h6 {
      font-size: 16px;
      color: #666;
    }

    p {
      margin: 20px 0;
      letter-spacing: 0.01em;
    }

    ul,
    ol {
      margin: 20px 0;
      padding-left: 28px;

      li {
        margin: 10px 0;
        
        p {
          margin: 0;
        }
      }
    }

    blockquote {
      margin: 24px 0;
      padding: 16px 24px;
      color: #555;
      background: #f8f9fa;
      border-left: 4px solid #409eff;
      border-radius: 4px;
      font-style: italic;

      p {
        margin: 0;
      }
    }

    a.markdown-link {
      color: #409eff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;

      &:hover {
        border-color: #409eff;
      }
    }

    img.markdown-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 32px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      cursor: zoom-in;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: block;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        transform: scale(1.01);
      }
    }

    /* 代码块样式优化 */
    .code-block-wrapper {
      margin: 24px 0;
      border-radius: 8px;
      overflow: hidden;
      background: #1e1e1e;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      position: relative;

      .code-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: #2d2d2d;
        border-bottom: 1px solid #404040;

        .code-language {
          font-size: 12px;
          font-weight: 600;
          color: #9cdcfe;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .code-copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #404040;
          color: #d4d4d4;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;

          .copy-icon {
            font-size: 14px;
          }

          .copy-text {
            font-weight: 500;
          }

          &:hover {
            background: #505050;
            transform: translateY(-1px);
          }

          &:active {
            transform: translateY(0);
          }
        }
      }

      .code-block {
        margin: 0;
        padding: 20px;
        overflow-x: auto;
        font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
        font-size: 14px;
        line-height: 1.6;
        background: #1e1e1e;
        color: #d4d4d4;

        code {
          font-family: inherit;
          color: inherit;
        }

        /* 滚动条样式 */
        &::-webkit-scrollbar {
          height: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #252526;
        }

        &::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 4px;

          &:hover {
            background: #4e4e4e;
          }
        }
      }
    }

    code.inline-code {
      padding: 2px 6px;
      margin: 0 4px;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.9em;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 4px;
      color: #476582;
    }

    table {
      margin: 24px 0;
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      border: 1px solid #eaeaea;
      border-radius: 8px;
      overflow: hidden;

      th,
      td {
        border-bottom: 1px solid #eaeaea;
        border-right: 1px solid #eaeaea;
        padding: 14px 16px;
        text-align: left;

        &:last-child {
          border-right: none;
        }
      }

      tr:last-child td {
        border-bottom: none;
      }

      th {
        background: #f9f9f9;
        font-weight: 600;
        color: #333;
      }

      tbody tr:nth-child(even) {
        background: #fafafa;
      }

      tbody tr:hover {
        background: #f0f7ff;
      }
    }

    hr {
      margin: 40px 0;
      border: none;
      height: 1px;
      background: #eaeaea;
    }

    strong {
      font-weight: 700;
      color: #111;
    }

    em {
      font-style: italic;
      color: #666;
    }
  }
}
</style>

