<template>
  <div class="question-editor-page">
    <el-page-header @back="handleBack" title="返回">
      <template #content>
        <h2>{{ isEdit ? '编辑题目' : '创建新题目' }}</h2>
      </template>
    </el-page-header>

    <el-card class="editor-card" shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="top"
      >
        <!-- 基础信息 -->
        <el-divider content-position="left">
          <h3>基础信息</h3>
        </el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属领域" prop="domainId" required>
              <el-select
                v-model="form.domainId"
                placeholder="请选择领域"
                @change="handleDomainChange"
              >
                <el-option
                  v-for="domain in domainStore.domains"
                  :key="domain.id"
                  :label="`${domain.icon} ${domain.name}`"
                  :value="domain.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-cascader
                v-model="form.categoryPath"
                :options="categoryOptions"
                :props="cascaderProps"
                placeholder="请选择分类"
                clearable
                @change="handleCategoryChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题目标题" prop="title" required>
          <el-input
            v-model="form.title"
            placeholder="请输入题目标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="题目内容" prop="question" required>
          <el-input
            v-model="form.question"
            type="textarea"
            :rows="6"
            placeholder="请输入题目内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="题型" prop="type" required>
              <el-select v-model="form.type" placeholder="请选择题型">
                <el-option label="简答题" value="short_answer" />
                <el-option label="多选题" value="multiple_choice" />
                <el-option label="编程题" value="coding" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="难度" prop="difficulty" required>
              <el-select v-model="form.difficulty" placeholder="请选择难度">
                <el-option label="基础" value="easy" />
                <el-option label="进阶" value="medium" />
                <el-option label="挑战" value="hard" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="预计用时(分钟)" prop="estimatedTime">
              <el-input-number
                v-model="form.estimatedTime"
                :min="1"
                :max="120"
                placeholder="预计用时"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-model="tagInput"
            size="small"
            placeholder="输入标签后按回车"
            class="tag-input"
            @keyup.enter="addTag"
          />
        </el-form-item>

        <!-- 专业字段 (动态渲染) -->
        <el-divider content-position="left" v-if="currentFieldConfig.fields?.length">
          <h3>{{ currentDomainName }}专业字段</h3>
        </el-divider>

        <DynamicFormRenderer
          v-if="currentFieldConfig.fields?.length"
          :fields="currentFieldConfig.fields"
          v-model="form.metadata"
        />

        <!-- 答案与解析 -->
        <el-divider content-position="left">
          <h3>答案与解析</h3>
        </el-divider>

        <el-form-item label="参考答案" prop="answer">
          <el-input
            v-model="form.answer"
            type="textarea"
            :rows="8"
            placeholder="请输入参考答案"
          />
        </el-form-item>

        <el-form-item label="解析说明" prop="explanation">
          <el-input
            v-model="form.explanation"
            type="textarea"
            :rows="6"
            placeholder="请输入解析说明"
          />
        </el-form-item>

        <el-form-item label="提示信息">
          <el-tag
            v-for="(hint, index) in form.hints"
            :key="index"
            closable
            @close="removeHint(index)"
            class="tag-item"
          >
            {{ hint }}
          </el-tag>
          <el-input
            v-model="hintInput"
            size="small"
            placeholder="输入提示后按回车"
            class="tag-input"
            @keyup.enter="addHint"
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存修改' : '创建题目' }}
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useDomainStore } from '@/stores/domain'
import { useQuestionBankStore } from '@/stores/questions'
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue'

const router = useRouter()
const route = useRoute()
const domainStore = useDomainStore()
const questionStore = useQuestionBankStore()

const formRef = ref(null)
const submitting = ref(false)
const isEdit = computed(() => !!route.params.id)
const tagInput = ref('')
const hintInput = ref('')

const form = ref({
  domainId: null,
  categoryId: null,
  categoryPath: [],
  title: '',
  question: '',
  type: 'short_answer',
  difficulty: 'medium',
  estimatedTime: 10,
  tags: [],
  metadata: {},
  answer: '',
  explanation: '',
  hints: []
})

const rules = {
  title: [{ required: true, message: '请输入题目标题', trigger: 'blur' }],
  question: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  domainId: [{ required: true, message: '请选择领域', trigger: 'change' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true
}

const categoryOptions = computed(() => questionStore.categoriesTree)

const currentFieldConfig = computed(() => {
  if (!form.value.domainId) return { fields: [] }
  return domainStore.fieldConfigs[form.value.domainId] || { fields: [] }
})

const currentDomainName = computed(() => {
  const domain = domainStore.findDomainById(form.value.domainId)
  return domain?.name || ''
})

onMounted(async () => {
  await domainStore.loadDomains()
  if (isEdit.value) {
    // 加载题目数据
    await loadQuestion(route.params.id)
  }
})

async function handleDomainChange(domainId) {
  // 加载该领域的字段配置
  await domainStore.loadFieldConfig(domainId)
  // 加载该领域的分类
  await questionStore.loadCategories(domainId)
  // 重置分类选择
  form.value.categoryId = null
  form.value.categoryPath = []
  // 重置 metadata
  form.value.metadata = {}
}

function handleCategoryChange(value) {
  if (Array.isArray(value) && value.length > 0) {
    form.value.categoryId = value[value.length - 1]
  } else {
    form.value.categoryId = null
  }
}

function addTag() {
  if (tagInput.value && tagInput.value.trim()) {
    if (!form.value.tags.includes(tagInput.value.trim())) {
      form.value.tags.push(tagInput.value.trim())
    }
    tagInput.value = ''
  }
}

function removeTag(tag) {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

function addHint() {
  if (hintInput.value && hintInput.value.trim()) {
    form.value.hints.push(hintInput.value.trim())
    hintInput.value = ''
  }
}

function removeHint(index) {
  form.value.hints.splice(index, 1)
}

async function loadQuestion(id) {
  try {
    const question = await questionStore.fetchQuestionDetailData(id)
    if (question) {
      form.value = {
        ...form.value,
        ...question,
        categoryPath: question.categoryPath || []
      }
      // 加载领域配置
      if (question.domainId) {
        await handleDomainChange(question.domainId)
      }
    }
  } catch (error) {
    ElMessage.error('加载题目失败')
    handleBack()
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    // TODO: 调用创建/更新 API
    console.log('提交题目:', form.value)

    ElMessage.success(isEdit.value ? '题目更新成功' : '题目创建成功')
    handleBack()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value.resetFields()
  form.value.metadata = {}
  form.value.tags = []
  form.value.hints = []
}

function handleBack() {
  router.back()
}
</script>

<style scoped>
.question-editor-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.editor-card {
  margin-top: 24px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.tag-input {
  width: 200px;
}

:deep(.el-divider__text) {
  background: #f5f7fa;
}
</style>
