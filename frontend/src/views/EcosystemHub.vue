<template>
  <div class="integrated-ecosystem-system">
    <!-- Page Container -->
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">🌟 职业生态系统</h1>
        <p class="page-subtitle">大学探索 + 校友网络 + 学习资源 + 专家咨询</p>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Tab 1: University Catalog -->
        <section v-show="activeTab === 'universities'" class="tab-panel">
          <UniversityCatalog />
        </section>

        <!-- Tab 2: Alumni Tracking -->
        <section v-show="activeTab === 'alumni'" class="tab-panel">
          <AlumniTracking />
        </section>

        <!-- Tab 3: Learning Resources -->
        <section v-show="activeTab === 'resources'" class="tab-panel">
          <LearningResourcesLibrary />
        </section>

        <!-- Tab 4: Consultation Booking -->
        <section v-show="activeTab === 'consultation'" class="tab-panel">
          <ConsultationBooking />
        </section>
      </div>

      <!-- Floating Action Button -->
      <div class="floating-actions">
        <button class="fab-btn" @click="scrollToTop" title="回到顶部">
          <span>↑</span>
        </button>
      </div>
    </div>

    <!-- Background Decoration -->
    <div class="page-background"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UniversityCatalog from '@/components/UniversityCatalog.vue'
import AlumniTracking from '@/components/AlumniTracking.vue'
import LearningResourcesLibrary from '@/components/LearningResourcesLibrary.vue'
import ConsultationBooking from '@/components/ConsultationBooking.vue'

const activeTab = ref('universities')

const tabs = [
  { id: 'universities', label: '大学探索', icon: '🎓' },
  { id: 'alumni', label: '校友网络', icon: '👥' },
  { id: 'resources', label: '学习资源', icon: '📚' },
  { id: 'consultation', label: '专家咨询', icon: '📞' }
]

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.integrated-ecosystem-system {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

.page-container {
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-out;
}

.page-title {
  font-size: 2.8rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 800;
  background: linear-gradient(135deg, #3498db 0%, #9b59b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.nav-tab {
  padding: 0.75rem 1.5rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: white;
  color: #7f8c8d;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-tab:hover {
  border-color: #3498db;
  color: #3498db;
}

.nav-tab.active {
  background: linear-gradient(135deg, #3498db 0%, #9b59b6 100%);
  color: white;
  border-color: #9b59b6;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  display: none;
}

@media (min-width: 640px) {
  .tab-label {
    display: inline;
  }
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s ease-out;
}

.tab-panel {
  animation: slideUp 0.5s ease-out;
}

/* Floating Action Button */
.floating-actions {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
}

.fab-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db 0%, #9b59b6 100%);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
}

/* Background Decoration */
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
  .page-title {
    font-size: 2rem;
  }

  .page-container {
    padding: 1rem;
  }

  .fab-btn {
    width: 45px;
    height: 45px;
    font-size: 1.2rem;
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
