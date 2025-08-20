/**
 * 图片处理工具函数
 * 根据前端开发指南的最佳实践实现
 */

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度，默认1920
 * @param {number} quality - 压缩质量，默认0.8
 * @returns {Promise<Blob>} 压缩后的图片Blob
 */
export function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(resolve, 'image/jpeg', quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 获取图片尺寸
 * @param {File} file - 图片文件
 * @returns {Promise<{width: number, height: number}>} 图片尺寸
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      reject(new Error('无法读取图片尺寸'))
      URL.revokeObjectURL(img.src)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 验证图片文件
 * @param {File} file - 图片文件
 * @param {Object} options - 验证选项
 * @returns {Promise<boolean>} 验证结果
 */
export async function validateImage(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxWidth = null,
    maxHeight = null,
    minWidth = null,
    minHeight = null
  } = options

  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`文件类型不支持，只支持 ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join('、')} 格式`)
  }

  // 检查文件大小
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    throw new Error(`文件大小不能超过 ${maxSizeMB}MB`)
  }

  // 检查图片尺寸（如果指定了尺寸限制）
  if (maxWidth || maxHeight || minWidth || minHeight) {
    try {
      const dimensions = await getImageDimensions(file)
      
      if (maxWidth && dimensions.width > maxWidth) {
        throw new Error(`图片宽度不能超过 ${maxWidth}px`)
      }
      
      if (maxHeight && dimensions.height > maxHeight) {
        throw new Error(`图片高度不能超过 ${maxHeight}px`)
      }
      
      if (minWidth && dimensions.width < minWidth) {
        throw new Error(`图片宽度不能小于 ${minWidth}px`)
      }
      
      if (minHeight && dimensions.height < minHeight) {
        throw new Error(`图片高度不能小于 ${minHeight}px`)
      }
    } catch (error) {
      if (error.message.includes('无法读取')) {
        throw new Error('图片文件损坏或格式不正确')
      }
      throw error
    }
  }

  return true
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 创建图片预览URL
 * @param {File} file - 图片文件
 * @returns {string} 预览URL
 */
export function createImagePreview(file) {
  return URL.createObjectURL(file)
}

/**
 * 释放图片预览URL
 * @param {string} url - 预览URL
 */
export function revokeImagePreview(url) {
  URL.revokeObjectURL(url)
}

/**
 * 检查浏览器是否支持WebP格式
 * @returns {Promise<boolean>} 是否支持WebP
 */
export function checkWebPSupport() {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * 将图片转换为WebP格式（如果浏览器支持）
 * @param {File} file - 原始图片文件
 * @param {number} quality - 压缩质量，默认0.8
 * @returns {Promise<Blob>} 转换后的图片Blob
 */
export async function convertToWebP(file, quality = 0.8) {
  const isWebPSupported = await checkWebPSupport()
  
  if (!isWebPSupported) {
    // 如果不支持WebP，返回原文件
    return file
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(resolve, 'image/webp', quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 生成图片缩略图
 * @param {File} file - 原始图片文件
 * @param {number} size - 缩略图尺寸，默认200
 * @returns {Promise<Blob>} 缩略图Blob
 */
export function generateThumbnail(file, size = 200) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 计算缩略图尺寸，保持宽高比
      const { width, height } = img
      let newWidth, newHeight
      
      if (width > height) {
        newWidth = size
        newHeight = (height * size) / width
      } else {
        newHeight = size
        newWidth = (width * size) / height
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    }

    img.src = URL.createObjectURL(file)
  })
}
