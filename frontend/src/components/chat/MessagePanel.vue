
<template>
  <div class="message-panel">
    <header class="message-panel__header">
      <slot name="header" />
    </header>

    <div ref="scrollContainerRef" class="message-panel__scroll" @scroll="handleScroll">
      <div v-if="loading" class="message-panel__loading">
        <el-skeleton animated :rows="6" />
      </div>

      <template v-else>
        <el-empty v-if="!decoratedItems.length" description="暂无消息，快来说点什么吧" />

        <div v-else class="message-panel__virtual-wrapper">
          <div v-if="hasMore && !prependLoading" class="message-panel__top-hint">
            <span>上滑加载更多消息</span>
          </div>

          <div v-if="prependLoading" class="message-panel__top-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载历史消息...</span>
          </div>

          <div
            ref="spacerRef"
            class="message-panel__spacer"
            :style="{ height: `${Math.max(totalHeight, containerHeight)}px` }"
          >
            <div class="message-panel__visible" :style="{ transform: `translateY(${offsetY}px)` }">
              <div
                v-for="(item, localIndex) in visibleItems"
                :key="item.key"
                :ref="(el) => registerRow(el, visibleRange.start + localIndex, item)"
                class="message-panel__row"
                :class="[`message-panel__row--${item.type}`]"
              >
                <template v-if="item.type === 'divider'">
                  <div
                    class="message-panel__divider"
                    :class="{ 'is-collapsed': item.collapsed }"
                    role="button"
                    tabindex="0"
                    @click="handleDividerClick(item)"
                    @keydown.enter.prevent="handleDividerClick(item)"
                    @keydown.space.prevent="handleDividerClick(item)"
                  >
                    <el-icon class="message-panel__divider-icon">
                      <component :is="item.collapsed ? ArrowRight : ArrowDown" />
                    </el-icon>
                    <span class="message-panel__divider-label">{{ item.label }}</span>
                    <span class="message-panel__divider-count">{{ item.count }} 条消息</span>
                  </div>
                </template>

                <template v-else>
                  <div
                    class="message-panel__item"
                    :class="{ 'message-panel__item--own': item.message.isOwn }"
                    @contextmenu.prevent="handleMessageContextMenu($event, item.message)"
                  >
                    <el-avatar
                      v-if="!item.message.isOwn"
                      :size="42"
                      :src="item.message.senderAvatar"
                      class="message-panel__avatar"
                    >
                      {{ item.message.senderName?.slice(0, 1) || '?' }}
                    </el-avatar>

                    <div class="message-panel__bubble-group">
                      <div class="message-panel__meta">
                        <span class="message-panel__name">{{ item.message.senderName }}</span>
                        <span class="message-panel__time">{{ formatTime(item.message.createdAt) }}</span>
                      </div>
                      <div class="message-panel__bubble" :class="bubbleClass(item.message)">
                        <template v-if="item.message.isRecalled">
                          <div class="message-panel__recalled">
                            <el-icon><CircleClose /></el-icon>
                            <span>{{ recallText(item.message) }}</span>
                          </div>
                        </template>
                        <template v-else>
                          <slot name="message" :message="item.message">
                            <p v-if="item.message.contentType === 'text'" class="message-panel__text">
                              {{ item.message.content }}
                            </p>
                            <div
                              v-else-if="item.message.contentType === 'attachment' || item.message.hasAttachments"
                              class="message-panel__attachments"
                            >
                              <div
                                v-for="attachment in item.message.attachments"
                                :key="attachment.id || attachment.url"
                                class="message-panel__attachment"
                              >
                                <el-icon class="message-panel__attachment-icon">
                                  <Document />
                                </el-icon>
                                <div class="message-panel__attachment-details">
                                  <div class="message-panel__attachment-name">
                                    {{ attachment.fileName || attachment.name || '未命名附件' }}
                                  </div>
                                  <div class="message-panel__attachment-meta">
                                    <span>{{ formatFileSize(attachment.size) }}</span>
                                    <span v-if="attachment.status === 'uploading'">
                                      上传中 {{ attachment.progress ?? 0 }}%
                                    </span>
                                    <span v-else-if="attachment.status === 'failed'" class="is-error">
                                      上传失败
                                    </span>
                                    <span v-else-if="attachment.status === 'delivered'">
                                      已上传
                                    </span>
                                  </div>
                                  <el-progress
                                    v-if="attachment.status === 'uploading'"
                                    :percentage="Math.min(attachment.progress ?? 5, 100)"
                                    :stroke-width="2"
                                    :show-text="false"
                                  />
                                </div>
                              </div>
                            </div>
                          </slot>
                        </template>
                      </div>

                      <div class="message-panel__status-row">
                        <div v-if="showStatusText(item.message)" class="message-panel__status">
                          {{ statusText(item.message) }}
                        </div>
                        <div v-if="item.message.isOwn" class="message-panel__read-status" :class="`is-${item.message.status}`">
                          <el-icon v-if="item.message.status === 'read'" class="message-panel__read-icon">
                            <Check />
                            <Check />
                          </el-icon>
                          <el-icon v-else-if="item.message.status === 'delivered'" class="message-panel__delivered-icon">
                            <Right />
                          </el-icon>
                          <el-icon v-else-if="item.message.status === 'pending'" class="message-panel__pending-icon">
                            <Loading />
                          </el-icon>
                          <el-icon v-else-if="item.message.status === 'failed'" class="message-panel__failed-icon">
                            <Close />
                          </el-icon>
                        </div>
                      </div>

                      <div
                        v-if="item.message.isOwn"
                        class="message-panel__actions"
                      >
                        <el-button
                          v-if="item.message.status === 'failed'"
                          type="primary"
                          link
                          size="small"
                          :loading="isActionLoading(item.message.id, 'resend')"
                          @click.stop="handleResend(item.message)"
                        >
                          重新发送
                        </el-button>
                        <el-button
                          v-else-if="allowRecall && !item.message.isRecalled && ['delivered', 'read'].includes(item.message.status)"
                          type="danger"
                          link
                          size="small"
                          :loading="isActionLoading(item.message.id, 'recall')"
                          @click.stop="handleRecall(item.message)"
                        >
                          撤回
                        </el-button>
                      </div>
                    </div>

                    <el-avatar
                      v-if="item.message.isOwn"
                      :size="42"
                      :src="item.message.senderAvatar"
                      class="message-panel__avatar"
                    >
                      {{ item.message.senderName?.slice(0, 1) || '?' }}
                    </el-avatar>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <footer v-if="typingUsers.length" class="message-panel__typing">
      <el-icon class="message-panel__typing-icon"><Loading /></el-icon>
      <span>{{ typingUsers.join('、') }} 正在输入...</span>
    </footer>

    <!-- Context Menu -->
    <el-dropdown
      ref="contextMenuRef"
      :visible="contextMenuVisible"
      placement="bottom-start"
      trigger="contextmenu"
      @command="handleContextMenuCommand"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="canCopy" command="copy">
            <el-icon><DocumentCopy /></el-icon>
            复制
          </el-dropdown-item>
          <el-dropdown-item v-if="canReply" command="reply">
            <el-icon><ChatLineRound /></el-icon>
            回复
          </el-dropdown-item>
          <el-dropdown-item v-if="canForward" command="forward">
            <el-icon><Share /></el-icon>
            转发
          </el-dropdown-item>
          <el-divider v-if="canCopy || canReply || canForward" style="margin: 6px 0" />
          <el-dropdown-item v-if="canRecall" command="recall" class="is-danger">
            <el-icon><Delete /></el-icon>
            撤回
          </el-dropdown-item>
          <el-dropdown-item v-if="canDelete" command="delete" class="is-danger">
            <el-icon><DeleteFilled /></el-icon>
            删除
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Loading, Document, CircleClose, ArrowDown, ArrowRight, Check, Right, Close, DocumentCopy, ChatLineRound, Share, Delete, DeleteFilled } from '@element-plus/icons-vue'

