import api from './config'

export const uploadApi = {
  // 上传文章封面
  uploadCover(file) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/admin/upload/cover', formData, {
      headers: {
        'Content-Type': undefined  // 必须设置为undefined来覆盖axios默认的application/json
      }
    })
  },


  // 上传用户头像
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/admin/upload/avatar', formData, {
      headers: {
        'Content-Type': undefined
      }
    })
  },

  // 通用图片上传
  uploadImage(file, folder = 'images') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return api.post('/admin/upload/image', formData, {
      headers: {
        'Content-Type': undefined
      }
    })
  },

  // 删除文件
  deleteFile(fileUrl) {
    return api.delete('/admin/upload/file', {
      params: { url: fileUrl }
    })
  }
}
