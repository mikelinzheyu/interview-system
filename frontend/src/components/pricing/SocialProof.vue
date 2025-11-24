<template>
  <div class="social-proof-section">
    <div class="section-header">
      <h2>加入数万名用户</h2>
      <p>超过 50,000 名用户选择相信我们</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">50K+</div>
        <div class="stat-label">活跃用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">100K+</div>
        <div class="stat-label">面试次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">4.8★</div>
        <div class="stat-label">用户评分</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">99%</div>
        <div class="stat-label">满意度</div>
      </div>
    </div>

    <div class="companies-section">
      <p class="companies-label">受到以下企业和机构的信任</p>
      <div class="companies-grid">
        <div v-for="company in companies" :key="company.id" class="company-logo">
          {{ company.name }}
        </div>
      </div>
    </div>

    <div class="testimonial-section">
      <div class="testimonial-grid">
        <div v-for="testimonial in testimonials" :key="testimonial.id" class="testimonial-card">
          <div class="stars">
            <span v-for="i in testimonial.rating" :key="i" class="star">★</span>
          </div>
          <p class="testimonial-text">{{ testimonial.text }}</p>
          <div class="testimonial-author">
            <div class="author-info">
              <div class="author-name">{{ testimonial.author }}</div>
              <div class="author-role">{{ testimonial.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Company {
  id: string
  name: string
}

interface Testimonial {
  id: string
  rating: number
  text: string
  author: string
  role: string
}

const companies: Company[] = [
  { id: '1', name: '字节跳动' },
  { id: '2', name: '阿里巴巴' },
  { id: '3', name: '腾讯' },
  { id: '4', name: '网易' },
  { id: '5', name: '美团' },
  { id: '6', name: 'BiliBili' }
]

const testimonials: Testimonial[] = [
  {
    id: '1',
    rating: 5,
    text: '这个平台真的帮了我大忙！通过 Pro 计划的模拟面试，我成功拿到了心仪的 offer。',
    author: '张三',
    role: '软件工程师'
  },
  {
    id: '2',
    rating: 5,
    text: '深度能力分析功能太棒了，让我清楚地了解了自己的强弱项，针对性地改进。',
    author: '李四',
    role: '产品经理'
  },
  {
    id: '3',
    rating: 5,
    text: 'AI 面试官的反馈非常有帮助，让我在真实面试中表现得更加自信。',
    author: '王五',
    role: '前端工程师'
  }
]
</script>

<style scoped lang="scss">
.social-proof-section {
  padding: 60px 20px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  h2 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 12px;
  }

  p {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
    line-height: 1.6;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  max-width: 900px;
  margin: 0 auto 60px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
  }
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.companies-section {
  margin-bottom: 60px;
}

.companies-label {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  font-weight: 500;
}

.companies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}

.company-logo {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;

  &:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }
}

.testimonial-section {
  max-width: 1000px;
  margin: 0 auto;
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.testimonial-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
  }
}

.stars {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.star {
  color: #fbbf24;
  font-size: 14px;
}

.testimonial-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  margin: 0 0 16px;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.author-role {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

@media (max-width: 768px) {
  .social-proof-section {
    padding: 40px 16px;
  }

  .section-header {
    margin-bottom: 32px;

    h2 {
      font-size: 24px;
    }

    p {
      font-size: 14px;
    }
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 40px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-number {
    font-size: 20px;
  }

  .companies-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .company-logo {
    font-size: 12px;
    padding: 12px;
  }

  .testimonial-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .testimonial-card {
    padding: 16px;
  }
}
</style>
