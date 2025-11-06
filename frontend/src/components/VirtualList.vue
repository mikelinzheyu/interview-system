<template>
  <div class="virtual-list" :style="{ height: containerHeight }">
    <div
      class="virtual-list-content"
      :style="{ height: `${totalHeight}px` }"
    >
      <!-- 虚拟项 -->
      <div
        v-for="(item, index) in visibleItems"
        :key="item.id || index"
        class="virtual-list-item"
        :style="{ transform: `translateY(${item.offset}px)` }"
      >
        <slot :item="item.data" :index="item.index">
          <div>{{ item.data }}</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    required: true
  },
  containerHeight: {
    type: [String, Number],
    default: '400px'
  }
})

const scrollTop = ref(0)
const containerRef = ref(null)

// 总高度
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

// 可见项
const visibleItems = computed(() => {
  const containerHeightPx = typeof props.containerHeight === 'string'
    ? parseInt(props.containerHeight)
    : props.containerHeight

  const startIndex = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - 1)
  const endIndex = Math.min(
    props.items.length - 1,
    Math.ceil((scrollTop.value + containerHeightPx) / props.itemHeight) + 1
  )

  const visibleList = []

  for (let i = startIndex; i <= endIndex; i++) {
    if (i >= 0 && i < props.items.length) {
      visibleList.push({
        index: i,
        offset: i * props.itemHeight,
        data: props.items[i]
      })
    }
  }

  return visibleList
})

// 处理滚动
function handleScroll(e) {
  scrollTop.value = e.target.scrollTop
}

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped lang="scss">
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 8px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.25);
    }
  }
}

.virtual-list-content {
  position: relative;
}

.virtual-list-item {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}
</style>
