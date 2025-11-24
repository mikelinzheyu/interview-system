<template>
  <section :id="sectionId" class="partner-section">
    <div class="section-wrapper">
      <div class="section-header">
        <h2>{{ section.title }}</h2>
        <p>{{ section.subtitle }}</p>
      </div>

      <div class="highlight-grid">
        <article
          v-for="item in section.highlights"
          :key="item.title"
          class="highlight-card landing-card"
        >
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </article>
      </div>

      <div class="partner-cta">
        <el-button
          type="primary"
          round
          class="landing-button-glow"
          @click="navigate(section.action?.to)"
        >
          {{ section.action?.label || '申请成为合作伙伴' }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  id: {
    type: String,
    default: 'partners'
  },
  section: {
    type: Object,
    required: true
  }
})

const { id, section } = toRefs(props)
const sectionId = computed(() => id.value || 'partners')

const router = useRouter()

const navigate = (path) => {
  if (!path) return
  router.push(path)
}
</script>

<style scoped>
.partner-section {
  padding: 96px 0;
  background: linear-gradient(180deg, #e8f1ff 0%, #f5f8ff 100%);
}

.section-wrapper {
  width: min(1080px, 92vw);
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
  margin-bottom: 12px;
}

.section-header p {
  color: #5f6c8f;
}

.highlight-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.highlight-card {
  padding: 28px;
  background: rgba(255, 255, 255, 0.82);
  color: #14224e;
}

.partner-cta {
  display: flex;
  justify-content: center;
}

@media (max-width: 1024px) {
  .highlight-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .highlight-grid {
    grid-template-columns: 1fr;
  }
}
</style>

