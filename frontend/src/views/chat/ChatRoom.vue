<template>
  <div class="chat-room-container">
    <el-container>
      <!-- 左侧：聊天区域 -->
      <el-main class="chat-main">
        <!-- 顶部：房间信息 -->
        <el-card class="room-header" shadow="never">
          <div class="header-content">
            <div class="room-info">
              <el-avatar :size="40" :src="room.avatar">
                {{ room.name?.substring(0, 2) }}
              </el-avatar>
              <div class="room-details">
                <h3>{{ room.name }}</h3>
                <p>{{ room.memberCount }} 位成员在线</p>
              </div>
            </div>
            <div class="header-actions">
              <el-button @click="showMembersDrawer = true">
                <el-icon><User /></el-icon>
                成员列表
              </el-button>
              <el-button @click="handleLeaveRoom">
                <el-icon><Close /></el-icon>
                离开聊天室
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else>
            <el-empty
              v-if="messages.length === 0"
              description="暂无消息，开始聊天吧！"
            />

            <div
              v-for="message in messages"
              :key="message.id"
              class="message-item"
              :class="{ 'own-message': message.senderId === currentUserId }"
            >
              <el-avatar
                :size="40"
                :src="message.senderAvatar"
                class="message-avatar"
              >
                {{ message.senderName?.substring(0, 2) }}
              </el-avatar>

              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">{{ message.senderName }}</span>
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
                <div class="message-bubble">
                  {{ message.content }}
                </div>
              </div>
            </div>
          </div>

          <!-- 有人正在输入提示 -->
          <div v-if="typingUsers.length > 0" class="typing-indicator">
            <el-icon class="typing-icon"><Loading /></el-icon>
            {{ typingUsers.join(', ') }} 正在输入...
          </div>
        </div>

        <!-- 底部：输入框 -->
        <div class="message-input-area">
          <el-input
            v-model="messageInput"
            type="textarea"
            :rows="3"
            placeholder="输入消息... (Ctrl+Enter 发送)"
            @keydown.ctrl.enter="handleSendMessage"
            @input="handleTyping"
            maxlength="1000"
            show-word-limit
          />
          <div class="input-actions">
            <el-button type="primary" @click="handleSendMessage">
              <el-icon><Position /></el-icon>
              发送消息
            </el-button>
          </div>
        </div>
      </el-main>

      <!-- 右侧：成员列表抽屉 -->
      <el-drawer
        v-model="showMembersDrawer"
        title="聊天室成员"
        direction="rtl"
        size="300px"
      >
        <div class="members-list">
          <div
            v-for="member in members"
            :key="member.userId"
            class="member-item"
          >
            <el-avatar :size="40" :src="member.avatar">
              {{ member.username?.substring(0, 2) }}
            </el-avatar>
            <div class="member-info">
              <span class="member-name">{{ member.username }}</span>
              <el-tag
                v-if="member.role === 'owner'"
                type="danger"
                size="small"
              >
                房主
              </el-tag>
              <el-tag
                v-else-if="member.role === 'admin'"
                type="warning"
                size="small"
              >
                管理员
              </el-tag>
            </div>
          </div>
        </div>
      </el-drawer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Close, Position, Loading } from '@element-plus/icons-vue'
import {
  getChatRoomDetail,
  getChatMessages,
  leaveChatRoom
} from '@/api/chat'
import socketService from '@/utils/socket'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 数据
const roomId = ref(parseInt(route.params.roomId))
const room = ref({})
const messages = ref([])
const members = ref([])
const messageInput = ref('')
const loading = ref(true)
const showMembersDrawer = ref(false)
const messageListRef = ref(null)
const typingUsers = ref([])
const typingTimeout = ref(null)

const currentUserId = computed(() => userStore.user?.id || 1)

// 获取房间详情
const fetchRoomDetail = async () => {
  try {
    const response = await getChatRoomDetail(roomId.value)
    room.value = response.data.room
    members.value = response.data.members
  } catch (error) {
    ElMessage.error('获取房间信息失败')
    console.error(error)
  }
}

