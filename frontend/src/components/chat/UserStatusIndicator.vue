<template>
  <div class="user-status-indicator">
    <!-- 状态指示器 -->
    <div class="status-display" @click="showStatusPanel = !showStatusPanel">
      <div class="status-icon" :title="statusLabel">
        {{ statusInfo.icon }}
      </div>
      <div class="status-info">
        <div class="status-label">{{ statusLabel }}</div>
        <div class="custom-message" v-if="customStatus">{{ customStatus }}</div>
      </div>
      <el-icon class="dropdown-icon">
        <arrow-down v-if="!showStatusPanel" />
        <arrow-up v-else />
      </el-icon>
    </div>

    <!-- 状态选择面板 -->
    <el-popover
      v-model:visible="showStatusPanel"
      :width="300"
      trigger="manual"
      placement="bottom"
      class="status-popover"
    >
      <template #default>
        <div class="status-panel">
          <!-- 状态列表 -->
          <div class="status-options">
            <div
              v-for="option in availableStatuses"
              :key="option.value"
              class="status-option"
              :class="{ active: currentStatus === option.value }"
              @click="handleStatusChange(option.value)"
            >
              <span class="option-icon">{{ option.icon }}</span>
              <span class="option-label">{{ option.label }}</span>
              <el-icon class="check-icon" v-if="currentStatus === option.value">
                <Check />
              </el-icon>
            </div>
          </div>

          <!-- 自定义消息输入 -->
          <div class="custom-message-section">
            <el-input
              v-model="newCustomMessage"
              placeholder="设置自定义状态消息..."
              maxlength="50"
              show-word-limit
              type="textarea"
              :rows="2"
              @input="handleMessageChange"
              @blur="handleMessageBlur"
            />
          </div>

          <!-- 状态历史 -->
          <div class="status-history">
            <div class="history-title">
              <span>最近状态变化</span>
              <el-button
                v-if="statusHistory.length > 0"
                link
                type="primary"
                size="small"
                @click="handleClearHistory"
              >
                清除
              </el-button>
            </div>
            <div v-if="statusHistory.length > 0" class="history-list">
              <div
                v-for="(record, index) in statusHistory.slice(0, 5)"
                :key="index"
                class="history-item"
              >
                <span class="history-from">{{ record.from }}</span>
                <el-icon class="arrow-icon">
                  <right-arrow />
                </el-icon>
                <span class="history-to">{{ record.to }}</span>
                <span class="history-time">{{ formatTime(record.timestamp) }}</span>
              </div>
            </div>
            <div v-else class="history-empty">暂无状态变化记录</div>
          </div>

          <!-- 操作按钮 -->
          <div class="status-actions">
            <el-button @click="handleSyncStatus" :loading="syncing">
              <el-icon>
                <Upload />
              </el-icon>
              同步到服务器
            </el-button>
            <el-button @click="showStatusPanel = false">关闭</el-button>
          </div>
        </div>
      </template>
    </el-popover>

    <!-- 活动指示灯 (当用户活跃时闪烁) -->
    <div v-if="isUserActive" class="activity-indicator" :title="`活跃中...`"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, ArrowDown, ArrowUp, ArrowRight, Upload } from '@element-plus/icons-vue'
import {
  getStatusManager,
  getCurrentUserStatus,
  setUserStatus,
  setStatusMessage,
  getStatusHistory,
  getAvailableStatuses,
  getStatusConfig
} from '../../services/userStatusEnhancedService'
import {
  updateUserStatus,
  setStatusMessage as apiSetStatusMessage,
  getStatusHistory as apiGetStatusHistory
} from '../../api/chat'

// 状态
const showStatusPanel = ref(false)
const currentStatus = ref('online')
const customStatus = ref(null)
const newCustomMessage = ref('')
const statusHistory = ref([])
const availableStatuses = ref([])
const syncing = ref(false)
const isUserActive = ref(false)
const statusManager = getStatusManager()
let statusChangeUnsubscribe = null
let activityCheckInterval = null

// 计算属性
const statusInfo = computed(() => {
  const config = getStatusConfig()
  return config.STATUS_TYPES[currentStatus.value] || config.STATUS_TYPES.offline
})

