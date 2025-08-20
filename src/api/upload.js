import api from './config'

export const uploadApi = {
  // 上传文章封面
  uploadCover(file) {
    const formData = new FormData()
    formData.append('file', file)

    // 创建新的配置，明确删除Content-Type
    const config = {
      headers: {
        ...api.defaults.headers.common,
        'Content-Type': undefined
      }
    }

    // 删除可能存在的Content-Type
    delete config.headers['Content-Type']
    delete config.headers['content-type']

    return api.post('/admin/upload/cover', formData, config)
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
