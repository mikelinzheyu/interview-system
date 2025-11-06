<template>
  <div class="onboarding-modal">
    <!-- 欢迎屏 -->
    <div v-if="step === 0" class="onboarding-step welcome-step">
      <div class="welcome-content">
        <div class="welcome-icon">🎓</div>
        <h2 class="welcome-title">欢迎来到学习平台</h2>
        <p class="welcome-desc">
          帮助你发现适合的学习领域，制定个性化学习计划
        </p>
        <div class="welcome-features">
          <div class="feature">
            <span class="feature-icon">✨</span>
            <span>智能推荐专业领域</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📚</span>
            <span>完整的知识体系</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🎯</span>
            <span>科学的学习路径</span>
          </div>
        </div>

        <div class="welcome-actions">
          <el-button type="primary" size="large" @click="nextStep">
            开始引导 (2分钟)
          </el-button>
          <el-button plain size="large" @click="skipOnboarding">
            跳过引导
          </el-button>
        </div>
      </div>
    </div>

    <!-- 第1步：学科偏好 -->
    <div v-if="step === 1" class="onboarding-step">
      <div class="step-header">
        <h3 class="step-title">第1步：你对哪类学科感兴趣?</h3>
        <el-progress :percentage="20" />
      </div>

      <div class="step-content">
        <el-radio-group v-model="answers.discipline" size="large">
          <div v-for="option in disciplineOptions" :key="option.value" class="radio-card">
            <el-radio :label="option.value">
              <div class="radio-content">
                <span class="option-icon">{{ option.icon }}</span>
                <div class="option-text">
                  <div class="option-title">{{ option.label }}</div>
                  <div class="option-desc">{{ option.desc }}</div>
                </div>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </div>

      <div class="step-actions">
        <el-button @click="skipOnboarding">跳过</el-button>
        <el-button type="primary" :disabled="!answers.discipline" @click="nextStep">
          下一步
        </el-button>
      </div>
    </div>

    <!-- 第2步：学习风格 -->
    <div v-if="step === 2" class="onboarding-step">
      <div class="step-header">
        <h3 class="step-title">第2步：你更喜欢哪种学习方式?</h3>
        <el-progress :percentage="40" />
      </div>

      <div class="step-content">
        <el-radio-group v-model="answers.learningStyle" size="large">
          <div v-for="option in styleOptions" :key="option.value" class="radio-card">
            <el-radio :label="option.value">
              <div class="radio-content">
                <span class="option-icon">{{ option.icon }}</span>
                <div class="option-text">
                  <div class="option-title">{{ option.label }}</div>
                  <div class="option-desc">{{ option.desc }}</div>
                </div>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </div>

      <div class="step-actions">
        <el-button @click="prevStep">上一步</el-button>
        <el-button type="primary" :disabled="!answers.learningStyle" @click="nextStep">
          下一步
        </el-button>
      </div>
    </div>

    <!-- 第3步：职业目标 -->
    <div v-if="step === 3" class="onboarding-step">
      <div class="step-header">
        <h3 class="step-title">第3步：你的职业目标是什么?</h3>
        <el-progress :percentage="60" />
      </div>

      <div class="step-content">
        <el-checkbox-group v-model="answers.careerGoals" size="large">
          <div v-for="option in careerOptions" :key="option.value" class="checkbox-card">
            <el-checkbox :label="option.value">
              <div class="checkbox-content">
                <span class="option-icon">{{ option.icon }}</span>
                <div class="option-text">
                  <div class="option-title">{{ option.label }}</div>
                  <div class="option-desc">{{ option.desc }}</div>
                </div>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
        <div class="tips">
          💡 可以多选，我们会根据你的目标推荐合适的领域
        </div>
      </div>

      <div class="step-actions">
        <el-button @click="prevStep">上一步</el-button>
        <el-button type="primary" :disabled="answers.careerGoals.length === 0" @click="nextStep">
          下一步
        </el-button>
      </div>
    </div>

    <!-- 第4步：学习时间 -->
    <div v-if="step === 4" class="onboarding-step">
      <div class="step-header">
        <h3 class="step-title">第4步：你每周能学习多少时间?</h3>
        <el-progress :percentage="80" />
      </div>

      <div class="step-content">
        <el-radio-group v-model="answers.timePerWeek" size="large">
          <div v-for="option in timeOptions" :key="option.value" class="radio-card">
            <el-radio :label="option.value">
              <div class="radio-content">
                <span class="option-icon">{{ option.icon }}</span>
                <div class="option-text">
                  <div class="option-title">{{ option.label }}</div>
                  <div class="option-desc">{{ option.desc }}</div>
                </div>
              </div>
            </el-radio>
          </div>
        </el-radio-group>
      </div>

      <div class="step-actions">
        <el-button @click="prevStep">上一步</el-button>
        <el-button type="primary" :disabled="!answers.timePerWeek" @click="nextStep">
          查看推荐
        </el-button>
      </div>
    </div>

    <!-- 第5步：推荐结果 -->
    <div v-if="step === 5" class="onboarding-step result-step">
      <div class="step-header">
        <h3 class="step-title">✨ 为你推荐的学习路径</h3>
        <el-progress :percentage="100" />
      </div>

      <div class="step-content">
        <div class="recommendation-intro">
          <p>根据你的偏好和目标，我们为你推荐了以下专业领域：</p>
        </div>

        <div class="recommendation-cards">
          <div
            v-for="domain in recommendedDomains"
            :key="domain.id"
            class="recommendation-item"
            @click="selectDomain(domain)"
          >
            <div class="item-icon">{{ domain.icon }}</div>
            <div class="item-info">
              <h4 class="item-name">{{ domain.name }}</h4>
              <p class="item-desc">{{ domain.shortDescription }}</p>
              <div class="item-stats">
                <span>{{ domain.questionCount }} 题</span>
              </div>
            </div>
            <el-icon class="item-arrow"><ArrowRight /></el-icon>
          </div>
        </div>

        <div class="tips">
          💡 你可以随时改变选择，探索更多领域
        </div>
      </div>

      <div class="step-actions">
        <el-button @click="prevStep">返回修改</el-button>
        <el-button type="primary" @click="completeOnboarding">
          完成引导
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { useDomainStore } from '@/stores/domain'
import { storeToRefs } from 'pinia'

