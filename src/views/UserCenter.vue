<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img src="https://api.minio.xindu.site/blog.cnkj.site/backup/logo-zark.png" alt="Logo" class="h-8 mr-3 object-contain">
            <h1 class="text-xl font-bold text-gray-900">用户中心</h1>
          </div>
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              首页
            </router-link>
            <router-link to="/gallery" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              图片画廊
            </router-link>
            <router-link to="/upload" class="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              上传图片
            </router-link>
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
        </div>
      </div>
    </nav>

    <!-- 头像裁剪弹窗 -->
    <el-dialog v-model="cropDialogVisible" title="头像裁剪" width="500px" :before-close="handleCropDialogClose">
      <div class="crop-container">
        <div class="crop-preview">
          <img ref="cropImageRef" :src="cropImageSrc" alt="裁剪预览" class="crop-image" />
          <div class="crop-overlay">
            <div class="crop-circle" :style="cropCircleStyle"></div>
          </div>
        </div>
        <div class="crop-tips">
          <p class="text-sm text-gray-600">拖动图片调整位置，滚轮缩放图片，裁剪框固定不动</p>
          <p class="text-xs text-gray-500 mt-1">当前缩放: {{ (cropData.scale * 100).toFixed(0) }}%</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleCropDialogClose">取消</el-button>
        <el-button type="primary" @click="handleCropConfirm">确认裁剪</el-button>
      </template>
    </el-dialog>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid md:grid-cols-4 gap-8">
        <!-- 侧边栏 -->
        <div class="md:col-span-1">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="text-center mb-6">
              <el-avatar :size="80" :src="authStore.currentUser?.avatar || ''" class="mb-4">
                {{ (authStore.currentUser?.nickname || authStore.currentUser?.username)?.charAt(0) }}
              </el-avatar>
              <h3 class="text-lg font-semibold">{{ authStore.currentUser?.nickname || authStore.currentUser?.username }}</h3>
              <p class="text-sm text-gray-600">{{ authStore.currentUser?.email }}</p>
            </div>
            
            <el-menu :default-active="activeTab" class="border-0">
              <el-menu-item index="profile" @click="activeTab = 'profile'">
                <el-icon><User /></el-icon>
                <span>个人信息</span>
              </el-menu-item>
              <el-menu-item index="image-management" @click="$router.push('/image-management')">
                <el-icon><Picture /></el-icon>
                <span>图片管理</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.currentUser?.role === 'admin'" index="user-management" @click="$router.push('/user-management')">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
              <el-menu-item index="storage" @click="activeTab = 'storage'">
                <el-icon><Folder /></el-icon>
                <span>存储设置</span>
              </el-menu-item>
              <el-menu-item index="security" @click="activeTab = 'security'">
                <el-icon><Lock /></el-icon>
                <span>安全设置</span>
              </el-menu-item>
            </el-menu>
          </div>
        </div>

        <!-- 主要内容 -->
        <div class="md:col-span-3">
          <!-- 个人信息 -->
          <div v-if="activeTab === 'profile'" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold mb-6">个人信息</h3>
            <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="100px">
              <el-form-item label="头像">
                <div class="flex items-center space-x-4">
                  <el-avatar :size="80" :src="profileForm.avatar || authStore.currentUser?.avatar || ''">
                    {{ (profileForm.nickname || profileForm.username)?.charAt(0) }}
                  </el-avatar>
                  <el-upload
                    class="avatar-uploader"
                    :show-file-list="false"
                    :before-upload="beforeAvatarUpload"
                    :http-request="handleAvatarUpload"
                    name="file"
                  >
                    <el-button type="primary">上传头像</el-button>
                  </el-upload>
                </div>
              </el-form-item>
              <el-form-item label="用户名">
                <div class="text-gray-900 py-2">{{ profileForm.username }}</div>
                <template #help>
                  <span class="text-xs text-gray-500">用户名是唯一标识，不可修改</span>
                </template>
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
                <template #help>
                  <span class="text-xs text-gray-500">昵称将在所有页面显示</span>
                </template>
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" readonly />
                <template #help>
                  <span class="text-xs text-gray-500">邮箱不可修改</span>
                </template>
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updateProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 存储设置 -->
          <div v-if="activeTab === 'storage'" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold mb-6">存储设置</h3>
            <div class="space-y-6">
              <div>
                <h4 class="font-medium mb-3">存储路径规则</h4>
                <el-radio-group v-model="storageRule">
                  <el-radio label="uuid">UUID规则</el-radio>
                  <el-radio label="md5">MD5规则</el-radio>
                  <el-radio label="date">日期规则</el-radio>
                  <el-radio label="original">原始文件名</el-radio>
                </el-radio-group>
                <p class="text-sm text-gray-600 mt-2">
                  选择图片存储时的路径生成规则，影响文件组织结构
                </p>
              </div>
              
              <div>
                <h4 class="font-medium mb-3">存储统计</h4>
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div class="p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">156</div>
                    <div class="text-sm text-gray-600">图片数量</div>
                  </div>
                  <div class="p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">45.2MB</div>
                    <div class="text-sm text-gray-600">存储空间</div>
                  </div>
                  <div class="p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">30天</div>
                    <div class="text-sm text-gray-600">账户有效期</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 安全设置 -->
          <div v-if="activeTab === 'security'" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold mb-6">安全设置</h3>
            <div class="space-y-6">
              <div>
                <h4 class="font-medium mb-3">修改密码</h4>
                <el-form :model="passwordForm" :rules="passwordRules" ref="passwordForm" class="max-w-md">
                  <el-form-item prop="currentPassword">
                    <el-input v-model="passwordForm.currentPassword" type="password" placeholder="当前密码" show-password />
                  </el-form-item>
                  <el-form-item prop="newPassword">
                    <el-input v-model="passwordForm.newPassword" type="password" placeholder="新密码" show-password />
                  </el-form-item>
                  <el-form-item prop="confirmPassword">
                    <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="确认新密码" show-password />
                  </el-form-item>
                  <el-button type="primary" @click="changePassword">修改密码</el-button>
                </el-form>
              </div>
              
              <div>
                <h4 class="font-medium mb-3">跨域白名单</h4>
                <el-tag v-for="domain in corsWhitelist" :key="domain" class="mr-2 mb-2" closable @close="removeDomain(domain)">
                  {{ domain }}
                </el-tag>
                <div class="flex space-x-2 mt-2">
                  <el-input v-model="newDomain" placeholder="添加域名" class="flex-1" />
                  <el-button @click="addDomain">添加</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, SwitchButton, Folder, Lock, Picture } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const activeTab = ref('profile')
