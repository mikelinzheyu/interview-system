<template>
  <div class="university-system">
    <!-- Header -->
    <div class="system-header">
      <h2 class="system-title">🎓 大学信息系统</h2>
      <p class="system-desc">探索全国2600+所高校，找到最适合您的大学</p>
    </div>

    <!-- Search and Filter -->
    <div class="search-section">
      <!-- Search Bar -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索大学名称..."
          class="search-input"
        />
        <button class="search-btn">🔍 搜索</button>
      </div>

      <!-- Filters -->
      <div class="filters-grid">
        <div class="filter-group">
          <label>地区</label>
          <select v-model="selectedRegion" class="filter-select">
            <option value="">全国</option>
            <option value="华东">华东</option>
            <option value="华南">华南</option>
            <option value="华北">华北</option>
            <option value="西部">西部</option>
          </select>
        </div>

        <div class="filter-group">
          <label>类型</label>
          <select v-model="selectedType" class="filter-select">
            <option value="">全部类型</option>
            <option value="双一流">双一流</option>
            <option value="985">985工程</option>
            <option value="211">211工程</option>
            <option value="普通">普通本科</option>
          </select>
        </div>

        <div class="filter-group">
          <label>排名范围</label>
          <select v-model="selectedRankRange" class="filter-select">
            <option value="">全部</option>
            <option value="1-50">前50名</option>
            <option value="51-100">51-100名</option>
            <option value="101-200">101-200名</option>
            <option value="201+">200名以后</option>
          </select>
        </div>

        <div class="filter-group">
          <label>排序</label>
          <select v-model="sortBy" class="filter-select">
            <option value="ranking">按排名</option>
            <option value="name">按名称</option>
            <option value="students">按学生数</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Universities Grid -->
    <div class="universities-grid">
      <div
        v-for="university in filteredUniversities"
        :key="university.id"
        class="university-card"
        :style="{ animationDelay: `${filteredUniversities.indexOf(university) * 0.05}s` }"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="header-left">
            <h3 class="uni-name">{{ university.name }}</h3>
            <div class="uni-badges">
              <span v-for="badge in university.badges" :key="badge" class="badge">
                {{ badge }}
              </span>
            </div>
          </div>
          <div class="ranking-badge">
            <span class="rank-number">{{ university.ranking }}</span>
            <span class="rank-label">全国排名</span>
          </div>
        </div>

        <!-- Basic Info -->
        <div class="basic-info">
          <div class="info-item">
            <span class="label">地区</span>
            <span class="value">{{ university.region }}</span>
          </div>
          <div class="info-item">
            <span class="label">类型</span>
            <span class="value">{{ university.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">学生数</span>
            <span class="value">{{ university.students }}人</span>
          </div>
          <div class="info-item">
            <span class="label">特色专业</span>
            <span class="value">{{ university.majorCount }}个</span>
          </div>
        </div>

        <!-- Key Strengths -->
        <div class="strengths-section">
          <h4 class="section-title">💪 优势学科</h4>
          <div class="strengths-list">
            <span v-for="(strength, idx) in university.strengths.slice(0, 3)" :key="idx" class="strength-tag">
              {{ strength }}
            </span>
          </div>
        </div>

        <!-- Acceptance Rate -->
        <div class="acceptance-section">
          <div class="acceptance-item">
            <span class="acceptance-label">录取率</span>
            <div class="acceptance-bar">
              <div class="acceptance-fill" :style="{ width: `${university.acceptanceRate}%` }"></div>
            </div>
            <span class="acceptance-value">{{ university.acceptanceRate }}%</span>
          </div>
        </div>

        <!-- Tuition -->
        <div class="tuition-section">
          <span class="tuition-label">学费参考</span>
          <span class="tuition-value">{{ university.tuition }}/年</span>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions">
          <button class="action-btn primary-btn" @click="viewUniversityDetails(university.id)">
            📖 详情
          </button>
          <button class="action-btn secondary-btn">
            ❤️ 收藏
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredUniversities.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">未找到匹配的大学</p>
      <button class="reset-btn" @click="resetFilters">重置筛选</button>
    </div>

    <!-- Statistics -->
    <div class="statistics-section">
      <h3 class="stats-title">📊 大学数据统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏫</div>
          <div class="stat-value">2600+</div>
          <div class="stat-label">全国高校</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">100万+</div>
          <div class="stat-label">在校生</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-value">50000+</div>
          <div class="stat-label">学科专业</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🌍</div>
          <div class="stat-value">31个</div>
          <div class="stat-label">省市自治区</div>
        </div>
      </div>
    </div>

    <!-- Featured Universities -->
    <div class="featured-section">
      <h3 class="featured-title">⭐ 重点推荐</h3>
      <div class="featured-grid">
        <div v-for="uni in featuredUniversities" :key="uni.id" class="featured-card">
          <div class="featured-header">
            <h4 class="featured-name">{{ uni.name }}</h4>
            <span class="featured-badge">{{ uni.type }}</span>
          </div>
          <p class="featured-desc">{{ uni.description }}</p>
          <div class="featured-highlights">
            <span v-for="(highlight, idx) in uni.highlights" :key="idx" class="highlight">
              {{ highlight }}
            </span>
          </div>
          <button class="featured-btn">查看详情</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedRegion = ref('')
const selectedType = ref('')
const selectedRankRange = ref('')
const sortBy = ref('ranking')

// Sample universities data
const allUniversities = ref([
  {
    id: 1,
    name: '清华大学',
    ranking: 1,
    region: '华北',
    type: '双一流',
    students: 45000,
    majorCount: 120,
    badges: ['985', '211', '双一流'],
    strengths: ['计算机科学', '工程学', '物理学', '化学'],
    acceptanceRate: 2.5,
    tuition: '5000-6000元'
  },
  {
    id: 2,
    name: '北京大学',
    ranking: 2,
    region: '华北',
    type: '双一流',
    students: 42000,
    majorCount: 140,
    badges: ['985', '211', '双一流'],
    strengths: ['文学', '哲学', '法学', '经济学'],
    acceptanceRate: 2.8,
    tuition: '5000-6000元'
  },
  {
    id: 3,
    name: '复旦大学',
    ranking: 3,
    region: '华东',
    type: '双一流',
    students: 38000,
    majorCount: 110,
    badges: ['985', '211', '双一流'],
    strengths: ['医学', '经济学', '哲学', '中文'],
    acceptanceRate: 3.5,
    tuition: '5000-7000元'
  },
  {
    id: 4,
    name: '上海交通大学',
    ranking: 4,
    region: '华东',
    type: '双一流',
    students: 40000,
    majorCount: 130,
    badges: ['985', '211', '双一流'],
    strengths: ['工程学', '计算机科学', '船舶与海洋工程'],
    acceptanceRate: 3.2,
    tuition: '5000-6500元'
  },
  {
    id: 5,
    name: '浙江大学',
    ranking: 5,
    region: '华东',
    type: '双一流',
    students: 52000,
    majorCount: 150,
    badges: ['985', '211', '双一流'],
    strengths: ['工程学', '计算机科学', '农业科技'],
    acceptanceRate: 4.5,
    tuition: '5000-6000元'
  },
  {
    id: 6,
    name: '南京大学',
    ranking: 6,
    region: '华东',
    type: '双一流',
    students: 35000,
    majorCount: 100,
    badges: ['985', '211', '双一流'],
    strengths: ['哲学', '物理学', '化学', '地质学'],
    acceptanceRate: 5.2,
    tuition: '5000-6000元'
  },
  {
    id: 7,
    name: '中国科学技术大学',
    ranking: 7,
    region: '华东',
    type: '双一流',
    students: 18000,
    majorCount: 65,
    badges: ['985', '211', '双一流'],
    strengths: ['物理学', '数学', '化学', '天文学'],
    acceptanceRate: 2.0,
    tuition: '5000-5500元'
  },
  {
    id: 8,
    name: '武汉大学',
    ranking: 8,
    region: '华中',
    type: '双一流',
    students: 48000,
    majorCount: 125,
    badges: ['985', '211', '双一流'],
    strengths: ['遥感技术', '测绘学', '法学', '经济学'],
    acceptanceRate: 5.8,
    tuition: '5000-6000元'
  }
])

const featuredUniversities = [
  {
    id: 1,
    name: '清华大学',
    type: '顶级985',
    description: '中国最顶尖的理工科大学，在计算机、工程等领域世界领先',
    highlights: ['世界一流大学', '强势学科众多', '校友资源丰富']
  },
  {
    id: 2,
    name: '北京大学',
    type: '顶级985',
    description: '中国最古老的高等学府，人文社科领域中国最强',
    highlights: ['文理兼备', '学术氛围浓厚', '国际化程度高']
  },
  {
    id: 3,
    name: '浙江大学',
    type: '985/双一流',
    description: '浙江省最高学府，工程学科特别强势，创新创业氛围浓厚',
    highlights: ['工程学强', '创新创业', '产学研结合']
  }
]

const filteredUniversities = computed(() => {
  let filtered = allUniversities.value

  // Search filter
  if (searchQuery.value) {
    filtered = filtered.filter(u => u.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }

  // Region filter
  if (selectedRegion.value) {
    filtered = filtered.filter(u => u.region === selectedRegion.value)
  }

  // Type filter
  if (selectedType.value) {
    filtered = filtered.filter(u => u.badges.includes(selectedType.value))
  }

  // Ranking filter
  if (selectedRankRange.value) {
    const [min, max] = selectedRankRange.value === '201+' ? [201, 999] : selectedRankRange.value.split('-').map(Number)
    filtered = filtered.filter(u => u.ranking >= min && u.ranking <= max)
  }

  // Sort
  if (sortBy.value === 'ranking') {
    filtered.sort((a, b) => a.ranking - b.ranking)
  } else if (sortBy.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'students') {
    filtered.sort((a, b) => b.students - a.students)
  }

  return filtered
})

function resetFilters() {
  searchQuery.value = ''
  selectedRegion.value = ''
  selectedType.value = ''
  selectedRankRange.value = ''
  sortBy.value = 'ranking'
}

function viewUniversityDetails(id) {
  console.log('查看大学详情:', id)
}
</script>

<style scoped>
.university-system {
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
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.search-btn {
  padding: 0.9rem 2rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* Filters */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.85rem;
  color: #2c3e50;
  font-weight: 600;
  text-transform: uppercase;
}

.filter-select {
  padding: 0.7rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
}

/* Universities Grid */
.universities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.university-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  border-top: 4px solid #3498db;
}

.university-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.uni-name {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
}

.uni-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge {
  padding: 0.3rem 0.7rem;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.ranking-badge {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 8px;
  min-width: 80px;
}

.rank-number {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.rank-label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.9;
}

/* Basic Info */
.basic-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-item .label {
  font-size: 0.8rem;
  color: #95a5a6;
  text-transform: uppercase;
  font-weight: 600;
}

.info-item .value {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 600;
}

/* Strengths Section */
.strengths-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.strengths-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.strength-tag {
  padding: 0.4rem 0.8rem;
  background: #f0f7ff;
  color: #3498db;
  border: 1px solid #d6eaff;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Acceptance Section */
.acceptance-section {
  margin-bottom: 1.5rem;
}

.acceptance-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.acceptance-label {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-weight: 600;
  min-width: 50px;
}

.acceptance-bar {
  flex: 1;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.acceptance-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
}

.acceptance-value {
  font-size: 0.85rem;
  color: #27ae60;
  font-weight: 700;
  min-width: 35px;
}

/* Tuition Section */
.tuition-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: #f9f3e9;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.tuition-label {
  font-size: 0.85rem;
  color: #d68910;
  font-weight: 600;
}

.tuition-value {
  font-size: 0.95rem;
  color: #d68910;
  font-weight: 700;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
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

.primary-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.secondary-btn {
  background: white;
  border: 1px solid #ecf0f1;
  color: #3498db;
}

.secondary-btn:hover {
  background: #f0f7ff;
  border-color: #3498db;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 3rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.reset-btn {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Statistics */
.statistics-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stats-title {
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
  border: 1px solid #ecf0f1;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.8rem;
}

.stat-value {
  font-size: 1.5rem;
  color: #3498db;
  font-weight: 700;
  margin-bottom: 0.3rem;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Featured Section */
.featured-section {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.featured-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.featured-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #f39c12;
}

.featured-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.featured-name {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.featured-badge {
  padding: 0.3rem 0.8rem;
  background: #fef5e7;
  color: #f39c12;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.featured-desc {
  color: #2c3e50;
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.featured-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.highlight {
  padding: 0.3rem 0.7rem;
  background: #f8f9fa;
  color: #2c3e50;
  border-radius: 4px;
  font-size: 0.8rem;
}

.featured-btn {
  width: 100%;
  padding: 0.7rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.featured-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
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
  .universities-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .search-bar {
    flex-direction: column;
  }

  .card-header {
    flex-direction: column;
  }

  .ranking-badge {
    align-self: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }
}
</style>
