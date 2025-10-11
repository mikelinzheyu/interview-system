<template>
  <div class="review-queue-container">
    <div class="page-header">
      <h1>
        <el-icon><Checked /></el-icon>
        审核队列
      </h1>
      <p>参与社区审核，帮助提升题目质量</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingCount }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon reviewing">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.reviewingCount }}</div>
            <div class="stat-label">审核中</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.myReviewCount }}</div>
            <div class="stat-label">我已审核</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon points">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.earnedPoints }}</div>
            <div class="stat-label">获得积分</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <div class="filter-bar">
        <el-radio-group v-model="filterStatus" @change="loadQueue">
          <el-radio-button label="available">待领取</el-radio-button>
          <el-radio-button label="my-tasks">我的任务</el-radio-button>
          <el-radio-button label="all">全部</el-radio-button>
        </el-radio-group>

        <el-select v-model="filterPriority" placeholder="优先级" clearable @change="loadQueue">
          <el-option label="全部优先级" value="" />
          <el-option label="高优先级" value="high" />
          <el-option label="普通优先级" value="normal" />
          <el-option label="低优先级" value="low" />
        </el-select>

        <el-select v-model="sortBy" placeholder="排序" @change="loadQueue">
          <el-option label="最新提交" value="latest" />
          <el-option label="优先级高" value="priority" />
          <el-option label="等待最久" value="oldest" />
        </el-select>
      </div>
    </el-card>

    <!-- 审核列表 -->
    <div v-loading="loading" class="queue-list">
      <el-empty v-if="queue.length === 0 && !loading" description="暂无待审核题目" />

      <el-card
        v-for="item in queue"
        :key="item.id"
        class="queue-item"
      >
        <div class="item-header">
          <div class="item-title-section">
            <h3>{{ item.title }}</h3>
            <div class="item-tags">
              <el-tag :type="getPriorityType(item.priority)" size="small">
                {{ getPriorityText(item.priority) }}
              </el-tag>
              <el-tag type="info" size="small">{{ item.category }}</el-tag>
              <el-tag :type="getStatusType(item.status)" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>
          </div>
          <div class="item-actions">
            <el-button
              v-if="item.status === 'available'"
              type="primary"
              size="small"
              @click="claimTask(item.id)"
            >
              领取审核
            </el-button>
            <el-button
              v-if="item.status === 'claimed' && item.reviewerId === currentUserId"
              type="success"
              size="small"
              @click="startReview(item.id)"
            >
              开始审核
            </el-button>
            <el-button
              v-if="item.status === 'available' || item.status === 'claimed'"
              size="small"
              @click="viewDetail(item.id)"
            >
              查看详情
            </el-button>
          </div>
        </div>

        <p class="item-desc">{{ item.description }}</p>

        <div class="item-footer">
          <div class="item-meta">
            <span><el-icon><User /></el-icon> 提交者: {{ item.author }}</span>
            <span><el-icon><Calendar /></el-icon> {{ item.submittedAt }}</span>
            <span v-if="item.reviewerId">
              <el-icon><UserFilled /></el-icon>
              审核者: {{ item.reviewerName }}
            </span>
            <span class="points-badge">
              <el-icon><Star /></el-icon>
              奖励 {{ item.rewardPoints }} 积分
            </span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pagination"
      @current-change="loadQueue"
      @size-change="loadQueue"
    />

    <!-- 审核对话框 -->
    <el-dialog
      v-model="showReviewDialog"
      title="审核题目"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReview" class="review-content">
        <el-descriptions title="题目信息" :column="2" border>
          <el-descriptions-item label="标题">{{ currentReview.title }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentReview.category }}</el-descriptions-item>
          <el-descriptions-item label="难度">{{ currentReview.difficulty }}</el-descriptions-item>
          <el-descriptions-item label="提交者">{{ currentReview.author }}</el-descriptions-item>
        </el-descriptions>

        <div class="review-section">
          <h3>题目内容</h3>
          <div class="question-content" v-html="currentReview.content"></div>
        </div>

        <div class="review-section">
          <h3>审核意见</h3>
          <el-form :model="reviewForm" label-width="100px">
            <el-form-item label="审核结果">
              <el-radio-group v-model="reviewForm.result">
                <el-radio label="approved">通过</el-radio>
                <el-radio label="rejected">拒绝</el-radio>
                <el-radio label="revision">需修订</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="质量评分">
              <el-rate v-model="reviewForm.quality" :max="5" />
            </el-form-item>

            <el-form-item label="审核意见">
              <el-input
                v-model="reviewForm.comments"
                type="textarea"
                :rows="6"
                placeholder="请提供详细的审核意见..."
              />
            </el-form-item>

            <el-form-item label="改进建议" v-if="reviewForm.result !== 'approved'">
              <el-input
                v-model="reviewForm.suggestions"
                type="textarea"
                :rows="4"
                placeholder="请提供具体的改进建议..."
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Checked, Clock, View, CircleCheck, Trophy, User, Calendar,
  UserFilled, Star
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useContributionsStore } from '@/stores/contributions'

const router = useRouter()
const userStore = useUserStore()
const contributionsStore = useContributionsStore()

const currentUserId = computed(() => userStore.user?.id || 1)

const loading = ref(false)
const queue = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filterStatus = ref('available')
const filterPriority = ref('')
const sortBy = ref('latest')

const showReviewDialog = ref(false)
const currentReview = ref(null)
const reviewForm = ref({
  result: 'approved',
  quality: 4,
  comments: '',
  suggestions: ''
})

