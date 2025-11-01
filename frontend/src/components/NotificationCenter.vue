<template>
  <div class="notification-center">
    <!-- Header -->
    <div class="center-header">
      <h3 class="header-title">
        <span class="title-icon">🔔</span> 通知中心
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </h3>
      <div class="header-actions">
        <el-button v-if="unreadCount > 0" @click="markAllAsRead">
          全部标记已读
        </el-button>
        <el-button type="danger" @click="clearAllNotifications">
          清空全部
        </el-button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-item">
        <span class="stat-label">总通知</span>
        <span class="stat-value">{{ totalNotifications }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">未读</span>
        <span class="stat-value" :class="{ highlight: unreadCount > 0 }">{{ unreadCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">紧急</span>
        <span class="stat-value">{{ urgentCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">重要</span>
        <span class="stat-value">{{ importantCount }}</span>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索通知标题或内容..."
        prefix-icon="Search"
        @input="handleSearch"
        clearable
        style="flex: 1; max-width: 300px;"
      />

      <el-select v-model="selectedType" placeholder="按类型筛选" clearable @change="handleFilter">
        <el-option label="全部类型" value="all" />
        <el-option label="系统通知" value="system" />
        <el-option label="用户互动" value="user" />
        <el-option label="内容更新" value="content" />
        <el-option label="审核结果" value="audit" />
        <el-option label="系统告警" value="alert" />
      </el-select>

      <el-select v-model="selectedPriority" placeholder="按优先级筛选" clearable @change="handleFilter">
        <el-option label="全部优先级" value="all" />
        <el-option label="紧急" value="urgent" />
        <el-option label="重要" value="important" />
        <el-option label="信息" value="info" />
        <el-option label="普通" value="normal" />
      </el-select>

      <el-select v-model="selectedReadStatus" placeholder="按读取状态筛选" clearable @change="handleFilter">
        <el-option label="全部状态" value="all" />
        <el-option label="未读" value="unread" />
        <el-option label="已读" value="read" />
      </el-select>

      <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
        <el-option label="最新优先" value="newest" />
        <el-option label="最旧优先" value="oldest" />
        <el-option label="优先级" value="priority" />
      </el-select>
    </div>

    <!-- Notifications List -->
    <div class="notifications-list-section">
      <div v-if="filteredNotifications.length > 0" class="notifications-list">
        <div
          v-for="notification in paginatedNotifications"
          :key="notification.id"
          class="notification-item"
          :class="[
            { unread: !notification.read },
            `priority-${notification.priority}`
          ]"
          @click="viewNotificationDetails(notification)"
        >
          <!-- Unread Indicator -->
          <div v-if="!notification.read" class="unread-indicator"></div>

          <!-- Notification Icon -->
          <div class="notification-icon">{{ getNotificationIcon(notification.type) }}</div>

          <!-- Notification Content -->
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-preview">{{ notification.content }}</div>
            <div class="notification-meta">
              <span class="notification-type">{{ getNotificationType(notification.type) }}</span>
              <span class="notification-time">{{ getRelativeTime(notification.createdAt) }}</span>
            </div>
          </div>

          <!-- Notification Status -->
          <div class="notification-status">
            <el-tag :type="getPriorityType(notification.priority)" size="small">
              {{ getPriorityLabel(notification.priority) }}
            </el-tag>
          </div>

          <!-- Actions -->
          <div class="notification-actions">
            <el-button
              v-if="!notification.read"
              link
              type="primary"
              size="small"
              @click.stop="markAsRead(notification.id)"
            >
              标记已读
            </el-button>
            <el-button link type="danger" size="small" @click.stop="deleteNotification(notification.id)">
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">
          <p v-if="searchQuery">搜索结果为空</p>
          <p v-else>暂无通知</p>
        </div>
        <el-button type="primary" link @click="resetFilters">重置筛选条件</el-button>
      </div>

      <!-- Pagination -->
      <div v-if="filteredNotifications.length > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredNotifications.length"
          layout="total, sizes, prev, pager, next"
          @current-change="currentPage = $event"
          @size-change="pageSize = $event; currentPage = 1"
        />
      </div>
    </div>

    <!-- Details Dialog -->
    <el-dialog
      v-model="detailsVisible"
      title="通知详情"
      width="600px"
      center
      @close="selectedNotification = null"
    >
      <div v-if="selectedNotification" class="notification-detail">
        <!-- Header -->
        <div class="detail-header">
          <div class="header-content">
            <h4>{{ selectedNotification.title }}</h4>
            <div class="header-meta">
              <span class="type-badge">{{ getNotificationType(selectedNotification.type) }}</span>
              <el-tag :type="getPriorityType(selectedNotification.priority)">
                {{ getPriorityLabel(selectedNotification.priority) }}
              </el-tag>
              <span class="time">{{ formatDateTime(selectedNotification.createdAt) }}</span>
            </div>
          </div>
          <div v-if="!selectedNotification.read" class="unread-mark">未读</div>
        </div>

        <!-- Content -->
        <div class="detail-content">
          <h5>内容详情</h5>
          <div class="content-text">{{ selectedNotification.content }}</div>
        </div>

        <!-- Data (if available) -->
        <div v-if="selectedNotification.data && Object.keys(selectedNotification.data).length > 0" class="detail-data">
          <h5>关联信息</h5>
          <div class="data-grid">
            <div v-for="(value, key) in selectedNotification.data" :key="key" class="data-item">
              <span class="data-label">{{ key }}:</span>
              <span class="data-value">{{ formatDataValue(value) }}</span>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="detail-timeline">
          <h5>时间线</h5>
          <div class="timeline-items">
            <div class="timeline-item">
              <div class="timeline-time">{{ formatDateTime(selectedNotification.createdAt) }}</div>
              <div class="timeline-event">通知已创建</div>
            </div>
            <div v-if="selectedNotification.read" class="timeline-item">
              <div class="timeline-time">{{ formatDateTime(selectedNotification.updatedAt) }}</div>
              <div class="timeline-event">已标记为已读</div>
            </div>
          </div>
        </div>

        <!-- Expiration Info -->
        <div v-if="selectedNotification.expiresAt" class="detail-expires">
          <small>通知将在 {{ formatDate(selectedNotification.expiresAt) }} 过期</small>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailsVisible = false">关闭</el-button>
        <el-button
          v-if="selectedNotification && !selectedNotification.read"
          type="primary"
          @click="markAsReadFromDetail"
        >
          标记已读
        </el-button>
        <el-button type="danger" @click="deleteFromDetail">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import notificationService from '@/services/notificationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const searchQuery = ref('')
const selectedType = ref('all')
const selectedPriority = ref('all')
const selectedReadStatus = ref('all')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(20)
const allNotifications = ref([])
const totalNotifications = ref(0)
const unreadCount = ref(0)
const urgentCount = ref(0)
const importantCount = ref(0)
const detailsVisible = ref(false)
const selectedNotification = ref(null)

// Computed
const filteredNotifications = computed(() => {
  let filtered = allNotifications.value

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    )
  }

  // Filter by type
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(n => n.type === selectedType.value)
  }

  // Filter by priority
  if (selectedPriority.value !== 'all') {
    filtered = filtered.filter(n => n.priority === selectedPriority.value)
  }

  // Filter by read status
  if (selectedReadStatus.value !== 'all') {
    const isRead = selectedReadStatus.value === 'read'
    filtered = filtered.filter(n => n.read === isRead)
  }

  // Sort
  if (sortBy.value === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sortBy.value === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  } else if (sortBy.value === 'priority') {
    const priorityOrder = { urgent: 0, important: 1, info: 2, normal: 3 }
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  return filtered
})

const paginatedNotifications = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredNotifications.value.slice(start, end)
})

