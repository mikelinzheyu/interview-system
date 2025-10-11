<template>
  <div class="generate-questions-container">
    <el-row :gutter="20">
      <!-- 生成配置 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>🤖 AI 生成配置</h3>
              <el-button size="small" text @click="showTemplateDialog = true">
                模板管理
              </el-button>
            </div>
          </template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="Prompt模板">
              <el-select v-model="form.templateId" @change="handleTemplateChange" style="width: 100%">
                <el-option
                  v-for="template in promptTemplates"
                  :key="template.id"
                  :label="template.name"
                  :value="template.id"
                >
                  <span>{{ template.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    成功率: {{ (template.successRate * 100).toFixed(0) }}%
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="领域">
              <el-select v-model="form.domainId" @change="handleDomainChange" style="width: 100%">
                <el-option
                  v-for="domain in domains"
                  :key="domain.id"
                  :label="domain.name"
                  :value="domain.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="分类">
              <el-select v-model="form.categoryId" style="width: 100%">
                <el-option label="算法" :value="1" />
                <el-option label="数据结构" :value="2" />
                <el-option label="系统设计" :value="3" />
              </el-select>
            </el-form-item>

            <el-form-item label="难度">
              <el-radio-group v-model="form.difficulty" @change="handleDifficultyChange">
                <el-radio label="easy">简单</el-radio>
                <el-radio label="medium">中等</el-radio>
                <el-radio label="hard">困难</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="生成数量">
              <el-input-number
                v-model="form.count"
                :min="1"
                :max="10"
                style="width: 100%"
                @change="updateCostEstimate"
              />
            </el-form-item>

            <el-form-item label="AI 模型">
              <el-select v-model="form.model" style="width: 100%" @change="updateCostEstimate">
                <el-option label="GPT-4" value="gpt-4">
                  <span>GPT-4</span>
                  <span style="float: right; color: #67c23a; font-size: 12px">高质量</span>
                </el-option>
                <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo">
                  <span>GPT-3.5 Turbo</span>
                  <span style="float: right; color: #409eff; font-size: 12px">经济</span>
                </el-option>
                <el-option label="Claude 3 Opus" value="claude-3-opus-20240229">
                  <span>Claude 3 Opus</span>
                  <span style="float: right; color: #e6a23c; font-size: 12px">平衡</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="Temperature">
              <el-slider
                v-model="form.temperature"
                :min="0"
                :max="1"
                :step="0.1"
                show-input
              />
              <div class="help-text">
                较低值（0.3）更保守，较高值（0.9）更有创意
              </div>
            </el-form-item>

            <!-- 成本预估 -->
            <el-alert
              v-if="costEstimate"
              type="info"
              :closable="false"
              class="cost-estimate"
            >
              <template #title>
                <div class="estimate-info">
                  <div>预估成本: <strong>${{ costEstimate.estimatedCost }}</strong></div>
                  <div>预估Token: {{ costEstimate.estimatedTotalTokens }}</div>
                  <div>单题成本: ${{ costEstimate.pricePerQuestion }}</div>
                </div>
              </template>
            </el-alert>

            <el-divider />

            <el-form-item label="编程语言" v-if="form.domainId === 1">
              <el-select
                v-model="form.metadata.languageRestrictions"
                multiple
                style="width: 100%"
              >
                <el-option label="JavaScript" value="JavaScript" />
                <el-option label="Python" value="Python" />
                <el-option label="Java" value="Java" />
              </el-select>
            </el-form-item>

            <el-form-item label="时间复杂度" v-if="form.domainId === 1">
              <el-input v-model="form.metadata.timeComplexity" placeholder="例如: O(n)" />
            </el-form-item>

            <el-form-item>
              <el-space direction="vertical" style="width: 100%">
                <el-button
                  type="primary"
                  @click="handleGenerate"
                  :loading="generating"
                  style="width: 100%"
                >
                  <el-icon v-if="!generating"><MagicStick /></el-icon>
                  {{ generating ? `生成中... ${generationProgress}%` : '生成题目' }}
                </el-button>
                <el-button
                  @click="handleRecommendParams"
                  :loading="recommendLoading"
                  style="width: 100%"
                >
                  智能推荐参数
                </el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 统计信息 -->
        <el-card class="mt-20">
          <template #header>
            <h3>📊 使用统计</h3>
          </template>
          <div class="stats">
            <div class="stat-item">
              <span>总生成次数:</span>
              <strong>{{ aiStatistics.totalGenerations || 0 }}</strong>
            </div>
            <div class="stat-item">
              <span>总题目数:</span>
              <strong>{{ aiStatistics.totalQuestionsGenerated || 0 }}</strong>
            </div>
            <div class="stat-item">
              <span>总 Token:</span>
              <strong>{{ aiStatistics.totalTokensUsed || 0 }}</strong>
            </div>
            <div class="stat-item">
              <span>总成本:</span>
              <strong>${{ aiStatistics.totalCost || 0 }}</strong>
            </div>
            <div class="stat-item">
              <span>通过率:</span>
              <strong>{{ ((aiStatistics.approvalRate || 0) * 100).toFixed(0) }}%</strong>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 生成结果 -->
      <el-col :span="16">
        <el-card v-loading="generating">
          <template #header>
            <div class="result-header">
              <h3>✨ 生成结果</h3>
              <el-button
                v-if="currentGeneration"
                @click="router.push('/ai/history')"
              >
                查看历史
              </el-button>
            </div>
          </template>

          <div v-if="!currentGeneration" class="empty-state">
            <el-empty description="请配置参数并点击生成按钮开始生成题目" />
          </div>

          <div v-else>
            <!-- 生成信息 -->
            <el-alert type="info" :closable="false" class="mb-20">
              <template #title>
                <div class="generation-info">
                  <span>生成时间: {{ formatDate(currentGeneration.generatedAt) }}</span>
                  <span>模型: {{ currentGeneration.generatedBy }}</span>
                  <span>Token: {{ currentGeneration.tokensUsed }}</span>
                  <span>成本: ${{ currentGeneration.cost }}</span>
                </div>
              </template>
            </el-alert>

            <!-- 生成的题目列表 -->
            <div
              v-for="(question, index) in currentGeneration.generatedQuestions"
              :key="index"
              class="question-card"
            >
              <div class="question-header">
                <h4>{{ index + 1 }}. {{ question.title }}</h4>
                <el-tag>质量得分: {{ question.qualityScore }}</el-tag>
              </div>

              <div class="question-content">{{ question.content }}</div>

              <div class="question-options">
                <div
                  v-for="opt in question.options"
                  :key="opt.id"
                  class="option-item"
                  :class="{ correct: opt.id === question.correctAnswer }"
                >
                  <strong>{{ opt.id }}.</strong> {{ opt.text }}
                </div>
              </div>

              <div class="question-explanation">
                <strong>答案解析:</strong>
                <p>{{ question.explanation }}</p>
              </div>

              <!-- 质量指标 -->
              <el-divider />
              <div class="quality-metrics">
                <h5>质量指标</h5>
                <el-row :gutter="10">
                  <el-col :span="6">
                    <div class="metric-item">
                      <span>清晰度</span>
                      <el-progress
                        :percentage="question.qualityMetrics.clarity * 10"
                        :color="getMetricColor(question.qualityMetrics.clarity)"
                      />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="metric-item">
                      <span>难度匹配</span>
                      <el-progress
                        :percentage="question.qualityMetrics.difficulty * 10"
                        :color="getMetricColor(question.qualityMetrics.difficulty)"
                      />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="metric-item">
                      <span>相关性</span>
                      <el-progress
                        :percentage="question.qualityMetrics.relevance * 10"
                        :color="getMetricColor(question.qualityMetrics.relevance)"
                      />
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="metric-item">
                      <span>完整性</span>
                      <el-progress
                        :percentage="question.qualityMetrics.completeness * 10"
                        :color="getMetricColor(question.qualityMetrics.completeness)"
                      />
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 操作按钮 -->
              <div class="question-actions">
                <el-checkbox v-model="selectedQuestions[index]">
                  选择此题目
                </el-checkbox>
              </div>
            </div>

            <!-- 批量操作 -->
            <div class="batch-actions" v-if="currentGeneration.generatedQuestions.length > 0">
              <el-space>
                <el-button
                  type="primary"
                  @click="handleBatchApprove"
                  :disabled="selectedCount === 0"
                >
                  批量通过 ({{ selectedCount }})
                </el-button>
                <el-dropdown @command="handleExport">
                  <el-button :disabled="selectedCount === 0">
                    批量导出 ({{ selectedCount }})
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="json">导出为 JSON</el-dropdown-item>
                      <el-dropdown-item command="csv">导出为 CSV</el-dropdown-item>
                      <el-dropdown-item command="markdown">导出为 Markdown</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button @click="handleSelectAll">
                  {{ allSelected ? '取消全选' : '全选' }}
                </el-button>
              </el-space>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Prompt 模板管理对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="Prompt 模板管理"
      width="70%"
      :close-on-click-modal="false"
    >
      <el-button type="primary" @click="showCreateTemplateDialog = true" class="mb-20">
        <el-icon><Plus /></el-icon>
        创建新模板
      </el-button>

      <el-table :data="promptTemplates" border>
        <el-table-column prop="name" label="模板名称" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="category" label="类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="100" />
        <el-table-column prop="successRate" label="成功率" width="100">
          <template #default="{ row }">
            {{ (row.successRate * 100).toFixed(0) }}%
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="handleUseTemplate(row)">
              使用
            </el-button>
            <el-button
              v-if="!row.isDefault"
              size="small"
              type="danger"
              text
              @click="handleDeleteTemplate(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 创建模板对话框 -->
    <el-dialog
      v-model="showCreateTemplateDialog"
      title="创建 Prompt 模板"
      width="50%"
    >
      <el-form :model="newTemplate" label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="newTemplate.name" placeholder="例如：基础选择题模板" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newTemplate.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="newTemplate.category" style="width: 100%">
            <el-option label="选择题" value="multiple_choice" />
            <el-option label="编程题" value="coding" />
            <el-option label="案例分析" value="case_study" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容">
          <el-input
            v-model="newTemplate.template"
            type="textarea"
            :rows="6"
            placeholder="使用 {{变量名}} 作为占位符，例如 {{domain}}, {{difficulty}}"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTemplate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAIStore } from '@/stores/ai'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, ArrowDown, Plus } from '@element-plus/icons-vue'
