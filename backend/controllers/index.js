/**
 * 频道控制器 - 频道管理业务逻辑
 */

class ChannelController {
  constructor(mockData) {
    this.mockData = mockData
    this.initializeChannels()
  }

  initializeChannels() {
    if (!this.mockData.channels) {
      this.mockData.channels = [
        {
          id: 1,
          name: 'general',
          description: '综合讨论频道',
          creatorId: 1,
          members: [1, 2, 3],
          isPrivate: false,
          createdAt: '2025-11-01T10:00:00Z'
        },
        {
          id: 2,
          name: 'random',
          description: '随机话题',
          creatorId: 1,
          members: [1, 2],
          isPrivate: false,
          createdAt: '2025-11-02T10:00:00Z'
        }
      ]
    }
  }

  /**
   * 获取用户所有频道
   */
  getUserChannels(userId) {
    return this.mockData.channels.filter(ch =>
      ch.members.includes(userId)
    )
  }

  /**
   * 创建频道
   */
  createChannel(data) {
    const channel = {
      id: this.mockData.channelIdCounter || Date.now(),
      name: data.name,
      description: data.description || '',
      creatorId: data.creatorId,
      members: [data.creatorId],
      isPrivate: data.isPrivate || false,
      createdAt: new Date().toISOString()
    }

    this.mockData.channels.push(channel)
    this.mockData.channelIdCounter = (this.mockData.channelIdCounter || 0) + 1

    return channel
  }

  /**
   * 获取频道详情
   */
  getChannel(channelId) {
    return this.mockData.channels.find(ch => ch.id === parseInt(channelId))
  }

  /**
   * 更新频道信息
   */
  updateChannel(channelId, data) {
    const channel = this.getChannel(channelId)

    if (!channel) {
      return null
    }

    if (data.name) channel.name = data.name
    if (data.description) channel.description = data.description

    return channel
  }

  /**
   * 删除频道
   */
  deleteChannel(channelId) {
    const index = this.mockData.channels.findIndex(ch => ch.id === parseInt(channelId))

    if (index === -1) {
      return false
    }

    this.mockData.channels.splice(index, 1)
    return true
  }

  /**
   * 获取频道成员
   */
  getChannelMembers(channelId) {
    const channel = this.getChannel(channelId)

    if (!channel) {
      return []
    }

    return channel.members.map(userId => ({
      id: userId,
      username: `user_${userId}`,
      role: userId === channel.creatorId ? 'admin' : 'member'
    }))
  }

  /**
   * 添加成员到频道
   */
  addChannelMember(channelId, userId) {
    const channel = this.getChannel(channelId)

    if (!channel) {
      return false
    }

    if (!channel.members.includes(userId)) {
      channel.members.push(userId)
    }

    return true
  }

  /**
   * 从频道移除成员
   */
  removeChannelMember(channelId, userId) {
    const channel = this.getChannel(channelId)

    if (!channel) {
      return false
    }

    const index = channel.members.indexOf(userId)

    if (index > -1) {
      channel.members.splice(index, 1)
    }

    return true
  }
}

/**
 * 消息控制器 - 消息管理业务逻辑
 */
class MessageController {
  constructor(mockData) {
    this.mockData = mockData
    this.initializeMessages()
  }

  initializeMessages() {
    if (!this.mockData.messages) {
      this.mockData.messages = [
        {
          id: 1,
          channelId: 1,
          senderId: 1,
          senderName: 'user_1',
          content: '欢迎加入聊天系统！',
          type: 'text',
          replyTo: null,
          createdAt: '2025-11-12T10:00:00Z',
          status: 'sent',
          reactions: []
        }
      ]
    }

    if (!this.mockData.messageIdCounter) {
      this.mockData.messageIdCounter = 100
    }
  }

  /**
   * 获取频道消息
   */
  getChannelMessages(channelId, skip = 0, limit = 50) {
    const messages = this.mockData.messages.filter(m => m.channelId === parseInt(channelId))

    return {
      messages: messages.slice(skip, skip + limit),
      total: messages.length
    }
  }

