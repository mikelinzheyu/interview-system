<template>
  <div class="post-list-page">
    <el-page-header :title="backTitle" @back="$router.back()">
      <template #content>
        <span class="page-title">{{ pageTitle }}</span>
      </template>
    </el-page-header>

    <div class="list-controls">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索帖子..."
        clearable
        style="width: 300px"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select v-model="sortBy" placeholder="排序方式" @change="handleSortChange">
        <el-option label="最新" value="latest" />
        <el-option label="最热" value="hot" />
        <el-option label="最多点赞" value="popular" />
      </el-select>

      <el-button type="primary" @click="$router.push('/community/create-post')">
        发布新帖
      </el-button>
    </div>

    <div v-loading="loading" class="posts-container">
      <post-card
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @like="handleLike"
        @tag-click="handleTagClick"
      />

      <el-empty v-if="!loading && posts.length === 0" description="暂无帖子" />

      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchPosts"
        @current-change="fetchPosts"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getPosts, getForumPosts, likePost } from '@/api/community'
import PostCard from './components/PostCard.vue'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(false)
const posts = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const sortBy = ref('latest')
const searchKeyword = ref('')

// 页面标题
const pageTitle = computed(() => {
  if (route.params.slug) {
    return `${route.params.slug} 板块`
  }
  if (route.query.tag) {
    return `标签: ${route.query.tag}`
  }
  return '所有帖子'
})

const backTitle = computed(() => {
  return route.params.slug ? '返回板块列表' : '返回'
})

// 获取帖子列表
const fetchPosts = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      sortBy: sortBy.value
    }

    // 如果有标签参数
    if (route.query.tag) {
      params.tag = route.query.tag
    }

    // 如果有关键词
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    let res
    if (route.params.slug) {
      // 获取指定板块的帖子
      res = await getForumPosts(route.params.slug, params)
    } else {
      // 获取所有帖子
      res = await getPosts(params)
    }

    posts.value = res.data.items || []
    total.value = res.data.total || 0
  } catch (error) {
    ElMessage.error('获取帖子列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 处理排序变化
const handleSortChange = () => {
  currentPage.value = 1
  fetchPosts()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchPosts()
}

// 处理点赞
const handleLike = async (postId) => {
  try {
    const res = await likePost(postId)
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.liked = res.data.liked
      post.likeCount = res.data.likeCount
    }
    ElMessage.success(res.data.liked ? '点赞成功' : '已取消点赞')
  } catch (error) {
    ElMessage.error('操作失败')
    console.error(error)
  }
}

// 处理标签点击
const handleTagClick = (tag) => {
  router.push(`/community/posts?tag=${encodeURIComponent(tag)}`)
}

// 监听路由变化
watch(
  () => route.query,
  () => {
    currentPage.value = 1
    fetchPosts()
  }
)

onMounted(() => {
  // 从路由参数初始化
  if (route.query.sortBy) {
    sortBy.value = route.query.sortBy
  }
  fetchPosts()
})
</script>

<style scoped lang="scss">
.post-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 600;
  }
}

.list-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin: 20px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.posts-container {
  min-height: 400px;

  .el-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}
</style>
