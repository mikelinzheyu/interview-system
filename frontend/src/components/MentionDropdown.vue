<template>
  <div v-if="show && suggestions.length > 0" class="mention-dropdown" :style="position">
    <div class="mention-header">
      <span class="mention-title">提及用户</span>
      <span class="mention-count">{{ suggestions.length }}</span>
    </div>

    <div class="mention-list">
      <div
        v-for="(user, index) in suggestions"
        :key="user.id"
        :class="['mention-item', { selected: index === selectedIndex }]"
        @click="selectUser(user)"
        @mousemove="selectedIndex = index"
      >
        <!-- 用户头像 -->
        <img :src="user.avatar" :alt="user.username" class="user-avatar" />

        <!-- 用户信息 -->
        <div class="user-info">
          <div class="user-name">
            <span class="username">{{ user.username }}</span>
            <span v-if="query" class="highlight">@{{ query }}</span>
          </div>
          <div class="user-bio">{{ user.bio }}</div>
        </div>

        <!-- 快捷键提示 -->
        <div class="shortcut-hint">{{ index === selectedIndex ? 'Enter' : '' }}</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="suggestions.length === 0" class="mention-empty">
      <span>未找到用户</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  },
  query: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select', 'close'])

const selectedIndex = ref(0)

// 监听suggestions变化，重置选中索引
watch(
  (props) => props.suggestions,
  () => {
    selectedIndex.value = 0
  },
  { immediate: true }
)

const selectUser = (user) => {
  emit('select', user)
  selectedIndex.value = 0
}

// 处理键盘导航
const handleKeyDown = (e) => {
  if (!show.value || suggestions.length === 0) return

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(0, selectedIndex.value - 1)
      break
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(suggestions.length - 1, selectedIndex.value + 1)
      break
    case 'Enter':
      e.preventDefault()
      selectUser(suggestions[selectedIndex.value])
      break
    case 'Escape':
      e.preventDefault()
      emit('close')
      break
  }
}

// 在全局监听键盘事件
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', handleKeyDown)
}
</script>

<style scoped lang="scss">
.mention-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 280px;
  max-width: 360px;
  overflow: hidden;

  .mention-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9f9f9;
    border-bottom: 1px solid #e0e0e0;

    .mention-title {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
    }

    .mention-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      background: #409eff;
      color: white;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }
  }

  .mention-list {
    max-height: 320px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #d0d0d0;
      border-radius: 3px;

      &:hover {
        background: #b0b0b0;
      }
    }

    .mention-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      &:hover,
      &.selected {
        background: #f5f7fa;
      }

      &.selected {
        background: #e6f4ff;
        border-left: 3px solid #409eff;
        padding-left: 13px;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      .user-info {
        flex: 1;
        min-width: 0;

        .user-name {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .username {
            font-weight: 500;
            color: #303133;
            font-size: 14px;
          }

          .highlight {
            font-size: 12px;
            color: #409eff;
            background: #e6f4ff;
            padding: 2px 6px;
            border-radius: 3px;
          }
        }

        .user-bio {
          font-size: 12px;
          color: #909399;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .shortcut-hint {
        font-size: 12px;
        color: #909399;
        flex-shrink: 0;
        min-width: 40px;
        text-align: right;
      }
    }
  }

  .mention-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    color: #999;
    font-size: 14px;
  }
}
</style>
