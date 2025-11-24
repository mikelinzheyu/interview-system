<template>
  <div class="pricing-page">
    <!-- Hero -->
    <header class="pricing-hero">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <button class="recover-btn">恢复购买</button>

      <div class="hero-content">
        <span class="hero-badge">
          <el-icon><i class="el-icon-magic-stick" /></el-icon>
          PRO 会员升级
        </span>
        <h1>
          解锁求职路上的
          <span class="gradient-text">AI 超能力</span>
        </h1>
        <p class="hero-subtitle">
          不仅是模拟面试。提供 GPT-5 MAX 深度分析，实时真题库及全方位求职辅助，助你快速上岸。
        </p>
        <div class="hero-chips">
          <span class="chip">关于首战首选</span>
          <span class="chip success">性价比之选</span>
          <span class="chip soft">灵活高效</span>
        </div>
      </div>
    </header>

    <!-- Billing toggle -->
    <section class="hero-toggle">
      <div class="toggle-billing">
        <button
          :class="['toggle-btn', { active: billingCycle === 'month' }]"
          @click="billingCycle = 'month'"
        >
          按月付款
        </button>
        <button
          :class="['toggle-btn', { active: billingCycle === 'year' }]"
          @click="billingCycle = 'year'"
        >
          按年付款<span class="save-badge">节省 30%</span>
        </button>
      </div>
    </section>

    <!-- Pricing Cards Section -->
    <section class="pricing-cards-section">
      <div class="pricing-cards-container">
        <PricingCard
          v-for="plan in pricingPlans"
          :key="plan.id"
          :plan="plan"
          :is-highlighted="plan.id === selectedPlanId"
          action-button-text="选择此方案"
          @select="handlePlanSelect"
        />
      </div>
    </section>

    <!-- Benefits Section -->
    <BenefitsGrid />

    <!-- Social Proof Section -->
    <SocialProof />

    <!-- FAQ Section -->
    <FAQSection />

    <!-- CTA Footer -->
    <section class="cta-footer">
      <div class="cta-content">
        <h2>准备好开始了吗？</h2>
        <p>加入数千名正在使用 Pro 计划的用户</p>
        <button class="cta-btn">立即升级 Pro</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import PricingCard from '@/components/pricing/PricingCard.vue'
import BenefitsGrid from '@/components/pricing/BenefitsGrid.vue'
import SocialProof from '@/components/pricing/SocialProof.vue'
import FAQSection from '@/components/pricing/FAQSection.vue'

const router = useRouter()
const billingCycle = ref<'month' | 'year'>('month')
const selectedPlanId = ref('quarterly')

interface Plan {
  id: string
  name: string
  description: string
  price: string | number
  period: string
  benefits: string[]
  savings?: string
}

const pricingPlans = ref<Plan[]>([
  {
    id: 'weekly',
    name: '周卡',
    description: '效率突击 · 24h 面试急用',
    price: 12.9,
    period: '/周',
    badge: '临时突击',
    tag: '急用度首选',
    note: '24 小时内有面试？¥12.9 立即抢佛脚，高效准备。',
    footer: '急用度首选',
    benefits: [
      '7 天有效期',
      '无限模拟面试',
      '基础能力分析',
      '标准速度响应'
    ]
  },
  {
    id: 'monthly',
    name: '月卡',
    description: '灵活高效 · 新手上岸',
    price: 39,
    period: '/月',
    badge: '灵活高效',
    tag: '新手早鸟价',
    note: '¥1.3/天，随时取消，含 GPT-5 MAX 深度分析。',
    benefits: [
      '30 天有效期',
      '无限模拟面试',
      '深度能力分析',
      '优先级支持',
      '高速响应'
    ]
  },
  {
    id: 'quarterly',
    name: '季卡',
    description: '关于首战首选 · 赠 1 个月',
    price: 79,
    period: '/季',
    badge: '关于首战首选',
    tag: '省 33%',
    note: '相当于买 2 个月送 1 个月，免费题库测评赠送。',
    benefits: [
      '90 天有效期',
      '无限模拟面试',
      '深度能力分析',
      '优先社区支持',
      '超高速响应',
      '专属咨询'
    ],
    savings: '¥38'
  },
  {
    id: 'yearly',
    name: '年卡',
    description: '长期复盘 · 性价比之选',
    price: 199,
    period: '/年',
    badge: '性价比之选',
    tag: '折后仅 ¥16.5/月',
    note: '均摊每日仅 0.5 元，立省 ¥269。',
    benefits: [
      '365 天有效期',
      '无限模拟面试',
      '深度能力分析',
      'VIP 社区支持',
      '最高速响应',
      '专属咨询',
      '自定义训练计划'
    ],
    savings: '¥157'
  }
])

const goBack = () => {
  router.back()
}

const handlePlanSelect = (plan: Plan) => {
  selectedPlanId.value = plan.id
  const target = document.getElementById('pricing-cta')
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped lang="scss">
.pricing-page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #eef2ff 0%, #f7f7fb 35%, #f8f6ff 70%, #ffffff 100%);
}

.pricing-hero {
  position: relative;
  padding: 64px 20px 48px;
  background: linear-gradient(180deg, rgba(236, 239, 255, 0.9) 0%, rgba(244, 243, 255, 0.9) 100%);
  overflow: hidden;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  color: #1f2937;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);

  &:hover {
    background: white;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.1);
  }
}

.recover-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: rgba(255, 255, 255, 0.9);
  color: #4b5563;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
  }
}

.hero-content {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #eef2ff;
  color: #4338ca;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  align-self: center;
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.hero-content h1 {
  font-size: 40px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.25;
}

.gradient-text {
  background: linear-gradient(120deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  margin: 0;
  color: #4b5563;
  font-size: 16px;
  line-height: 1.7;
}

.hero-chips {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f4f4f5;
  color: #4338ca;
  font-weight: 600;
  font-size: 13px;
  border: 1px solid #e5e7eb;

  &.success {
    background: #e6fffa;
    color: #0f766e;
    border-color: #a7f3d0;
  }

  &.soft {
    background: #f3e8ff;
    color: #7c3aed;
    border-color: #e9d5ff;
  }
}

.hero-toggle {
  margin-top: -12px;
  padding: 0 20px 16px;
}

.toggle-billing {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.toggle-btn {
  position: relative;
  padding: 12px 24px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: #4b5563;
  transition: all 0.3s ease;

  &:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }

  &.active {
    border-color: #6366f1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
    color: #4338ca;
  }
}

.save-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
}

.pricing-cards-section {
  padding: 36px 20px 60px;
  background: radial-gradient(circle at 70% 10%, #eef2ff 0%, transparent 40%), #f8fafc;
}

.pricing-cards-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.cta-footer {
  padding: 80px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  text-align: center;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
}

.cta-footer h2 {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 12px;
}

.cta-footer p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 32px;
  line-height: 1.6;
}

.cta-btn {
  padding: 14px 32px;
  background: white;
  color: #6366f1;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .pricing-cards-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .pricing-hero {
    padding: 48px 16px 32px;
  }

  .back-btn,
  .recover-btn {
    position: static;
    margin-bottom: 12px;
  }

  .hero-content h1 {
    font-size: 28px;
  }

  .toggle-billing {
    flex-direction: column;
  }

  .pricing-cards-section {
    padding: 32px 16px;
  }

  .pricing-cards-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .cta-footer {
    padding: 40px 16px;
  }

  .cta-footer h2 {
    font-size: 24px;
  }

  .cta-btn {
    padding: 12px 24px;
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .hero-content h1 {
    font-size: 24px;
  }
}
</style>
