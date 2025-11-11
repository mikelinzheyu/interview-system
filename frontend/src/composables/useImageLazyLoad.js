/**
 * useImageLazyLoad - 图片懒加载优化
 *
 * 功能：
 * - 使用 Intersection Observer API 实现高效懒加载
 * - 图片占位符和过渡效果
 * - 错误重试机制
 * - 图片预加载队列管理
 * - LQIP（Low Quality Image Placeholder）支持
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useImageLazyLoad() {
  // 图片状态跟踪
  const images = ref(new Map())
  const loadedImages = ref(new Set())
  const failedImages = ref(new Set())
  const preloadQueue = ref([])

  // 配置
  const config = ref({
    rootMargin: '50px',  // 提前 50px 开始加载
    threshold: 0.01,
    maxRetries: 3,
    retryDelay: 1000,
    preloadLimit: 5      // 最多同时加载 5 张
  })

  // 性能指标
  const metrics = ref({
    totalImages: 0,
    loadedCount: 0,
    failedCount: 0,
    averageLoadTime: 0,
    totalLoadTime: 0
  })

  // Intersection Observer 实例
  let observer = null

  /**
   * 创建 Intersection Observer
   */
  const createObserver = () => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            const src = img.dataset.src
            const lowQualitySrc = img.dataset.lowQuality

            if (src) {
              // 先显示低质量图片
              if (lowQualitySrc && img.src !== lowQualitySrc) {
                img.src = lowQualitySrc
                img.classList.add('low-quality')
              }

              // 加入预加载队列
              addToPreloadQueue(img, src)
            }

            observer.unobserve(img)
          }
        })
      }, {
        rootMargin: config.value.rootMargin,
        threshold: config.value.threshold
      })
    }
  }

  /**
   * 注册图片用于懒加载
   */
  const registerImage = (img, src, lowQualitySrc = null) => {
    if (!img) return

    const imgId = Math.random().toString(36).substr(2, 9)
    images.value.set(imgId, {
      element: img,
      src,
      lowQualitySrc,
      retries: 0,
      startTime: null,
      status: 'pending'  // pending | loading | loaded | failed
    })

    img.dataset.imgId = imgId

    if (observer) {
      observer.observe(img)
    } else {
      // 如果不支持 Intersection Observer，直接加载
      loadImage(img, src)
    }

    metrics.value.totalImages++
  }

  /**
   * 添加到预加载队列
   */
  const addToPreloadQueue = (img, src) => {
    const imgId = img.dataset.imgId
    if (!imgId) return

    preloadQueue.value.push({ imgId, img, src })
    processPreloadQueue()
  }

  /**
   * 处理预加载队列
   */
  const processPreloadQueue = () => {
    const activeLoads = Array.from(images.value.values()).filter(
      i => i.status === 'loading'
    ).length

    if (activeLoads >= config.value.preloadLimit || preloadQueue.value.length === 0) {
      return
    }

    const { imgId, img, src } = preloadQueue.value.shift()
    loadImage(img, src, imgId)
  }

  /**
   * 加载单张图片
   */
  const loadImage = async (img, src, imgId) => {
    if (!imgId) {
      imgId = img.dataset.imgId
    }

    const imageData = images.value.get(imgId)
    if (!imageData) return

    imageData.status = 'loading'
    imageData.startTime = Date.now()

    try {
      // 创建 Image 对象进行预加载
      const preloadImg = new Image()

      preloadImg.onload = () => {
        // 加载成功，设置实际图片
        img.src = src
        img.classList.remove('low-quality')
        img.classList.add('loaded')

        imageData.status = 'loaded'
        loadedImages.value.add(imgId)

        // 记录加载时间
        const loadTime = Date.now() - imageData.startTime
        updateMetrics(loadTime, 'success')

        // 继续处理队列
        processPreloadQueue()
      }

      preloadImg.onerror = () => {
        handleLoadError(img, src, imgId)
      }

      // 设置超时
      const timeout = setTimeout(() => {
        if (imageData.status === 'loading') {
          preloadImg.src = ''
          handleLoadError(img, src, imgId)
        }
      }, 10000)  // 10 秒超时

      preloadImg.onload = ((clearTimeoutFn) => {
        return function() {
          clearTimeout(clearTimeoutFn)
          preloadImg.onload = null
          // 原有的 onload 逻辑
          img.src = src
          img.classList.remove('low-quality')
          img.classList.add('loaded')

          imageData.status = 'loaded'
          loadedImages.value.add(imgId)

          const loadTime = Date.now() - imageData.startTime
          updateMetrics(loadTime, 'success')

          processPreloadQueue()
        }
      })(timeout)

      // 启动加载
      preloadImg.src = src

    } catch (error) {
      handleLoadError(img, src, imgId)
    }
  }

  /**
   * 处理加载错误和重试
   */
  const handleLoadError = (img, src, imgId) => {
    const imageData = images.value.get(imgId)
    if (!imageData) return

    imageData.retries++

    if (imageData.retries < config.value.maxRetries) {
      // 延迟后重试
      setTimeout(() => {
        if (imageData.status !== 'loaded') {
          loadImage(img, src, imgId)
        }
      }, config.value.retryDelay * imageData.retries)
    } else {
      // 加载失败，显示占位符或错误图片
      imageData.status = 'failed'
      failedImages.value.add(imgId)

      img.classList.remove('low-quality')
      img.classList.add('load-failed')
      img.alt = '图片加载失败'

      updateMetrics(0, 'failed')
      processPreloadQueue()
    }
  }

  /**
   * 更新性能指标
   */
  const updateMetrics = (loadTime, type) => {
    if (type === 'success') {
      metrics.value.loadedCount++
      metrics.value.totalLoadTime += loadTime
      metrics.value.averageLoadTime = Math.round(
        metrics.value.totalLoadTime / metrics.value.loadedCount
      )
    } else if (type === 'failed') {
      metrics.value.failedCount++
    }
  }

  /**
   * 强制加载指定图片
   */
  const forceLoad = (imgId) => {
    const imageData = images.value.get(imgId)
    if (imageData) {
      loadImage(imageData.element, imageData.src, imgId)
    }
  }

  /**
   * 预加载特定图片（不等待可见性）
   */
  const preloadImages = (srcs) => {
    srcs.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }

  /**
   * 清理已加载的图片数据
   */
  const cleanup = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    images.value.clear()
    loadedImages.value.clear()
    failedImages.value.clear()
    preloadQueue.value = []
  }

  /**
   * 获取加载统计信息
   */
  const getStatistics = () => {
    return {
      ...metrics.value,
      successRate: metrics.value.totalImages > 0
        ? Math.round((metrics.value.loadedCount / metrics.value.totalImages) * 100)
        : 0,
      pendingCount: metrics.value.totalImages - metrics.value.loadedCount - metrics.value.failedCount,
      queueLength: preloadQueue.value.length
    }
  }

  /**
   * 更新配置
   */
  const updateConfig = (newConfig) => {
    config.value = { ...config.value, ...newConfig }
    // 重新创建 Observer 以应用新配置
    if (observer) {
      observer.disconnect()
      createObserver()
      // 重新观察所有图片
      images.value.forEach(imageData => {
        if (imageData.status === 'pending' && observer) {
          observer.observe(imageData.element)
        }
      })
    }
  }

  /**
   * 计算属性：整体加载进度
   */
  const loadProgress = computed(() => {
    if (metrics.value.totalImages === 0) return 0
    return Math.round(
      ((metrics.value.loadedCount + metrics.value.failedCount) / metrics.value.totalImages) * 100
    )
  })

  /**
   * 初始化
   */
  onMounted(() => {
    createObserver()
  })

  /**
   * 清理
   */
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 数据
    images,
    loadedImages,
    failedImages,
    preloadQueue,
    metrics,
    config,

    // 计算属性
    loadProgress,

    // 方法
    registerImage,
    preloadImages,
    forceLoad,
    getStatistics,
    updateConfig,
    cleanup
  }
}
