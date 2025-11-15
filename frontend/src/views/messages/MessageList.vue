<template>
  <div class="messages-page">
    <!-- 页面头 -->
    <el-page-header title="返回" @back="$router.back()">
      <template #content>
        <span class="page-title">私信</span>
      </template>
    </el-page-header>

    <el-container class="messages-container">
      <!-- 左侧：对话列表 -->
      <el-aside class="conversations-sidebar">
        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            v-model="searchText"
            placeholder="搜索对话..."
            clearable
            :prefix-icon="Search"
          />
        </div>

        <!-- 对话列表 -->
        <div class="conversations-list">
          <div v-if="loading" class="loading">
            <el-skeleton :rows="3" animated />
          </div>

          <div v-else-if="filteredConversations.length === 0" class="empty">
            <el-empty description="暂无对话" />
          </div>

          <ConversationItem
            v-for="conversation in filteredConversations"
            v-else
            :key="conversation.id"
            :conversation="conversation"
            :active="currentConversationId === conversation.id"
            @click="selectConversation"
          />
        </div>
      </el-aside>

      <!-- 右侧：聊天窗口 -->
      <el-main class="chat-main">
        <div v-if="!selectedConversation" class="no-selection">
          <el-empty description="选择一个对话开始聊天" />
        </div>

        <ChatWindow
          v-else
          :key="selectedConversation.id"
          :conversation-id="selectedConversation.id"
          @close="selectedConversation = null"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useMessagingStore } from '@/stores/messagingStore'
import ChatWindow from '@/components/messaging/ChatWindow.vue'
import ConversationItem from '@/components/messaging/ConversationItem.vue'

const messagingStore = useMessagingStore()
const searchText = ref('')
const selectedConversation = ref(null)

const loading = computed(() => messagingStore.loading)
const conversations = computed(() => messagingStore.conversations)
const currentConversationId = computed(() => selectedConversation.value?.id)

// 过滤对话列表
const filteredConversations = computed(() => {
  if (!searchText.value) {
    return conversations.value
  }

  const keyword = searchText.value.toLowerCase()
  return conversations.value.filter(conv =>
    conv.otherUser?.name?.toLowerCase().includes(keyword) ||
    conv.lastMessage?.toLowerCase().includes(keyword)
  )
})

// 初始化加载对话列表
onMounted(() => {
  loadConversations()
})

const loadConversations = async () => {
  try {
    await messagingStore.fetchConversations()
  } catch (error) {
    console.error('[MessageList] Load conversations error:', error)
  }
}

const selectConversation = (conversation) => {
  selectedConversation.value = conversation
}
</script>

<style scoped lang="scss">
.messages-page {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .page-title {
    font-size: 18px;
    font-weight: 600;
  }

  .messages-container {
    flex: 1;
    overflow: hidden;

    :deep(.el-container) {
      height: 100%;
    }

    .conversations-sidebar {
      width: 300px;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .search-box {
        padding: 12px;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;
      }

      .conversations-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 3px;

          &:hover {
            background: #b3b3b3;
          }
        }

        .loading,
        .empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .chat-main {
      flex: 1;
      display: flex;
      background: #f5f7fa;

      .no-selection {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}
</style>