const store = useDomainStore()
const { selectableDomains } = storeToRefs(store)

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'complete', 'skip'])

const step = ref(0)
const answers = ref({
  discipline: '',
  learningStyle: '',
  careerGoals: [],
  timePerWeek: ''
})

const disciplineOptions = [
  { value: 'engineering', label: '工程与技术', icon: '🏗️', desc: '计算机、电子、网络等' },
  { value: 'business', label: '商业与管理', icon: '💼', desc: '金融、经济、管理等' },
  { value: 'science', label: '科学与医学', icon: '🔬', desc: '医学、生物、化学等' },
  { value: 'humanities', label: '人文与艺术', icon: '🎨', desc: '文学、历史、艺术等' }
]

const styleOptions = [
  { value: 'theory', label: '理论学习', icon: '📚', desc: '深入理解基础概念和原理' },
  { value: 'practice', label: '实战导向', icon: '💻', desc: '通过项目和练习学习' },
  { value: 'mixed', label: '理论与实战并重', icon: '⚖️', desc: '两者均衡结合' }
]

const careerOptions = [
  { value: 'frontend', label: '前端开发', icon: '🎨', desc: 'Web 前端技术栈' },
  { value: 'backend', label: '后端开发', icon: '⚙️', desc: '服务器与系统架构' },
  { value: 'datascience', label: '数据科学', icon: '📊', desc: '数据分析与机器学习' },
  { value: 'finance', label: '金融分析', icon: '💰', desc: '金融建模与量化分析' },
  { value: 'management', label: '项目管理', icon: '📋', desc: '敏捷、团队协作' },
  { value: 'learning', label: '持续学习', icon: '🌟', desc: '提升综合知识储备' }
]

const timeOptions = [
  { value: 'limited', label: '每周 1-3 小时', icon: '⏰', desc: '零碎时间学习' },
  { value: 'moderate', label: '每周 5-10 小时', icon: '⏱️', desc: '较为稳定的投入' },
  { value: 'intensive', label: '每周 15+ 小时', icon: '🔥', desc: '深度学习与实战' }
]

