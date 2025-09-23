# 在线图标库

纯静态图标资源库，提供常用软件/服务的图标资源。


[![使用 EdgeOne Pages 部署（国际版）](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/carolcoral/icon)
[![使用 EdgeOne Pages 部署（国内版）](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https://github.com/carolcoral/icon)


## 主要功能

- 自动扫描分类图片资源
- 支持按分类浏览
- 支持关键词搜索
- 图片预览和下载
- 响应式设计，适配各种设备

## 技术栈

- Vue 3 + Vite
- Tailwind CSS
- 纯静态架构

## 使用说明

1. 安装依赖：
```bash
npm install
```

2. 开发模式：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

4. 预生成图片数据：
```bash
npm run prebuild
```

## 部署指南

1. 构建生产版本
2. 部署到任意静态网站托管服务：
   - Vercel
   - Netlify 
   - GitHub Pages
   - Nginx

## 项目结构

- `public/assets/images` - 图片资源
- `src/components` - Vue组件
- `build-scripts` - 构建脚本

## 贡献指南

欢迎提交Pull Request添加新图标资源。

## 许可证

MIT License