import axios from 'axios'
import { ElMessage } from 'element-plus'

// 获取API基础URL
const getBaseURL = () => {
  // 检查是否在同一域名下
  if (window.location.hostname === 'admin.ilikexff.cn') {
    // 如果前端在admin.ilikexff.cn，API在ilikexff.cn，使用完整URL
    return 'https://ilikexff.cn/api'
  }

  // 生产环境使用环境变量中的API地址
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://ilikexff.cn/api'
  }

  // 开发环境使用代理
  return '/api'
}

// 创建axios实例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,  // 增加到60秒，适应文件上传需求
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  config => {
    console.log('=== 请求拦截器 ===')
    console.log('请求配置:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data instanceof FormData ? 'FormData' : config.data
    })

    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('已添加Authorization token')
    } else {
      console.log('未找到admin_token')
    }

    console.log('最终请求headers:', config.headers)
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
  response => {
    console.log('=== 响应拦截器 ===')
    console.log('响应状态:', response.status)
    console.log('响应headers:', response.headers)
    console.log('响应数据:', response.data)

    const { data } = response

    // 检查业务状态码
    if (data.code === 200) {
      console.log('业务状态码200，返回数据')
      return data
    } else {
      console.log('业务状态码非200:', data.code, data.message)
      // 业务错误
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  error => {
    console.error('响应错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // token过期或无效，跳转到登录页
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.request) {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      // 其他错误
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default api
