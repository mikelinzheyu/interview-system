/**
 * 社区 API 路由
 * 处理帖子、文章、评论、收藏等社区相关功能
 */

const express = require('express')
const router = express.Router()
const { getControllers } = require('../services/dataService')

/**
 * 安全获取整数参数
 */
function safeParseInt(value) {
  const parsed = parseInt(value)
  return isNaN(parsed) ? null : parsed
}

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

// ==================== 帖子 API ====================

/**
 * GET /community/posts - 获取所有帖子
 */
router.get('/posts', (req, res) => {
  try {
    const { skip = 0, limit = 20, category, search } = req.query
    const controllers = getControllers()

    const result = controllers.community?.getPosts?.(
      safeParseInt(skip) || 0,
      safeParseInt(limit) || 20,
      category,
      search
    ) || {
      posts: [],
      total: 0
    }

    res.json({
      code: 200,
      message: 'Posts retrieved successfully',
      data: result
    })
  } catch (error) {
    console.error('[GET /community/posts] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve posts',
      error: error.message
    })
  }
})

/**
 * POST /community/posts - 创建帖子
 */
router.post('/posts', auth, (req, res) => {
  try {
    const { title, content, category, tags } = req.body

    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: 'Title and content are required'
      })
    }

    const controllers = getControllers()
    const post = controllers.community?.createPost?.({
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: tags || [],
      authorId: req.user.id,
      authorName: `user_${req.user.id}`
    }) || {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: tags || [],
      authorId: req.user.id,
      authorName: `user_${req.user.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0
    }

    res.status(201).json({
      code: 201,
      message: 'Post created successfully',
      data: { post }
    })
  } catch (error) {
    console.error('[POST /community/posts] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to create post',
      error: error.message
    })
  }
})

/**
 * GET /community/posts/:postId - 获取帖子详情
 */
router.get('/posts/:postId', (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const post = controllers.community?.getPost?.(postId)

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: '帖子不存在',
        error: 'Post not found'
      })
    }

    res.json({
      code: 200,
      message: 'Post retrieved successfully',
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
 * PUT /community/posts/:postId - 编辑帖子
 */
router.put('/posts/:postId', auth, (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)
    const { title, content, category, tags } = req.body

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const post = controllers.community?.updatePost?.(postId, {
      title: title?.trim(),
      content: content?.trim(),
      category,
      tags
    })

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: 'Post not found'
      })
    }

    res.json({
      code: 200,
      message: 'Post updated successfully',
      data: { post }
    })
  } catch (error) {
    console.error('[PUT /community/posts/:postId] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to update post',
      error: error.message
    })
  }
})

/**
 * DELETE /community/posts/:postId - 删除帖子
 */
router.delete('/posts/:postId', auth, (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const success = controllers.community?.deletePost?.(postId)

    if (!success) {
      return res.status(404).json({
        code: 404,
        message: 'Post not found'
      })
    }

    res.json({
      code: 200,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    console.error('[DELETE /community/posts/:postId] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to delete post',
      error: error.message
    })
  }
})

/**
 * GET /community/posts/:postId/collection - 获取帖子的收藏/相关内容
 */
router.get('/posts/:postId/collection', (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const collection = controllers.community?.getPostCollection?.(postId) || {
      postId,
      relatedPosts: [],
      comments: [],
      total: 0
    }

    res.json({
      code: 200,
      message: 'Collection retrieved successfully',
      data: collection
    })
  } catch (error) {
    console.error('[GET /community/posts/:postId/collection] Error:', error)
    res.status(500).json({
      code: 500,
      message: '接口不存在',
      error: error.message
    })
  }
})

// ==================== 文章 API ====================

/**
 * GET /community/articles/hot - 获取热门文章
 */
router.get('/articles/hot', (req, res) => {
  try {
    const limit = safeParseInt(req.query.limit) || 5
    const controllers = getControllers()

    const articles = controllers.community?.getHotArticles?.(limit) || []

    res.json({
      code: 200,
      message: 'Hot articles retrieved successfully',
      data: {
        articles,
        total: articles.length
      }
    })
  } catch (error) {
    console.error('[GET /community/articles/hot] Error:', error)
    res.status(500).json({
      code: 500,
      message: '接口不存在',
      error: error.message
    })
  }
})

/**
 * GET /community/articles/archives - 获取文章归档
 */
router.get('/articles/archives', (req, res) => {
  try {
    const controllers = getControllers()

    const archives = controllers.community?.getArticleArchives?.() || []

    res.json({
      code: 200,
      message: 'Archives retrieved successfully',
      data: {
        archives,
        total: archives.length
      }
    })
  } catch (error) {
    console.error('[GET /community/articles/archives] Error:', error)
    res.status(500).json({
      code: 500,
      message: '接口不存在',
      error: error.message
    })
  }
})

/**
 * GET /community/articles - 获取所有文章
 */
router.get('/articles', (req, res) => {
  try {
    const { skip = 0, limit = 20, category, search } = req.query
    const controllers = getControllers()

    const result = controllers.community?.getArticles?.(
      safeParseInt(skip) || 0,
      safeParseInt(limit) || 20,
      category,
      search
    ) || {
      articles: [],
      total: 0
    }

    res.json({
      code: 200,
      message: 'Articles retrieved successfully',
      data: result
    })
  } catch (error) {
    console.error('[GET /community/articles] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve articles',
      error: error.message
    })
  }
})

// ==================== 评论 API ====================

/**
 * GET /community/posts/:postId/comments - 获取帖子评论
 */
router.get('/posts/:postId/comments', (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)
    const { skip = 0, limit = 20 } = req.query

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const result = controllers.community?.getPostComments?.(
      postId,
      safeParseInt(skip) || 0,
      safeParseInt(limit) || 20
    ) || {
      comments: [],
      total: 0
    }

    res.json({
      code: 200,
      message: 'Comments retrieved successfully',
      data: result
    })
  } catch (error) {
    console.error('[GET /community/posts/:postId/comments] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to retrieve comments',
      error: error.message
    })
  }
})

/**
 * POST /community/posts/:postId/comments - 添加评论
 */
router.post('/posts/:postId/comments', auth, (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)
    const { content } = req.body

    if (!postId || !content) {
      return res.status(400).json({
        code: 400,
        message: 'Post ID and content are required'
      })
    }

    const controllers = getControllers()
    const comment = controllers.community?.addComment?.({
      postId,
      content: content.trim(),
      authorId: req.user.id,
      authorName: `user_${req.user.id}`
    }) || {
      id: Date.now(),
      postId,
      content: content.trim(),
      authorId: req.user.id,
      authorName: `user_${req.user.id}`,
      createdAt: new Date().toISOString(),
      likes: 0
    }

    res.status(201).json({
      code: 201,
      message: 'Comment added successfully',
      data: { comment }
    })
  } catch (error) {
    console.error('[POST /community/posts/:postId/comments] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to add comment',
      error: error.message
    })
  }
})

// ==================== 点赞 API ====================

/**
 * POST /community/posts/:postId/like - 点赞帖子
 */
router.post('/posts/:postId/like', auth, (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const result = controllers.community?.likePost?.(postId, req.user.id) || {
      postId,
      userId: req.user.id,
      liked: true
    }

    res.json({
      code: 200,
      message: 'Post liked successfully',
      data: result
    })
  } catch (error) {
    console.error('[POST /community/posts/:postId/like] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to like post',
      error: error.message
    })
  }
})

/**
 * DELETE /community/posts/:postId/like - 取消点赞
 */
router.delete('/posts/:postId/like', auth, (req, res) => {
  try {
    const postId = safeParseInt(req.params.postId)

    if (!postId) {
      return res.status(400).json({
        code: 400,
        message: 'Invalid post ID'
      })
    }

    const controllers = getControllers()
    const result = controllers.community?.unlikePost?.(postId, req.user.id) || {
      postId,
      userId: req.user.id,
      liked: false
    }

    res.json({
      code: 200,
      message: 'Post unliked successfully',
      data: result
    })
  } catch (error) {
    console.error('[DELETE /community/posts/:postId/like] Error:', error)
    res.status(500).json({
      code: 500,
      message: 'Failed to unlike post',
      error: error.message
    })
  }
})

// ===== 社区搜索与热门内容 =====

// GET /api/community/search/trending - 获取热门搜索
router.get('/search/trending', (req, res) => {
  const trending = [
    { keyword: 'React', count: 1234, trend: 'up' },
    { keyword: 'Node.js', count: 987, trend: 'up' },
    { keyword: 'Vue.js', count: 756, trend: 'stable' },
    { keyword: '数据库优化', count: 654, trend: 'up' },
    { keyword: '微服务架构', count: 543, trend: 'up' }
  ]
  res.json({
    code: 200,
    message: 'Trending searches retrieved',
    data: trending
  })
})

// GET /api/community/tags/hot - 获取热门标签
router.get('/tags/hot', (req, res) => {
  const hotTags = [
    { id: 1, name: 'JavaScript', count: 3245, temperature: 'hot' },
    { id: 2, name: 'Python', count: 2876, temperature: 'hot' },
    { id: 3, name: 'React', count: 2543, temperature: 'hot' },
    { id: 4, name: '面试经验', count: 2134, temperature: 'warm' },
    { id: 5, name: '算法题解', count: 1876, temperature: 'warm' },
    { id: 6, name: '开源项目', count: 1654, temperature: 'warm' }
  ]
  res.json({
    code: 200,
    message: 'Hot tags retrieved',
    data: hotTags
  })
})

// GET /api/community/forums - 获取论坛列表
router.get('/forums', (req, res) => {
  const forums = [
    { id: 1, name: '技术讨论', description: '讨论各种技术话题', posts: 1234, members: 5678 },
    { id: 2, name: '面试分享', description: '分享面试经验和题目', posts: 987, members: 4321 },
    { id: 3, name: '项目展示', description: '展示个人项目作品', posts: 654, members: 3210 },
    { id: 4, name: '职业发展', description: '讨论职业规划和发展', posts: 543, members: 2876 },
    { id: 5, name: '学习资源', description: '分享学习资源和教程', posts: 432, members: 2543 }
  ]
  res.json({
    code: 200,
    message: 'Forums retrieved',
    data: forums
  })
})

module.exports = router
