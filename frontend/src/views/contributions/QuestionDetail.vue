<template>
  <div class="question-detail-container">
    <el-button class="back-btn" @click="router.back()">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <div v-loading="loading" class="content-wrapper">
      <!-- 题目详情 -->
      <el-card class="question-card">
        <div class="question-header">
          <h1>{{ question.title }}</h1>
          <div class="header-actions">
            <el-button
              :type="question.isFavorited ? 'warning' : 'default'"
              :icon="Star"
              @click="toggleFavorite"
            >
              {{ question.isFavorited ? '已收藏' : '收藏' }}
            </el-button>
            <el-button type="primary" :icon="Share">
              分享
            </el-button>
          </div>
        </div>

        <div class="question-meta">
          <el-tag :type="getDifficultyType(question.difficulty)" size="large">
            {{ question.difficulty }}
          </el-tag>
          <el-tag v-if="question.category" type="info">
            {{ question.category }}
          </el-tag>
          <el-tag v-for="tag in question.tags" :key="tag" type="success" effect="plain">
            {{ tag }}
          </el-tag>
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ question.author }}
          </span>
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            {{ question.publishedAt }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            {{ question.views }} 浏览
          </span>
        </div>

        <!-- 悬赏标识 -->
        <el-alert
          v-if="question.bounty"
          type="warning"
          :closable="false"
          class="bounty-alert"
        >
          <template #title>
            <div class="bounty-info">
              <el-icon><TrophyBase /></el-icon>
              <span>悬赏 {{ question.bounty.points }} 积分</span>
              <span class="deadline">截止时间: {{ question.bounty.deadline }}</span>
            </div>
          </template>
        </el-alert>

        <div class="question-content">
          <div class="markdown-body" v-html="renderedContent"></div>
        </div>

        <div class="question-footer">
          <div class="stats">
            <span><el-icon><ChatDotRound /></el-icon> {{ discussions.length }} 讨论</span>
            <span><el-icon><Star /></el-icon> {{ question.favorites }} 收藏</span>
          </div>
        </div>
      </el-card>

      <!-- 讨论区 -->
      <el-card class="discussions-card">
        <div class="discussions-header">
          <h2>
            <el-icon><ChatDotRound /></el-icon>
            讨论区 ({{ discussions.length }})
          </h2>
          <el-button type="primary" @click="showReplyDialog = true">
            发布讨论
          </el-button>
        </div>

        <!-- 讨论列表 -->
        <div class="discussions-list">
          <el-empty v-if="discussions.length === 0" description="暂无讨论" />

          <div
            v-for="discussion in discussions"
            :key="discussion.id"
            class="discussion-item"
          >
            <div class="discussion-avatar">
              <el-avatar :size="48">{{ discussion.author[0] }}</el-avatar>
            </div>

            <div class="discussion-body">
              <div class="discussion-header-info">
                <strong>{{ discussion.author }}</strong>
                <span class="time">{{ discussion.createdAt }}</span>
              </div>

              <div class="discussion-content markdown-body" v-html="discussion.content"></div>

              <div class="discussion-actions">
                <el-button
                  size="small"
                  :type="discussion.isLiked ? 'primary' : 'default'"
                  :icon="StarFilled"
                  @click="toggleLike(discussion.id)"
                >
                  {{ discussion.likes }}
                </el-button>
                <el-button size="small" :icon="ChatDotRound" @click="replyTo(discussion)">
                  回复 ({{ discussion.replies?.length || 0 }})
                </el-button>
              </div>

              <!-- 回复列表 -->
              <div v-if="discussion.replies?.length > 0" class="replies-list">
                <div
                  v-for="reply in discussion.replies"
                  :key="reply.id"
                  class="reply-item"
                >
                  <el-avatar :size="32">{{ reply.author[0] }}</el-avatar>
                  <div class="reply-content">
                    <div class="reply-header">
                      <strong>{{ reply.author }}</strong>
                      <span class="time">{{ reply.createdAt }}</span>
                    </div>
                    <div class="markdown-body" v-html="reply.content"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 发布讨论对话框 -->
    <el-dialog
      v-model="showReplyDialog"
      title="发布讨论"
      width="800px"
    >
      <RichTextEditor v-model="newDiscussion" placeholder="请输入您的想法..." />
      <template #footer>
        <el-button @click="showReplyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDiscussion">发布</el-button>
      </template>
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="showReplyToDialog"
      title="回复讨论"
      width="600px"
    >
      <el-input
        v-model="replyContent"
        type="textarea"
        :rows="6"
        placeholder="请输入回复内容..."
      />
      <template #footer>
        <el-button @click="showReplyToDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReply">回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Star, Share, User, Clock, View, ChatDotRound,
  StarFilled, TrophyBase
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import RichTextEditor from '@/components/RichTextEditor.vue'
import {
  getQuestionDetail,
  favoriteQuestion,
  unfavoriteQuestion,
  postDiscussion,
  getDiscussions,
  replyDiscussion,
  likeDiscussion
} from '@/api/contributions'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const question = ref({
  id: null,
  title: '',
  difficulty: '中等',
  category: '',
  tags: [],
  author: '',
  publishedAt: '',
  views: 0,
  content: '',
  isFavorited: false,
  favorites: 0,
  bounty: null
})

const discussions = ref([])
const showReplyDialog = ref(false)
const showReplyToDialog = ref(false)
const newDiscussion = ref('')
const replyContent = ref('')
const currentReplyTo = ref(null)

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  return marked(question.value.content || '')
})

