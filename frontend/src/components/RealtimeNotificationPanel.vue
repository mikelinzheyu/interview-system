<template>
  <div class="realtime-notification-panel">
    <!-- Floating Notifications Container -->
    <transition-group name="notification-list" tag="div" class="notifications-container">
      <div
        v-for="(notification, idx) in displayedNotifications"
        :key="notification.id"
        class="notification-bubble"
        :class="`priority-${notification.priority}`"
        :style="{ top: `${20 + idx * 100}px` }"
      >
        <!-- Notification Icon -->
        <div class="bubble-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>

        <!-- Notification Content -->
        <div class="bubble-content">
          <div class="bubble-title">{{ notification.title }}</div>
          <div class="bubble-preview">{{ notification.content }}</div>
          <div class="bubble-timer">{{ getCountdown(notification.id) }}s</div>
        </div>

        <!-- Actions -->
        <div class="bubble-actions">
          <button
            class="action-btn mark-read"
            @click="markAsReadFromPanel(notification.id)"
            title="标记已读"
          >
            ✓
          </button>
          <button
            class="action-btn close-btn"
            @click="dismissNotification(notification.id)"
            title="关闭"
          >
            ✕
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="bubble-progress">
          <div class="progress-fill" :style="{ width: getProgressWidth(notification.id) + '%' }"></div>
        </div>
      </div>
    </transition-group>

    <!-- Notification Preferences -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <span class="settings-title">通知设置</span>
        <button class="close-settings" @click="showSettings = false">✕</button>
      </div>

      <div class="settings-content">
        <div class="setting-item">
          <label>
            <input v-model="enableSound" type="checkbox" />
            <span>启用声音提醒</span>
          </label>
        </div>

        <div class="setting-item">
          <label>
            <input v-model="enableDesktopNotification" type="checkbox" />
            <span>启用桌面通知</span>
          </label>
        </div>

        <div class="setting-item">
          <label>显示时长 (秒)</label>
          <input v-model.number="notificationDuration" type="range" min="3" max="15" />
          <span class="duration-value">{{ notificationDuration }}s</span>
        </div>

        <div class="setting-item">
          <label>通知位置</label>
          <select v-model="notificationPosition">
            <option value="top-right">右上角</option>
            <option value="top-left">左上角</option>
            <option value="bottom-right">右下角</option>
            <option value="bottom-left">左下角</option>
          </select>
        </div>

        <div class="setting-item">
          <label>
            <input v-model="enableMinimize" type="checkbox" />
            <span>启用最小化</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Control Button -->
    <button class="settings-toggle" @click="showSettings = !showSettings" title="通知设置">
      ⚙️
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import notificationService from '@/services/notificationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const notifications = ref([])
const showSettings = ref(false)
const enableSound = ref(true)
const enableDesktopNotification = ref(false)
const notificationDuration = ref(5)
const notificationPosition = ref('top-right')
const enableMinimize = ref(true)
const dismissTimers = ref({})
const countdowns = ref({})
let wsConnection = null
let countdownInterval = null

// Computed
const displayedNotifications = computed(() => {
  if (enableMinimize.value) {
    return notifications.value.slice(0, 3)
  }
  return notifications.value
})

// Methods
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

const getCountdown = (notificationId) => {
  return countdowns.value[notificationId] || notificationDuration.value
}

const getProgressWidth = (notificationId) => {
  const remaining = getCountdown(notificationId)
  return (remaining / notificationDuration.value) * 100
}

const addNotification = (notification) => {
  // Check for duplicates
  if (notifications.value.some(n => n.id === notification.id)) {
    return
  }

  notifications.value.unshift(notification)

  // Initialize countdown
  countdowns.value[notification.id] = notificationDuration.value

  // Play sound if enabled
  if (enableSound.value) {
    playNotificationSound()
  }

  // Request desktop notification if enabled
  if (enableDesktopNotification.value) {
    requestDesktopNotification(notification)
  }

  // Set auto-dismiss timer
  const timer = setTimeout(() => {
    dismissNotification(notification.id)
  }, notificationDuration.value * 1000)

  dismissTimers.value[notification.id] = timer
}

const playNotificationSound = () => {
  try {
    // Use Web Audio API or simple beep
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    console.log('Audio not supported')
  }
}

const requestDesktopNotification = (notification) => {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.content,
      icon: '🔔'
    })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.content,
          icon: '🔔'
        })
      }
    })
  }
}

const dismissNotification = (notificationId) => {
  const index = notifications.value.findIndex(n => n.id === notificationId)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }

  // Clear timer
  if (dismissTimers.value[notificationId]) {
    clearTimeout(dismissTimers.value[notificationId])
    delete dismissTimers.value[notificationId]
  }

  // Clear countdown
  delete countdowns.value[notificationId]
}

const markAsReadFromPanel = (notificationId) => {
  notificationService.markAsRead(notificationId)
  dismissNotification(notificationId)
  ElMessage.success('已标记为已读')
}

