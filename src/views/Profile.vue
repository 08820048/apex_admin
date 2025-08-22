<template>
  <div class="profile">
    <div class="page-header">
      <h1>个人信息</h1>
    </div>
    
    <div class="profile-container" v-loading="loading">
      <el-card class="profile-card">
        <template #header>
          <span>基本信息</span>
        </template>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="profile-form"
        >
          <el-form-item label="用户名">
            <el-input v-model="form.username" disabled />
          </el-form-item>
          
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="form.nickname"
              placeholder="请输入昵称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱"
              type="email"
            />
          </el-form-item>
          
          <el-form-item label="个人简介">
            <el-input
              v-model="form.bio"
              type="textarea"
              :rows="4"
              placeholder="请输入个人简介"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSave" :loading="saving">
              保存修改
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <el-card class="password-card">
        <template #header>
          <span>修改密码</span>
        </template>
        
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-width="100px"
          class="password-form"
        >
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="请输入当前密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userOperations, passwordUtils } from '@/api/user'

const userStore = useUserStore()
const formRef = ref()
const passwordFormRef = ref()
const saving = ref(false)
const changingPassword = ref(false)
const loading = ref(false)

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  bio: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度为6-50位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        const strengthCheck = passwordUtils.validatePasswordStrength(value)
        if (!strengthCheck.isValid) {
          callback(new Error(strengthCheck.messages[0] || '密码强度不足'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载用户信息
const loadUserProfile = async () => {
  loading.value = true
  try {
    await userOperations.getUserProfileSafely(
      (userData) => {
        // 更新表单数据
        Object.assign(form, {
          username: userData.username || '',
          nickname: userData.nickname || '',
          email: userData.email || '',
          bio: userData.bio || ''
        })

        // 更新用户store
        userStore.updateUserInfo(userData)
      },
      (error) => {
        console.error('获取用户信息失败:', error)
        ElMessage.error('获取用户信息失败')
      }
    )
  } finally {
    loading.value = false
  }
}

// 初始化表单数据（从本地存储）
const initForm = () => {
  if (userStore.userInfo) {
    Object.assign(form, {
      username: userStore.userInfo.username || '',
      nickname: userStore.userInfo.nickname || '',
      email: userStore.userInfo.email || '',
      bio: userStore.userInfo.bio || ''
    })
  }
}

// 保存个人信息
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 这里应该调用更新用户信息的API
    // 暂时只更新本地状态
    userStore.updateUserInfo(form)
    ElMessage.success('个人信息更新成功')
    
  } catch (error) {
    console.error('保存个人信息失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 重置表单
const handleReset = () => {
  initForm()
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true

    // 使用安全的密码修改操作
    await userOperations.changePasswordSafely(
      passwordForm,
      (response) => {
        ElMessage.success('密码修改成功，即将跳转到登录页')

        // 重置密码表单
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        passwordFormRef.value?.resetFields()
      },
      (error) => {
        console.error('修改密码失败:', error)
        ElMessage.error(error.message || '修改密码失败，请重试')
      }
    )

  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    changingPassword.value = false
  }
}

onMounted(() => {
  // 先从本地存储初始化，然后从服务器加载最新数据
  initForm()
  loadUserProfile()
})
</script>

<style scoped>
.profile {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  color: #303133;
}

.profile-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 1200px;
}

.profile-card,
.password-card {
  height: fit-content;
}

.profile-form,
.password-form {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
  }
}
</style>
