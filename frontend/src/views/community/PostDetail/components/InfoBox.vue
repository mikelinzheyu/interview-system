<template>
  <div :class="['info-box', `info-box-${type}`]">
    <div class="info-box-icon">
      <el-icon v-if="type === 'info'"><InfoFilled /></el-icon>
      <el-icon v-else-if="type === 'warning'"><Warning /></el-icon>
      <el-icon v-else-if="type === 'success'"><SuccessFilled /></el-icon>
      <el-icon v-else-if="type === 'error'"><CircleCloseFilled /></el-icon>
      <el-icon v-else><Bell /></el-icon>
    </div>

    <div class="info-box-content">
      <div v-if="title" class="info-box-title">{{ title }}</div>
      <div class="info-box-message">
        <slot>{{ message }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import {
  InfoFilled,
  Warning,
  SuccessFilled,
  CircleCloseFilled,
  Bell,
} from '@element-plus/icons-vue'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning', 'success', 'error', 'notice'].includes(value),
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
})
</script>

<style scoped lang="scss">
.info-box {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-2xl);
  border-radius: var(--radius-md);
  border-left: 4px solid;
  margin: var(--spacing-2xl) 0;
  background-color: var(--color-bg-gray);
  border-color: var(--color-info);

  .info-box-icon {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    margin-top: 2px;

    .el-icon {
      font-size: 20px;
      color: var(--color-info);
    }
  }

  .info-box-content {
    flex: 1;
    min-width: 0;

    .info-box-title {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .info-box-message {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);

      :deep(p) {
        margin: 0;

        &:not(:last-child) {
          margin-bottom: var(--spacing-sm);
        }
      }

      :deep(ul),
      :deep(ol) {
        margin: 0;
        padding-left: var(--spacing-2xl);

        li {
          margin-bottom: var(--spacing-xs);
        }
      }

      :deep(code) {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: var(--radius-base);
        font-family: var(--font-family-code);
        font-size: var(--font-size-xs);
        color: var(--color-text-primary);
      }
    }
  }

  // 不同类型的样式
  &.info-box-info {
    background-color: rgba(24, 144, 255, 0.05);
    border-color: var(--color-info);

    .info-box-icon .el-icon {
      color: var(--color-info);
    }
  }

  &.info-box-warning {
    background-color: rgba(250, 173, 20, 0.05);
    border-color: var(--color-warning);

    .info-box-icon .el-icon {
      color: var(--color-warning);
    }
  }

  &.info-box-success {
    background-color: rgba(82, 196, 26, 0.05);
    border-color: var(--color-success);

    .info-box-icon .el-icon {
      color: var(--color-success);
    }
  }

  &.info-box-error {
    background-color: rgba(245, 34, 45, 0.05);
    border-color: var(--color-error);

    .info-box-icon .el-icon {
      color: var(--color-error);
    }
  }

  &.info-box-notice {
    background-color: rgba(102, 126, 234, 0.05);
    border-color: #667eea;

    .info-box-icon .el-icon {
      color: #667eea;
    }
  }
}
</style>
