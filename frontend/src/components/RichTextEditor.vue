<template>
  <div class="rich-text-editor">
    <mavon-editor
      v-model="content"
      :placeholder="placeholder"
      :toolbars="toolbars"
      :autofocus="autofocus"
      :language="language"
      :default-open="defaultOpen"
      :subfield="subfield"
      :code-style="codeStyle"
      :box-shadow="boxShadow"
      @change="handleChange"
      @img-add="handleImageAdd"
      @img-del="handleImageDel"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { mavonEditor } from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容，支持 Markdown 语法...'
  },
  autofocus: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'zh-CN'
  },
  defaultOpen: {
    type: String,
    default: 'edit',
    validator: (value) => ['edit', 'preview'].includes(value)
  },
  subfield: {
    type: Boolean,
    default: true // 双栏模式
  },
  codeStyle: {
    type: String,
    default: 'github'
  },
  boxShadow: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const content = ref(props.modelValue)

// 工具栏配置
const toolbars = {
  bold: true,
  italic: true,
  header: true,
  underline: true,
  strikethrough: true,
  mark: true,
  superscript: true,
  subscript: true,
  quote: true,
  ol: true,
  ul: true,
  link: true,
  imagelink: true,
  code: true,
  table: true,
  fullscreen: true,
  readmodel: true,
  htmlcode: true,
  help: true,
  undo: true,
  redo: true,
  trash: true,
  save: false,
  navigation: true,
  alignleft: true,
  aligncenter: true,
  alignright: true,
  subfield: true,
  preview: true
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

// 内容变化处理
const handleChange = (value, render) => {
  emit('update:modelValue', value)
  emit('change', value, render)
}

// 图片上传处理
const handleImageAdd = (pos, file) => {
  // 这里应该调用实际的图片上传 API
  // 暂时使用 base64 编码
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = e.target.result
    // 插入图片到编辑器
    content.value = content.value.replace(
      `![](${pos})`,
      `![${file.name}](${img})`
    )
  }
  reader.readAsDataURL(file)

  ElMessage.success('图片上传成功')
}

// 图片删除处理
const handleImageDel = (pos) => {
  console.log('删除图片:', pos)
}
</script>

<style scoped>
.rich-text-editor {
  width: 100%;
  min-height: 400px;
}

:deep(.v-note-wrapper) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

:deep(.v-note-wrapper:hover) {
  border-color: #409eff;
}

:deep(.v-note-wrapper.fullscreen) {
  z-index: 9999;
}
</style>
