<template>
  <div class="comparison-tool">
    <!-- 标题和说明 -->
    <div class="tool-header">
      <h3 class="title">
        <i class="el-icon-s-unfold"></i>
        专业对比工具
      </h3>
      <p class="subtitle">选择2-3个专业进行详细对比，帮助您做出最佳选择</p>
    </div>

    <!-- 选择器部分 -->
    <div class="selector-section">
      <div class="selector-label">选择要对比的专业（可选 2-3 个）</div>
      <div class="major-selector">
        <el-select
          v-for="(selectedId, index) in selectedMajorIds"
          :key="index"
          v-model="selectedMajorIds[index]"
          placeholder="选择专业"
          @change="updateComparison"
          class="major-select"
        >
          <el-option
            v-for="major in availableMajors"
            :key="major.id"
            :label="`${major.icon} ${major.name}`"
            :value="major.id"
          />
        </el-select>
      </div>

      <div class="selector-actions">
        <el-button
          v-if="selectedMajors.length > 0"
          @click="startComparison"
          type="primary"
          :loading="comparing"
        >
          <i class="el-icon-s-unfold"></i>
          开始对比
        </el-button>
        <el-button v-if="comparison" @click="resetComparison" type="default">
          <i class="el-icon-delete"></i>
          重置
        </el-button>
      </div>
    </div>

    <!-- 对比结果 -->
    <div v-if="comparison" class="comparison-result">
      <!-- 快速概览 -->
      <div class="overview-section">
        <h4 class="section-title">快速概览</h4>
        <div class="majors-overview">
          <div
            v-for="major in comparison.majors"
            :key="major.id"
            class="major-card"
          >
            <div class="major-header">
              <span class="icon">{{ major.icon }}</span>
              <h5 class="name">{{ major.name }}</h5>
            </div>
            <div class="major-stats">
              <div class="stat">
                <span class="label">题目数</span>
                <span class="value">{{ major.questionCount }}</span>
              </div>
              <div class="stat">
                <span class="label">难度</span>
                <span class="value badge" :class="major.difficulty">
                  {{ difficultyLabel(major.difficulty) }}
                </span>
              </div>
              <div class="stat">
                <span class="label">热度</span>
                <span class="value">{{ major.popularity }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细对比表 -->
      <div class="comparison-table-section">
        <h4 class="section-title">详细对比</h4>
        <el-table
          :data="comparison.details"
          stripe
          border
          style="width: 100%"
          class="comparison-table"
        >
          <el-table-column
            prop="attribute"
            label="对比项"
            width="180"
            class-name="attribute-column"
          />
          <el-table-column
            v-for="major in comparison.majors"
            :key="major.id"
            :label="`${major.icon} ${major.name}`"
            class-name="value-column"
          >
            <template #default="{ row }">
              <div
                :class="[
                  'value-cell',
                  { highlight: isHighlighted(row.attribute, row[major.id]) }
                ]"
              >
                {{ formatValue(row[major.id], row.attribute) }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 关键差异分析 -->
      <div class="difference-analysis-section" v-if="comparison.differences.length > 0">
        <h4 class="section-title">关键差异</h4>
        <div class="differences-list">
          <div
            v-for="(diff, index) in comparison.differences"
            :key="index"
            class="difference-item"
          >
            <div class="difference-label">{{ diff.label }}</div>
            <div class="difference-detail">
              {{ diff.detail }}
            </div>
          </div>
        </div>
      </div>

      <!-- 推荐指数 -->
      <div class="recommendation-section">
        <h4 class="section-title">推荐指数</h4>
        <div class="recommendation-grid">
          <div
            v-for="major in comparison.majors"
            :key="major.id"
            class="recommendation-item"
          >
            <div class="major-name">{{ major.name }}</div>
            <div class="score-container">
              <div class="score-bar">
                <div
                  class="score-fill"
                  :style="{
                    width: `${major.recommendationScore}%`,
                    backgroundColor: getScoreColor(major.recommendationScore)
                  }"
                ></div>
              </div>
              <div class="score-text">{{ major.recommendationScore }}</div>
            </div>
            <div class="score-label">
              {{
                major.recommendationScore >= 80
                  ? '强烈推荐'
                  : major.recommendationScore >= 60
                  ? '较好选择'
                  : '一般'
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          @click="collectAll"
        >
          <i class="el-icon-star"></i>
          收藏全部
        </el-button>
        <el-button @click="exportComparison">
          <i class="el-icon-download"></i>
          导出对比
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <i class="el-icon-picture"></i>
      <p>选择2-3个专业开始对比</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useDisciplinesStore } from '@/stores/disciplines'
import { useFavoritesStore } from '@/stores/favorites'

const disciplinesStore = useDisciplinesStore()
const favoritesStore = useFavoritesStore()

const selectedMajorIds = ref(['', '', ''])
const comparison = ref(null)
const comparing = ref(false)

const availableMajors = computed(() => {
  const majors = []
  disciplinesStore.disciplines.forEach(discipline => {
    const groups = disciplinesStore.majorGroupsCache[discipline.id] || []
    groups.forEach(group => {
      group.majors?.forEach(major => {
        majors.push({
          ...major,
          disciplineId: discipline.id,
          disciplineName: discipline.name,
          groupId: group.id,
          groupName: group.name
        })
      })
    })
  })
  return majors
})

const selectedMajors = computed(() => {
  return selectedMajorIds.value
    .filter(id => id)
    .map(id => availableMajors.value.find(m => m.id === id))
    .filter(Boolean)
})

async function startComparison() {
  if (selectedMajors.value.length < 2) {
    ElMessage.warning('请至少选择2个专业进行对比')
    return
  }

  comparing.value = true

  try {
    // 加载所有选中专业的详细信息
    const majorDetails = await Promise.all(
      selectedMajors.value.map(major => disciplinesStore.loadMajorDetails(major.id))
    )

    // 构建对比数据
    comparison.value = {
      majors: majorDetails,
      details: buildComparisonDetails(majorDetails),
      differences: analyzeDifferences(majorDetails)
    }

    ElMessage.success('对比加载成功')
  } catch (err) {
    ElMessage.error('对比加载失败')
    console.error(err)
  } finally {
    comparing.value = false
  }
}

function buildComparisonDetails(majors) {
  return [
    {
      attribute: '专业代码',
      [majors[0].id]: majors[0].code,
      [majors[1]?.id]: majors[1]?.code || '-',
      [majors[2]?.id]: majors[2]?.code || '-'
    },
    {
      attribute: '所属专业类',
      [majors[0].id]: majors[0].majorGroupName,
      [majors[1]?.id]: majors[1]?.majorGroupName || '-',
      [majors[2]?.id]: majors[2]?.majorGroupName || '-'
    },
    {
      attribute: '难度等级',
      [majors[0].id]: difficultyLabel(majors[0].difficulty),
      [majors[1]?.id]: majors[1] ? difficultyLabel(majors[1].difficulty) : '-',
      [majors[2]?.id]: majors[2] ? difficultyLabel(majors[2].difficulty) : '-'
    },
    {
      attribute: '热度指数',
      [majors[0].id]: `${majors[0].popularity}%`,
      [majors[1]?.id]: majors[1] ? `${majors[1].popularity}%` : '-',
      [majors[2]?.id]: majors[2] ? `${majors[2].popularity}%` : '-'
    },
    {
      attribute: '题目数量',
      [majors[0].id]: majors[0].questionCount,
      [majors[1]?.id]: majors[1]?.questionCount || '-',
      [majors[2]?.id]: majors[2]?.questionCount || '-'
    },
    {
      attribute: '细分方向数',
      [majors[0].id]: majors[0].specializations?.length || 0,
      [majors[1]?.id]: majors[1]?.specializations?.length || 0,
      [majors[2]?.id]: majors[2]?.specializations?.length || 0
    }
  ]
}

function analyzeDifferences(majors) {
  const differences = []

  // 难度差异
  const difficulties = majors.map(m => m.difficulty).filter(Boolean)
  if (new Set(difficulties).size > 1) {
    const easiest = majors.reduce((a, b) => (a.difficulty < b.difficulty ? a : b))
    differences.push({
      label: '难度差异',
      detail: `${easiest.name} 难度最低`
    })
  }

  // 热度差异
  const popularities = majors.map(m => m.popularity || 0)
  const maxPop = Math.max(...popularities)
  const minPop = Math.min(...popularities)
  if (maxPop - minPop > 20) {
    const hottest = majors.find(m => m.popularity === maxPop)
    differences.push({
      label: '热度差异',
      detail: `${hottest.name} 热度最高（${maxPop}%）`
    })
  }

  // 题目数量差异
  const questions = majors.map(m => m.questionCount || 0)
  const maxQ = Math.max(...questions)
  const minQ = Math.min(...questions)
  if (maxQ - minQ > 100) {
    const mostQuestions = majors.find(m => m.questionCount === maxQ)
    differences.push({
      label: '题库规模',
      detail: `${mostQuestions.name} 题目最多（${maxQ}道）`
    })
  }

  return differences
}

function isHighlighted(attribute, value) {
  if (!value || value === '-') return false
  if (attribute === '热度指数') {
    const numeric = parseInt(value)
    return numeric >= 80
  }
  if (attribute === '题目数量') {
    return Number(value) > 500
  }
  return false
}

function formatValue(value, attribute) {
  if (value === '-' || value === null) return '-'
  if (attribute === '题目数量') return `${value} 道`
  if (attribute === '热度指数' && !value.includes('%')) return `${value}%`
  return value
}

function difficultyLabel(difficulty) {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

function getScoreColor(score) {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#409eff'
  if (score >= 40) return '#e6a23c'
  return '#f56c6c'
}

function updateComparison() {
  // 清空对比结果，但保留选择
  comparison.value = null
}

function resetComparison() {
  selectedMajorIds.value = ['', '', '']
  comparison.value = null
}

function collectAll() {
  selectedMajors.value.forEach(major => {
    favoritesStore.addFavorite(major, 'major', {
      notes: '从对比工具收藏'
    })
  })
}

function exportComparison() {
  if (!comparison.value) return

  const csv = generateCSV()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `major-comparison-${new Date().toISOString().split('T')[0]}.csv`)
  link.click()
  URL.revokeObjectURL(url)
}

function generateCSV() {
  const headers = ['对比项', ...comparison.value.majors.map(m => m.name)].join(',')
  const rows = comparison.value.details.map(row => {
    return [
      row.attribute,
      ...comparison.value.majors.map(m => row[m.id] || '-')
    ].join(',')
  })
  return [headers, ...rows].join('\n')
}
</script>

<style scoped lang="scss">
.comparison-tool {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  min-height: 400px;
}

.tool-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);

  .title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .subtitle {
    margin: 8px 0 0 0;
    color: #666;
    font-size: 13px;
  }
}

