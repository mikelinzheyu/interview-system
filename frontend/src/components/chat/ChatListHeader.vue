<template>
  <div class="chat-list-page__hero chat-elevated-card">
    <div class="chat-list-page__hero-main">
      <div class="chat-list-page__hero-title">
        <span class="icon">💬</span>
        <div>
          <div>聊天室中心</div>
          <small>实时掌握社区热点，与志同道合的伙伴畅聊成长。</small>
        </div>
      </div>
      <p class="chat-list-page__hero-subtitle">
        精选分类、活跃度和最新话题一目了然，支持搜索、筛选和收藏，让你快速进入最合适的聊天空间。
      </p>
      <div class="chat-list-page__summary">
        <span v-for="item in summaryStats" :key="item.key">
          <strong>{{ item.value }}</strong>{{ item.label }}
        </span>
      </div>
      <div class="chat-list-page__actions">
        <el-input
          v-model="searchModel"
          :prefix-icon="Search"
          class="chat-list-page__search"
          clearable
          maxlength="40"
          placeholder="搜索聊天室、话题或标签"
        />
        <el-button type="primary" size="large" @click="emit('create')">
          <el-icon><Plus /></el-icon>
          创建聊天室
        </el-button>
      </div>
    </div>
    <div class="chat-circle-stat-stack" aria-label="聊天室核心指标">
      <template v-if="loading">
        <el-skeleton :count="4" animated style="width: 116px;" />
      </template>
      <template v-else>
        <div
          v-for="item in highlightStats"
          :key="item.key"
          class="chat-circle-stat"
        >
          <span class="chat-circle-stat__value">{{ item.value }}</span>
          <span class="chat-circle-stat__label">{{ item.label }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({})
  },
  searchValue: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:search', 'create'])

const searchModel = computed({
  get: () => props.searchValue,
  set: (value) => emit('update:search', value)
})

const summaryStats = computed(() => [
  { key: 'onlineUsers', label: ' 在线用户', value: props.stats?.onlineUsers ?? 0 },
  { key: 'totalRooms', label: ' 聊天室总数', value: props.stats?.totalRooms ?? 0 },
  { key: 'joinedRooms', label: ' 我加入的', value: props.stats?.joinedRooms ?? 0 }
])

const highlightStats = computed(() => [
  { key: 'onlineUsers', label: '在线', value: props.stats?.onlineUsers ?? 0 },
  { key: 'trendingRooms', label: '热聊', value: props.stats?.trendingRooms ?? 0 },
  { key: 'newRooms', label: '新群', value: props.stats?.newRooms ?? 0 },
  { key: 'joinedRooms', label: '我加入', value: props.stats?.joinedRooms ?? 0 }
])
</script>
