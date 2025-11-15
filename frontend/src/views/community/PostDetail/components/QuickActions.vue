<template>
  <div class="quick-actions">
    <button
      v-for="action in actions"
      :key="action.id"
      @click="handleAction(action)"
      class="action-btn"
      :title="action.description"
    >
      <span class="btn-text">{{ action.label }}</span>
      <span class="btn-icon">›</span>
    </button>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits(['action'])

const actions = [
  {
    id: 'analyze',
    label: 'AI 解读 - 创析摘文结构及重点',
    description: '使用 AI 解读博文结构'
  },
  {
    id: 'chat',
    label: 'AI 对话 - 阅读助手及对话引导',
    description: '开启 AI 对话模式'
  }
]

const handleAction = (action) => {
  emit('action', action.id)
}
</script>

<style scoped lang="scss">
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #2d2d3d;
  border-bottom: 1px solid #3d3d4d;

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    border: 1px solid #3d3d4d;
    border-radius: 8px;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;

    .btn-text {
      flex: 1;
      text-align: left;
    }

    .btn-icon {
      font-size: 18px;
      color: #666;
      margin-left: 8px;
      flex-shrink: 0;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.1);
      border-color: #667eea;
      color: #667eea;

      .btn-icon {
        color: #667eea;
        transform: translateX(2px);
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
