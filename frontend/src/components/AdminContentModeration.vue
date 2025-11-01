<template>
  <div class="admin-content-moderation">
    <!-- Header -->
    <div class="moderation-header">
      <h3 class="header-title">
        <span class="title-icon">📋</span> 内容审核
      </h3>
      <el-button type="primary" @click="refreshContent">
        🔄 刷新内容
      </el-button>
    </div>

    <!-- Status Overview -->
    <div class="status-overview">
      <div class="status-card">
        <div class="status-number">{{ contentStats.totalPending }}</div>
        <div class="status-label">待审核</div>
      </div>
      <div class="status-card">
        <div class="status-number">{{ contentStats.approved }}</div>
        <div class="status-label">已批准</div>
      </div>
      <div class="status-card">
        <div class="status-number">{{ contentStats.rejected }}</div>
        <div class="status-label">已拒绝</div>
      </div>
      <div class="status-card">
        <div class="status-number">{{ contentStats.reported }}</div>
        <div class="status-label">被举报</div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索内容标题或作者..."
        prefix-icon="Search"
        @input="handleSearch"
        clearable
        style="flex: 1; max-width: 300px;"
      />

      <el-select v-model="selectedStatus" placeholder="按审核状态筛选" clearable @change="handleFilter">
        <el-option label="全部状态" value="all" />
        <el-option label="待审核" value="pending" />
        <el-option label="已批准" value="approved" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>

      <el-select v-model="selectedContentType" placeholder="按内容类型筛选" clearable @change="handleFilter">
        <el-option label="全部类型" value="all" />
        <el-option label="论坛帖子" value="forum" />
        <el-option label="用户指南" value="guide" />
        <el-option label="用户评论" value="comment" />
      </el-select>

      <el-select v-model="sortBy" placeholder="排序方式" @change="handleFilter">
        <el-option label="最新优先" value="newest" />
        <el-option label="最早优先" value="oldest" />
        <el-option label="报告数最多" value="reports" />
      </el-select>
    </div>

    <!-- Content List Table -->
    <div class="content-table-section">
      <el-table
        :data="filteredContent"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />

        <el-table-column label="内容" width="250">
          <template #default="{ row }">
            <div class="content-cell">
              <div class="content-title">{{ row.title }}</div>
              <div class="content-info">
                <span class="content-type-badge">{{ getContentTypeLabel(row.type) }}</span>
                <span class="content-author">作者: {{ row.author.name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="报告数" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.reports > 0" type="danger">{{ row.reports }}</el-tag>
            <span v-else style="color: #6b7280;">0</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewContentDetails(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="success"
              size="small"
              @click="approveContentConfirm(row)"
            >
              批准
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="warning"
              size="small"
              @click="rejectContentForm(row)"
            >
              拒绝
            </el-button>
            <el-button link type="danger" size="small" @click="deleteContentConfirm(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalContent"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadContent"
          @size-change="loadContent"
        />
      </div>
    </div>

    <!-- Content Details Dialog -->
    <el-dialog v-model="detailsVisible" :title="`内容详情 - ${selectedContent?.title}`" width="700px" center>
      <div v-if="selectedContent" class="content-details">
        <!-- Basic Info -->
        <div class="details-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">标题</span>
              <span class="value">{{ selectedContent.title }}</span>
            </div>
            <div class="info-item">
              <span class="label">内容类型</span>
              <span class="value">{{ getContentTypeLabel(selectedContent.type) }}</span>
            </div>
            <div class="info-item">
              <span class="label">作者</span>
              <span class="value">{{ selectedContent.author.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(selectedContent.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Content Preview -->
        <div class="details-section">
          <h4>内容预览</h4>
          <div class="content-preview">
            {{ selectedContent.content }}
          </div>
        </div>

        <!-- Reports -->
        <div class="details-section" v-if="selectedContent.reports > 0">
          <h4>举报记录 ({{ selectedContent.reports }} 条)</h4>
          <div class="reports-list">
            <div v-for="(report, idx) in selectedContent.reportDetails.slice(0, 5)" :key="idx" class="report-item">
              <div class="report-header">
                <span class="report-reason">{{ report.reason }}</span>
                <span class="report-date">{{ formatDate(report.date) }}</span>
              </div>
              <div class="report-reporter">报告者: {{ report.reporter }}</div>
            </div>
            <div v-if="selectedContent.reportDetails.length > 5" class="more-reports">
              还有 {{ selectedContent.reportDetails.length - 5 }} 条举报...
            </div>
          </div>
        </div>

        <!-- Audit History -->
        <div class="details-section" v-if="selectedContent.auditHistory.length > 0">
          <h4>审核历史</h4>
          <div class="audit-list">
            <div v-for="audit in selectedContent.auditHistory" :key="audit.id" class="audit-item">
              <div class="audit-header">
                <span class="audit-action">{{ audit.action }}</span>
                <span class="audit-date">{{ formatDate(audit.date) }}</span>
              </div>
              <div class="audit-by">操作员: {{ audit.operatorName }}</div>
              <div v-if="audit.reason" class="audit-reason">原因: {{ audit.reason }}</div>
            </div>
          </div>
        </div>

        <!-- Metadata -->
        <div class="details-section">
          <h4>元数据</h4>
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="label">视图数</span>
              <span class="value">{{ selectedContent.views }}</span>
            </div>
            <div class="metadata-item">
              <span class="label">点赞数</span>
              <span class="value">{{ selectedContent.likes }}</span>
            </div>
            <div class="metadata-item">
              <span class="label">评论数</span>
              <span class="value">{{ selectedContent.comments }}</span>
            </div>
            <div class="metadata-item">
              <span class="label">状态</span>
              <span class="value">{{ getStatusLabel(selectedContent.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Reject Content Dialog -->
    <el-dialog v-model="rejectVisible" title="拒绝内容" width="400px" center>
      <div class="reject-form">
        <div class="form-group">
          <label>内容</label>
          <div class="static-value">{{ rejectingContent?.title }}</div>
        </div>

        <div class="form-group">
          <label>拒绝原因 *</label>
          <el-select v-model="rejectReason" placeholder="选择拒绝原因">
            <el-option label="违反内容政策" value="policy_violation" />
            <el-option label="垃圾内容" value="spam" />
            <el-option label="不恰当言论" value="inappropriate" />
            <el-option label="低质量内容" value="low_quality" />
            <el-option label="重复内容" value="duplicate" />
            <el-option label="其他" value="other" />
          </el-select>
        </div>

        <div class="form-group">
          <label>详细说明</label>
          <el-input
            v-model="rejectDetails"
            type="textarea"
            placeholder="请提供详细的拒绝原因..."
            :rows="4"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="submitRejectContent">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- Approve Dialog -->
    <el-dialog v-model="approveVisible" title="批准内容" width="400px" center>
      <div class="approve-form">
        <div class="form-group">
          <label>内容</label>
          <div class="static-value">{{ approvingContent?.title }}</div>
        </div>

        <div class="form-group">
          <label>审核备注</label>
          <el-input
            v-model="approveNotes"
            type="textarea"
            placeholder="可选：添加审核备注..."
            :rows="3"
          />
        </div>

        <div class="info-text">
          ✅ 批准后，内容将对所有用户可见
        </div>
      </div>

      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="success" @click="submitApproveContent">确认批准</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import adminService from '@/services/adminService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedContentType = ref('all')
const sortBy = ref('newest')
const currentPage = ref(1)
const pageSize = ref(20)
const allContent = ref([])
const totalContent = ref(0)
const selectedContents = ref([])
const detailsVisible = ref(false)
const selectedContent = ref(null)
const rejectVisible = ref(false)
const approveVisible = ref(false)
const rejectingContent = ref(null)
const approvingContent = ref(null)
const rejectReason = ref('')
const rejectDetails = ref('')
const approveNotes = ref('')
const contentStats = ref({
  totalPending: 0,
  approved: 0,
  rejected: 0,
  reported: 0
})

// Computed
const filteredContent = computed(() => {
  return allContent.value
})

// Methods
const loadContent = () => {
  const result = adminService.getPendingContent({
    searchQuery: searchQuery.value,
    status: selectedStatus.value,
    type: selectedContentType.value
  })

  allContent.value = result.content
  totalContent.value = result.total

  // Update stats
  updateContentStats()
}

const updateContentStats = () => {
  const allResult = adminService.getPendingContent({})
  const all = allResult.content

  contentStats.value = {
    totalPending: all.filter(c => c.status === 'pending').length,
    approved: all.filter(c => c.status === 'approved').length,
    rejected: all.filter(c => c.status === 'rejected').length,
    reported: all.filter(c => c.reports > 0).length
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadContent()
}

const handleFilter = () => {
  currentPage.value = 1
  loadContent()
}

const handleSelectionChange = (selection) => {
  selectedContents.value = selection
}

const viewContentDetails = (content) => {
  selectedContent.value = adminService.getContentDetails(content.id)
  detailsVisible.value = true
}

const approveContentConfirm = (content) => {
  approvingContent.value = content
  approveNotes.value = ''
  approveVisible.value = true
}

const submitApproveContent = () => {
  adminService.approveContent(approvingContent.value.id, approveNotes.value)
  approveVisible.value = false
  loadContent()
  ElMessage.success('内容已批准')
}

const rejectContentForm = (content) => {
  rejectingContent.value = content
  rejectReason.value = ''
  rejectDetails.value = ''
  rejectVisible.value = true
}

const submitRejectContent = () => {
  if (!rejectReason.value) {
    ElMessage.error('请选择拒绝原因')
    return
  }

  const reason = `${rejectReason.value}: ${rejectDetails.value}`
  adminService.rejectContent(rejectingContent.value.id, reason)
  rejectVisible.value = false
  loadContent()
  ElMessage.success('内容已拒绝')
}

const deleteContentConfirm = (content) => {
  ElMessageBox.confirm(
    `确认要删除内容 "${content.title}" 吗？此操作不可撤销！`,
    '删除内容',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'error' }
  ).then(() => {
    adminService.deleteContent(content.id, '管理员删除')
    loadContent()
    ElMessage.success('内容已删除')
  }).catch(() => {
    ElMessage.info('操作已取消')
  })
}

const refreshContent = () => {
  loadContent()
  ElMessage.success('内容已刷新')
}

const getContentTypeLabel = (type) => {
  const labels = { forum: '论坛帖子', guide: '用户指南', comment: '用户评论' }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = { pending: '待审核', approved: '已批准', rejected: '已拒绝' }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadContent()
})
</script>

<style scoped>
.admin-content-moderation {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.moderation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

/* Status Overview */
.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.status-card {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  text-align: center;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.status-card:nth-child(2) {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.status-card:nth-child(3) {
  background: linear-gradient(135deg, #e6a23c 0%, #f0ad4e 100%);
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.2);
}

.status-card:nth-child(4) {
  background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.status-number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.status-label {
  font-size: 12px;
  opacity: 0.9;
}

/* Search and Filter */
.search-filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-filter-section :deep(.el-select) {
  min-width: 140px;
}

/* Content Table */
.content-table-section {
  margin-bottom: 24px;
}

.content-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  word-break: break-word;
  max-width: 220px;
}

.content-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 10px;
}

.content-type-badge {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 3px;
  font-weight: 600;
}

.content-author {
  color: #6b7280;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* Dialog Styles */
.content-details {
  padding: 12px 0;
}

.details-section {
  margin-bottom: 20px;
}

.details-section h4 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.value {
  font-size: 12px;
  color: #1f2937;
  font-weight: 500;
}

.content-preview {
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  font-size: 12px;
  color: #374151;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

/* Reports List */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-item {
  padding: 10px;
  background: rgba(245, 108, 108, 0.05);
  border-left: 3px solid #f56c6c;
  border-radius: 4px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.report-reason {
  font-size: 11px;
  font-weight: 700;
  color: #f56c6c;
}

.report-date {
  font-size: 10px;
  color: #9ca3af;
}

.report-reporter {
  font-size: 10px;
  color: #6b7280;
}

.more-reports {
  padding: 8px;
  text-align: center;
  font-size: 10px;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.05);
  border-radius: 4px;
}

/* Audit List */
.audit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-item {
  padding: 10px;
  background: rgba(94, 124, 224, 0.05);
  border-left: 3px solid #5e7ce0;
  border-radius: 4px;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.audit-action {
  font-size: 11px;
  font-weight: 700;
  color: #5e7ce0;
}

.audit-date {
  font-size: 10px;
  color: #9ca3af;
}

.audit-by {
  font-size: 10px;
  color: #6b7280;
}

.audit-reason {
  font-size: 10px;
  color: #6b7280;
  margin-top: 4px;
}

/* Metadata Grid */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  text-align: center;
}

.metadata-item .label {
  font-size: 10px;
}

.metadata-item .value {
  font-size: 16px;
  font-weight: 700;
  color: #5e7ce0;
}

/* Form Styles */
.reject-form,
.approve-form {
  padding: 12px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.static-value {
  font-size: 13px;
  color: #1f2937;
  padding: 8px 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
}

.info-text {
  padding: 12px;
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .moderation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-filter-section {
    flex-direction: column;
  }

  .search-filter-section :deep(.el-input),
  .search-filter-section :deep(.el-select) {
    width: 100%;
  }

  .status-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .metadata-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
