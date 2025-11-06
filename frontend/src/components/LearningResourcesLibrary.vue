<template>
  <div class="learning-resources">
    <!-- Header -->
    <div class="header">
      <h2 class="title">📚 学习资源库</h2>
      <p class="desc">汇聚优质学习资源，助力职业发展</p>
    </div>

    <!-- Resource Filters -->
    <div class="filters-section">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索资源..."
          class="search-input"
        />
      </div>

      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="category-btn"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ categoryIcons[cat] }} {{ cat }}
        </button>
      </div>

      <div class="filter-controls">
        <select v-model="selectedLevel" class="filter-select">
          <option value="">全部难度</option>
          <option value="初级">初级</option>
          <option value="中级">中级</option>
          <option value="高级">高级</option>
        </select>

        <select v-model="sortBy" class="filter-select">
          <option value="popular">最热门</option>
          <option value="newest">最新</option>
          <option value="rating">评分最高</option>
        </select>
      </div>
    </div>

    <!-- Resources Grid -->
    <div class="resources-grid">
      <div
        v-for="resource in filteredResources"
        :key="resource.id"
        class="resource-card"
        :style="{ animationDelay: `${filteredResources.indexOf(resource) * 0.05}s` }"
      >
        <!-- Card Header -->
        <div class="card-header">
          <span class="resource-type-badge">{{ resource.type }}</span>
          <div class="rating">
            <span class="stars">⭐ {{ resource.rating }}</span>
            <span class="reviews">({{ resource.reviews }})</span>
          </div>
        </div>

        <!-- Resource Info -->
        <h3 class="resource-title">{{ resource.title }}</h3>
        <p class="resource-desc">{{ resource.description }}</p>

        <!-- Resource Details -->
        <div class="resource-details">
          <div class="detail-item">
            <span class="icon">👥</span>
            <span>{{ resource.students }}人学过</span>
          </div>
          <div class="detail-item">
            <span class="icon">⏱️</span>
            <span>{{ resource.duration }}</span>
          </div>
          <div class="detail-item">
            <span class="icon">📊</span>
            <span>{{ resource.level }}</span>
          </div>
        </div>

        <!-- Tags -->
        <div class="tags">
          <span v-for="tag in resource.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <!-- Provider -->
        <div class="provider">
          <span class="provider-name">{{ resource.provider }}</span>
          <span class="provider-price" v-if="resource.price">{{ resource.price }}</span>
          <span class="provider-price free" v-else>免费</span>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions">
          <button class="action-btn primary">📖 学习</button>
          <button class="action-btn secondary">❤️ 收藏</button>
        </div>
      </div>
    </div>

    <!-- Resource Statistics -->
    <div class="statistics">
      <h3 class="stat-title">📊 资源统计</h3>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-number">{{ totalResources }}</div>
          <div class="stat-label">优质资源</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ uniqueProviders }}</div>
          <div class="stat-label">资源平台</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalStudents }}</div>
          <div class="stat-label">学习人次</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ averageRating.toFixed(1) }}</div>
          <div class="stat-label">平均评分</div>
        </div>
      </div>
    </div>

    <!-- Recommended Collections -->
    <div class="collections">
      <h3 class="collection-title">🎯 推荐学习集合</h3>
      <div class="collection-grid">
        <div v-for="collection in recommendedCollections" :key="collection.id" class="collection-card">
          <h4 class="collection-name">{{ collection.name }}</h4>
          <p class="collection-desc">{{ collection.description }}</p>
          <div class="collection-resources">
            <span v-for="(res, idx) in collection.resources.slice(0, 3)" :key="idx" class="res-item">
              {{ res }}
            </span>
            <span v-if="collection.resources.length > 3" class="res-more">
              +{{ collection.resources.length - 3 }}更多
            </span>
          </div>
          <button class="collection-btn">查看全部</button>
        </div>
      </div>
    </div>

    <!-- Learning Paths -->
    <div class="paths">
      <h3 class="path-title">🛣️ 学习路径推荐</h3>
      <div class="path-grid">
        <div v-for="path in learningPaths" :key="path.id" class="path-card">
          <div class="path-header">
            <h4 class="path-name">{{ path.name }}</h4>
            <span class="path-duration">{{ path.duration }}</span>
          </div>
          <p class="path-desc">{{ path.description }}</p>
          <div class="path-steps">
            <div v-for="(step, idx) in path.steps" :key="idx" class="step">
              <span class="step-num">{{ idx + 1 }}</span>
              <span class="step-name">{{ step }}</span>
            </div>
          </div>
          <button class="path-btn">开始学习</button>
        </div>
      </div>
    </div>

    <!-- Top Categories -->
    <div class="top-categories">
      <h3 class="categories-title">🏆 热门分类</h3>
      <div class="category-grid">
        <div v-for="cat in topCategories" :key="cat.name" class="category-card">
          <div class="category-icon">{{ cat.icon }}</div>
          <h4 class="category-name">{{ cat.name }}</h4>
          <p class="category-count">{{ cat.count }}个资源</p>
          <button class="category-explore">浏览</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const selectedCategory = ref('全部')
