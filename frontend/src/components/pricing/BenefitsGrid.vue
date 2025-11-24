<template>
  <div class="benefits-section">
    <div class="section-header">
      <div class="section-label">
        <el-icon class="section-label-icon">
          <MagicStick />
        </el-icon>
        <span>Pro 会员专属权益</span>
      </div>
      <p class="section-subtitle">
        比免费版更聪明、更专业的一站式求职助理
      </p>
    </div>

    <div class="benefits-grid">
      <div v-for="benefit in benefits" :key="benefit.id" class="benefit-card">
        <div class="benefit-icon-wrapper">
          <el-icon class="benefit-icon">
            <component :is="benefit.icon" />
          </el-icon>
        </div>
        <div class="benefit-content">
          <h3 class="benefit-title">{{ benefit.title }}</h3>
          <p class="benefit-desc">{{ benefit.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { MagicStick, TrendCharts, Reading, EditPen } from '@element-plus/icons-vue'

interface Benefit {
  id: string
  icon: Component
  title: string
  description: string
}

const benefits: Benefit[] = [
  {
    id: 'priority-models',
    icon: MagicStick,
    title: '优先接入 GPT-5 MAX / Claude 4.5',
    description: '比免费版更聪明、更精准的 AI 模型'
  },
  {
    id: 'deep-interview',
    icon: TrendCharts,
    title: '面试官视角深度心理侧写',
    description: '不仅仅是评分，更懂面试官的潜台词'
  },
  {
    id: 'latest-questions',
    icon: Reading,
    title: '2024/2025 最新企业真题库',
    description: '实时更新大厂面经，拒绝过时题目'
  },
  {
    id: 'resume-polish',
    icon: EditPen,
    title: '简历 AI 润色（Pro 会员即将上线）',
    description: '针对性优化简历，提高简历通过率'
  }
]
</script>

<style scoped lang="scss">
.benefits-section {
  padding: 72px 20px 80px;
  background: radial-gradient(circle at 0 0, #eef2ff 0%, rgba(238, 242, 255, 0) 55%),
    radial-gradient(circle at 100% 100%, #f5f3ff 0%, rgba(245, 243, 255, 0) 55%),
    #f9fafb;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(148, 163, 184, 0.25);
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
}

.section-label-icon {
  font-size: 18px;
}

.section-subtitle {
  margin: 16px 0 0;
  font-size: 14px;
  color: #6b7280;
}

.benefits-grid {
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.benefit-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 26px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.benefit-card:hover {
  transform: translateY(-3px);
  border-color: rgba(129, 140, 248, 0.65);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.12);
}

.benefit-icon-wrapper {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%);
}

.benefit-icon {
  font-size: 22px;
  color: #6366f1;
}

.benefit-content {
  flex: 1;
}

.benefit-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.benefit-desc {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.7;
}

@media (max-width: 960px) {
  .benefits-section {
    padding: 56px 16px 64px;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .section-subtitle {
    font-size: 13px;
  }

  .benefit-card {
    padding: 18px 18px;
    border-radius: 18px;
  }

  .benefit-title {
    font-size: 15px;
  }

  .benefit-desc {
    font-size: 12px;
  }
}
</style>
