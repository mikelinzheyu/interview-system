<template>
  <div class="gamification-panel">
    <!-- Header -->
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="flame-icon">🎮</span> 游戏化系统
      </h3>
      <el-button
        icon="Refresh"
        circle
        size="small"
        @click="refreshGamification"
      />
    </div>

    <!-- User Level Card -->
    <div class="level-card">
      <div class="level-display">
        <div class="level-icon">{{ levelInfo.icon }}</div>
        <div class="level-info">
          <div class="level-name">{{ levelInfo.name }}</div>
          <div class="level-number">第 {{ currentLevel }} 级</div>
        </div>
      </div>

      <div class="points-info">
        <span class="total-points">{{ totalPoints }}</span>
        <span class="points-label">总积分</span>
      </div>
    </div>

    <!-- Experience Bar -->
    <div class="experience-section">
      <div class="experience-header">
        <span class="exp-label">经验进度</span>
        <span class="exp-text">{{ currentPoints }}/{{ nextLevelPoints }}</span>
      </div>
      <el-progress
        :percentage="experiencePercentage"
        :color="getProgressColor(experiencePercentage)"
        :show-text="false"
      />
      <div class="level-milestones">
        <div v-for="level in 7" :key="level" class="milestone" :class="{ active: level <= currentLevel }">
          <span class="milestone-icon">{{ getLevelInfo(level).icon }}</span>
        </div>
      </div>
    </div>

    <!-- Streak Display -->
    <div class="stats-grid">
      <!-- Current Streak -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">🔥</span>
          <span class="stat-title">连续学习</span>
        </div>
        <div class="stat-value">{{ currentStreak }}</div>
        <div class="stat-label">天</div>
        <el-progress
          :percentage="Math.min(100, (currentStreak / 30) * 100)"
          color="#f56c6c"
          :show-text="false"
        />
      </div>

      <!-- Longest Streak -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">💯</span>
          <span class="stat-title">最长连续</span>
        </div>
        <div class="stat-value">{{ longestStreak }}</div>
        <div class="stat-label">天</div>
        <el-progress
          :percentage="Math.min(100, (longestStreak / 30) * 100)"
          color="#e6a23c"
          :show-text="false"
        />
      </div>

      <!-- Achievements -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">⭐</span>
          <span class="stat-title">解锁成就</span>
        </div>
        <div class="stat-value">{{ achievementCount }}</div>
        <div class="stat-label">个</div>
        <el-progress
          :percentage="Math.round((achievementCount / 15) * 100)"
          color="#67c23a"
          :show-text="false"
        />
      </div>

      <!-- Rank -->
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-icon">🏆</span>
          <span class="stat-title">排行榜</span>
        </div>
        <div class="stat-value">{{ userRank }}</div>
        <div class="stat-label">名</div>
        <el-progress
          :percentage="Math.max(0, Math.min(100, (1000 - userRank) / 10))"
          color="#5e7ce0"
          :show-text="false"
        />
      </div>
    </div>

    <!-- Daily Challenge -->
    <div class="daily-challenge-section">
      <div class="challenge-header">
        <h4 class="challenge-title">📅 每日挑战</h4>
        <span class="challenge-date">{{ todayDate }}</span>
      </div>

      <div v-if="dailyChallenge" class="challenge-card">
        <div class="challenge-icon">🎯</div>
        <div class="challenge-details">
          <h5 class="challenge-name">{{ dailyChallenge.title }}</h5>
          <p class="challenge-description">{{ dailyChallenge.description }}</p>

          <div class="challenge-progress">
            <el-progress
              :percentage="challengeProgress"
              :color="getProgressColor(challengeProgress)"
              :show-text="false"
            />
            <span class="progress-text">{{ challengeProgress }}% 完成</span>
          </div>
        </div>

        <div class="challenge-reward">
          <span class="reward-icon">⭐</span>
          <span class="reward-value">{{ dailyChallenge.reward }}</span>
        </div>
      </div>

      <div v-else class="challenge-empty">
        加载每日挑战中...
      </div>
    </div>

    <!-- Quest Tracker -->
    <div class="quests-section">
      <div class="quests-header">
        <h4 class="quests-title">🗺️ 任务进行中</h4>
        <el-tag>{{ activeQuests.length }}/3</el-tag>
      </div>

      <div class="quests-list">
        <div
          v-for="quest in activeQuests"
          :key="quest.id"
          class="quest-item"
          :class="{ completed: quest.progress >= quest.requirement }"
        >
          <div class="quest-info">
            <h5 class="quest-name">{{ quest.title }}</h5>
            <p class="quest-description">{{ quest.description }}</p>
          </div>

          <div class="quest-progress">
            <el-progress
              :percentage="Math.min(100, (quest.progress / quest.requirement) * 100)"
              color="#5e7ce0"
              :show-text="false"
            />
            <span class="progress-ratio">{{ quest.progress }}/{{ quest.requirement }}</span>
          </div>

          <div class="quest-reward">
            <span class="reward-icon">⭐</span>
            {{ quest.reward }}
          </div>
        </div>
      </div>

      <div v-if="activeQuests.length === 0" class="quests-empty">
        暂无活跃任务，完成挑战来解锁任务！
      </div>
    </div>

    <!-- Recent Achievements -->
    <div v-if="recentAchievements.length > 0" class="recent-achievements">
      <h4 class="section-title">🆕 最近解锁</h4>
      <div class="achievements-carousel">
        <div
          v-for="achievement in recentAchievements.slice(0, 3)"
          :key="achievement.id"
          class="achievement-item"
        >
          <div class="achievement-badge">{{ achievement.icon }}</div>
          <div class="achievement-text">
            <div class="achievement-name">{{ achievement.title }}</div>
            <div class="achievement-date">{{ getRelativeDate(achievement.unlockedAt) }}</div>
          </div>
          <div class="achievement-points">+{{ achievement.reward }}</div>
        </div>
      </div>
    </div>

    <!-- Rank Info -->
    <div class="rank-info">
      <div class="rank-card">
        <div class="rank-icon">📊</div>
        <div class="rank-stats">
          <span class="rank-label">全球排名</span>
          <span class="rank-value">TOP {{ userRank }}</span>
        </div>
      </div>

      <el-button
        type="primary"
        text
        @click="viewLeaderboard"
      >
        查看完整排行榜 →
      </el-button>
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

