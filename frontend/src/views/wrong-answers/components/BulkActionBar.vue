<script setup>
import { computed } from 'vue';
import { FolderPlus, CheckCircle2, Trash2, X } from 'lucide-vue-next';

const props = defineProps({
  selectedCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['add-to-batch', 'mark-mastered', 'delete-selected', 'clear-selection']);

const showActionBar = computed(() => props.selectedCount > 0);
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="showActionBar"
      class="bulk-action-bar wa-fixed wa-bottom-6 wa-left-1_2 wa-transform wa--translate-x-1_2 wa-z-50"
    >
      <div class="wa-bg-white wa-border wa-border-gray-200 wa-shadow-xl wa-rounded-2xl wa-px-6 wa-py-3 wa-flex wa-items-center wa-gap-6">
        <!-- Count & Clear -->
        <div class="wa-flex wa-items-center wa-gap-3 wa-border-r wa-border-gray-200 wa-pr-6">
          <div class="wa-bg-indigo-600 wa-text-white wa-text-xs wa-font-bold wa-px-2 wa-py-1 wa-rounded-md wa-min-w-[1.5rem] wa-text-center">
            {{ selectedCount }}
          </div>
          <span class="wa-text-sm wa-font-medium wa-text-gray-700">已选择</span>
          <button @click="emit('clear-selection')" class="wa-text-gray-400 wa-hover-text-gray-600 wa-transition-colors">
            <X :size="16" />
          </button>
        </div>

        <!-- Actions -->
        <div class="wa-flex wa-items-center wa-gap-2">
          <button
            @click="emit('add-to-batch')"
            class="wa-flex wa-items-center wa-gap-2 wa-px-3 wa-py-2 wa-text-sm wa-font-medium wa-text-gray-700 wa-hover-bg-gray-50 wa-rounded-lg wa-transition-colors wa-group"
          >
            <FolderPlus class="wa-text-gray-400 wa-group-hover-text-indigo-600 wa-transition-colors" :size="16" />
            加入复习集
          </button>
          
          <button
            @click="emit('mark-mastered')"
            class="wa-flex wa-items-center wa-gap-2 wa-px-3 wa-py-2 wa-text-sm wa-font-medium wa-text-gray-700 wa-hover-bg-gray-50 wa-rounded-lg wa-transition-colors wa-group"
          >
            <CheckCircle2 class="wa-text-gray-400 wa-group-hover-text-emerald-600 wa-transition-colors" :size="16" />
            标记掌握
          </button>
          
          <div class="wa-w-px wa-h-4 wa-bg-gray-200 wa-mx-1"></div>

          <button
            @click="emit('delete-selected')"
            class="wa-flex wa-items-center wa-gap-2 wa-px-3 wa-py-2 wa-text-sm wa-font-medium wa-text-rose-600 wa-hover-bg-rose-50 wa-rounded-lg wa-transition-colors"
          >
             <Trash2 :size="16" />
             删除
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
@import "@/styles/wrong-answers.scss";

/* Transition styles for slide-up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translate(-50%, 100px); // Slide down and keep centered
  opacity: 0;
}
</style>
