<template>
  <div>
    <!-- Sources Nav -->
    <div>
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">题目来源</h3>
      <div class="space-y-1">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="activeTab === tab.key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'"
          @click="$emit('update:activeTab', tab.key)"
        >
          <div class="flex items-center gap-2">
            <component :is="getIcon(tab.icon)" :size="18" />
            <span>{{ tab.label }}</span>
          </div>
          <span v-if="tab.key !== 'batches'" class="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-100" :class="activeTab === tab.key ? 'text-indigo-600 border-indigo-100' : 'text-slate-400'">
            {{ getCount(tab.key) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="activeTab !== 'batches'" class="mt-6">
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex justify-between items-center">
        <span>筛选</span>
        <button 
          v-if="hasFilters"
          class="flex items-center gap-1 text-[10px] text-rose-500 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors" 
          @click="$emit('clearFilters')"
        >
          <FilterX :size="12" /> 清除
        </button>
      </h3>
       
      <div class="space-y-4 px-2">
        <!-- Search -->
        <div class="relative group">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Search :size="14" class="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input 
            :value="filters.keyword"
            type="text"
            placeholder="搜索题目..." 
            class="block w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
            @input="$emit('update:keyword', $event.target.value)"
          />
        </div>

        <!-- Error Types -->
        <div>
          <label class="text-xs font-medium text-slate-700 mb-2 block">错误类型</label>
          <div class="flex flex-col gap-2">
            <label v-for="type in errorTypes" :key="type.value" class="flex items-center gap-2 cursor-pointer group">
              <input v-model="filters.types" type="checkbox" :value="type.value" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4">
              <span class="text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">{{ type.label }}</span>
            </label>
          </div>
        </div>

        <!-- Toggle Filters -->
        <div class="pt-4 border-t border-slate-100 space-y-3">
          <label class="flex items-center justify-between cursor-pointer group">
            <span class="text-sm text-slate-600 group-hover:text-slate-900">只看收藏</span>
            <el-switch v-model="filters.favoritesOnly" size="small" style="--el-switch-on-color: #4f46e5;" />
          </label>
          <label class="flex items-center justify-between cursor-pointer group">
            <span class="text-sm text-slate-600 group-hover:text-slate-900">显示已忽略</span>
            <el-switch v-model="filters.showIgnored" size="small" style="--el-switch-on-color: #4f46e5;" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search, FilterX, LayoutGrid, MessageCircle, Monitor, Folder } from 'lucide-vue-next'

defineProps({
  activeTab: String,
  filters: Object,
  tabs: Array,
  errorTypes: Array,
  hasFilters: Boolean,
  getCount: Function
})

defineEmits(['update:activeTab', 'clearFilters', 'update:keyword'])

const getIcon = (name) => {
  switch(name) {
    case 'Grid': return LayoutGrid
    case 'ChatDotRound': return MessageCircle
    case 'Monitor': return Monitor
    case 'Folder': return Folder
    default: return LayoutGrid
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/modules/wrong-answers-refactor.scss";
</style>
