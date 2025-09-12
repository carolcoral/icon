import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // 代理所有图片分类路径到后端
      '^/(?!src|node_modules|@|\\.|vite)([^/]+)/([^/]+\\.(png|ico|jpg|jpeg|gif|svg))$': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})