const DEFAULT_ROW_HEIGHT = 116
const DIVIDER_ROW_HEIGHT = 56
const LOAD_MORE_THRESHOLD = 32
const BOTTOM_STICK_THRESHOLD = 120

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  typingUsers: {
    type: Array,
    default: () => []
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  prependLoading: {
    type: Boolean,
    default: false
  },
  actionStates: {
    type: Object,
    default: () => ({})
  },
  allowRecall: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['load-previous', 'resend-message', 'recall-message', 'toggle-day'])

const scrollContainerRef = ref(null)
const spacerRef = ref(null)

const scrollTop = ref(0)
const containerHeight = ref(0)
const totalHeight = ref(0)
const prefixHeights = ref([0])
const heights = ref([])
const autoStick = ref(true)
const loadTriggered = ref(false)

const previousScrollMetrics = reactive({ totalHeight: 0, scrollTop: 0 })

const keyIndexMap = new Map()
const heightMap = new Map()
const rowObservers = new Map()
let resizeObserver = null

const visibleRange = reactive({ start: 0, end: 0 })

const collapsedDays = reactive({})

const sortedMessages = computed(() => {
  return [...props.messages].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime() || 0
    const timeB = new Date(b.createdAt || 0).getTime() || 0
    return timeA - timeB
  })
})

