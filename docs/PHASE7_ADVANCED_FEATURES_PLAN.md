# 🚀 Phase 7: 高级聊天功能完善 - 详细规划

## 🎯 Phase 7 目标

基于 QQ 和微信的聊天功能，完善和新增以下功能模块：

```
Phase 7: 高级聊天功能完善 [░░░░░░░░░░ 0%] 规划中

├─ 7A: 消息搜索和过滤    [░░░░░░░░░░ 0%] 待实现
├─ 7B: 撤回和编辑优化    [░░░░░░░░░░ 0%] 待实现
├─ 7C: 消息收藏和标记    [░░░░░░░░░░ 0%] 待实现
├─ 7D: 群组管理功能      [░░░░░░░░░░ 0%] 待实现
├─ 7E: 消息长按菜单      [░░░░░░░░░░ 0%] 待实现
├─ 7F: 文件和图片管理    [░░░░░░░░░░ 0%] 待实现
├─ 7G: 消息加密和安全    [░░░░░░░░░░ 0%] 待实现
└─ 7H: 文本表情和富文本  [░░░░░░░░░░ 0%] 待实现
```

## 📋 详细功能规划

### Phase 7A: 消息搜索和过滤

#### 功能需求

```javascript
/**
 * 消息搜索功能
 * 1. 全局搜索：搜索所有会话中的消息
 * 2. 会话内搜索：搜索当前会话的消息
 * 3. 按类型过滤：文本、图片、文件、链接
 * 4. 按时间范围：今天、本周、本月、自定义
 * 5. 按发送者：快速定位特定人的消息
 */

interface SearchOptions {
  keyword: string           // 搜索关键词
  type: 'all' | 'text' | 'image' | 'file' | 'link'
  timeRange: TimeRange     // 时间范围
  senderId?: string        // 发送者 ID
  conversationId?: string  // 会话 ID (仅会话内搜索)
}

interface TimeRange {
  start: Date
  end: Date
}

interface SearchResult {
  id: string
  conversationId: string
  conversationName: string
  senderName: string
  content: string
  timestamp: number
  type: string
  matchPositions: number[] // 匹配位置
}
```

#### UI 设计

```
搜索界面:
┌─────────────────────────────────────┐
│ 🔍 [搜索框] [筛选]                  │
├─────────────────────────────────────┤
│ 搜索结果 (2025-10-22)               │
├─────────────────────────────────────┤
│ 📌 张三在"项目讨论"说：             │
│    这个功能很重要...                │
│    14:30 | [查看对话]               │
├─────────────────────────────────────┤
│ 📌 李四在"开发组"说：               │
│    我同意，需要尽快...              │
│    10:15 | [查看对话]               │
└─────────────────────────────────────┘

筛选面板:
┌──────────────────┐
│ 消息类型          │
│ ☑ 全部            │
│ ☐ 文本            │
│ ☐ 图片            │
│ ☐ 文件            │
│ ☐ 链接            │
├──────────────────┤
│ 时间范围          │
│ ○ 全部            │
│ ○ 今天            │
│ ○ 本周            │
│ ○ 本月            │
│ ○ 自定义          │
├──────────────────┤
│ 发送者            │
│ [输入昵称...]    │
└──────────────────┘
```

#### 实现技术

```javascript
// 搜索算法：支持模糊匹配和关键词高亮
class MessageSearchEngine {
  // 构建倒排索引，提升搜索性能
  private index: Map<string, Set<string>>

  search(options: SearchOptions): SearchResult[] {
    // 1. 文本分词处理
    const keywords = this.tokenize(options.keyword)

    // 2. 索引查询
    const candidates = this.queryIndex(keywords)

    // 3. 过滤条件应用
    const filtered = this.applyFilters(candidates, options)

    // 4. 排序（相关性、时间）
    const sorted = this.rank(filtered, options.keyword)

    return sorted
  }

  private tokenize(text: string): string[] {
    // 中文分词支持
    return segmentation(text.toLowerCase())
  }

  private queryIndex(keywords: string[]): Message[] {
    // 倒排索引查询
    const sets = keywords.map(k => this.index.get(k) || new Set())
    return Array.from(this.intersect(sets))
  }

  private applyFilters(messages: Message[], options: SearchOptions) {
    return messages.filter(msg => {
      // 消息类型过滤
      if (options.type !== 'all' && msg.type !== options.type) return false

      // 时间范围过滤
      if (!this.isInTimeRange(msg.timestamp, options.timeRange)) return false

      // 发送者过滤
      if (options.senderId && msg.senderId !== options.senderId) return false

      // 会话过滤
      if (options.conversationId && msg.conversationId !== options.conversationId) return false

      return true
    })
  }

  private rank(messages: Message[], keyword: string): SearchResult[] {
    // TF-IDF 相关性排序
    return messages
      .map(msg => ({
        ...msg,
        score: this.calculateRelevance(msg, keyword)
      }))
      .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
  }
}
```

