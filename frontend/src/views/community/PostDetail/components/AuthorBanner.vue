<template>
  <div class="author-banner">
    <div class="author-banner-inner">
      <!-- 左侧：作者头像 -->
      <div class="author-avatar-section">
        <el-avatar :src="author.avatar || defaultAvatar" :size="64" />
        <div v-if="author.verified" class="verified-badge">
          <el-icon><Check /></el-icon>
        </div>
      </div>

      <!-- 中间：作者信息 -->
      <div class="author-info-section">
        <div class="author-name-row">
          <h3 class="author-name">{{ author.name || '匿名用户' }}</h3>
          <el-tag v-if="author.level" size="small" type="warning" effect="plain" class="author-level">
            {{ author.level }}
          </el-tag>
        </div>
        <p v-if="author.title" class="author-title">{{ author.title }}</p>
        <p v-if="author.bio" class="author-bio">{{ author.bio }}</p>

        <!-- 统计数据 -->
        <div class="author-stats">
          <div class="stat-item">
            <span class="stat-value">{{ formatCount(author.articleCount || 0) }}</span>
            <span class="stat-label">原创</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ formatCount(author.likeCount || 0) }}</span>
            <span class="stat-label">点赞</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ formatCount(author.viewCount || 0) }}</span>
            <span class="stat-label">浏览</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ formatCount(author.followerCount || 0) }}</span>
            <span class="stat-label">粉丝</span>
          </div>
        </div>
      </div>

      <!-- 右侧：操作按钮 -->
      <div class="author-actions">
        <el-button
          :type="isFollowing ? 'default' : 'primary'"
          :loading="followLoading"
          size="large"
          @click="handleFollow"
        >
          {{ isFollowing ? '已关注' : '关注' }}
        </el-button>
        <el-button
          type="default"
          size="large"
          :icon="ChatDotRound"
          @click="handleMessage"
        >
          私信
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, ChatDotRound } from '@element-plus/icons-vue'

const router = useRouter()

const props = defineProps({
  author: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      name: '匿名用户',
      avatar: '',
      title: '',
      bio: '',
      level: '',
      verified: false,
      articleCount: 0,
      likeCount: 0,
      viewCount: 0,
      followerCount: 0,
      isFollowing: false,
    }),
  },
})

const emit = defineEmits(['follow'])

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const followLoading = ref(false)
const isFollowing = ref(props.author.isFollowing || false)

const formatCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return count.toString()
}

const handleFollow = async () => {
  followLoading.value = true
  try {
    isFollowing.value = !isFollowing.value
    emit('follow', { userId: props.author.id, isFollowing: isFollowing.value })

    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error('操作失败')
    isFollowing.value = !isFollowing.value
  } finally {
    followLoading.value = false
  }
}

const handleMessage = () => {
  if (!props.author.id && !props.author.userId) {
    ElMessage.warning('无法与该用户聊天')
    return
  }

  // 导航到私信页面
  router.push({
    name: 'Conversation',
    params: { userId: props.author.id || props.author.userId }
  })
}
</script>

<style scoped lang="scss">
.author-banner {
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--spacing-2xl);
}

.author-banner-inner {
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-3xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
}

/* 左侧头像区域 */
.author-avatar-section {
  position: relative;
  flex-shrink: 0;

  .verified-badge {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 20px;
    height: 20px;
    background: var(--color-success);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-bg-white);

    .el-icon {
      color: white;
      font-size: 12px;
    }
  }
}

/* 中间信息区域 */
.author-info-section {
  flex: 1;
  min-width: 0;

  .author-name-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);

    .author-name {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .author-level {
      font-size: var(--font-size-xs);
    }
  }

  .author-title {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  .author-bio {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    margin: 0 0 var(--spacing-lg) 0;
    line-height: var(--line-height-base);
    max-width: 600px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .author-stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);

      .stat-value {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        line-height: 1;
      }

      .stat-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-tertiary);
        line-height: 1;
      }
    }

    .stat-divider {
      width: 1px;
      height: 24px;
      background: var(--color-border-default);
    }
  }
}

/* 右侧操作区域 */
.author-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .author-banner-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: var(--spacing-lg);
  }

  .author-avatar-section {
    align-self: center;
  }

  .author-info-section {
    text-align: center;

    .author-name-row {
      justify-content: center;
    }

    .author-bio {
      max-width: 100%;
      white-space: normal;
      overflow: visible;
    }

    .author-stats {
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  .author-actions {
    width: 100%;

    :deep(.el-button) {
      flex: 1;
    }
  }
}
</style>
