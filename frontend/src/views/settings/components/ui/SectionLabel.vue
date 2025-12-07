<template>
  <div class="section-label">
    <div class="icon-box">
      <component :is="icon" :size="20" />
    </div>
    <div class="text-box">
      <h4 class="title">{{ title }}</h4>
      <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: [Object, Function], // Component type (supports object & function components)
  title: String,
  subtitle: String
});
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.section-label {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.icon-box {
  width: 2.5rem; /* w-10 */
  height: 2.5rem; /* h-10 */
  border-radius: 0.75rem; /* rounded-xl */
  background-color: rgba(239, 246, 255, 0.5); /* blue-50/50 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-blue-600);
  flex-shrink: 0;
  /* ring-1 ring-blue-100/50 */
  box-shadow: 0 0 0 1px rgba(219, 234, 254, 0.5);
}

.text-box {
  padding-top: 0.125rem;
}

.title {
  font-size: 0.875rem; /* text-sm */
  font-weight: 600;
  color: var(--color-slate-800);
  margin: 0;
}

.subtitle {
  font-size: 0.75rem; /* text-xs */
  color: var(--color-slate-500);
  margin-top: 0.25rem;
  line-height: 1.625;
}
</style>
