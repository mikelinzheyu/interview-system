<template>
  <section class="hero-section">
    <!-- 背景装饰 -->
    <div class="hero-decoration">
      <div class="decoration-circle decoration-circle-1"></div>
      <div class="decoration-circle decoration-circle-2"></div>
    </div>

    <!-- 内容 -->
    <div class="hero-content">
      <h1 class="hero-title">欢迎回来{{ userName }}！</h1>
      <p class="hero-subtitle">准备好开始您的下一次面试了吗？</p>
      <div class="hero-actions">
        <el-button
          type="primary"
          size="large"
          @click="handleAction('interview')"
        >
          开始面试
        </el-button>
        <el-button
          size="large"
          @click="handleAction('questions')"
        >
          浏览题库
        </el-button>
        <el-button
          size="large"
          @click="handleAction('achievements')"
        >
          查看排名
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const userName = computed(() => {
  return userStore.user?.real_name || userStore.user?.username || '用户'
})

const handleAction = (action) => {
  const routes = {
    interview: '/interview/new',
    questions: '/questions',
    achievements: '/achievements'
  }

  if (routes[action]) {
    router.push(routes[action])
  }
}
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 100px 40px;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  text-align: center;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 装饰背景 */
.hero-decoration {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: white;
  opacity: 0.1;
}

.decoration-circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
}

.decoration-circle-2 {
  width: 250px;
  height: 250px;
  bottom: -80px;
  left: -80px;
}

/* 内容区 */
.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 700px;
  animation: slideUp 0.6s ease-out;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 0;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin: 0;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.hero-actions :deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  min-width: 120px;
  font-size: 14px;
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
@media (max-width: 1200px) {
  .hero-section {
    padding: 80px 40px;
  }

  .hero-title {
    font-size: 40px;
  }

  .decoration-circle-1 {
    width: 250px;
    height: 250px;
  }

  .decoration-circle-2 {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 24px;
    border-radius: 16px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
  }

  .hero-actions :deep(.el-button) {
    width: 100%;
  }

  .decoration-circle-1 {
    width: 200px;
    height: 200px;
    top: -80px;
    right: -80px;
  }

  .decoration-circle-2 {
    width: 150px;
    height: 150px;
    bottom: -50px;
    left: -50px;
  }
}
</style>
