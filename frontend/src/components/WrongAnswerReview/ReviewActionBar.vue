<template>
  <div class="review-action-bar">
    <div class="action-bar-content">
      <div class="action-info">
        <p class="action-tip">
          <el-icon><ChatDotRound /></el-icon>
          现在理解了这道题的关键点了吗？试试"再答一次"来巩固学习！
        </p>
      </div>

      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          icon="VideoPlay"
          @click="$emit('retry')"
        >
          再答一次
        </el-button>
        <el-button
          type="success"
          size="large"
          icon="SuccessFilled"
          @click="$emit('mark-learned')"
        >
          我已掌握
        </el-button>
        <el-button
          type="warning"
          size="large"
          icon="Plus"
          @click="$emit('add-practice')"
        >
          加入练习
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Element Plus 图标库中部分图标随版本变动；此处使用已在项目中广泛使用且存在的图标
import { ChatDotRound } from '@element-plus/icons-vue'
defineProps({
  wrongAnswerId: {
    type: String,
    required: true
  }
})

defineEmits(['retry', 'mark-learned', 'add-practice'])
</script>

<style scoped lang="scss">
.review-action-bar {
  position: sticky;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.action-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.action-info {
  flex: 1;
}

.action-tip {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.5;

  :deep(.el-icon) {
    font-size: 18px;
    flex-shrink: 0;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-buttons :deep(.el-button) {
  font-size: 14px;
  font-weight: 600;
  min-width: 140px;

  &:not(:first-child) {
    border-color: rgba(255, 255, 255, 0.3);
  }
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .review-action-bar {
    padding: 16px;
  }

  .action-bar-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .action-tip {
    font-size: 13px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .action-buttons :deep(.el-button) {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .review-action-bar {
    padding: 12px;
    border-radius: 4px;
  }

  .action-tip {
    font-size: 12px;
  }
}
</style>
