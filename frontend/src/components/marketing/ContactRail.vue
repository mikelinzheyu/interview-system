<template>
  <aside class="contact-rail" aria-label="快速咨询">
    <el-popover
      v-for="option in options"
      :key="option.type"
      placement="left"
      trigger="hover"
      :width="220"
      popper-class="contact-popover"
    >
      <p class="popover-text">{{ option.value }}</p>
      <template #reference>
        <button class="contact-item" type="button" @click="handleClick(option)">
          <el-icon :size="20">
            <component :is="resolveIcon(option.type)" />
          </el-icon>
          <span>{{ option.label }}</span>
        </button>
      </template>
    </el-popover>
  </aside>
</template>

<script setup>
import * as ElementIcons from '@element-plus/icons-vue'
import { toRefs } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  }
})

const { options } = toRefs(props)

const iconMap = {
  phone: ElementIcons.PhoneFilled,
  wechat: ElementIcons.ChatDotRound,
  video: ElementIcons.VideoPlay
}

const resolveIcon = (type) => iconMap[type] || ElementIcons.Promotion

const handleClick = (option) => {
  if (option.type === 'phone') {
    window.location.href = `tel:${option.value}`
  }
}
</script>

<style scoped>
.contact-rail {
  position: fixed;
  right: 32px;
  bottom: 120px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 30;
}

.contact-item {
  width: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: none;
  background: rgba(26, 55, 166, 0.85);
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.contact-item:hover,
.contact-item:focus-visible {
  transform: translateY(-2px);
}

.popover-text {
  margin: 0;
  font-size: 14px;
  color: #1f2a44;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .contact-rail {
    display: none;
  }
}
</style>

<style>
.contact-popover {
  border-radius: 12px;
  padding: 12px 16px;
}
</style>
