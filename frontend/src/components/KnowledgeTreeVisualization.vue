<template>
  <div class="knowledge-tree-container">
    <!-- Header -->
    <div class="tree-header">
      <h3 class="tree-title">
        <i class="el-icon-relation"></i> 知识图谱
      </h3>
      <div class="header-controls">
        <el-button-group>
          <el-button
            :type="layoutMode === 'tree' ? 'primary' : 'default'"
            size="small"
            @click="layoutMode = 'tree'"
            icon="DocumentCopy"
          >
            树形
          </el-button>
          <el-button
            :type="layoutMode === 'force' ? 'primary' : 'default'"
            size="small"
            @click="layoutMode = 'force'"
            icon="CirclePlus"
          >
            力导向
          </el-button>
        </el-button-group>

        <el-select
          v-model="viewMode"
          size="small"
          placeholder="查看模式"
          class="view-mode-select"
          @change="handleViewModeChange"
        >
          <el-option label="完整图" value="full" />
          <el-option label="学科视图" value="discipline" />
          <el-option label="难度视图" value="difficulty" />
        </el-select>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="tree-toolbar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索学科..."
        clearable
        size="small"
        class="search-input"
        @input="handleSearch"
      >
        <template #prefix>
          <i class="el-icon-search"></i>
        </template>
      </el-input>

      <el-popover placement="left" :width="300" trigger="click">
        <template #reference>
          <el-button type="primary" size="small" icon="Setting">
            设置
          </el-button>
        </template>

        <div class="settings-panel">
          <div class="setting-group">
            <label>图谱缩放</label>
            <el-slider v-model="zoomLevel" :min="50" :max="200" :step="10" />
            <span class="zoom-label">{{ zoomLevel }}%</span>
          </div>

          <el-divider></el-divider>

          <div class="setting-group">
            <label>
              <el-checkbox v-model="showLabels">显示标签</el-checkbox>
            </label>
            <label>
              <el-checkbox v-model="showStatistics">显示统计信息</el-checkbox>
            </label>
          </div>

          <el-divider></el-divider>

          <el-button type="primary" size="small" block @click="resetView">
            重置视图
          </el-button>
        </div>
      </el-popover>

      <el-button
        v-if="selectedNode"
        type="success"
        size="small"
        icon="Check"
        @click="viewNodeDetails"
      >
        查看详情
      </el-button>

      <el-button
        v-if="selectedNode"
        size="small"
        icon="Close"
        @click="clearSelection"
      >
        取消选择
      </el-button>
    </div>

    <!-- Statistics Panel -->
    <div v-if="showStatistics && graphStats" class="stats-panel">
      <div class="stat-item">
        <span class="stat-label">学科数</span>
        <span class="stat-value">{{ graphStats.totalNodes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">关系数</span>
        <span class="stat-value">{{ graphStats.totalEdges }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总学时</span>
        <span class="stat-value">{{ graphStats.totalTime }}h</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均评分</span>
        <span class="stat-value">{{ graphStats.avgRating }}★</span>
      </div>
    </div>

    <!-- Main Chart Area -->
    <div class="chart-container">
      <div
        v-if="loading"
        class="loading-overlay"
      >
        <el-spinning icon="LoadingOne" />
        <p>正在构建知识图谱...</p>
      </div>

      <div v-else ref="chartRef" class="chart-wrapper"></div>
    </div>

    <!-- Legend -->
    <div class="tree-legend">
      <div class="legend-item">
        <div class="legend-color beginner"></div>
        <span>初级</span>
      </div>
      <div class="legend-item">
        <div class="legend-color intermediate"></div>
        <span>中级</span>
      </div>
      <div class="legend-item">
        <div class="legend-color advanced"></div>
        <span>高级</span>
      </div>
      <div class="legend-divider"></div>
      <div class="legend-item">
        <div class="legend-line prerequisite"></div>
        <span>前置关系</span>
      </div>
      <div class="legend-item">
        <div class="legend-line complementary"></div>
        <span>补充关系</span>
      </div>
    </div>

    <!-- Details Panel -->
    <el-drawer
      v-model="showDetailPanel"
      title="学科详情"
      size="35%"
      :before-close="handleCloseDetails"
    >
      <div v-if="selectedNodeDetails" class="detail-content">
        <!-- Domain Name -->
        <h2 class="detail-title">{{ selectedNodeDetails.name }}</h2>

        <!-- Basic Info -->
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">难度</span>
            <el-tag :type="getDifficultyType(selectedNodeDetails.difficulty)">
              {{ getDifficultyLabel(selectedNodeDetails.difficulty) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">学时</span>
            <span>{{ selectedNodeDetails.timeRequired }} 小时</span>
          </div>
          <div class="info-item">
            <span class="info-label">热度</span>
            <el-progress
              :percentage="selectedNodeDetails.popularity"
              :color="getPopularityColor(selectedNodeDetails.popularity)"
            />
          </div>
          <div class="info-item">
            <span class="info-label">评分</span>
            <el-rate
              v-model="selectedNodeDetails.rating"
              disabled
              :max="5"
            />
          </div>
        </div>

        <el-divider></el-divider>

        <!-- Prerequisites -->
        <div v-if="prerequisiteChain.length > 0" class="relationship-section">
          <h4 class="section-title">🔗 前置课程</h4>
          <div class="domain-list">
            <div
              v-for="domain in prerequisiteChain"
              :key="domain.id"
              class="domain-item"
              @click="selectNodeInGraph(domain.id)"
            >
              <span class="domain-name">{{ domain.name }}</span>
              <el-tag size="small">{{ domain.difficulty }}</el-tag>
            </div>
          </div>
        </div>

        <!-- Complementary -->
        <div v-if="complementaryDomains.length > 0" class="relationship-section">
          <h4 class="section-title">📚 补充课程</h4>
          <div class="domain-list">
            <div
              v-for="comp in complementaryDomains"
              :key="comp.domain.id"
              class="domain-item"
              @click="selectNodeInGraph(comp.domain.id)"
            >
              <span class="domain-name">{{ comp.domain.name }}</span>
              <el-progress
                :percentage="comp.strength"
                :color="getStrengthColor(comp.strength)"
                :show-text="false"
              />
            </div>
          </div>
        </div>

        <!-- Advanced Topics -->
        <div v-if="advancedTopics.length > 0" class="relationship-section">
          <h4 class="section-title">🚀 进阶课程</h4>
          <div class="domain-list">
            <div
              v-for="domain in advancedTopics"
              :key="domain.id"
              class="domain-item"
              @click="selectNodeInGraph(domain.id)"
            >
              <span class="domain-name">{{ domain.name }}</span>
              <el-tag type="danger" size="small">高级</el-tag>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <el-button type="primary" block @click="selectThisDomain">
            选择此学科
          </el-button>
          <el-button block @click="viewLearningPath">
            查看学习路径
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- Learning Path Modal -->
    <el-dialog
      v-model="showPathDialog"
      title="学习路径"
      width="70%"
      :before-close="handleClosePathDialog"
    >
      <div v-if="currentPath" class="path-content">
        <div class="path-header">
          <h3>{{ currentPath.description }}</h3>
          <div class="path-stats">
            <span class="stat">⏱️ {{ currentPath.totalTime }} 小时</span>
            <span class="stat">📈 {{ currentPath.difficulty }}</span>
            <span class="stat">🎯 {{ currentPath.stepCount }} 步</span>
          </div>
        </div>

        <el-steps :active="activePath" finish-status="success" class="path-steps">
          <el-step
            v-for="(domain, index) in currentPath.domains"
            :key="domain.id"
            :title="domain.name"
            :description="`${domain.difficulty} • ${domain.timeRequired}h`"
            @click="activePath = index"
          />
        </el-steps>

        <div class="path-details">
          <div v-if="currentPath.domains.length > 0" class="selected-domain">
            <h4>{{ currentPath.domains[activePath].name }}</h4>
            <div class="domain-info">
              <p><strong>难度:</strong> {{ currentPath.domains[activePath].difficulty }}</p>
              <p><strong>学时:</strong> {{ currentPath.domains[activePath].timeRequired }} 小时</p>
              <p><strong>问题数:</strong> {{ currentPath.domains[activePath].questionCount }}</p>
              <p><strong>评分:</strong> {{ currentPath.domains[activePath].rating }} / 5</p>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button @click="showPathDialog = false">关闭</el-button>
          <el-button type="primary" @click="startLearningPath">
            开始学习路径
          </el-button>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useDomainStore } from '@/stores/domain'
import knowledgeGraphService from '@/services/knowledgeGraphService'
import { ElMessage } from 'element-plus'

const store = useDomainStore()

// Refs
const chartRef = ref(null)
let chart = null

// State
const loading = ref(false)
const layoutMode = ref('tree') // 'tree' or 'force'
const viewMode = ref('full') // 'full', 'discipline', 'difficulty'
const searchQuery = ref('')
const zoomLevel = ref(100)
const showLabels = ref(true)
const showStatistics = ref(true)
const showDetailPanel = ref(false)
const showPathDialog = ref(false)

const selectedNode = ref(null)
const selectedNodeDetails = ref(null)
const graphData = ref(null)
const knowledgeGraph = ref(null)
const graphStats = ref(null)

const prerequisiteChain = ref([])
const complementaryDomains = ref([])
const advancedTopics = ref([])

const currentPath = ref(null)
const activePath = ref(0)

/**
 * Initialize knowledge graph
 */
const initializeGraph = async () => {
  loading.value = true
  try {
    // Get domains from store
    if (store.domains.length === 0) {
      await store.loadDomains()
    }

    // Build knowledge graph
    knowledgeGraph.value = knowledgeGraphService.buildKnowledgeGraph(store.domains)

    // Get statistics
    graphStats.value = knowledgeGraphService.getGraphStatistics(knowledgeGraph.value)

    // Generate visualization data
    const visData = knowledgeGraphService.generateVisualizationData(
      knowledgeGraph.value,
      {
        layout: layoutMode.value,
        colorScheme: 'default'
      }
    )

    graphData.value = visData
    await nextTick()
    renderChart()
  } catch (err) {
    console.error('Failed to initialize knowledge graph:', err)
    ElMessage.error('知识图谱加载失败')
  } finally {
    loading.value = false
  }
}

/**
 * Render chart with ECharts
 */
const renderChart = () => {
  if (!chartRef.value || !graphData.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const option = {
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          return `<strong>${params.name}</strong>`
        }
        return ''
      }
    },
    legend: {
      data: graphData.value.categories.map(c => c.name),
      top: 20,
      right: 20
    },
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        name: 'Knowledge Graph',
        type: layoutMode.value === 'tree' ? 'tree' : 'graph',
        layout: layoutMode.value,
        symbol: 'circle',
        roam: true,
        nodeScaleRule: 'log',
        symbolSize: 30,
        focusNodeAdjacency: true,
        data: graphData.value.nodes,
        links: graphData.value.links,
        categories: graphData.value.categories,
        emphasis: {
          focus: 'adjacency',
          itemStyle: {
            borderColor: '#5e7ce0',
            borderWidth: 3
          }
        },
        label: {
          show: showLabels.value,
          position: 'top',
          fontSize: 12,
          color: '#333'
        },
        lineStyle: {
          curveness: 0.3
        },
        smooth: true,
        edgeLabel: {
          show: false
        }
      }
    ]
  }

  chart.setOption(option)

  // Add click event
  chart.off('click')
  chart.on('click', (params) => {
    if (params.dataType === 'node') {
      selectNode(params.data.id)
    }
  })
}

