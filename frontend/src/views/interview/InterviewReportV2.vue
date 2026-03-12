<template>
  <div class="report-v2-container">
    <!-- 导出区域（包裹在 reportRef 中）-->
    <div ref="reportRef" class="report-printable">
      <!-- 渐变 Header -->
      <div class="report-header">
        <div class="report-header-inner">
          <div class="report-meta">
            <h1 class="report-job-title">{{ report.jobTitle || '综合面试' }}</h1>
            <div class="report-tags">
              <span class="tag">{{ report.difficulty || '中级' }}</span>
              <span class="tag">⏱ {{ formatTime(report.duration) }}</span>
              <span class="tag">{{ formatDate(report.endTime) }}</span>
            </div>
          </div>
          <div class="overall-score-badge" :style="{ '--c': scoreColor(report.overallScore) }">
            <span class="score-big">{{ report.overallScore }}</span>
            <span class="score-text">综合评分</span>
          </div>
        </div>
      </div>

      <!-- 三项评分 -->
      <div class="score-grid">
        <div class="score-item-card">
          <div class="score-icon">💻</div>
          <div class="score-value" :style="{ color: scoreColor(report.technicalScore) }">
            {{ report.technicalScore }}
          </div>
          <div class="score-label">技术能力</div>
          <div class="score-bar">
            <div
              class="score-bar-fill"
              :style="{ width: report.technicalScore + '%', background: scoreColor(report.technicalScore) }"
            ></div>
          </div>
        </div>
        <div class="score-item-card">
          <div class="score-icon">💬</div>
          <div class="score-value" :style="{ color: scoreColor(report.communicationScore) }">
            {{ report.communicationScore }}
          </div>
          <div class="score-label">表达能力</div>
          <div class="score-bar">
            <div
              class="score-bar-fill"
              :style="{ width: report.communicationScore + '%', background: scoreColor(report.communicationScore) }"
            ></div>
          </div>
        </div>
        <div class="score-item-card">
          <div class="score-icon">🧠</div>
          <div class="score-value" :style="{ color: scoreColor(report.logicalScore) }">
            {{ report.logicalScore }}
          </div>
          <div class="score-label">逻辑思维</div>
          <div class="score-bar">
            <div
              class="score-bar-fill"
              :style="{ width: report.logicalScore + '%', background: scoreColor(report.logicalScore) }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 题目详情 -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">逐题详情</span>
          <span class="section-count">共 {{ report.answers.length }} 轮问答</span>
        </div>

        <div v-if="report.answers.length === 0" class="empty-hint">
          本次面试暂无问答记录
        </div>

        <div
          v-for="(item, i) in report.answers"
          :key="i"
          class="answer-item"
        >
          <div class="answer-item-header" @click="toggleExpand(i)">
            <div class="answer-item-left">
              <span class="answer-num">Q{{ i + 1 }}</span>
              <span class="answer-question">{{ item.question }}</span>
            </div>
            <div class="answer-item-right">
              <span v-if="item.score" class="score-badge" :style="{ '--sc': scoreColor(item.score) }">
                {{ Math.round(item.score) }} 分
              </span>
              <span class="expand-icon">{{ expandedItems.has(i) ? '▲' : '▼' }}</span>
            </div>
          </div>
          <div v-if="expandedItems.has(i)" class="answer-item-body">
            <div class="answer-section">
              <h4>我的回答</h4>
              <p>{{ item.answer || '（未录入）' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 总结与建议 -->
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">总结与建议</span>
        </div>
        <p class="summary-text">{{ report.summary }}</p>
        <ul v-if="report.suggestions?.length" class="suggestions-list">
          <li v-for="(s, i) in report.suggestions" :key="i">{{ s }}</li>
        </ul>
      </div>
    </div>

    <!-- 操作按钮（不在 reportRef 中，不影响 PDF）-->
    <div class="action-bar no-print">
      <button class="action-btn secondary-btn" @click="goBack">返回首页</button>
      <button class="action-btn secondary-btn" @click="restartInterview">再次面试</button>
      <button class="action-btn print-btn" @click="printReport">打印报告</button>
      <button class="action-btn primary-btn" :disabled="exporting" @click="exportPDF">
        {{ exporting ? '导出中...' : '导出 PDF' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ===================== 数据 =====================
const raw = history.state || {}

const report = reactive({
  jobTitle: raw.jobTitle || '',
  difficulty: raw.difficulty || '中级',
  duration: raw.duration || 0,
  endTime: raw.endTime || new Date().toISOString(),
  answers: Array.isArray(raw.answers) ? raw.answers : [],
  overallScore: Math.round(raw.overallScore || 0),
  technicalScore: Math.round(raw.technicalScore || 0),
  communicationScore: Math.round(raw.communicationScore || 0),
  logicalScore: Math.round(raw.logicalScore || 0),
  summary: raw.summary || '本次面试已完成。',
  suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
})

const expandedItems = reactive(new Set())
const exporting = ref(false)
const reportRef = ref(null)

// ===================== 工具函数 =====================
const scoreColor = (score) => {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#f59e0b'
  return '#ef4444'
}

const formatTime = (s) => {
  if (!s) return '0分0秒'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}分${sec}秒`
}

const formatDate = (dt) => {
  if (!dt) return ''
  return new Date(dt).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const toggleExpand = (i) => {
  if (expandedItems.has(i)) {
    expandedItems.delete(i)
  } else {
    expandedItems.add(i)
  }
}

// ===================== 操作 =====================
const goBack = () => router.push('/')
const restartInterview = () => router.push('/interview/ai')
const printReport = () => window.print()

const exportPDF = async () => {
  if (exporting.value) return
  exporting.value = true

  try {
    // 展开所有答题详情，以便 PDF 中可见
    report.answers.forEach((_, i) => expandedItems.add(i))

    // 动态导入（避免首屏加载）
    const [html2canvasModule, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const html2canvas = html2canvasModule.default

    await new Promise(r => setTimeout(r, 300)) // 等待 DOM 更新

    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f0f2f5',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * pageWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const filename = `面试报告_${report.jobTitle || '综合'}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`
    pdf.save(filename)
  } catch (e) {
    console.error('[InterviewReportV2] PDF export error:', e)
    alert('导出 PDF 失败：' + e.message)
  } finally {
    exporting.value = false
  }
}

// 初始展开第一题
onMounted(() => {
  if (report.answers.length > 0) {
    expandedItems.add(0)
  }
})
</script>

<style scoped>
.report-v2-container {
  background: #f0f2f5;
  min-height: 100vh;
  padding-bottom: 40px;
}

.report-printable {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 0 24px;
}

/* ===== Header ===== */
.report-header {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  padding: 32px 32px 28px;
  color: #fff;
  margin-bottom: 24px;
}

.report-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.report-job-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 10px;
}

.report-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
}

.overall-score-badge {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid var(--c, #22c55e);
  background: rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-big {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

.score-text {
  font-size: 11px;
  color: rgba(255,255,255,0.8);
  margin-top: 3px;
}

/* ===== Score Grid ===== */
.score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 24px;
  margin-bottom: 20px;
}

.score-item-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}

.score-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.score-value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 6px;
}

.score-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.score-bar {
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* ===== Section Card ===== */
.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin: 0 24px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-weight: 700;
  font-size: 16px;
  color: #111827;
}

.section-count {
  font-size: 13px;
  color: #9ca3af;
}

.empty-hint {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 24px 0;
}

/* ===== Answer Items ===== */
.answer-item {
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

.answer-item:last-child {
  margin-bottom: 0;
}

.answer-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  gap: 12px;
  background: #fafafa;
  transition: background 0.15s;
}

.answer-item-header:hover {
  background: #f0f0ff;
}

.answer-item-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.answer-num {
  background: #eef2ff;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.answer-question {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  font-weight: 500;
}

.answer-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.score-badge {
  background: color-mix(in srgb, var(--sc) 15%, white);
  color: var(--sc);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.expand-icon {
  font-size: 11px;
  color: #9ca3af;
}

.answer-item-body {
  padding: 16px;
  border-top: 1px solid #f3f4f6;
  background: #fff;
}

.answer-section h4 {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}

.answer-section p {
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
  margin: 0;
}

/* ===== Summary ===== */
.summary-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
  margin: 0 0 16px;
}

.suggestions-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-list li {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

/* ===== Action Bar ===== */
.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.secondary-btn {
  background: #fff;
  color: #374151;
  border: 1.5px solid #e5e7eb;
}

.secondary-btn:hover {
  border-color: #4F46E5;
  color: #4F46E5;
}

.print-btn {
  background: #f3f4f6;
  color: #374151;
}

.print-btn:hover {
  background: #e5e7eb;
}

.primary-btn {
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  color: #fff;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== Print CSS ===== */
@media print {
  .no-print {
    display: none !important;
  }

  .report-v2-container {
    background: white;
  }

  .section-card,
  .score-item-card {
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
}
</style>
