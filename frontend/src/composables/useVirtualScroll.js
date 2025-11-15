/**
 * useVirtualScroll - 虚拟滚动管理
 *
 * 功能：
 * - 高效渲染大量列表项
 * - 动态计算可见范围
 * - 支持不同高度的列表项
 * - 自动检测滚动事件
 */

import { ref, computed, watch, onMounted, nextTick } from 'vue'

export function useVirtualScroll(itemsGetter, itemHeight = 120, bufferSize = 3) {
  // 状态
  const containerRef = ref(null)
  const scrollTop = ref(0)
  const containerHeight = ref(0)
  const visibleStart = ref(0)
  const visibleEnd = ref(0)

  // 获取items的函数，支持ref或getter函数
  const getItems = () => {
    if (typeof itemsGetter === 'function') {
      return itemsGetter()
    }
    return itemsGetter.value || []
  }

  // 计算属性
  const totalHeight = computed(() => getItems().length * itemHeight)

  const visibleItems = computed(() => {
    const items = getItems()
    // 缓冲区：多渲染上下各几个元素，避免滚动时的闪烁
    const start = Math.max(0, visibleStart.value - bufferSize)
    const end = Math.min(items.length, visibleEnd.value + bufferSize)

    return items.slice(start, end).map((item, index) => ({
      item,
      index: start + index,
      offset: (start + index) * itemHeight
    }))
  })

  // 计算可见项数量
  const visibleCount = computed(() => Math.ceil(containerHeight.value / itemHeight))

  // 更新可见范围
  const updateVisibleRange = () => {
    if (!containerRef.value) return

    const newStart = Math.floor(scrollTop.value / itemHeight)
    const newEnd = newStart + visibleCount.value

    visibleStart.value = newStart
    visibleEnd.value = newEnd
  }

  // 处理滚动事件
  const handleScroll = (e) => {
    scrollTop.value = e.target.scrollTop
    updateVisibleRange()
  }

  // 监听容器宽度变化
  const observeContainer = () => {
    if (!containerRef.value) return

    const resizeObserver = new ResizeObserver(() => {
      containerHeight.value = containerRef.value?.clientHeight || 0
      updateVisibleRange()
    })

    resizeObserver.observe(containerRef.value)

    return () => resizeObserver.disconnect()
  }

  // 初始化
  onMounted(() => {
    nextTick(() => {
      if (containerRef.value) {
        containerHeight.value = containerRef.value.clientHeight
        updateVisibleRange()
      }
    })

    const unobserve = observeContainer()
    return () => unobserve?.()
  })

  // 监听items变化
  watch(
    () => getItems().length,
    () => {
      updateVisibleRange()
    }
  )

  // 滚动到指定索引
  const scrollToIndex = (index) => {
    if (!containerRef.value) return

    const targetScrollTop = Math.max(0, (index - Math.floor(visibleCount.value / 2)) * itemHeight)
    containerRef.value.scrollTop = targetScrollTop
  }

  // 滚动到顶部
  const scrollToTop = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = 0
    }
  }

  // 滚动到底部
  const scrollToBottom = () => {
    if (containerRef.value) {
      containerRef.value.scrollTop = totalHeight.value - containerHeight.value
    }
  }

  return {
    // 引用
    containerRef,

    // 状态
    scrollTop,
    containerHeight,
    visibleStart,
    visibleEnd,

    // 计算属性
    totalHeight,
    visibleItems,
    visibleCount,

    // 方法
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    updateVisibleRange
  }
}
