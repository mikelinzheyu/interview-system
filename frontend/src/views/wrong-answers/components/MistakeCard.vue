<script setup>
import { computed } from 'vue'
import { Pencil, Star, Trash2, Clock, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  selectionMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-select', 'toggle-fav', 'open-detail', 'edit-item', 'delete-item'])

// Helper for type colors (mimicking the React version)
const typeColors = computed(() => {
  switch(props.item.errorType) {
    case 'knowledge': return 'wa-bg-rose-50 wa-text-rose-700 wa-border-rose-200';
    case 'logic': return 'wa-bg-amber-50 wa-text-amber-700 wa-border-amber-200';
    case 'expression': return 'wa-bg-blue-50 wa-text-blue-700 wa-border-indigo-200';
    case 'incomplete': return 'wa-bg-emerald-50 wa-text-emerald-600 wa-border-emerald-200';
    default: return 'wa-bg-gray-50 wa-text-gray-700 wa-border-gray-200';
  }
})

// Helper for Type Label translation
const typeLabel = computed(() => {
    const labels = {
        knowledge: '知识盲区',
        logic: '逻辑错误',
        expression: '表达不清',
        incomplete: '回答不全',
        concept: '概念混淆'
    };
    return labels[props.item.errorType] || props.item.errorType;
})

const handleCardClick = () => {
  if (props.selectionMode) {
    emit('toggle-select', props.item.id);
  } else {
    emit('open-detail', props.item.id);
  }
}

// Format relative time
const timeAgo = computed(() => {
    if (!props.item.updatedAt) return '从未复习';
    const date = new Date(props.item.updatedAt);
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
})
</script>

<template>
  <div 
    class="mistake-card wa-group wa-relative wa-bg-white wa-rounded-xl wa-border wa-border-gray-200 wa-overflow-hidden wa-cursor-pointer wa-transition-all hover:wa-shadow-lg hover:wa--translate-y-1" 
    :class="{ 'is-selected': isSelected }"
    @click="handleCardClick"
  >
    <!-- Top Mastery Bar -->
    <div class="mastery-bar">
      <div class="progress" :style="{ width: (item.mastery || 0) + '%' }"></div>
    </div>
    
    <!-- Content Area -->
    <div class="wa-p-5 wa-flex wa-flex-col wa-h-full">
      
      <!-- Header: Type Badge & Hidden Actions -->
      <div class="wa-flex wa-justify-between wa-items-start wa-mb-3">
         <!-- Tag and Type -->
         <span class="wa-text-xs wa-font-bold wa-px-2 wa-py-1 wa-rounded wa-border" :class="typeColors">
             {{ typeLabel }}
         </span>
         
         <!-- Hover Action Buttons (Opacity 0 -> 100 on Group Hover) -->
         <div class="actions wa-flex wa-gap-1 wa-opacity-0 group-hover:wa-opacity-100 wa-transition-all" @click.stop>
            <button 
                @click="emit('edit-item', item.id)"
                class="wa-p-1.5 wa-rounded-lg wa-hover-bg-gray-100 wa-text-gray-400 wa-hover-text-gray-600 wa-transition-colors"
                title="编辑"
            >
                <Pencil :size="14" />
            </button>
            <button 
                @click="emit('toggle-fav', item.id)"
                class="wa-p-1.5 wa-rounded-lg wa-hover-bg-gray-100 wa-transition-colors"
                :class="item.isFavorited ? 'wa-text-amber-600' : 'wa-text-gray-400 wa-hover-text-amber-600'"
                title="收藏"
            >
                <Star :size="14" :fill="item.isFavorited ? 'currentColor' : 'none'" />
            </button>
            <button 
                @click="emit('delete-item', item.id)"
                class="wa-p-1.5 wa-rounded-lg wa-hover-bg-rose-50 wa-text-gray-400 wa-hover-text-rose-600 wa-transition-colors"
                title="删除"
            >
                <Trash2 :size="14" />
            </button>
         </div>
      </div>

      <!-- Question Title -->
      <h3 class="wa-text-base wa-font-bold wa-text-gray-900 wa-mb-2 wa-leading-snug line-clamp-2" :title="item.questionTitle">
          {{ item.questionTitle }}
      </h3>

      <!-- Preview Text -->
      <p class="wa-text-sm wa-text-gray-500 wa-mb-4 line-clamp-2 wa-flex-1">
          {{ item.questionContent || '暂无题目详情...' }}
      </p>
      
      <!-- Tags -->
      <div v-if="item.knowledgePoints && item.knowledgePoints.length" class="wa-flex wa-flex-wrap wa-gap-2 wa-mb-4">
        <span 
          v-for="tag in item.knowledgePoints.slice(0, 3)" 
          :key="tag" 
          class="wa-text-xs wa-px-2 wa-py-1 wa-rounded-md wa-bg-indigo-50 wa-text-indigo-600 wa-font-medium"
        >
          #{{ tag }}
        </span>
        <span v-if="item.knowledgePoints.length > 3" class="wa-text-xs wa-text-gray-400 self-center">
            +{{ item.knowledgePoints.length - 3 }}
        </span>
      </div>

      <!-- Footer: Stats -->
      <div class="wa-text-xs wa-text-gray-400 wa-mt-auto wa-pt-3 wa-border-t wa-border-gray-100 wa-flex wa-justify-between wa-items-center">
        <span class="wa-flex wa-items-center wa-gap-1">
            <Clock :size="12" />
            <span>{{ timeAgo }}</span>
        </span>
        <span class="wa-flex wa-items-center wa-gap-1">
            <AlertCircle :size="12" />
            <span>错误: {{ item.wrongCount || 0 }}次</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/wrong-answers-refactor.scss";

// Utility for line clamping
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

// Ensure hover actions work with our custom classes
.mistake-card:hover .actions {
    opacity: 1;
}
</style>
