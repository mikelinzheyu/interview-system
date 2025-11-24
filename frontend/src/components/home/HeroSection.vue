<template>
  <section class="hero-section">
    <div class="hero-bg-blob hero-blob-1"></div>
    <div class="hero-bg-blob hero-blob-2"></div>

    <div class="hero-content">
      <h1 class="hero-title">欢迎回来{{ userName }}！</h1>
      <p class="hero-subtitle">准备好拿下下一次面试了吗？你的 AI 教练正在等你。</p>

      <div class="hero-actions">
        <button class="hero-btn primary-btn" @click="$emit('start-interview')">
          <el-icon><VideoPlay /></el-icon>
          开始 AI 模拟面试
        </button>
        <button class="hero-btn secondary-btn">
          <el-icon><DocumentCopy /></el-icon>
          浏览题库
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VideoPlay, DocumentCopy } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

defineEmits(['start-interview'])

const userStore = useUserStore()

const userName = computed(() => {
  const user = userStore.user
  if (!user) return '用户'
  return user.username || user.real_name || '用户'
})
</script>

<style scoped lang="scss">
.hero-section {
  position: relative;
  padding: 80px 24px;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(135deg, #0071e3 0%, #4facfe 100%);
  color: white;
  border-radius: 20px;
  margin-bottom: 24px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-bg-blob {
  position: absolute;
  border-radius: 50%;
  mix-blend-mode: multiply;
  filter: blur(64px);
  opacity: 0.3;
  animation: blob 7s infinite;

  &.hero-blob-1 {
    width: 400px;
    height: 400px;
    top: -100px;
    left: -100px;
    background: rgba(255, 255, 255, 0.2);
    animation-delay: 0s;
  }

  &.hero-blob-2 {
    width: 500px;
    height: 500px;
    bottom: -200px;
    right: -100px;
    background: rgba(0, 0, 0, 0.1);
    animation-delay: 2s;
  }
}

@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.hero-content {
  position: relative;
  z-index: 10;
  max-width: 600px;
  margin: 0 auto;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.2;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 18px;
  margin-bottom: 32px;
  font-weight: 300;
  opacity: 0.95;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary-btn {
    background: white;
    color: #0071e3;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    }
  }

  &.secondary-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(8px);

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: white;
    }
  }

  :deep(.el-icon) {
    font-size: 18px;
  }
}

// Responsive
@media (max-width: 1024px) {
  .hero-section {
    padding: 60px 20px;
    min-height: 250px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 16px;
    min-height: 220px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 14px;
    margin-bottom: 24px;
  }

  .hero-btn {
    padding: 12px 24px;
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .hero-section {
    padding: 30px 12px;
    min-height: 200px;
  }

  .hero-title {
    font-size: 24px;
    margin-bottom: 12px;
  }

  .hero-subtitle {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }

  .hero-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
  }

  .hero-bg-blob {
    filter: blur(40px);
    opacity: 0.2;

    &.hero-blob-1 {
      width: 250px;
      height: 250px;
    }

    &.hero-blob-2 {
      width: 300px;
      height: 300px;
    }
  }
}
</style>
