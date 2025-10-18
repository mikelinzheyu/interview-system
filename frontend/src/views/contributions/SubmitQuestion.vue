<template>
  <div class="submit-question-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>📝 提交题目到社区</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="submit-form"
      >
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="领域" prop="domainId">
          <el-select
            v-model="form.domainId"
            placeholder="请选择领域"
            style="width: 100%"
            @change="handleDomainChange"
          >
            <el-option
              v-for="domain in domains"
              :key="domain.id"
              :label="`${domain.icon} ${domain.name}`"
              :value="domain.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select
            v-model="form.categoryId"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="题目标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入题目标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="题目内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入题目内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="难度" prop="difficulty">
          <el-radio-group v-model="form.difficulty">
            <el-radio label="easy">简单</el-radio>
            <el-radio label="medium">中等</el-radio>
            <el-radio label="hard">困难</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-tag
            v-for="tag in form.tags"
            :key="tag"
            closable
            style="margin-right: 10px"
            @close="handleRemoveTag(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            style="width: 120px"
            @blur="handleTagInputConfirm"
            @keyup.enter="handleTagInputConfirm"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput"
          >
            + 新标签
          </el-button>
        </el-form-item>

        <!-- 选项 -->
        <el-divider content-position="left">选项</el-divider>

        <el-form-item
          v-for="(option, index) in form.options"
          :key="option.id"
          :label="`选项 ${option.id}`"
          :prop="`options.${index}.text`"
          :rules="{ required: true, message: '请输入选项内容', trigger: 'blur' }"
        >
          <el-input
            v-model="option.text"
            placeholder="请输入选项内容"
          >
            <template #append>
              <el-button
                v-if="form.options.length > 2"
                icon="Delete"
                @click="removeOption(index)"
              >
                删除
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            icon="Plus"
            :disabled="form.options.length >= 6"
            @click="addOption"
          >
            添加选项
          </el-button>
        </el-form-item>

        <el-form-item label="正确答案" prop="correctAnswer">
          <el-select
            v-model="form.correctAnswer"
            placeholder="请选择正确答案"
            style="width: 200px"
          >
            <el-option
              v-for="option in form.options"
              :key="option.id"
              :label="`选项 ${option.id}`"
              :value="option.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="答案解析" prop="explanation">
          <el-input
            v-model="form.explanation"
            type="textarea"
            :rows="4"
            placeholder="请输入答案解析"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <!-- 提示 -->
        <el-divider content-position="left">提示 (可选)</el-divider>

        <el-form-item
          v-for="(hint, index) in form.hints"
          :key="index"
          :label="`提示 ${index + 1}`"
        >
          <el-input
            v-model="form.hints[index]"
            placeholder="请输入提示"
          >
            <template #append>
              <el-button
                icon="Delete"
                @click="removeHint(index)"
              >
                删除
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            icon="Plus"
            :disabled="form.hints.length >= 5"
            @click="addHint"
          >
            添加提示
          </el-button>
        </el-form-item>

        <!-- 专业字段 -->
        <el-divider content-position="left">专业字段 (可选)</el-divider>

        <el-form-item v-if="form.domainId === 1" label="编程语言">
          <el-select
            v-model="form.metadata.languageRestrictions"
            multiple
            placeholder="请选择编程语言"
            style="width: 100%"
          >
            <el-option label="JavaScript" value="JavaScript" />
            <el-option label="Python" value="Python" />
            <el-option label="Java" value="Java" />
            <el-option label="C++" value="C++" />
            <el-option label="Go" value="Go" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.domainId === 1" label="时间复杂度">
          <el-input
            v-model="form.metadata.timeComplexity"
            placeholder="例如: O(n)"
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            提交题目
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handlePreview">预览</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="题目预览"
      width="800px"
    >
      <div class="preview-content">
        <h3>{{ form.title }}</h3>
        <p class="difficulty">
          <el-tag
            :type="form.difficulty === 'easy' ? 'success' : form.difficulty === 'medium' ? 'warning' : 'danger'"
          >
            {{ difficultyMap[form.difficulty] }}
          </el-tag>
        </p>
        <div class="content">{{ form.content }}</div>
        <div class="options">
          <div
            v-for="option in form.options"
            :key="option.id"
            class="option-item"
            :class="{ correct: option.id === form.correctAnswer }"
          >
            <strong>{{ option.id }}.</strong> {{ option.text }}
          </div>
        </div>
        <div v-if="form.explanation" class="explanation">
          <strong>答案解析:</strong>
          <p>{{ form.explanation }}</p>
        </div>
        <div v-if="form.hints.length > 0" class="hints">
          <strong>提示:</strong>
          <ul>
            <li v-for="(hint, index) in form.hints" :key="index">{{ hint }}</li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import { getDomains } from '@/api/questions'

