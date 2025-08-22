<template>
  <div class="stats">
    <div class="page-header">
      <h1>访问统计</h1>
      <el-button @click="loadStats" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>
    
    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><View /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalVisits }}</div>
          <div class="stat-label">总访问量</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon today">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.todayVisits }}</div>
          <div class="stat-label">今日访问</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon unique">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.uniqueVisitors }}</div>
          <div class="stat-label">独立访客</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon articles">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalArticles }}</div>
          <div class="stat-label">文章总数</div>
        </div>
      </div>
    </div>

    <!-- 安全监控 -->
    <div class="security-section">
      <div class="section-header">
        <h2>安全监控</h2>
        <div class="security-actions">
          <el-button @click="loadSecurityStats" :loading="securityLoading" size="small">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button
            @click="handleSecurityCleanup"
            :loading="cleanupLoading"
            type="warning"
            size="small"
          >
            <el-icon><Delete /></el-icon>
            清理记录
          </el-button>
        </div>
      </div>

      <div class="security-overview">
        <div class="security-card" :class="securityStats.riskLevel">
          <div class="security-icon">
            <el-icon v-if="securityStats.riskLevel === 'low'"><SuccessFilled /></el-icon>
            <el-icon v-else-if="securityStats.riskLevel === 'medium'"><WarningFilled /></el-icon>
            <el-icon v-else><CircleCloseFilled /></el-icon>
          </div>
          <div class="security-content">
            <div class="security-level">{{ getRiskLevelText(securityStats.riskLevel) }}</div>
            <div class="security-desc">{{ getRiskLevelDesc(securityStats.riskLevel) }}</div>
          </div>
        </div>

        <div class="security-stats">
          <div class="security-stat-item">
            <div class="stat-number">{{ securityStats.suspiciousIpCount }}</div>
            <div class="stat-label">可疑IP</div>
          </div>
          <div class="security-stat-item">
            <div class="stat-number">{{ securityStats.maliciousRequestCount }}</div>
            <div class="stat-label">恶意请求</div>
          </div>
          <div class="security-stat-item">
            <div class="stat-number">{{ securityStats.highRiskIpCount }}</div>
            <div class="stat-label">高风险IP</div>
          </div>
        </div>
      </div>

      <div class="security-info">
        <el-text type="info" size="small">
          最后清理时间: {{ formatSecurityTime(securityStats.lastCleanupTime) }}
        </el-text>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <div class="chart-card">
        <div class="chart-header">
          <h3>最近访问趋势</h3>
        </div>
        <div class="chart-content">
          <div v-if="stats.recentVisits && stats.recentVisits.length > 0" class="visits-chart">
            <div
              v-for="visit in stats.recentVisits"
              :key="visit.date"
              class="visit-bar"
            >
              <div
                class="bar"
                :style="{ height: getBarHeight(visit.visits) + '%' }"
              ></div>
              <div class="bar-label">{{ formatShortDate(visit.date) }}</div>
              <div class="bar-value">{{ visit.visits }}</div>
            </div>
          </div>
          <div v-else class="no-data">
            暂无访问数据
          </div>
        </div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>热门页面</h3>
        </div>
        <div class="chart-content">
          <div v-if="stats.popularPages && stats.popularPages.length > 0" class="popular-pages">
            <div
              v-for="(page, index) in stats.popularPages"
              :key="page.uri"
              class="page-item"
            >
              <div class="page-rank">{{ index + 1 }}</div>
              <div class="page-info">
                <div class="page-uri">{{ page.uri }}</div>
                <div class="page-visits">{{ page.visits }} 次访问</div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            暂无页面数据
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { statsApi } from '@/api/stats'
import { securityOperations, securityUtils } from '@/api/security'

const loading = ref(false)
const securityLoading = ref(false)
const cleanupLoading = ref(false)
let securityRefreshTimer = null

const stats = ref({
  totalVisits: 0,
  todayVisits: 0,
  uniqueVisitors: 0,
  totalArticles: 0,
  recentVisits: [],
  popularPages: []
})

const securityStats = ref({
  suspiciousIpCount: 0,
  maliciousRequestCount: 0,
  highRiskIpCount: 0,
  lastCleanupTime: null,
  riskLevel: 'low'
})

// 计算柱状图高度
const getBarHeight = (visits) => {
  if (!stats.value.recentVisits || stats.value.recentVisits.length === 0) return 0
  const maxVisits = Math.max(...stats.value.recentVisits.map(v => v.visits))
  return maxVisits > 0 ? (visits / maxVisits) * 100 : 0
}

// 格式化短日期
const formatShortDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 安全监控相关函数
const getRiskLevelText = (level) => {
  const levelInfo = securityUtils.getRiskLevelInfo(level)
  return levelInfo.text
}

