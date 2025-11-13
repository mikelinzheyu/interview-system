<template>
  <div class="comment-list">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="comments.length === 0" class="empty">
      <el-empty description="暂无评论，来发表第一条评论吧" />
    </div>

    <div v-else class="comments">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :post-id="postId"
        @reply="handleReply"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import CommentItem from './CommentItem.vue'

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  postId: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['reply', 'delete'])

const handleReply = (data) => {
  emit('reply', data)
}

const handleDelete = (commentId) => {
  emit('delete', commentId)
}
</script>

<style scoped lang="scss">
.comment-list {
  .loading {
    padding: 20px 0;
  }

  .empty {
    padding: 40px 0;
  }

  .comments {
    .comment-item + .comment-item {
      border-top: 1px solid #f0f0f0;
      padding-top: 16px;
      margin-top: 16px;
    }
  }
}
</style>
