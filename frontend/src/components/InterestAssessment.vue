<template>
  <div class="interest-assessment">
    <div class="assessment-container">
      <!-- Header -->
      <div class="assessment-header">
        <h1>🎯 专业推荐测评</h1>
        <p class="subtitle">根据您的兴趣、能力和职业目标，为您推荐最适合的专业</p>
      </div>

      <!-- Assessment Form -->
      <form @submit.prevent="submitAssessment" class="assessment-form">
        <!-- Step 1: Discipline Interests -->
        <section class="form-section">
          <h2 class="section-title">📚 第1步：学科兴趣评分</h2>
          <p class="section-description">评分范围：0 (不感兴趣) - 100 (非常感兴趣)</p>

          <div class="discipline-grid">
            <div v-for="(score, discipline) in formData.disciplines" :key="discipline" class="discipline-item">
              <div class="discipline-header">
                <label :for="`discipline-${discipline}`" class="discipline-label">
                  {{ getDisciplineLabel(discipline) }}
                </label>
                <span class="discipline-score">{{ score }}</span>
              </div>
              <input
                :id="`discipline-${discipline}`"
                v-model.number="formData.disciplines[discipline]"
                type="range"
                min="0"
                max="100"
                class="discipline-slider"
              />
            </div>
          </div>
        </section>

        <!-- Step 2: Abilities -->
        <section class="form-section">
          <h2 class="section-title">⚡ 第2步：能力评分</h2>
          <p class="section-description">评分范围：0 (很弱) - 100 (非常强)</p>

          <div class="abilities-grid">
            <div v-for="(score, ability) in formData.abilities" :key="ability" class="ability-item">
              <div class="ability-header">
                <label :for="`ability-${ability}`" class="ability-label">
                  {{ getAbilityLabel(ability) }}
                </label>
                <span class="ability-score">{{ score }}</span>
              </div>
              <input
                :id="`ability-${ability}`"
                v-model.number="formData.abilities[ability]"
                type="range"
                min="0"
                max="100"
                class="ability-slider"
              />
              <p class="ability-description">{{ getAbilityDescription(ability) }}</p>
            </div>
          </div>
        </section>

        <!-- Step 3: Career Goals -->
        <section class="form-section">
          <h2 class="section-title">🎯 第3步：职业目标 (多选)</h2>
          <p class="section-description">选择您重视的职业目标</p>

          <div class="career-goals-grid">
            <div v-for="(selected, goal) in formData.careerGoals" :key="goal" class="career-goal-item">
              <input
                :id="`goal-${goal}`"
                v-model="formData.careerGoals[goal]"
                type="checkbox"
                class="career-goal-checkbox"
              />
              <label :for="`goal-${goal}`" class="career-goal-label">
                {{ getCareerGoalLabel(goal) }}
              </label>
            </div>
          </div>
        </section>

        <!-- Step 4: Preferences -->
        <section class="form-section">
          <h2 class="section-title">🌍 第4步：其他偏好</h2>

          <div class="preferences-form">
            <div class="preference-item">
              <label for="region" class="preference-label">地区偏好</label>
              <input
                id="region"
                v-model="formData.preferences.region"
                type="text"
                placeholder="如：北京、上海、深圳"
                class="preference-input"
              />
            </div>

            <div class="preference-item">
              <label for="minSalary" class="preference-label">
                期望最低薪资: ¥{{ formData.preferences.minSalary.toLocaleString() }}/月
              </label>
              <input
                id="minSalary"
                v-model.number="formData.preferences.minSalary"
                type="range"
                min="5000"
                max="50000"
                step="1000"
                class="preference-slider"
              />
            </div>

            <div class="preference-item">
              <label for="workLife" class="preference-label">工作生活平衡</label>
              <select v-model="formData.preferences.workLife" id="workLife" class="preference-select">
                <option value="忙碌">忙碌 (追求成就)</option>
                <option value="平衡">平衡 (生活优先)</option>
                <option value="闲适">闲适 (充足时间)</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn-submit"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner">⏳</span>
            <span v-else>{{ isLoading ? '生成推荐中...' : '获取推荐 (生成TOP 10)' }}</span>
          </button>
          <button
            type="button"
            class="btn-reset"
            @click="resetForm"
          >
            重置
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <strong>⚠️ 错误:</strong> {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRecommendationStore } from '@/stores/recommendations'

const recommendationStore = useRecommendationStore()

const formData = ref({
  disciplines: {
    philosophy: 50,
    economics: 50,
    law: 50,
    education: 50,
    literature: 50,
    history: 50,
    science: 50,
    engineering: 50,
    agriculture: 50,
    medicine: 50,
    military: 50,
    management: 50,
    art: 50
  },
  abilities: {
    analytical: 50,
    creative: 50,
    communication: 50,
    practical: 50,
    learning: 50
  },
  careerGoals: {
    highSalary: false,
    techExpert: false,
    management: false,
    entrepreneurship: false,
    socialContribution: false
  },
  preferences: {
    region: '',
    minSalary: 15000,
    workLife: '平衡'
  }
})

const isLoading = ref(false)
const error = ref(null)

// Label mappings
const disciplineLabels = {
  philosophy: '🤔 哲学',
  economics: '💰 经济学',
  law: '⚖️ 法学',
  education: '📚 教育学',
  literature: '✍️ 文学',
  history: '📖 历史学',
  science: '🔬 理学',
  engineering: '🏗️ 工学',
  agriculture: '🌾 农学',
  medicine: '⚕️ 医学',
  military: '🎖️ 军事学',
  management: '💼 管理学',
  art: '🎨 艺术学'
}

