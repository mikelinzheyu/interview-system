<template>
  <div class="message-header">
    <!-- 返回按钮 -->
    <el-button
      text
      :icon="ArrowLeft"
      @click="handleBack"
      title="返回"
    />

    <!-- 用户信息 -->
    <div class="header-user-info">
      <el-avatar
        :src="otherUser?.avatar"
        :size="32"
      />
      <div class="user-details">
        <div class="user-name">{{ otherUser?.name || '用户' }}</div>
        <div :class="['user-status', { online: otherUser?.isOnline }]">
          {{ otherUser?.isOnline ? '在线' : '离线' }}
        </div>
      </div>
    </div>

    <!-- 操作菜单 -->
    <el-dropdown trigger="click">
      <el-button text :icon="MoreFilled" circle />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleViewProfile">查看资料</el-dropdown-item>
          <el-dropdown-item @click="handleClear">清空聊天记录</el-dropdown-item>
          <el-dropdown-item divided @click="handleDelete">删除对话</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, MoreFilled } from '@element-plus/icons-vue'
import { useMessagingStore } from '@/stores/messagingStore'

const props = defineProps({
  otherUser: {
    type: Object,
    default: () => ({})
  },
  conversationId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back', 'clear', 'delete'])

const router = useRouter()
const messagingStore = useMessagingStore()

const handleBack = () => {
  emit('back')
}

const handleViewProfile = () => {
  if (props.otherUser?.id) {
    // 跳转到用户资料页面（根据你的路由结构调整）
    router.push(`/profile/${props.otherUser.id}`)
  }
}

const handleClear = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空这个对话的所有聊天记录吗？此操作不可恢复。',
      '清空对话',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await messagingStore.clearConversation()
    emit('clear')
    ElMessage.success('对话已清空')
  } catch (error) {
    console.error('[MessageHeader] Clear error:', error)
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个对话吗？此操作不可恢复。',
      '删除对话',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await messagingStore.deleteConversation(props.conversationId)
    emit('delete')
    ElMessage.success('对话已删除')
  } catch (error) {
    console.error('[MessageHeader] Delete error:', error)
  }
}
</script>

<style scoped lang="scss">
.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;

  .header-user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    .user-details {
      min-width: 0;
      overflow: hidden;

      .user-name {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-status {
        font-size: 12px;
        color: #909399;

        &.online {
          color: #67c23a;
        }
      }
    }
  }
}
</style>
