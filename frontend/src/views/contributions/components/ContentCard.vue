<template>
  <div class="content-card" @click="handleClick">
    <div class="card-left">
      <!-- 分类图标 -->
      <div class="category-icon" :style="{ background: getCategoryColor(content.category) }">
        <el-icon :size="28">
          <component :is="getCategoryIcon(content.category)" />
        </el-icon>
      </div>
    </div>

    <div class="card-main">
      <!-- 标题和标签 -->
      <div class="card-header">
        <h3 class="card-title">{{ content.title }}</h3>
        <el-tag :type="getDifficultyType(content.difficulty)" size="small" class="difficulty-tag">
          {{ content.difficulty }}
        </el-tag>
      </div>

      <!-- 描述 -->
      <p class="card-description">{{ content.description }}</p>

      <!-- 标签列表 -->
      <div class="card-tags">
        <el-tag
          v-for="tag in content.tags"
          :key="tag"
          size="small"
          effect="plain"
          class="tag-item"
          @click.stop="handleTagClick(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>

      <!-- 底部信息 -->
      <div class="card-footer">
        <div class="author-info">
          <el-avatar :size="24" :src="content.authorAvatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="author-name">{{ content.author }}</span>
          <span class="publish-time">{{ formatTime(content.publishTime) }}</span>
        </div>

        <div class="card-stats">
          <span class="stat-item">
            <el-icon><View /></el-icon>
            {{ formatNumber(content.views) }}
          </span>
          <span class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            {{ content.comments }}
          </span>
          <span class="stat-item" :class="{ liked: content.liked }">
            <el-icon><Star /></el-icon>
            {{ content.likes }}
          </span>
        </div>
      </div>
    </div>

    <!-- 右侧操作按钮 -->
    <div class="card-actions">
      <el-button circle @click.stop="handleLike">
        <el-icon :class="{ liked: content.liked }">
          <StarFilled v-if="content.liked" />
          <Star v-else />
        </el-icon>
      </el-button>
      <el-button circle @click.stop="handleCollect">
        <el-icon :class="{ collected: content.collected }">
          <CollectionTag v-if="content.collected" />
          <Collection v-else />
        </el-icon>
      </el-button>
      <el-button circle @click.stop="handleShare">
        <el-icon><Share /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, View, ChatDotRound, Star, StarFilled,
  Collection, CollectionTag, Share,
  Document, DataAnalysis, Monitor, EditPen,
  Box, MagicStick, Connection, Setting
} from '@element-plus/icons-vue'

const router = useRouter()

const props = defineProps({
  content: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'collect', 'share', 'tag-click'])

// 获取分类图标
const getCategoryIcon = (category) => {
  const iconMap = {
    '算法': DataAnalysis,
    '数据结构': Box,
    '前端': Monitor,
    '后端': Connection,
    '系统设计': Setting,
    '面试经验': Document,
    '代码实现': EditPen,
    '其他': MagicStick
  }
  return iconMap[category] || Document
}

// 获取分类颜色
const getCategoryColor = (category) => {
  const colorMap = {
    '算法': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '数据结构': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '前端': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '后端': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    '系统设计': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    '面试经验': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    '代码实现': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    '其他': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
  }
  return colorMap[category] || 'linear-gradient(135deg, #909399 0%, #c0c4cc 100%)'
}

// 获取难度类型
const getDifficultyType = (difficulty) => {
  const typeMap = {
    '简单': 'success',
    '中等': 'warning',
    '困难': 'danger'
  }
  return typeMap[difficulty] || 'info'
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num
}

// 格式化时间
const formatTime = (time) => {
  const now = new Date()
  const publishDate = new Date(time)
  const diff = now - publishDate
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return publishDate.toLocaleDateString()
}

// 点击卡片
const handleClick = () => {
  router.push(`/community/posts/${props.content.id}`)
}

// 点赞
const handleLike = () => {
  emit('like', props.content.id)
}

// 收藏
const handleCollect = () => {
  emit('collect', props.content.id)
}

// 分享
const handleShare = () => {
  emit('share', props.content.id)
  ElMessage.success('分享链接已复制到剪贴板')
}

// 标签点击
const handleTagClick = (tag) => {
  emit('tag-click', tag)
}
</script>

<style scoped>
.content-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  margin-bottom: 16px;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #409eff;
}

/* 左侧图标 */
.card-left {
  flex-shrink: 0;
}

.category-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.content-card:hover .category-icon {
  transform: scale(1.1) rotate(5deg);
}

/* 主要内容 */
.card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;
}

.content-card:hover .card-title {
  color: #409eff;
}

.difficulty-tag {
  flex-shrink: 0;
  font-weight: 600;
}

.card-description {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: scale(1.05);
  border-color: #409eff;
  color: #409eff;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #909399;
}

.author-name {
  color: #606266;
  font-weight: 500;
}

.author-name:hover {
  color: #409eff;
}

.publish-time {
  color: #c0c4cc;
}

.card-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.stat-item:hover {
  color: #409eff;
}

.stat-item.liked {
  color: #f56c6c;
}

/* 右侧操作 */
.card-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.card-actions .el-button {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f7fa;
  transition: all 0.3s;
}

.card-actions .el-button:hover {
  background: #409eff;
  color: white;
  transform: scale(1.1);
}

.card-actions .el-icon.liked {
  color: #f56c6c;
}

.card-actions .el-icon.collected {
  color: #e6a23c;
}

/* 响应式 */
@media (max-width: 768px) {
  .content-card {
    flex-direction: column;
    padding: 16px;
    gap: 12px;
  }

  .card-left {
    display: none;
  }

  .card-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .card-title {
    font-size: 16px;
  }

  .card-description {
    font-size: 13px;
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-card {
  animation: fadeIn 0.5s ease-out backwards;
}
</style>
