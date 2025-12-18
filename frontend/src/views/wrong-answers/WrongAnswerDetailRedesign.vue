<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useWrongAnswersStore } from '@/stores/wrongAnswers';
import { ChevronLeft, BookOpen, BarChart2 } from 'lucide-vue-next'; // Icons for navigation and mode toggle

const route = useRoute();
const wrongAnswersStore = useWrongAnswersStore();

const recordId = ref(route.params.recordId);
const currentMode = ref('practice'); // 'practice' or 'analysis'

const wrongAnswer = computed(() => wrongAnswersStore.getWrongAnswerById(recordId.value));

onMounted(() => {
  // Ensure wrong answers are loaded
  if (!wrongAnswersStore.wrongAnswers.length) {
    wrongAnswersStore.fetchWrongAnswers();
  }
});

// Navigate back to the list page
const goBack = () => {
  window.history.back();
};

</script>

<template>
  <div class="wrong-answer-detail-page wa-bg-light min-h-screen wa-p-6">
    <div class="container mx-auto wa-rounded-xl wa-shadow-lg wa-bg-white wa-p-6">
      <!-- Header with back button and mode toggle -->
      <div class="wa-flex wa-justify-between wa-items-center wa-mb-6">
        <button @click="goBack" class="wa-flex wa-items-center wa-gap-2 wa-text-main hover:text-indigo-600 wa-transition-all">
          <ChevronLeft size="20" />
          <span class="wa-text-base wa-font-medium">Back to Mistakes</span>
        </button>

        <div class="wa-flex wa-gap-2 wa-rounded-lg wa-bg-gray-100 wa-p-1">
          <button
            @click="currentMode = 'practice'"
            class="wa-flex wa-items-center wa-gap-2 wa-px-4 wa-py-2 wa-rounded-md wa-text-sm wa-font-medium wa-transition-all"
            :class="{
              'bg-white wa-shadow-sm text-indigo-700': currentMode === 'practice',
              'text-gray-600 hover:bg-gray-200': currentMode !== 'practice'
            }"
          >
            <BookOpen size="16" /> Practice Mode
          </button>
          <button
            @click="currentMode = 'analysis'"
            class="wa-flex wa-items-center wa-gap-2 wa-px-4 wa-py-2 wa-rounded-md wa-text-sm wa-font-medium wa-transition-all"
            :class="{
              'bg-white wa-shadow-sm text-indigo-700': currentMode === 'analysis',
              'text-gray-600 hover:bg-gray-200': currentMode !== 'analysis'
            }"
          >
            <BarChart2 size="16" /> Analysis Mode
          </button>
        </div>
      </div>

      <!-- Content based on selected mode -->
      <div v-if="wrongAnswer" class="wa-mt-6">
        <h3 class="wa-text-xl wa-font-bold wa-text-main wa-mb-4">{{ wrongAnswer.questionTitle }}</h3>
        
        <div v-if="currentMode === 'practice'">
          <!-- Practice Mode Component will go here -->
          <div class="wa-p-4 wa-border wa-rounded-lg wa-bg-gray-50 wa-text-gray-700">
            <p><strong>Practice Mode:</strong> Work on solving this mistake again. Input your answer below.</p>
            <textarea
                class="wa-w-full wa-p-3 wa-mt-4 wa-rounded-lg wa-border wa-resize-y focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                rows="8"
                placeholder="Type your answer here..."
            ></textarea>
            <button class="wa-mt-4 wa-px-6 wa-py-2 wa-rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 wa-transition-all">
                Submit Answer
            </button>
          </div>
        </div>

        <div v-else-if="currentMode === 'analysis'">
          <!-- Analysis Mode Component will go here -->
          <div class="wa-p-4 wa-border wa-rounded-lg wa-bg-gray-50 wa-text-gray-700">
            <p><strong>Analysis Mode:</strong> Review the question, your past attempts, and AI-generated diagnostics.</p>
            <div class="wa-mt-4">
                <h4 class="wa-text-lg wa-font-semibold">AI Diagnostic:</h4>
                <p class="wa-text-sm wa-text-rose-700 wa-border-l-4 wa-border-rose-400 wa-pl-3 wa-py-2 wa-bg-rose-50 wa-mt-2">
                    {{ wrongAnswer.aiDiagnostic || 'No AI diagnostic available.' }}
                </p>
            </div>
            <div class="wa-mt-4">
                <h4 class="wa-text-lg wa-font-semibold">Reference Answer:</h4>
                <div class="wa-p-3 wa-rounded-lg wa-bg-white wa-border wa-mt-2">
                    {{ wrongAnswer.referenceAnswer || 'No reference answer provided.' }}
                </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="wa-text-center wa-py-10 wa-text-gray-500">
        Loading wrong answer details or item not found.
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
