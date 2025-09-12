<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 头部导航 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img v-if="siteConfig.logo" :src="siteConfig.logo" alt="Logo" class="h-8 w-8 mr-3">
            <h1 class="text-xl font-bold text-gray-900">{{ siteConfig.title }}</h1>
          </div>
          <nav class="flex space-x-8">
            <a v-for="item in siteConfig.navigation" :key="item.name" 
               :href="item.href" 
               class="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              {{ item.name }}
            </a>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 搜索和筛选区域 -->
      <div class="mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <!-- 分类选择器 -->
            <div class="w-full md:w-64">
              <label class="block text-sm font-medium text-gray-700 mb-2">图标分类</label>
              <select v-model="selectedCategory" 
                      @change="handleCategoryChange"
                      class="input-field">
                <option value="all">全部分类</option>
                <option v-for="category in categories" 
                        :key="category.value" 
                        :value="category.value">
                  {{ category.label }}
                </option>
              </select>
            </div>

            <!-- 每页显示数量 -->
            <div class="w-full md:w-48">
              <label class="block text-sm font-medium text-gray-700 mb-2">每页显示</label>
              <select v-model="pageSize" 
                      @change="handlePageSizeChange"
                      class="input-field">
                <option :value="20">20张/页</option>
                <option :value="50">50张/页</option>
                <option :value="100">100张/页</option>
              </select>
            </div>

            <!-- 统计信息 -->
            <div class="flex-1 text-right">
              <p class="text-sm text-gray-600">
                共找到 <span class="font-semibold text-primary-600">{{ totalImages }}</span> 个图标
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片网格 -->
      <div class="mb-8">
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
        
        <div v-else-if="images.length === 0" class="text-center py-12">
          <div class="text-gray-400 text-lg">暂无图标</div>
        </div>
        
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <div v-for="image in images" 
               :key="image.path" 
               class="card p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
               @click="selectImage(image)">
            <div class="aspect-square flex items-center justify-center bg-gray-50 rounded-lg mb-3 overflow-hidden">
              <img :src="image.url" 
                   :alt="image.name" 
                   class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-200"
                   @error="handleImageError">
            </div>
            <div class="text-center">
              <p class="text-sm font-medium text-gray-900 truncate" :title="image.name">
                {{ image.name }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ image.category }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <nav class="flex items-center space-x-2">
          <button @click="goToPage(currentPage - 1)" 
                  :disabled="currentPage === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            上一页
          </button>
          
          <template v-for="page in visiblePages" :key="page">
            <button v-if="page === '...'" 
                    class="px-3 py-2 text-sm font-medium text-gray-500">
              ...
            </button>
            <button v-else
                    @click="goToPage(page)"
                    :class="[
                      'px-3 py-2 text-sm font-medium rounded-md',
                      page === currentPage 
                        ? 'bg-primary-500 text-white' 
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    ]">
              {{ page }}
            </button>
          </template>
          
          <button @click="goToPage(currentPage + 1)" 
                  :disabled="currentPage === totalPages"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            下一页
          </button>
        </nav>
      </div>
    </main>

    <!-- 图片预览模态框 -->
    <div v-if="selectedImage" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         @click="closeModal">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" @click.stop>
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">{{ selectedImage.name }}</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="text-center mb-4">
            <img :src="selectedImage.url" 
                 :alt="selectedImage.name" 
                 class="max-w-full max-h-96 mx-auto object-contain">
          </div>
          
          <div class="space-y-2 text-sm">
            <p><span class="font-medium">文件名:</span> {{ selectedImage.name }}</p>
            <p><span class="font-medium">分类:</span> {{ selectedImage.category }}</p>
            <p><span class="font-medium">访问链接:</span> 
              <code class="bg-gray-100 px-2 py-1 rounded text-xs">{{ getImageAccessUrl(selectedImage) }}</code>
            </p>
          </div>
          
          <div class="mt-4 flex justify-end space-x-2">
            <button @click="copyImageUrl(selectedImage)" class="btn-secondary">
              复制链接
            </button>
            <a :href="selectedImage.url" download class="btn-primary">
              下载图片
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="bg-white border-t mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center space-y-2">
          <p class="text-sm text-gray-600">{{ siteConfig.copyright }}</p>
          <p v-if="siteConfig.icp" class="text-xs text-gray-500">{{ siteConfig.icp }}</p>
        </div>
      </div>
    </footer>

    <!-- 通知组件 -->
    <div v-if="notification.show" 
         class="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
      <div :class="[
        'flex items-center p-4 rounded-lg shadow-lg max-w-sm',
        notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      ]">
        <!-- 成功图标 -->
        <div v-if="notification.type === 'success'" class="flex-shrink-0">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <!-- 错误图标 -->
        <div v-else class="flex-shrink-0">
          <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="ml-3">
          <p :class="[
            'text-sm font-medium',
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          ]">
            {{ notification.message }}
          </p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="notification.show = false" 
                  :class="[
                    'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    notification.type === 'success' 
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' 
                      : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                  ]">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'

