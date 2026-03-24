export const noticeBar = {
  message: '基于大模型的AI面试官',
  emphasis: '模拟面试与求职训练平台，帮助求职者高效准备真实面试',
  cta: {
    label: '了解详情',
    to: '/pricing'
  }
}

export const navItems = [
  { label: '首页', hash: '#hero' },
  { label: '产品', hash: '#product' },
  { label: '应用', hash: '#stats' },
  { label: '价格', hash: '#pricing' },
  { label: '常见问题', hash: '#faq' },
  { label: '招商', hash: '#partners' },
  { label: '关于', hash: '#about' }
]

export const heroContent = {
  badge: 'AI 面试官 · 基于大模型的求职面试训练平台',
  titleMain: 'AI面试官',
  titleHighlight: '基于大模型的模拟面试与求职面试训练平台',
  subtitle:
    'AI面试官基于大模型能力，为求职者提供真实、连贯、可追问的模拟面试体验。支持岗位定制提问、实时问答、答案点评、面试复盘与能力评估，帮助你系统提升面试表现。',
  primaryCta: {
    label: '免费开始模拟面试',
    to: '/register'
  },
  secondaryCta: {
    label: '了解 Pro 计划',
    to: '/pricing'
  },
  chips: ['岗位定制面试', '实时追问互动', '答案点评优化', '面试复盘报告', '能力评估']
}

export const featureSection = {
  title: 'AI面试官核心功能',
  subtitle: '提供完整的模拟面试与求职训练体验',
  items: [
    {
      title: '岗位定制模拟面试',
      description:
        '根据目标岗位与行业特点，生成高匹配度的面试题目，提供真实场景化的模拟面试体验，帮助求职者精准准备。',
      icon: 'Cpu'
    },
    {
      title: '多轮追问与实时问答',
      description:
        '支持对你的回答进行多轮追问，就像真实面试官一样，帮助你发现表达中的问题，提升临场应对能力。',
      icon: 'Collection'
    },
    {
      title: '答案点评与优化建议',
      description:
        '从技术深度、表达清晰度、结构化程度等维度对你的答案进行深度点评，给出具体改进建议，帮助你提升面试表现。',
      icon: 'DataLine'
    },
    {
      title: '面试复盘与能力评估',
      description:
        '完整的面试复盘报告，详细分析你的优势与不足，帮助你建立面试能力评估体系，持续改进与提升。',
      icon: 'EditPen'
    }
  ]
}

export const processFlow = {
  title: '从模拟到上岸的一站式流程',
  subtitle: '按照真实求职节奏设计的 4 步闭环，帮你高效准备每一场面试。',
  steps: [
    {
      title: '选择合适的 Pro 计划',
      description: '按周 / 月 / 季 / 年灵活选择，支持随时取消或续费。'
    },
    {
      title: '智能生成高匹配面试题',
      description: '根据目标岗位、方向和个人背景生成高匹配度面试题与练习计划。'
    },
    {
      title: 'AI 面试官深度打分解析',
      description: '从技术、表达、结构化等维度给出打分和改进建议，找到进步空间。'
    },
    {
      title: '针对性改进＋真题实战',
      description: '结合真题库与多轮模拟记录，迭代优化表现，把握每一次真实机会。'
    }
  ]
}

export const pricingSection = {
  title: 'Pro 价格方案',
  subtitle:
    '按周 / 月 / 季 / 年灵活升级，支持随时取消，可以拖动卡片调整对比顺序。',
  plans: [
    {
      name: '周卡 · 临时突击',
      price: '¥12.9 / 周',
      description: '效率突击 · 24h 面试急用',
      features: ['7 天有效期', '基础模拟面试', '基础能力分析', '基础题库访问'],
      cta: { label: '立即体验', to: '/pricing' }
    },
    {
      name: '月卡 · 灵活高效',
      price: '¥39 / 月',
      description: '灵活高效 · 新手上岸',
      features: [
        '30 天有效期',
        '无限模拟面试',
        '深度能力分析（GPT-5 MAX）',
        '优先级支持',
        '全真题库解锁'
      ],
      cta: { label: '查看详情', to: '/pricing' }
    },
    {
      name: '季卡 · 首战首选',
      price: '¥79 / 季',
      description: '关于首战首选 · 赠 1 个月',
      features: [
        '90 (+30) 天有效期',
        '无限模拟面试',
        '深度能力分析',
        'VIP 社区支持',
        '专属咨询通道',
        '简历 AI 润色'
      ],
      featured: true,
      cta: { label: '首选此方案', to: '/pricing' }
    },
    {
      name: '年卡 · 性价比之选',
      price: '¥199 / 年',
      description: '长期复盘 · 性价比之选',
      features: [
        '365 天有效期',
        '无限模拟面试',
        '深度能力分析',
        'VIP 社区支持',
        '所有 Pro 功能解锁'
      ],
      cta: { label: '了解更多', to: '/pricing' }
    }
  ]
}

export const partnerSection = {
  title: '渠道合作与生态伙伴计划',
  subtitle: '携手共建人才智能化生态，开放 API 与联合市场活动。',
  highlights: [
    {
      title: '联合解决方案',
      description:
        '与 HR SaaS、招聘平台等伙伴共同打造多种求职场景解决方案。'
    },
    {
      title: '营销支持',
      description:
        '提供联合营销物料、活动资源与培训体系，实现双向获客共赢。'
    },
    {
      title: '技术对接',
      description:
        '开放接口、SDK、私有部署方案，快速集成到现有系统。'
    }
  ],
  action: {
    label: '申请成为合作伙伴',
    to: '/register'
  }
}

export const testimonialBanner = {
  title: '超过 50,000 名求职者正在使用 AI面试官',
  subtitle: '从在校生到职场 5 年+，都在用它进行模拟面试与面试训练。',
  stats: [
    { label: '活跃用户', value: '50K+' },
    { label: '累计面试次数', value: '100K+' },
    { label: '用户评分', value: '4.8/5' },
    { label: '满意度', value: '99%' }
  ],
  quotes: [
    {
      company: '陈远 · 软件工程师',
      content:
        'AI面试官的模拟面试体验真的很逼真！通过多轮追问和答案点评，我快速发现了自己表达中的问题，成功拿到了心仪的 offer。'
    },
    {
      company: '林晓 · 产品经理',
      content:
        '面试复盘报告让我清楚地看到自己的强项和短板，针对性地改进后，面试通过率明显提高了。'
    }
  ]
}

export const contactOptions = [
  {
    type: 'phone',
    label: '电话咨询',
    value: '400-800-9988'
  },
  {
    type: 'wechat',
    label: '微信咨询',
    value: '扫码添加企业微信'
  },
  {
    type: 'video',
    label: '观看演示',
    value: '播放产品演示视频'
  }
]

export const footerCta = {
  title: '现在开始使用 AI面试官',
  subtitle: '通过智能模拟面试与专业点评，帮助你系统提升面试表现，高效准备真实面试。',
  primaryCta: {
    label: '免费开始模拟面试',
    to: '/register'
  },
  secondaryCta: {
    label: '了解 Pro 计划',
    to: '/pricing'
  }
}

