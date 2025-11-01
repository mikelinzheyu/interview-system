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
  grid-template-columns: 280px 1fr 300px;
  gap: 12px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.chat-layout__aside,
.chat-layout__main,
.chat-layout__panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(18px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(60, 90, 180, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-layout__aside {
  min-width: 0;
  /* 左侧会话列表 */
}

.chat-layout__main {
  min-width: 0;
  /* 中间消息区 */
  flex: 1;
}

.chat-layout__panel {
  min-width: 0;
  /* 右侧成员面板 */
}

.chat-layout--hide-panel {
  grid-template-columns: 280px 1fr;
}

/* 平板设备: 隐藏右侧面板 */
@media (max-width: 1400px) {
  .chat-layout {
    grid-template-columns: 260px 1fr;
  }

  .chat-layout__panel {
    display: none;
  }
}

/* 手机设备: 隐藏左侧侧边栏 */
@media (max-width: 768px) {
  .chat-layout {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .chat-layout__aside {
    display: none;
  }

  .chat-layout__main,
  .chat-layout__panel {
    border-radius: 0;
    box-shadow: none;
    border: none;
  }
}
</style>
