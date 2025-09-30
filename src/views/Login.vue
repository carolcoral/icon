<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">用户登录</h2>
        <p class="mt-2 text-sm text-gray-600">
          或 <router-link to="/register" class="text-blue-600 hover:text-blue-500">注册新账户</router-link>
        </p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="loginForm" class="mt-8 space-y-6">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <div class="flex items-center justify-between">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
          <router-link to="/forgot-password" class="text-sm text-blue-600 hover:text-blue-500">忘记密码？</router-link>
        </div>
        
        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form>
      
      <div class="text-center">
        <router-link to="/" class="text-sm text-gray-600 hover:text-gray-500">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const loginForm = ref()

const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginForm.value) return
  
  try {
    await loginForm.value.validate()
    loading.value = true
    
    await authStore.login({
      username: form.username,
      password: form.password
    })
    
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>