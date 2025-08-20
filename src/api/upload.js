import api from './config'
import axios from 'axios'

// 获取API基础URL
const getApiBaseURL = () => {
  if (window.location.hostname === 'admin.ilikexff.cn') {
    return 'https://ilikexff.cn/api'
  }
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://ilikexff.cn/api'
  }
  return '/api'
}

export const uploadApi = {
  // 上传文章封面
  async uploadCover(file) {
    console.log('=== uploadCover 开始 ===')

    const formData = new FormData()
    formData.append('file', file)

    console.log('FormData 内容:')
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size}bytes, ${value.type})` : value)
    }

    // 获取token
    const token = localStorage.getItem('admin_token')
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null')

    // 使用原生axios，完全绕过我们的配置
    const baseURL = getApiBaseURL()
    const url = `${baseURL}/admin/upload/cover`

    console.log('请求URL:', url)

    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
          // 不设置Content-Type，让浏览器自动处理
        },
        timeout: 60000  // 增加到60秒，因为上传到OSS可能需要更长时间
      })

      console.log('原生axios响应:', response)

      // 手动处理响应，模拟我们的拦截器逻辑
      if (response.data.code === 200) {
        return response.data
      } else {
        throw new Error(response.data.message || '上传失败')
      }
    } catch (error) {
      console.error('原生axios错误:', error)
      throw error
    }
  },


  // 上传用户头像
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      headers: {
        ...api.defaults.headers.common
      }
    }

    delete config.headers['Content-Type']
    delete config.headers['content-type']

    return api.post('/admin/upload/avatar', formData, config)
  },

  // 通用图片上传
  uploadImage(file, folder = 'images') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const config = {
      headers: {
        ...api.defaults.headers.common
      }
    }

    delete config.headers['Content-Type']
    delete config.headers['content-type']

    return api.post('/admin/upload/image', formData, config)
  },

  // 删除文件
  deleteFile(fileUrl) {
    return api.delete('/admin/upload/file', {
      params: { url: fileUrl }
    })
  }
}
