<template>
  <div class="post-list-page">
    <el-page-header :title="backTitle" @back="$router.back()">
      <template #content>
        <span class="page-title">{{ pageTitle }}</span>
      </template>
    </el-page-header>

    <div class="list-controls">
      <!-- 新增：增强版搜索框 -->
      <PostSearchInput
        :posts="posts"
        @search="handleSearchInput"
        @filter="handleFilterChange"
      />

      <el-select v-model="sortBy" placeholder="排序方式" @change="handleSortChange" class="sort-select">
        <el-option label="最新" value="latest" />
        <el-option label="最热" value="hot" />
        <el-option label="最多点赞" value="popular" />
      </el-select>

      <el-button
        type="primary"
        :icon="Refresh"
        :loading="loading"
        @click="handleRefresh"
        circle
      />

      <el-button type="primary" @click="$router.push('/community/create-post')">
        发布新帖
      </el-button>

      <!-- 显示统计信息 -->
      <div class="stats-info" v-if="!isEmpty">
        共 {{ total }} 篇 | 显示 {{ startIndex }}-{{ endIndex }}
      </div>
    </div>

    <!-- 列表内容 -->
    <div v-loading="loading" class="posts-container">
      <post-card
        v-for="post in posts"
        :key="post.id"
        :post="post"
        :loading="isActionLoading(`post:${post.id}`)"
        @like="handleLike"
        @tag-click="handleTagClick"
      />

      <el-empty v-if="isEmpty" description="暂无帖子" />

      <!-- 分页器 -->
      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import communityAPI from '@/api/communityWithCache'
import { usePostList } from '@/composables/usePostList'
import { usePostActions } from '@/composables/usePostActions'
import PostCard from './components/PostCard.vue'
import PostSearchInput from './components/PostSearchInput.vue'

const route = useRoute()
const router = useRouter()

// 使用帖子列表 composable
const {
  posts,
  loading,
  currentPage,
  pageSize,
  total,
  sortBy,
  searchKeyword,
  selectedForumSlug,
  selectedTag,
  isEmpty,
  hasMore,
  startIndex,
  endIndex,
  handleSearch,
  handleSortChange,
  handlePageChange,
  handlePageSizeChange,
  clearSearch,
  refreshPosts
} = usePostList({
  defaultPageSize: 20,
  onError: (error) => {
    ElMessage.error('获取帖子失败: ' + (error.message || '请检查网络连接'))
  }
})

// 使用帖子操作 composable
const { toggleLikePost, isLoading: isActionLoading } = usePostActions()

// 页面标题
const pageTitle = computed(() => {
  if (selectedForumSlug.value) {
    const forumName = route.params.slug || selectedForumSlug.value
    return `${forumName} 板块`
  }
  if (selectedTag.value) {
    return `标签: ${selectedTag.value}`
  }
  return '所有帖子'
})

const backTitle = computed(() => {
  return selectedForumSlug.value ? '返回板块列表' : '返回'
})

// 处理点赞
const handleLike = async (post) => {
  try {
    await toggleLikePost(post)
  } catch (error) {
    ElMessage.error('点赞失败，请重试')
  }
}

// 处理标签点击
const handleTagClick = (tag) => {
  router.push(`/community/posts?tag=${encodeURIComponent(tag)}`)
}

// 处理刷新
const handleRefresh = async () => {
  await refreshPosts()
  ElMessage.success('刷新成功')
}

// 处理搜索输入（来自 PostSearchInput）
const handleSearchInput = (keyword) => {
  const q = (keyword || '').trim()
  const query = { ...route.query }
  if (q) query.search = q
  else delete query.search
  router.replace({ path: route.path, query })
  handleSearch()
}

// 处理过滤变化（来自 PostSearchInput）
const handleFilterChange = (filter) => {
  if (filter.type === 'tag') {
    router.push(`/community/posts?tag=${encodeURIComponent(filter.value)}`)
  } else if (filter.type === 'sort') {
    handleSortChange(filter.value)
  }
}
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
  flex-wrap: wrap;

  > div:first-child {
    flex: 1;
    min-width: 300px;
  }

  .sort-select {
    min-width: 150px;
  }

  .stats-info {
    margin-left: auto;
    font-size: 14px;
    color: #909399;
    font-weight: 500;
  }
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

