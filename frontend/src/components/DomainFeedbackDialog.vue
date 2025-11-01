<template>
  <el-dialog
    v-model="visible"
    title="📢 问题反馈"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="feedback-form">
      <!-- 反馈类型 -->
      <div class="form-group">
        <label class="form-label">反馈类型 <span class="required">*</span></label>
        <el-select v-model="form.type" placeholder="请选择反馈类型" clearable>
          <el-option label="发现错误" value="error" />
          <el-option label="内容补充" value="addition" />
          <el-option label="功能建议" value="suggestion" />
          <el-option label="其他反馈" value="other" />
        </el-select>
      </div>

      <!-- 关键信息 -->
      <div class="form-group">
        <label class="form-label">相关领域 <span class="required">*</span></label>
        <el-input
          v-model="form.domain"
          placeholder="例如：计算机科学与技术"
          clearable
        />
      </div>

      <!-- 具体描述 -->
      <div class="form-group">
        <label class="form-label">具体描述 <span class="required">*</span></label>
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="6"
          placeholder="请详细描述你的问题或建议..."
          maxlength="1000"
          show-word-limit
          clearable
        />
      </div>

      <!-- 联系方式 -->
      <div class="form-group">
        <label class="form-label">联系方式（可选）</label>
        <el-input
          v-model="form.contact"
          placeholder="邮箱或微信，便于我们后续跟进"
          clearable
        />
      </div>

      <!-- 温馨提示 -->
      <div class="tips">
        <el-icon class="tips-icon"><InfoFilled /></el-icon>
        <span>
          感谢你的反馈！我们会认真审查每一条意见，不断改进平台。
        </span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!isFormValid"
          @click="submitFeedback"
        >
          提交反馈
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  domainName: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const submitting = ref(false)

const form = ref({
  type: '',
  domain: props.domainName || '',
  description: '',
  contact: ''
})

/**
 * 表单是否有效
 */
const isFormValid = computed(() => {
  return form.value.type && form.value.domain && form.value.description
})

/**
 * 重置表单
 */
function resetForm() {
  form.value = {
    type: '',
    domain: props.domainName || '',
    description: '',
    contact: ''
  }
}

/**
 * 提交反馈
 */
async function submitFeedback() {
  if (!isFormValid.value) {
    ElMessage.warning('请填写所有必填项')
    return
  }

  submitting.value = true

  try {
    // 这里应该调用后端API来保存反馈
    // const response = await api.post('/feedback', form.value)

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('感谢你的反馈！')
    emit('submit', form.value)
    resetForm()
    visible.value = false
  } catch (error) {
    ElMessage.error('提交失败，请稍后重试')
    console.error('Submit feedback error:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.required {
  color: #f87171;
}

.feedback-form :deep(.el-input),
.feedback-form :deep(.el-select),
.feedback-form :deep(.el-textarea) {
  width: 100%;
}

.feedback-form :deep(.el-textarea__inner) {
  resize: vertical;
  min-height: 120px;
}

.tips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  font-size: 13px;
  color: #475569;
}

.tips-icon {
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 2px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  min-width: 100px;
}
</style>