/**
 * Select a node
 */
const selectNode = (nodeId) => {
  selectedNode.value = nodeId
  const domain = knowledgeGraph.value.nodes.find(n => n.id === nodeId)

  if (domain) {
    selectedNodeDetails.value = domain

    // Get relationships
    prerequisiteChain.value = knowledgeGraphService.getPrerequisiteChain(
      nodeId,
      knowledgeGraph.value
    )
    complementaryDomains.value = knowledgeGraphService.getComplementaryDomains(
      nodeId,
      knowledgeGraph.value
    )
    advancedTopics.value = knowledgeGraphService.getAdvancedTopics(
      nodeId,
      knowledgeGraph.value
    )

    showDetailPanel.value = true
  }
}

/**
 * Select node in graph
 */
const selectNodeInGraph = (nodeId) => {
  selectNode(nodeId)
}

/**
 * Clear selection
 */
const clearSelection = () => {
  selectedNode.value = null
  showDetailPanel.value = false
}

/**
 * View node details
 */
const viewNodeDetails = () => {
  if (selectedNode.value) {
    showDetailPanel.value = true
  }
}

/**
 * View learning path from selected node
 */
const viewLearningPath = async () => {
  if (!selectedNode.value) return

  try {
    // Find a good target domain
    const targetDomain = knowledgeGraph.value.nodes.find(
      n => n.id !== selectedNode.value && n.difficulty === 'advanced'
    )

    if (targetDomain) {
      const path = knowledgeGraphService.findLearningPath(
        selectedNode.value,
        targetDomain.id,
        knowledgeGraph.value
      )

      if (path) {
        currentPath.value = path
        activePath.value = 0
        showPathDialog.value = true
      }
    }
  } catch (err) {
    ElMessage.error('无法生成学习路径')
  }
}

