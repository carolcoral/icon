import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0', // 允许外部访问
    allowedHosts: 'all', // 允许所有主机访问（生产环境推荐）
=======
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
  // 开发服务器配置
  server: {
    port: 5173,
    host: '0.0.0.0', // 允许外部访问
    allowedHosts: 'all', // 允许所有主机访问
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