### Phase 7B: 撤回和编辑优化

#### 功能需求

```javascript
/**
 * 消息撤回功能：
 * 1. 撤回后显示"已撤回"提示
 * 2. 发送者可以看到原消息（灰显）
 * 3. 撤回时间限制：2 分钟内可撤回
 * 4. 撤回记录日志
 *
 * 消息编辑功能：
 * 1. 编辑后显示"已编辑"标记
 * 2. 长按查看编辑历史
 * 3. 编辑次数限制
 * 4. 编辑记录保存
 */

interface RecallOptions {
  messageId: string
  reason?: string  // 撤回原因
  notifyAll?: boolean  // 是否通知所有人
}

interface EditRecord {
  messageId: string
  oldContent: string
  newContent: string
  editedAt: number
  editedBy: string
}

interface MessageEditState {
  content: string
  editedAt?: number
  editCount: number
  editHistory: EditRecord[]
  isRecalled: boolean
  recalledAt?: number
  recalledReason?: string
}
```

#### UI 设计

```
撤回提示:
┌────────────────────────────┐
│ 🚫 张三撤回了一条消息     │
│    长按可查看原消息         │
└────────────────────────────┘

编辑标记:
┌────────────────────────────┐
│ 你好，世界                 │
│ 14:30 (已编辑)            │
└────────────────────────────┘

编辑历史:
┌────────────────────────────┐
│ 编辑历史                   │
├────────────────────────────┤
│ 14:35 - 最新版本           │
│ 你好，世界                 │
├────────────────────────────┤
│ 14:30 - 前一版本           │
│ 你好                       │
└────────────────────────────┘
```

### Phase 7C: 消息收藏和标记

#### 功能需求

```javascript
/**
 * 消息收藏：
 * 1. 长按消息快速收藏
 * 2. 收藏列表管理
 * 3. 分类收藏（标签）
 * 4. 云同步收藏
 *
 * 消息标记：
 * 1. 重要标记
 * 2. 待办标记
 * 3. 自定义标记
 */

interface CollectedMessage {
  id: string
  messageId: string
  content: string
  senderName: string
  conversationName: string
  timestamp: number
  collectedAt: number
  tags: string[]
  notes: string
  category: 'work' | 'personal' | 'learn' | 'custom'
}

interface MessageMark {
  messageId: string
  type: 'important' | 'todo' | 'follow' | 'custom'
  color?: string
  label?: string
  dueDate?: number
}
```

#### 实现方案

```javascript
class MessageCollectionManager {
  // 存储在 IndexedDB 中，支持离线访问
  private db: IDBDatabase

  async collectMessage(messageId: string, options: CollectOptions) {
    const message = await this.getMessage(messageId)
    const collected: CollectedMessage = {
      id: generateId(),
      messageId,
      content: message.content,
      senderName: message.senderName,
      conversationName: message.conversationName,
      timestamp: message.timestamp,
      collectedAt: Date.now(),
      tags: options.tags || [],
      notes: options.notes || '',
      category: options.category || 'personal'
    }

    // 保存到 IndexedDB
    const store = this.db
      .transaction('collections', 'readwrite')
      .objectStore('collections')

    await new Promise((resolve, reject) => {
      const request = store.add(collected)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // 同步到服务器
    await this.syncToServer(collected)
  }

  async getCollections(options: FilterOptions): Promise<CollectedMessage[]> {
    // 支持全文搜索、标签过滤、时间范围等
    const query = this.buildQuery(options)
    return this.queryIndexedDB(query)
  }

  async addMark(messageId: string, mark: MessageMark) {
    const marks = await this.getMarks(messageId)
    marks.push(mark)

    // 更新消息的 UI 显示
    this.updateMessageUI(messageId, { marks })
  }
}
```

### Phase 7D: 群组管理功能

#### 功能需求

