<template>
  <div class="article-actions-enhanced">
    <!-- 固定操作栏 -->
    <transition name="slide-in">
      <div v-show="showFixed" class="fixed-action-bar">
        <div class="action-group">
          <el-tooltip :content="liked ? '取消点赞' : '点赞'" placement="left">
            <button
              class="action-btn"
              :class="{ active: liked }"
              @click="emit('like')"
            >
              <el-icon><StarFilled v-if="liked" /><Star v-else /></el-icon>
              <span v-if="likeCount > 0">{{ formatNumber(likeCount) }}</span>
            </button>
          </el-tooltip>

          <el-tooltip content="评论" placement="left">
            <button class="action-btn" @click="emit('comment')">
              <el-icon><ChatDotRound /></el-icon>
              <span v-if="commentCount > 0">{{ formatNumber(commentCount) }}</span>
            </button>
          </el-tooltip>

          <el-tooltip :content="collected ? '取消收藏' : '收藏'" placement="left">
            <button
              class="action-btn"
              :class="{ active: collected }"
              @click="emit('collect')"
            >
              <el-icon><Collection /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="分享" placement="left">
            <button class="action-btn" @click="emit('share')">
              <el-icon><Share /></el-icon>
            </button>
          </el-tooltip>

          <div class="divider"></div>

          <el-tooltip content="返回顶部" placement="left">
            <button class="action-btn scroll-top" @click="scrollToTop">
              <el-icon><Top /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </transition>

    <!-- 移动端浮动按钮 -->
    <transition name="fade">
      <div v-if="isMobile && toc && toc.length > 0" class="floating-btns">
        <button class="floating-btn toc-btn" @click="showTOC = true">
          <el-icon><Menu /></el-icon>
        </button>
      </div>
    </transition>

    <!-- 移动端目录抽屉 -->
    <el-drawer
      v-model="showTOC"
      title="文章目录"
      direction="rtl"
      size="80%"
      :with-header="true"
    >
      <slot name="toc"></slot>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Star,
  StarFilled,
  ChatDotRound,
  Collection,
  Share,
  Top,
  Menu
} from '@element-plus/icons-vue'

const props = defineProps({
  liked: Boolean,
  collected: Boolean,
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  toc: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['like', 'collect', 'comment', 'share'])

const showFixed = ref(false)
const showTOC = ref(false)
const isMobile = ref(false)

let ticking = false

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}

// 滚动事件处理
const handleScroll = () => {
  if (ticking) return

  ticking = true
  window.requestAnimationFrame(() => {
    showFixed.value = window.scrollY > 400
    ticking = false
  })
}

// 返回顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', checkMobile, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.article-actions-enhanced {
  .fixed-action-bar {
    position: fixed;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 12px 8px;
    z-index: 1000;
    backdrop-filter: blur(10px);

    .action-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 12px;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        color: #606266;
        font-size: 20px;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(64, 158, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }

        &:hover {
          background: #f5f7fa;
          color: #409eff;

          &::before {
            width: 100%;
            height: 100%;
          }
        }

        &.active {
          color: #409eff;
          background: #ecf5ff;
        }

        &.scroll-top {
          margin-top: 4px;
        }

        span {
          font-size: 12px;
          font-weight: 500;
        }
      }

      .divider {
        height: 1px;
        background: #f0f0f0;
        margin: 4px 8px;
      }
    }
  }

  .floating-btns {
    position: fixed;
    right: 20px;
    bottom: 80px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .floating-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #409eff;
      color: white;
      border: none;
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: all 0.3s ease;

      &:hover {
        background: #66b1ff;
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// 过渡动画
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in-enter-from {
  opacity: 0;
  transform: translate(30px, -50%);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translate(30px, -50%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 暗黑模式
.dark .article-actions-enhanced {
  .fixed-action-bar {
    background: #1a1a1a;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

    .action-btn {
      color: #a1a1aa;

      &:hover {
        background: #2d2d2d;
        color: #409eff;
      }

      &.active {
        color: #409eff;
        background: rgba(64, 158, 255, 0.15);
      }
    }

    .divider {
      background: #3f3f46;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .article-actions-enhanced {
    .fixed-action-bar {
      right: auto;
      left: 50%;
      top: auto;
      bottom: 20px;
      transform: translateX(-50%);
      padding: 8px 12px;

      .action-group {
        flex-direction: row;

        .divider {
          width: 1px;
          height: 32px;
          margin: 0 4px;
        }
      }
    }
  }
}

@media print {
  .article-actions-enhanced {
    display: none !important;
  }
}
</style>
