<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img src="https://api.minio.xindu.site/blog.cnkj.site/backup/logo-zark.png" alt="Logo" class="h-8 mr-3 object-contain">
            <h1 class="text-xl font-bold text-gray-900">图床服务</h1>
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

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- 英雄区域 -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          专业的图床服务
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          安全、稳定、高效的图片存储和管理解决方案，支持多种存储规则和访问控制
        </p>
        <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <router-link to="/upload" class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors">
            开始上传
          </router-link>
          <router-link to="/gallery" class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors">
            浏览图片
          </router-link>
        </div>
      </div>

      <!-- 功能特性 -->
      <div class="grid md:grid-cols-3 gap-8 mb-16">
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <el-icon class="text-blue-600 text-2xl"><Upload /></el-icon>
          </div>
          <h3 class="text-xl font-semibold mb-3">快速上传</h3>
          <p class="text-gray-600">支持拖拽上传、批量上传，多种文件格式支持</p>
        </div>
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <el-icon class="text-green-600 text-2xl"><Picture /></el-icon>
          </div>
          <h3 class="text-xl font-semibold mb-3">智能管理</h3>
          <p class="text-gray-600">按用户隔离存储，支持多种存储路径规则配置</p>
        </div>
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <el-icon class="text-purple-600 text-2xl"><Lock /></el-icon>
          </div>
          <h3 class="text-xl font-semibold mb-3">安全可靠</h3>
          <p class="text-gray-600">JWT认证、跨域白名单、访问权限控制</p>
        </div>
      </div>

      <!-- 使用场景 -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <h2 class="text-2xl font-bold text-center mb-8">适用场景</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-orange-600 text-xl"><Monitor /></el-icon>
            </div>
            <div>
              <h4 class="font-semibold mb-2">博客网站</h4>
              <p class="text-gray-600">为博客文章提供稳定的图片存储和CDN加速</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-600 text-xl"><ShoppingCart /></el-icon>
            </div>
            <div>
              <h4 class="font-semibold mb-2">电商平台</h4>
              <p class="text-gray-600">商品图片的统一管理和快速访问</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-green-600 text-xl"><ChatDotRound /></el-icon>
            </div>
            <div>
              <h4 class="font-semibold mb-2">社交应用</h4>
              <p class="text-gray-600">用户头像、分享图片的存储和展示</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <el-icon class="text-purple-600 text-xl"><Document /></el-icon>
            </div>
            <div>
              <h4 class="font-semibold mb-2">文档系统</h4>
              <p class="text-gray-600">技术文档、产品说明中的图片资源管理</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-white border-t mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center space-y-4">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <span>©2025 图床服务. All rights reserved.</span>
            <span class="hidden sm:inline">|</span>
            <span>蜀ICP备-2023016788号</span>
            <span class="hidden sm:inline">|</span>
            <span>川公网安备 51010802001234号</span>
          </div>
          <div class="flex justify-center space-x-6">
            <a href="https://github.com/carolcoral/icon" target="_blank" class="text-gray-400 hover:text-gray-600">
              <el-icon class="text-xl"><Link /></el-icon>
            </a>
            <a href="https://blog.xindu.site" target="_blank" class="text-gray-400 hover:text-gray-600">
              <el-icon class="text-xl"><Document /></el-icon>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Picture, Lock, Monitor, ShoppingCart, ChatDotRound, Document, Link, User, SwitchButton } from '@element-plus/icons-vue'

const authStore = useAuthStore()

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
.el-dropdown-link {
  outline: none;
}
</style>