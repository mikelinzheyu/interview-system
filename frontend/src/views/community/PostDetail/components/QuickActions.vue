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
  background: linear-gradient(180deg,
    rgba(45, 45, 61, 0.6) 0%,
    rgba(38, 38, 51, 0.4) 100%);
  border-bottom: 1px solid rgba(61, 61, 77, 0.5);
  backdrop-filter: blur(8px);

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 14px;
    background: linear-gradient(135deg,
      rgba(74, 144, 226, 0.08) 0%,
      rgba(74, 144, 226, 0.04) 100%);
    border: 1.5px solid rgba(74, 144, 226, 0.25);
    border-radius: 8px;
    color: #d0e4ff;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-size: 13px;
    font-weight: 500;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent);
      transition: left 0.5s ease;
      z-index: 1;
    }

    .btn-text {
      flex: 1;
      text-align: left;
      position: relative;
      z-index: 2;
    }

    .btn-icon {
      font-size: 18px;
      color: rgba(74, 144, 226, 0.6);
      margin-left: 8px;
      flex-shrink: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 2;
    }

    &:hover {
      background: linear-gradient(135deg,
        rgba(74, 144, 226, 0.15) 0%,
        rgba(74, 144, 226, 0.1) 100%);
      border-color: rgba(74, 144, 226, 0.45);
      color: #e8f0ff;
      box-shadow: 0 4px 16px rgba(74, 144, 226, 0.15),
                  inset 0 1px 2px rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);

      &::before {
        left: 100%;
      }

      .btn-icon {
        color: #6ba4ff;
        transform: translateX(4px);
      }
    }

    &:active {
      transform: translateY(0);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
      }
    }
  }
}
</style>
