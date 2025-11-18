<template>
  <div class="collection-manager">
    <!-- Header -->
    <div class="manager-header">
      <h3 class="manager-title">
        <i class="el-icon-folder"></i> 我的学科集合
      </h3>
      <el-button
        type="primary"
        icon="Plus"
        @click="showNewCollectionDialog = true"
      >
        新建集合
      </el-button>
    </div>

    <!-- Toolbar -->
    <div class="manager-toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索集合..."
        clearable
        size="small"
        class="search-input"
        @input="handleSearch"
      >
        <template #prefix>
          <i class="el-icon-search"></i>
        </template>
      </el-input>

      <el-select
        v-model="sortBy"
        size="small"
        placeholder="排序方式"
        class="sort-select"
        @change="handleSort"
      >
        <el-option label="最近更新" value="updated" />
        <el-option label="最近创建" value="created" />
        <el-option label="域数量" value="domainCount" />
        <el-option label="完成率" value="completion" />
      </el-select>

      <span class="stats-text">
        {{ filteredCollections.length }} 个集合
      </span>
    </div>

    <!-- Collections Grid -->
    <div v-if="filteredCollections.length > 0" class="collections-grid">
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        class="collection-card"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="header-left">
            <span class="collection-icon">{{ collection.icon }}</span>
            <div class="collection-info">
              <h4 class="collection-name">{{ collection.name }}</h4>
              <p class="collection-desc">{{ collection.description }}</p>
            </div>
          </div>

          <!-- Header Actions -->
          <el-dropdown @command="handleCardAction($event, collection)">
            <el-button text type="primary" icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="view">查看详情</el-dropdown-item>
                <el-dropdown-item command="export">导出</el-dropdown-item>
              <el-dropdown-item command="share">分享</el-dropdown-item>
              <el-dropdown-item divided disabled>----------------</el-dropdown-item>
              <el-dropdown-item command="delete">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- Card Stats -->
        <div class="card-stats">
          <div class="stat">
            <span class="stat-value">{{ collection.domains.length }}</span>
            <span class="stat-label">学科</span>
          </div>
          <div class="stat">
            <el-progress
              :percentage="getCollectionStats(collection).completionPercentage"
              :color="getProgressColor(getCollectionStats(collection).completionPercentage)"
              :show-text="false"
            />
            <span class="stat-label">{{ getCollectionStats(collection).completionPercentage }}% 完成</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getCollectionStats(collection).averagePriority }}</span>
            <span class="stat-label">平均优先级</span>
          </div>
        </div>

        <!-- Card Tags -->
        <div v-if="collection.tags.length > 0" class="card-tags">
          <el-tag
            v-for="tag in collection.tags"
            :key="tag"
            size="small"
            effect="light"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <span class="update-time">
            更新于 {{ formatDate(collection.updatedAt) }}
          </span>
          <el-button
            size="small"
            type="primary"
            @click="viewCollectionDetails(collection)"
          >
            管理
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-illustration">📚</div>
      <p class="empty-text">还没有学科集合</p>
      <p class="empty-desc">创建集合来组织你的学习域</p>
      <el-button
        type="primary"
        icon="Plus"
        @click="showNewCollectionDialog = true"
      >
        创建第一个集合
      </el-button>
    </div>

    <!-- New Collection Dialog -->
    <el-dialog
      v-model="showNewCollectionDialog"
      title="新建集合"
      width="50%"
      @close="resetNewCollectionForm"
    >
      <div class="new-collection-form">
        <el-form
          :model="newCollectionForm"
          :rules="collectionRules"
          ref="formRef"
          label-width="100px"
        >
          <el-form-item label="集合名称" prop="name">
            <el-input
              v-model="newCollectionForm.name"
              placeholder="例如: 前端开发学习路径"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="描述" prop="description">
            <el-input
              v-model="newCollectionForm.description"
              type="textarea"
              placeholder="描述这个集合的目的"
              maxlength="200"
              show-word-limit"
              :rows="3"
            />
          </el-form-item>

          <el-form-item label="颜色" prop="color">
            <div class="color-picker">
              <div
                v-for="color in colorOptions"
                :key="color"
                class="color-option"
                :style="{ backgroundColor: color }"
                :class="{ active: newCollectionForm.color === color }"
                @click="newCollectionForm.color = color"
              ></div>
            </div>
          </el-form-item>

          <el-form-item label="图标" prop="icon">
            <div class="icon-picker">
              <div
                v-for="icon in iconOptions"
                :key="icon"
                class="icon-option"
                :class="{ active: newCollectionForm.icon === icon }"
                @click="newCollectionForm.icon = icon"
              >
                {{ icon }}
              </div>
            </div>
          </el-form-item>

          <el-form-item label="标签" prop="tags">
            <el-input
              v-model="newCollectionForm.tagInput"
              placeholder="输入标签，按Enter添加"
              size="small"
              @keyup.enter="addTag"
            />
            <div class="tags-display">
              <el-tag
                v-for="tag in newCollectionForm.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="newCollectionForm.isPublic">
              允许其他用户访问此集合
            </el-checkbox>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showNewCollectionDialog = false">取消</el-button>
        <el-button type="primary" @click="createNewCollection">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- Collection Details Drawer -->
    <el-drawer
      v-model="showCollectionDetails"
      title="集合详情"
      size="50%"
      :before-close="handleCloseDetails"
    >
      <div v-if="selectedCollection" class="details-content">
        <!-- Header -->
        <div class="details-header">
          <span class="details-icon">{{ selectedCollection.icon }}</span>
          <div class="details-info">
            <h3 class="details-title">{{ selectedCollection.name }}</h3>
            <p class="details-desc">{{ selectedCollection.description }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="details-stats">
          <div class="stat">
            <span class="stat-label">域数量</span>
            <span class="stat-value">{{ selectedCollection.domains.length }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">完成率</span>
            <span class="stat-value">
              {{ getCollectionStats(selectedCollection).completionPercentage }}%
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">优先级</span>
            <span class="stat-value">
              {{ getCollectionStats(selectedCollection).averagePriority }}/5
            </span>
          </div>
        </div>

        <el-divider></el-divider>

        <!-- Toolbar -->
        <div class="details-toolbar">
          <el-input
            v-model="detailsSearchQuery"
            placeholder="搜索域..."
            clearable
            size="small"
            @input="handleDetailsSearch"
          />

          <el-select
            v-model="detailsSortBy"
            size="small"
            placeholder="排序"
            @change="handleDetailsSort"
          >
            <el-option label="优先级" value="priority" />
            <el-option label="名称" value="name" />
            <el-option label="添加时间" value="added" />
            <el-option label="完成状态" value="completed" />
          </el-select>

          <el-button
            type="primary"
            size="small"
            icon="Plus"
            @click="showAddDomainDialog = true"
          >
            添加域
          </el-button>
        </div>

        <!-- Domains List -->
        <div class="domains-list">
          <div
            v-for="(domain, index) in filteredDetailsDomains"
            :key="domain.domainId"
            class="domain-item"
          >
            <!-- Domain Checkbox -->
            <el-checkbox
              :model-value="domain.isCompleted"
              @update:model-value="(val) => markDomainCompleted(domain.domainId, val)"
            />

            <!-- Domain Info -->
            <div class="domain-main">
              <div class="domain-header">
                <h4 class="domain-name" :class="{ completed: domain.isCompleted }">
                  {{ domain.domainName }}
                </h4>
                <el-tag
                  v-for="customTag in domain.customTags"
                  :key="customTag"
                  size="small"
                  closable
                  @close="removeTagFromDomain(domain.domainId, customTag)"
                >
                  {{ customTag }}
                </el-tag>
              </div>

              <p v-if="domain.notes" class="domain-notes">
                {{ domain.notes }}
              </p>

              <div class="domain-meta">
                <span class="priority">
                  优先级:
                  <el-rate
                    v-model="domain.priority"
                    :max="5"
                    size="small"
                    @change="updateDomainPriority(domain.domainId, domain.priority)"
                  />
                </span>
                <span class="added-date">
                  {{ formatDate(domain.addedAt) }} 添加
                </span>
              </div>
            </div>

            <!-- Domain Actions -->
            <el-button
              text
              type="danger"
              size="small"
              icon="Close"
              @click="removeDomainFromCollection(domain.domainId)"
            />
          </div>

          <!-- Empty Domains -->
          <div v-if="selectedCollection.domains.length === 0" class="empty-domains">
            <p>集合中没有域</p>
            <el-button
              type="primary"
              size="small"
              @click="showAddDomainDialog = true"
            >
              添加第一个域
            </el-button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="details-actions">
          <el-button @click="exportCollectionData">导出</el-button>
          <el-button @click="deleteCollection">删除集合</el-button>
          <el-button type="primary" @click="showCollectionDetails = false">
            完成
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Add Domain Dialog -->
    <el-dialog
      v-model="showAddDomainDialog"
      title="添加域到集合"
      width="50%"
    >
      <div class="add-domain-form">
        <el-form label-width="100px">
          <el-form-item label="选择域">
            <el-select
              v-model="selectedDomainToAdd"
              placeholder="选择要添加的域"
              clearable
              filterable
            >
              <el-option
                v-for="domain in availableDomainsToAdd"
                :key="domain.id"
                :label="domain.name"
                :value="domain.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="addDomainForm.notes"
              type="textarea"
              placeholder="为这个域添加备注"
              :rows="3"
            />
          </el-form-item>

          <el-form-item label="优先级">
            <el-rate v-model="addDomainForm.priority" :max="5" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showAddDomainDialog = false">取消</el-button>
        <el-button type="primary" @click="addDomainToCollection">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDomainStore } from '@/stores/domain'
import collectionService from '@/services/collectionService'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useDomainStore()
const formRef = ref(null)

// State
const collections = ref([])
const selectedCollection = ref(null)
const searchQuery = ref('')
const sortBy = ref('updated')
const detailsSearchQuery = ref('')
const detailsSortBy = ref('priority')

// Dialogs
const showNewCollectionDialog = ref(false)
const showCollectionDetails = ref(false)
const showAddDomainDialog = ref(false)

// Forms
const newCollectionForm = ref({
  name: '',
  description: '',
  color: '#5e7ce0',
  icon: '📚',
  tags: [],
  tagInput: '',
  isPublic: false
})

const addDomainForm = ref({
  notes: '',
  priority: 3
})

const selectedDomainToAdd = ref(null)

// Options
const colorOptions = ref([])
const iconOptions = ref([])

// Rules
const collectionRules = ref({
  name: [{ required: true, message: '集合名称不能为空', trigger: 'blur' }]
})

// Computed
const filteredCollections = computed(() => {
  let result = [...collections.value]

  // Search
  if (searchQuery.value.trim().length > 0) {
    result = collectionService.searchCollections(result, searchQuery.value)
  }

  // Sort
  const sortMap = {
    updated: (a, b) => b.updatedAt - a.updatedAt,
    created: (a, b) => b.createdAt - a.createdAt,
    domainCount: (a, b) => b.domains.length - a.domains.length,
    completion: (a, b) => {
      const statsA = getCollectionStats(a).completionPercentage
      const statsB = getCollectionStats(b).completionPercentage
      return statsB - statsA
    }
  }

  result.sort(sortMap[sortBy.value] || sortMap.updated)
  return result
})

const filteredDetailsDomains = computed(() => {
  if (!selectedCollection.value) return []

  const filtered = collectionService.filterDomains(selectedCollection.value, {
    searchQuery: detailsSearchQuery.value
  })

  // Sort
  collectionService.sortDomains(
    { domains: filtered },
    detailsSortBy.value,
    true
  )

  return filtered
})

const availableDomainsToAdd = computed(() => {
  if (!selectedCollection.value) return []

  const domainIds = new Set(selectedCollection.value.domains.map(d => d.domainId))
  return store.domains.filter(d => !domainIds.has(d.id))
})

/**
 * Initialize component
 */
const initialize = async () => {
  // Load color and icon options
  colorOptions.value = collectionService.getColorOptions()
  iconOptions.value = collectionService.getIconOptions()

  // Load collections from localStorage (mock)
  const saved = localStorage.getItem('collections')
  if (saved) {
    try {
      collections.value = JSON.parse(saved)
    } catch (err) {
      console.error('Failed to load collections:', err)
    }
  }

  // Load domains
  if (store.domains.length === 0) {
    await store.loadDomains()
  }
}

/**
 * Get collection statistics
 */
const getCollectionStats = (collection) => {
  return collectionService.getCollectionStats(collection)
}

/**
 * Get progress color
 */
const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 40) return '#e6a23c'
  return '#f56c6c'
}

