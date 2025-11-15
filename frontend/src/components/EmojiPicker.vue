<template>
  <div class="emoji-picker-container">
    <!-- 搜索框 -->
    <div class="emoji-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索表情..."
        size="small"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 表情内容区 -->
    <div class="emoji-content">
      <!-- 分类标签 -->
      <div class="emoji-tabs">
        <div
          v-for="(category, index) in categories"
          :key="index"
          :class="['emoji-tab', { active: activeTab === index }]"
          :title="category.name"
          @click="activeTab = index"
        >
          {{ category.icon }}
        </div>
      </div>

      <!-- 表情列表 -->
      <div class="emoji-list">
        <!-- 搜索结果为空 -->
        <div v-if="filteredEmojis.length === 0" class="emoji-empty">
          <span>未找到匹配的表情</span>
        </div>

        <!-- 搜索中显示扁平列表 -->
        <template v-else-if="isSearching">
          <div
            v-for="emoji in filteredEmojis"
            :key="emoji.char"
            class="emoji-item"
            :title="emoji.name"
            @click="selectEmoji(emoji.char)"
          >
            {{ emoji.char }}
          </div>
        </template>

        <!-- 非搜索状态显示分组 -->
        <template v-else>
          <div v-for="(group, groupIdx) in groupedEmojis" :key="groupIdx" class="emoji-group">
            <!-- 分组标题 -->
            <div v-if="group.title" class="emoji-group-title">{{ group.title }}</div>

            <!-- 表情网格 -->
            <div class="emoji-grid">
              <div
                v-for="emoji in group.emojis"
                :key="emoji.char"
                class="emoji-item"
                :title="emoji.name"
                @click="selectEmoji(emoji.char)"
                @contextmenu.prevent="showSkinTones(emoji, $event)"
              >
                {{ emoji.char }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 皮肤色调菜单 -->
    <div v-if="showingSkinTones" class="skin-tone-menu" :style="skinToneMenuStyle">
      <div v-for="tone in skinTones" :key="tone.name" class="skin-tone-item" @click="selectEmojiWithTone(currentEmojiChar, tone)">
        <span :title="tone.name">{{ tone.emoji }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

// Emojis organized by category
const emojiDatabase = [
  {
    name: '最近使用',
    icon: '🕐',
    emojis: []
  },
  {
    name: '笑脸',
    icon: '😀',
    emojis: [
      { char: '😀', name: '笑脸' },
      { char: '😃', name: '张嘴笑' },
      { char: '😄', name: '张嘴大笑' },
      { char: '😁', name: '咧嘴笑' },
      { char: '😆', name: '紧闭眼睛笑' },
      { char: '😅', name: '冷汗笑' },
      { char: '🤣', name: '打滚大笑' },
      { char: '😂', name: '喜极而泣' },
      { char: '🙂', name: '轻微笑脸' },
      { char: '🙃', name: '颠倒笑脸' },
      { char: '😉', name: '眨眼' },
      { char: '😊', name: '微笑' },
      { char: '😇', name: '光晕' },
      { char: '🥰', name: '心形眼睛' },
      { char: '😍', name: '爱心眼睛' },
      { char: '🤩', name: '星眼脸' }
    ]
  },
  {
    name: '动物',
    icon: '🐶',
    emojis: [
      { char: '🐶', name: '狗脸' },
      { char: '🐱', name: '猫脸' },
      { char: '🐭', name: '鼠脸' },
      { char: '🐹', name: '仓鼠脸' },
      { char: '🐰', name: '兔脸' },
      { char: '🦊', name: '狐狸脸' },
      { char: '🐻', name: '熊脸' },
      { char: '🐼', name: '熊猫脸' },
      { char: '🐨', name: '考拉' },
      { char: '🐯', name: '老虎脸' },
      { char: '🦁', name: '狮子脸' },
      { char: '🐮', name: '牛脸' },
      { char: '🐷', name: '猪脸' },
      { char: '🐸', name: '青蛙脸' },
      { char: '🐵', name: '猴脸' },
      { char: '🐔', name: '鸡脸' }
    ]
  },
  {
    name: '食物',
    icon: '🍕',
    emojis: [
      { char: '🍕', name: '披萨' },
      { char: '🍔', name: '汉堡包' },
      { char: '🍟', name: '薯条' },
      { char: '🌭', name: '热狗' },
      { char: '🍗', name: '鸡腿' },
      { char: '🍖', name: '肉排' },
      { char: '🌮', name: '玉米卷' },
      { char: '🌯', name: '卷饼' },
      { char: '🥪', name: '三明治' },
      { char: '🥘', name: '煲菜' },
      { char: '🍜', name: '面条' },
      { char: '🍝', name: '意大利面' },
      { char: '🍛', name: '咖喱' },
      { char: '🍣', name: '寿司' },
      { char: '🍱', name: '日式便当' },
      { char: '🥟', name: '水饺' }
    ]
  },
  {
    name: '旅行',
    icon: '✈️',
    emojis: [
      { char: '✈️', name: '飞机' },
      { char: '🚀', name: '火箭' },
      { char: '🚁', name: '直升机' },
      { char: '🚂', name: '火车' },
      { char: '🚃', name: '列车' },
      { char: '🚄', name: '高速列车' },
      { char: '🚅', name: '子弹列车' },
      { char: '🚆', name: '列车2' },
      { char: '🚇', name: '地铁' },
      { char: '🚈', name: '轻轨' },
      { char: '🚉', name: '车站' },
      { char: '🚊', name: '电车' },
      { char: '🚝', name: '缆车' },
      { char: '🚞', name: '齿轨列车' },
      { char: '🚋', name: '路面电车' },
      { char: '🚌', name: '公共汽车' }
    ]
  },
  {
    name: '活动',
    icon: '⚽',
    emojis: [
      { char: '⚽', name: '足球' },
      { char: '🏀', name: '篮球' },
      { char: '🏈', name: '美式足球' },
      { char: '⚾', name: '棒球' },
      { char: '🥎', name: '垒球' },
      { char: '🎾', name: '网球' },
      { char: '🏐', name: '排球' },
      { char: '🏉', name: '橄榄球' },
      { char: '🥏', name: '板球' },
      { char: '🎳', name: '保龄球' },
      { char: '🎣', name: '钓鱼' },
      { char: '🎽', name: '跑步背心' },
      { char: '🎿', name: '滑雪' },
      { char: '⛷️', name: '滑雪者' },
      { char: '🏂', name: '滑雪板' },
      { char: '🏄', name: '冲浪' }
    ]
  },
  {
    name: '物品',
    icon: '💻',
    emojis: [
      { char: '💻', name: '笔记本电脑' },
      { char: '⌨️', name: '键盘' },
      { char: '🖥️', name: '台式电脑' },
      { char: '🖨️', name: '打印机' },
      { char: '🖱️', name: '鼠标' },
      { char: '🖲️', name: '轨迹球' },
      { char: '📱', name: '手机' },
      { char: '☎️', name: '电话' },
      { char: '📞', name: '电话接听' },
      { char: '📟', name: '传呼机' },
      { char: '📠', name: '传真机' },
      { char: '📺', name: '电视' },
      { char: '📷', name: '相机' },
      { char: '📸', name: '相机闪光' },
      { char: '📹', name: '摄像机' },
      { char: '🎥', name: '电影摄影机' }
    ]
  },
  {
    name: '符号',
    icon: '❤️',
    emojis: [
      { char: '❤️', name: '红心' },
      { char: '🧡', name: '橙心' },
      { char: '💛', name: '黄心' },
      { char: '💚', name: '绿心' },
      { char: '💙', name: '蓝心' },
      { char: '💜', name: '紫心' },
      { char: '🖤', name: '黑心' },
      { char: '🤍', name: '白心' },
      { char: '🤎', name: '褐心' },
      { char: '✨', name: '闪光' },
      { char: '⭐', name: '星' },
      { char: '🌟', name: '闪闪发光的星' },
      { char: '🔥', name: '火' },
      { char: '💥', name: '爆炸' },
      { char: '👍', name: '赞' },
      { char: '👎', name: '踩' }
    ]
  }
]

// 皮肤色调选项
const skinTones = [
  { emoji: '👍', name: '默认' },
  { emoji: '👍🏻', name: '浅肤色' },
  { emoji: '👍🏼', name: '浅中肤色' },
  { emoji: '👍🏽', name: '中肤色' },
  { emoji: '👍🏾', name: '深中肤色' },
  { emoji: '👍🏿', name: '深肤色' }
]

// 状态
const activeTab = ref(0)
const searchQuery = ref('')
const showingSkinTones = ref(false)
const currentEmojiChar = ref('')
const skinToneMenuPos = ref({ x: 0, y: 0 })

// 从 localStorage 加载最近使用的表情
const loadRecentEmojis = () => {
  try {
    const stored = localStorage.getItem('recent-emojis')
    if (stored) {
      const recent = JSON.parse(stored).slice(0, 12)
      emojiDatabase[0].emojis = recent.map(char => ({
        char,
        name: '最近使用'
      }))
    }
  } catch (err) {
    console.error('Failed to load recent emojis:', err)
  }
}

// 保存最近使用的表情
const saveRecentEmoji = (emoji) => {
  try {
    const stored = localStorage.getItem('recent-emojis')
    let recent = stored ? JSON.parse(stored) : []
    recent = recent.filter(e => e !== emoji)
    recent.unshift(emoji)
    recent = recent.slice(0, 12)
    localStorage.setItem('recent-emojis', JSON.stringify(recent))
    loadRecentEmojis()
  } catch (err) {
    console.error('Failed to save recent emoji:', err)
  }
}

// 分组表情列表
const categories = computed(() => emojiDatabase.map(cat => ({ icon: cat.icon, name: cat.name })))

const groupedEmojis = computed(() => {
  const category = emojiDatabase[activeTab.value]
  if (!category || !category.emojis || category.emojis.length === 0) {
    return []
  }

  const groups = []
  const emojisPerGroup = 8
  for (let i = 0; i < category.emojis.length; i += emojisPerGroup) {
    groups.push({
      title: null,
      emojis: category.emojis.slice(i, i + emojisPerGroup)
    })
  }
  return groups
})

// 过滤搜索结果
const filteredEmojis = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }

  const query = searchQuery.value.toLowerCase()
  const results = []

  for (const category of emojiDatabase) {
    for (const emoji of category.emojis) {
      if (emoji.name.toLowerCase().includes(query)) {
        results.push(emoji)
      }
    }
  }

  return results
})

