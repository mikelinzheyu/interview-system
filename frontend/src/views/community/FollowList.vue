<template>
  <div class="follow-list-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="header-icon"><User /></el-icon>
            <h2>关注与粉丝</h2>
          </div>
          
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户..."
              prefix-icon="Search"
              clearable
              class="search-input"
              @input="handleSearch"
            />
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="custom-tabs" @tab-change="handleTabChange">
        <!-- 关注列表 -->
        <el-tab-pane name="following">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              关注 <span class="count-badge" v-if="followingTotal > 0">{{ followingTotal }}</span>
            </span>
          </template>

          <div class="list-content">
            <!-- 骨架屏加载状态 -->
            <div v-if="followingLoading && followingList.length === 0" class="skeleton-grid">
              <el-card v-for="i in 8" :key="i" class="skeleton-card">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="image" style="width: 100%; height: 80px;" />
                    <div style="padding: 14px; display: flex; flex-direction: column; align-items: center;">
                      <el-skeleton-item variant="circle" style="width: 60px; height: 60px; margin-top: -40px; border: 4px solid #fff;" />
                      <el-skeleton-item variant="h3" style="width: 50%; margin-top: 10px;" />
                      <el-skeleton-item variant="text" style="width: 80%; margin-top: 5px;" />
                    </div>
                  </template>
                </el-skeleton>
              </el-card>
            </div>

            <!-- 空状态 -->
            <div v-else-if="filteredFollowingList.length === 0" class="empty-state">
              <el-empty :description="searchQuery ? '未找到相关用户' : '暂无关注用户'">
                <template #extra v-if="!searchQuery">
                  <el-button type="primary" round @click="$router.push('/community')">
                    去发现更多用户
                  </el-button>
                </template>
              </el-empty>
            </div>

            <!-- 用户列表网格 -->
            <div v-else class="user-grid">
              <UserFollowCard
                v-for="user in filteredFollowingList"
                :key="user.id"
                :user="user"
                :initial-following="true"
                @view-profile="viewUserProfile"
                @unfollow="handleUnfollow"
                @send-message="handleSendMessage"
              />
            </div>

            <!-- 加载更多 -->
            <div v-if="followingList.length < followingTotal && !searchQuery" class="load-more">
              <el-button
                v-if="!followingLoading"
                text
                bg
                @click="loadMoreFollowing"
              >
                加载更多
              </el-button>
              <span v-else class="loading-text">
                <el-icon class="is-loading"><Loading /></el-icon> 加载中...
              </span>
            </div>
          </div>
        </el-tab-pane>

        <!-- 粉丝列表 -->
        <el-tab-pane name="followers">
          <template #label>
            <span class="tab-label">
              <el-icon><UserFilled /></el-icon>
              粉丝 <span class="count-badge" v-if="followersTotal > 0">{{ followersTotal }}</span>
            </span>
          </template>

          <div class="list-content">
            <!-- 骨架屏加载状态 -->
            <div v-if="followersLoading && followersList.length === 0" class="skeleton-grid">
              <el-card v-for="i in 8" :key="i" class="skeleton-card">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="image" style="width: 100%; height: 80px;" />
                    <div style="padding: 14px; display: flex; flex-direction: column; align-items: center;">
                      <el-skeleton-item variant="circle" style="width: 60px; height: 60px; margin-top: -40px; border: 4px solid #fff;" />
                      <el-skeleton-item variant="h3" style="width: 50%; margin-top: 10px;" />
                      <el-skeleton-item variant="text" style="width: 80%; margin-top: 5px;" />
                    </div>
                  </template>
                </el-skeleton>
              </el-card>
            </div>

            <!-- 空状态 -->
            <div v-else-if="filteredFollowersList.length === 0" class="empty-state">
              <el-empty :description="searchQuery ? '未找到相关用户' : '暂无粉丝'">
                <template #extra v-if="!searchQuery">
                  <el-button type="primary" round @click="$router.push('/community')">
                    去社区活跃一下
                  </el-button>
                </template>
              </el-empty>
            </div>

            <!-- 用户列表网格 -->
            <div v-else class="user-grid">
              <UserFollowCard
                v-for="user in filteredFollowersList"
                :key="user.id"
                :user="user"
                :initial-following="user.isFollowing || false"
                @view-profile="viewUserProfile"
                @follow="handleFollow"
                @unfollow="handleUnfollow"
                @send-message="handleSendMessage"
              />
            </div>

            <!-- 加载更多 -->
            <div v-if="followersList.length < followersTotal && !searchQuery" class="load-more">
              <el-button
                v-if="!followersLoading"
                text
                bg
                @click="loadMoreFollowers"
              >
                加载更多
              </el-button>
              <span v-else class="loading-text">
                <el-icon class="is-loading"><Loading /></el-icon> 加载中...
              </span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, UserFilled, Star, Search, Loading
} from '@element-plus/icons-vue'
import { getFollowers, getFollowing } from '@/api/follow'
import { useUserStore } from '@/stores/user'
import UserFollowCard from './components/UserFollowCard.vue'

const router = useRouter()
const userStore = useUserStore()

// 状态
const activeTab = ref('following')
const searchQuery = ref('')
const searchDebounceTimer = ref(null)

