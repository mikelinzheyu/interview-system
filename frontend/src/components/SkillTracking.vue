<template>
  <div class="skill-tracking">
    <!-- Header -->
    <div class="tracking-header">
      <h2 class="tracking-title">📊 技能发展追踪</h2>
      <p class="tracking-desc">追踪和管理您的技能发展进度</p>
    </div>

    <!-- Skill Categories -->
    <div class="skill-categories">
      <button
        v-for="category in skillCategories"
        :key="category"
        class="category-btn"
        :class="{ active: selectedCategory === category }"
        @click="selectedCategory = category"
      >
        {{ categoryIcons[category] }} {{ category }}
      </button>
    </div>

    <!-- Skills Grid -->
    <div class="skills-container">
      <div
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="skill-card"
        :style="{ animationDelay: `${filteredSkills.indexOf(skill) * 0.1}s` }"
      >
        <!-- Skill Header -->
        <div class="skill-header">
          <h3 class="skill-name">{{ skill.name }}</h3>
          <span class="skill-level" :class="`level-${skill.level}`">
            {{ skill.level }}
          </span>
        </div>

        <!-- Proficiency Bar -->
        <div class="proficiency-section">
          <div class="label-row">
            <span class="label">专业程度</span>
            <span class="percentage">{{ skill.proficiency }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${skill.proficiency}%` }"
            ></div>
          </div>
        </div>

        <!-- Experience -->
        <div class="experience-section">
          <span class="exp-icon">⏱️</span>
          <span class="exp-text">{{ skill.yearsOfExperience }}年经验</span>
        </div>

        <!-- Endorsements -->
        <div class="endorsement-section">
          <span class="endorse-icon">👍</span>
          <span class="endorse-count">{{ skill.endorsements }}人认可</span>
        </div>

        <!-- Recent Projects -->
        <div class="projects-section">
          <h4 class="section-label">最近项目</h4>
          <div class="project-tags">
            <span
              v-for="(project, idx) in skill.recentProjects.slice(0, 3)"
              :key="idx"
              class="project-tag"
            >
              {{ project }}
            </span>
          </div>
        </div>

        <!-- Development Plan -->
        <div class="development-section">
          <h4 class="section-label">发展计划</h4>
          <ul class="dev-list">
            <li v-for="(plan, idx) in skill.developmentPlan" :key="idx">
              {{ plan }}
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-secondary">更新进度</button>
          <button class="btn-primary">详细规划</button>
        </div>
      </div>
    </div>

    <!-- Overall Skills Summary -->
    <div class="skills-summary">
      <h3 class="summary-title">技能总览</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-number">{{ totalSkills }}</div>
          <div class="summary-label">总技能数</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{{ averageProficiency.toFixed(0) }}%</div>
          <div class="summary-label">平均专业程度</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{{ expertSkills }}</div>
          <div class="summary-label">专家级技能</div>
        </div>
        <div class="summary-card">
          <div class="summary-number">{{ skillsNeedingWork }}</div>
          <div class="summary-label">需要提升</div>
        </div>
      </div>
    </div>

    <!-- Skill Development Timeline -->
    <div class="development-timeline">
      <h3 class="timeline-title">技能发展路线图</h3>
      <div class="timeline">
        <div v-for="(item, index) in developmentTimeline" :key="index" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-period">{{ item.period }}</div>
            <div class="timeline-desc">{{ item.description }}</div>
            <div class="timeline-skills">
              <span v-for="(skill, idx) in item.skills" :key="idx" class="timeline-skill">
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Learning Resources -->
    <div class="learning-resources">
      <h3 class="resources-title">📚 学习资源</h3>
      <div class="resources-grid">
        <div class="resource-type">
          <h4>在线课程</h4>
          <div class="resource-items">
            <div v-for="course in topCourses" :key="course" class="resource-item">
              <span class="resource-icon">🎓</span>
              <span class="resource-text">{{ course }}</span>
            </div>
          </div>
        </div>
        <div class="resource-type">
          <h4>书籍和文章</h4>
          <div class="resource-items">
            <div v-for="book in topBooks" :key="book" class="resource-item">
              <span class="resource-icon">📖</span>
              <span class="resource-text">{{ book }}</span>
            </div>
          </div>
        </div>
        <div class="resource-type">
          <h4>实践项目</h4>
          <div class="resource-items">
            <div v-for="project in practiceProjects" :key="project" class="resource-item">
              <span class="resource-icon">🛠️</span>
              <span class="resource-text">{{ project }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedCategory = ref('技术')

const skillCategories = ['技术', '管理', '通用']

const categoryIcons = {
  技术: '💻',
  管理: '👔',
  通用: '⭐'
}

// Sample skills data
const allSkills = [
  // 技术类
  {
    id: 'programming',
    category: '技术',
    name: 'Vue.js',
    level: '高级',
    proficiency: 85,
    yearsOfExperience: 3,
    endorsements: 24,
    recentProjects: ['职业规划系统', '电商平台', '数据分析工具'],
    developmentPlan: ['学习Vue 3高级特性', '研究性能优化', '贡献开源项目']
  },
  {
    id: 'python',
    category: '技术',
    name: 'Python',
    level: '中级',
    proficiency: 72,
    yearsOfExperience: 2,
    endorsements: 18,
    recentProjects: ['数据分析', '自动化脚本', '机器学习'],
    developmentPlan: ['深入学习机器学习库', '参与数据科学项目', '学习高性能计算']
  },
  {
    id: 'database',
    category: '技术',
    name: '数据库设计',
    level: '高级',
    proficiency: 80,
    yearsOfExperience: 4,
    endorsements: 21,
    recentProjects: ['核心系统', '数据仓库', '性能优化'],
    developmentPlan: ['学习分布式数据库', '研究数据治理', '优化查询性能']
  },
  {
    id: 'architecture',
    category: '技术',
    name: '系统架构',
    level: '中级',
    proficiency: 68,
    yearsOfExperience: 2,
    endorsements: 15,
    recentProjects: ['微服务架构', '云原生设计', '高可用系统'],
    developmentPlan: ['学习分布式系统', '研究微服务模式', '参与架构评审']
  },
  // 管理类
  {
    id: 'team-management',
    category: '管理',
    name: '团队管理',
    level: '中级',
    proficiency: 65,
    yearsOfExperience: 2,
    endorsements: 12,
    recentProjects: ['项目交付', '人才培养', '敏捷实践'],
    developmentPlan: ['学习领导力课程', '参加管理培训', '积累团队建设经验']
  },
  {
    id: 'project-management',
    category: '管理',
    name: '项目管理',
    level: '中级',
    proficiency: 70,
    yearsOfExperience: 3,
    endorsements: 16,
    recentProjects: ['大型项目交付', '跨部门协作', '风险管理'],
    developmentPlan: ['获取PMP证书', '学习敏捷方法论', '积累复杂项目经验']
  },
  // 通用类
  {
    id: 'communication',
    category: '通用',
    name: '沟通表达',
    level: '高级',
    proficiency: 82,
    yearsOfExperience: 5,
    endorsements: 28,
    recentProjects: ['技术演讲', '跨团队协作', '文档编写'],
    developmentPlan: ['参加演讲比赛', '写更多技术文章', '提升国际沟通能力']
  },
  {
    id: 'problem-solving',
    category: '通用',
    name: '问题解决',
    level: '高级',
    proficiency: 80,
    yearsOfExperience: 4,
    endorsements: 25,
    recentProjects: ['技术难题解决', '系统优化', '架构改进'],
    developmentPlan: ['学习系统思维', '研究复杂问题', '分享解决方案']
  }
]

const filteredSkills = computed(() =>
  allSkills.filter(skill => skill.category === selectedCategory.value)
)

const totalSkills = computed(() => allSkills.length)

const averageProficiency = computed(() => {
  const sum = allSkills.reduce((acc, skill) => acc + skill.proficiency, 0)
  return sum / allSkills.length
})

const expertSkills = computed(() =>
  allSkills.filter(skill => skill.proficiency >= 75).length
)

const skillsNeedingWork = computed(() =>
  allSkills.filter(skill => skill.proficiency < 60).length
)

const developmentTimeline = [
  {
    period: '0-1年',
    description: '基础阶段',
    skills: ['Vue基础', '前端开发', '团队协作']
  },
  {
    period: '1-2年',
    description: '进阶阶段',
    skills: ['Vue高级', '项目管理', '技术方案']
  },
  {
    period: '2-3年',
    description: '专家阶段',
    skills: ['系统设计', '架构优化', '团队领导']
  },
  {
    period: '3年+',
    description: '领导阶段',
    skills: ['技术战略', '行业影响', '人才培养']
  }
]

const topCourses = [
  'Vue.js 3 完全指南',
  '微服务架构与实践',
  '系统设计面试准备'
]

const topBooks = [
  '《深入浅出设计模式》',
  '《高性能MySQL》',
  '《The Pragmatic Programmer》'
]

const practiceProjects = [
  '构建个人技术博客',
  '开源项目贡献',
  '设计优化系统方案'
]
</script>

<style scoped>
.skill-tracking {
  padding: 2rem 0;
}

/* Header */
.tracking-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

.tracking-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.tracking-desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

/* Category Buttons */
.skill-categories {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.8rem 1.5rem;
  border: 2px solid #ecf0f1;
  border-radius: 20px;
  background: white;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.category-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
}

/* Skills Grid */
.skills-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.skill-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #3498db;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
}

.skill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* Skill Header */
.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.skill-name {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.skill-level {
  padding: 0.4rem 0.8rem;
  background: #ecf0f1;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #7f8c8d;
}

.skill-level.level-高级 {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.2) 0%, rgba(52, 152, 219, 0.2) 100%);
  color: #27ae60;
}

.skill-level.level-中级 {
  background: linear-gradient(135deg, rgba(241, 196, 15, 0.2) 0%, rgba(230, 126, 34, 0.2) 100%);
  color: #f39c12;
}

/* Proficiency Section */
.proficiency-section {
  margin-bottom: 1rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 600;
}

.percentage {
  font-size: 0.9rem;
  color: #3498db;
  font-weight: 700;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

/* Experience Section */
.experience-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.exp-icon {
  font-size: 1rem;
}

.exp-text {
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Endorsement Section */
.endorsement-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: #f0fff4;
  border-radius: 6px;
}

.endorse-icon {
  font-size: 1rem;
}

.endorse-count {
  color: #27ae60;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Projects Section */
.projects-section,
.development-section {
  margin-bottom: 1rem;
}

.section-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
  text-transform: uppercase;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-tag {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Development List */
.dev-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dev-list li {
  padding: 0.4rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
  position: relative;
  padding-left: 1.3rem;
}

.dev-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #3498db;
  font-weight: 700;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  border: 1px solid #ecf0f1;
  background: white;
  color: #3498db;
}

.btn-secondary:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

/* Skills Summary */
.skills-summary {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.summary-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  text-align: center;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
}

.summary-number {
  font-size: 2rem;
  color: #3498db;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.summary-label {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

/* Development Timeline */
.development-timeline {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.timeline-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 2rem 0;
  font-weight: 700;
}

.timeline {
  position: relative;
  padding: 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
}

.timeline-item {
  margin-left: 100px;
  margin-bottom: 2rem;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -90px;
  top: 0;
  width: 16px;
  height: 16px;
  background: white;
  border: 3px solid #3498db;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
}

.timeline-period {
  font-size: 1rem;
  color: #3498db;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.timeline-desc {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.timeline-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.timeline-skill {
  padding: 0.4rem 0.8rem;
  background: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #2c3e50;
}

/* Learning Resources */
.learning-resources {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.resources-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.resource-type h4 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.resource-items {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.resource-item:hover {
  background: #f0f7ff;
  border-left: 3px solid #3498db;
}

.resource-icon {
  font-size: 1.2rem;
  min-width: 30px;
}

.resource-text {
  color: #2c3e50;
  font-size: 0.95rem;
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

/* Responsive */
@media (max-width: 768px) {
  .skills-container {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }

  .timeline-item {
    margin-left: 50px;
  }

  .timeline-item::before {
    left: -43px;
  }

  .timeline::before {
    left: 10px;
  }
}
</style>
