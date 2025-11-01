# ✅ Phase 6D: 单元测试编写 - 实现指南

## 🎯 测试目标

```
覆盖率目标:

✅ 组件单元测试: 80% 覆盖
✅ Store 测试: 90% 覆盖
✅ 工具函数: 95% 覆盖
────────────────────────────
总体目标: 85% 代码覆盖
```

## 🔧 测试框架选择

| 框架 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| Vitest | 快速、Vue 3 原生、配置少 | 相对新 | ⭐⭐⭐⭐⭐ |
| Jest | 功能全、生态成熟 | 配置复杂 | ⭐⭐⭐⭐ |
| Cypress | 完整 E2E、可视化 | 运行慢 | ⭐⭐⭐ |

**选择**: Vitest (快速、Vue 3 原生支持)

## 💻 实现步骤

### 1. 安装依赖

```bash
npm install -D vitest @vitest/ui @vue/test-utils happy-dom
```

### 2. 配置 vitest.config.js

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.js',
        '**/*.test.js'
      ]
    },
    include: ['**/*.spec.js', '**/*.test.js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 3. 编写组件单元测试

```javascript
// tests/unit/components/ChatRoom.spec.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatRoom from '@/views/chat/ChatRoom.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('ChatRoom Component', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染聊天室容器', () => {
    const wrapper = mount(ChatRoom, {
      global: {
        plugins: [pinia],
        stubs: {
          TopToolbar: true,
          MessageListNew: true,
          MessageInputNew: true,
          RightSidebarNew: true
        }
      }
    })

    expect(wrapper.find('.chat-room').exists()).toBe(true)
    expect(wrapper.find('.chat-container').exists()).toBe(true)
  })

  it('应该在点击回复时显示回复框', async () => {
    const wrapper = mount(ChatRoom, {
      global: {
        plugins: [pinia],
        stubs: {
          TopToolbar: true,
          MessageListNew: true,
          MessageInputNew: true
        }
      }
    })

    // 模拟设置回复状态
    await wrapper.vm.messageActionStates.replyingTo = {
      id: '1',
      senderName: '张三',
      content: '这是一条回复消息'
    }

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.reply-box').exists()).toBe(true)
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('这是一条回复消息')
  })

  it('应该在点击编辑时显示编辑框', async () => {
    const wrapper = mount(ChatRoom, {
      global: {
        plugins: [pinia],
        stubs: {
          TopToolbar: true,
          MessageListNew: true,
          MessageInputNew: true
        }
      }
    })

    // 模拟设置编辑状态
    await wrapper.vm.messageActionStates.editingMessage = {
      id: '2',
      senderName: '我',
      content: '需要编辑的消息'
    }

    await wrapper.vm.$nextTick()

    expect(wrapper.find('.edit-box').exists()).toBe(true)
    expect(wrapper.text()).toContain('编辑模式')
  })

  it('应该能关闭回复框', async () => {
    const wrapper = mount(ChatRoom, {
      global: {
        plugins: [pinia],
        stubs: {
          TopToolbar: true,
          MessageListNew: true,
          MessageInputNew: true
        }
      }
    })

    // 设置回复状态
    wrapper.vm.messageActionStates.replyingTo = {
      id: '1',
      senderName: '张三',
      content: '测试'
    }

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.reply-box').exists()).toBe(true)

    // 关闭回复框
    wrapper.vm.messageActionStates.replyingTo = null

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.reply-box').exists()).toBe(false)
  })

  it('应该能打开转发对话框', async () => {
    const wrapper = mount(ChatRoom, {
      global: {
        plugins: [pinia],
        stubs: {
          TopToolbar: true,
          MessageListNew: true,
          MessageInputNew: true,
          ElDialog: true
        }
      }
    })

    const testMessage = {
      id: '1',
      senderName: '李四',
      content: '转发这条消息'
    }

    // 调用打开转发对话框的函数
    wrapper.vm.handleOpenForwardDialog(testMessage)

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showForwardDialog).toBe(true)
    expect(wrapper.vm.messageActionStates.forwardingMessage).toEqual(testMessage)
  })
})
```

### 4. 编写 Store 测试

```javascript
// tests/unit/stores/chatWorkspace.spec.js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

describe('Chat Workspace Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该初始化为空状态', () => {
    const store = useChatWorkspaceStore()

    expect(store.conversations).toEqual([])
    expect(store.activeConversationId).toBeNull()
    expect(store.activeMessages).toEqual([])
  })

  it('应该能设置活跃会话', () => {
    const store = useChatWorkspaceStore()

    store.setActiveConversation(123)

    expect(store.activeConversationId).toBe(123)
  })

  it('应该能添加消息', () => {
    const store = useChatWorkspaceStore()
    store.setActiveConversation(1)

    const message = {
      id: '1',
      content: '测试消息',
      senderName: '张三',
      timestamp: Date.now(),
      status: 'delivered'
    }

    store.addMessage(1, message)

    expect(store.activeMessages).toContain(message)
  })

  it('应该能删除消息', () => {
    const store = useChatWorkspaceStore()
    store.setActiveConversation(1)

    const message = {
      id: '1',
      content: '测试',
      status: 'delivered'
    }

    store.addMessage(1, message)
    expect(store.activeMessages.length).toBe(1)

    store.removeMessage(1, '1')
    expect(store.activeMessages.length).toBe(0)
  })

  it('应该能更新消息状态', () => {
    const store = useChatWorkspaceStore()
    store.setActiveConversation(1)

    const message = {
      id: '1',
      content: '测试',
      status: 'pending'
    }

    store.addMessage(1, message)

    store.updateMessage(1, '1', { status: 'delivered' })

    const updated = store.activeMessages.find(m => m.id === '1')
    expect(updated.status).toBe('delivered')
  })

  it('应该能标记会话已读', () => {
    const store = useChatWorkspaceStore()
    store.setActiveConversation(1)

    store.conversations = [
      {
        id: 1,
        name: '测试会话',
        unreadCount: 5
      }
    ]

    store.markConversationRead(1)

    expect(store.conversations[0].unreadCount).toBe(0)
  })
})
```

### 5. 编写工具函数测试

```javascript
// tests/unit/utils/formatters.spec.js
import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'

describe('Formatter Utilities', () => {
  it('应该正确格式化时间', () => {
    const timestamp = new Date('2025-10-21 14:30:00').getTime()
    const formatted = dayjs(timestamp).format('HH:mm')

    expect(formatted).toBe('14:30')
  })

  it('应该正确格式化文件大小', () => {
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      let size = bytes
      let unitIndex = 0

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }

      return `${size.toFixed(2)} ${units[unitIndex]}`
    }

    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1024)).toBe('1.00 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
  })

  it('应该正确判断消息类型', () => {
    const isTextMessage = (msg) => msg.type === 'text'
    const isImageMessage = (msg) => msg.type === 'image'
    const isFileMessage = (msg) => msg.type === 'file'

    const textMsg = { type: 'text', content: '你好' }
    const imgMsg = { type: 'image', attachments: [] }
    const fileMsg = { type: 'file', attachments: [] }

    expect(isTextMessage(textMsg)).toBe(true)
    expect(isImageMessage(imgMsg)).toBe(true)
    expect(isFileMessage(fileMsg)).toBe(true)
  })
})
```

## 📊 测试覆盖目标

### 覆盖率分布

```
组件 (Components):
  ├─ ChatRoom.vue                  80% 覆盖
  ├─ MessageListNew.vue            75% 覆盖
  ├─ MessageInputNew.vue           70% 覆盖
  └─ ContextMenu.vue               75% 覆盖

Store (Pinia):
  ├─ chatWorkspace.ts              95% 覆盖
  ├─ userStatus.ts                 90% 覆盖
  └─ notifications.ts              85% 覆盖

Utils (工具):
  ├─ formatters.js                100% 覆盖
  ├─ validators.js                100% 覆盖
  ├─ socket.ts                     85% 覆盖
  └─ preload.js                    90% 覆盖

总覆盖率: 85%+ ✅
```

## 🧪 测试命令

```bash
# 运行所有测试
npm run test

# 监听模式 (开发中)
npm run test:watch

# 覆盖率报告
npm run test:coverage

# UI 可视化
npm run test:ui
```

## 📊 预期结果

```
测试摘要:
  ├─ 通过: 85+ 个测试
  ├─ 覆盖: 85% 代码
  ├─ 时间: < 5 秒
  └─ 失败: 0 个 (目标)

覆盖率报告:
  ├─ 语句覆盖: 85%
  ├─ 分支覆盖: 80%
  ├─ 函数覆盖: 90%
  └─ 行覆盖: 85%
```

## 🎯 最佳实践

### 1. 测试结构

```javascript
describe('功能名称', () => {
  beforeEach(() => {
    // 测试前的设置
  })

  it('应该做某事', () => {
    // Arrange: 准备数据
    // Act: 执行操作
    // Assert: 验证结果
  })

  afterEach(() => {
    // 清理
  })
})
```

### 2. 命名规范

```javascript
// ❌ 不好
it('test', () => {})

// ✅ 好
it('应该在收到新消息时更新列表', () => {})
```

### 3. 模拟和 Stub

```javascript
// Mock 函数
const mockFunction = vi.fn()
mockFunction.mockReturnValue('result')

// Stub 组件
stubs: {
  'child-component': true
}

// Mock 模块
vi.mock('@/utils/api', () => ({
  fetchMessages: vi.fn()
}))
```

---

**状态**: 🔄 实现中
**预期完成**: 2025-10-22
**工时**: 2-3 小时
**测试数量**: 85+ 个
**覆盖率**: 85%+
