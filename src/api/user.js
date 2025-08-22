import api from './config'

/**
 * 用户管理API
 * 🔒 所有接口都需要ADMIN角色权限
 */
export const userApi = {
  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息
   */
  getProfile: () => {
    return api.get('/admin/user/profile')
  },

  /**
   * 修改密码
   * @param {Object} data 密码修改数据
   * @param {string} data.currentPassword 当前密码
   * @param {string} data.newPassword 新密码
   * @param {string} data.confirmPassword 确认新密码
   * @returns {Promise} 操作结果
   */
  changePassword: (data) => {
    return api.put('/admin/user/change-password', data)
  }
}

/**
 * 密码修改辅助函数
 */
export const passwordUtils = {
  /**
   * 验证密码强度
   * @param {string} password 密码
   * @returns {Object} 验证结果
   */
  validatePasswordStrength: (password) => {
    const result = {
      isValid: false,
      score: 0,
      messages: []
    }

    if (!password) {
      result.messages.push('密码不能为空')
      return result
    }

    if (password.length < 6) {
      result.messages.push('密码长度至少6位')
    } else if (password.length > 50) {
      result.messages.push('密码长度不能超过50位')
    } else {
      result.score += 1
    }

    // 检查是否包含数字
    if (/\d/.test(password)) {
      result.score += 1
    } else {
      result.messages.push('建议包含数字')
    }

    // 检查是否包含字母
    if (/[a-zA-Z]/.test(password)) {
      result.score += 1
    } else {
      result.messages.push('建议包含字母')
    }

    // 检查是否包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.score += 1
    } else {
      result.messages.push('建议包含特殊字符')
    }

    result.isValid = result.score >= 2 && password.length >= 6 && password.length <= 50

    return result
  },

  /**
   * 验证密码修改表单
   * @param {Object} formData 表单数据
   * @returns {Object} 验证结果
   */
  validatePasswordForm: (formData) => {
    const errors = {}

    if (!formData.currentPassword) {
      errors.currentPassword = '请输入当前密码'
    }

    if (!formData.newPassword) {
      errors.newPassword = '请输入新密码'
    } else {
      const strengthCheck = passwordUtils.validatePasswordStrength(formData.newPassword)
      if (!strengthCheck.isValid) {
        errors.newPassword = strengthCheck.messages[0] || '密码强度不足'
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认新密码'
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      errors.newPassword = '新密码不能与当前密码相同'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

/**
 * 用户管理操作辅助函数
 */
export const userOperations = {
  /**
   * 安全的密码修改操作
   * @param {Object} passwordData 密码数据
   * @param {Function} onSuccess 成功回调
   * @param {Function} onError 错误回调
   */
  changePasswordSafely: async (passwordData, onSuccess, onError) => {
    try {
      // 前端验证
      const validation = passwordUtils.validatePasswordForm(passwordData)
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0]
        onError?.(new Error(firstError))
        return
      }

      // 调用API
      const response = await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      })

      if (response.code === 200) {
        // 密码修改成功，清除token并跳转登录
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        
        onSuccess?.(response)
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } catch (error) {
      onError?.(error)
    }
  },

  /**
   * 获取用户信息并处理错误
   * @param {Function} onSuccess 成功回调
   * @param {Function} onError 错误回调
   */
  getUserProfileSafely: async (onSuccess, onError) => {
    try {
      const response = await userApi.getProfile()
      if (response.code === 200) {
        onSuccess?.(response.data)
      }
    } catch (error) {
      onError?.(error)
    }
  }
}

export default userApi
