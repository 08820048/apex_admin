import api from './config'
import { ElMessage } from 'element-plus'

export const authApi = {
  // 管理员登录
  login: (credentials) => {
    return api.post('/auth/login', credentials)
  }
}

/**
 * 认证辅助函数
 */
export const authUtils = {
  /**
   * 检查是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn: () => {
    const token = localStorage.getItem('admin_token')
    return !!token && !authUtils.isTokenExpired()
  },

  /**
   * 检查token是否过期
   * @returns {boolean} 是否过期
   */
  isTokenExpired: () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expTime = payload.exp * 1000
      return Date.now() >= expTime
    } catch {
      return true
    }
  },

  /**
   * 检查token是否即将过期
   * @param {number} minutes 提前多少分钟提醒，默认5分钟
   * @returns {boolean} 是否即将过期
   */
  isTokenExpiringSoon: (minutes = 5) => {
    const token = localStorage.getItem('admin_token')
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expTime = payload.exp * 1000
      const now = Date.now()
      return (expTime - now) < minutes * 60 * 1000
    } catch {
      return true
    }
  },

  /**
   * 获取token剩余时间
   * @returns {number} 剩余时间（毫秒）
   */
  getTokenRemainingTime: () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return 0

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expTime = payload.exp * 1000
      const remaining = expTime - Date.now()
      return Math.max(0, remaining)
    } catch {
      return 0
    }
  },

  /**
   * 格式化剩余时间显示
   * @returns {string} 格式化的时间字符串
   */
  formatRemainingTime: () => {
    const remaining = authUtils.getTokenRemainingTime()
    if (remaining <= 0) return '已过期'

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  },

  /**
   * 清除认证信息
   */
  clearAuth: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  },

  /**
   * 保存登录信息
   * @param {Object} loginResponse 登录响应数据
   */
  saveLoginInfo: (loginResponse) => {
    if (loginResponse.data?.token) {
      localStorage.setItem('admin_token', loginResponse.data.token)
    }
    if (loginResponse.data?.user) {
      localStorage.setItem('admin_user', JSON.stringify(loginResponse.data.user))
    }
  },

  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息
   */
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('admin_user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }
}

/**
 * 认证操作函数
 */
export const authOperations = {
  /**
   * 安全登录
   * @param {Object} credentials 登录凭据
   * @param {Function} onSuccess 成功回调
   * @param {Function} onError 错误回调
   */
  loginSafely: async (credentials, onSuccess, onError) => {
    try {
      // 基本验证
      if (!credentials.username || !credentials.password) {
        throw new Error('用户名和密码不能为空')
      }

      const response = await authApi.login(credentials)

      if (response.code === 200) {
        // 保存登录信息
        authUtils.saveLoginInfo(response)

        ElMessage.success('登录成功')
        onSuccess?.(response.data)
      }
    } catch (error) {
      ElMessage.error(error.message || '登录失败')
      onError?.(error)
    }
  },

  /**
   * 安全登出
   * @param {Function} onComplete 完成回调
   */
  logoutSafely: (onComplete) => {
    try {
      // 清除本地存储
      authUtils.clearAuth()

      ElMessage.success('已安全退出')

      // 跳转到登录页
      setTimeout(() => {
        window.location.href = '/login'
        onComplete?.()
      }, 1000)
    } catch (error) {
      console.error('登出过程中发生错误:', error)
      // 即使出错也要清除本地数据并跳转
      authUtils.clearAuth()
      window.location.href = '/login'
      onComplete?.()
    }
  },

  /**
   * 检查认证状态
   * @param {Function} onValid 有效回调
   * @param {Function} onInvalid 无效回调
   */
  checkAuthStatus: (onValid, onInvalid) => {
    if (authUtils.isLoggedIn()) {
      if (authUtils.isTokenExpiringSoon()) {
        ElMessage.warning('登录即将过期，请及时保存数据')
      }
      onValid?.()
    } else {
      ElMessage.error('登录已过期，请重新登录')
      authUtils.clearAuth()
      onInvalid?.()
    }
  }
}

export default authApi
