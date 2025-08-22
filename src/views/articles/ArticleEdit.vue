<template>
  <div class="article-edit" v-loading="permissionChecking" element-loading-text="正在验证权限...">
    <div v-if="!permissionChecking" class="page-header">
      <h1>{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
      <div class="header-actions">
        <el-button @click="$router.back()">返回</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
        <el-button
          v-if="!isEdit || form.status === 'DRAFT'"
          type="success"
          @click="handlePublish"
          :loading="publishing"
        >
          发布
        </el-button>
      </div>
    </div>

    <div v-if="!permissionChecking" class="edit-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="article-form"
      >
        <el-row :gutter="20">
          <el-col :span="16">
            <!-- 基本信息 -->
            <el-card class="form-card">
              <template #header>
                <span>基本信息</span>
              </template>
              
              <el-form-item label="文章标题" prop="title">
                <el-input
                  v-model="form.title"
                  placeholder="请输入文章标题"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="文章摘要" prop="summary">
                <el-input
                  v-model="form.summary"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入文章摘要"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="文章内容" prop="content">
                <MarkdownEditor
                  v-model="form.content"
                  height="500px"
                />
              </el-form-item>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <!-- 发布设置 -->
            <el-card class="form-card">
              <template #header>
                <span>发布设置</span>
              </template>
              
              <el-form-item label="文章分类">
                <el-select
                  v-model="form.categoryId"
                  placeholder="请选择分类"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="文章标签">
                <el-select
                  v-model="form.tagNames"
                  multiple
                  filterable
                  allow-create
                  placeholder="请选择或输入标签"
                  style="width: 100%"
                >
                  <el-option
                    v-for="tag in tags"
                    :key="tag.id"
                    :label="tag.name"
                    :value="tag.name"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="封面图片">
                <ImageUploadNew
                  v-model="form.coverImage"
                  upload-type="cover"
                  :max-size="5 * 1024 * 1024"
                  :min-width="400"
                  :min-height="200"
                  @upload-success="handleCoverUploadSuccess"
                  @upload-error="handleCoverUploadError"
                />
              </el-form-item>
              
              <el-form-item label="置顶">
                <el-switch v-model="form.isTop" />
              </el-form-item>
              
              <el-form-item label="状态">
                <el-radio-group v-model="form.status">
                  <el-radio label="DRAFT">草稿</el-radio>
                  <el-radio label="PUBLISHED">已发布</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-card>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { articleApi } from '@/api/article'
import { categoryApi } from '@/api/category'
import { tagApi } from '@/api/tag'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ImageUploadNew from '@/components/ImageUploadNew.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const saving = ref(false)
const publishing = ref(false)
const permissionChecking = ref(true)
const categories = ref([])
const tags = ref([])

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  categoryId: null,
  status: 'DRAFT',
  isTop: false,
  tagNames: []
})

const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { max: 200, message: '标题长度不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
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

// 加载标签列表
const loadTags = async () => {
  try {
    const response = await tagApi.getList()
    tags.value = response.data
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

// 加载文章详情
const loadArticle = async () => {
  if (!isEdit.value) return

  // 检查权限
  if (!checkPermission()) {
    return
  }

  try {
    const response = await articleApi.getDetail(route.params.id)
    const article = response.data

    Object.assign(form, {
      title: article.title,
      summary: article.summary || '',
      content: article.content,
      coverImage: article.coverImage || '',
      categoryId: article.category?.id || article.categoryId,
      status: article.status,
      isTop: article.isTop || false,
      tagNames: article.tags?.map(tag => tag.name) || []
    })
  } catch (error) {
    console.error('加载文章详情失败:', error)

    // 检查是否是权限错误
    if (error.response?.status === 403) {
      ElMessage.error('权限不足，无法访问此文章')
      router.push('/articles')
    } else if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logout()
      router.push('/login')
    } else {
      ElMessage.error('加载文章详情失败')
      router.back()
    }
  }
}

// 保存文章
const handleSave = async () => {
  if (!formRef.value) return

  // 检查权限
  if (!checkPermission()) {
    return
  }

  try {
    await formRef.value.validate()
    saving.value = true

    if (isEdit.value) {
      await articleApi.update(route.params.id, form)
      ElMessage.success('文章更新成功')
    } else {
      await articleApi.create(form)
      ElMessage.success('文章创建成功')
      router.push('/articles')
    }
  } catch (error) {
    console.error('保存文章失败:', error)

    // 检查是否是权限错误
    if (error.response?.status === 403) {
      ElMessage.error('权限不足，无法保存文章')
    } else if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logout()
      router.push('/login')
    } else {
      ElMessage.error('保存文章失败')
    }
  } finally {
    saving.value = false
  }
}

// 发布文章
const handlePublish = async () => {
  if (!formRef.value) return

  // 检查权限
  if (!checkPermission()) {
    return
  }

  try {
    await formRef.value.validate()
    publishing.value = true

    form.status = 'PUBLISHED'

    if (isEdit.value) {
      await articleApi.update(route.params.id, form)
    } else {
      await articleApi.create(form)
    }

    ElMessage.success('文章发布成功')
    router.push('/articles')
  } catch (error) {
    console.error('发布文章失败:', error)

    // 检查是否是权限错误
    if (error.response?.status === 403) {
      ElMessage.error('权限不足，无法发布文章')
    } else if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logout()
      router.push('/login')
    } else {
      ElMessage.error('发布文章失败')
    }
  } finally {
    publishing.value = false
  }
}

// 封面上传成功处理
const handleCoverUploadSuccess = (data) => {
  console.log('封面上传成功:', data)
  form.coverImage = data.url
  ElMessage.success(`封面上传成功！原始大小: ${data.originalSize ? Math.round(data.originalSize / 1024) + 'KB' : '未知'}`)
}

// 封面上传失败处理
const handleCoverUploadError = (error) => {
  console.error('封面上传失败:', error)
  ElMessage.error(`封面上传失败: ${error.message || '未知错误'}`)
}

// 权限检查
const checkPermission = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.error('请先登录')
    router.push('/login')
    return false
  }

  if (!userStore.isTokenValid()) {
    ElMessage.error('登录已过期，请重新登录')
    userStore.logout()
    router.push('/login')
    return false
  }

  return true
}

// 在组件挂载前检查权限
onBeforeMount(() => {
  if (!checkPermission()) {
    permissionChecking.value = false
    return
  }
})

onMounted(async () => {
  try {
    // 再次检查权限（双重保险）
    if (!checkPermission()) {
      return
    }

    // 并行加载数据
    await Promise.all([
      loadCategories(),
      loadTags(),
      loadArticle()
    ])
  } finally {
    // 无论成功还是失败，都要停止权限检查状态
    permissionChecking.value = false
  }
})
</script>

<style scoped>
.article-edit {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.edit-container {
  background: #f5f5f5;
}

.form-card {
  margin-bottom: 20px;
}

.article-form {
  background: transparent;
}
</style>
