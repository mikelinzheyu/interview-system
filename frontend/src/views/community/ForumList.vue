<template>
  <div class="forum-list-page">
    <el-page-header title="返回首页" @back="$router.push('/')">
      <template #content>
        <span class="page-title">社区论坛</span>
      </template>
    </el-page-header>

    <div class="forum-header">
      <h1>欢迎来到 社区论坛</h1>
      <p>在这里分享经验、交流技术、共同成长</p>
    </div>

    <el-card class="forum-stats" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总帖子数" :value="totalPosts">
            <template #suffix>篇</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="活跃板块" :value="activeForums">
            <template #suffix>个</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日新帖" :value="todayPosts">
            <template #suffix>篇</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="在线用户" :value="onlineUsers">
            <template #suffix>人</template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" class="forum-container">
      <!-- 左侧：板块列表 -->
      <el-col :span="18">
        <el-card class="forums-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">讨论板块</span>
              <el-button type="primary" @click="$router.push('/community/create-post')">
                发布新帖
              </el-button>
            </div>
          </template>

          <div v-loading="loading" class="forums-list">
            <div
              v-for="forum in forums"
              :key="forum.id"
              class="forum-item"
              @click="goToForum(forum)"
            >
              <div class="forum-icon">{{ forum.icon }}</div>
              <div class="forum-info">
                <h3>{{ forum.name }}</h3>
                <p class="forum-desc">{{ forum.description }}</p>
                <div class="forum-meta">
                  <el-tag size="small">{{ forum.postCount }} 个帖子</el-tag>
                </div>
              </div>
              <div class="forum-action">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：热门标签 -->
      <el-col :span="6">
        <el-card class="hot-tags-card">
          <template #header>
            <span class="card-title">热门标签</span>
          </template>
          <div v-loading="tagsLoading" class="tags-container">
            <el-tag
              v-for="tag in hotTags"
              :key="tag.tag"
              class="tag-item"
              @click="searchByTag(tag.tag)"
            >
              {{ tag.tag }} ({{ tag.count }})
            </el-tag>
          </div>
        </el-card>

        <el-card class="quick-links-card">
          <template #header>
            <span class="card-title">快速导航</span>
          </template>
          <div class="quick-links">
            <el-link @click="$router.push('/community/posts?sortBy=hot')">
              最热帖子
            </el-link>
            <el-link @click="$router.push('/community/posts?sortBy=latest')">
              最新帖子
            </el-link>
            <el-link @click="$router.push('/community/my-posts')">
              我的帖子
            </el-link>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { getForums, getHotTags } from '@/api/community'

const router = useRouter()

// 状态
const loading = ref(false)
const tagsLoading = ref(false)
const forums = ref([])
const hotTags = ref([])

// 统计数据
const totalPosts = computed(() => {
  return forums.value.reduce((sum, forum) => sum + forum.postCount, 0)
})

const activeForums = computed(() => {
  return forums.value.filter(f => f.active).length
})

const todayPosts = ref(12) // 模拟数据
const onlineUsers = ref(45) // 模拟数据

// 获取板块列表
const fetchForums = async () => {
  loading.value = true
  try {
    const res = await getForums()
    forums.value = res.data || []
  } catch (error) {
    ElMessage.error('获取板块列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取热门标签
const fetchHotTags = async () => {
  tagsLoading.value = true
  try {
    const res = await getHotTags()
    hotTags.value = (res.data || []).slice(0, 10)
  } catch (error) {
    console.error('获取热门标签失败', error)
  } finally {
    tagsLoading.value = false
  }
}

// 跳转到板块
const goToForum = (forum) => {
  router.push(`/community/forums/${forum.slug}`)
}

// 按标签搜索
const searchByTag = (tag) => {
  router.push(`/community/posts?tag=${encodeURIComponent(tag)}`)
}

onMounted(() => {
  fetchForums()
  fetchHotTags()
})
</script>

<style scoped lang="scss">
.forum-list-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
  }
}

.forum-header {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin: 20px 0;

  h1 {
    font-size: 32px;
    margin: 0 0 10px 0;
  }

  p {
    font-size: 16px;
    margin: 0;
    opacity: 0.9;
  }
}

.forum-stats {
  margin-bottom: 20px;

  :deep(.el-statistic__head) {
    font-size: 14px;
    color: #606266;
  }

  :deep(.el-statistic__number) {
    font-size: 24px;
    font-weight: 600;
  }
}

.forum-container {
  margin-top: 20px;
}

.forums-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .forums-list {
    .forum-item {
      display: flex;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: all 0.3s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f5f7fa;
        transform: translateX(5px);
      }

      .forum-icon {
        font-size: 40px;
        margin-right: 20px;
        flex-shrink: 0;
      }

      .forum-info {
        flex: 1;

        h3 {
          font-size: 18px;
          margin: 0 0 8px 0;
          color: #303133;
        }

        .forum-desc {
          font-size: 14px;
          color: #909399;
          margin: 0 0 10px 0;
        }

        .forum-meta {
          .el-tag {
            margin-right: 8px;
          }
        }
      }

      .forum-action {
        color: #909399;
        font-size: 20px;
        transition: all 0.3s;
      }

      &:hover .forum-action {
        color: #409eff;
        transform: translateX(5px);
      }
    }
  }
}

.hot-tags-card {
  margin-bottom: 20px;

  .card-title {
    font-size: 16px;
    font-weight: 600;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .tag-item {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.quick-links-card {
  .card-title {
    font-size: 16px;
    font-weight: 600;
  }

  .quick-links {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .el-link {
      font-size: 14px;
    }
  }
}
</style>