const cropDialogVisible = ref(false)
const cropImageRef = ref(null)
const cropImageSrc = ref('')
const cropData = reactive({
  imageX: 0,
  imageY: 0,
  scale: 1,
  isDragging: false,
  startX: 0,
  startY: 0
})

const cropCircleStyle = computed(() => ({
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  border: '2px solid #409eff',
  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none'
}))

const profileForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: ''
})

const profileFormRef = ref()

const storageRule = ref('uuid')
const corsWhitelist = ref(['https://example.com', 'https://blog.example.com'])
const newDomain = ref('')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})



const beforeAvatarUpload = (file) => {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGOrPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarUpload = async (options) => {
  const file = options.file
  const reader = new FileReader()
  
  reader.onload = (e) => {
    cropImageSrc.value = e.target.result
    cropDialogVisible.value = true
    
    // 重置裁剪数据
    cropData.imageX = 0
    cropData.imageY = 0
    cropData.scale = 1
    cropData.isDragging = false
  }
  
  reader.readAsDataURL(file)
}

const handleCropDialogClose = () => {
  cropDialogVisible.value = false
  cropImageSrc.value = ''
}

const handleCropConfirm = async () => {
  try {
    if (!cropImageSrc.value) {
      ElMessage.error('请先选择图片')
      return
    }

    // 创建Canvas进行裁剪
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 200
    canvas.height = 200

    // 创建圆形裁剪区域
    ctx.beginPath()
    ctx.arc(100, 100, 100, 0, 2 * Math.PI)
    ctx.clip()

    // 绘制图片
    const img = new Image()
    img.onload = async () => {
      // 计算裁剪区域和缩放比例
      const cropSize = 200 / cropData.scale
      const left = (img.width - cropSize) / 2 + cropData.imageX
      const top = (img.height - cropSize) / 2 + cropData.imageY
      
      ctx.drawImage(img, left, top, cropSize, cropSize, 0, 0, 200, 200)

      // 转换为Blob并上传
      canvas.toBlob(async (blob) => {
        const formData = new FormData()
        formData.append('file', blob, 'avatar.png')

        try {
          const response = await fetch('/api/users/profile/avatar', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authStore.token}`
            },
            body: formData
          })

          const result = await response.json()
          if (result.success) {
            profileForm.avatar = result.avatarUrl
            authStore.currentUser.avatar = result.avatarUrl
            ElMessage.success('头像上传成功')
            cropDialogVisible.value = false
          } else {
            ElMessage.error(result.message || '头像上传失败')
          }
        } catch (error) {
          console.error('上传失败:', error)
          ElMessage.error('头像上传失败')
        }
      }, 'image/png')
    }

    img.src = cropImageSrc.value

  } catch (error) {
    console.error('裁剪失败:', error)
    ElMessage.error('头像裁剪失败')
  }
}

// 添加图片拖拽和缩放功能
const initImageDrag = () => {
  nextTick(() => {
    const cropPreview = document.querySelector('.crop-preview')
    const cropImage = document.querySelector('.crop-image')
    if (!cropPreview || !cropImage) return

    // 拖拽功能
    const handleMouseDown = (e) => {
      cropData.isDragging = true
      cropData.startX = e.clientX - cropData.imageX
      cropData.startY = e.clientY - cropData.imageY
      cropPreview.style.cursor = 'grabbing'
    }

    const handleMouseMove = (e) => {
      if (!cropData.isDragging) return

      cropData.imageX = e.clientX - cropData.startX
      cropData.imageY = e.clientY - cropData.startY
      
      // 更新图片位置
      if (cropImage) {
        cropImage.style.transform = `translate(${cropData.imageX}px, ${cropData.imageY}px) scale(${cropData.scale})`
      }
    }

    const handleMouseUp = () => {
      cropData.isDragging = false
      cropPreview.style.cursor = 'grab'
    }

    // 缩放功能
    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newScale = Math.max(0.5, Math.min(3, cropData.scale + delta))
      
      // 计算缩放中心点
      const rect = cropPreview.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      // 计算缩放前后的坐标变换
      const scaleFactor = newScale / cropData.scale
      cropData.imageX = centerX - (centerX - cropData.imageX) * scaleFactor
      cropData.imageY = centerY - (centerY - cropData.imageY) * scaleFactor
      
      cropData.scale = newScale
      
      // 更新图片变换
      if (cropImage) {
        cropImage.style.transform = `translate(${cropData.imageX}px, ${cropData.imageY}px) scale(${cropData.scale})`
      }
    }

    // 绑定事件
    cropPreview.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    cropPreview.addEventListener('wheel', handleWheel)

    // 初始化图片位置
    if (cropImage) {
      cropImage.style.transform = `translate(${cropData.imageX}px, ${cropData.imageY}px) scale(${cropData.scale})`
      cropImage.style.transformOrigin = 'center center'
    }

    // 清理函数
    return () => {
      cropPreview.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      cropPreview.removeEventListener('wheel', handleWheel)
    }
  })
}

const profileRules = {
  phone: [
    { required: false, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认新密码', trigger: 'blur' }]
}

onMounted(() => {
  if (authStore.currentUser) {
    Object.assign(profileForm, authStore.currentUser)
  }
})

// 监听裁剪弹窗显示状态
watch(cropDialogVisible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initImageDrag()
    })
  }
})

const updateProfile = async () => {
  try {
    // 验证表单
    if (!await profileFormRef.value?.validate()) {
      return
    }
    
    // 只发送允许修改的字段给后端
    const updateData = {
      nickname: profileForm.nickname,
      phone: profileForm.phone
    }
    
    await authStore.updateProfile(updateData)
    ElMessage.success('个人信息更新成功')
  } catch (error) {
    ElMessage.error(error.message || '更新失败')
  }
}

const changePassword = () => {
  ElMessage.info('密码修改功能开发中')
}

const addDomain = () => {
  if (newDomain.value && !corsWhitelist.value.includes(newDomain.value)) {
    corsWhitelist.value.push(newDomain.value)
    newDomain.value = ''
    ElMessage.success('域名添加成功')
  }
}

const removeDomain = (domain) => {
  corsWhitelist.value = corsWhitelist.value.filter(d => d !== domain)
  ElMessage.success('域名移除成功')
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
</script>

<style scoped>
.avatar-uploader {
  display: inline-block;
}

.crop-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.crop-preview {
  position: relative;
  width: 300px;
  height: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9fafb;
}

.crop-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease;
  transform-origin: center center;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.crop-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid #409eff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: move;
  pointer-events: none;
  transition: transform 0.2s ease;
}

.crop-preview {
  cursor: grab;
}

.crop-preview:active {
  cursor: grabbing;
}

.crop-tips {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.crop-tips p {
  margin: 0;
}
</style>