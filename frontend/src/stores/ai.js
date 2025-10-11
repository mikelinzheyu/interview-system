/**
 * AI 自动出题 Store
 */
import { defineStore } from 'pinia'
import * as aiApi from '@/api/ai'

export const useAIStore = defineStore('ai', {
  state: () => ({
    // 生成历史
    generationHistory: [],
    historyTotal: 0,
    historyLoading: false,

    // 当前生成记录
    currentGeneration: null,
    generationLoading: false,

    // AI 配置
    aiConfig: null,
    configLoading: false
  }),

  getters: {
    // 获取总Token消耗
    totalTokensUsed: (state) => {
      return state.generationHistory.reduce((sum, item) => sum + (item.tokensUsed || 0), 0)
    },

    // 获取总成本
    totalCost: (state) => {
      return state.generationHistory.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2)
    }
  },

  actions: {
    /**
     * 生成题目
     */
    async generateQuestions(data) {
      this.generationLoading = true
      try {
        const response = await aiApi.generateQuestions(data)
        if (response.code === 200) {
          this.currentGeneration = response.data
          // 刷新生成历史
          await this.fetchGenerationHistory({ page: 1, limit: 10 })
        }
        return response
      } finally {
        this.generationLoading = false
      }
    },

    /**
     * 获取生成历史
     */
    async fetchGenerationHistory(params = { page: 1, limit: 10 }) {
      this.historyLoading = true
      try {
        const response = await aiApi.getGenerationHistory(params)
        if (response.code === 200) {
          this.generationHistory = response.data.items
          this.historyTotal = response.data.total
        }
        return response
      } finally {
        this.historyLoading = false
      }
    },

    /**
     * 审核 AI 生成的题目
     */
    async reviewGeneratedQuestions(id, data) {
      const response = await aiApi.reviewGeneratedQuestions(id, data)
      if (response.code === 200) {
        // 刷新生成历史
        await this.fetchGenerationHistory({ page: 1, limit: 10 })
      }
      return response
    },

    /**
     * 配置 AI
     */
    async configAI(data) {
      this.configLoading = true
      try {
        const response = await aiApi.configAI(data)
        if (response.code === 200) {
          this.aiConfig = response.data
        }
        return response
      } finally {
        this.configLoading = false
      }
    }
  }
})
