<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img src="https://api.minio.xindu.site/blog.cnkj.site/backup/logo-zark.png" alt="Logo" class="h-8 mr-3 object-contain">
            <h1 class="text-xl font-bold text-gray-900">上传图片</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              首页
            </router-link>
            <router-link to="/gallery" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              图片画廊
            </router-link>
            <router-link v-if="authStore.isAuthenticated" to="/upload" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              上传图片
            </router-link>
            <router-link v-if="authStore.isAuthenticated" to="/image-management" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              图片管理
            </router-link>
            <div v-if="authStore.isAuthenticated" class="flex items-center space-x-3">
              <el-dropdown>
                <span class="el-dropdown-link flex items-center space-x-2 cursor-pointer">
                  <el-avatar :size="32" :src="authStore.currentUser?.avatar || ''">
                    {{ (authStore.currentUser?.nickname || authStore.currentUser?.username)?.charAt(0) }}
                  </el-avatar>
                  <span class="text-sm font-medium">{{ authStore.currentUser?.nickname || authStore.currentUser?.username }}</span>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="$router.push('/user')">
                      <el-icon><User /></el-icon>
                      用户中心
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div v-else class="flex items-center space-x-2">
              <router-link to="/login" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                登录
              </router-link>
              <router-link to="/register" class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                注册
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 上传区域 -->
      <div class="bg-white rounded-lg shadow-sm p-8 mb-8">
        <el-upload
          class="upload-demo"
          drag
          multiple
          :action="uploadUrl"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :file-list="fileList"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 jpg/png/gif/svg 格式文件，单个文件不超过 10MB
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 上传历史 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">最近上传</h3>
        <div v-if="recentUploads.length === 0" class="text-center py-8 text-gray-500">
          暂无上传记录
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="image in recentUploads" :key="image.id" class="group relative">
            <img :src="image.url" :alt="image.name" class="w-full h-24 object-cover rounded-lg">
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <div class="flex space-x-2">
                <el-button size="small" type="primary" @click="copyUrl(image.url)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click="deleteImage(image.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <p class="text-xs text-gray-600 truncate mt-1">{{ image.name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, CopyDocument, Delete, User, SwitchButton } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const fileList = ref([])
const recentUploads = ref([])

const uploadUrl = computed(() => '/api/images/upload')
const uploadHeaders = computed(() => {
  // 匿名访问不需要token
  if (authStore.token) {
    return {
      Authorization: `Bearer ${authStore.token}`
    }
  }
  return {}
})

const beforeUpload = (file) => {
  const isImage = /\.(jpg|jpeg|png|gif|svg)$/i.test(file.name)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response, file) => {
  ElMessage.success(`${file.name} 上传成功`)
  // 添加到最近上传列表
  recentUploads.value.unshift({
    id: response.image.id,
    name: file.name,
    url: response.image.url,
    timestamp: new Date()
  })
}

const handleUploadError = (error, file) => {
  let errorMessage = `${file.name} 上传失败`
  
  if (error.response) {
    // 服务器返回的错误
    const status = error.response.status
    switch (status) {
      case 401:
        errorMessage = '未授权，请重新登录'
        authStore.logout()
        break
      case 413:
        errorMessage = '文件过大，请选择小于10MB的文件'
        break
      case 415:
        errorMessage = '不支持的文件格式'
        break
      case 500:
        errorMessage = '服务器内部错误，请稍后重试'
        break
      default:
        errorMessage = error.response.data?.message || errorMessage
    }
  } else if (error.request) {
    // 网络错误
    errorMessage = '网络连接失败，请检查网络设置'
  }
  
  ElMessage.error(errorMessage)
  console.error('Upload error:', error)
}

const copyUrl = async (url) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const deleteImage = async (imageId) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用删除API
    const response = await fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    })
    
    if (response.ok) {
      recentUploads.value = recentUploads.value.filter(img => img.id !== imageId)
      ElMessage.success('图片删除成功')
    } else {
      throw new Error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    authStore.logout()
    ElMessage.success('已退出登录')
  } catch (error) {
    // 用户取消操作
  }
}

// 加载最近上传记录
onMounted(async () => {
  try {
    const response = await fetch('/api/images')
    
    if (response.ok) {
      const data = await response.json()
      recentUploads.value = data.images || []
    } else {
      // 如果API不可用，使用模拟数据
      recentUploads.value = []
    }
  } catch (error) {
    console.warn('获取上传记录失败:', error)
    recentUploads.value = []
  }
})
</script>