import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 使用 IntersectionObserver 实现目录高亮联动
 * 比 scroll 事件监听性能更好，更准确
 */
export function useTableOfContents() {
  const activeHeadingId = ref('')
  let observer = null
  const headingElements = new Map()

  /**
   * 初始化 IntersectionObserver
   */
  const initObserver = () => {
    // 配置选项
    const options = {
      // 根元素的边距，负值表示提前触发（当标题到达视口顶部往上 100px 时触发）
      rootMargin: '-100px 0px -66% 0px',
      // 交叉比例阈值
      threshold: [0, 1]
    }

    // 创建观察器
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id')

        if (entry.isIntersecting) {
          // 当标题进入视口时，更新高亮
          headingElements.set(id, {
            element: entry.target,
            intersecting: true
          })
        } else {
          // 当标题离开视口时
          headingElements.set(id, {
            element: entry.target,
            intersecting: false
          })
        }
      })

      // 找到最上方的可见标题作为当前激活项
      updateActiveHeading()
    }, options)
  }

  /**
   * 更新当前激活的标题
   */
  const updateActiveHeading = () => {
    // 找到所有正在交叉的标题
    const visibleHeadings = Array.from(headingElements.entries())
      .filter(([_, data]) => data.intersecting)
      .map(([id, data]) => ({
        id,
        top: data.element.getBoundingClientRect().top
      }))
      .sort((a, b) => a.top - b.top)

    // 选择最靠近视口顶部的标题
    if (visibleHeadings.length > 0) {
      activeHeadingId.value = visibleHeadings[0].id
    }
  }

  /**
   * 观察所有标题元素
   */
  const observeHeadings = () => {
    if (!observer) {
      initObserver()
    }

    // 清空之前的记录
    headingElements.clear()

    // 查找所有带 id 的标题（H1-H6）
    const headings = document.querySelectorAll(
      'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'
    )

    headings.forEach((heading) => {
      const id = heading.getAttribute('id')
      if (id) {
        headingElements.set(id, {
          element: heading,
          intersecting: false
        })
        observer.observe(heading)
      }
    })
  }

  /**
   * 停止观察
   */
  const disconnectObserver = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    headingElements.clear()
  }

  /**
   * 滚动到指定标题
   * @param {String} headingId 标题的 ID
   */
  const scrollToHeading = (headingId) => {
    const element = document.getElementById(headingId)
    if (element) {
      const offset = 100 // 距离顶部的偏移量
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = element.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // 手动设置激活状态
      activeHeadingId.value = headingId
    }
  }

  return {
    activeHeadingId,
    observeHeadings,
    disconnectObserver,
    scrollToHeading
  }
}
