<template>
  <div class="post-detail-new-page">
    <!-- 顶部作者横幅 -->
    <AuthorBanner
      :author="post?.author || {}"
      @follow="handleFollow"
      @message="handleMessage"
    />

    <!-- 两列布局 -->
    <NewTwoColumnLayout>
      <!-- 主内容区 -->
      <template #main>
        <!-- 文章内容（带左侧目录） -->
        <ArticleWithTOC>
          <!-- 左侧悬浮目录 -->
          <template #toc>
            <FloatingTOC :toc="tableOfContents" />
            <div style="margin-top: var(--spacing-2xl)">
              <HotArticles v-if="!hotArticlesLoading" :articles="hotArticles" />
            </div>
            <div style="margin-top: var(--spacing-2xl)">
              <CategoryNav />
            </div>
          </template>

          <!-- 右侧文章内容 -->
          <template #content>
            <NewArticleContent :post-id="postId" @post-loaded="handlePostLoaded" />
          </template>
        </ArticleWithTOC>
      </template>

      <!-- 右侧边栏 -->
      <template #sidebar>
        <NewRightSidebar
          :current-article-id="postId"
          :post-content="postContent"
        />
      </template>
    </NewTwoColumnLayout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AuthorBanner from './PostDetail/components/AuthorBanner.vue'
import NewTwoColumnLayout from './PostDetail/layouts/NewTwoColumnLayout.vue'
import ArticleWithTOC from './PostDetail/components/ArticleWithTOC.vue'
import FloatingTOC from './PostDetail/components/FloatingTOC.vue'
import NewArticleContent from './PostDetail/components/NewArticleContent.vue'
import NewRightSidebar from './PostDetail/components/NewRightSidebar.vue'
import HotArticles from './PostDetail/components/HotArticles.vue'
import CategoryNav from './PostDetail/components/CategoryNav.vue'
import communityAPI from '@/api/communityAPI'

const route = useRoute()

const postId = computed(() => route.params.id)
const post = ref(null)
const postContent = computed(() => post.value?.content || '')
const tableOfContents = ref([])
const hotArticlesLoading = ref(false)
const hotArticles = ref([])

// 从文章内容中提取目录
const generateTableOfContents = (content) => {
  if (!content) return []

  const regex = /^(#{1,3})\s+(.+)$/gm
  const matches = []
  let match

  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2]
    const id = `heading-${text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')}`

    matches.push({ level, text, id })
  }

  return matches
}

const handlePostLoaded = (postData) => {
  post.value = postData
  tableOfContents.value = generateTableOfContents(postData?.content)
}

// 加载热门文章至左侧区域
const loadHotArticles = async () => {
  hotArticlesLoading.value = true
  try {
    const data = await communityAPI.getHotArticles(5)
    hotArticles.value = Array.isArray(data) ? data : data.articles || []
  } catch (error) {
    console.error('Failed to load hot articles:', error)
    hotArticles.value = communityAPI._getMockHotArticles()
  } finally {
    hotArticlesLoading.value = false
  }
}

onMounted(() => {
  loadHotArticles()
})

const handleFollow = async (data) => {
  try {
    // TODO: 调用 API 关注用户
    ElMessage.success(data.isFollowing ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleMessage = async (data) => {
  // 私信功能已在 LeftSidebar/AuthorCard 中实现
  // 此方法保留以供未来扩展使用
}
</script>

<style scoped lang="scss">
.post-detail-new-page {
  min-height: 100vh;
  background: var(--color-bg-page);
}
</style>
