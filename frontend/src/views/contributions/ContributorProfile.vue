<template>
  <div class="contributor-profile-container">
    <div v-loading="store.profileLoading">
      <el-row :gutter="24" v-if="store.contributorProfile">
        <!-- 左侧个人信息栏 -->
        <el-col :xs="24" :sm="8" :md="7" :lg="6">
          <el-card class="profile-sidebar-card">
            <div class="profile-header-vertical">
              <el-avatar 
                :size="120" 
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" 
                class="profile-avatar"
              />
              <h2 class="profile-username">用户 {{ userId }}</h2>
              <el-tag type="warning" effect="dark" class="profile-rank">
                <el-icon><Trophy /></el-icon> Lv.{{ calculateLevel(profile.stats.totalPoints) }} 专家
              </el-tag>
            </div>

            <div class="profile-bio">
              <p>这个人很懒，什么都没写~ <el-icon class="edit-icon"><Edit /></el-icon></p>
            </div>

            <el-divider />

            <div class="sidebar-stats">
              <div class="sidebar-stat-item">
                <div class="label">总积分</div>
                <div class="value highlight">{{ profile.stats.totalPoints }}</div>
              </div>
              <div class="sidebar-stat-item">
                <div class="label">加入时间</div>
                <div class="value text-sm">2024-08-01</div>
              </div>
            </div>

            <el-divider />

            <div class="social-links">
              <el-button circle size="small"><el-icon><Link /></el-icon></el-button>
              <el-button circle size="small"><el-icon><Share /></el-icon></el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧主要内容区 -->
        <el-col :xs="24" :sm="16" :md="17" :lg="18">
          <el-card class="profile-content-card">
            <el-tabs v-model="activeTab" class="profile-tabs">
              <!-- Tab 1: 概览 -->
              <el-tab-pane label="概览" name="overview">
                <div class="tab-content">
                  <!-- 核心指标卡片 -->
                  <div class="stats-grid">
                    <div class="stat-box blue">
                      <div class="stat-icon"><el-icon><Document /></el-icon></div>
                      <div class="stat-info">
                        <div class="stat-num">{{ profile.stats.totalSubmissions }}</div>
                        <div class="stat-desc">总提交</div>
                      </div>
                    </div>
                    <div class="stat-box green">
                      <div class="stat-icon"><el-icon><Check /></el-icon></div>
                      <div class="stat-info">
                        <div class="stat-num">{{ profile.stats.approvedCount }}</div>
                        <div class="stat-desc">已通过</div>
                      </div>
                    </div>
                    <div class="stat-box orange">
                      <div class="stat-icon"><el-icon><PieChart /></el-icon></div>
                      <div class="stat-info">
                        <div class="stat-num">{{ (profile.stats.approvalRate * 100).toFixed(1) }}%</div>
                        <div class="stat-desc">通过率</div>
                      </div>
                    </div>
                    <div class="stat-box purple">
                      <div class="stat-icon"><el-icon><Medal /></el-icon></div>
                      <div class="stat-info">
                        <div class="stat-num">{{ profile.badges.length }}</div>
                        <div class="stat-desc">获得徽章</div>
                      </div>
                    </div>
                  </div>

                  <el-row :gutter="20" class="charts-section">
                    <!-- 能力雷达图 -->
                    <el-col :span="12">
                      <div class="chart-container">
                        <h3 class="chart-title">能力分布</h3>
                        <div ref="radarChartRef" class="echarts-box"></div>
                      </div>
                    </el-col>
                    <!-- 贡献热力图 (模拟) -->
                    <el-col :span="12">
                      <div class="chart-container">
                        <h3 class="chart-title">活跃度</h3>
                        <div class="heatmap-mock">
                           <div class="heatmap-grid">
                             <div 
                               v-for="i in 112" 
                               :key="i" 
                               class="heatmap-cell"
                               :class="getHeatmapClass(i)"
                               :title="`2024年12月${(i%30)+1}日: ${getHeatmapCount(i)}次贡献`"
                             ></div>
                           </div>
                           <div class="heatmap-legend">
                             <span>Less</span>
                             <div class="legend-cell l0"></div>
                             <div class="legend-cell l1"></div>
                             <div class="legend-cell l2"></div>
                             <div class="legend-cell l3"></div>
                             <div class="legend-cell l4"></div>
                             <span>More</span>
                           </div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-tab-pane>

              <!-- Tab 2: 徽章 -->
              <el-tab-pane label="徽章墙" name="badges">
                <div class="badges-wall">
                  <div 
                    v-for="badge in profile.badges"
                    :key="badge.id"
                    class="badge-card"
                  >
                    <div class="badge-icon-wrapper">
                      <span class="badge-emoji">{{ badge.icon }}</span>
                    </div>
                    <div class="badge-info">
                      <div class="badge-title">{{ badge.name }}</div>
                      <div class="badge-meta">{{ formatDate(badge.earnedAt) }}</div>
                      <div class="badge-desc">{{ badge.description }}</div>
                    </div>
                  </div>
                  <el-empty v-if="profile.badges.length === 0" description="暂无徽章" />
                </div>
              </el-tab-pane>

              <!-- Tab 3: 贡献记录 -->
              <el-tab-pane label="贡献记录" name="submissions">
                 <div class="submissions-list">
                    <!-- 这里应该是一个独立的 SubmissionsList 组件，暂时用简单的列表代替 -->
                    <el-table :data="recentSubmissions" style="width: 100%">
                      <el-table-column prop="title" label="题目" />
                      <el-table-column prop="domain" label="领域" width="120" />
                      <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="date" label="提交时间" width="180" />
                    </el-table>
                 </div>
              </el-tab-pane>

              <!-- Tab 4: 动态 -->
              <el-tab-pane label="动态" name="activity">
                <el-timeline class="activity-timeline">
                  <el-timeline-item
                    v-for="(activity, index) in profile.activityLog"
                    :key="index"
                    :timestamp="formatDate(activity.timestamp)"
                    :type="getActivityType(activity.action)"
                    :icon="getActivityIcon(activity.action)"
                    size="large"
                  >
                    <div class="activity-content">
                      <span class="activity-text">{{ activity.description }}</span>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-if="!profile.activityLog || profile.activityLog.length === 0" description="暂无动态" />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContributionsStore } from '@/stores/contributions'
