<template>
  <div class="community-forum">
    <!-- Header -->
    <div class="forum-header">
      <h3 class="forum-title">
        <span class="forum-icon">💬</span> 社区论坛
      </h3>
      <el-button type="primary" @click="showNewPostDialog">
        发布新帖
      </el-button>
    </div>

    <!-- Categories -->
    <div class="categories-section">
      <el-button-group>
        <el-button
          v-for="(cat, key) in categories"
          :key="key"
          :type="selectedCategory === key ? 'primary' : 'default'"
          size="small"
          @click="selectedCategory = key"
        >
          {{ cat }}
        </el-button>
      </el-button-group>
    </div>

    <!-- Forum Posts List -->
    <div class="posts-section">
      <div
        v-for="post in forumPosts"
        :key="post.id"
        class="post-item"
        :class="{ pinned: post.pinned, solved: post.solved }"
        @click="selectPost(post)"
      >
        <div class="post-header">
          <div class="post-title-section">
            <span v-if="post.pinned" class="badge">📌 置顶</span>
            <span v-if="post.solved" class="badge solved">✓ 已解决</span>
            <h4 class="post-title">{{ post.title }}</h4>
          </div>
          <div class="post-meta">
            <span class="meta-item">👁️ {{ post.views }}</span>
            <span class="meta-item">💬 {{ post.replies }}</span>
            <span class="meta-item">👍 {{ post.likes }}</span>
          </div>
        </div>

        <div class="post-info">
          <div class="author-info">
            <img :src="post.author.avatar" :alt="post.author.userName" class="avatar" />
            <div class="author-details">
              <div class="author-name">{{ post.author.userName }}</div>
              <div class="author-rep">⭐ {{ post.author.reputation }}</div>
            </div>
          </div>

          <div class="post-tags">
            <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <div class="post-time">{{ getRelativeTime(post.createdAt) }}</div>
        </div>
      </div>

      <div v-if="forumPosts.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">还没有帖子</div>
      </div>
    </div>

    <!-- Community Guidelines -->
    <div class="guidelines-section">
      <h4 class="section-title">📋 社区准则</h4>
      <div class="guidelines-grid">
        <div v-for="guideline in guidelines" :key="guideline.id" class="guideline-card">
          <span class="guideline-icon">{{ guideline.icon }}</span>
          <div class="guideline-content">
            <h5>{{ guideline.title }}</h5>
            <p>{{ guideline.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- New Post Dialog -->
    <el-dialog v-model="newPostVisible" title="发布新帖" width="600px" center>
      <div class="post-form">
        <el-form :model="newPost" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="newPost.title" placeholder="输入帖子标题" />
          </el-form-item>

          <el-form-item label="分类">
            <el-select v-model="newPost.category">
              <el-option
                v-for="(name, key) in categories"
                :key="key"
                :label="name"
                :value="key"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="内容">
            <el-input
              v-model="newPost.content"
              type="textarea"
              :rows="6"
              placeholder="输入帖子内容"
            />
          </el-form-item>

          <el-form-item label="标签">
            <el-input
              v-model="newPost.tagsInput"
              placeholder="用逗号分隔，例如：JavaScript,异步"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="newPostVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewPost">发布</el-button>
      </template>
    </el-dialog>

    <!-- Post Detail Dialog -->
    <el-dialog
      v-model="postDetailVisible"
      :title="selectedPost?.title"
      width="700px"
      center
    >
      <div v-if="selectedPost" class="post-detail">
        <!-- Post Content -->
        <div class="post-content-section">
          <div class="author-card">
            <img :src="selectedPost.author.avatar" :alt="selectedPost.author.userName" />
            <div class="author-info">
              <div class="name">{{ selectedPost.author.userName }}</div>
              <div class="reputation">⭐ {{ selectedPost.author.reputation }}</div>
              <div class="time">{{ formatDate(selectedPost.createdAt) }}</div>
            </div>
          </div>

          <div class="content-text">
            {{ selectedPost.content }}
          </div>

          <div class="engagement-stats">
            <span>👁️ {{ selectedPost.views }} 浏览</span>
            <span>👍 {{ selectedPost.likes }} 点赞</span>
            <span>💬 {{ selectedPost.replies }} 回复</span>
          </div>
        </div>

        <el-divider />

        <!-- Replies -->
        <div class="replies-section">
          <h4>回复 ({{ replies.length }})</h4>
          <div class="replies-list">
            <div v-for="reply in replies" :key="reply.id" class="reply-item">
              <img :src="reply.author.avatar" :alt="reply.author.userName" class="avatar" />
              <div class="reply-content">
                <div class="reply-header">
                  <span class="author">{{ reply.author.userName }}</span>
                  <span v-if="reply.isAccepted" class="accepted-badge">✓ 被采纳</span>
                  <span class="time">{{ getRelativeTime(reply.createdAt) }}</span>
                </div>
                <p class="text">{{ reply.content }}</p>
                <div class="reply-actions">
                  <el-button link type="primary" size="small">👍 {{ reply.likes }}</el-button>
                  <el-button link type="primary" size="small">回复</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- Reply Form -->
        <div class="reply-form">
          <el-input
            v-model="newReply"
            type="textarea"
            placeholder="写下你的回复..."
            :rows="3"
          />
          <el-button type="primary" @click="submitReply" style="margin-top: 12px">
            发布回复
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import communityService from '@/services/communityService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const selectedCategory = ref('general')
const forumPosts = ref([])
const guidelines = ref([])
const newPostVisible = ref(false)
const postDetailVisible = ref(false)
const selectedPost = ref(null)
const replies = ref([])
const newReply = ref('')

const newPost = ref({
  title: '',
  content: '',
  category: 'general',
  tagsInput: ''
})

// Data
const categories = {
  general: '常见问题',
  learning: '学习讨论',
  projects: '项目分享',
  help: '求助',
  announcements: '公告'
}

// Methods
const loadPosts = () => {
  forumPosts.value = communityService.getForumPosts(selectedCategory.value)
}

const loadGuidelines = () => {
  guidelines.value = communityService.getCommunityGuidelines()
}

const showNewPostDialog = () => {
  newPost.value = { title: '', content: '', category: 'general', tagsInput: '' }
  newPostVisible.value = true
}

const submitNewPost = () => {
  if (!newPost.value.title || !newPost.value.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }

  const tags = newPost.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t)

  communityService.createForumPost(
    props.userId,
    newPost.value.title,
    newPost.value.content,
    newPost.value.category,
    tags
  )

  newPostVisible.value = false
  loadPosts()
  ElMessage.success('帖子发布成功！')
}

const selectPost = (post) => {
  selectedPost.value = post
  replies.value = communityService.getPostReplies(post.id)
  postDetailVisible.value = true
}

const submitReply = () => {
  if (!newReply.value) {
    ElMessage.warning('请输入回复内容')
    return
  }

  replies.value.push({
    id: `reply_${Date.now()}`,
    postId: selectedPost.value.id,
    author: {
      userId: props.userId,
      userName: `User ${props.userId}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${props.userId}`
    },
    content: newReply.value,
    createdAt: new Date(),
    likes: 0,
    isAccepted: false
  })

  newReply.value = ''
  ElMessage.success('回复已发送')
}

const getRelativeTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000 / 60)

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return `${Math.floor(diff / 1440)}天前`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadPosts()
  loadGuidelines()
})
</script>

