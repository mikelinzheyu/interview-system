<template>
  <div class="markdown-body-enhanced" v-html="renderedContent"></div>
</template>

<script setup>
import { computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItTocDoneRight from 'markdown-it-toc-done-right'
import markdownItEmoji from 'markdown-it-emoji'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItTaskLists from 'markdown-it-task-lists'
import 'highlight.js/styles/github-dark.css'

const props = defineProps({
  content: {
    type: String,
    required: true,
    default: ''
  }
})

// 配置 Markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true
        }).value

        return `<pre class="hljs-code-block"><div class="code-header">
          <span class="language-label">${lang}</span>
          <button class="copy-btn" data-code="${encodeURIComponent(str)}" onclick="window.copyCode(this)">
            <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            复制
          </button>
        </div><code class="language-${lang}">${highlighted}</code></pre>`
      } catch (err) {
        console.error('Highlight error:', err)
      }
    }

    return `<pre class="hljs-code-block"><div class="code-header">
      <span class="language-label">text</span>
      <button class="copy-btn" data-code="${encodeURIComponent(str)}" onclick="window.copyCode(this)">
        <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        复制
      </button>
    </div><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})
  .use(markdownItAnchor, {
    level: [1, 2, 3, 4],
    permalink: markdownItAnchor.permalink.headerLink({
      class: 'header-anchor',
      symbol: '#',
      renderAttrs: () => ({ 'aria-label': '锚点链接' })
    })
  })
  .use(markdownItTocDoneRight, {
    containerClass: 'table-of-contents',
    listType: 'ul'
  })
  .use(markdownItEmoji)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItFootnote)
  .use(markdownItTaskLists, {
    enabled: true,
    label: true,
    labelAfter: true
  })

// 自定义渲染规则
md.renderer.rules.table_open = () => '<div class="table-wrapper"><table>'
md.renderer.rules.table_close = () => '</table></div>'

// 渲染内容
const renderedContent = computed(() => {
  if (!props.content) return '<p class="empty-content">暂无内容</p>'

  try {
    return md.render(props.content)
  } catch (error) {
    console.error('Markdown render error:', error)
    return '<p class="error-content">内容渲染失败</p>'
  }
})

// 全局复制函数
onMounted(() => {
  if (typeof window !== 'undefined' && !window.copyCode) {
    window.copyCode = async function(button) {
      try {
        const encodedCode = button.getAttribute('data-code')
        const code = decodeURIComponent(encodedCode)

        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code)
        } else {
          // 降级方案
          const textarea = document.createElement('textarea')
          textarea.value = code
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }

        // 更新按钮状态
        const originalHTML = button.innerHTML
        button.innerHTML = `<svg class="copy-icon success" viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>已复制!`
        button.classList.add('copied')

        setTimeout(() => {
          button.innerHTML = originalHTML
          button.classList.remove('copied')
        }, 2000)

        ElMessage.success('代码已复制到剪贴板')
      } catch (error) {
        console.error('Copy failed:', error)
        ElMessage.error('复制失败，请手动复制')
      }
    }
  }

  // 为所有外部链接添加 target="_blank"
  nextTick(() => {
    const links = document.querySelectorAll('.markdown-body-enhanced a')
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href && href.startsWith('http') && !href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
    })
  })
})
</script>

<style lang="scss">
// 导入 GitHub Markdown 样式
.markdown-body-enhanced {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  word-wrap: break-word;
  color: #24292f;

  // 标题样式
  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    position: relative;

    &:first-child {
      margin-top: 0;
    }

    .header-anchor {
      float: left;
      margin-left: -20px;
      padding-right: 4px;
      color: #0969da;
      text-decoration: none;
      opacity: 0;
      transition: opacity 0.2s;

      &:hover {
        text-decoration: underline;
      }
    }

    &:hover .header-anchor {
      opacity: 1;
    }
  }

  h1 {
    font-size: 2em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 0.3em;
  }

  h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 0.3em;
  }

  h3 { font-size: 1.25em; }
  h4 { font-size: 1em; }
  h5 { font-size: 0.875em; }
  h6 { font-size: 0.85em; color: #57606a; }

  // 段落
  p {
    margin-top: 0;
    margin-bottom: 16px;
  }

  // 链接
  a {
    color: #0969da;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // 列表
  ul, ol {
    margin-top: 0;
    margin-bottom: 16px;
    padding-left: 2em;
  }

  li {
    margin-top: 0.25em;

    &::marker {
      color: #57606a;
    }
  }

  // 任务列表
  .task-list-item {
    list-style-type: none;

    input[type="checkbox"] {
      margin: 0 0.5em 0 -1.5em;
      vertical-align: middle;
    }
  }

  // 引用
  blockquote {
    margin: 0 0 16px 0;
    padding: 0 1em;
    color: #57606a;
    border-left: 0.25em solid #d0d7de;

    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }

  // 代码
  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  }

  // 代码块
  .hljs-code-block {
    margin: 16px 0;
    background: #0d1117;
    border-radius: 6px;
    overflow: hidden;
    position: relative;

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #161b22;
      border-bottom: 1px solid #30363d;

      .language-label {
        color: #8b949e;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .copy-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        background: #21262d;
        color: #c9d1d9;
        border: 1px solid #30363d;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;

        .copy-icon {
          &.success {
            color: #3fb950;
          }
        }

        &:hover {
          background: #30363d;
          border-color: #8b949e;
        }

        &.copied {
          background: #238636;
          border-color: #3fb950;
          color: white;
        }
      }
    }

    code {
      display: block;
      padding: 16px;
      overflow-x: auto;
      background: transparent;
      color: #c9d1d9;
      font-size: 14px;
      line-height: 1.5;
      border-radius: 0;
    }
  }

  pre {
    margin: 0;
    padding: 0;
  }

  // 表格
  .table-wrapper {
    overflow-x: auto;
    margin: 16px 0;
  }

  table {
    border-spacing: 0;
    border-collapse: collapse;
    width: 100%;
    overflow: auto;

    th {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
      font-weight: 600;
      background-color: #f6f8fa;
    }

    td {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
    }

    tr {
      background-color: #ffffff;
      border-top: 1px solid #d0d7de;

      &:nth-child(2n) {
        background-color: #f6f8fa;
      }
    }
  }

  // 水平线
  hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #d0d7de;
    border: 0;
  }

  // 图片
  img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 16px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  }

  // 目录
  .table-of-contents {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;

    ul {
      margin: 0;
      padding-left: 1.5em;
    }
  }

  // Emoji
  .emoji {
    width: 1.2em;
    height: 1.2em;
    vertical-align: middle;
  }

  // 脚注
  .footnotes {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #d0d7de;
    font-size: 0.875em;
    color: #57606a;
  }

  // 空内容
  .empty-content, .error-content {
    color: #8b949e;
    font-style: italic;
    text-align: center;
    padding: 32px 0;
  }
}

// 暗黑模式
.dark .markdown-body-enhanced {
  color: #c9d1d9;

  h6 {
    color: #8b949e;
  }

  a {
    color: #58a6ff;
  }

  li::marker {
    color: #8b949e;
  }

  blockquote {
    color: #8b949e;
    border-left-color: #3b434b;
  }

  code {
    background-color: rgba(110, 118, 129, 0.4);
  }

  .hljs-code-block {
    background: #0d1117;

    .code-header {
      background: #161b22;
      border-bottom-color: #21262d;
    }
  }

  table {
    th {
      background-color: #161b22;
      border-color: #3b434b;
    }

    td {
      border-color: #3b434b;
    }

    tr {
      background-color: #0d1117;
      border-top-color: #21262d;

      &:nth-child(2n) {
        background-color: #161b22;
      }
    }
  }

  hr {
    background-color: #21262d;
  }

  .table-of-contents {
    background: #161b22;
    border-color: #30363d;
  }

  .footnotes {
    border-top-color: #21262d;
    color: #8b949e;
  }
}

// 响应式
@media (max-width: 768px) {
  .markdown-body-enhanced {
    font-size: 14px;

    h1 { font-size: 1.75em; }
    h2 { font-size: 1.4em; }
    h3 { font-size: 1.2em; }

    .hljs-code-block {
      code {
        font-size: 12px;
        padding: 12px;
      }
    }

    table {
      font-size: 14px;

      th, td {
        padding: 4px 8px;
      }
    }
  }
}
</style>
