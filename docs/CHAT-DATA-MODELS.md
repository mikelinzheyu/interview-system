# QQ 风格聊天中心 - 数据模型定义

## 目录
- [核心数据模型](#核心数据模型)
- [消息类型](#消息类型)
- [用户状态](#用户状态)
- [数据库 Schema](#数据库-schema)
- [TypeScript 类型定义](#typescript-类型定义)

---

## 核心数据模型

### 1. 对话 (Conversation)

对话是聊天的基本单位，可以是一对一私聊或群组。

```typescript
interface Conversation {
  // 基本信息
  id: number | string
  name: string
  type: 'private' | 'group' | 'public' // 私聊、群组、公开群
  description?: string
  avatar?: string

  // 成员信息
  memberCount: number
  onlineCount: number
  maxMembers?: number

  // 消息信息
  lastMessage?: Message
  lastMessageAt?: string | Date
  lastMessageBy?: string | number
  messageCount?: number

  // 用户状态
  unreadCount: number // 未读消息数
  pinned: boolean // 是否置顶
  isMuted: boolean // 是否禁言
  isArchived?: boolean // 是否存档

  // 权限信息
  role?: 'admin' | 'member' // 当前用户在群中的角色
  canInvite?: boolean
  canKick?: boolean
  canModify?: boolean

  // 时间戳
  createdAt: string | Date
  updatedAt: string | Date
  lastReadAt?: string | Date

  // 扩展
  tags?: string[]
  metadata?: Record<string, any>
}
```

### 2. 消息 (Message)

消息是聊天中的最小单位。

```typescript
interface Message {
  // 基本信息
  id: string | number
  conversationId: string | number
  content: string
  contentType: MessageContentType // 'text' | 'image' | 'attachment' | ...

  // 发送者信息
  senderId: number
  senderName: string
  senderAvatar?: string
  senderRole?: 'admin' | 'member'

  // 消息状态
  status: MessageStatus // 'pending' | 'delivering' | 'delivered' | 'read' | 'failed'
  deliveredAt?: string | Date
  readAt?: string | Date

  // 撤回信息
  isRecalled?: boolean
  recalledAt?: string | Date
  recallById?: number
  recallByName?: string
  recallReason?: string

  // 编辑信息
  isEdited?: boolean
  editedAt?: string | Date
  editHistory?: EditHistory[]

  // 附件
  attachments?: Attachment[]

  // 引用消息（回复）
  quotedMessage?: {
    id: string | number
    senderName: string
    content: string
    contentType: MessageContentType
    createdAt: string | Date
  }

  // 已读信息
  readBy?: Array<{
    userId: number
    readAt: string | Date
  }>

  // 时间戳
  createdAt: string | Date

  // 前端计算字段
  isOwn?: boolean // 是否是自己发送的
  localOnly?: boolean // 是否仅本地存在
  error?: any // 发送失败的错误信息

  // 扩展
  metadata?: Record<string, any>
}

type MessageStatus = 'pending' | 'delivering' | 'delivered' | 'read' | 'failed' | 'recalled'
type MessageContentType = 'text' | 'image' | 'video' | 'audio' | 'attachment' | 'card' | 'system'

interface EditHistory {
  editedAt: string | Date
  editedBy: number
  previousContent: string
}
```

### 3. 附件 (Attachment)

```typescript
interface Attachment {
  // 基本信息
  id: string | number
  name: string
  size: number
  type: string // MIME type

  // URL 信息
  url?: string
  downloadUrl?: string
  previewUrl?: string
  thumbnailUrl?: string

  // 上传状态
  status: 'uploading' | 'uploaded' | 'failed'
  progress?: number // 0-100

  // 元数据
  width?: number // 图片/视频宽度
  height?: number // 图片/视频高度
  duration?: number // 音频/视频时长

  // 时间戳
  uploadedAt?: string | Date

  // 扩展
  metadata?: Record<string, any>
}
```

### 4. 用户状态 (UserStatus)

```typescript
interface UserStatus {
  // 用户信息
  userId: number
  username: string
  nickname: string
  avatar?: string

  // 在线状态
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeenAt?: string | Date
  lastSeenLocation?: {
    ip?: string
    userAgent?: string
  }

  // 自定义状态
  customStatus?: string // 例如："在忙碌中..."
  customStatusEmoji?: string // 例如："🎮"
  customStatusExpiry?: string | Date

  // 设备信息
  devices?: Array<{
    deviceId: string
    platform: 'web' | 'mobile' | 'desktop'
    lastActiveAt: string | Date
    location?: string
  }>

  // 扩展
  metadata?: Record<string, any>
}
```

### 5. 群成员 (GroupMember)

```typescript
interface GroupMember {
  // 用户信息
  userId: number
  username: string
  nickname: string
  avatar?: string

  // 群内角色
  role: 'owner' | 'admin' | 'member'
  title?: string // 自定义头衔

  // 权限
  permissions?: string[]

  // 群内状态
  status: 'active' | 'muted' | 'banned'
  joinedAt: string | Date
  lastSeenAt?: string | Date

  // 消息统计
  messageCount?: number
  lastMessageAt?: string | Date

  // 扩展
  metadata?: Record<string, any>
}
```

### 6. 群设置 (GroupSettings)

```typescript
interface GroupSettings {
  groupId: number

  // 基本设置
  name: string
  description?: string
  avatar?: string

  // 权限设置
  allowMembersInvite: boolean // 成员是否可以邀请
  allowMembersModifyName: boolean // 成员是否可以改名
  allowMembersUploadFiles: boolean

  // 消息设置
  messageRetentionDays?: number // 消息保留天数
  allowMembersDeleteMessages?: boolean
  editableTimeLimit?: number // 消息可编辑的时间限制（秒）
  recallTimeLimit?: number // 消息可撤回的时间限制（秒）

  // 禁言设置
  muteAllMembers: boolean
  mutedMemberIds?: number[]

  // 其他
  isArchived: boolean
  createdAt: string | Date
  updatedAt: string | Date
}
```

---

## 消息类型

### 文本消息
```typescript
interface TextMessage extends Message {
  contentType: 'text'
  content: string // 支持 Markdown
}
```

### 图片消息
```typescript
interface ImageMessage extends Message {
  contentType: 'image'
  content?: string // 图片描述
  attachments: [
    {
      type: 'image/jpeg' | 'image/png' | 'image/gif'
      url: string
      previewUrl: string
      width: number
      height: number
      size: number
    }
  ]
}
```

### 文件消息
```typescript
interface FileMessage extends Message {
  contentType: 'attachment'
  content?: string // 文件说明
  attachments: [
    {
      name: string
      type: string // MIME type
      size: number
      url: string
      downloadUrl: string
    }
  ]
}
```

### 语音消息
```typescript
interface VoiceMessage extends Message {
  contentType: 'audio'
  attachments: [
    {
      type: 'audio/mpeg' | 'audio/wav'
      url: string
      duration: number
      size: number
    }
  ]
}
```

### 系统消息
```typescript
interface SystemMessage extends Message {
  contentType: 'system'
  content: string // 例如："张三加入了群聊"
  eventType: 'user-joined' | 'user-left' | 'user-kicked' | 'group-created' | ...
}
```

### 卡片消息
```typescript
interface CardMessage extends Message {
  contentType: 'card'
  card: {
    type: 'link' | 'product' | 'news'
    title: string
    description?: string
    image?: string
    url: string
    action?: string // 按钮文本
  }
}
```

---

## 用户状态

### 在线状态类型
```typescript
type OnlineStatus = 'online' | 'away' | 'busy' | 'offline'

const StatusConfig = {
  online: {
    label: '在线',
    icon: '🟢',
    color: '#67c23a'
  },
  away: {
    label: '离开',
    icon: '🟡',
    color: '#e6a23c'
  },
  busy: {
    label: '忙碌',
    icon: '🔴',
    color: '#f56c6c'
  },
  offline: {
    label: '离线',
    icon: '⚫',
    color: '#909399'
  }
}
```

---

## 数据库 Schema

### 使用 TypeORM/Sequelize

#### 对话表 (conversations)
```typescript
@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'enum', enum: ['private', 'group', 'public'] })
  type: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', nullable: true })
  avatar: string

  @Column({ type: 'int', default: 0 })
  memberCount: number

  @Column({ type: 'int', default: 0 })
  onlineCount: number

  @Column({ type: 'int', nullable: true })
  maxMembers: number

  @Column({ type: 'int', default: 0 })
  messageCount: number

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date

  @Column({ type: 'boolean', default: false })
  isArchived: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => MessageEntity, (msg) => msg.conversation)
  messages: MessageEntity[]

  @OneToMany(() => GroupMemberEntity, (member) => member.conversation)
  members: GroupMemberEntity[]
}
```

#### 消息表 (messages)
```typescript
@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  conversationId: number

  @Column({ type: 'longtext' })
  content: string

  @Column({ type: 'varchar', length: 50, default: 'text' })
  contentType: string

  @Column()
  senderId: number

  @Column({ type: 'varchar', length: 255 })
  senderName: string

  @Column({ type: 'varchar', nullable: true })
  senderAvatar: string

  @Column({
    type: 'enum',
    enum: ['pending', 'delivered', 'read', 'failed', 'recalled'],
    default: 'delivered'
  })
  status: string

  @Column({ type: 'boolean', default: false })
  isRecalled: boolean

  @Column({ type: 'timestamp', nullable: true })
  recalledAt: Date

  @Column({ type: 'int', nullable: true })
  recallById: number

  @Column({ type: 'boolean', default: false })
  isEdited: boolean

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date

  @Column({ type: 'int', nullable: true })
  quotedMessageId: number

  @Column({ type: 'json', nullable: true })
  attachments: any[]

  @Column({ type: 'json', nullable: true })
  metadata: any

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => ConversationEntity, (conv) => conv.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: ConversationEntity

  @ManyToOne(() => MessageEntity)
  @JoinColumn({ name: 'quotedMessageId' })
  quotedMessage: MessageEntity
}
```

#### 群成员表 (group_members)
```typescript
@Entity('group_members')
export class GroupMemberEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  conversationId: number

  @Column()
  userId: number

  @Column({ type: 'enum', enum: ['owner', 'admin', 'member'], default: 'member' })
  role: string

  @Column({ type: 'varchar', nullable: true })
  title: string

  @Column({ type: 'enum', enum: ['active', 'muted', 'banned'], default: 'active' })
  status: string

  @CreateDateColumn()
  joinedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date

  @ManyToOne(() => ConversationEntity, (conv) => conv.members)
  @JoinColumn({ name: 'conversationId' })
  conversation: ConversationEntity
}
```

#### 用户状态表 (user_statuses)
```typescript
@Entity('user_statuses')
export class UserStatusEntity {
  @PrimaryColumn()
  userId: number

  @Column({
    type: 'enum',
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  })
  status: string

  @Column({ type: 'varchar', nullable: true })
  customStatus: string

  @Column({ type: 'varchar', nullable: true })
  customStatusEmoji: string

  @Column({ type: 'timestamp', nullable: true })
  customStatusExpiry: Date

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date

  @Column({ type: 'json', nullable: true })
  devices: any[]

  @UpdateDateColumn()
  updatedAt: Date
}
```

---

## TypeScript 类型定义

创建文件 `frontend/src/types/chat.ts`:

```typescript
/**
 * 对话相关类型定义
 */

// ============ 基础类型 ============

export type MessageStatus = 'pending' | 'delivering' | 'delivered' | 'read' | 'failed' | 'recalled'
export type MessageContentType = 'text' | 'image' | 'video' | 'audio' | 'attachment' | 'card' | 'system'
export type ConversationType = 'private' | 'group' | 'public'
export type UserStatus = 'online' | 'away' | 'busy' | 'offline'
export type UserRole = 'owner' | 'admin' | 'member'

// ============ 数据模型 ============

export interface Conversation {
  id: number | string
  name: string
  type: ConversationType
  description?: string
  avatar?: string
  memberCount: number
  onlineCount: number
  maxMembers?: number
  lastMessage?: Message
  lastMessageAt?: string | Date
  unreadCount: number
  pinned: boolean
  isMuted: boolean
  isArchived?: boolean
  role?: UserRole
  canInvite?: boolean
  canKick?: boolean
  canModify?: boolean
  createdAt: string | Date
  updatedAt: string | Date
  lastReadAt?: string | Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface Message {
  id: string | number
  conversationId: string | number
  content: string
  contentType: MessageContentType
  senderId: number
  senderName: string
  senderAvatar?: string
  senderRole?: UserRole
  status: MessageStatus
  deliveredAt?: string | Date
  readAt?: string | Date
  isRecalled?: boolean
  recalledAt?: string | Date
  recallById?: number
  recallByName?: string
  isEdited?: boolean
  editedAt?: string | Date
  editHistory?: EditHistory[]
  attachments?: Attachment[]
  quotedMessage?: Partial<Message>
  readBy?: Array<{
    userId: number
    readAt: string | Date
  }>
  createdAt: string | Date
  isOwn?: boolean
  localOnly?: boolean
  error?: any
  metadata?: Record<string, any>
}

export interface Attachment {
  id: string | number
  name: string
  size: number
  type: string
  url?: string
  downloadUrl?: string
  previewUrl?: string
  thumbnailUrl?: string
  status: 'uploading' | 'uploaded' | 'failed'
  progress?: number
  width?: number
  height?: number
  duration?: number
  uploadedAt?: string | Date
  metadata?: Record<string, any>
}

export interface UserStatusInfo {
  userId: number
  username: string
  nickname: string
  avatar?: string
  status: UserStatus
  lastSeenAt?: string | Date
  customStatus?: string
  customStatusEmoji?: string
  customStatusExpiry?: string | Date
  devices?: DeviceInfo[]
  metadata?: Record<string, any>
}

export interface DeviceInfo {
  deviceId: string
  platform: 'web' | 'mobile' | 'desktop'
  lastActiveAt: string | Date
  location?: string
}

export interface GroupMember {
  userId: number
  username: string
  nickname: string
  avatar?: string
  role: UserRole
  title?: string
  permissions?: string[]
  status: 'active' | 'muted' | 'banned'
  joinedAt: string | Date
  lastSeenAt?: string | Date
  messageCount?: number
  lastMessageAt?: string | Date
  metadata?: Record<string, any>
}

export interface GroupSettings {
  groupId: number
  name: string
  description?: string
  avatar?: string
  allowMembersInvite: boolean
  allowMembersModifyName: boolean
  allowMembersUploadFiles: boolean
  messageRetentionDays?: number
  allowMembersDeleteMessages?: boolean
  editableTimeLimit?: number
  recallTimeLimit?: number
  muteAllMembers: boolean
  mutedMemberIds?: number[]
  isArchived: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export interface EditHistory {
  editedAt: string | Date
  editedBy: number
  previousContent: string
}

// ============ 请求/响应类型 ============

export interface SendMessagePayload {
  content: string
  contentType?: MessageContentType
  attachments?: Attachment[]
  quotedMessageId?: string | number
}

export interface UpdateMessagePayload {
  content: string
  attachments?: Attachment[]
}

export interface RecallMessagePayload {
  messageId: string | number
  reason?: string
}

export interface SearchMessagesParams {
  keyword: string
  conversationId?: string | number
  senderId?: number
  startDate?: Date
  endDate?: Date
  limit?: number
}

export interface PaginationParams {
  page: number
  size: number
}

// ============ 事件类型 ============

export interface ChatEvent {
  type: string
  payload: any
}

export interface MessageEvent extends ChatEvent {
  type: 'message-received' | 'message-sent' | 'message-updated' | 'message-deleted'
  payload: Message
}

export interface UserStatusEvent extends ChatEvent {
  type: 'user-online' | 'user-offline' | 'user-status-changed'
  payload: {
    userId: number
    status: UserStatus
    customStatus?: string
  }
}

export interface TypingEvent extends ChatEvent {
  type: 'user-typing'
  payload: {
    conversationId: string | number
    userId: number
    username: string
    isTyping: boolean
  }
}

// ============ API 响应类型 ============

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  hasMore: boolean
}
```

---

## 总结

这个数据模型定义包括：

1. **完整的消息系统**：支持文本、图片、文件、语音等多种类型
2. **灵活的用户状态**：支持多种在线状态和自定义状态
3. **权限管理**：支持群主、管理员、成员等不同角色
4. **消息操作**：支持编辑、撤回、引用等操作
5. **附件系统**：支持文件上传、下载、预览等功能

这些模型设计与 QQ、微信等实时通信平台保持一致，便于后续扩展和维护。
