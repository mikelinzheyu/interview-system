export const noticeBar = {
  message: 'Pro 计划内测进行中，名额有限',
  emphasis: '解锁求职路上的 AI 超能力',
  cta: {
    label: '了解 Pro 计划',
    to: '/pricing'
  }
}

export const navItems = [
  { label: '首页', hash: '#hero' },
  { label: '产品', hash: '#product' },
  { label: '应用', hash: '#stats' },
  { label: '价格', hash: '#pricing' },
  { label: '招商', hash: '#partners' },
  { label: '关于', hash: '#about' }
]

export const heroContent = {
  badge: 'AI 面试官 · Pro 计划',
  titleMain: '解锁求职路上的',
  titleHighlight: 'AI 超能力',
  subtitle:
    '不仅是模拟面试。提供 GPT-5 MAX 深度分析、实时真题库及全方位求职辅助手段，助你快速上岸。',
  primaryCta: {
    label: '免费注册',
    to: '/register'
  },
  secondaryCta: {
    label: '了解 Pro 计划',
    to: '/pricing'
  },
  chips: ['关于首战首选', '性价之选', '灵活高效']
}

export const featureSection = {
  title: 'Pro 会员专属权益',
  subtitle: '比免费版更透明、更专业的一站式求职助理。',
  items: [
    {
      title: '优先接入 GPT-5 MAX / Claude 4.5',
      description:
        '使用更聪明的大模型，获得贴近真实面试官的高质量反馈，比免费版更聪明、更专业。',
      icon: 'Cpu'
    },
    {
      title: '2024 / 2025 最新企业真题库',
      description:
        '实时更新大厂与热门岗位真题，拒绝过时题目和套路题，精准覆盖目标岗位。',
      icon: 'Collection'
    },
    {
      title: '面试官视角深度心理侧写',
      description:
        '从技术深度、表达、结构化程度等维度拆解你的优势与风险点，知己知彼。',
      icon: 'DataLine'
    },
    {
      title: '简历 AI 润色（Pro 即将上线）',
      description:
        '针对目标岗位自动优化简历，提高简历通过率和面试邀约率。',
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
  title: '超过 50,000 名用户正在使用 AI 面试官 Pro',
  subtitle: '从在校生到职场 5 年+，都在用它做面试冲刺和长期能力提升。',
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
        '这个平台真的帮了我大忙！通过 Pro 计划的模拟面试，我成功拿到了心仪的 offer。'
    },
    {
      company: '林晓 · 产品经理',
      content:
        '深度能力分析功能太棒了，让我清楚地看到自己的强项和短板，面试更有底气。'
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
  title: '现在就让 AI 面试官陪你刷题',
  subtitle: '注册即可体验基础功能，随时升级 Pro 解锁更多 AI 超能力。',
  primaryCta: {
    label: '免费注册',
    to: '/register'
  },
  secondaryCta: {
    label: '了解 Pro 计划',
    to: '/pricing'
  }
}

