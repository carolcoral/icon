import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import axios from 'axios'

// 扫描图片目录并构建缓存数据结构
const scanImageDirectory = async () => {
  try {
    const response = await axios.get('/api/categories');
    const categories = response.data;
    const imageData = {};

    for (const category of categories) {
      const catResponse = await axios.get(`/api/images?category=${category.value}`);
      imageData[category.value] = catResponse.data.images.map(img => img.name);
    }

    // 发送缓存数据到后端
    await axios.post('/api/update-image-cache', imageData);
    console.log('图片缓存初始化完成');
  } catch (error) {
    console.error('图片缓存初始化失败:', error);
  }
};

const app = createApp(App);

// 应用启动时初始化图片缓存
app.mount('#app');
scanImageDirectory();