/**
 * Format date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Add tag to new collection
 */
const addTag = () => {
  const tag = newCollectionForm.value.tagInput.trim()
  if (tag && !newCollectionForm.value.tags.includes(tag)) {
    newCollectionForm.value.tags.push(tag)
    newCollectionForm.value.tagInput = ''
  }
}

/**
 * Remove tag from new collection
 */
const removeTag = (tag) => {
  newCollectionForm.value.tags = newCollectionForm.value.tags.filter(t => t !== tag)
}

/**
 * Create new collection
 */
const createNewCollection = async () => {
  try {
    await formRef.value.validate()

    const newCollection = collectionService.createCollection({
      userId: 'current_user',
      name: newCollectionForm.value.name,
      description: newCollectionForm.value.description,
      color: newCollectionForm.value.color,
      icon: newCollectionForm.value.icon,
      tags: newCollectionForm.value.tags,
      isPublic: newCollectionForm.value.isPublic
    })

    collections.value.push(newCollection)
    saveCollections()

    ElMessage.success('集合创建成功')
    showNewCollectionDialog.value = false
    resetNewCollectionForm()
  } catch (err) {
    console.error('Failed to create collection:', err)
  }
}

/**
 * Reset new collection form
 */
const resetNewCollectionForm = () => {
  newCollectionForm.value = {
    name: '',
    description: '',
    color: '#5e7ce0',
    icon: '📚',
    tags: [],
    tagInput: '',
    isPublic: false
  }
}

