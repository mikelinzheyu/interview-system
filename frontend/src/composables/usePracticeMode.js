/**
 * usePracticeMode.js
 * 处理错题集的练习模式逻辑
 *
 * 当用户从错题集点击"再答一次"时，ChatRoom 会进入 Practice Mode
 * 此时需要：
 * 1. 预加载特定的错题目
 * 2. 修改反馈策略
 * 3. 完成后更新复习状态
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export function usePracticeMode() {
  const route = useRoute()
  const router = useRouter()

  // Practice Mode 标志
  const isPracticeMode = ref(false)
  const practiceWrongAnswerId = ref(null)
  const practiceQuestionIds = ref([])
  const currentPracticeQuestionIndex = ref(0)

  // 初始化 Practice Mode
  const initPracticeMode = () => {
    // 从路由参数检测
    if (route.query.mode === 'practice') {
      isPracticeMode.value = true
      practiceWrongAnswerId.value = route.query.recordId || route.params.recordId

      // 可以传递多个题目 ID（用于专项练习）
      if (route.query.questionIds) {
        practiceQuestionIds.value = route.query.questionIds.split(',')
      } else if (practiceWrongAnswerId.value) {
        // 单个错题
        practiceQuestionIds.value = [practiceWrongAnswerId.value]
      }

      if (isPracticeMode.value) {
        ElMessage.success('进入练习模式，开始巩固你的答案吧！')
      }
    }
  }

  // 获取当前练习题
  const getCurrentPracticeQuestion = () => {
    if (!isPracticeMode.value || practiceQuestionIds.value.length === 0) {
      return null
    }
    return practiceQuestionIds.value[currentPracticeQuestionIndex.value]
  }

  // 移至下一个练习题
  const moveToNextPracticeQuestion = () => {
    if (currentPracticeQuestionIndex.value < practiceQuestionIds.value.length - 1) {
      currentPracticeQuestionIndex.value++
      return true
    }
    return false // 已经是最后一题
  }

  // 完成练习模式
  const completePracticeMode = async (finalFeedback) => {
    if (!isPracticeMode.value) return

    try {
      // 发送完成请求到后端，更新错题复习状态
      // const response = await api.updateWrongAnswerReviewStatus(
      //   practiceWrongAnswerId.value,
      //   {
      //     status: 'completed',
      //     feedback: finalFeedback,
      //     timestamp: new Date().toISOString()
      //   }
      // )

      // 模拟 API 调用
      console.log('Practice mode completed:', {
        wrongAnswerId: practiceWrongAnswerId.value,
        questionIds: practiceQuestionIds.value,
        feedback: finalFeedback
      })

      ElMessage.success('练习完成！你的进度已自动保存')
      isPracticeMode.value = false

      return true
    } catch (error) {
      console.error('Failed to complete practice mode:', error)
      ElMessage.error('保存练习状态失败，请稍后重试')
      return false
    }
  }

  // 退出练习模式
  const exitPracticeMode = () => {
    isPracticeMode.value = false
    practiceWrongAnswerId.value = null
    practiceQuestionIds.value = []
    currentPracticeQuestionIndex.value = 0

    // 重要：清除 URL 中的 mode=practice 参数，防止重新进入练习模式
    // 如果还在 /chat/room/:id 页面，清除 mode 查询参数
    if (route.name === 'ChatRoom' && route.query.mode === 'practice') {
      const newQuery = { ...route.query }
      delete newQuery.mode
      delete newQuery.recordId

      router.replace({
        name: 'ChatRoom',
        params: route.params,
        query: newQuery
      }).catch(err => {
        console.error('Failed to clear practice mode from URL:', err)
      })
    }
  }

  // 计算进度
  const practiceProgress = computed(() => {
    if (!isPracticeMode.value || practiceQuestionIds.value.length === 0) {
      return 0
    }
    return Math.round(
      ((currentPracticeQuestionIndex.value + 1) / practiceQuestionIds.value.length) * 100
    )
  })

  // 获取练习模式标题
  const practiceModeTitle = computed(() => {
    if (!isPracticeMode.value) return ''
    if (practiceQuestionIds.value.length === 1) {
      return `巩固练习 - 第 ${currentPracticeQuestionIndex.value + 1} 题`
    }
    return `巩固练习 - 第 ${currentPracticeQuestionIndex.value + 1}/${practiceQuestionIds.value.length} 题`
  })

  // 生命周期
  onMounted(() => {
    initPracticeMode()
  })

  return {
    // 状态
    isPracticeMode,
    practiceWrongAnswerId,
    practiceQuestionIds,
    currentPracticeQuestionIndex,
    practiceProgress,
    practiceModeTitle,

    // 方法
    initPracticeMode,
    getCurrentPracticeQuestion,
    moveToNextPracticeQuestion,
    completePracticeMode,
    exitPracticeMode
  }
}
