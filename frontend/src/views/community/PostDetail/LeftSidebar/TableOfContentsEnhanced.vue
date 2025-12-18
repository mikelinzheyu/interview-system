<template>
  <div class="toc-card-enhanced" v-if="toc && toc.length > 0">
    <div class="toc-header">
      <h4>目录</h4>
      <button
        v-if="isMobile"
        class="collapse-btn"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '展开' : '收起' }}
      </button>
    </div>

    <nav class="toc-nav" :class="{ collapsed }" aria-label="文章目录导航">
      <ul>
        <li
          v-for="(item, index) in toc"
          :key="index"
          :class="[
            'toc-item',
            `level-${item.level}`,
            { active: activeId === item.id, visited: visitedIds.has(item.id) }
          ]"
        >
          <a
            :href="`#${item.id}`"
            @click.prevent="scrollToSection(item.id)"
            :title="item.text"
          >
            <span class="toc-number">{{ getNumbering(index, item.level) }}</span>
            <span class="toc-text">{{ item.text }}</span>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const props = defineProps({
  toc: {
    type: Array,
    default: () => []
    // 格式: [{ level: 1, text: '标题', id: 'heading-id' }]
  }
})

const activeId = ref('')
const visitedIds = ref(new Set())
const collapsed = ref(false)
const isMobile = ref(false)

let ticking = false

// 计算编号
const getNumbering = (index, level) => {
  if (!props.toc || props.toc.length === 0) return ''

  const levelCounters = { 1: 0, 2: 0, 3: 0 }

  for (let i = 0; i <= index; i++) {
    const item = props.toc[i]

    if (item.level === 1) {
      levelCounters[1]++
      levelCounters[2] = 0
      levelCounters[3] = 0
    } else if (item.level === 2) {
      levelCounters[2]++
      levelCounters[3] = 0
    } else if (item.level === 3) {
      levelCounters[3]++
    }
  }

  const currentLevel = props.toc[index].level

  if (currentLevel === 1) {
    return `${levelCounters[1]}.`
  } else if (currentLevel === 2) {
    return `${levelCounters[1]}.${levelCounters[2]}`
  } else if (currentLevel === 3) {
    return `${levelCounters[1]}.${levelCounters[2]}.${levelCounters[3]}`
  }

  return ''
}

// 滚动到指定章节
const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (!element) return

  const offset = 80 // 距离顶部的偏移量
  const bodyRect = document.body.getBoundingClientRect().top
  const elementRect = element.getBoundingClientRect().top
  const elementPosition = elementRect - bodyRect
  const offsetPosition = elementPosition - offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })

  // 标记为已访问
  visitedIds.value.add(id)

  // 移动端自动收起
  if (isMobile.value) {
    collapsed.value = true
  }
}

// 更新当前激活的章节
const updateActiveSection = () => {
  if (ticking) return

  ticking = true
  window.requestAnimationFrame(() => {
    const scrollPos = window.scrollY + 120

    let foundActive = false

    // 从后往前遍历，找到第一个在视口上方的标题
    for (let i = props.toc.length - 1; i >= 0; i--) {
      const item = props.toc[i]
      const section = document.getElementById(item.id)

      if (section && section.offsetTop <= scrollPos) {
        activeId.value = item.id
        visitedIds.value.add(item.id)
        foundActive = true
        break
      }
    }

    // 如果没有找到，说明在第一个标题之前
    if (!foundActive && props.toc.length > 0) {
      activeId.value = ''
    }

    ticking = false
  })
}

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    collapsed.value = false
  }
}

// 监听 TOC 变化
watch(() => props.toc, () => {
  visitedIds.value.clear()
  activeId.value = ''
  updateActiveSection()
}, { deep: true })

onMounted(() => {
  checkMobile()
  window.addEventListener('scroll', updateActiveSection, { passive: true })
  window.addEventListener('resize', checkMobile, { passive: true })
  updateActiveSection()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSection)
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.toc-card-enhanced {
  position: sticky;
  top: 80px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-height: calc(100vh - 100px);
  overflow: hidden;
  transition: all 0.3s ease;

  .toc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: '📑';
        font-size: 16px;
      }
    }

    .collapse-btn {
      padding: 4px 12px;
      background: transparent;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #606266;
      transition: all 0.2s;

      &:hover {
        background: #f5f7fa;
        border-color: #409eff;
        color: #409eff;
      }
    }
  }

  .toc-nav {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    overflow-x: hidden;
    transition: max-height 0.3s ease;

    &.collapsed {
      max-height: 0;
    }

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;

      &:hover {
        background: #a8a8a8;
      }
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      .toc-item {
        margin: 2px 0;
        position: relative;

        a {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 12px;
          color: #606266;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 13px;
          line-height: 1.5;
          position: relative;
          overflow: hidden;

          .toc-number {
            flex-shrink: 0;
            font-weight: 600;
            color: #909399;
            min-width: 32px;
            font-family: 'Courier New', monospace;
          }

          .toc-text {
            flex: 1;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #409eff;
            transform: scaleY(0);
            transition: transform 0.2s ease;
          }

          &:hover {
            background: #f5f7fa;
            color: #409eff;

            .toc-number {
              color: #409eff;
            }
          }
        }

        // 已访问样式
        &.visited a {
          .toc-number {
            color: #67c23a;
          }
        }

        // 激活样式
        &.active a {
          background: linear-gradient(90deg, #ecf5ff 0%, transparent 100%);
          color: #409eff;
          font-weight: 600;

          .toc-number {
            color: #409eff;
          }

          &::before {
            transform: scaleY(1);
          }
        }

        // 不同层级的缩进
        &.level-1 {
          padding-left: 0;

          a {
            font-weight: 500;
          }
        }

        &.level-2 {
          padding-left: 16px;

          a .toc-number {
            font-size: 12px;
          }
        }

        &.level-3 {
          padding-left: 32px;

          a {
            font-size: 12px;

            .toc-number {
              font-size: 11px;
            }
          }
        }
      }
    }
  }
}

// 暗黑模式
.dark .toc-card-enhanced {
  background: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  .toc-header {
    border-bottom-color: #2d2d2d;

    h4 {
      color: #e4e4e7;
    }

    .collapse-btn {
      border-color: #3f3f46;
      color: #a1a1aa;

      &:hover {
        background: #2d2d2d;
        border-color: #409eff;
        color: #409eff;
      }
    }
  }

  .toc-nav {
    &::-webkit-scrollbar-track {
      background: #2d2d2d;
    }

    &::-webkit-scrollbar-thumb {
      background: #3f3f46;

      &:hover {
        background: #52525b;
      }
    }

    ul .toc-item {
      a {
        color: #a1a1aa;

        .toc-number {
          color: #71717a;
        }

        &:hover {
          background: #2d2d2d;
          color: #409eff;

          .toc-number {
            color: #409eff;
          }
        }
      }

      &.visited a .toc-number {
        color: #67c23a;
      }

      &.active a {
        background: linear-gradient(90deg, rgba(64, 158, 255, 0.1) 0%, transparent 100%);
        color: #409eff;

        .toc-number {
          color: #409eff;
        }
      }
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .toc-card-enhanced {
    position: relative;
    top: 0;
    max-height: none;
    margin-bottom: 16px;

    .toc-nav {
      max-height: 400px;
    }
  }
}

@media print {
  .toc-card-enhanced {
    display: none;
  }
}
</style>