const getRiskLevelDesc = (level) => {
  const levelInfo = securityUtils.getRiskLevelInfo(level)
  return levelInfo.description
}

const formatSecurityTime = (timeString) => {
  return securityUtils.formatTime(timeString)
}

// 加载安全统计
const loadSecurityStats = async () => {
  securityLoading.value = true
  try {
    await securityOperations.getStatsSafely(
      (data) => {
        securityStats.value = data
      },
      (error) => {
        console.error('加载安全统计失败:', error)
        ElMessage.error('加载安全统计失败')
      }
    )
  } finally {
    securityLoading.value = false
  }
}

// 安全记录清理
const handleSecurityCleanup = async () => {
  cleanupLoading.value = true
  try {
    await securityOperations.cleanupSafely(
      (response) => {
        ElMessage.success('安全记录清理成功')
        // 重新加载统计数据
        loadSecurityStats()
      },
      (error) => {
        console.error('清理安全记录失败:', error)
        ElMessage.error('清理安全记录失败')
      },
      (message) => {
        return ElMessageBox.confirm(message, '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      }
    )
  } finally {
    cleanupLoading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  loading.value = true
  try {
    const response = await statsApi.getVisitStats()
    stats.value = response.data
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
    
    // 使用模拟数据
    stats.value = {
      totalVisits: 10000,
      todayVisits: 100,
      uniqueVisitors: 5000,
      totalArticles: 25,
      recentVisits: [
        { date: '2024-01-01', visits: 120 },
        { date: '2024-01-02', visits: 150 },
        { date: '2024-01-03', visits: 100 },
        { date: '2024-01-04', visits: 180 },
        { date: '2024-01-05', visits: 200 },
        { date: '2024-01-06', visits: 160 },
        { date: '2024-01-07', visits: 140 }
      ],
      popularPages: [
        { uri: '/articles/1', visits: 500 },
        { uri: '/articles/2', visits: 350 },
        { uri: '/about', visits: 200 },
        { uri: '/articles/3', visits: 180 },
        { uri: '/portfolio', visits: 150 }
      ]
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
  loadSecurityStats()

  // 启动安全统计自动刷新
  securityRefreshTimer = securityOperations.startAutoRefresh(
    (data) => {
      securityStats.value = data
    },
    30000 // 30秒刷新一次
  )
})

onUnmounted(() => {
  // 清理定时器
  if (securityRefreshTimer) {
    securityRefreshTimer()
  }
})
</script>

<style scoped>
.stats {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #303133;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 16px;
}

.stat-icon.total {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-icon.today {
  background: #f3e5f5;
  color: #7b1fa2;
}

.stat-icon.unique {
  background: #e8f5e8;
  color: #388e3c;
}

.stat-icon.articles {
  background: #fff3e0;
  color: #f57c00;
}

.stat-icon .el-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.charts-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.chart-header h3 {
  color: #303133;
  margin: 0;
}

.chart-content {
  padding: 20px;
}

.visits-chart {
  display: flex;
  align-items: end;
  gap: 12px;
  height: 200px;
}

.visit-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, #409eff, #79bbff);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  margin-bottom: 8px;
}

.bar-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.popular-pages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.page-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.page-info {
  flex: 1;
}

.page-uri {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.page-visits {
  font-size: 12px;
  color: #909399;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

/* 安全监控样式 */
.security-section {
  margin: 30px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  color: #303133;
  margin: 0;
}

.security-actions {
  display: flex;
  gap: 10px;
}

.security-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 15px;
}

.security-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid;
}

.security-card.low {
  background-color: #f0f9ff;
  border-color: #67c23a;
}

.security-card.medium {
  background-color: #fdf6ec;
  border-color: #e6a23c;
}

.security-card.high {
  background-color: #fef0f0;
  border-color: #f56c6c;
}

.security-icon {
  font-size: 24px;
  margin-right: 15px;
}

.security-card.low .security-icon {
  color: #67c23a;
}

.security-card.medium .security-icon {
  color: #e6a23c;
}

.security-card.high .security-icon {
  color: #f56c6c;
}

.security-level {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.security-desc {
  font-size: 14px;
  color: #606266;
}

.security-stats {
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.security-stat-item {
  flex: 1;
  text-align: center;
}

.security-stat-item .stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.security-stat-item .stat-label {
  font-size: 14px;
  color: #606266;
}

.security-info {
  text-align: center;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }

  .security-overview {
    grid-template-columns: 1fr;
  }

  .security-stats {
    flex-direction: column;
    gap: 15px;
  }

  .security-actions {
    flex-direction: column;
  }
}
</style>
