<template>
  <div class="link-preview-card">
    <a :href="url" target="_blank" rel="noopener noreferrer" class="preview-link">
      <!-- 缩略图 -->
      <div v-if="thumbnail" class="preview-thumbnail">
        <img :src="thumbnail" :alt="title" class="thumbnail-img" @error="handleImageError">
      </div>

      <!-- 内容 -->
      <div class="preview-content">
        <div class="preview-title">{{ title }}</div>
        <div v-if="description" class="preview-description">{{ description }}</div>
        <div class="preview-url">
          <el-icon><Link /></el-icon>
          {{ displayUrl }}
        </div>
      </div>

      <!-- 开链接图标 -->
      <div class="preview-icon">
        <el-icon><Right /></el-icon>
      </div>
    </a>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Link, Right } from '@element-plus/icons-vue'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  }
})

const imageError = ref(false)

// 显示的URL（缩短）
const displayUrl = computed(() => {
  try {
    const urlObj = new URL(props.url)
    const domain = urlObj.hostname.replace('www.', '')
    return domain
  } catch {
    return props.url.slice(0, 50) + (props.url.length > 50 ? '...' : '')
  }
})

// 处理图片加载错误
function handleImageError() {
  imageError.value = true
}
</script>

<style scoped>
.link-preview-card {
  margin: 8px 0;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.link-preview-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.preview-link {
  display: flex;
  align-items: stretch;
  height: 100px;
  background: #f9f9f9;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
}

.link-preview-card:hover .preview-link {
  background: #f5f7fa;
}

.preview-thumbnail {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  background: #e0e0e0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 12px;
  min-width: 0;
}

.preview-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.preview-description {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  margin-bottom: 4px;
}

.preview-url {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  flex-shrink: 0;
  color: #409eff;
  font-size: 16px;
}

.link-preview-card:hover .preview-icon {
  color: #66b1ff;
}

/* 移动端响应式 */
@media (max-width: 600px) {
  .preview-link {
    height: 80px;
  }

  .preview-thumbnail {
    width: 80px;
    height: 80px;
  }

  .preview-content {
    padding: 6px 10px;
  }

  .preview-title {
    font-size: 13px;
  }

  .preview-description {
    font-size: 11px;
  }
}
</style>
