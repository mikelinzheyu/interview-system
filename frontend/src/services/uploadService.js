/**
 * 文件上传服务
 * 支持多种文件类型、上传进度追踪、失败重试等功能
 */

import api from '@/api/index'

// 上传配置
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_CONCURRENT_UPLOADS: 3,
  CHUNK_SIZE: 1024 * 1024, // 1MB
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 毫秒
  ALLOWED_TYPES: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    file: ['application/pdf', 'application/msword', 'text/plain']
  }
}

// 上传队列管理
class UploadQueue {
  constructor() {
    this.queue = []
    this.activeUploads = 0
    this.uploadMap = new Map()
  }

  add(file, options = {}) {
    const uploadId = `${Date.now()}-${Math.random()}`
    const uploadTask = {
      id: uploadId,
      file,
      options,
      progress: 0,
      status: 'pending', // pending, uploading, completed, failed
      error: null,
      retries: 0
    }

    this.queue.push(uploadTask)
    this.uploadMap.set(uploadId, uploadTask)
    this.processQueue()

    return uploadId
  }

  async processQueue() {
    while (this.queue.length > 0 && this.activeUploads < UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS) {
      const task = this.queue.shift()
      this.activeUploads++

      try {
        await this.uploadFile(task)
      } catch (error) {
        console.error('Upload failed:', error)
        task.error = error.message
        task.status = 'failed'
      } finally {
        this.activeUploads--
        this.processQueue()
      }
    }
  }

  async uploadFile(task) {
    task.status = 'uploading'

    try {
      const formData = new FormData()
      formData.append('file', task.file)
      formData.append('uploadId', task.id)

      const response = await api({
        url: '/chat/uploads',
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentComplete = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          task.progress = percentComplete

          // 触发进度更新事件
          if (task.options.onProgress) {
            task.options.onProgress({
              id: task.id,
              progress: percentComplete,
              loaded: progressEvent.loaded,
              total: progressEvent.total
            })
          }
        }
      })

      task.status = 'completed'
      task.progress = 100

      if (task.options.onSuccess) {
        task.options.onSuccess(response.data)
      }

      return response.data
    } catch (error) {
      if (task.retries < UPLOAD_CONFIG.RETRY_ATTEMPTS) {
        task.retries++
        task.status = 'pending'
        this.queue.unshift(task)

        if (task.options.onRetry) {
          task.options.onRetry({
            id: task.id,
            attempt: task.retries,
            error: error.message
          })
        }
      } else {
        task.status = 'failed'
        task.error = error.message

        if (task.options.onError) {
          task.options.onError({
            id: task.id,
            error: error.message,
            attempts: task.retries
          })
        }
      }

      throw error
    }
  }

  getStatus(uploadId) {
    return this.uploadMap.get(uploadId)
  }

  cancel(uploadId) {
    const task = this.uploadMap.get(uploadId)
    if (task) {
      task.status = 'cancelled'
      const index = this.queue.indexOf(task)
      if (index > -1) {
        this.queue.splice(index, 1)
      }
    }
  }

  cancelAll() {
    this.queue.forEach(task => {
      task.status = 'cancelled'
    })
    this.queue = []
  }

  getAll() {
    return Array.from(this.uploadMap.values())
  }

  clear() {
    this.uploadMap.clear()
    this.queue = []
    this.activeUploads = 0
  }
}

// 全局上传队列实例
const uploadQueue = new UploadQueue()

/**
 * 验证文件
 */
export function validateFile(file) {
  const errors = []

  // 检查文件大小
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    errors.push(`文件大小不能超过 ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // 检查文件类型
  const fileType = getFileCategory(file.type)
  if (!fileType) {
    errors.push('不支持的文件类型')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 获取文件分类
 */
function getFileCategory(mimeType) {
  for (const [category, types] of Object.entries(UPLOAD_CONFIG.ALLOWED_TYPES)) {
    if (types.includes(mimeType)) {
      return category
    }
  }
  return null
}

/**
 * 上传文件
 */
export function uploadFile(file, options = {}) {
  const validation = validateFile(file)

  if (!validation.valid) {
    if (options.onError) {
      options.onError({
        error: validation.errors.join('; ')
      })
    }
    return Promise.reject(new Error(validation.errors.join('; ')))
  }

  const uploadId = uploadQueue.add(file, options)
  return uploadId
}

/**
 * 上传多个文件
 */
export function uploadMultipleFiles(files, options = {}) {
  const uploadIds = []

  for (const file of files) {
    try {
      const uploadId = uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress({
              ...progress,
              totalFiles: files.length,
              uploadIds
            })
          }
        }
      })
      uploadIds.push(uploadId)
    } catch (error) {
      console.error('Failed to upload file:', error)
    }
  }

  return uploadIds
}

/**
 * 获取上传状态
 */
export function getUploadStatus(uploadId) {
  return uploadQueue.getStatus(uploadId)
}

/**
 * 获取所有上传任务
 */
export function getAllUploads() {
  return uploadQueue.getAll()
}

/**
 * 取消上传
 */
export function cancelUpload(uploadId) {
  uploadQueue.cancel(uploadId)
}

/**
 * 取消所有上传
 */
export function cancelAllUploads() {
  uploadQueue.cancelAll()
}

/**
 * 清除已完成的上传记录
 */
export function clearCompletedUploads() {
  const uploads = uploadQueue.getAll()
  const completed = uploads.filter(u => u.status === 'completed')
  completed.forEach(u => {
    uploadQueue.uploadMap.delete(u.id)
  })
}

/**
 * 获取文件预览URL
 */
export function getFilePreviewUrl(file) {
  if (!file) return null

  const type = getFileCategory(file.type)

  if (type === 'image') {
    return URL.createObjectURL(file)
  }

  if (type === 'video') {
    return URL.createObjectURL(file)
  }

  return null
}

/**
 * 释放预览URL
 */
export function revokeFilePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 获取文件类型图标
 */
export function getFileIcon(mimeType) {
  const type = getFileCategory(mimeType)

  const iconMap = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    file: '📄'
  }

  return iconMap[type] || '📎'
}

/**
 * 下载文件
 */
export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()

    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}

export default {
  uploadFile,
  uploadMultipleFiles,
  getUploadStatus,
  getAllUploads,
  cancelUpload,
  cancelAllUploads,
  clearCompletedUploads,
  validateFile,
  getFilePreviewUrl,
  revokeFilePreviewUrl,
  formatFileSize,
  getFileIcon,
  downloadFile,
  UPLOAD_CONFIG
}
