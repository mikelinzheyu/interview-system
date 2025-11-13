# 第一阶段快速集成指南

## 🚀 快速开始

### 1. 验证安装的依赖

```bash
cd frontend
npm list markdown-it dompurify highlight.js
```

### 2. 导入新服务和组件

已在 `MessageListNew.vue` 中自动导入，无需额外配置

### 3. 测试功能

#### 测试 Markdown 渲染：
```
发送消息:
# 标题
**粗体** *斜体*
- 列表项
```javascript
console.log('Hello');
\```
```

#### 测试表情反应：
1. Hover 任何消息
2. 点击消息下方的 "+" 按钮
3. 选择喜欢的表情
4. 反应立即显示

---

## 📦 新增文件清单

| 文件 | 类型 | 行数 | 说明 |
|------|------|------|------|
| messageFormattingService.js | Service | ~250 | 消息格式化和高亮 |
| MarkdownRenderer.vue | Component | ~180 | Markdown 渲染器 |
| CodeHighlighter.vue | Component | ~140 | 代码块高亮 |
| LinkPreviewCard.vue | Component | ~130 | 链接预览卡片 |
| ReactionPicker.vue | Component | ~350 | 表情选择器 |
| MessageReactions.vue | Component | ~90 | 反应显示 |
| MessageBubble.vue | Component | ~180 | 消息气泡（新） |
| chatWorkspace.js | Store | +130 | 反应功能扩展 |
| MessageListNew.vue | View | +50 | 集成改进 |

---

## 🔄 数据流程

```
用户输入消息
    ↓
MessageListNew 接收
    ↓
MessageFormattingService 解析类型
    ↓
MarkdownRenderer/CodeHighlighter 渲染
    ↓
展示格式化消息
    ↓
用户点击反应按钮
    ↓
ReactionPicker 打开
    ↓
选择表情
    ↓
Store.addReaction() 更新
    ↓
MessageReactions 实时显示
```

---

## 🎨 样式自定义

### 修改消息气泡颜色

编辑 `MessageBubble.vue`:
```vue
.message-bubble {
  background: #f0f0f0;  /* 修改这里 */
}

.message-bubble.is-own {
  background: #409eff;  /* 修改这里 */
}
```

### 修改代码高亮主题

编辑 `CodeHighlighter.vue` 的 `:deep()` 样式部分

### 修改表情列表

编辑 `ReactionPicker.vue` 中的 `EMOJI_DATA` 数组

---

## 🔧 API 集成预留

### 当前状态：
- ✅ 前端完整实现
- ⏳ 后端 API 等待 (需实现)
- ⏳ WebSocket 事件等待 (需实现)

### 需要后端实现的接口：

```typescript
// 1. 反应相关 API
POST /api/messages/{messageId}/reactions
DELETE /api/messages/{messageId}/reactions/{emoji}
GET /api/messages/{messageId}/reactions

// 2. WebSocket 事件
message.reaction.add     // 用户添加反应
message.reaction.remove  // 用户移除反应

// 3. 链接预览 API (可选)
GET /api/preview?url=...
响应: { title, description, image, url }
```

---

## ⚠️ 注意事项

1. **性能**: 大量消息（1000+）时，考虑分页加载
2. **安全**: 所有 HTML 通过 DOMPurify 清理，已防护 XSS
3. **浏览器**: 需要 ES6+ 支持，推荐 Chrome 90+, Firefox 88+, Safari 14+
4. **移动端**: 表情选择器在超小屏需优化，可考虑显示最常用表情

---

## 🐛 已知限制与后续改进

| 项目 | 当前状态 | 后续改进 |
|------|--------|--------|
| 链接预览 | 基础展示 | 需要后端 API 支持获取标题和图片 |
| 反应同步 | 本地存储 | 第二阶段添加 WebSocket 实时同步 |
| 已读回执 | 未实现 | 第二阶段实现 |
| 深色模式 | 未实现 | 第三阶段实现 |
| 消息收藏 | 未实现 | 第三阶段实现 |

---

## 💡 代码示例

### 在其他组件中使用 MessageFormattingService

```javascript
import MessageFormattingService from '@/services/messageFormattingService'

// 检查消息是否包含 Markdown
const hasMarkdown = MessageFormattingService.hasMarkdown(content)

// 获取消息类型
const type = MessageFormattingService.parseMessageType(content)

// 提取 URL
const urls = MessageFormattingService.extractUrls(content)

// 高亮代码
const highlighted = MessageFormattingService.highlightCode(code, 'javascript')

// 获取支持的语言
const languages = MessageFormattingService.getSupportedLanguages()
```

### 在 Store 中使用反应功能

```javascript
import { useChatWorkspaceStore } from '@/stores/chatWorkspace'

const store = useChatWorkspaceStore()

// 获取消息反应
const reactions = store.getMessageReactions(conversationId, messageId)

// 添加反应
store.addReaction(conversationId, messageId, '👍')

// 同步服务器数据
store.syncReactions(conversationId, messageId, [
  { emoji: '👍', count: 3, users: [1, 2, 3] }
])
```

---

## 🧪 测试用例

### 单元测试建议

```javascript
// messageFormattingService.test.js
describe('MessageFormattingService', () => {
  test('应识别 Markdown', () => {
    const has = MessageFormattingService.hasMarkdown('**bold**')
    expect(has).toBe(true)
  })

  test('应提取 URL', () => {
    const urls = MessageFormattingService.extractUrls(
      'Visit https://example.com'
    )
    expect(urls).toContain('https://example.com')
  })
})

// reactionPicker.test.js
describe('ReactionPicker', () => {
  test('应显示表情网格', () => {
    // 检查 EMOJI_DATA 长度 >= 80
  })

  test('应支持搜索', () => {
    // 输入搜索词，检查过滤结果
  })
})
```

---

## 📊 性能指标 (初步估计)

| 指标 | 值 | 备注 |
|------|-----|------|
| Markdown 解析时间 | <50ms | 平均消息长度 |
| 代码高亮时间 | <100ms | 500 行代码 |
| 反应添加时间 | <10ms | 本地操作 |
| 组件加载时间 | <200ms | 包含所有新组件 |
| 包大小增量 | ~150KB | 压缩后约 40KB |

---

## 📚 参考文档

- [markdown-it 文档](https://github.com/markdown-it/markdown-it)
- [highlight.js 文档](https://highlightjs.org/)
- [DOMPurify 文档](https://github.com/cure53/DOMPurify)
- [Vue 3 组件指南](https://vuejs.org/)

---

## 🎯 检查清单

在开始第二阶段之前，请确认：

- [ ] 所有 npm 依赖已安装
- [ ] 构建无错误或警告
- [ ] Markdown 渲染工作正常
- [ ] 代码高亮支持主要语言
- [ ] 表情反应功能完整
- [ ] 在主流浏览器中测试通过
- [ ] 移动端界面可用
- [ ] 消息和反应数据结构完整

---

*Last Updated: 2024-11-12*
*Phase 1: Complete ✅*
*Ready for Phase 2: 第二阶段可随时开始*
