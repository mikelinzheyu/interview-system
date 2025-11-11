/**
 * useFollowSystem - 关注系统管理
 *
 * 功能：
 * - 关注/取消关注用户
 * - 获取粉丝列表
 * - 获取关注列表
 * - 检查关注状态
 * - 互粉提示
 */

import { ref, computed, reactive } from 'vue'
import communityAPI from '@/api/communityWithCache'

export function useFollowSystem(userId) {
  // 关注状态
  const isFollowing = ref(false)
  const isMutual = ref(false)  // 互粉
  const followers = ref([])
  const following = ref([])

  // 分页
  const followersPage = ref(1)
  const followersPageSize = ref(20)
  const followingPage = ref(1)
  const followingPageSize = ref(20)

  // 加载状态
  const followLoading = ref(false)
  const followersLoading = ref(false)
  const followingLoading = ref(false)
  const error = ref(null)

  /**
   * 获取关注状态
   */
  const checkFollowStatus = async () => {
    try {
      const response = await communityAPI.checkFollowStatus(userId)
      if (response.data) {
        isFollowing.value = response.data.isFollowing || false
        isMutual.value = response.data.isMutual || false
      }
    } catch (err) {
      console.error('Failed to check follow status:', err)
    }
  }

  /**
   * 关注/取消关注
   */
  const toggleFollow = async () => {
    followLoading.value = true
    error.value = null

    try {
      const response = await communityAPI.toggleFollow(userId)

      if (response.data) {
        isFollowing.value = response.data.isFollowing
        isMutual.value = response.data.isMutual

        // 清除列表缓存，强制刷新
        await Promise.all([
          fetchFollowers(1),
          fetchFollowing(1)
        ])
      }
    } catch (err) {
      error.value = err.message || '操作失败'
      console.error('Failed to toggle follow:', err)
    } finally {
      followLoading.value = false
    }
  }

  /**
   * 获取粉丝列表
   */
  const fetchFollowers = async (page = 1) => {
    followersLoading.value = true
    error.value = null

    try {
      const response = await communityAPI.getFollowers(userId, {
        page,
        pageSize: followersPageSize.value
      })

      if (response.data) {
        followers.value = response.data
        followersPage.value = page
      }
    } catch (err) {
      error.value = err.message || '获取粉丝列表失败'
      console.error('Failed to fetch followers:', err)
    } finally {
      followersLoading.value = false
    }
  }

  /**
   * 获取关注列表
   */
  const fetchFollowing = async (page = 1) => {
    followingLoading.value = true
    error.value = null

    try {
      const response = await communityAPI.getFollowing(userId, {
        page,
        pageSize: followingPageSize.value
      })

      if (response.data) {
        following.value = response.data
        followingPage.value = page
      }
    } catch (err) {
      error.value = err.message || '获取关注列表失败'
      console.error('Failed to fetch following:', err)
    } finally {
      followingLoading.value = false
    }
  }

  /**
   * 块状用户（不看其内容）
   */
  const blockUser = async () => {
    try {
      await communityAPI.blockUser(userId)
      return true
    } catch (err) {
      error.value = '屏蔽用户失败'
      console.error('Failed to block user:', err)
      return false
    }
  }

  /**
   * 取消屏蔽
   */
  const unblockUser = async () => {
    try {
      await communityAPI.unblockUser(userId)
      return true
    } catch (err) {
      error.value = '取消屏蔽失败'
      console.error('Failed to unblock user:', err)
      return false
    }
  }

  /**
   * 初始化：获取关注状态和列表
   */
  const initialize = async () => {
    await Promise.all([
      checkFollowStatus(),
      fetchFollowers(1),
      fetchFollowing(1)
    ])
  }

  /**
   * 计算属性：粉丝数统计
   */
  const followerStats = computed(() => ({
    count: followers.value.length,
    pageSize: followersPageSize.value,
    currentPage: followersPage.value
  }))

  /**
   * 计算属性：关注数统计
   */
  const followingStats = computed(() => ({
    count: following.value.length,
    pageSize: followingPageSize.value,
    currentPage: followingPage.value
  }))

  /**
   * 计算属性：互粉文本
   */
  const mutualText = computed(() => {
    if (isMutual.value && isFollowing.value) {
      return '互相关注'
    } else if (isFollowing.value) {
      return '已关注'
    } else {
      return '未关注'
    }
  })

  return {
    // 数据
    isFollowing,
    isMutual,
    followers,
    following,
    followersPage,
    followersPageSize,
    followingPage,
    followingPageSize,
    followLoading,
    followersLoading,
    followingLoading,
    error,
    followerStats,
    followingStats,
    mutualText,

    // 方法
    checkFollowStatus,
    toggleFollow,
    fetchFollowers,
    fetchFollowing,
    blockUser,
    unblockUser,
    initialize
  }
}