import { Trophy, Edit, Link, Share, Document, Check, PieChart, Medal, Star, Upload } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const route = useRoute()
const store = useContributionsStore()

const userId = computed(() => route.params.userId || '1')
const profile = computed(() => store.contributorProfile)
const activeTab = ref('overview')
const radarChartRef = ref(null)
let myChart = null

// 模拟的最近提交数据 (因为 mock profile 中没包含详细列表，只包含了统计)
const recentSubmissions = ref([
  { title: 'Vue3 生命周期详解', domain: '前端开发', status: 'approved', date: '2024-12-10' },
  { title: 'React Hooks 原理', domain: '前端开发', status: 'pending', date: '2024-12-12' },
  { title: 'Java 内存模型', domain: '后端开发', status: 'rejected', date: '2024-12-05' },
])

onMounted(async () => {
  await store.fetchContributorProfile(userId.value)
  if (profile.value) {
    nextTick(() => {
      initCharts()
    })
  }
})

// 监听 Tab 切换，如果在 overview tab 且 chart 未初始化，则初始化
watch(activeTab, (val) => {
  if (val === 'overview' && profile.value) {
    nextTick(() => {
      // 重新 resize 或者初始化
      if (myChart) {
        myChart.resize()
      } else {
        initCharts()
      }
    })
  }
})

function initCharts() {
  if (!radarChartRef.value) return
  if (myChart) myChart.dispose()

  myChart = echarts.init(radarChartRef.value)
  
  const expertise = profile.value.expertise || []
  const indicators = expertise.map(e => ({ name: e.domainName, max: 20 })) // 假设最大20题为满分
  const dataValues = expertise.map(e => e.submissionCount)

  // 如果数据为空，提供默认数据以展示效果
  if (indicators.length === 0) {
     indicators.push({ name: '计算机', max: 100 }, { name: '金融', max: 100 }, { name: '管理', max: 100 }, { name: '法律', max: 100 }, { name: '医学', max: 100 })
  }
  
  const option = {
    tooltip: {},
    radar: {
      indicator: indicators.length > 0 ? indicators : [{name: '暂无数据', max: 10}],
      radius: '65%',
      splitNumber: 4,
      axisName: {
        color: '#666'
      },
      splitArea: {
        areaStyle: {
          color: ['#f8f9fa', '#f8f9fa', '#f8f9fa', '#f8f9fa'],
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 10
        }
      }
    },
    series: [
      {
        name: '能力分布',
        type: 'radar',
        data: [
          {
            value: dataValues.length > 0 ? dataValues : [0,0,0,0,0],
            name: '贡献分布',
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.2)'
            },
            lineStyle: {
              color: '#409EFF'
            },
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      }
    ]
  }
  myChart.setOption(option)
  
  window.addEventListener('resize', () => myChart.resize())
}