import * as aiApi from '@/api/ai'

const router = useRouter()
const store = useAIStore()

// 数据
const domains = ref([
  { id: 1, name: '计算机科学' },
  { id: 2, name: '金融学' },
  { id: 3, name: '医学' },
  { id: 4, name: '法律' },
  { id: 5, name: '管理学' }
])

const form = reactive({
  templateId: 1,
  domainId: 1,
  domainName: '计算机科学',
  categoryId: 1,
  difficulty: 'medium',
  count: 3,
  model: 'gpt-4',
  temperature: 0.7,
  metadata: {
    languageRestrictions: [],
    timeComplexity: ''
  }
})

const generating = ref(false)
const generationProgress = ref(0)
const selectedQuestions = ref({})
const promptTemplates = ref([])
const showTemplateDialog = ref(false)
const showCreateTemplateDialog = ref(false)
const costEstimate = ref(null)
const aiStatistics = ref({})
const recommendLoading = ref(false)

const newTemplate = reactive({
  name: '',
  description: '',
  category: 'multiple_choice',
  template: ''
})

const currentGeneration = computed(() => store.currentGeneration)
const selectedCount = computed(() => {
  return Object.values(selectedQuestions.value).filter(v => v).length
})

const allSelected = computed(() => {
  if (!currentGeneration.value?.generatedQuestions) return false
  const total = currentGeneration.value.generatedQuestions.length
  return selectedCount.value === total && total > 0
})