const selectedLevel = ref('')
const sortBy = ref('popular')

const categories = ['全部', '在线课程', '书籍', '博客', '视频', '工具']

const categoryIcons = {
  全部: '📚',
  在线课程: '🎓',
  书籍: '📖',
  博客: '📝',
  视频: '🎥',
  工具: '🛠️'
}

const allResources = ref([
  {
    id: 1,
    title: 'Vue 3 完整教程',
    description: '学习Vue 3最新特性，包括Composition API、响应式系统等',
    type: '在线课程',
    category: '在线课程',
    provider: 'Udemy',
    price: '¥299',
    rating: 4.8,
    reviews: 2500,
    students: 50000,
    duration: '40小时',
    level: '中级',
    tags: ['Vue', 'JavaScript', 'Web开发'],
    link: '#'
  },
  {
    id: 2,
    title: '深入浅出Node.js',
    description: 'Node.js原理、最佳实践和高性能编程',
    type: '书籍',
    category: '书籍',
    provider: '人民邮电出版社',
    price: '¥99',
    rating: 4.6,
    reviews: 1200,
    students: 15000,
    duration: '20小时',
    level: '高级',
    tags: ['Node.js', 'JavaScript', '后端'],
    link: '#'
  },
  {
    id: 3,
    title: 'React官方文档',
    description: '最权威的React学习资源',
    type: '博客',
    category: '博客',
    provider: 'React官方',
    price: null,
    rating: 4.9,
    reviews: 5000,
    students: 100000,
    duration: '30小时',
    level: '初级',
    tags: ['React', 'JavaScript', 'Web开发'],
    link: '#'
  },
  {
    id: 4,
    title: '系统设计面试准备',
    description: '大厂系统设计面试完整指南',
    type: '视频',
    category: '视频',
    provider: 'YouTube',
    price: null,
    rating: 4.7,
    reviews: 1800,
    students: 30000,
    duration: '50小时',
    level: '高级',
    tags: ['系统设计', '面试', '后端'],
    link: '#'
  },
  {
    id: 5,
    title: 'TypeScript官方文档',
    description: 'TypeScript完整学习手册',
    type: '博客',
    category: '博客',
    provider: 'TypeScript官方',
    price: null,
    rating: 4.8,
    reviews: 3000,
    students: 60000,
    duration: '20小时',
    level: '中级',
    tags: ['TypeScript', 'JavaScript'],
    link: '#'
  },
  {
    id: 6,
    title: '深入理解计算机系统',
    description: '计算机基础知识完整讲解',
    type: '书籍',
    category: '书籍',
    provider: '人民邮电出版社',
    price: '¥129',
    rating: 4.9,
    reviews: 2000,
    students: 25000,
    duration: '30小时',
    level: '高级',
    tags: ['计算机基础', '操作系统', '编译原理'],
    link: '#'
  }
])

const recommendedCollections = [
  {
    id: 1,
    name: '前端工程师成长路线',
    description: '从入门到精通的前端学习集合',
    resources: ['HTML/CSS基础', 'JavaScript进阶', 'Vue.js', 'React', 'TypeScript', '工程化工具']
  },
  {
    id: 2,
    name: '后端工程师必读',
    description: '后端开发核心知识和最佳实践',
    resources: ['算法与数据结构', 'Node.js/Java', '数据库设计', '系统设计', '微服务架构']
  },
  {
    id: 3,
    name: '面试突击营',
    description: '大厂技术面试完全准备',
    resources: ['算法题库', '系统设计', '行为面试', '薪资谈判']
  }
]

const learningPaths = [
  {
    id: 1,
    name: '从零到前端工程师',
    duration: '6个月',
    description: '系统化学习前端开发所有知识',
    steps: ['HTML/CSS基础', 'JavaScript', 'Vue.js', '实战项目', '简历优化', '面试准备']
  },
  {
    id: 2,
    name: '全栈开发掌握',
    duration: '12个月',
    description: '前后端全栈能力培养',
    steps: ['前端基础', '后端基础', '数据库', '整合开发', '项目部署', '系统优化']
  }
]

