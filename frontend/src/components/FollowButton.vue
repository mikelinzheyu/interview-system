<template>
  <el-button
    :type="isFollowing ? 'default' : 'primary'"
    :size="size"
    :loading="loading"
    :icon="isFollowing ? Check : Plus"
    @click.stop="handleClick"
    class="follow-button"
    :class="{ 'is-following': isFollowing }"
  >
    <span v-if="!loading">{{ buttonText }}</span>
  </el-button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'
import { followUser, unfollowUser } from '@/api/follow'

const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  initialFollowing: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  showText: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['follow', 'unfollow', 'update:following'])

const isFollowing = ref(props.initialFollowing)
const loading = ref(false)

const buttonText = computed(() => {
  if (!props.showText) return ''
  return isFollowing.value ? '已关注' : '关注'
})

const handleClick = async () => {
  if (loading.value) return

  loading.value = true

  try {
    if (isFollowing.value) {
      // 取消关注
      await unfollowUser(props.userId)
      isFollowing.value = false
      emit('unfollow', props.userId)
      emit('update:following', false)
      ElMessage.success('已取消关注')
    } else {
      // 关注
      await followUser(props.userId)
      isFollowing.value = true
      emit('follow', props.userId)
      emit('update:following', true)
      ElMessage.success('关注成功')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error(isFollowing.value ? '取消关注失败' : '关注失败')
  } finally {
    loading.value = false
  }
}

// 暴露方法供父组件调用
defineExpose({
  refresh: () => {
    isFollowing.value = props.initialFollowing
  }
})
</script>

<style scoped>
.follow-button {
  transition: all 0.3s ease;
}

.follow-button.is-following {
  border-color: #dcdfe6;
  color: #606266;
}

.follow-button.is-following:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  background-color: #fef0f0;
}

.follow-button.is-following:hover :deep(.el-icon) {
  display: none;
}

.follow-button.is-following:hover::before {
  content: '取消关注';
  display: inline-block;
}

/* 小尺寸按钮优化 */
.follow-button.el-button--small {
  padding: 5px 12px;
  font-size: 12px;
}

/* 大尺寸按钮优化 */
.follow-button.el-button--large {
  padding: 12px 24px;
  font-size: 16px;
}
</style>
