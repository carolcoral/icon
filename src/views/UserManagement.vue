<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">用户管理</h1>
      
      <!-- 搜索和筛选区域 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex flex-wrap gap-4">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户名、邮箱..."
            class="w-64"
            clearable
          />
          <el-select v-model="roleFilter" placeholder="角色筛选" clearable>
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-button type="primary" @click="loadUsers">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="bg-white rounded-lg shadow-sm">
        <el-table :data="users" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'primary'">
                {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="expiresAt" label="有效期至" width="180">
            <template #default="scope">
              {{ scope.row.expiresAt ? formatDate(scope.row.expiresAt) : '永久' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="editUser(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteUser(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="p-4">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next"
            @size-change="loadUsers"
            @current-change="loadUsers"
          />
        </div>
      </div>
    </div>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" readonly />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="editForm.expiresAt"
            type="datetime"
            placeholder="选择有效期"
            :disabled-date="disabledDate"
          />
          <div class="text-xs text-gray-500 mt-1">留空表示永久有效</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = ref({
  id: '',
  username: '',
  email: '',
  role: 'user',
  expiresAt: null
})

const loadUsers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      role: roleFilter.value
    })
    
    const response = await fetch(`/api/admin/users?${params}`)
    const data = await response.json()
    
    if (data.users) {
      users.value = data.users
      total.value = data.pagination?.total || data.users.length
    } else {
      ElMessage.error(data.message || '加载用户列表失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  currentPage.value = 1
  loadUsers()
}

const editUser = (user) => {
  editForm.value = { ...user }
  editDialogVisible.value = true
}

const saveUser = async () => {
  try {
    // 只发送允许修改的字段
    const updateData = {
      role: editForm.value.role,
      expiresAt: editForm.value.expiresAt
    }
    
    const response = await fetch(`/api/admin/users/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })
    
    const data = await response.json()
    if (data.message === '用户信息更新成功') {
      ElMessage.success('用户信息更新成功')
      editDialogVisible.value = false
      loadUsers()
    } else {
      ElMessage.error(data.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  }
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
      '确认删除',
      { type: 'warning' }
    )
    
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: 'DELETE'
    })
    
    const data = await response.json()
    if (data.message === '用户删除成功') {
      ElMessage.success('用户删除成功')
      loadUsers()
    } else {
      ElMessage.error(data.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>