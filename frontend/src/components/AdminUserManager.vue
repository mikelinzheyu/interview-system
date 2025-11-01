<template>
  <div class="admin-user-manager">
    <!-- Header -->
    <div class="manager-header">
      <h3 class="manager-title">
        <span class="title-icon">👥</span> 用户管理
      </h3>
      <el-button type="primary" @click="exportUsers">
        📥 导出用户列表
      </el-button>
    </div>

    <!-- Search and Filter -->
    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名或邮箱..."
        prefix-icon="Search"
        @input="handleSearch"
        clearable
        style="flex: 1; max-width: 300px;"
      />

      <el-select v-model="selectedStatus" placeholder="按状态筛选" clearable @change="handleFilter">
        <el-option label="全部状态" value="all" />
        <el-option label="活跃" value="active" />
        <el-option label="禁用" value="disabled" />
        <el-option label="新用户" value="new" />
      </el-select>

      <el-select v-model="selectedRole" placeholder="按角色筛选" clearable @change="handleFilter">
        <el-option label="全部角色" value="all" />
        <el-option label="普通用户" value="user" />
        <el-option label="VIP用户" value="vip" />
        <el-option label="管理员" value="admin" />
      </el-select>

      <el-button @click="loadUsers">🔄 刷新</el-button>
    </div>

    <!-- Users Table -->
    <div class="users-table-section">
      <el-table
        :data="filteredUsers"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="用户" width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <img :src="row.avatar" :alt="row.userName" class="user-avatar" />
              <div class="user-info">
                <div class="user-name">{{ row.userName }}</div>
                <div class="user-id">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="邮箱" width="200" />

        <el-table-column label="加入日期" width="140">
          <template #default="{ row }">
            {{ formatDate(row.joinDate) }}
          </template>
        </el-table-column>

        <el-table-column label="最后活动" width="140">
          <template #default="{ row }">
            {{ getRelativeTime(row.lastActive) }}
          </template>
        </el-table-column>

        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewUserDetails(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="editUserRole(row)">
              编辑
            </el-button>
            <el-button link type="warning" size="small" @click="toggleUserStatus(row)">
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="deleteUserConfirm(row)">
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
          :total="totalUsers"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadUsers"
          @size-change="loadUsers"
        />
      </div>
    </div>

    <!-- User Details Dialog -->
    <el-dialog v-model="detailsVisible" :title="`用户详情 - ${selectedUser?.userName}`" width="600px" center>
      <div v-if="selectedUser" class="user-details">
        <!-- Basic Info -->
        <div class="details-section">
          <h4>基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ selectedUser.userName }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱</span>
              <span class="value">{{ selectedUser.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">加入日期</span>
              <span class="value">{{ formatDate(selectedUser.joinDate) }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色</span>
              <span class="value">{{ getRoleLabel(selectedUser.role) }}</span>
            </div>
          </div>
        </div>

        <!-- Learning Stats -->
        <div class="details-section">
          <h4>学习统计</h4>
          <div class="stats-grid">
            <div class="stat">
              <span class="label">总问题数</span>
              <span class="value">{{ selectedUserStats.totalQuestions }}</span>
            </div>
            <div class="stat">
              <span class="label">正确答案</span>
              <span class="value">{{ selectedUserStats.correctAnswers }}</span>
            </div>
            <div class="stat">
              <span class="label">准确率</span>
              <span class="value">{{ selectedUserStats.accuracy }}%</span>
            </div>
            <div class="stat">
              <span class="label">学习时长</span>
              <span class="value">{{ selectedUserStats.totalTime }}h</span>
            </div>
          </div>
        </div>

        <!-- Violations -->
        <div class="details-section" v-if="selectedUserStats.violations && selectedUserStats.violations.length > 0">
          <h4>违规记录</h4>
          <div class="violations-list">
            <div v-for="violation in selectedUserStats.violations" :key="violation.id" class="violation-item">
              <div class="violation-header">
                <span class="violation-type">{{ violation.type }}</span>
                <span class="violation-date">{{ formatDate(violation.date) }}</span>
              </div>
              <div class="violation-reason">{{ violation.reason }}</div>
              <div class="violation-status" :class="violation.status">{{ violation.status }}</div>
            </div>
          </div>
        </div>

        <!-- Activity History -->
        <div class="details-section">
          <h4>最近活动</h4>
          <div class="activity-list">
            <div v-for="activity in selectedUserStats.activityHistory.slice(0, 5)" :key="activity.date" class="activity-item">
              <span class="activity-action">{{ activity.action }}</span>
              <span class="activity-details">{{ activity.details }}</span>
              <span class="activity-time">{{ getRelativeTime(activity.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Edit Role Dialog -->
    <el-dialog v-model="editRoleVisible" title="修改用户角色" width="400px" center>
      <div class="edit-role-form">
        <div class="form-group">
          <label>用户</label>
          <div class="static-value">{{ editingUser?.userName }}</div>
        </div>

        <div class="form-group">
          <label>新角色</label>
          <el-select v-model="editingUser.role" placeholder="选择新角色">
            <el-option label="普通用户" value="user" />
            <el-option label="VIP用户" value="vip" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </div>
      </div>

      <template #footer>
        <el-button @click="editRoleVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUserRole">确认修改</el-button>
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
const selectedRole = ref('all')
const currentPage = ref(1)
const pageSize = ref(20)
const allUsers = ref([])
const totalUsers = ref(0)
const selectedUsers = ref([])
const detailsVisible = ref(false)
const editRoleVisible = ref(false)
const selectedUser = ref(null)
const selectedUserStats = ref(null)
const editingUser = ref(null)

// Computed
const filteredUsers = computed(() => {
  return allUsers.value
})

// Methods
const loadUsers = () => {
  const result = adminService.getUsers(
    {
      searchQuery: searchQuery.value,
      status: selectedStatus.value,
      role: selectedRole.value
    },
    {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  )

  allUsers.value = result.users
  totalUsers.value = result.total
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const handleFilter = () => {
  currentPage.value = 1
  loadUsers()
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const viewUserDetails = (user) => {
  selectedUser.value = user
  selectedUserStats.value = adminService.getUserDetails(user.id)
  detailsVisible.value = true
}

const editUserRole = (user) => {
  editingUser.value = { ...user }
  editRoleVisible.value = true
}

const saveUserRole = () => {
  adminService.updateUserRole(editingUser.value.id, editingUser.value.role)
  editRoleVisible.value = false
  loadUsers()
  ElMessage.success('用户角色已更新')
}

const toggleUserStatus = (user) => {
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'

  ElMessageBox.confirm(
    `确认要${action}用户 ${user.userName} 吗？`,
    '确认操作',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    adminService.updateUserStatus(user.id, newStatus)
    loadUsers()
    ElMessage.success(`用户已${action}`)
  }).catch(() => {
    ElMessage.info('操作已取消')
  })
}

const deleteUserConfirm = (user) => {
  ElMessageBox.confirm(
    `确认要删除用户 ${user.userName} 吗？此操作不可撤销！`,
    '删除用户',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'error' }
  ).then(() => {
    adminService.deleteUser(user.id, '管理员删除')
    loadUsers()
    ElMessage.success('用户已删除')
  }).catch(() => {
    ElMessage.info('操作已取消')
  })
}

const exportUsers = () => {
  const data = allUsers.value.map(user => ({
    用户名: user.userName,
    邮箱: user.email,
    加入日期: formatDate(user.joinDate),
    角色: getRoleLabel(user.role),
    状态: getStatusLabel(user.status)
  }))

  const csv = [
    Object.keys(data[0] || {}).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('用户列表已导出')
}

const getRoleLabel = (role) => {
  const labels = { user: '普通用户', vip: 'VIP用户', admin: '管理员' }
  return labels[role] || role
}

const getRoleType = (role) => {
  const types = { user: 'info', vip: 'success', admin: 'danger' }
  return types[role] || 'info'
}

const getStatusLabel = (status) => {
  const labels = { active: '活跃', disabled: '禁用', new: '新用户', inactive: '不活跃' }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = { active: 'success', disabled: 'danger', new: 'warning', inactive: 'info' }
  return types[status] || 'info'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getRelativeTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-user-manager {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.title-icon {
  font-size: 24px;
}

.search-filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-filter-section :deep(.el-select) {
  min-width: 140px;
}

.users-table-section {
  margin-bottom: 24px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.user-id {
  font-size: 10px;
  color: #6b7280;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* Dialog Styles */
.user-details {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.stat .label {
  font-size: 10px;
}

.stat .value {
  font-size: 16px;
  font-weight: 700;
  color: #5e7ce0;
}

.violations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.violation-item {
  padding: 12px;
  background: rgba(245, 108, 108, 0.05);
  border-left: 3px solid #f56c6c;
  border-radius: 4px;
}

.violation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.violation-type {
  font-size: 11px;
  font-weight: 700;
  color: #f56c6c;
}

.violation-date {
  font-size: 10px;
  color: #9ca3af;
}

.violation-reason {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 6px;
}

.violation-status {
  display: inline-block;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 2px;
  background: #f56c6c;
  color: white;
  font-weight: 600;
}

.violation-status.resolved {
  background: #67c23a;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
}

.activity-action {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
}

.activity-details {
  font-size: 10px;
  color: #6b7280;
}

.activity-time {
  font-size: 10px;
  color: #9ca3af;
}

/* Edit Role Form */
.edit-role-form {
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

/* Responsive */
@media (max-width: 768px) {
  .manager-header {
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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
