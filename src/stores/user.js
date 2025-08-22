import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(localStorage.getItem('admin_token') || '')
  const userInfo = ref(null)

  // 检查token是否有效
  const isTokenValid = () => {
    if (!token.value) return false

    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const expTime = payload.exp * 1000
      return Date.now() < expTime
    } catch {
      return false
    }
  }

  // 计算属性 - 检查是否真正登录（token存在且有效）
  const isLoggedIn = computed(() => !!token.value && isTokenValid())

  // 登录
  const login = (loginData) => {
    token.value = loginData.token
    userInfo.value = loginData.userInfo
    localStorage.setItem('admin_token', loginData.token)
    if (loginData.userInfo) {
      localStorage.setItem('admin_user', JSON.stringify(loginData.userInfo))
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  // 初始化用户信息
  const initUserInfo = () => {
    // 首先检查token是否有效
    if (!isTokenValid()) {
      // token无效，清理所有数据
      logout()
      return
    }

    const savedUser = localStorage.getItem('admin_user')
    if (savedUser) {
      try {
        userInfo.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        logout()
      }
    }
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo) => {
    userInfo.value = { ...userInfo.value, ...newUserInfo }
    localStorage.setItem('admin_user', JSON.stringify(userInfo.value))
  }

  // 初始化
  initUserInfo()

  return {
    token,
    userInfo,
    isLoggedIn,
    isTokenValid,
    login,
    logout,
    updateUserInfo
  }
})
