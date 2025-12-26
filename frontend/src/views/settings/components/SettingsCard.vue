<template>
  <div class="panel-container">
    <div class="panel-content">
      <div v-if="title || description" class="panel-header">
        <h2 v-if="title" class="panel-title">{{ title }}</h2>
        <p v-if="description" class="panel-desc">{{ description }}</p>
      </div>
      <div class="panel-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String
})
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.panel-container {
  @extend .settings-card;
  overflow: hidden;
  @include transition-all;
  
  // animate-in fade-in slide-in-from-bottom-4
  animation: slideUpFade 0.5s ease-out forwards;

  &:hover {
    box-shadow: var(--shadow-card-hover);
    border-color: var(--color-border, rgba(239, 246, 255, 0.5));
  }
}

.panel-content {
  padding: 2rem; /* p-8 */
  
  @media (min-width: 768px) {
    padding: 3rem; /* md:p-12 */
  }
}

.panel-header {
  border-bottom: 1px solid var(--color-border, var(--color-slate-100));
  padding-bottom: 1.5rem;
  margin-bottom: 2rem; /* Space after header */
}

.panel-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text, var(--color-slate-800));
  letter-spacing: -0.025em; /* tracking-tight */
  margin: 0;
}

.panel-desc {
  color: var(--color-text-secondary, var(--color-slate-500));
  font-size: var(--font-size-sm);
  margin-top: 0.375rem;
  font-weight: 500;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* space-y-8 */
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