const abilityLabels = {
  analytical: '分析能力',
  creative: '创意能力',
  communication: '沟通能力',
  practical: '实践能力',
  learning: '学习能力'
}

const abilityDescriptions = {
  analytical: '逻辑推理、数据分析、问题解决能力',
  creative: '创新思维、艺术表达、想象力',
  communication: '表达能力、人际沟通、演讲技能',
  practical: '动手操作、实验能力、工程实践',
  learning: '自学能力、适应能力、知识获取速度'
}

const careerGoalLabels = {
  highSalary: '💰 追求高薪',
  techExpert: '🚀 成为技术专家',
  management: '👔 管理位置',
  entrepreneurship: '💡 创业发展',
  socialContribution: '🌟 社会贡献'
}

// Helper functions
function getDisciplineLabel(discipline) {
  return disciplineLabels[discipline] || discipline
}

function getAbilityLabel(ability) {
  return abilityLabels[ability] || ability
}

function getAbilityDescription(ability) {
  return abilityDescriptions[ability] || ''
}

function getCareerGoalLabel(goal) {
  return careerGoalLabels[goal] || goal
}

// Form submission
async function submitAssessment() {
  error.value = null
  isLoading.value = true

  try {
    // Validate that at least some input is provided
    const totalDisciplineScore = Object.values(formData.value.disciplines).reduce((a, b) => a + b, 0)
    const totalAbilityScore = Object.values(formData.value.abilities).reduce((a, b) => a + b, 0)

    if (totalDisciplineScore === 0 && totalAbilityScore === 0) {
      throw new Error('请至少给出一些兴趣或能力评分')
    }

    // Call store to perform recommendation
    recommendationStore.performRecommendation(formData.value)

    // Emit success event
    setTimeout(() => {
      isLoading.value = false
    }, 500)
  } catch (err) {
    error.value = err.message
    isLoading.value = false
  }
}

// Reset form
function resetForm() {
  recommendationStore.resetRecommendation()
  formData.value = {
    disciplines: {
      philosophy: 50,
      economics: 50,
      law: 50,
      education: 50,
      literature: 50,
      history: 50,
      science: 50,
      engineering: 50,
      agriculture: 50,
      medicine: 50,
      military: 50,
      management: 50,
      art: 50
    },
    abilities: {
      analytical: 50,
      creative: 50,
      communication: 50,
      practical: 50,
      learning: 50
    },
    careerGoals: {
      highSalary: false,
      techExpert: false,
      management: false,
      entrepreneurship: false,
      socialContribution: false
    },
    preferences: {
      region: '',
      minSalary: 15000,
      workLife: '平衡'
    }
  }
  error.value = null
}
</script>

<style scoped>
.interest-assessment {
  padding: 2rem 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.assessment-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.assessment-header {
  text-align: center;
  margin-bottom: 3rem;
  animation: slideDown 0.5s ease-out;
}

.assessment-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
}

.assessment-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease-out;
}

.form-section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #ecf0f1;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.4rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.section-description {
  font-size: 0.95rem;
  color: #95a5a6;
  margin-bottom: 1.5rem;
}

/* Discipline Grid */
.discipline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.discipline-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.discipline-item:hover {
  border-color: #3498db;
  background: #f0f7ff;
}

.discipline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.discipline-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.discipline-score {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.discipline-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ecf0f1;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.discipline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  transition: all 0.2s ease;
}

.discipline-slider::-webkit-slider-thumb:hover {
  background: #2980b9;
  transform: scale(1.2);
}

.discipline-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.discipline-slider::-moz-range-thumb:hover {
  background: #2980b9;
  transform: scale(1.2);
}

/* Abilities Grid */
.abilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.ability-item {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.ability-item:hover {
  border-color: #27ae60;
  background: #f0fff4;
}

.ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.ability-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.ability-score {
  background: #27ae60;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.ability-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ecf0f1;
  outline: none;
  margin-bottom: 0.75rem;
  -webkit-appearance: none;
  appearance: none;
}

.ability-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #27ae60;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ability-slider::-webkit-slider-thumb:hover {
  background: #229954;
  transform: scale(1.2);
}

.ability-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #27ae60;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.ability-slider::-moz-range-thumb:hover {
  background: #229954;
  transform: scale(1.2);
}

.ability-description {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0;
  font-style: italic;
}

/* Career Goals Grid */
.career-goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.career-goal-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.career-goal-item:hover {
  border-color: #e74c3c;
  background: #fff5f5;
}

.career-goal-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-right: 0.75rem;
  accent-color: #e74c3c;
}

.career-goal-label {
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
}

/* Preferences Form */
.preferences-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.preference-item {
  display: flex;
  flex-direction: column;
}

.preference-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.preference-input,
.preference-select {
  padding: 0.75rem;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.preference-input:focus,
.preference-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.preference-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ecf0f1;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.preference-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f39c12;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preference-slider::-webkit-slider-thumb:hover {
  background: #e67e22;
  transform: scale(1.2);
}

.preference-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #f39c12;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.preference-slider::-moz-range-thumb:hover {
  background: #e67e22;
  transform: scale(1.2);
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
}

.btn-submit,
.btn-reset {
  padding: 0.85rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(52, 152, 219, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reset {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-reset:hover {
  background: #bdc3c7;
  transform: translateY(-2px);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Message */
.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fadbd8;
  color: #c0392b;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .assessment-header h1 {
    font-size: 1.8rem;
  }

  .assessment-form {
    padding: 1.5rem;
  }

  .discipline-grid,
  .abilities-grid,
  .career-goals-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-submit,
  .btn-reset {
    width: 100%;
  }
}
</style>
