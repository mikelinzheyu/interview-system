<template>
  <!-- LIST VIEW -->
  <div
    v-if="viewMode === 'list'"
    class="mistake-card-list group"
    :class="{
      'selected': isSelected,
      'ignored': item.isIgnored
    }"
    @click="handleCardClick"
  >
    <!-- Selection Checkbox -->
    <div
      class="selection-area"
      :class="{ 'visible': selectionMode || isSelected }"
      @click.stop="!isEditing && onToggleSelection(item.id)"
      :title="isSelected ? '取消选中' : '选中'"
    >
      <div class="checkbox-box" :class="{ 'checked': isSelected }">
        <el-icon v-if="isSelected" class="check-icon"><Check /></el-icon>
      </div>
    </div>

    <!-- Question & Type -->
    <div class="content-area">
      <div class="type-badge" :class="[typeClass, { 'ignored': item.isIgnored }]">
        <span class="dot" :class="[typeDotClass, { 'ignored': item.isIgnored }]"></span>
        {{ item.type }}
      </div>

      <div class="question-wrapper" v-if="isEditing" @click.stop>
        <input
          type="text"
          v-model="editForm.question"
          class="edit-input"
        />
      </div>
      <h3 v-else class="question-text" :class="{ 'ignored': item.isIgnored }">
        {{ item.question }}
      </h3>
    </div>

    <!-- Tags -->
    <div class="tags-area">
      <div v-if="isEditing" @click.stop class="w-full">
        <input
          type="text"
          v-model="editForm.tags"
          class="edit-input small"
          placeholder="标签 (逗号分隔)"
        />
      </div>
      <template v-else>
        <span v-for="(tag, idx) in item.tags.slice(0, 2)" :key="idx" class="tag">
          #{{ tag }}
        </span>
        <span v-if="item.tags.length > 2" class="tag-more">+{{ item.tags.length - 2 }}</span>
      </template>
    </div>

    <!-- Stats -->
    <div class="stats-area">
      <div class="stat-item" title="上次复习时间">
        <el-icon><Clock /></el-icon>
        <span>{{ item.lastReviewed }}</span>
      </div>
      <div class="stat-item mastery" title="掌握度">
        <div class="progress-bg">
          <div
            class="progress-bar"
            :class="masteryColorClass"
            :style="{ width: item.mastery + '%' }"
          ></div>
        </div>
        <span class="mastery-val">{{ item.mastery }}%</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions-area">
      <template v-if="isEditing">
        <button class="action-btn success" @click.stop="handleSave" title="保存修改">
          <el-icon><Check /></el-icon>
        </button>
        <button class="action-btn danger" @click.stop="handleCancelEdit" title="取消编辑">
          <el-icon><Close /></el-icon>
        </button>
      </template>
      <template v-else>
        <button
          v-if="!item.isIgnored"
          class="action-btn hover-show"
          @click.stop="handleStartEdit"
          title="编辑内容"
        >
          <el-icon><Edit /></el-icon>
        </button>
        <button
          class="action-btn"
          :class="{ 'active-emerald': item.isIgnored }"
          @click.stop="onIgnore(item.id)"
          :title="item.isIgnored ? '恢复题目' : '忽略此题'"
        >
          <el-icon v-if="item.isIgnored"><View /></el-icon>
          <el-icon v-else><Hide /></el-icon>
        </button>
        <button
          class="action-btn"
          :class="{ 'active-star': item.isFavorite }"
          @click.stop="onToggleFavorite(item.id)"
          :title="item.isFavorite ? '取消收藏' : '加入收藏'"
        >
          <el-icon v-if="item.isFavorite"><StarFilled /></el-icon>
          <el-icon v-else><Star /></el-icon>
        </button>
      </template>
    </div>
  </div>

  <!-- GRID VIEW -->
  <div
    v-else
    class="mistake-card-grid group"
    :class="{
      'selected': isSelected,
      'ignored': item.isIgnored
    }"
    @click="handleCardClick"
  >
    <!-- Top Mastery Indicator -->
    <div class="mastery-indicator-top">
      <div
        class="bar"
        :class="[masteryColorClass, { 'ignored': item.isIgnored }]"
        :style="{ width: item.mastery + '%' }"
      ></div>
    </div>

    <div class="card-inner">
      <!-- Header -->
      <div class="card-header">
        <div class="header-left">
          <!-- Checkbox -->
          <div
            class="selection-wrapper"
            :class="{ 'visible': selectionMode || isSelected }"
            title="选中"
          >
            <div
              class="checkbox-box"
              :class="{ 'checked': isSelected }"
              @click.stop="!isEditing && onToggleSelection(item.id)"
            >
              <el-icon v-if="isSelected" class="check-icon"><Check /></el-icon>
            </div>
          </div>

          <!-- Type Badge -->
          <div class="type-badge" :class="[typeClass, { 'ignored': item.isIgnored }]">
            <span class="dot" :class="[typeDotClass, { 'ignored': item.isIgnored }]"></span>
            {{ item.type }}
          </div>
        </div>

        <!-- Top Actions -->
        <div class="header-actions">
          <template v-if="isEditing">
            <button class="circle-btn success" @click.stop="handleSave" title="保存">
              <el-icon><Check /></el-icon>
            </button>
            <button class="circle-btn danger" @click.stop="handleCancelEdit" title="取消">
              <el-icon><Close /></el-icon>
            </button>
          </template>
          <template v-else>
            <button
              v-if="!item.isIgnored"
              class="circle-btn hover-show"
              @click.stop="handleStartEdit"
              title="编辑"
            >
              <el-icon><Edit /></el-icon>
            </button>
            <button
              class="circle-btn"
              :class="{ 'active-emerald': item.isIgnored }"
              @click.stop="onIgnore(item.id)"
              :title="item.isIgnored ? '恢复' : '忽略'"
            >
              <el-icon v-if="item.isIgnored"><View /></el-icon>
              <el-icon v-else><Hide /></el-icon>
            </button>
            <button
              class="circle-btn"
              :class="{ 'active-star': item.isFavorite }"
              @click.stop="onToggleFavorite(item.id)"
              :title="item.isFavorite ? '取消收藏' : '收藏'"
            >
              <el-icon v-if="item.isFavorite"><StarFilled /></el-icon>
              <el-icon v-else><Star /></el-icon>
            </button>
          </template>
        </div>
      </div>

      <!-- Question -->
      <div class="question-section">
        <input
          v-if="isEditing"
          type="text"
          v-model="editForm.question"
          class="edit-input title"
          @click.stop
        />
        <h3
          v-else
          class="question-title"
          :class="{ 'ignored': item.isIgnored }"
        >
          {{ item.question }}
        </h3>
      </div>

      <!-- Snippet -->
      <div class="snippet-section">
        <textarea
          v-if="isEditing"
          v-model="editForm.snippet"
          class="edit-textarea"
          @click.stop
        ></textarea>
        <template v-else>
          <div
            class="decoration-line"
            :class="{ 'ignored': item.isIgnored }"
          ></div>
          <p class="snippet-text">{{ item.snippet }}</p>
        </template>
      </div>

      <!-- Tags -->
      <div class="tags-section">
        <div v-if="isEditing" class="w-full" @click.stop>
          <input
            type="text"
            v-model="editForm.tags"
            class="edit-input small"
            placeholder="标签 (逗号分隔)"
          />
          <span class="hint">使用逗号分隔标签</span>
        </div>
        <div v-else class="tags-list">
          <span v-for="(tag, idx) in item.tags" :key="idx" class="tag">
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="card-footer">
        <div class="footer-stats">
          <div class="stat">
            <el-icon><Clock /></el-icon>
            <span>{{ item.lastReviewed }}</span>
          </div>
          <div class="stat">
            <el-icon><Aim /></el-icon>
            <span>掌握度 {{ item.mastery }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, Clock, Star, StarFilled, Hide, View, Edit, Close, Aim } from '@element-plus/icons-vue'
