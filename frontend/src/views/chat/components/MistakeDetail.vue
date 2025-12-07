<template>
  <!-- QUESTION BANK MODE -->
  <div v-if="isQuestionBank" class="mistake-detail-page animate-fade-in">
    <!-- Top Bar -->
    <div class="top-bar sticky">
      <div class="back-btn" @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <div class="actions">
        <div class="timer-badge">
          <el-icon><Timer /></el-icon>
          {{ formatTime(qbTimer) }}
        </div>
        <button 
          class="action-icon"
          :class="{ active: item.isIgnored }"
          @click="$emit('ignore', item.id)"
          :title="item.isIgnored ? '恢复题目' : '忽略此题'"
        >
          <el-icon v-if="item.isIgnored"><View /></el-icon>
          <el-icon v-else><Hide /></el-icon>
        </button>
        <button 
          class="action-icon"
          :class="{ active: item.isFavorite }"
          @click="$emit('toggle-favorite', item.id)"
        >
          <el-icon v-if="item.isFavorite"><StarFilled /></el-icon>
          <el-icon v-else><Star /></el-icon>
        </button>
      </div>
    </div>

    <div class="content-container">
      <!-- 1. Header & Question -->
      <div class="section-header">
        <h1 class="question-title">{{ item.question }}</h1>
        <div class="tags-row">
          <span class="tag emerald">基础</span>
          <span class="tag gray">简答题</span>
          <span v-for="tag in item.tags" :key="tag" class="tag blue">{{ tag }}</span>
        </div>
        <div class="question-desc">
          <p>
            {{ item.snippet }}
            <br/>
            (此处为模拟的完整题目描述：请结合实际应用场景，详细阐述该技术点的原理、优缺点及选型依据。)
          </p>
        </div>
      </div>

      <!-- 2. Answer Input -->
      <div class="section-answer">
        <div class="section-title">
          <h3>提交你的答案</h3>
        </div>
        <div class="input-wrapper">
          <textarea
            v-model="qbAnswer"
            class="answer-textarea"
            placeholder="写下你的解题思路或关键要点..."
          ></textarea>
        </div>
        <div class="answer-actions">
          <el-button type="primary" @click="submitAnswer">提交作答</el-button>
          <button class="reset-btn" @click="resetAnswer">
            <el-icon><Refresh /></el-icon>
            重置
          </button>
          <span class="timer-text">已用时 {{ formatTime(qbTimer) }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 3. Expandable Sections -->
      <div class="expandable-sections">
        <!-- Reference -->
        <div class="expand-card">
          <div class="expand-header" @click="toggleExpand('reference')">
            <span class="title">参考答案</span>
            <el-icon v-if="expandedSection === 'reference'"><ArrowUp /></el-icon>
            <el-icon v-else><ArrowRight /></el-icon>
          </div>
          <div v-if="expandedSection === 'reference'" class="expand-content animate-fade-in">
            <div class="prose">
              <p>这是标准参考答案的内容...</p>
              <ul>
                <li>关键点一：原理阐述准确</li>
                <li>关键点二：包含实际案例</li>
                <li>关键点三：逻辑清晰</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Analysis -->
        <div class="expand-card">
          <div class="expand-header" @click="toggleExpand('analysis')">
            <span class="title">解析说明</span>
            <el-icon v-if="expandedSection === 'analysis'"><ArrowUp /></el-icon>
            <el-icon v-else><ArrowRight /></el-icon>
          </div>
          <div v-if="expandedSection === 'analysis'" class="expand-content animate-fade-in">
            <div class="prose">
              <p>此处是对题目的详细解析，包括考点分析、常见误区以及扩展知识。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. History -->
      <div class="section-history">
        <div class="history-title">
          <div class="bar"></div>
          <h3>最近练习记录</h3>
        </div>
        <div class="history-list">
          <div class="timeline-line"></div>
          <div v-for="(rec, i) in [1, 2, 3]" :key="i" class="history-item">
            <div class="dot"></div>
            <div class="card">
              <div class="info">
                <span class="time">{{ i === 0 ? '2分钟前' : `${i + 1}天前` }}</span>
                <span class="duration">用时 12分30秒</span>
              </div>
              <div class="status">
                <span class="badge" :class="i === 0 ? 'rose' : 'emerald'">
                  {{ i === 0 ? '错误' : '正确' }}
                </span>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- INTERVIEW MODE -->
  <div v-else class="mistake-detail-page interview-mode animate-fade-in">
    <!-- Top Nav -->
    <div class="top-bar sticky blur-bg">
      <div class="nav-content">
        <button class="back-btn-simple" @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回列表</span>
        </button>
        <div class="nav-actions">
          <span class="last-review">上次复习: {{ item.lastReviewed }}</span>
          <div class="v-divider"></div>
          <button 
            class="icon-btn-circle"
            :class="{ active: item.isIgnored }"
            @click="$emit('ignore', item.id)"
            :title="item.isIgnored ? '恢复题目' : '忽略此题'"
          >
            <el-icon v-if="item.isIgnored"><View /></el-icon>
            <el-icon v-else><Hide /></el-icon>
          </button>
          <button 
            class="icon-btn-circle"
            :class="{ active: item.isFavorite }"
            @click="$emit('toggle-favorite', item.id)"
            title="收藏"
          >
            <el-icon v-if="item.isFavorite"><StarFilled /></el-icon>
            <el-icon v-else><Star /></el-icon>
          </button>
          <button 
            class="master-btn"
            :class="{ mastered: item.mastery === 100 }"
            @click="$emit('toggle-master', item.id)"
          >
            <el-icon><CircleCheckFilled v-if="item.mastery === 100"/><CircleCheck v-else/></el-icon>
            <span>{{ item.mastery === 100 ? '已掌握' : '标记掌握' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <div class="left-column">
        <!-- 1. Header -->
        <div class="header-block">
          <div class="meta-tags">
            <span class="type-tag" :class="typeClass">
              {{ item.type }}
            </span>
            <span v-for="tag in item.tags" :key="tag" class="simple-tag">
              <el-icon><PriceTag /></el-icon> {{ tag }}
            </span>
          </div>
          <h1 class="main-title">{{ item.question }}</h1>
          <p class="source-info">
            <el-icon><Microphone /></el-icon>
            面试来源：前端开发工程师面试 (AI) · 2023/10/28
          </p>
        </div>

        <!-- 2. Audio & Transcript -->
        <div class="card audio-card">
          <div class="card-header-sm">
            <h3><el-icon><Clock /></el-icon> 场景回溯</h3>
          </div>
          <div class="card-body">
            <!-- Audio Player Visual -->
            <div class="audio-player">
              <div class="bg-decoration"></div>
              <button class="play-btn" @click="isPlaying = !isPlaying">
                <el-icon v-if="isPlaying"><VideoPause /></el-icon>
                <el-icon v-else><VideoPlay /></el-icon>
              </button>
              <div class="wave-container">
                <div class="wave-bars">
                  <div 
                    v-for="(h, i) in [40,60,45,70,90,60,30,50,70,85,60,40,30,50,65,80,50,30,45,60,75,50,40,60,80,40]" 
                    :key="i" 
                    class="bar"
                    :class="{ playing: isPlaying }"
                    :style="{ height: h + '%', opacity: i > 15 ? 0.3 : 1 }"
                  ></div>
                </div>
                <div class="time-labels">
                  <span>00:15</span>
                  <span>01:42</span>
                </div>
              </div>
            </div>

            <!-- Transcript -->
            <div class="transcript">
              <div class="timeline-marker"></div>
              <div class="speaker-label">我的回答</div>
              <p class="text">
                {{ item.snippet }} ...除此之外，我认为 Promise 的链式调用还能解决回调地狱的问题。
                关于具体的执行顺序，应该是先执行所有的同步代码，然后再去执行异步代码。
                <el-tooltip
                  effect="dark"
                  content="此处概念模糊：宏任务(setTimeout)优先级实际上低于微任务(Promise)。"
                  placement="top"
                >
                  <span class="highlight-error">
                    异步代码里好像是先执行 setTimeout
                  </span>
                </el-tooltip>，
                然后再执行 Promise 的 then 回调？这一点我有点记不太清了。
              </p>
            </div>
          </div>
        </div>

        <!-- 3. Diagnosis -->
        <div class="diagnosis-section">
          <h3 class="section-heading">
            <el-icon class="icon-indigo"><MagicStick /></el-icon>
            AI 智能诊断
          </h3>
          <div class="diagnosis-grid">
            <div 
              v-for="(diag, idx) in analysisData.diagnosis" 
              :key="idx" 
              class="diag-card"
              :class="diag.type"
            >
              <div class="color-strip"></div>
              <div class="diag-header">
                <div class="icon-box">
                  <component :is="diag.icon" />
                </div>
                <span class="badge">{{ diag.type === 'concept' ? 'Knowledge' : 'Logic' }}</span>
              </div>
              <h4>{{ diag.title }}</h4>
              <p class="desc">{{ diag.desc }}</p>
              <div class="suggestion">
                <span class="bold">💡 建议:</span> {{ diag.suggestion }}
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Comparison -->
        <div class="card comparison-card">
          <div class="card-header-bg">
            <h3><el-icon class="text-emerald"><Notebook /></el-icon> 深度解析 & 参考</h3>
            <button class="toggle-btn" @click="showRefAnswer = !showRefAnswer">
              {{ showRefAnswer ? '收起解析' : '展开解析' }}
              <el-icon><component :is="showRefAnswer ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
            </button>
          </div>
          <div v-if="showRefAnswer" class="card-body animate-fade-in">
            <div class="ref-section">
              <h4><el-icon class="text-emerald"><ChatLineSquare /></el-icon> 标准回答逻辑</h4>
              <div class="ref-content">
                <p>在 JavaScript 事件循环中，<strong>同步代码</strong>首先执行。接着执行<strong>微任务 (Microtasks)</strong>（如 <code>Promise.then</code>），最后执行<strong>宏任务</strong>。</p>
                <p class="mt-2">关键点在于：<strong>每次宏任务执行完毕后，浏览器都会优先清空微任务队列</strong>。</p>
              </div>
            </div>
            <div class="ref-actions">
              <button class="ref-action-btn group">
                <div class="left">
                  <div class="icon-sq"><el-icon><CopyDocument /></el-icon></div>
                  <div>
                    <div class="t1">代码示例</div>
                    <div class="t2">Event Loop 执行顺序 Demo</div>
                  </div>
                </div>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </button>
               <button class="ref-action-btn group">
                <div class="left">
                  <div class="icon-sq"><el-icon><Aim /></el-icon></div>
                  <div>
                    <div class="t1">专项练习</div>
                    <div class="t2">5 道宏微任务排序题</div>
                  </div>
                </div>
                <el-icon class="arrow"><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column">
        <!-- 1. Score Card -->
        <div class="card score-card">
          <div class="top-gradient"></div>
          <h3>综合掌握度</h3>
          
          <!-- Radial Chart (CSS only approximation) -->
          <div class="radial-chart">
            <svg viewBox="0 0 100 100">
              <circle class="bg-ring" cx="50" cy="50" r="40"></circle>
              <circle 
                class="progress-ring" 
                :class="getScoreRingColor(analysisData.score)"
                cx="50" cy="50" r="40"
                :style="{ strokeDashoffset: 251.2 - (251.2 * analysisData.score) / 100 }"
              ></circle>
            </svg>
            <div class="center-text">
              <span class="score-val" :class="getScoreColor(analysisData.score)">{{ analysisData.score }}</span>
              <span class="total">/ 100</span>
            </div>
          </div>

          <div class="metrics">
            <div class="metric-row">
              <span class="label"><el-icon><Lightning /></el-icon> 流畅度</span>
              <div class="progress">
                <div class="track"><div class="fill emerald" style="width: 85%"></div></div>
                <span class="val">85</span>
              </div>
            </div>
            <div class="metric-row">
              <span class="label"><el-icon><Cpu /></el-icon> 逻辑性</span>
              <div class="progress">
                <div class="track"><div class="fill amber" style="width: 60%"></div></div>
                <span class="val">60</span>
              </div>
            </div>
            <div class="metric-row">
              <span class="label"><el-icon><Aim /></el-icon> 准确度</span>
              <div class="progress">
                <div class="track"><div class="fill indigo" style="width: 75%"></div></div>
                <span class="val">75</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. History -->
        <div class="card history-card">
          <h3><el-icon><Calendar /></el-icon> 复习轨迹</h3>
          <div class="history-list-sm">
            <div class="line"></div>
            <div v-for="(h, idx) in analysisData.history" :key="idx" class="item">
              <div class="dot" :class="{ active: idx === 0 }"></div>
              <span class="date" :class="{ active: idx === 0 }">{{ h.date }}</span>
              <div class="score-bar">
                <div class="bar" :class="h.score >= 60 ? 'emerald' : 'rose'" :style="{ width: h.score/2 + 'px' }"></div>
                <span class="val" :class="h.score >= 60 ? 'emerald' : 'rose'">{{ h.score }}分</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Action -->
        <button class="retry-btn">
          <el-icon><RefreshLeft /></el-icon>
          再答一次
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Star, StarFilled, Timer, 
  Refresh, CircleCheck, CircleCheckFilled, PriceTag, Microphone, Clock,
  VideoPlay, VideoPause, MagicStick, Notebook, ChatLineSquare, CopyDocument,
  Aim, Calendar, RefreshLeft, Lightning, Cpu, View, Hide
} from '@element-plus/icons-vue'
import { type MistakeItem, SourceType, MistakeType } from '../types'

const props = defineProps<{
  item: MistakeItem
}>()

const emit = defineEmits(['back', 'toggle-master', 'toggle-favorite', 'ignore'])

// --- Common Logic ---
const isQuestionBank = computed(() => 
  props.item.source === SourceType.QUESTION_BANK || 
  props.item.source === SourceType.MOCK_EXAM
)

const typeClass = computed(() => {
  switch(props.item.type) {
    case MistakeType.KNOWLEDGE_GAP: return 'rose'
    case MistakeType.LOGIC_CONFUSION: return 'amber'
    default: return 'indigo'
  }
})

// --- Question Bank State ---
const qbAnswer = ref('')
const qbTimer = ref(0)
const isTimerRunning = ref(true)
const expandedSection = ref<'reference' | 'analysis' | null>(null)
let timerInterval: any = null

// --- Interview Mode State ---
const isPlaying = ref(false)
const showRefAnswer = ref(true)

// --- Mock Analysis Data ---
const analysisData = {
  score: props.item.mastery || 65,
  diagnosis: [
    {
      type: 'concept',
      icon: 'Cpu', // Mapped dynamically
      title: '核心概念偏差',
      desc: '对事件循环(Event Loop)的宏任务与微任务执行顺序理解有误，混淆了 setTimeout 和 Promise 的优先级。',
      suggestion: '建议重新阅读《JavaScript 高级程序设计》第 17 章，或并在控制台运行 Demo 验证。'
    },
    {
      type: 'logic',
      icon: 'Lightning',
      title: '因果链条缺失',
      desc: '在解释现象时，直接跳到了结果，中间缺乏“调用栈清空”这一关键步骤的描述。',
      suggestion: '尝试使用“因为...所以...”的句式强迫自己补全逻辑链路。'
    }
  ],
  history: [
    { date: '10/28', score: 60 },
    { date: '10/25', score: 45 },
    { date: '10/20', score: 20 },
  ]
}

// --- Methods ---
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins > 0 ? mins + '分' : ''}${secs}秒`
}

const submitAnswer = () => {
  isTimerRunning.value = false
}

const resetAnswer = () => {
  qbAnswer.value = ''
  qbTimer.value = 0
  isTimerRunning.value = true
  expandedSection.value = null
}

const toggleExpand = (sec: 'reference' | 'analysis') => {
  expandedSection.value = expandedSection.value === sec ? null : sec
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald'
  if (score >= 60) return 'text-amber'
  return 'text-rose'
}

const getScoreRingColor = (score: number) => {
  if (score >= 80) return 'stroke-emerald'
  if (score >= 60) return 'stroke-amber'
  return 'stroke-rose'
}

// --- Lifecycle ---
onMounted(() => {
  if (isQuestionBank.value) {
    timerInterval = setInterval(() => {
      if (isTimerRunning.value) {
        qbTimer.value++
      }
    }, 1000)
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped lang="scss">
// Vars
$bg-page: #f8fafc;
$border-color: #e2e8f0;
$primary: #4f46e5;
$primary-light: #eef2ff;
$text-main: #111827;
$text-sub: #6b7280;
$rose: #f43f5e;
$rose-bg: #fff1f2;
$amber: #f59e0b;
$amber-bg: #fffbeb;
$emerald: #10b981;
$emerald-bg: #ecfdf5;
$blue-bg: #eff6ff;
$blue: #3b82f6;
$gray-bg: #f3f4f6;

// Animations
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.mistake-detail-page {
  background: white;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;

  &.interview-mode {
    background: #f8fafc;
  }
}

// --- Question Bank Styles ---
.top-bar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-bottom: 1px solid $border-color;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  &.blur-bg { background: rgba(255,255,255,0.8); }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $text-sub;
    cursor: pointer;
    transition: color 0.2s;
    &:hover { color: $text-main; }
    span { font-size: 14px; font-weight: 500; }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .timer-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: $primary-light;
      color: $primary;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      font-family: monospace;
    }

    .action-icon {
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      font-size: 20px;
      &:hover { color: $amber; }
      &.active { color: $amber; }
    }
  }
}

.content-container {
  max-width: 896px; // max-w-4xl
  margin: 0 auto;
  width: 100%;
  padding: 32px 24px 128px;
}

.section-header {
  margin-bottom: 24px;
  .question-title { font-size: 24px; font-weight: 700; color: $text-main; margin-bottom: 16px; line-height: 1.3; }
  .tags-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    .tag {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid transparent;
      &.emerald { background: $emerald-bg; color: #059669; border-color: #d1fae5; }
      &.gray { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb; }
      &.blue { background: $blue-bg; color: #2563eb; border-color: #dbeafe; }
    }
  }
  .question-desc { color: #374151; line-height: 1.6; font-size: 16px; }
}

.section-answer {
  margin-bottom: 32px;
  .section-title { margin-bottom: 12px; h3 { font-size: 16px; font-weight: 700; color: $text-main; margin: 0; } }
  .input-wrapper { margin-bottom: 16px; }
  .answer-textarea {
    width: 100%;
    min-height: 240px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #d1d5db;
    font-size: 16px;
    line-height: 1.6;
    outline: none;
    resize: vertical;
    transition: all 0.2s;
    &:focus { border-color: $primary; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  }
  .answer-actions {
    display: flex;
    align-items: center;
    gap: 24px;
    .reset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      color: $text-sub;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      &:hover { color: $text-main; }
    }
    .timer-text { font-size: 14px; color: #9ca3af; }
  }
}

.divider { height: 1px; background: $border-color; margin: 32px 0; }

.expandable-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .expand-card {
    border: 1px solid $border-color;
    border-radius: 12px;
    overflow: hidden;
    
    .expand-header {
      padding: 16px 24px;
      background: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: background 0.2s;
      &:hover { background: #f9fafb; }
      .title { font-size: 16px; font-weight: 700; color: $text-main; }
      .el-icon { color: #9ca3af; font-size: 20px; }
    }

    .expand-content {
      padding: 20px 24px;
      background: #f9fafb; // gray-50
      border-top: 1px solid $border-color;
      .prose { font-size: 14px; color: #374151; line-height: 1.6; }
    }
  }
}

.section-history {
  margin-top: 32px;
  .history-title { display: flex; align-items: center; gap: 8px; margin-bottom: 24px;
    .bar { width: 4px; height: 16px; background: $primary; border-radius: 99px; }
    h3 { font-size: 16px; font-weight: 700; color: $text-main; margin: 0; }
  }
  .history-list {
    position: relative;
    padding-left: 16px;
    .timeline-line { position: absolute; left: 21px; top: 8px; bottom: 8px; width: 1px; background: #f3f4f6; }
    
    .history-item {
      position: relative;
      display: flex;
      align-items: center;
      margin-bottom: 24px; // space-y-8 approx
      
      .dot {
        position: absolute; left: 3px; top: 50%; transform: translateY(-50%);
        width: 9px; height: 9px; background: white; border: 2px solid #d1d5db;
        border-radius: 50%; z-index: 10;
        transition: all 0.2s;
      }
      &:hover .dot { border-color: $primary; transform: translateY(-50%) scale(1.1); }
      
      .card {
        margin-left: 32px;
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #f3f4f6;
        background: #f9fafb;
        transition: all 0.2s;
        &:hover { background: white; border-color: $border-color; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        
        .info { display: flex; flex-direction: column; 
          .time { font-size: 14px; font-weight: 500; color: $text-main; }
          .duration { font-size: 12px; color: $text-sub; }
        }
        .status { display: flex; align-items: center; gap: 12px;
          .badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; 
            &.rose { background: $rose-bg; color: $rose; }
            &.emerald { background: $emerald-bg; color: #059669; }
          }
          .arrow { color: #d1d5db; }
        }
      }
    }
  }
}

// --- Interview Mode Styles ---
.interview-mode {
  .nav-content {
    width: 100%; max-width: 1280px; margin: 0 auto;
    display: flex; justify-content: space-between; align-items: center;
    .back-btn-simple { 
      display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px;
      border: none; background: transparent; color: $text-sub; font-weight: 500; cursor: pointer;
      &:hover { background: #f3f4f6; color: $text-main; }
    }
    .nav-actions {
      display: flex; align-items: center; gap: 12px;
      .last-review { font-size: 12px; color: #9ca3af; font-weight: 500; }
      .v-divider { width: 1px; height: 16px; background: $border-color; }
      .icon-btn-circle {
        width: 36px; height: 36px; border-radius: 50%; border: 1px solid $border-color;
        background: white; color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
        &:hover { border-color: #cbd5e1; color: $text-sub; }
        &.active { background: $amber-bg; border-color: #fde68a; color: $amber; }
      }
      .master-btn {
        display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 99px;
        border: 1px solid $border-color; background: white; color: $text-sub; font-weight: 700; font-size: 14px;
        cursor: pointer; transition: all 0.2s;
        &:hover { background: #f9fafb; }
        &.mastered { background: $emerald-bg; border-color: #bbf7d0; color: #059669; }
      }
    }
  }

  .main-layout {
    max-width: 1280px; width: 100%; margin: 0 auto;
    padding: 32px 24px;
    display: grid; grid-template-columns: 1fr; gap: 32px;
    @media (min-width: 1024px) { grid-template-columns: 2fr 1fr; }
  }

  // Left Column
  .header-block {
    margin-bottom: 32px;
    .meta-tags { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; flex-wrap: wrap;
      .type-tag { 
        font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 10px; border-radius: 6px; border: 1px solid transparent;
        &.rose { background: $rose-bg; color: #be123c; border-color: #ffe4e6; }
        &.amber { background: $amber-bg; color: #b45309; border-color: #fef3c7; }
        &.indigo { background: $primary-light; color: $primary; border-color: #e0e7ff; }
      }
      .simple-tag { 
        font-size: 11px; font-weight: 500; color: $text-sub; background: #f3f4f6; border: 1px solid $border-color;
        padding: 2px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px;
      }
    }
    .main-title { font-size: 30px; font-weight: 800; color: $text-main; margin: 0 0 8px; line-height: 1.2; }
    .source-info { font-size: 14px; color: $text-sub; display: flex; align-items: center; gap: 8px; margin: 0; }
  }

  .card {
    background: white; border: 1px solid $border-color; border-radius: 16px; overflow: hidden; margin-bottom: 32px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    
    .card-header-sm { 
      padding: 8px 16px; background: #f9fafb; border-bottom: 1px solid $border-color;
      h3 { font-size: 12px; font-weight: 700; color: $text-sub; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; display: flex; align-items: center; gap: 8px; }
    }
    .card-body { padding: 24px; }
  }

  .audio-player {
    background: #0f172a; border-radius: 12px; padding: 16px; color: white; display: flex; align-items: center; gap: 20px;
    margin-bottom: 24px; position: relative; overflow: hidden;
    .bg-decoration { position: absolute; top: 0; right: 0; width: 128px; height: 128px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; filter: blur(40px); transform: translate(50%, -50%); }
    .play-btn {
      width: 48px; height: 48px; border-radius: 50%; background: white; border: none; color: #0f172a;
      display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10;
      font-size: 20px; transition: transform 0.1s; &:active { transform: scale(0.95); }
    }
    .wave-container { flex: 1; z-index: 10;
      .wave-bars { display: flex; align-items: flex-end; gap: 4px; height: 32px; margin-bottom: 8px; opacity: 0.8;
        .bar { width: 4px; background: #818cf8; border-radius: 99px; transition: all 0.3s; &.playing { animation: pulse 1s infinite; } }
      }
      .time-labels { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: monospace; }
    }
  }

  .transcript {
    position: relative; padding-left: 16px; border-left: 2px solid $primary-light;
    .timeline-marker { position: absolute; left: -9px; top: 0; width: 16px; height: 16px; border-radius: 50%; background: $primary-light; border: 2px solid #c7d2fe; display: flex; align-items: center; justify-content: center; &::after { content: ''; width: 6px; height: 6px; background: $primary; border-radius: 50%; } }
    .speaker-label { font-size: 12px; font-weight: 700; color: $text-sub; margin-bottom: 8px; }
    .text { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; }
    .highlight-error { background: $rose-bg; color: #9f1239; padding: 0 2px; border-bottom: 1px solid #fecdd3; cursor: help; font-weight: 500; }
  }

  .diagnosis-section {
    margin-bottom: 32px;
    .section-heading { font-size: 18px; font-weight: 700; color: $text-main; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; .icon-indigo { color: $primary; } }
    .diagnosis-grid { display: grid; grid-template-columns: 1fr; gap: 16px; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; } }
    .diag-card {
      background: white; border: 1px solid transparent; border-radius: 16px; padding: 20px; position: relative; overflow: hidden;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: transform 0.2s; &:hover { transform: translateY(-2px); }
      &.concept { border-color: #ffe4e6; .color-strip { background: $rose; } .icon-box { background: $rose-bg; color: $rose; } .badge { background: $rose-bg; color: $rose; } }
      &.logic { border-color: #fef3c7; .color-strip { background: $amber; } .icon-box { background: $amber-bg; color: #d97706; } .badge { background: $amber-bg; color: #d97706; } }
      .color-strip { position: absolute; top: 0; left: 0; width: 4px; height: 100%; }
      .diag-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
        .icon-box { padding: 8px; border-radius: 8px; }
        .badge { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 8px; border-radius: 99px; }
      }
      h4 { font-weight: 700; color: $text-main; margin: 0 0 8px; }
      .desc { font-size: 12px; color: $text-sub; line-height: 1.5; margin-bottom: 16px; }
      .suggestion { font-size: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; color: #374151; .bold { font-weight: 700; } }
    }
  }

  .comparison-card {
    .card-header-bg { 
      padding: 16px 24px; background: rgba(249, 250, 251, 0.5); border-bottom: 1px solid $border-color;
      display: flex; justify-content: space-between; align-items: center;
      h3 { margin: 0; font-size: 16px; font-weight: 700; color: $text-main; display: flex; align-items: center; gap: 8px; .text-emerald { color: #059669; } }
      .toggle-btn { 
        font-size: 12px; font-weight: 500; color: $primary; background: white; border: 1px solid $border-color;
        padding: 6px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;
        &:hover { background: #f9fafb; }
      }
    }
    .ref-section {
      margin-bottom: 24px;
      h4 { font-size: 14px; font-weight: 700; color: $text-main; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; .text-emerald { color: #059669; } }
      .ref-content { background: rgba(16, 185, 129, 0.05); border: 1px solid #d1fae5; border-radius: 12px; padding: 16px; font-size: 14px; color: #4b5563; line-height: 1.6; }
    }
    .ref-actions { display: grid; grid-template-columns: 1fr; gap: 16px; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; }
      .ref-action-btn {
        display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid $border-color;
        border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s;
        &:hover { border-color: #a5b4fc; background: $primary-light; }
        .left { display: flex; align-items: center; gap: 12px; 
          .icon-sq { width: 32px; height: 32px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: $text-sub; transition: colors 0.2s; }
          .t1 { font-size: 12px; font-weight: 700; color: $text-main; text-align: left; }
          .t2 { font-size: 10px; color: $text-sub; text-align: left; }
        }
        .arrow { color: #d1d5db; font-size: 14px; }
        &:hover .icon-sq { background: #c7d2fe; color: $primary; }
      }
    }
  }

  // Right Column Stats
  .score-card {
    padding: 24px; text-align: center; position: relative;
    .top-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(to right, $rose, $amber, $emerald); }
    h3 { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 24px; }
    
    .radial-chart {
      position: relative; width: 160px; height: 160px; margin: 0 auto 24px;
      svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      circle { fill: none; stroke-width: 8; stroke-linecap: round; }
      .bg-ring { stroke: #f3f4f6; }
      .progress-ring { stroke: currentColor; transition: stroke-dashoffset 1s ease-out; stroke-dasharray: 251.2; }
      .stroke-emerald { color: $emerald; } .stroke-amber { color: $amber; } .stroke-rose { color: $rose; }
      
      .center-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        .score-val { font-size: 36px; font-weight: 900; display: block; &.text-emerald { color: $emerald; } &.text-amber { color: $amber; } &.text-rose { color: $rose; } }
        .total { font-size: 12px; color: #9ca3af; font-weight: 500; }
      }
    }

    .metrics {
      display: flex; flex-direction: column; gap: 12px;
      .metric-row {
        display: flex; justify-content: space-between; align-items: center; font-size: 14px;
        .label { color: $text-sub; display: flex; align-items: center; gap: 6px; }
        .progress { display: flex; align-items: center; gap: 8px; 
          .track { width: 96px; height: 6px; background: #f3f4f6; border-radius: 99px; overflow: hidden; 
            .fill { height: 100%; border-radius: 99px; &.emerald { background: $emerald; } &.amber { background: $amber; } &.indigo { background: $primary; } }
          }
          .val { font-weight: 700; color: $text-main; width: 24px; text-align: right; }
        }
      }
    }
  }

  .history-card {
    padding: 20px; 
    h3 { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .history-list-sm {
      position: relative; padding-left: 8px;
      .line { position: absolute; left: 5px; top: 4px; bottom: 4px; width: 1px; background: #f3f4f6; }
      .item {
        position: relative; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-left: 20px;
        .dot { position: absolute; left: 0; width: 11px; height: 11px; background: #d1d5db; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); z-index: 10; &.active { background: $primary; } }
        .date { font-size: 12px; color: #9ca3af; font-weight: 500; &.active { color: $text-main; } }
        .score-bar { display: flex; align-items: center; gap: 8px; 
          .bar { height: 6px; border-radius: 99px; &.emerald { background: #34d399; } &.rose { background: #fb7185; } }
          .val { font-size: 12px; font-weight: 700; &.emerald { color: $emerald; } &.rose { color: $rose; } }
        }
      }
    }
  }

  .retry-btn {
    width: 100%; padding: 16px; background: $primary; color: white; border: none; border-radius: 16px;
    font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
    &:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 70, 229, 0.3); }
  }
}

@keyframes pulse { 0%, 100% { height: 10px; } 50% { height: 24px; } }
</style>
