<template>
  <section :id="sectionId" class="hero landing-hero-bg">
    <div class="hero-overlay" />
    <div class="hero-container">
      <div class="hero-copy">
        <span class="hero-badge">{{ badgeText }}</span>
        <h1>
          <span>{{ headingMain }}</span>
          <span v-if="headingHighlight" class="hero-title-highlight">
            {{ headingHighlight }}
          </span>
        </h1>
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

      <div v-if="chips.length" class="hero-highlights">
        <span
          v-for="chip in chips"
          :key="chip"
          class="hero-chip"
        >
          {{ chip }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { decodeUtf8Garbage } from '@/utils/textDecode'

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

const badgeText = computed(() => {
  return decodeUtf8Garbage(content.value.badge || 'AI Interview Platform')
})

const headingMain = computed(() => {
  const raw = content.value.titleMain || content.value.title || ''
  return decodeUtf8Garbage(raw)
})

const headingHighlight = computed(() => {
  return decodeUtf8Garbage(content.value.titleHighlight || '')
})

const chips = computed(() => {
  const value = content.value

  if (Array.isArray(value?.chips) && value.chips.length) {
    return value.chips.map((c) => decodeUtf8Garbage(c))
  }

  if (Array.isArray(value?.highlights)) {
    return value.highlights
      .map((item) => item && decodeUtf8Garbage(item.title))
      .filter(Boolean)
  }

  return []
})

const primaryLabel = computed(() => {
  if (isAuthenticated.value) {
    return 'Dashboard'
  }

  const raw = content.value.primaryCta?.label || 'Get started'
  return decodeUtf8Garbage(raw)
})

const primaryTarget = computed(() => {
  return isAuthenticated.value ? '/dashboard' : content.value.primaryCta?.to
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
  overflow: hidden;
}

/* Animated gradient blobs background */
.hero::before {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 80%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}

.hero::after {
  content: '';
  position: absolute;
  top: 20%;
  left: -10%;
  width: 40%;
  height: 60%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10, 21, 66, 0.12) 0%,
    rgba(10, 21, 66, 0.45) 65%,
    rgba(10, 21, 66, 0.65) 100%
  );
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-title-highlight {
  background: linear-gradient(120deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
  border: 1px solid rgba(99, 102, 241, 0.3);
  font-size: 13px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 22px;
  font-weight: 500;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.hero-chip {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  backdrop-filter: blur(10px);
}

@media (max-width: 1024px) {
  .hero {
    padding: 110px 0 180px;
  }

  .hero-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-highlights {
    justify-content: flex-start;
  }
}
</style>

