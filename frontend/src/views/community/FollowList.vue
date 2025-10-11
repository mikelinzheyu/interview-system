<template>
  <div class="follow-list-container">
    <el-card class="follow-card">
      <template #header>
        <div class="card-header">
          <h2>
            <el-icon><User /></el-icon>
            关注与粉丝
          </h2>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 关注列表 -->
        <el-tab-pane label="关注" name="following">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              关注 ({{ followingTotal }})
            </span>
          </template>

          <div v-loading="followingLoading" class="user-list">
            <div v-if="followingList.length === 0" class="empty-state">
              <el-empty description="暂无关注用户">
                <el-button type="primary" @click="$router.push('/community')">
                  去发现更多用户
                </el-button>
              </el-empty>
            </div>

            <div v-else class="user-grid">
              <el-card
                v-for="user in followingList"
                :key="user.id"
                class="user-card"
                :body-style="{ padding: '20px' }"
                shadow="hover"
              >
                <div class="user-info">
                  <el-avatar :src="user.avatar" :size="60" class="user-avatar">
                    {{ user.username?.[0] || 'U' }}
                  </el-avatar>

                  <div class="user-details">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-bio">{{ user.bio || '这个人很懒，什么都没留下' }}</div>

                    <div class="user-stats">
                      <span class="stat-item">
                        <el-icon><Document /></el-icon>
                        帖子 {{ user.postCount || 0 }}
                      </span>
                      <span class="stat-item">
                        <el-icon><User /></el-icon>
                        粉丝 {{ user.followerCount || 0 }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="user-actions">
                  <el-button
                    size="small"
                    @click="viewUserProfile(user.id)"
                  >
                    查看主页
                  </el-button>
                  <FollowButton
                    :user-id="user.id"
                    :initial-following="true"
                    size="small"
                    @unfollow="handleUnfollow(user.id)"
                  />
                </div>
              </el-card>
            </div>

            <!-- 加载更多 -->
            <div v-if="followingList.length < followingTotal" class="load-more">
              <el-button
                :loading="followingLoading"
                @click="loadMoreFollowing"
              >
                加载更多
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 粉丝列表 -->
        <el-tab-pane label="粉丝" name="followers">
          <template #label>
            <span class="tab-label">
              <el-icon><UserFilled /></el-icon>
              粉丝 ({{ followersTotal }})
            </span>
          </template>

          <div v-loading="followersLoading" class="user-list">
            <div v-if="followersList.length === 0" class="empty-state">
              <el-empty description="暂无粉丝">
                <el-button type="primary" @click="$router.push('/community')">
                  去社区活跃吧
                </el-button>
              </el-empty>
            </div>

            <div v-else class="user-grid">
              <el-card
                v-for="user in followersList"
                :key="user.id"
                class="user-card"
                :body-style="{ padding: '20px' }"
                shadow="hover"
              >
                <div class="user-info">
                  <el-avatar :src="user.avatar" :size="60" class="user-avatar">
                    {{ user.username?.[0] || 'U' }}
                  </el-avatar>

                  <div class="user-details">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-bio">{{ user.bio || '这个人很懒，什么都没留下' }}</div>

                    <div class="user-stats">
                      <span class="stat-item">
                        <el-icon><Document /></el-icon>
                        帖子 {{ user.postCount || 0 }}
                      </span>
                      <span class="stat-item">
                        <el-icon><User /></el-icon>
                        粉丝 {{ user.followerCount || 0 }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="user-actions">
                  <el-button
                    size="small"
                    @click="viewUserProfile(user.id)"
                  >
                    查看主页
                  </el-button>
                  <FollowButton
                    :user-id="user.id"
                    :initial-following="user.isFollowing || false"
                    size="small"
                    @follow="handleFollow(user.id)"
                    @unfollow="handleUnfollow(user.id)"
                  />
                </div>
              </el-card>
            </div>

            <!-- 加载更多 -->
            <div v-if="followersList.length < followersTotal" class="load-more">
              <el-button
                :loading="followersLoading"
                @click="loadMoreFollowers"
              >
                加载更多
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, UserFilled, Star, Document
} from '@element-plus/icons-vue'
import { getFollowers, getFollowing } from '@/api/follow'
import { useUserStore } from '@/stores/user'
import FollowButton from '@/components/FollowButton.vue'

const router = useRouter()
const userStore = useUserStore()

// 当前激活的标签页
const activeTab = ref('following')

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
      if (isLoadMore) {
        followingList.value.push(...response.data.items)
      } else {
        followingList.value = response.data.items
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
      if (isLoadMore) {
        followersList.value.push(...response.data.items)
      } else {
        followersList.value = response.data.items
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

// 切换标签页
const handleTabChange = (tabName) => {
  if (tabName === 'following' && followingList.value.length === 0) {
    loadFollowing()
  } else if (tabName === 'followers' && followersList.value.length === 0) {
    loadFollowers()
  }
}

// 查看用户主页
const viewUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 处理关注
const handleFollow = (userId) => {
  // 更新粉丝列表中的关注状态
  const user = followersList.value.find(u => u.id === userId)
  if (user) {
    user.isFollowing = true
  }
}

// 处理取消关注
const handleUnfollow = (userId) => {
  if (activeTab.value === 'following') {
    // 从关注列表中移除
    followingList.value = followingList.value.filter(u => u.id !== userId)
    followingTotal.value--
  } else {
    // 更新粉丝列表中的关注状态
    const user = followersList.value.find(u => u.id === userId)
    if (user) {
      user.isFollowing = false
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
  padding: 20px;
}

.follow-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.user-list {
  min-height: 400px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.user-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-4px);
}

.user-info {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-bio {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .follow-list-container {
    padding: 12px;
  }

  .user-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .user-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .user-actions {
    justify-content: center;
  }
}
</style>
