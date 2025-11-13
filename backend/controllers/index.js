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

module.exports = {
  ChannelController,
  MessageController,
  PermissionController,
  UserController,
  CryptoController
}
