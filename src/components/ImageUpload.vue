<template>
  <div class="image-upload" :data-height="height">
    <el-upload
      ref="uploadRef"
      :action="uploadAction"
      :headers="uploadHeaders"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :disabled="uploading"
      accept="image/*"
      drag
    >
      <div v-if="!imageUrl" class="upload-area">
        <el-icon class="upload-icon" :size="50">
          <Plus />
        </el-icon>
        <div class="upload-text">
          <p>点击或拖拽图片到此处上传</p>
          <p class="upload-tip">支持 JPG、PNG、GIF、WebP 格式，文件大小不超过 5MB</p>
        </div>
      </div>
      <div v-else class="image-preview">
        <img :src="imageUrl" alt="预览图" />
        <div class="image-overlay">
          <el-icon @click.stop="handlePreview" class="preview-icon">
            <ZoomIn />
          </el-icon>
          <el-icon @click.stop="handleRemove" class="remove-icon">
            <Delete />
          </el-icon>
        </div>
      </div>
      <div v-if="uploading" class="upload-loading">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <p>上传中...</p>
      </div>
    </el-upload>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="60%">
      <img :src="imageUrl" alt="预览图" style="width: 100%; height: auto;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ZoomIn, Delete, Loading } from '@element-plus/icons-vue'
import { uploadApi } from '@/api/upload'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  uploadType: {
    type: String,
    default: 'cover', // cover, avatar, image
    validator: (value) => ['cover', 'avatar', 'image'].includes(value)
  },
  width: {
    type: String,
    default: '200px'
  },
  height: {
    type: String,
    default: '120px'
  },
  minHeight: {
    type: String,
    default: '120px'
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'error'])

const uploadRef = ref()
const uploading = ref(false)
const previewVisible = ref(false)

const imageUrl = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 上传地址（实际不会用到，因为我们使用自定义上传）
const uploadAction = computed(() => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  return `${baseUrl}/admin/upload/${props.uploadType}`
})

// 上传请求头
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 上传前验证
const beforeUpload = (file) => {
  // 检查文件类型 - 根据文档支持的格式
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片！')
    return false
  }

  // 检查文件大小 (5MB)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return fal
  }

  // 开始上传
  uploading.value = true

  // 使用自定义上传
  handleCustomUpload(file)
  return false // 阻止默认上传
}

// 图片压缩函数
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(resolve, 'image/jpeg', quality)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 上传进度
const uploadProgress = ref(0)

// 自定义上传处理
const handleCustomUpload = async (file) => {
  try {
    console.log('开始上传文件:', file.name, '大小:', formatFileSize(file.size))

    // 重置进度
    uploadProgress.value = 0

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 15
      }
    }, 300)

    // 图片压缩（如果文件大于1MB）
    let fileToUpload = file
    if (file.size > 1024 * 1024) {
      try {
        console.log('文件较大，开始压缩...')
        const compressedBlob = await compressImage(file, 1920, 0.8)
        fileToUpload = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        console.log(`压缩完成: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`)
      } catch (compressError) {
        console.warn('压缩失败，使用原文件:', compressError)
        fileToUpload = file
      }
    }

    let response

    // 根据上传类型选择对应的API
    switch (props.uploadType) {
      case 'cover':
        response = await uploadApi.uploadCover(fileToUpload)
        break
      case 'avatar':
        response = await uploadApi.uploadAvatar(fileToUpload)
        break
      case 'image':
        response = await uploadApi.uploadImage(fileToUpload)
        break
      default:
        throw new Error('不支持的上传类型')
    }

    // 完成进度
    clearInterval(progressInterval)
    uploadProgress.value = 100

    console.log('上传成功:', response)

    // response已经是 { code: 200, message: "xxx", data: { url: "xxx" } } 格式
    const url = response.data.url
    imageUrl.value = url
    ElMessage.success(response.message || '上传成功')
    emit('success', response.data)

    // 延迟重置进度
    setTimeout(() => {
      uploadProgress.value = 0
    }, 1000)

  } catch (error) {
    console.error('上传失败:', error)
    uploadProgress.value = 0

    let errorMessage = '上传失败，请重试'
    if (error.message) {
      errorMessage = error.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    ElMessage.error(errorMessage)
    emit('error', error)
    console.error('错误堆栈:', error.stack)

    if (error.response) {
      console.error('HTTP错误响应:', error.response)
      console.error('HTTP状态码:', error.response.status)
      console.error('HTTP响应数据:', error.response.data)
    }

    ElMessage.error(error.message || '上传失败')
    emit('error', error)
  } finally {
    uploading.value = false
  }
}

// 上传成功（备用，实际使用自定义上传）
const handleSuccess = (response) => {
  if (response.code === 200) {
    imageUrl.value = response.data.url
    ElMessage.success('上传成功')
    emit('success', response.data)
  } else {
    ElMessage.error(response.message || '上传失败')
  }
  uploading.value = false
}

// 上传失败
const handleError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败')
  emit('error', error)
  uploading.value = false
}

// 预览图片
const handlePreview = () => {
  previewVisible.value = true
}

// 删除图片
const handleRemove = async () => {
  try {
    if (imageUrl.value) {
      // 调用删除API删除服务器上的文件
      try {
        await uploadApi.deleteFile(imageUrl.value)
      } catch (error) {
        console.warn('删除服务器文件失败:', error)
        // 即使删除服务器文件失败，也继续清空本地引用
      }

      imageUrl.value = ''
      ElMessage.success('删除成功')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.image-upload {
  width: v-bind(width);
  min-height: v-bind(minHeight);
  position: relative;
}

.image-upload[data-height="auto"] {
  height: auto;
}

.image-upload[data-height="auto"] :deep(.el-upload) {
  width: 100%;
  height: auto;
  min-height: v-bind(minHeight);
}

.image-upload[data-height="auto"] :deep(.el-upload-dragger) {
  width: 100%;
  height: auto;
  min-height: v-bind(minHeight);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload:not([data-height="auto"]) {
  height: v-bind(height);
}

.image-upload:not([data-height="auto"]) :deep(.el-upload) {
  width: 100%;
  height: 100%;
}

.image-upload:not([data-height="auto"]) :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c939d;
}

.upload-icon {
  margin-bottom: 8px;
  color: #c0c4cc;
}

.upload-text p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.upload-tip {
  font-size: 12px !important;
  color: #c0c4cc !important;
  margin-top: 4px !important;
}

/* 固定高度模式的图片预览 */
.image-upload:not([data-height="auto"]) .image-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
  background: #f5f7fa;
}

.image-upload:not([data-height="auto"]) .image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 自动高度模式的图片预览 */
.image-upload[data-height="auto"] .image-preview {
  position: relative;
  width: 100%;
  border-radius: 6px;
  background: #f5f7fa;
  overflow: hidden;
}

.image-upload[data-height="auto"] .image-preview img {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.preview-icon,
.remove-icon {
  font-size: 20px;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.preview-icon:hover {
  background-color: rgba(64, 158, 255, 0.8);
}

.remove-icon:hover {
  background-color: rgba(245, 108, 108, 0.8);
}

.upload-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.upload-loading p {
  margin: 8px 0 0 0;
  font-size: 14px;
}
</style>
