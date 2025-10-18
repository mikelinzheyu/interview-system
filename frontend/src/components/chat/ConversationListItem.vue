<template>
  <div
    class="conversation-item"
    :class="{
      'conversation-item--active': isActive,
      'conversation-item--unread': conversation.unreadCount > 0,
      'conversation-item--muted': conversation.isMuted,
      'conversation-item--pinned': conversation.pinned
    }"
    @click="handleSelect"
    @contextmenu.prevent="showContextMenu"
  >
    <!-- 置顶标记 -->
    <div v-if="conversation.pinned" class="conversation-item__pin">
      <el-icon><Top /></el-icon>
    </div>

    <!-- 头像 + 在线状态 -->
    <div class="conversation-item__avatar">
      <el-avatar
        :size="48"
        :src="conversation.avatar"
        :style="{ backgroundColor: getAvatarColor(conversation.id) }"
      >
        {{ conversation.name?.slice(0, 1) || '?' }}
      </el-avatar>
      <div
        v-if="showOnlineStatus"
        class="conversation-item__status"
        :class="`conversation-item__status--${userStatusMap[conversation.id] || 'offline'}`"
      />
    </div>

    <!-- 内容区 -->
    <div class="conversation-item__content">
      <div class="conversation-item__header">
        <div class="conversation-item__name">
          {{ conversation.name }}
          <el-tag
            v-if="conversation.type === 'group'"
            type="info"
            size="small"
            effect="plain"
            class="conversation-item__type-tag"
          >
            Ⱥ
          </el-tag>
        </div>
        <div class="conversation-item__time">
          {{ formatTime(conversation.lastMessageAt) }}
        </div>
      </div>

      <div class="conversation-item__preview">
        <span v-if="conversation.isMuted" class="conversation-item__mute-icon">
          🔕
        </span>
        <span class="conversation-item__preview-text">
          {{ getLastMessagePreview(conversation) }}
        </span>
      </div>
    </div>

    <!-- 右侧操作区 -->
    <div class="conversation-item__actions">
      <!-- 未读计数 -->
      <div
        v-if="conversation.unreadCount > 0 && !conversation.isMuted"
        class="conversation-item__badge"
      >
        {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
      </div>

      <!-- 免打扰标记 -->
      <div
        v-if="conversation.isMuted && conversation.unreadCount > 0"
        class="conversation-item__muted-badge"
      >
        •
      </div>
    </div>

    <!-- 快捷菜单 -->
    <el-popover
      v-if="showContextMenu"
      placement="right"
      :visible="showMenuPopover"
      trigger="manual"
      :show-arrow="false"
      @update:visible="showMenuPopover = $event"
    >
      <template #default>
        <div class="conversation-item__menu">
          <div class="conversation-item__menu-item" @click="handlePin">
            {{ conversation.pinned ? '取消置顶' : '置顶对话' }}
          </div>
          <div class="conversation-item__menu-item" @click="handleMute">
            {{ conversation.isMuted ? '取消免打扰' : '消息免打扰' }}
          </div>
          <el-divider style="margin: 8px 0" />
          <div class="conversation-item__menu-item" @click="handleMarkRead">
            标记为已读
          </div>
          <div class="conversation-item__menu-item" @click="handleDelete">
            删除对话
          </div>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { Top } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  userStatusMap: {
    type: Object,
    default: () => ({})
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select', 'pin', 'mute', 'mark-read', 'delete'])

const showMenuPopover = ref(false)

// 从 inject 获取的方法
const handleContextMenuClick = () => {
  showMenuPopover.value = !showMenuPopover.value
}

function handleSelect() {
  emit('select', props.conversation.id)
}

function handlePin() {
  emit('pin', props.conversation.id)
  showMenuPopover.value = false
}

function handleMute() {
  emit('mute', props.conversation.id)
  showMenuPopover.value = false
}

function handleMarkRead() {
  emit('mark-read', props.conversation.id)
  showMenuPopover.value = false
}

function handleDelete() {
  ElMessage.confirm('确定要删除这个对话吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      emit('delete', props.conversation.id)
      showMenuPopover.value = false
    })
    .catch(() => {})
}

function showContextMenu(event) {
  handleContextMenuClick()
}

function getAvatarColor(id) {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#845EC2']
  return colors[id % colors.length]
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 今天：显示时间
  if (diff < 86400000) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // 昨天
  if (diff < 172800000) {
    return '昨天'
  }

  // 本周
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  // 更早
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

function getLastMessagePreview(conversation) {
  const msg = conversation.lastMessage
  if (!msg) {
    return conversation.description || '暂无消息'
  }

  let preview = ''
  if (conversation.type === 'group' && msg.senderName) {
    preview = `${msg.senderName}: `
  }

  if (msg.contentType === 'attachment') {
    preview += '[文件]'
  } else if (msg.contentType === 'image') {
    preview += '[图片]'
  } else if (msg.content) {
    preview += msg.content.substring(0, 50)
  } else {
    preview += '[消息]'
  }

  return preview
}
</script>

<style scoped>
.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: var(--chat-list-item-bg, rgba(0, 0, 0, 0.02));
}

.conversation-item:hover {
  background: var(--chat-list-item-hover-bg, rgba(0, 0, 0, 0.05));
}

.conversation-item--active {
  background: var(--chat-list-item-active-bg, #e3f2fd);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 9px;
}

.conversation-item--unread {
  font-weight: 500;
}

.conversation-item--muted {
  opacity: 0.6;
}

.conversation-item--pinned {
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
}

.conversation-item__pin {
  position: absolute;
  top: 2px;
  left: 2px;
  color: #ff9800;
  font-size: 12px;
}

.conversation-item__avatar {
  position: relative;
  flex-shrink: 0;
}

.conversation-item__status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: #ccc;
}

.conversation-item__status--online {
  background: #67c23a;
}

.conversation-item__status--busy {
  background: #f56c6c;
}

.conversation-item__status--away {
  background: #e6a23c;
}

.conversation-item__status--offline {
  background: #909399;
}

.conversation-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-item__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.conversation-item__name {
  flex: 1;
  font-weight: 500;
  color: var(--chat-text-primary, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.conversation-item__type-tag {
  flex-shrink: 0;
}

.conversation-item__time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--chat-text-secondary, #999);
  white-space: nowrap;
}

.conversation-item__preview {
  font-size: 12px;
  color: var(--chat-text-secondary, #999);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.conversation-item__mute-icon {
  flex-shrink: 0;
}

.conversation-item__preview-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.conversation-item__badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--el-color-danger, #f56c6c);
  color: white;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-item__muted-badge {
  font-size: 20px;
  line-height: 1;
  color: var(--el-color-info);
  opacity: 0.6;
}

.conversation-item__menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
}

.conversation-item__menu-item {
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.conversation-item__menu-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.conversation-item__menu-item:active {
  background: rgba(0, 0, 0, 0.1);
}
</style>
