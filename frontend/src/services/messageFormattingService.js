import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

// 初始化 Markdown-it 并配置高亮
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (__) { }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 配置链接在新标签页打开
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, _options, _env, self) {
    return self.renderToken(tokens, idx, _options)
  }

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return defaultRender(tokens, idx, options, env, self)
}

// URL 检测正则
const URL_REGEX = /https?:\/\/[^\s<>[\]{}|\\^`"]+/gi

export class MessageFormattingService {
  /**
   * 检查消息是否包含 Markdown
   */
  static hasMarkdown(content) {
    if (!content) return false
    // 检查常见的 Markdown 语法
    return /[#*_\-`\[\]()~|!]/.test(content)
  }

  /**
   * 解析消息内容，识别内容类型
   */
  static parseMessageType(content) {
    if (!content) return 'text'

    const trimmed = content.trim()

    // 检查代码块
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      return 'code'
    }

    // 检查 Markdown
    if (this.hasMarkdown(content)) {
      return 'markdown'
    }

    // 检查纯链接
    if (URL_REGEX.test(content)) {
      return 'link'
    }

    return 'text'
  }

  /**
   * 将 Markdown 内容转换为 HTML
   */
  static markdownToHtml(content) {
    if (!content) return ''

    try {
      const html = md.render(content)
      // 防止 XSS 攻击
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'del',
          'code', 'pre', 'blockquote', 'ol', 'ul', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'a', 'img', 'span', 'div'
        ],
        ALLOWED_ATTR: ['class', 'style', 'href', 'title', 'target', 'rel', 'src', 'alt']
      })
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return DOMPurify.sanitize(content)
    }
  }

  /**
   * 提取消息中的链接
   */
  static extractUrls(content) {
    if (!content) return []
    const matches = content.match(URL_REGEX)
    return matches ? [...new Set(matches)] : []
  }

  /**
   * 获取代码块信息
   */
  static getCodeBlockInfo(content) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const blocks = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2],
        start: match.index,
        end: match.index + match[0].length
      })
    }

    return blocks
  }

  /**
   * 高亮单个代码块
   */
  static highlightCode(code, language = 'text') {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value
      }
      return hljs.highlightAuto(code).value
    } catch (error) {
      console.error('Code highlighting error:', error)
      return code
    }
  }

  /**
   * 支持的代码语言列表
   */
  static getSupportedLanguages() {
    return hljs.listLanguages()
  }

  /**
   * 处理消息内容 - 转义或格式化
   */
  static processContent(content, contentType = 'text') {
    if (!content) return ''

    switch (contentType) {
      case 'markdown':
        return this.markdownToHtml(content)
      case 'code':
        return this.highlightCode(content)
      case 'text':
      default:
        return DOMPurify.sanitize(content)
    }
  }

  /**
   * 为消息添加格式化元数据
   */
  static enrichMessage(message) {
    return {
      ...message,
      contentType: this.parseMessageType(message.content),
      urls: this.extractUrls(message.content),
      codeBlocks: this.getCodeBlockInfo(message.content),
      formattedContent: this.processContent(
        message.content,
        this.parseMessageType(message.content)
      )
    }
  }
}

export default MessageFormattingService
