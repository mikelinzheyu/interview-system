<template>
  <section class="hero-section">
    <!-- 背景装饰 -->
    <div class="hero-decoration">
      <div class="decoration-circle decoration-circle-1"></div>
      <div class="decoration-circle decoration-circle-2"></div>
      <svg class="bg-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#FFFFFF"
          d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.8,32.3C59.4,43.1,47.9,51.8,35.9,60.4C23.9,69,11.4,77.5,-2.5,81.8C-16.4,86.1,-31.7,86.2,-43.8,79.3C-55.9,72.4,-64.8,58.5,-72.8,45.3C-80.8,32.1,-87.9,19.6,-89.4,6.3C-90.9,-7,-86.8,-21.1,-77.9,-32.9C-69,-44.7,-55.3,-54.2,-41.9,-61.8C-28.5,-69.4,-15.4,-75.1,-0.8,-73.7C13.8,-72.3,27.6,-63.8,44.7,-76.4Z"
          transform="translate(100 100)"
          opacity="0.2"
        />
      </svg>
    </div>

    <!-- 内容 -->
    <div class="hero-content">
      <h1 class="hero-title">欢迎回来{{ userName }}！</h1>
      <p class="hero-subtitle">准备好拿下你的下一次面试了吗？你的 AI 教练正在等你。</p>
      <div class="hero-actions">
        <button class="btn btn-primary" @click="handleAction('interview')">
          <el-icon><VideoCamera /></el-icon>
          开始 AI 模拟面试
        </button>
        <button class="btn btn-secondary" @click="handleAction('questions')">
          <el-icon><Document /></el-icon>
          浏览题库
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { VideoCamera, Document } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const userName = computed(() => {
  const user = userStore.user
  if (!user) return '用户'
  return user.real_name || user.username || '用户'
})

const handleAction = (action: 'interview' | 'questions') => {
  const routes: Record<string, string> = {
    interview: '/interview/ai',
    questions: '/learning-hub'
  }

  const route = routes[action]
  if (route) {
    router.push(route)
  }
}
</script>

<style scoped lang="scss">
.hero-section {
  background: linear-gradient(135deg, #0071e3 0%, #4facfe 100%);
  padding: 40px 32px;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
  text-align: center;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  color: white;
}

.hero-decoration {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;

  .bg-svg {
    position: absolute;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    opacity: 0.15;
  }
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

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 700px;
  animation: slideUp 0.6s ease-out;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin: 0;
  word-break: break-word;
  max-width: 100%;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
  margin: 0;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.btn-primary {
  background: white;
  color: #0071e3;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
  }
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.el-icon {
  display: inline-flex;
  align-items: center;
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
    padding: 50px 30px;
    min-height: 260px;
  }

  .hero-title {
    font-size: 36px;
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
    padding: 40px 20px;
    border-radius: 16px;
    min-height: 240px;
  }

  .hero-title {
    font-size: 28px;
    line-height: 1.4;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .btn {
    width: 100%;
  }

  .decoration-circle-1 {
    width: 180px;
    height: 180px;
    top: -80px;
    right: -80px;
  }

  .decoration-circle-2 {
    width: 140px;
    height: 140px;
    bottom: -50px;
    left: -50px;
  }
}
</style>