  /**
   * 发送消息
   */
  sendMessage(data) {
    const message = {
      id: this.mockData.messageIdCounter++,
      channelId: data.channelId,
      senderId: data.senderId,
      senderName: data.senderName || `user_${data.senderId}`,
      senderAvatar: data.senderAvatar || '',
      content: data.content,
      type: data.type || 'text',
      replyTo: data.replyTo || null,
      encryptedContent: data.encryptedContent || null,
      encryptionKeyId: data.encryptionKeyId || null,
      createdAt: new Date().toISOString(),
      status: 'sent',
      reactions: []
    }

    this.mockData.messages.push(message)

    return message
  }

  /**
   * 获取消息
   */
  getMessage(messageId) {
    return this.mockData.messages.find(m => m.id === parseInt(messageId))
  }

  /**
   * 编辑消息
   */
  updateMessage(messageId, data) {
    const message = this.getMessage(messageId)

    if (!message) {
      return null
    }

    if (data.content) message.content = data.content
    if (data.type) message.type = data.type

    message.updatedAt = new Date().toISOString()

    return message
  }

  /**
   * 删除消息
   */
  deleteMessage(messageId) {
    const index = this.mockData.messages.findIndex(m => m.id === parseInt(messageId))

    if (index === -1) {
      return false
    }

    this.mockData.messages.splice(index, 1)
    return true
  }

  /**
   * 获取消息回复
   */
  getMessageReplies(messageId) {
    return this.mockData.messages.filter(m => m.replyTo === parseInt(messageId))
  }

  /**
   * 添加回复
   */
  addReply(parentMessageId, data) {
    return this.sendMessage({
      ...data,
      replyTo: parentMessageId
    })
  }

  /**
   * 获取消息反应
   */
  getMessageReactions(messageId) {
    const message = this.getMessage(messageId)

    if (!message) {
      return []
    }

    return message.reactions || []
  }

  /**
   * 添加反应
   */
  addReaction(messageId, userId, emoji) {
    const message = this.getMessage(messageId)

    if (!message) {
      return null
    }

    if (!message.reactions) {
      message.reactions = []
    }

    const reaction = message.reactions.find(r => r.emoji === emoji)

    if (reaction) {
      if (!reaction.users) reaction.users = []
      if (!reaction.users.includes(userId)) {
        reaction.users.push(userId)
        reaction.count = reaction.users.length
      }
    } else {
      message.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      })
    }

    return message.reactions
  }

  /**
   * 移除反应
   */
  removeReaction(messageId, userId, emoji) {
    const message = this.getMessage(messageId)

    if (!message || !message.reactions) {
      return null
    }

    const reaction = message.reactions.find(r => r.emoji === emoji)

    if (reaction && reaction.users) {
      const index = reaction.users.indexOf(userId)
      if (index > -1) {
        reaction.users.splice(index, 1)
        reaction.count = reaction.users.length

        // 如果没有人了，删除反应
        if (reaction.count === 0) {
          const reactionIndex = message.reactions.indexOf(reaction)
          if (reactionIndex > -1) {
            message.reactions.splice(reactionIndex, 1)
          }
        }
      }
    }

    return message.reactions
  }
}

/**
 * 权限控制器 - 权限管理业务逻辑
 */
class PermissionController {
  constructor(mockData) {
    this.mockData = mockData
    this.initializePermissions()
  }

  initializePermissions() {
    if (!this.mockData.permissions) {
      this.mockData.permissions = [
        {
          id: 1,
          userId: 1,
          channelId: 1,
          role: 'admin',
          restrictions: {
            isMuted: false,
            isKicked: false,
            isBanned: false
          }
        }
      ]
    }
  }

  /**
   * 获取用户权限
   */
  getUserPermission(userId, channelId) {
    return this.mockData.permissions.find(p =>
      p.userId === userId && p.channelId === channelId
    ) || {
      userId,
      channelId,
      role: 'guest',
      restrictions: {
        isMuted: false,
        isKicked: false,
        isBanned: false
      }
    }
  }

