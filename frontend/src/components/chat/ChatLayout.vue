<template>
  <div class="chat-layout" :class="{ 'chat-layout--hide-panel': !showPanel }">
    <aside class="chat-layout__aside">
      <slot name="aside" />
    </aside>
    <main class="chat-layout__main">
      <slot />
    </main>
    <section v-if="showPanel" class="chat-layout__panel">
      <slot name="panel" />
    </section>
  </div>
</template>

<script setup>
defineProps({
  showPanel: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.chat-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 320px;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.chat-layout__aside,
.chat-layout__main,
.chat-layout__panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 24px 60px rgba(60, 90, 180, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-layout__aside {
  min-width: 0;
}

.chat-layout__main {
  min-width: 0;
}

.chat-layout__panel {
  min-width: 0;
}

.chat-layout--hide-panel {
  grid-template-columns: 320px minmax(0, 1fr);
}

@media (max-width: 1279px) {
  .chat-layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .chat-layout__panel {
    display: none;
  }
}

@media (max-width: 960px) {
  .chat-layout {
    grid-template-columns: minmax(0, 1fr);
    padding: 12px;
  }

  .chat-layout__aside {
    display: none;
  }
}
</style>
