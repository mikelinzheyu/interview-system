<template>
  <div class="post-detail-new-page">
    <AuthorBanner
      :author="post?.author || {}"
      @follow="handleFollow"
    />

    <NewTwoColumnLayout>
      <template #main>
        <ArticleWithTOC>
          <template #toc>
            <FloatingTOC :toc="tableOfContents" />
            <div style="margin-top: var(--spacing-2xl)">
              <HotArticles v-if="!hotArticlesLoading" :articles="hotArticles" />
            </div>
            <div style="margin-top: var(--spacing-2xl)">
              <CategoryNav />
            </div>
          </template>

          <template #content>
            <NewArticleContent :post-id="postId" @post-loaded="handlePostLoaded" />
          </template>
        </ArticleWithTOC>
      </template>

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
import { ref, computed, onMounted, watch } from 'vue'
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
const lastLoadedHotArticlesPostId = ref(null)  // 追踪热门文章是否已加载过

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
      .replace(/[^\w-]/g, '')}`

    matches.push({ level, text, id })
  }

  return matches
}

const handlePostLoaded = (postData) => {
  post.value = postData
  tableOfContents.value = generateTableOfContents(postData?.content)
}

const loadHotArticles = async () => {
  // ⏱️ 防止重复加载：每个帖子页面只加载一次热门文章
  if (lastLoadedHotArticlesPostId.value === postId.value) {
    return
  }

  hotArticlesLoading.value = true
  try {
    const data = await communityAPI.getHotArticles(5)
    hotArticles.value = Array.isArray(data) ? data : data.articles || []
    lastLoadedHotArticlesPostId.value = postId.value
  } catch (error) {
    console.error('Failed to load hot articles:', error)
    hotArticles.value = communityAPI._getMockHotArticles()
  } finally {
    hotArticlesLoading.value = false
  }
}

onMounted(() => {
  // ⏱️ 延迟加载热门文章（500ms），避免与主内容加载竞争
  setTimeout(() => {
    loadHotArticles()
  }, 500)
})

// 监听 postId 变化，当用户导航到不同帖子时重新加载热门文章
watch(() => postId.value, () => {
  lastLoadedHotArticlesPostId.value = null  // 重置标志，允许加载新的
  setTimeout(() => {
    loadHotArticles()
  }, 500)
})

const handleFollow = async (data) => {
  try {
    // TODO: wire follow/unfollow API
    ElMessage.success(data.isFollowing ? 'Followed' : 'Unfollowed')
  } catch (error) {
    ElMessage.error('Operation failed')
  }
}
</script>

<style scoped lang="scss">
.post-detail-new-page {
  min-height: 100vh;
  background: var(--color-bg-page);
}
</style>
