<template>
  <section :id="sectionId" class="hero landing-hero-bg">
    <div class="hero-overlay" />
    <div class="hero-container">
      <div class="hero-copy">
        <span class="hero-badge">ai面试官 · AI Interview Platform</span>
        <h1>{{ content.title }}</h1>
        <p class="hero-subtitle">{{ content.subtitle }}</p>
        <div class="hero-actions">
          <el-button
            type="primary"
            size="large"
            class="landing-button-glow"
            round
            @click="handlePrimary"
          >
            {{ primaryLabel }}
          </el-button>
          <el-button
            size="large"
            round
            plain
            @click="handleSecondary"
          >
            {{ content.secondaryCta.label }}
          </el-button>
        </div>
      </div>

      <div class="hero-highlights">
        <article
          v-for="item in content.highlights"
          :key="item.title"
          class="hero-highlight landing-card"
        >
          <div class="icon-wrapper">
            <el-icon :size="32">
              <component :is="resolveIcon(item.icon)" />
            </el-icon>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import * as ElementIcons from '@element-plus/icons-vue'

const props = defineProps({
  id: {
    type: String,
    default: 'hero'
  },
  content: {
    type: Object,
    required: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const { id, content, isAuthenticated } = toRefs(props)

const sectionId = computed(() => id.value || 'hero')

const resolveIcon = (name) => {
  if (!name) return ElementIcons.Promotion
  return ElementIcons[name] || ElementIcons.Promotion
}

const primaryLabel = computed(() => {
  return isAuthenticated.value ? '进入控制台' : content.value.primaryCta.label
})

const primaryTarget = computed(() => {
  return isAuthenticated.value ? '/home' : content.value.primaryCta.to
})

const handlePrimary = () => {
  if (!primaryTarget.value) return
  router.push(primaryTarget.value)
}

const handleSecondary = () => {
  if (!content.value.secondaryCta?.to) return
  router.push(content.value.secondaryCta.to)
}
</script>

<style scoped>
.hero {
  position: relative;
  padding: 140px 0 220px;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10, 21, 66, 0.12) 0%, rgba(10, 21, 66, 0.45) 65%, rgba(10, 21, 66, 0.65) 100%);
  pointer-events: none;
}

.hero-container {
  position: relative;
  z-index: 1;
  width: min(1120px, 92vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 48px;
  color: #fff;
}

.hero-copy h1 {
  font-size: clamp(36px, 4vw, 52px);
  margin-bottom: 24px;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.88;
  margin-bottom: 32px;
  line-height: 1.7;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 22px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-highlights {
  display: grid;
  gap: 18px;
}

.hero-highlight {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #fff;
  min-height: 170px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-highlight h3 {
  font-size: 18px;
  font-weight: 600;
}

.hero-highlight p {
  font-size: 15px;
  opacity: 0.85;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .hero {
    padding: 110px 0 180px;
  }

  .hero-container {
    grid-template-columns: 1fr;
    gap: 36px;
  }
}

@media (max-width: 768px) {
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-highlight {
    padding: 22px;
  }
}
</style>
