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

// 代码块 + 高亮 + 复制按钮
renderer.code = (code, language) => {
  const lang = (language || 'plaintext').toLowerCase()
  const text = code || ''

  try {
    const highlighted = hljs.highlight(text, {
      language: lang,
      ignoreIllegals: true
    }).value

    const encodedCode = btoa(unescape(encodeURIComponent(text)))
    return `<div class="code-block-wrapper" data-language="${DOMPurify.sanitize(
      lang
    )}" data-code="${encodedCode}">
      <pre class="code-block" data-language="${DOMPurify.sanitize(lang)}">
        <code class="language-${DOMPurify.sanitize(lang)}">${highlighted}</code>
      </pre>
      <div class="code-actions">
        <button class="code-copy-btn" title="复制代码">📋 复制</button>
      </div>
    </div>`
  } catch (error) {
    console.error('Highlight error:', error)
    const encodedCode = btoa(unescape(encodeURIComponent(text)))
    return `<div class="code-block-wrapper" data-language="${DOMPurify.sanitize(
      lang
    )}" data-code="${encodedCode}">
      <pre class="code-block" data-language="${DOMPurify.sanitize(lang)}">
        <code class="language-${DOMPurify.sanitize(lang)}">${DOMPurify.sanitize(
          text
        )}</code>
      </pre>
      <div class="code-actions">
        <button class="code-copy-btn" title="复制代码">📋 复制</button>
      </div>
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
  .markdown-content {
    font-size: 16px;
    line-height: 1.8;
    color: #303133;

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

    p {
      margin: 16px 0;
    }

    ul,
    ol {
      margin: 16px 0;
      padding-left: 24px;

      li {
        margin: 8px 0;
      }
    }

    a.markdown-link {
      color: #409eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    img.markdown-image {
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
    }

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

    hr {
      margin: 32px 0;
      border: none;
      height: 2px;
      background: linear-gradient(to right, #f0f0f0, #ccc, #f0f0f0);
    }

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