const connectWebSocket = () => {
  // Subscribe to real-time notifications
  notificationService.subscribeNotifications(props.userId, (notification) => {
    if (!notification.read) {
      addNotification(notification)
    }
  })
}

const updateCountdowns = () => {
  Object.keys(countdowns.value).forEach((notificationId) => {
    countdowns.value[notificationId] = Math.max(0, countdowns.value[notificationId] - 1)

    // Auto-dismiss when countdown reaches 0
    if (countdowns.value[notificationId] === 0) {
      dismissNotification(notificationId)
    }
  })
}

const initCountdownInterval = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  countdownInterval = setInterval(() => {
    updateCountdowns()
  }, 1000)
}

onMounted(() => {
  // Connect WebSocket for real-time notifications
  connectWebSocket()

  // Initialize countdown interval
  initCountdownInterval()

  // Load initial notifications
  const result = notificationService.getNotifications({
    read: false
  }, { pageSize: 5 })

  result.notifications.forEach(notif => {
    addNotification(notif)
  })
})

onUnmounted(() => {
  // Clear interval
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  // Clear all timers
  Object.values(dismissTimers.value).forEach(timer => {
    clearTimeout(timer)
  })
})
</script>

<style scoped>
.realtime-notification-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 99;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

/* Notifications Container */
.notifications-container {
  position: relative;
  width: 360px;
}

/* Notification Bubble */
.notification-bubble {
  position: absolute;
  right: 0;
  width: 360px;
  padding: 14px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  border-left: 4px solid #5e7ce0;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-list-enter-active {
  transition: all 0.3s ease;
}

.notification-list-leave-active {
  transition: all 0.3s ease;
}

.notification-list-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.notification-list-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

/* Priority Styling */
.notification-bubble.priority-urgent {
  border-left-color: #f56c6c;
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.05), rgba(255, 255, 255, 0.5));
}

.notification-bubble.priority-important {
  border-left-color: #e6a23c;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.05), rgba(255, 255, 255, 0.5));
}

.notification-bubble.priority-info {
  border-left-color: #5e7ce0;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05), rgba(255, 255, 255, 0.5));
}

.notification-bubble.priority-normal {
  border-left-color: #d1d5db;
  background: linear-gradient(135deg, rgba(209, 213, 219, 0.05), rgba(255, 255, 255, 0.5));
}

/* Bubble Icon */
.bubble-icon {
  flex-shrink: 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bubble Content */
.bubble-content {
  flex: 1;
  min-width: 0;
  position: relative;
}

.bubble-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bubble-preview {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.bubble-timer {
  font-size: 10px;
  color: #9ca3af;
  font-weight: 600;
}

/* Bubble Actions */
.bubble-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  align-items: flex-start;
}

.action-btn {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1f2937;
}

.action-btn.mark-read:hover {
  color: #67c23a;
}

.action-btn.close-btn:hover {
  color: #f56c6c;
}

/* Progress Bar */
.bubble-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5e7ce0, #667eea);
  transition: width 0.1s linear;
}

.notification-bubble.priority-urgent .progress-fill {
  background: linear-gradient(90deg, #f56c6c, #ff7875);
}

.notification-bubble.priority-important .progress-fill {
  background: linear-gradient(90deg, #e6a23c, #f0ad4e);
}

/* Settings Toggle */
.settings-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: white;
  border: 2px solid #5e7ce0;
  color: #5e7ce0;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  z-index: 99;
}

.settings-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Settings Panel */
.settings-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 99;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.settings-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.close-settings {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-settings:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1f2937;
}

.settings-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-item label {
  font-size: 12px;
  color: #374151;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.setting-item input[type='checkbox'] {
  cursor: pointer;
}

.setting-item input[type='range'] {
  width: 100%;
  cursor: pointer;
}

.duration-value {
  font-size: 11px;
  color: #6b7280;
  margin-left: auto;
}

.setting-item select {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  color: #1f2937;
  background: white;
  cursor: pointer;
}

.setting-item select:hover {
  border-color: #5e7ce0;
}

/* Responsive */
@media (max-width: 768px) {
  .realtime-notification-panel {
    top: 70px;
    right: 10px;
    left: 10px;
  }

  .notifications-container {
    width: 100%;
  }

  .notification-bubble {
    width: 100%;
  }

  .settings-panel {
    right: 10px;
    left: 10px;
    width: auto;
    bottom: 70px;
  }

  .settings-toggle {
    bottom: 10px;
    right: 10px;
  }
}

@media (max-width: 480px) {
  .realtime-notification-panel {
    top: 60px;
    right: 10px;
    left: 10px;
  }

  .notifications-container {
    width: 100%;
  }

  .notification-bubble {
    width: 100%;
    padding: 12px 12px;
  }

  .settings-panel {
    right: 10px;
    left: 10px;
    width: auto;
    bottom: 60px;
  }

  .settings-toggle {
    bottom: 10px;
    right: 10px;
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
}
</style>