// 统计数据
const stats = ref({
  pendingCount: 0,
  reviewingCount: 0,
  myReviewCount: 0,
  earnedPoints: 0
})

// 加载审核队列
const loadQueue = async () => {
  loading.value = true
  try {
    const response = await contributionsStore.fetchReviewQueue({
      status: filterStatus.value,
      priority: filterPriority.value,
      sortBy: sortBy.value,
      page: currentPage.value,
      limit: pageSize.value
    })

    if (response?.code === 200) {
      // 使用模拟数据
      queue.value = [
        {
          id: 1,
          title: '实现一个LRU缓存',
          description: '请用JavaScript实现一个LRU（最近最少使用）缓存，支持get和put操作',
          category: '算法',
          difficulty: '中等',
          priority: 'high',
          status: 'available',
          author: '张三',
          submittedAt: '2024-10-01 10:30',
          reviewerId: null,
          reviewerName: null,
          rewardPoints: 8
        },
        {
          id: 2,
          title: 'Vue3 组合式API最佳实践',
          description: '总结Vue3组合式API的使用技巧和注意事项',
          category: '前端',
          difficulty: '简单',
          priority: 'normal',
          status: 'available',
          author: '李四',
          submittedAt: '2024-10-02 14:20',
          reviewerId: null,
          reviewerName: null,
          rewardPoints: 5
        },
        {
          id: 3,
          title: '数据库索引优化案例',
          description: '分享一个MySQL索引优化的实际案例',
          category: '后端',
          difficulty: '困难',
          priority: 'high',
          status: 'claimed',
          author: '王五',
          submittedAt: '2024-10-03 09:15',
          reviewerId: currentUserId.value,
          reviewerName: '我',
          rewardPoints: 10
        }
      ]
      total.value = queue.value.length

      // 更新统计
      stats.value = {
        pendingCount: 15,
        reviewingCount: 3,
        myReviewCount: 12,
        earnedPoints: 96
      }
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 领取审核任务
const claimTask = async (id) => {
  try {
    await ElMessageBox.confirm('确定要领取这个审核任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    const response = await contributionsStore.claimReviewTask(id)
    if (response?.code === 200) {
      ElMessage.success('领取成功，请尽快完成审核')
      loadQueue()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('领取失败')
    }
  }
}

// 开始审核
const startReview = async (id) => {
  const item = queue.value.find(q => q.id === id)
  if (item) {
    currentReview.value = {
      ...item,
      content: '<h3>题目描述</h3><p>请实现一个LRU缓存...</p>'
    }
    reviewForm.value = {
      result: 'approved',
      quality: 4,
      comments: '',
      suggestions: ''
    }
    showReviewDialog.value = true
  }
}

// 查看详情
const viewDetail = (id) => {
  router.push(`/contributions/submissions/${id}`)
}

// 提交审核
const submitReview = async () => {
  if (!reviewForm.value.comments.trim()) {
    ElMessage.warning('请填写审核意见')
    return
  }

  if (reviewForm.value.result !== 'approved' && !reviewForm.value.suggestions.trim()) {
    ElMessage.warning('请提供改进建议')
    return
  }

  try {
    const response = await contributionsStore.submitReview(currentReview.value.id, reviewForm.value)
    if (response?.code === 200) {
      ElMessage.success('审核提交成功，您获得了积分奖励！')
      showReviewDialog.value = false
      loadQueue()
    }
  } catch (error) {
    ElMessage.error('提交失败')
  }
}

// 获取优先级类型
const getPriorityType = (priority) => {
  const map = {
    high: 'danger',
    normal: 'warning',
    low: 'info'
  }
  return map[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority) => {
  const map = {
    high: '高优先级',
    normal: '普通',
    low: '低优先级'
  }
  return map[priority] || priority
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    available: 'success',
    claimed: 'warning',
    completed: 'info'
  }
  return map[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    available: '待领取',
    claimed: '审核中',
    completed: '已完成'
  }
  return map[status] || status
}

onMounted(() => {
  loadQueue()
})
</script>

<style scoped>
.review-queue-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 28px;
  color: #303133;
  margin: 0 0 10px 0;
}

.page-header p {
  color: #909399;
  margin: 0;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.pending {
  background: #e6f7ff;
  color: #1890ff;
}

.stat-icon.reviewing {
  background: #fff7e6;
  color: #fa8c16;
}

.stat-icon.completed {
  background: #f6ffed;
  color: #52c41a;
}

.stat-icon.points {
  background: #fff1f0;
  color: #f5222d;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

/* 筛选栏 */
.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 审核列表 */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 400px;
}

.queue-item {
  transition: all 0.3s;
}

.queue-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.item-title-section {
  flex: 1;
}

.item-header h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
}

.item-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.item-desc {
  color: #606266;
  font-size: 14px;
  margin: 15px 0;
  line-height: 1.6;
}

.item-footer {
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.item-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #909399;
  align-items: center;
}

.item-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.points-badge {
  color: #f56c6c;
  font-weight: 600;
}

/* 分页 */
.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 审核对话框 */
.review-content {
  max-height: 600px;
  overflow-y: auto;
}

.review-section {
  margin-top: 20px;
}

.review-section h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 15px;
}

.question-content {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .item-header {
    flex-direction: column;
    gap: 15px;
  }

  .item-actions {
    width: 100%;
    flex-direction: column;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar > * {
    width: 100%;
  }
}
</style>
