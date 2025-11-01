<template>
  <div class="chat-list-page chat-theme">
    <!-- 返回社区导航 -->
    <div class="chat-list-breadcrumb">
      <el-button text @click="goToCommunity">
        <el-icon><ArrowLeft /></el-icon>
        返回社区
      </el-button>
    </div>

    <chat-list-header
      :stats="stats"
      :search-value="filters.search"
      :loading="loading"
      @update:search="handleSearch"
      @create="openCreateDialog"
    />

    <chat-category-tabs
      :categories="categories"
      :active-key="filters.category"
      @change="handleCategoryChange"
    />

    <div class="chat-list-page__filters">
      <div class="chat-list-page__filters-left">
        <el-switch
          v-model="onlyJoinedModel"
          inline-prompt
          active-text="只看已加入"
        />
        <el-tooltip content="只展示你已加入的聊天室" placement="top">
          <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
      </div>
      <el-button text type="primary" @click="refreshRooms">
        刷新列表
      </el-button>
    </div>

    <el-skeleton v-if="loading" :rows="6" animated />

    <div v-else-if="filteredRooms.length" class="chat-room-grid">
      <chat-room-card
        v-for="room in filteredRooms"
        :key="room.id"
        :room="room"
        :joining="joiningRoomId === room.id"
        @join="handleJoinRoom"
        @enter="enterRoom"
        @preview="openPreview"
      />
    </div>

    <div v-else class="chat-room-empty">
      <div class="chat-room-empty__title">暂时没有符合条件的聊天室</div>
      <p>试着调整搜索关键词或筛选条件，或者创建一个新的聊天室来发起话题。</p>
      <el-button type="primary" size="large" @click="openCreateDialog">
        创建聊天室
      </el-button>
    </div>    <el-dialog
      v-model="showCreateDialog"
      title="创建聊天室"
      width="560px"
      @closed="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="108px"
      >
        <el-form-item prop="name" label="聊天室名称">
          <el-input
            v-model="createForm.name"
            maxlength="30"
            show-word-limit
            placeholder="请输入聊天室名称"
          />
        </el-form-item>
        <el-form-item prop="type" label="类型">
          <el-radio-group v-model="createForm.type">
            <el-radio-button label="public">公开</el-radio-button>
            <el-radio-button label="group">群组</el-radio-button>
            <el-radio-button label="private">私密</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item prop="description" label="介绍">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="简要描述讨论主题，让大家更了解聊天室"
          />
        </el-form-item>
        <el-form-item prop="categoryKey" label="分类">
          <el-select
            v-model="createForm.categoryKey"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入分类"
          >
            <el-option
              v-for="category in categories"
              :key="category.key"
              :label="category.label"
              :value="category.key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="createForm.tags"
            multiple
            allow-create
            filterable
            collapse-tags
            placeholder="添加一些标签，方便搜索"
          >
            <el-option
              v-for="tag in tagSuggestions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="maxMembers" label="人数上限">
          <el-slider
            v-model="createForm.maxMembers"
            :min="20"
            :max="500"
            :step="10"
            show-input
            input-size="small"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateRoom">
          创建
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="previewVisible"
      :title="previewRoom?.name || '聊天室详情'"
      size="420px"
      direction="rtl"
    >
      <div v-if="previewRoom">
        <div class="chat-preview__header">
          <el-avatar :size="64" :src="previewRoom.avatar">
            {{ previewRoom.name.slice(0, 2) }}
          </el-avatar>
          <div>
            <h3>{{ previewRoom.name }}</h3>
            <p>{{ previewRoom.description }}</p>
          </div>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="分类">{{ previewRoom.categoryLabel }}</el-descriptions-item>
          <el-descriptions-item label="成员">
            {{ previewRoom.memberCount }} / {{ previewRoom.maxMembers }}
          </el-descriptions-item>
          <el-descriptions-item label="活跃度">
            {{ previewRoom.activityScore || activityFromRoom(previewRoom) }}
          </el-descriptions-item>
          <el-descriptions-item label="最近活跃">
            {{ previewRoom.lastMessageAt || previewRoom.updatedAt || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="标签">
            <el-tag
              v-for="tag in previewRoom.tags"
              :key="tag"
              type="info"
              effect="light"
              style="margin-right: 6px; margin-bottom: 6px;"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="chat-preview__actions">
          <el-button type="primary" @click="handleJoinRoom(previewRoom)">
            {{ previewRoom.isJoined ? '进入聊天室' : '加入并进入' }}
          </el-button>
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled, ArrowLeft } from '@element-plus/icons-vue'
import ChatListHeader from '@/components/chat/ChatListHeader.vue'
import ChatCategoryTabs from '@/components/chat/ChatCategoryTabs.vue'
import ChatRoomCard from '@/components/chat/ChatRoomCard.vue'
import { createChatRoom, joinChatRoom } from '@/api/chat'
import { useChatRoomsStore } from '@/stores/chatRooms'
import socketService from '@/utils/socket'

const router = useRouter()
const chatRoomsStore = useChatRoomsStore()
const { filters, filteredRooms, categories, stats, loading, rooms } = storeToRefs(chatRoomsStore)

const showCreateDialog = ref(false)
const createLoading = ref(false)
const joiningRoomId = ref(null)
const previewVisible = ref(false)
const previewRoom = ref(null)
const createFormRef = ref()

const createForm = reactive({
  name: '',
  type: 'group',
  description: '',
  maxMembers: 120,
  categoryKey: '',
  tags: []
})

const createRules = {
  name: [
    { required: true, message: '请输入聊天室名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度需为 2-30 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '介绍不能超过 200 字', trigger: 'blur' }
  ]
}

const tagSuggestions = computed(() => {
  const tagSet = new Set()
  rooms.value.forEach((room) => {
    room.tags?.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
})

const onlyJoinedModel = computed({
  get: () => filters.value.onlyJoined,
  set: (val) => chatRoomsStore.toggleOnlyJoined(val)
})

function handleSearch(value) {
  chatRoomsStore.setSearch(value)
}

function handleCategoryChange(categoryKey) {
  chatRoomsStore.setCategory(categoryKey)
}

function refreshRooms() {
  chatRoomsStore.fetchRooms()
}

function openCreateDialog() {
  showCreateDialog.value = true
}

function resetCreateForm() {
  Object.assign(createForm, {
    name: '',
    type: 'group',
    description: '',
    maxMembers: 120,
    categoryKey: '',
    tags: []
  })
  createFormRef.value?.clearValidate()
}

async function handleCreateRoom() {
  try {
    await createFormRef.value?.validate()
  } catch (error) {
    return
  }

  createLoading.value = true
  try {
    const payload = {
      name: createForm.name,
      type: createForm.type,
      description: createForm.description,
      maxMembers: createForm.maxMembers,
      category: createForm.categoryKey || undefined,
      tags: createForm.tags
    }

    const { data } = await createChatRoom(payload)
    ElMessage.success('聊天室创建成功')
    showCreateDialog.value = false
    resetCreateForm()

    if (data) {
      const merged = { ...payload, ...data, isJoined: true }
      chatRoomsStore.upsertRoom(merged)
      setTimeout(() => enterRoom(merged), 200)
    } else {
      await chatRoomsStore.fetchRooms()
    }
  } catch (error) {
    console.error('[chat] create room failed', error)
    ElMessage.error('创建聊天室失败，请稍后再试')
  } finally {
    createLoading.value = false
  }
}

async function handleJoinRoom(room) {
  if (!room) return
  if (room.memberCount >= room.maxMembers) {
    ElMessage.warning('聊天室已满，暂时无法加入')
    return
  }

  joiningRoomId.value = room.id
  try {
    await joinChatRoom(room.id)
    ElMessage.success(`已加入聊天室「${room.name}」`)
    chatRoomsStore.upsertRoom({ ...room, isJoined: true, memberCount: (room.memberCount ?? 0) + 1 })
    setTimeout(() => enterRoom({ ...room, isJoined: true }), 150)
  } catch (error) {
    console.error('[chat] join room failed', error)
    ElMessage.error('加入聊天室失败，请稍后再试')
  } finally {
    joiningRoomId.value = null
  }
}

function enterRoom(room) {
  const target = typeof room === 'object' ? room : filteredRooms.value.find((item) => item.id === room)
  if (!target) {
    ElMessage.warning('未找到聊天室')
    return
  }
  if (!target.isJoined) {
    ElMessage.warning('请先加入聊天室')
    return
  }
  router.push({ name: 'ChatRoom', params: { roomId: target.id } })
}

function openPreview(room) {
  previewRoom.value = room
  previewVisible.value = true
}

function activityFromRoom(room) {
  if (room.activityScore) return room.activityScore
  if (!room.maxMembers) return 0
  return Math.round((room.memberCount / room.maxMembers) * 100)
}

function goToCommunity() {
  router.push({ name: 'CommunityHub' })
}

function handleOnlineUsers(data) {
  if (data?.count !== undefined) {
    chatRoomsStore.setOnlineUsers(data.count)
  }
}

onMounted(() => {
  chatRoomsStore.fetchRooms()
  socketService.on('online-users-updated', handleOnlineUsers)
})

onBeforeUnmount(() => {
  socketService.off?.('online-users-updated', handleOnlineUsers)
})
</script>

<style scoped>
.chat-list-breadcrumb {
  padding: 12px 20px;
  background: #f7f8fa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
}

.chat-list-breadcrumb :deep(.el-button) {
  color: #5c6af0;
  font-weight: 500;
}

.chat-list-breadcrumb :deep(.el-button:hover) {
  color: #2f6bff;
}

.chat-list-page__filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chat-list-page__filters-left {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--chat-text-secondary);
}

.chat-preview__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.chat-preview__header h3 {
  margin: 0;
  font-size: 20px;
}

.chat-preview__header p {
  margin: 4px 0 0;
  color: var(--chat-text-secondary);
}

.chat-preview__actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>










