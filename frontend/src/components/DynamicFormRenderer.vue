<template>
  <div class="dynamic-form-renderer">
    <div v-for="field in fields" :key="field.name" class="form-field">
      <el-form-item :label="field.label" :required="field.required">
        <!-- 单选下拉 -->
        <el-select
          v-if="field.type === 'select'"
          v-model="formData[field.name]"
          :placeholder="`请选择${field.label}`"
          clearable
        >
          <el-option
            v-for="option in field.options"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>

        <!-- 多选下拉 -->
        <el-select
          v-else-if="field.type === 'multi-select'"
          v-model="formData[field.name]"
          :placeholder="`请选择${field.label}`"
          multiple
          clearable
        >
          <el-option
            v-for="option in field.options"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>

        <!-- 标签输入 -->
        <div v-else-if="field.type === 'tags'" class="tags-input">
          <el-tag
            v-for="tag in (formData[field.name] || [])"
            :key="tag"
            closable
            @close="removeTag(field.name, tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-model="tagInputs[field.name]"
            size="small"
            :placeholder="field.placeholder || `输入${field.label}后按回车`"
            class="tag-input-field"
            @keyup.enter="addTag(field.name)"
          />
        </div>

        <!-- 文本输入 -->
        <el-input
          v-else-if="field.type === 'text'"
          v-model="formData[field.name]"
          :placeholder="field.placeholder || `请输入${field.label}`"
        />

        <!-- 数字输入 -->
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="formData[field.name]"
          :min="field.min"
          :max="field.max"
          :placeholder="field.placeholder || `请输入${field.label}`"
        />

        <!-- 日期选择 -->
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="formData[field.name]"
          type="date"
          :placeholder="`请选择${field.label}`"
        />

        <!-- 开关 -->
        <el-switch
          v-else-if="field.type === 'switch'"
          v-model="formData[field.name]"
        />

        <!-- 富文本 -->
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="formData[field.name]"
          type="textarea"
          :rows="field.rows || 4"
          :placeholder="field.placeholder || `请输入${field.label}`"
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  fields: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const formData = ref({ ...props.modelValue })
const tagInputs = ref({})

// 初始化标签字段
props.fields.forEach(field => {
  if (field.type === 'tags' && !formData.value[field.name]) {
    formData.value[field.name] = []
  }
})

watch(formData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  formData.value = { ...newVal }
}, { deep: true })

function addTag(fieldName) {
  const input = tagInputs.value[fieldName]
  if (input && input.trim()) {
    if (!formData.value[fieldName]) {
      formData.value[fieldName] = []
    }
    if (!formData.value[fieldName].includes(input.trim())) {
      formData.value[fieldName].push(input.trim())
    }
    tagInputs.value[fieldName] = ''
  }
}

function removeTag(fieldName, tag) {
  const index = formData.value[fieldName].indexOf(tag)
  if (index > -1) {
    formData.value[fieldName].splice(index, 1)
  }
}
</script>

<style scoped>
.dynamic-form-renderer {
  width: 100%;
}

.form-field {
  margin-bottom: 16px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.tag-input-field {
  width: 200px;
}
</style>
