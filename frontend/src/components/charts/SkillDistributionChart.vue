<template>
  <div class="skill-distribution-chart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

interface SkillData {
  name: string
  value: number
}

const props = defineProps<{
  data: SkillData[]
}>()

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const initChart = (data: SkillData[]) => {
  if (!chartContainer.value) return

  if (!chart) {
    chart = echarts.init(chartContainer.value, null, {
      renderer: 'canvas',
      useDirtyRect: true
    })
  }

  const option: echarts.EChartsOption = {
    grid: {
      top: 10,
      right: 20,
      bottom: 0,
      left: 80,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      axisLabel: {
        color: '#909399',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#909399',
        fontSize: 12
      }
    },
    series: [
      {
        data: data.map(item => item.value),
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#0071e3' },
            { offset: 1, color: '#67c23a' }
          ]),
          borderRadius: [0, 8, 8, 0]
        },
        animationDuration: 1500,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          color: '#303133',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#303133'
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 113, 227, 0.1)'
        }
      }
    }
  }

  chart.setOption(option)
}

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

onMounted(() => {
  initChart(props.data)
  window.addEventListener('resize', handleResize)
})

watch(
  () => props.data,
  (newData) => {
    if (newData && newData.length > 0) {
      initChart(newData)
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
.skill-distribution-chart {
  width: 100%;
  height: 250px;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 250px;
}
</style>
