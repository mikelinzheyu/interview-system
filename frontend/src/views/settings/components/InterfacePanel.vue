<template>
  <SettingsCard>
    <div class="interface-stack">
      
      <!-- Theme Mode -->
      <div>
        <h4 class="section-header">
          <Monitor :size="18" class="header-icon" />
          主题模式
        </h4>
        <div class="theme-grid">
          <button 
            v-for="t in themes" 
            :key="t.id"
            @click="handleUpdate('theme', t.id)"
            class="theme-card"
            :class="{ active: interfaceSettings?.theme === t.id }"
          >
            <div class="theme-icon-box" :class="{ active: interfaceSettings?.theme === t.id }">
              <component :is="t.icon" :size="24" />
            </div>
            <span class="theme-label">{{ t.label }}</span>
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Theme Color -->
      <div>
        <h4 class="section-header">
          <div class="color-icon-gradient"></div>
          主题色
        </h4>
        <div class="color-grid">
          <button 
            v-for="c in colors" 
            :key="c.id"
            @click="handleUpdate('accentColor', c.id)"
            :title="c.name"
            class="color-btn"
            :class="[c.bgClass, { active: interfaceSettings?.accentColor === c.id }]"
          >
            <Check v-if="interfaceSettings?.accentColor === c.id" :size="18" :stroke-width="3" />
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Font Size -->
      <div>
        <h4 class="section-header">
          <span class="font-icon">Aa</span>
          字体大小
        </h4>
        <div class="font-control-bar">
          <button 
            v-for="f in fontSizes"
            :key="f.id"
            @click="handleUpdate('fontSize', f.id)"
            class="font-btn"
            :class="{ active: interfaceSettings?.fontSize === f.id }"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

    </div>
  </SettingsCard>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import SettingsCard from './SettingsCard.vue';
import { Monitor, Sun, Moon, Check } from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';

const store = useSettingsStore();
const { preferences } = storeToRefs(store);

// Fallback to default if state is not yet loaded
const interfaceSettings = computed(() => preferences.value || {
  theme: 'light',
  accentColor: 'blue',
  fontSize: 'base'
});

onMounted(() => {
  store.loadPreferences();
});

const handleUpdate = (key, value) => {
  store.updatePreferences({ [key]: value });
};

const themes = [
  { id: 'light', label: '浅色模式', icon: Sun },
  { id: 'dark', label: '深色模式', icon: Moon },
  { id: 'auto', label: '跟随系统', icon: Monitor },
];

const colors = [
  { id: 'blue', bgClass: 'bg-blue', name: '经典蓝' },
  { id: 'purple', bgClass: 'bg-purple', name: '幻影紫' },
  { id: 'emerald', bgClass: 'bg-emerald', name: '森林绿' },
  { id: 'rose', bgClass: 'bg-rose', name: '胭脂红' },
  { id: 'amber', bgClass: 'bg-amber', name: '琥珀金' },
  { id: 'cyan', bgClass: 'bg-cyan', name: '青空蓝' },
];

const fontSizes = [
  { id: 'sm', label: '小' },
  { id: 'base', label: '中' },
  { id: 'lg', label: '大' },
  { id: 'xl', label: '特大' },
];
</script>

<style scoped lang="scss">
@import '@/styles/settings-theme.scss';

/* SCSS Maps for colors to simulate dynamic classes */
.bg-blue { background-color: #3b82f6; }
.bg-purple { background-color: #a855f7; }
.bg-emerald { background-color: #10b981; }
.bg-rose { background-color: #f43f5e; }
.bg-amber { background-color: #f59e0b; }
.bg-cyan { background-color: #06b6d4; }

.interface-stack {
  display: flex;
  flex-direction: column;
  gap: 2.5rem; /* space-y-10 */
}

.section-header {
  font-size: 0.875rem; /* text-sm */
  font-weight: 600;
  color: var(--color-slate-800);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  color: var(--color-blue-500);
}

.divider {
  height: 1px;
  background-color: var(--color-slate-100);
}

/* Theme Cards */
.theme-grid {
  display: flex;
  gap: 1rem;
}

.theme-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem; /* rounded-2xl */
  border: 2px solid var(--color-slate-100);
  background-color: white;
  color: var(--color-slate-500);
  cursor: pointer;
  @include transition-all;

  &:hover {
    border-color: var(--color-slate-200);
    background-color: var(--color-slate-50);
  }

  &.active {
    border-color: var(--color-blue-500);
    background-color: rgba(239, 246, 255, 0.5);
    color: var(--color-blue-700);
    box-shadow: var(--shadow-md);
  }
}

.theme-icon-box {
  width: 3rem; /* w-12 */
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-slate-100);
  color: var(--color-slate-400);
  transition: color 0.2s, background-color 0.2s;

  &.active {
    background-color: var(--color-blue-100);
    color: var(--color-blue-600);
  }
}

.theme-label {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Color Grid */
.color-icon-gradient {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: linear-gradient(to top right, var(--color-blue-500), #a855f7);
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.color-btn {
  width: 2.5rem; /* w-10 */
  height: 2.5rem;
  border-radius: 0.75rem; /* rounded-xl */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  border: none;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }

  &.active {
    transform: scale(1.1);
    box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-blue-500);
  }
}

/* Font Control */
.font-icon {
  font-size: 1.125rem;
  font-family: serif;
  font-style: italic;
  color: var(--color-slate-400);
}

.font-control-bar {
  background-color: var(--color-slate-50);
  padding: 0.25rem;
  border-radius: 0.75rem; /* rounded-xl */
  display: flex;
}

.font-btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-500);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--color-slate-700);
  }

  &.active {
    background-color: white;
    color: var(--color-blue-600);
    box-shadow: var(--shadow-sm);
  }
}
</style>