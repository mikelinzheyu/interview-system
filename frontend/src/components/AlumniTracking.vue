<template>
  <div class="alumni-system">
    <!-- Header -->
    <div class="system-header">
      <h2 class="system-title">🌐 校友生涯追踪系统</h2>
      <p class="system-desc">跟踪校友职业发展，获取成功经验和指导</p>
    </div>

    <!-- Search Alumni -->
    <div class="search-section">
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索校友名字、公司、职位..."
          class="search-input"
        />
        <button class="search-btn">🔍 搜索</button>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <select v-model="filterYear" class="filter-select">
          <option value="">全部毕业年份</option>
          <option value="2020">2020年</option>
          <option value="2019">2019年</option>
          <option value="2018">2018年</option>
          <option value="2015">2015年及之前</option>
        </select>

        <select v-model="filterIndustry" class="filter-select">
          <option value="">全部行业</option>
          <option value="IT互联网">IT互联网</option>
          <option value="金融">金融</option>
          <option value="制造">制造</option>
          <option value="创业">创业</option>
        </select>

        <select v-model="filterCity" class="filter-select">
          <option value="">全部城市</option>
          <option value="北京">北京</option>
          <option value="上海">上海</option>
          <option value="深圳">深圳</option>
          <option value="杭州">杭州</option>
        </select>
      </div>
    </div>

    <!-- Alumni Cards Grid -->
    <div class="alumni-grid">
      <div
        v-for="alumni in filteredAlumni"
        :key="alumni.id"
        class="alumni-card"
        :style="{ animationDelay: `${filteredAlumni.indexOf(alumni) * 0.05}s` }"
      >
        <!-- Profile -->
        <div class="profile-section">
          <div class="avatar">{{ alumni.initials }}</div>
          <div class="profile-info">
            <h3 class="alumni-name">{{ alumni.name }}</h3>
            <p class="alumni-title">{{ alumni.currentTitle }}</p>
            <p class="alumni-company">{{ alumni.currentCompany }}</p>
          </div>
        </div>

        <!-- Career Path -->
        <div class="career-path">
          <h4 class="section-label">📈 职业发展路径</h4>
          <div class="timeline">
            <div v-for="(job, idx) in alumni.careerPath" :key="idx" class="timeline-item">
              <div class="timeline-year">{{ job.year }}</div>
              <div class="timeline-details">
                <div class="job-title">{{ job.title }}</div>
                <div class="job-company">{{ job.company }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Achievements -->
        <div class="achievements-section">
          <h4 class="section-label">🏆 主要成就</h4>
          <ul class="achievements-list">
            <li v-for="(achievement, idx) in alumni.achievements.slice(0, 3)" :key="idx">
              {{ achievement }}
            </li>
          </ul>
        </div>

        <!-- Skills -->
        <div class="skills-section">
          <h4 class="section-label">💡 核心技能</h4>
          <div class="skills-tags">
            <span v-for="skill in alumni.skills" :key="skill" class="skill-tag">
              {{ skill }}
            </span>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">工作年限</span>
            <span class="stat-value">{{ alumni.yearsExperience }}年</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">薪资范围</span>
            <span class="stat-value">{{ alumni.salaryRange }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">求助指数</span>
            <span class="stat-value">
              <span class="help-badge" :class="`level-${alumni.helpfulnessLevel}`">
                {{ alumni.helpfulnessLevel }}
              </span>
            </span>
          </div>
        </div>

        <!-- Connection Status -->
        <div class="connection-section">
          <p class="connection-text">{{ alumni.connectionMessage }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions">
          <button class="action-btn primary" @click="contactAlumni(alumni.id)">
            💬 联系校友
          </button>
          <button class="action-btn secondary">
            ⭐ 收藏
          </button>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div v-if="filteredAlumni.length === 0" class="no-results">
      <p>没有找到匹配的校友</p>
    </div>

    <!-- Alumni Statistics -->
    <div class="statistics-section">
      <h3 class="section-title">📊 校友数据统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ totalAlumni }}</div>
          <div class="stat-desc">在线校友</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ industryStats.length }}</div>
          <div class="stat-desc">活跃行业</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ cityStats.length }}</div>
          <div class="stat-desc">分布城市</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ averageExperience.toFixed(1) }}</div>
          <div class="stat-desc">平均工龄</div>
        </div>
      </div>
    </div>

    <!-- Industry Distribution -->
    <div class="distribution-section">
      <h3 class="section-title">🏢 行业分布</h3>
      <div class="distribution-grid">
        <div v-for="ind in industryStats" :key="ind.name" class="distribution-card">
          <h4 class="industry-name">{{ ind.name }}</h4>
          <div class="industry-bar">
            <div class="bar-fill" :style="{ width: `${ind.percentage}%` }"></div>
          </div>
          <div class="industry-info">
            <span class="count">{{ ind.count }}人</span>
            <span class="percentage">{{ ind.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Stories -->
    <div class="success-stories">
      <h3 class="section-title">⭐ 校友成功案例</h3>
      <div class="stories-grid">
        <div v-for="story in successStories" :key="story.id" class="story-card">
          <div class="story-header">
            <h4 class="story-name">{{ story.name }}</h4>
            <span class="story-role">{{ story.role }}</span>
          </div>
          <p class="story-description">{{ story.story }}</p>
          <div class="story-lessons">
            <span v-for="lesson in story.lessons" :key="lesson" class="lesson-tag">
              {{ lesson }}
            </span>
          </div>
          <button class="story-btn">阅读故事</button>
        </div>
      </div>
    </div>

    <!-- Mentorship Matching -->
    <div class="mentorship-section">
      <h3 class="section-title">🎯 导师匹配</h3>
      <p class="mentorship-desc">根据您的兴趣和目标，匹配合适的校友导师</p>
      <button class="match-btn">开始匹配</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const filterYear = ref('')
const filterIndustry = ref('')
const filterCity = ref('')

const allAlumni = ref([
  {
    id: 1,
    name: '张三',
    initials: '张',
    currentTitle: 'CTO',
    currentCompany: '某AI公司',
    careerPath: [
      { year: '2023', title: 'CTO', company: '某AI公司' },
      { year: '2021', title: '技术总监', company: '互联网公司' },
      { year: '2018', title: '资深工程师', company: '互联网公司' }
    ],
    achievements: ['带领50人团队', '获得融资2000万', '技术专利10+', '年薪200万+'],
    skills: ['Java', 'Python', 'Go', '系统设计', '团队管理'],
    yearsExperience: 8,
    salaryRange: '150-200万',
    helpfulnessLevel: '高',
    connectionMessage: '积极参与校友活动，经常分享行业经验',
    graduationYear: 2015,
    industry: 'IT互联网',
    city: '北京'
  },
  {
    id: 2,
    name: '李四',
    initials: '李',
    currentTitle: '投资经理',
    currentCompany: '知名VC基金',
    careerPath: [
      { year: '2022', title: '投资经理', company: '知名VC基金' },
      { year: '2020', title: '项目经理', company: '互联网公司' },
      { year: '2017', title: '产品经理', company: '互联网公司' }
    ],
    achievements: ['投资10+个项目', '5个项目成功退出', '行业影响力大', '年薪100万+'],
    skills: ['融资', '投资分析', '战略规划', '沟通能力'],
    yearsExperience: 6,
    salaryRange: '100-150万',
    helpfulnessLevel: '高',
    connectionMessage: '积极为校友提供融资指导',
    graduationYear: 2017,
    industry: '金融',
    city: '北京'
  },
  {
    id: 3,
    name: '王五',
    initials: '王',
    currentTitle: 'CEO',
    currentCompany: '创业公司',
    careerPath: [
      { year: '2021', title: 'CEO', company: '创业公司' },
      { year: '2019', title: '联合创始人', company: '创业公司' },
      { year: '2016', title: '产品总监', company: '大公司' }
    ],
    achievements: ['融资5000万', '团队规模100人', '市场占有率20%', '估值2亿+'],
    skills: ['创业', '融资', '产品设计', '市场开拓'],
    yearsExperience: 7,
    salaryRange: '200万+',
    helpfulnessLevel: '中',
    connectionMessage: '创业期间较忙，定期参与校友分享',
    graduationYear: 2016,
    industry: '创业',
    city: '深圳'
  },
  {
    id: 4,
    name: '刘六',
    initials: '刘',
    currentTitle: '产品总监',
    currentCompany: '知名互联网公司',
    careerPath: [
      { year: '2023', title: '产品总监', company: '知名互联网公司' },
      { year: '2021', title: '高级产品经理', company: '互联网公司' },
      { year: '2019', title: '产品经理', company: '互联网公司' }
    ],
    achievements: ['负责千万级产品', '用户增长300%', '带领20人团队', '年薪80万+'],
    skills: ['产品设计', '用户研究', '数据分析', '项目管理'],
    yearsExperience: 5,
    salaryRange: '80-120万',
    helpfulnessLevel: '高',
    connectionMessage: '每月定期进行校友指导',
    graduationYear: 2018,
    industry: 'IT互联网',
    city: '杭州'
  }
])

const successStories = [
  {
    id: 1,
    name: '张三',
    role: 'CTO | 某AI公司',
    story: '从初级工程师到CTO，用8年时间建立了一支50人的技术团队，成功融资2000万。关键是坚持学习、主动承担挑战、建立信任。',
    lessons: ['持续学习', '团队建设', '技术领导力']
  },
  {
    id: 2,
    name: '王五',
    role: 'CEO | 创业公司',
    story: '从大公司PM到创业CEO，创办的公司融资5000万，成为行业新星。创业的成功需要执行力、市场敏感度和坚持。',
    lessons: ['创业思维', '执行力', '市场把握']
  }
]

const filteredAlumni = computed(() => {
  let filtered = allAlumni.value

  if (searchQuery.value) {
    filtered = filtered.filter(a =>
      a.name.includes(searchQuery.value) ||
      a.currentCompany.includes(searchQuery.value) ||
      a.currentTitle.includes(searchQuery.value)
    )
  }

  if (filterYear.value) {
    const year = parseInt(filterYear.value)
    if (year === 2015) {
      filtered = filtered.filter(a => a.graduationYear <= 2015)
    } else {
      filtered = filtered.filter(a => a.graduationYear === year)
    }
  }

  if (filterIndustry.value) {
    filtered = filtered.filter(a => a.industry === filterIndustry.value)
  }

  if (filterCity.value) {
    filtered = filtered.filter(a => a.city === filterCity.value)
  }

  return filtered
})

const totalAlumni = computed(() => allAlumni.value.length)

const averageExperience = computed(() => {
  const sum = allAlumni.value.reduce((acc, a) => acc + a.yearsExperience, 0)
  return sum / allAlumni.value.length
})

const industryStats = computed(() => {
  const stats = {}
  allAlumni.value.forEach(a => {
    if (!stats[a.industry]) {
      stats[a.industry] = 0
    }
    stats[a.industry]++
  })

  const total = allAlumni.value.length
  return Object.entries(stats).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / total) * 100)
  }))
})

