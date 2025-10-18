<template>
  <article
    class="chat-room-card"
    :class="{ 'is-joined': room.isJoined }"
    @click="handleCardClick"
  >
    <header class="chat-room-card__header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-avatar :size="54" :src="room.avatar">
          {{ room.name.slice(0, 2) }}
        </el-avatar>
        <div class="chat-room-card__title">
          <span>{{ room.name }}</span>
          <span>
            {{ room.categoryLabel }} · {{ room.memberCount }} / {{ room.maxMembers }}
          </span>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span v-if="room.isFeatured" class="chat-badge chat-badge--hot">精选</span>
        <span
          v-if="room.isJoined"
          class="chat-badge"
          style="background: var(--chat-success);"
        >
          已加入
        </span>
        <span v-if="room.status === 'invite-only'" class="chat-badge chat-badge--locked">受邀</span>
        <span v-else class="chat-tag">
          <span class="chat-tag__dot" />
          {{ typeLabel }}
        </span>
      </div>
    </header>

    <p class="chat-room-card__description">
      {{ room.description }}
    </p>

    <div v-if="ownerName" class="chat-room-card__owner">
      <el-icon><User /></el-icon>
      <span>由 {{ ownerName }} 创建</span>
    </div>

    <div class="chat-room-card__activity">
      <div class="chat-progress" aria-hidden="true">
        <div class="chat-progress__bar" :style="{ width: activityPercent + '%' }" />
      </div>
      <span>活跃指数 {{ activityPercent }} · 最近活跃 {{ lastActiveLabel }}</span>
    </div>

    <div v-if="lastMessageSnippet" class="chat-room-card__last-message">
      <el-icon><ChatLineRound /></el-icon>
      <span>{{ lastMessageSnippet }}</span>
    </div>

    <div class="chat-room-card__meta">
      <span>
        <el-icon><UserFilled /></el-icon>
        在线 {{ room.onlineCount ?? room.memberCount }} 人
      </span>
      <span>
        <el-icon><Clock /></el-icon>
        更新于 {{ updatedLabel }}
      </span>
    </div>

    <div v-if="room.tags?.length" class="chat-room-card__tags">
      <span v-for="tag in room.tags" :key="tag" class="chat-tag">
        <span class="chat-tag__dot" />
        {{ tag }}
      </span>
    </div>

    <footer class="chat-room-card__footer">
      <el-button
        v-if="!room.isJoined"
        type="primary"
        size="large"
        :loading="joining"
        @click.stop="emit('join', room)"
      >
        立即加入
      </el-button>
      <el-button
        v-else
        type="success"
        size="large"
        @click.stop="emit('enter', room)"
      >
        进入聊天室
      </el-button>
      <el-button
        text
        size="large"
        @click.stop="emit('preview', room)"
      >
        预览
      </el-button>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { ChatLineRound, Clock, User, UserFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  joining: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['join', 'enter', 'preview'])

const handleCardClick = () => {
  if (props.room.isJoined) {
    emit('enter', props.room)
  } else {
    emit('preview', props.room)
  }
}

const typeLabel = computed(() => {
  switch (props.room.type) {
    case 'public':
      return '公开'
    case 'group':
      return '群组'
    case 'private':
      return '私密'
    default:
      return '聊天室'
  }
})

const ownerName = computed(() => props.room.ownerName || props.room.owner?.username || props.room.owner?.name)

const activityPercent = computed(() => {
  if (props.room.activityScore) {
    return Math.min(100, Math.round(props.room.activityScore))
  }
  if (!props.room.maxMembers) return 0
  return Math.min(100, Math.round((props.room.memberCount / props.room.maxMembers) * 100))
})

const lastActiveLabel = computed(() => {
  const value = props.room.lastMessageAt || props.room.updatedAt || props.room.updated_at
  if (!value) return '未知'
  const date = dayjs(value)
  if (!date.isValid()) return '未知'
  const diffHours = dayjs().diff(date, 'hour')
  if (diffHours < 1) return '1小时内'
  if (diffHours < 24) return `${diffHours} 小时前`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} 天前`
  return date.format('MM-DD')
})

const updatedLabel = computed(() => {
  const value = props.room.updatedAt || props.room.updated_at || props.room.createdAt
  if (!value) return '刚刚'
  const date = dayjs(value)
  return date.isValid() ? date.fromNow?.() || date.format('MM-DD') : '刚刚'
})

const lastMessageSnippet = computed(() => {
  const content = props.room.lastMessage?.content || props.room.lastMessage
  if (!content) return ''
  if (content.length <= 36) return content
  return `${content.slice(0, 36)}...`
})
</script>
