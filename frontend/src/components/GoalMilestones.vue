<template>
  <div class="goal-milestones">
    <!-- Header -->
    <div class="header">
      <h2 class="title">🎯 目标和里程碑管理</h2>
      <p class="desc">制定和追踪您的职业发展目标</p>
    </div>

    <!-- Add Goal Button -->
    <div class="add-goal-section">
      <button class="add-goal-btn" @click="showAddGoal = !showAddGoal">
        <span>➕</span> 添加新目标
      </button>

      <!-- Add Goal Form -->
      <div v-if="showAddGoal" class="add-goal-form">
        <div class="form-group">
          <label>目标名称</label>
          <input v-model="newGoal.name" type="text" placeholder="例: 学习Vue 3高级特性" />
        </div>
        <div class="form-group">
          <label>目标描述</label>
          <textarea v-model="newGoal.description" placeholder="详细描述这个目标" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>截止日期</label>
          <input v-model="newGoal.deadline" type="date" />
        </div>
        <div class="form-group">
          <label>优先级</label>
          <select v-model="newGoal.priority">
            <option value="高">高</option>
            <option value="中">中</option>
            <option value="低">低</option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn-primary" @click="addGoal">创建目标</button>
          <button class="btn-secondary" @click="showAddGoal = false">取消</button>
        </div>
      </div>
    </div>

    <!-- Goals Overview -->
    <div class="goals-overview">
      <div class="stat-card">
        <div class="stat-number">{{ allGoals.length }}</div>
        <div class="stat-label">总目标数</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-number">{{ completedGoals }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card inprogress">
        <div class="stat-number">{{ inProgressGoals }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-number">{{ pendingGoals }}</div>
        <div class="stat-label">待进行</div>
      </div>
    </div>

    <!-- Goal Filters -->
    <div class="goal-filters">
      <button
        v-for="status in ['全部', '进行中', '已完成', '待进行']"
        :key="status"
        class="filter-btn"
        :class="{ active: selectedStatus === status }"
        @click="selectedStatus = status"
      >
        {{ status }}
      </button>
    </div>

    <!-- Goals Grid -->
    <div class="goals-grid">
      <div
        v-for="goal in filteredGoals"
        :key="goal.id"
        class="goal-card"
        :class="`status-${goal.status}`"
        :style="{ animationDelay: `${filteredGoals.indexOf(goal) * 0.1}s` }"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="header-top">
            <h3 class="goal-name">{{ goal.name }}</h3>
            <span class="goal-status" :class="`status-${goal.status}`">
              {{ goal.status }}
            </span>
          </div>
          <p class="goal-desc">{{ goal.description }}</p>
        </div>

        <!-- Progress Section -->
        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-label">完成度</span>
            <span class="progress-percentage">{{ goal.progress }}%</span>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${goal.progress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Milestones -->
        <div class="milestones-section">
          <h4 class="section-title">里程碑</h4>
          <div class="milestones-list">
            <div
              v-for="(milestone, idx) in goal.milestones"
              :key="idx"
              class="milestone-item"
            >
              <input
                type="checkbox"
                :checked="milestone.completed"
                @change="toggleMilestone(goal.id, idx)"
                class="milestone-checkbox"
              />
              <span class="milestone-text" :class="{ completed: milestone.completed }">
                {{ milestone.title }}
              </span>
              <span v-if="milestone.dueDate" class="milestone-date">
                {{ formatDate(milestone.dueDate) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-info">
          <span class="timeline-icon">📅</span>
          <span class="timeline-text">
            开始: {{ formatDate(goal.startDate) }} → 截止: {{ formatDate(goal.deadline) }}
          </span>
        </div>

        <!-- Priority Badge -->
        <div class="priority-section">
          <span class="priority-badge" :class="`priority-${goal.priority}`">
            {{ goal.priority }}优先级
          </span>
        </div>

        <!-- Action Buttons -->
        <div class="card-actions">
          <button class="action-btn edit-btn" @click="editGoal(goal.id)">
            ✏️ 编辑
          </button>
          <button class="action-btn delete-btn" @click="deleteGoal(goal.id)">
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <!-- Goal Timeline Visualization -->
    <div class="timeline-visualization">
      <h3 class="timeline-title">目标时间线</h3>
      <div class="timeline">
        <div
          v-for="(goal, index) in allGoals"
          :key="goal.id"
          class="timeline-entry"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h4 class="timeline-goal">{{ goal.name }}</h4>
              <span class="timeline-progress">{{ goal.progress }}%</span>
            </div>
            <div class="timeline-dates">
              {{ formatDate(goal.startDate) }} ~ {{ formatDate(goal.deadline) }}
            </div>
            <div class="timeline-mini-progress">
              <div class="mini-bar">
                <div class="mini-fill" :style="{ width: `${goal.progress}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Stories -->
    <div class="success-stories">
      <h3 class="stories-title">✨ 成功案例</h3>
      <div class="stories-grid">
        <div v-for="story in successStories" :key="story.id" class="story-card">
          <div class="story-header">
            <h4 class="story-goal">{{ story.goal }}</h4>
            <span class="story-timespan">{{ story.timespan }}</span>
          </div>
          <p class="story-desc">{{ story.description }}</p>
          <div class="story-results">
            <span v-for="(result, idx) in story.results" :key="idx" class="result-tag">
              {{ result }}
            </span>
          </div>
          <p class="story-reflection">💭 {{ story.reflection }}</p>
        </div>
      </div>
    </div>

    <!-- Tips and Advice -->
    <div class="tips-advice">
      <h3 class="tips-title">💡 目标制定建议</h3>
      <div class="tips-grid">
        <div class="tip-card">
          <div class="tip-icon">🎯</div>
          <h4>SMART原则</h4>
          <p>制定明确(Specific)、可衡量(Measurable)、可达成(Achievable)、相关(Relevant)、有时限(Time-bound)的目标</p>
        </div>
        <div class="tip-card">
          <div class="tip-icon">📊</div>
          <h4>分解为里程碑</h4>
          <p>将大目标分解为多个小的里程碑，这样更容易追踪进度和保持动力</p>
        </div>
        <div class="tip-card">
          <div class="tip-icon">📝</div>
          <h4>定期复审</h4>
          <p>每周或每月复审目标进度，及时调整计划和策略</p>
        </div>
        <div class="tip-card">
          <div class="tip-icon">🎉</div>
          <h4>庆祝成就</h4>
          <p>完成里程碑时要庆祝，这能帮助保持动力和积极性</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const showAddGoal = ref(false)
const selectedStatus = ref('全部')

const newGoal = ref({
  name: '',
  description: '',
  deadline: '',
  priority: '中'
})

const allGoals = ref([
  {
    id: 1,
    name: '学习Vue 3高级特性',
    description: '深入学习Vue 3的Composition API、响应式系统等高级特性',
    status: '进行中',
    progress: 65,
    priority: '高',
    startDate: '2024-01-15',
    deadline: '2024-03-31',
    milestones: [
      { title: '完成Composition API学习', completed: true, dueDate: '2024-02-15' },
      { title: '理解响应式系统原理', completed: true, dueDate: '2024-02-28' },
      { title: '完成3个实战项目', completed: false, dueDate: '2024-03-15' },
      { title: '写技术总结文章', completed: false, dueDate: '2024-03-31' }
    ]
  },
  {
    id: 2,
    name: '获取系统架构师认证',
    description: '完成系统架构师课程并通过认证考试',
    status: '进行中',
    progress: 40,
    priority: '高',
    startDate: '2024-02-01',
    deadline: '2024-06-30',
    milestones: [
      { title: '完成在线课程', completed: true, dueDate: '2024-04-30' },
      { title: '完成实战项目', completed: false, dueDate: '2024-05-31' },
      { title: '参加模拟考试', completed: false, dueDate: '2024-06-15' },
      { title: '通过认证考试', completed: false, dueDate: '2024-06-30' }
    ]
  },
  {
    id: 3,
    name: '建立个人技术品牌',
    description: '通过博客、演讲、开源等方式建立个人技术品牌',
    status: '进行中',
    progress: 30,
    priority: '中',
    startDate: '2024-01-01',
    deadline: '2024-12-31',
    milestones: [
      { title: '发布10篇技术文章', completed: false, dueDate: '2024-06-30' },
      { title: '参与1个开源项目', completed: false, dueDate: '2024-09-30' },
      { title: '参加技术分享会', completed: false, dueDate: '2024-11-30' },
      { title: '粉丝突破1000', completed: false, dueDate: '2024-12-31' }
    ]
  },
  {
    id: 4,
    name: '完成全栈开发项目',
    description: '使用最新技术栈完成一个完整的全栈Web应用',
    status: '待进行',
    progress: 0,
    priority: '中',
    startDate: '2024-04-01',
    deadline: '2024-07-31',
    milestones: [
      { title: '完成需求分析和设计', completed: false, dueDate: '2024-04-30' },
      { title: '完成后端API开发', completed: false, dueDate: '2024-05-31' },
      { title: '完成前端功能开发', completed: false, dueDate: '2024-06-30' },
      { title: '部署和上线', completed: false, dueDate: '2024-07-31' }
    ]
  },
  {
    id: 5,
    name: '晋升为技术主管',
    description: '具备技术主管所需的技能和经验，申报晋升',
    status: '进行中',
    progress: 55,
    priority: '高',
    startDate: '2023-06-01',
    deadline: '2024-12-31',
    milestones: [
      { title: '建立团队管理能力', completed: true, dueDate: '2024-06-30' },
      { title: '主导一个大项目', completed: true, dueDate: '2024-09-30' },
      { title: '培养2名初级工程师', completed: false, dueDate: '2024-11-30' },
      { title: '提交晋升申报', completed: false, dueDate: '2024-12-31' }
    ]
  },
  {
    id: 6,
    name: '改进代码质量',
    description: '将项目单元测试覆盖率提高到80%，代码复杂度降低20%',
    status: '已完成',
    progress: 100,
    priority: '中',
    startDate: '2024-01-01',
    deadline: '2024-03-31',
    milestones: [
      { title: '学习测试框架', completed: true, dueDate: '2024-01-31' },
      { title: '重构核心模块', completed: true, dueDate: '2024-02-28' },
      { title: '提高测试覆盖率到80%', completed: true, dueDate: '2024-03-15' },
      { title: '代码审查和优化', completed: true, dueDate: '2024-03-31' }
    ]
  }
])

const successStories = [
  {
    id: 1,
    goal: '精通Vue框架',
    timespan: '6个月',
    description: '从Vue基础到深入理解响应式系统，完成10+ 实战项目',
    results: ['开发高性能应用', '解决复杂问题', '指导他人'],
    reflection: '通过系统的学习和不断的实践，理解框架本质，才能真正掌握。'
  },
  {
    id: 2,
    goal: '技术演讲能力',
    timespan: '8个月',
    description: '从不敢演讲到成功组织和参加多场技术分享会',
    results: ['参加3场分享', '提升表达能力', '建立行业影响力'],
    reflection: '克服紧张，多次实践，最终能够自信地分享知识。'
  },
  {
    id: 3,
    goal: '开源贡献',
    timespan: '4个月',
    description: '为知名开源项目贡献代码，获得核心团队认可',
    results: ['10+ Pull Requests', '核心Contributor', '行业认可'],
    reflection: '参与开源是学习的最佳方式，也是建立专业网络的途径。'
  }
]

const completedGoals = computed(() => allGoals.value.filter(g => g.status === '已完成').length)
const inProgressGoals = computed(() => allGoals.value.filter(g => g.status === '进行中').length)
const pendingGoals = computed(() => allGoals.value.filter(g => g.status === '待进行').length)

const filteredGoals = computed(() => {
  if (selectedStatus.value === '全部') return allGoals.value
  return allGoals.value.filter(g => g.status === selectedStatus.value)
})

function addGoal() {
  if (!newGoal.value.name || !newGoal.value.deadline) {
    alert('请填写目标名称和截止日期')
    return
  }

  const today = new Date().toISOString().split('T')[0]
  allGoals.value.push({
    id: Math.max(...allGoals.value.map(g => g.id), 0) + 1,
    name: newGoal.value.name,
    description: newGoal.value.description,
    status: '待进行',
    progress: 0,
    priority: newGoal.value.priority,
    startDate: today,
    deadline: newGoal.value.deadline,
    milestones: []
  })

  newGoal.value = { name: '', description: '', deadline: '', priority: '中' }
  showAddGoal.value = false
}

function toggleMilestone(goalId, milestoneIdx) {
  const goal = allGoals.value.find(g => g.id === goalId)
  if (goal && goal.milestones[milestoneIdx]) {
    goal.milestones[milestoneIdx].completed = !goal.milestones[milestoneIdx].completed
    updateGoalProgress(goalId)
  }
}

function updateGoalProgress(goalId) {
  const goal = allGoals.value.find(g => g.id === goalId)
  if (goal && goal.milestones.length > 0) {
    const completed = goal.milestones.filter(m => m.completed).length
    goal.progress = Math.round((completed / goal.milestones.length) * 100)

    if (goal.progress === 100 && goal.status === '进行中') {
      goal.status = '已完成'
    } else if (goal.progress > 0 && goal.status === '待进行') {
      goal.status = '进行中'
    }
  }
}

function editGoal(goalId) {
  // 可在实际使用中实现编辑功能
  console.log('编辑目标:', goalId)
}

function deleteGoal(goalId) {
  const index = allGoals.value.findIndex(g => g.id === goalId)
  if (index !== -1) {
    allGoals.value.splice(index, 1)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.goal-milestones {
  padding: 2rem 0;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

/* Add Goal Section */
.add-goal-section {
  margin-bottom: 2rem;
}

.add-goal-btn {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.add-goal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.add-goal-form {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: slideDown 0.3s ease-out;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.8rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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
  background: #ecf0f1;
  color: #7f8c8d;
}

.btn-secondary:hover {
  background: #bdc3c7;
}

/* Goals Overview */
.goals-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border-left: 4px solid #3498db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-card.completed {
  border-left-color: #27ae60;
}

.stat-card.inprogress {
  border-left-color: #f39c12;
}

.stat-card.pending {
  border-left-color: #95a5a6;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #3498db;
  margin-bottom: 0.5rem;
}

.stat-card.completed .stat-number {
  color: #27ae60;
}

.stat-card.inprogress .stat-number {
  color: #f39c12;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

/* Goal Filters */
.goal-filters {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.6rem 1.2rem;
  border: 2px solid #ecf0f1;
  border-radius: 20px;
  background: white;
  color: #7f8c8d;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.filter-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
}

/* Goals Grid */
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.goal-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #3498db;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out;
}

.goal-card.status-进行中 {
  border-left-color: #f39c12;
}

.goal-card.status-已完成 {
  border-left-color: #27ae60;
}

.goal-card.status-待进行 {
  border-left-color: #95a5a6;
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* Card Header */
.card-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ecf0f1;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.goal-name {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.goal-status {
  padding: 0.3rem 0.8rem;
  background: #ecf0f1;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #7f8c8d;
}

.goal-status.status-进行中 {
  background: #fff3cd;
  color: #f39c12;
}

.goal-status.status-已完成 {
  background: #d4edda;
  color: #27ae60;
}

.goal-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

/* Progress Section */
.progress-section {
  margin-bottom: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-label {
  color: #7f8c8d;
  font-size: 0.85rem;
  font-weight: 600;
}

.progress-percentage {
  color: #3498db;
  font-weight: 700;
}

.progress-bar-wrapper {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  width: 100%;
  height: 100%;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

/* Milestones Section */
.milestones-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
  text-transform: uppercase;
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.milestone-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.milestone-text {
  flex: 1;
  color: #2c3e50;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.milestone-text.completed {
  text-decoration: line-through;
  color: #95a5a6;
}

.milestone-date {
  font-size: 0.8rem;
  color: #95a5a6;
  white-space: nowrap;
}

/* Timeline Info */
.timeline-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #2c3e50;
}

.timeline-icon {
  font-size: 1rem;
}

/* Priority Section */
.priority-section {
  margin-bottom: 1rem;
}

.priority-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #ecf0f1;
  color: #7f8c8d;
}

.priority-badge.priority-高 {
  background: #fff5f5;
  color: #e74c3c;
}

.priority-badge.priority-中 {
  background: #fff9e6;
  color: #f39c12;
}

.priority-badge.priority-低 {
  background: #f0fff4;
  color: #27ae60;
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
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.edit-btn {
  background: #f0f7ff;
  color: #3498db;
}

.edit-btn:hover {
  background: #3498db;
  color: white;
}

.delete-btn {
  background: #fff5f5;
  color: #e74c3c;
}

.delete-btn:hover {
  background: #e74c3c;
  color: white;
}

/* Timeline Visualization */
.timeline-visualization {
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
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
}

.timeline-entry {
  margin-bottom: 2rem;
  position: relative;
  animation: slideUp 0.5s ease-out;
}

.timeline-dot {
  position: absolute;
  left: -32px;
  top: 0;
  width: 16px;
  height: 16px;
  background: white;
  border: 3px solid #3498db;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
}

.timeline-content {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.timeline-goal {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.timeline-progress {
  font-weight: 700;
  color: #3498db;
}

.timeline-dates {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 0.8rem;
}

.timeline-mini-progress {
  width: 100%;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
}

.mini-bar {
  width: 100%;
  height: 100%;
}

.mini-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

/* Success Stories */
.success-stories {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.stories-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
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
  border-top: 3px solid #f39c12;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.story-goal {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.story-timespan {
  font-size: 0.85rem;
  color: #95a5a6;
  font-weight: 600;
}

.story-desc {
  color: #2c3e50;
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.story-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.result-tag {
  padding: 0.4rem 0.8rem;
  background: #f8f9fa;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #2c3e50;
}

.story-reflection {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-style: italic;
  margin: 0;
}

/* Tips and Advice */
.tips-advice {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.tip-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ecf0f1;
}

.tip-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.tip-card h4 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.tip-card p {
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

/* Responsive */
@media (max-width: 768px) {
  .goals-grid {
    grid-template-columns: 1fr;
  }

  .goals-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .stories-grid {
    grid-template-columns: 1fr;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