const groupedMessages = computed(() => {
  const groups = []
  let currentGroup = null
  sortedMessages.value.forEach((message, index) => {
    const dayKey = formatDayKey(message.createdAt, index)
    if (!currentGroup || currentGroup.dayKey !== dayKey) {
      const label = formatDayLabel(dayjs(message.createdAt))
      currentGroup = {
        dayKey,
        label,
        messages: []
      }
      groups.push(currentGroup)
    }
    currentGroup.messages.push(message)
  })
  return groups
})

const decoratedItems = computed(() => {
  const items = []
  groupedMessages.value.forEach((group) => {
    const collapsed = Boolean(collapsedDays[group.dayKey])
    items.push({
      key: `divider-${group.dayKey}`,
      type: 'divider',
      dayKey: group.dayKey,
      label: group.label,
      collapsed,
      count: group.messages.length
    })

    if (!collapsed) {
      group.messages.forEach((message, index) => {
        items.push({
          key: `message-${message.id || group.dayKey}-${index}`,
          type: 'message',
          message,
          dayKey: group.dayKey
        })
      })
    }
  })
  return items
})

const visibleItems = computed(() =>
  decoratedItems.value.slice(visibleRange.start, visibleRange.end)
)

const offsetY = computed(() => prefixHeights.value[visibleRange.start] || 0)

watch(groupedMessages, (groups) => {
  const available = new Set(groups.map((group) => group.dayKey))
  Object.keys(collapsedDays).forEach((key) => {
    if (!available.has(key)) {
      delete collapsedDays[key]
    }
  })
})

watch(
  decoratedItems,
  () => {
    syncMetrics()
    nextTick(() => updateVisibleRange())
  },
  { immediate: true }
)

watch(
  () => props.prependLoading,
  (loading) => {
    if (loading) {
      previousScrollMetrics.totalHeight = totalHeight.value
      previousScrollMetrics.scrollTop = scrollTop.value
    } else {
      loadTriggered.value = false
      nextTick(() => {
        if (!autoStick.value && scrollContainerRef.value) {
          const delta = totalHeight.value - previousScrollMetrics.totalHeight
          if (delta > 0) {
            const target = previousScrollMetrics.scrollTop + delta
            scrollContainerRef.value.scrollTop = target
            scrollTop.value = target
            updateVisibleRange()
          }
        }
      })
    }
  }
)

watch(
  () => sortedMessages.value.map((item) => item.id),
  (ids, prevIds) => {
    if (!prevIds || ids.length > prevIds.length) {
      const lastMessage = sortedMessages.value[sortedMessages.value.length - 1]
      nextTick(() => {
        if (props.autoScroll && (autoStick.value || lastMessage?.isOwn)) {
          scrollToBottom()
        }
      })
    }
  },
  { flush: 'post' }
)

onMounted(() => {
  const container = scrollContainerRef.value
  if (container) {
    containerHeight.value = container.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      containerHeight.value = entry.contentRect.height
      updateVisibleRange()
    })
    resizeObserver.observe(container)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  rowObservers.forEach((observer) => observer.disconnect())
  rowObservers.clear()
  keyIndexMap.clear()
  heightMap.clear()
})

function formatDayKey(timestamp, index) {
  const date = dayjs(timestamp)
  if (!date.isValid()) return `unknown-${index}`
  return date.format('YYYY-MM-DD')
}

function formatDayLabel(date) {
  if (!date?.isValid()) return '日期未知'
  const now = dayjs()
  if (date.isSame(now, 'day')) return '今天'
  if (date.isSame(now.subtract(1, 'day'), 'day')) return '昨天'
  if (date.isSame(now.subtract(2, 'day'), 'day')) return '前天'
  if (date.isSame(now, 'year')) return date.format('MM月DD日 dddd').replace('Monday', '周一').replace('Tuesday', '周二').replace('Wednesday', '周三').replace('Thursday', '周四').replace('Friday', '周五').replace('Saturday', '周六').replace('Sunday', '周日')
  return date.format('YYYY年MM月DD日')
}

