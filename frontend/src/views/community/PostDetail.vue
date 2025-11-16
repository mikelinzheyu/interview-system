<template>
  <div class="post-detail-page">
    <!-- 顶部返回栏 -->
    <el-page-header title="返回" @back="$router.back()">
      <template #content>
        <span class="page-title">帖子详情</span>
      </template>
    </el-page-header>

    <!-- 三列布局 -->
    <ThreeColumnLayout>
      <!-- 左侧栏 -->
      <template #left>
        <LeftSidebar
          :author="post?.author || {}"
          :toc="tableOfContents"
          @follow="handleFollow"
        />
      </template>

      <!-- 主内容区 -->
      <template #main>
        <MainContent :post-id="postId" />
      </template>

      <!-- 右侧栏 -->
      <template #right>
        <RightSidebar
          :article-content="post?.content || ''"
          :post-id="postId"
          :tags="post?.tags || []"
          :category="post?.category || ''"
        />
      </template>
    </ThreeColumnLayout>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import communityAPI from '@/api/communityWithCache'
import ThreeColumnLayout from './PostDetail/layouts/ThreeColumnLayout.vue'
import LeftSidebar from './PostDetail/LeftSidebar/LeftSidebar.vue'
import MainContent from './PostDetail/MainContent/MainContent.vue'
import RightSidebar from './PostDetail/RightSidebar/RightSidebar.vue'

const route = useRoute()

const postId = computed(() => route.params.id)
const post = ref(null)
const loading = ref(false)

const tableOfContents = computed(() => {
  if (!post.value?.content) return []
  // 从内容中提取标题（H1-H3）生成目录
  const regex = /^(#{1,3})\s+(.+)$/gm
  const matches = []
  let match

  while ((match = regex.exec(post.value.content)) !== null) {
    const level = match[1].length
    const text = match[2]
    const id = `heading-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`

    matches.push({ level, text, id })
  }

  return matches
})

const handleFollow = async (data) => {
  try {
    // TODO: 调用 API 关注用户
    ElMessage.success(data.isFollowing ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const fetchPostDetail = async () => {
  loading.value = true
  try {
    const res = await communityAPI.getPostDetail(postId.value)
    post.value = res.data
  } catch (error) {
    ElMessage.error('获取帖子详情失败')
    console.error('AxiosError', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style scoped lang="scss">
.post-detail-page {
  padding-top: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}
</style>
