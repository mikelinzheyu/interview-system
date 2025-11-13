<template>
  <div class="table-of-contents">
    <div class="toc-header">
      <h4>{{ title }}</h4>
      <el-button
        v-if="toc.length > 0"
        text
        size="small"
        @click="toggleCollapse"
      >
        {{ isCollapsed ? '展开' : '收起' }}
      </el-button>
    </div>

    <transition name="collapse">
      <div v-if="!isCollapsed" class="toc-content">
        <div v-if="toc.length === 0" class="toc-empty">
          暂无目录
        </div>

        <nav v-else class="toc-nav">
          <a
            v-for="item in toc"
            :key="item.id"
            :href="`#${item.id}`"
            :class="[
              'toc-item',
              `toc-level-${item.level}`,
              { active: activeId === item.id },
            ]"
            @click.prevent="handleScrollTo(item.id)"
          >
            {{ item.text }}
          </a>
        </nav>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  toc: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: '文章目录',
  },
})

const isCollapsed = ref(false)
const activeId = ref('')

let intersectionObserver = null

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleScrollTo = (id) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
  }
}

// 使用 Intersection Observer 监听滚动位置
const initObserver = () => {
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-50px 0px -66%',
    }
  )

  // 观察所有有 id 的标题元素
  props.toc.forEach((item) => {
    const element = document.getElementById(item.id)
    if (element) {
      intersectionObserver.observe(element)
    }
  })
}

const destroyObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
}

onMounted(() => {
  if (props.toc.length > 0) {
    setTimeout(initObserver, 500)
  }
})

onUnmounted(() => {
  destroyObserver()
})
</script>

<style scoped lang="scss">
.table-of-contents {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 20px;

  .toc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .toc-content {
    padding: 12px 0;

    .toc-empty {
      padding: 16px;
      text-align: center;
      color: #909399;
      font-size: 13px;
    }

    .toc-nav {
      max-height: 400px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #d9d9d9;
        border-radius: 2px;
      }

      .toc-item {
        display: block;
        padding: 8px 16px;
        color: #606266;
        text-decoration: none;
        font-size: 13px;
        line-height: 1.5;
        transition: all 0.3s;
        border-left: 3px solid transparent;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
          background: #f5f7fa;
          color: #409eff;
        }

        &.active {
          background: #f0f7ff;
          color: #409eff;
          border-left-color: #409eff;
          font-weight: 500;
        }

        // 不同级别的缩进
        &.toc-level-1 {
          padding-left: 16px;
        }

        &.toc-level-2 {
          padding-left: 32px;
          font-size: 12px;
        }

        &.toc-level-3 {
          padding-left: 48px;
          font-size: 12px;
        }
      }
    }
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