function handleDividerClick(item) {
  if (!item?.dayKey) return
  collapsedDays[item.dayKey] = !collapsedDays[item.dayKey]
  emit('toggle-day', { dayKey: item.dayKey, collapsed: collapsedDays[item.dayKey] })
  nextTick(() => {
    syncMetrics()
    updateVisibleRange()
  })
}

function isActionLoading(messageId, type) {
  if (!messageId) return false
  const record = props.actionStates?.[messageId]
  if (!record) return false
  return Boolean(record[type])
}

function handleResend(message) {
  if (!message?.id && !message?.tempId) return
  emit('resend-message', message)
}

function handleRecall(message) {
  if (!message?.id && !message?.tempId) return
  emit('recall-message', message)
}

function syncMetrics() {
  const items = decoratedItems.value
  keyIndexMap.clear()
  const freshKeys = new Set()
  const nextHeights = new Array(items.length)

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]
    keyIndexMap.set(item.key, i)
    freshKeys.add(item.key)
    nextHeights[i] = heightMap.get(item.key) ?? defaultHeightFor(item)
  }

  Array.from(heightMap.keys()).forEach((key) => {
    if (!freshKeys.has(key)) {
      const observer = rowObservers.get(key)
      observer?.disconnect()
      rowObservers.delete(key)
      heightMap.delete(key)
    }
  })

  heights.value = nextHeights
  rebuildPrefix()
  updateVisibleRange()
}

function defaultHeightFor(item) {
  return item.type === 'divider' ? DIVIDER_ROW_HEIGHT : DEFAULT_ROW_HEIGHT
}

function rebuildPrefix() {
  const items = decoratedItems.value
  const nextPrefix = new Array(items.length + 1)
  nextPrefix[0] = 0
  for (let i = 0; i < items.length; i += 1) {
    const base = heights.value[i] ?? defaultHeightFor(items[i])
    nextPrefix[i + 1] = nextPrefix[i] + base
  }
  prefixHeights.value = nextPrefix
  totalHeight.value = nextPrefix[nextPrefix.length - 1] || 0
}

function findIndexByOffset(prefix, offset) {
  let low = 0
  let high = prefix.length - 2
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const start = prefix[mid]
    const end = prefix[mid + 1]
    if (offset >= end) {
      low = mid + 1
    } else if (offset < start) {
      high = mid - 1
    } else {
      return mid
    }
  }
  return Math.max(0, Math.min(low, prefix.length - 2))
}

function updateVisibleRange() {
  const items = decoratedItems.value
  if (!items.length) {
    visibleRange.start = 0
    visibleRange.end = 0
    return
  }

  const prefix = prefixHeights.value
  const top = scrollTop.value
  const bottom = top + containerHeight.value
  const overscan = 4

  const startIndex = findIndexByOffset(prefix, top)
  let endIndex = findIndexByOffset(prefix, bottom)
  if (prefix[endIndex + 1] < bottom) {
    endIndex = Math.min(items.length - 1, endIndex + 1)
  }

  visibleRange.start = Math.max(0, startIndex - overscan)
  visibleRange.end = Math.min(items.length, endIndex + 1 + overscan)
}

function handleScroll(event) {
  const target = event.currentTarget
  if (!target) return

  scrollTop.value = target.scrollTop
  updateVisibleRange()

  const nearBottom = target.scrollTop + target.clientHeight >= totalHeight.value - BOTTOM_STICK_THRESHOLD
  autoStick.value = nearBottom

  if (target.scrollTop <= LOAD_MORE_THRESHOLD) {
    if (props.hasMore && !props.prependLoading && !loadTriggered.value) {
      loadTriggered.value = true
      emit('load-previous')
    }
  } else if (target.scrollTop > LOAD_MORE_THRESHOLD * 3) {
    loadTriggered.value = false
  }
}

function registerRow(el, index, item) {
  const key = item.key
  if (!el) {
    const observer = rowObservers.get(key)
    observer?.disconnect()
    rowObservers.delete(key)
    return
  }

  let observer = rowObservers.get(key)
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      applyRowHeight(key, entry.contentRect.height)
    })
    rowObservers.set(key, observer)
  } else {
    observer.disconnect()
  }

  observer.observe(el)
  applyRowHeight(key, el.offsetHeight)
}

