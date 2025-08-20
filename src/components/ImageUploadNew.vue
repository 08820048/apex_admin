<template>
  <div class="image-upload">
    <!-- 拖拽上传区域 -->
    <div
      v-if="!imageUrl"
      class="upload-area"
      :class="{ 'drag-over': isDragOver, 'uploading': uploading }"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none"
      />

      <div v-if="!uploading" class="upload-content">
        <el-icon class="upload-icon" :size="48">
          <UploadFilled />
        </el-icon>
        <p class="upload-text">点击选择图片或拖拽图片到此处</p>
        <p class="upload-hint">支持JPG、PNG、GIF、WebP格式，最大5MB</p>
      </div>

      <div v-else class="uploading-content">
        <el-icon class="loading-icon" :size="32">
          <Loading />
        </el-icon>
        <p>上传中... {{ Math.round(uploadProgress) }}%</p>
        <div class="progress-bar">
          <div class="progress" :style="{ width: uploadProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-else class="image-preview">
      <div class="preview-container">
        <img :src="imageUrl" :alt="fileName" class="preview-image" />
        <div class="preview-overlay">
          <div class="preview-actions">
            <el-button
              type="primary"
              size="small"
              @click="copyImageUrl"
              :icon="DocumentCopy"
            >
              复制链接
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="removeImage"
              :icon="Delete"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
      <div class="image-info">
        <p class="file-name">{{ fileName }}</p>
        <p class="file-size">{{ formatFileSize(fileSize) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading, DocumentCopy, Delete } from '@element-plus/icons-vue'
import { uploadApi } from '@/api/upload'
import { validateImage, compressImage, formatFileSize } from '@/utils/imageUtils'

// Props
const props = defineProps({
  // 上传类型：cover（封面图片）、avatar（头像）、image（通用图片）
  uploadType: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'avatar', 'image'].includes(value)
  },
  // 初始图片URL
  modelValue: {
    type: String,
    default: ''
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 最大文件大小（字节）
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  // 图片尺寸限制
  minWidth: {
    type: Number,
    default: null
  },
  minHeight: {
    type: Number,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error'])

// 响应式数据
const fileInput = ref()
const isDragOver = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const imageUrl = ref(props.modelValue)
const fileName = ref('')
const fileSize = ref(0)

// 方法
const triggerFileInput = () => {
  if (!props.disabled && !uploading.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    uploadImage(file)
  }
  // 清空input值，允许重复选择同一文件
  event.target.value = ''
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (props.disabled || uploading.value) return
  
  const files = Array.from(event.dataTransfer.files)
  const imageFile = files.find(file => file.type.startsWith('image/'))
  
  if (imageFile) {
    uploadImage(imageFile)
  } else {
    ElMessage.warning('请拖拽图片文件')
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
}

const handleDragEnter = (event) => {
  event.preventDefault()
  if (!props.disabled && !uploading.value) {
    isDragOver.value = true
  }
}

const handleDragLeave = (event) => {
  event.preventDefault()
  // 只有当离开整个拖拽区域时才取消高亮
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const uploadImage = async (file) => {
  try {
    // 验证图片
    const validationOptions = {
      maxSize: props.maxSize,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }

    // 如果是封面图片，添加尺寸建议
    if (props.uploadType === 'cover') {
      validationOptions.minWidth = props.minWidth || 400
      validationOptions.minHeight = props.minHeight || 200
    }

    await validateImage(file, validationOptions)

    uploading.value = true
    uploadProgress.value = 0

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 20
      }
    }, 200)

    // 压缩图片（如果文件大于1MB）
    let fileToUpload = file
    if (file.size > 1024 * 1024) {
      try {
        const compressedBlob = await compressImage(file, 1920, 0.8)
        fileToUpload = new File([compressedBlob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        console.log(`图片已压缩: ${formatFileSize(file.size)} → ${formatFileSize(fileToUpload.size)}`)
      } catch (compressError) {
        console.warn('图片压缩失败，使用原文件:', compressError)
        fileToUpload = file
      }
    }

    let response
    if (props.uploadType === 'cover') {
      response = await uploadApi.uploadCover(fileToUpload)
    } else if (props.uploadType === 'avatar') {
      response = await uploadApi.uploadAvatar(fileToUpload)
    } else {
      response = await uploadApi.uploadImage(fileToUpload)
    }

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.code === 200) {
      const data = response.data
      imageUrl.value = data.url
      fileName.value = data.filename || file.name
      fileSize.value = data.size || fileToUpload.size

      // 更新v-model
      emit('update:modelValue', imageUrl.value)
      emit('upload-success', {
        url: imageUrl.value,
        fileName: fileName.value,
        fileSize: fileSize.value,
        originalSize: file.size,
        compressedSize: fileToUpload.size
      })

      ElMessage.success(response.message || '图片上传成功')
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    const errorMessage = error.message || '图片上传失败，请重试'
    ElMessage.error(errorMessage)
    emit('upload-error', error)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const copyImageUrl = async () => {
  try {
    await navigator.clipboard.writeText(imageUrl.value)
    ElMessage.success('图片链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const removeImage = () => {
  imageUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  emit('update:modelValue', '')
}

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  imageUrl.value = newValue
})
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-area.drag-over {
  border-color: #409eff;
  background: #e6f7ff;
  transform: scale(1.02);
}

.upload-area.uploading {
  border-color: #409eff;
  background: #f0f9ff;
  cursor: not-allowed;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin: 0;
  font-weight: 500;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.uploading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-icon {
  color: #409eff;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.image-preview {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.preview-container {
  position: relative;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  display: block;
  background: #f5f7fa;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.image-info {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
}

.file-name {
  font-size: 14px;
  color: #303133;
  margin: 0 0 4px 0;
  font-weight: 500;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #909399;
  margin: 0;
}
</style>
