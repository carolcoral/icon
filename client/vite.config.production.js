import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 生产环境专用配置
export default defineConfig({
  plugins: [vue()],
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'axios'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  },
  // 生产环境服务器配置
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: 'all', // 生产环境允许所有主机
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://icon.xindu.site' 
          : 'http://localhost:3000',
        changeOrigin: true,
        secure: true
      },
      '/images': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://icon.xindu.site' 
          : 'http://localhost:3000',
        changeOrigin: true,
        secure: true
      }
    }
  },
  // 预览服务器配置（用于生产构建预览）
  preview: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: 'all'
  }
})