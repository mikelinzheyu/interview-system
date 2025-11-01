<template>
  <section :id="sectionId" class="testimonial-section">
    <div class="testimonial-wrapper landing-card">
      <div class="testimonial-header">
        <h2>{{ content.title }}</h2>
        <p>{{ content.subtitle }}</p>
      </div>

      <div class="testimonial-stats">
        <div v-for="stat in content.stats" :key="stat.label" class="stat-item">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <div class="testimonial-quotes">
        <figure v-for="quote in content.quotes" :key="quote.company" class="quote-card">
          <blockquote>“{{ quote.content }}”</blockquote>
          <figcaption>—— {{ quote.company }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'

const props = defineProps({
  id: {
    type: String,
    default: 'about'
  },
  content: {
    type: Object,
    required: true
  }
})

const { id, content } = toRefs(props)
const sectionId = computed(() => id.value || 'about')
</script>

<style scoped>
.testimonial-section {
  padding: 110px 0;
  background: linear-gradient(120deg, rgba(31, 54, 142, 0.95), rgba(79, 176, 255, 0.88));
  color: #fff;
  display: flex;
  justify-content: center;
}

.testimonial-wrapper {
  width: min(1040px, 92vw);
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  gap: 36px;
  background: rgba(12, 27, 84, 0.54);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.testimonial-header h2 {
  font-size: 30px;
  margin-bottom: 12px;
}

.testimonial-header p {
  opacity: 0.8;
}

.testimonial-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 24px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.8;
}

.testimonial-quotes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.quote-card {
  background: rgba(17, 42, 120, 0.6);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

blockquote {
  margin: 0;
  line-height: 1.7;
  font-size: 16px;
}

figcaption {
  font-size: 14px;
  opacity: 0.7;
  text-align: right;
}

@media (max-width: 768px) {
  .testimonial-section {
    padding: 80px 0;
  }

  .testimonial-wrapper {
    padding: 36px 28px;
  }
}
</style>
