<template>
  <div class="article-list">
    <div class="page-header">
      <h1>文章管理</h1>
      <el-button type="primary" @click="$router.push('/articles/new')">
        <el-icon><Plus /></el-icon>
        新建文章
      </el-button>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="filters">
      <el-form :model="searchForm" inline>
        <el-form-item label="标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入文章标题"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择分类" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 文章表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="articles"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="article-title">
              <span>{{ row.title }}</span>
              <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            {{ row.category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">
              {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row.id)">编辑</el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              size="small"
              type="success"
              @click="handlePublish(row.id)"
            >
              发布
            </el-button>
            <el-button
              v-else
              size="small"
              type="warning"
              @click="handleUnpublish(row.id)"
            >
              取消发布
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { articleApi } from '@/api/article'
import { categoryApi } from '@/api/category'

const router = useRouter()

const loading = ref(false)
const articles = ref([])
const selectedArticles = ref([])
const categories = ref([])

const searchForm = reactive({
  title: '',
  status: '',
  categoryId: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page - 1, // 后端从0开始
      size: pagination.size,
      ...searchForm
    }
    
    const response = await articleApi.getList(params)
    articles.value = response.data.content
    pagination.total = response.data.totalElements
  } catch (error) {
    console.error('加载文章列表失败:', error)
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadArticles()
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await categoryApi.getList()
    categories.value = response.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 重置
const handleReset = () => {
  searchForm.title = ''
  searchForm.status = ''
  searchForm.categoryId = ''
  pagination.page = 1
  loadArticles()
}

// 编辑文章
const handleEdit = (id) => {
  router.push(`/articles/${id}/edit`)
}

// 发布文章
const handlePublish = async (id) => {
  try {
    await articleApi.publish(id)
    ElMessage.success('文章发布成功')
    loadArticles()
  } catch (error) {
    console.error('发布文章失败:', error)
  }
}

// 取消发布
const handleUnpublish = async (id) => {
  try {
    await articleApi.unpublish(id)
    ElMessage.success('取消发布成功')
    loadArticles()
  } catch (error) {
    console.error('取消发布失败:', error)
  }
}

// 删除文章
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await articleApi.delete(id)
    ElMessage.success('删除成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
    }
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedArticles.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadArticles()
}

// 页码变化
const handleCurrentChange = (page) => {
  pagination.page = page
  loadArticles()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadArticles()
  loadCategories()
})
</script>

<style scoped>
.article-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  color: #303133;
}

.filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