const router = useRouter()
const contributionsStore = useContributionsStore()

// 表单引用
const formRef = ref(null)
const tagInputRef = ref(null)

// 数据
const domains = ref([])
const categories = ref([
  { id: 1, name: '算法' },
  { id: 2, name: '数据结构' },
  { id: 3, name: '系统设计' }
])

// 表单数据
const form = reactive({
  domainId: null,
  categoryId: null,
  title: '',
  content: '',
  difficulty: 'medium',
  tags: [],
  options: [
    { id: 'A', text: '' },
    { id: 'B', text: '' }
  ],
  correctAnswer: '',
  explanation: '',
  hints: [],
  metadata: {
    languageRestrictions: [],
    timeComplexity: ''
  }
})

// 表单验证规则
const rules = {
  domainId: [{ required: true, message: '请选择领域', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入题目标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  correctAnswer: [{ required: true, message: '请选择正确答案', trigger: 'change' }],
  explanation: [{ required: true, message: '请输入答案解析', trigger: 'blur' }]
}

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')

// 预览
const previewVisible = ref(false)
const difficultyMap = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

// 提交状态
const submitting = ref(false)

// 生命周期
onMounted(async () => {
  await fetchDomains()
})

// 方法
async function fetchDomains() {
  try {
    const response = await getDomains()
    if (response.code === 200) {
      domains.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取领域列表失败')
  }
}

function handleDomainChange() {
  // 重置分类
  form.categoryId = null
}

function addOption() {
  const nextId = String.fromCharCode(65 + form.options.length)
  form.options.push({ id: nextId, text: '' })
}

function removeOption(index) {
  form.options.splice(index, 1)
  // 重新分配ID
  form.options.forEach((option, i) => {
    option.id = String.fromCharCode(65 + i)
  })
  // 如果删除的是正确答案,清空正确答案
  if (form.correctAnswer === form.options[index]?.id) {
    form.correctAnswer = ''
  }
}

function addHint() {
  form.hints.push('')
}

function removeHint(index) {
  form.hints.splice(index, 1)
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function handleTagInputConfirm() {
  if (tagInputValue.value) {
    form.tags.push(tagInputValue.value)
    tagInputValue.value = ''
  }
  tagInputVisible.value = false
}

function handleRemoveTag(tag) {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()

    await ElMessageBox.confirm(
      '确定要提交这道题目吗?提交后将进入审核队列。',
      '确认提交',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    submitting.value = true

    const response = await contributionsStore.submitQuestion(form)

    if (response.code === 200) {
      ElMessage.success('题目提交成功,正在等待审核')
      router.push('/contributions/my-submissions')
    } else {
      ElMessage.error(response.message || '提交失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  formRef.value.resetFields()
  form.options = [
    { id: 'A', text: '' },
    { id: 'B', text: '' }
  ]
  form.hints = []
  form.tags = []
}

function handlePreview() {
  previewVisible.value = true
}
</script>

<style scoped>
.submit-question-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.submit-form {
  max-width: 800px;
}

.preview-content {
  padding: 20px;
}

.preview-content h3 {
  margin-bottom: 10px;
}

.preview-content .difficulty {
  margin-bottom: 20px;
}

.preview-content .content {
  margin-bottom: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.preview-content .options {
  margin-bottom: 20px;
}

.preview-content .option-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.preview-content .option-item.correct {
  background-color: #f0f9ff;
  border-color: #409eff;
}

.preview-content .explanation {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.preview-content .hints ul {
  margin-top: 10px;
  padding-left: 20px;
}
</style>
