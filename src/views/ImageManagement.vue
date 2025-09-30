<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <img src="https://api.minio.xindu.site/blog.cnkj.site/backup/logo-zark.png" alt="Logo" class="h-8 mr-3 object-contain">
            <h1 class="text-xl font-bold text-gray-900">图片管理</h1>
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
            <el-button type="primary" size="small" @click="openCategoryDialog">
              <el-icon><FolderOpened /></el-icon>
              分类管理
            </el-button>
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
                  <el-dropdown-item @click="$router.push('/image-management')">
                    <el-icon><Picture /></el-icon>
                    图片管理
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

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 搜索和筛选 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex flex-wrap gap-4 items-center">
          <el-input
            v-model="searchText"
            placeholder="搜索图片名称、描述或标签"
            class="w-64"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select v-model="selectedCategory" placeholder="选择分类" clearable>
            <el-option label="全部" value="all" />
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
          
          <el-select v-model="isPublicFilter" placeholder="公开状态" clearable>
            <el-option label="全部" value="all" />
            <el-option label="公开" value="true" />
            <el-option label="私有" value="false" />
          </el-select>
          
          <el-button type="primary" @click="loadImages">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>
      </div>

      <!-- 图片列表 -->
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">我的图片</h3>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">
                共 {{ pagination.total }} 张图片
              </span>
              <el-button
                type="primary"
                :disabled="selectedImages.length === 0"
                @click="openBatchCategoryDialog"
              >
                <el-icon><FolderOpened /></el-icon>
                批量设置分类 ({{ selectedImages.length }})
              </el-button>
            <el-button
                type="danger"
                :disabled="selectedImages.length === 0"
                @click="batchDeleteImages"
              >
                <el-icon><Delete /></el-icon>
                批量删除 ({{ selectedImages.length }})
              </el-button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <el-table
            :data="images"
            @selection-change="handleSelectionChange"
            v-loading="loading"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="图片" width="120">
              <template #default="{ row }">
                <el-image
                  :src="row.thumbnailUrl"
                  :preview-src-list="[row.url]"
                  fit="cover"
                  class="w-20 h-20 rounded"
                  :style="{ maxWidth: '65%' }"
                >
                  <template #error>
                    <div class="w-20 h-20 bg-gray-100 flex items-center justify-center">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column prop="originalName" label="文件名" min-width="200">
              <template #default="{ row }">
                <div class="truncate max-w-xs" :title="row.originalName">
                  {{ row.originalName }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" width="120">
              <template #default="{ row }">
                <el-tooltip 
                  v-if="row.description" 
                  :content="row.description.length > 20 ? row.description.substring(0, 20) + '...' : row.description" 
                  placement="top-start"
                  effect="light"
                  :popper-options="{ modifiers: [{ name: 'computeStyles', options: { gpuAcceleration: false } }] }"
                >
                  <div class="description-cell truncate-single" :title="row.description">
                    {{ row.description.length > 8 ? row.description.substring(0, 8) + '...' : row.description }}
                  </div>
                </el-tooltip>
                <span v-else class="text-gray-400">无描述</span>
              </template>
            </el-table-column>
            <el-table-column prop="fileSize" label="大小" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="120">
              <template #default="{ row }">
                <el-tag :type="row.category ? 'primary' : 'info'">
                  {{ row.category || '未分类' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isPublic" label="公开状态" width="100">
              <template #default="{ row }">
                <el-switch
                  v-model="row.isPublic"
                  @change="updateImagePublicStatus(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="上传时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="editImage(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="deleteImage(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="flex justify-center mt-6">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.limit"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑图片对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑图片信息"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="选择分类" clearable filterable>
            <el-option label="未分类" value="" />
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="输入图片描述"
          />
        </el-form-item>

        <el-form-item label="公开">
          <el-switch v-model="editForm.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveImageEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量设置分类弹窗 -->
    <el-dialog
      v-model="batchCategoryDialogVisible"
      title="批量设置分类"
      width="400px"
    >
      <el-form :model="batchCategoryForm" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="batchCategoryForm.category" placeholder="选择分类" clearable filterable>
            <el-option label="未分类" value="" />
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchCategoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatchCategory">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分类管理弹窗 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="分类管理"
      width="600px"
    >
      <div class="category-management">
        <!-- 添加新分类 -->
        <div class="add-category mb-6">
          <el-form :model="newCategoryForm" inline>
            <el-form-item label="新分类名称">
              <el-input v-model="newCategoryForm.name" placeholder="输入分类名称" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addCategory">添加分类</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 分类列表 -->
        <div class="category-list">
          <el-table :data="categoryList" v-loading="categoryLoading">
            <el-table-column prop="name" label="分类名称" />
            <el-table-column prop="imageCount" label="图片数量" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editCategory(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCategory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 编辑分类弹窗 -->
        <el-dialog
          v-model="editCategoryDialogVisible"
          title="编辑分类"
          width="400px"
          append-to-body
        >
          <el-form :model="editCategoryForm" label-width="80px">
            <el-form-item label="分类名称">
              <el-input v-model="editCategoryForm.newName" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="editCategoryDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveCategoryEdit">保存</el-button>
          </template>
        </el-dialog>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete, Picture, User, SwitchButton, FolderOpened } from '@element-plus/icons-vue'

const authStore = useAuthStore()

// 数据
const images = ref([])
const categories = ref([])
const loading = ref(false)
const selectedImages = ref([])
const editDialogVisible = ref(false)

// 批量设置分类相关
const batchCategoryDialogVisible = ref(false)
const batchCategoryForm = reactive({
  category: ''
})

// 分类管理相关
const categoryDialogVisible = ref(false)
const categoryList = ref([])
const categoryLoading = ref(false)
const editCategoryDialogVisible = ref(false)
const newCategoryForm = reactive({
  name: ''
})
const editCategoryForm = reactive({
  oldName: '',
  newName: ''
})

// 搜索条件
const searchText = ref('')
const selectedCategory = ref('all')
const isPublicFilter = ref('all')

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 编辑表单
const editForm = reactive({
  id: '',
  category: '',
  description: '',
  isPublic: true
})

// 加载图片列表
const loadImages = async () => {
  try {
    loading.value = true
    
    const params = new URLSearchParams({
      page: pagination.page,
      limit: pagination.limit,
      search: searchText.value,
      category: selectedCategory.value === 'all' ? '' : selectedCategory.value,
      isPublic: isPublicFilter.value === 'all' ? '' : isPublicFilter.value
    })

    const response = await fetch(`/api/image-management/my-images?${params}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取图片列表失败')
    }

    const data = await response.json()
    
    // 转换字段名：蛇形命名转驼峰命名
    images.value = data.images.map(image => ({
      id: image.id,
      userId: image.user_id,
      filename: image.filename,
      originalName: image.original_name,
      storagePath: image.storage_path,
      fileSize: image.file_size,
      mimeType: image.mime_type,
      width: image.width,
      height: image.height,
      category: image.category,
      isPublic: image.is_public === 1,
      description: image.description,
      tags: image.tags,
      accessCount: image.access_count,
      thumbnailPath: image.thumbnail_path,
      metadata: image.metadata,
      createdAt: image.created_at,
      updatedAt: image.updated_at,
      // 添加前端需要的字段
      url: `/uploads/${image.storage_path}`,
      thumbnailUrl: image.thumbnail_path ? `/uploads/${image.thumbnail_path}` : `/uploads/${image.storage_path}`
    }))
    
    categories.value = data.categories
    pagination.total = data.pagination.total
  } catch (error) {
    ElMessage.error('获取图片列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  searchText.value = ''
  selectedCategory.value = 'all'
  isPublicFilter.value = 'all'
  pagination.page = 1
  loadImages()
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedImages.value = selection
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadImages()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadImages()
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 更新图片公开状态
const updateImagePublicStatus = async (image) => {
  try {
    const response = await fetch(`/api/image-management/${image.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        isPublic: image.isPublic
      })
    })

    if (!response.ok) {
      throw new Error('更新失败')
    }

    ElMessage.success('公开状态更新成功')
  } catch (error) {
    ElMessage.error('更新公开状态失败')
    // 恢复原始状态
    image.isPublic = !image.isPublic
  }
}

// 编辑图片
const editImage = (image) => {
  Object.assign(editForm, {
    id: image.id,
    category: image.category || '',
    description: image.description || '',
    isPublic: image.isPublic
  })
  editDialogVisible.value = true
}

// 保存编辑
const saveImageEdit = async () => {
  try {
    // 检查token是否有效
    if (!authStore.token) {
      ElMessage.error('登录已过期，请重新登录')
      // 不直接调用logout，而是跳转到登录页
      window.location.href = '/login'
      return
    }

    const response = await fetch(`/api/image-management/${editForm.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        category: editForm.category,
        description: editForm.description,
        isPublic: editForm.isPublic
      })
    })

    if (response.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      // 不直接调用logout，而是跳转到登录页
      window.location.href = '/login'
      return
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '保存失败')
    }

    ElMessage.success('图片信息更新成功')
    editDialogVisible.value = false
    await loadImages()
  } catch (error) {
    console.error('保存图片编辑失败:', error)
    if (error.message.includes('登录') || error.message.includes('认证')) {
      ElMessage.error('登录已过期，请重新登录')
      // 不直接调用logout，而是跳转到登录页
      window.location.href = '/login'
    } else {
      ElMessage.error(error.message || '保存失败')
    }
  }
}

// 删除单张图片
const deleteImage = async (image) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await fetch(`/api/image-management/${image.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('删除失败')
    }

    ElMessage.success('图片删除成功')
    loadImages()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除图片
const batchDeleteImages = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedImages.value.length} 张图片吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await fetch('/api/image-management/', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        imageIds: selectedImages.value.map(img => img.id)
      })
    })

    if (!response.ok) {
      throw new Error('批量删除失败')
    }

    ElMessage.success('批量删除成功')
    selectedImages.value = []
    loadImages()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 批量设置分类
const openBatchCategoryDialog = () => {
  batchCategoryForm.category = ''
  batchCategoryDialogVisible.value = true
}

const saveBatchCategory = async () => {
  try {
    if (selectedImages.value.length === 0) {
      ElMessage.warning('请先选择图片')
      return
    }

    const response = await fetch('/api/image-management/batch-update-category', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        imageIds: selectedImages.value.map(img => img.id),
        category: batchCategoryForm.category
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '批量设置分类失败')
    }

    ElMessage.success('批量设置分类成功')
    batchCategoryDialogVisible.value = false
    await loadImages()
    selectedImages.value = []
  } catch (error) {
    ElMessage.error(error.message || '批量设置分类失败')
  }
}

