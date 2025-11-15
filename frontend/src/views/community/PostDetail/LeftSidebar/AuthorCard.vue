<template>
  <div class="author-card">
    <!-- 背景 -->
    <div class="card-bg"></div>

    <!-- 作者头像 -->
    <div class="author-avatar">
      <el-avatar :src="author.avatar" :size="80" />
    </div>

    <!-- 作者基本信息 -->
    <div class="author-info">
      <h3 class="author-name">{{ author.name }}</h3>
      <p v-if="author.title" class="author-title">{{ author.title }}</p>
      <p v-if="author.bio" class="author-bio">{{ author.bio }}</p>
    </div>

    <!-- 统计信息 -->
    <div class="author-stats">
      <div class="stat-item">
        <span class="stat-value">{{ author.followerCount || 0 }}</span>
        <span class="stat-label">粉丝</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ author.articleCount || 0 }}</span>
        <span class="stat-label">文章</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ author.likeCount || 0 }}</span>
        <span class="stat-label">获赞</span>
      </div>
    </div>

  <!-- 操作按钮 -->
    <div class="author-actions">
      <el-button
        :type="isFollowing ? 'default' : 'primary'"
        :loading="followLoading"
        @click="handleFollowToggle"
        class="action-btn"
      >
        {{ isFollowing ? '已关注' : '+ 关注' }}
      </el-button>
      <el-button
        type="default"
        :icon="Message"
        @click="handleMessage"
        class="action-btn"
        title="私信"
      />
    </div>

    <!-- 标签 -->
    <div v-if="author.tags && author.tags.length" class="author-tags">
      <el-tag
        v-for="tag in author.tags"
        :key="tag"
        size="small"
        effect="plain"
      >
        {{ tag }}
      </el-tag>
    </div>
  </div>

  <!-- 私信对话窗口 -->
  <ConversationDialog
    v-model:visible="showMessageDialog"
    :other-user-id="author.userId"
    :other-user="author"
    @close="showMessageDialog = false"
  />
</template>

<script setup>
import { ref, defineProps, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Message } from '@element-plus/icons-vue'
import ConversationDialog from '@/components/messaging/ConversationDialog.vue'

const props = defineProps({
  author: {
    type: Object,
    required: true,
    default: () => ({
      name: '匿名用户',
      avatar: '',
      title: '',
      bio: '',
      followerCount: 0,
      articleCount: 0,
      likeCount: 0,
      tags: [],
    }),
  },
})

const emit = defineEmits(['follow', 'message'])

const followLoading = ref(false)
const isFollowing = ref(props.author.isFollowing || false)
const showMessageDialog = ref(false)

const handleFollowToggle = async () => {
  followLoading.value = true
  try {
    isFollowing.value = !isFollowing.value
    emit('follow', { userId: props.author.userId, isFollowing: isFollowing.value })
    ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error('操作失败')
    isFollowing.value = !isFollowing.value
  } finally {
    followLoading.value = false
  }
}

const handleMessage = () => {
  if (!props.author.userId) {
    ElMessage.warning('无法与该用户聊天')
    return
  }
  showMessageDialog.value = true
  emit('message', { userId: props.author.userId })
}
</script>

<style scoped lang="scss">
.author-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  margin-bottom: 20px;

  .card-bg {
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .author-avatar {
    display: flex;
    justify-content: center;
    margin-top: -50px;
    margin-bottom: 16px;

    :deep(.el-avatar) {
      border: 4px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
  }

  .author-info {
    text-align: center;
    padding: 0 16px;

    .author-name {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .author-title {
      margin: 4px 0;
      font-size: 12px;
      color: #909399;
    }

    .author-bio {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #606266;
      line-height: 1.4;
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .author-stats {
    display: flex;
    justify-content: space-around;
    padding: 16px;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    margin: 16px 0;

    .stat-item {
      text-align: center;
      flex: 1;

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .stat-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .author-actions {
    display: flex;
    gap: 8px;
    padding: 0 16px;
    margin-bottom: 16px;

    .action-btn {
      flex: 1;
    }
  }

  .author-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 16px 16px;

    :deep(.el-tag) {
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
