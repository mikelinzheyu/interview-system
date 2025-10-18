<template>
  <div class="virtual-list" @scroll="handleScroll" :style="{ height: height + 'px' }">
    <!-- 顶部占位符 -->
    <div :style="{ height: offsetTop + 'px' }" />

    <!-- 可见项 -->
    <slot
      v-for="(item, index) in visibleItems"
      :key="startIndex + index"
      :item="item"
      :index="startIndex + index"
    />

    <!-- 底部占位符 -->
    <div :style="{ height: offsetBottom + 'px' }" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  itemSize: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  bufferSize: {
    type: Number,
    default: 5
  }
})

const scrollTop = ref(0)
const containerHeight = ref(props.height)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemSize) - props.bufferSize
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const index =
    Math.ceil((scrollTop.value + containerHeight.value) / props.itemSize) +
    props.bufferSize
  return Math.min(props.items.length, index)
})

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value)
)

const offsetTop = computed(() => startIndex.value * props.itemSize)

const offsetBottom = computed(() => {
  const totalHeight = props.items.length * props.itemSize
  const visibleHeight = endIndex.value * props.itemSize
  return Math.max(0, totalHeight - visibleHeight)
})

function handleScroll(event) {
  scrollTop.value = event.target.scrollTop
}

watch(
  () => props.height,
  (newHeight) => {
    containerHeight.value = newHeight
  }
)

watch(
  () => props.items.length,
  () => {
    scrollTop.value = 0
  }
)
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
