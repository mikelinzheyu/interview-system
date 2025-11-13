<template>
  <div class="conversation-list-sidebar">
    <!-- 搜索栏 -->
    <div class="search-section">
      <el-input
        v-model="searchText"
        placeholder="搜索对话..."
        prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
    </div>

    <!-- 频道标签 -->
    <div class="channels-section">
      <div class="section-header">
        <span class="section-title">频道</span>
        <el-button text size="small" @click="showNewChannelDialog = true">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <div class="channels-list">
        <div
          v-for="channel in channels"
          :key="channel.id"
          class="channel-item"
          :class="{ active: activeChannelId === channel.id }"
          @click="selectChannel(channel)"
        >
          <span class="channel-icon">#</span>
          <span class="channel-name">{{ channel.name }}</span>
          <span v-if="channel.unreadCount" class="unread-badge">{{ channel.unreadCount }}</span>
        </div>
      </div>
    </div>

    <!-- 直接消息 -->
    <div class="direct-messages-section">
      <div class="section-header">
        <span class="section-title">直接消息</span>
        <el-button text size="small" @click="showNewDMDialog = true">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <div class="dm-list">
        <div
          v-for="dm in filteredDMs"
          :key="dm.id"
          class="dm-item"
          :class="{ active: activeDMId === dm.id }"
          @click="selectDM(dm)"
        >
          <el-avatar :size="28" :src="dm.avatar" class="dm-avatar">
            {{ dm.name?.charAt(0) || '?' }}
          </el-avatar>
          <div class="dm-info">
            <span class="dm-name">{{ dm.name }}</span>
            <span v-if="dm.status" class="dm-status" :class="`status-${dm.status}`">
              {{ dm.status }}
            </span>
          </div>
          <span v-if="dm.unreadCount" class="unread-badge">{{ dm.unreadCount }}</span>
        </div>
      </div>
    </div>

    <!-- 创建新频道对话框 -->
    <el-dialog v-model="showNewChannelDialog" title="创建新频道" width="400px">
      <el-form :model="newChannelForm" label-width="80px">
        <el-form-item label="频道名称">
          <el-input v-model="newChannelForm.name" placeholder="输入频道名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newChannelForm.description"
            type="textarea"
            placeholder="输入频道描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewChannelDialog = false">取消</el-button>
        <el-button type="primary" @click="createNewChannel">创建</el-button>
      </template>
    </el-dialog>

    <!-- 创建新DM对话框 -->
    <el-dialog v-model="showNewDMDialog" title="开始新的对话" width="400px">
      <el-select
        v-model="selectedUser"
        placeholder="选择要聊天的用户"
        filterable
      >
        <el-option
          v-for="user in availableUsers"
          :key="user.id"
          :label="user.name"
          :value="user.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showNewDMDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedUser" @click="createNewDM">
          开始对话
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeConversationId: {
    type: [String, Number],
    default: null
  },
  allUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select-conversation', 'create-channel', 'create-dm'])

const searchText = ref('')
const showNewChannelDialog = ref(false)
const showNewDMDialog = ref(false)
const selectedUser = ref(null)

const newChannelForm = ref({
  name: '',
  description: ''
})

// 分离频道和直接消息
const channels = computed(() => {
  return props.conversations.filter(c => c.type === 'channel')
})

const directMessages = computed(() => {
  return props.conversations.filter(c => c.type === 'dm')
})

// 过滤直接消息
const filteredDMs = computed(() => {
  if (!searchText.value) return directMessages.value
  return directMessages.value.filter(dm =>
    dm.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

// 可用用户（排除已有的DM）
const availableUsers = computed(() => {
  const dmUserIds = directMessages.value.map(dm => dm.participantId)
  return props.allUsers.filter(user => !dmUserIds.includes(user.id))
})

const activeChannelId = computed(() => {
  const active = props.conversations.find(c => c.id === props.activeConversationId)
  return active?.type === 'channel' ? active.id : null
})

const activeDMId = computed(() => {
  const active = props.conversations.find(c => c.id === props.activeConversationId)
  return active?.type === 'dm' ? active.id : null
})

function handleSearch(value) {
  // 搜索逻辑
}

function selectChannel(channel) {
  emit('select-conversation', channel.id)
}

function selectDM(dm) {
  emit('select-conversation', dm.id)
}

function createNewChannel() {
  if (!newChannelForm.value.name.trim()) {
    ElMessage.warning('请输入频道名称')
    return
  }
  emit('create-channel', {
    name: newChannelForm.value.name,
    description: newChannelForm.value.description
  })
  newChannelForm.value = { name: '', description: '' }
  showNewChannelDialog.value = false
}

function createNewDM() {
  if (!selectedUser.value) {
    ElMessage.warning('请选择用户')
    return
  }
  emit('create-dm', selectedUser.value)
  selectedUser.value = null
  showNewDMDialog.value = false
}
</script>

<style scoped>
.conversation-list-sidebar {
  width: 280px;
  background: var(--color-bg-secondary, #f9f9f9);
  border-right: 1px solid var(--color-border, #e0e0e0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--color-text, #333);
  height: calc(100vh - 60px);
}

.search-section {
  padding: 12px;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.channels-section,
.direct-messages-section {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--color-border, #e0e0e0);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.channels-list,
.dm-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.channel-item,
.dm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text-secondary, #666);
  white-space: nowrap;
}

.channel-item:hover,
.dm-item:hover {
  background: var(--color-bg-tertiary, #f0f0f0);
  color: var(--color-text, #333);
}

.channel-item.active,
.dm-item.active {
  background: #5c6af0;
  color: white;
  border-radius: 8px;
  margin: 0 8px;
  padding-left: 4px;
  padding-right: 4px;
}

.channel-icon {
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.channel-name,
.dm-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
}

.dm-avatar {
  flex-shrink: 0;
}

.dm-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dm-name {
  font-size: 13px;
  font-weight: 500;
}

.dm-status {
  font-size: 11px;
  color: var(--color-text-tertiary, #999);
}

.dm-status.status-online {
  color: #67c23a;
}

.dm-status.status-away {
  color: #e6a23c;
}

.dm-status.status-busy {
  color: #f56c6c;
}

.unread-badge {
  font-size: 11px;
  background: #f56c6c;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  flex-shrink: 0;
}

.channel-item.active .unread-badge {
  background: rgba(255, 255, 255, 0.3);
}
</style>
