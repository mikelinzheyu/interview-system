<template>
  <div class="specialization-detail-panel">
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
        <h2 class="title">{{ specialization?.name || '细分方向详情' }}</h2>
      </div>
      <div class="breadcrumb">
        <span class="breadcrumb-item">{{ currentDiscipline?.name }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item">{{ currentMajor?.name }}</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{ specialization?.name }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <el-skeleton
      v-if="loading"
      :rows="6"
      animated
      class="skeleton-loader"
    />

    <!-- 内容 -->
    <div v-else class="detail-content">
      <!-- 简介卡片 -->
      <div class="intro-card">
        <div class="intro-content">
          <h3 class="spec-name">{{ specialization?.name }}</h3>
          <p class="spec-description">{{ specialization?.description }}</p>

          <div class="intro-stats">
            <div class="stat-badge">
              <i class="el-icon-document-copy"></i>
              <span>{{ specialization?.questionCount || 0 }} 道题</span>
            </div>
            <div class="stat-badge">
              <i class="el-icon-clock"></i>
              <span>约 6 个月学期</span>
            </div>
            <div class="stat-badge">
              <i class="el-icon-star"></i>
              <span>热门方向</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习路径 -->
      <div class="learning-path-section" v-if="detailedSpec?.learningPath">
        <h3 class="section-title">
          <i class="el-icon-receiving"></i>
          学习路径
        </h3>
        <div class="learning-stages">
          <div
            v-for="stage in detailedSpec.learningPath"
            :key="stage.stage"
            class="stage-card"
          >
            <div class="stage-header">
              <div class="stage-number">{{ stage.stage }}</div>
              <div class="stage-info">
                <h4>{{ stage.name }}</h4>
                <p>{{ stage.description }}</p>
              </div>
              <div class="stage-duration">
                {{ stage.estimatedDays }}
                <span>天</span>
              </div>
            </div>
            <div class="stage-content">
              <div class="topics" v-if="stage.topics?.length">
                <h5>学习主题</h5>
                <div class="topic-list">
                  <span
                    v-for="topic in stage.topics"
                    :key="topic"
                    class="topic-tag"
                  >
                    {{ topic }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 总体进度 -->
        <div class="overall-progress">
          <div class="progress-label">
            <span>总体学习进度</span>
            <span class="total-days">
              {{
                detailedSpec.learningPath.reduce((sum, stage) => sum + (stage.estimatedDays || 0), 0)
              }}
              天
            </span>
          </div>
          <el-progress
            :percentage="100"
            :color="getProgressColor()"
            :height="8"
          />
        </div>
      </div>

      <!-- 核心课程 -->
      <div class="courses-section" v-if="detailedSpec?.coreCourses?.length">
        <h3 class="section-title">
          <i class="el-icon-notebook-1"></i>
          核心课程 ({{ detailedSpec.coreCourses.length }})
        </h3>
        <div class="courses-grid">
          <div
            v-for="course in detailedSpec.coreCourses"
            :key="course"
            class="course-card"
          >
            <div class="course-icon">📖</div>
            <div class="course-name">{{ course }}</div>
          </div>
        </div>
      </div>

      <!-- 关键技能 -->
      <div class="skills-section" v-if="detailedSpec?.relatedSkills?.length">
        <h3 class="section-title">
          <i class="el-icon-tools"></i>
          关键技能 ({{ detailedSpec.relatedSkills.length }})
        </h3>
        <div class="skills-container">
          <div
            v-for="(skill, index) in detailedSpec.relatedSkills"
            :key="skill"
            class="skill-item"
            :style="{ '--delay': `${index * 0.05}s` }"
          >
            <div class="skill-level">
              <el-progress
                type="circle"
                :percentage="getSkillProgress(index)"
                :width="60"
              />
            </div>
            <div class="skill-name">{{ skill }}</div>
          </div>
        </div>
      </div>

      <!-- 学习资源 -->
      <div class="resources-section">
        <h3 class="section-title">
          <i class="el-icon-link"></i>
          学习资源
        </h3>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="resource-card">
              <div class="resource-icon">📺</div>
              <h4>视频教程</h4>
              <p>系统学习视频课程和讲座</p>
              <el-button type="primary" size="small" @click="openResource('video')">
                查看资源
              </el-button>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="resource-card">
              <div class="resource-icon">📚</div>
              <h4>参考书籍</h4>
              <p>推荐的教科书和学习资料</p>
              <el-button type="primary" size="small" @click="openResource('books')">
                查看资源
              </el-button>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="resource-card">
              <div class="resource-icon">🛠️</div>
              <h4>实践项目</h4>
              <p>真实项目和实验练习</p>
              <el-button type="primary" size="small" @click="openResource('projects')">
                查看资源
              </el-button>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="resource-card">
              <div class="resource-icon">🏆</div>
              <h4>就业指导</h4>
              <p>职业规划和面试准备</p>
              <el-button type="primary" size="small" @click="openResource('career')">
                查看资源
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 行动按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          @click="$emit('start-learning')"
          class="start-btn"
        >
          <i class="el-icon-video-play"></i>
          开始学习
        </el-button>
        <el-button
          type="default"
          size="large"
          @click="$emit('collect')"
          class="collect-btn"
        >
          <i class="el-icon-star"></i>
          收藏课程
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useDisciplinesStore } from '@/stores/disciplines'

const props = defineProps({
  specialization: {
    type: Object,
    default: null
  },
  currentDiscipline: {
    type: Object,
    default: null
  },
  currentMajor: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'start-learning', 'collect'])

const disciplinesStore = useDisciplinesStore()

const loading = computed(() => {
  if (!props.specialization) return false
  return disciplinesStore.specializationsLoading[props.specialization.id] || false
})

const detailedSpec = computed(() => {
  if (!props.specialization) return null
  return disciplinesStore.specializationsCache[props.specialization.id] || {
    ...props.specialization
  }
})

const getProgressColor = () => {
  return ['#67c23a', '#409eff', '#e6a23c', '#f56c6c']
}

const getSkillProgress = (index) => {
  const baseProgress = 60
  return Math.min(100, baseProgress + (index * 10))
}

const openResource = (type) => {
  ElMessage.info(`即将开启 ${type} 资源 (开发中...)`)
}
</script>

<style scoped lang="scss">
.specialization-detail-panel {
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
  max-height: calc(100vh - 200px);
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

.intro-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .intro-content {
    .spec-name {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
    }

    .spec-description {
      color: #666;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    .intro-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .stat-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: #f0f0f0;
        border-radius: 20px;
        font-size: 13px;
        color: #666;

        i {
          color: #409eff;
        }
      }
    }
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.learning-path-section {
  .learning-stages {
    display: grid;
    gap: 16px;
    margin-bottom: 24px;
  }
}

.stage-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  .stage-number {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .stage-info {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    p {
      font-size: 13px;
      opacity: 0.9;
      margin: 0;
    }
  }

  .stage-duration {
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;

    span {
      font-size: 12px;
      opacity: 0.8;
      margin-left: 4px;
    }
  }
}

.stage-content {
  padding: 16px;

  .topics {
    h5 {
      font-size: 13px;
      color: #999;
      font-weight: 500;
      margin: 0 0 8px 0;
    }

    .topic-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .topic-tag {
        display: inline-block;
        padding: 6px 12px;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 12px;
        color: #666;
        transition: all 0.3s ease;

        &:hover {
          background: #667eea;
          color: white;
        }
      }
    }
  }
}

.overall-progress {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #333;

    .total-days {
      font-weight: 600;
      color: #667eea;
    }
  }
}

.courses-section,
.skills-section {
  .courses-grid,
  .skills-container {
    display: grid;
    gap: 16px;
  }

  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));

    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  }

  .skills-container {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    animation: slideInUp 0.5s ease-out;

    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }
  }
}

.course-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .course-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .course-name {
    font-size: 13px;
    color: #666;
    font-weight: 500;
    line-height: 1.4;
  }
}

.skill-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: slideInUp 0.5s ease-out both;
  animation-delay: var(--delay, 0s);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .skill-level {
    width: 100%;
  }

  .skill-name {
    font-size: 12px;
    color: #666;
    font-weight: 500;
  }
}

.resources-section {
  .resource-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    }

    .resource-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    p {
      font-size: 13px;
      color: #666;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 24px 0;
  position: sticky;
  bottom: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
  }

  .start-btn,
  .collect-btn {
    flex: 1;
    max-width: 200px;

    @media (max-width: 768px) {
      max-width: none;
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
</style>
