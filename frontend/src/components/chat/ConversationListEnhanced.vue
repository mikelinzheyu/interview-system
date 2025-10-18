<template>
  <div class="conversation-list">
    <!-- 头部：搜索和快速操作 -->
    <div class="conversation-list__header">
      <div class="conversation-list__search">
        <el-input
          v-model="searchQuery"
          placeholder="搜索对话..."
          clearable
          :prefix-icon="Search"
          @input="handleSearch"
        >
          <template #suffix>
            <el-icon v-if="searchQuery" class="is-loading">
              <Loading />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div class="conversation-list__actions">
        <el-button
          v-if="conversations.length > 0"
          circle
          text
          type="primary"
          :icon="Plus"
          @click="$emit('create')"
        />
      </div>
    </div>

    <!-- 过滤标签 -->
    <div v-if="showFilters" class="conversation-list__filters">
      <el-tag
        v-for="filter in activeFilters"
        :key="filter"
        closable
        @close="removeFilter(filter)"
        effect="light"
      >
        {{ filterLabels[filter] || filter }}
      </el-tag>
    </div>

    <!-- 选项卡：全部 / 未读 / 星标 -->
    <div class="conversation-list__tabs">
      <div
        v-for="tab in conversationTabs"
        :key="tab.key"
        class="conversation-list__tab"
        :class="{ 'conversation-list__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="conversation-list__tab-count">
          {{ tab.count }}
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-if="loading" :rows="5" animated />

    <!-- 空状态 -->
    <div v-else-if="filteredConversations.length === 0" class="conversation-list__empty">
      <el-empty
        :description="searchQuery ? '没有找到匹配的对话' : '暂无对话'"
        :image-size="60"
      />
    </div>

    <!-- 置顶对话 -->
    <div v-if="pinnedConversations.length > 0" class="conversation-list__section">
      <div class="conversation-list__section-title">置顶</div>
      <conversation-list-item
        v-for="conversation in pinnedConversations"
        :key="`pinned-${conversation.id}`"
        :conversation="conversation"
        :is-active="conversation.id === activeConversationId"
        :user-status-map="userStatusMap"
        :show-online-status="showOnlineStatus"
        @select="handleConversationSelect"
        @pin="handlePin"
        @mute="handleMute"
        @mark-read="handleMarkRead"
        @delete="handleDeleteConversation"
      />
    </div>

    <!-- 普通对话列表 -->
    <div class="conversation-list__section">
      <div
        v-if="pinnedConversations.length > 0"
        class="conversation-list__section-title"
      >
        其他
      </div>
      <virtual-list
        v-slot="{ item }"
        :items="normalConversations"
        :item-size="72"
        :height="listHeight"
        class="conversation-list__virtual"
      >
        <conversation-list-item
          :key="item.id"
          :conversation="item"
          :is-active="item.id === activeConversationId"
          :user-status-map="userStatusMap"
          :show-online-status="showOnlineStatus"
          @select="handleConversationSelect"
          @pin="handlePin"
          @mute="handleMute"
          @mark-read="handleMarkRead"
          @delete="handleDeleteConversation"
        />
      </virtual-list>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Search, Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ConversationListItem from './ConversationListItem.vue'
import VirtualList from './VirtualList.vue'

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  activeConversationId: {
    type: [String, Number],
    default: null
  },
  loading: {
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

const emit = defineEmits([
  'select',
  'create',
  'pin',
  'mute',
  'mark-read',
  'delete',
  'search'
])

const searchQuery = ref('')
const activeTab = ref('all')
const listHeight = ref(600)
const activeFilters = ref([])
const searchTimeout = ref(null)

const conversationTabs = computed(() => [
  {
    key: 'all',
    label: '全部',
    count: props.conversations.length
  },
  {
    key: 'unread',
    label: '未读',
    count: props.conversations.filter((c) => c.unreadCount > 0).length
  },
  {
    key: 'pinned',
    label: '星标',
    count: props.conversations.filter((c) => c.pinned).length
  }
])

const filteredConversations = computed(() => {
  let result = [...props.conversations]

  // 按标签页过滤
  if (activeTab.value === 'unread') {
    result = result.filter((c) => c.unreadCount > 0)
  } else if (activeTab.value === 'pinned') {
    result = result.filter((c) => c.pinned)
  }

  // 按搜索查询过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(query)
      const matchPreview = c.lastMessage?.content?.toLowerCase().includes(query)
      return matchName || matchPreview
    })
  }

  // 按活跃度排序：置顶 → 未读 → 最后活跃时间
  result.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1
    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  })

  return result
})

const pinnedConversations = computed(() =>
  filteredConversations.value.filter((c) => c.pinned)
)

const normalConversations = computed(() =>
  filteredConversations.value.filter((c) => !c.pinned)
)

const showFilters = computed(() => activeFilters.value.length > 0)

const filterLabels = {
  unread: '未读',
  muted: '免打扰',
  archived: '已存档'
}

function handleSearch(value) {
  // 防抖
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    emit('search', value)
  }, 300)
}

function removeFilter(filter) {
  activeFilters.value = activeFilters.value.filter((f) => f !== filter)
}

function handleConversationSelect(id) {
  emit('select', id)
}

function handlePin(id) {
  emit('pin', id)
  ElMessage.success('置顶成功')
}

function handleMute(id) {
  emit('mute', id)
  ElMessage.success('设置成功')
}

function handleMarkRead(id) {
  emit('mark-read', id)
}

function handleDeleteConversation(id) {
  emit('delete', id)
  ElMessage.success('已删除对话')
}

function updateListHeight() {
  const container = document.querySelector('.conversation-list')
  if (container) {
    // 计算可用高度：总高度 - 头部 - 标签页
    listHeight.value =
      container.clientHeight - 60 - 40
  }
}

onMounted(() => {
  updateListHeight()
  window.addEventListener('resize', updateListHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateListHeight)
})

watch(
  () => props.conversations.length,
  () => {
    updateListHeight()
  }
)
</script>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  padding: 12px;
}

.conversation-list__header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.conversation-list__search {
  flex: 1;
}

.conversation-list__actions {
  display: flex;
  gap: 4px;
}

.conversation-list__filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 0 4px;
}

.conversation-list__tabs {
  display: flex;
  gap: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0 4px;
  margin-bottom: 8px;
}

.conversation-list__tab {
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
  color: var(--chat-text-secondary, #999);
  transition: all 0.2s ease;
  position: relative;
}

.conversation-list__tab:hover {
  color: var(--el-color-primary);
}

.conversation-list__tab--active {
  color: var(--el-color-primary);
  font-weight: 600;
}

.conversation-list__tab--active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--el-color-primary);
}

.conversation-list__tab-count {
  margin-left: 4px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.conversation-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--chat-text-secondary);
}

.conversation-list__section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-list__section-title {
  font-size: 12px;
  color: var(--chat-text-secondary, #999);
  font-weight: 600;
  padding: 8px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conversation-list__virtual {
  flex: 1;
  overflow-y: auto;
}
</style>
