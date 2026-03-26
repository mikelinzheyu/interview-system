<template>
  <div class="growth-archive">
    <div class="page-header">
      <h2>📊 我的成长档案</h2>
      <p class="subtitle">记录每一次面试，见证你的成长轨迹</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="records.length === 0" class="empty-state">
      <el-empty description="暂无面试记录，完成一次模拟面试后即可在此查看成长档案">
        <el-button type="primary" @click="goToInterview">开始面试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalCount }}</div>
          <div class="stat-label">面试次数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" :class="getScoreClass(stats.avgScore)">{{ stats.avgScore }}</div>
          <div class="stat-label">平均分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value highlight">{{ stats.bestScore }}</div>
          <div class="stat-label">最高分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalHours }}</div>
          <div class="stat-label">累计时长(小时)</div>
        </div>
      </div>

      <div class="chart-section" v-if="records.length > 1">
        <h3>📈 分数趋势</h3>
        <div ref="chartRef" class="chart-container"></div>
      </div>

      <div class="records-section">
        <h3>📋 面试记录</h3>
        <div v-for="record in sortedRecords" :key="record.id" class="record-card">
          <div class="record-header" @click="toggleExpand(record.id)">
            <div class="record-meta">
              <span class="record-date">{{ formatDate(record.createdAt) }}</span>
              <span class="record-title">{{ record.jobTitle }}</span>
              <el-tag :type="getDifficultyType(record.difficulty)" size="small">{{ record.difficulty }}</el-tag>
              <span class="record-duration">{{ formatDuration(record.duration) }}</span>
            </div>
            <div class="record-scores">
              <span class="score-chip" :class="getScoreClass(record.overallScore)">综合 {{ record.overallScore }}</span>
              <span class="score-chip">技术 {{ record.technicalScore }}</span>
              <span class="score-chip">表达 {{ record.communicationScore }}</span>
              <span class="score-chip">逻辑 {{ record.logicalScore }}</span>
            </div>
            <el-icon class="expand-icon" :class="{ rotated: expandedIds.has(record.id) }"><ArrowDown /></el-icon>
          </div>
          <div v-if="expandedIds.has(record.id)" class="record-detail">
            <div v-if="record.summary" class="detail-section">
              <h4>面试总结</h4>
              <p>{{ record.summary }}</p>
            </div>
            <div v-if="record.suggestions?.length" class="detail-section">
              <h4>改进建议</h4>
              <ul>
                <li v-for="(s, i) in record.suggestions" :key="i">{{ s }}</li>
              </ul>
            </div>
            <div class="detail-actions">
              <el-button type="primary" size="small" @click.stop="goToReplay(record.id)">错题复盘</el-button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const chartRef = ref(null)
let chart = null

const loading = ref(true)
const records = ref([])
const expandedIds = ref(new Set())

const sortedRecords = computed(() =>
  [...records.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
)

const stats = computed(() => {
  if (!records.value.length) return { totalCount: 0, avgScore: 0, bestScore: 0, totalHours: 0 }
  const total = records.value.length
  const avg = Math.round(records.value.reduce((s, r) => s + r.overallScore, 0) / total)
  const best = Math.max(...records.value.map(r => r.overallScore))
  const hours = (records.value.reduce((s, r) => s + r.duration, 0) / 3600).toFixed(1)
  return { totalCount: total, avgScore: avg, bestScore: best, totalHours: hours }
})

onMounted(async () => {
  await fetchRecords()
  if (records.value.length > 1) {
    await nextTick()
    initChart()
  }
})

async function fetchRecords() {
  const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || 1
  try {
    const res = await fetch('/api/interview/records?limit=50&offset=0', {
      headers: { 'Authorization': `Bearer ${userId}` }
    })
    const data = await res.json()
    records.value = data.data?.items || data.data || []
  } catch (e) {
    console.error('Failed to fetch records:', e)
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  const sorted = [...records.value].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const dates = sorted.map(r => formatDate(r.createdAt))
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['综合', '技术', '表达', '逻辑'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      { name: '综合', type: 'line', smooth: true, data: sorted.map(r => r.overallScore) },
      { name: '技术', type: 'line', smooth: true, data: sorted.map(r => r.technicalScore) },
      { name: '表达', type: 'line', smooth: true, data: sorted.map(r => r.communicationScore) },
      { name: '逻辑', type: 'line', smooth: true, data: sorted.map(r => r.logicalScore) }
    ]
  })
}

function toggleExpand(id) {
  const s = new Set(expandedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedIds.value = s
}

function goToReplay(recordId) {
  router.push(`/interview/replay?recordId=${recordId}`)
}

function goToInterview() {
  router.push('/interview/ai')
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  return m >= 60 ? `${Math.floor(m / 60)}小时${m % 60}分钟` : `${m}分钟`
}

function getScoreClass(score) {
  if (score >= 80) return 'score-green'
  if (score >= 60) return 'score-orange'
  return 'score-red'
}

function getDifficultyType(d) {
  return d === '高级' ? 'danger' : d === '中级' ? 'warning' : 'success'
}
</script>

<style scoped>
.growth-archive {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 24px; font-weight: 700; margin: 0 0 6px; color: #1a1a2e; }
.subtitle { color: #888; margin: 0; font-size: 14px; }

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.stat-value { font-size: 32px; font-weight: 700; color: #303133; line-height: 1; margin-bottom: 8px; }
.stat-value.highlight { color: #409eff; }
.stat-value.score-green { color: #67c23a; }
.stat-value.score-orange { color: #e6a23c; }
.stat-value.score-red { color: #f56c6c; }
.stat-label { font-size: 13px; color: #999; }

.chart-section, .records-section {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.chart-section h3, .records-section h3 { margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #303133; }
.chart-container { width: 100%; height: 300px; }

.record-card {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.record-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.record-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  background: #fafafa;
  flex-wrap: wrap;
}

.record-meta { display: flex; align-items: center; gap: 10px; flex: 1; flex-wrap: wrap; }
.record-date { font-size: 13px; color: #999; white-space: nowrap; }
.record-title { font-weight: 600; color: #303133; font-size: 15px; }
.record-duration { font-size: 13px; color: #aaa; }

.record-scores { display: flex; gap: 8px; flex-wrap: wrap; }

.score-chip {
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 20px;
  background: #f0f2f5;
  color: #606266;
  font-weight: 500;
}
.score-chip.score-green { background: #f0f9eb; color: #67c23a; }
.score-chip.score-orange { background: #fdf6ec; color: #e6a23c; }
.score-chip.score-red { background: #fef0f0; color: #f56c6c; }

.expand-icon { color: #aaa; transition: transform 0.2s; flex-shrink: 0; }
.expand-icon.rotated { transform: rotate(180deg); }

.record-detail { padding: 16px; border-top: 1px solid #f0f0f0; background: #fff; }

.detail-section { margin-bottom: 14px; }
.detail-section h4 { font-size: 14px; font-weight: 600; color: #606266; margin: 0 0 8px; }
.detail-section p { font-size: 14px; color: #303133; line-height: 1.7; margin: 0; }
.detail-section ul { margin: 0; padding-left: 20px; }
.detail-section li { font-size: 14px; color: #303133; line-height: 1.8; }

.detail-actions { margin-top: 12px; }
.loading-state, .empty-state { padding: 40px 0; }

@media (max-width: 600px) {
  .stats-bar { grid-template-columns: repeat(2, 1fr); }
  .record-header { flex-direction: column; align-items: flex-start; }
}
</style>
