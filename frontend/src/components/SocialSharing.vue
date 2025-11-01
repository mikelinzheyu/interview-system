<template>
  <div class="social-sharing">
    <!-- Header -->
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="share-icon">📤</span> 分享与社交
      </h3>
      <el-button
        icon="Refresh"
        circle
        size="small"
        @click="refreshSharing"
      />
    </div>

    <!-- Share Content Section -->
    <div class="share-section">
      <h4 class="section-title">分享你的成就</h4>

      <div class="share-options">
        <div
          v-for="option in shareOptions"
          :key="option.value"
          class="share-option"
          :class="{ active: selectedShareType === option.value }"
          @click="selectedShareType = option.value"
        >
          <div class="option-icon">{{ option.icon }}</div>
          <div class="option-text">
            <div class="option-title">{{ option.label }}</div>
            <div class="option-desc">{{ option.description }}</div>
          </div>
        </div>
      </div>

      <!-- Share Content Selection -->
      <div class="content-selector">
        <div v-if="selectedShareType === 'achievement'" class="selector-content">
          <label>选择成就：</label>
          <el-select
            v-model="selectedAchievement"
            placeholder="选择要分享的成就"
          >
            <el-option
              v-for="achievement in availableAchievements"
              :key="achievement.id"
              :label="`${achievement.icon} ${achievement.title}`"
              :value="achievement.id"
            />
          </el-select>
        </div>

        <div v-if="selectedShareType === 'domain'" class="selector-content">
          <label>选择学科：</label>
          <el-select
            v-model="selectedDomain"
            placeholder="选择要分享的学科"
          >
            <el-option
              v-for="domain in completedDomains"
              :key="domain"
              :label="domain"
              :value="domain"
            />
          </el-select>
        </div>

        <div v-if="selectedShareType === 'progress'" class="selector-content">
          <label>分享进度：</label>
          <el-select
            v-model="selectedProgress"
            placeholder="选择分享内容"
          >
            <el-option label="学习时长" value="hours" />
            <el-option label="完成学科数" value="domains" />
            <el-option label="连续学习" value="streak" />
            <el-option label="总体进度" value="overall" />
          </el-select>
        </div>

        <div v-if="selectedShareType === 'path'" class="selector-content">
          <label>选择学习路径：</label>
          <el-select
            v-model="selectedPath"
            placeholder="选择学习路径"
          >
            <el-option label="Web 开发路径" value="web" />
            <el-option label="数据科学路径" value="data" />
            <el-option label="后端开发路径" value="backend" />
            <el-option label="移动开发路径" value="mobile" />
          </el-select>
        </div>
      </div>

      <!-- Share Message -->
      <div class="message-composer">
        <label>添加分享文字（可选）：</label>
        <el-input
          v-model="shareMessage"
          type="textarea"
          placeholder="分享你的学习心得..."
          rows="4"
          maxlength="200"
          show-word-limit
        />
      </div>

      <!-- Share Button -->
      <el-button
        type="primary"
        @click="shareContent"
        :loading="isSharing"
        style="width: 100%; margin-top: 16px"
      >
        生成分享链接
      </el-button>
    </div>

    <!-- Share Results -->
    <div v-if="lastShare" class="share-result">
      <el-alert
        title="分享成功!"
        type="success"
        :closable="false"
        style="margin-bottom: 16px"
      />

      <div class="result-preview">
        <h4 class="preview-title">分享预览</h4>
        <div class="preview-content">
          <div class="preview-card">
            <div class="preview-header">
              <img :src="userAvatar" :alt="userName" class="preview-avatar" />
              <div class="preview-user">
                <div class="preview-name">{{ userName }}</div>
                <div class="preview-time">{{ getRelativeTime(lastShare.createdAt) }}</div>
              </div>
            </div>

            <div class="preview-body">
              <div class="preview-item-info">
                <span class="item-icon">{{ getShareItemIcon() }}</span>
                <span class="item-title">{{ getShareItemTitle() }}</span>
              </div>
              <p v-if="shareMessage" class="preview-message">{{ shareMessage }}</p>
            </div>

            <div class="preview-footer">
              <div class="preview-stats">
                <span class="stat">
                  <span class="stat-icon">👁️</span>
                  <span class="stat-value">{{ lastShare.views }}</span>
                </span>
                <span class="stat">
                  <span class="stat-icon">❤️</span>
                  <span class="stat-value">{{ lastShare.likes.length }}</span>
                </span>
                <span class="stat">
                  <span class="stat-icon">💬</span>
                  <span class="stat-value">{{ lastShare.comments.length }}</span>
                </span>
                <span class="stat">
                  <span class="stat-icon">🔗</span>
                  <span class="stat-value">{{ lastShare.shares }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="share-actions">
        <el-button @click="copyShareLink" type="primary" text>
          <span v-if="!linkCopied">📋 复制分享链接</span>
          <span v-else>✅ 已复制!</span>
        </el-button>

        <el-button @click="shareToWeChat" type="primary" text>
          微信分享
        </el-button>

        <el-button @click="shareToQQ" type="primary" text>
          QQ分享
        </el-button>

        <el-button @click="shareToWeibo" type="primary" text>
          微博分享
        </el-button>
      </div>

      <el-divider />
    </div>

    <!-- My Shares List -->
    <div class="shares-list-section">
      <h4 class="section-title">我的分享</h4>

      <div v-if="myShares.length > 0" class="shares-list">
        <div
          v-for="share in myShares"
          :key="share.id"
          class="share-item"
        >
          <div class="share-header">
            <div class="share-type-badge">
              {{ getShareTypeName(share.contentType) }}
            </div>
            <div class="share-time">{{ getRelativeTime(share.createdAt) }}</div>
          </div>

          <div class="share-content">
            <p v-if="share.message" class="share-message">{{ share.message }}</p>
            <div class="share-link">
              <span class="link-icon">🔗</span>
              <input type="text" readonly :value="share.link" class="link-input" />
              <el-button
                size="small"
                @click="copyToClipboard(share.link)"
                type="primary"
                text
              >
                复制
              </el-button>
            </div>
          </div>

          <div class="share-stats">
            <div class="stat-item">
              <span class="stat-label">浏览</span>
              <span class="stat-value">{{ share.views }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">点赞</span>
              <span class="stat-value">{{ share.likes.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">评论</span>
              <span class="stat-value">{{ share.comments.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">分享</span>
              <span class="stat-value">{{ share.shares }}</span>
            </div>
          </div>

          <div class="share-analytics">
            <div class="analytics-item">
              <span class="label">参与度</span>
              <span class="value">{{ calculateEngagement(share) }}%</span>
            </div>
            <el-progress
              :percentage="calculateEngagement(share)"
              :color="getEngagementColor(calculateEngagement(share))"
              :show-text="false"
            />
          </div>

          <div class="share-actions-mini">
            <el-button size="small" type="primary" text @click="viewShareDetails(share)">
              查看详情
            </el-button>
            <el-button size="small" type="danger" text @click="deleteShare(share.id)">
              删除
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📤</div>
        <div class="empty-text">还没有分享内容</div>
        <div class="empty-subtext">分享你的学习成就来激励更多人</div>
      </div>
    </div>

    <!-- Share Analytics Dialog -->
    <el-dialog
      v-model="analyticsDialogVisible"
      title="分享分析"
      width="500px"
      center
    >
      <div v-if="selectedShare" class="analytics-detail">
        <div class="analytics-section">
          <h4>浏览数据</h4>
          <div class="analytics-item-detail">
            <span class="label">总浏览数</span>
            <span class="value">{{ selectedShare.views }}</span>
          </div>
          <div class="analytics-item-detail">
            <span class="label">平均每日浏览</span>
            <span class="value">{{ Math.round(selectedShare.views / daysOld(selectedShare.createdAt)) }}</span>
          </div>
        </div>

        <el-divider />

        <div class="analytics-section">
          <h4>互动数据</h4>
          <div class="analytics-item-detail">
            <span class="label">点赞数</span>
            <span class="value">{{ selectedShare.likes.length }}</span>
          </div>
          <div class="analytics-item-detail">
            <span class="label">评论数</span>
            <span class="value">{{ selectedShare.comments.length }}</span>
          </div>
          <div class="analytics-item-detail">
            <span class="label">转发数</span>
            <span class="value">{{ selectedShare.shares }}</span>
          </div>
        </div>

        <el-divider />

        <div class="analytics-section">
          <h4>参与度指标</h4>
          <div class="analytics-item-detail">
            <span class="label">互动率</span>
            <span class="value">{{ calculateEngagement(selectedShare) }}%</span>
          </div>
          <div class="analytics-item-detail">
            <span class="label">点赞率</span>
            <span class="value">{{ Math.round((selectedShare.likes.length / Math.max(1, selectedShare.views)) * 100) }}%</span>
          </div>
        </div>

        <template #footer>
          <el-button @click="analyticsDialogVisible = false">关闭</el-button>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import socialCollaborationService from '@/services/socialCollaborationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Learner'
  },
  userAvatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  }
})

// Refs
const selectedShareType = ref('achievement')
const selectedAchievement = ref('')
const selectedDomain = ref('')
const selectedProgress = ref('overall')
const selectedPath = ref('')
const shareMessage = ref('')
const isSharing = ref(false)
const lastShare = ref(null)
const linkCopied = ref(false)
const myShares = ref([])
const analyticsDialogVisible = ref(false)
const selectedShare = ref(null)

// Data
const shareOptions = [
  {
    value: 'achievement',
    label: '成就徽章',
    icon: '🏅',
    description: '分享你解锁的成就'
  },
  {
    value: 'domain',
    label: '完成学科',
    icon: '✅',
    description: '分享学科学习成果'
  },
  {
    value: 'progress',
    label: '学习进度',
    icon: '📊',
    description: '分享学习进度和统计'
  },
  {
    value: 'path',
    label: '学习路径',
    icon: '🗺️',
    description: '分享正在进行的学习路径'
  }
]

// Mock data
const availableAchievements = [
  { id: 'first_domain', icon: '🎯', title: '初学者' },
  { id: 'ten_domains', icon: '🌟', title: '学习家' },
  { id: 'perfect_accuracy', icon: '💯', title: '完美精准' },
  { id: 'seven_day_streak', icon: '🔥', title: '七天连续' },
  { id: 'thirty_day_streak', icon: '🔥🔥', title: '三十天连续' }
]

const completedDomains = [
  'JavaScript', 'Python', 'React', 'Vue.js', 'TypeScript'
]

// Computed
const userName = computed(() => props.userName)
const userAvatar = computed(() => props.userAvatar)

// Methods
const shareContent = async () => {
  if (!selectedAchievement.value && !selectedDomain.value && !selectedProgress.value && !selectedPath.value) {
    ElMessage.warning('请选择要分享的内容')
    return
  }

  isSharing.value = true

  setTimeout(() => {
    const contentId = selectedAchievement.value || selectedDomain.value || selectedProgress.value || selectedPath.value

    lastShare.value = socialCollaborationService.shareContent(
      props.userId,
      selectedShareType.value,
      contentId,
      shareMessage.value
    )

    ElMessage.success('分享成功！')
    loadMyShares()
    isSharing.value = false
  }, 800)
}

const loadMyShares = () => {
  myShares.value = socialCollaborationService.getUserShares(props.userId)
}

const copyShareLink = () => {
  if (!lastShare.value) return

  navigator.clipboard.writeText(lastShare.value.link).then(() => {
    linkCopied.value = true
    ElMessage.success('链接已复制到剪贴板')

    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  })
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制')
  })
}

