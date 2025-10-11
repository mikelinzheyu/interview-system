/**
 * 社区贡献系统 Store
 */
import { defineStore } from 'pinia'
import * as contributionsApi from '@/api/contributions'

export const useContributionsStore = defineStore('contributions', {
  state: () => ({
    // 我的提交列表
    mySubmissions: [],
    mySubmissionsTotal: 0,
    mySubmissionsLoading: false,

    // 当前提交详情
    currentSubmission: null,
    submissionLoading: false,

    // 审核队列
    reviewQueue: [],
    reviewQueueTotal: 0,
    reviewQueueLoading: false,

    // 贡献者资料
    contributorProfile: null,
    profileLoading: false,

    // 贡献排行榜
    leaderboard: [],
    leaderboardLoading: false,

    // 徽章列表
    badges: [],
    badgesLoading: false
  }),

  getters: {
    // 获取待审核提交数量
    pendingCount: (state) => {
      return state.mySubmissions.filter(s => s.status === 'pending').length
    },

    // 获取通过的提交数量
    approvedCount: (state) => {
      return state.mySubmissions.filter(s => s.status === 'approved').length
    },

    // 获取通过率
    approvalRate: (state) => {
      const total = state.mySubmissions.length
      if (total === 0) return 0
      const approved = state.mySubmissions.filter(s => s.status === 'approved').length
      return (approved / total * 100).toFixed(1)
    }
  },

  actions: {
    /**
     * 提交题目
     */
    async submitQuestion(data) {
      const response = await contributionsApi.submitQuestion(data)
      if (response.code === 200) {
        // 刷新我的提交列表
        await this.fetchMySubmissions({ page: 1, limit: 10 })
      }
      return response
    },

    /**
     * 获取我的提交列表
     */
    async fetchMySubmissions(params = { page: 1, limit: 10 }) {
      this.mySubmissionsLoading = true
      try {
        const response = await contributionsApi.getMySubmissions(params)
        if (response.code === 200) {
          this.mySubmissions = response.data.items
          this.mySubmissionsTotal = response.data.total
        }
        return response
      } finally {
        this.mySubmissionsLoading = false
      }
    },

    /**
     * 获取提交详情
     */
    async fetchSubmissionDetail(id) {
      this.submissionLoading = true
      try {
        const response = await contributionsApi.getSubmissionDetail(id)
        if (response.code === 200) {
          this.currentSubmission = response.data
        }
        return response
      } finally {
        this.submissionLoading = false
      }
    },

    /**
     * 修订提交
     */
    async reviseSubmission(id, data) {
      const response = await contributionsApi.reviseSubmission(id, data)
      if (response.code === 200) {
        // 刷新提交详情
        await this.fetchSubmissionDetail(id)
        // 刷新我的提交列表
        await this.fetchMySubmissions({ page: 1, limit: 10 })
      }
      return response
    },

    /**
     * 获取审核队列
     */
    async fetchReviewQueue(params = { status: 'available' }) {
      this.reviewQueueLoading = true
      try {
        const response = await contributionsApi.getReviewQueue(params)
        if (response.code === 200) {
          this.reviewQueue = response.data.items
          this.reviewQueueTotal = response.data.total
        }
        return response
      } finally {
        this.reviewQueueLoading = false
      }
    },

    /**
     * 领取审核任务
     */
    async claimReviewTask(id) {
      const response = await contributionsApi.claimReviewTask(id)
      if (response.code === 200) {
        // 刷新审核队列
        await this.fetchReviewQueue({ status: 'available' })
      }
      return response
    },

    /**
     * 提交审核结果
     */
    async submitReview(id, data) {
      const response = await contributionsApi.submitReview(id, data)
      if (response.code === 200) {
        // 刷新审核队列
        await this.fetchReviewQueue({ status: 'available' })
      }
      return response
    },

    /**
     * 获取贡献者资料
     */
    async fetchContributorProfile(userId) {
      this.profileLoading = true
      try {
        const response = await contributionsApi.getContributorProfile(userId)
        if (response.code === 200) {
          this.contributorProfile = response.data
        }
        return response
      } finally {
        this.profileLoading = false
      }
    },

    /**
     * 获取贡献排行榜
     */
    async fetchLeaderboard(params = { limit: 10 }) {
      this.leaderboardLoading = true
      try {
        const response = await contributionsApi.getLeaderboard(params)
        if (response.code === 200) {
          this.leaderboard = response.data.items
        }
        return response
      } finally {
        this.leaderboardLoading = false
      }
    },

    /**
     * 获取徽章列表
     */
    async fetchBadges() {
      this.badgesLoading = true
      try {
        const response = await contributionsApi.getBadges()
        if (response.code === 200) {
          this.badges = response.data.items
        }
        return response
      } finally {
        this.badgesLoading = false
      }
    }
  }
})
