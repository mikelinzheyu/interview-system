<template>
  <div class="breadcrumb-navigation">
    <div class="breadcrumb-container">
      <!-- 面包屑路径 -->
      <nav class="breadcrumb">
        <ol class="breadcrumb-list">
          <!-- 主页链接 -->
          <li class="breadcrumb-item">
            <button
              class="breadcrumb-link home"
              @click="navigateTo('root')"
              :aria-label="'返回首页'"
            >
              <i class="el-icon-home"></i>
              <span>学科探索</span>
            </button>
          </li>

          <!-- 动态生成的面包屑项 -->
          <template v-for="(item, index) in breadcrumbItems" :key="index">
            <li class="breadcrumb-separator" aria-hidden="true">/</li>
            <li class="breadcrumb-item">
              <button
                v-if="index < breadcrumbItems.length - 1"
                class="breadcrumb-link clickable"
                @click="navigateTo(item.level, item.id)"
                :aria-label="`返回到${item.label}`"
              >
                {{ item.label }}
              </button>
              <span v-else class="breadcrumb-current">
                {{ item.label }}
              </span>
            </li>
          </template>
        </ol>
      </nav>

      <!-- 步骤指示器 -->
      <div class="step-indicator">
        <span class="step-text" v-if="showSteps">
          第 <strong>{{ currentStep }}/{{ totalSteps }}</strong> 步
        </span>
      </div>
    </div>

    <!-- 快速导航面板（可选） -->
    <transition name="fade-quick">
      <div v-if="showQuickNav" class="quick-nav-panel">
        <button
          v-for="item in quickNavItems"
          :key="item.id"
          class="quick-nav-item"
          @click="navigateTo(item.level, item.id)"
          :title="item.label"
        >
          {{ item.icon }} {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDisciplinesStore } from '@/stores/disciplines'

const props = defineProps({
  showSteps: {
    type: Boolean,
    default: true
  },
  showQuickNav: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['navigate', 'navigate-to-level'])

const disciplinesStore = useDisciplinesStore()

// 快速导航项
const quickNavItems = computed(() => {
  const items = []

  if (disciplinesStore.currentDiscipline) {
    items.push({
      id: disciplinesStore.currentDiscipline.id,
      label: disciplinesStore.currentDiscipline.name,
      level: 'discipline',
      icon: '📚'
    })
  }

  if (disciplinesStore.currentMajorGroup) {
    items.push({
      id: disciplinesStore.currentMajorGroup.id,
      label: disciplinesStore.currentMajorGroup.name,
      level: 'majorGroup',
      icon: '📖'
    })
  }

  if (disciplinesStore.currentMajor) {
    items.push({
      id: disciplinesStore.currentMajor.id,
      label: disciplinesStore.currentMajor.name,
      level: 'major',
      icon: '📊'
    })
  }

  return items.slice(-2) // 仅显示最后两项
})

// 面包屑项
const breadcrumbItems = computed(() => {
  const items = []

  if (disciplinesStore.currentDiscipline) {
    items.push({
      id: disciplinesStore.currentDiscipline.id,
      label: disciplinesStore.currentDiscipline.name,
      level: 'discipline'
    })
  }

  if (disciplinesStore.currentMajorGroup) {
    items.push({
      id: disciplinesStore.currentMajorGroup.id,
      label: disciplinesStore.currentMajorGroup.name,
      level: 'majorGroup'
    })
  }

  if (disciplinesStore.currentMajor) {
    items.push({
      id: disciplinesStore.currentMajor.id,
      label: disciplinesStore.currentMajor.name,
      level: 'major'
    })
  }

  if (disciplinesStore.currentSpecialization) {
    items.push({
      id: disciplinesStore.currentSpecialization.id,
      label: disciplinesStore.currentSpecialization.name,
      level: 'specialization'
    })
  }

  return items
})

// 当前步数（1-4）
const currentStep = computed(() => {
  if (disciplinesStore.currentSpecialization) return 4
  if (disciplinesStore.currentMajor) return 3
  if (disciplinesStore.currentMajorGroup) return 2
  if (disciplinesStore.currentDiscipline) return 1
  return 0
})

const totalSteps = 4

// 导航到指定层级
const navigateTo = (level, id) => {
  if (level === 'root') {
    disciplinesStore.goToRoot()
  } else if (level === 'discipline' && id) {
    // 逐级返回直到找到目标学科
    while (
      disciplinesStore.currentDiscipline &&
      disciplinesStore.currentDiscipline.id !== id &&
      (disciplinesStore.currentMajorGroup ||
        disciplinesStore.currentMajor ||
        disciplinesStore.currentSpecialization)
    ) {
      disciplinesStore.goBack()
    }
  } else if (level === 'majorGroup' && id) {
    // 返回到专业类层级
    while (
      disciplinesStore.currentMajorGroup &&
      disciplinesStore.currentMajorGroup.id !== id &&
      (disciplinesStore.currentMajor ||
        disciplinesStore.currentSpecialization)
    ) {
      disciplinesStore.goBack()
    }
  } else if (level === 'major' && id) {
    // 返回到专业层级
    while (
      disciplinesStore.currentMajor &&
      disciplinesStore.currentMajor.id !== id &&
      disciplinesStore.currentSpecialization
    ) {
      disciplinesStore.goBack()
    }
  }

  emit('navigate-to-level', { level, id })
}
</script>

<style scoped lang="scss">
.breadcrumb-navigation {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.breadcrumb-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

.breadcrumb {
  flex: 1;
  min-width: 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;

  &:first-child {
    .breadcrumb-link {
      padding-left: 0;
    }
  }
}

.breadcrumb-separator {
  color: #d9d9d9;
  margin: 0 2px;
  font-size: 12px;
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: none;
  border: none;
  color: #0066cc;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  white-space: nowrap;

  i {
    font-size: 14px;
  }

  &:hover {
    background: rgba(0, 102, 204, 0.1);
    color: #0052a3;
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }

  &.home {
    font-weight: 500;
    color: #667eea;

    &:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #5568d3;
    }
  }

  &.clickable {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 10px;
      right: 10px;
      height: 2px;
      background: #0066cc;
      transform: scaleX(0);
      transform-origin: right;
      transition: transform 0.3s ease;
    }

    &:hover::after {
      transform: scaleX(1);
      transform-origin: left;
    }
  }
}

.breadcrumb-current {
  padding: 6px 10px;
  color: #333;
  font-size: 13px;
  font-weight: 500;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  border-radius: 6px;
  border-left: 3px solid #667eea;
  white-space: nowrap;

  .step-text {
    font-size: 12px;
    color: #666;

    strong {
      color: #667eea;
      font-weight: 600;
    }
  }
}

.quick-nav-panel {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  flex-wrap: wrap;
  animation: slideDown 0.3s ease-out;
}

.quick-nav-item {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &:hover {
    background: #f5f5f5;
    border-color: #667eea;
    color: #667eea;
  }

  &:active {
    transform: scale(0.95);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-quick-enter-active,
.fade-quick-leave-active {
  transition: all 0.3s ease;
}

.fade-quick-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-quick-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .step-indicator {
    width: 100%;
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