const cityStats = computed(() => {
  const cities = new Set(allAlumni.value.map(a => a.city))
  return Array.from(cities)
})

function contactAlumni(id) {
  console.log('联系校友:', id)
  // 实现联系功能
}
</script>

<style scoped>
.alumni-system {
  padding: 2rem 0;
}

/* Header */
.system-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.system-title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 800;
}

.system-desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1.1rem;
}

/* Search Section */
.search-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.9rem 1.2rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-btn {
  padding: 0.9rem 2rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 0.8rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  cursor: pointer;
}

/* Alumni Grid */
.alumni-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.alumni-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  border-left: 4px solid #3498db;
}

.alumni-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Profile Section */
.profile-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.alumni-name {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 0.3rem 0;
  font-weight: 700;
}

.alumni-title {
  color: #3498db;
  font-weight: 600;
  margin: 0.2rem 0;
  font-size: 0.95rem;
}

.alumni-company {
  color: #7f8c8d;
  margin: 0.2rem 0 0 0;
  font-size: 0.9rem;
}

/* Career Path */
.career-path {
  margin-bottom: 1.5rem;
}

.section-label {
  font-size: 0.9rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.timeline-year {
  min-width: 50px;
  color: #3498db;
  font-weight: 700;
  font-size: 0.9rem;
}

.timeline-details {
  flex: 1;
}

.job-title {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.9rem;
}

.job-company {
  color: #7f8c8d;
  font-size: 0.85rem;
}

/* Achievements */
.achievements-section {
  margin-bottom: 1.5rem;
}

.achievements-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.achievements-list li {
  padding: 0.4rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
  position: relative;
  padding-left: 1.5rem;
}

.achievements-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #27ae60;
  font-weight: 700;
}

