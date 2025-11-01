<template>
  <el-dialog v-model="visible" title="批量操作 - Batch Operations" width="50%" @close="reset">
    <div class="batch-operation-content">
      <!-- Operation Selection -->
      <div class="operation-selection">
        <span class="section-label">选择操作:</span>
        <el-radio-group v-model="selectedOperation" size="large">
          <el-radio label="status">更新状态</el-radio>
          <el-radio label="tags">标签管理</el-radio>
          <el-radio label="delete">删除记录</el-radio>
          <el-radio label="export">导出数据</el-radio>
        </el-radio-group>
      </div>

      <!-- Operation Form -->
      <div class="operation-form">
        <!-- Status Update -->
        <div v-if="selectedOperation === 'status'" class="form-section">
          <label>选择目标状态:</label>
          <el-select v-model="operationData.status" placeholder="选择状态">
            <el-option label="已掌握" value="mastered" />
            <el-option label="复习中" value="reviewing" />
            <el-option label="未复习" value="unreveiwed" />
          </el-select>
          <p class="info-text">将为 {{ selectedRecordIds.length }} 个错题更新状态</p>
        </div>

        <!-- Tags Management -->
        <div v-else-if="selectedOperation === 'tags'" class="form-section">
          <div class="tag-selection">
            <label>选择操作类型:</label>
            <el-radio-group v-model="operationData.tagAction">
              <el-radio label="add">添加标签</el-radio>
              <el-radio label="remove">移除标签</el-radio>
            </el-radio-group>
          </div>

          <label>选择标签:</label>
          <el-select
            v-model="operationData.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或创建标签"
          >
            <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
          </el-select>

          <p class="info-text">
            将为 {{ selectedRecordIds.length }} 个错题
            {{ operationData.tagAction === 'add' ? '添加' : '移除' }} {{ operationData.tags.length }} 个标签
          </p>
        </div>

        <!-- Delete Records -->
        <div v-else-if="selectedOperation === 'delete'" class="form-section">
          <el-alert
            title="警告"
            type="warning"
            description="此操作将永久删除选中的错题记录，无法撤销。请谨慎操作。"
            :closable="false"
            class="delete-warning"
          />

          <label>确认删除:</label>
          <el-checkbox v-model="operationData.confirmDelete" label="我确认要删除这些记录" />

          <p class="info-text danger">将永久删除 {{ selectedRecordIds.length }} 个错题</p>
        </div>

        <!-- Export Data -->
        <div v-else-if="selectedOperation === 'export'" class="form-section">
          <label>选择导出格式:</label>
          <el-radio-group v-model="operationData.exportFormat">
            <el-radio label="pdf">PDF</el-radio>
            <el-radio label="excel">Excel</el-radio>
            <el-radio label="csv">CSV</el-radio>
            <el-radio label="json">JSON</el-radio>
            <el-radio label="markdown">Markdown</el-radio>
          </el-radio-group>

          <label>选择导出内容:</label>
          <el-checkbox-group v-model="operationData.exportFields">
            <el-checkbox label="questionTitle">题目</el-checkbox>
            <el-checkbox label="questionContent">题目内容</el-checkbox>
            <el-checkbox label="source">来源</el-checkbox>
            <el-checkbox label="difficulty">难度</el-checkbox>
            <el-checkbox label="status">状态</el-checkbox>
            <el-checkbox label="wrongCount">错误次数</el-checkbox>
            <el-checkbox label="correctCount">正确次数</el-checkbox>
            <el-checkbox label="userNotes">用户笔记</el-checkbox>
            <el-checkbox label="userTags">标签</el-checkbox>
          </el-checkbox-group>

          <p class="info-text">将导出 {{ selectedRecordIds.length }} 个错题为 {{ formatExportFormat }}</p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="isProcessing" class="progress-section">
        <label>处理进度:</label>
        <el-progress :percentage="operationProgress" />
        <p class="progress-text">正在处理: {{ processedCount }} / {{ selectedRecordIds.length }}</p>
      </div>

      <!-- Status Messages -->
      <div v-if="statusMessage" :class="['status-message', statusMessage.type]">
        {{ statusMessage.text }}
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        @click="executeOperation"
        :loading="isProcessing"
        :disabled="!isOperationValid"
      >
        执行操作
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import messageBatchOperationService from '@/services/messageBatchOperationService'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'

const props = defineProps({
  modelValue: Boolean,
  selectedRecordIds: {
    type: Array,
    default: () => []
  },
  availableTags: {
    type: Array,
    default: () => ['重要', '困难', '高频', '易错', '需要多次复习', '新错题', '重点关注']
  }
})

const emit = defineEmits(['update:modelValue', 'operation-complete'])

// State
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedOperation = ref('status')
const operationData = ref({
  status: 'mastered',
  tagAction: 'add',
  tags: [],
  confirmDelete: false,
  exportFormat: 'csv',
  exportFields: ['questionTitle', 'source', 'difficulty', 'status', 'wrongCount', 'correctCount']
})

const store = useWrongAnswersStore()

const isProcessing = ref(false)
const operationProgress = ref(0)
const processedCount = ref(0)
const statusMessage = ref(null)

// Computed
const isOperationValid = computed(() => {
  switch (selectedOperation.value) {
    case 'status':
      return !!operationData.value.status
    case 'tags':
      return operationData.value.tags.length > 0
    case 'delete':
      return operationData.value.confirmDelete
    case 'export':
      return operationData.value.exportFields.length > 0
    default:
      return false
  }
})

