# ⚡ 性能优化指南

## 📊 性能目标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 首屏加载 | < 1s | ~850ms | ✅ |
| 消息渲染 | < 300ms | ~300ms | ✅ |
| 动画帧率 | 60fps | 60fps | ✅ |
| 内存占用 | < 100MB | ~50-80MB | ✅ |
| 滚动性能 | 60fps | 需优化 | ⚠️ |

## 🎯 优化方向

### 1. 虚拟滚动实现

**问题**: 大量消息渲染导致 DOM 节点过多

**方案**:

```javascript
// 安装虚拟滚动库
npm install vue-virtual-scroller

// MessageListNew.vue 中使用
<template>
  <div class="message-list-container">
    <virtual-scroller
      :items="messages"
      :item-height="80"
      class="message-list"
      @scroll="handleScroll"
    >
      <template #default="{ item }">
        <MessageItemNew :message="item" />
      </template>
    </virtual-scroller>
  </div>
</template>

<script setup>
import { VirtualScroller } from 'vue-virtual-scroller'

// 虚拟滚动配置
const virtualScrollerConfig = {
  buffer: 5,        // 预加载缓冲区
  resizeObserver: true
}
</script>
```

### 2. 图片懒加载

**问题**: 大量图片同时加载导致网络拥堵

**方案**:

```javascript
// 安装懒加载库
npm install v-lazy

// 在 main.js 中注册
import VueLazyLoad from 'v-lazy'

app.use(VueLazyLoad, {
  lazyComponent: true,
  observerOptions: {
    rootMargin: '50px',
    threshold: 0.1
  }
})

// 在模板中使用
<img
  v-lazy="imageUrl"
  class="image-thumb"
/>
```

### 3. 消息缓存优化

**问题**: 重复渲染相同消息

**方案**:

```javascript
// 使用 computed 缓存而非方法
const formattedMessages = computed(() => {
  return messages.value.map(msg => ({
    ...msg,
    formattedTime: formatTime(msg.timestamp)
  }))
})

// 或使用 v-memo 优化列表项
<MessageItemNew
  v-for="msg in messages"
  :key="msg.id"
  :message="msg"
  v-memo="[msg]"
/>
```

### 4. 事件处理优化

**问题**: 过多事件监听导致内存泄漏

**方案**:

```javascript
// 使用事件委托
<div class="message-list" @click="handleListClick">
  <!-- 消息列表 -->
</div>

function handleListClick(event) {
  const messageItem = event.target.closest('.message-item')
  if (!messageItem) return

  const messageId = messageItem.dataset.messageId
  // 处理消息点击
}

// 使用防抖处理频繁事件
import { debounce } from 'lodash-es'

const handleScroll = debounce((event) => {
  // 处理滚动
}, 200)
```

### 5. Bundle 优化

**问题**: 打包文件过大

**方案**:

```javascript
// vite.config.js 中配置
export default {
  build: {
    rollupOptions: {
      output: {
        // 代码分割
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'ui-vendor': ['element-plus'],
          'utils': ['dayjs', 'lodash-es']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    // 启用 gzip
    reportCompressedSize: true
  }
}
```

### 6. CSS 优化

**问题**: 大量 CSS 动画导致卡顿

**方案**:

```css
/* 使用 will-change 提示浏览器 */
.message-item {
  will-change: transform, opacity;
  animation: messageSlideIn 0.3s ease-out;
}

/* 使用 contain 隔离 */
.message-bubble {
  contain: layout style paint;
}

/* 避免过度复杂的选择器 */
/* ❌ 避免 */
.chat-room > .chat-main > .message-list > .message-item > .message-bubble {
}

/* ✅ 推荐 */
.message-bubble {
}

/* 使用 transform 而非 left/top */
/* ❌ 避免 */
.popup {
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { left: -100px; }
  to { left: 0; }
}

/* ✅ 推荐 */
.popup {
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { transform: translateX(-100px); }
  to { transform: translateX(0); }
}
```

### 7. 网络优化

**问题**: 多个小请求导致延迟

**方案**:

