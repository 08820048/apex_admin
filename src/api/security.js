import api from './config'

/**
 * 安全监控API
 * 🔒 所有接口都需要ADMIN角色权限
 */
export const securityApi = {
  /**
   * 获取安全统计信息
   * @returns {Promise} 安全统计数据
   */
  getStats: () => {
    return api.get('/admin/security/stats')
  },

  /**
   * 清理安全记录
   * @returns {Promise} 操作结果
   */
  cleanup: () => {
    return api.post('/admin/security/cleanup')
  }
}

/**
 * 安全监控辅助函数
 */
export const securityUtils = {
  /**
   * 格式化安全统计数据
   * @param {Object} stats 原始统计数据
   * @returns {Object} 格式化后的数据
   */
  formatSecurityStats: (stats) => {
    return {
      suspiciousIpCount: stats.suspiciousIpCount || 0,
      maliciousRequestCount: stats.maliciousRequestCount || stats.totalMaliciousRequests || 0,
      highRiskIpCount: stats.highRiskIpCount || 0,
      lastCleanupTime: stats.lastCleanupTime || null,
      // 计算风险等级
      riskLevel: securityUtils.calculateRiskLevel(stats)
    }
  },

  /**
   * 计算风险等级
   * @param {Object} stats 统计数据
   * @returns {string} 风险等级
   */
  calculateRiskLevel: (stats) => {
    const suspicious = stats.suspiciousIpCount || 0
    const malicious = stats.maliciousRequestCount || stats.totalMaliciousRequests || 0
    const highRisk = stats.highRiskIpCount || 0

    const totalRisk = suspicious + malicious * 2 + highRisk * 3

    if (totalRisk === 0) return 'low'
    if (totalRisk <= 5) return 'medium'
    return 'high'
  },

  /**
   * 获取风险等级显示信息
   * @param {string} level 风险等级
   * @returns {Object} 显示信息
   */
  getRiskLevelInfo: (level) => {
    const levelMap = {
      low: {
        text: '低风险',
        color: 'success',
        icon: 'SuccessFilled',
        description: '系统安全状态良好'
      },
      medium: {
        text: '中等风险',
        color: 'warning',
        icon: 'WarningFilled',
        description: '发现少量可疑活动，建议关注'
      },
      high: {
        text: '高风险',
        color: 'danger',
        icon: 'CircleCloseFilled',
        description: '发现大量可疑活动，建议立即处理'
      }
    }

    return levelMap[level] || levelMap.low
  },

  /**
   * 格式化时间显示
   * @param {string} timeString 时间字符串
   * @returns {string} 格式化后的时间
   */
  formatTime: (timeString) => {
    if (!timeString) return '暂无记录'
    
    try {
      const date = new Date(timeString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return '时间格式错误'
    }
  }
}

/**
 * 安全监控操作函数
 */
export const securityOperations = {
  /**
   * 安全获取统计信息
   * @param {Function} onSuccess 成功回调
   * @param {Function} onError 错误回调
   */
  getStatsSafely: async (onSuccess, onError) => {
    try {
      const response = await securityApi.getStats()
      if (response.code === 200) {
        const formattedStats = securityUtils.formatSecurityStats(response.data)
        onSuccess?.(formattedStats)
      }
    } catch (error) {
      onError?.(error)
    }
  },

  /**
   * 安全清理记录
   * @param {Function} onSuccess 成功回调
   * @param {Function} onError 错误回调
   * @param {Function} onConfirm 确认回调
   */
  cleanupSafely: async (onSuccess, onError, onConfirm) => {
    try {
      // 二次确认
      const confirmed = await onConfirm?.('确定要清理安全记录吗？此操作不可撤销。')
      if (!confirmed) return

      const response = await securityApi.cleanup()
      if (response.code === 200) {
        onSuccess?.(response)
      }
    } catch (error) {
      onError?.(error)
    }
  },

  /**
   * 定期刷新安全统计
   * @param {Function} updateCallback 更新回调
   * @param {number} interval 刷新间隔（毫秒）
   * @returns {Function} 清理函数
   */
  startAutoRefresh: (updateCallback, interval = 30000) => {
    const refreshStats = () => {
      securityOperations.getStatsSafely(
        updateCallback,
        (error) => console.warn('自动刷新安全统计失败:', error)
      )
    }

    // 立即执行一次
    refreshStats()

    // 设置定时器
    const timer = setInterval(refreshStats, interval)

    // 返回清理函数
    return () => clearInterval(timer)
  }
}

export default securityApi
