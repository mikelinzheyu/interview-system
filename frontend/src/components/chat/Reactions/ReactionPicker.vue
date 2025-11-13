<template>
  <div class="reaction-picker">
    <div class="picker-header">
      <span class="title">添加反应</span>
      <el-button text size="small" @click="$emit('close')">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <!-- 搜索框 -->
    <div class="picker-search">
      <el-input
        v-model="searchText"
        placeholder="搜索表情..."
        size="small"
        clearable
        @input="filterEmojis"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 分类标签 -->
    <div class="picker-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="{ active: activeCategory === cat }"
        class="category-tab"
        @click="activeCategory = cat"
      >
        {{ getCategoryIcon(cat) }}
      </button>
    </div>

    <!-- 表情网格 -->
    <div class="emoji-grid">
      <button
        v-for="emoji in filteredEmojis"
        :key="emoji.code"
        class="emoji-item"
        :title="emoji.name"
        @click="selectEmoji(emoji)"
      >
        {{ emoji.emoji }}
      </button>
      <div v-if="filteredEmojis.length === 0" class="empty-state">
        没有找到表情
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Close, Search } from '@element-plus/icons-vue'

// 常用表情数据
const EMOJI_DATA = [
  // 笑脸
  { emoji: '😀', name: 'grinning', category: 'smileys', code: 'grinning' },
  { emoji: '😃', name: 'smiley', category: 'smileys', code: 'smiley' },
  { emoji: '😄', name: 'smile', category: 'smileys', code: 'smile' },
  { emoji: '😁', name: 'grin', category: 'smileys', code: 'grin' },
  { emoji: '😆', name: 'laughing', category: 'smileys', code: 'laughing' },
  { emoji: '😅', name: 'sweat_smile', category: 'smileys', code: 'sweat_smile' },
  { emoji: '🤣', name: 'rofl', category: 'smileys', code: 'rofl' },
  { emoji: '😂', name: 'joy', category: 'smileys', code: 'joy' },
  { emoji: '🙂', name: 'slightly_smiling_face', category: 'smileys', code: 'slightly_smiling_face' },
  { emoji: '🙃', name: 'upside_down_face', category: 'smileys', code: 'upside_down_face' },
  { emoji: '😉', name: 'wink', category: 'smileys', code: 'wink' },
  { emoji: '😊', name: 'blush', category: 'smileys', code: 'blush' },
  { emoji: '😇', name: 'halo', category: 'smileys', code: 'halo' },
  { emoji: '🥰', name: 'heart_eyes', category: 'smileys', code: 'heart_eyes' },
  { emoji: '😍', name: 'kissing_heart_eyes', category: 'smileys', code: 'kissing_heart_eyes' },
  { emoji: '🤩', name: 'star_struck', category: 'smileys', code: 'star_struck' },
  { emoji: '😘', name: 'kissing_heart', category: 'smileys', code: 'kissing_heart' },
  { emoji: '😗', name: 'kissing', category: 'smileys', code: 'kissing' },
  { emoji: '😚', name: 'kissing_closed_eyes', category: 'smileys', code: 'kissing_closed_eyes' },
  { emoji: '😙', name: 'kissing_smiling_eyes', category: 'smileys', code: 'kissing_smiling_eyes' },
  { emoji: '🥲', name: 'smiling_face_with_tear', category: 'smileys', code: 'smiling_face_with_tear' },
  { emoji: '😋', name: 'yum', category: 'smileys', code: 'yum' },
  { emoji: '😛', name: 'stuck_out_tongue', category: 'smileys', code: 'stuck_out_tongue' },
  { emoji: '😜', name: 'stuck_out_tongue_winking_eye', category: 'smileys', code: 'stuck_out_tongue_winking_eye' },
  { emoji: '🤪', name: 'zany_face', category: 'smileys', code: 'zany_face' },
  { emoji: '😝', name: 'stuck_out_tongue_closed_eyes', category: 'smileys', code: 'stuck_out_tongue_closed_eyes' },
  { emoji: '🤑', name: 'money_mouth_face', category: 'smileys', code: 'money_mouth_face' },
  { emoji: '🤗', name: 'hugging_face', category: 'smileys', code: 'hugging_face' },
  { emoji: '🤭', name: 'face_with_hand_over_mouth', category: 'smileys', code: 'face_with_hand_over_mouth' },
  { emoji: '🤫', name: 'shushing_face', category: 'smileys', code: 'shushing_face' },
  { emoji: '🤔', name: 'thinking', category: 'smileys', code: 'thinking' },
  { emoji: '🤐', name: 'zipper_mouth_face', category: 'smileys', code: 'zipper_mouth_face' },
  { emoji: '🤨', name: 'face_with_raised_eyebrow', category: 'smileys', code: 'face_with_raised_eyebrow' },
  { emoji: '😐', name: 'neutral_face', category: 'smileys', code: 'neutral_face' },
  { emoji: '😑', name: 'expressionless', category: 'smileys', code: 'expressionless' },
  { emoji: '😶', name: 'no_mouth', category: 'smileys', code: 'no_mouth' },
  { emoji: '😏', name: 'smirk', category: 'smileys', code: 'smirk' },
  { emoji: '😒', name: 'unamused', category: 'smileys', code: 'unamused' },
  { emoji: '🙄', name: 'rolling_eyes', category: 'smileys', code: 'rolling_eyes' },
  { emoji: '😬', name: 'grimacing', category: 'smileys', code: 'grimacing' },
  { emoji: '🤥', name: 'lying_face', category: 'smileys', code: 'lying_face' },
  { emoji: '😌', name: 'relieved', category: 'smileys', code: 'relieved' },
  { emoji: '😔', name: 'pensive', category: 'smileys', code: 'pensive' },
  { emoji: '😪', name: 'sleepy', category: 'smileys', code: 'sleepy' },
  { emoji: '🤤', name: 'drooling_face', category: 'smileys', code: 'drooling_face' },
  { emoji: '😴', name: 'sleeping', category: 'smileys', code: 'sleeping' },
  { emoji: '😷', name: 'mask', category: 'smileys', code: 'mask' },
  { emoji: '🤒', name: 'face_with_thermometer', category: 'smileys', code: 'face_with_thermometer' },
  { emoji: '🤕', name: 'face_with_head_bandage', category: 'smileys', code: 'face_with_head_bandage' },
  { emoji: '🤢', name: 'nauseated_face', category: 'smileys', code: 'nauseated_face' },
  { emoji: '🤮', name: 'face_vomiting', category: 'smileys', code: 'face_vomiting' },
  { emoji: '🤧', name: 'sneezing_face', category: 'smileys', code: 'sneezing_face' },
  { emoji: '🤨', name: 'face_with_raised_eyebrow', category: 'smileys', code: 'face_with_raised_eyebrow' },
  { emoji: '🥵', name: 'hot_face', category: 'smileys', code: 'hot_face' },
  { emoji: '🥶', name: 'cold_face', category: 'smileys', code: 'cold_face' },
  { emoji: '🥰', name: 'smiling_face_with_hearts', category: 'smileys', code: 'smiling_face_with_hearts' },
  { emoji: '😒', name: 'unamused', category: 'smileys', code: 'unamused' },
  { emoji: '😭', name: 'sob', category: 'smileys', code: 'sob' },
  { emoji: '😱', name: 'scream', category: 'smileys', code: 'scream' },
  { emoji: '😖', name: 'confounded', category: 'smileys', code: 'confounded' },
  { emoji: '😣', name: 'persevere', category: 'smileys', code: 'persevere' },
  { emoji: '😞', name: 'disappointed', category: 'smileys', code: 'disappointed' },
  { emoji: '😓', name: 'sweat', category: 'smileys', code: 'sweat' },
  { emoji: '😩', name: 'weary', category: 'smileys', code: 'weary' },
  { emoji: '😫', name: 'tired_face', category: 'smileys', code: 'tired_face' },
  { emoji: '🥺', name: 'pleading_face', category: 'smileys', code: 'pleading_face' },
  { emoji: '😤', name: 'triumph', category: 'smileys', code: 'triumph' },
  { emoji: '😡', name: 'pouting_face', category: 'smileys', code: 'pouting_face' },
  { emoji: '😠', name: 'angry', category: 'smileys', code: 'angry' },
  { emoji: '🤬', name: 'face_with_symbols_on_mouth', category: 'smileys', code: 'face_with_symbols_on_mouth' },
  { emoji: '😈', name: 'smiling_imp', category: 'smileys', code: 'smiling_imp' },
  { emoji: '👍', name: '+1', category: 'hand', code: 'thumbsup' },
  { emoji: '👎', name: '-1', category: 'hand', code: 'thumbsdown' },
  { emoji: '👏', name: 'clap', category: 'hand', code: 'clap' },
  { emoji: '🙌', name: 'raised_hands', category: 'hand', code: 'raised_hands' },
  { emoji: '👐', name: 'open_hands', category: 'hand', code: 'open_hands' },
  { emoji: '🤝', name: 'handshake', category: 'hand', code: 'handshake' },
  { emoji: '❤️', name: 'heart', category: 'heart', code: 'heart' },
  { emoji: '🧡', name: 'orange_heart', category: 'heart', code: 'orange_heart' },
  { emoji: '💛', name: 'yellow_heart', category: 'heart', code: 'yellow_heart' },
  { emoji: '💚', name: 'green_heart', category: 'heart', code: 'green_heart' },
  { emoji: '💙', name: 'blue_heart', category: 'heart', code: 'blue_heart' },
  { emoji: '💜', name: 'purple_heart', category: 'heart', code: 'purple_heart' },
  { emoji: '🖤', name: 'black_heart', category: 'heart', code: 'black_heart' },
  { emoji: '🤍', name: 'white_heart', category: 'heart', code: 'white_heart' },
  { emoji: '🤎', name: 'brown_heart', category: 'heart', code: 'brown_heart' },
  { emoji: '💔', name: 'broken_heart', category: 'heart', code: 'broken_heart' },
  { emoji: '💕', name: 'two_hearts', category: 'heart', code: 'two_hearts' },
  { emoji: '💞', name: 'revolving_hearts', category: 'heart', code: 'revolving_hearts' },
  { emoji: '💓', name: 'heartbeat', category: 'heart', code: 'heartbeat' },
  { emoji: '💗', name: 'heartpulse', category: 'heart', code: 'heartpulse' },
  { emoji: '💖', name: 'sparkling_heart', category: 'heart', code: 'sparkling_heart' },
  { emoji: '✨', name: 'sparkles', category: 'object', code: 'sparkles' },
  { emoji: '⭐', name: 'star', category: 'object', code: 'star' },
  { emoji: '🌟', name: 'glowing_star', category: 'object', code: 'glowing_star' },
  { emoji: '🎉', name: 'party_popper', category: 'object', code: 'party_popper' },
  { emoji: '🎊', name: 'confetti_ball', category: 'object', code: 'confetti_ball' },
  { emoji: '🎈', name: 'balloon', category: 'object', code: 'balloon' },
  { emoji: '🎁', name: 'gift', category: 'object', code: 'gift' },
  { emoji: '🔥', name: 'fire', category: 'object', code: 'fire' },
  { emoji: '💯', name: 'hundred_points', category: 'object', code: 'hundred_points' },
  { emoji: '💪', name: 'flexed_biceps', category: 'hand', code: 'flexed_biceps' },
  { emoji: '🚀', name: 'rocket', category: 'object', code: 'rocket' },
  { emoji: '👀', name: 'eyes', category: 'body', code: 'eyes' },
  { emoji: '🎯', name: 'direct_hit', category: 'object', code: 'direct_hit' },
  { emoji: '✅', name: 'check_mark_button', category: 'object', code: 'check_mark_button' },
  { emoji: '❌', name: 'cross_mark', category: 'object', code: 'cross_mark' },
  { emoji: '⚠️', name: 'warning', category: 'object', code: 'warning' },
]

