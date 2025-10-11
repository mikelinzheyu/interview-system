<template>
  <div class="domain-selector-page">
    <section class="page-header">
      <h1>选择学习领域</h1>
      <p class="subtitle">选择您感兴趣的专业领域，开始系统化学习</p>
    </section>

    <el-skeleton v-if="domainStore.loading" :rows="6" animated />

    <div v-else class="domain-grid">
      <el-card
        v-for="domain in domainStore.domains"
        :key="domain.id"
        :class="['domain-card', { active: selectedDomain === domain.slug }]"
        shadow="hover"
        @click="selectDomain(domain)"
      >
        <div class="domain-icon">{{ domain.icon }}</div>
        <h3>{{ domain.name }}</h3>
        <p class="domain-description">{{ domain.description }}</p>

        <div class="domain-stats">
          <div class="stat-item">
            <span class="stat-label">题目数量</span>
            <span class="stat-value">{{ domain.questionCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">分类数量</span>
            <span class="stat-value">{{ domain.categoryCount }}</span>
          </div>
        </div>

        <div v-if="domain.stats" class="difficulty-stats">
          <el-tag size="small" type="success" effect="plain">
            基础 {{ domain.stats.easyCount }}
          </el-tag>
          <el-tag size="small" type="warning" effect="plain">
            进阶 {{ domain.stats.mediumCount }}
          </el-tag>
          <el-tag size="small" type="danger" effect="plain">
            挑战 {{ domain.stats.hardCount }}
          </el-tag>
        </div>

        <el-button type="primary" class="enter-btn" @click.stop="enterDomain(domain)">
          进入学习
        </el-button>
      </el-card>
    </div>

    <el-empty v-if="!domainStore.loading && !domainStore.domains.length" description="暂无可用领域" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDomainStore } from '@/stores/domain'

const router = useRouter()
const domainStore = useDomainStore()
const selectedDomain = ref(null)

onMounted(async () => {
  await domainStore.loadDomains()
})

function selectDomain(domain) {
  selectedDomain.value = domain.slug
}

function enterDomain(domain) {
  domainStore.setCurrentDomain(domain)
  router.push({
    name: 'QuestionBankPage',
    params: { domainSlug: domain.slug }
  })
}
</script>

<style scoped>
.domain-selector-page {
  padding: 32px 24px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.domain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.domain-card {
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.domain-card:hover {
  border-color: #409EFF;
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(64, 158, 255, 0.2);
}

.domain-card.active {
  border-color: #409EFF;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4ff 100%);
}

.domain-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 16px;
}

.domain-card h3 {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  text-align: center;
}

.domain-description {
  margin: 0 0 20px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
  min-height: 42px;
}

.domain-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
}

.difficulty-stats {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.enter-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .domain-grid {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 24px;
  }
}
</style>