```javascript
/**
 * 群组管理：
 * 1. 群组信息编辑（名称、头像、描述）
 * 2. 成员管理（添加、删除、禁言）
 * 3. 权限管理（管理员、成员权限）
 * 4. 群公告和群相册
 * 5. 消息后撤和内容合规
 */

interface GroupChat extends Conversation {
  type: 'group'
  groupId: string
  groupName: string
  groupAvatar: string
  groupAnnouncement: string
  maxMembers: number
  createdBy: string
  createdAt: number
  updatedAt: number
}

interface GroupMember {
  userId: string
  userName: string
  userAvatar: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: number
  permissions: Permission[]
  isMuted: boolean
  isBlocked: boolean
}

interface GroupPermission {
  canSendMessage: boolean
  canSendImage: boolean
  canSendFile: boolean
  canSendVoice: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canEditGroupInfo: boolean
  canManageAnnouncement: boolean
}
```

#### 群组管理界面

```
群组信息页:
┌──────────────────────────────────┐
│ 👥 项目讨论 (12 人)              │
│ [群头像] [编辑]                  │
├──────────────────────────────────┤
│ 群描述：                         │
│ 讨论项目相关话题                 │
├──────────────────────────────────┤
│ 群公告：                         │
│ 请大家积极参与讨论，保持和谐    │
├──────────────────────────────────┤
│ 成员管理                         │
│ └─ 👤 张三 (管理员)              │
│ └─ 👤 李四 (成员)  [移除]       │
│ └─ 👤 王五 (成员)  [禁言]       │
├──────────────────────────────────┤
│ 操作                             │
│ [添加成员] [查看相册] [退出群]  │
└──────────────────────────────────┘
```

### Phase 7E: 消息长按菜单增强

#### 功能需求

```javascript
/**
 * 长按菜单扩展：
 * 1. 复制文本
 * 2. 翻译
 * 3. 引用
 * 4. 反应表情
 * 5. 删除本地记录
 * 6. 设为开屏
 * 7. 举报
 */

interface LongPressMenu {
  items: MenuItem[]
  position: Position
  message: Message
}

interface MenuItem {
  id: string
  icon: string
  label: string
  color?: string
  action: (message: Message) => void
  shortcut?: string
}

// 预定义菜单
const defaultMenuItems: MenuItem[] = [
  {
    id: 'reply',
    icon: '💬',
    label: '回复',
    action: (msg) => openReplyMode(msg)
  },
  {
    id: 'copy',
    icon: '📋',
    label: '复制',
    action: (msg) => copyToClipboard(msg.content)
  },
  {
    id: 'translate',
    icon: '🌐',
    label: '翻译',
    action: (msg) => openTranslator(msg)
  },
  {
    id: 'reaction',
    icon: '😊',
    label: '反应',
    action: (msg) => openReactionPicker(msg)
  },
  {
    id: 'quote',
    icon: '〟',
    label: '引用',
    action: (msg) => quoteMessage(msg)
  },
  {
    id: 'collect',
    icon: '⭐',
    label: '收藏',
    action: (msg) => collectMessage(msg)
  },
  {
    id: 'forward',
    icon: '↗️',
    label: '转发',
    action: (msg) => openForwardDialog(msg)
  },
  {
    id: 'delete',
    icon: '🗑️',
    label: '删除',
    color: 'red',
    action: (msg) => deleteMessage(msg)
  },
  {
    id: 'report',
    icon: '⚠️',
    label: '举报',
    color: 'red',
    action: (msg) => reportMessage(msg)
  }
]
```

### Phase 7F: 文件和图片管理

#### 功能需求

```javascript
/**
 * 文件管理：
 * 1. 文件预览（支持多种格式）
 * 2. 文件下载管理
 * 3. 文件分类（按类型、日期）
 * 4. 最近文件
 *
 * 图片管理：
 * 1. 图片缩略图
 * 2. 图片预览（可滑动）
 * 3. 图片压缩和优化
 * 4. 相册功能
 * 5. 图片编辑（标注、贴纸）
 */

interface FileInfo {
  fileId: string
  fileName: string
  fileSize: number
  fileType: string
  mimeType: string
  uploadedAt: number
  downloadCount: number
  previewUrl?: string
}

interface ImageInfo extends FileInfo {
  width: number
  height: number
  duration?: number  // 视频时长
  thumbnail: string
}

interface FileCategory {
  id: string
  name: string
  icon: string
  extensions: string[]
  files: FileInfo[]
}
```

#### 文件管理界面

