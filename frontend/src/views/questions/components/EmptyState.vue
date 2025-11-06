<template>
  <div class="empty-state" :class="[type, size]">
    <div class="empty-icon">
      <svg v-if="type === 'no-data'" viewBox="0 0 128 128" width="64" height="64">
        <path fill="currentColor" d="M64 12c28.7 0 52 23.3 52 52s-23.3 52-52 52S12 92.7 12 64 35.3 12 64 12m0-4C34.1 8 8 34.1 8 64s26.1 56 56 56 56-26.1 56-56S93.9 8 64 8z" />
        <path fill="currentColor" d="M64 35c16.6 0 30 13.4 30 30s-13.4 30-30 30-30-13.4-30-30 13.4-30 30-30m0-4c-18.8 0-34 15.2-34 34s15.2 34 34 34 34-15.2 34-34-15.2-34-34-34z" />
      </svg>
      <svg v-else-if="type === 'no-search'" viewBox="0 0 128 128" width="64" height="64">
        <circle cx="52" cy="52" r="28" fill="none" stroke="currentColor" stroke-width="4" />
        <path stroke="currentColor" stroke-width="4" d="M80 80l32 32" fill="none" />
      </svg>
      <svg v-else-if="type === 'error'" viewBox="0 0 128 128" width="64" height="64">
        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" stroke-width="4" />
        <path stroke="currentColor" stroke-width="4" d="M42 42l44 44M86 42l-44 44" fill="none" />
      </svg>
      <svg v-else viewBox="0 0 128 128" width="64" height="64">
        <path fill="currentColor" d="M64 20c24.3 0 44 19.7 44 44s-19.7 44-44 44S20 88.3 20 64 39.7 20 64 20m0-4C37.9 16 16 37.9 16 64s21.9 48 48 48 48-21.9 48-48S90.1 16 64 16z" />
        <circle cx="64" cy="52" r="4" fill="currentColor" />
        <path fill="currentColor" d="M64 64a2 2 0 0 0-2 2v16a2 2 0 0 0 4 0V66a2 2 0 0 0-2-2z" />
      </svg>
    </div>

    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>

    <!-- 自定义内容插槽 -->
    <slot name="content" />

    <!-- 操作按钮 -->
    <div v-if="$slots.actions || actions.length" class="empty-actions">
      <slot name="actions">
        <el-button
          v-for="action in actions"
          :key="action.text"
          :type="action.type"
          :size="size === 'large' ? 'default' : 'small'"
          @click="action.handler"
        >
          {{ action.text }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'no-data', // 'no-data', 'no-search', 'error', 'empty'
    validator: (value) => ['no-data', 'no-search', 'error', 'empty'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  actions: {
    type: Array,
    default: () => []
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

defineSlots(['content', 'actions'])
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;

  &.small {
    padding: 20px;

    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    .empty-title {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .empty-description {
      font-size: 12px;
    }
  }

  &.medium {
    padding: 40px 20px;

    .empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 16px;
      margin-bottom: 8px;
    }

    .empty-description {
      font-size: 14px;
    }
  }

  &.large {
    padding: 60px 20px;

    .empty-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
    }

    .empty-title {
      font-size: 18px;
      margin-bottom: 12px;
    }

    .empty-description {
      font-size: 15px;
    }
  }
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  margin-bottom: 16px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.empty-title {
  margin: 0 0 8px;
  color: #666;
  font-weight: 500;
}

.empty-description {
  margin: 0 0 16px;
  color: #999;
  line-height: 1.6;
  max-width: 400px;
}

.empty-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}
</style>
