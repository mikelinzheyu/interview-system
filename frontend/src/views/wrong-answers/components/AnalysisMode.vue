<template>
  <div class="wa-scope grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- LEFT COLUMN: Main Analysis -->
    <div class="lg:col-span-8 space-y-6">
      <!-- 1. Question Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded font-bold uppercase tracking-wider">回顾题目</span>
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-2">{{ item.questionTitle }}</h1>
        <p class="text-slate-500 text-sm line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">{{ item.questionContent }}</p>
      </div>

      <!-- 2. Diagnosis Cards -->
      <div>
        <h3 class="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles :size="18" class="text-indigo-600" /> AI 智能诊断
        </h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div 
            v-for="(diag, idx) in diagnosisList" 
            :key="idx"
            class="p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md relative overflow-hidden"
            :class="getDiagnosisClass(diag.type)"
          >
            <div class="absolute top-0 left-0 w-1 h-full" :class="getDiagnosisBarClass(diag.type)"></div>
            <div class="flex justify-between items-start mb-2">
              <div class="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm">
                <component :is="getDiagnosisIcon(diag.type)" :size="16" />
              </div>
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/60">{{ diag.typeLabel }}</span>
            </div>
            <h4 class="font-bold text-slate-900 mb-1">{{ diag.title }}</h4>
            <p class="text-xs text-slate-600 mb-3 leading-relaxed">{{ diag.desc }}</p>
            <div class="bg-white/50 rounded-lg p-2 text-xs">
              <span class="font-bold">💡 建议:</span> {{ diag.suggestion }}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Reference Answer (Collapsible) -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div 
          class="flex items-center justify-between px-6 py-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
          @click="showReference = !showReference"
        >
          <h3 class="font-bold text-slate-900 flex items-center gap-2">
            <BookOpen :size="18" class="text-emerald-500" /> 深度解析 & 参考答案
          </h3>
          <ChevronDown :size="20" :class="{ 'rotate-180': showReference }" class="transition-transform duration-300 text-slate-400" />
        </div>
         
        <transition name="wa-slide-down">
          <div v-show="showReference" class="p-6 border-t border-slate-200">
            <!-- Standard Answer -->
            <div class="mb-6">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">标准回答逻辑</h4>
              <div class="prose prose-sm prose-emerald max-w-none text-slate-600 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                <p>此处应显示题目的标准参考答案或解析内容。如果没有后端数据，这里是占位符。</p>
                <p class="mt-2 font-medium text-emerald-700">关键点：{{ item.knowledgePoints?.join('、') || '无' }}</p>
              </div>
            </div>
              
            <!-- User Notes -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">我的笔记</h4>
                <button 
                  class="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  @click="isEditingNotes = !isEditingNotes"
                >
                  {{ isEditingNotes ? '保存' : '编辑' }}
                </button>
              </div>
              <div v-if="isEditingNotes">
                <textarea 
                  v-model="notes" 
                  rows="3" 
                  class="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="写下你的心得..." 
                ></textarea>
              </div>
              <div v-else class="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px]">
                {{ notes || '暂无笔记' }}
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- RIGHT COLUMN: Stats -->
    <div class="lg:col-span-4 space-y-6">
      <!-- Score Card -->
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400"></div>
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">综合掌握度</h3>
         
        <div class="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
          <!-- Simple CSS Ring as fallback for SVG -->
          <div class="w-36 h-36 rounded-full border-8 border-slate-100 relative flex items-center justify-center">
            <div class="text-center">
              <span class="text-4xl font-black text-slate-800 block">{{ item.mastery || 0 }}</span>
              <span class="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <!-- Progress arc simulation using conic-gradient -->
            <div class="absolute inset-0 rounded-full" :style="`background: conic-gradient(${scoreColor} ${item.mastery}%, transparent 0); -webkit-mask: radial-gradient(transparent 62%, black 64%); mask: radial-gradient(transparent 62%, black 64%);`"></div>
          </div>
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-slate-500 flex items-center gap-1"><XCircle :size="14" /> 错误次数</span>
            <span class="font-bold text-rose-500">{{ item.wrongCount }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 flex items-center gap-1"><CheckCircle2 :size="14" /> 正确次数</span>
            <span class="font-bold text-emerald-500">{{ item.correctCount }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <button 
          class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          @click="emit('retry')"
        >
          <RotateCw :size="18" /> 再练一次
        </button>
        <button 
          class="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          @click="toggleMastered"
        >
          <CheckCircle2 :size="18" :class="item.mastery >= 80 ? 'text-emerald-500' : 'text-slate-400'" /> 
          {{ item.mastery >= 80 ? '已掌握' : '标记为掌握' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  BrainCircuit, BookOpen, ChevronDown, Zap, Target, RotateCw, CheckCircle2,
  AlertTriangle, Pencil, Eye, XCircle, Sparkles
} from 'lucide-vue-next'

const props = defineProps({
  item: Object
})

const emit = defineEmits(['retry', 'toggle-mastered', 'update-notes'])

const showReference = ref(true)
const isEditingNotes = ref(false)
const notes = ref(props.item.userNotes || '')

const scoreColor = computed(() => {
  const m = props.item.mastery || 0
  if (m >= 80) return '#10b981' // Emerald
  if (m >= 60) return '#f59e0b' // Amber
  return '#f43f5e' // Rose
})

// Mock diagnosis data generation based on error type
const diagnosisList = computed(() => {
  const type = props.item.errorType || 'knowledge'
  
  const map = {
    knowledge: {
      type: 'knowledge',
      typeLabel: 'Knowledge',
      title: '核心概念偏差',
      desc: '对该知识点的基础原理理解存在误区，未能准确命中核心考点。',
      suggestion: '建议回顾相关文档，重点对比类似概念的差异。'
    },
    logic: {
      type: 'logic',
      typeLabel: 'Logic',
      title: '逻辑链路缺失',
      desc: '回答虽然覆盖了部分点，但因果关系不明确，推导过程存在跳跃。',
      suggestion: '尝试用“因为...所以...”的句式重新梳理回答逻辑。'
    },
    expression: {
      type: 'expression',
      typeLabel: 'Expression',
      title: '表达不够精炼',
      desc: '使用了过多冗余词汇，专业术语使用不准确。',
      suggestion: '练习使用 STAR 法则（情境、任务、行动、结果）组织语言。'
    },
    incomplete: {
      type: 'incomplete',
      typeLabel: 'Incomplete',
      title: '覆盖面不足',
      desc: '漏掉了关键的边界情况或性能考量。',
      suggestion: '在回答前先列出大纲，确保覆盖正反两面。'
    }
  }
  
  // Return primary diagnosis plus a secondary generic one
  return [
    map[type] || map.knowledge,
    {
      type: 'review',
      typeLabel: 'Review',
      title: '复习建议',
      desc: `根据遗忘曲线，建议在 ${props.item.nextReviewTime ? '近期' : '明天'} 再次复习此题。`,
      suggestion: '将此题加入专项复习集进行强化训练。'
    }
  ]
})

const getDiagnosisClass = (type) => {
  switch(type) {
    case 'knowledge': return 'bg-rose-50 border-rose-100'
    case 'logic': return 'bg-amber-50 border-amber-100'
    case 'expression': return 'bg-blue-50 border-blue-100'
    default: return 'bg-slate-50 border-slate-100'
  }
}

const getDiagnosisBarClass = (type) => {
  switch(type) {
    case 'knowledge': return 'bg-rose-500'
    case 'logic': return 'bg-amber-500'
    case 'expression': return 'bg-blue-500'
    default: return 'bg-slate-500'
  }
}

const getDiagnosisIcon = (type) => {
   switch(type) {
    case 'knowledge': return AlertTriangle
    case 'logic': return BrainCircuit
    case 'expression': return Pencil
    default: return Eye
  }
}

const toggleMastered = () => {
  emit('toggle-mastered')
}

watch(isEditingNotes, (newVal) => {
  if (!newVal) {
    emit('update-notes', notes.value)
  }
})
</script>

<style lang="scss" scoped>
@import "@/styles/modules/wrong-answers-refactor.scss";

.wa-slide-down-enter-active,
.wa-slide-down-leave-active {
  transition: all 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
}

.wa-slide-down-enter-from,
.wa-slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>