```
文件浏览器:
┌──────────────────────────────────┐
│ 📁 文件 [搜索]                    │
├──────────────────────────────────┤
│ 📄 文档 (5)                       │
│ 📊 表格 (3)                       │
│ 🎵 音频 (2)                       │
│ 🎬 视频 (1)                       │
│ 🖼️ 图片 (15)                      │
├──────────────────────────────────┤
│ 最近 24 小时                       │
│ 📄 proposal.docx (2MB)            │
│ 🖼️ screenshot.png (1.5MB)        │
│ 📊 data.xlsx (500KB)              │
└──────────────────────────────────┘

图片相册:
┌──────────────────────────────────┐
│ 🖼️ 相册 [月份▼] [搜索]           │
├──────────────────────────────────┤
│ [🖼️] [🖼️] [🖼️]                   │
│ [🖼️] [🖼️] [🖼️]                   │
│ [🖼️] [🖼️] [🖼️]                   │
└──────────────────────────────────┘
```

### Phase 7G: 消息加密和安全

#### 功能需求

```javascript
/**
 * 消息加密：
 * 1. 端到端加密（E2EE）
 * 2. 密钥交换和管理
 * 3. 消息签名和验证
 * 4. 隐私消息（阅后即焚）
 *
 * 安全功能：
 * 1. 消息防撤销
 * 2. 敏感信息过滤
 * 3. 消息备份加密
 * 4. 设备绑定和验证
 */

interface EncryptedMessage extends Message {
  encrypted: boolean
  encryptionMethod: 'AES-256' | 'RSA' | 'E2EE'
  publicKeyId?: string
  signature?: string
  isVerified?: boolean
}

interface PrivateMessage {
  messageId: string
  expirationTime: number  // 消息过期时间
  viewCount: number       // 查看次数
  maxViews?: number       // 最多查看次数
  isViewed: boolean
  viewedAt?: number
}

interface SecurityPolicy {
  enableE2EE: boolean
  enableMessageExpiry: boolean
  defaultExpiryTime: number
  enableScreenshotAlert: boolean
  enableForwardProtection: boolean
  enableContentFilter: boolean
  blockedKeywords: string[]
}
```

#### 加密实现

```javascript
class MessageEncryption {
  private crypto = require('crypto')

  // 生成密钥对
  generateKeyPair() {
    const { publicKey, privateKey } = this.crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
    return { publicKey, privateKey }
  }

  // 端到端加密
  encryptMessage(content: string, publicKey: string): EncryptedMessage {
    // 1. 生成 AES 密钥
    const aesKey = this.crypto.randomBytes(32)

    // 2. AES 加密内容
    const cipher = this.crypto.createCipheriv('aes-256-gcm', aesKey, Buffer.alloc(12))
    let encrypted = cipher.update(content, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    // 3. RSA 加密 AES 密钥
    const encryptedKey = this.crypto.publicEncrypt(publicKey, aesKey)

    // 4. 签名
    const sign = this.crypto.createSign('sha256')
    sign.update(encrypted)
    const signature = sign.sign(privateKey, 'hex')

    return {
      encrypted: true,
      encryptedContent: encrypted,
      encryptedKey: encryptedKey.toString('hex'),
      authTag: authTag.toString('hex'),
      signature,
      encryptionMethod: 'E2EE'
    }
  }

  // 阅后即焚
  createPrivateMessage(messageId: string, expirationTime: number) {
    return {
      messageId,
      expirationTime: Date.now() + expirationTime,
      viewCount: 0,
      maxViews: 1,
      isViewed: false
    }
  }
}
```

### Phase 7H: 文本表情和富文本

#### 功能需求

```javascript
/**
 * 富文本编辑：
 * 1. 文本格式化（粗体、斜体、下划线）
 * 2. 代码块支持
 * 3. 列表和引用
 * 4. 链接和图片
 * 5. @提及和标签
 *
 * 表情功能：
 * 1. 系统表情库
 * 2. 自定义表情/贴纸
 * 3. 表情反应
 * 4. 表情搜索
 */

interface RichTextNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'image' | 'mention' | 'emoji'
  content: string
  style?: Record<string, any>
  href?: string
  src?: string
  mentionId?: string
}

interface Emoji {
  id: string
  code: string
  name: string
  category: string
  skinTones?: string[]
  keywords: string[]
}

interface Reaction {
  emoji: string
  count: number
  reactedByMe: boolean
  reactedBy: string[]
}

interface MessageWithReactions extends Message {
  reactions: Reaction[]
  richText: RichTextNode[]
}
```