// Methods
const loadNotifications = () => {
  const result = notificationService.getNotifications({})
  allNotifications.value = result.notifications
  totalNotifications.value = result.total
  unreadCount.value = result.unreadCount

  updateCounts()
}

const updateCounts = () => {
  urgentCount.value = allNotifications.value.filter(n => n.priority === 'urgent').length
  importantCount.value = allNotifications.value.filter(n => n.priority === 'important').length
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedType.value = 'all'
  selectedPriority.value = 'all'
  selectedReadStatus.value = 'all'
  sortBy.value = 'newest'
  currentPage.value = 1
}

const viewNotificationDetails = (notification) => {
  selectedNotification.value = notification
  detailsVisible.value = true
}

const markAsRead = (notificationId) => {
  notificationService.markAsRead(notificationId)
  loadNotifications()
  ElMessage.success('已标记为已读')
}

const markAsReadFromDetail = () => {
  if (selectedNotification.value) {
    markAsRead(selectedNotification.value.id)
    selectedNotification.value.read = true
  }
}

const markAllAsRead = () => {
  ElMessageBox.confirm(
    '确认将全部通知标记为已读吗？',
    '确认操作',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    notificationService.markAllAsRead()
    loadNotifications()
    ElMessage.success('已将全部通知标记为已读')
  }).catch(() => {
    ElMessage.info('操作已取消')
  })
}

const deleteNotification = (notificationId) => {
  notificationService.deleteNotification(notificationId)
  loadNotifications()
  ElMessage.success('通知已删除')
}

