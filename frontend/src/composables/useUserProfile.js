/**
 * useUserProfile - 用户资料管理
 *
 * 功能：
 * - 获取用户资料（个人、他人）
 * - 获取用户发布的帖子和评论
 * - 编辑个人资料
 * - 收藏管理
 * - 用户统计信息
 */

import { ref, computed, reactive } from 'vue'
import communityAPI from '@/api/communityWithCache'
import { useAuth } from './useAuth'

export function useUserProfile(userId) {
  // 状态
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 用户的帖子列表
  const userPosts = ref([])
  const userComments = ref([])
  const userCollections = ref([])

  // 分页
  const postsPage = ref(1)
  const postsPageSize = ref(10)
  const commentsPage = ref(1)
  const commentsPageSize = ref(10)

  // 权限
  const { canEdit } = useAuth()
  const isCurrentUser = computed(() => {
    // TODO: 比较 userId 和当前登录用户 ID
    return false
  })

  /**
   * 获取用户资料
   */
  const fetchUserProfile = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.getUserProfile(userId)
      user.value = response.data
    } catch (err) {
      error.value = err.message || '获取用户资料失败'
      console.error('Failed to fetch user profile:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取用户发布的帖子
   */
  const fetchUserPosts = async (page = 1) => {
    try {
      const response = await communityAPI.getUserPosts(userId, {
        page,
        pageSize: postsPageSize.value
      })

      if (response.data) {
        userPosts.value = response.data
        postsPage.value = page
      }
    } catch (err) {
      console.error('Failed to fetch user posts:', err)
    }
  }

  /**
   * 获取用户的评论
   */
  const fetchUserComments = async (page = 1) => {
    try {
      const response = await communityAPI.getUserComments(userId, {
        page,
        pageSize: commentsPageSize.value
      })

      if (response.data) {
        userComments.value = response.data
        commentsPage.value = page
      }
    } catch (err) {
      console.error('Failed to fetch user comments:', err)
    }
  }

  /**
   * 获取用户的收藏
   */
  const fetchUserCollections = async () => {
    try {
      const response = await communityAPI.getUserCollections(userId)
      if (response.data) {
        userCollections.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch user collections:', err)
    }
  }

  /**
   * 编辑个人资料（仅当前用户可用）
   */
  const editProfile = async (profileData) => {
    if (!isCurrentUser.value) {
      error.value = '只能编辑自己的资料'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await communityAPI.updateUserProfile(userId, profileData)
      user.value = response.data
      return true
    } catch (err) {
      error.value = err.message || '编辑资料失败'
      console.error('Failed to edit profile:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 上传头像
   */
  const uploadAvatar = async (file) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await communityAPI.uploadAvatar(formData)
      if (response.data && user.value) {
        user.value.avatar = response.data.url
      }
      return response.data.url
    } catch (err) {
      error.value = err.message || '上传头像失败'
      console.error('Failed to upload avatar:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新用户资料
   */
  const refresh = async () => {
    await fetchUserProfile()
  }

  /**
   * 计算属性：用户统计
   */
  const stats = computed(() => {
    if (!user.value) {
      return {
        postsCount: 0,
        commentsCount: 0,
        likesCount: 0,
        viewsCount: 0,
        followers: 0,
        following: 0
      }
    }

    return {
      postsCount: user.value.stats?.postsCount || 0,
      commentsCount: user.value.stats?.commentsCount || 0,
      likesCount: user.value.stats?.likesCount || 0,
      viewsCount: user.value.stats?.viewsCount || 0,
      followers: user.value.followerCount || 0,
      following: user.value.followingCount || 0
    }
  })

  /**
   * 计算属性：用户声誉信息
   */
  const reputation = computed(() => {
    if (!user.value || !user.value.reputation) {
      return {
        level: 1,
        score: 0,
        badges: [],
        nextLevelScore: 100
      }
    }

    return {
      level: user.value.reputation.level || 1,
      score: user.value.reputation.score || 0,
      badges: user.value.reputation.badges || [],
      nextLevelScore: (user.value.reputation.level + 1) * 100
    }
  })

  /**
   * 计算属性：可编辑标志
   */
  const editable = computed(() => isCurrentUser.value)

  return {
    // 数据
    user,
    loading,
    error,
    userPosts,
    userComments,
    userCollections,
    postsPage,
    postsPageSize,
    commentsPage,
    commentsPageSize,
    isCurrentUser,
    editable,
    stats,
    reputation,

    // 方法
    fetchUserProfile,
    fetchUserPosts,
    fetchUserComments,
    fetchUserCollections,
    editProfile,
    uploadAvatar,
    refresh
  }
}
