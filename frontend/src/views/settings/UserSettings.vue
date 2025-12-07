<template>
  <div class="settings-root">
    <NavBar :activeTab="activeTab" @update:activeTab="activeTab = $event" />
    
    <main class="settings-main">
      <div class="content-wrapper">
        <transition name="fade" mode="out-in">
          <component :is="currentTabComponent" :key="activeTab" />
        </transition>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import NavBar from './components/NavBar.vue';

// Import Panel Components
import ProfilePanel from './components/ProfilePanel.vue';
import SecurityPanel from './components/SecurityPanel.vue';
import PrivacyPanel from './components/PrivacyPanel.vue';
import NotificationPanel from './components/NotificationPanel.vue';
import InterfacePanel from './components/InterfacePanel.vue';
import AccountManagement from './components/AccountManagement.vue';

const activeTab = ref('profile');

const currentTabComponent = computed(() => {
  const map = {
    profile: ProfilePanel,
    security: SecurityPanel,
    privacy: PrivacyPanel,
    notification: NotificationPanel,
    interface: InterfacePanel,
    account: AccountManagement
  };
  return map[activeTab.value];
});
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

.settings-main {
  padding-top: 2rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 5rem;
  max-width: 64rem; /* max-w-5xl */
  margin: 0 auto;
  @include transition-all;
}

.content-wrapper {
  min-height: 600px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>