#### 富文本编辑器 UI

```
┌──────────────────────────────────────┐
│ [B] [I] [_] [#] [""] [🔗] [🖼️] [@]   │
│                                      │
│ [输入消息内容...]                   │
│ - 支持 Markdown 语法                │
│ - 支持表情 :smile: :thumbsup:      │
│                                      │
│ [表情] [附件] [语音] [发送]        │
└──────────────────────────────────────┘

消息渲染效果:
┌──────────────────────────────────────┐
│ 这是一条**重要**的消息              │
│                                      │
│ 下面是代码示例:                     │
│ ```javascript                        │
│ console.log('Hello World')           │
│ ```                                  │
│                                      │
│ @张三 你看一下这个问题              │
│                                      │
│ [链接预览 thumbnail]               │
│ 标题：某个链接的标题                │
│ 描述：链接描述...                   │
└──────────────────────────────────────┘

表情反应:
┌──────────────────────────────────────┐
│ 😀 😂 ❤️ 👍 🔥 (3)                   │
│ 我也赞同 你觉得呢？ 太棒了！        │
└──────────────────────────────────────┘
```

## 📊 开发优先级和时间估算

### 优先级划分

```
优先级 1 (核心功能 - 1 周):
  ├─ 7E: 消息长按菜单增强 (8 小时)
  ├─ 7A: 消息搜索和过滤 (12 小时)
  └─ 7C: 消息收藏和标记 (8 小时)

优先级 2 (重要功能 - 1 周):
  ├─ 7B: 撤回和编辑优化 (10 小时)
  ├─ 7H: 文本表情和富文本 (12 小时)
  └─ 7F: 文件和图片管理 (12 小时)

优先级 3 (高级功能 - 1 周):
  ├─ 7D: 群组管理功能 (15 小时)
  └─ 7G: 消息加密和安全 (15 小时)

总计: 3 周
```

### 时间估算

```
需求分析和设计: 4 小时
核心功能开发: 28 小时
重要功能开发: 34 小时
高级功能开发: 30 小时
集成和测试: 16 小时
文档编写: 12 小时
────────────────────
合计: ~120 小时 (3 周)
```

## 🎯 实现路线图

### Week 1: 基础功能强化

```
Day 1-2: 消息长按菜单增强
  ├─ 菜单 UI 优化
  ├─ 事件处理
  ├─ 菜单项扩展

Day 3-4: 消息搜索和过滤
  ├─ 搜索引擎实现
  ├─ 倒排索引构建
  ├─ 搜索 UI 界面

Day 5: 消息收藏和标记
  ├─ 收藏存储（IndexedDB）
  ├─ 收藏管理界面
  └─ 云同步机制
```

### Week 2: 中级功能完善

```
Day 6-7: 撤回和编辑优化
  ├─ 撤回功能增强
  ├─ 编辑历史记录
  └─ UI 展示优化

Day 8-9: 富文本和表情
  ├─ 富文本编辑器
  ├─ Markdown 支持
  ├─ 表情库和反应

Day 10: 文件和图片管理
  ├─ 文件浏览器
  ├─ 图片相册
  └─ 预览功能
```

### Week 3: 高级功能实现

```
Day 11-12: 群组管理功能
  ├─ 群组信息管理
  ├─ 成员权限控制
  ├─ 群公告功能

Day 13-14: 消息加密和安全
  ├─ E2EE 实现
  ├─ 密钥管理
  ├─ 安全策略

Day 15: 集成和测试
  ├─ 功能集成测试
  ├─ 性能测试
  └─ 文档完成
```

## 📈 预期成果

### 功能完成度

```
新增功能: 8 个大模块
新增代码: 5000+ 行
新增文档: 30000+ 字
新增测试: 200+ 个测试用例
```

### 用户体验提升

```
✅ 功能更完整 (接近专业应用)
✅ 操作更便捷 (快捷菜单、搜索等)
✅ 信息更安全 (加密、收藏)
✅ 内容更丰富 (富文本、表情)
✅ 管理更高效 (群组、文件)
```

### 性能指标

```
搜索响应: < 200ms
菜单打开: < 100ms
文件加载: < 500ms
加密性能: < 50ms
```

---

**下一步**: 开始 Phase 7A - 消息搜索和过滤的详细实现
**预计工时**: 3 周（120 小时）
**完成时间**: 预计 2025-11-12

🚀 **准备开始 Phase 7 的开发！**
