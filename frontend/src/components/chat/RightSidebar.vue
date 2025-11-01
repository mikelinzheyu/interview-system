<template>
  <div class="right-sidebar">
    <!-- 选项卡 -->
    <div class="sidebar-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="tab-btn"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab === 'members' ? '成员' : '信息' }}
      </button>
    </div>

    <!-- 成员列表 -->
    <div v-if="activeTab === 'members'" class="members-list">
      <div
        v-for="member in members"
        :key="member.userId"
        class="member-item"
        @click="$emit('member-click', member)"
      >
        <el-avatar :size="32" :src="member.avatar">
          {{ member.name?.charAt(0) || '?' }}
        </el-avatar>
        <div class="member-info">
          <div class="member-name">{{ member.name }}</div>
          <div class="member-role">{{ member.role === 'owner' ? '群主' : '成员' }}</div>
        </div>
        <div v-if="member.isOnline" class="online-dot" />
      </div>
    </div>

    <!-- 群信息 -->
    <div v-else class="group-details">
      <div class="detail-item">
        <span class="label">群名称</span>
        <span class="value">{{ room.name }}</span>
      </div>
      <div class="detail-item">
        <span class="label">群成员</span>
        <span class="value">{{ room.memberCount }} 人</span>
      </div>
      <div class="detail-item">
        <span class="label">群公告</span>
        <span class="value">{{ room.announcement }}</span>
      </div>
      <div class="detail-item">
        <span class="label">创建时间</span>
        <span class="value">{{ formatTime(room.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  room: {
    type: Object,
    default: () => ({})
  },
  members: {
    type: Array,
    default: () => []
  }
})

defineEmits(['member-click', 'close'])

const activeTab = ref('members')
const tabs = ['members', 'info']

function formatTime(timestamp) {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.right-sidebar {
  width: 280px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #5c6af0;
  border-bottom-color: #5c6af0;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f5f5f5;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.member-role {
  font-size: 11px;
  color: #999;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  border: 2px solid rgba(103, 194, 58, 0.3);
  box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 6px rgba(103, 194, 58, 0.6), 0 0 0 0 rgba(103, 194, 58, 0.4);
  }
  50% {
    box-shadow: 0 0 6px rgba(103, 194, 58, 0.6), 0 0 8px 4px rgba(103, 194, 58, 0.1);
  }
}

.group-details {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #999;
  font-weight: 600;
}

.value {
  font-size: 13px;
  color: #333;
}
</style>
