<template>
  <div class="gallery-container">
    <div class="gallery-header">
      <h1 class="text-3xl font-bold text-gray-800">图片画廊</h1>
      <p class="text-gray-600 mt-2">浏览您上传的所有图片</p>
    </div>

    <div class="gallery-controls">
      <div class="flex items-center space-x-4">
        <el-input
          v-model="searchQuery"
          placeholder="搜索图片名称、描述或标签..."
          class="w-80"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="sortBy" placeholder="排序方式" class="w-40">
          <el-option label="上传时间" value="date" />
          <el-option label="文件大小" value="size" />
          <el-option label="文件名" value="name" />
        </el-select>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="images.length === 0" class="empty-state">
      <el-empty description="暂无图片">
        <el-button type="primary" @click="$router.push('/upload')">
          上传图片
        </el-button>
      </el-empty>
    </div>

    <div v-else class="gallery-grid">
      <div
        v-for="image in filteredImages"
        :key="image.id"
        class="gallery-item"
        @click="openImageDetail(image)"
      >
        <div class="image-container">
          <img
            :src="image.url"
            :alt="image.filename"
            class="gallery-image"
            loading="lazy"
          />
          <div class="image-overlay">
            <div class="image-actions">
              <el-button
                type="primary"
                size="small"
                @click.stop="downloadImage(image)"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
        </div>
        <div class="image-info">
          <p class="filename truncate">{{ image.originalName }}</p>
          <p class="file-size text-sm text-gray-500">
            {{ formatFileSize(image.fileSize) }}
          </p>
          <p class="upload-time text-xs text-gray-400">
            {{ formatDate(image.createdAt) }}
          </p>
          <p class="user-info text-xs text-gray-400" v-if="image.nickname">
            上传者: {{ image.nickname }}
          </p>
        </div>
      </div>
    </div>

    <!-- 图片详情模态框 -->
    <el-dialog
      v-model="imageDetailVisible"
      :title="selectedImage?.originalName"
      width="90%"
      top="2vh"
      class="image-detail-dialog"
      @close="selectedImage = null"
    >
      <div class="image-detail">
        <img
          :src="selectedImage?.url"
          :alt="selectedImage?.originalName"
          class="detail-image"
        />
        <div class="image-meta">
          <h3 class="text-lg font-semibold mb-4">图片信息</h3>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="label">文件名:</span>
              <span class="value">{{ selectedImage?.originalName }}</span>
            </div>
            <div class="meta-item">
              <span class="label">文件大小:</span>
              <span class="value">{{ formatFileSize(selectedImage?.fileSize || 0) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">上传时间:</span>
              <span class="value">{{ formatDate(selectedImage?.createdAt || '') }}</span>
            </div>
            <div class="meta-item">
              <span class="label">图片尺寸:</span>
              <span class="value">{{ selectedImage?.width }} x {{ selectedImage?.height }}</span>
            </div>
            <div class="meta-item">
              <span class="label">上传者:</span>
              <span class="value">{{ selectedImage?.nickname || selectedImage?.username || '未知用户' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">描述:</span>
              <span class="value">{{ selectedImage?.description || '无描述' }}</span>
            </div>
            <div class="meta-item">
              <span class="label">标签:</span>
              <span class="value">{{ selectedImage?.tags?.join(', ') || '无标签' }}</span>
            </div>
          </div>
          <div class="action-buttons mt-6">
            <el-button type="primary" @click="copyImageUrl(selectedImage)">
              <el-icon><CopyDocument /></el-icon>
              复制链接
            </el-button>
            <el-button type="success" @click="downloadImage(selectedImage)">
              <el-icon><Download /></el-icon>
              下载图片
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, CopyDocument } from '@element-plus/icons-vue'

interface Image {
  id: string
  filename: string
  originalName: string
  url: string
  thumbnailUrl: string
  fileSize: number
  width: number
  height: number
  category: string
  isPublic: boolean
  description: string
  tags: string[]
  accessCount: number
  userId: string
  username: string
  nickname: string
  avatar: string
  createdAt: string
  updatedAt: string
}

const images = ref<Image[]>([])
const loading = ref(true)
const searchQuery = ref('')
const sortBy = ref('date')
const imageDetailVisible = ref(false)
const selectedImage = ref<Image | null>(null)


const filteredImages = computed(() => {
  let filtered = images.value.filter(image =>
    image.originalName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    image.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    image.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )

  // 排序逻辑
  switch (sortBy.value) {
    case 'date':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'size':
      filtered.sort((a, b) => b.fileSize - a.fileSize)
      break
    case 'name':
      filtered.sort((a, b) => a.originalName.localeCompare(b.originalName))
      break
  }

  return filtered
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const openImageDetail = (image: Image) => {
  selectedImage.value = image
  imageDetailVisible.value = true
}

const downloadImage = async (image: Image | null) => {
  if (!image) return
  
  try {
    const response = await fetch(image.url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = image.filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const copyImageUrl = async (image: Image | null) => {
  if (!image) return
  
  try {
    await navigator.clipboard.writeText(image.url)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}





// 从API获取公开图片数据
const fetchPublicImages = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/images/public')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    images.value = data.images || []
    
  } catch (error) {
    console.error('获取公开图片失败:', error)
    ElMessage.error('获取图片列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPublicImages()
})
</script>

<style scoped>
.gallery-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.gallery-header {
  text-align: center;
  margin-bottom: 32px;
}

.gallery-controls {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.gallery-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  overflow: hidden;
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.image-container {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.gallery-item:hover .gallery-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-item:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-info {
  padding: 16px;
}

.filename {
  font-weight: 600;
  margin-bottom: 4px;
}

.file-size, .upload-time {
  margin: 2px 0;
}

.loading-container {
  padding: 40px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.image-detail {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
}

.detail-image {
  width: 100%;
  max-height: 75vh;
  max-width: 75vw;
  object-fit: contain;
  border-radius: 8px;
}

.image-meta {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
}

.meta-grid {
  display: grid;
  gap: 12px;
}

.meta-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
}

.label {
  font-weight: 600;
  color: #666;
}

.value {
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>