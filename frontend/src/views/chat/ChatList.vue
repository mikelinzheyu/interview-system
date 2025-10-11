<template>
  <div class="chat-list-container">
    <el-card class="header-card">
      <div class="header">
        <h2>💬 聊天室</h2>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建聊天室
        </el-button>
      </div>
      <el-divider />
      <div class="stats">
        <el-statistic title="在线用户" :value="onlineUserCount" />
        <el-statistic title="聊天室总数" :value="rooms.length" />
        <el-statistic title="我加入的" :value="joinedRoomCount" />
      </div>
    </el-card>

    <el-row :gutter="20" class="room-grid">
      <el-col
        v-for="room in rooms"
        :key="room.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <el-card
          class="room-card"
          :class="{ 'joined': room.isJoined }"
          shadow="hover"
          @click="enterRoom(room)"
        >
          <div class="room-header">
            <el-avatar :size="60" :src="room.avatar">
              {{ room.name.substring(0, 2) }}
            </el-avatar>
            <el-tag
              v-if="room.type === 'public'"
              type="success"
              size="small"
            >
              公开
            </el-tag>
            <el-tag
              v-else-if="room.type === 'group'"
              type="warning"
              size="small"
            >
              群组
            </el-tag>
            <el-tag
              v-else
              type="info"
              size="small"
            >
              私聊
            </el-tag>
          </div>

          <h3 class="room-name">{{ room.name }}</h3>
          <p class="room-description">{{ room.description }}</p>

          <div class="room-stats">
            <span>
              <el-icon><User /></el-icon>
              {{ room.memberCount }} / {{ room.maxMembers }}
            </span>
            <span v-if="room.isJoined" class="joined-badge">
              <el-icon><Check /></el-icon>
              已加入
            </span>
          </div>

          <el-button
            v-if="!room.isJoined"
            type="primary"
            size="small"
            class="join-btn"
            @click.stop="handleJoinRoom(room)"
          >
            加入聊天室
          </el-button>
          <el-button
            v-else
            type="success"
            size="small"
            class="enter-btn"
            @click.stop="enterRoom(room)"
          >
            进入聊天
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- 创建聊天室对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建聊天室"
      width="500px"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="聊天室名称" required>
          <el-input
            v-model="createForm.name"
            placeholder="请输入聊天室名称"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="类型" required>
          <el-radio-group v-model="createForm.type">
            <el-radio value="public">公开聊天室</el-radio>
            <el-radio value="group">群组</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入聊天室描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="最大成员数">
          <el-input-number
            v-model="createForm.maxMembers"
            :min="2"
            :max="1000"
            :step="10"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRoom">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, User, Check } from '@element-plus/icons-vue'
import { getChatRooms, createChatRoom, joinChatRoom } from '@/api/chat'
import socketService from '@/utils/socket'

const router = useRouter()

// 数据
const rooms = ref([])
const onlineUserCount = ref(0)
const showCreateDialog = ref(false)

const createForm = ref({
  name: '',
  type: 'group',
  description: '',
  maxMembers: 100
})

// 计算属性
const joinedRoomCount = computed(() => {
  return rooms.value.filter(r => r.isJoined).length
})

// 获取聊天室列表
const fetchRooms = async () => {
  try {
    const response = await getChatRooms()
    rooms.value = response.data
  } catch (error) {
    ElMessage.error('获取聊天室列表失败')
    console.error(error)
  }
}

// 加入聊天室
const handleJoinRoom = async (room) => {
  if (room.memberCount >= room.maxMembers) {
    ElMessage.warning('聊天室已满，无法加入')
    return
  }

  try {
    await joinChatRoom(room.id)
    ElMessage.success(`已加入聊天室：${room.name}`)

    // 更新本地状态
    room.isJoined = true
    room.memberCount++

    // 进入聊天室
    setTimeout(() => {
      enterRoom(room)
    }, 500)
  } catch (error) {
    ElMessage.error('加入聊天室失败')
    console.error(error)
  }
}

// 进入聊天室
const enterRoom = (room) => {
  if (!room.isJoined) {
    ElMessage.warning('请先加入聊天室')
    return
  }

  router.push({
    name: 'ChatRoom',
    params: { roomId: room.id }
  })
}

// 创建聊天室
const handleCreateRoom = async () => {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入聊天室名称')
    return
  }

  try {
    const response = await createChatRoom(createForm.value)
    ElMessage.success('聊天室创建成功')

    // 刷新列表
    await fetchRooms()

    // 关闭对话框
    showCreateDialog.value = false

    // 重置表单
    createForm.value = {
      name: '',
      type: 'group',
      description: '',
      maxMembers: 100
    }

    // 进入新创建的聊天室
    const newRoom = response.data
    setTimeout(() => {
      enterRoom(newRoom)
    }, 500)
  } catch (error) {
    ElMessage.error('创建聊天室失败')
    console.error(error)
  }
}

// 监听在线用户数更新
socketService.on('online-users-updated', (data) => {
  onlineUserCount.value = data.count
})

onMounted(() => {
  fetchRooms()
})
</script>

<style scoped>
.chat-list-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.stats {
  display: flex;
  gap: 40px;
}

.room-grid {
  margin-top: 20px;
}

.room-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.room-card:hover {
  transform: translateY(-5px);
}

.room-card.joined {
  border: 2px solid #67c23a;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.room-name {
  font-size: 18px;
  margin: 10px 0;
  font-weight: bold;
}

.room-description {
  color: #909399;
  font-size: 14px;
  margin: 10px 0;
  min-height: 40px;
}

.room-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  font-size: 14px;
  color: #606266;
}

.joined-badge {
  color: #67c23a;
  font-weight: bold;
}

.join-btn,
.enter-btn {
  width: 100%;
  margin-top: 10px;
}
</style>
