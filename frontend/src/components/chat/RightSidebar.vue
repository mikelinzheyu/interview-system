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
        @click="handleMemberClick(member)"
      >
        <div class="member-avatar-wrapper">
          <el-avatar :size="32" :src="member.avatar">
            {{ member.name?.charAt(0) || '?' }}
          </el-avatar>
          <!-- 用户状态指示器 -->
          <UserStatusIndicator
            :status="getUserStatus(member.userId)"
            class="status-indicator"
          />
        </div>
        <div class="member-info">
          <div class="member-name">{{ member.name }}</div>
          <div class="member-status">{{ getStatusLabel(member.userId) }}</div>
        </div>
        <div v-if="member.role === 'owner'" class="owner-badge">群主</div>
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
        <span class="label">在线人数</span>
        <span class="value">{{ onlineCount }} 人</span>
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

  <!-- 用户资料卡 -->
  <UserProfileCard
    v-if="selectedUser"
    :visible="profileCardVisible"
    :user="selectedUser"
    :primary-color="'#5c6af0'"
    @update:visible="profileCardVisible = $event"
    @close="profileCardVisible = false"
    @send-message="$emit('send-message', $event)"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import UserStatusIndicator from './UserPresence/UserStatusIndicator.vue'
import UserProfileCard from './UserPresence/UserProfileCard.vue'
import { useUserPresenceStore } from '@/stores/userPresence'

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

const emit = defineEmits(['member-click', 'close', 'send-message'])

const presenceStore = useUserPresenceStore()

const activeTab = ref('members')
const tabs = ['members', 'info']
const profileCardVisible = ref(false)
const selectedUser = ref(null)

const onlineCount = computed(() => {
  return presenceStore.onlineUsers.length
})

function handleMemberClick(member) {
  selectedUser.value = member
  profileCardVisible.value = true
  emit('member-click', member)
}

function getUserStatus(userId) {
  const status = presenceStore.getUserStatus(userId)
  return status.status || 'offline'
}

function getStatusLabel(userId) {
  const status = presenceStore.getUserStatus(userId)
  const config = presenceStore.getStatusConfig(status.status)
  return config.label
}

function formatTime(timestamp) {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.right-sidebar {
  width: 280px;
  background: var(--color-bg, #ffffff);
  border-left: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--color-text, #333);
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  padding: 0 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
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
  background: var(--color-bg-secondary, #f5f5f5);
}

.member-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--color-bg, #ffffff);
  border-radius: 50%;
  padding: 1px;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-status {
  font-size: 11px;
  color: var(--color-text-secondary, #999);
}

.owner-badge {
  font-size: 10px;
  background: #ffd666;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
}

.group-details {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  font-weight: 600;
}

.value {
  font-size: 13px;
  color: var(--color-text, #333);
  word-break: break-word;
}
</style>
