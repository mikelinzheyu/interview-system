/**
 * 博客帖子 SEO 优化 Composable
 * 为帖子页面提供完整的 SEO 元数据
 */
import { watch, computed } from 'vue'
import { useHead } from '@vueuse/head'

export function usePostSEO(post) {
  const siteUrl = computed(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'https://viewself.cn'
  })

  const postUrl = computed(() => {
    if (!post.value?.id) return siteUrl.value
    return `${siteUrl.value}/community/posts/${post.value.id}`
  })

  const title = computed(() => {
    if (!post.value?.title) return '文章详情'
    return `${post.value.title} - 社区论坛`
  })

  const description = computed(() => {
    if (!post.value?.excerpt && !post.value?.content) return '分享技术文章，交流开发经验'

    // 如果有摘要，使用摘要
    if (post.value.excerpt) {
      return post.value.excerpt.substring(0, 160)
    }

    // 否则从内容中提取
    const text = post.value.content
      .replace(/[#*`>\[\]]/g, '') // 移除 Markdown 符号
      .replace(/\n+/g, ' ') // 替换换行为空格
      .trim()

    return text.substring(0, 160) + (text.length > 160 ? '...' : '')
  })

  const keywords = computed(() => {
    if (!post.value?.tags || !Array.isArray(post.value.tags)) return ''
    return post.value.tags.join(',')
  })

  const coverImage = computed(() => {
    if (post.value?.coverImage) return post.value.coverImage
    if (post.value?.cover_image) return post.value.cover_image
    return `${siteUrl.value}/default-og-image.jpg`
  })

  const structuredData = computed(() => {
    if (!post.value) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.value.title || '',
      image: coverImage.value,
      author: {
        '@type': 'Person',
        name: post.value.author?.name || post.value.author?.username || '未知作者',
        url: post.value.author?.id ? `${siteUrl.value}/community/users/${post.value.author.id}` : undefined
      },
      publisher: {
        '@type': 'Organization',
        name: '社区论坛',
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl.value}/logo.png`
        }
      },
      datePublished: post.value.createdAt || post.value.created_at || new Date().toISOString(),
      dateModified: post.value.updatedAt || post.value.updated_at || post.value.createdAt || post.value.created_at || new Date().toISOString(),
      description: description.value,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': postUrl.value
      }
    }
  })

  // 使用 @vueuse/head 设置元数据
  useHead({
    title: title,
    meta: [
      // 基础 meta
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },

      // Open Graph
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: () => post.value?.title || '文章详情' },
      { property: 'og:description', content: description },
      { property: 'og:image', content: coverImage },
      { property: 'og:url', content: postUrl },
      { property: 'og:site_name', content: '社区论坛' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: () => post.value?.title || '文章详情' },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: coverImage },

      // 文章元数据
      {
        property: 'article:published_time',
        content: () => post.value?.createdAt || post.value?.created_at || ''
      },
      {
        property: 'article:modified_time',
        content: () => post.value?.updatedAt || post.value?.updated_at || ''
      },
      {
        property: 'article:author',
        content: () => post.value?.author?.name || post.value?.author?.username || ''
      },
      {
        property: 'article:section',
        content: () => post.value?.category || post.value?.category_name || ''
      },
      {
        property: 'article:tag',
        content: keywords
      }
    ],
    link: [
      { rel: 'canonical', href: postUrl }
    ],
    script: [
      {
        type: 'application/ld+json',
        children: () => structuredData.value ? JSON.stringify(structuredData.value) : ''
      }
    ]
  })

  return {
    title,
    description,
    keywords,
    coverImage,
    postUrl,
    structuredData
  }
}
