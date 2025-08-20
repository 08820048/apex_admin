import api from './config'

export const uploadApi = {
  // 上传文章封面
  uploadCover(file) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/admin/upload/cover', formData)
  },

  // 上传用户头像
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/admin/upload/avatar', formData)
  },

  // 通用图片上传
  uploadImage(file, folder = 'images') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return api.post('/admin/upload/image', formData)
  },

  // 删除文件
  deleteFile(url) {
    return api.delete('/admin/upload/file', {
      params: { url }
    })
  }
}
