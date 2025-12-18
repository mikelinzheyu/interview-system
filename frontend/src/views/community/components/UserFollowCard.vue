<template>
  <el-card 
    class="user-follow-card" 
    :body-style="{ padding: '0px' }" 
    shadow="hover"
  >
    <!-- 顶部封面背景 -->
    <div class="card-cover" :style="coverStyle"></div>

    <div class="card-content">
      <!-- 用户基本信息 -->
      <div class="user-header">
        <el-avatar 
          :src="user.avatar" 
          :size="72" 
          class="user-avatar"
          @click="$emit('view-profile', user.id)"
        >
          {{ user.username?.[0]?.toUpperCase() || 'U' }}
        </el-avatar>
        
        <div class="user-identity">
          <div class="name-row">
            <span class="username" @click="$emit('view-profile', user.id)">{{ user.username }}</span>
            <el-tag 
              v-if="user.isMutual" 
              size="small" 
              type="success" 
              effect="plain" 
              class="mutual-badge"
            >
              互相关注
            </el-tag>
          </div>
          <div class="bio" :title="user.bio || '这个人很懒，什么都没留下'">
            {{ user.bio || '这个人很懒，什么都没留下' }}
          </div>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ formatNumber(user.postCount || 0) }}</div>
          <div class="stat-label">帖子</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ formatNumber(user.followerCount || 0) }}</div>
          <div class="stat-label">粉丝</div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="user-actions">
        <el-button 
          class="action-btn"
          :icon="Message"
          circle
          plain
          @click="$emit('send-message', user.id)"
        />
        <el-button
          v-if="isFollowing"
          class="follow-btn"
          type="info"
          plain
          :loading="loading"
          @click="$emit('unfollow', user.id)"
        >
          已关注
        </el-button>
        <el-button
          v-else
          class="follow-btn"
          type="primary"
          :loading="loading"
          @click="$emit('follow', user.id)"
        >
          关注
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Message } from '@element-plus/icons-vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  // 当前卡片是否处于已关注状态 (用于初始渲染)
  initialFollowing: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view-profile', 'follow', 'unfollow', 'send-message'])

// 计算是否已关注 (优先使用 user.isFollowing, 否则使用 initialFollowing)
const isFollowing = computed(() => {
  return props.user.isFollowing !== undefined ? props.user.isFollowing : props.initialFollowing
})

// 生成随机渐变背景作为封面
const coverStyle = computed(() => {
  // 基于用户ID生成确定性的颜色，避免刷新变色
  const id = props.user.id || 0
  const hues = [
    ['#4facfe', '#00f2fe'], // Blue
    ['#43e97b', '#38f9d7'], // Green
    ['#fa709a', '#fee140'], // Orange/Pink
    ['#667eea', '#764ba2'], // Purple
    ['#ff9a9e', '#fecfef'], // Pink
    ['#fbc2eb', '#a6c1ee']  // Pastel
  ]
  const index = id % hues.length
  const [c1, c2] = hues[index]
  
  return {
    background: `linear-gradient(120deg, ${c1} 0%, ${c2} 100%)`
  }
})

// 格式化数字 (1.2k)
const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}
</script>

<style scoped>
.user-follow-card {
  border: none;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.user-follow-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-cover {
  height: 80px;
  width: 100%;
}

.card-content {
  padding: 0 16px 16px;
  margin-top: -36px; /* 让头像上浮覆盖封面 */
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 12px;
}

.user-avatar {
  border: 4px solid #fff;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.user-identity {
  margin-top: 8px;
  width: 100%;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.username:hover {
  color: var(--el-color-primary);
}

.bio {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  height: 34px; /* 显示两行 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.mutual-badge {
  height: 20px;
  padding: 0 4px;
  font-size: 10px;
}

.user-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0 16px;
  padding: 12px 0;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #dcdfe6;
}

.user-actions {
  margin-top: auto;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.follow-btn {
  flex: 1;
  max-width: 120px;
}
</style>
