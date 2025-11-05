<template>
  <div class="major-detail-panel">
    <!-- 标题和返回按钮 -->
    <div class="detail-header">
      <div class="title-section">
        <el-button
          type="text"
          @click="$emit('back')"
          class="back-button"
        >
          <i class="el-icon-arrow-left"></i>
          返回
        </el-button>
        <h2 class="title">{{ major?.name || '专业详情' }}</h2>
      </div>
      <div class="breadcrumb">
        <span class="breadcrumb-item">{{ currentDiscipline?.name }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">{{ currentMajorGroup?.name }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{ major?.name }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton
      v-if="loading"
      :rows="5"
      animated
      class="skeleton-loader"
    />

    <!-- 专业详情内容 -->
    <div v-else class="detail-content">
      <!-- 主要信息卡片 -->
      <div class="major-info-card">
        <div class="major-icon">{{ major?.icon || '📚' }}</div>
        <div class="major-basic-info">
          <h3>{{ major?.name }}</h3>
          <p class="major-code">代码: {{ major?.code }}</p>
          <p class="major-description">{{ major?.description }}</p>
          <div class="major-stats">
            <div class="stat-item">
              <span class="stat-label">难度</span>
              <span class="stat-value" :class="major?.difficulty">
                {{ difficultyLabel(major?.difficulty) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">热度</span>
              <el-progress
                :percentage="major?.popularity || 0"
                :width="80"
                :color="getPopularityColor(major?.popularity)"
              />
            </div>
            <div class="stat-item">
              <span class="stat-label">题目数</span>
              <span class="stat-value">{{ major?.questionCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 细分方向列表 -->
      <div class="specializations-section" v-if="specializations.length > 0">
        <h3 class="section-title">
          <i class="el-icon-flag"></i>
          细分方向 ({{ specializations.length }})
        </h3>
        <div class="specializations-list">
          <transition-group
            name="fade-list"
            tag="div"
          >
            <div
              v-for="(spec, index) in specializations"
              :key="spec.id"
              class="specialization-item"
              :style="{ '--delay': `${index * 0.05}s` }"
              @click="selectSpecialization(spec)"
            >
              <div class="spec-card">
                <!-- 卡片背景色 -->
                <div class="spec-bg" :style="{ backgroundColor: getColorByIndex(index) }"></div>

                <div class="spec-content">
                  <!-- 标题 -->
                  <h4 class="spec-name">{{ spec.name }}</h4>

                  <!-- 描述 -->
                  <p class="spec-description">
                    {{ spec.description || '点击查看详情' }}
                  </p>

                  <!-- 核心课程 -->
                  <div class="spec-courses" v-if="spec.coreCourses?.length">
                    <span class="label">核心课程:</span>
                    <div class="courses-list">
                      <span
                        v-for="course in spec.coreCourses.slice(0, 2)"
                        :key="course"
                        class="course-tag"
                      >
                        {{ course }}
                      </span>
                      <span
                        v-if="spec.coreCourses.length > 2"
                        class="more-tag"
                      >
                        +{{ spec.coreCourses.length - 2 }}
                      </span>
                    </div>
                  </div>

                  <!-- 关键技能 -->
                  <div class="spec-skills" v-if="spec.relatedSkills?.length">
                    <span class="label">关键技能:</span>
                    <div class="skills-list">
                      <span
                        v-for="skill in spec.relatedSkills.slice(0, 2)"
                        :key="skill"
                        class="skill-tag"
                      >
                        {{ skill }}
                      </span>
                      <span
                        v-if="spec.relatedSkills.length > 2"
                        class="more-tag"
                      >
                        +{{ spec.relatedSkills.length - 2 }}
                      </span>
                    </div>
                  </div>

                  <!-- 问题数 -->
                  <div class="spec-questions">
                    <i class="el-icon-document-copy"></i>
                    {{ spec.questionCount || 0 }} 道题
                  </div>
                </div>

                <!-- 选择按钮 -->
                <div class="spec-action">
                  <el-button
                    type="primary"
                    size="small"
                    @click.stop="selectSpecialization(spec)"
                    class="detail-btn"
                  >
                    查看学习路径
                    <i class="el-icon-arrow-right"></i>
                  </el-button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- 关键信息部分 -->
      <div class="additional-info" v-if="major">
        <el-row :gutter="20">
          <!-- 相关领域 -->
          <el-col :xs="24" :sm="12" :md="8">
            <div class="info-box">
              <h4 class="box-title">📚 学科分类</h4>
              <p class="box-content">
                {{ currentDiscipline?.name }} → {{ currentMajorGroup?.name }}
              </p>
            </div>
          </el-col>

          <!-- 学习周期 -->
          <el-col :xs="24" :sm="12" :md="8">
            <div class="info-box">
              <h4 class="box-title">⏱️ 学习周期</h4>
              <p class="box-content">通常为 4 年本科或 2-3 年硕士</p>
            </div>
          </el-col>

          <!-- 就业前景 -->
          <el-col :xs="24" :sm="12" :md="8">
            <div class="info-box">
              <h4 class="box-title">💼 就业前景</h4>
              <p class="box-content">根据热度指数: {{ employmentProspect }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDisciplinesStore } from '@/stores/disciplines'

const props = defineProps({
  major: {
    type: Object,
    default: null
  },
  currentDiscipline: {
    type: Object,
    default: null
  },
  currentMajorGroup: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'select-specialization'])

const disciplinesStore = useDisciplinesStore()

const loading = computed(() => {
  if (!props.major) return false
  return disciplinesStore.majorsLoading[props.major.id] || false
})

const specializations = computed(() => {
  if (!props.major || !disciplinesStore.majorsCache[props.major.id]) {
    return []
  }
  return disciplinesStore.majorsCache[props.major.id].specializations || []
})

const employmentProspect = computed(() => {
  const popularity = props.major?.popularity || 0
  if (popularity >= 80) return '前景光明'
  if (popularity >= 60) return '发展稳定'
  if (popularity >= 40) return '需要努力'
  return '待观察'
})

const difficultyLabel = (difficulty) => {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

const getPopularityColor = (popularity) => {
  if (popularity >= 80) return '#67c23a'
  if (popularity >= 60) return '#409eff'
  if (popularity >= 40) return '#e6a23c'
  return '#f56c6c'
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

const selectSpecialization = async (spec) => {
  await disciplinesStore.selectSpecialization(spec)
  emit('select-specialization', spec)
}
</script>

<style scoped lang="scss">
.major-detail-panel {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  min-height: 400px;
}

.detail-header {
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

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.major-info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 16px;
  }

  .major-icon {
    font-size: 64px;
    flex-shrink: 0;
    line-height: 1;
  }

  .major-basic-info {
    flex: 1;

    h3 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #333;
    }

    .major-code {
      color: #999;
      font-size: 12px;
      margin: 0 0 8px 0;
    }

    .major-description {
      color: #666;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    .major-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .stat-label {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;

          &.beginner {
            color: #67c23a;
          }

          &.intermediate {
            color: #409eff;
          }

          &.advanced,
          &.hard {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

.specializations-section {
  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .specializations-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
}

.specialization-item {
  animation: slideInUp 0.5s ease-out both;
  animation-delay: var(--delay, 0s);
}

.spec-card {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 320px;

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

.spec-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  opacity: 0.1;
  border-radius: 0 12px 0 40px;
}

.spec-content {
  position: relative;
  z-index: 1;
  flex: 1;
}

.spec-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.spec-description {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spec-courses,
.spec-skills {
  margin-bottom: 10px;

  .label {
    font-size: 11px;
    color: #999;
    font-weight: 500;
    display: block;
    margin-bottom: 6px;
  }

  .courses-list,
  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .course-tag,
    .skill-tag {
      font-size: 11px;
      background: #f0f0f0;
      color: #666;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .more-tag {
      font-size: 11px;
      color: #999;
    }
  }
}

.spec-questions {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.spec-action {
  position: relative;
  z-index: 2;
  margin-top: 12px;

  .detail-btn {
    width: 100%;
    font-size: 12px;
  }
}

.additional-info {
  .info-box {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .box-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .box-content {
      font-size: 12px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }
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
