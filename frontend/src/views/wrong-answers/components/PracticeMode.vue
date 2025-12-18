<template>
  <div class="wa-scope h-full flex flex-col max-w-4xl mx-auto">
    <!-- Header / Timer Bar -->
    <div class="flex items-center justify-between mb-6 bg-indigo-50 px-4 py-2 rounded-full self-start w-full md:w-auto">
      <div class="flex items-center gap-2 text-indigo-600 font-mono font-bold">
        <Timer :size="18" />
        <span>{{ formattedTime }}</span>
      </div>
    </div>

    <!-- Question Area -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded font-bold uppercase tracking-wider">题目</span>
        <div class="flex gap-2">
          <span v-for="tag in (item.tags || item.knowledgePoints || [])" :key="tag" class="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            #{{ tag }}
          </span>
        </div>
      </div>
      <h1 class="text-2xl font-bold text-slate-900 mb-4 leading-snug">{{ item.questionTitle }}</h1>
      <div class="text-slate-600 text-sm leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-100">
        {{ item.questionContent }}
      </div>
    </div>

    <!-- Answer Input -->
    <div class="flex-1 flex flex-col min-h-0 relative group">
      <div class="mb-2 flex justify-between items-center">
        <label class="text-sm font-bold text-slate-700">你的回答</label>
        <span v-if="!submitted" class="text-xs text-slate-400">计时进行中...</span>
      </div>
      <textarea 
        v-model="userAnswer"
        class="w-full flex-1 resize-none p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 leading-relaxed shadow-sm font-sans bg-white"
        placeholder="在这里输入你的思考或答案关键点..."
        :disabled="submitted"
      ></textarea>
      
      <!-- Action Bar -->
      <div class="mt-6 flex items-center gap-4">
        <button 
          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <span v-if="submitting">提交中...</span>
          <span v-else>提交回答</span>
        </button>
        
        <button 
          class="px-6 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors flex items-center gap-2"
          @click="resetTimer"
        >
          <RotateCw :size="18" />
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Timer, RotateCw } from 'lucide-vue-next'

const props = defineProps({
  item: Object
})

const emit = defineEmits(['submit'])

const userAnswer = ref('')
const timer = ref(0)
const intervalId = ref(null)
const submitted = ref(false)
const submitting = ref(false)

const formattedTime = computed(() => {
  const m = Math.floor(timer.value / 60).toString().padStart(2, '0')
  const s = (timer.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const startTimer = () => {
  stopTimer()
  intervalId.value = setInterval(() => {
    timer.value++
  }, 1000)
}

const stopTimer = () => {
  if (intervalId.value) clearInterval(intervalId.value)
}

const resetTimer = () => {
  timer.value = 0
  userAnswer.value = ''
  startTimer()
}

const handleSubmit = async () => {
  stopTimer()
  submitting.value = true
  await emit('submit', {
    answer: userAnswer.value,
    timeSpent: timer.value
  })
  submitted.value = true
  submitting.value = false
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
@import "@/styles/modules/wrong-answers-refactor.scss";
</style>