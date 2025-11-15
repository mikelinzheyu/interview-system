# 🎯 AI聊天代码块复制按钮实现方案

## 📋 功能概述

在AI聊天对话输出中，当模型返回包含代码块的内容时，每个代码块旁边会显示一个**复制按钮**。用户可以：
- 悬停代码块时看到复制按钮
- 点击按钮将代码复制到剪贴板
- 获得实时反馈（按钮文字变为"✓ 已复制!"）

## 🎨 UI 设计

### 代码块样式
```
┌─────────────────────────────────────┐
│ 复制  (按钮在右上角，悬停时显示)    │
├─────────────────────────────────────┤
│ function hello() {                  │
│   console.log("Hello, World!");    │
│ }                                   │
└─────────────────────────────────────┘
```

### 按钮状态

1. **默认状态** (不可见)
   - `opacity: 0`
   - 位置: 代码块右上角
   - 背景色: #555 (深灰)

2. **悬停状态** (可见)
   - `opacity: 1`
   - 背景色: #777 (浅灰)

3. **已复制状态** (持续2秒)
   - 文字: "✓ 已复制!"
   - 背景色: #67c23a (绿色)
   - 自动恢复

## 🛠️ 技术实现

### 1. 依赖导入
```javascript
import { marked } from 'marked'
import DOMPurify from 'dompurify'
```

### 2. Markdown 转 HTML 函数
**函数**: `renderMarkdownWithCopyButtons(content)`

**步骤**:
1. 使用 `marked.js` 将Markdown转换为HTML
2. 用 `DOMPurify` 清理HTML（XSS防护）
3. 查找所有 `<pre>` 代码块
4. 为每个代码块包装容器并添加复制按钮

```javascript
const renderMarkdownWithCopyButtons = (content) => {
  // 1. Markdown → HTML
  let html = marked(content)

  // 2. 清理HTML
  let sanitized = DOMPurify.sanitize(html, PURIFY_CONFIG)

  // 3. 添加复制按钮
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = sanitized

  tempDiv.querySelectorAll('pre').forEach((preElement) => {
    const container = document.createElement('div')
    container.className = 'code-block-container'

    const copyBtn = document.createElement('button')
    copyBtn.className = 'code-copy-btn'
    copyBtn.textContent = '复制'
    copyBtn.setAttribute('data-code', preElement.textContent)

    preElement.parentNode.insertBefore(container, preElement)
    container.appendChild(preElement)
    container.appendChild(copyBtn)
  })

  return tempDiv.innerHTML
}
```

### 3. 复制功能实现
**函数**: `setupCopyButtons(containerElement)`

**功能**:
- 查找容器内所有复制按钮
- 为每个按钮添加点击事件监听器
- 使用 Clipboard API 复制代码
- 显示反馈动画

```javascript
const setupCopyButtons = (containerElement) => {
  const copyBtns = containerElement.querySelectorAll('.code-copy-btn')

  copyBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()

      const codeText = btn.getAttribute('data-code')
      if (!codeText) return

      try {
        // 复制到剪贴板
        await navigator.clipboard.writeText(codeText)

        // 显示反馈
        const originalText = btn.textContent
        btn.textContent = '✓ 已复制!'
        btn.classList.add('copied')

        // 2秒后恢复
        setTimeout(() => {
          btn.textContent = originalText
          btn.classList.remove('copied')
        }, 2000)
      } catch (err) {
        console.error('Copy failed:', err)
        btn.textContent = '❌ 复制失败'
        setTimeout(() => {
          btn.textContent = '复制'
        }, 2000)
      }
    })
  })
}
```

### 4. 消息渲染

**模板更改**:
```vue
<!-- 用户消息：纯文本 -->
<p v-if="msg.role === 'user'">{{ msg.text }}</p>

<!-- AI消息：HTML渲染（包含Markdown和复制按钮） -->
<div v-else-if="msg.htmlContent"
     class="ai-message-html"
     v-html="msg.htmlContent">
</div>
<p v-else>{{ msg.text }}</p>
```

**消息对象结构**:
```javascript
{
  role: 'assistant',
  text: '原始Markdown文本',
  htmlContent: '转换后的HTML（含复制按钮）',
  time: '时间戳'
}
```