// 获取难度类型
const getDifficultyType = (difficulty) => {
  const map = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return map[difficulty] || 'info'
}

// 加载题目详情
const loadQuestion = async () => {
  loading.value = true
  try {
    const response = await getQuestionDetail(route.params.id)
    if (response.code === 200) {
      question.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载讨论
const loadDiscussions = async () => {
  try {
    const response = await getDiscussions(route.params.id)
    if (response.code === 200) {
      discussions.value = response.data.items
    }
  } catch (error) {
    console.error('加载讨论失败', error)
  }
}

// 切换收藏
const toggleFavorite = async () => {
  try {
    const api = question.value.isFavorited ? unfavoriteQuestion : favoriteQuestion
    const response = await api(question.value.id)

    if (response.code === 200) {
      question.value.isFavorited = !question.value.isFavorited
      question.value.favorites += question.value.isFavorited ? 1 : -1
      ElMessage.success(question.value.isFavorited ? '收藏成功' : '已取消收藏')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 发布讨论
const submitDiscussion = async () => {
  if (!newDiscussion.value.trim()) {
    ElMessage.warning('请输入讨论内容')
    return
  }

  try {
    const response = await postDiscussion(question.value.id, {
      content: newDiscussion.value
    })

    if (response.code === 200) {
      ElMessage.success('发布成功')
      showReplyDialog.value = false
      newDiscussion.value = ''
      loadDiscussions()
    }
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

// 回复讨论
const replyTo = (discussion) => {
  currentReplyTo.value = discussion
  showReplyToDialog.value = true
}

// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  try {
    const response = await replyDiscussion(currentReplyTo.value.id, {
      content: replyContent.value
    })

    if (response.code === 200) {
      ElMessage.success('回复成功')
      showReplyToDialog.value = false
      replyContent.value = ''
      loadDiscussions()
    }
  } catch (error) {
    ElMessage.error('回复失败')
  }
}

// 点赞
const toggleLike = async (discussionId) => {
  try {
    const response = await likeDiscussion(discussionId)
    if (response.code === 200) {
      loadDiscussions()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadQuestion()
  loadDiscussions()
})
</script>

<style scoped>
.question-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  padding: 30px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.question-header h1 {
  margin: 0;
  font-size: 28px;
  color: #303133;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.question-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 14px;
}

.bounty-alert {
  margin-bottom: 20px;
}

.bounty-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.deadline {
  margin-left: auto;
  font-weight: normal;
  font-size: 13px;
}

.question-content {
  margin: 30px 0;
  font-size: 15px;
  line-height: 1.8;
}

.question-footer {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.stats {
  display: flex;
  gap: 20px;
  color: #909399;
}

.stats span {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 讨论区 */
.discussions-card {
  padding: 30px;
}

.discussions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.discussions-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.discussions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.discussion-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.discussion-body {
  flex: 1;
}

.discussion-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.discussion-header-info strong {
  color: #303133;
}

.time {
  color: #c0c4cc;
  font-size: 13px;
}

.discussion-content {
  margin: 10px 0;
  color: #606266;
  line-height: 1.6;
}

.discussion-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.replies-list {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid #dcdfe6;
}

.reply-item {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

/* Markdown 样式 */
.markdown-body {
  word-wrap: break-word;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-body code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.markdown-body pre {
  background: #282c34;
  color: #abb2bf;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .question-header {
    flex-direction: column;
    gap: 15px;
  }

  .discussion-item {
    flex-direction: column;
  }
}
</style>