function applyRowHeight(key, height) {
  const normalized = Math.max(height, 32)
  const cached = heightMap.get(key)
  if (cached && Math.abs(cached - normalized) < 1) return

  heightMap.set(key, normalized)
  const index = keyIndexMap.get(key)
  if (typeof index === 'number') {
    heights.value[index] = normalized
    rebuildPrefix()
    updateVisibleRange()
  }
}

function scrollToBottom() {
  const container = scrollContainerRef.value
  if (!container) return
  const target = Math.max(totalHeight.value - container.clientHeight, 0)
  container.scrollTop = target
  scrollTop.value = target
  updateVisibleRange()
}

function formatTime(value) {
  if (!value) return ''
  const target = dayjs(value)
  if (!target.isValid()) return ''
  return target.format('HH:mm')
}

function formatFileSize(size) {
  if (size == null) return ''
  let value = size
  const units = ['B', 'KB', 'MB', 'GB']
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  const display = value % 1 === 0 ? value : value.toFixed(1)
  return `${display}${units[unitIndex]}`
}

function recallText(message) {
  return message.isOwn ? '你撤回了一条消息' : `${message.senderName || '对方'} 撤回了一条消息`
}

function bubbleClass(message) {
  return {
    'message-panel__bubble--pending': message.status === 'pending',
    'message-panel__bubble--failed': message.status === 'failed',
    'message-panel__bubble--recalled': message.isRecalled
  }
}

function showStatusText(message) {
  if (!message.isOwn) return false
  return ['pending', 'failed', 'delivered', 'read'].includes(message.status)
}

function statusText(message) {
  if (message.status === 'pending') return '发送中...'
  if (message.status === 'failed') return '发送失败，请稍后重试'
  if (message.status === 'delivered') return '已送达'
  if (message.status === 'read') return '已读'
  return ''
}

// Context Menu
const contextMenuVisible = ref(false)
const contextMessage = ref(null)

const canCopy = computed(() => {
  if (!contextMessage.value) return false
  return contextMessage.value.contentType === 'text' && contextMessage.value.content
})

const canReply = computed(() => {
  if (!contextMessage.value) return false
  return !contextMessage.value.isRecalled
})

const canForward = computed(() => {
  if (!contextMessage.value) return false
  return !contextMessage.value.isRecalled
})

const canRecall = computed(() => {
  if (!contextMessage.value) return false
  return (
    props.allowRecall &&
    contextMessage.value.isOwn &&
    !contextMessage.value.isRecalled &&
    ['delivered', 'read'].includes(contextMessage.value.status)
  )
})

const canDelete = computed(() => {
  if (!contextMessage.value) return false
  return contextMessage.value.isOwn
})

function handleMessageContextMenu(event, message) {
  contextMessage.value = message
  contextMenuVisible.value = true
  // Position the menu at the cursor
  nextTick(() => {
    const dropdownRef = document.querySelector('.message-panel__context-menu')
    if (dropdownRef) {
      dropdownRef.style.left = `${event.clientX}px`
      dropdownRef.style.top = `${event.clientY}px`
    }
  })
}

function handleContextMenuCommand(command) {
  if (!contextMessage.value) return

  switch (command) {
    case 'copy':
      copyToClipboard()
      break
    case 'reply':
      ElNotification({
        title: '回复功能',
        message: '正在开发中...',
        type: 'info',
        duration: 2000
      })
      break
    case 'forward':
      ElNotification({
        title: '转发功能',
        message: '正在开发中...',
        type: 'info',
        duration: 2000
      })
      break
    case 'recall':
      handleRecall(contextMessage.value)
      break
    case 'delete':
      ElMessage.success('消息已删除')
      break
  }

  contextMenuVisible.value = false
  contextMessage.value = null
}

function copyToClipboard() {
  if (!contextMessage.value?.content) return

  const text = contextMessage.value.content
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch((err) => {
    ElMessage.error('复制失败')
    console.error('Copy failed:', err)
  })
}
</script>

<style scoped>
.message-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-panel__header {
  padding: 20px 28px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.message-panel__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px;
  position: relative;
}

.message-panel__loading {
  padding: 32px 16px;
}

.message-panel__virtual-wrapper {
  position: relative;
}

.message-panel__spacer {
  position: relative;
  width: 100%;
}

.message-panel__visible {
  position: absolute;
  inset: 0;
  width: 100%;
  will-change: transform;
}

