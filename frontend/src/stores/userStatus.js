import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStatusStore = defineStore('userStatus', () => {
  // 用户状态映射: { userId: { status: 'online'|'offline'|'away'|'busy', lastSeen: timestamp, ... } }
  const userStatusMap = ref({})

  // 用户在线计数
  const onlineCount = computed(() => {
    return Object.values(userStatusMap.value).filter(
      (status) => status?.status === 'online'
    ).length
  })

  // 设置用户状态
  function setUserStatus(userId, status) {
    if (!userId) return

    const currentStatus = userStatusMap.value[userId] || {}
    userStatusMap.value[userId] = {
      ...currentStatus,
      status,
      lastUpdated: new Date().toISOString()
    }
  }

  // 批量设置用户状态
  function setUserStatuses(statuses) {
    if (!Array.isArray(statuses)) return

    statuses.forEach((item) => {
      if (item?.userId) {
        const userId = item.userId
        userStatusMap.value[userId] = {
          ...userStatusMap.value[userId],
          ...item,
          lastUpdated: new Date().toISOString()
        }
      }
    })
  }

  // 获取用户状态
  function getUserStatus(userId) {
    return userStatusMap.value[userId] || {
      status: 'offline',
      lastSeen: null
    }
  }

  // 获取用户是否在线
  function isUserOnline(userId) {
    return userStatusMap.value[userId]?.status === 'online'
  }

  // 清除用户状态
  function clearUserStatus(userId) {
    if (userStatusMap.value[userId]) {
      delete userStatusMap.value[userId]
    }
  }

  // 清除所有状态
  function clearAllStatuses() {
    userStatusMap.value = {}
  }

  // 更新用户最后见时间
  function updateUserLastSeen(userId) {
    if (userStatusMap.value[userId]) {
      userStatusMap.value[userId].lastSeen = new Date().toISOString()
    }
  }

  return {
    userStatusMap,
    onlineCount,
    setUserStatus,
    setUserStatuses,
    getUserStatus,
    isUserOnline,
    clearUserStatus,
    clearAllStatuses,
    updateUserLastSeen
  }
})
