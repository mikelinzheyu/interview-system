<template>
  <div class="create-interview-container">
    <div class="create-interview-header">
      <el-button type="text" @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">创建AI面试</h1>
    </div>

    <div class="create-interview-content">
      <el-row :gutter="40">
        <!-- 配置表单 -->
        <el-col :span="14">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <el-icon><Setting /></el-icon>
                <span>面试配置</span>
              </div>
            </template>

            <el-form
              ref="interviewFormRef"
              :model="interviewForm"
              :rules="interviewRules"
              label-width="120px"
              size="large"
            >
              <el-form-item label="面试类型" prop="type">
                <el-radio-group v-model="interviewForm.type">
                  <el-radio-button value="tech">技术面试</el-radio-button>
                  <el-radio-button value="hr">HR面试</el-radio-button>
                  <el-radio-button value="behavioral">行为面试</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="技术领域" prop="category_id">
                <el-select 
                  v-model="interviewForm.category_id" 
                  placeholder="请选择技术领域"
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

              <el-form-item label="难度等级" prop="difficulty">
                <el-radio-group v-model="interviewForm.difficulty">
                  <el-radio-button value="easy">初级</el-radio-button>
                  <el-radio-button value="medium">中级</el-radio-button>
                  <el-radio-button value="hard">高级</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="AI模型" prop="ai_model">
                <el-select 
                  v-model="interviewForm.ai_model" 
                  placeholder="请选择AI模型"
                  style="width: 100%"
                >
                  <el-option label="GPT-4 (推荐)" value="gpt-4" />
                  <el-option label="GPT-3.5-Turbo" value="gpt-3.5-turbo" />
                  <el-option label="Claude-3" value="claude-3" />
                </el-select>
              </el-form-item>

              <el-form-item label="面试时长" prop="time_limit">
                <el-slider
                  v-model="interviewForm.config.time_limit"
                  :min="15"
                  :max="120"
                  :step="15"
                  :format-tooltip="formatTimeTooltip"
                  show-input
                  input-size="small"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item label="题目数量" prop="question_count">
                <el-input-number
                  v-model="interviewForm.config.question_count"
                  :min="5"
                  :max="20"
                  :step="1"
                  style="width: 200px"
                />
              </el-form-item>

              <el-form-item label="高级选项">
                <el-checkbox v-model="interviewForm.config.auto_followup">
                  自动追问
                </el-checkbox>
                <el-checkbox v-model="interviewForm.config.real_time_feedback">
                  实时反馈
                </el-checkbox>
                <el-checkbox v-model="interviewForm.config.voice_enabled">
                  语音交互
                </el-checkbox>
              </el-form-item>

              <el-form-item>
                <el-button 
                  type="primary" 
                  size="large"
                  :loading="creating"
                  @click="createInterview"
                >
                  <el-icon><VideoCamera /></el-icon>
                  开始面试
                </el-button>
                <el-button size="large" @click="resetForm">
                  重置配置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 预览和说明 -->
        <el-col :span="10">
          <el-card class="preview-card">
            <template #header>
              <div class="card-header">
                <el-icon><View /></el-icon>
                <span>配置预览</span>
              </div>
            </template>

            <div class="preview-content">
              <div class="preview-item">
                <label>面试类型：</label>
                <el-tag :type="getTypeTagType(interviewForm.type)">
                  {{ getTypeLabel(interviewForm.type) }}
                </el-tag>
              </div>

              <div class="preview-item">
                <label>技术领域：</label>
                <span>{{ getCategoryName(interviewForm.category_id) || '未选择' }}</span>
              </div>

              <div class="preview-item">
                <label>难度等级：</label>
                <el-tag :type="getDifficultyTagType(interviewForm.difficulty)">
                  {{ getDifficultyLabel(interviewForm.difficulty) }}
                </el-tag>
              </div>

              <div class="preview-item">
                <label>预计时长：</label>
                <span>{{ interviewForm.config.time_limit }}分钟</span>
              </div>

              <div class="preview-item">
                <label>题目数量：</label>
                <span>{{ interviewForm.config.question_count }}道</span>
              </div>

              <div class="preview-item">
                <label>AI模型：</label>
                <span>{{ getModelName(interviewForm.ai_model) }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="tips-card">
            <template #header>
              <div class="card-header">
                <el-icon><InfoFilled /></el-icon>
                <span>面试提示</span>
              </div>
            </template>

            <div class="tips-content">
              <el-alert
                title="面试前准备"
                type="info"
                :closable="false"
                show-icon
              >
                <ul>
                  <li>确保网络连接稳定</li>
                  <li>准备一个安静的环境</li>
                  <li>整理好相关的项目经验</li>
                  <li>保持放松，展现真实的自己</li>
                </ul>
              </el-alert>

              <el-alert
                title="评分标准"
                type="success"
                :closable="false"
                show-icon
                style="margin-top: 16px"
              >
                <ul>
                  <li>技术能力 (40%)</li>
                  <li>逻辑思维 (30%)</li>
                  <li>表达能力 (20%)</li>
                  <li>项目经验 (10%)</li>
                </ul>
              </el-alert>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Setting, View, InfoFilled, VideoCamera 
} from '@element-plus/icons-vue'

