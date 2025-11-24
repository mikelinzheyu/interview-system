<template>
  <section :id="sectionId" class="feature-strip">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <p>{{ section.subtitle }}</p>
    </div>

    <div class="feature-grid">
      <article
        v-for="item in section.items"
        :key="item.title"
        class="feature-card landing-card"
      >
        <div class="feature-icon">
          <el-icon :size="28">
            <component :is="resolveIcon(item.icon)" />
          </el-icon>
        </div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, toRefs } from 'vue'
import * as ElementIcons from '@element-plus/icons-vue'

const props = defineProps({
  id: {
    type: String,
    default: 'product'
  },
  section: {
    type: Object,
    required: true
  }
})

const { id, section } = toRefs(props)

const sectionId = computed(() => id.value || 'product')

const resolveIcon = (name) => ElementIcons[name] || ElementIcons.Tickets
</script>

<style scoped>
.feature-strip {
  width: min(1100px, 92vw);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
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
  font-size: 16px;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.feature-card {
  padding: 28px;
  color: #132050;
  background: rgba(255, 255, 255, 0.75);
}

.feature-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(79, 115, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3a7afe;
  margin-bottom: 18px;
}

.feature-card h3 {
  font-size: 18px;
  margin-bottom: 12px;
}

.feature-card p {
  color: #566087;
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
