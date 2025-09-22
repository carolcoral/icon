<template>
  <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">上传图片</h2>
      <button 
        @click="toggleUpload" 
        class="text-sm text-primary-600 hover:text-primary-700 font-medium">
        {{ showUpload ? '收起' : '展开' }}
      </button>
    </div>
    
    <div v-show="showUpload" class="space-y-4">
      <!-- 分类选择 -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择分类</label>
          <div class="flex gap-2">
            <select v-model="selectedCategory" class="input-field flex-1">
              <option v-for="category in categories" 
                      :key="category.value" 
                      :value="category.value">
                {{ category.label }}
              </option>
            </select>
            <button @click="showNewCategoryInput = !showNewCategoryInput" 
                    class="btn-secondary whitespace-nowrap">
              新建分类
            </button>
          </div>
        </div>
        
        <!-- 新建分类输入框 -->
        <div v-if="showNewCategoryInput" class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-2">新分类名称</label>
          <div class="flex gap-2">
            <input v-model="newCategoryName" 
                   @keyup.enter="createCategory"
                   type="text" 
                   placeholder="输入分类名称" 
                   class="input-field flex-1">
            <button @click="createCategory" 
                    :disabled="!newCategoryName.trim()"
                    class="btn-primary whitespace-nowrap disabled:opacity-50">
              创建
            </button>
          </div>
        </div>
      </div>

      <!-- 文件上传区域 -->
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors"
           @dragover.prevent
           @drop.prevent="handleDrop"
           @click="$refs.fileInput.click()">
        <div class="space-y-2">
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="text-sm text-gray-600">
            <span class="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">点击选择文件</span>
            或拖拽文件到此处
          </div>
          <p class="text-xs text-gray-500">支持 PNG、ICO、JPG、JPEG、GIF、SVG 格式，最大 10MB</p>
        </div>
        
        <input ref="fileInput" 
               type="file" 
               multiple 
               accept=".png,.ico,.jpg,.jpeg,.gif,.svg"
               @change="handleFileSelect"
               class="hidden">
      </div>

      <!-- 选中的文件列表 -->
      <div v-if="selectedFiles.length > 0" class="space-y-2">
        <h3 class="text-sm font-medium text-gray-700">待上传文件 ({{ selectedFiles.length }})</h3>
        <div class="max-h-32 overflow-y-auto space-y-1">
          <div v-for="(file, index) in selectedFiles" 
               :key="index"
               class="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
            <div class="flex items-center space-x-2">
              <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700">{{ file.name }}</span>
              <span class="text-gray-500">({{ formatFileSize(file.size) }})</span>
            </div>
            <button @click="removeFile(index)" 
                    class="text-red-500 hover:text-red-700">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 上传按钮 -->
        <div class="flex justify-end space-x-2">
          <button @click="clearFiles" class="btn-secondary">清空</button>
          <button @click="uploadFiles" 
                  :disabled="uploading || selectedFiles.length === 0"
                  class="btn-primary disabled:opacity-50">
            {{ uploading ? '上传中...' : `上传 ${selectedFiles.length} 个文件` }}
          </button>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>上传进度</span>
          <span>{{ uploadedCount }}/{{ totalFiles }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-primary-600 h-2 rounded-full transition-all duration-300" 
               :style="{ width: uploadProgress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ImageUpload',
  props: {
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['upload-success', 'category-created'],
  setup(props, { emit }) {
    const showUpload = ref(false)
    const selectedCategory = ref('other')
    const selectedFiles = ref([])
    const uploading = ref(false)
    const uploadedCount = ref(0)
    const totalFiles = ref(0)
    const showNewCategoryInput = ref(false)
    const newCategoryName = ref('')

    const uploadProgress = computed(() => {
      if (totalFiles.value === 0) return 0
      return Math.round((uploadedCount.value / totalFiles.value) * 100)
    })

    const toggleUpload = () => {
      showUpload.value = !showUpload.value
    }

    const handleFileSelect = (event) => {
      const files = Array.from(event.target.files)
      addFiles(files)
      event.target.value = '' // 清空input，允许重复选择同一文件
    }

    const handleDrop = (event) => {
      const files = Array.from(event.dataTransfer.files)
      addFiles(files)
    }

    const addFiles = (files) => {
      const validFiles = files.filter(file => {
        const validTypes = ['image/png', 'image/x-icon', 'image/jpeg', 'image/gif', 'image/svg+xml']
        const validExtensions = /\.(png|ico|jpg|jpeg|gif|svg)$/i
        return (validTypes.includes(file.type) || validExtensions.test(file.name)) && file.size <= 10 * 1024 * 1024
      })
      
      selectedFiles.value = [...selectedFiles.value, ...validFiles]
    }

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1)
    }

    const clearFiles = () => {
      selectedFiles.value = []
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const createCategory = () => {
      if (!newCategoryName.value.trim()) return
      alert('静态模式下无法创建分类')
      newCategoryName.value = ''
      showNewCategoryInput.value = false
    }

    const uploadFiles = () => {
      alert('静态模式下无法上传图片')
      uploading.value = false
      selectedFiles.value = []
      emit('upload-success', [])
    }

    return {
      showUpload,
      selectedCategory,
      selectedFiles,
      uploading,
      uploadedCount,
      totalFiles,
      uploadProgress,
      showNewCategoryInput,
      newCategoryName,
      toggleUpload,
      handleFileSelect,
      handleDrop,
      removeFile,
      clearFiles,
      formatFileSize,
      createCategory,
      uploadFiles
    }
  }
}
</script>