<template>
  <div class="comment-list">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="comments.length === 0" class="empty">
      <el-empty description="暂无评论，来发表第一条评论吧" />
    </div>

    <!-- 虚拟滚动容器 -->
    <div v-else ref="virtualScrollContainer" class="comments" @scroll="handleScroll">
      <!-- 虚拟滚动占位符（顶部）-->
      <div class="virtual-spacer-top" :style="{ height: topSpacerHeight + 'px' }" />

      <!-- 可见的评论项 -->
      <CommentItem
        v-for="item in visibleItems"
        :key="item.item.id"
        :comment="item.item"
        :post-id="postId"
        :style="{ transform: `translateY(0px)` }"
        @reply="handleReply"
        @delete="handleDelete"
      />

      <!-- 虚拟滚动占位符（底部）-->
      <div class="virtual-spacer-bottom" :style="{ height: bottomSpacerHeight + 'px' }" />
    </div>

    <!-- 回到顶部按钮 -->
    <transition name="fade">
      <el-button
        v-show="showScrollToTop"
        class="scroll-to-top-btn"
        type="primary"
        round
        @click="virtualScrollToTop"
      >
        ↑ 回到顶部
      </el-button>
    </transition>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted } from 'vue'
import CommentItem from './CommentItem.vue'
import { useVirtualScroll } from '@/composables/useVirtualScroll'

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  postId: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['reply', 'delete'])

// 虚拟滚动配置
const ITEM_HEIGHT = 200 // 每个评论项的高度（像素）
const BUFFER_SIZE = 3 // 缓冲区大小

// 虚拟滚动
const virtualScrollContainer = ref(null)
const {
  containerRef: virtualScrollRef,
  handleScroll: handleVirtualScroll,
  visibleItems,
  scrollTop,
  scrollToTop: virtualScrollToTop
} = useVirtualScroll(
  () => props.comments,
  ITEM_HEIGHT,
  BUFFER_SIZE
)

// 在挂载后设置容器引用
const initializeVirtualScroll = () => {
  if (virtualScrollContainer.value && virtualScrollRef) {
    virtualScrollRef.value = virtualScrollContainer.value
  }
}

// 生命周期
onMounted(() => {
  initializeVirtualScroll()
})

// 计算顶部和底部占位符高度
const totalItemsCount = computed(() => props.comments.length)

const visibleStart = computed(() => {
  if (!visibleItems.value.length) return 0
  return visibleItems.value[0]?.index || 0
})

const visibleEnd = computed(() => {
  if (!visibleItems.value.length) return 0
  return visibleItems.value[visibleItems.value.length - 1]?.index || 0
})

const topSpacerHeight = computed(() => visibleStart.value * ITEM_HEIGHT)

const bottomSpacerHeight = computed(() => (totalItemsCount.value - visibleEnd.value - 1) * ITEM_HEIGHT)

// 显示回到顶部按钮
const showScrollToTop = computed(() => scrollTop.value > 300)

// 处理滚动
const handleScroll = (e) => {
  handleVirtualScroll(e)
}

const handleReply = (data) => {
  emit('reply', data)
}

const handleDelete = (commentId) => {
  emit('delete', commentId)
}
</script>

<style scoped lang="scss">
.comment-list {
  position: relative;

  .loading {
    padding: 20px 0;
  }

  .empty {
    padding: 40px 0;
  }

  // 虚拟滚动容器
  .comments {
    max-height: 800px;
    overflow-y: auto;
    position: relative;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;

      &:hover {
        background: #555;
      }
    }

    // 虚拟滚动占位符
    .virtual-spacer-top,
    .virtual-spacer-bottom {
      pointer-events: none;
    }

    // 评论项样式
    :deep(.comment-item) {
      border-bottom: 1px solid #f0f0f0;
      padding: 16px 0;

      &:last-of-type {
        border-bottom: none;
      }
    }
  }

  // 回到顶部按钮
  .scroll-to-top-btn {
    position: fixed;
    bottom: 80px;
    right: 30px;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
