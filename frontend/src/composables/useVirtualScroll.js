/**
 * useVirtualScroll - 虚拟滚动组合式函数（增强版）
 *
 * 功能：
 * - 固定高度和动态高度列表支持
 * - 高效渲染大型列表（数万项）
 * - 无缝滚动和预加载
 * - 双向滚动支持
 * - 滚动性能监控
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useVirtualScroll(
  items,
  itemHeight = 100,
  containerHeight = 600,
  options = {}
) {
  // 默认配置
  const config = {
    buffer: 5,                  // 缓冲区大小（额外渲染的项数）
    dynamicHeights: false,      // 是否支持动态高度
    enableScrollPerf: true,     // 启用滚动性能监控
    scrollDebounce: 16,         // 滚动防抖（毫秒）
    ...options
  }

  // 状态
  const scrollTop = ref(0)
  const containerRef = ref(null)
  const actualContainerHeight = ref(containerHeight)
  const itemHeights = ref(new Map())  // 用于动态高度追踪
  const isScrolling = ref(false)

  // 性能指标
  const performanceMetrics = ref({
    fps: 60,
    renderTime: 0,
    lastScrollTime: 0,
    scrollDistance: 0
  })

  // 防抖滚动处理
  let scrollTimeout = null
  let lastScrollTime = Date.now()
  let lastScrollTop = 0

  /**
   * 计算可见范围（带缓冲）
   */
  const visibleStartIndex = computed(() => {
    if (config.dynamicHeights) {
      // 动态高度情况
      let accumulatedHeight = 0
      let startIndex = 0

      for (let i = 0; i < items.value.length; i++) {
        const h = itemHeights.value.get(i) || itemHeight
        if (accumulatedHeight + h >= scrollTop.value) {
          startIndex = Math.max(0, i - config.buffer)
          break
        }
        accumulatedHeight += h
      }
      return startIndex
    } else {
      // 固定高度情况
      return Math.max(0, Math.floor(scrollTop.value / itemHeight) - config.buffer)
    }
  })

  const visibleEndIndex = computed(() => {
    if (config.dynamicHeights) {
      // 动态高度情况
      let accumulatedHeight = 0
      let endIndex = items.value.length

      for (let i = 0; i < items.value.length; i++) {
        const h = itemHeights.value.get(i) || itemHeight
        accumulatedHeight += h
        if (accumulatedHeight >= scrollTop.value + actualContainerHeight.value) {
          endIndex = Math.min(items.value.length, i + config.buffer)
          break
        }
      }
      return endIndex
    } else {
      // 固定高度情况
      const endIndex = Math.ceil(
        (scrollTop.value + actualContainerHeight.value) / itemHeight
      ) + config.buffer
      return Math.min(endIndex, items.value.length)
    }
  })

  /**
   * 可见项
   */
  const visibleItems = computed(() => {
    return items.value.slice(visibleStartIndex.value, visibleEndIndex.value).map((item, index) => ({
      item,
      index: visibleStartIndex.value + index
    }))
  })

  /**
   * 计算顶部偏移
   */
  const offsetY = computed(() => {
    if (config.dynamicHeights) {
      let offset = 0
      for (let i = 0; i < visibleStartIndex.value; i++) {
        offset += itemHeights.value.get(i) || itemHeight
      }
      return offset
    } else {
      return visibleStartIndex.value * itemHeight
    }
  })

  /**
   * 计算总高度
   */
  const totalHeight = computed(() => {
    if (config.dynamicHeights) {
      let total = 0
      for (let i = 0; i < items.value.length; i++) {
        total += itemHeights.value.get(i) || itemHeight
      }
      return total
    } else {
      return items.value.length * itemHeight
    }
  })

  /**
   * 渲染项的高度
   */
  const getItemHeight = (index) => {
    if (config.dynamicHeights) {
      return itemHeights.value.get(index) || itemHeight
    }
    return itemHeight
  }

  /**
   * 处理滚动事件（带防抖）
   */
  const handleScroll = (event) => {
    const currentTime = Date.now()
    const deltaTime = currentTime - lastScrollTime

    // 更新滚动距离
    performanceMetrics.value.scrollDistance += Math.abs(
      event.target.scrollTop - lastScrollTop
    )

    scrollTop.value = event.target.scrollTop
    lastScrollTop = event.target.scrollTop
    isScrolling.value = true

    // 清除之前的防抖计时器
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    // 设置新的防抖计时器
    scrollTimeout = setTimeout(() => {
      isScrolling.value = false
      lastScrollTime = currentTime

      // 记录滚动性能指标
      if (config.enableScrollPerf && deltaTime > 0) {
        performanceMetrics.value.fps = Math.round(1000 / deltaTime)
      }
    }, config.scrollDebounce)
  }

  /**
   * 注册项的实际高度（用于动态高度模式）
   */
  const registerItemHeight = (index, height) => {
    if (config.dynamicHeights) {
      itemHeights.value.set(index, height)
    }
  }

  /**
   * 滚动到指定索引
   */
  const scrollToIndex = (index, position = 'center') => {
    if (containerRef.value) {
      let targetScroll

      if (config.dynamicHeights) {
        // 计算到该索引的累积高度
        targetScroll = 0
        for (let i = 0; i < index; i++) {
          targetScroll += itemHeights.value.get(i) || itemHeight
        }
      } else {
        targetScroll = index * itemHeight
      }

      // 根据位置调整
      if (position === 'center') {
        targetScroll = Math.max(0, targetScroll - actualContainerHeight.value / 2)
      } else if (position === 'bottom') {
        targetScroll = Math.max(0, targetScroll - actualContainerHeight.value + itemHeight)
      }

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
      containerRef.value.scrollTop = totalHeight.value - actualContainerHeight.value
    }
  }

  /**
   * 平滑滚动到指定位置
   */
  const smoothScrollToIndex = (index, duration = 300) => {
    if (!containerRef.value) return

    let targetScroll

    if (config.dynamicHeights) {
      targetScroll = 0
      for (let i = 0; i < index; i++) {
        targetScroll += itemHeights.value.get(i) || itemHeight
      }
      targetScroll = Math.max(0, targetScroll - actualContainerHeight.value / 2)
    } else {
      targetScroll = Math.max(0, index * itemHeight - actualContainerHeight.value / 2)
    }

    const startScroll = containerRef.value.scrollTop
    const distance = targetScroll - startScroll
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用缓动函数
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress

      containerRef.value.scrollTop = startScroll + distance * easeProgress

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  /**
   * 监听容器大小变化
   */
  const handleResize = () => {
    if (containerRef.value) {
      actualContainerHeight.value = containerRef.value.clientHeight
    }
  }

  /**
   * 刷新列表（重新计算尺寸）
   */
  const refresh = () => {
    itemHeights.value.clear()
    handleResize()
  }

  /**
   * 获取性能报告
   */
  const getPerformanceReport = () => {
    return {
      fps: performanceMetrics.value.fps,
      renderTime: performanceMetrics.value.renderTime,
      visibleItemsCount: visibleItems.value.length,
      totalItemsCount: items.value.length,
      scrollDistance: performanceMetrics.value.scrollDistance,
      isScrolling: isScrolling.value
    }
  }

  /**
   * 重置性能指标
   */
  const resetMetrics = () => {
    performanceMetrics.value.scrollDistance = 0
    performanceMetrics.value.renderTime = 0
  }

  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  })

  return {
    // 引用
    containerRef,

    // 状态
    scrollTop,
    actualContainerHeight,
    isScrolling,
    performanceMetrics,

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
    smoothScrollToIndex,
    handleResize,
    registerItemHeight,
    getItemHeight,
    refresh,
    getPerformanceReport,
    resetMetrics
  }
}
