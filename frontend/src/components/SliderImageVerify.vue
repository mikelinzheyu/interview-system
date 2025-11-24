<template>
  <el-dialog
    v-model="visible"
    title="人机验证"
    width="420px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="slider-verify-container">
      <div class="puzzle-wrapper">
        <canvas ref="bgCanvas" class="puzzle-bg"></canvas>
        <canvas
          ref="pieceCanvas"
          class="puzzle-piece"
          :style="{ top: `${pieceTop}px`, left: pieceOffset }"
        ></canvas>
      </div>
      <div class="slider-track" ref="trackRef">
        <div class="slider-fill" :style="{ width: progress + '%' }"></div>
        <button
          class="slider-handle"
          :class="{ verified }"
          :style="{ left: handlePosition }"
          @mousedown="startSlide"
          @touchstart.prevent="startSlide"
          type="button"
          aria-label="滑动验证"
        >
          <el-icon v-if="!verified"><Right /></el-icon>
          <el-icon v-else><CircleCheck /></el-icon>
        </button>
        <span class="slider-text">
          {{ verified ? '验证成功' : '按住滑块拖动完成拼图' }}
        </span>
      </div>

      <div v-if="errorMessage" class="error-message">
        <el-icon><CircleClose /></el-icon>
        <span>{{ errorMessage }}</span>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Right, CircleCheck, CircleClose, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  phone: {
    type: String,
    required: false
  }
})

const emit = defineEmits(['update:modelValue', 'verify-success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const progress = ref(0)
const verified = ref(false)
const dragging = ref(false)
const startX = ref(0)
const trackRef = ref(null)
const errorMessage = ref('')

// Puzzle image refs
const bgCanvas = ref(null)
const pieceCanvas = ref(null)
const pieceTop = ref(0)
const pieceOffset = computed(() => {
  const range = maxPieceX.value - pieceStartX.value
  if (range <= 0) {
    return `${pieceStartX.value}px`
  }
  const t = progress.value / 100
  const x = pieceStartX.value + t * range
  return `${x}px`
})

const pieceSize = 40
const pieceStartX = ref(16)
const maxPieceX = ref(0)
const targetNorm = ref(0)

const handlePosition = computed(() => `${progress.value}%`)

const resetState = () => {
  progress.value = 0
  verified.value = false
  dragging.value = false
  startX.value = 0
  errorMessage.value = ''
}

// 风景图片数组 - 多种风景类型
const landscapeImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=150&fit=crop', // 山脉
  'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800&h=150&fit=crop', // 日落
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=150&fit=crop', // 海滩/海浪
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=150&fit=crop', // 森林
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=150&fit=crop'  // 山谷
]

// 如果没有网络，使用渐变色作为备选
const palettes = [
  {
    bg: ['#eff6ff', '#e0f2fe', '#fee2e2'],
    accents: ['#60a5fa', '#f97316', '#f97373']
  },
  {
    bg: ['#ecfdf5', '#dcfce7', '#fef9c3'],
    accents: ['#34d399', '#22c55e', '#eab308']
  },
  {
    bg: ['#f5f3ff', '#e0e7ff', '#e0f2fe'],
    accents: ['#a855f7', '#6366f1', '#f97316']
  },
  {
    bg: ['#fdf2f8', '#fee2e2', '#fffbeb'],
    accents: ['#ec4899', '#f97373', '#facc15']
  }
]

let currentImageUrl = ''

const loadRandomLandscapeImage = async () => {
  const randomImage = landscapeImages[Math.floor(Math.random() * landscapeImages.length)]
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      currentImageUrl = randomImage
      resolve(img)
    }
    img.onerror = () => {
      console.warn('Failed to load landscape image, using gradient fallback')
      resolve(null)
    }
    img.src = randomImage
  })
}