<style scoped>
.community-forum {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.forum-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.forum-icon {
  font-size: 24px;
}

.categories-section {
  margin-bottom: 24px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.post-item {
  padding: 16px;
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.post-item:hover {
  border-color: rgba(94, 124, 224, 0.3);
  background: rgba(94, 124, 224, 0.02);
}

.post-item.pinned {
  border-left: 4px solid #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

.post-item.solved {
  border-left-color: #67c23a;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.post-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(255, 215, 0, 0.2);
  color: #DAA520;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.badge.solved {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.post-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.post-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(229, 230, 235, 0.3);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.author-rep {
  font-size: 10px;
  color: #6b7280;
}

.post-tags {
  display: flex;
  gap: 6px;
  flex: 1;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(94, 124, 224, 0.1);
  color: #5e7ce0;
  border-radius: 3px;
  font-size: 11px;
}

.post-time {
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* Guidelines Section */
.guidelines-section {
  margin-top: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.guidelines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.guideline-card {
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
  border-left: 3px solid #5e7ce0;
  display: flex;
  gap: 8px;
}

.guideline-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.guideline-card h5 {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.guideline-card p {
  font-size: 10px;
  color: #6b7280;
  margin: 0;
  line-height: 1.3;
}

/* Post Detail */
.post-detail {
  padding: 12px 0;
}

.post-content-section {
  margin-bottom: 12px;
}

.author-card {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.author-card img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-info .name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
}

.author-info .reputation {
  font-size: 11px;
  color: #6b7280;
}

.author-info .time {
  font-size: 10px;
  color: #9ca3af;
}

.content-text {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.3);
  border-radius: 4px;
}

.engagement-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
  padding: 8px 0;
}

.replies-section h4 {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 6px;
}

.reply-item .avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.reply-header .author {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.accepted-badge {
  padding: 1px 4px;
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  border-radius: 2px;
  font-size: 10px;
}

.reply-header .time {
  font-size: 10px;
  color: #9ca3af;
  margin-left: auto;
}

.reply-content .text {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.reply-actions {
  display: flex;
  gap: 8px;
}

.reply-form {
  margin-top: 12px;
}

.post-form {
  padding: 12px 0;
}

@media (max-width: 768px) {
  .post-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .guidelines-grid {
    grid-template-columns: 1fr;
  }

  .post-info {
    flex-wrap: wrap;
  }
}
</style>