// 关注列表数据
const followingList = ref([])
const followingPage = ref(1)
const followingTotal = ref(0)
const followingLoading = ref(false)

// 粉丝列表数据
const followersList = ref([])
const followersPage = ref(1)
const followersTotal = ref(0)
const followersLoading = ref(false)

// 搜索过滤逻辑
const filteredFollowingList = computed(() => {
  if (!searchQuery.value) return followingList.value
  const query = searchQuery.value.toLowerCase()
  return followingList.value.filter(user => 
    user.username?.toLowerCase().includes(query) || 
    user.bio?.toLowerCase().includes(query)
  )
})

const filteredFollowersList = computed(() => {
  if (!searchQuery.value) return followersList.value
  const query = searchQuery.value.toLowerCase()
  return followersList.value.filter(user => 
    user.username?.toLowerCase().includes(query) || 
    user.bio?.toLowerCase().includes(query)
  )
})

// 加载关注列表
const loadFollowing = async (isLoadMore = false) => {
  if (followingLoading.value) return

  followingLoading.value = true

  try {
    const userId = userStore.user?.id || 1
    const response = await getFollowing(userId, {
      page: followingPage.value,
      size: 12
    })

    if (response.code === 200) {
      const items = response.data.items || []
      // 模拟一些数据用于展示效果 (如果是空数据，可以添加模拟数据测试)
      if (isLoadMore) {
        followingList.value.push(...items)
      } else {
        followingList.value = items
      }
      followingTotal.value = response.data.total
    }
  } catch (error) {
    console.error('加载关注列表失败:', error)
    ElMessage.error('加载关注列表失败')
  } finally {
    followingLoading.value = false
  }
}

// 加载更多关注
const loadMoreFollowing = () => {
  followingPage.value++
  loadFollowing(true)
}

// 加载粉丝列表
const loadFollowers = async (isLoadMore = false) => {
  if (followersLoading.value) return

  followersLoading.value = true

  try {
    const userId = userStore.user?.id || 1
    const response = await getFollowers(userId, {
      page: followersPage.value,
      size: 12
    })

    if (response.code === 200) {
      const items = response.data.items || []
      // 计算 "互相关注" 状态 (Mock 逻辑: 如果在我的关注列表中也有这个人)
      // 在真实后端中，应该由后端返回 isMutual 字段
      
      if (isLoadMore) {
        followersList.value.push(...items)
      } else {
        followersList.value = items
      }
      followersTotal.value = response.data.total
    }
  } catch (error) {
    console.error('加载粉丝列表失败:', error)
    ElMessage.error('加载粉丝列表失败')
  } finally {
    followersLoading.value = false
  }
}

// 加载更多粉丝
const loadMoreFollowers = () => {
  followersPage.value++
  loadFollowers(true)
}

// 切换标签页时清空搜索
const handleTabChange = (tabName) => {
  searchQuery.value = ''
  if (tabName === 'following' && followingList.value.length === 0) {
    loadFollowing()
  } else if (tabName === 'followers' && followersList.value.length === 0) {
    loadFollowers()
  }
}

// 搜索处理 (带防抖)
const handleSearch = () => {
  // 当前是纯前端过滤，不需要请求API，所以其实不需要防抖
  // 如果后续改为后端搜索，可以在这里加逻辑
}

// 查看用户主页
const viewUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 发送私信
const handleSendMessage = (userId) => {
  router.push({
    path: '/messages',
    query: { targetUserId: userId }
  })
}

// 处理关注 (在粉丝列表中点击关注)
const handleFollow = (userId) => {
  // 更新粉丝列表中的关注状态
  const user = followersList.value.find(u => u.id === userId)
  if (user) {
    user.isFollowing = true
    // 同时也应该是 "互相关注" 了
    user.isMutual = true 
    ElMessage.success('关注成功')
  }
}

// 处理取消关注
const handleUnfollow = (userId) => {
  if (activeTab.value === 'following') {
    // 从关注列表中移除
    followingList.value = followingList.value.filter(u => u.id !== userId)
    followingTotal.value--
    ElMessage.success('已取消关注')
  } else {
    // 更新粉丝列表中的关注状态
    const user = followersList.value.find(u => u.id === userId)
    if (user) {
      user.isFollowing = false
      user.isMutual = false
      ElMessage.success('已取消关注')
    }
  }
}

onMounted(() => {
  // 默认加载关注列表
  loadFollowing()
})
</script>

<style scoped>
.follow-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.main-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: #fff;
  min-height: 600px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 8px;
  border-radius: 12px;
}

.header-title h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.5px;
}

.search-input {
  width: 240px;
  transition: width 0.3s ease;
}

.search-input:focus-within {
  width: 300px;
}

/* Tabs 样式优化 */
:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #f0f0f0;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 24px;
  height: 50px;
  line-height: 50px;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

/* 列表内容区 */
.list-content {
  padding: 20px 0;
  min-height: 400px;
}

/* 网格布局 */
.user-grid, .skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

/* 骨架屏卡片 */
.skeleton-card {
  border-radius: 12px;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding-bottom: 20px;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .follow-list-container {
    padding: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .user-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>
