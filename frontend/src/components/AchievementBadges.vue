<template>
  <div class="achievement-badges">
    <!-- Header -->
    <div class="badges-header">
      <h3 class="badges-title">
        <i class="el-icon-trophy"></i> 成就勋章
      </h3>
      <div class="header-stats">
        <span class="stat-item">
          <span class="stat-label">已解锁:</span>
          <span class="stat-value">{{ achievements.length }}/{{ totalAchievements }}</span>
        </span>
        <el-button
          icon="Refresh"
          circle
          size="small"
          @click="refreshAchievements"
        />
      </div>
    </div>

    <!-- Achievement Categories -->
    <div class="achievements-container">
      <!-- Learning Achievements -->
      <div class="category-section">
        <h4 class="category-title">🎓 学习成就</h4>
        <div class="badges-grid">
          <div
            v-for="achievement in getCategoryAchievements('Learning')"
            :key="achievement.id"
            class="badge-card"
            :class="{ unlocked: isUnlocked(achievement.id), locked: !isUnlocked(achievement.id) }"
            @click="selectAchievement(achievement)"
          >
            <div class="badge-wrapper">
              <div class="badge-icon">{{ achievement.icon }}</div>
              <div v-if="isUnlocked(achievement.id)" class="unlock-date">
                {{ getUnlockDate(achievement.id) }}
              </div>
              <div v-else class="lock-icon">🔒</div>
            </div>
            <div class="badge-info">
              <h5 class="badge-name">{{ achievement.title }}</h5>
              <p class="badge-description">{{ achievement.description }}</p>
              <div class="badge-reward">
                <span class="reward-icon">⭐</span>
                {{ achievement.reward }} 点
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Streak Achievements -->
      <div class="category-section">
        <h4 class="category-title">🔥 连续学习</h4>
        <div class="badges-grid">
          <div
            v-for="achievement in getCategoryAchievements('Progress')"
            :key="achievement.id"
            class="badge-card"
            :class="{ unlocked: isUnlocked(achievement.id), locked: !isUnlocked(achievement.id) }"
            @click="selectAchievement(achievement)"
          >
            <div class="badge-wrapper">
              <div class="badge-icon">{{ achievement.icon }}</div>
              <div v-if="isUnlocked(achievement.id)" class="unlock-date">
                {{ getUnlockDate(achievement.id) }}
              </div>
              <div v-else class="lock-icon">🔒</div>
            </div>
            <div class="badge-info">
              <h5 class="badge-name">{{ achievement.title }}</h5>
              <p class="badge-description">{{ achievement.description }}</p>
              <div class="badge-reward">
                <span class="reward-icon">⭐</span>
                {{ achievement.reward }} 点
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Social Achievements -->
      <div class="category-section">
        <h4 class="category-title">📤 社交分享</h4>
        <div class="badges-grid">
          <div
            v-for="achievement in getCategoryAchievements('Social')"
            :key="achievement.id"
            class="badge-card"
            :class="{ unlocked: isUnlocked(achievement.id), locked: !isUnlocked(achievement.id) }"
            @click="selectAchievement(achievement)"
          >
            <div class="badge-wrapper">
              <div class="badge-icon">{{ achievement.icon }}</div>
              <div v-if="isUnlocked(achievement.id)" class="unlock-date">
                {{ getUnlockDate(achievement.id) }}
              </div>
              <div v-else class="lock-icon">🔒</div>
            </div>
            <div class="badge-info">
              <h5 class="badge-name">{{ achievement.title }}</h5>
              <p class="badge-description">{{ achievement.description }}</p>
              <div class="badge-reward">
                <span class="reward-icon">⭐</span>
                {{ achievement.reward }} 点
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exploration Achievements -->
      <div class="category-section">
        <h4 class="category-title">🗺️ 探索发现</h4>
        <div class="badges-grid">
          <div
            v-for="achievement in getCategoryAchievements('Exploration')"
            :key="achievement.id"
            class="badge-card"
            :class="{ unlocked: isUnlocked(achievement.id), locked: !isUnlocked(achievement.id) }"
            @click="selectAchievement(achievement)"
          >
            <div class="badge-wrapper">
              <div class="badge-icon">{{ achievement.icon }}</div>
              <div v-if="isUnlocked(achievement.id)" class="unlock-date">
                {{ getUnlockDate(achievement.id) }}
              </div>
              <div v-else class="lock-icon">🔒</div>
            </div>
            <div class="badge-info">
              <h5 class="badge-name">{{ achievement.title }}</h5>
              <p class="badge-description">{{ achievement.description }}</p>
              <div class="badge-reward">
                <span class="reward-icon">⭐</span>
                {{ achievement.reward }} 点
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Achievement Detail Modal -->
    <el-dialog
      v-model="showDetailDialog"
      :title="`${selectedAchievementDetail?.icon} ${selectedAchievementDetail?.title}`"
      width="500px"
    >
      <div v-if="selectedAchievementDetail" class="achievement-detail">
        <div class="detail-section">
          <h4>成就描述</h4>
          <p>{{ selectedAchievementDetail.description }}</p>
        </div>

        <div class="detail-section">
          <h4>难度等级</h4>
          <el-tag :type="getDifficultyType(selectedAchievementDetail.difficulty)">
            {{ selectedAchievementDetail.difficulty }}
          </el-tag>
        </div>

        <div class="detail-section">
          <h4>奖励</h4>
          <div class="reward-display">
            <span class="reward-amount">⭐ {{ selectedAchievementDetail.reward }} 点</span>
            <span class="reward-text">解锁成就即可获得奖励</span>
          </div>
        </div>

        <div v-if="isUnlocked(selectedAchievementDetail.id)" class="detail-section unlocked-info">
          <h4>✅ 已解锁</h4>
          <p>解锁时间: {{ getUnlockDate(selectedAchievementDetail.id) }}</p>
        </div>

        <div v-else class="detail-section unlock-tips">
          <h4>💡 解锁提示</h4>
          <ul>
            <li v-for="(tip, idx) in getUnlockTips(selectedAchievementDetail.id)" :key="idx">
              {{ tip }}
            </li>
          </ul>
        </div>

        <div class="detail-section">
          <h4>成就类别</h4>
          <el-tag>{{ selectedAchievementDetail.category }}</el-tag>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button v-if="!isUnlocked(selectedAchievementDetail?.id)" type="primary">
          查看进度
        </el-button>
      </template>
    </el-dialog>

    <!-- Statistics Summary -->
    <div class="achievements-summary">
      <div class="summary-item">
        <span class="summary-label">已解锁</span>
        <span class="summary-value">{{ achievements.length }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">总奖励</span>
        <span class="summary-value">⭐ {{ totalRewardPoints }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">完成度</span>
        <span class="summary-value">{{ completionPercentage }}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">稀有度</span>
        <span class="summary-value">{{ rarity }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import gamificationService from '@/services/gamificationService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Refs
const achievements = ref([])
const showDetailDialog = ref(false)
const selectedAchievementDetail = ref(null)

// Computed
const totalAchievements = computed(() => {
  return Object.keys(gamificationService.ACHIEVEMENTS).length
})

const totalRewardPoints = computed(() => {
  return achievements.value.reduce((sum, a) => sum + a.reward, 0)
})

const completionPercentage = computed(() => {
  return Math.round((achievements.value.length / totalAchievements.value) * 100)
})

const rarity = computed(() => {
  const percentage = completionPercentage.value
  if (percentage >= 80) return '传奇'
  if (percentage >= 60) return '稀有'
  if (percentage >= 40) return '不常见'
  if (percentage >= 20) return '普通'
  return '新手'
})

// Methods
const getCategoryAchievements = (category) => {
  return Object.values(gamificationService.ACHIEVEMENTS).filter(
    a => a.category === category
  )
}

const isUnlocked = (achievementId) => {
  return achievements.value.some(a => a.id === achievementId)
}

const getUnlockDate = (achievementId) => {
  const achievement = achievements.value.find(a => a.id === achievementId)
  if (!achievement) return ''
  return new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')
}

const getUnlockTips = (achievementId) => {
  const tipsMap = {
    first_domain: ['完成任何一个学科中的所有问题'],
    ten_domains: ['持续学习，完成10个不同学科'],
    perfect_accuracy: ['在一个学科中正确回答所有问题'],
    speed_learner: ['提高答题速度，每题平均时间不超过2分钟'],
    seven_day_streak: ['连续7天每天至少回答一个问题'],
    thirty_day_streak: ['坚持学习，连续30天保持活跃'],
    hundred_hours: ['投入时间学习，累计100小时以上'],
    first_share: ['与他人分享你的学习成就或学习路径'],
    ten_shares: ['分享10次学习内容或成就'],
    explorer: ['浏览5个不同学科的知识图'],
    collection_master: ['创建5个学习集合，组织你的学习内容']
  }
  return tipsMap[achievementId] || ['继续学习，解锁更多成就']
}

const getDifficultyType = (difficulty) => {
  const typeMap = {
    Easy: 'success',
    Medium: 'warning',
    Hard: 'danger'
  }
  return typeMap[difficulty] || 'info'
}

const selectAchievement = (achievement) => {
  selectedAchievementDetail.value = achievement
  showDetailDialog.value = true
}

const refreshAchievements = () => {
  loadAchievements()
  ElMessage.success('成就已刷新')
}

const loadAchievements = () => {
  achievements.value = gamificationService.getUnlockedAchievements(props.userId)
}

onMounted(() => {
  loadAchievements()
})
</script>

<style scoped>
.achievement-badges {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.badges-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.badges-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.badges-title i {
  color: #FFD700;
  font-size: 24px;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #5e7ce0;
}

.achievements-container {
  margin-bottom: 24px;
}

.category-section {
  margin-bottom: 32px;
}

.category-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding: 0;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.badge-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
  border: 2px solid rgba(229, 230, 235, 0.6);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.badge-card.unlocked {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(248, 249, 250, 0.9) 100%);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.badge-card.locked {
  opacity: 0.6;
  background: rgba(245, 247, 250, 0.5);
}

.badge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.badge-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.badge-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.badge-card:hover .badge-icon {
  transform: scale(1.1);
}

.badge-card.unlocked .badge-icon {
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
}

.unlock-date {
  font-size: 10px;
  color: #67c23a;
  font-weight: 600;
  margin-top: 4px;
}

.lock-icon {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 24px;
  background: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #f56c6c;
}

.badge-info {
  text-align: left;
}

.badge-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.badge-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.badge-reward {
  font-size: 12px;
  color: #FFD700;
  font-weight: 600;
  background: rgba(255, 215, 0, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.achievement-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  border-bottom: 1px solid rgba(229, 230, 235, 0.4);
  padding-bottom: 16px;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.detail-section p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.reward-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-amount {
  font-size: 18px;
  font-weight: 700;
  color: #FFD700;
}

.reward-text {
  font-size: 12px;
  color: #6b7280;
}

.unlocked-info {
  background: rgba(103, 194, 58, 0.1);
  padding: 16px;
  border-radius: 8px;
}

.unlock-tips {
  background: rgba(94, 124, 224, 0.1);
  padding: 16px;
  border-radius: 8px;
}

.unlock-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #6b7280;
  font-size: 13px;
}

.unlock-tips li {
  margin-bottom: 6px;
}

.achievements-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  margin-top: 24px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 6px;
}

.summary-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #5e7ce0;
}

/* Responsive */
@media (max-width: 768px) {
  .achievement-badges {
    padding: 16px;
  }

  .badges-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .achievements-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .badges-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-stats {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