function calculateLevel(points) {
  return Math.floor(points / 50) + 1
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getHeatmapClass(i) {
  // 随机生成热力图颜色等级 0-4
  const seed = (i * 1234) % 100
  if (seed > 90) return 'l4'
  if (seed > 80) return 'l3'
  if (seed > 60) return 'l2'
  if (seed > 40) return 'l1'
  return 'l0'
}

function getHeatmapCount(i) {
  return Math.floor(Math.random() * 5)
}

function getStatusType(status) {
  const map = { approved: 'success', pending: 'warning', rejected: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { approved: '已通过', pending: '审核中', rejected: '已拒绝' }
  return map[status] || status
}

function getActivityType(action) {
  const map = {
    submitted: 'primary',
    approved: 'success',
    rejected: 'danger',
    revised: 'warning',
    badge_earned: 'warning'
  }
  return map[action] || 'info'
}

function getActivityIcon(action) {
  const map = {
    submitted: Upload,
    approved: Check,
    badge_earned: Medal
  }
  return map[action]
}

</script>

<style scoped>
.contributor-profile-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.profile-sidebar-card {
  text-align: center;
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.profile-header-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.profile-username {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.profile-rank {
  font-weight: 600;
  border-radius: 12px;
  padding: 0 12px;
}

.profile-bio {
  color: #6b7280;
  font-size: 14px;
  margin: 16px 0;
  padding: 0 20px;
}

.edit-icon {
  cursor: pointer;
  margin-left: 4px;
  color: #9ca3af;
}

.edit-icon:hover {
  color: #409eff;
}

.sidebar-stats {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
}

.sidebar-stat-item {
  text-align: center;
}

.sidebar-stat-item .label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.sidebar-stat-item .value {
  font-weight: 600;
  color: #374151;
}

.sidebar-stat-item .value.highlight {
  font-size: 20px;
  color: #409eff;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.profile-content-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  min-height: 500px;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e5e7eb;
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 20px;
}

.tab-content {
  padding: 10px 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-box {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  color: white;
  transition: transform 0.2s;
}

.stat-box:hover {
  transform: translateY(-2px);
}

.stat-box.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-box.green { background: linear-gradient(135deg, #10b981, #059669); }
.stat-box.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-box.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-desc {
  font-size: 13px;
  opacity: 0.9;
}

/* Charts Section */
.charts-section {
  margin-top: 30px;
}

.chart-container {
  background: #fff;
  border-radius: 8px;
  padding: 10px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}

.echarts-box {
  width: 100%;
  height: 300px;
}

/* Heatmap Mock */
.heatmap-mock {
  padding: 10px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 4px;
}

.heatmap-cell {
  width: 100%;
  padding-top: 100%; /* square */
  border-radius: 2px;
  background-color: #ebedf0;
}

.heatmap-cell.l1 { background-color: #9be9a8; }
.heatmap-cell.l2 { background-color: #40c463; }
.heatmap-cell.l3 { background-color: #30a14e; }
.heatmap-cell.l4 { background-color: #216e39; }

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
}

.legend-cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: #ebedf0;
}
.legend-cell.l0 { background-color: #ebedf0; }
.legend-cell.l1 { background-color: #9be9a8; }
.legend-cell.l2 { background-color: #40c463; }
.legend-cell.l3 { background-color: #30a14e; }
.legend-cell.l4 { background-color: #216e39; }

/* Badges Wall */
.badges-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 10px;
}

.badge-card {
  display: flex;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.badge-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.badge-icon-wrapper {
  font-size: 32px;
  margin-right: 16px;
  display: flex;
  align-items: center;
}

.badge-info {
  flex: 1;
}

.badge-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.badge-meta {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.badge-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>