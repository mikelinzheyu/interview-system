<template>
  <div class="career-roadmap">
    <!-- Header -->
    <div class="roadmap-header">
      <h2 class="roadmap-title">🗺️ 职业发展路线图</h2>
      <p class="roadmap-desc">基于您的专业和兴趣，规划清晰的职业发展道路</p>
    </div>

    <!-- Path Selector -->
    <div class="path-selector">
      <div class="selector-label">选择您的职业发展方向：</div>
      <div class="path-buttons">
        <button
          v-for="path in careerPaths"
          :key="path.id"
          class="path-btn"
          :class="{ active: selectedPath === path.id }"
          @click="selectPath(path.id)"
        >
          <span class="path-icon">{{ path.icon }}</span>
          <span class="path-name">{{ path.name }}</span>
          <span class="path-duration">{{ path.duration }}</span>
        </button>
      </div>
    </div>

    <!-- Timeline Visualization -->
    <div class="roadmap-timeline">
      <!-- Active Path Details -->
      <div class="path-details">
        <h3 class="path-title">{{ activePath.name }}</h3>
        <p class="path-description">{{ activePath.description }}</p>

        <!-- Timeline -->
        <div class="timeline">
          <div
            v-for="(stage, index) in activePath.stages"
            :key="index"
            class="timeline-stage"
            :style="{ animationDelay: `${index * 0.15}s` }"
          >
            <!-- Stage Header -->
            <div class="stage-header">
              <div class="stage-number">{{ index + 1 }}</div>
              <div class="stage-info">
                <h4 class="stage-name">{{ stage.name }}</h4>
                <p class="stage-duration">{{ stage.duration }}</p>
              </div>
              <div class="stage-salary">{{ stage.salaryRange }}</div>
            </div>

            <!-- Stage Details -->
            <div class="stage-details">
              <div class="detail-section">
                <h5 class="detail-title">📋 主要职责</h5>
                <ul class="detail-list">
                  <li v-for="(task, idx) in stage.mainTasks" :key="idx">
                    {{ task }}
                  </li>
                </ul>
              </div>

              <div class="detail-section">
                <h5 class="detail-title">📚 核心技能</h5>
                <div class="skills-grid">
                  <div
                    v-for="(skill, idx) in stage.coreSkills"
                    :key="idx"
                    class="skill-tag"
                  >
                    {{ skill }}
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h5 class="detail-title">🎯 发展目标</h5>
                <ul class="detail-list">
                  <li v-for="(goal, idx) in stage.goals" :key="idx">
                    {{ goal }}
                  </li>
                </ul>
              </div>

              <div class="detail-section">
                <h5 class="detail-title">⚡ 关键活动</h5>
                <ul class="detail-list">
                  <li v-for="(activity, idx) in stage.keyActivities" :key="idx">
                    {{ activity }}
                  </li>
                </ul>
              </div>

              <div class="detail-section">
                <h5 class="detail-title">📊 成功指标</h5>
                <ul class="detail-list">
                  <li v-for="(metric, idx) in stage.successMetrics" :key="idx">
                    {{ metric }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- Progression Arrow -->
            <div v-if="index < activePath.stages.length - 1" class="progression-arrow">
              <span>↓</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Success Factors -->
    <div class="success-factors">
      <h3 class="factors-title">🌟 成功要素</h3>
      <div class="factors-grid">
        <div
          v-for="(factor, index) in activePath.successFactors"
          :key="index"
          class="factor-card"
        >
          <div class="factor-icon">{{ factor.icon }}</div>
          <div class="factor-content">
            <h4 class="factor-name">{{ factor.name }}</h4>
            <p class="factor-desc">{{ factor.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Growth Mindset Tips -->
    <div class="growth-tips">
      <h3 class="tips-title">💡 成长建议</h3>
      <div class="tips-container">
        <div
          v-for="(tip, index) in growthTips"
          :key="index"
          class="tip-card"
          :class="tip.category"
        >
          <div class="tip-category">{{ tip.category }}</div>
          <h4 class="tip-title">{{ tip.title }}</h4>
          <p class="tip-content">{{ tip.content }}</p>
          <div class="tip-action">
            <button class="action-btn">了解更多</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison with Industry Trends -->
    <div class="industry-trends">
      <h3 class="trends-title">📈 行业趋势对比</h3>
      <div class="trends-grid">
        <div class="trend-card">
          <h4>平均职业发展周期</h4>
          <div class="trend-value">8-10年</div>
          <p class="trend-desc">从初级到中高管理层</p>
        </div>
        <div class="trend-card">
          <h4>技能更新频率</h4>
          <div class="trend-value">18-24个月</div>
          <p class="trend-desc">应学习新技能或升级知识</p>
        </div>
        <div class="trend-card">
          <h4>平均薪资增长</h4>
          <div class="trend-value">15-25%/年</div>
          <p class="trend-desc">初职期间年均增长比例</p>
        </div>
        <div class="trend-card">
          <h4>晋升周期</h4>
          <div class="trend-value">3-5年</div>
          <p class="trend-desc">平均每次职位升级间隔</p>
        </div>
      </div>
    </div>

    <!-- Action Plan -->
    <div class="action-plan">
      <h3 class="plan-title">📝 您的行动计划</h3>
      <div class="plan-timeline">
        <div class="plan-phase">
          <div class="phase-badge">短期(1-3月)</div>
          <ul class="plan-list">
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>评估当前技能水平</span>
            </li>
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>制定具体的学习计划</span>
            </li>
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>寻找导师或学习伙伴</span>
            </li>
          </ul>
        </div>

        <div class="plan-phase">
          <div class="phase-badge">中期(3-12月)</div>
          <ul class="plan-list">
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>完成核心技能培训</span>
            </li>
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>积累实际项目经验</span>
            </li>
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>建立专业网络</span>
            </li>
          </ul>
        </div>

        <div class="plan-phase">
          <div class="phase-badge">长期(1-3年)</div>
          <ul class="plan-list">
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>晋升到更高职位</span>
            </li>
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>建立行业影响力</span>
            </li>
            <li>
              <input type="checkbox" class="plan-checkbox" />
              <span>成为团队领导者</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Resource Recommendations -->
    <div class="resource-recommendations">
      <h3 class="resource-title">📚 学习资源推荐</h3>
      <div class="resource-categories">
        <div class="resource-category">
          <h4 class="category-name">📖 在线课程</h4>
          <div class="resource-list">
            <div class="resource-item">
              <span class="resource-platform">Coursera</span>
              <span class="resource-name">{{ activePath.resources?.courses?.[0] || '专业发展课程' }}</span>
              <span class="resource-level">进阶</span>
            </div>
            <div class="resource-item">
              <span class="resource-platform">LinkedIn Learning</span>
              <span class="resource-name">{{ activePath.resources?.courses?.[1] || '领导力课程' }}</span>
              <span class="resource-level">进阶</span>
            </div>
          </div>
        </div>

        <div class="resource-category">
          <h4 class="category-name">📕 推荐书籍</h4>
          <div class="resource-list">
            <div class="resource-item">
              <span class="resource-author">专业发展</span>
              <span class="resource-name">{{ activePath.resources?.books?.[0] || '职业发展指南' }}</span>
              <span class="resource-rating">⭐⭐⭐⭐⭐</span>
            </div>
            <div class="resource-item">
              <span class="resource-author">技能提升</span>
              <span class="resource-name">{{ activePath.resources?.books?.[1] || '技能进阶手册' }}</span>
              <span class="resource-rating">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>

        <div class="resource-category">
          <h4 class="category-name">🎯 认证考试</h4>
          <div class="resource-list">
            <div class="resource-item">
              <span class="resource-cert">行业证书</span>
              <span class="resource-name">{{ activePath.resources?.certifications?.[0] || '专业认证' }}</span>
              <span class="resource-difficulty">高</span>
            </div>
            <div class="resource-item">
              <span class="resource-cert">技能证书</span>
              <span class="resource-name">{{ activePath.resources?.certifications?.[1] || '技能证书' }}</span>
              <span class="resource-difficulty">中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecommendationStore } from '@/stores/recommendations'

const recommendationStore = useRecommendationStore()
const selectedPath = ref('technical')

// Career paths data
const careerPaths = [
  {
    id: 'technical',
    name: '🛠️ 技术专家路线',
    icon: '🛠️',
    duration: '8-10年'
  },
  {
    id: 'management',
    name: '👔 管理领导路线',
    icon: '👔',
    duration: '10-12年'
  },
  {
    id: 'entrepreneurship',
    name: '🚀 创业创新路线',
    icon: '🚀',
    duration: '7-10年'
  }
]

const pathsData = {
  technical: {
    name: '技术专家发展路线',
    icon: '🛠️',
    duration: '8-10年',
    description: '致力于成为技术领域的深度专家，通过不断学习和实践，掌握前沿技术，解决复杂问题，获得行业认可。',
    stages: [
      {
        name: '初级工程师',
        duration: '0-2年',
        salaryRange: '¥15K-25K',
        mainTasks: [
          '学习和适应公司技术栈',
          '完成分配的开发任务',
          '修复bug和维护代码',
          '积极参与团队讨论'
        ],
        coreSkills: [
          '编程基础',
          '代码规范',
          '版本控制',
          '问题解决'
        ],
        goals: [
          '独立完成中等复杂度功能',
          '理解项目架构',
          '通过代码审查',
          '建立技术基础'
        ],
        keyActivities: [
          '完成3-5个完整项目',
          '写技术文档',
          '参加技术分享',
          '阅读源代码'
        ],
        successMetrics: [
          '任务完成率 > 90%',
          '代码审查反馈改进',
          'bug修复及时性',
          '学习新技术速度'
        ]
      },
      {
        name: '中级工程师',
        duration: '2-5年',
        salaryRange: '¥25K-40K',
        mainTasks: [
          '独立设计和实现功能模块',
          '优化代码性能',
          '指导初级工程师',
          '参与架构设计'
        ],
        coreSkills: [
          '系统设计',
          '性能优化',
          '代码架构',
          '技术方案'
        ],
        goals: [
          '成为某个领域的技术点',
          '能够独立设计大功能',
          '提升代码质量',
          '积累项目经验'
        ],
        keyActivities: [
          '主导2-3个重要项目',
          '分享技术博客',
          '参加行业会议',
          '开源贡献'
        ],
        successMetrics: [
          '设计能力评分',
          '技术博客影响力',
          '项目交付质量',
          '团队反馈得分'
        ]
      },
      {
        name: '高级工程师',
        duration: '5-8年',
        salaryRange: '¥40K-60K',
        mainTasks: [
          '技术方向决策',
          '架构设计和优化',
          '团队技术规划',
          '复杂问题解决'
        ],
        coreSkills: [
          '整体架构',
          '技术视野',
          '问题诊断',
          '团队建设'
        ],
        goals: [
          '成为技术领域权威',
          '建立个人品牌',
          '指导更多工程师',
          '解决行业难题'
        ],
        keyActivities: [
          '发表技术演讲',
          '出版技术文章',
          '参与技术评审',
          '指导初中级工程师'
        ],
        successMetrics: [
          '行业认可度',
          '团队成长情况',
          '技术创新成果',
          '影响力范围'
        ]
      },
      {
        name: '技术专家/架构师',
        duration: '8-10年+',
        salaryRange: '¥60K-100K+',
        mainTasks: [
          '公司技术战略规划',
          '重大技术决策',
          '新技术探索',
          '行业影响力建设'
        ],
        coreSkills: [
          '战略思维',
          '产业认知',
          '技术前瞻',
          '生态建设'
        ],
        goals: [
          '成为行业领袖',
          '建立技术生态',
          '推动技术进步',
          '获得行业认可'
        ],
        keyActivities: [
          '主持技术论坛',
          '参与标准制定',
          '建立开源项目',
          '行业政策参与'
        ],
        successMetrics: [
          '国际认可度',
          '开源项目成就',
          '行业影响力',
          '后辈培养数'
        ]
      }
    ],
    successFactors: [
      {
        icon: '📚',
        name: '持续学习',
        description: '技术日新月异，需要不断学习新技术、新框架，保持技术敏感度'
      },
      {
        icon: '🛠️',
        name: '动手实践',
        description: '理论结合实践，通过项目、开源贡献积累真实经验'
      },
      {
        icon: '📊',
        name: '问题导向',
        description: '关注实际问题，用技术解决真实需求，而不是技术为技术'
      },
      {
        icon: '🤝',
        name: '知识分享',
        description: '通过写文章、做分享、指导他人，巩固知识并建立影响力'
      },
      {
        icon: '🔬',
        name: '深度思考',
        description: '不只会用，要理解原理，挖掘问题本质，追求极致'
      },
      {
        icon: '🌐',
        name: '生态参与',
        description: '参与开源、行业组织，建立专业网络，扩大行业影响'
      }
    ],
    resources: {
      courses: [
        '高级系统设计',
        '分布式系统架构'
      ],
      books: [
        '《设计数据密集型应用》',
        '《深入理解计算机系统》'
      ],
      certifications: [
        '系统架构设计师',
        '云计算认证工程师'
      ]
    }
  },
  management: {
    name: '管理领导发展路线',
    icon: '👔',
    duration: '10-12年',
    description: '通过技术和管理相结合，逐步提升领导力，最终成为具有战略眼光的管理者。',
    stages: [
      {
        name: '技术主管',
        duration: '0-3年',
        salaryRange: '¥25K-35K',
        mainTasks: [
          '管理5-8人技术团队',
          '制定技术规划',
          '绩效考核',
          '招聘面试'
        ],
        coreSkills: ['人员管理', '规划能力', '沟通技能', '决策能力'],
        goals: ['建立高效团队', '提升团队产出', '发展员工'],
        keyActivities: ['团队建设', '一对一谈话', '制定KPI'],
        successMetrics: ['团队绩效', '员工满意度', '人才晋升']
      },
      {
        name: '部门经理',
        duration: '3-6年',
        salaryRange: '¥35K-55K',
        mainTasks: [
          '管理20-50人团队',
          '部门战略规划',
          '跨部门协作',
          '人才培养'
        ],
        coreSkills: ['战略思维', '团队管理', '资源规划', '沟通协调'],
        goals: ['部门目标达成', '团队能力提升', '建立人才梯队'],
        keyActivities: ['战略制定', '流程优化', '人才培养'],
        successMetrics: ['部门KPI完成率', '人才留存率', '创新成果数']
      },
      {
        name: '事业部总经理',
        duration: '6-10年',
        salaryRange: '¥55K-80K',
        mainTasks: [
          '管理100+人团队',
          '事业部业务规划',
          '商业目标制定',
          '利润中心管理'
        ],
        coreSkills: ['商业思维', '战略规划', '财务管理', '领导力'],
        goals: ['业务目标达成', '利润增长', '市场地位提升'],
        keyActivities: ['商业决策', '融资合作', '并购整合'],
        successMetrics: ['营收增长', '利润率', '市场份额']
      },
      {
        name: '副总裁/CTO',
        duration: '10-12年+',
        salaryRange: '¥80K-150K+',
        mainTasks: [
          '公司战略决策',
          '重大人事任免',
          '资本运作',
          '产业生态建设'
        ],
        coreSkills: ['战略眼光', '领导力', '金融素养', '行业认知'],
        goals: ['公司发展', '团队建设', '行业影响'],
        keyActivities: ['董事会参与', '融资', '并购'],
        successMetrics: ['公司估值', '市场认可', '行业地位']
      }
    ],
    successFactors: [
      {
        icon: '👥',
        name: '人才发展',
        description: '管理本质是通过他人实现目标，需要持续培养和发展团队成员'
      },
      {
        icon: '🎯',
        name: '目标导向',
        description: '清晰的目标设定和执行力是管理者必备素质'
      },
      {
        icon: '💬',
        name: '沟通表达',
        description: '有效的沟通是管理的关键，需要向上、向下、平行多向沟通'
      },
      {
        icon: '🔄',
        name: '变革管理',
        description: '适应和推动变化，在不确定中做出决策，引导团队前进'
      },
      {
        icon: '📈',
        name: '业务敏感',
        description: '理解商业逻辑，能够从业务角度思考问题，平衡多方利益'
      },
      {
        icon: '🎓',
        name: '终身学习',
        description: '管理是一门学问，需要不断学习新知识、新方法、新理念'
      }
    ],
    resources: {
      courses: ['管理者领导力训练', '战略规划与执行'],
      books: ['《高效能人士的7个习惯》', '《组织行为学》'],
      certifications: ['MBA课程', '高管领导力认证']
    }
  },
  entrepreneurship: {
    name: '创业创新发展路线',
    icon: '🚀',
    duration: '7-10年',
    description: '利用技术和市场洞察，从0到1创建新事业，实现商业价值和社会影响。',
    stages: [
      {
        name: '创业准备期',
        duration: '0-1年',
        salaryRange: '灵活',
        mainTasks: [
          '市场调研和分析',
          '技术可行性验证',
          '商业模式设计',
          '融资准备'
        ],
        coreSkills: ['市场分析', '技术评估', '商业计划', '融资沟通'],
        goals: ['完成产品MVP', '获得天使融资', '确认市场机会'],
        keyActivities: ['用户调研', '原型开发', '投资人沟通'],
        successMetrics: ['融资完成', '用户反馈', '市场验证']
      },
      {
        name: '初创阶段',
        duration: '1-3年',
        salaryRange: '期权+补偿',
        mainTasks: [
          '产品快速迭代',
          '团队招聘建设',
          '市场拓展',
          'A轮融资'
        ],
        coreSkills: ['产品管理', '团队建设', '融资能力', '市场运营'],
        goals: ['产品市场匹配', '团队建立', '获得A轮融资'],
        keyActivities: ['用户增长', '融资路演', '合作洽谈'],
        successMetrics: ['用户数', '融资额', '市场反馈']
      },
      {
        name: '高速增长期',
        duration: '3-7年',
        salaryRange: '股权价值',
        mainTasks: [
          '规模化增长',
          '产品线扩展',
          '国际化扩张',
          '融资和投资'
        ],
        coreSkills: ['规模化运营', '战略规划', '融资', '资本运作'],
        goals: ['达到行业领先', '获得B/C轮融资', '建立品牌'],
        keyActivities: ['并购整合', '国际市场', '战略合作'],
        successMetrics: ['估值增长', '市场占有率', '用户活跃度']
      },
      {
        name: '收益和出口',
        duration: '7-10年+',
        salaryRange: '价值兑现',
        mainTasks: [
          '上市或并购',
          '商业模式优化',
          '生态建设',
          '社会影响'
        ],
        coreSkills: ['资本操作', '战略眼光', '生态思维', '领导力'],
        goals: ['成功上市或被收购', '行业龙头地位', '社会贡献'],
        keyActivities: ['IPO准备', '生态合作', '行业引领'],
        successMetrics: ['上市估值', '市场地位', '长期价值']
      }
    ],
    successFactors: [
      {
        icon: '💡',
        name: '创新思维',
        description: '敢于挑战现状，寻找市场痛点，创新性地解决问题'
      },
      {
        icon: '🎯',
        name: '市场敏感',
        description: '深刻理解市场需求，能够抓住机遇，快速调整方向'
      },
      {
        icon: '💪',
        name: '执行力',
        description: '创意落地需要强大的执行力，快速验证、快速迭代'
      },
      {
        icon: '🤝',
        name: '融资能力',
        description: '融资是创业的血液，需要学会讲故事、吸引投资者'
      },
      {
        icon: '👥',
        name: '团队建设',
        description: '创业是团队运动，需要吸引和保留优秀人才'
      },
      {
        icon: '🌟',
        name: '持续学习',
        description: '创业者需要快速学习，适应市场变化和新的技术趋势'
      }
    ],
    resources: {
      courses: ['创业基础课程', '融资和融资策略'],
      books: ['《创业维艰》', '《精益创业》'],
      certifications: ['创业加速营', '天使投资人培训']
    }
  }
}

// Growth tips
const growthTips = [
  {
    category: '学习与发展',
    title: '制定个人学习计划',
    content: '每月设定具体的学习目标，学习新技能或深化专业知识。通过在线课程、书籍、项目实践等多种方式学习。'
  },
  {
    category: '人脉与交流',
    title: '建立专业网络',
    content: '参加行业会议、技术分享、校友聚会等，与同行交流，建立长期的专业关系。'
  },
  {
    category: '项目经验',
    title: '参与重点项目',
    content: '主动承担有挑战的项目，在项目中锻炼能力、展示价值、积累经验。'
  },
  {
    category: '知识分享',
    title: '分享你的经验',
    content: '通过写文章、做演讲、指导他人，巩固知识、建立影响力、获得认可。'
  },
  {
    category: '导师指导',
    title: '寻找和利用导师',
    content: '找一位资深的导师，定期沟通、获取建议、加快成长。同时，后来也要成为他人的导师。'
  },
  {
    category: '目标管理',
    title: '设定SMART目标',
    content: '明确、可衡量、可达成、相关、有时限的目标，定期审视和调整。'
  }
]

// Computed
const activePath = computed(() => pathsData[selectedPath.value] || pathsData.technical)

// Functions
function selectPath(pathId) {
  selectedPath.value = pathId
}
</script>

<style scoped>
.career-roadmap {
  padding: 2rem 0;
}

/* Header */
.roadmap-header {
  text-align: center;
  margin-bottom: 2.5rem;
  animation: slideDown 0.5s ease-out;
}

.roadmap-title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.roadmap-desc {
  color: #7f8c8d;
  margin: 0;
  font-size: 1rem;
}

/* Path Selector */
.path-selector {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.selector-label {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 600;
}

.path-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.path-btn {
  padding: 1.5rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.8rem;
}

.path-btn:hover {
  border-color: #3498db;
  background: #f0f7ff;
  transform: translateY(-2px);
}

.path-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-color: #2980b9;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.path-icon {
  font-size: 2rem;
}

.path-name {
  font-size: 1rem;
  font-weight: 600;
}

.path-duration {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* Roadmap Timeline */
.roadmap-timeline {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.path-details {
  animation: fadeIn 0.5s ease-out;
}

.path-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.path-description {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

/* Timeline */
.timeline {
  position: relative;
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

.timeline-stage {
  margin-left: 80px;
  margin-bottom: 3rem;
  animation: slideUp 0.5s ease-out;
  position: relative;
}

.timeline-stage::before {
  content: '';
  position: absolute;
  left: -70px;
  top: 0;
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #3498db;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2);
}

.timeline-stage::after {
  content: '';
  position: absolute;
  left: -54px;
  top: 26px;
  width: 4px;
  height: 40px;
  background: #ecf0f1;
}

.timeline-stage:last-child::after {
  display: none;
}

/* Stage Header */
.stage-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #ecf0f1;
}

.stage-number {
  min-width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}

.stage-info {
  flex: 1;
}

.stage-name {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.stage-duration {
  color: #95a5a6;
  margin: 0.3rem 0 0 0;
  font-size: 0.9rem;
}

.stage-salary {
  font-size: 1.2rem;
  color: #27ae60;
  font-weight: 700;
  padding: 0.5rem 1rem;
  background: #f0fff4;
  border-radius: 6px;
}

/* Stage Details */
.stage-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-section {
  padding: 0;
}

.detail-title {
  font-size: 0.95rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.detail-list li {
  padding: 0.5rem 0;
  color: #2c3e50;
  font-size: 0.95rem;
  position: relative;
  padding-left: 1.5rem;
}

.detail-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #27ae60;
  font-weight: 700;
}

.skills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.skill-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Progression Arrow */
.progression-arrow {
  text-align: center;
  margin-top: 1.5rem;
  color: #3498db;
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(10px);
  }
}

/* Success Factors */
.success-factors {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid rgba(52, 152, 219, 0.1);
}

.factors-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.factors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.factor-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  display: flex;
  gap: 1rem;
  animation: slideUp 0.5s ease-out;
}

.factor-icon {
  font-size: 2rem;
  min-width: 50px;
  text-align: center;
}

.factor-content {
  flex: 1;
}

.factor-name {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.factor-desc {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

/* Growth Tips */
.growth-tips {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.tips-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tip-card {
  padding: 1.5rem;
  border-radius: 8px;
  border-top: 4px solid #3498db;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.tip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tip-card.学习与发展 {
  border-top-color: #3498db;
}

.tip-card.人脉与交流 {
  border-top-color: #9b59b6;
}

.tip-card.项目经验 {
  border-top-color: #e67e22;
}

.tip-card.知识分享 {
  border-top-color: #1abc9c;
}

.tip-card.导师指导 {
  border-top-color: #e74c3c;
}

.tip-card.目标管理 {
  border-top-color: #27ae60;
}

.tip-category {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: white;
  color: #2c3e50;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.tip-title {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.8rem 0;
  font-weight: 700;
}

.tip-content {
  color: #7f8c8d;
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.tip-action {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #3498db;
  color: #3498db;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.action-btn:hover {
  background: #3498db;
  color: white;
}

/* Industry Trends */
.industry-trends {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.trends-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.trend-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  text-align: center;
  border: 1px solid #ecf0f1;
}

.trend-card h4 {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0 0 0.8rem 0;
  font-weight: 600;
  text-transform: uppercase;
}

.trend-value {
  font-size: 1.8rem;
  color: #3498db;
  font-weight: 700;
  margin: 0 0 0.8rem 0;
}

.trend-desc {
  color: #2c3e50;
  font-size: 0.9rem;
  margin: 0;
}

/* Action Plan */
.action-plan {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(52, 152, 219, 0.1) 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.plan-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.plan-timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.plan-phase {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #27ae60;
}

.phase-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.plan-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-list li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 0;
  color: #2c3e50;
  font-size: 0.95rem;
  border-bottom: 1px solid #ecf0f1;
}

.plan-list li:last-child {
  border-bottom: none;
}

.plan-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Resource Recommendations */
.resource-recommendations {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.resource-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.resource-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.resource-category {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ecf0f1;
}

.resource-category:last-child {
  border-bottom: none;
}

.category-name {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.resource-platform,
.resource-author,
.resource-cert {
  flex: 0 0 auto;
  min-width: 80px;
  padding: 0.4rem 0.8rem;
  background: #ecf0f1;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7f8c8d;
  text-transform: uppercase;
}

.resource-name {
  flex: 1;
  color: #2c3e50;
  font-weight: 600;
}

.resource-level,
.resource-rating,
.resource-difficulty {
  flex: 0 0 auto;
  color: #3498db;
  font-weight: 600;
  font-size: 0.9rem;
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
  .path-buttons {
    grid-template-columns: 1fr;
  }

  .timeline::before {
    left: 10px;
  }

  .timeline-stage {
    margin-left: 50px;
  }

  .timeline-stage::before {
    left: -43px;
  }

  .stage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .factors-grid,
  .tips-container,
  .trends-grid,
  .plan-timeline,
  .resource-categories {
    grid-template-columns: 1fr;
  }

  .stage-details {
    grid-template-columns: 1fr;
  }

  .roadmap-title {
    font-size: 1.5rem;
  }
}
</style>
