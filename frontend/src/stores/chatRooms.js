import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { getChatRooms } from '@/api/chat'
import sampleRooms from '@/data/chatRoomsSample'

const DEFAULT_CATEGORIES = [
  { key: 'trending', label: '热门' },
  { key: 'popular', label: '热议' },
  { key: 'latest', label: '最新' },
  { key: 'mine', label: '我的' }
]

function normalizeRoom(raw = {}) {
  const tags = Array.isArray(raw.tags) ? raw.tags : raw.keywords || []
  const categoryKey = raw.categoryKey || raw.category || tags[0] || 'general'

  return {
    id: raw.id,
    name: raw.name || '未命名聊天室',
    description: raw.description || raw.topic || '暂时没有介绍，快来聊聊吧~',
    avatar: raw.avatar || raw.cover || '',
    type: raw.type || 'group',
    memberCount: Number(raw.memberCount ?? raw.onlineCount ?? 0),
    onlineCount: Number(raw.onlineCount ?? raw.memberCount ?? 0),
    maxMembers: Number(raw.maxMembers ?? 200),
    isJoined: Boolean(raw.isJoined),
    isFeatured: Boolean(raw.isFeatured),
    tags,
    categoryKey,
    categoryLabel: raw.categoryLabel || raw.categoryName || raw.category || categoryKey,
    owner: raw.owner || raw.createdBy || null,
    ownerName: raw.owner?.name || raw.ownerName || raw.createdByName || '',
    status: raw.status || 'active',
    activityScore: Number(raw.activityScore ?? raw.activity ?? 0),
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
    lastMessage: raw.lastMessage || null,
    lastMessageAt: raw.lastMessageAt || raw.lastActivityAt || raw.updatedAt || raw.updated_at
  }
}

function isTrending(room) {
  return room.isFeatured || room.activityScore >= 70 || room.memberCount >= Math.max(12, room.maxMembers * 0.5)
}

function isPopular(room) {
  return room.activityScore >= 45 || room.memberCount >= Math.max(8, room.maxMembers * 0.35)
}

function isFresh(room) {
  if (!room.createdAt) return false
  return dayjs(room.createdAt).isAfter(dayjs().subtract(7, 'day'))
}

function matchesCategory(room, category) {
  if (!category || category === 'all') return true
  switch (category) {
    case 'trending':
      return isTrending(room)
    case 'popular':
      return isPopular(room)
    case 'latest':
      return isFresh(room)
    case 'mine':
      return room.isJoined
    default:
      return room.categoryKey === category || room.categoryLabel === category || room.tags.includes(category)
  }
}

export const useChatRoomsStore = defineStore('chatRooms', () => {
  const rooms = ref([])
  const loading = ref(false)
  const error = ref(null)
  const onlineUserCount = ref(0)
  const filters = reactive({
    search: '',
    category: 'trending',
    onlyJoined: false
  })

  const joinedRooms = computed(() => rooms.value.filter((room) => room.isJoined))

  const stats = computed(() => ({
    onlineUsers: onlineUserCount.value,
    totalRooms: rooms.value.length,
    joinedRooms: joinedRooms.value.length,
    trendingRooms: rooms.value.filter((room) => isTrending(room)).length,
    newRooms: rooms.value.filter((room) => isFresh(room)).length
  }))

  const categories = computed(() => {
    const dynamicMap = new Map()
    const categoryCounts = new Map()

    rooms.value.forEach((room) => {
      categoryCounts.set(room.categoryKey, (categoryCounts.get(room.categoryKey) ?? 0) + 1)
      if (!dynamicMap.has(room.categoryKey)) {
        dynamicMap.set(room.categoryKey, {
          key: room.categoryKey,
          label: room.categoryLabel || room.categoryKey
        })
      }
    })

    const preset = DEFAULT_CATEGORIES.map((item) => {
      let count = 0
      if (item.key === 'trending') {
        count = rooms.value.filter((room) => isTrending(room)).length
      } else if (item.key === 'popular') {
        count = rooms.value.filter((room) => isPopular(room)).length
      } else if (item.key === 'latest') {
        count = rooms.value.filter((room) => isFresh(room)).length
      } else if (item.key === 'mine') {
        count = joinedRooms.value.length
      }
      return { ...item, count }
    })

    const dynamic = Array.from(dynamicMap.values())
      .filter((item) => !DEFAULT_CATEGORIES.some((presetItem) => presetItem.key === item.key))
      .map((item) => ({ ...item, count: categoryCounts.get(item.key) ?? 0 }))

    return [...preset, ...dynamic]
  })

  const filteredRooms = computed(() => {
    const searchValue = filters.search.trim().toLowerCase()
    return rooms.value.filter((room) => {
      if (filters.onlyJoined && !room.isJoined) return false
      if (!matchesCategory(room, filters.category)) return false
      if (!searchValue) return true
      const haystack = [room.name, room.description, ...(room.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(searchValue)
    })
  })

  const applyRooms = (payload) => {
    rooms.value = Array.isArray(payload) ? payload.map(normalizeRoom) : []
    if (!rooms.value.length && import.meta.env.DEV) {
      rooms.value = sampleRooms.map(normalizeRoom)
    }
  }

  const fetchRooms = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await getChatRooms({ includeStats: true })
      const payload = response?.data?.rooms ?? response?.data ?? []
      applyRooms(payload)
    } catch (err) {
      console.error('[chatRooms] fetchRooms failed', err)
      error.value = err
      if (rooms.value.length === 0 && import.meta.env.DEV) {
        applyRooms(sampleRooms)
      } else {
        rooms.value = []
      }
    } finally {
      loading.value = false
    }
  }

  const setSearch = (value) => {
    filters.search = value
  }

  const setCategory = (category) => {
    filters.category = category
  }

  const toggleOnlyJoined = (value) => {
    filters.onlyJoined = typeof value === 'boolean' ? value : !filters.onlyJoined
  }

  const setOnlineUsers = (count) => {
    onlineUserCount.value = Number.isFinite(Number(count)) ? Number(count) : 0
  }

  const upsertRoom = (room) => {
    if (!room) return
    const normalized = normalizeRoom(room)
    const index = rooms.value.findIndex((item) => item.id === normalized.id)
    if (index >= 0) {
      rooms.value.splice(index, 1, { ...rooms.value[index], ...normalized })
    } else {
      rooms.value.unshift(normalized)
    }
  }

  return {
    rooms,
    loading,
    error,
    filters,
    stats,
    categories,
    filteredRooms,
    joinedRooms,
    fetchRooms,
    setSearch,
    setCategory,
    toggleOnlyJoined,
    setOnlineUsers,
    upsertRoom
  }
})

