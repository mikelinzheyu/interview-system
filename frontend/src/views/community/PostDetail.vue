<template>
  <div class="post-detail-page">
    <!-- 阅读进度条 -->
    <ReadingProgress />

    <!-- 面包屑导航 -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- 顶部返回栏 -->
    <el-page-header title="返回" @back="$router.back()">
      <template #content>
        <div class="header-content">
          <span class="page-title">{{ post?.title || '帖子详情' }}</span>
          <button
            v-if="typeof window !== 'undefined'"
            class="dark-mode-btn"
            @click="toggleDark"
            :title="isDark ? '切换到浅色模式' : '切换到暗黑模式'"
          >
            <el-icon v-if="isDark"><Sunny /></el-icon>
            <el-icon v-else><Moon /></el-icon>
          </button>
        </div>
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
        <MainContent
          :post-id="postId"
          :post="post"
          @update-post="post = $event"
        />
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

    <!-- 固定操作栏 -->
    <ArticleActions
      v-if="post"
      :liked="post.liked || false"
      :collected="post.collected || false"
      :like-count="post.likeCount || post.like_count || 0"
      :comment-count="post.commentCount || post.comment_count || 0"
      :toc="tableOfContents"
      @like="handleLike"
      @collect="handleCollect"
      @comment="scrollToComments"
      @share="handleShare"
    >
      <template #toc>
        <TableOfContentsEnhanced :toc="tableOfContents" />
      </template>
    </ArticleActions>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Sunny, Moon } from '@element-plus/icons-vue'
import communityAPI from '@/api/communityWithCache'
import { usePostSEO } from '@/composables/usePostSEO'
import { useDarkMode } from '@/composables/useDarkMode'
import { useInteraction } from '@/composables/useInteraction'
import ThreeColumnLayout from './PostDetail/layouts/ThreeColumnLayout.vue'
import LeftSidebar from './PostDetail/LeftSidebar/LeftSidebar.vue'
import MainContent from './PostDetail/MainContent/MainContent.vue'
import RightSidebar from './PostDetail/RightSidebar/RightSidebar.vue'
import ReadingProgress from '@/components/ReadingProgress.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import ArticleActions from './PostDetail/components/ArticleActions.vue'
import TableOfContentsEnhanced from './PostDetail/LeftSidebar/TableOfContentsEnhanced.vue'

const route = useRoute()

const postId = computed(() => route.params.id)
const post = ref(null)
const loading = ref(false)

// 暗黑模式
const { isDark, toggleDark } = useDarkMode()

// 乐观 UI 交互
const { toggleLike: optimisticLike, toggleCollect: optimisticCollect } = useInteraction()

// SEO 优化
usePostSEO(post)

// 面包屑导航
const breadcrumbItems = computed(() => {
  const items = [
    { label: '社区', to: '/community' }
  ]

  if (post.value?.category || post.value?.category_name) {
    const categoryName = post.value.category_name || post.value.category
    items.push({
      label: categoryName,
      to: `/community?category=${encodeURIComponent(categoryName)}`
    })
  }

  if (post.value?.title) {
    items.push({
      label: post.value.title,
      to: null
    })
  }

  return items
})

// 目录生成
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

// 关注用户
const handleFollow = async (data) => {
  try {
    // TODO: 调用 API 关注用户
    ElMessage.success(data.isFollowing ? '关注成功' : '已取消关注')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 点赞（使用乐观 UI）
const handleLike = async () => {
  if (!post.value) return

  await optimisticLike(post.value, async () => {
    // TODO: 调用真实 API
    // await communityAPI.likePost(postId.value)
  })
}

// 收藏（使用乐观 UI）
const handleCollect = async () => {
  if (!post.value) return

  await optimisticCollect(post.value, async () => {
    // TODO: 调用真实 API
    // await communityAPI.collectPost(postId.value)
  })
}

// 分享
const handleShare = () => {
  const url = `${window.location.origin}/community/posts/${postId.value}`
  const title = post.value?.title || '社区文章'
  const text = `分享一篇好文：${title}`

  // 检测是否支持 Web Share API
  if (navigator.share && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
    navigator.share({ title, text, url })
      .catch(() => {
        // 降级方案：复制链接
        copyToClipboard(url)
      })
  } else {
    // 复制链接
    copyToClipboard(url)
  }
}

// 复制到剪贴板
const copyToClipboard = (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    }).catch(() => {
      fallbackCopy(text)
    })
  } else {
    fallbackCopy(text)
  }
}

// 降级复制方法
const fallbackCopy = (text) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
    ElMessage.success('链接已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制链接')
  }

  document.body.removeChild(textarea)
}

// 滚动到评论区
const scrollToComments = () => {
  const commentsSection = document.querySelector('.comments-section')
  if (commentsSection) {
    const offset = 80
    const bodyRect = document.body.getBoundingClientRect().top
    const elementRect = commentsSection.getBoundingClientRect().top
    const elementPosition = elementRect - bodyRect
    const offsetPosition = elementPosition - offset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// 获取帖子详情
const fetchPostDetail = async () => {
  loading.value = true
  try {
    const res = await communityAPI.getPostDetail(postId.value)
    post.value = res.data?.post || res.data
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
  padding-top: 0;
  min-height: 100vh;

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dark-mode-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary, #f5f7fa);
      border: 1px solid var(--border-color-base, #dcdfe6);
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 18px;
      color: var(--text-primary, #303133);

      &:hover {
        transform: scale(1.1);
        background: var(--bg-tertiary, #fafafa);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

@media (max-width: 768px) {
  .post-detail-page {
    .header-content {
      .page-title {
        font-size: 16px;
        max-width: 200px;
      }

      .dark-mode-btn {
        width: 32px;
        height: 32px;
        font-size: 16px;
      }
    }
  }
}

@media print {
  .post-detail-page {
    .el-page-header,
    .dark-mode-btn {
      display: none !important;
    }
  }
}
</style>
