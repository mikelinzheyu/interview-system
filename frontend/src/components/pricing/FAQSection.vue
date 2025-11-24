<template>
  <div class="faq-section">
    <div class="section-header">
      <h2>常见问题</h2>
      <p>了解更多关于 Pro 计划的信息</p>
    </div>

    <div class="faq-container">
      <div
        v-for="(item, index) in faqItems"
        :key="index"
        class="faq-item"
        :class="{ active: expandedIndex === index }"
      >
        <button class="faq-question" @click="toggleFaq(index)">
          <span>{{ item.question }}</span>
          <el-icon class="faq-icon"><ArrowDown /></el-icon>
        </button>
        <transition name="fade-expand">
          <div v-if="expandedIndex === index" class="faq-answer">
            {{ item.answer }}
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

interface FaqItem {
  question: string
  answer: string
}

const expandedIndex = ref<number | null>(null)

const faqItems: FaqItem[] = [
  {
    question: 'Pro 计划包含哪些功能？',
    answer: 'Pro 计划包含无限模拟面试、深度能力分析、优先社区支持、高速体验等高级功能。您可以无限次地进行 AI 模拟面试，获得实时反馈和评分，同时享受更快的 AI 响应速度。'
  },
  {
    question: '如何升级到 Pro 计划？',
    answer: '点击选择 Pro 计划后，您将进入支付页面。我们支持多种支付方式，包括微信支付、支付宝和银行卡。升级后，您将立即获得所有 Pro 功能。'
  },
  {
    question: '可以随时取消 Pro 计划吗？',
    answer: '您可以在账户设置中随时取消 Pro 计划。取消订阅后，您将在当前计费周期结束时失去 Pro 功能。已支付的费用将不予退款。'
  },
  {
    question: 'Pro 计划会自动续费吗？',
    answer: '是的，Pro 计划在每个计费周期自动续费。您可以在账户设置中修改自动续费设置，或在续费前取消订阅。'
  },
  {
    question: '是否有免费试用期？',
    answer: '目前我们不提供免费试用，但您可以先使用免费版本的部分功能。如果您对 Pro 计划有任何疑问，可以联系我们的客服团队。'
  },
  {
    question: '学生有折扣吗？',
    answer: '是的！我们为在校学生提供 30% 的优惠。请在支付时上传您的学生证件以获得学生折扣。'
  }
]

const toggleFaq = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index
}
</script>

<style scoped lang="scss">
.faq-section {
  padding: 60px 20px;
  background: white;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  h2 {
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 12px;
  }

  p {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
    line-height: 1.6;
  }
}

.faq-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: #d1d5db;
  }

  &.active {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }
}

.faq-question {
  width: 100%;
  padding: 16px 20px;
  background: white;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  text-align: left;
  transition: all 0.3s ease;

  &:hover {
    background: #f9fafb;
  }

  .faq-item.active & {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
  }
}

.faq-question span {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.6;
}

.faq-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #6366f1;
  transition: transform 0.3s ease;

  .faq-item.active & {
    transform: rotate(180deg);
  }
}

.faq-answer {
  padding: 20px;
  background: #f9fafb;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  border-top: 1px solid #e5e7eb;
}

// Transition animations
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.3s ease;
}

.fade-expand-enter-from {
  opacity: 0;
  max-height: 0;
}

.fade-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

@media (max-width: 768px) {
  .faq-section {
    padding: 40px 16px;
  }

  .section-header {
    margin-bottom: 32px;

    h2 {
      font-size: 24px;
    }

    p {
      font-size: 14px;
    }
  }

  .faq-question {
    padding: 12px 16px;

    span {
      font-size: 14px;
    }
  }

  .faq-answer {
    padding: 16px;
    font-size: 13px;
  }
}
</style>
