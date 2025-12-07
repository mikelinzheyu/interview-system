<template>
  <div class="wa-sidebar custom-scrollbar hidden-md-and-down">
    <!-- Status Section -->
    <div class="filter-group">
      <div class="group-header">
        <el-icon class="icon-indigo"><CollectionTag /></el-icon>
        <h3>状态</h3>
      </div>
      <div class="group-content">
        <label
          class="filter-item"
          :class="{ 'active-amber': filters.showFavorites }"
        >
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              v-model="localFilters.showFavorites"
              class="sr-only"
              @change="updateFilters"
            />
            <div class="toggle-switch" :class="{ checked: localFilters.showFavorites, 'amber': true }"></div>
          </div>
          <span class="label-text" :class="{ 'text-amber': localFilters.showFavorites }">只看收藏</span>
        </label>

        <label
          class="filter-item"
          :class="{ 'active-gray': filters.showIgnored }"
        >
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              v-model="localFilters.showIgnored"
              class="sr-only"
              @change="updateFilters"
            />
            <div class="toggle-switch" :class="{ checked: localFilters.showIgnored, 'gray': true }"></div>
          </div>
          <span class="label-text" :class="{ 'text-dark': localFilters.showIgnored }">
            <el-icon v-if="localFilters.showIgnored" class="inline-icon"><Hide /></el-icon>
            <el-icon v-else class="inline-icon text-gray"><Hide /></el-icon>
            已忽略
          </span>
        </label>
      </div>
    </div>

    <!-- Source Section -->
    <div class="filter-group" v-if="availableSources.length > 0">
      <div class="group-header">
        <el-icon class="icon-indigo"><Files /></el-icon>
        <h3>题目来源</h3>
      </div>
      <div class="group-content">
        <label
          v-for="source in availableSources"
          :key="source"
          class="filter-item"
          :class="{ 'active-indigo': filters.selectedSources.includes(source) }"
        >
          <div class="checkbox-wrapper-square">
            <input
              type="checkbox"
              :value="source"
              v-model="localFilters.selectedSources"
              class="sr-only"
              @change="updateFilters"
            />
            <div class="custom-checkbox" :class="{ checked: filters.selectedSources.includes(source) }">
              <el-icon v-if="filters.selectedSources.includes(source)"><Check /></el-icon>
            </div>
          </div>
          <div class="item-info">
            <span class="label-text" :class="{ 'text-indigo': filters.selectedSources.includes(source) }">
              {{ source }}
            </span>
            <span class="count-badge">{{ counts.sources[source] || 0 }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Diagnosis Section -->
    <div class="filter-group">
      <div class="group-header">
        <el-icon class="icon-indigo"><Filter /></el-icon>
        <h3>错误类型</h3>
      </div>
      <div class="group-content">
        <label
          v-for="type in Object.values(MistakeType)"
          :key="type"
          class="filter-item"
          :class="{ 'active-indigo': filters.selectedTypes.includes(type) }"
        >
          <div class="checkbox-wrapper-square">
            <input
              type="checkbox"
              :value="type"
              v-model="localFilters.selectedTypes"
              class="sr-only"
              @change="updateFilters"
            />
            <div class="custom-checkbox" :class="{ checked: filters.selectedTypes.includes(type) }">
              <el-icon v-if="filters.selectedTypes.includes(type)"><Check /></el-icon>
            </div>
          </div>
          <div class="item-info">
            <span class="label-text" :class="{ 'text-indigo': filters.selectedTypes.includes(type) }">
              {{ type }}
            </span>
            <span class="count-badge">{{ counts.types[type] || 0 }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Tags Section -->
    <div class="filter-group">
      <div class="group-header">
        <el-icon class="icon-indigo"><PriceTag /></el-icon>
        <h3>知识点</h3>
      </div>
      <div class="tags-content">
        <button
          v-for="tag in allTags"
          :key="tag"
          :disabled="(counts.tags[tag] || 0) === 0 && !filters.selectedTags.includes(tag)"
          class="tag-btn"
          :class="{
            'selected': filters.selectedTags.includes(tag),
            'disabled': (counts.tags[tag] || 0) === 0 && !filters.selectedTags.includes(tag)
          }"
          @click="toggleTag(tag)"
        >
          <span>{{ tag }}</span>
          <span class="tag-count" :class="{ 'selected': filters.selectedTags.includes(tag) }">
            {{ counts.tags[tag] || 0 }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { CollectionTag, Hide, Files, Filter, PriceTag, Check } from '@element-plus/icons-vue'
import { MistakeType, type FilterState, type SourceType } from '../types'

const props = defineProps<{
  filters: FilterState
  allTags: string[]
  counts: {
    sources: Record<string, number>
    types: Record<string, number>
    tags: Record<string, number>
  }
  availableSources: SourceType[]
}>()

const emit = defineEmits<{
  (e: 'update:filters', filters: FilterState): void
}>()

// Local state wrapper to handle v-model binding easily
const localFilters = reactive<FilterState>({
  search: props.filters.search,
  selectedSources: [...props.filters.selectedSources],
  selectedTypes: [...props.filters.selectedTypes],
  selectedTags: [...props.filters.selectedTags],
  showFavorites: props.filters.showFavorites,
  showIgnored: props.filters.showIgnored
})

// Watch for external changes
watch(() => props.filters, (newVal) => {
  localFilters.search = newVal.search
  localFilters.selectedSources = [...newVal.selectedSources]
  localFilters.selectedTypes = [...newVal.selectedTypes]
  localFilters.selectedTags = [...newVal.selectedTags]
  localFilters.showFavorites = newVal.showFavorites
  localFilters.showIgnored = newVal.showIgnored
}, { deep: true })

const updateFilters = () => {
  emit('update:filters', { ...localFilters })
}

const toggleTag = (tag: string) => {
  const index = localFilters.selectedTags.indexOf(tag)
  if (index > -1) {
    localFilters.selectedTags.splice(index, 1)
  } else {
    localFilters.selectedTags.push(tag)
  }
  updateFilters()
}
</script>

<style scoped lang="scss">
.wa-sidebar {
  width: 288px; // 72 * 4 = 288px
  background: white;
  border-right: 1px solid #f3f4f6;
  height: calc(100vh - 64px);
  position: sticky;
  top: 64px;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 4px 0 24px -12px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;

  // Hide scrollbar for Chrome/Safari/Opera
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 20px;
  }
}

.filter-group {
  margin-bottom: 32px;

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .icon-indigo {
      color: #4f46e5;
      font-size: 16px;
    }

    h3 {
      font-size: 12px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
  }

  .group-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    background-color: #f9fafb;
  }

  &.active-indigo {
    background-color: rgba(238, 242, 255, 0.6); // bg-indigo-50/60
  }

  &.active-amber {
    background-color: rgba(255, 251, 235, 0.6); // bg-amber-50/60
  }

  &.active-gray {
    background-color: #f3f4f6;
  }

  .item-info {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .label-text {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.25;

    &.text-indigo { color: #312e81; font-weight: 500; }
    &.text-amber { color: #92400e; font-weight: 500; }
    &.text-dark { color: #111827; font-weight: 500; }

    .inline-icon {
      vertical-align: -2px;
      font-size: 14px;
      margin-right: 4px;
      &.text-gray { color: #9ca3af; }
    }
  }

  .count-badge {
    font-size: 12px;
    color: #9ca3af;
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 9999px;
    min-width: 20px;
    text-align: center;
  }
}

// Toggle Switch Styling
.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .toggle-switch {
    width: 36px;
    height: 20px;
    background-color: #e5e7eb;
    border-radius: 9999px;
    position: relative;
    transition: background-color 0.2s;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background-color: white;
      border: 1px solid #d1d5db;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    &.checked {
      &::after {
        transform: translateX(16px);
        border-color: white;
      }

      &.amber { background-color: #fbbf24; }
      &.gray { background-color: #4b5563; }
    }
  }
}

// Square Checkbox Styling
.checkbox-wrapper-square {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 2px;

  .custom-checkbox {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &.checked {
      background-color: #4f46e5;
      border-color: #4f46e5;

      .el-icon {
        color: white;
        font-size: 10px;
        font-weight: bold;
      }
    }
  }
}

// Tags Styling
.tags-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag-btn {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background-color: white;
    color: #4b5563;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      border-color: #d1d5db;
      background-color: #f9fafb;
    }

    &.selected {
      background-color: #4f46e5;
      border-color: #4f46e5;
      color: white;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    &.disabled {
      background-color: white;
      border-color: #f3f4f6;
      color: #d1d5db;
      cursor: not-allowed;
    }

    .tag-count {
      font-size: 9px;
      padding: 0 4px;
      border-radius: 9999px;
      background-color: #f3f4f6;
      color: #9ca3af;

      &.selected {
        background-color: #6366f1;
        color: white;
      }
    }
  }
}

@media (max-width: 1024px) {
  .hidden-md-and-down {
    display: none;
  }
}
</style>
