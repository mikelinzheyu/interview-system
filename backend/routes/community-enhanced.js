/**
 * 增强版社区 API 路由
 * 包含所有博客优化功能的后端接口
 *
 * 注意: 这些接口需要配置数据库才能正常工作
 * 当前为示例代码，需要根据实际数据库配置进行调整
 */

const express = require('express')
const router = express.Router()

/**
 * 认证中间件
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Missing authentication token'
    })
  }

  try {
    const userId = parseInt(token) || 1
    req.user = { id: userId }
    req.token = token
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Invalid token',
      error: error.message
    })
  }
}

/**
 * GET /community/posts/:postId - 获取帖子详情（增强版）
 *
 * 功能:
 * - 返回完整的帖子信息
 * - 包含作者信息
 * - 包含分类和标签
 * - 包含用户的点赞和收藏状态
 * - 自动增加浏览量
 * - 记录用户阅读历史
 */
router.get('/posts/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const userId = req.user?.id // 从认证中间件获取（可选）

    if (!postId || isNaN(postId)) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    // TODO: 从数据库获取文章详情
    // const db = getDatabase()
    // const post = await db.query(`
    //   SELECT
    //     p.*,
    //     u.username as author_name,
    //     u.avatar as author_avatar,
    //     c.name as category_name,
    //     GROUP_CONCAT(t.name) as tags
    //   FROM posts p
    //   LEFT JOIN users u ON p.author_id = u.id
    //   LEFT JOIN categories c ON p.category_id = c.id
    //   LEFT JOIN post_tags pt ON p.id = pt.post_id
    //   LEFT JOIN tags t ON pt.tag_id = t.id
    //   WHERE p.id = ? AND p.status = 'published'
    //   GROUP BY p.id
    // `, [postId])

    // 模拟数据（实际应从数据库获取）
    const post = {
      id: postId,
      title: 'Vue 3 性能优化完整指南',
      content: `# Vue 3 性能优化

## 介绍
Vue 3 是一个现代的 JavaScript 框架...

## Composition API
提供了更灵活的组件逻辑组织方式。

\`\`\`javascript
import { ref, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    return { count }
  }
}
\`\`\`

## 总结
通过这些优化技巧，可以显著提升应用性能。`,
      excerpt: '深入探讨 Vue 3 的性能优化技巧，包括 Composition API、响应式系统优化等内容',
      cover_image: 'https://picsum.photos/800/400',
      author: {
        id: 1,
        name: '李明',
        username: 'liming',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        bio: '资深前端工程师，专注 Vue 生态'
      },
      category_name: '技术分享',
      category: '技术分享',
      tags: ['Vue 3', 'JavaScript', '性能优化'],
      view_count: 1250,
      like_count: 234,
      comment_count: 18,
      collect_count: 89,
      liked: false, // 需要查询 likes 表
      collected: false, // 需要查询 collections 表
      created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
    }

    // TODO: 异步更新浏览量
    // await db.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [postId])

    // TODO: 记录阅读历史（如果用户已登录）
    // if (userId) {
    //   await db.query(`
    //     INSERT INTO reading_history (user_id, post_id, last_read_at)
    //     VALUES (?, ?, NOW())
    //     ON DUPLICATE KEY UPDATE last_read_at = NOW()
    //   `, [userId, postId])
    // }

    res.json({
      code: 200,
      message: 'Success',
      data: { post }
    })
  } catch (error) {
    console.error('[GET /community/posts/:postId] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve post',
      error: error.message
    })
  }
})

/**
 * GET /community/posts/:postId/related - 获取相关文章
 *
 * 功能:
 * - 基于标签相似度推荐
 * - 基于分类推荐
 * - 排除当前文章
 */
router.get('/posts/:postId/related', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const limit = parseInt(req.query.limit) || 5

    // TODO: 基于标签相似度查询相关文章
    // const relatedPosts = await db.query(`...`)

    // 模拟数据
    const relatedPosts = [
      {
        id: 21,
        title: 'Vue 3 Composition API 深入解析',
        excerpt: '详细介绍 Vue 3 Composition API 的使用技巧',
        cover_image: 'https://picsum.photos/400/200?random=1',
        view_count: 980,
        like_count: 156,
        author_name: '张三',
        published_at: new Date().toISOString()
      },
      {
        id: 22,
        title: 'JavaScript 性能优化实战',
        excerpt: '从实际项目出发，讲解 JS 性能优化技巧',
        cover_image: 'https://picsum.photos/400/200?random=2',
        view_count: 1234,
        like_count: 203,
        author_name: '李四',
        published_at: new Date().toISOString()
      }
    ]

    res.json({
      code: 200,
      data: { articles: relatedPosts }
    })
  } catch (error) {
    console.error('[GET /community/posts/:postId/related] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve related posts'
    })
  }
})