const router = useRouter()

const interviewFormRef = ref()
const creating = ref(false)

// 表单数据
const interviewForm = reactive({
  type: 'tech',
  category_id: '',
  difficulty: 'medium',
  ai_model: 'gpt-4',
  config: {
    time_limit: 45,
    question_count: 10,
    auto_followup: true,
    real_time_feedback: false,
    voice_enabled: false
  }
})

// 验证规则
const interviewRules = {
  type: [
    { required: true, message: '请选择面试类型', trigger: 'change' }
  ],
  category_id: [
    { required: true, message: '请选择技术领域', trigger: 'change' }
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  ai_model: [
    { required: true, message: '请选择AI模型', trigger: 'change' }
  ]
}

// 分类数据
const categories = ref([
  { id: 1, name: 'Java开发' },
  { id: 2, name: 'Python开发' },
  { id: 3, name: '前端开发' },
  { id: 4, name: '数据库' },
  { id: 5, name: '算法与数据结构' },
  { id: 6, name: '系统设计' },
  { id: 7, name: '云计算' },
  { id: 8, name: '机器学习' }
])

// 格式化时间提示
const formatTimeTooltip = (value) => {
  return `${value}分钟`
}

// 获取类型标签样式
const getTypeTagType = (type) => {
  const types = {
    tech: 'primary',
    hr: 'success',
    behavioral: 'warning'
  }
  return types[type] || ''
}

// 获取类型标签文本
const getTypeLabel = (type) => {
  const labels = {
    tech: '技术面试',
    hr: 'HR面试',
    behavioral: '行为面试'
  }
  return labels[type] || ''
}

// 获取难度标签样式
const getDifficultyTagType = (difficulty) => {
  const types = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  }
  return types[difficulty] || ''
}

// 获取难度标签文本
const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: '初级',
    medium: '中级',
    hard: '高级'
  }
  return labels[difficulty] || ''
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || ''
}

// 获取模型名称
const getModelName = (model) => {
  const models = {
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5-Turbo',
    'claude-3': 'Claude-3'
  }
  return models[model] || ''
}

// 创建面试
const createInterview = async () => {
  if (!interviewFormRef.value) return
  
  try {
    const valid = await interviewFormRef.value.validate()
    if (!valid) return
    
    creating.value = true
    
    // 模拟创建面试会话
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const sessionId = Date.now()
    
    ElMessage.success('面试会话创建成功，即将开始面试！')
    
    // 跳转到面试页面
    router.push(`/interview?session=${sessionId}`)
    
  } catch (error) {
    ElMessage.error('创建面试失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (interviewFormRef.value) {
    interviewFormRef.value.resetFields()
  }
  
  // 重置配置
  interviewForm.config = {
    time_limit: 45,
    question_count: 10,
    auto_followup: true,
    real_time_feedback: false,
    voice_enabled: false
  }
}

onMounted(() => {
  // 初始化页面数据
})
</script>

<style scoped>
.create-interview-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.create-interview-header {
  max-width: 1200px;
  margin: 0 auto 20px auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.create-interview-content {
  max-width: 1200px;
  margin: 0 auto;
}

.config-card,
.preview-card,
.tips-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.preview-content {
  padding: 0;
}

.preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-item label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  margin-right: 12px;
}

.tips-content ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.tips-content li {
  margin-bottom: 4px;
  color: #606266;
  font-size: 14px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-card__header) {
  padding: 18px 24px;
  border-bottom: 1px solid #f0f2f5;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-radio-button__inner) {
  border-radius: 6px;
  margin-right: 8px;
}

:deep(.el-slider__runway) {
  margin: 16px 0;
}

:deep(.el-alert) {
  border-radius: 8px;
}

:deep(.el-alert__content) {
  padding-left: 8px;
}

@media (max-width: 768px) {
  .create-interview-container {
    padding: 12px;
  }
  
  .create-interview-content .el-col:first-child {
    margin-bottom: 20px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  :deep(.el-form-item__label) {
    width: 100px !important;
  }
}
</style>