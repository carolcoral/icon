<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">重置密码</h2>
        <p class="mt-2 text-sm text-gray-600">
          输入您的邮箱地址，我们将发送重置链接
        </p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="forgotForm" class="mt-8 space-y-6">
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="请输入注册邮箱"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ loading ? '发送中...' : '发送重置链接' }}
        </el-button>
      </el-form>
      
      <div class="text-center space-y-2">
        <router-link to="/login" class="block text-sm text-blue-600 hover:text-blue-500">
          返回登录
        </router-link>
        <router-link to="/" class="block text-sm text-gray-600 hover:text-gray-500">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Message } from '@element-plus/icons-vue'

const forgotForm = ref()
const loading = ref(false)
const form = reactive({
  email: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!forgotForm.value) return
  
  try {
    await forgotForm.value.validate()
    loading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage.success('重置链接已发送到您的邮箱')
    form.email = ''
  } catch (error) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>