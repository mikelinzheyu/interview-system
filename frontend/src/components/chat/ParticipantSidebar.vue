<template>
  <div class="participant-sidebar">
    <div class="participant-sidebar__header">
      <h3>成员信息</h3>
      <span class="participant-sidebar__count">{{ participants.length }} 人</span>
    </div>

    <el-skeleton v-if="loading" animated :count="4" />

    <el-empty v-else-if="!participants.length" description="暂无成员数据" />

    <ul v-else class="participant-sidebar__list">
      <li v-for="member in participants" :key="member.userId" class="participant-sidebar__item">
        <el-avatar :size="40" :src="member.avatar">
          {{ member.username?.slice(0, 1) || '?' }}
        </el-avatar>
        <div class="participant-sidebar__meta">
          <div class="participant-sidebar__name-row">
            <span class="participant-sidebar__name">{{ member.username }}</span>
            <el-tag v-if="member.role !== 'member'" size="small" :type="member.role === 'owner' ? 'danger' : 'warning'">
              {{ roleLabel(member.role) }}
            </el-tag>
          </div>
          <div class="participant-sidebar__status">
            <span class="participant-sidebar__status-dot" :class="`is-${member.status}`" />
            <span>{{ statusLabel(member.status) }}</span>
            <span v-if="member.status !== 'online'" class="participant-sidebar__last-seen">· {{ formatLastSeen(member.lastSeen) }}</span>
            <span v-if="member.title" class="participant-sidebar__title">· {{ member.title }}</span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'

defineProps({
  participants: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

function roleLabel(role) {
  switch (role) {
    case 'owner':
      return '房主'
    case 'admin':
      return '管理员'
    default:
      return '成员'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'online':
      return '在线'
    case 'busy':
      return '忙碌'
    case 'away':
      return '离开'
    default:
      return '离线'
  }
}

function formatLastSeen(value) {
  if (!value) return '刚刚'
  const target = dayjs(value)
  if (!target.isValid()) return '刚刚'
  const now = dayjs()
  if (target.isAfter(now.subtract(5, 'minute'))) return '刚刚'
  if (target.isAfter(now.subtract(1, 'hour'))) {
    const minutes = Math.max(1, now.diff(target, 'minute'))
    return `${minutes} 分钟前`
  }
  if (target.isAfter(now.subtract(1, 'day'))) {
    const hours = Math.max(1, now.diff(target, 'hour'))
    return `${hours} 小时前`
  }
  if (target.isAfter(now.subtract(7, 'day'))) {
    const days = Math.max(1, now.diff(target, 'day'))
    return `${days} 天前`
  }
  return target.format('YYYY-MM-DD HH:mm')
}

</script>

<style scoped>
.participant-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 24px;
}

.participant-sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.participant-sidebar__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #273057;
}

.participant-sidebar__count {
  font-size: 13px;
  color: #8a8fb0;
}

.participant-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}

.participant-sidebar__item {
  display: flex;
  gap: 12px;
  align-items: center;
}

.participant-sidebar__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.participant-sidebar__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-sidebar__name {
  font-weight: 600;
  font-size: 15px;
  color: #2f365b;
}

.participant-sidebar__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #7a7f9d;
}

.participant-sidebar__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4d8;
}

.participant-sidebar__status-dot.is-online {
  background: #67c23a;
}
.participant-sidebar__status-dot.is-busy {
  background: #e6a23c;
}
.participant-sidebar__status-dot.is-away {
  background: #909399;
}


.participant-sidebar__last-seen {
  color: #9aa0bc;
}
.participant-sidebar__title {
  color: #a2a7c3;
}
</style>
