<template>
  <div class="comment-form">
    <div class="comment-form-header">
      <span class="form-title">
        {{ replyingTo ? `回复 ${replyingToName}` : '发表评论' }}
      </span>
      <el-button
        v-if="replyingTo"
        link
        type="info"
        size="small"
        @click="cancelReply"
      >
        取消
      </el-button>
    </div>

    <!-- 评论输入框 -->
    <el-input
      v-model="content"
      type="textarea"
      :rows="3"
      placeholder="分享你的想法..."
      :maxlength="5000"
      show-word-limit
      @focus="inputFocused = true"
      @blur="inputFocused = false"
    />

    <!-- 提及用户 -->
    <div class="mention-section" v-if="showMentionSearch">
      <el-select
        v-model="mentions"
        multiple
        filterable
        remote
        :remote-method="searchUsers"
        placeholder="@ 提及用户"
        style="width: 100%; margin-top: 8px"
      >
        <el-option
          v-for="user in suggestedUsers"
          :key="user.id"
          :label="`@${user.name}`"
          :value="user.id"
        >
          <div class="user-option">
            <img :src="user.avatar" class="user-avatar" :alt="user.name" />
            <span>{{ user.name }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button
        type="primary"
        :loading="submitLoading"
        :disabled="!content.trim()"
        @click="handleSubmit"
      >
        {{ replyingTo ? '发布回复' : '发表评论' }}
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="true"
      @close="error = null"
      style="margin-top: 12px"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  submitLoading: {
    type: Boolean,
    default: false
  },
  replyingTo: {
    type: String,
    default: null
  },
  replyingToName: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel-reply'])

const content = ref('')
const mentions = ref([])
const inputFocused = ref(false)
const showMentionSearch = ref(false)
const suggestedUsers = ref([])

/**
 * 搜索用户
 */
const searchUsers = async (query) => {
  if (!query || query.length < 1) {
    suggestedUsers.value = []
    return
  }

  // TODO: 调用 API 搜索用户
  // 临时示例数据
  suggestedUsers.value = [
    { id: 'user1', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1' },
    { id: 'user2', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2' }
  ].filter(u => u.name.includes(query))
}

/**
 * 提交评论
 */
const handleSubmit = () => {
  if (!content.value.trim()) {
    return
  }

  emit('submit', {
    content: content.value,
    mentions: mentions.value
  })

  // 清空表单
  content.value = ''
  mentions.value = []
}

/**
 * 重置表单
 */
const handleReset = () => {
  content.value = ''
  mentions.value = []
}

/**
 * 取消回复
 */
const cancelReply = () => {
  handleReset()
  emit('cancel-reply')
}

/**
 * 监听输入框内容，在 @ 时显示用户搜索
 */
const handleContentChange = () => {
  const lastChar = content.value[content.value.length - 1]
  showMentionSearch.value = lastChar === '@'
}
</script>

<style scoped lang="scss">
.comment-form {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;

  .comment-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .form-title {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.5;
    resize: vertical;

    &:focus {
      border-color: #409eff;
    }
  }

  .mention-section {
    margin-top: 12px;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .user-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
  }
}
</style>
