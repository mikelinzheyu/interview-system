<template>
  <div class="career-planning-guide">
    <div class="guide-container">
      <div class="guide-header">
        <h2 class="guide-title">🛤️ 职业规划指南</h2>
        <p class="guide-subtitle">制定您的职业发展路线</p>
      </div>

      <div class="guide-content">
        <section v-for="(path, index) in careerPaths" :key="index" class="career-path">
          <h3 class="path-title">{{ path.title }}</h3>
          <p class="path-description">{{ path.description }}</p>

          <div class="stages">
            <div v-for="(stage, stageIndex) in path.stages" :key="stageIndex" class="stage-card">
              <div class="stage-number">阶段 {{ stageIndex + 1 }}</div>
              <h4 class="stage-title">{{ stage.title }}</h4>
              <p class="stage-duration">时长: {{ stage.duration }}</p>
              <p class="stage-salary">薪资: {{ stage.salary }}</p>

              <div class="required-skills">
                <p class="skills-label">所需技能:</p>
                <ul>
                  <li v-for="(skill, skillIndex) in stage.skills" :key="skillIndex">
                    {{ skill }}
                  </li>
                </ul>
              </div>

              <div class="key-tasks">
                <p class="tasks-label">关键任务:</p>
                <ul>
                  <li v-for="(task, taskIndex) in stage.tasks" :key="taskIndex">
                    {{ task }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="path-actions">
            <button class="btn-learn-more">了解更多</button>
            <button class="btn-roadmap">查看详细路线图</button>
          </div>
        </section>
      </div>

      <section class="action-plan">
        <h3 class="plan-title">📋 立即行动计划</h3>
        <div class="action-items">
          <div class="action-item">
            <div class="action-icon">1️⃣</div>
            <div class="action-content">
              <h4>第1步: 明确目标</h4>
              <p>根据推荐结果和就业数据，选择最适合的专业和职业路径</p>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">2️⃣</div>
            <div class="action-content">
              <h4>第2步: 制定计划</h4>
              <p>创建详细的学习和发展计划，设定短期和长期目标</p>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">3️⃣</div>
            <div class="action-content">
              <h4>第3步: 开始学习</h4>
              <p>利用推荐的学习资源，系统地学习所需的知识和技能</p>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">4️⃣</div>
            <div class="action-content">
              <h4>第4步: 实践应用</h4>
              <p>通过项目实战、实习等方式积累实际工作经验</p>
            </div>
          </div>

          <div class="action-item">
            <div class="action-icon">5️⃣</div>
            <div class="action-content">
              <h4>第5步: 持续优化</h4>
              <p>根据市场反馈不断调整计划，保持职业竞争力</p>
            </div>
          </div>
        </div>
      </section>

      <section class="tips-section">
        <h3 class="tips-title">💡 成功建议</h3>
        <div class="tips-grid">
          <div class="tip-card">
            <div class="tip-emoji">🎯</div>
            <h4>设定清晰目标</h4>
            <p>用SMART目标法则（具体、可测量、可达成、相关、有时限）制定目标</p>
          </div>

          <div class="tip-card">
            <div class="tip-emoji">📚</div>
            <h4>持续学习</h4>
            <p>技术更新快，需要每年投入20-30小时学习新技能</p>
          </div>

          <div class="tip-card">
            <div class="tip-emoji">🤝</div>
            <h4>建立人脉</h4>
            <p>参加行业活动，建立专业人脉，获得内推机会</p>
          </div>

          <div class="tip-card">
            <div class="tip-emoji">📊</div>
            <h4>定期评估</h4>
            <p>每季度回顾进度，调整策略，确保朝目标前进</p>
          </div>

          <div class="tip-card">
            <div class="tip-emoji">💪</div>
            <h4>做出成果</h4>
            <p>为工作中遇到的问题寻找创新解决方案</p>
          </div>

          <div class="tip-card">
            <div class="tip-emoji">🚀</div>
            <h4>提升自己</h4>
            <p>获得认证、论文、专利等成就来提升职业形象</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const careerPaths = [
  {
    title: '🚀 技术专家路线',
    description: '从初级工程师逐步晋升为技术领导者和架构师',
    stages: [
      {
        title: '初级工程师',
        duration: '1-2年',
        salary: '¥15K-20K',
        skills: ['编程基础', '代码规范', '版本控制'],
        tasks: ['学习编程语言', '参与项目开发', '代码审查']
      },
      {
        title: '中级工程师',
        duration: '2-4年',
        salary: '¥22K-28K',
        skills: ['系统设计', '性能优化', '团队协作'],
        tasks: ['架构设计', '技术方案', '知识分享']
      },
      {
        title: '高级工程师',
        duration: '4-6年',
        salary: '¥30K-40K',
        skills: ['系统架构', '技术决策', '业务理解'],
        tasks: ['技术规划', '团队培养', '创新研发']
      },
      {
        title: '技术专家/架构师',
        duration: '6年+',
        salary: '¥45K-70K',
        skills: ['战略规划', '技术领导', '行业洞察'],
        tasks: ['技术战略', '产品咨询', '学术研究']
      }
    ]
  },
  {
    title: '👔 管理路线',
    description: '从技术岗位转向管理角色，成为团队或部门负责人',
    stages: [
      {
        title: '技术工程师',
        duration: '1-3年',
        salary: '¥18K-25K',
        skills: ['技术基础', '项目经验', '沟通能力'],
        tasks: ['完成技术任务', '参与团队协作', '承担责任']
      },
      {
        title: '技术主管',
        duration: '3-5年',
        salary: '¥28K-35K',
        skills: ['人员管理', '项目管理', '业务理解'],
        tasks: ['团队管理', '项目计划', '绩效评估']
      },
      {
        title: '部门经理',
        duration: '5-8年',
        salary: '¥35K-50K',
        skills: ['战略规划', '资源配置', '领导力'],
        tasks: ['部门运营', '战略制定', '人才培养']
      },
      {
        title: '高管/总监',
        duration: '8年+',
        salary: '¥50K-100K+',
        skills: ['战略眼光', '组织能力', '商业思维'],
        tasks: ['公司战略', '跨部门协作', '业务增长']
      }
    ]
  },
  {
    title: '💡 创业路线',
    description: '积累经验后自主创业，构建自己的企业',
    stages: [
      {
        title: '学习积累期',
        duration: '3-5年',
        salary: '¥20K-30K',
        skills: ['技术深度', '产品思维', '业务理解'],
        tasks: ['学习运营', '观察市场', '积累资本']
      },
      {
        title: '准备启动期',
        duration: '1-2年',
        salary: '储备资金',
        skills: ['商业计划', '融资能力', '人脉拓展'],
        tasks: ['撰写商业计划', '融资准备', '找合伙人']
      },
      {
        title: '创业初期',
        duration: '1-3年',
        salary: '¥0-20K（投资阶段）',
        skills: ['全能管理', '快速迭代', '韧性'],
        tasks: ['产品开发', '市场验证', '融资发展']
      },
      {
        title: '扩展增长期',
        duration: '3年+',
        salary: '¥30K-200K+（取决于企业发展）',
        skills: ['团队建设', '融资管理', '战略规划'],
        tasks: ['融资扩展', '市场拓展', '团队建设']
      }
    ]
  }
]
</script>

<style scoped>
.career-planning-guide {
  padding: 2rem 0;
}

.guide-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.guide-header {
  text-align: center;
  margin-bottom: 1rem;
}

.guide-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.guide-subtitle {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.career-path {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: slideUp 0.5s ease-out;
}

.path-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.path-description {
  font-size: 1rem;
  color: #7f8c8d;
  margin: 0 0 2rem 0;
}

.stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stage-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f1 100%);
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.stage-number {
  font-size: 0.8rem;
  color: #95a5a6;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.stage-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.stage-duration,
.stage-salary {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0.25rem 0;
}

.required-skills,
.key-tasks {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.skills-label,
.tasks-label {
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.required-skills ul,
.key-tasks ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.required-skills li,
.key-tasks li {
  padding: 0.25rem 0 0.25rem 1.5rem;
  color: #34495e;
  position: relative;
}

.required-skills li:before,
.key-tasks li:before {
  content: '▸';
  position: absolute;
  left: 0;
  color: #3498db;
}

.path-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-learn-more,
.btn-roadmap {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-learn-more {
  background: #3498db;
  color: white;
}

.btn-learn-more:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-roadmap {
  background: white;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-roadmap:hover {
  background: #f0f7ff;
}

/* Action Plan */
.action-plan {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.plan-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 2rem 0;
  font-weight: 700;
  border-bottom: 3px solid #3498db;
  padding-bottom: 1rem;
}

.action-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
}

.action-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.action-content h4 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.action-content p {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
}

/* Tips Section */
.tips-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 2rem 0;
  font-weight: 700;
  border-bottom: 3px solid #27ae60;
  padding-bottom: 1rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.tip-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ecf0f1 100%);
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #ecf0f1;
  text-align: center;
  transition: all 0.3s ease;
}

.tip-card:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
  transform: translateY(-4px);
}

.tip-emoji {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.tip-card h4 {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.tip-card p {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
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

@media (max-width: 768px) {
  .guide-title {
    font-size: 1.5rem;
  }

  .stages {
    grid-template-columns: 1fr;
  }

  .action-item {
    flex-direction: column;
    text-align: center;
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}
</style>
