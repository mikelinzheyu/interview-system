<template>
  <div class="majors-grid">
    <!-- 标题和返回按钮 -->
    <div class="grid-header">
      <div class="title-section">
        <el-button
          type="text"
          @click="$emit('back')"
          class="back-button"
        >
          <i class="el-icon-arrow-left"></i>
          返回
        </el-button>
        <h2 class="title">{{ currentMajorGroup?.name || '选择专业' }}</h2>
      </div>
      <div class="breadcrumb">
        <span class="breadcrumb-item">{{ currentDiscipline?.name }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{ currentMajorGroup?.name }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton
      v-if="loading"
      :rows="4"
      animated
      class="skeleton-loader"
    />

    <!-- 专业网格 -->
    <div v-else class="grid-container">
      <transition-group
        name="grid-fade"
        tag="div"
        class="majors-grid-container"
      >
        <div
          v-for="(major, index) in majors"
          :key="major.id"
          class="major-item"
          :style="{ '--delay': `${index * 0.05}s` }"
          @click="selectMajor(major)"
        >
          <!-- 专业卡片 -->
          <div class="major-card">
            <!-- 背景色块 -->
            <div class="card-bg-block" :style="{ backgroundColor: getColorByIndex(index) }"></div>

            <!-- 专业图标和名称 -->
            <div class="major-icon">
              {{ major.icon || '📚' }}
            </div>

            <h3 class="major-name">{{ major.name }}</h3>

            <!-- 难度和热度 -->
            <div class="major-meta">
              <span
                v-if="major.difficulty"
                class="difficulty-badge"
                :class="major.difficulty"
              >
                {{ difficultyLabel(major.difficulty) }}
              </span>
              <span
                v-if="major.popularity"
                class="popularity-badge"
              >
                热度 {{ major.popularity }}%
              </span>
            </div>

            <!-- 问题数 -->
            <div class="question-count">
              <i class="el-icon-document-copy"></i>
              {{ major.questionCount || 0 }} 道题
            </div>

            <!-- 描述 -->
            <p class="major-description">
              {{ major.description || '点击查看专业详情' }}
            </p>

            <!-- 选择按钮 -->
            <div class="select-btn-wrapper">
              <el-button
                type="primary"
                size="small"
                @click.stop="selectMajor(major)"
                class="select-btn"
              >
                查看详情
                <i class="el-icon-arrow-right"></i>
              </el-button>
            </div>
          </div>
        </div>
      </transition-group>

      <!-- 空状态 -->
      <div v-if="majors.length === 0" class="empty-state">
        <i class="el-icon-info"></i>
        <p>暂无专业数据</p>
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
  },
  currentMajorGroup: {
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

const majors = computed(() => {
  if (!props.currentMajorGroup) return []
  return props.currentMajorGroup.majors || []
})

const selectMajor = async (major) => {
  await disciplinesStore.selectMajor(major)
  emit('select', major)
}

const difficultyLabel = (difficulty) => {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

const getColorByIndex = (index) => {
  const colors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#00f2fe',
    '#43e97b',
    '#fa709a',
    '#fee140'
  ]
  return colors[index % colors.length]
}
</script>

<style scoped lang="scss">
.majors-grid {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.grid-header {
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

  .breadcrumb {
    font-size: 13px;
    color: #666;

    .breadcrumb-item {
      &.active {
        color: #333;
        font-weight: 500;
      }
    }

    .breadcrumb-separator {
      margin: 0 8px;
      color: #ccc;
    }
  }
}

.skeleton-loader {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.grid-container {
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

.majors-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 10px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.major-item {
  animation: slideInUp 0.5s ease-out both;
  animation-delay: var(--delay, 0s);
  cursor: pointer;
}

.major-card {
  position: relative;
  padding: 20px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--color-bg);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
}

.card-bg-block {
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  opacity: 0.1;
  border-radius: 0 12px 0 40px;
}

.major-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.major-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.major-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;

  .difficulty-badge {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    background: #f0f0f0;
    color: #666;

    &.beginner {
      background: #d4edda;
      color: #155724;
    }

    &.intermediate {
      background: #fff3cd;
      color: #856404;
    }

    &.advanced,
    &.hard {
      background: #f8d7da;
      color: #721c24;
    }
  }

  .popularity-badge {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    background: #e3f2fd;
    color: #1976d2;
  }
}

.question-count {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.major-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin: 0 0 12px 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.select-btn-wrapper {
  display: flex;
  justify-content: center;
}

.select-btn {
  width: 100%;
  font-size: 12px;
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

.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: all 0.3s ease;
}

.grid-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.grid-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