/* Skills */
.skills-section {
  margin-bottom: 1.5rem;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  padding: 0.4rem 0.8rem;
  background: #f0f7ff;
  color: #3498db;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #95a5a6;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.stat-value {
  display: block;
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 700;
}

.help-badge {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background: #f0f7ff;
  color: #3498db;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
}

.help-badge.level-高 {
  background: #d4edda;
  color: #27ae60;
}

/* Connection */
.connection-section {
  padding: 0.8rem;
  background: #f9f3e9;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.connection-text {
  color: #d68910;
  font-size: 0.85rem;
  margin: 0;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 0.8rem;
}

.action-btn {
  flex: 1;
  padding: 0.7rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.action-btn.secondary {
  background: white;
  border: 1px solid #ecf0f1;
  color: #3498db;
}

/* Statistics */
.statistics-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  color: #3498db;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Distribution */
.distribution-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.distribution-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.industry-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.industry-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

.industry-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.count {
  color: #2c3e50;
  font-weight: 600;
}

.percentage {
  color: #3498db;
  font-weight: 700;
}

/* Success Stories */
.success-stories {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.story-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #f39c12;
}

.story-header {
  margin-bottom: 1rem;
}

.story-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.3rem 0;
  font-weight: 700;
}

.story-role {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.story-description {
  color: #2c3e50;
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.story-lessons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.lesson-tag {
  padding: 0.3rem 0.7rem;
  background: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
  font-size: 0.85rem;
}

.story-btn {
  width: 100%;
  padding: 0.7rem;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Mentorship */
.mentorship-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.mentorship-desc {
  color: #7f8c8d;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.match-btn {
  padding: 0.9rem 2rem;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  color: #7f8c8d;
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
  .alumni-grid {
    grid-template-columns: 1fr;
  }

  .filters-row {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .distribution-grid {
    grid-template-columns: 1fr;
  }

  .stories-grid {
    grid-template-columns: 1fr;
  }
}
</style>