import { type MistakeItem, MistakeType } from '../types'

const props = defineProps<{
  item: MistakeItem
  isSelected: boolean
  selectionMode: boolean
  viewMode: 'grid' | 'list'
}>()

const emit = defineEmits<{
  (e: 'toggle-favorite', id: string): void
  (e: 'ignore', id: string): void
  (e: 'update', item: MistakeItem): void
  (e: 'toggle-selection', id: string): void
  (e: 'click'): void
}>()

// --- Logic ---

const isEditing = ref(false)
const editForm = ref({
  question: '',
  snippet: '',
  tags: ''
})

// Sync form when item changes
watch(() => props.item, (newItem) => {
  editForm.value = {
    question: newItem.question,
    snippet: newItem.snippet,
    tags: newItem.tags.join(', ')
  }
}, { immediate: true })

const handleStartEdit = () => {
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  // Reset form
  editForm.value = {
    question: props.item.question,
    snippet: props.item.snippet,
    tags: props.item.tags.join(', ')
  }
}

const handleSave = () => {
  emit('update', {
    ...props.item,
    question: editForm.value.question,
    snippet: editForm.value.snippet,
    tags: editForm.value.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
  })
  isEditing.value = false
}

const handleCardClick = () => {
  if (isEditing.value) return

  if (props.selectionMode) {
    emit('toggle-selection', props.item.id)
  } else {
    emit('click')
  }
}

