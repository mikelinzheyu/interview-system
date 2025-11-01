<template>
  <div class="social-feed">
    <!-- Header -->
    <div class="feed-header">
      <h3 class="feed-title">
        <span class="feed-icon">📰</span> 学习动态
      </h3>

      <div class="feed-controls">
        <el-button-group>
          <el-button
            v-for="filter in filterOptions"
            :key="filter.value"
            :type="selectedFilter === filter.value ? 'primary' : 'default'"
            size="small"
            @click="selectedFilter = filter.value"
          >
            {{ filter.label }}
          </el-button>
        </el-button-group>

        <el-button
          icon="Refresh"
          circle
          size="small"
          @click="refreshFeed"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredFeed.length === 0" class="feed-empty">
      <div class="empty-icon">📭</div>
      <div class="empty-title">还没有动态</div>
      <div class="empty-text">关注更多学习者来查看他们的学习动态</div>
    </div>

    <!-- Feed Items -->
    <div v-else class="feed-items">
      <div
        v-for="item in filteredFeed"
        :key="item.id"
        class="feed-item"
        :class="{ [`type-${item.type}`]: true }"
      >
        <!-- User Info -->
        <div class="item-user-header">
          <div class="user-info">
            <img :src="item.avatar" :alt="item.userName" class="user-avatar" />
            <div class="user-details">
              <div class="user-name">{{ item.userName }}</div>
              <div class="item-time">{{ getRelativeTime(item.timestamp) }}</div>
            </div>
          </div>

          <el-dropdown @command="handleItemAction">
            <el-button link type="primary" size="small">
              ⋮
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="share">
                  分享
                </el-dropdown-item>
                <el-dropdown-item v-if="item.userId !== userId" command="follow">
                  关注用户
                </el-dropdown-item>
                <el-dropdown-item command="report">
                  举报
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- Activity Content -->
        <div class="item-content">
          <div class="activity-icon">{{ getActivityIcon(item.type) }}</div>
          <div class="activity-text">
            <h5 class="activity-title">{{ item.title }}</h5>
            <p class="activity-description">{{ item.description }}</p>
          </div>
        </div>

        <!-- Engagement Stats -->
        <div class="item-stats">
          <span class="stat-item">
            <span class="stat-icon">❤️</span>
            {{ item.likes.length }}
          </span>
          <span class="stat-item">
            <span class="stat-icon">💬</span>
            {{ item.comments.length }}
          </span>
          <span class="stat-item">
            <span class="stat-icon">↗️</span>
            {{ item.shares }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="item-actions">
          <button
            class="action-button"
            :class="{ active: isLiked(item.id) }"
            @click="toggleLike(item)"
          >
            <span class="action-icon">❤️</span>
            <span class="action-text">{{ isLiked(item.id) ? '已赞' : '点赞' }}</span>
          </button>

          <button
            class="action-button"
            @click="toggleComments(item.id)"
          >
            <span class="action-icon">💬</span>
            <span class="action-text">评论</span>
          </button>

          <button
            class="action-button"
            @click="shareItem(item)"
          >
            <span class="action-icon">↗️</span>
            <span class="action-text">分享</span>
          </button>
        </div>

        <!-- Comments Section -->
        <div v-if="expandedComments.includes(item.id)" class="comments-section">
          <!-- Existing Comments -->
          <div v-if="item.comments.length > 0" class="comments-list">
            <div
              v-for="(comment, idx) in item.comments.slice(0, 3)"
              :key="idx"
              class="comment-item"
            >
              <div class="comment-author">{{ comment.userName }}</div>
              <div class="comment-text">{{ comment.text }}</div>
              <div class="comment-time">{{ getRelativeTime(comment.timestamp) }}</div>
            </div>

            <button
              v-if="item.comments.length > 3"
              class="view-all-comments"
              @click="showAllComments(item)"
            >
              查看全部 {{ item.comments.length }} 条评论
            </button>
          </div>

          <!-- Comment Input -->
          <div class="comment-input">
            <input
              v-model="newComments[item.id]"
              type="text"
              placeholder="写下你的评论..."
              @keyup.enter="submitComment(item)"
              class="comment-text-input"
            />
            <button
              @click="submitComment(item)"
              class="comment-submit"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="load-more">
      <el-button @click="loadMore" text>
        加载更多
      </el-button>
    </div>

    <!-- Comments Dialog -->
    <el-dialog
      v-model="commentsDialogVisible"
      title="全部评论"
      width="500px"
      center
    >
      <div v-if="selectedFeedItem" class="all-comments">
        <div class="feed-item-summary">
          <img :src="selectedFeedItem.avatar" :alt="selectedFeedItem.userName" class="avatar" />
          <div>
            <div class="name">{{ selectedFeedItem.userName }}</div>
            <div class="title">{{ selectedFeedItem.title }}</div>
          </div>
        </div>

        <el-divider />

        <div class="comments-list-full">
          <div
            v-for="(comment, idx) in selectedFeedItem.comments"
            :key="idx"
            class="comment-item-full"
          >
            <div class="comment-header">
              <span class="comment-author-name">{{ comment.userName }}</span>
              <span class="comment-time-full">{{ getRelativeTime(comment.timestamp) }}</span>
            </div>
            <div class="comment-text-full">{{ comment.text }}</div>
          </div>

          <div v-if="selectedFeedItem.comments.length === 0" class="no-comments">
            还没有评论，来写下第一条吧！
          </div>
        </div>

        <el-divider />

        <div class="comment-input-full">
          <input
            v-model="dialogCommentText"
            type="text"
            placeholder="写下你的评论..."
            @keyup.enter="submitDialogComment"
            class="comment-text-input"
          />
          <button @click="submitDialogComment" class="comment-submit">
            发送
          </button>
        </div>
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
  }
})

