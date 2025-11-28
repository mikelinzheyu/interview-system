<template>
  <section :id="sectionId" class="hero landing-hero-bg">
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

      <div class="hero-visual" aria-hidden="true">
        <div class="hero-window">
          <div class="hero-window-header">
            <div class="hero-window-dots">
              <span class="dot dot-red" />
              <span class="dot dot-yellow" />
              <span class="dot dot-green" />
            </div>
            <span class="hero-window-title">AI Interviewer v2.0</span>
          </div>
          <div class="hero-window-body">
            <div class="hero-chat-layout">
              <div class="hero-chat-sidebar">
                <div class="sidebar-block sidebar-block--primary" />
                <div class="sidebar-block sidebar-block--muted" />
                <div class="sidebar-block sidebar-block--muted" />
              </div>
              <div class="hero-chat-main">
                <div class="hero-message-row">
                  <div class="hero-avatar">
                    <div class="hero-avatar-icon">
                      <div class="robot-face">
                        <div class="robot-eyes">
                          <span class="robot-eye" />
                          <span class="robot-eye" />
                        </div>
                        <div class="robot-mouth" />
                      </div>
                    </div>
                  </div>
                  <div class="hero-question-bubble">
                    <span>请介绍一下你在这个项目中遇到的最大挑战是什么？</span>
                  </div>
                </div>
                <div class="hero-status-bar">
                  <div class="hero-status-icon" />
                  <span class="hero-status-text">正在生成深度分析...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="hero-shadow-pill" />
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
    return '进入面试练习'
  }
  const raw = content.value.primaryCta?.label || '立即开始'
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
  padding: 120px 0 96px;
  overflow: hidden;
}

.hero-container {
  position: relative;
  z-index: 1;
  width: min(1120px, 92vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 72px;
  align-items: center;
}

.hero-copy h1 {
  font-size: clamp(34px, 4vw, 48px);
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
  color: #4b5563;
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
  gap: 12px;
  align-items: center;
  margin-top: 18px;
}

.hero-chip {
  padding: 6px 14px;
  border-radius: 999px;
  background: #f4f4f5;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.hero-visual {
  position: relative;
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.hero-window {
  position: relative;
  border-radius: 24px;
  background: radial-gradient(circle at 0 0, #111827 0%, #020617 55%, #020617 100%);
  padding: 18px 18px 20px;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.6);
  color: #e5e7eb;
  width: 100%;
  max-width: 620px;
  min-height: 360px;
  margin-top: -60px;
  transform-origin: center center;
  transition: transform 0.18s ease-out, box-shadow 0.18s ease-out;
}

.hero-window:hover {
  animation: heroCardWobble 0.6s ease-in-out 1;
  box-shadow: 0 40px 110px rgba(15, 23, 42, 0.85);
}

.hero-window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.hero-window-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-red {
  background: #f97373;
}

.dot-yellow {
  background: #facc15;
}

.dot-green {
  background: #4ade80;
}

.hero-window-title {
  font-size: 12px;
  color: #9ca3af;
}

.hero-window-body {
  border-radius: 18px;
  background: radial-gradient(circle at 0 0, #0b1220 0%, #020617 55%);
  padding: 22px 24px 22px;
}

.hero-chat-layout {
  display: grid;
  grid-template-columns: 0.7fr 2.3fr;
  gap: 18px;
}

.hero-chat-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-block {
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.7);
  height: 48px;
}

.sidebar-block--primary {
  background: linear-gradient(135deg, #10b981, #22c55e);
}

.sidebar-block--muted {
  background: rgba(30, 64, 175, 0.7);
}

.hero-chat-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 260px;
}

.hero-message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 420px;
  width: 100%;
  align-self: center;
}

.hero-avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 48px rgba(37, 99, 235, 0.9);
}

.hero-avatar-icon {
  width: 30px;
  height: 26px;
  border-radius: 10px;
  background: #e5f0ff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.robot-face {
  width: 22px;
  height: 14px;
  border-radius: 6px;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.robot-eyes {
  display: flex;
  gap: 6px;
}

.robot-eye {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #38bdf8;
}

.robot-mouth {
  width: 12px;
  height: 2px;
  border-radius: 999px;
  background: #38bdf8;
  opacity: 0.9;
}

.hero-question-bubble {
  flex: 1;
  background: rgba(31, 41, 55, 0.98);
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 15px;
  line-height: 1.7;
  color: #f9fafb;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.9);
}

.hero-status-bar {
  margin-top: auto;
  border-radius: 14px;
  background: linear-gradient(135deg, #020617, #020617);
  border: 1px solid rgba(59, 130, 246, 0.6);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  width: 100%;
  align-self: center;
}

.hero-status-icon {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: radial-gradient(circle at 0 0, #22c55e 0%, #0ea5e9 60%, #1d4ed8 100%);
  position: relative;
}

.hero-status-icon::before {
  content: '';
  position: absolute;
  inset: 4px 5px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.7);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.4);
}

.hero-status-text {
  font-size: 13px;
  color: #e5e7eb;
}

.hero-shadow-pill {
  position: absolute;
  inset: auto 6% -32px;
  height: 40px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.5) 0%, transparent 70%);
  filter: blur(6px);
}

@keyframes heroCardWobble {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  20% {
    transform: translate3d(4px, -4px, 0) rotate(1.2deg);
  }
  40% {
    transform: translate3d(-4px, 3px, 0) rotate(-1.2deg);
  }
  60% {
    transform: translate3d(3px, -3px, 0) rotate(0.8deg);
  }
  80% {
    transform: translate3d(-2px, 2px, 0) rotate(-0.8deg);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
}

@media (max-width: 1024px) {
  .hero {
    padding: 96px 0 72px;
  }

  .hero-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-window {
    margin-top: 0;
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

  .hero-window {
    max-width: 100%;
  }
}
</style>
