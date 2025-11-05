<template>
  <div class="major-group-selector">
    <!-- 标题和返回按钮 -->
    <div class="selector-header">
      <div class="title-section">
        <el-button
          type="text"
          @click="$emit('back')"
          class="back-button"
        >
          <i class="el-icon-arrow-left"></i>
          返回
        </el-button>
        <h2 class="title">{{ currentDiscipline?.name || '选择专业类' }}</h2>
      </div>
      <div class="description">
        {{ currentDiscipline?.description || '请选择要了解的专业类别' }}
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton
      v-if="loading"
      :rows="3"
      animated
      class="skeleton-loader"
    />

    <!-- 专业类网格 -->
    <div v-else class="groups-container">
      <transition-group
        name="fade-list"
        tag="div"
        class="groups-grid"
      >
        <div
          v-for="(group, index) in majorGroups"
          :key="group.id"
          class="group-card"
          :style="{ '--delay': `${index * 0.05}s` }"
          @click="selectGroup(group)"
        >
          <!-- 卡片背景 -->
          <div class="card-background"></div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <div class="group-header">
              <span class="group-name">{{ group.name }}</span>
              <span class="major-count">{{ group.majorCount }}个专业</span>
            </div>

            <p class="group-description">
              {{ group.description || `共包含 ${group.majorCount} 个专业` }}
            </p>

            <!-- 问题数 -->
            <div class="group-stats">
              <span class="stat-item">
                <i class="el-icon-document-copy"></i>
                {{ group.questionCount }} 道题
              </span>
            </div>

            <!-- 专业预览 -->
            <div class="majors-preview">
              <span
                v-for="major in group.majors?.slice(0, 3)"
                :key="major.id"
                class="major-tag"
              >
                {{ major.icon }} {{ major.name }}
              </span>
              <span v-if="group.majors?.length > 3" class="more-tag">
                +{{ group.majors.length - 3 }}
              </span>
            </div>

            <!-- 选择箭头 -->
            <div class="select-arrow">
              <i class="el-icon-arrow-right"></i>
            </div>
          </div>
        </div>
      </transition-group>

      <!-- 空状态 -->
      <div v-if="majorGroups.length === 0" class="empty-state">
        <i class="el-icon-info"></i>
        <p>暂无专业类数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDisciplinesStore } from '@/stores/disciplines'

const props = defineProps({
  currentDiscipline: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'select'])

const disciplinesStore = useDisciplinesStore()

const loading = computed(() => {
  if (!props.currentDiscipline) return false
  return disciplinesStore.majorGroupsLoading[props.currentDiscipline.id] || false
})

const majorGroups = computed(() => {
  if (!props.currentDiscipline) return []
  return disciplinesStore.majorGroupsCache[props.currentDiscipline.id] || []
})

const selectGroup = (group) => {
  disciplinesStore.selectMajorGroup(group)
  emit('select', group)
}
</script>

<style scoped lang="scss">
.major-group-selector {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.selector-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);

  .title-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
  }

  .back-button {
    font-size: 16px;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(-4px);
    }
  }

  .title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  .description {
    color: #666;
    font-size: 14px;
    line-height: 1.5;
  }
}

.skeleton-loader {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.groups-container {
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.group-card {
  position: relative;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  animation: slideInUp 0.5s ease-out both;
  animation-delay: var(--delay, 0s);

  &:hover {
    .card-background {
      transform: translateY(-8px);
    }

    .select-arrow {
      opacity: 1;
      transform: translateX(4px);
    }
  }
}

.card-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: transform 0.3s ease;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: white;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  .group-name {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
  }

  .major-count {
    font-size: 12px;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
  }
}

.group-description {
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.9;
  margin: 0 0 12px 0;
  flex: 1;
}

.group-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 12px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0.85;
  }
}

.majors-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;

  .major-tag {
    font-size: 11px;
    background: rgba(255, 255, 255, 0.15);
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90px;
  }

  .more-tag {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    padding: 4px 0;
  }
}

.select-arrow {
  position: absolute;
  bottom: 16px;
  right: 16px;
  font-size: 20px;
  opacity: 0;
  transition: all 0.3s ease;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-list-enter-active,
.fade-list-leave-active {
  transition: all 0.3s ease;
}

.fade-list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
