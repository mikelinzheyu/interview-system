/**
 * useVirtualScroll - 虚拟滚动组合式函数
 * 用于高效渲染大型列表
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useVirtualScroll(items, itemHeight = 100, containerHeight = 600) {
  const scrollTop = ref(0)
  const containerRef = ref(null)
  const actualContainerHeight = ref(containerHeight)

  // 计算可见范围
  const visibleStartIndex = computed(() => {
    return Math.max(0, Math.floor(scrollTop.value / itemHeight) - 1)
  })

  const visibleEndIndex = computed(() => {
    const endIndex = Math.ceil((scrollTop.value + actualContainerHeight.value) / itemHeight) + 1
    return Math.min(endIndex, items.value.length)
  })

  // 可见项
  const visibleItems = computed(() => {
    return items.value.slice(visibleStartIndex.value, visibleEndIndex.value)
  })

  // 顶部偏移
  const offsetY = computed(() => visibleStartIndex.value * itemHeight)

  // 总高度
  const totalHeight = computed(() => items.value.length * itemHeight)

  /**
   * 处理滚动
   */
  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
  }

  /**
   * 滚动到指定索引
   */
  const scrollToIndex = (index) => {
    if (containerRef.value) {
      const targetScroll = Math.max(0, index * itemHeight - actualContainerHeight.value / 2)
      containerRef.value.scrollTop = targetScroll
    }
  }

  /**
   * 滚动到顶部
   */
  const scrollToTop = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  }

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = totalHeight.value
    }
  }

  /**
   * 监听容器大小变化
   */
  const handleResize = () => {
    if (containerRef.value) {
      actualContainerHeight.value = containerRef.value.clientHeight
    }
  }

  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    // 引用
    containerRef,

    // 状态
    scrollTop,
    actualContainerHeight,

    // 计算属性
    visibleStartIndex,
    visibleEndIndex,
    visibleItems,
    offsetY,
    totalHeight,

    // 方法
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    handleResize
  }
}
