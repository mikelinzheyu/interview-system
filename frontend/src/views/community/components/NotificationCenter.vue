<template>
  <div class="notification-center">
    <!-- 标题栏 -->
    <div class="center-header">
      <h2>消息中心</h2>
      <div class="header-actions">
        <el-button
          v-if="unreadCount > 0"
          size="small"
          type="warning"
          @click="markAllAsRead"
        >
          全部标记为已读
        </el-button>
        <el-button
          v-if="notifications.length > 0"
          size="small"
          @click="showClearConfirm"
        >
          清空所有
        </el-button>
        <el-button link size="small" @click="refresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 未读计数和连接状态 -->
    <div class="status-bar">
      <div class="status-info">
        <span class="badge" v-if="unreadCount > 0">
          {{ unreadCount > 99 ? '99+' : unreadCount }} 条未读
        </span>
        <el-tag :type="isConnected ? 'success' : 'warning'" size="small">
          {{ isConnected ? '✓ 已连接' : '⚠ 离线' }}
        </el-tag>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filters">
      <el-select
        v-model="filters.type"
        placeholder="按类型筛选"
        @change="changeFilter('type', $event)"
        size="small"
      >
        <el-option
          v-for="option in typeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <el-select
        v-model="filters.read"
        placeholder="按状态筛选"
        @change="changeFilter('read', $event)"
        size="small"
      >
        <el-option
          v-for="option in readOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>

    <!-- 加载状态 -->
    <el-skeleton v-if="loading && notifications.length === 0" :rows="5" animated />

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && notifications.length === 0"
      description="暂无通知"
    />

    <!-- 通知列表（按日期分组） -->
    <div v-if="notifications.length > 0" class="notifications-list">
      <div
        v-for="(dayNotifications, date) in groupedNotifications"
        :key="date"
        class="notification-group"
      >
        <div class="group-date">{{ date }}</div>

        <notification-item
          v-for="notification in dayNotifications"
          :key="notification.id"
          :notification="notification"
          @mark-read="markAsRead"
          @delete="deleteNotification"
          @click="handleNotificationClick"
        />
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="pageInfo.pages > 1" class="pagination-container">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="totalNotifications"
        layout="total, sizes, prev, pager, next"
        @current-change="changePage"
        @size-change="changePageSize"
      />
    </div>

    <!-- 设置面板 -->
    <el-divider />
    <div class="preferences-section">
      <h3>通知设置</h3>

      <div class="preference-group">
        <span class="label">通知类型：</span>
        <div class="preference-items">
          <el-checkbox
            v-model="preferences.commentNotifications"
            @change="updatePreferences"
          >
            评论通知
          </el-checkbox>
          <el-checkbox
            v-model="preferences.replyNotifications"
            @change="updatePreferences"
          >
            回复通知
          </el-checkbox>
          <el-checkbox
            v-model="preferences.likeNotifications"
            @change="updatePreferences"
          >
            点赞通知
          </el-checkbox>
          <el-checkbox
            v-model="preferences.mentionNotifications"
            @change="updatePreferences"
          >
            提及通知
          </el-checkbox>
          <el-checkbox
            v-model="preferences.followNotifications"
            @change="updatePreferences"
          >
            关注通知
          </el-checkbox>
          <el-checkbox
            v-model="preferences.systemNotifications"
            @change="updatePreferences"
          >
            系统通知
          </el-checkbox>
        </div>
      </div>

      <div class="preference-group">
        <span class="label">提醒方式：</span>
        <div class="preference-items">
          <el-checkbox
            v-model="preferences.soundEnabled"
            @change="updatePreferences"
          >
            声音提醒
          </el-checkbox>
          <el-checkbox
            v-model="preferences.vibrationEnabled"
            @change="updatePreferences"
          >
            振动提醒
          </el-checkbox>
          <el-checkbox
            v-model="preferences.desktopNotifications"
            @change="updatePreferences"
          >
            桌面通知
          </el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Refresh } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useNotifications } from '@/composables/useNotifications'
import NotificationItem from './NotificationItem.vue'

const {
  notifications,
  unreadCount,
  loading,
  currentPage,
  pageSize,
  totalNotifications,
  filters,
  preferences,
  isConnected,
  groupedNotifications,
  pageInfo,
  typeOptions,
  readOptions,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  changeFilter,
  changePage,
  changePageSize,
  refresh,
  updatePreferences: updatePrefs
} = useNotifications()

/**
 * 显示清空确认对话框
 */
const showClearConfirm = () => {
  ElMessageBox.confirm(
    '确定要清空所有通知吗？此操作无法撤销。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      clearAllNotifications()
    })
    .catch(() => {
      // 用户取消
    })
}

/**
 * 处理通知点击（导航到相关页面）
 */
const handleNotificationClick = (notification) => {
  if (notification.actionUrl) {
    window.location.href = notification.actionUrl
  }
}

/**
 * 更新偏好设置
 */
const updatePreferences = () => {
  updatePrefs({
    commentNotifications: preferences.commentNotifications,
    replyNotifications: preferences.replyNotifications,
    likeNotifications: preferences.likeNotifications,
    mentionNotifications: preferences.mentionNotifications,
    followNotifications: preferences.followNotifications,
    systemNotifications: preferences.systemNotifications,
    soundEnabled: preferences.soundEnabled,
    vibrationEnabled: preferences.vibrationEnabled,
    desktopNotifications: preferences.desktopNotifications
  })
}
</script>

<style scoped lang="scss">
.notification-center {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-height: 600px;

  .center-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f5f5;
    border-radius: 4px;

    .status-info {
      display: flex;
      gap: 12px;
      align-items: center;

      .badge {
        background: #ff6b6b;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }
    }
  }

  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;

    :deep(.el-select) {
      width: 150px;
    }
  }

  .notifications-list {
    .notification-group {
      margin-bottom: 24px;

      .group-date {
        font-size: 12px;
        color: #999;
        margin-bottom: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
  }

  .preferences-section {
    h3 {
      margin: 20px 0 16px 0;
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .preference-group {
      margin-bottom: 16px;
      display: flex;
      align-items: flex-start;
      gap: 16px;

      .label {
        width: 100px;
        color: #666;
        font-size: 13px;
        line-height: 32px;
        min-width: 100px;
      }

      .preference-items {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        flex: 1;

        :deep(.el-checkbox) {
          margin: 0;
          line-height: 32px;
        }
      }
    }
  }

  :deep(.el-empty) {
    padding: 60px 20px;
  }

  :deep(.el-skeleton) {
    padding: 20px 0;
  }
}
</style>
