<template>
  <el-dialog
    v-model="isVisible"
    title="🏷️ 标签管理"
    width="90%"
    max-width="500px"
    @close="handleClose"
  >
    <!-- 创建新标签 -->
    <div class="create-section">
      <h3 class="section-title">创建新标签</h3>
      <div class="create-form">
        <el-input
          v-model="newTag.name"
          placeholder="标签名称"
          clearable
          @keyup.enter="handleCreateTag"
        />
        <div class="color-picker-wrapper">
          <el-color-picker
            v-model="newTag.color"
            show-alpha
            color-format="hex"
          />
          <span class="color-preview" :style="{ backgroundColor: newTag.color }"></span>
        </div>
        <el-button
          type="primary"
          @click="handleCreateTag"
          :loading="isCreating"
        >
          创建
        </el-button>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="divider" />

    <!-- 标签列表 -->
    <div class="tags-list-section">
      <h3 class="section-title">
        标签列表
        <span class="tag-count">({{ tags.length }})</span>
      </h3>

      <div v-if="tags.length > 0" class="tags-list">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="tag-item"
        >
          <!-- 标签预览 -->
          <div class="tag-preview">
            <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
            <span class="tag-name">{{ tag.name }}</span>
          </div>

          <!-- 使用计数 -->
          <div class="tag-usage">
            <span class="usage-count">{{ getTagUsage(tag.id) }}</span>
            <span class="usage-label">条消息</span>
          </div>

          <!-- 编辑按钮 -->
          <el-button
            size="small"
            type="primary"
            text
            @click="handleEditTag(tag)"
          >
            编辑
          </el-button>

          <!-- 删除按钮 -->
          <el-button
            size="small"
            type="danger"
            text
            @click="handleDeleteTag(tag.id)"
            :loading="deletingTagId === tag.id"
          >
            删除
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else
        description="暂无标签"
        :image-size="80"
      />
    </div>

    <!-- 编辑标签对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑标签"
      width="90%"
      max-width="400px"
    >
      <div v-if="editingTag" class="edit-form">
        <el-form label-width="80px">
          <el-form-item label="标签名称">
            <el-input
              v-model="editingTag.name"
              placeholder="输入新的标签名称"
            />
          </el-form-item>
          <el-form-item label="标签颜色">
            <div class="color-edit-wrapper">
              <el-color-picker
                v-model="editingTag.color"
                show-alpha
                color-format="hex"
              />
              <span class="color-preview" :style="{ backgroundColor: editingTag.color }"></span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">
            取消
          </el-button>
          <el-button
            type="primary"
            @click="handleSaveEdit"
            :loading="isSavingEdit"
          >
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  tags: {
    type: Array,
    default: () => []
  },
  tagStatistics: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'create-tag', 'update-tag', 'delete-tag'])

// UI状态
const newTag = ref({
  name: '',
  color: '#409EFF'
})
const editingTag = ref(null)
const isCreating = ref(false)
const isSavingEdit = ref(false)
const showEditDialog = ref(false)
const deletingTagId = ref(null)

// 同步visible属性
const isVisible = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) {
      emit('close')
    }
  }
})

// 监听对话框关闭，重置表单
watch(() => isVisible.value, (val) => {
  if (!val) {
    resetForm()
    showEditDialog.value = false
  }
})

/**
 * 重置表单
 */
function resetForm() {
  newTag.value = {
    name: '',
    color: '#409EFF'
  }
  editingTag.value = null
}

/**
 * 获取标签使用次数
 */
function getTagUsage(tagId) {
  return props.tagStatistics ? (props.tagStatistics[tagId] || 0) : 0
}

/**
 * 创建新标签
 */