/**
 * View collection details
 */
const viewCollectionDetails = (collection) => {
  selectedCollection.value = JSON.parse(JSON.stringify(collection))
  detailsSearchQuery.value = ''
  detailsSortBy.value = 'priority'
  showCollectionDetails.value = true
}

/**
 * Handle close details
 */
const handleCloseDetails = () => {
  showCollectionDetails.value = false
}

/**
 * Add domain to collection
 */
const addDomainToCollection = () => {
  if (!selectedDomainToAdd.value) {
    ElMessage.warning('请选择要添加的域')
    return
  }

  const domain = store.domains.find(d => d.id === selectedDomainToAdd.value)
  if (!domain) return

  try {
    collectionService.addDomainToCollection(selectedCollection.value, domain.id, {
      domainName: domain.name,
      notes: addDomainForm.value.notes,
      priority: addDomainForm.value.priority
    })

    // Update original collection
    const originalIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
    if (originalIndex >= 0) {
      collections.value[originalIndex] = JSON.parse(JSON.stringify(selectedCollection.value))
      saveCollections()
    }

    ElMessage.success('域已添加')
    showAddDomainDialog.value = false
    selectedDomainToAdd.value = null
    addDomainForm.value = { notes: '', priority: 3 }
  } catch (err) {
    ElMessage.error(err.message)
  }
}

