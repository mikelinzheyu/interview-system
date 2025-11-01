<template>
  <div v-if="visible" class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div
      v-for="item in items"
      :key="item.action"
      class="menu-item"
      :class="{ danger: item.danger, divider: item.divider }"
      @click="handleSelect(item.action)"
    >
      <el-icon v-if="item.icon" :class="{ danger: item.danger }">
        <component :is="item.icon" />
      </el-icon>
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'close'])

const visible = computed(() => props.items.length > 0)

function handleSelect(action) {
  emit('select', action)
  emit('close')
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 140px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.menu-item:hover:not(.divider) {
  background: #f5f5f5;
  color: #5c6af0;
}

.menu-item.danger {
  color: #ff5f72;
}

.menu-item.danger:hover {
  background: rgba(255, 95, 114, 0.1);
  color: #ff5f72;
}

.menu-item.divider {
  height: 1px;
  background: #e5e7eb;
  padding: 0;
  cursor: default;
  margin: 4px 0;
}
</style>
