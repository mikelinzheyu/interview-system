<template>
  <div
    class="reading-progress-bar"
    :style="{ width: progress + '%' }"
    role="progressbar"
    :aria-valuenow="progress"
    aria-valuemin="0"
    aria-valuemax="100"
  ></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)
let ticking = false

const updateProgress = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight

      if (height > 0) {
        const scrolled = (winScroll / height) * 100
        progress.value = Math.min(Math.max(scrolled, 0), 100)
      } else {
        progress.value = 0
      }

      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress, { passive: true })
  updateProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
  window.removeEventListener('resize', updateProgress)
})
</script>

<style scoped lang="scss">
.reading-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  z-index: 9999;
  transition: width 0.1s ease-out;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

// 为不同主题提供不同的颜色
.dark .reading-progress-bar {
  background: linear-gradient(90deg, #3a8ee6 0%, #529b2e 100%);
  box-shadow: 0 0 10px rgba(58, 142, 230, 0.5);
}
</style>