const topCategories = [
  { name: '在线课程', icon: '🎓', count: 200 },
  { name: '技术书籍', icon: '📖', count: 150 },
  { name: '技术博客', icon: '📝', count: 500 },
  { name: '视频教程', icon: '🎥', count: 300 },
  { name: '开发工具', icon: '🛠️', count: 100 },
  { name: '开源项目', icon: '💻', count: 250 }
]

const filteredResources = computed(() => {
  let filtered = allResources.value

  if (searchQuery.value) {
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (selectedCategory.value !== '全部') {
    filtered = filtered.filter(r => r.type === selectedCategory.value)
  }

  if (selectedLevel.value) {
    filtered = filtered.filter(r => r.level === selectedLevel.value)
  }

  // Sort
  if (sortBy.value === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating)
  } else if (sortBy.value === 'newest') {
    filtered.reverse()
  } else {
    filtered.sort((a, b) => b.reviews - a.reviews)
  }

  return filtered
})

const totalResources = computed(() => allResources.value.length)

const uniqueProviders = computed(() => {
  const providers = new Set(allResources.value.map(r => r.provider))
  return providers.size
})

const totalStudents = computed(() => {
  return allResources.value.reduce((sum, r) => sum + r.students, 0)
})

const averageRating = computed(() => {
  const sum = allResources.value.reduce((sum, r) => sum + r.rating, 0)
  return sum / allResources.value.length
})
</script>

<style scoped>
.learning-resources {
  padding: 2rem 0;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 800;
}

.desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1.1rem;
}

/* Filters */
.filters-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-box {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.category-tabs {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
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

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  padding: 0.7rem;
  border: 2px solid #ecf0f1;
  border-radius: 6px;
  cursor: pointer;
}

/* Resources Grid */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.resource-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
  border-top: 4px solid #3498db;
}

.resource-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.resource-type-badge {
  padding: 0.3rem 0.8rem;
  background: #f0f7ff;
  color: #3498db;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  color: #f39c12;
  font-weight: 600;
}

.reviews {
  color: #95a5a6;
  font-size: 0.85rem;
}

/* Resource Title and Description */
.resource-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
}

.resource-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

/* Resource Details */
.resource-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.detail-item .icon {
  font-size: 1rem;
}

/* Tags */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  padding: 0.3rem 0.7rem;
  background: #f0f7ff;
  color: #3498db;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Provider */
.provider {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: #f9f3e9;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.provider-name {
  font-weight: 600;
  color: #d68910;
}

.provider-price {
  color: #d68910;
  font-weight: 700;
}

.provider-price.free {
  color: #27ae60;
  background: #f0fff4;
  padding: 0.3rem 0.6rem;
  border-radius: 3px;
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
.statistics {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.stat-grid {
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

.stat-label {
  color: #7f8c8d;
}

/* Collections */
.collections {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.collection-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.collection-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.collection-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.6rem 0;
  font-weight: 700;
}

.collection-desc {
  color: #7f8c8d;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.collection-resources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.res-item {
  padding: 0.3rem 0.7rem;
  background: white;
  border-radius: 3px;
  font-size: 0.85rem;
  color: #2c3e50;
}

.res-more {
  padding: 0.3rem 0.7rem;
  color: #3498db;
  font-weight: 600;
}

.collection-btn {
  width: 100%;
  padding: 0.7rem;
  background: white;
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Paths */
.paths {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.path-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.path-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.path-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
}

.path-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.path-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.path-duration {
  color: #27ae60;
  font-size: 0.85rem;
  font-weight: 600;
}

.path-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.path-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.step {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.step-num {
  min-width: 24px;
  height: 24px;
  background: #27ae60;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.step-name {
  color: #2c3e50;
  font-size: 0.9rem;
}

.path-btn {
  width: 100%;
  padding: 0.7rem;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Categories */
.top-categories {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.categories-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.category-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.category-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.3rem 0;
  font-weight: 700;
}

.category-count {
  color: #7f8c8d;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
}

.category-explore {
  width: 100%;
  padding: 0.7rem;
  background: #f0f7ff;
  color: #3498db;
  border: 1px solid #d6eaff;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
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
  .resources-grid {
    grid-template-columns: 1fr;
  }

  .category-tabs {
    flex-direction: column;
  }

  .category-btn {
    width: 100%;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .collection-grid,
  .path-grid,
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