// 退出登录
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

// 分类管理相关函数
const openCategoryDialog = async () => {
  categoryDialogVisible.value = true
  await loadCategories()
}

const loadCategories = async () => {
  try {
    categoryLoading.value = true
    const response = await fetch('/api/categories/stats', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error('获取分类列表失败')
    }

    const data = await response.json()
    categoryList.value = data.categories || []
  } catch (error) {
    ElMessage.error('获取分类列表失败')
    console.error(error)
  } finally {
    categoryLoading.value = false
  }
}

const addCategory = async () => {
  if (!newCategoryForm.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        name: newCategoryForm.name.trim()
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '添加分类失败')
    }

    ElMessage.success('分类添加成功')
    newCategoryForm.name = ''
    await loadCategories()
    await loadImages() // 重新加载图片列表以更新分类选项
  } catch (error) {
    ElMessage.error(error.message || '添加分类失败')
  }
}

const editCategory = (category) => {
  editCategoryForm.oldName = category.name
  editCategoryForm.newName = category.name
  editCategoryDialogVisible.value = true
}

const saveCategoryEdit = async () => {
  if (!editCategoryForm.newName.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  try {
    const response = await fetch(`/api/categories/${encodeURIComponent(editCategoryForm.oldName)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        newName: editCategoryForm.newName.trim()
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '更新分类失败')
    }

    ElMessage.success('分类更新成功')
    editCategoryDialogVisible.value = false
    await loadCategories()
    await loadImages() // 重新加载图片列表以更新分类选项
  } catch (error) {
    ElMessage.error(error.message || '更新分类失败')
  }
}

const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？该分类下的图片将被移动到默认分类。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await fetch(`/api/categories/${encodeURIComponent(category.name)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '删除分类失败')
    }

    ElMessage.success('分类删除成功')
    await loadCategories()
    await loadImages() // 重新加载图片列表以更新分类选项
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除分类失败')
    }
  }
}

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.truncate-single {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* 自定义气泡提示样式 */
:deep(.el-tooltip__popper) {
  max-width: 300px !important;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  text-align: left;
}

:deep(.el-tooltip__popper .el-tooltip__content) {
  max-width: 300px;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.5;
}
</style>