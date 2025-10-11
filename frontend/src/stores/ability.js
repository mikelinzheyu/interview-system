/**
 * 跨专业能力分析 Store
 */
import { defineStore } from 'pinia'
import * as abilityApi from '@/api/ability'

export const useAbilityStore = defineStore('ability', {
  state: () => ({
    // 用户能力画像
    abilityProfile: null,
    profileLoading: false,

    // 雷达图数据
    radarData: null,
    radarLoading: false,

    // T型人才排行榜
    tShapeLeaderboard: [],
    leaderboardLoading: false,

    // 跨专业推荐
    recommendations: null,
    recommendationsLoading: false
  }),

  getters: {
    // 获取 T 型指数
    tShapeIndex: (state) => {
      return state.abilityProfile?.tShapeAnalysis?.index || 0
    },

    // 获取人才类型
    talentType: (state) => {
      return state.abilityProfile?.tShapeAnalysis?.type || 'unknown'
    },

    // 获取主攻领域
    primaryDomain: (state) => {
      return state.abilityProfile?.primaryDomain
    },

    // 获取所有领域得分
    domainScores: (state) => {
      return state.abilityProfile?.domainScores || {}
    }
  },

  actions: {
    /**
     * 获取用户能力画像
     */
    async fetchAbilityProfile(userId) {
      this.profileLoading = true
      try {
        const response = await abilityApi.getAbilityProfile(userId)
        if (response.code === 200) {
          this.abilityProfile = response.data
        }
        return response
      } finally {
        this.profileLoading = false
      }
    },

    /**
     * 获取雷达图数据
     */
    async fetchRadarData(userId) {
      this.radarLoading = true
      try {
        const response = await abilityApi.getRadarData(userId)
        if (response.code === 200) {
          this.radarData = response.data
        }
        return response
      } finally {
        this.radarLoading = false
      }
    },

    /**
     * 获取 T 型指数排行榜
     */
    async fetchTShapeLeaderboard(params = { limit: 10 }) {
      this.leaderboardLoading = true
      try {
        const response = await abilityApi.getTShapeLeaderboard(params)
        if (response.code === 200) {
          this.tShapeLeaderboard = response.data.items
        }
        return response
      } finally {
        this.leaderboardLoading = false
      }
    },

    /**
     * 获取跨专业推荐
     */
    async fetchRecommendations(userId) {
      this.recommendationsLoading = true
      try {
        const response = await abilityApi.getCrossDomainRecommendations(userId)
        if (response.code === 200) {
          this.recommendations = response.data
        }
        return response
      } finally {
        this.recommendationsLoading = false
      }
    }
  }
})
