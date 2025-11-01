<template>
  <section :id="sectionId" class="footer-cta">
    <div class="footer-inner">
      <div class="footer-text">
        <h2>{{ content.title }}</h2>
        <p>{{ content.subtitle }}</p>
      </div>
      <div class="footer-actions">
        <el-button type="primary" size="large" round class="landing-button-glow" @click="navigate(content.primaryCta?.to)">
          {{ content.primaryCta?.label || '立即体验' }}
        </el-button>
        <el-button size="large" round plain @click="navigate(content.secondaryCta?.to)">
          {{ content.secondaryCta?.label || '预约演示' }}
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
    default: 'cta'
  },
  content: {
    type: Object,
    required: true
  }
})

const { id, content } = toRefs(props)
const sectionId = computed(() => id.value || 'cta')

const router = useRouter()

const navigate = (path) => {
  if (!path) return
  router.push(path)
}
</script>

<style scoped>
.footer-cta {
  padding: 120px 0;
  display: flex;
  justify-content: center;
  background: linear-gradient(120deg, rgba(31, 60, 173, 0.96), rgba(66, 191, 255, 0.9));
  color: #fff;
}

.footer-inner {
  width: min(1040px, 92vw);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}

.footer-text h2 {
  font-size: 32px;
  margin-bottom: 12px;
}

.footer-text p {
  font-size: 16px;
  opacity: 0.85;
  max-width: 560px;
}

.footer-actions {
  display: flex;
  gap: 16px;
}

@media (max-width: 768px) {
  .footer-cta {
    padding: 80px 0;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
  }

  .footer-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
