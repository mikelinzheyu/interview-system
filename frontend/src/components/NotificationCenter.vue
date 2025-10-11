<template>
  <el-popover
    :visible="visible"
    placement="bottom"
    :width="400"
    trigger="click"
    @update:visible="handleVisibleChange"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
        <el-button :icon="Bell" circle />
      </el-badge>
    </template>

    <div class="notification-panel">
      <div class="panel-header">
        <h3>通知中心</h3>
        <div class="header-actions">
          <el-button
            v-if="unreadCount > 0"
            size="small"
            text
            @click="markAllAsRead"
          >
            全部已读
          </el-button>
          <el-button
            size="small"
            text
            type="danger"
            @click="clearAll"
          >
            清空
          </el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="notification-tabs">
        <el-tab-pane label="全部" name="all">
          <div v-loading="loading" class="notifications-list">
            <el-empty v-if="notifications.length === 0" description="暂无通知" />

            <div
              v-for="item in filteredNotifications"
              :key="item.id"
              :class="['notification-item', { unread: !item.read }]"
              @click="handleNotificationClick(item)"
            >
              <div class="item-icon">
                <el-icon :class="`icon-${item.type}`">
                  <component :is="getNotificationIcon(item.type)" />
                </el-icon>
              </div>

              <div class="item-content">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-desc">{{ item.content }}</div>
                <div class="item-time">{{ item.createdAt }}</div>
              </div>

              <el-button
                class="delete-btn"
                :icon="Close"
                circle
                size="small"
                text
                @click.stop="deleteNotification(item.id)"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="`未读 (${unreadCount})`" name="unread">
          <div v-loading="loading" class="notifications-list">
            <el-empty v-if="unreadNotifications.length === 0" description="暂无未读通知" />

            <div
              v-for="item in unreadNotifications"
              :key="item.id"
              class="notification-item unread"
              @click="handleNotificationClick(item)"
            >
              <div class="item-icon">
                <el-icon :class="`icon-${item.type}`">
                  <component :is="getNotificationIcon(item.type)" />
                </el-icon>
              </div>

              <div class="item-content">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-desc">{{ item.content }}</div>
                <div class="item-time">{{ item.createdAt }}</div>
              </div>

              <el-button
                class="delete-btn"
                :icon="Close"
                circle
                size="small"
                text
                @click.stop="deleteNotification(item.id)"
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div v-if="wsConnected" class="connection-status connected">
        <el-icon><SuccessFilled /></el-icon>
        实时通知已连接
      </div>
      <div v-else class="connection-status disconnected">
        <el-icon><WarningFilled /></el-icon>
        实时通知已断开
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell, Close, ChatDotRound, Star, User, Bell as BellIcon,
  SuccessFilled, WarningFilled
} from '@element-plus/icons-vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const userStore = useUserStore()

const visible = ref(false)
const activeTab = ref('all')

const {
  notifications,
  unreadCount,
  loading,
  wsConnected,
  unreadNotifications
} = notificationsStore

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return unreadNotifications
  }
  return notifications
})

// 获取通知图标
const getNotificationIcon = (type) => {
  const iconMap = {
    comment: ChatDotRound,
    like: Star,
    follow: User,
    system: BellIcon
  }
  return iconMap[type] || BellIcon
}

// 显示/隐藏面板
const handleVisibleChange = (val) => {
  visible.value = val
}

// 点击通知
const handleNotificationClick = (item) => {
  // 标记为已读
  notificationsStore.markAsRead(item.id)

  // 如果有链接，跳转
  if (item.link) {
    router.push(item.link)
    visible.value = false
  }
}

// 全部标记为已读
const markAllAsRead = () => {
  notificationsStore.markAllAsRead()
  ElMessage.success('已全部标记为已读')
}

// 删除通知
const deleteNotification = (id) => {
  notificationsStore.deleteNotification(id)
}

// 清空所有通知
const clearAll = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    notificationsStore.clearAll()
    ElMessage.success('已清空所有通知')
  } catch (error) {
    // 用户取消
  }
}

onMounted(async () => {
  // 加载通知列表
  await notificationsStore.fetchNotifications()

  // 请求浏览器通知权限
  await notificationsStore.requestNotificationPermission()

  // 连接 WebSocket
  const userId = userStore.user?.id
  if (userId) {
    notificationsStore.connectWebSocket(userId)
  }
})

onUnmounted(() => {
  // 断开 WebSocket
  notificationsStore.disconnectWebSocket()
})
</script>

<style scoped>
.notification-badge {
  margin-right: 15px;
}

.notification-panel {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.notification-tabs {
  flex: 1;
  overflow: hidden;
}

.notifications-list {
  max-height: 450px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 1px solid #f5f7fa;
  position: relative;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #ecf5ff;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: #409eff;
  border-radius: 0 2px 2px 0;
}

.item-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f7fa;
}

.icon-comment {
  color: #409eff;
}

.icon-like {
  color: #f56c6c;
}

.icon-follow {
  color: #67c23a;
}

.icon-system {
  color: #e6a23c;
}

.item-content {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.item-time {
  font-size: 12px;
  color: #c0c4cc;
}

.delete-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.3s;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  font-size: 12px;
  border-top: 1px solid #ebeef5;
}

.connection-status.connected {
  color: #67c23a;
}

.connection-status.disconnected {
  color: #f56c6c;
}

:deep(.el-tabs__content) {
  overflow: hidden;
}
</style>