  /**
   * 检查用户是否有权限
   */
  hasPermission(userId, channelId, permission) {
    const userPermission = this.getUserPermission(userId, channelId)

    // 检查限制
    if (userPermission.restrictions.isMuted ||
        userPermission.restrictions.isBanned ||
        userPermission.restrictions.isKicked) {
      return false
    }

    // 定义角色权限映射
    const rolePermissions = {
      admin: ['send_message', 'edit_message', 'delete_message', 'manage_members', 'edit_channel'],
      moderator: ['send_message', 'edit_message', 'delete_message', 'manage_members'],
      member: ['send_message', 'edit_message', 'delete_message'],
      guest: []
    }

    const permissions = rolePermissions[userPermission.role] || []
    return permissions.includes(permission)
  }

  /**
   * 设置用户角色
   */
  setUserRole(userId, channelId, role) {
    let permission = this.getUserPermission(userId, channelId)

    if (!permission.id) {
      permission = {
        id: Date.now(),
        userId,
        channelId,
        role,
        restrictions: {
          isMuted: false,
          isKicked: false,
          isBanned: false
        }
      }
      this.mockData.permissions.push(permission)
    } else {
      permission.role = role
    }

    return permission
  }

  /**
   * 禁言用户
   */
  muteUser(userId, channelId, duration = null) {
    let permission = this.getUserPermission(userId, channelId)

    if (!permission.id) {
      permission = {
        id: Date.now(),
        userId,
        channelId,
        role: 'member',
        restrictions: {
          isMuted: true,
          muteUntil: duration ? new Date(Date.now() + duration * 1000) : null,
          isKicked: false,
          isBanned: false
        }
      }
      this.mockData.permissions.push(permission)
    } else {
      permission.restrictions.isMuted = true
      permission.restrictions.muteUntil = duration ? new Date(Date.now() + duration * 1000) : null
    }

    return permission
  }

  /**
   * 踢出用户
   */
  kickUser(userId, channelId) {
    let permission = this.getUserPermission(userId, channelId)

    if (!permission.id) {
      permission = {
        id: Date.now(),
        userId,
        channelId,
        role: 'guest',
        restrictions: {
          isMuted: false,
          isKicked: true,
          isBanned: false
        }
      }
      this.mockData.permissions.push(permission)
    } else {
      permission.restrictions.isKicked = true
    }

    return permission
  }

  /**
   * 封禁用户
   */
  banUser(userId, channelId, duration = null) {
    let permission = this.getUserPermission(userId, channelId)

    if (!permission.id) {
      permission = {
        id: Date.now(),
        userId,
        channelId,
        role: 'guest',
        restrictions: {
          isMuted: false,
          isKicked: false,
          isBanned: true,
          bannedUntil: duration ? new Date(Date.now() + duration * 1000) : null
        }
      }
      this.mockData.permissions.push(permission)
    } else {
      permission.restrictions.isBanned = true
      permission.restrictions.bannedUntil = duration ? new Date(Date.now() + duration * 1000) : null
    }

    return permission
  }

  /**
   * 解除限制
   */
  removeRestriction(userId, channelId, restrictionType) {
    let permission = this.getUserPermission(userId, channelId)

    if (!permission.id) {
      return null
    }

    switch (restrictionType) {
      case 'mute':
        permission.restrictions.isMuted = false
        permission.restrictions.muteUntil = null
        break
      case 'kick':
        permission.restrictions.isKicked = false
        break
      case 'ban':
        permission.restrictions.isBanned = false
        permission.restrictions.bannedUntil = null
        break
    }

    return permission
  }
}

/**
 * 用户控制器 - 用户管理业务逻辑
 */
class UserController {
  constructor(mockData) {
    this.mockData = mockData
  }

  /**
   * 获取用户信息
   */
  getUser(userId) {
    const user = this.mockData.users?.find(u => u.id === parseInt(userId))

    if (!user) {
      return {
        id: parseInt(userId),
        username: `user_${userId}`,
        realName: `User ${userId}`,
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        status: 'online',
        bio: ''
      }
    }

    return user
  }