export default {
  name: 'App',
  setup() {
    // 响应式数据
    const loading = ref(false)
    const images = ref([])
    const categories = ref([])
    const selectedCategory = ref('all')
    const pageSize = ref(20)
    const currentPage = ref(1)
    const totalImages = ref(0)
    const totalPages = ref(0)
    const selectedImage = ref(null)

    // 站点配置
    const siteConfig = reactive({
      title: '图标管理系统',
      logo: null,
      navigation: [
        { name: '首页', href: '#' },
        { name: '关于', href: '#' },
        { name: '帮助', href: '#' }
      ],
      copyright: '© 2024 图标管理系统. All rights reserved.',
      icp: 'ICP备案号：京ICP备12345678号'
    })

    // 计算属性
    const visiblePages = computed(() => {
      const pages = []
      const total = totalPages.value
      const current = currentPage.value
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        } else if (current >= total - 3) {
          pages.push(1)
          pages.push('...')
          for (let i = total - 4; i <= total; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        }
      }
      
      return pages
    })

    // 方法
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories')
        categories.value = response.data
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    }

    const fetchImages = async () => {
      loading.value = true
      try {
        const response = await axios.get('/api/images', {
          params: {
            category: selectedCategory.value,
            page: currentPage.value,
            limit: pageSize.value
          }
        })
        
        images.value = response.data.images
        totalImages.value = response.data.total
        totalPages.value = response.data.totalPages
      } catch (error) {
        console.error('获取图片失败:', error)
      } finally {
        loading.value = false
      }
    }

    const handleCategoryChange = () => {
      currentPage.value = 1
      fetchImages()
    }

    const handlePageSizeChange = () => {
      currentPage.value = 1
      fetchImages()
    }

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        fetchImages()
      }
    }

    const selectImage = (image) => {
      selectedImage.value = image
    }

    const closeModal = () => {
      selectedImage.value = null
    }

    const getImageAccessUrl = (image) => {
      return `${window.location.origin}/${image.category}/${image.name}`
    }

    // 通知状态
    const notification = ref({
      show: false,
      message: '',
      type: 'success'
    })

    const showNotification = (message, type = 'success') => {
      notification.value = {
        show: true,
        message,
        type
      }
      setTimeout(() => {
        notification.value.show = false
      }, 3000)
    }

    const copyImageUrl = async (image) => {
      try {
        await navigator.clipboard.writeText(getImageAccessUrl(image))
        showNotification('链接已复制到剪贴板！', 'success')
      } catch (error) {
        console.error('复制失败:', error)
        showNotification('复制失败，请手动复制', 'error')
      }
    }

    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
    }

    // 生命周期
    onMounted(() => {
      fetchCategories()
      fetchImages()
    })

    return {
      loading,
      images,
      categories,
      selectedCategory,
      pageSize,
      currentPage,
      totalImages,
      totalPages,
      selectedImage,
      siteConfig,
      visiblePages,
      notification,
      fetchImages,
      handleCategoryChange,
      handlePageSizeChange,
      goToPage,
      selectImage,
      closeModal,
      getImageAccessUrl,
      copyImageUrl,
      handleImageError,
      showNotification
    }
  }
}
</script>