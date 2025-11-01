<template>
  <section :id="sectionId" class="process-section">
    <div class="section-wrapper">
      <div class="section-header">
        <h2>{{ flow.title }}</h2>
        <p>{{ flow.subtitle }}</p>
      </div>

      <div class="steps">
        <div
          v-for="(step, index) in flow.steps"
          :key="step.title"
          class="step landing-card"
        >
          <span class="step-index">{{ index + 1 }}</span>
          <div class="step-body">
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'

const props = defineProps({
  id: {
    type: String,
    default: 'solutions'
  },
  flow: {
    type: Object,
    required: true
  }
})

const { id, flow } = toRefs(props)
const sectionId = computed(() => id.value || 'solutions')
</script>

<style scoped>
.process-section {
  background: linear-gradient(180deg, #f5f8ff 0%, #eff4ff 100%);
  padding: 100px 0;
}

.section-wrapper {
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
  margin-bottom: 12px;
}

.section-header p {
  color: #5f6c8f;
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.step {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 26px;
  background: rgba(255, 255, 255, 0.85);
}

.step-index {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(79, 115, 255, 0.92), rgba(97, 231, 255, 0.92));
  color: #fff;
  font-weight: 600;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-body h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #1f2a44;
}

.step-body p {
  color: #5f6c8f;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .process-section {
    padding: 72px 0;
  }
}
</style>
