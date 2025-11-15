<template>
  <div class="floating-toc">
    <h4 class="toc-title">目录</h4>

    <div v-if="toc && toc.length > 0" class="toc-list">
      <div
        v-for="(item, index) in toc"
        :key="index"
        :class="[
          'toc-item',
          `toc-level-${item.level}`,
          { active: activeId === item.id }
        ]"
        @click="scrollToHeading(item.id)"
      >
        <span class="toc-link">{{ item.text }}</span>
      </div>
    </div>

    <div v-else class="toc-empty">
      <p>暂无目录</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  toc: {
    type: Array,
    default: () => [],
  },
})

const activeId = ref('')
let observer = null
const headingElements = ref([])

// 滚动到指定标题
const scrollToHeading = (id) => {
  const element = document.getElementById(id)
  if (element) {
    const yOffset = -80 // 顶部偏移量
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset

    window.scrollTo({
      top: y,
      behavior: 'smooth',
    })
  }
}

// 初始化 Intersection Observer
const initObserver = () => {
  if (typeof window === 'undefined') return

  // 清理旧的 observer
  if (observer) {
    observer.disconnect()
  }

  // 获取所有标题元素
  headingElements.value = props.toc
    .map(item => document.getElementById(item.id))
    .filter(el => el !== null)

  if (headingElements.value.length === 0) return

  // 创建 observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-80px 0px -80% 0px', // 当元素进入顶部附近时触发
      threshold: [0, 1],
    }
  )

  // 观察所有标题元素
  headingElements.value.forEach((element) => {
    observer.observe(element)
  })
}

// 监听 toc 变化
watch(
  () => props.toc,
  () => {
    // 延迟初始化，确保 DOM 已更新
    setTimeout(() => {
      initObserver()
    }, 300)
  },
  { deep: true }
)

onMounted(() => {
  setTimeout(() => {
    initObserver()
  }, 500)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped lang="scss">
.floating-toc {
  background: var(--color-bg-gray);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);

  .toc-title {
    margin: 0 0 var(--spacing-lg) 0;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border-default);
  }

  .toc-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .toc-item {
    position: relative;
    cursor: pointer;
    transition: all var(--transition-fast);
    padding: var(--spacing-xs) 0;
    border-left: 2px solid transparent;
    padding-left: var(--spacing-sm);

    .toc-link {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-base);
      display: block;
      transition: color var(--transition-fast);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 不同层级的缩进 */
    &.toc-level-1 {
      padding-left: var(--spacing-sm);

      .toc-link {
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-base);
      }
    }

    &.toc-level-2 {
      padding-left: var(--spacing-lg);
    }

    &.toc-level-3 {
      padding-left: var(--spacing-2xl);
    }

    &.toc-level-4 {
      padding-left: var(--spacing-3xl);
    }

    /* Hover 效果 */
    &:hover {
      .toc-link {
        color: var(--color-primary);
      }
    }

    /* 激活状态 */
    &.active {
      border-left-color: var(--color-primary);
      background: rgba(252, 85, 49, 0.05);

      .toc-link {
        color: var(--color-primary);
        font-weight: var(--font-weight-medium);
      }
    }
  }

  .toc-empty {
    padding: var(--spacing-2xl) 0;
    text-align: center;

    p {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
    }
  }
}
</style>