/**
 * Select this domain
 */
const selectThisDomain = () => {
  if (selectedNodeDetails.value) {
    const domain = store.domains.find(d => d.id === selectedNodeDetails.value.id)
    if (domain) {
      store.setCurrentDomain(domain)
      ElMessage.success(`已选择: ${domain.name}`)
      showDetailPanel.value = false
    }
  }
}

/**
 * Start learning path
 */
const startLearningPath = () => {
  if (currentPath.value && currentPath.value.domains.length > 0) {
    const domain = store.domains.find(d => d.id === currentPath.value.domains[0].id)
    if (domain) {
      store.setCurrentDomain(domain)
      ElMessage.success(`开始学习路径: ${currentPath.value.description}`)
      showPathDialog.value = false
      showDetailPanel.value = false
    }
  }
}

/**
 * Handle search
 */
const handleSearch = () => {
  if (searchQuery.value && knowledgeGraph.value) {
    const results = knowledgeGraphService.searchDomains(
      searchQuery.value,
      knowledgeGraph.value
    )

    if (results.length > 0) {
      selectNode(results[0].id)
    }
  }
}

/**
 * Handle view mode change
 */
const handleViewModeChange = () => {
  // Regenerate graph based on view mode
  renderChart()
}

/**
 * Reset view
 */
