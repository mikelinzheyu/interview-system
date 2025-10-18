<template>
  <div class="conversation-list">
    <div class="conversation-list__header">
      <h2>会话列表</h2>
      <slot name="actions" />
    </div>

    <el-skeleton v-if="loading" animated :count="5" class="conversation-list__skeleton" />

    <el-empty v-else-if="!conversations.length" description="暂无会话，快去创建一个吧" />

    <div v-else class="conversation-list__items">
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        type="button"
        class="conversation-list__item"
        :class="{
          'conversation-list__item--active': conversation.id === activeId,
          'conversation-list__item--muted': conversation.isMuted,
          'conversation-list__item--unread': conversation.unreadCount > 0
        }"
        @click="$emit('select', conversation.id)"
      >
        <!-- Active indicator bar -->
        <div v-if="conversation.id === activeId" class="conversation-list__indicator" />

        <div class="conversation-list__avatar">
          <el-avatar :size="42" :src="conversation.avatar">
            {{ conversation.name?.slice(0, 1) || '?' }}
          </el-avatar>
          <span v-if="conversation.unreadCount" class="conversation-list__badge">
            {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
          </span>
        </div>

        <div class="conversation-list__meta">
          <div class="conversation-list__title-row">
            <span class="conversation-list__name" :class="{ 'font-weight-bold': conversation.unreadCount > 0 }">
              {{ conversation.name }}
            </span>
            <span class="conversation-list__time">
              {{ formatTime(conversation.lastMessageAt) }}
            </span>
          </div>
          <p v-if="conversation.lastMessage" class="conversation-list__preview">
            <span v-if="conversation.lastMessage.senderName && conversation.type === 'group'" class="conversation-list__sender">
              {{ conversation.lastMessage.senderName }}:
            </span>
            <span>{{ truncateMessage(conversation.lastMessage.content) }}</span>
          </p>
          <p v-else class="conversation-list__preview conversation-list__preview--empty">
            {{ conversation.description || '暂无消息' }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'

defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeId: {
    type: [String, Number],
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select'])

function formatTime(value) {
  if (!value) return ''
  const target = dayjs(value)
  if (!target.isValid()) return ''
  const now = dayjs()
  if (now.diff(target, 'day') === 0) {
    return target.format('HH:mm')
  }
  if (now.diff(target, 'day') < 7) {
    return target.format('ddd')
  }
  return target.format('MM-DD')
}

function truncateMessage(content, maxLength = 50) {
  if (!content) return ''
  // Remove newlines and extra spaces
  const cleaned = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  // Truncate and add ellipsis if needed
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned
}
</script>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.conversation-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
}

.conversation-list__header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2a55;
}

.conversation-list__items {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 8px 16px;
}

.conversation-list__item {
  display: flex;
  gap: 12px;
  align-items: center;
  border: none;
  background: transparent;
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease, transform 0.2s ease;
  position: relative;
}

.conversation-list__item:hover {
  background: rgba(64, 158, 255, 0.08);
  transform: translateX(4px);
}

.conversation-list__item--active {
  background: rgba(64, 158, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.4);
}

.conversation-list__item--unread {
  background: rgba(64, 158, 255, 0.08);
}

.conversation-list__item--unread:hover {
  background: rgba(64, 158, 255, 0.12);
}

.conversation-list__item--muted .conversation-list__name {
  color: #909399;
}

/* Active indicator bar */
.conversation-list__indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #409eff 0%, #5c6eff 100%);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}

.conversation-list__avatar {
  position: relative;
}

.conversation-list__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 22px;
  padding: 0 6px;
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff6f91, #ffc371);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 111, 145, 0.35);
}

.conversation-list__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation-list__title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.conversation-list__name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-list__time {
  font-size: 12px;
  color: #a0a5bd;
}

.conversation-list__preview {
  margin: 0;
  font-size: 13px;
  color: #6b6f85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  display: flex;
  gap: 4px;
}

.conversation-list__preview--empty {
  color: #a0a5bd;
  font-style: italic;
}

.conversation-list__sender {
  font-weight: 600;
  color: #409eff;
  flex-shrink: 0;
}

.font-weight-bold {
  font-weight: 700;
}

.conversation-list__skeleton {
  padding: 0 16px 16px;
}
</style>
