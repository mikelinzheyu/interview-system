<template>
  <main class="main-content">
    <div class="content-wrapper">
      <slot></slot>
    </div>
  </main>
</template>

<script setup lang="ts">
// This is a wrapper component for the main content area
</script>

<style scoped lang="scss">
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f5f7fa;
  margin-left: 240px;
  transition: margin-left 0.3s ease;

  @media (max-width: 1024px) {
    margin-left: 0;
  }
}

.content-wrapper {
  width: 100%;
  max-width: 100%;
  padding: 24px;
  animation: fadeIn 0.3s ease;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 640px) {
    padding: 12px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Scrollbar Styling
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 4px;

  &:hover {
    background: #b0b0b0;
  }
}
</style>