const isSearching = computed(() => searchQuery.value.trim().length > 0)

// 显示皮肤色调菜单
const showSkinTones = (emoji, event) => {
  // 仅对支持皮肤色调的表情显示
  const supportsSkinTones = ['👍', '👎', '✊', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🙌', '👏', '🙏']

  if (!supportsSkinTones.includes(emoji.char)) {
    return
  }

  currentEmojiChar.value = emoji.char
  showingSkinTones.value = true
  skinToneMenuPos.value = {
    x: event.clientX,
    y: event.clientY
  }
}

// 选择表情（无皮肤色调）
const selectEmoji = (emoji) => {
  emit('select', emoji)
  saveRecentEmoji(emoji)
  showingSkinTones.value = false
}

// 选择带皮肤色调的表情
const selectEmojiWithTone = (baseEmoji, tone) => {
  emit('select', tone.emoji)
  saveRecentEmoji(tone.emoji)
  showingSkinTones.value = false
}

// 监听搜索查询变化
watch(searchQuery, () => {
  if (searchQuery.value.trim()) {
    activeTab.value = -1
  }
})

// 隐藏皮肤色调菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.emoji-item') && !e.target.closest('.skin-tone-menu')) {
    showingSkinTones.value = false
  }
}

document.addEventListener('click', handleClickOutside)