const statusLabel = computed(() => {
  let label = statusInfo.value.label
  if (customStatus.value) {
    label += ` - ${customStatus.value}`
  }
  return label
})

// 方法
const initializeStatus = () => {
  // 获取当前状态
  const status = getCurrentUserStatus()
  currentStatus.value = status.status
  customStatus.value = status.customStatus
  newCustomMessage.value = customStatus.value || ''

  // 获取可用状态列表
  availableStatuses.value = getAvailableStatuses()

  // 获取状态历史
  loadStatusHistory()

  // 订阅状态变化
  if (statusChangeUnsubscribe) {
    statusChangeUnsubscribe()
  }
  statusManager.onStatusChange((data) => {
    currentStatus.value = data.newStatus
    loadStatusHistory()
  })
}

const loadStatusHistory = () => {
  statusHistory.value = getStatusHistory(5)
}

const handleStatusChange = async (newStatus) => {
  try {
    setUserStatus(newStatus, customStatus.value)
    currentStatus.value = newStatus
    ElMessage.success('状态已更新')
  } catch (error) {
    ElMessage.error('状态更新失败')
    console.error('Status change failed:', error)
  }
}

const handleMessageChange = (value) => {
  newCustomMessage.value = value
}

const handleMessageBlur = async () => {
  if (newCustomMessage.value === customStatus.value) {
    return
  }

  try {
    setStatusMessage(newCustomMessage.value)
    customStatus.value = newCustomMessage.value
    ElMessage.success('自定义状态已更新')
  } catch (error) {
    ElMessage.error('更新自定义状态失败')
    console.error('Message update failed:', error)
  }
}

const handleSyncStatus = async () => {
  syncing.value = true
  try {
    await updateUserStatus({
      status: currentStatus.value,
      customStatus: customStatus.value
    })
    ElMessage.success('已同步到服务器')
  } catch (error) {
    ElMessage.error('同步失败，请重试')
    console.error('Sync failed:', error)
  } finally {
    syncing.value = false
  }
}

const handleClearHistory = () => {
  statusHistory.value = []
  ElMessage.success('历史记录已清除')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 少于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 少于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }
  // 少于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  // 显示日期
  return date.toLocaleDateString('zh-CN')
}

const checkUserActivity = () => {
  const status = getCurrentUserStatus()
  const inactiveTime = status.inactiveTime
  const config = getStatusConfig()

  // 如果不活跃时间少于1分钟，则认为用户活跃
  isUserActive.value = inactiveTime < 60000
}

// 生命周期
onMounted(() => {
  initializeStatus()

  // 定期检查用户活动状态
  activityCheckInterval = setInterval(checkUserActivity, 5000)
})

onUnmounted(() => {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval)
  }
  if (statusChangeUnsubscribe) {
    statusChangeUnsubscribe()
  }
})
</script>

<style scoped>
.user-status-indicator {
  position: relative;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-display:hover {
  background: #eef1f6;
  border-color: #c6e2ff;
}

.status-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-message {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-icon {
  font-size: 14px;
  color: #909399;
  transition: all 0.3s ease;
}

.status-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.status-option:hover {
  background: #f5f7fa;
  border-color: #dcdfe6;
}

.status-option.active {
  background: #e6f7ff;
  border-color: #409eff;
}

.option-icon {
  font-size: 18px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-label {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.check-icon {
  color: #409eff;
  font-size: 16px;
}

.custom-message-section {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.custom-message-section :deep(.el-textarea__inner) {
  font-size: 12px;
  resize: none;
}

.status-history {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.history-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  padding: 6px;
  background: #fafafa;
  border-radius: 3px;
}

.history-from,
.history-to {
  font-weight: 500;
  color: #606266;
}

.arrow-icon {
  font-size: 12px;
  color: #d4d4d8;
}

.history-time {
  margin-left: auto;
  font-size: 11px;
  color: #bfbfbf;
}

.history-empty {
  font-size: 12px;
  color: #bfbfbf;
  text-align: center;
  padding: 8px;
}

.status-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.status-actions :deep(.el-button) {
  flex: 1;
}

.activity-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}
</style>
