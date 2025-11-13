<template>
  <div class="upload-resource-page">
    <el-page-header title="返回社区" @back="$router.push('/community')">
      <template #content>
        <span class="page-title">上传资源</span>
      </template>
    </el-page-header>

    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">资源上传</span>
          <span class="card-subtitle">支持图片、PDF、压缩包等常见格式</span>
        </div>
      </template>

      <el-upload
        ref="uploaderRef"
        class="upload-area"
        drag
        multiple
        :limit="10"
        :auto-upload="true"
        :file-list="fileList"
        :http-request="handleUploadRequest"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-remove="handleRemove"
        accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.zip,.rar,.7z,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">单文件建议不超过 10MB</div>
        </template>
      </el-upload>

      <el-divider />

      <div class="uploaded-list" v-if="uploadedItems.length">
        <div class="list-header">已上传资源</div>
        <el-table :data="uploadedItems" border size="small">
          <el-table-column label="文件名" prop="name" min-width="260">
            <template #default="{ row }">
              <span class="file-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="大小" prop="size" width="120">
            <template #default="{ row }">
              {{ formatSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : (row.status === 'uploading' ? 'warning' : 'danger')">
                {{ row.status === 'success' ? '已上传' : (row.status === 'uploading' ? '上传中' : '失败') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button v-if="row.url" type="primary" link @click="openUrl(row.url)">预览</el-button>
              <el-button type="danger" link @click="removeUploaded(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
  
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadFile, deleteUploadedFile } from '@/api/chat'

const uploaderRef = ref(null)
const fileList = ref([]) // 由 el-upload 管理的文件列表（UI）
const uploadedMap = reactive(new Map()) // id -> item { id,name,size,url,status }

const uploadedItems = computed(() => Array.from(uploadedMap.values()))

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${units[i]}`
}

function handleUploadRequest(options) {
  const { file, onProgress, onSuccess, onError } = options

  const form = new FormData()
  form.append('file', file)

  // 进度上报
  const onUploadProgress = (evt) => {
    const percent = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 50
    if (typeof onProgress === 'function') {
      onProgress({ percent })
    }
  }

  uploadFile(form, onUploadProgress)
    .then((res) => {
      // 兼容 sendResponse 结构 { code, message, data }
      const payload = res?.data?.data || res?.data || {}
      const item = {
        id: payload.id || file.uid,
        name: file.name,
        size: file.size,
        url: payload.url || '',
        status: 'success'
      }
      uploadedMap.set(item.id, item)
      onSuccess && onSuccess(payload)
      ElMessage.success('上传成功')
    })
    .catch((err) => {
      onError && onError(err)
      ElMessage.error('上传失败，请重试')
    })
}

function handleSuccess() {
  // el-upload 自身会更新 fileList 的状态，这里无需额外处理
}

function handleError() {
  // 错误在 request 中已提示
}

function handleRemove(file) {
  // 用户从 UI 列表移除文件，不一定意味着删除服务器资源，这里不自动调用删除接口
}

function removeUploaded(row) {
  const id = row.id
  deleteUploadedFile(id)
    .then(() => {
      uploadedMap.delete(id)
      // 同步移除 el-upload 列表中相应项（根据 name 匹配）
      const idx = fileList.value.findIndex((f) => f.name === row.name)
      if (idx >= 0) fileList.value.splice(idx, 1)
      ElMessage.success('已删除')
    })
    .catch(() => {
      // 即使删除失败也从列表移除，保持体验流畅（Mock 后端可能无状态）
      uploadedMap.delete(id)
      ElMessage.warning('删除失败或资源不存在，已从列表移除')
    })
}

function openUrl(url) {
  if (!url) return
  window.open(url, '_blank')
}
</script>

<style scoped>
.upload-resource-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.upload-card {
  margin-top: 16px;
}

.card-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-subtitle {
  color: #909399;
  font-size: 12px;
}

.upload-area {
  width: 100%;
}

.uploaded-list {
  margin-top: 16px;
}

.list-header {
  font-weight: 600;
  margin-bottom: 8px;
}

.file-name {
  word-break: break-all;
}
</style>