/**
 * Remove domain from collection
 */
const removeDomainFromCollection = (domainId) => {
  ElMessageBox.confirm('确定删除此域吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    collectionService.removeDomainFromCollection(selectedCollection.value, domainId)

    // Update
    const originalIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
    if (originalIndex >= 0) {
      collections.value[originalIndex] = JSON.parse(JSON.stringify(selectedCollection.value))
      saveCollections()
    }

    ElMessage.success('域已删除')
  }).catch(() => {})
}

/**
 * Mark domain as completed
 */
const markDomainCompleted = (domainId, completed) => {
  collectionService.markDomainCompleted(selectedCollection.value, domainId, completed)

  const originalIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
  if (originalIndex >= 0) {
    collections.value[originalIndex] = JSON.parse(JSON.stringify(selectedCollection.value))
    saveCollections()
  }
}

/**
 * Update domain priority
 */
const updateDomainPriority = (domainId, priority) => {
  collectionService.updateDomainPriority(selectedCollection.value, domainId, priority)

  const originalIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
  if (originalIndex >= 0) {
    collections.value[originalIndex] = JSON.parse(JSON.stringify(selectedCollection.value))
    saveCollections()
  }
}

/**
 * Remove tag from domain
 */
const removeTagFromDomain = (domainId, tag) => {
  collectionService.removeTagFromDomain(selectedCollection.value, domainId, tag)

  const originalIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
  if (originalIndex >= 0) {
    collections.value[originalIndex] = JSON.parse(JSON.stringify(selectedCollection.value))
    saveCollections()
  }
}

