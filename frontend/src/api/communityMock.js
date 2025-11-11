/**
 * Mock数据生成器 - 用于本地开发测试
 * 当后端 API 不可用时，使用此模拟数据
 */

const mockPosts = [
  {
    id: '1',
    title: '如何深入理解 Vue 3 的响应式系统？',
    content: '今天我学习了 Vue 3 的响应式原理，使用了 Proxy 和 Reflect 来实现数据的响应式追踪。让我分享一下核心概念...',
    author: {
      userId: 'user1',
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1'
    },
    tags: ['Vue3', '响应式', 'JavaScript'],
    likes: 15,
    commentCount: 3,
    viewCount: 120,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '2',
    title: 'React Hooks 最佳实践总结',
    content: '在实际项目中使用 React Hooks 有哪些最佳实践？我总结了以下几点：\n1. 遵循 Hooks 的使用规则\n2. 合理使用 useEffect\n3. 自定义 Hooks 的设计模式...',
    author: {
      userId: 'user2',
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2'
    },
    tags: ['React', 'Hooks', 'Best Practices'],
    likes: 28,
    commentCount: 5,
    viewCount: 250,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: true
  },
  {
    id: '3',
    title: '前端性能优化从入门到精通',
    content: '性能优化是前端开发的重要课题。本文涵盖以下内容：\n- 网络优化\n- 渲染优化\n- JavaScript 执行优化\n- 内存管理...',
    author: {
      userId: 'user3',
      name: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3'
    },
    tags: ['性能优化', '前端', '最佳实践'],
    likes: 42,
    commentCount: 8,
    viewCount: 380,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    solved: true,
    pinned: false
  },
  {
    id: '4',
    title: 'TypeScript 高级特性详解',
    content: '让我们深入探讨 TypeScript 的高级特性，包括泛型、条件类型、映射类型等...',
    author: {
      userId: 'user4',
      name: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user4'
    },
    tags: ['TypeScript', '类型系统', 'Advanced'],
    likes: 34,
    commentCount: 6,
    viewCount: 210,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  },
  {
    id: '5',
    title: 'Node.js 服务器最佳实践',
    content: '构建高效稳定的 Node.js 服务器需要注意哪些问题？讨论错误处理、日志记录、性能监控...',
    author: {
      userId: 'user5',
      name: '孙七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user5'
    },
    tags: ['Node.js', '后端', '最佳实践'],
    likes: 22,
    commentCount: 4,
    viewCount: 180,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    solved: false,
    pinned: false
  }
]

/**
 * 根据条件过滤和排序帖子
 */
export function generateMockPosts(params = {}) {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'latest',
    search = '',
    tag = null,
    forumSlug = null
  } = params

  let filtered = [...mockPosts]

  // 搜索过滤
  if (search) {
    filtered = filtered.filter(p =>
      p.title.includes(search) || p.content.includes(search)
    )
  }

  // 标签过滤
  if (tag) {
    filtered = filtered.filter(p => p.tags.includes(tag))
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return b.likes - a.likes
      case 'popular':
        return b.viewCount - a.viewCount
      case 'latest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  // 分页
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paged = filtered.slice(start, end)

  return {
    data: paged,
    total: filtered.length,
    page,
    pageSize,
    pages: Math.ceil(filtered.length / pageSize)
  }
}

export default mockPosts