// 获取历史消息
const fetchMessages = async () => {
  loading.value = true
  try {
    const response = await getChatMessages(roomId.value, {
      page: 1,
      size: 50
    })
    messages.value = response.data.items
    await nextTick()
    scrollToBottom()
  } catch (error) {
    ElMessage.error('获取消息历史失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 发送消息
const handleSendMessage = () => {
  const content = messageInput.value.trim()

  if (!content) {
    ElMessage.warning('消息内容不能为空')
    return
  }

  if (content.length > 1000) {
    ElMessage.warning('消息内容过长')
    return
  }

  // 通过 WebSocket 发送消息
  socketService.sendMessage(roomId.value, content)

  // 清空输入框
  messageInput.value = ''
}

// 处理输入状态
const handleTyping = () => {
  // 发送输入状态
  socketService.sendTypingStatus(roomId.value, true)

  // 3秒后取消输入状态
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  typingTimeout.value = setTimeout(() => {
    socketService.sendTypingStatus(roomId.value, false)
  }, 3000)
}

// 离开聊天室
const handleLeaveRoom = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要离开这个聊天室吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await leaveChatRoom(roomId.value)
    socketService.leaveRoom(roomId.value)

    ElMessage.success('已离开聊天室')
    router.push({ name: 'ChatList' })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('离开聊天室失败')
      console.error(error)
    }
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// WebSocket 事件监听
const setupSocketListeners = () => {
  // 监听新消息
  socketService.onNewMessage((message) => {
    if (message.roomId === roomId.value) {
      messages.value.push(message)
      nextTick(() => {
        scrollToBottom()
      })
    }
  })

  // 监听用户加入
  socketService.onUserJoined((data) => {
    if (data.roomId === roomId.value) {
      ElMessage.info(`用户 ${data.userId} 加入了聊天室`)
      // 刷新成员列表
      fetchRoomDetail()
    }
  })

  // 监听用户离开
  socketService.onUserLeft((data) => {
    if (data.roomId === roomId.value) {
      ElMessage.info(`用户 ${data.userId} 离开了聊天室`)
      // 刷新成员列表
      fetchRoomDetail()
    }
  })

  // 监听输入状态
  socketService.onUserTyping((data) => {
    if (data.roomId === roomId.value && data.userId !== currentUserId.value) {
      if (data.isTyping) {
        if (!typingUsers.value.includes(`用户${data.userId}`)) {
          typingUsers.value.push(`用户${data.userId}`)
        }
      } else {
        const index = typingUsers.value.indexOf(`用户${data.userId}`)
        if (index > -1) {
          typingUsers.value.splice(index, 1)
        }
      }
    }
  })
}

onMounted(async () => {
  // 加入聊天室
  socketService.joinRoom(roomId.value)

  // 获取数据
  await Promise.all([
    fetchRoomDetail(),
    fetchMessages()
  ])

  // 设置 WebSocket 监听
  setupSocketListeners()
})

onUnmounted(() => {
  // 离开聊天室
  socketService.leaveRoom(roomId.value)

  // 清除定时器
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
})
</script>

<style scoped>
.chat-room-container {
  height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

.chat-main {
  display: flex;
  flex-direction: column;
  padding: 0;
  height: 100%;
}

.room-header {
  border-radius: 0;
  border-bottom: 1px solid #dcdfe6;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.room-details h3 {
  margin: 0;
  font-size: 18px;
}

.room-details p {
  margin: 5px 0 0;
  font-size: 14px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fff;
}

.loading-container {
  padding: 20px;
}

.message-item {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 60%;
}

.own-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-header {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
  color: #909399;
}

.sender-name {
  font-weight: bold;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 10px;
  background-color: #f0f2f5;
  word-break: break-word;
  line-height: 1.6;
}

.own-message .message-bubble {
  background-color: #409eff;
  color: #fff;
}

.typing-indicator {
  color: #909399;
  font-size: 14px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.typing-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.message-input-area {
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #dcdfe6;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.members-list {
  padding: 10px 0;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.member-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-name {
  font-weight: 500;
}
</style>