const resetView = () => {
  zoomLevel.value = 100
  searchQuery.value = ''
  clearSelection()

  if (chart) {
    chart.dispatchAction({
      type: 'restore'
    })
  }
}

/**
 * Handle close details
 */
const handleCloseDetails = () => {
  showDetailPanel.value = false
}

/**
 * Handle close path dialog
 */
const handleClosePathDialog = () => {
  showPathDialog.value = false
}

/**
 * Get difficulty type for tag
 */
const getDifficultyType = (difficulty) => {
  const typeMap = {
    beginner: 'success',
    intermediate: 'warning',
    advanced: 'danger'
  }
  return typeMap[difficulty] || 'info'
}

/**
 * Get difficulty label in Chinese
 */
const getDifficultyLabel = (difficulty) => {
  const labelMap = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }
  return labelMap[difficulty] || '未知'
}

/**
 * Get color for popularity
 */
const getPopularityColor = (popularity) => {
  if (popularity >= 80) return '#67c23a'
  if (popularity >= 60) return '#e6a23c'
  return '#f56c6c'
}

/**
 * Get color for strength
 */
const getStrengthColor = (strength) => {
  if (strength >= 70) return '#67c23a'
  if (strength >= 50) return '#e6a23c'
  return '#909399'
}

// Lifecycle
onMounted(async () => {
  await initializeGraph()
})
</script>

<style scoped>
.knowledge-tree-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 2px solid rgba(229, 230, 235, 0.4);
  background: rgba(255, 255, 255, 0.8);
}

.tree-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-title i {
  color: #5e7ce0;
  font-size: 20px;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-mode-select {
  width: 120px;
}

.tree-toolbar {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.settings-panel {
  padding: 10px;
}

.setting-group {
  margin-bottom: 16px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.zoom-label {
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
}

.stats-panel {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(94, 124, 224, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
  border-bottom: 1px solid rgba(229, 230, 235, 0.3);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.stat-label {
  color: #6b7280;
  font-weight: 600;
}

.stat-value {
  color: #5e7ce0;
  font-weight: 700;
  font-size: 13px;
}

.chart-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.loading-overlay p {
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
}

.tree-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-top: 1px solid rgba(229, 230, 235, 0.3);
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-color.beginner {
  background: #67c23a;
}

.legend-color.intermediate {
  background: #e6a23c;
}

.legend-color.advanced {
  background: #f56c6c;
}

.legend-line {
  width: 20px;
  height: 2px;
}

.legend-line.prerequisite {
  background: #f56c6c;
}

.legend-line.complementary {
  background: #909399;
}

.legend-divider {
  width: 1px;
  height: 16px;
  background: rgba(229, 230, 235, 0.5);
}

/* Detail Panel Styles */
.detail-content {
  padding: 20px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.relationship-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 10px 0;
}

.domain-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.domain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(245, 247, 250, 0.8);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.domain-item:hover {
  background: rgba(94, 124, 224, 0.1);
  transform: translateX(4px);
}

.domain-name {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

/* Path Dialog Styles */
.path-content {
  padding: 20px;
}

.path-header {
  margin-bottom: 20px;
}

.path-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #1f2937;
}

.path-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.stat {
  color: #6b7280;
}

.path-steps {
  margin: 20px 0;
}

.path-steps :deep(.el-step) {
  cursor: pointer;
}

.path-steps :deep(.el-step.is-finish .el-step__head) {
  color: #67c23a;
}

.path-details {
  background: rgba(245, 247, 250, 0.6);
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.selected-domain h4 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 14px;
}

.domain-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.domain-info p {
  margin: 0;
  color: #6b7280;
}

.domain-info strong {
  color: #374151;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .tree-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-controls {
    width: 100%;
  }

  .stats-panel {
    flex-wrap: wrap;
  }

  .info-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tree-legend {
    flex-wrap: wrap;
    font-size: 11px;
    gap: 12px;
  }

  .legend-item {
    flex: 0 1 calc(50% - 6px);
  }
}
</style>
