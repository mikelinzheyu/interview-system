<script setup>
import { LayoutList, Filter, Tag } from 'lucide-vue-next';

const props = defineProps({
  counts: {
    type: Object,
    default: () => ({ sources: {}, types: {}, tags: {} })
  },
  filters: {
    type: Object,
    required: true
  },
  allTags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:filters']);

const toggleSource = (source) => {
  const newSources = [...props.filters.selectedSources];
  const idx = newSources.indexOf(source);
  if (idx > -1) newSources.splice(idx, 1);
  else newSources.push(source);
  emit('update:filters', { ...props.filters, selectedSources: newSources });
};

const toggleType = (type) => {
  const newTypes = [...props.filters.selectedTypes];
  const idx = newTypes.indexOf(type);
  if (idx > -1) newTypes.splice(idx, 1);
  else newTypes.push(type);
  emit('update:filters', { ...props.filters, selectedTypes: newTypes });
};

const toggleTag = (tag) => {
  const newTags = [...props.filters.selectedTags];
  const idx = newTags.indexOf(tag);
  if (idx > -1) newTags.splice(idx, 1);
  else newTags.push(tag);
  emit('update:filters', { ...props.filters, selectedTags: newTags });
};

// Mappings for labels
const sourceLabels = {
  'ai_interview': 'AI 面试',
  'question_bank': '题库练习',
  'mock_exam': '模拟考试'
};

const typeLabels = {
  'knowledge': '知识盲区',
  'logic': '逻辑错误',
  'expression': '表达不清',
  'incomplete': '回答不全'
};

</script>

<template>
  <div class="filter-sidebar wa-w-64 wa-flex-shrink-0 wa-hidden lg:wa-block">
    <div class="wa-sticky wa-top-24 wa-flex wa-flex-col wa-gap-8">
      
      <!-- Source Filter -->
      <section>
        <h3 class="wa-text-xs wa-font-bold wa-text-gray-400 wa-uppercase wa-tracking-wider wa-mb-3 wa-flex wa-items-center wa-gap-2">
           <LayoutList :size="14" /> 来源
        </h3>
        <div class="wa-flex wa-flex-col wa-gap-1">
          <button
            v-for="(label, key) in sourceLabels"
            :key="key"
            @click="toggleSource(key)"
            class="wa-w-full wa-flex wa-items-center wa-justify-between wa-px-3 wa-py-2 wa-rounded-lg wa-text-sm wa-transition-colors group"
            :class="filters.selectedSources.includes(key) ? 'wa-bg-indigo-50 wa-text-indigo-700 wa-font-medium' : 'wa-text-gray-600 hover:wa-bg-gray-50'"
          >
            <span>{{ label }}</span>
            <span 
                class="wa-text-xs wa-px-2 wa-py-0.5 wa-rounded-md wa-transition-colors"
                :class="filters.selectedSources.includes(key) ? 'wa-bg-indigo-100 wa-text-indigo-800' : 'wa-bg-gray-100 wa-text-gray-500 group-hover:wa-bg-gray-200'"
            >
                {{ counts.sources[key] || 0 }}
            </span>
          </button>
        </div>
      </section>

      <!-- Type Filter -->
      <section>
        <h3 class="wa-text-xs wa-font-bold wa-text-gray-400 wa-uppercase wa-tracking-wider wa-mb-3 wa-flex wa-items-center wa-gap-2">
           <Filter :size="14" /> 错误类型
        </h3>
        <div class="wa-flex wa-flex-col wa-gap-1">
           <button
            v-for="(label, key) in typeLabels"
            :key="key"
            @click="toggleType(key)"
            class="wa-w-full wa-flex wa-items-center wa-justify-between wa-px-3 wa-py-2 wa-rounded-lg wa-text-sm wa-transition-colors group"
            :class="filters.selectedTypes.includes(key) ? 'wa-bg-indigo-50 wa-text-indigo-700 wa-font-medium' : 'wa-text-gray-600 hover:wa-bg-gray-50'"
          >
            <span>{{ label }}</span>
            <span 
                class="wa-text-xs wa-px-2 wa-py-0.5 wa-rounded-md wa-transition-colors"
                :class="filters.selectedTypes.includes(key) ? 'wa-bg-indigo-100 wa-text-indigo-800' : 'wa-bg-gray-100 wa-text-gray-500 group-hover:wa-bg-gray-200'"
            >
                {{ counts.types[key] || 0 }}
            </span>
          </button>
        </div>
      </section>

      <!-- Tags Filter -->
      <section v-if="allTags.length > 0">
        <h3 class="wa-text-xs wa-font-bold wa-text-gray-400 wa-uppercase wa-tracking-wider wa-mb-3 wa-flex wa-items-center wa-gap-2">
           <Tag :size="14" /> 热门标签
        </h3>
        <div class="wa-flex wa-flex-wrap wa-gap-2">
           <button
            v-for="tag in allTags.slice(0, 15)" 
            :key="tag"
            @click="toggleTag(tag)"
            class="wa-px-2.5 wa-py-1 wa-rounded-md wa-text-xs wa-font-medium wa-border wa-transition-all"
            :class="filters.selectedTags.includes(tag) 
                ? 'wa-bg-indigo-50 wa-border-indigo-200 wa-text-indigo-700' 
                : 'wa-bg-white wa-border-gray-200 wa-text-gray-600 hover:wa-border-indigo-200 hover:wa-text-indigo-600'"
           >
             #{{ tag }}
           </button>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/wrong-answers-refactor.scss";
</style>