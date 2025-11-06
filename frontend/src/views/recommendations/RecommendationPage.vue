<template>
  <div class="recommendation-page">
    <!-- Main Container -->
    <div class="page-container">
      <!-- Step 1: Assessment Phase -->
      <section v-if="!hasRecommendations" class="assessment-phase">
        <InterestAssessment />
      </section>

      <!-- Step 2: Results Phase -->
      <section v-else-if="hasRecommendations" class="results-phase">
        <RecommendationResult />
      </section>

      <!-- Loading State -->
      <section v-if="isLoading" class="loading-phase">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在根据您的评估生成推荐...</p>
          <p class="loading-subtext">这可能需要几秒钟</p>
        </div>
      </section>
    </div>

    <!-- Background Decoration -->
    <div class="page-background"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecommendationStore } from '@/stores/recommendations'
import InterestAssessment from '@/components/InterestAssessment.vue'
import RecommendationResult from '@/components/RecommendationResult.vue'

const recommendationStore = useRecommendationStore()

const hasRecommendations = computed(() => recommendationStore.hasRecommendations)
const isLoading = computed(() => recommendationStore.isLoading)
</script>

<style scoped>
.recommendation-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

.page-container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Assessment Phase */
.assessment-phase {
  animation: fadeIn 0.5s ease-out;
}

/* Results Phase */
.results-phase {
  animation: fadeIn 0.5s ease-out;
}

/* Loading Phase */
.loading-phase {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-container {
  text-align: center;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.loading-subtext {
  font-size: 0.95rem;
  color: #7f8c8d;
  margin: 0;
}

/* Page Background */
.page-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}

.page-background::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.page-background::after {
  content: '';
  position: absolute;
  bottom: -50%;
  left: -50%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(155, 89, 182, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(30px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .loading-text {
    font-size: 1.1rem;
  }
}
</style>
