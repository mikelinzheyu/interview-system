<template>
  <div class="theme-switcher">
    <!-- 主题切换按钮 -->
    <el-button
      text
      circle
      :title="`切换到${nextThemeLabel}模式`"
      @click="toggleTheme"
      class="theme-toggle-btn"
    >
      <el-icon>
        <Moon v-if="isDarkMode" />
        <Sunny v-else />
      </el-icon>
    </el-button>

    <!-- 主题菜单 (可选) -->
    <el-popover
      v-if="showMenu"
      placement="bottom"
      :visible="showThemeMenu"
      trigger="click"
      @show="showThemeMenu = true"
      @hide="showThemeMenu = false"
    >
      <template #reference>
        <el-button text circle>
          <el-icon><Setting /></el-icon>
        </el-button>
      </template>

      <div class="theme-menu">
        <div class="menu-title">主题设置</div>

        <!-- 主题选择 -->
        <div class="theme-options">
          <div
            v-for="theme in THEMES"
            :key="theme.value"
            class="theme-option"
            :class="{ active: currentTheme === theme.value }"
            @click="switchTheme(theme.value)"
          >
            <div class="theme-preview">
              <div
                class="preview-bar"
                :style="{ backgroundColor: theme.primaryColor }"
              ></div>
            </div>
            <span class="theme-label">{{ theme.label }}</span>
          </div>
        </div>

        <!-- 自动模式 -->
        <div class="auto-mode">
          <el-switch v-model="autoMode" @change="handleAutoModeChange" />
          <span>自动模式</span>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Moon, Sunny, Setting } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const props = defineProps({
  showMenu: {
    type: Boolean,
    default: true
  }
})

const store = useThemeStore()

const showThemeMenu = ref(false)
const autoMode = ref(false)

const THEMES = [
  {
    value: 'light',
    label: '浅色',
    primaryColor: '#409eff'
  },
  {
    value: 'dark',
    label: '深色',
    primaryColor: '#66b1ff'
  },
  {
    value: 'auto',
    label: '自动',
    primaryColor: '#409eff'
  }
]

const currentTheme = computed(() => store.theme)
const isDarkMode = computed(() => store.isDarkMode)

const nextThemeLabel = computed(() => {
  return isDarkMode.value ? '浅色' : '深色'
})

function toggleTheme() {
  store.toggleTheme()
}

function switchTheme(theme) {
  store.setTheme(theme)
  showThemeMenu.value = false
}

function handleAutoModeChange(value) {
  if (value) {
    store.setAutoMode(true)
  } else {
    store.setAutoMode(false)
  }
}

onMounted(() => {
  autoMode.value = store.autoMode
})
</script>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-toggle-btn {
  font-size: 18px;
  transition: all 0.3s ease;

  &:hover {
    color: #409eff;
    transform: rotate(20deg);
  }
}

.theme-menu {
  width: 200px;
}

.menu-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border: 2px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    background: #f0f9ff;
  }

  &.active {
    border-color: #409eff;
    background: #e0f2fe;
  }
}

.theme-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-bar {
  width: 100%;
  height: 100%;
  transition: background-color 0.3s;
}

.theme-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.auto-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  font-size: 12px;
}

.auto-mode span {
  color: #666;
}
</style>
