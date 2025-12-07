<template>
  <button 
    class="action-btn"
    :class="variant"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'outline', // primary, outline, danger
    validator: (value) => ['primary', 'outline', 'danger'].includes(value)
  }
});

defineEmits(['click']);
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.action-btn {
  padding: 0.5rem 1rem; /* px-4 py-2 */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500;
  border-radius: 0.5rem; /* rounded-lg */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  @include transition-all;
  border: 1px solid transparent;

  &:active {
    transform: scale(0.95);
  }

  /* Variants */
  &.primary {
    background-color: var(--color-blue-600);
    color: white;
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
    
    &:hover {
      background-color: var(--color-blue-700);
      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
    }
  }

  &.outline {
    background-color: white;
    border-color: var(--color-slate-200);
    color: var(--color-slate-700);

    &:hover {
      border-color: var(--color-blue-300);
      color: var(--color-blue-600);
      background-color: rgba(239, 246, 255, 0.3);
    }
  }

  &.danger {
    background-color: var(--color-red-50);
    color: var(--color-red-600);

    &:hover {
      background-color: var(--color-red-100);
      border-color: var(--color-red-100);
    }
  }
}
</style>
