<template>
  <div
    class="pricing-card clickable"
    :class="{ highlighted: isHighlighted }"
    role="button"
    tabindex="0"
    @click="emit('select', plan)"
    @keydown.enter.prevent="emit('select', plan)"
    @keydown.space.prevent="emit('select', plan)"
  >
    <!-- Badges -->
    <div class="badge-row">
      <span v-if="plan.badge" class="plan-badge">{{ plan.badge }}</span>
      <span v-if="isHighlighted" class="recommended-badge">推荐</span>
    </div>

    <!-- Plan Header -->
    <div class="plan-header">
      <h3 class="plan-name">{{ plan.name }}</h3>
      <p class="plan-desc">{{ plan.description }}</p>
    </div>

    <!-- Price Section -->
    <div class="price-section">
      <span class="currency">¥</span>
      <span class="price">{{ plan.price }}</span>
      <span class="period">{{ plan.period }}</span>
      <span v-if="plan.tag" class="price-tag">{{ plan.tag }}</span>
    </div>

    <!-- Benefits List -->
    <ul class="benefits-list">
      <li v-for="benefit in plan.benefits" :key="benefit" class="benefit-item">
        <el-icon class="benefit-icon"><CircleCheckFilled /></el-icon>
        <span>{{ benefit }}</span>
      </li>
    </ul>

    <p v-if="plan.note" class="plan-note">{{ plan.note }}</p>

    <!-- Action Button -->
    <button class="action-btn" :class="{ primary: isHighlighted }">
      {{ actionButtonText }}
    </button>

    <!-- Savings Badge -->
    <div v-if="plan.savings" class="savings-badge">
      节省 {{ plan.savings }}
    </div>

    <div v-if="plan.footer" class="footer-note">{{ plan.footer }}</div>
  </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue'

interface Plan {
  name: string
  description: string
  price: string | number
  period: string
  benefits: string[]
  savings?: string
  badge?: string
  tag?: string
  note?: string
  footer?: string
}

interface Props {
  plan: Plan
  isHighlighted?: boolean
  actionButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isHighlighted: false,
  actionButtonText: '选择此方案'
})

const emit = defineEmits<{
  (e: 'select', plan: Plan): void
}>()
</script>

<style scoped lang="scss">
.pricing-card {
  position: relative;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px 24px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-4px);
  }

  &.highlighted {
    border-color: #6366f1;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
    box-shadow: 0 16px 32px rgba(99, 102, 241, 0.15);
    transform: scale(1.02);

    &:hover {
      box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
      transform: scale(1.02) translateY(-4px);
    }
  }
}

.badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.plan-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #c2410c;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid #fed7aa;
  box-shadow: 0 6px 18px rgba(255, 183, 94, 0.15);
}

.recommended-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.25);
}

.plan-header {
  margin-bottom: 24px;
}

.plan-name {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}

.plan-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.price-section {
  margin-bottom: 24px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.currency {
  font-size: 16px;
  color: #6366f1;
  font-weight: 600;
}

.price {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
}

.period {
  font-size: 13px;
  color: #6b7280;
  margin-left: 4px;
}

.price-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 700;
}

.benefits-list {
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
}

.benefit-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #10b981;
  margin-top: 2px;
  font-size: 16px;
}

.action-btn {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6366f1;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0;

  &:hover {
    border-color: #6366f1;
    background: #f3f4f6;
  }

  &:active {
    transform: scale(0.98);
  }

  &.primary {
    background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
    color: white;
    border-color: transparent;

    &:hover {
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
    }
  }
}

.pricing-card.clickable {
  cursor: pointer;
  outline: none;
}

.pricing-card.clickable:focus-visible {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.savings-badge {
  position: absolute;
  top: 12px;
  right: 16px;
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.plan-note {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 16px;
}

.footer-note {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

@media (max-width: 768px) {
  .pricing-card {
    padding: 24px 16px;

    &.highlighted {
      transform: scale(1);

      &:hover {
        transform: translateY(-4px);
      }
    }
  }

  .price {
    font-size: 28px;
  }

  .plan-name {
    font-size: 18px;
  }
}
</style>
