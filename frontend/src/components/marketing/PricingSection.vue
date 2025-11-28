<template>
  <section :id="sectionId" class="pricing-section">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <p>{{ section.subtitle }}</p>
    </div>

    <div class="plan-grid">
      <article
        v-for="plan in section.plans"
        :key="plan.name"
        :class="['plan-card', 'landing-card', { featured: plan.featured }]"
      >
        <div v-if="plan.featured" class="featured-badge">Featured</div>
        <div class="plan-header">
          <span class="plan-name">{{ plan.name }}</span>
          <span class="plan-price">{{ plan.price }}</span>
          <p class="plan-description">{{ plan.description }}</p>
        </div>
        <ul class="plan-feature-list">
          <li v-for="item in plan.features" :key="item">
            <el-icon><Check /></el-icon>
            <span>{{ item }}</span>
          </li>
        </ul>
        <el-button
          type="primary"
          round
          class="plan-cta landing-button-glow"
          @click="navigate(plan.cta?.to)"
        >
          {{ plan.cta?.label || 'Learn more' }}
        </el-button>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { Check } from '@element-plus/icons-vue'

const props = defineProps({
  id: {
    type: String,
    default: 'pricing'
  },
  section: {
    type: Object,
    required: true
  }
})

const { id, section } = toRefs(props)
const sectionId = computed(() => id.value || 'pricing')
const router = useRouter()

const navigate = (path) => {
  if (!path) return
  router.push(path)
}
</script>

<style scoped>
.pricing-section {
  width: min(1100px, 92vw);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.section-header {
  text-align: center;
}

.section-header h2 {
  font-size: 32px;
  color: #1a2758;
  margin-bottom: 16px;
}

.section-header p {
  color: #5f6c8f;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.plan-card {
  padding: 32px 26px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.78);
}

.plan-card.featured {
  background: rgba(58, 122, 254, 0.15);
  border: 2px solid rgba(58, 122, 254, 0.5);
  position: relative;
  transform: scale(1.02);
}

.featured-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(58, 122, 254, 0.9);
  color: white;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  z-index: 10;
}

.plan-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
}

.plan-price {
  font-size: 28px;
  font-weight: 700;
  color: #3a7afe;
}

.plan-description {
  color: #5f6c8f;
}

.plan-feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #44527f;
}

.plan-feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-feature-list :deep(.el-icon) {
  color: #3a7afe;
}

.plan-cta {
  align-self: stretch;
}

@media (max-width: 1024px) {
  .plan-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .plan-card.featured {
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
</style>