onMounted(async () => {
  await store.fetchGenerationHistory({ page: 1, limit: 10 })
  await loadPromptTemplates()
  await loadAIStatistics()
  await updateCostEstimate()
})

// 加载 Prompt 模板
async function loadPromptTemplates() {
  try {
    const response = await aiApi.getPromptTemplates()
    if (response.code === 200) {
      promptTemplates.value = response.data.items
    }
  } catch (error) {
    console.error('加载模板失败:', error)
  }
}

// 加载 AI 统计
async function loadAIStatistics() {
  try {
    const response = await aiApi.getAIStatistics()
    if (response.code === 200) {
      aiStatistics.value = response.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 更新成本预估
async function updateCostEstimate() {
  try {
    const response = await aiApi.estimateCost({
      model: form.model,
      count: form.count,
      difficulty: form.difficulty
    })
    if (response.code === 200) {
      costEstimate.value = response.data
    }
  } catch (error) {
    console.error('成本预估失败:', error)
  }
}

// 方法
function handleDomainChange() {
  const domain = domains.value.find(d => d.id === form.domainId)
  if (domain) {
    form.domainName = domain.name
  }
  updateCostEstimate()
}

function handleDifficultyChange() {
  updateCostEstimate()
}

function handleTemplateChange() {
  // 可以根据模板设置默认参数
  const template = promptTemplates.value.find(t => t.id === form.templateId)
  if (template) {
    ElMessage.info(`已选择模板: ${template.name}`)
  }
}

// 智能推荐参数
async function handleRecommendParams() {
  recommendLoading.value = true
  try {
    const response = await aiApi.recommendParams({
      domainId: form.domainId,
      difficulty: form.difficulty
    })
    if (response.code === 200) {
      const recommendations = response.data
      form.temperature = recommendations.temperature
      form.model = recommendations.model
      if (recommendations.promptTemplate) {
        form.templateId = recommendations.promptTemplate
      }
      ElMessage.success({
        message: recommendations.reasoning,
        duration: 5000
      })
      await updateCostEstimate()
    }
  } catch (error) {
    ElMessage.error('推荐失败')
  } finally {
    recommendLoading.value = false
  }
}

async function handleGenerate() {
  generating.value = true
  generationProgress.value = 0

  // 模拟进度条
  const progressInterval = setInterval(() => {
    if (generationProgress.value < 90) {
      generationProgress.value += Math.random() * 10
    }
  }, 200)

  try {
    const response = await store.generateQuestions(form)
    generationProgress.value = 100

    if (response.code === 200) {
      ElMessage.success('题目生成成功')
      // 重置选择
      selectedQuestions.value = {}
      // 重新加载统计
      await loadAIStatistics()
    } else {
      ElMessage.error(response.message || '生成失败')
    }
  } catch (error) {
    ElMessage.error('生成失败: ' + error.message)
  } finally {
    clearInterval(progressInterval)
    generating.value = false
    generationProgress.value = 0
  }
}

async function handleBatchApprove() {
  const approvedIndices = []
  Object.keys(selectedQuestions.value).forEach(index => {
    if (selectedQuestions.value[index]) {
      approvedIndices.push(parseInt(index))
    }
  })

  if (approvedIndices.length === 0) {
    ElMessage.warning('请至少选择一道题目')
    return
  }

  try {
    const response = await store.reviewGeneratedQuestions(
      currentGeneration.value.id,
      { approvedIndices, rejectedIndices: [] }
    )
    if (response.code === 200) {
      ElMessage.success(`成功通过 ${approvedIndices.length} 道题目`)
      selectedQuestions.value = {}
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 批量导出
async function handleExport(format) {
  const selectedIndices = []
  Object.keys(selectedQuestions.value).forEach(index => {
    if (selectedQuestions.value[index]) {
      selectedIndices.push(parseInt(index))
    }
  })

  const questionsToExport = currentGeneration.value.generatedQuestions.filter((_, index) =>
    selectedIndices.includes(index)
  )

  try {
    const response = await aiApi.exportQuestions({
      format,
      questions: questionsToExport
    })

    if (response.code === 200) {
      // 创建下载链接
      const blob = new Blob([response.data.data], {
        type: format === 'json' ? 'application/json' : 'text/plain'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = response.data.filename
      link.click()
      window.URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 全选/取消全选
function handleSelectAll() {
  if (allSelected.value) {
    selectedQuestions.value = {}
  } else {
    currentGeneration.value.generatedQuestions.forEach((_, index) => {
      selectedQuestions.value[index] = true
    })
  }
}

// 创建模板
async function handleCreateTemplate() {
  try {
    const response = await aiApi.createPromptTemplate(newTemplate)
    if (response.code === 200) {
      ElMessage.success('模板创建成功')
      showCreateTemplateDialog.value = false
      await loadPromptTemplates()
      // 重置表单
      Object.assign(newTemplate, {
        name: '',
        description: '',
        category: 'multiple_choice',
        template: ''
      })
    }
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

// 使用模板
function handleUseTemplate(template) {
  form.templateId = template.id
  showTemplateDialog.value = false
  ElMessage.success(`已应用模板: ${template.name}`)
}

// 删除模板
async function handleDeleteTemplate(id) {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await aiApi.deletePromptTemplate(id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadPromptTemplates()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function getMetricColor(value) {
  if (value >= 8) return '#67c23a'
  if (value >= 6) return '#e6a23c'
  return '#f56c6c'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.generate-questions-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.cost-estimate {
  margin: 15px 0;
}

.estimate-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
}

.stats {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h3 {
  margin: 0;
}

.empty-state {
  padding: 60px 0;
}

.generation-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.question-card {
  padding: 20px;
  margin-bottom: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 2px solid #e4e7ed;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-header h4 {
  margin: 0;
  font-size: 18px;
}

.question-content {
  margin-bottom: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.question-options {
  margin-bottom: 15px;
}

.option-item {
  padding: 10px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.option-item.correct {
  background: #f0f9ff;
  border-color: #409eff;
}

.question-explanation {
  padding: 15px;
  background: white;
  border-radius: 4px;
}

.question-explanation p {
  margin: 5px 0 0 0;
  line-height: 1.6;
}

.quality-metrics h5 {
  margin: 0 0 15px 0;
}

.metric-item {
  text-align: center;
}

.metric-item span {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
}

.question-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.batch-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #dcdfe6;
  text-align: center;
}
</style>
