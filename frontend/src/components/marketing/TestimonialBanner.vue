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
        <figure
          v-for="quote in content.quotes"
          :key="quote.company"
          class="quote-card"
        >
          <blockquote>"{{ quote.content }}"</blockquote>
          <figcaption>-- {{ quote.company }}</figcaption>
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
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Gradient blobs background */
.testimonial-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 25%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;
}

.testimonial-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 25%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;
}

.testimonial-wrapper {
  position: relative;
  z-index: 10;
  width: min(1040px, 92vw);
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  gap: 36px;
  background: transparent;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.4);
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
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.quote-card {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.quote-card:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(99, 102, 241, 0.4);
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

  .testimonial-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .testimonial-quotes {
    grid-template-columns: 1fr;
  }
}
</style>

