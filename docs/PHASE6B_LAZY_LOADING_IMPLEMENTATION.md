# 📸 Phase 6B: 图片懒加载优化 - 实现指南

## 🎯 优化目标

```
优化前 → 优化后 (改进)

初始请求: 150 个 → 40 个  (-73%)
带宽消耗: 5MB → 2.5MB    (-50%)
首屏时间: 3s → 2s         (-33%)
加载体验: 渐进式          更流畅
```

## 🔧 技术方案

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Intersection Observer API | 原生、高效、支持好 | 需要自实现 | ⭐⭐⭐⭐⭐ |
| v-lazy-image 库 | 开箱即用、简单 | 增加依赖 | ⭐⭐⭐⭐ |
| 滚动事件 + 计算距离 | 兼容性好 | 性能差、耗资源 | ⭐⭐ |

**选择**: Intersection Observer API (原生方案，无需额外依赖)

## 💻 实现代码

### 1. 创建懒加载工具函数 (composables/useLazyImage.js)

```javascript
/**
 * useLazyImage - 图片懒加载组合函数
 * 使用 Intersection Observer API 实现高效的图片懒加载
 */

import { onMounted, onBeforeUnmount } from 'vue'

export function useLazyImage() {
  let observer = null

  /**
   * 初始化观察者
   */
  const initObserver = () => {
    const options = {
      root: null,           // 相对于视口
      rootMargin: '50px',   // 提前 50px 加载
      threshold: 0.01       // 1% 可见时触发
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src

          if (src) {
            // 使用 Image 对象预加载，避免加载失败
            const image = new Image()
            image.onload = () => {
              img.src = src
              img.classList.add('lazy-loaded')
              observer.unobserve(img)
            }
            image.onerror = () => {
              // 加载失败时显示占位图
              img.src = img.dataset.fallback || '/images/error.png'
              observer.unobserve(img)
            }
            image.src = src
          }
        }
      })
    }, options)
  }

  /**
   * 观察指定元素
   */
  const observe = (element) => {
    if (observer && element) {
      observer.observe(element)
    }
  }

  /**
   * 观察多个元素
   */
  const observeAll = (selector) => {
    if (!observer) return

    const elements = document.querySelectorAll(selector)
    elements.forEach(el => observer.observe(el))
  }

  /**
   * 停止观察
   */
  const unobserve = (element) => {
    if (observer && element) {
      observer.unobserve(element)
    }
  }

  /**
   * 生命周期：挂载时初始化
   */
  onMounted(() => {
    initObserver()
  })

  /**
   * 生命周期：卸载时清理
   */
  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return {
    observe,
    observeAll,
    unobserve
  }
}
```

### 2. 创建 LazyImage 组件

```vue
<!-- components/LazyImage.vue -->
<template>
  <img
    :src="placeholderSrc"
    :data-src="src"
    :data-fallback="fallback"
    :alt="alt"
    :class="['lazy-image', { 'lazy-loaded': isLoaded }]"
    @load="handleLoad"
  />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E'
  },
  fallback: {
    type: String,
    default: '/images/error.png'
  },
  alt: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['load', 'error'])
const isLoaded = ref(false)
const placeholderSrc = ref(props.placeholder)
let observer = null

const initObserver = () => {
  const img = document.currentScript?.previousElementSibling || this.$el

  if (!img) return

  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      const src = img.dataset.src
      if (src) {
        img.src = src
        isLoaded.value = true
        observer.unobserve(img)
      }
    }
  }, {
    rootMargin: '50px'
  })

  observer.observe(img)
}

const handleLoad = () => {
  isLoaded.value = true
  emit('load')
}

onMounted(() => {
  // 图片加载的 Intersection Observer 由 useLazyImage 处理
  // 这里可以添加额外的加载事件监听
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lazy-image {
  transition: opacity 0.3s ease-in-out;
  opacity: 0.7;
}

.lazy-image.lazy-loaded {
  opacity: 1;
}
</style>
```

### 3. 改造 MessageBubble 组件

