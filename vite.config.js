import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  },
  // 开发服务器配置
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      'icon.xindu.site',
      'localhost',
      '127.0.0.1',
      '.xindu.site',
      'all'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})