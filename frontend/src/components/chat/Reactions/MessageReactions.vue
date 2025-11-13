<template>
  <div class="message-reactions">
    <!-- 反应按钮列表 -->
    <div class="reactions-container">
      <button
        v-for="reaction in reactions"
        :key="reaction.emoji"
        class="reaction-button"
        :class="{ 'is-reacted': reaction.isReacted }"
        :title="getReactionTooltip(reaction)"
        @click="handleReactionClick(reaction.emoji)"
      >
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
        <span v-if="reaction.count > 0" class="reaction-count">{{ reaction.count }}</span>
      </button>

      <!-- 添加反应按钮 -->
      <el-popover
        placement="top"
        :visible="showReactionPicker"
        trigger="click"
        @show="showReactionPicker = true"
        @hide="showReactionPicker = false"
      >
        <template #reference>
          <button class="add-reaction-button" title="添加反应">
            <el-icon><Plus /></el-icon>
          </button>
        </template>

        <ReactionPicker @select="handleSelectReaction" @close="showReactionPicker = false" />
      </el-popover>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import ReactionPicker from './ReactionPicker.vue'

const props = defineProps({
  reactions: {
    type: Array,
    default: () => [],
    validator: (arr) =>
      Array.isArray(arr) &&
      arr.every(r =>
        typeof r === 'object' &&
        'emoji' in r &&
        'count' in r &&
        'isReacted' in r
      )
  },
  messageId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['add-reaction', 'remove-reaction'])

const showReactionPicker = ref(false)

// 获取反应的悬停提示文本
function getReactionTooltip(reaction) {
  if (!reaction.count) return '无反应'

  const maxUsers = 3
  const userNames = reaction.users?.slice(0, maxUsers).join(', ') || '用户'
  const moreText = reaction.users?.length > maxUsers
    ? `等 ${reaction.users.length} 人`
    : ''

  return `${userNames} ${moreText} 反应了 ${reaction.emoji}`
}

// 处理反应点击
function handleReactionClick(emoji) {
  emit(showReactionPicker.value ? 'add-reaction' : 'add-reaction', {
    messageId: props.messageId,
    emoji,
    action: 'toggle'
  })
}

// 处理选择反应
function handleSelectReaction(emoji) {
  showReactionPicker.value = false
  emit('add-reaction', {
    messageId: props.messageId,
    emoji,
    action: 'add'
  })
}
</script>

<style scoped>
.message-reactions {
  margin-top: 6px;
}

.reactions-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.reaction-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  height: 28px;
  white-space: nowrap;
}

.reaction-button:hover {
  background: #efefef;
  border-color: #d0d0d0;
}

.reaction-button.is-reacted {
  background: #e0e7ff;
  border-color: #409eff;
}

.reaction-button.is-reacted:hover {
  background: #d0deff;
  border-color: #66b1ff;
}

.reaction-emoji {
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.reaction-count {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.reaction-button.is-reacted .reaction-count {
  color: #409eff;
  font-weight: 600;
}

.add-reaction-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  font-size: 14px;
}

.add-reaction-button:hover {
  background: #efefef;
  border-color: #d0d0d0;
  color: #409eff;
}

.add-reaction-button:active {
  transform: scale(0.95);
}
</style>