.message-panel__row {
  position: relative;
}

.message-panel__row--divider {
  display: flex;
  justify-content: center;
  margin: 12px 0;
}

.message-panel__divider {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border-radius: 18px;
  font-size: 13px;
  color: #5d688f;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 6px 18px rgba(79, 118, 255, 0.12);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.message-panel__divider:hover {
  background: rgba(92, 106, 240, 0.15);
  color: #34406a;
}

.message-panel__divider.is-collapsed {
  opacity: 0.8;
}

.message-panel__divider-icon {
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-panel__divider-label {
  font-weight: 600;
}

.message-panel__divider-count {
  font-size: 12px;
  color: rgba(93, 104, 143, 0.8);
}

.message-panel__item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 80%;
  margin: 18px 0;
}

.message-panel__item--own {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-panel__avatar {
  flex-shrink: 0;
}

.message-panel__bubble-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.message-panel__item--own .message-panel__bubble-group {
  align-items: flex-end;
}

.message-panel__meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: rgba(48, 49, 51, 0.65);
}

.message-panel__item--own .message-panel__meta {
  flex-direction: row-reverse;
}

.message-panel__name {
  font-weight: 600;
}

.message-panel__bubble {
  position: relative;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  border: 1px solid rgba(224, 229, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #283056;
  word-break: break-word;
  max-width: min(520px, 68vw);
  transition: all 0.2s ease;
}

.message-panel__item:hover .message-panel__bubble {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.message-panel__item--own .message-panel__bubble {
  background: linear-gradient(135deg, #5c6af0 0%, #6b7eff 100%);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 4px 12px rgba(92, 106, 240, 0.25);
}

.message-panel__item--own:hover .message-panel__bubble {
  box-shadow: 0 6px 16px rgba(92, 106, 240, 0.35);
}

.message-panel__bubble--pending {
  opacity: 0.85;
}

.message-panel__bubble--failed {
  border: 1px solid rgba(255, 99, 132, 0.4);
}

.message-panel__bubble--recalled {
  background: rgba(99, 110, 141, 0.12);
  color: #5f647e;
  border-style: dashed;
}

.message-panel__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-panel__attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-panel__attachment {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
}

.message-panel__item--own .message-panel__attachment {
  background: rgba(255, 255, 255, 0.25);
}

.message-panel__attachment-icon {
  font-size: 20px;
  color: #5c6af0;
  margin-top: 2px;
}

.message-panel__item--own .message-panel__attachment-icon {
  color: #fff;
}

.message-panel__attachment-details {
  flex: 1;
  min-width: 0;
}

.message-panel__attachment-name {
  font-weight: 600;
  font-size: 13px;
  color: inherit;
  word-break: break-all;
}

.message-panel__attachment-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(99, 110, 141, 0.9);
}

.message-panel__attachment-meta .is-error {
  color: #ff5f72;
}

.message-panel__item--own .message-panel__attachment-meta {
  color: rgba(255, 255, 255, 0.8);
}

.message-panel__recalled {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.message-panel__status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
}

.message-panel__status {
  color: #ff5f72;
  font-size: 12px;
}

.message-panel__item--own .message-panel__status {
  color: rgba(255, 255, 255, 0.7);
}

.message-panel__read-status {
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: all 0.3s ease;
}

.message-panel__read-status.is-read {
  color: #67c23a;
}

.message-panel__read-status.is-delivered {
  color: #a0a5bd;
}

.message-panel__read-status.is-pending {
  color: #a0a5bd;
}

.message-panel__read-status.is-failed {
  color: #ff5f72;
}

.message-panel__read-icon {
  font-weight: 700;
  font-size: 16px;
}

.message-panel__delivered-icon {
  font-size: 14px;
}

.message-panel__pending-icon {
  animation: spin 1s linear infinite;
  font-size: 12px;
}

.message-panel__failed-icon {
  font-size: 14px;
}

.message-panel__actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.message-panel__item--own .message-panel__actions {
  justify-content: flex-end;
}

.message-panel__top-loading,
.message-panel__top-hint {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  color: #636a90;
  background: transparent;
  z-index: 2;
}

.message-panel__typing {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 24px;
  font-size: 13px;
  color: #636a90;
}

.message-panel__typing-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .message-panel__scroll {
    padding: 12px 16px 20px;
  }

  .message-panel__item {
    max-width: 90%;
  }
}
</style>
