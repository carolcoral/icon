# 🎨 在线图标库 | Online Icon Library

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.3.4-green.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.5-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.0-38B2AC.svg)](https://tailwindcss.com/)

一个功能丰富的纯静态图标资源库，提供现代化UI界面和出色的用户体验。支持多种图片格式、智能分类管理、实时搜索和响应式设计。

## ✨ 核心特性

### 🖼️ 多格式支持
- **PNG、ICO、JPG、JPEG、GIF、SVG** 全格式兼容
- 高清图标展示，保持原始画质
- 自适应图片尺寸处理

### 🗂️ 智能分类
- 自动扫描文件夹结构创建分类
- 动态分类管理，无需手动配置
- 直观的分类浏览界面

### 🔍 搜索筛选
- 实时关键词搜索，即时反馈
- 支持中文/英文搜索
- 智能匹配算法，快速定位

### 📱 响应式体验
- 完美适配桌面、平板、手机
- 移动端优先设计理念
- 流畅的触摸交互体验

### 🎯 实用功能
- **图片预览** - 点击查看大图模式
- **一键下载** - 快速保存所需图标  
- **链接复制** - 获取图片直链地址
- **分页浏览** - 20/50/100张每页可选

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装部署

1. **克隆项目**
```bash
git clone https://github.com/carolcoral/icon.git
cd icon
```

2. **安装依赖**
```bash
npm install
```

3. **开发模式**
```bash
npm run dev
```
访问 http://localhost:5173

4. **构建生产版本**
```bash
npm run build
```

5. **预生成图片数据**（可选）
```bash
npm run prebuild
```

## 📁 项目结构

```
icon/
├── public/                 # 静态资源
│   └── assets/
│       └── images/        # 图标资源目录
├── src/                   # 源代码
│   ├── assets/           # 静态资源
│   └── components/       # Vue组件
├── build-scripts/        # 构建脚本
├── package.json         # 项目配置
└── vite.config.js       # Vite配置
```

## 🎨 添加图标资源

### 创建新分类
在 `public/assets/images/` 下创建文件夹，系统会自动识别为分类：
```bash
# 示例：添加社交媒体分类
mkdir -p public/assets/images/social-media
```

### 添加图标文件
将图片文件放入对应分类文件夹：
```bash
# 示例：添加Twitter图标
cp twitter.png public/assets/images/social-media/
```

支持的文件格式：`.png`, `.ico`, `.jpg`, `.jpeg`, `.gif`, `.svg`

## 🌐 部署指南

### 一键部署
[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/carolcoral/icon)
[![部署到 Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/carolcoral/icon)
[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https://github.com/carolcoral/icon)

### 手动部署
1. 构建生产版本：`npm run build`
2. 部署 `dist` 目录到任意静态托管服务：
   - **Vercel** - 拖拽dist文件夹到Vercel
   - **Netlify** - 连接Git仓库自动部署
   - **GitHub Pages** - 启用Pages功能
   - **Nginx** - 配置静态文件服务

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | 3.3.4 | 前端框架 |
| **Vite** | 4.4.5 | 构建工具 |
| **Tailwind CSS** | 3.3.0 | 样式框架 |
| **Headless UI** | 1.7.16 | UI组件 |
| **Heroicons** | 2.0.18 | 图标库 |

## 🤝 贡献指南

欢迎贡献代码和图标资源！

1. Fork 本项目
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交Pull Request

### 图标贡献规范
- 图片尺寸建议：64x64 ～ 512x512
- 格式优先：SVG > PNG > ICO
- 保持命名一致性：英文小写，使用连字符
- 确保图片清晰无压缩痕迹

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与反馈

- 🐛 **问题报告**: [GitHub Issues](https://github.com/carolcoral/icon/issues)
- 💡 **功能建议**: 提交Issue或Pull Request
- 🌟 **Star支持**: 如果觉得项目有用，请给个Star！

## 🔮 开发计划

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史和未来计划。

---

**享受使用！** 🎉 如果有任何问题，请随时提出Issue。