/**
 * POST /community/posts/:postId/collect - 收藏/取消收藏文章
 */
router.post('/posts/:postId/collect', auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const userId = req.user.id

    // TODO: 切换收藏状态
    // const existing = await db.query(
    //   'SELECT id FROM collections WHERE user_id = ? AND post_id = ?',
    //   [userId, postId]
    // )

    // 模拟切换
    const collected = Math.random() > 0.5

    res.json({
      code: 200,
      message: collected ? '收藏成功' : '已取消收藏',
      data: { collected }
    })
  } catch (error) {
    console.error('[POST /community/posts/:postId/collect] Error:', error)
    res.status(500).json({
      code: 500,
      message: '操作失败'
    })
  }
})

/**
 * POST /community/posts/:postId/views - 记录浏览和阅读进度
 */
router.post('/posts/:postId/views', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId)
    const userId = req.user?.id
    const { progress = 0, readTime = 0 } = req.body

    // TODO: 更新浏览量和阅读历史
    // await db.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [postId])

    // if (userId) {
    //   await db.query(`
    //     INSERT INTO reading_history (user_id, post_id, progress, read_time)
    //     VALUES (?, ?, ?, ?)
    //     ON DUPLICATE KEY UPDATE
    //       progress = VALUES(progress),
    //       read_time = read_time + VALUES(read_time)
    //   `, [userId, postId, progress, readTime])
    // }

    res.json({
      code: 200,
      message: 'Success'
    })
  } catch (error) {
    console.error('[POST /community/posts/:postId/views] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to record view'
    })
  }
})

/**
 * POST /community/users/:userId/follow - 关注/取消关注用户
 */
router.post('/users/:userId/follow', auth, async (req, res) => {
  try {
    const followingId = parseInt(req.params.userId)
    const followerId = req.user.id

    if (followerId === followingId) {
      return res.status(400).json({
        code: 400,
        message: '不能关注自己'
      })
    }

    // TODO: 切换关注状态
    // const existing = await db.query(...)

    const following = Math.random() > 0.5

    res.json({
      code: 200,
      message: following ? '关注成功' : '已取消关注',
      data: { following }
    })
  } catch (error) {
    console.error('[POST /community/users/:userId/follow] Error:', error)
    res.status(500).json({
      code: 500,
      message: '操作失败'
    })
  }
})

/**
 * GET /community/search - 全文搜索
 *
 * 支持的参数:
 * - q: 搜索关键词
 * - category: 分类筛选
 * - tag: 标签筛选
 * - author: 作者筛选
 * - sort: 排序方式 (relevance, latest, popular, likes)
 * - page: 页码
 * - limit: 每页数量
 */
router.get('/search', async (req, res) => {
  try {
    const {
      q,
      category,
      tag,
      author,
      sort = 'relevance',
      page = 1,
      limit = 20
    } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        code: 400,
        message: '搜索关键词至少需要 2 个字符'
      })
    }

    // TODO: 实现全文搜索
    // const results = await db.query(`...`)

    // 模拟搜索结果
    const results = []
    const total = 0

    res.json({
      code: 200,
      data: {
        posts: results,
        total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        hasMore: false
      }
    })
  } catch (error) {
    console.error('[GET /community/search] Error:', error)
    res.status(500).json({
      code: 500,
      message: '搜索失败'
    })
  }
})

/**
 * GET /community/rss - RSS 订阅
 */
router.get('/rss', async (req, res) => {
  try {
    // TODO: 生成 RSS feed
    // const RSS = require('rss')
    // const feed = new RSS({...})

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>社区论坛</title>
    <link>https://viewself.cn/community</link>
    <description>最新技术文章</description>
  </channel>
</rss>`

    res.type('application/rss+xml')
    res.send(rss)
  } catch (error) {
    console.error('[GET /community/rss] Error:', error)
    res.status(500).send('Failed to generate RSS feed')
  }
})

module.exports = router
