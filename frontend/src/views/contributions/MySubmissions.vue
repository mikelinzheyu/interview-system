<template>
  <div class="my-submissions-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-label">总提交数</div>
              <div class="stat-value">{{ store.mySubmissionsTotal }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <div class="stat-label">待审核</div>
              <div class="stat-value">{{ store.pendingCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-label">已通过</div>
              <div class="stat-value">{{ store.approvedCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">通过率</div>
              <div class="stat-value">{{ store.approvalRate }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="16">
          <el-radio-group v-model="statusFilter" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="under_review">审核中</el-radio-button>
            <el-radio-button label="approved">已通过</el-radio-button>
            <el-radio-button label="rejected">已拒绝</el-radio-button>
            <el-radio-button label="needs_revision">需要修订</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="8" style="text-align: right">
          <el-button type="primary" @click="router.push('/contributions/submit')">
            <el-icon><Plus /></el-icon>
            提交新题目
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 提交列表 -->
    <el-card v-loading="store.mySubmissionsLoading">
      <el-table :data="store.mySubmissions" stripe>
        <el-table-column label="题目标题" prop="title" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row.id)">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="领域" width="120">
          <template #default="{ row }">
            {{ getDomainName(row.domainId) }}
          </template>
        </el-table-column>

        <el-table-column label="难度" width="100">
          <template #default="{ row }">
            <el-tag
              :type="difficultyTypeMap[row.difficulty]"
              size="small"
            >
              {{ difficultyTextMap[row.difficulty] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">
              {{ statusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.submittedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="修订次数" width="100" align="center">
          <template #default="{ row }">
            {{ row.revisionCount }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">
              查看详情
            </el-button>
            <el-button
              v-if="row.status === 'needs_revision'"
              size="small"
              type="primary"
              @click="reviseSubmission(row.id)"
            >
              修订
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="store.mySubmissionsTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const store = useContributionsStore()

// 数据
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 映射表
const statusTypeMap = {
  pending: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  needs_revision: 'warning'
}

const statusTextMap = {
  pending: '待审核',
  under_review: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
  needs_revision: '需要修订'
}

const difficultyTypeMap = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger'
}

const difficultyTextMap = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
}

const domainMap = {
  1: '计算机科学',
  2: '金融学',
  3: '医学',
  4: '法律',
  5: '管理学'
}

// 生命周期
onMounted(() => {
  fetchSubmissions()
})

// 方法
async function fetchSubmissions() {
  const params = {
    page: currentPage.value,
    limit: pageSize.value
  }
  if (statusFilter.value) {
    params.status = statusFilter.value
  }
  await store.fetchMySubmissions(params)
}

function handleFilterChange() {
  currentPage.value = 1
  fetchSubmissions()
}

function handlePageChange() {
  fetchSubmissions()
}

function handleSizeChange() {
  currentPage.value = 1
  fetchSubmissions()
}

function viewDetail(id) {
  router.push({ name: 'QuestionDetail', params: { id } })
}

function reviseSubmission(id) {
  router.push({ name: 'QuestionDetail', params: { id } })
}

function getDomainName(domainId) {
  return domainMap[domainId] || '未知'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.my-submissions-container {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 36px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