/**
 * Export collection
 */
const exportCollectionData = () => {
  const json = collectionService.exportCollection(selectedCollection.value)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `collection-${selectedCollection.value.name}-${Date.now()}.json`
  link.click()

  ElMessage.success('集合已导出')
}

/**
 * Delete collection
 */
const deleteCollection = () => {
  ElMessageBox.confirm('确定删除此集合吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    collections.value = collections.value.filter(c => c.id !== selectedCollection.value.id)
    saveCollections()

    showCollectionDetails.value = false
    selectedCollection.value = null

    ElMessage.success('集合已删除')
  }).catch(() => {})
}

/**
 * Save collections to localStorage
 */
const saveCollections = () => {
  localStorage.setItem('collections', JSON.stringify(collections.value))
}

/**
 * Handle card action
 */
const handleCardAction = (command, collection) => {
  switch (command) {
    case 'edit':
      // TODO: Edit collection
      break
    case 'view':
      viewCollectionDetails(collection)
      break
    case 'export':
      const json = collectionService.exportCollection(collection)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `collection-${collection.name}-${Date.now()}.json`
      link.click()
      ElMessage.success('集合已导出')
      break
    case 'share':
      const shareLink = collectionService.generateShareLink(collection)
      navigator.clipboard.writeText(shareLink)
      ElMessage.success('分享链接已复制')
      break
    case 'delete':
      ElMessageBox.confirm('确定删除此集合吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        collections.value = collections.value.filter(c => c.id !== collection.id)
        saveCollections()
        ElMessage.success('集合已删除')
      }).catch(() => {})
      break
  }
}

/**
 * Handle search
 */
const handleSearch = () => {
  // Computed property handles filtering
}

/**
 * Handle sort
 */
const handleSort = () => {
  // Computed property handles sorting
}

/**
 * Handle details search
 */
const handleDetailsSearch = () => {
  // Computed property handles filtering
}

/**
 * Handle details sort
 */
const handleDetailsSort = () => {
  // Computed property handles sorting
}

// Lifecycle
onMounted(initialize)
</script>

<style scoped>
.collection-manager {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.manager-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.manager-title i {
  color: #5e7ce0;
}

.manager-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.sort-select {
  width: 120px;
}

.stats-text {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.collection-card {
  background: white;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-card:hover {
  border-color: rgba(94, 124, 224, 0.3);
  box-shadow: 0 4px 12px rgba(94, 124, 224, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.collection-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.collection-info {
  flex: 1;
  min-width: 0;
}

.collection-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
  word-break: break-word;
}

.collection-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #5e7ce0;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(229, 230, 235, 0.3);
}

.update-time {
  font-size: 11px;
  color: #9ca3af;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.empty-illustration {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

/* Dialog Styles */
.new-collection-form {
  padding: 20px 0;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.icon-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.icon-option {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid rgba(229, 230, 235, 0.6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.05);
}

.icon-option.active {
  border-color: #5e7ce0;
  background: rgba(94, 124, 224, 0.1);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

/* Drawer Styles */
.details-content {
  padding: 20px;
}

.details-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.details-icon {
  font-size: 48px;
}

.details-info {
  flex: 1;
}

.details-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.details-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.details-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.details-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.details-toolbar :deep(.el-input) {
  flex: 1;
}

.domains-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.domain-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  align-items: flex-start;
}

.domain-main {
  flex: 1;
  min-width: 0;
}

.domain-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.domain-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.domain-name.completed {
  text-decoration: line-through;
  color: #9ca3af;
}

.domain-notes {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
  font-style: italic;
}

.domain-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #9ca3af;
}

.empty-domains {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.details-actions {
  display: flex;
  gap: 12px;
}

.details-actions :deep(.el-button) {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .collections-grid {
    grid-template-columns: 1fr;
  }

  .manager-toolbar {
    flex-wrap: wrap;
  }

  .card-stats {
    grid-template-columns: 1fr;
  }

  .details-stats {
    grid-template-columns: 1fr;
  }
}
</style>
