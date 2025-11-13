<template>
  <el-card class="post-card" shadow="hover">
    <div class="post-header">
      <div class="author-info" @click.stop="goToAuthor">
        <el-avatar :src="post.author?.avatar" :size="40" />
        <div class="author-details">
          <span class="author-name">{{ post.author?.name || '匿名' }}</span>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </div>
      <div class="post-tags-header">
        <el-tag v-if="post.solved" type="success" size="small">已解决</el-tag>
        <el-tag v-if="post.pinned" type="danger" size="small">置顶</el-tag>
      </div>
    </div>

    <div class="post-content" @click="goToPost">
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>

      <div v-if="post.tags && post.tags.length" class="post-tags">
        <el-tag
          v-for="tag in post.tags"
          :key="tag"
          size="small"
          type="info"
          @click.stop="$emit('tag-click', tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <div class="post-footer">
      <div class="post-stats">
        <span class="stat-item">
          <el-icon><View /></el-icon>
          {{ post.viewCount || 0 }}
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon>
          {{ post.commentCount || 0 }}
        </span>
        <span class="stat-item like-item" @click.stop="handleLike">
          <el-icon><StarFilled /></el-icon>
          {{ post.likes || 0 }}
        </span>
      </div>

      <div class="post-actions">
        <el-button v-if="canEdit" link type="primary" size="small" @click.stop="handleEdit">编辑</el-button>
        <el-button v-if="canDelete" link type="danger" size="small" @click.stop="handleDelete">删除</el-button>
        <el-dropdown @command="handleCommand" @click.stop>
          <el-button link type="info" size="small">
            更多
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="report">
                <el-icon><Warning /></el-icon>举报
              </el-dropdown-item>
              <el-dropdown-item command="share">
                <el-icon><Share /></el-icon>分享
              </el-dropdown-item>
              <el-dropdown-item v-if="!isCollected" command="collect">
                <el-icon><Collection /></el-icon>收藏
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-dialog v-model="reportDialogVisible" title="举报帖子" width="400px" :lock-scroll="false" append-to-body>
      <el-form :model="reportForm">
        <el-form-item label="举报原因" required>
          <el-select v-model="reportForm.reason" placeholder="请选择原因">
            <el-option label="垃圾/广告" value="spam" />
            <el-option label="不适当内容" value="inappropriate" />
            <el-option label="骚扰/侮辱" value="harassment" />
            <el-option label="侵犯版权" value="copyright" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="reportForm.description" type="textarea" :rows="4" placeholder="请详细说明原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reportSubmitting" @click="submitReport">确认举报</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, ChatDotRound, StarFilled, Warning, Share, Collection, ArrowDown } from '@element-plus/icons-vue'
import communityAPI from '@/api/communityWithCache'
import { usePostActions } from '@/composables/usePostActions'
import { useShare } from '@/composables/useShare'

const props = defineProps({
  post: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['like', 'delete', 'tag-click'])
const router = useRouter()
const { toggleLikePost, reportContent } = usePostActions()
const { triggerShare } = useShare()

const reportDialogVisible = ref(false)
const reportSubmitting = ref(false)
const reportForm = ref({ reason: '', description: '' })
const isCollected = ref(false)

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  if (h < 24) return `${h}小时前`
  if (d < 7) return `${d}天前`
  return date.toLocaleDateString()
}

const getExcerpt = (content) => {
  if (!content) return '暂无内容'
  const plain = String(content).replace(/[#*`\n]/g, ' ').trim()
  return plain.length > 150 ? plain.slice(0, 150) + '...' : plain
}

const goToPost = () => router.push(`/community/posts/${props.post.id}`)
const goToAuthor = () => { if (props.post.author?.userId) router.push(`/user/${props.post.author.userId}`) }

const handleLike = async () => {
  if (props.loading) return
  await toggleLikePost(props.post)
  emit('like', props.post)
}

const handleEdit = () => router.push(`/community/posts/${props.post.id}/edit`)

const handleDelete = async () => {
  try {
    await communityAPI.deletePost(props.post.id)
    ElMessage.success('删除成功')
    emit('delete', props.post.id)
  } catch (e) {
    ElMessage.error('删除失败: ' + (e.message || '请重试'))
  }
}

const handleCommand = (cmd) => {
  if (cmd === 'report') reportDialogVisible.value = true
  if (cmd === 'share') handleShare()
  if (cmd === 'collect') handleCollect()
}

const handleShare = () => {
  const url = `${window.location.origin}/community/posts/${props.post.id}`
  const title = '社区论坛'
  const text = `分享一篇好文：${props.post.title}`
  triggerShare({ title, text, url })
}

const handleCollect = async () => {
  isCollected.value = true
  ElMessage.success('收藏成功')
}

const submitReport = async () => {
  if (!reportForm.value.reason) {
    ElMessage.error('请选择举报原因')
    return
  }
  reportSubmitting.value = true
  try {
    await reportContent('post', props.post.id, reportForm.value.reason)
    ElMessage.success('举报成功')
    reportDialogVisible.value = false
    reportForm.value = { reason: '', description: '' }
  } catch (e) {
    ElMessage.error('举报失败: ' + (e.message || '请重试'))
  } finally {
    reportSubmitting.value = false
  }
}
</script>

<style scoped>
.post-card { margin-bottom: 16px; }
.post-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.author-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.post-content { cursor: pointer; }
.post-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f5f5f5; }
.post-stats { display: flex; gap: 16px; }
.post-actions { display: flex; gap: 8px; }
.post-tags { display: flex; flex-wrap: wrap; gap: 6px; }
</style>

