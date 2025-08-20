<template>
  <div class="image-upload">
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
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 上传前验证
const beforeUpload = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  // 检查文件大小 (5MB)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }

  // 开始上传
  uploading.value = true
  
  // 使用自定义上传
  handleCustomUpload(file)
  return false // 阻止默认上传
}

// 自定义上传处理
const handleCustomUpload = async (file) => {
  try {
    let response
    
    // 根据上传类型选择对应的API
    switch (props.uploadType) {
      case 'cover':
        response = await uploadApi.uploadCover(file)
        break
      case 'avatar':
        response = await uploadApi.uploadAvatar(file)
        break
      case 'image':
        response = await uploadApi.uploadImage(file)
        break
      default:
        throw new Error('不支持的上传类型')
    }

    if (response.data.code === 200) {
      const url = response.data.data.url
      imageUrl.value = url
      ElMessage.success('上传成功')
      emit('success', response.data.data)
    } else {
      throw new Error(response.data.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
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
      // 如果需要删除服务器上的文件，可以调用删除API
      // await uploadApi.deleteFile(imageUrl.value)
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
  height: v-bind(height);
}

.image-upload :deep(.el-upload) {
  width: 100%;
  height: 100%;
}

.image-upload :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
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

.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 6px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
