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

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedHtml = computed(() => {
  try {
    const html = marked(props.content)
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's',
        'a', 'code',
        'ul', 'ol', 'li', 'blockquote',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    })
  } catch (error) {
    console.error('Markdown preview error:', error)
    return `<p>${DOMPurify.sanitize(props.content)}</p>`
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
    }

    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', monospace;
      font-size: 12px;
      color: #c41d7f;
    }

    a {
      color: #409eff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: all 0.3s;

      &:hover {
        border-bottom-color: #409eff;
      }
    }
  }
}
</style>
