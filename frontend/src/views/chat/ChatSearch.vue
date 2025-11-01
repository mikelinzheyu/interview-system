<template>
  <div class="chat-search">
    <div class="chat-search__header">
      <el-button @click="goBack" :icon="Back">返回</el-button>
      <h2>消息搜索</h2>
      <div></div>
    </div>

    <div class="chat-search__container">
      <!-- 搜索表单 -->
      <div class="chat-search__form">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索消息内容或发送者..."
          clearable
          @input="onKeywordChange"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 高级筛选 -->
        <el-collapse-transition>
          <div v-if="showFilters" class="chat-search__filters">
            <el-row :gutter="16">
              <!-- 发送者筛选 -->
              <el-col :span="12">
                <el-select
                  v-model="searchParams.senderId"
                  placeholder="选择发送者"
                  clearable
                  @change="handleSearch"
                >
                  <el-option
                    v-for="sender in senders"
                    :key="sender.id"
                    :label="sender.name"
                    :value="sender.id"
                  />
                </el-select>
              </el-col>

              <!-- 消息类型筛选 -->
              <el-col :span="12">
                <el-select
                  v-model="searchParams.type"
                  placeholder="选择消息类型"
                  clearable
                  @change="handleSearch"
                >
                  <el-option label="全部" value="" />
                  <el-option label="文本" value="text" />
                  <el-option label="图片" value="image" />
                  <el-option label="文件" value="file" />
                  <el-option label="语音" value="voice" />
                  <el-option label="视频" value="video" />
                </el-select>
              </el-col>
            </el-row>

            <el-row :gutter="16" style="margin-top: 12px">
              <!-- 日期范围筛选 -->
              <el-col :span="12">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  @change="onDateRangeChange"
                />
              </el-col>

              <!-- 消息状态筛选 -->
              <el-col :span="12">
                <el-select
                  v-model="searchParams.status"
                  placeholder="选择消息状态"
                  clearable
                  @change="handleSearch"
                >
                  <el-option label="全部" value="" />
                  <el-option label="待发送" value="pending" />
                  <el-option label="已发送" value="sent" />
                  <el-option label="已读" value="read" />
                  <el-option label="失败" value="failed" />
                </el-select>
              </el-col>
            </el-row>
          </div>
        </el-collapse-transition>

        <!-- 操作按钮 -->
        <div class="chat-search__actions">
          <el-button
            :icon="showFilters ? ArrowUp : ArrowDown"
            text
            @click="showFilters = !showFilters"
          >
            {{ showFilters ? '隐藏筛选' : '高级筛选' }}
          </el-button>
          <el-button type="primary" @click="handleSearch" :loading="searching">
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div class="chat-search__results">
        <div v-if="searching" class="chat-search__loading">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="!hasSearched" class="chat-search__empty">
          <el-empty description="输入关键词开始搜索" />
        </div>

        <div v-else-if="searchResults.length === 0" class="chat-search__no-results">
          <el-empty description="未找到匹配的消息" />
        </div>

        <div v-else class="chat-search__list">
          <div class="chat-search__count">
            找到 {{ searchResults.length }} 条结果
          </div>

          <div
            v-for="(message, index) in searchResults"
            :key="`${message.id}-${index}`"
            class="chat-search__item"
            @click="selectMessage(message)"
          >
            <!-- 消息发送者信息 -->
            <div class="chat-search__item-header">
              <el-avatar
                :size="32"
                :src="message.senderAvatar"
                :title="message.senderName"
              >
                {{ message.senderName?.slice(0, 1) }}
              </el-avatar>
              <div class="chat-search__item-info">
                <span class="chat-search__sender">{{ message.senderName }}</span>
                <span class="chat-search__time">
                  {{ formatTime(message.createdAt) }}
                </span>
              </div>
              <div class="chat-search__item-status">
                <el-tag
                  v-if="message.status"
                  :type="getStatusType(message.status)"
                  size="small"
                >
                  {{ formatStatus(message.status) }}
                </el-tag>
              </div>
            </div>

            <!-- 消息内容 -->
            <div class="chat-search__item-content">
              <div v-if="message.type === 'text'" class="chat-search__text">
                {{ truncateContent(message.content, 200) }}
              </div>
              <div v-else-if="message.type === 'image'" class="chat-search__media">
                <el-icon><Picture /></el-icon> 图片消息
              </div>
              <div v-else-if="message.type === 'file'" class="chat-search__media">
                <el-icon><DocumentCopy /></el-icon> 文件: {{ message.fileName }}
              </div>
              <div v-else-if="message.type === 'voice'" class="chat-search__media">
                <el-icon><Headset /></el-icon> 语音消息
              </div>
              <div v-else-if="message.type === 'video'" class="chat-search__media">
                <el-icon><VideoPlay /></el-icon> 视频消息
              </div>
            </div>

            <!-- 匹配字段标记 -->
            <div v-if="message.matchedFields" class="chat-search__matched-fields">
              <el-tag
                v-for="field in message.matchedFields"
                :key="field"
                size="small"
                type="info"
              >
                {{ formatFieldName(field) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  searchMessagesLocally,
  formatSearchResults,
  getSearchSuggestions
} from '@/services/messageSearchService'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'
import { ElMessage } from 'element-plus'
import {
  Back,
  Search,
  ArrowUp,
  ArrowDown,
  Picture,
  DocumentCopy,
  Headset,
  VideoPlay
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const store = useChatWorkspaceStore()

const searching = ref(false)
const hasSearched = ref(false)
const showFilters = ref(false)
const dateRange = ref([])

const searchResults = ref([])
const searchParams = ref({
  keyword: route.query.q || '',
  senderId: '',
  type: '',
  status: '',
  startDate: null,
  endDate: null
})

// 获取发送者列表
const senders = computed(() => {
  const senderSet = new Set()
  const senderList = []

  store.activeMessages?.forEach(msg => {
    if (msg?.senderId && !senderSet.has(msg.senderId)) {
      senderSet.add(msg.senderId)
      senderList.push({
        id: msg.senderId,
        name: msg.senderName || 'Unknown'
      })
    }
  })

  return senderList
})

// 组件挂载
onMounted(() => {
  if (searchParams.value.keyword) {
    handleSearch()
  }
})

// 关键词变化
function onKeywordChange(value) {
  searchParams.value.keyword = value
}

// 日期范围变化
function onDateRangeChange(value) {
  if (Array.isArray(value) && value.length === 2) {
    searchParams.value.startDate = value[0]
    searchParams.value.endDate = value[1]
    handleSearch()
  } else {
    searchParams.value.startDate = null
    searchParams.value.endDate = null
  }
}

// 执行搜索
async function handleSearch() {
  if (!searchParams.value.keyword?.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  searching.value = true
  hasSearched.value = true

  try {
    // 使用本地搜索
    const results = searchMessagesLocally(
      store.activeMessages || [],
      searchParams.value.keyword,
      {
        senderId: searchParams.value.senderId,
        type: searchParams.value.type,
        status: searchParams.value.status,
        startDate: searchParams.value.startDate,
        endDate: searchParams.value.endDate
      }
    )

    // 格式化结果
    searchResults.value = formatSearchResults(
      results,
      searchParams.value.keyword
    )

    if (searchResults.value.length === 0) {
      ElMessage.info('未找到匹配的消息')
    } else {
      ElMessage.success(`找到 ${searchResults.value.length} 条结果`)
    }
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('搜索出错，请重试')
  } finally {
    searching.value = false
  }
}

// 重置搜索
function resetSearch() {
  searchParams.value = {
    keyword: '',
    senderId: '',
    type: '',
    status: '',
    startDate: null,
    endDate: null
  }
  dateRange.value = []
  searchResults.value = []
  hasSearched.value = false
}

// 选择消息
function selectMessage(message) {
  if (message?.conversationId) {
    router.push({
      name: 'ChatRoom',
      params: { roomId: message.conversationId },
      query: { messageId: message.id }
    })
  }
}

// 返回
function goBack() {
  router.back()
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }

  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 其他
  return date.toLocaleDateString('zh-CN')
}

// 格式化状态
function formatStatus(status) {
  const statusMap = {
    pending: '待发送',
    sent: '已发送',
    read: '已读',
    failed: '失败',
    uploading: '上传中'
  }
  return statusMap[status] || status
}

// 获取状态样式
function getStatusType(status) {
  const typeMap = {
    pending: 'warning',
    sent: 'info',
    read: 'success',
    failed: 'danger',
    uploading: 'warning'
  }
  return typeMap[status] || 'info'
}

// 截断内容
function truncateContent(content, maxLength = 200) {
  if (!content) return ''
  return content.length > maxLength
    ? content.substring(0, maxLength) + '...'
    : content
}

// 格式化字段名
function formatFieldName(field) {
  const fieldMap = {
    content: '内容',
    senderName: '发送者'
  }
  return fieldMap[field] || field
}
</script>

<style scoped>
.chat-search {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.chat-search__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #ebeef5;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.chat-search__container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

.chat-search__form {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-search__filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.chat-search__actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: flex-end;
}

.chat-search__results {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-search__loading,
.chat-search__empty,
.chat-search__no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.chat-search__list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.chat-search__count {
  padding: 12px 20px;
  background: #f5f7fa;
  color: #606266;
  font-size: 14px;
  border-bottom: 1px solid #ebeef5;
}

.chat-search__item {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f5f7fa;
  }
}

.chat-search__item-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.chat-search__item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-search__sender {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.chat-search__time {
  font-size: 12px;
  color: #909399;
}

.chat-search__item-status {
  display: flex;
  align-items: center;
}

.chat-search__item-content {
  margin-left: 44px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  word-break: break-word;
}

.chat-search__text {
  white-space: pre-wrap;
}

.chat-search__media {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.chat-search__matched-fields {
  margin-top: 8px;
  margin-left: 44px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>