```vue
<!-- components/chat/MessageBubble.vue -->
<template>
  <div class="message-bubble">
    <!-- 文本消息 -->
    <div v-if="message.type === 'text'" class="message-text">
      {{ message.content }}
    </div>

    <!-- 图片消息 (使用懒加载) -->
    <div v-else-if="message.type === 'image'" class="message-images">
      <img
        v-for="att in message.attachments"
        :key="att.id"
        :data-src="att.url"
        :src="placeholderImage"
        :alt="att.fileName"
        class="lazy-image message-image"
        @click="handleImagePreview(att)"
      />
    </div>

    <!-- 文件消息 -->
    <div v-else-if="message.type === 'file'" class="message-files">
      <div v-for="att in message.attachments" :key="att.id" class="file-item">
        <el-icon><Document /></el-icon>
        <div class="file-info">
          <div class="file-name">{{ att.fileName }}</div>
          <div class="file-size">{{ formatFileSize(att.fileSize) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLazyImage } from '@/composables/useLazyImage'
import { onMounted } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const { observe, unobserve } = useLazyImage()

// 占位图 (极小的 base64 gif)
const placeholderImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

onMounted(() => {
  // 观察所有 lazy-image 元素
  const images = document.querySelectorAll('.lazy-image')
  images.forEach(img => {
    if (img.dataset.src && !img.src.includes('data:')) {
      observe(img)
    }
  })
})

function handleImagePreview(attachment) {
  // 图片预览逻辑
}

function formatFileSize(bytes) {
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
</script>

<style scoped>
.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.lazy-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f5f5f5;
  object-fit: cover;
}

.lazy-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.lazy-image.lazy-loaded {
  animation: fadeIn 0.3s ease-in-out;
}

.message-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

@keyframes fadeIn {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}
</style>
```

### 4. 改造 RightSidebar 中的头像懒加载

```vue
<!-- components/chat/RightSidebar.vue -->
<template>
  <div class="right-sidebar">
    <!-- 成员列表 -->
    <div class="members-section">
      <div class="section-title">成员</div>
      <div class="members-list">
        <div
          v-for="member in members"
          :key="member.userId"
          class="member-item"
        >
          <!-- 头像使用懒加载 -->
          <img
            v-if="member.avatar"
            :data-src="member.avatar"
            :src="placeholderAvatar"
            :alt="member.name"
            class="lazy-image member-avatar"
          />
          <el-avatar v-else :size="40">
            {{ member.name?.charAt(0) || '?' }}
          </el-avatar>

          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role">{{ member.role }}</div>
          </div>

          <div class="member-status">
            <div v-if="member.isOnline" class="online-dot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLazyImage } from '@/composables/useLazyImage'
import { onMounted } from 'vue'

const props = defineProps({
  members: {
    type: Array,
    default: () => []
  }
})

const { observe } = useLazyImage()
const placeholderAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Ccircle fill="%23e0e0e0" cx="20" cy="20" r="20"/%3E%3C/svg%3E'

onMounted(() => {
  // 观察所有成员头像
  const avatars = document.querySelectorAll('.member-avatar')
  avatars.forEach(avatar => observe(avatar))
})
</script>

<style scoped>
.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
}

.member-item:hover {
  background: #f5f7fa;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.member-role {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.member-status {
  display: flex;
  align-items: center;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
}
</style>
```

## 📊 性能对比

### 优化前

```
页面加载:
  ├─ 初始请求: 150 个图片请求
  ├─ 初始带宽: 5MB
  ├─ 首屏时间: 3s
  ├─ DOM 阻塞: 500ms
  └─ 总加载时间: 8-10s
```

### 优化后

```
页面加载:
  ├─ 初始请求: 40 个图片请求 (-73%)
  ├─ 初始带宽: 2.5MB (-50%)
  ├─ 首屏时间: 2s (-33%)
  ├─ DOM 阻塞: 100ms (-80%)
  └─ 总加载时间: 6-7s (-20%)
```

## 🧪 测试清单

- [ ] 图片显示占位符
- [ ] 向下滚动时图片懒加载
- [ ] 图片加载完成后显示
- [ ] 图片加载失败显示错误图
- [ ] 多个图片同时加载不卡顿
- [ ] 快速滚动时加载正确
- [ ] 移动设备上性能良好
- [ ] 网络慢速下加载正常
- [ ] 内存占用显著降低

## 📈 预期成果

**首屏性能提升**:
- 初始加载更快 (-33%)
- 页面交互更快 (-80% 延迟)
- 用户体验更好 (渐进式加载)

**网络优化**:
- 初始带宽 -50%
- 服务器压力 -60%
- 移动设备流量 -50%

**用户体验**:
- 页面显示速度快 ✅
- 图片逐步加载 ✅
- 流畅的交互 ✅
- 占位图提示 ✅

---

**状态**: 🔄 实现中
**预期完成**: 2025-10-22
**工时**: 1-2 小时
