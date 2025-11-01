<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h2 class="dashboard-title">
        <span class="title-icon">📊</span> 管理员仪表板
      </h2>
      <div class="header-actions">
        <el-button @click="refreshData">
          🔄 刷新数据
        </el-button>
        <el-button type="primary" @click="navigateTo('users')">
          👥 用户管理
        </el-button>
        <el-button type="primary" @click="navigateTo('moderation')">
          📋 内容审核
        </el-button>
      </div>
    </div>

    <!-- Time Range Selector -->
    <div class="time-range-selector">
      <span class="label">数据范围:</span>
      <el-radio-group v-model="selectedTimeRange" @change="updateStats">
        <el-radio label="24h">24 小时</el-radio>
        <el-radio label="7d">7 天</el-radio>
        <el-radio label="30d">30 天</el-radio>
      </el-radio-group>
    </div>

    <!-- System Stats Cards -->
    <div class="stats-cards-section">
      <h4 class="section-title">📈 系统概览</h4>

      <div class="stats-grid">
        <!-- Total Users Card -->
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">总用户数</div>
            <div class="stat-value">{{ systemStats.totalUsers }}</div>
            <div class="stat-trend" :class="{ positive: true }">
              ↑ 今天新增 {{ systemStats.newUsersToday }}
            </div>
          </div>
        </div>

        <!-- Active Users Card -->
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-content">
            <div class="stat-label">活跃用户</div>
            <div class="stat-value">{{ systemStats.activeUsers }}</div>
            <div class="stat-percent">
              {{ ((systemStats.activeUsers / systemStats.totalUsers) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>

        <!-- Total Content Card -->
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-label">内容总数</div>
            <div class="stat-value">{{ systemStats.totalContent }}</div>
            <div class="stat-trend" :class="{ warning: systemStats.pendingContent > 10 }">
              ⏳ 待审核 {{ systemStats.pendingContent }}
            </div>
          </div>
        </div>

        <!-- Reports Card -->
        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-label">内容举报</div>
            <div class="stat-value">{{ systemStats.totalReports }}</div>
            <div class="stat-trend" :class="{ warning: systemStats.activeReports > 5 }">
              🔴 活跃 {{ systemStats.activeReports }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <h4 class="section-title">📊 数据分析</h4>

      <div class="charts-grid">
        <!-- User Growth Chart -->
        <div class="chart-card">
          <h5>用户增长趋势</h5>
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div v-for="i in 7" :key="i" class="chart-bar" :style="{ height: (Math.random() * 80 + 20) + '%' }"></div>
            </div>
            <div class="chart-label">过去7天用户增长</div>
          </div>
        </div>

        <!-- Content Distribution Chart -->
        <div class="chart-card">
          <h5>内容分布</h5>
          <div class="content-dist">
            <div class="dist-item">
              <span class="dist-label">论坛帖子</span>
              <div class="dist-bar">
                <div class="dist-fill" :style="{ width: '45%' }"></div>
              </div>
              <span class="dist-value">45%</span>
            </div>
            <div class="dist-item">
              <span class="dist-label">用户指南</span>
              <div class="dist-bar">
                <div class="dist-fill" :style="{ width: '30%' }"></div>
              </div>
              <span class="dist-value">30%</span>
            </div>
            <div class="dist-item">
              <span class="dist-label">用户评论</span>
              <div class="dist-bar">
                <div class="dist-fill" :style="{ width: '25%' }"></div>
              </div>
              <span class="dist-value">25%</span>
            </div>
          </div>
        </div>

        <!-- System Health Chart -->
        <div class="chart-card">
          <h5>系统健康度</h5>
          <div class="health-metrics">
            <div class="health-item">
              <span class="health-label">正常运行时间</span>
              <el-progress :percentage="systemStats.systemHealth.uptime" :color="'#67c23a'" :show-text="false" />
              <span class="health-value">{{ systemStats.systemHealth.uptime }}%</span>
            </div>
            <div class="health-item">
              <span class="health-label">错误率</span>
              <el-progress :percentage="systemStats.systemHealth.errorRate * 1000" color="#f56c6c" :show-text="false" />
              <span class="health-value">{{ systemStats.systemHealth.errorRate }}%</span>
            </div>
            <div class="health-item">
              <span class="health-label">服务器负载</span>
              <el-progress :percentage="systemStats.systemHealth.serverLoad" color="#e6a23c" :show-text="false" />
              <span class="health-value">{{ systemStats.systemHealth.serverLoad }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Monitor Section -->
    <div class="activity-monitor-section">
      <h4 class="section-title">🎯 实时活动监控</h4>

      <div class="activity-list">
        <div v-for="(activity, idx) in recentActivities" :key="idx" class="activity-item">
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-time">{{ getRelativeTime(activity.time) }}</div>
          </div>
          <div class="activity-value">{{ activity.value }}</div>
        </div>

        <div v-if="recentActivities.length === 0" class="empty-state">
          暂无实时活动
        </div>
      </div>
    </div>

    <!-- Alerts Section -->
    <div class="alerts-section">
      <h4 class="section-title">⚠️ 系统告警</h4>

      <div class="alerts-list">
        <el-alert
          v-for="alert in systemAlerts"
          :key="alert.id"
          :title="alert.title"
          :type="alert.type"
          :description="alert.description"
          :closable="true"
          style="margin-bottom: 12px"
        />
      </div>

      <div v-if="systemAlerts.length === 0" class="no-alerts">
        ✅ 目前没有告警，系统运行良好
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-section">
      <h4 class="section-title">🔑 关键指标</h4>

      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-label">平均响应时间</span>
          <span class="metric-value">{{ systemStats.systemHealth.responsTime }}ms</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">用户保留率</span>
          <span class="metric-value">{{ userStats.retentionRate }}%</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">内容批准率</span>
          <span class="metric-value">{{ contentStats.approvalRate }}%</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">平均审核时间</span>
          <span class="metric-value">{{ contentStats.avgTimeToApprove }}h</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-section">
      <h4 class="section-title">⚡ 快速操作</h4>

      <div class="actions-grid">
        <el-button type="primary" @click="navigateTo('users')">
          👥 管理用户
        </el-button>
        <el-button type="primary" @click="navigateTo('moderation')">
          📋 审核内容
        </el-button>
        <el-button type="warning" @click="handleNotifications">
          🔔 查看通知
        </el-button>
        <el-button @click="exportReport">
          📥 导出报告
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import adminService from '@/services/adminService'

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
})

// Emit
const emit = defineEmits(['navigate'])

// Refs
const selectedTimeRange = ref('7d')
const systemStats = ref(null)
const userStats = ref(null)
const contentStats = ref(null)
const recentActivities = ref([])
const systemAlerts = ref([])

// Methods
const loadDashboardData = () => {
  // 加载系统统计
  systemStats.value = adminService.getSystemStats()

  // 加载用户统计
  userStats.value = adminService.getUserStats(selectedTimeRange.value)

  // 加载内容统计
  contentStats.value = adminService.getContentStats(selectedTimeRange.value)

  // 加载最近活动
  loadRecentActivities()

  // 加载告警信息
  loadSystemAlerts()
}

const loadRecentActivities = () => {
  recentActivities.value = [
    {
      icon: '👤',
      title: `新用户注册 - ${systemStats.value.newUsersToday} 人`,
      value: `+${systemStats.value.newUsersToday}`,
      time: new Date()
    },
    {
      icon: '📝',
      title: '新内容创建',
      value: '今天',
      time: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      icon: '⏳',
      title: '待审核内容',
      value: `${systemStats.value.pendingContent} 项`,
      time: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
      icon: '⚠️',
      title: '活跃举报',
      value: `${systemStats.value.activeReports} 项`,
      time: new Date(Date.now() - 120 * 60 * 1000)
    }
  ]
}

const loadSystemAlerts = () => {
  systemAlerts.value = []

  // 待审核内容告警
  if (systemStats.value.pendingContent > 20) {
    systemAlerts.value.push({
      id: 'alert_1',
      title: '待审核内容过多',
      type: 'warning',
      description: `目前有 ${systemStats.value.pendingContent} 条内容待审核，请及时处理`
    })
  }

  // 举报内容告警
  if (systemStats.value.activeReports > 10) {
    systemAlerts.value.push({
      id: 'alert_2',
      title: '活跃举报',
      type: 'warning',
      description: `目前有 ${systemStats.value.activeReports} 条内容被举报，需要审查`
    })
  }

  // 服务器负载告警
  if (systemStats.value.systemHealth.serverLoad > 80) {
    systemAlerts.value.push({
      id: 'alert_3',
      title: '服务器负载过高',
      type: 'error',
      description: `当前服务器负载为 ${systemStats.value.systemHealth.serverLoad}%，可能影响性能`
    })
  }

  // 错误率告警
  if (systemStats.value.systemHealth.errorRate > 0.1) {
    systemAlerts.value.push({
      id: 'alert_4',
      title: '错误率升高',
      type: 'error',
      description: `当前错误率为 ${systemStats.value.systemHealth.errorRate}%，建议检查日志`
    })
  }
}

const updateStats = () => {
  loadDashboardData()
  ElMessage.success('数据已刷新')
}

const refreshData = () => {
  loadDashboardData()
  ElMessage.success('仪表板已刷新')
}

const navigateTo = (page) => {
  emit('navigate', page)
}

const handleNotifications = () => {
  navigateTo('notifications')
}

const exportReport = () => {
  const report = {
    generatedAt: new Date().toLocaleString('zh-CN'),
    timeRange: selectedTimeRange.value,
    systemStats: systemStats.value,
    userStats: userStats.value,
    contentStats: contentStats.value
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `admin-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报告已导出')
}

const getRelativeTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.admin-dashboard {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 24px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
}

.dashboard-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Time Range Selector */
.time-range-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.label {
  font-weight: 600;
  color: #374151;
}

/* Stats Cards Section */
.stats-cards-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 11px;
  color: #67c23a;
}

.stat-trend.warning {
  color: #f56c6c;
}

.stat-trend.positive {
  color: #67c23a;
}

.stat-percent {
  font-size: 13px;
  color: #5e7ce0;
  font-weight: 600;
}

/* Charts Section */
.charts-section {
  margin-bottom: 24px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.chart-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-card h5 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.chart-placeholder {
  text-align: center;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 120px;
  gap: 8px;
  margin-bottom: 12px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #5e7ce0, #667eea);
  border-radius: 4px 4px 0 0;
  min-height: 20px;
}

.chart-label {
  font-size: 11px;
  color: #6b7280;
}

/* Content Distribution */
.content-dist {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist-item {
  display: grid;
  grid-template-columns: 80px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.dist-label {
  font-size: 12px;
  color: #6b7280;
}

.dist-bar {
  height: 24px;
  background: rgba(94, 124, 224, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  background: linear-gradient(90deg, #5e7ce0, #667eea);
}

.dist-value {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

/* Health Metrics */
.health-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-item {
  display: grid;
  grid-template-columns: 80px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.health-label {
  font-size: 12px;
  color: #6b7280;
}

.health-value {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

/* Activity Monitor */
.activity-monitor-section {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  border-left: 3px solid #5e7ce0;
}

.activity-icon {
  font-size: 20px;
  min-width: 24px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.activity-time {
  font-size: 10px;
  color: #9ca3af;
}

.activity-value {
  font-size: 12px;
  font-weight: 700;
  color: #5e7ce0;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 12px;
}

/* Alerts Section */
.alerts-section {
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.alerts-list {
  min-height: 50px;
}

.no-alerts {
  text-align: center;
  padding: 20px;
  color: #67c23a;
  font-weight: 600;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #5e7ce0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

/* Quick Actions */
.quick-actions-section {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .dist-item,
  .health-item {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid :deep(.el-button) {
    width: 100%;
  }
}
</style>
