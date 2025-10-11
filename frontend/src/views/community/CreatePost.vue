<template>
  <div class="create-post-page">
    <el-page-header @back="$router.back()" title="返回">
      <template #content>
        <span class="page-title">发布新帖</span>
      </template>
    </el-page-header>

    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="所属板块" prop="forumId">
          <el-select
            v-model="formData.forumId"
            placeholder="请选择板块"
            style="width: 100%"
          >
            <el-option
              v-for="forum in forums"
              :key="forum.id"
              :label="`${forum.icon} ${forum.name}`"
              :value="forum.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="帖子标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入帖子标题（5-100字）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="帖子内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="12"
            placeholder="请输入帖子内容，支持 Markdown 格式..."
            maxlength="5000"
            show-word-limit
          />
          <div class="markdown-hint">
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                支持 Markdown 格式：# 标题，**粗体**，*斜体*，```代码块```
              </template>
            </el-alert>
          </div>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            placeholder="请选择或输入标签（最多5个）"
            style="width: 100%"
            :multiple-limit="5"
          >
            <el-option
              v-for="tag in hotTags"
              :key="tag.tag"
              :label="tag.tag"
              :value="tag.tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="AI 审核">
          <el-switch v-model="formData.aiReview" />
          <span class="form-hint">开启后将由 AI 自动审核内容质量</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            发布帖子
          </el-button>
          <el-button @click="handleDraft">保存草稿</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>

      <!-- 预览 -->
      <el-divider>预览</el-divider>
      <div class="preview-section">
        <h2>{{ formData.title || '（标题）' }}</h2>
        <div class="preview-tags">
          <el-tag v-for="tag in formData.tags" :key="tag" size="small">
            {{ tag }}
          </el-tag>
        </div>
        <div class="preview-content" v-html="renderMarkdown(formData.content || '（内容）')"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getForums, createPost, getHotTags } from '@/api/community'

const router = useRouter()

// 状态
const formRef = ref()
const submitting = ref(false)
const forums = ref([])
const hotTags = ref([])

// 表单数据
const formData = ref({
  forumId: null,
  title: '',
  content: '',
  tags: [],
  aiReview: true
})

// 表单验证规则
const rules = {
  forumId: [{ required: true, message: '请选择板块', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度需在 5-100 字之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, message: '内容至少需要 10 个字', trigger: 'blur' }
  ]
}

// 渲染 Markdown
const renderMarkdown = (content) => {
  return content
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/\n/g, '<br>')
}

// 获取板块列表
const fetchForums = async () => {
  try {
    const res = await getForums()
    forums.value = res.data || []
  } catch (error) {
    ElMessage.error('获取板块列表失败')
  }
}

// 获取热门标签
const fetchHotTags = async () => {
  try {
    const res = await getHotTags()
    hotTags.value = res.data || []
  } catch (error) {
    console.error('获取热门标签失败', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请完善表单信息')
    return
  }

  submitting.value = true
  try {
    const res = await createPost(formData.value)
    ElMessage.success(res.message || '发帖成功')
    router.push(`/community/posts/${res.data.id}`)
  } catch (error) {
    ElMessage.error(error.message || '发帖失败')
  } finally {
    submitting.value = false
  }
}

// 保存草稿
const handleDraft = () => {
  // 将表单数据保存到 localStorage
  localStorage.setItem('post_draft', JSON.stringify(formData.value))
  ElMessage.success('草稿已保存')
}

// 加载草稿
const loadDraft = () => {
  const draft = localStorage.getItem('post_draft')
  if (draft) {
    try {
      const data = JSON.parse(draft)
      formData.value = { ...formData.value, ...data }
      ElMessage.info('已加载草稿')
    } catch (error) {
      console.error('加载草稿失败', error)
    }
  }
}

onMounted(() => {
  fetchForums()
  fetchHotTags()
  loadDraft()
})
</script>

<style scoped lang="scss">
.create-post-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
  }
}

.form-card {
  margin-top: 20px;

  .markdown-hint {
    margin-top: 10px;
  }

  .form-hint {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }

  .preview-section {
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;

    h2 {
      font-size: 24px;
      margin-bottom: 16px;
    }

    .preview-tags {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .preview-content {
      font-size: 16px;
      line-height: 1.8;

      :deep(h1) {
        font-size: 24px;
        margin: 16px 0;
      }

      :deep(h2) {
        font-size: 20px;
        margin: 14px 0;
      }

      :deep(h3) {
        font-size: 18px;
        margin: 12px 0;
      }

      :deep(pre) {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;

        code {
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
}
</style>
