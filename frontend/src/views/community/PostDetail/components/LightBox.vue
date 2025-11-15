<template>
  <!-- LightBox 模态框 -->
  <el-dialog
    v-model="visible"
    :show-close="true"
    :close-on-click-modal="true"
    :destroy-on-close="true"
    width="90%"
    class="lightbox-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="lightbox-header">
        <span v-if="currentImage" class="image-info">
          {{ currentImageIndex + 1 }} / {{ images.length }}
        </span>
      </div>
    </template>

    <div v-if="currentImage" class="lightbox-container">
      <!-- 图片 -->
      <img
        :src="currentImage"
        :alt="currentImageIndex"
        class="lightbox-image"
        @click="handleImageClick"
      />

      <!-- 左右导航（多张图片时） -->
      <button v-if="images.length > 1" class="lightbox-nav lightbox-prev" @click="prevImage">
        <el-icon><ArrowLeftBold /></el-icon>
      </button>
      <button v-if="images.length > 1" class="lightbox-nav lightbox-next" @click="nextImage">
        <el-icon><ArrowRightBold /></el-icon>
      </button>

      <!-- 缩放控制 -->
      <div class="lightbox-controls">
        <el-button-group>
          <el-button @click="zoomOut" :icon="ZoomOut" />
          <el-button text disabled class="zoom-level">{{ Math.round(scale * 100) }}%</el-button>
          <el-button @click="zoomIn" :icon="ZoomIn" />
        </el-button-group>
        <el-button @click="resetZoom" size="small">重置</el-button>
        <el-button @click="downloadImage" :icon="Download" size="small">下载</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import {
  ArrowLeftBold,
  ArrowRightBold,
  ZoomIn,
  ZoomOut,
  Download,
} from '@element-plus/icons-vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close'])

const visible = ref(false)
const currentImageIndex = ref(0)
const scale = ref(1)

const currentImage = computed(() => {
  return props.images[currentImageIndex.value]
})

const open = (index = 0) => {
  currentImageIndex.value = index
  scale.value = 1
  visible.value = true
}

const close = () => {
  visible.value = false
}

const handleClose = () => {
  emit('close')
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    scale.value = 1
  }
}

const nextImage = () => {
  if (currentImageIndex.value < props.images.length - 1) {
    currentImageIndex.value++
    scale.value = 1
  }
}

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.2, 3)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.2, 0.5)
}

const resetZoom = () => {
  scale.value = 1
}

const handleImageClick = () => {
  // 点击图片时可以实现其他功能，例如切换全屏等
}

const downloadImage = () => {
  const link = document.createElement('a')
  link.href = currentImage.value
  link.download = `image-${currentImageIndex.value + 1}`
  link.click()
}

defineExpose({
  open,
  close,
})
</script>

<style scoped lang="scss">
:deep(.lightbox-dialog) {
  .el-dialog__body {
    padding: 0 !important;
    background: #000;
  }

  .el-dialog__header {
    border-bottom: 1px solid #333;
    background: #1a1a1a;
  }

  .el-dialog__close {
    color: #fff;
  }
}

.lightbox-header {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 14px;

  .image-info {
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 12px;
    border-radius: 4px;
  }
}

.lightbox-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: #000;
  overflow: hidden;

  .lightbox-image {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    transform: scale(v-bind(scale));
    transition: transform 0.3s ease;
    cursor: zoom-in;
    user-select: none;

    &:active {
      cursor: zoom-out;
    }
  }

  .lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
    z-index: 10;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    &.lightbox-prev {
      left: 20px;
    }

    &.lightbox-next {
      right: 20px;
    }

    .el-icon {
      font-size: 20px;
    }
  }

  .lightbox-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 12px 20px;
    border-radius: 6px;
    z-index: 10;

    :deep(.el-button-group) {
      .el-button {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.2);
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.3);
        }

        &.zoom-level {
          min-width: 60px;
          cursor: default;
          pointer-events: none;

          &:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.2);
          }
        }
      }
    }

    :deep(.el-button) {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.2);
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
  }
}
</style>
