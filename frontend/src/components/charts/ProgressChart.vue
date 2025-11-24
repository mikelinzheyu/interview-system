<template>
  <div class="progress-chart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

interface ChartDataPoint {
  name: string
  value: number
  avg: number
}

const props = defineProps<{
  data: ChartDataPoint[]
}>()

const chartContainer = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const initChart = (data: ChartDataPoint[]) => {
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
      right: 10,
      bottom: 30,
      left: 0,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#909399',
        fontSize: 12
      }
    },
    yAxis: {
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
    series: [
      {
        data: data.map(item => item.value),
        type: 'line',
        smooth: 0.4,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 113, 227, 0.3)' },
            { offset: 1, color: 'rgba(0, 113, 227, 0)' }
          ])
        },
        lineStyle: {
          color: '#0071e3',
          width: 2
        },
        itemStyle: {
          color: '#0071e3',
          borderColor: 'white',
          borderWidth: 2
        },
        name: '学习进度',
        animationDuration: 1500
      },
      {
        data: data.map(item => item.avg),
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#909399',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#909399'
        },
        name: '平均值',
        animationDuration: 1500
      }
    ],
    tooltip: {
      trigger: 'axis',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderColor: '#e5e7eb',
      textStyle: {
        color: '#303133'
      },
      axisPointer: {
        lineStyle: {
          color: '#0071e3',
          width: 1
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
.progress-chart {
  width: 100%;
  height: 300px;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
