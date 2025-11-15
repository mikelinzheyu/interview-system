/**
 * 社区博客 API 服务
 * 负责与后端通信获取博客相关数据
 */

import { ElMessage } from 'element-plus'

// 基础配置
const API_BASE = '/api'
const COMMUNITY_API = `${API_BASE}/community`
// 与 communityWithCache 保持一致：默认使用 Mock 数据，除非显式关闭
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'

/**
 * 安全解析 JSON，避免后端 500 或非 JSON 响应导致 SyntaxError
 */
const safeParseJson = async (response) => {
  if (!response || typeof response.json !== 'function') return null

  const contentType = response.headers?.get?.('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

/**
 * 底层 fetch 封装，统一返回 { response, result }
 */
const doFetch = async (url, options = {}) => {
  const response = await fetch(url, options)
  const result = await safeParseJson(response)
  return { response, result }
}

/**
 * 通用 API 请求方法（主要用于 POST / PATCH / DELETE）
 */
const request = async (url, options = {}) => {
  const { method = 'GET', data = null, headers = {} } = options

  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (data) {
      fetchOptions.body = JSON.stringify(data)
    }

    const { response, result } = await doFetch(url, fetchOptions)
    const payload = result || {}

    if (!response.ok) {
      const message = payload.message || `API request failed with status ${response.status}`
      throw new Error(message)
    }

    return 'data' in payload ? payload.data : payload
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * 博客相关 API
 */
const communityAPI = {
  /**
   * 获取文章详情
   */
  async getPostDetail(postId) {
    try {
      const { response, result } = await doFetch(`${COMMUNITY_API}/posts/${postId}`)
      const payload = result || {}

      if (!response.ok) {
        const message = payload.message || `Failed to fetch post (status ${response.status})`
        throw new Error(message)
      }

      const data = 'data' in payload ? payload.data : payload
      return data || this._getMockPostDetail(postId)
    } catch (error) {
      console.warn('Using mock data for post detail:', error)
      return this._getMockPostDetail(postId)
    }
  },

  /**
   * 获取文章的专栏信息
   */
  async getArticleCollection(postId) {
    try {
      const { response, result } = await doFetch(`${COMMUNITY_API}/posts/${postId}/collection`)
      const payload = result || {}

      if (!response.ok) {
        const message = payload.message || `Failed to fetch collection (status ${response.status})`
        throw new Error(message)
      }

      const data = 'data' in payload ? payload.data : payload
      return data || this._getMockCollection()
    } catch (error) {
      console.warn('Using mock data for collection:', error)
      return this._getMockCollection()
    }
  },

  /**
   * 获取热门文章列表
   */
  async getHotArticles(limit = 5) {
    try {
      const { response, result } = await doFetch(`${COMMUNITY_API}/articles/hot?limit=${limit}`)
      const payload = result || {}

      if (!response.ok) {
        const message = payload.message || `Failed to fetch hot articles (status ${response.status})`
        throw new Error(message)
      }

      const data = 'data' in payload ? payload.data : payload
      return data || this._getMockHotArticles()
    } catch (error) {
      console.warn('Using mock data for hot articles:', error)
      return this._getMockHotArticles()
    }
  },

  /**
   * 获取文章归档
   */
  async getArticleArchives() {
    try {
      const { response, result } = await doFetch(`${COMMUNITY_API}/articles/archives`)
      const payload = result || {}

      if (!response.ok) {
        const message = payload.message || `Failed to fetch archives (status ${response.status})`
        throw new Error(message)
      }

      const data = 'data' in payload ? payload.data : payload
      return data || this._getMockArchives()
    } catch (error) {
      console.warn('Using mock data for archives:', error)
      return this._getMockArchives()
    }
  },

  /**
   * 点赞文章
   */
  async likePost(postId) {
    try {
      return await request(`${COMMUNITY_API}/posts/${postId}/like`, {
        method: 'POST'
      })
    } catch (error) {
      ElMessage.error('点赞失败')
      throw error
    }
  },

  /**
   * 收藏文章
   */
  async collectPost(postId) {
    try {
      return await request(`${COMMUNITY_API}/posts/${postId}/collect`, {
        method: 'POST'
      })
    } catch (error) {
      ElMessage.error('收藏失败')
      throw error
    }
  },

  /**
   * 关注作者
   */
  async followAuthor(authorId) {
    try {
      return await request(`${COMMUNITY_API}/authors/${authorId}/follow`, {
        method: 'POST'
      })
    } catch (error) {
      ElMessage.error('关注失败')
      throw error
    }
  },

  // ========== Mock 数据方法 ==========

  _getMockPostDetail(postId) {
    return {
      id: postId,
      title: '【Linux】【操作】Linux操作集锦系列之十五——如何破解pdf、doc、zip、rar等密码',
      content: `# Linux 系统密码破解指南

## 作者简介

本文作者：**花神庙农**，拥有 20 年 Linux 系统运维经验。

## 博文系列

本文属于 **Linux技术系列**，该系列包含多篇深度技术文章。

## 如何破解pdf、doc、zip、rar等密码

如果您遗忘了这些加密文件的密码，可以使用专业工具进行破解。

### john the ripper

使用字典破解

\`\`\`bash
python office2john.py filename.docx > hash.txt
john hash.txt
\`\`\`

### 破解word、excel

\`\`\`bash
python office2john.py filename.docx > hash.txt
python office2john.py filename.xlsx > hash.txt
\`\`\`

### 破解pdf

使用 john the ripper 破解 PDF 文件密码：

\`\`\`bash
pdf2john.pl encrypted.pdf > hash.txt
john hash.txt
\`\`\`

## 总结

本文介绍了在 Linux 系统中破解常见加密文件的方法。请注意，这些工具仅用于合法用途，如找回自己遗忘的密码。
`,
      tags: ['linux', 'pdf', '破解', 'zip', 'rar', 'doc', '密码'],
      createdAt: new Date(Date.now() - 2 * 24 * 3600000),
      viewCount: 2400,
      likeCount: 33,
      commentCount: 20,
      liked: false,
      collected: false,
      author: {
        id: 'author-1',
        name: '花神庙农',
        avatar: 'https://cube.elemecdn.com/0/88/ff94d3c6d86f60cbe2e86151d6a5cda1.png',
        bio: '博客专家 · 操作系统领域新星博主',
        title: '高级系统工程师',
        level: '博客专家',
        verified: true,
        followerCount: 250,
        articleCount: 4054,
        likeCount: 82000,
        viewCount: 450000
      },
      comments: []
    }
  },

  _getMockCollection() {
    return {
      id: 'collection-1',
      name: 'Linux 操作系列',
      articles: [
        { id: '1', title: 'Linux操作集锦系列之十四——Shell脚本编程', viewCount: 820 },
        { id: '2', title: 'Linux操作集锦系列之十五——如何破解PDF密码', viewCount: 2400 },
        { id: '3', title: 'Linux操作集锦系列之十六——系统监控工具', viewCount: 1500 },
        { id: '4', title: 'Linux操作集锦系列之十七——网络配置详解', viewCount: 1200 },
        { id: '5', title: 'Linux操作集锦系列之十八——磁盘管理技巧', viewCount: 950 }
      ]
    }
  },

  _getMockHotArticles() {
    return [
      { id: 'hot-1', title: 'Vue 3 性能优化的完整指南', viewCount: 15200, likeCount: 823 },
      { id: 'hot-2', title: 'React Hooks 最佳实践', viewCount: 12800, likeCount: 756 },
      { id: 'hot-3', title: 'TypeScript 进阶技巧', viewCount: 9800, likeCount: 542 },
      { id: 'hot-4', title: 'Webpack 5 配置详解', viewCount: 7600, likeCount: 432 },
      { id: 'hot-5', title: 'Node.js 性能优化', viewCount: 6500, likeCount: 389 }
    ]
  },

  _getMockArchives() {
    return [
      { month: '2025-01', count: 15 },
      { month: '2024-12', count: 23 },
      { month: '2024-11', count: 18 },
      { month: '2024-10', count: 21 },
      { month: '2024-09', count: 19 },
      { month: '2024-08', count: 16 },
      { month: '2024-07', count: 14 }
    ]
  }
}

export default communityAPI
