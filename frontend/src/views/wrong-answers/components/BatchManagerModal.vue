<template>
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑复习集' : '添加到复习集'"
    width="480px"
    class="batch-modal wa-scope rounded-2xl overflow-hidden"
    :show-close="false"
    append-to-body
  >
    <template #header="{ titleId, titleClass }">
      <div class="wa-flex wa-items-center wa-justify-between wa-px-1 wa-py-1">
        <h4 :id="titleId" :class="titleClass" class="wa-text-lg wa-font-bold wa-text-gray-900 wa-flex wa-items-center wa-gap-2">
          <FolderPlus class="wa-text-indigo-600" :size="20" />
          {{ isEditing ? '管理复习集' : '添加到复习集' }}
        </h4>
        <button class="wa-text-gray-400 wa-hover-text-gray-600 wa-transition-colors" @click="handleClose">
          <X :size="20" />
        </button>
      </div>
    </template>

    <div class="wa-py-2">
      <!-- Create New Section -->
      <div v-if="!editingBatchId" class="wa-mb-6">
        <label class="wa-text-xs wa-font-bold wa-text-gray-500 uppercase tracking-wider wa-mb-2 wa-block">新建复习集</label>
        <div class="wa-relative wa-group">
          <div class="wa-absolute wa-inset-0 wa-left-0 wa-pl-3 wa-flex wa-items-center wa-pointer-events-none">
            <Plus class="wa-text-gray-400" :size="16" />
          </div>
          <input
            v-model="newBatchName"
            type="text"
            placeholder="例如：考前冲刺、React 专项..."
            class="wa-block wa-w-full wa-pl-9 wa-pr-12 wa-py-2-5 wa-border wa-rounded-xl wa-text-sm wa-transition-all focus:wa-outline-none focus:wa-ring-2"
            :class="newBatchName.length > 20 ? 'wa-border-rose-200 focus:wa-border-rose-500' : 'wa-border-gray-200 focus:wa-border-indigo-500'"
            @input="selectedBatchId = null"
          />
          <span 
            v-if="newBatchName.length > 20" 
            class="wa-absolute wa-right-2 wa-top-1/2 wa-transform -translate-y-1/2 wa-text-xs wa-text-rose-500 wa-font-medium wa-bg-rose-50 wa-px-2 wa-py-1 wa-rounded"
          >
            名称过长
          </span>
        </div>
      </div>

      <div v-if="!editingBatchId" class="wa-flex wa-items-center wa-justify-center wa-gap-4 wa-mb-6 wa-opacity-50">
        <div class="wa-h-px wa-bg-gray-200 wa-flex-1"></div>
        <span class="wa-text-xs wa-font-medium wa-text-gray-400">或选择已有</span>
        <div class="wa-h-px wa-bg-gray-200 wa-flex-1"></div>
      </div>

      <!-- Existing List -->
      <div>
        <label class="wa-text-xs wa-font-bold wa-text-gray-500 uppercase tracking-wider wa-mb-2 wa-block">
          {{ editingBatchId ? '编辑名称' : '已有复习集' }}
        </label>
          
        <div v-if="batches.length === 0" class="wa-text-center wa-py-6 wa-border wa-border-dashed wa-border-gray-200 wa-rounded-xl wa-bg-gray-50">
          <p class="wa-text-sm wa-text-gray-400">暂无复习集</p>
        </div>

        <div v-else class="wa-gap-2 wa-max-h-64 wa-overflow-y-auto wa-pr-1 custom-scrollbar wa-flex wa-flex-col">
          <div 
            v-for="batch in batches" 
            :key="batch.id"
            class="wa-group wa-p-3 wa-rounded-xl wa-border wa-cursor-pointer wa-flex wa-items-center wa-justify-between wa-transition-all"
            :class="getBatchClass(batch.id)"
            @click="handleSelectBatch(batch.id)"
          >
            <!-- Edit Mode -->
            <div v-if="editingBatchId === batch.id" class="wa-flex-1 wa-flex wa-items-center wa-gap-2" @click.stop>
              <input 
                ref="editInputRef" 
                v-model="editingName"
                class="wa-flex-1 wa-py-1-5 wa-px-3 wa-border wa-border-indigo-200 wa-rounded-lg wa-text-sm focus:wa-outline-none focus:wa-ring-2 focus:wa-ring-indigo-500/20 wa-bg-white" 
                autoFocus 
                @keyup.enter="saveEdit"
              />
              <button class="wa-p-1 wa-bg-emerald-50 wa-text-emerald-600 wa-hover-bg-emerald-100 wa-rounded-lg wa-transition-colors" @click="saveEdit">
                <Check :size="16" />
              </button>
              <button class="wa-p-1 wa-bg-gray-50 wa-text-gray-400 wa-hover-bg-gray-100 wa-rounded-lg wa-transition-colors" @click="cancelEdit">
                <X :size="16" />
              </button>
            </div>

            <!-- Normal Mode -->
            <div v-else class="wa-flex wa-items-center wa-gap-3 wa-flex-1 wa-min-w-0">
              <div class="wa-p-2 wa-rounded-lg wa-transition-colors" :class="selectedBatchId === batch.id ? 'wa-bg-indigo-100 wa-text-indigo-700' : 'wa-bg-gray-100 wa-text-gray-500 wa-group-hover-bg-indigo-50 wa-group-hover-text-indigo-600'">
                <Folder :size="16" />
              </div>
              <div class="wa-flex wa-flex-col wa-truncate">
                <span class="wa-text-sm wa-font-medium wa-truncate" :class="selectedBatchId === batch.id ? 'wa-text-indigo-700' : 'wa-text-gray-700'">{{ batch.name }}</span>
                <span class="wa-text-xs wa-text-gray-400">{{ batch.mistakeIds.length }} 题</span>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="!editingBatchId" class="wa-flex wa-items-center wa-gap-1">
              <!-- Selection Indicator -->
              <div v-if="selectedBatchId === batch.id" class="wa-text-indigo-600 wa-mr-2">
                <CheckCircle2 :size="18" />
              </div>
                   
              <!-- Hover Actions -->
              <div class="wa-opacity-0 wa-group-hover-opacity-100 wa-transition-all wa-flex wa-items-center wa-gap-1" :class="{ 'wa-opacity-100': selectedBatchId === batch.id }">
                <button class="wa-p-1 wa-text-gray-400 wa-hover-text-indigo-600 wa-hover-bg-indigo-50 wa-rounded wa-transition-colors" @click.stop="startEdit(batch)">
                  <Pencil :size="14" />
                </button>
                <button class="wa-p-1 wa-text-gray-400 wa-hover-text-rose-600 wa-hover-bg-rose-50 wa-rounded wa-transition-colors" @click.stop="deleteBatch(batch.id)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="wa-flex wa-justify-end wa-gap-3">
        <button 
          class="wa-px-4 wa-py-2 wa-text-sm wa-font-medium wa-text-gray-600 wa-hover-bg-gray-100 wa-rounded-lg wa-transition-colors" 
          @click="handleClose"
        >
          取消
        </button>
        <button 
          class="wa-px-5 wa-py-2 wa-text-sm wa-font-bold wa-text-white wa-rounded-lg wa-shadow-sm wa-transition-all wa-flex wa-items-center wa-gap-2"
          :class="canSubmit ? 'wa-bg-indigo-600 wa-hover-bg-indigo-700 wa-hover-shadow-lg' : 'wa-bg-indigo-100 wa-cursor-not-allowed'"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <Check :size="16" />
          {{ submitButtonText }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  FolderPlus, X, Plus, Check, Folder, 
  CheckCircle2, Pencil, Trash2 
} from 'lucide-vue-next'
import { useWrongAnswersStore } from '@/stores/wrongAnswers'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  selectedIds: {
    type: Set,
    default: () => new Set()
  }
})

