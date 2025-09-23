<template>
  <div class="min-h-screen bg-gray-50 pb-32">
    <!-- 头部导航 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img v-if="siteConfig.logo" :src="siteConfig.logo" alt="Logo" class="h-8 mr-3 object-contain">
            <h1 class="text-xl font-bold text-gray-900 hidden sm:block">{{ siteConfig.title }}</h1>
          </div>
          <nav class="hidden sm:flex space-x-8">
            <a v-for="item in siteConfig.navigation" :key="item.name" 
               :href="item.href" 
               target="_blank"
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

            <!-- 搜索框 -->
            <div class="w-full md:w-80">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                搜索图标
                <span class="text-xs text-gray-500 ml-1">(支持模糊搜索)</span>
              </label>
              <div class="relative">
                <input 
                  ref="searchInput"
                  v-model="searchKeyword" 
                  @input="handleSearchInput"
                  @keyup.enter="handleSearch"
                  @keyup.esc="clearSearch"
                  type="text" 
                  placeholder="输入图标名称进行搜索... (按 / 聚焦)"
                  class="input-field pl-10 pr-20"
                >
                <!-- 搜索图标 -->
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                
                <!-- 右侧按钮组 -->
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                  <!-- 搜索状态指示器 -->
                  <div v-if="searchKeyword && searchTimeout" class="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                  
                  <!-- 清除按钮 -->
                  <button v-if="searchKeyword" 
                          @click="clearSearch" 
                          class="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors duration-200"
                          title="清除搜索 (Esc)">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                  
                  <!-- 快捷键提示 -->
                  <div class="hidden sm:block text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    /
                  </div>
                </div>
              </div>
              
              <!-- 搜索建议 -->
              <div v-if="searchKeyword && searchSuggestions.length > 0" 
                   class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                <div v-for="suggestion in searchSuggestions" 
                     :key="suggestion"
                     @click="selectSuggestion(suggestion)"
                     class="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0">
                  <span class="text-gray-900">{{ suggestion }}</span>
                </div>
              </div>
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
                <span v-if="searchKeyword">
                  在"{{ getSelectedCategoryLabel() }}"中搜索"{{ searchKeyword }}"，
                </span>
                共找到 <span class="font-semibold text-primary-600">{{ totalImages }}</span> 个图标
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片网格 -->
      <div class="mb-8">
        <!-- 加载状态 - 骨架屏 -->
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <div v-for="n in pageSize" :key="n" class="card p-4 animate-pulse">
            <div class="aspect-square bg-gray-200 rounded-lg mb-3"></div>
            <div class="space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="images.length === 0" class="text-center py-16">
          <div class="mx-auto w-24 h-24 mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无图标</h3>
          <p class="text-gray-500">当前分类下没有找到图标文件</p>
        </div>
        
        <!-- 图片网格 -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 fade-in">
          <div v-for="(image, index) in images" 
               :key="image.path" 
               class="card p-3 cursor-pointer group slide-up"
               :style="{ animationDelay: `${index * 50}ms` }"
               @click="selectImage(image)">
            <div class="aspect-square flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-3 overflow-hidden relative">
              <!-- 图片 -->
              <img :src="image.path" 
                   :alt="image.name" 
                   class="max-w-full max-h-full object-contain card-image"
                   @error="handleImageError">
              
              <!-- 悬停遮罩 -->
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-2 shadow-lg">
                  <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div class="text-center space-y-1">
              <p class="text-sm font-medium text-gray-900 truncate" :title="image.name">
                {{ getDisplayName(image.name) }}
              </p>
              <div class="flex items-center justify-center space-x-1">
                <span class="inline-block w-2 h-2 rounded-full bg-primary-400"></span>
                <p class="text-xs text-gray-500">{{ image.category }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <nav class="flex items-center space-x-2">
          <button @click="goToPage(currentPage - 1)" 
                  :disabled="currentPage === 1"
                  class="hidden sm:block px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
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
                  class="hidden sm:block px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            下一页
          </button>
        </nav>
      </div>
    </main>

    <!-- 图片预览模态框 -->
    <Transition name="modal" appear>
      <div v-if="selectedImage" 
           class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
           @click="closeModal">
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-bounce-in" @click.stop>
          <!-- 头部 -->
          <div class="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h3 class="text-xl font-bold text-gray-900">{{ getDisplayName(selectedImage.name) }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ selectedImage.category }} 分类</p>
            </div>
            <button @click="closeModal" 
                    class="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- 图片展示区域 -->
          <div class="p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div class="relative inline-block">
              <img :src="getImageAccessUrl(selectedImage)" 
                   :alt="selectedImage.name" 
                   class="max-w-full max-h-96 mx-auto object-contain rounded-lg shadow-lg">
              
              <!-- 图片尺寸信息 -->
              <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {{ selectedImage.name.split('.').pop().toUpperCase() }}
              </div>
            </div>
          </div>
          
          <!-- 详细信息 -->
          <div class="p-6 space-y-4 bg-white">
            <div class="space-y-3 text-sm">
              <!-- 文件名和分类在同一行 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium text-gray-700">文件名:</span>
                  <span class="text-gray-900">{{ selectedImage.name }}</span>
                </div>
                
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span class="font-medium text-gray-700">分类:</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {{ selectedImage.category }}
                  </span>
                </div>
              </div>
              
              <!-- 访问链接独立一行 -->
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                </svg>
                <span class="font-medium text-gray-700">访问链接:</span>
                <code class="bg-gray-100 px-3 py-1 rounded text-xs flex-1 truncate" 
                      style="max-width: 80%;" 
                      :title="getImageAccessUrl(selectedImage)">
                  {{ getImageAccessUrl(selectedImage) }}
                </code>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
              <button @click="copyImageUrl(selectedImage)" 
                      class="btn-secondary flex items-center justify-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                <span>复制链接</span>
              </button>
              
              <a :href="getImageAccessUrl(selectedImage)" 
                 download 
                 class="btn-primary flex items-center justify-center space-x-2 no-underline">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>下载图片</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 页脚 -->
    <footer class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center space-y-2">
          <p class="text-sm text-gray-600">{{ siteConfig.copyright }}</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p v-if="siteConfig.icp" class="text-xs text-gray-500 flex items-center">
              <img src="/assets/images/other/icp-icon.png" alt="ICP" class="w-4 h-4 mr-1" />
              {{ siteConfig.icp }}
            </p>
            <p v-if="siteConfig.publicSecurity" class="text-xs text-gray-500 flex items-center">
              <img src="/assets/images/other/gongan-icon.png" alt="公网安备" class="w-4 h-4 mr-1" />
              {{ siteConfig.publicSecurity }}
            </p>
          </div>
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
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import imageData from './assets/image-data.json'

export default {
  name: 'App',
  setup() {
    // 响应式数据
    const loading = ref(false)
    const images = ref([])
    const categories = ref([])
    const selectedCategory = ref('all')
    const searchKeyword = ref('')
    const searchTimeout = ref(null)
    const pageSize = ref(20)
    const currentPage = ref(1)
    const totalImages = ref(0)
    const totalPages = ref(0)
    const selectedImage = ref(null)
    const searchSuggestions = ref([]) // 搜索建议
    const searchInput = ref(null) // 搜索输入框引用

    // 站点配置
    const siteConfig = reactive({
      title: '在线图标库',
      logo: 'https://api.minio.xindu.site/blog.cnkj.site/backup/logo-zark.png',
      navigation: [
        { name: '首页', href: 'https://xindu.site' },
        { name: '博客', href: 'https://blog.xindu.site' },
        { name: 'Github', href: 'https://github.com/carolcoral/icon' },
        { name: '帮助', href: 'https://github.com/carolcoral/icon/blob/main/README.md' }
      ],
      copyright: '©2025 XIN·DU. All rights reserved.',
      icp: '蜀ICP备-2023016788号',
      publicSecurity: '川公网安备 51010802001234号'
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
    const fetchCategories = () => {
      categories.value = Object.keys(imageData).map(category => ({
        value: category,
        label: category
      }))
    }

    const fetchImages = () => {
      loading.value = true
      
      try {
        // 获取当前分类的所有图片
        let allImages = []
        if (selectedCategory.value === 'all') {
          Object.values(imageData).forEach(categoryImages => {
            allImages = allImages.concat(categoryImages)
          })
        } else {
          allImages = imageData[selectedCategory.value] || []
        }
        
        // 应用搜索过滤
        if (searchKeyword.value.trim()) {
          const keyword = searchKeyword.value.toLowerCase()
          allImages = allImages.filter(img => 
            img.name.toLowerCase().includes(keyword)
          )
        }
        
        // 分页处理
        totalImages.value = allImages.length
        totalPages.value = Math.ceil(allImages.length / pageSize.value)
        
        const startIndex = (currentPage.value - 1) * pageSize.value
        images.value = allImages.slice(startIndex, startIndex + pageSize.value)
        
      } catch (error) {
        console.error('获取图片失败:', error)
        showNotification('获取图片失败，请稍后重试', 'error')
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

    // 搜索相关方法
    const handleSearchInput = () => {
      // 清除之前的定时器
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value)
      }
      
      // 生成搜索建议
      generateSearchSuggestions()
      
      // 设置防抖，300ms后执行搜索
      searchTimeout.value = setTimeout(() => {
        handleSearch()
        searchTimeout.value = null
      }, 300)
    }

    const handleSearch = () => {
      currentPage.value = 1
      searchSuggestions.value = []
      fetchImages()
    }

    const clearSearch = () => {
      searchKeyword.value = ''
      searchSuggestions.value = []
      currentPage.value = 1
      fetchImages()
    }

    const selectSuggestion = (suggestion) => {
      searchKeyword.value = suggestion
      searchSuggestions.value = []
      handleSearch()
    }

    // 生成搜索建议
    const generateSearchSuggestions = () => {
      if (!searchKeyword.value.trim()) {
        searchSuggestions.value = []
        return
      }
      
      const keyword = searchKeyword.value.toLowerCase()
      const suggestions = new Set()
      
      // 基于当前图片生成建议
      images.value.forEach(image => {
        const name = image.name.toLowerCase()
        if (name.includes(keyword) && name !== keyword) {
          suggestions.add(image.name.replace(/\.[^/.]+$/, '')) // 去掉扩展名
        }
      })
      
      // 常见搜索词建议
      const commonTerms = ['github', 'docker', 'icon', 'logo', 'badge', 'button', 'arrow', 'star']
      commonTerms.forEach(term => {
        if (term.includes(keyword) && term !== keyword) {
          suggestions.add(term)
        }
      })
      
      searchSuggestions.value = Array.from(suggestions).slice(0, 5)
    }

    // 键盘快捷键支持
    const handleKeyboardShortcuts = (event) => {
      // 按 / 键聚焦搜索框
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        searchInput.value?.focus()
      }
      
      // 按 Escape 键关闭模态框或清除搜索
      if (event.key === 'Escape') {
        if (selectedImage.value) {
          closeModal()
        } else if (searchKeyword.value) {
          clearSearch()
        }
      }
    }

    const getSelectedCategoryLabel = () => {
      if (selectedCategory.value === 'all') {
        return '全部分类'
      }
      const category = categories.value.find(cat => cat.value === selectedCategory.value)
      return category ? category.label : selectedCategory.value
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
      // 直接返回原始路径
      return image.path
    }
    
    const getFullImageUrl = (image) => {
      // 用于复制链接功能
      return window.location.origin + image.path
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
        await navigator.clipboard.writeText(getFullImageUrl(image))
        showNotification('链接已复制到剪贴板！', 'success')
      } catch (error) {
        console.error('复制失败:', error)
        showNotification('复制失败，请手动复制', 'error')
      }
    }

    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTI4IDI4TDM2IDM2TDQwIDMyIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
    }

    // 获取显示名称（去掉扩展名）
    const getDisplayName = (filename) => {
      return filename.replace(/\.[^/.]+$/, '')
    }

    // 处理上传成功
    const handleUploadSuccess = (uploadedImages) => {
      showNotification(`成功上传 ${uploadedImages.length} 个图片！`, 'success')
      // 刷新图片列表
      fetchImages()
      // 刷新分类列表（可能有新分类）
      fetchCategories()
    }

    // 处理分类创建成功
    const handleCategoryCreated = (categoryName) => {
      showNotification(`分类 "${categoryName}" 创建成功！`, 'success')
      // 刷新分类列表
      fetchCategories()
    }

    // 删除图片
    const deleteImage = (image) => {
      if (!confirm(`确定要删除图片 "${image.name}" 吗？`)) {
        return
      }
      showNotification('静态模式下无法删除图片', 'error')
    }

    // 生命周期
    onMounted(() => {
      fetchCategories()
      fetchImages()
      
      // 添加键盘事件监听
      document.addEventListener('keydown', handleKeyboardShortcuts)
    })

    // 清理事件监听器
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyboardShortcuts)
    })

    return {
      loading,
      images,
      categories,
      selectedCategory,
      searchKeyword,
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
      handleSearchInput,
      handleSearch,
      clearSearch,
      getSelectedCategoryLabel,
      goToPage,
      selectImage,
      closeModal,
      getImageAccessUrl,
      copyImageUrl,
      handleImageError,
      getDisplayName,
      searchSuggestions,
      searchInput,
      selectSuggestion,
      showNotification
    }
  }
}
</script>