// Emits
const emit = defineEmits(['view-leaderboard'])

// Refs
const totalPoints = ref(0)
const currentLevel = ref(1)
const currentStreak = ref(0)
const longestStreak = ref(0)
const achievementCount = ref(0)
const userRank = ref(1)
const dailyChallenge = ref(null)
const activeQuests = ref([])
const recentAchievements = ref([])

// Computed
const levelInfo = computed(() => {
  return gamificationService.getLevelInfo(currentLevel.value)
})

const currentPoints = computed(() => {
  const currentLevelMinPoints = gamificationService.LEVELS[currentLevel.value]?.minPoints || 0
  return totalPoints.value - currentLevelMinPoints
})

const nextLevelPoints = computed(() => {
  const nextLevel = currentLevel.value + 1
  const nextLevelMinPoints = gamificationService.LEVELS[nextLevel]?.minPoints || 0
  const currentLevelMinPoints = gamificationService.LEVELS[currentLevel.value]?.minPoints || 0
  return nextLevelMinPoints - currentLevelMinPoints
})

const experiencePercentage = computed(() => {
  return Math.round((currentPoints.value / nextLevelPoints.value) * 100)
})

const challengeProgress = computed(() => {
  if (!dailyChallenge.value) return 0
  return Math.min(100, Math.round((0 / dailyChallenge.value.requirement) * 100))
})

const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})