const formatExportFormat = computed(() => {
  const formats = {
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
    json: 'JSON',
    markdown: 'Markdown'
  }
  return formats[operationData.value.exportFormat] || 'Unknown'
})

// Methods
const executeOperation = async () => {
  try {
    await ElMessageBox.confirm(
      `确认执行此操作吗？将影响 ${props.selectedRecordIds.length} 个错题。`,
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isProcessing.value = true
    operationProgress.value = 0
    processedCount.value = 0
    statusMessage.value = null

    switch (selectedOperation.value) {
      case 'status':
        await performStatusUpdate()
        break
      case 'tags':
        await performTagsOperation()
        break
      case 'delete':
        await performDelete()
        break
      case 'export':
        await performExport()
        break
    }

    statusMessage.value = {
      type: 'success',
      text: '操作完成！'
    }

    emit('operation-complete', {
      operation: selectedOperation.value,
      recordCount: props.selectedRecordIds.length
    })

    setTimeout(() => {
      visible.value = false
    }, 1500)
  } catch (error) {
    if (error.message !== 'cancel') {
      statusMessage.value = {
        type: 'error',
        text: error.message || '操作失败'
      }
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    isProcessing.value = false
  }
}

const performStatusUpdate = async () => {
  try {
    await messageBatchOperationService.batchUpdateStatus(
      props.selectedRecordIds,
      operationData.value.status
    )

    operationProgress.value = 100
    processedCount.value = props.selectedRecordIds.length
  } catch (error) {
    throw new Error('批量更新状态失败: ' + error.message)
  }
}

const performTagsOperation = async () => {
  try {
    const method =
      operationData.value.tagAction === 'add'
        ? messageBatchOperationService.batchAddTags
        : messageBatchOperationService.batchRemoveTags

    await method.call(
      messageBatchOperationService,
      props.selectedRecordIds,
      operationData.value.tags
    )

    operationProgress.value = 100
    processedCount.value = props.selectedRecordIds.length
  } catch (error) {
    throw new Error('批量标签操作失败: ' + error.message)
  }
}

const performDelete = async () => {
  try {
    await messageBatchOperationService.batchDelete(props.selectedRecordIds)

    operationProgress.value = 100
    processedCount.value = props.selectedRecordIds.length
  } catch (error) {
    throw new Error('批量删除失败: ' + error.message)
  }
}

const performExport = async () => {
  try {
    const format = operationData.value.exportFormat
    let blob

    if (format === 'pdf') {
      // client-side PDF export with HTML template for nicer layout
      const storeRecords = store.wrongAnswers.filter(r => props.selectedRecordIds.includes(r.id))
      await messageBatchOperationService.exportWrongAnswersToPDFHtmlLocal(
        storeRecords,
        `wrong-answers-${new Date().toISOString().slice(0,10)}.pdf`,
        {
          fields: operationData.value.exportFields,
          headerText: '错题导出',
          footerText: 'Generated by Interview System'
        }
      )
    } else if (format === 'excel') {
      blob = await messageBatchOperationService.batchExportExcel(props.selectedRecordIds)
    } else if (format === 'csv') {
      blob = await messageBatchOperationService.batchExportCSV(props.selectedRecordIds)
    } else if (format === 'json') {
      const storeRecords = store.wrongAnswers.filter(r => props.selectedRecordIds.includes(r.id))
      await messageBatchOperationService.exportToJSONLocal(
        storeRecords,
        `wrong-answers-${new Date().toISOString().slice(0,10)}.json`,
        { fields: operationData.value.exportFields }
      )
    } else if (format === 'markdown') {
      const storeRecords = store.wrongAnswers.filter(r => props.selectedRecordIds.includes(r.id))
      await messageBatchOperationService.exportToMarkdownLocal(
        storeRecords,
        `wrong-answers-${new Date().toISOString().slice(0,10)}.md`,
        { fields: operationData.value.exportFields }
      )
    }

    if (blob) {
      const filename = `wrong-answers-export-${new Date().toISOString().split('T')[0]}.${format}`
      messageBatchOperationService.downloadFile(blob, filename)
    }

    operationProgress.value = 100
    processedCount.value = props.selectedRecordIds.length
  } catch (error) {
    throw new Error('导出失败: ' + error.message)
  }
}

const reset = () => {
  selectedOperation.value = 'status'
  operationData.value = {
    status: 'mastered',
    tagAction: 'add',
    tags: [],
    confirmDelete: false,
    exportFormat: 'csv',
    exportFields: ['questionTitle', 'source', 'difficulty', 'status', 'wrongCount', 'correctCount']
  }
  isProcessing.value = false
  operationProgress.value = 0
  processedCount.value = 0
  statusMessage.value = null
}
</script>

<style scoped lang="css">
.batch-operation-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
}

.operation-selection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-weight: 500;
  color: #606266;
}

.operation-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.form-section label {
  font-weight: 500;
  color: #606266;
}

.form-section :deep(.el-select),
.form-section :deep(.el-checkbox-group),
.form-section :deep(.el-radio-group) {
  width: 100%;
}

.tag-selection {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
  padding: 8px;
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
  border-radius: 2px;
}

.info-text.danger {
  background: #fef0f0;
  border-left-color: #f56c6c;
  color: #f56c6c;
}

.delete-warning {
  margin-bottom: 15px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.progress-section label {
  font-weight: 500;
  color: #606266;
}

.progress-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.status-message {
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.status-message.success {
  background: #f0f9ff;
  color: #67c23a;
  border: 1px solid #67c23a;
}

.status-message.error {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #f56c6c;
}
</style>
