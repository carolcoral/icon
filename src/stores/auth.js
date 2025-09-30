import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  
  const login = async (credentials) => {
    try {
      // 将前端格式转换为后端API格式
      const requestData = {
        username: credentials.username,
        password: credentials.password
      }
      
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      // 检查响应状态
      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || `登录失败 (${response.status})`)
        } catch (parseError) {
          throw new Error(`登录失败 (${response.status})`)
        }
      }
      
      // 尝试解析JSON响应
      let data;
      try {
        const responseText = await response.text()
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON解析错误:', parseError, '响应内容:', responseText)
        throw new Error('服务器返回了无效的JSON响应')
      }
      
      // 保存token和用户信息
      token.value = data.token
      user.value = data.user
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return data
    } catch (error) {
      console.error('登录错误详情:', error)
      throw error
    }
  }
  
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      if (!response.ok) {
        throw new Error('注册失败')
      }
      
      return await response.json()
    } catch (error) {
      throw error
    }
  }
  
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 自动跳转到首页
    if (window.location.pathname !== '/') {
      window.location.href = '/'
    }
  }
  
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || `更新失败 (${response.status})`)
        } catch (parseError) {
          throw new Error(`更新失败 (${response.status})`)
        }
      }
      
      const data = await response.json()
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return data
    } catch (error) {
      throw error
    }
  }
  
  const checkAuthStatus = async () => {
    if (!token.value) return false
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // 更新用户信息
        user.value = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
        return true
      } else {
        // Token无效，清除本地存储
        logout()
        return false
      }
    } catch (error) {
      // 网络错误时保持当前状态，不自动登出
      console.error('验证token失败:', error)
      return true // 网络错误时保持登录状态
    }
  }
  
  const refreshToken = async () => {
    if (!token.value) return null
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        token.value = data.token
        localStorage.setItem('token', data.token)
        return data.token
      }
    } catch (error) {
      console.error('刷新token失败:', error)
    }
    
    return null
  }
  
  return {
    token,
    user,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
    refreshToken
  }
})