// Methods
const getLevelInfo = (level) => {
  return gamificationService.getLevelInfo(level)
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getRelativeDate = (date) => {
  const now = new Date()
  const diff = Math.floor((now - new Date(date)) / 1000 / 60 / 60)

  if (diff < 1) return '刚解锁'
  if (diff < 24) return `${diff}小时前`
  if (diff < 72) return `${Math.floor(diff / 24)}天前`
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadGamificationData = () => {
  const profile = gamificationService.getUserProfile(props.userId)

  totalPoints.value = profile.totalPoints
  currentLevel.value = profile.currentLevel
  achievementCount.value = profile.unlockedAchievements.length
  recentAchievements.value = profile.unlockedAchievements.slice(-5).reverse()

  // Calculate current streak from all domains
  let maxStreak = 0
  Object.values(profile.streaks).forEach(streak => {
    if (streak.currentStreak > maxStreak) {
      maxStreak = streak.currentStreak
    }
    if (streak.longestStreak > longestStreak.value) {
      longestStreak.value = streak.longestStreak
    }
  })
  currentStreak.value = maxStreak

  // Load daily challenge
  dailyChallenge.value = gamificationService.getDailyChallenge(props.userId)

  // Load active quests
  activeQuests.value = gamificationService.getAvailableQuests(props.userId).slice(0, 3)

  // Mock rank (in real app, get from leaderboard)
  userRank.value = Math.floor(Math.random() * 100) + 1
}

const refreshGamification = () => {
  loadGamificationData()
  ElMessage.success('游戏化数据已刷新')
}

const viewLeaderboard = () => {
  emit('view-leaderboard')
}

onMounted(() => {
  loadGamificationData()
})
</script>

<style scoped>
.gamification-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.flame-icon {
  font-size: 24px;
}

/* Level Card */
.level-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);
  border: 2px solid rgba(94, 124, 224, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.level-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-icon {
  font-size: 48px;
  min-width: 60px;
  text-align: center;
}

.level-info {
  display: flex;
  flex-direction: column;
}

.level-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.level-number {
  font-size: 12px;
  color: #6b7280;
}

.points-info {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-points {
  font-size: 28px;
  font-weight: 700;
  color: #5e7ce0;
}

.points-label {
  font-size: 12px;
  color: #6b7280;
}

/* Experience Section */
.experience-section {
  margin-bottom: 24px;
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.exp-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.exp-text {
  font-size: 12px;
  color: #6b7280;
}

.level-milestones {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}

.milestone {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(245, 247, 250, 0.8);
  border: 2px solid rgba(229, 230, 235, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s;
}

.milestone.active {
  background: linear-gradient(135deg, #5e7ce0, #67c23a);
  border-color: #5e7ce0;
  box-shadow: 0 4px 8px rgba(94, 124, 224, 0.2);
  transform: scale(1.1);
}

.milestone-icon {
  font-size: 18px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border: 1px solid rgba(229, 230, 235, 0.6);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 20px;
}

.stat-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #5e7ce0;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 10px;
}

/* Daily Challenge */
.daily-challenge-section {
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.challenge-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.challenge-date {
  font-size: 11px;
  color: #6b7280;
}

.challenge-card {
  display: flex;
  gap: 12px;
  align-items: center;
}

.challenge-icon {
  font-size: 32px;
  min-width: 40px;
  text-align: center;
}

.challenge-details {
  flex: 1;
  min-width: 0;
}

.challenge-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.challenge-description {
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.challenge-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
}

.progress-text {
  min-width: 50px;
}

.challenge-reward {
  text-align: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid rgba(229, 230, 235, 0.4);
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: #FFD700;
}

.reward-icon {
  font-size: 16px;
}

.reward-value {
  font-size: 13px;
}

.challenge-empty {
  text-align: center;
  padding: 16px;
  color: #9ca3af;
}

/* Quests */
.quests-section {
  margin-bottom: 24px;
}

.quests-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quests-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.quests-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quest-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  transition: all 0.3s;
}

.quest-item:hover {
  background: rgba(245, 247, 250, 0.9);
}

.quest-item.completed {
  background: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.quest-info {
  flex: 1;
  min-width: 0;
}

.quest-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.quest-description {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.quest-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.progress-ratio {
  font-size: 10px;
  color: #6b7280;
}

.quest-reward {
  padding: 6px 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid rgba(229, 230, 235, 0.4);
  font-size: 12px;
  font-weight: 600;
  color: #FFD700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.quests-empty {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

/* Recent Achievements */
.recent-achievements {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.achievements-carousel {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  min-width: fit-content;
  white-space: nowrap;
}

.achievement-badge {
  font-size: 32px;
  min-width: 40px;
}

.achievement-text {
  display: flex;
  flex-direction: column;
}

.achievement-name {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.achievement-date {
  font-size: 10px;
  color: #6b7280;
}

.achievement-points {
  font-size: 13px;
  font-weight: 700;
  color: #FFD700;
  margin-left: 8px;
}

/* Rank Info */
.rank-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  border: 1px solid rgba(94, 124, 224, 0.2);
  border-radius: 8px;
  margin-top: 24px;
}

.rank-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-icon {
  font-size: 28px;
}

.rank-stats {
  display: flex;
  flex-direction: column;
}

.rank-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.rank-value {
  font-size: 18px;
  font-weight: 700;
  color: #5e7ce0;
}

/* Responsive */
@media (max-width: 768px) {
  .gamification-panel {
    padding: 16px;
  }

  .level-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .challenge-card {
    flex-wrap: wrap;
  }

  .rank-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}
</style>