const deleteFromDetail = () => {
  if (selectedNotification.value) {
    ElMessageBox.confirm(
      '确认要删除此通知吗？',
      '删除通知',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    ).then(() => {
      deleteNotification(selectedNotification.value.id)
      detailsVisible.value = false
      ElMessage.success('通知已删除')
    }).catch(() => {
      ElMessage.info('操作已取消')
    })
  }
}

const clearAllNotifications = () => {
  ElMessageBox.confirm(
    '确认要清空全部通知吗？此操作不可撤销！',
    '清空通知',
    { confirmButtonText: '清空', cancelButtonText: '取消', type: 'error' }
  ).then(() => {
    notificationService.deleteAllNotifications()
    loadNotifications()
    ElMessage.success('全部通知已清空')
  }).catch(() => {
    ElMessage.info('操作已取消')
  })
}

const getNotificationIcon = (type) => {
  const icons = {
    system: '⚙️',
    user: '👤',
    content: '📝',
    audit: '✅',
    alert: '⚠️'
  }
  return icons[type] || '📢'
}

const getNotificationType = (type) => {
  const types = {
    system: '系统通知',
    user: '用户互动',
    content: '内容更新',
    audit: '审核结果',
    alert: '系统告警'
  }
  return types[type] || type
}

const getPriorityLabel = (priority) => {
  const labels = { urgent: '紧急', important: '重要', info: '信息', normal: '普通' }
  return labels[priority] || priority
}

const getPriorityType = (priority) => {
  const types = { urgent: 'danger', important: 'warning', info: 'info', normal: '' }
  return types[priority] || ''
}

const formatDataValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const getRelativeTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`
  return `${Math.floor(diff / 604800)}周前`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notification-center {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Header */
.center-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: #f56c6c;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: #6b7280;
  font-weight: 600;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.highlight {
  color: #f56c6c;
}

/* Search and Filter */
.search-filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-filter-section :deep(.el-select) {
  min-width: 120px;
}

/* Notifications List */
.notifications-list-section {
  margin-bottom: 20px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #d1d5db;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.notification-item:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.notification-item.unread {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.notification-item.priority-urgent {
  border-left-color: #f56c6c;
  background: rgba(245, 108, 108, 0.05);
}

.notification-item.priority-urgent.unread {
  background: rgba(245, 108, 108, 0.08);
}

.notification-item.priority-important {
  border-left-color: #e6a23c;
  background: rgba(230, 162, 60, 0.05);
}

.notification-item.priority-important.unread {
  background: rgba(230, 162, 60, 0.08);
}

.notification-item.priority-info {
  border-left-color: #5e7ce0;
  background: rgba(94, 124, 224, 0.05);
}

.notification-item.priority-info.unread {
  background: rgba(94, 124, 224, 0.08);
}

.unread-indicator {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  top: 12px;
  right: 12px;
}

.notification-icon {
  flex-shrink: 0;
  font-size: 20px;
  min-width: 24px;
  text-align: center;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.notification-preview {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #9ca3af;
}

.notification-type {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 3px;
  font-weight: 600;
}

.notification-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text p {
  margin: 0 0 12px 0;
  font-size: 14px;
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(229, 230, 235, 0.4);
}

/* Detail Dialog */
.notification-detail {
  padding: 12px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(229, 230, 235, 0.4);
}

.header-content h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.header-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 3px;
  font-weight: 600;
}

.unread-mark {
  display: inline-block;
  padding: 4px 8px;
  background: #f56c6c;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.detail-content,
.detail-data,
.detail-timeline {
  margin-bottom: 20px;
}

.detail-content h5,
.detail-data h5,
.detail-timeline h5 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.content-text {
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  line-height: 1.6;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
}

.data-label {
  font-size: 10px;
  color: #6b7280;
  font-weight: 600;
}

.data-value {
  font-size: 12px;
  color: #1f2937;
  word-break: break-word;
}

.timeline-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding-left: 20px;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 8px;
  background: #5e7ce0;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #5e7ce0;
}

.timeline-time {
  font-size: 11px;
  color: #9ca3af;
  min-width: 160px;
}

.timeline-event {
  font-size: 12px;
  color: #374151;
}

.detail-expires {
  padding: 12px;
  background: rgba(107, 114, 128, 0.05);
  border-radius: 4px;
  color: #6b7280;
  font-size: 11px;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .center-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
  }

  .search-filter-section {
    flex-direction: column;
  }

  .search-filter-section :deep(.el-input),
  .search-filter-section :deep(.el-select) {
    width: 100%;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .notification-item {
    flex-direction: column;
  }

  .notification-actions {
    opacity: 1;
    width: 100%;
    justify-content: flex-end;
  }

  .notification-actions :deep(.el-button) {
    padding: 0;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
