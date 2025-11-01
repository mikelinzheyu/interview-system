<template>
  <div class="glass-card feature-card" @click="handleCardClick">
    <div class="feature-icon" :style="{ color: iconColor }">
      <el-icon>
        <component :is="icon" />
      </el-icon>
    </div>

    <h3 class="feature-title">{{ title }}</h3>

    <p class="feature-description">{{ description }}</p>

    <el-button
      type="primary"
      plain
      size="small"
      @click.stop="handleButtonClick"
    >
      {{ buttonText }}
    </el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: '进入'
  },
  icon: {
    type: Object,
    required: true
  },
  iconColor: {
    type: String,
    default: '#409eff'
  },
  route: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click'])

const router = useRouter()

const handleCardClick = () => {
  emit('click')
}

const handleButtonClick = () => {
  if (props.route) {
    router.push(props.route)
  }
}
</script>

<style scoped>
.feature-card {
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: slideUp 0.6s ease-out;
}

.feature-icon {
  font-size: 64px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.feature-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  margin: 0 0 20px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 玻璃态卡片样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 1);
}

/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .feature-card {
    min-height: 280px;
    padding: 20px;
  }

  .feature-icon {
    font-size: 56px;
    margin-bottom: 12px;
  }

  .feature-title {
    font-size: 18px;
  }

  .feature-description {
    font-size: 13px;
  }
}
</style>
