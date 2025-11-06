<template>
  <div class="learning-path">
    <!-- Header -->
    <div class="path-header">
      <h2 class="path-title">🎓 个性化学习路径</h2>
      <p class="path-desc">根据您的目标和当前技能，规划最优的学习路径</p>
    </div>

    <!-- Target Selection -->
    <div class="target-selector">
      <h3 class="selector-title">选择您的学习目标：</h3>
      <div class="target-buttons">
        <button
          v-for="target in learningTargets"
          :key="target.id"
          class="target-btn"
          :class="{ active: selectedTarget === target.id }"
          @click="selectTarget(target.id)"
        >
          <span class="target-icon">{{ target.icon }}</span>
          <span class="target-name">{{ target.name }}</span>
          <span class="target-duration">{{ target.duration }}</span>
        </button>
      </div>
    </div>

    <!-- Learning Path -->
    <div class="path-content">
      <!-- Path Overview -->
      <div class="path-overview">
        <h3 class="overview-title">{{ activeTarget.name }}</h3>
        <p class="overview-desc">{{ activeTarget.description }}</p>
        <div class="overview-stats">
          <div class="stat-item">
            <span class="stat-label">总学时</span>
            <span class="stat-value">{{ activeTarget.totalHours }}小时</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">周期</span>
            <span class="stat-value">{{ activeTarget.duration }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">难度</span>
            <span class="stat-value">{{ activeTarget.difficulty }}</span>
          </div>
        </div>
      </div>

      <!-- Phase Timeline -->
      <div class="phases-container">
        <h3 class="phases-title">学习阶段</h3>
        <div class="phases-grid">
          <div
            v-for="(phase, index) in activeTarget.phases"
            :key="index"
            class="phase-card"
            :style="{ animationDelay: `${index * 0.15}s` }"
          >
            <!-- Phase Header -->
            <div class="phase-header">
              <span class="phase-badge">{{ phase.phase }}</span>
              <h4 class="phase-name">{{ phase.title }}</h4>
              <span class="phase-duration">⏱️ {{ phase.duration }}</span>
            </div>

            <!-- Phase Details -->
            <div class="phase-details">
              <div class="detail-box">
                <h5 class="detail-title">📚 学习内容</h5>
                <ul class="detail-list">
                  <li v-for="(item, idx) in phase.content" :key="idx">
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="detail-box">
                <h5 class="detail-title">📖 学习资源</h5>
                <div class="resource-badges">
                  <span
                    v-for="(resource, idx) in phase.resources"
                    :key="idx"
                    class="resource-badge"
                  >
                    {{ resource }}
                  </span>
                </div>
              </div>

              <div class="detail-box">
                <h5 class="detail-title">🎯 实践项目</h5>
                <ul class="detail-list">
                  <li v-for="(project, idx) in phase.projects" :key="idx">
                    {{ project }}
                  </li>
                </ul>
              </div>

              <div class="detail-box">
                <h5 class="detail-title">✅ 学习成果</h5>
                <ul class="detail-list">
                  <li v-for="(outcome, idx) in phase.outcomes" :key="idx">
                    {{ outcome }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="phase-progress">
              <span class="progress-label">学习进度</span>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${phase.progress}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ phase.progress }}%</span>
            </div>

            <!-- Action -->
            <div class="phase-action">
              <button class="action-btn" :class="{ completed: phase.progress === 100 }">
                {{ phase.progress === 100 ? '✓ 已完成' : '继续学习' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills Gained -->
      <div class="skills-gained">
        <h3 class="gained-title">完成后获得的技能</h3>
        <div class="skills-cloud">
          <span
            v-for="(skill, index) in activeTarget.skillsGained"
            :key="index"
            class="skill-cloud-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            {{ skill }}
          </span>
        </div>
      </div>

      <!-- Learning Schedule -->
      <div class="learning-schedule">
        <h3 class="schedule-title">📅 建议学习时间表</h3>
        <div class="schedule-grid">
          <div
            v-for="(day, index) in weeklySchedule"
            :key="index"
            class="schedule-card"
          >
            <h4 class="day-name">{{ day.day }}</h4>
            <div class="schedule-items">
              <div v-for="(item, idx) in day.schedule" :key="idx" class="schedule-item">
                <span class="item-time">{{ item.time }}</span>
                <span class="item-task">{{ item.task }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Library -->
      <div class="resource-library">
        <h3 class="library-title">📚 学习资源库</h3>
        <div class="library-tabs">
          <button
            v-for="tab in resourceTabs"
            :key="tab"
            class="library-tab"
            :class="{ active: activeResourceTab === tab }"
            @click="activeResourceTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Courses -->
        <div v-if="activeResourceTab === '在线课程'" class="library-content">
          <div class="resource-grid">
            <div v-for="course in activeTarget.resources.courses" :key="course.id" class="resource-card">
              <div class="resource-header">
                <span class="platform-badge">{{ course.platform }}</span>
                <span class="rating">{{ course.rating }}⭐</span>
              </div>
              <h4 class="resource-name">{{ course.name }}</h4>
              <p class="resource-desc">{{ course.description }}</p>
              <div class="resource-footer">
                <span class="duration">⏱️ {{ course.duration }}</span>
                <button class="view-btn">查看课程</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Books -->
        <div v-if="activeResourceTab === '推荐书籍'" class="library-content">
          <div class="resource-list">
            <div v-for="book in activeTarget.resources.books" :key="book.id" class="book-item">
              <div class="book-icon">📖</div>
              <div class="book-info">
                <h4 class="book-title">{{ book.name }}</h4>
                <p class="book-author">{{ book.author }}</p>
                <p class="book-desc">{{ book.description }}</p>
              </div>
              <div class="book-rating">
                <div class="rating-stars">
                  <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= book.rating }">
                    ★
                  </span>
                </div>
                <span class="rating-text">{{ book.rating }}/5</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tools -->
        <div v-if="activeResourceTab === '学习工具'" class="library-content">
          <div class="tools-grid">
            <div v-for="tool in activeTarget.resources.tools" :key="tool.id" class="tool-card">
              <div class="tool-icon">{{ tool.icon }}</div>
              <h4 class="tool-name">{{ tool.name }}</h4>
              <p class="tool-desc">{{ tool.description }}</p>
              <button class="tool-btn">开始使用</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations">
        <h3 class="rec-title">💡 学习建议</h3>
        <div class="rec-grid">
          <div
            v-for="(rec, index) in activeTarget.recommendations"
            :key="index"
            class="rec-card"
          >
            <div class="rec-icon">{{ rec.icon }}</div>
            <h4 class="rec-title-small">{{ rec.title }}</h4>
            <p class="rec-content">{{ rec.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedTarget = ref('fullstack')
const activeResourceTab = ref('在线课程')

const learningTargets = [
  {
    id: 'fullstack',
    icon: '🌐',
    name: '全栈开发',
    duration: '3-6个月'
  },
  {
    id: 'frontend',
    icon: '🎨',
    name: '前端进阶',
    duration: '2-4个月'
  },
  {
    id: 'backend',
    icon: '⚙️',
    name: '后端开发',
    duration: '3-6个月'
  },
  {
    id: 'devops',
    icon: '🚀',
    name: 'DevOps运维',
    duration: '2-5个月'
  }
]

const resourceTabs = ['在线课程', '推荐书籍', '学习工具']

const targetsData = {
  fullstack: {
    name: '全栈开发工程师',
    icon: '🌐',
    duration: '3-6个月',
    totalHours: 300,
    difficulty: '高级',
    description: '掌握前端、后端、数据库等全面技能，能够独立完成完整的Web应用开发。',
    phases: [
      {
        phase: '第一阶段',
        title: '前端基础巩固',
        duration: '4周',
        progress: 100,
        content: [
          '深入JavaScript高级特性',
          'Vue 3最新特性',
          '组件库开发',
          '性能优化'
        ],
        resources: ['Udemy', 'Vue官方文档', 'YouTube'],
        projects: ['个人组件库', '优化现有项目'],
        outcomes: ['能设计和优化复杂前端系统', '掌握性能优化技巧']
      },
      {
        phase: '第二阶段',
        title: '后端开发入门',
        duration: '4周',
        progress: 60,
        content: [
          'Node.js基础',
          'Express/Koa框架',
          'RESTful API设计',
          '中间件原理'
        ],
        resources: ['Node官方文档', 'Coursera', '技术博客'],
        projects: ['构建API服务器', '实现认证系统'],
        outcomes: ['理解服务器端开发', '能设计API']
      },
      {
        phase: '第三阶段',
        title: '数据库和缓存',
        duration: '3周',
        progress: 30,
        content: [
          'SQL数据库设计',
          'MongoDB NoSQL',
          'Redis缓存',
          '查询优化'
        ],
        resources: ['MySQL文档', 'MongoDB课程', 'Redis官方'],
        projects: ['数据库设计实践', '缓存优化'],
        outcomes: ['能设计高效数据库', '掌握缓存策略']
      },
      {
        phase: '第四阶段',
        title: '系统设计和部署',
        duration: '4周',
        progress: 0,
        content: [
          '微服务架构',
          'Docker容器化',
          'CI/CD流程',
          '监控和日志'
        ],
        resources: ['Docker官方', 'Kubernetes教程', '云平台文档'],
        projects: ['容器化应用', '部署完整项目'],
        outcomes: ['能设计可扩展系统', '掌握部署流程']
      }
    ],
    skillsGained: [
      'Vue.js', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'Redis',
      'Docker', 'API设计', '系统设计', '性能优化', '安全防护'
    ],
    resources: {
      courses: [
        {
          id: 1,
          name: 'The Complete Vue 3 Course',
          platform: 'Udemy',
          rating: 4.8,
          duration: '40小时',
          description: '全面学习Vue 3最新特性和高级用法'
        },
        {
          id: 2,
          name: 'Node.js and Express Course',
          platform: 'Coursera',
          rating: 4.7,
          duration: '45小时',
          description: '系统学习Node.js后端开发'
        }
      ],
      books: [
        {
          id: 1,
          name: 'JavaScript: The Good Parts',
          author: 'Douglas Crockford',
          rating: 5,
          description: '深入理解JavaScript核心概念'
        },
        {
          id: 2,
          name: '深入浅出Node.js',
          author: '朴灵',
          rating: 4,
          description: 'Node.js原理和最佳实践'
        }
      ],
      tools: [
        {
          id: 1,
          icon: '🧪',
          name: 'Jest',
          description: '单元测试框架'
        },
        {
          id: 2,
          icon: '📦',
          name: 'Docker',
          description: '容器化部署工具'
        }
      ]
    },
    recommendations: [
      {
        icon: '⏰',
        title: '制定学习计划',
        content: '每周投入20-25小时学习，分配到理论学习和实战项目'
      },
      {
        icon: '🔄',
        title: '循环学习',
        content: '理论→实践→总结→复习的学习闭环，确保真正掌握'
      },
      {
        icon: '👥',
        title: '参与社区',
        content: '加入技术社区，与他人讨论，分享学习心得'
      },
      {
        icon: '📊',
        title: '定期复习',
        content: '每周回顾学习内容，巩固知识，查漏补缺'
      }
    ]
  },
  frontend: {
    name: '前端进阶工程师',
    icon: '🎨',
    duration: '2-4个月',
    totalHours: 200,
    difficulty: '中级',
    description: '掌握现代前端技术栈，包括框架、工程化、性能优化等高级技能。',
    phases: [
      {
        phase: '第一阶段',
        title: 'Vue 3深度学习',
        duration: '3周',
        progress: 100,
        content: ['组合式API', '响应式系统', '性能优化', '插件开发'],
        resources: ['官方文档', '源码分析'],
        projects: ['自定义Hooks', '插件开发'],
        outcomes: ['深入理解Vue原理', '能开发高级组件']
      },
      {
        phase: '第二阶段',
        title: '工程化和构建',
        duration: '3周',
        progress: 50,
        content: ['Webpack/Vite', '性能优化', 'CI/CD'],
        resources: ['Webpack官方', '工程化最佳实践'],
        projects: ['构建自己的脚手架'],
        outcomes: ['掌握工程化工具']
      }
    ],
    skillsGained: ['Vue 3', 'TypeScript', 'Webpack', 'Vite', '性能优化'],
    resources: {
      courses: [],
      books: [],
      tools: []
    },
    recommendations: []
  },
  backend: {
    name: '后端开发工程师',
    icon: '⚙️',
    duration: '3-6个月',
    totalHours: 300,
    difficulty: '高级',
    description: '掌握服务器端开发、数据库、系统设计等核心能力。',
    phases: [],
    skillsGained: ['Node.js', 'Express', 'MongoDB', 'MySQL'],
    resources: {
      courses: [],
      books: [],
      tools: []
    },
    recommendations: []
  },
  devops: {
    name: 'DevOps运维工程师',
    icon: '🚀',
    duration: '2-5个月',
    totalHours: 250,
    difficulty: '高级',
    description: '掌握容器化、编排、CI/CD、基础设施即代码等DevOps核心技能。',
    phases: [],
    skillsGained: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    resources: {
      courses: [],
      books: [],
      tools: []
    },
    recommendations: []
  }
}

const weeklySchedule = [
  {
    day: '周一',
    schedule: [
      { time: '09:00-11:00', task: '视频课程学习' },
      { time: '14:00-16:00', task: '代码实践' }
    ]
  },
  {
    day: '周二',
    schedule: [
      { time: '09:00-11:00', task: '视频课程学习' },
      { time: '14:00-16:00', task: '项目开发' }
    ]
  },
  {
    day: '周三',
    schedule: [
      { time: '09:00-11:00', task: '阅读文档' },
      { time: '14:00-16:00', task: '代码复习' }
    ]
  },
  {
    day: '周四',
    schedule: [
      { time: '09:00-11:00', task: '视频课程' },
      { time: '14:00-16:00', task: '项目实践' }
    ]
  },
  {
    day: '周五',
    schedule: [
      { time: '09:00-11:00', task: '项目开发' },
      { time: '14:00-16:00', task: '代码优化' }
    ]
  },
  {
    day: '周六',
    schedule: [
      { time: '10:00-12:00', task: '综合项目' },
      { time: '15:00-17:00', task: '知识总结' }
    ]
  },
  {
    day: '周日',
    schedule: [
      { time: '10:00-12:00', task: '复习本周所学' },
      { time: '14:00-16:00', task: '计划下周目标' }
    ]
  }
]

const activeTarget = computed(() => targetsData[selectedTarget.value] || targetsData.fullstack)

function selectTarget(targetId) {
  selectedTarget.value = targetId
}
</script>

<style scoped>
.learning-path {
  padding: 2rem 0;
}

/* Header */
.path-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.path-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.path-desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

/* Target Selector */
.target-selector {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selector-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.target-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.target-btn {
  padding: 1.2rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
}

.target-btn:hover {
  border-color: #3498db;
  background: #f0f7ff;
  transform: translateY(-2px);
}

.target-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.target-icon {
  font-size: 1.8rem;
}

.target-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.target-duration {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Path Content */
.path-content {
  animation: fadeIn 0.5s ease-out;
}

/* Path Overview */
.path-overview {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #3498db;
}

.overview-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.overview-desc {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.overview-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #95a5a6;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 1.3rem;
  color: #3498db;
  font-weight: 700;
}

/* Phases */
.phases-container {
  margin-bottom: 3rem;
}

.phases-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.phases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.phase-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
}

.phase-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* Phase Header */
.phase-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.phase-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.phase-name {
  flex: 1;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 700;
}

.phase-duration {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Phase Details */
.phase-details {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.detail-box {
  padding-bottom: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.detail-box:last-child {
  border-bottom: none;
}

.detail-title {
  font-size: 0.9rem;
  color: #2c3e50;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.detail-list li {
  padding: 0.4rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
  position: relative;
  padding-left: 1.3rem;
}

.detail-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #27ae60;
  font-weight: 700;
}

.resource-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resource-badge {
  padding: 0.4rem 0.8rem;
  background: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #2c3e50;
}

/* Phase Progress */
.phase-progress {
  padding: 0 1.5rem 1rem 1.5rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 700;
  float: right;
}

/* Phase Action */
.phase-action {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.action-btn {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover:not(.completed) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.action-btn.completed {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
}

/* Skills Gained */
.skills-gained {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.gained-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.skills-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.skill-cloud-item {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  animation: slideUp 0.5s ease-out;
}

/* Schedule */
.learning-schedule {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.schedule-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.schedule-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.day-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.schedule-items {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.schedule-item {
  display: flex;
  gap: 0.8rem;
  font-size: 0.9rem;
}

.item-time {
  min-width: 70px;
  color: #3498db;
  font-weight: 600;
}

.item-task {
  color: #2c3e50;
}

/* Resource Library */
.resource-library {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.library-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.library-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #ecf0f1;
}

.library-tab {
  padding: 0.8rem 1.5rem;
  border: none;
  background: transparent;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.library-tab:hover {
  color: #3498db;
}

.library-tab.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.library-content {
  animation: fadeIn 0.3s ease-out;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.resource-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
  transition: all 0.3s ease;
}

.resource-card:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.platform-badge {
  padding: 0.3rem 0.6rem;
  background: #3498db;
  color: white;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rating {
  color: #f39c12;
  font-weight: 600;
}

.resource-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
}

.resource-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.duration {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.view-btn:hover {
  background: #2980b9;
}

/* Books */
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.book-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  align-items: flex-start;
}

.book-icon {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
}

.book-info {
  flex: 1;
}

.book-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.3rem 0;
  font-weight: 700;
}

.book-author {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 0.6rem 0;
}

.book-desc {
  color: #2c3e50;
  font-size: 0.9rem;
  margin: 0;
}

.book-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.rating-stars {
  display: flex;
  gap: 0.2rem;
}

.star {
  color: #ecf0f1;
  font-size: 1.2rem;
}

.star.filled {
  color: #f39c12;
}

.rating-text {
  color: #7f8c8d;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Tools */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
  text-align: center;
  transition: all 0.3s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
  border-color: #3498db;
  background: #f0f7ff;
}

.tool-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.tool-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
}

.tool-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.tool-btn {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* Recommendations */
.recommendations {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.rec-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.rec-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border-top: 3px solid #3498db;
}

.rec-icon {
  font-size: 2rem;
  margin-bottom: 0.8rem;
}

.rec-title-small {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.rec-content {
  color: #7f8c8d;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .target-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .phases-grid {
    grid-template-columns: 1fr;
  }

  .schedule-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .overview-stats {
    flex-direction: column;
  }

  .path-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .target-buttons {
    grid-template-columns: 1fr;
  }

  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .rec-grid {
    grid-template-columns: 1fr;
  }

  .book-item {
    flex-direction: column;
  }
}
</style>
