<template>
  <div class="pro-preview">
    <div class="panel chart-panel">
      <div class="panel-header">
        <h3>学习动态</h3>
        <p>过去 7 天的学习进度</p>
      </div>
      <ProgressChart :data="chartList" />
    </div>

    <div class="panel wrong-panel">
      <div class="panel-header between">
        <div>
          <h3>错题本</h3>
          <p>回顾你最近的错误</p>
        </div>
        <span class="link-text">回顾你最近的错误</span>
      </div>
      <div class="wrong-list">
        <div v-for="item in wrongList" :key="item" class="wrong-item">
          <div class="wrong-icon">
            <el-icon><DocumentCopy /></el-icon>
          </div>
          <span class="wrong-text">{{ item }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProgressChart from '@/components/charts/ProgressChart.vue'
import { DocumentCopy } from '@element-plus/icons-vue'

const chartList = [
  { name: '周一', value: 40, avg: 30 },
  { name: '周二', value: 65, avg: 45 },
  { name: '周三', value: 50, avg: 55 },
  { name: '周四', value: 85, avg: 50 },
  { name: '周五', value: 60, avg: 65 },
  { name: '周六', value: 90, avg: 70 },
  { name: '周日', value: 75, avg: 60 }
]

const wrongList = ['React useEffect 依赖项', 'Java HashMap 内部实现', 'SQL 索引优化']
</script>

<style scoped lang="scss">
.pro-preview {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  padding: 24px;
  background: #f7f8fb;
  min-height: 100vh;
}

.panel {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
  border: 1px solid #eef0f4;
  padding: 16px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 800;
    color: #1a202c;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #8a8f98;
  }
}

.chart-panel {
  height: 520px;
}

.wrong-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wrong-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff5eb;
  border: 1px solid #ffe7d4;
}

.wrong-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
}

.wrong-text {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
}

.link-text {
  font-size: 12px;
  color: #8a8f98;
}
</style>