const emit = defineEmits(['select'])

// 初始化
loadRecentEmojis()

// 计算皮肤色调菜单位置
const skinToneMenuStyle = computed(() => ({
  left: `${skinToneMenuPos.value.x}px`,
  top: `${skinToneMenuPos.value.y}px`
}))
</script>

<style scoped lang="scss">
.emoji-picker-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  .emoji-search {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;

    :deep(.el-input) {
      --el-input-height: 32px;

      .el-input__wrapper {
        padding: 4px 8px;
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        border-radius: 4px;

        &.is-focus {
          background: #fff;
          border-color: #409eff;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }

      .el-input__inner {
        font-size: 13px;
      }
    }
  }

  .emoji-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    max-height: 400px;

    .emoji-tabs {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      background: #f9f9f9;
      border-bottom: 1px solid #e0e0e0;
      overflow-x: auto;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #d0d0d0;
        border-radius: 2px;

        &:hover {
          background: #b0b0b0;
        }
      }

      .emoji-tab {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        transition: all 0.2s;
        flex-shrink: 0;

        &:hover {
          background: #f0f0f0;
          transform: scale(1.1);
        }

        &.active {
          background: #409eff;
          color: white;
        }
      }
    }

    .emoji-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: #d0d0d0;
        border-radius: 3px;

        &:hover {
          background: #b0b0b0;
        }
      }

      .emoji-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #999;
        font-size: 14px;
      }

      .emoji-group {
        margin-bottom: 8px;

        .emoji-group-title {
          font-size: 12px;
          color: #999;
          padding: 4px 8px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
        }
      }

      .emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        font-size: 24px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
        user-select: none;

        &:hover {
          background: #f0f0f0;
          transform: scale(1.2);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  .skin-tone-menu {
    position: fixed;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px;
    display: flex;
    gap: 4px;
    z-index: 10000;

    .skin-tone-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 18px;
      transition: all 0.2s;

      &:hover {
        background: #f0f0f0;
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}
</style>
