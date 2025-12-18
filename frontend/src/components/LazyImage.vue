<template>
  <img
    ref="imgRef"
    :data-src="src"
    :alt="alt"
    :class="['lazy-image', { loaded: isLoaded, error: hasError }]"
    @load="handleLoad"
    @error="handleError"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect fill=\'%23f5f5f5\' width=\'100\' height=\'100\'/%3E%3C/svg%3E'
  }
})

const imgRef = ref(null)
const isLoaded = ref(false)
const hasError = ref(false)

let observer = null

const handleLoad = () => {
  isLoaded.value = true
}

const handleError = () => {
  hasError.value = true
  if (imgRef.value && props.placeholder) {
    imgRef.value.src = props.placeholder
  }
}

onMounted(() => {
  if (!imgRef.value) return

  // 设置占位图
  if (props.placeholder) {
    imgRef.value.src = props.placeholder
  }

  // 使用 Intersection Observer 实现懒加载
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            const dataSrc = img.getAttribute('data-src')

            if (dataSrc) {
              img.src = dataSrc
              observer.unobserve(img)
            }
          }
        })
      },
      {
        rootMargin: '50px 0px', // 提前 50px 开始加载
        threshold: 0.01
      }
    )

    observer.observe(imgRef.value)
  } else {
    // 降级方案：直接加载
    if (props.src) {
      imgRef.value.src = props.src
    }
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped lang="scss">
.lazy-image {
  max-width: 100%;
  height: auto;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  background: #f5f5f5;

  &.loaded {
    opacity: 1;
  }

  &.error {
    opacity: 0.5;
    filter: grayscale(100%);
  }
}
</style>
