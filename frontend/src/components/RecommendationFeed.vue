<template>
  <div class="recommendation-feed">
    <div class="feed-header">
      <h2>
        <el-icon><MagicStick /></el-icon>
        为你推荐
      </h2>
      <el-button
        type="primary"
        text
        :icon="Refresh"
        :loading="refreshing"
        @click="handleRefresh"
      >
        换一批
      </el-button>
    </div>

    <div v-loading="loading" class="feed-content">
      <el-empty v-if="!loading && recommendations.length === 0" description="暂无推荐内容" />

      <div class="recommendation-grid">
        <el-card
          v-for="item in recommendations"
          :key="item.id"
          class="recommendation-card"
          :class="`card-${item.targetType}`"
          shadow="hover"
          @click="handleCardClick(item)"
        >
          <!-- 推荐类型标签 -->
          <div class="card-header">
            <el-tag :type="getTypeTagType(item.targetType)" size="small">
              {{ getTypeName(item.targetType) }}
            </el-tag>
            <div class="match-score">
              匹配度 {{ Math.round(item.score * 100) }}%
            </div>
          </div>

          <!-- 帖子推荐 -->
          <div v-if="item.targetType === 'post'" class="post-content">
            <h3 class="card-title">{{ item.target.title }}</h3>
            <p class="card-desc">{{ getExcerpt(item.target.content) }}</p>
            <div class="card-meta">
              <el-tag
                v-for="tag in item.target.tags.slice(0, 3)"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="card-stats">
              <span><el-icon><View /></el-icon> {{ item.target.viewCount }}</span>
              <span><el-icon><ChatDotRound /></el-icon> {{ item.target.commentCount }}</span>
              <span><el-icon><Star /></el-icon> {{ item.target.likeCount }}</span>
            </div>
          </div>

          <!-- 聊天室推荐 -->
          <div v-else-if="item.targetType === 'chatroom'" class="chatroom-content">
            <div class="chatroom-icon">
              <el-avatar :size="60">
                {{ item.target.name.substring(0, 2) }}
              </el-avatar>
            </div>
            <h3 class="card-title">{{ item.target.name }}</h3>
            <p class="card-desc">{{ item.target.description }}</p>
            <div class="card-stats">
              <span>
                <el-icon><User /></el-icon>
                {{ item.target.memberCount }} / {{ item.target.maxMembers }} 人
              </span>
              <el-tag :type="item.target.type === 'public' ? 'success' : 'warning'" size="small">
                {{ item.target.type === 'public' ? '公开' : '群组' }}
              </el-tag>
            </div>
          </div>

          <!-- 推荐理由 -->
          <div class="recommendation-reason">
            <el-icon><InfoFilled /></el-icon>
            {{ item.reason }}
          </div>

          <!-- 操作按钮 -->
          <div class="card-actions">
            <el-button
              size="small"
              type="primary"
              @click.stop="handleAction(item)"
            >
              {{ getActionText(item.targetType) }}
            </el-button>
            <el-button
              size="small"
              text
              :icon="Close"
              @click.stop="handleDislike(item)"
            >
              不感兴趣
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="load-more">
        <el-button :loading="loadingMore" @click="loadMore">
          加载更多
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  MagicStick, Refresh, View, ChatDotRound, Star, User,
  InfoFilled, Close
} from '@element-plus/icons-vue'
import {
  getRecommendations,
  refreshRecommendations,
  submitRecommendationFeedback
} from '@/api/recommendations'

const router = useRouter()

// 数据
const recommendations = ref([])
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(6)
const total = ref(0)

const hasMore = ref(true)

// 获取推荐列表
const fetchRecommendations = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const response = await getRecommendations({
      page: page.value,
      size: pageSize.value
    })

    const newItems = response.data.items
    total.value = response.data.total

    if (isLoadMore) {
      recommendations.value = [...recommendations.value, ...newItems]
    } else {
      recommendations.value = newItems
    }

    hasMore.value = recommendations.value.length < total.value
  } catch (error) {
    ElMessage.error('获取推荐失败')
    console.error(error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 刷新推荐
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await refreshRecommendations()
    page.value = 1
    await fetchRecommendations()
    ElMessage.success('推荐已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 加载更多
const loadMore = () => {
  page.value++
  fetchRecommendations(true)
}

// 点击卡片
const handleCardClick = (item) => {
  if (item.targetType === 'post') {
    router.push(`/community/posts/${item.targetId}`)
  } else if (item.targetType === 'chatroom') {
    router.push(`/chat/room/${item.targetId}`)
  }
}

// 操作按钮
const handleAction = (item) => {
  handleCardClick(item)
}

// 不感兴趣
const handleDislike = async (item) => {
  try {
    await submitRecommendationFeedback({
      recommendationId: item.id,
      feedback: 'dislike'
    })

    // 从列表中移除
    const index = recommendations.value.findIndex(r => r.id === item.id)
    if (index > -1) {
      recommendations.value.splice(index, 1)
    }

    ElMessage.success('已记录反馈')
  } catch (error) {
    ElMessage.error('反馈失败')
  }
}

// 获取类型名称
const getTypeName = (type) => {
  const map = {
    post: '帖子',
    chatroom: '聊天室',
    question: '题目',
    user: '用户'
  }
  return map[type] || type
}

// 获取类型标签颜色
const getTypeTagType = (type) => {
  const map = {
    post: 'primary',
    chatroom: 'success',
    question: 'warning',
    user: 'info'
  }
  return map[type] || ''
}

// 获取操作按钮文本
const getActionText = (type) => {
  const map = {
    post: '查看详情',
    chatroom: '进入聊天',
    question: '开始练习',
    user: '查看主页'
  }
  return map[type] || '查看'
}

// 获取摘要
const getExcerpt = (content) => {
  if (!content) return ''
  const text = content.replace(/[#*`\n]/g, ' ').trim()
  return text.length > 100 ? text.substring(0, 100) + '...' : text
}

onMounted(() => {
  fetchRecommendations()
})
</script>

<style scoped>
.recommendation-feed {
  width: 100%;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.feed-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.feed-content {
  min-height: 300px;
}

.recommendation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.recommendation-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-post:hover {
  border-color: #409eff;
}

.card-chatroom:hover {
  border-color: #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.match-score {
  font-size: 12px;
  color: #67c23a;
  font-weight: 600;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-desc {
  font-size: 14px;
  color: #606266;
  margin: 10px 0;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0;
}

.card-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #909399;
  margin: 10px 0;
}

.card-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chatroom-content {
  text-align: center;
}

.chatroom-icon {
  margin: 10px 0 15px;
}

.recommendation-reason {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #909399;
  margin: 15px 0;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.card-actions .el-button {
  flex: 1;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .recommendation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