const shareToWeChat = () => {
  ElMessage.info('在真实环境中，这将打开微信分享对话框')
}

const shareToQQ = () => {
  ElMessage.info('在真实环境中，这将打开QQ分享对话框')
}

const shareToWeibo = () => {
  ElMessage.info('在真实环境中，这将打开微博分享页面')
}

const getShareTypeName = (type) => {
  const mapping = {
    achievement: '成就',
    domain: '学科',
    progress: '进度',
    path: '路径'
  }
  return mapping[type] || type
}

const getShareItemIcon = () => {
  const iconMap = {
    achievement: '🏅',
    domain: '✅',
    progress: '📊',
    path: '🗺️'
  }
  return iconMap[selectedShareType.value] || '📤'
}

const getShareItemTitle = () => {
  if (selectedShareType.value === 'achievement' && selectedAchievement.value) {
    const achievement = availableAchievements.find(a => a.id === selectedAchievement.value)
    return achievement ? achievement.title : '成就'
  }
  if (selectedShareType.value === 'domain' && selectedDomain.value) {
    return `完成了 ${selectedDomain.value}`
  }
  if (selectedShareType.value === 'progress') {
    return '分享了学习进度'
  }
  if (selectedShareType.value === 'path') {
    return '正在学习新的学习路径'
  }
  return '新的分享'
}

const getRelativeTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000 / 60)

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return `${Math.floor(diff / 1440)}天前`
}

const daysOld = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000 / 60 / 60 / 24)
  return Math.max(1, diff)
}

const calculateEngagement = (share) => {
  const total = share.views + share.clicks + share.shares + share.likes.length
  return Math.round(((share.clicks + share.shares + share.likes.length) / Math.max(1, total)) * 100)
}

const getEngagementColor = (value) => {
  if (value >= 50) return '#67c23a'
  if (value >= 20) return '#e6a23c'
  return '#909399'
}

const viewShareDetails = (share) => {
  selectedShare.value = share
  analyticsDialogVisible.value = true
}

const deleteShare = (shareId) => {
  ElMessage.success('分享已删除')
  loadMyShares()
}

const refreshSharing = () => {
  loadMyShares()
  ElMessage.success('已刷新')
}

onMounted(() => {
  loadMyShares()
})
</script>

<style scoped>
.social-sharing {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.share-icon {
  font-size: 24px;
}

/* Share Section */
.share-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.share-option {
  padding: 16px;
  border: 2px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.share-option:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.05);
}

.share-option.active {
  border-color: #5e7ce0;
  background: rgba(94, 124, 224, 0.1);
}

.option-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.option-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 11px;
  color: #6b7280;
}