const initPuzzle = async () => {
  const bg = bgCanvas.value
  const piece = pieceCanvas.value
  const track = trackRef.value

  if (!bg || !piece || !track) return

  const width = track.clientWidth || 300
  const height = 150

  bg.width = width
  bg.height = height

  piece.width = pieceSize
  piece.height = pieceSize

  const ctxBg = bg.getContext('2d')
  const ctxPiece = piece.getContext('2d')
  if (!ctxBg || !ctxPiece) return

  // 尝试加载风景图片
  const landscapeImg = await loadRandomLandscapeImage()

  if (landscapeImg) {
    // 使用真实风景图片
    ctxBg.drawImage(landscapeImg, 0, 0, width, height)

    // 添加轻微的渐变叠加，增强对比
    const overlay = ctxBg.createLinearGradient(0, 0, width, height)
    overlay.addColorStop(0, 'rgba(0, 0, 0, 0.05)')
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
    ctxBg.fillStyle = overlay
    ctxBg.fillRect(0, 0, width, height)
  } else {
    // 备选：使用渐变色
    const palette = palettes[Math.floor(Math.random() * palettes.length)]

    const directions = [
      [0, 0, width, height],
      [width, 0, 0, height],
      [0, height, width, 0],
      [0, 0, width, 0]
    ]
    const [x0, y0, x1, y1] = directions[Math.floor(Math.random() * directions.length)]

    const gradient = ctxBg.createLinearGradient(x0, y0, x1, y1)
    const stops = palette.bg
    stops.forEach((color, idx) => {
      const t = stops.length === 1 ? 0 : idx / (stops.length - 1)
      gradient.addColorStop(t, color)
    })
    ctxBg.fillStyle = gradient
    ctxBg.fillRect(0, 0, width, height)

    // 叠加圆形光斑
    const blobCount = 5 + Math.floor(Math.random() * 4)
    for (let i = 0; i < blobCount; i++) {
      const radius = 25 + Math.random() * 30
      const cx = Math.random() * width
      const cy = Math.random() * height
      const color = palette.accents[i % palette.accents.length]

      const radial = ctxBg.createRadialGradient(cx, cy, 0, cx, cy, radius)
      radial.addColorStop(0, `${color}cc`)
      radial.addColorStop(1, `${color}00`)

      ctxBg.fillStyle = radial
      ctxBg.beginPath()
      ctxBg.arc(cx, cy, radius, 0, Math.PI * 2)
      ctxBg.fill()
    }

    // 轻微的横向条纹
    ctxBg.save()
    ctxBg.globalAlpha = 0.06
    ctxBg.fillStyle = '#0f172a'
    const stripeHeight = 6
    for (let y = 0; y < height; y += stripeHeight * 2) {
      ctxBg.fillRect(0, y, width, stripeHeight)
    }
    ctxBg.restore()
  }

  // Random target position
  const padding = 16
  const maxX = width - pieceSize - padding
  const minX = padding + 40
  const maxY = height - pieceSize - padding
  const minY = padding

  const targetX = Math.floor(Math.random() * (maxX - minX)) + minX
  const targetY = Math.floor(Math.random() * (maxY - minY)) + minY

  pieceTop.value = targetY
  pieceStartX.value = padding
  maxPieceX.value = maxX

  // 高亮目标区域
  ctxBg.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctxBg.fillRect(targetX, targetY, pieceSize, pieceSize)
  ctxBg.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctxBg.lineWidth = 2
  ctxBg.strokeRect(targetX + 0.5, targetY + 0.5, pieceSize - 1, pieceSize - 1)

  // 绘制拼图块
  ctxPiece.clearRect(0, 0, pieceSize, pieceSize)
  ctxPiece.drawImage(bg, targetX, targetY, pieceSize, pieceSize, 0, 0, pieceSize, pieceSize)
  ctxPiece.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctxPiece.lineWidth = 2
  ctxPiece.strokeRect(0.5, 0.5, pieceSize - 1, pieceSize - 1)

  const range = maxPieceX.value - pieceStartX.value
  targetNorm.value = range > 0 ? (targetX - pieceStartX.value) / range : 0.8
}

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      resetState()
      // 初始化拼图画面
      await nextTick()
      await initPuzzle()
    } else {
      dragging.value = false
      detachListeners()
    }
  }
)

const getClientX = (event) => {
  if (event.touches && event.touches[0]) {
    return event.touches[0].clientX
  }
  return event.clientX
}

const handleMove = (event) => {
  if (!dragging.value || !trackRef.value) return

  const rect = trackRef.value.getBoundingClientRect()
  const maxDistance = rect.width - 44
  const diff = getClientX(event) - startX.value
  const clamped = Math.max(0, Math.min(maxDistance, diff))
  progress.value = Math.round((clamped / maxDistance) * 100)
}

const stopSlide = async () => {
  if (!dragging.value) return
  dragging.value = false
  detachListeners()

  const sliderNorm = progress.value / 100
  const tolerance = 0.08

  if (Math.abs(sliderNorm - targetNorm.value) <= tolerance) {
    verified.value = true
    errorMessage.value = ''
    ElMessage.success('验证成功')

    // 验证成功后自动关闭对话框
    setTimeout(() => {
      emit('verify-success')
      visible.value = false
    }, 500)
  } else {
    progress.value = 0
    errorMessage.value = '请将滑块拖动到正确位置完成拼图'
  }
}

const attachListeners = () => {
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('mouseup', stopSlide)
  document.addEventListener('touchend', stopSlide)
}

const detachListeners = () => {
  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('mouseup', stopSlide)
  document.removeEventListener('touchend', stopSlide)
}

const startSlide = (event) => {
  if (verified.value) return
  dragging.value = true
  errorMessage.value = ''
  startX.value = getClientX(event)
  attachListeners()
}

const handleRefresh = () => {
  resetState()
  detachListeners()
}

onBeforeUnmount(() => {
  detachListeners()
})
</script>

<style scoped lang="scss">
.slider-verify-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.puzzle-wrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
}

.puzzle-bg {
  display: block;
  width: 100%;
  height: 150px;
}

.puzzle-piece {
  position: absolute;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.35);
  border-radius: 4px;
}

.slider-track {
  position: relative;
  height: 36px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.2));
  border-radius: 999px;
  transition: width 0.12s linear;
}

.slider-handle {
  position: absolute;
  top: 3px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 2px solid #a5b4fc;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #6366f1;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
  transition: all 0.1s linear;
  user-select: none;
  touch-action: none;

  &.verified {
    background: #34d399;
    border-color: #34d399;
    color: #fff;
    cursor: default;
  }
}

.slider-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #6b7280;
  pointer-events: none;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
}

:deep(.el-dialog__footer) {
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
}
</style>
