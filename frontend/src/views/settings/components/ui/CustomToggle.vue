<template>
  <label class="custom-toggle">
    <div class="toggle-wrapper">
      <input 
        type="checkbox" 
        class="sr-only" 
        :checked="modelValue" 
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <div 
        class="toggle-track"
        :class="{ 'checked': modelValue }"
      ></div>
      <div 
        class="toggle-thumb"
        :class="{ 'checked': modelValue }"
      ></div>
    </div>
    <span v-if="label" class="toggle-label">{{ label }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  label: String
});

defineEmits(['update:modelValue']);
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.custom-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  user-select: none;
  
  &:hover {
    .toggle-label {
      color: var(--color-slate-800);
    }
    
    .toggle-track:not(.checked) {
      background-color: var(--color-slate-300);
    }
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.toggle-wrapper {
  position: relative;
}

.toggle-track {
  width: 3rem; /* w-12 */
  height: 1.75rem; /* h-7 */
  border-radius: 9999px;
  transition: all 0.3s ease-out;
  box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  background-color: var(--color-slate-200);

  &.checked {
    background-color: var(--color-blue-600);
  }
}

.toggle-thumb {
  position: absolute;
  top: 0.25rem; /* top-1 */
  left: 0.25rem; /* left-1 */
  background-color: white;
  width: 1.25rem; /* w-5 */
  height: 1.25rem; /* h-5 */
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform: translateX(0);

  &.checked {
    transform: translateX(1.25rem); /* translate-x-5 */
  }
}

.toggle-label {
  margin-left: 0.75rem; /* ml-3 */
  font-size: 0.875rem; /* text-sm */
  color: var(--color-slate-600);
  transition: color 0.2s;
}
</style>