const onToggleSelection = (id: string) => {
  emit('toggle-selection', id)
}

const onIgnore = (id: string) => {
  emit('ignore', id)
}

const onToggleFavorite = (id: string) => {
  emit('toggle-favorite', id)
}

// --- Styles ---

const typeClass = computed(() => {
  switch (props.item.type) {
    case MistakeType.KNOWLEDGE_GAP: return 'bg-rose'
    case MistakeType.LOGIC_CONFUSION: return 'bg-amber'
    case MistakeType.INCOMPLETE: return 'bg-purple'
    case MistakeType.EXPRESSION: return 'bg-blue'
    default: return 'bg-gray'
  }
})

const typeDotClass = computed(() => {
  switch (props.item.type) {
    case MistakeType.KNOWLEDGE_GAP: return 'dot-rose'
    case MistakeType.LOGIC_CONFUSION: return 'dot-amber'
    case MistakeType.INCOMPLETE: return 'dot-purple'
    case MistakeType.EXPRESSION: return 'dot-blue'
    default: return 'dot-gray'
  }
})

const masteryColorClass = computed(() => {
  if (props.item.mastery < 30) return 'bg-rose-500'
  if (props.item.mastery < 70) return 'bg-amber-400'
  return 'bg-emerald-500'
})

</script>

<style scoped lang="scss">
// Colors
$indigo-500: #6366f1;
$indigo-600: #4f46e5;
$indigo-50: #eef2ff;
$rose-500: #f43f5e;
$amber-400: #fbbf24;
$emerald-500: #10b981;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-900: #111827;

// Common
.w-full { width: 100%; }
.edit-input {
  width: 100%;
  border: 1px solid #a5b4fc; // indigo-300
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  outline: none;
  &:focus { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
  &.title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
  &.small { font-size: 12px; }
}
.edit-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid #a5b4fc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: #4b5563;
  outline: none;
  resize: none;
  &:focus { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
}
.hint { font-size: 10px; color: $gray-400; margin-top: 4px; display: block; }

// Checkbox
.checkbox-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid $gray-300;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: #818cf8; }
  &.checked {
    background: $indigo-600;
    border-color: $indigo-600;
  }
  .check-icon { color: white; font-size: 12px; font-weight: bold; }
}