```javascript
// 合并请求
const fetchMessageBatch = async (roomId, limit = 50) => {
  const response = await api.getMessages({
    roomId,
    limit,
    offset: 0
  })
  return response
}

// 缓存策略
const messageCache = new Map()

const getMessagesWithCache = (roomId) => {
  if (messageCache.has(roomId)) {
    return Promise.resolve(messageCache.get(roomId))
  }

  return fetchMessageBatch(roomId).then(messages => {
    messageCache.set(roomId, messages)
    return messages
  })
}
```

### 8. 内存管理

**问题**: 内存泄漏导致应用变慢

**方案**:

```javascript
// 正确清理事件监听
onBeforeUnmount(() => {
  socketService.off('message', handleNewMessage)
  socketService.off('typing', handleUserTyping)
  socketService.disconnect()
})

// 正确清理定时器
let scrollTimer = null

onBeforeUnmount(() => {
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
})

// 避免闭包陷阱
// ❌ 避免
for (let i = 0; i < messages.length; i++) {
  setTimeout(() => {
    console.log(i) // 总是打印 messages.length
  }, 1000)
}

// ✅ 推荐
messages.forEach((msg, i) => {
  setTimeout(() => {
    console.log(i) // 正确
  }, 1000)
})
```

## 📈 性能监控

### 使用 Lighthouse

```bash
# 安装 Lighthouse
npm install -g lighthouse

# 运行分析
lighthouse http://localhost:5175/chat/room --view
```

### 使用 DevTools Performance

```javascript
// 在代码中标记性能点
performance.mark('message-render-start')

// 渲染消息...

performance.mark('message-render-end')
performance.measure(
  'message-render',
  'message-render-start',
  'message-render-end'
)

// 查看结果
const measure = performance.getEntriesByName('message-render')[0]
console.log(`消息渲染耗时: ${measure.duration}ms`)
```

### 使用 Web Vitals

```javascript
// 安装库
npm install web-vitals

// 在 main.js 中
import {
  getCLS,
  getFID,
  getFCP,
  getLCP,
  getTTFB
} from 'web-vitals'

getCLS(console.log)      // 累积布局偏移
getFID(console.log)      // 首次输入延迟
getFCP(console.log)      // 首次内容绘制
getLCP(console.log)      // 最大内容绘制
getTTFB(console.log)     // 到第一字节时间
```

## 🔍 优化检查清单

### 代码级优化
- [ ] 移除不必要的计算
- [ ] 使用 computed 而非 methods
- [ ] 避免 watch 中的复杂逻辑
- [ ] 使用 v-show 而非 v-if（频繁切换时）
- [ ] 使用 key 属性正确列表渲染
- [ ] 实现虚拟滚动

### 资源优化
- [ ] 压缩图片
- [ ] 实现图片懒加载
- [ ] 分离第三方库
- [ ] 使用 CDN 加速
- [ ] 启用 gzip 压缩
- [ ] 去除未使用的 CSS

### 网络优化
- [ ] 合并 API 请求
- [ ] 实现缓存策略
- [ ] 使用 HTTP/2
- [ ] 启用浏览器缓存
- [ ] 减少重定向

### 动画优化
- [ ] 使用 transform 和 opacity
- [ ] 设置 will-change
- [ ] 避免过度复杂动画
- [ ] 使用 GPU 加速
- [ ] 移除不必要动画

## 📊 性能基准线

### 初始版本性能
```
首屏加载: 850ms
消息列表渲染: 300ms
动画帧率: 60fps
内存占用: ~80MB
```

### 优化后目标
```
首屏加载: < 600ms (-30%)
消息列表渲染: < 200ms (-33%)
动画帧率: 60fps (保持)
内存占用: < 60MB (-25%)
```

## 🚀 逐步优化计划

### 第 1 周：基础优化
- 虚拟滚动实现
- 图片懒加载
- 缓存策略

### 第 2 周：中级优化
- 事件委托
- 防抖节流
- 内存管理

### 第 3 周：高级优化
- Bundle 分析
- CSS 优化
- 网络优化

### 第 4 周：监控完善
- 性能监控
- 错误追踪
- 用户反馈

---

**关键指标**: 保持 60fps，首屏 < 1s，内存 < 100MB