### 5. 消息变化监听
```javascript
watch(messages, (newMessages) => {
  nextTick(() => {
    newMessages.forEach((msg, idx) => {
      if (msg.role === 'assistant' && msg.htmlContent) {
        const messageElement = document.querySelector(
          `.message:nth-child(${idx + 1}) .ai-message-html`
        )
        if (messageElement) {
          setupCopyButtons(messageElement)  // 初始化复制按钮
        }
      }
    })
  })
}, { deep: true })
```

## 🎯 关键特性

### ✅ 自动检测代码块
- 在Markdown渲染过程中自动识别所有 `<pre><code>` 块
- 无需手动标记或配置

### ✅ XSS防护
- 使用 DOMPurify 清理HTML
- 配置严格的允许标签和属性列表
- 防止恶意脚本注入

### ✅ 用户反馈
- 按钮悬停时显示
- 复制成功时显示绿色反馈
- 失败时显示错误提示
- 自动恢复原状态

### ✅ 响应式
- 按钮position: absolute，不影响代码块布局
- 代码块可滚动，按钮始终可见

## 📊 CSS 样式

### 代码块容器
```scss
.code-block-container {
  position: relative;
  display: block;
  margin: 8px 0;

  &:hover .code-copy-btn {
    opacity: 1;  // 悬停时显示按钮
  }
}
```

### 复制按钮
```scss
.code-copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #555;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;        // 默认隐藏
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    background-color: #777;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.copied {
    opacity: 1;
    background-color: #67c23a;  // 绿色反馈
  }
}
```

## 🔄 消息流程

```
AI输出Markdown内容
    ↓
renderMarkdownWithCopyButtons()
    ↓
marked.js 转换为HTML
    ↓
DOMPurify 清理
    ↓
添加复制按钮到<pre>块
    ↓
返回HTML字符串
    ↓
保存到消息对象的 htmlContent
    ↓
消息变化触发 watch
    ↓
setupCopyButtons() 初始化事件监听
    ↓
渲染到页面，用户可交互 ✅
```

## 🧪 测试场景

### 场景1：单个代码块
```
AI输出包含单个代码块 → 复制按钮出现 → 点击复制 → 按钮显示"✓ 已复制!" → 2秒后恢复
```

### 场景2：多个代码块
```
AI输出包含3个代码块 → 每个代码块都有独立复制按钮 → 可分别复制 → 互不影响
```

### 场景3：无代码块
```
AI输出纯文本 → 无复制按钮 → 正常显示Markdown格式
```

### 场景4：代码块在长文本中
```
文本 + 代码块 + 文本 → 代码块正常显示 + 复制按钮可用 → 滚动时按钮保持可见
```

## 📝 相关文件

| 文件 | 修改内容 |
|------|---------|
| `ChatFeature.vue` | 主要实现文件，包含所有复制按钮逻辑 |
| `MarkdownPreview.vue` | 参考实现，提供Markdown渲染模式 |

## 🚀 未来增强

1. **语言标识**
   - 添加代码块语言类型显示
   - 例: "JavaScript", "Python" 等

2. **语法高亮**
   - 集成 Highlight.js 或 Prism
   - 提供更好的代码可视化

3. **代码块工具栏**
   - 添加更多操作（分享、下载等）
   - 同时显示多个操作按钮

4. **快捷键支持**
   - Alt+C 复制当前代码块
   - 提高操作效率

5. **复制历史**
   - 记录复制过的代码
   - 快速重新使用

## ✅ 质量检查清单

- [x] 复制功能正常工作
- [x] Markdown正确转换为HTML
- [x] XSS防护（DOMPurify）
- [x] 悬停显示按钮
- [x] 复制反馈清晰
- [x] 多个代码块独立操作
- [x] 事件监听正确设置
- [x] CSS样式完整
- [x] 响应式设计合理
- [x] 错误处理到位

---

## 总结

✅ **实现完成** - ChatFeature.vue 现已具有完整的AI聊天代码块复制功能
- 自动识别Markdown中的代码块
- 添加美观的复制按钮
- 提供实时反馈
- 安全的HTML渲染
- 符合用户期望的交互设计

提交: commit c8e2e31