  /**
   * 更新用户状态
   */
  updateUserStatus(userId, status) {
    // WebSocket 会处理状态更新
    return {
      userId,
      status,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * 搜索用户
   */
  searchUsers(query) {
    if (!query || query.length === 0) {
      return []
    }

    const results = []
    for (let i = 1; i <= 10; i++) {
      if (i.toString().includes(query) || `user_${i}`.includes(query)) {
        results.push({
          id: i,
          username: `user_${i}`,
          realName: `User ${i}`,
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        })
      }
    }

    return results
  }
}

/**
 * 加密控制器 - 加密密钥管理
 */
class CryptoController {
  constructor(mockData) {
    this.mockData = mockData
    this.initializeCrypto()
  }

  initializeCrypto() {
    if (!this.mockData.userCryptoKeys) {
      this.mockData.userCryptoKeys = new Map()
    }
  }

  /**
   * 存储用户公钥
   */
  storePublicKey(userId, publicKeyJWK) {
    this.mockData.userCryptoKeys.set(userId, {
      publicKey: publicKeyJWK,
      timestamp: new Date().toISOString(),
      algorithm: 'ECDH-P256',
      format: 'JWK'
    })

    return {
      userId,
      message: 'Public key stored successfully'
    }
  }

  /**
   * 获取用户公钥
   */
  getPublicKey(userId) {
    const keyData = this.mockData.userCryptoKeys.get(userId)

    if (!keyData) {
      return null
    }

    return {
      userId: parseInt(userId),
      publicKey: keyData.publicKey,
      timestamp: keyData.timestamp
    }
  }
}

/**
 * 社区控制器 - 社区相关业务逻辑（帖子、文章、评论）
 */
class CommunityController {
  constructor(mockData) {
    this.mockData = mockData
    this.initializeCommunityData()
  }

  /**
   * 初始化社区数据
   */
  initializeCommunityData() {
    if (!this.mockData.posts) {
      this.mockData.posts = [
        {
          id: 1,
          title: '欢迎来到社区',
          content: '这是一个很好的开始！',
          category: 'general',
          tags: ['欢迎', '入门'],
          authorId: 1,
          authorName: 'user_1',
          createdAt: '2025-11-10T10:00:00Z',
          updatedAt: '2025-11-10T10:00:00Z',
          views: 10,
          likes: 2,
          comments: []
        },
        {
          id: 2,
          title: '学习技术的最佳方式',
          content: '通过实践和不断学习来提高技能',
          category: 'tech',
          tags: ['学习', '技术', '提升'],
          authorId: 2,
          authorName: 'user_2',
          createdAt: '2025-11-11T10:00:00Z',
          updatedAt: '2025-11-11T10:00:00Z',
          views: 25,
          likes: 5,
          comments: []
        },
        {
          id: 15,
          title: '前端面试题解析：Vue 3 Composition API 最佳实践',
          content: `# Vue 3 Composition API 最佳实践

## 什么是 Composition API？

Vue 3 引入的 Composition API 是一种新的方式来编织组件的逻辑。相比 Options API，它提供更好的代码复用性和更灵活的代码组织方式。

## 核心概念

### 1. ref 和 reactive

\`\`\`javascript
import { ref, reactive } from 'vue'

// 基本值使用 ref
const count = ref(0)

// 对象使用 reactive
const state = reactive({
  name: 'John',
  age: 30
})
\`\`\`

### 2. computed 和 watch

\`\`\`javascript
import { computed, watch } from 'vue'

// computed：依赖追踪的计算属性
const fullName = computed(() => {
  return state.firstName + ' ' + state.lastName
})

// watch：侦听响应式数据的变化
watch(() => state.name, (newVal, oldVal) => {
  console.log(\`Name changed from \${oldVal} to \${newVal}\`)
})
\`\`\`

### 3. 生命周期钩子

在 Composition API 中，所有生命周期钩子前缀都是 \`on\`：

\`\`\`javascript
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  console.log('Component mounted')
})

onUnmounted(() => {
  console.log('Component unmounted')
})
\`\`\`

## 最佳实践

### 1. 使用 composables 复用逻辑

\`\`\`javascript
// useCounter.js
import { ref } from 'vue'

export function useCounter() {
  const count = ref(0)

  const increment = () => count.value++
  const decrement = () => count.value--

  return { count, increment, decrement }
}
\`\`\`

### 2. 合理组织代码

- 相关的响应式数据和方法应该放在一起
- 使用 composables 来提高代码复用性
- 保持组件代码简洁易读

### 3. 性能优化

- 使用 \`computed\` 而不是在模板中进行复杂计算
- 使用 \`reactive\` 代替多个 \`ref\` 来管理相关的状态
- 使用 \`shallowRef\` 和 \`shallowReactive\` 来优化大型数据结构

## 常见问题

Q: 何时使用 ref vs reactive？
A: 对于基本数据类型使用 ref，对于复杂对象使用 reactive。

Q: 为什么我的 watch 没有触发？
A: 确保依赖是响应式的，使用 getter 函数或 immediate 选项。

## 总结

Composition API 提供了更强大和灵活的方式来组织组件逻辑。掌握它的核心概念和最佳实践，将大大提高您的开发效率。`,
          category: 'frontend',
          tags: ['Vue', 'Composition API', '最佳实践', '面试题'],
          authorId: 1,
          authorName: 'user_1',
          createdAt: '2025-11-12T10:00:00Z',
          updatedAt: '2025-11-12T10:00:00Z',
          views: 1200,
          likes: 85,
          comments: []
        },
        {
          id: 20,
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

本文介绍了在 Linux 系统中破解常见加密文件的方法。请注意，这些工具仅用于合法用途，如找回自己遗忘的密码。`,
          category: 'linux',
          tags: ['linux', 'pdf', '破解', 'zip', 'rar', 'doc', '密码'],
          authorId: 1,
          authorName: 'user_1',
          createdAt: '2025-11-09T10:00:00Z',
          updatedAt: '2025-11-09T10:00:00Z',
          views: 2400,
          likes: 33,
          comments: []
        }
      ]
      this.mockData.postIdCounter = 21
    }

    if (!this.mockData.articles) {
      this.mockData.articles = [
        {
          id: 1,
          title: 'Vue 3 性能优化的完整指南',
          content: 'Vue 3 性能优化的10个技巧...',
          category: 'performance',
          views: 15200,
          likes: 823,
          createdAt: '2025-11-05T10:00:00Z'
        },
        {
          id: 2,
          title: 'React Hooks 最佳实践',
          content: '2025 年 React Hooks 开发指南...',
          category: 'javascript',
          views: 12800,
          likes: 756,
          createdAt: '2025-11-08T10:00:00Z'
        },
        {
          id: 3,
          title: 'TypeScript 进阶技巧',
          content: 'TypeScript 高级特性介绍...',
          category: 'javascript',
          views: 9800,
          likes: 542,
          createdAt: '2025-11-04T10:00:00Z'
        },
        {
          id: 4,
          title: 'Webpack 5 配置详解',
          content: '现代化的模块打包器配置...',
          category: 'performance',
          views: 7600,
          likes: 432,
          createdAt: '2025-11-03T10:00:00Z'
        },
        {
          id: 5,
          title: 'Node.js 性能优化',
          content: 'Node.js 应用优化最佳实践...',
          category: 'nodejs',
          views: 6500,
          likes: 389,
          createdAt: '2025-11-02T10:00:00Z'
        }
      ]
      this.mockData.articleIdCounter = 6
    }

    if (!this.mockData.comments) {
      this.mockData.comments = []
      this.mockData.commentIdCounter = 1
    }
  }

  /**
   * 获取所有帖子
   */
  getPosts(skip = 0, limit = 20, category = null, search = null) {
    let posts = this.mockData.posts || []

    // 按分类筛选
    if (category) {
      posts = posts.filter(p => p.category === category)
    }

    // 按搜索关键词筛选
    if (search) {
      const searchLower = search.toLowerCase()
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
      )
    }

    // 分页
    const total = posts.length
    posts = posts.slice(skip, skip + limit)

    return {
      posts,
      total,
      skip,
      limit
    }
  }

  /**
   * 创建帖子
   */
  createPost(data) {
    const post = {
      id: this.mockData.postIdCounter || 1,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      comments: []
    }

    if (!this.mockData.posts) {
      this.mockData.posts = []
    }

    this.mockData.posts.push(post)
    this.mockData.postIdCounter = (this.mockData.postIdCounter || 1) + 1

    return post
  }

  /**
   * 获取单个帖子
   */
  getPost(postId) {
    if (!this.mockData.posts) {
      return null
    }

    const post = this.mockData.posts.find(p => p.id === postId)
    if (post) {
      post.views = (post.views || 0) + 1
    }
    return post
  }

  /**
   * 更新帖子
   */
  updatePost(postId, data) {
    if (!this.mockData.posts) {
      return null
    }

    const post = this.mockData.posts.find(p => p.id === postId)
    if (!post) {
      return null
    }

    Object.assign(post, data, {
      updatedAt: new Date().toISOString()
    })

    return post
  }

  /**
   * 删除帖子
   */
  deletePost(postId) {
    if (!this.mockData.posts) {
      return false
    }

    const index = this.mockData.posts.findIndex(p => p.id === postId)
    if (index === -1) {
      return false
    }

    this.mockData.posts.splice(index, 1)
    return true
  }

  /**
   * 获取帖子的相关内容/集合
   */
  getPostCollection(postId) {
    const post = this.getPost(postId)
    if (!post) {
      return null
    }

    return {
      postId,
      post,
      relatedPosts: this.mockData.posts?.filter(p =>
        p.id !== postId && p.category === post.category
      ).slice(0, 3) || [],
      comments: post.comments || [],
      total: (post.comments || []).length
    }
  }

  /**
   * 获取热门文章
   */
  getHotArticles(limit = 5) {
    if (!this.mockData.articles) {
      return []
    }

    return this.mockData.articles
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, limit)
  }

  /**
   * 获取文章归档
   */
  getArticleArchives() {
    if (!this.mockData.articles) {
      return []
    }

    const archives = {}
    this.mockData.articles.forEach(article => {
      const date = new Date(article.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!archives[monthKey]) {
        archives[monthKey] = []
      }
      archives[monthKey].push({
        id: article.id,
        title: article.title,
        date: article.createdAt
      })
    })

    return Object.entries(archives).map(([month, articles]) => ({
      month,
      articles,
      count: articles.length
    }))
  }

  /**
   * 获取所有文章
   */
  getArticles(skip = 0, limit = 20, category = null, search = null) {
    let articles = this.mockData.articles || []

    if (category) {
      articles = articles.filter(a => a.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(searchLower) ||
        a.content.toLowerCase().includes(searchLower)
      )
    }

    const total = articles.length
    articles = articles.slice(skip, skip + limit)

    return {
      articles,
      total,
      skip,
      limit
    }
  }

  /**
   * 获取帖子评论
   */
  getPostComments(postId, skip = 0, limit = 20) {
    const post = this.mockData.posts?.find(p => p.id === postId)
    if (!post) {
      return { comments: [], total: 0 }
    }

    const comments = post.comments || []
    const total = comments.length
    const paginatedComments = comments.slice(skip, skip + limit)

    return {
      comments: paginatedComments,
      total,
      skip,
      limit
    }
  }

  /**
   * 添加评论
   */
  addComment(data) {
    if (!this.mockData.posts) {
      return null
    }

    const post = this.mockData.posts.find(p => p.id === data.postId)
    if (!post) {
      return null
    }

    const comment = {
      id: this.mockData.commentIdCounter || 1,
      ...data,
      createdAt: new Date().toISOString(),
      likes: 0
    }

    if (!post.comments) {
      post.comments = []
    }

    post.comments.push(comment)
    this.mockData.commentIdCounter = (this.mockData.commentIdCounter || 1) + 1

    return comment
  }

  /**
   * 点赞帖子
   */
  likePost(postId, userId) {
    const post = this.getPost(postId)
    if (!post) {
      return null
    }

    if (!post.likedBy) {
      post.likedBy = []
    }

    if (!post.likedBy.includes(userId)) {
      post.likedBy.push(userId)
      post.likes = (post.likes || 0) + 1
    }

    return {
      postId,
      userId,
      likes: post.likes,
      liked: true
    }
  }

  /**
   * 取消点赞
   */
  unlikePost(postId, userId) {
    const post = this.getPost(postId)
    if (!post) {
      return null
    }

    if (!post.likedBy) {
      post.likedBy = []
    }

    const index = post.likedBy.indexOf(userId)
    if (index !== -1) {
      post.likedBy.splice(index, 1)
      post.likes = Math.max(0, (post.likes || 1) - 1)
    }

    return {
      postId,
      userId,
      likes: post.likes,
      liked: false
    }
  }
}

module.exports = {
  ChannelController,
  MessageController,
  PermissionController,
  UserController,
  CryptoController,
  CommunityController
