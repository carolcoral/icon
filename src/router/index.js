import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// 路由组件
const Home = () => import('../views/Home.vue')
const Gallery = () => import('../views/Gallery.vue')
const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const UserCenter = () => import('../views/UserCenter.vue')
const Upload = () => import('../views/Upload.vue')
const ForgotPassword = () => import('../views/ForgotPassword.vue')
const ImageManagement = () => import('../views/ImageManagement.vue')
const UserManagement = () => import('../views/UserManagement.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页 - 图床服务' }
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery,
    meta: { title: '图片画廊' }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
    meta: { title: '上传图片' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '用户登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: '用户注册' }
  },
  {
    path: '/user',
    name: 'UserCenter',
    component: UserCenter,
    meta: { title: '用户中心' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { title: '重置密码' }
  },
  {
    path: '/image-management',
    name: 'ImageManagement',
    component: ImageManagement,
    meta: { title: '图片管理' }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: '用户管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  const authStore = useAuthStore()
  
  // 不需要认证的页面
  const publicPages = ['/', '/gallery', '/login', '/register', '/forgot-password']
  const authRequired = !publicPages.includes(to.path)
  
  // 如果页面需要认证
  if (authRequired) {
    // 检查本地是否有token
    if (authStore.token) {
      try {
        // 验证token是否有效
        const isValid = await authStore.checkAuthStatus()
        if (isValid) {
          next()
        } else {
          // token无效，跳转到登录页
          next('/login')
        }
      } catch (error) {
        // 验证失败，跳转到登录页
        next('/login')
      }
    } else {
      // 没有token，跳转到登录页
      next('/login')
    }
  } else {
    // 如果是登录/注册页且已登录，跳转到首页
    if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
      next('/')
    } else {
      next()
    }
  }
})

export default router