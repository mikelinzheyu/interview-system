<template>
  <div class="top-toolbar">
    <!-- 左侧：群组信息 -->
    <div class="toolbar-left">
      <el-avatar :size="48" :src="room.avatar">
        {{ room.name?.charAt(0) || '?' }}
      </el-avatar>
      <div class="group-info">
        <div class="group-name">{{ room.name }}</div>
        <div class="group-meta">
          {{ room.memberCount }} 人
          <span class="online-status">• 在线</span>
        </div>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <el-button text size="small" @click="$emit('menu', 'search')" title="搜索">
        <el-icon><Search /></el-icon>
      </el-button>
      <el-button text size="small" @click="$emit('menu', 'call')" title="语音通话">
        <el-icon><Phone /></el-icon>
      </el-button>
      <el-button text size="small" @click="$emit('menu', 'video')" title="视频通话">
        <el-icon><VideoCamera /></el-icon>
      </el-button>
      <ThemeSwitcher :show-menu="true" />
      <el-dropdown @command="handleMoreMenu">
        <el-button text size="small" title="更多">
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="mute">设置禁言</el-dropdown-item>
            <el-dropdown-item command="info">查看群信息</el-dropdown-item>
            <el-dropdown-item divider />
            <el-dropdown-item command="exit">退出群组</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { Search, Phone, VideoCamera, MoreFilled } from '@element-plus/icons-vue'
import ThemeSwitcher from './Theme/ThemeSwitcher.vue'

const props = defineProps({
  room: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['menu'])

function handleMoreMenu(command) {
  emit('menu', command)
}
</script>

<style scoped>
.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-bg, #ffffff);
  color: var(--color-text, #333);
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #333);
}

.group-meta {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
}

.online-status {
  color: #67c23a;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
