<template>
  <div class="notice-bar">
    <div class="notice-content">
      <span class="notice-text">
        <strong v-if="emphasis" class="notice-emphasis">{{ emphasis }}</strong>
        {{ message }}
      </span>
      <el-button
        v-if="cta"
        class="landing-button-glow"
        type="primary"
        size="small"
        round
        @click="handleClick"
      >
        {{ cta.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  emphasis: {
    type: String,
    default: ''
  },
  cta: {
    type: Object,
    default: null
  }
})

const router = useRouter()

const targetPath = computed(() => props.cta?.to || '/register')

const handleClick = () => {
  if (!targetPath.value) return
  router.push(targetPath.value)
}
</script>

<style scoped>
.notice-bar {
  background: rgba(26, 57, 153, 0.96);
  color: #fff;
  display: flex;
  justify-content: center;
  padding: 8px 12px;
  font-size: 14px;
}

.notice-content {
  width: min(1080px, 96vw);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.notice-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 1.6;
}

.notice-emphasis {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

@media (max-width: 768px) {
  .notice-bar {
    font-size: 13px;
  }

  .notice-content {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
