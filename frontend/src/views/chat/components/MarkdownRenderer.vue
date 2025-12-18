<template>
  <div class="markdown-body" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // 使用深色主题

const props = defineProps<{
  content: string
}>()

// 配置 marked 使用 highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-',
  breaks: true // 允许回车换行
})

const renderedContent = computed(() => {
  return marked.parse(props.content || '')
})
</script>

<style lang="scss">
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;

  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  p {
    margin-top: 0;
    margin-bottom: 16px;
  }

  code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  }

  pre {
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #0d1117; // 深色背景
    border-radius: 6px;
    margin-bottom: 16px;

    code {
      padding: 0;
      margin: 0;
      background-color: transparent;
      color: #e6edf3; // 深色模式下的文字颜色
    }
  }

  ul, ol {
    padding-left: 2em;
    margin-bottom: 16px;
  }

  blockquote {
    padding: 0 1em;
    color: #656d76;
    border-left: 0.25em solid #d0d7de;
    margin: 0 0 16px 0;
  }
  
  a {
    color: #0969da;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}
</style>