async function handleCreateTag() {
  // 验证输入
  if (!newTag.value.name.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }

  if (newTag.value.name.length > 20) {
    ElMessage.warning('标签名称不能超过 20 个字符')
    return
  }

  // 检查名称是否重复
  if (props.tags.some(t => t.name === newTag.value.name.trim())) {
    ElMessage.warning('标签名称已存在')
    return
  }

  // 检查标签数量限制
  if (props.tags.length >= 20) {
    ElMessage.warning('最多可创建 20 个标签')
    return
  }

  isCreating.value = true
  try {
    // 延迟以显示加载状态
    await new Promise(resolve => setTimeout(resolve, 200))

    emit('create-tag', newTag.value.name.trim(), newTag.value.color)
    ElMessage.success('标签已创建')
    resetForm()
  } catch (error) {
    console.error('创建标签失败:', error)
    ElMessage.error('创建失败，请稍后重试')
  } finally {
    isCreating.value = false
  }
}

/**
 * 编辑标签
 */
function handleEditTag(tag) {
  editingTag.value = {
    id: tag.id,
    name: tag.name,
    color: tag.color
  }
  showEditDialog.value = true
}

/**
 * 保存标签编辑
 */
async function handleSaveEdit() {
  if (!editingTag.value) return

  // 验证输入
  if (!editingTag.value.name.trim()) {
    ElMessage.warning('标签名称不能为空')
    return
  }

  if (editingTag.value.name.length > 20) {
    ElMessage.warning('标签名称不能超过 20 个字符')
    return
  }

  // 检查名称是否重复（不包括当前标签）
  const isDuplicate = props.tags.some(
    t => t.id !== editingTag.value.id && t.name === editingTag.value.name.trim()
  )
  if (isDuplicate) {
    ElMessage.warning('标签名称已存在')
    return
  }

  isSavingEdit.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 200))

    emit('update-tag', editingTag.value.id, editingTag.value.name.trim(), editingTag.value.color)
    ElMessage.success('标签已更新')
    showEditDialog.value = false
  } catch (error) {
    console.error('更新标签失败:', error)
    ElMessage.error('更新失败，请稍后重试')
  } finally {
    isSavingEdit.value = false
  }
}

/**
 * 删除标签
 */
async function handleDeleteTag(tagId) {
  const tag = props.tags.find(t => t.id === tagId)
  if (!tag) return

  const usageCount = getTagUsage(tagId)
  const message = usageCount > 0
    ? `确定要删除此标签吗？(${usageCount} 条消息的标签将被移除)`
    : '确定要删除此标签吗？'

  try {
    await ElMessageBox.confirm(
      message,
      '提示',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    deletingTagId.value = tagId
    emit('delete-tag', tagId)
    ElMessage.success('标签已删除')
  } catch (error) {
    // 用户取消操作
  } finally {
    deletingTagId.value = null
  }
}

/**
 * 关闭对话框
 */
function handleClose() {
  isVisible.value = false
}
</script>

<style scoped>
.create-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.tag-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  margin-left: 4px;
}

.create-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.create-form :deep(.el-input) {
  flex: 1;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-wrapper :deep(.el-color-picker__trigger) {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.divider {
  height: 1px;
  background: #ebeef5;
  margin: 16px 0;
}

.tags-list-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.tags-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: all 0.2s;
}

.tag-item:hover {
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.tag-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.tag-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tag-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  word-break: break-all;
}

.tag-usage {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 12px;
  flex-shrink: 0;
  font-size: 12px;
}

.usage-count {
  color: #409eff;
  font-weight: 500;
}

.usage-label {
  color: #909399;
}

.tag-item :deep(.el-button) {
  font-size: 12px;
}

/* 滚动条样式 */
.tags-list-section::-webkit-scrollbar {
  width: 6px;
}

.tags-list-section::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.tags-list-section::-webkit-scrollbar-thumb {
  background: #d3d4d6;
  border-radius: 3px;
}

.tags-list-section::-webkit-scrollbar-thumb:hover {
  background: #a6a7ab;
}

.edit-form {
  padding: 12px 0;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.color-edit-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-edit-wrapper :deep(.el-color-picker__trigger) {
  width: 50px;
  height: 40px;
  border-radius: 4px;
}

.color-edit-wrapper .color-preview {
  width: 50px;
  height: 40px;
  border-radius: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  font-size: 12px;
}
</style>
