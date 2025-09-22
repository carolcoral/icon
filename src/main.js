import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import imageData from './assets/image-data.json'

console.log('静态图片数据加载完成:', Object.keys(imageData).length + '个分类');

const app = createApp(App);
app.mount('#app');