const emit = defineEmits(['select', 'close'])

const searchText = ref('')
const activeCategory = ref('smileys')
const categories = ['smileys', 'hand', 'heart', 'object', 'body']

const filteredEmojis = computed(() => {
  let result = EMOJI_DATA

  // 按分类过滤
  if (activeCategory.value !== 'all') {
    result = result.filter(e => e.category === activeCategory.value)
  }

  // 按搜索文本过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(
      e => e.name.includes(search) || e.emoji.includes(search)
    )
  }

  return result
})

function getCategoryIcon(category) {
  const icons = {
    'smileys': '😀',
    'hand': '👋',
    'heart': '❤️',
    'object': '⭐',
    'body': '👀'
  }
  return icons[category] || '😀'
}

function filterEmojis() {
  // 搜索时显示所有分类
  if (searchText.value) {
    activeCategory.value = 'smileys'
  }
}

function selectEmoji(emoji) {
  emit('select', emoji.emoji)
}
</script>

<style scoped>
.reaction-picker {
  display: flex;
  flex-direction: column;
  width: 280px;
  max-height: 420px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
}

.title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.picker-search {
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
}

.picker-tabs {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 6px 4px;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.category-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.category-tab:hover {
  background: #f0f0f0;
}

.category-tab.active {
  background: #e0e7ff;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 0;
}

.emoji-item:hover {
  background: #f0f0f0;
  transform: scale(1.2);
}

.emoji-item:active {
  transform: scale(0.95);
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #999;
  font-size: 12px;
}

.emoji-grid::-webkit-scrollbar {
  width: 4px;
}

.emoji-grid::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 2px;
}

.emoji-grid::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