// Type Badges
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;

  &.bg-rose { background: #fff1f2; color: #be123c; border-color: #ffe4e6; }
  &.bg-amber { background: #fffbeb; color: #b45309; border-color: #fef3c7; }
  &.bg-purple { background: #faf5ff; color: #7e22ce; border-color: #f3e8ff; }
  &.bg-blue { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
  &.bg-gray { background: #f9fafb; color: #374151; border-color: #e5e7eb; }
  &.ignored { background: #f3f4f6; color: #6b7280; border-color: #e5e7eb; }

  .dot { width: 6px; height: 6px; border-radius: 50%; }
  .dot-rose { background: #f43f5e; }
  .dot-amber { background: #f59e0b; }
  .dot-purple { background: #a855f7; }
  .dot-blue { background: #3b82f6; }
  .dot-gray { background: #6b7280; }
  .dot.ignored { background: #9ca3af; }
}

// Progress
.progress-bar {
  height: 100%;
  transition: all 1s;
  &.bg-rose-500 { background: $rose-500; }
  &.bg-amber-400 { background: $amber-400; }
  &.bg-emerald-500 { background: $emerald-500; }
  &.ignored { background: $gray-400; }
}

// --- List View Specifics ---
.mistake-card-list {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: white;
  border: 1px solid $gray-100;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #c7d2fe; // indigo-200
  }

  &.selected {
    border-color: $indigo-500;
    background: rgba(238, 242, 255, 0.1); // indigo-50/10
  }

  &.ignored {
    opacity: 0.75;
    background: #f9fafb;
  }

  .selection-area {
    opacity: 0;
    transition: opacity 0.2s;
    &.visible { opacity: 1; }
  }
  &:hover .selection-area { opacity: 1; }

  .content-area {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;

    .question-text {
      font-size: 14px;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.2s;

      &.ignored { color: $gray-500; }
    }
  }
  &:hover .question-text:not(.ignored) { color: $indigo-600; }

  .tags-area {
    display: none;
    @media (min-width: 1280px) { // xl
      display: flex;
      align-items: center;
      gap: 6px;
      width: 192px;
      overflow: hidden;
    }

    .tag {
      font-size: 10px;
      color: $gray-500;
      background: #f9fafb;
      border: 1px solid $gray-100;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .tag-more { font-size: 10px; color: $gray-400; }
  }

  .stats-area {
    display: flex;
    align-items: center;
    gap: 24px;
    width: 192px;
    justify-content: flex-end;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $gray-500;

      &.mastery { width: 80px; }

      .progress-bg {
        flex: 1;
        height: 6px;
        background: $gray-100;
        border-radius: 9999px;
        overflow: hidden;
      }

      .mastery-val { font-size: 10px; width: 24px; text-align: right; }
    }
  }

  .actions-area {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-left: 12px;
    border-left: 1px solid $gray-100;

    .action-btn {
      padding: 6px;
      border-radius: 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: $gray-300;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover { background: $gray-100; color: $gray-500; }
      &.hover-show { opacity: 0; }
      &.active-star { color: $amber-400; &:hover { color: $amber-400; } }
      &.active-emerald { color: $emerald-500; &:hover { background: #ecfdf5; } }

      &.success { color: $emerald-500; &:hover { background: #ecfdf5; } }
      &.danger { color: $rose-500; &:hover { background: #fff1f2; } }
    }
  }
  &:hover .action-btn.hover-show { opacity: 1; }
}

// --- Grid View Specifics ---
.mistake-card-grid {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border: 1px solid $gray-100;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
    border-color: rgba(99, 102, 241, 0.5); // indigo-100/50 equivalent
  }

  &.selected {
    border-color: $indigo-500;
    box-shadow: 0 0 0 1px $indigo-500;
  }

  &.ignored {
    opacity: 0.75;
    background: #f9fafb;
  }

  .mastery-indicator-top {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: #f9fafb;
    .bar { height: 100%; }
  }

  .card-inner {
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    margin-top: 4px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .selection-wrapper {
      width: 0;
      opacity: 0;
      overflow: hidden;
      transition: all 0.2s;
      &.visible { width: 20px; opacity: 1; }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;

      .circle-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: $gray-300;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;

        &:hover { background: $gray-100; color: $indigo-600; }
        &.hover-show { opacity: 0; }
        &.active-star { color: $amber-400; transform: scale(1.1); &:hover { color: $amber-400; } }
        &.active-emerald { color: $emerald-500; &:hover { background: #ecfdf5; } }

        &.success { background: #ecfdf5; color: $emerald-500; &:hover { background: #d1fae5; } }
        &.danger { background: #fff1f2; color: $rose-500; &:hover { background: #ffe4e6; } }
      }
    }
  }
  &:hover .selection-wrapper { width: 20px; opacity: 1; }
  &:hover .circle-btn.hover-show { opacity: 1; }

  .question-section {
    margin-bottom: 8px;
    .question-title {
      font-size: 16px;
      font-weight: 700;
      line-height: 1.4;
      margin: 0;
      color: $gray-900;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 0.2s;

      &.ignored { color: $gray-500; text-decoration: line-through; text-decoration-color: $gray-300; }
    }
  }
  &:hover .question-title:not(.ignored) { color: $indigo-600; }

  .snippet-section {
    position: relative;
    flex-grow: 1;
    margin-bottom: 16px;

    .decoration-line {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: $gray-100;
      transition: background 0.2s;
      &.ignored { background: $gray-200; }
    }
    
    .snippet-text {
      font-size: 12px;
      color: $gray-500;
      margin: 0;
      padding-left: 12px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  &:hover .decoration-line:not(.ignored) { background: #e0e7ff; } // indigo-100

  .tags-section {
    margin-bottom: 20px;
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      .tag {
        font-size: 10px;
        color: $gray-500;
        background: #f9fafb;
        border: 1px solid $gray-100;
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 500;
        transition: border-color 0.2s;
      }
    }
  }
  &:hover .tags-list .tag { border-color: $gray-200; }

  .card-footer {
    border-top: 1px dashed $gray-100;
    padding-top: 12px;
    margin-top: auto;

    .footer-stats {
      display: flex;
      align-items: center;
      gap: 12px;
      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: $gray-400;
      }
    }
  }
}
</style>