// Refs
const selectedFilter = ref('all')
const expandedComments = ref([])
const newComments = ref({})
const likedItems = ref([])
const commentsDialogVisible = ref(false)
const selectedFeedItem = ref(null)
const dialogCommentText = ref('')
const allFeedItems = ref([])
const displayCount = ref(10)
const hasMore = ref(true)

// Data
const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'achievement', label: '成就' },
  { value: 'completion', label: '完成' },
  { value: 'share', label: '分享' },
  { value: 'streak', label: '连续' }
]

// Computed
const userId = computed(() => props.userId)

const feedItems = computed(() => {
  return socialCollaborationService.getUserFeed(userId.value, 100, 0)
})

const filteredFeed = computed(() => {
  if (selectedFilter.value === 'all') {
    return feedItems.value.slice(0, displayCount.value)
  }
  return feedItems.value
    .filter(item => item.type === selectedFilter.value)
    .slice(0, displayCount.value)
})

// Methods
const getActivityIcon = (type) => {
  const icons = {
    achievement: '🏅',
    completion: '✅',
    share: '📤',
    streak: '🔥'
  }
  return icons[type] || '📌'
}

const getRelativeTime = (timestamp) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(timestamp)) / 1000 / 60)

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return `${Math.floor(diff / 1440)}天前`
}

const isLiked = (itemId) => {
  return likedItems.value.includes(itemId)
}

const toggleLike = (item) => {
  if (isLiked(item.id)) {
    socialCollaborationService.unlikeActivity(userId.value, item.id)
    const idx = likedItems.value.indexOf(item.id)
    if (idx > -1) likedItems.value.splice(idx, 1)
  } else {
    socialCollaborationService.likeActivity(userId.value, item.id)
    likedItems.value.push(item.id)
  }
}

const toggleComments = (itemId) => {
  const idx = expandedComments.value.indexOf(itemId)
  if (idx > -1) {
    expandedComments.value.splice(idx, 1)
  } else {
    expandedComments.value.push(itemId)
  }
}

const submitComment = (item) => {
  const text = newComments.value[item.id]
  if (!text || text.trim() === '') {
    ElMessage.warning('评论不能为空')
    return
  }

  const comment = socialCollaborationService.commentOnActivity(
    userId.value,
    item.id,
    text
  )

  if (!item.comments) item.comments = []
  item.comments.push(comment)

  newComments.value[item.id] = ''
  ElMessage.success('评论已发送')
}

const showAllComments = (item) => {
  selectedFeedItem.value = item
  dialogCommentText.value = ''
  commentsDialogVisible.value = true
}

const submitDialogComment = () => {
  if (!dialogCommentText.value || dialogCommentText.value.trim() === '') {
    ElMessage.warning('评论不能为空')
    return
  }

  const comment = socialCollaborationService.commentOnActivity(
    userId.value,
    selectedFeedItem.value.id,
    dialogCommentText.value
  )

  selectedFeedItem.value.comments.push(comment)
  dialogCommentText.value = ''
  ElMessage.success('评论已发送')
}