const emit = defineEmits(['update:modelValue', 'success'])
const store = useWrongAnswersStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const newBatchName = ref('')
const selectedBatchId = ref(null)
const editingBatchId = ref(null)
const editingName = ref('')

const batches = computed(() => store.reviewBatches || [])

const isEditing = computed(() => !!editingBatchId.value)

const canSubmit = computed(() => {
  if (newBatchName.value.trim()) return true
  if (selectedBatchId.value) return true
  return false
})

const submitButtonText = computed(() => {
  if (newBatchName.value.trim()) return '创建并添加'
  return '确认添加'
})

// Methods
const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  newBatchName.value = ''
  selectedBatchId.value = null
  editingBatchId.value = null
  editingName.value = ''
}

const getBatchClass = (id) => {
  if (selectedBatchId.value === id) return 'wa-border-indigo-500 wa-bg-indigo-50'
  return 'wa-border-gray-200 wa-hover-bg-gray-50'
}

const handleSelectBatch = (id) => {
  if (editingBatchId.value) return
  selectedBatchId.value = id
  newBatchName.value = ''
}

const startEdit = (batch) => {
  editingBatchId.value = batch.id
  editingName.value = batch.name
}

const cancelEdit = () => {
  editingBatchId.value = null
  editingName.value = ''
}

const saveEdit = () => {
  if (!editingName.value.trim()) return
  store.updateBatch(editingBatchId.value, { name: editingName.value })
  editingBatchId.value = null
}

const deleteBatch = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除此复习集？(不会删除其中的错题)', '提示', { type: 'warning' })
    store.deleteBatch(id)
    if (selectedBatchId.value === id) selectedBatchId.value = null
  } catch (e) {
    // cancel
  }
}

const handleSubmit = () => {
  const ids = Array.from(props.selectedIds)
  
  if (newBatchName.value.trim()) {
    const newBatch = store.createBatch(newBatchName.value, ids)
    ElMessage.success(`已创建 "${newBatch.name}" 并添加了 ${ids.length} 个题目`)
  } else if (selectedBatchId.value) {
    store.addMistakesToBatch(selectedBatchId.value, ids)
    ElMessage.success(`已添加到选中复习集`)
  }

  emit('success')
  handleClose()
}
</script>

<style lang="scss" scoped>
@import "@/styles/wrong-answers.scss";

// Deep overrides for Element Dialog to match design
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid #f1f5f9;
  padding: 1rem 1.5rem;
}

:deep(.el-dialog__body) {
  padding: 1.5rem;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #f1f5f9;
  padding: 1rem 1.5rem;
}
</style>
