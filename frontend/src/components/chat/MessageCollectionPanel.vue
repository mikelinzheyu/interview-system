<template>
  <div class="message-collection-panel">
    <!-- 标题栏 -->
    <div class="panel-header">
      <h3 class="panel-title">📌 收藏消息 ({{ collectionCount }})</h3>
      <div class="header-actions">
        <el-button
          v-if="selectedCollections.length > 0"
          link
          text
          type="danger"
          size="small"
          @click="handleBatchDelete"
        >
          删除 ({{ selectedCollections.length }})
        </el-button>
        <el-button
          link
          text
          type="primary"
          size="small"
          @click="handleClearAll"
        >
          清空
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="panel-toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索收藏..."
        clearable
        size="small"
        prefix-icon="Search"
        @input="handleSearch"
      />
      <el-select
        v-model="filterType"
        placeholder="类型"
        clearable
        size="small"
        style="width: 100px"
        @change="handleFilterChange"
      >
        <el-option label="全部" value="" />
        <el-option label="文本" value="text" />
        <el-option label="图片" value="image" />
        <el-option label="文件" value="file" />
      </el-select>
      <el-select
        v-model="sortBy"
        placeholder="排序"
        size="small"
        style="width: 100px"
        @change="handleFilterChange"
      >
        <el-option label="最新" value="recent" />
        <el-option label="最早" value="oldest" />
      </el-select>
    </div>

    <!-- 收藏列表 -->
    <div v-if="filteredCollections.length > 0" class="collection-list">
      <div
        v-for="(collection, index) in paginatedCollections"
        :key="collection.id"
        class="collection-item"
        :class="{ 'is-selected': selectedCollections.includes(collection.messageId) }"
        @click="handleSelectCollection(collection.messageId, $event)"
      >
        <!-- 选择框 -->
        <el-checkbox
          :model-value="selectedCollections.includes(collection.messageId)"
          @change="handleSelectCollection(collection.messageId, $event)"
        />

        <!-- 内容 -->
        <div class="collection-content">
          <!-- 发送者和时间 -->
          <div class="collection-meta">
            <span class="sender-name">{{ collection.senderName }}</span>
            <span class="collection-time">{{ formatTime(collection.collectedAt) }}</span>
          </div>

          <!-- 消息内容 -->
          <div class="collection-message">
            {{ truncateText(collection.messageContent, 100) }}
          </div>

          <!-- 标签 -->
          <div v-if="collection.tags.length > 0" class="collection-tags">
            <el-tag
              v-for="tag in collection.tags"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>

          <!-- 备注 -->
          <div v-if="collection.notes" class="collection-notes">
            💬 {{ collection.notes }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="collection-actions">
          <el-button
            link
            text
            size="small"
            type="primary"
            @click.stop="handleViewCollection(collection)"
          >
            查看
          </el-button>
          <el-button
            link
            text
            size="small"
            type="danger"
            @click.stop="handleDeleteCollection(collection.messageId)"
          >
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-else
      description="还没有收藏任何消息"
      :image-size="100"
      class="empty-state"
    />

    <!-- 分页 -->
    <div v-if="filteredCollections.length > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredCollections.length"
        layout="total, sizes, prev, pager, next"
      />
    </div>

    <!-- 收藏详情弹窗 -->
    <CollectionDetailModal
      v-if="selectedCollection"
      :visible.sync="showDetailModal"
      :collection="selectedCollection"
      @close="selectedCollection = null"
      @update-note="handleUpdateNote"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMessageCollection } from '@/services/messageCollectionService'
import CollectionDetailModal from './CollectionDetailModal.vue'

const { getCollections, uncollectMessage, batchUncollect, clearCollections, updateCollectionNote, collectionCount } = useMessageCollection()

// 搜索和筛选
const searchKeyword = ref('')
const filterType = ref('')
const sortBy = ref('recent')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// UI 状态
const selectedCollections = ref([])
const selectedCollection = ref(null)
const showDetailModal = ref(false)

// 获取筛选后的收藏列表
const filteredCollections = computed(() => {
  return getCollections({
    keyword: searchKeyword.value,
    type: filterType.value || undefined,
    sortBy: sortBy.value
  })
})

// 获取分页后的收藏列表
const paginatedCollections = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCollections.value.slice(start, end)
})

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * 截断文本
 */
function truncateText(text, maxLength) {
  if (!text) return '(空消息)'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * 处理搜索
 */
function handleSearch() {
  currentPage.value = 1
}

/**
 * 处理筛选变化
 */
function handleFilterChange() {
  currentPage.value = 1
}

/**
 * 选择/取消选择收藏
 */
function handleSelectCollection(messageId, event) {
  if (selectedCollections.value.includes(messageId)) {
    selectedCollections.value = selectedCollections.value.filter(id => id !== messageId)
  } else {
    selectedCollections.value.push(messageId)
  }
}

/**
 * 查看收藏详情
 */
function handleViewCollection(collection) {
  selectedCollection.value = collection
  showDetailModal.value = true
}

/**
 * 删除单个收藏
 */
async function handleDeleteCollection(messageId) {
  try {
    await ElMessageBox.confirm(
      '确定要取消收藏吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await uncollectMessage(messageId)
    selectedCollections.value = selectedCollections.value.filter(id => id !== messageId)
  } catch (error) {
    // 用户取消
  }
}

/**
 * 批量删除收藏
 */
async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCollections.value.length} 条收藏吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await batchUncollect(selectedCollections.value)
    selectedCollections.value = []
  } catch (error) {
    // 用户取消
  }
}

/**
 * 清空所有收藏
 */
async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有收藏吗？此操作无法撤销！',
      '警告',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await clearCollections()
    selectedCollections.value = []
  } catch (error) {
    // 用户取消
  }
}

/**
 * 更新收藏备注
 */
function handleUpdateNote(messageId, note) {
  updateCollectionNote(messageId, note)
}
</script>

<style scoped>
.message-collection-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.panel-toolbar {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  flex-shrink: 0;
}

.panel-toolbar :deep(.el-input),
.panel-toolbar :deep(.el-select) {
  font-size: 12px;
}

.collection-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.collection-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.collection-item:hover {
  background: #f5f7fa;
}

.collection-item.is-selected {
  background: #e6f7ff;
}

.collection-content {
  flex: 1;
  min-width: 0;
}

.collection-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.sender-name {
  color: #303133;
  font-weight: 500;
}

.collection-time {
  color: #909399;
}

.collection-message {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.collection-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.collection-notes {
  font-size: 11px;
  color: #909399;
  font-style: italic;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.collection-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}
</style>