/* Content Selector */
.content-selector {
  margin-bottom: 20px;
}

.selector-content {
  margin-bottom: 16px;
}

.selector-content label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.selector-content .el-select {
  width: 100%;
}

/* Message Composer */
.message-composer {
  margin-bottom: 16px;
}

.message-composer label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

/* Share Result */
.share-result {
  background: rgba(103, 194, 58, 0.05);
  border: 1px solid rgba(103, 194, 58, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin: 24px 0;
}

.result-preview {
  margin-bottom: 16px;
}

.preview-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.preview-content {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(229, 230, 235, 0.4);
}

.preview-card {
  padding: 12px;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.preview-user {
  flex: 1;
}

.preview-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.preview-time {
  font-size: 11px;
  color: #6b7280;
}

.preview-body {
  margin-bottom: 12px;
}

.preview-item-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.item-icon {
  font-size: 16px;
}

.item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.preview-message {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  padding: 8px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
}

.preview-footer {
  border-top: 1px solid rgba(229, 230, 235, 0.4);
  padding-top: 12px;
}

.preview-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
}

.share-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

/* Shares List */
.shares-list-section {
  margin-top: 24px;
}

.shares-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-item {
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.share-item:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.02);
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.share-type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.share-time {
  font-size: 11px;
  color: #9ca3af;
}

.share-content {
  margin-bottom: 12px;
}

.share-message {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.share-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.link-icon {
  font-size: 12px;
}

.link-input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid rgba(229, 230, 235, 0.4);
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
}

.share-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 4px;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.share-analytics {
  margin-bottom: 8px;
}

.analytics-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 6px;
}

.analytics-item .label {
  color: #6b7280;
}

.analytics-item .value {
  font-weight: 700;
  color: #1f2937;
}

.share-actions-mini {
  display: flex;
  gap: 8px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #6b7280;
}

.empty-subtext {
  font-size: 12px;
  color: #d1d5db;
}

/* Analytics Detail */
.analytics-detail {
  padding: 16px 0;
}

.analytics-section {
  margin-bottom: 16px;
}

.analytics-section h4 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.analytics-item-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(229, 230, 235, 0.4);
  font-size: 12px;
}

.analytics-item-detail .label {
  color: #6b7280;
}

.analytics-item-detail .value {
  font-weight: 700;
  color: #1f2937;
}

/* Responsive */
@media (max-width: 768px) {
  .social-sharing {
    padding: 16px;
  }

  .share-options {
    grid-template-columns: repeat(2, 1fr);
  }

  .share-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .preview-stats {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .share-options {
    grid-template-columns: 1fr;
  }

  .share-actions {
    flex-direction: column;
  }

  .share-actions .el-button {
    width: 100%;
  }
}
</style>