.selector-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .selector-label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 12px;
  }

  .major-selector {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
    margin-bottom: 16px;

    .major-select {
      width: 100%;
    }
  }

  .selector-actions {
    display: flex;
    gap: 12px;

    button {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

.comparison-result {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-section {
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .majors-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .major-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    }

    .major-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .icon {
        font-size: 28px;
      }

      .name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }

    .major-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;

        .label {
          color: #999;
        }

        .value {
          font-weight: 600;
          color: #333;

          &.badge {
            padding: 4px 8px;
            border-radius: 4px;
            background: #f0f0f0;
            font-size: 12px;

            &.beginner {
              background: #d4edda;
              color: #155724;
            }

            &.intermediate {
              background: #fff3cd;
              color: #856404;
            }

            &.advanced,
            &.hard {
              background: #f8d7da;
              color: #721c24;
            }
          }
        }
      }
    }
  }
}

.comparison-table-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
  }

  ::v-deep(.comparison-table) {
    .attribute-column {
      background-color: #f5f7fa !important;
      font-weight: 600;
    }

    .value-cell {
      padding: 8px;
      text-align: center;

      &.highlight {
        background-color: #fff3cd;
        font-weight: 600;
      }
    }
  }
}

.difference-analysis-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
  }

  .differences-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .difference-item {
      padding: 12px;
      background: #f5f7fa;
      border-left: 4px solid #667eea;
      border-radius: 4px;

      .difference-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .difference-detail {
        font-size: 13px;
        color: #666;
      }
    }
  }
}

.recommendation-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
  }

  .recommendation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;

    .recommendation-item {
      .major-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
      }

      .score-container {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .score-bar {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;

          .score-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
          }
        }

        .score-text {
          width: 30px;
          text-align: right;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
      }

      .score-label {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;

  i {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
  }
}
</style>
