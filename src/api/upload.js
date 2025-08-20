import api from './config'

export const uploadApi = {
  // 上传文章封面
  uploadCover(file) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/admin/upload/cover', formData)
    // ✅ 不设置 Content-Type，让 axios 自动处理
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

    return api.post(`/admin/upload/image?folder=${folder}`, formData)
  },

  // 删除文件
  deleteFile(fileUrl) {
    return api.delete('/admin/upload/file', {
      params: { url: fileUrl }
    })
  }
}