/**
 * 推荐结果（根据答案计算）
 */
const recommendedDomains = computed(() => {
  if (step.value < 5) return []

  let filtered = [...selectableDomains.value]

  // 根据学科过滤
  if (answers.value.discipline === 'engineering') {
    filtered = filtered.filter(d => d.name.includes('计算机') || d.name.includes('网络'))
  } else if (answers.value.discipline === 'business') {
    filtered = filtered.filter(d => d.name.includes('金融') || d.name.includes('经济'))
  } else if (answers.value.discipline === 'science') {
    filtered = filtered.filter(d => d.name.includes('医学'))
  }

  return filtered.slice(0, 3)
})

/**
 * 下一步
 */
function nextStep() {
  step.value++
}

/**
 * 上一步
 */
function prevStep() {
  step.value--
}

/**
 * 跳过引导
 */
function skipOnboarding() {
  emit('skip')
  emit('update:modelValue', false)
}

/**
 * 完成引导
 */
function completeOnboarding() {
  emit('complete', answers.value)
  emit('update:modelValue', false)
}

/**
 * 选择域
 */
function selectDomain(domain) {
  store.setCurrentDomain(domain)
  completeOnboarding()
}
</script>

<style scoped>
.onboarding-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.onboarding-step {
  background: white;
  border-radius: 24px;
  padding: 40px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.welcome-step {
  text-align: center;
}

.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.welcome-icon {
  font-size: 80px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.welcome-desc {
  font-size: 16px;
  color: #475569;
  margin: 0;
}

.welcome-features {
  display: grid;
  gap: 12px;
  width: 100%;
  margin: 20px 0;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.feature-icon {
  font-size: 20px;
}

.welcome-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 20px;
}

.welcome-actions :deep(.el-button) {
  flex: 1;
  height: 44px;
  font-size: 16px;
}

.step-header {
  margin-bottom: 32px;
}

.step-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
}

.step-content {
  margin: 32px 0;
}

.radio-card,
.checkbox-card {
  margin-bottom: 12px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
}

.radio-card:hover,
.checkbox-card:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.radio-card :deep(.el-radio),
.checkbox-card :deep(.el-checkbox) {
  width: 100%;
  display: flex;
  align-items: center;
}

.radio-card :deep(.el-radio__label),
.checkbox-card :deep(.el-checkbox__label) {
  width: 100%;
  display: flex;
  align-items: center;
  margin: 0;
  cursor: pointer;
}

.radio-content,
.checkbox-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.option-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  text-align: left;
}

.option-title {
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.option-desc {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
}

.radio-card :deep(.el-radio__input.is-checked .el-radio__inner),
.checkbox-card :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  border-color: #3b82f6;
  background: #3b82f6;
}

.tips {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(34, 211, 238, 0.1);
  border-radius: 8px;
  border-left: 4px solid #22d3ee;
  font-size: 13px;
  color: #475569;
}

.result-step {
  padding: 40px;
}

.recommendation-intro {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
}

.recommendation-intro p {
  margin: 0;
  color: #475569;
  font-size: 15px;
}

.recommendation-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recommendation-item:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  transform: translateX(4px);
}

.item-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
}

.item-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-stats {
  font-size: 12px;
  color: #94a3b8;
}

.item-arrow {
  color: #94a3b8;
  font-size: 20px;
  flex-shrink: 0;
}

.recommendation-item:hover .item-arrow {
  color: #3b82f6;
}

.step-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.step-actions :deep(.el-button) {
  min-width: 100px;
  height: 40px;
}

:deep(.el-progress) {
  margin-top: 12px;
}

:deep(.el-progress__bar) {
  background-color: #3b82f6 !important;
}

@media (max-width: 768px) {
  .onboarding-step {
    width: 95%;
    padding: 24px;
  }

  .welcome-title {
    font-size: 22px;
  }

  .step-title {
    font-size: 18px;
  }

  .welcome-actions {
    flex-direction: column;
  }

  .welcome-actions :deep(.el-button) {
    width: 100%;
  }

  .step-actions {
    flex-direction: column;
  }

  .step-actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