const shareItem = (item) => {
  ElMessage.success('分享成功！')
  item.shares++
}

const handleItemAction = (command) => {
  switch (command) {
    case 'share':
      ElMessage.info('分享功能')
      break
    case 'follow':
      ElMessage.success('已关注该用户')
      break
    case 'report':
      ElMessage.warning('已举报该内容')
      break
  }
}

const loadMore = () => {
  displayCount.value += 10
  if (displayCount.value >= feedItems.value.length) {
    hasMore.value = false
  }
}

const refreshFeed = () => {
  displayCount.value = 10
  hasMore.value = feedItems.value.length > 10
  ElMessage.success('已刷新')
}

onMounted(() => {
  allFeedItems.value = feedItems.value
})
</script>

<style scoped>
.social-feed {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.feed-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feed-icon {
  font-size: 24px;
}

.feed-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Empty State */
.feed-empty {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 13px;
  color: #9ca3af;
}

/* Feed Items */
.feed-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-item {
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.feed-item:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.02);
  box-shadow: 0 2px 8px rgba(94, 124, 224, 0.1);
}

.feed-item.type-achievement {
  border-left: 4px solid #FFD700;
}

.feed-item.type-completion {
  border-left: 4px solid #67c23a;
}

.feed-item.type-share {
  border-left: 4px solid #5e7ce0;
}

.feed-item.type-streak {
  border-left: 4px solid #f56c6c;
}

/* Item Header */
.item-user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.item-time {
  font-size: 11px;
  color: #9ca3af;
}

/* Item Content */
.item-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.activity-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.activity-text {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.activity-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Stats */
.item-stats {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  border-top: 1px solid rgba(229, 230, 235, 0.4);
  border-bottom: 1px solid rgba(229, 230, 235, 0.4);
  font-size: 12px;
  color: #6b7280;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 13px;
}

/* Action Buttons */
.item-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.action-button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.action-button:hover {
  border-color: rgba(94, 124, 224, 0.3);
  color: #5e7ce0;
}

.action-button.active {
  border-color: #f56c6c;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.05);
}

.action-icon {
  font-size: 13px;
}

.action-text {
  display: none;
}

@media (min-width: 480px) {
  .action-text {
    display: inline;
  }
}

/* Comments Section */
.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(229, 230, 235, 0.4);
}

.comments-list {
  margin-bottom: 12px;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
}

.comment-author {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2px;
}

.comment-text {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.comment-time {
  font-size: 10px;
  color: #9ca3af;
}

.view-all-comments {
  width: 100%;
  padding: 8px;
  background: rgba(245, 247, 250, 0.6);
  border: 1px solid rgba(229, 230, 235, 0.4);
  border-radius: 4px;
  font-size: 12px;
  color: #5e7ce0;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
  font-weight: 600;
}

.view-all-comments:hover {
  background: rgba(245, 247, 250, 0.9);
  border-color: rgba(94, 124, 224, 0.3);
}

.comment-input {
  display: flex;
  gap: 8px;
}

.comment-text-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}

.comment-text-input:focus {
  outline: none;
  border-color: #5e7ce0;
  box-shadow: 0 0 0 2px rgba(94, 124, 224, 0.1);
}

.comment-submit {
  padding: 8px 16px;
  background: #5e7ce0;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.comment-submit:hover {
  background: #4a5fa8;
}

/* Comments Dialog */
.all-comments {
  padding: 12px 0;
}

.feed-item-summary {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.feed-item-summary .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.feed-item-summary .name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.feed-item-summary .title {
  font-size: 12px;
  color: #6b7280;
}

.comments-list-full {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.comment-item-full {
  padding: 12px 0;
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
}

.comment-item-full:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-author-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.comment-time-full {
  font-size: 10px;
  color: #9ca3af;
}

.comment-text-full {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 12px;
}

.comment-input-full {
  display: flex;
  gap: 8px;
}

.comment-input-full .comment-text-input {
  width: 100%;
}

/* Load More */
.load-more {
  text-align: center;
  padding: 16px 0;
}

/* Responsive */
@media (max-width: 480px) {
  .social-feed {
    padding: 16px;
  }

  .feed-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .feed-controls {
    width: 100%;
    justify-content: space-between;
  }

  .item-actions {
    gap: 8px;
  }

  .action-button {
    padding: 6px 8px;
    font-size: 11px;
  }
}
</style>
