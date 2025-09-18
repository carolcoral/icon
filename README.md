# 🎨 在线图标库

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.3.4-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)

**基于 Vue3 + Express + Vite 的现代化在线图标库管理系统**

[快速开始](#-快速开始) | [功能特性](#-功能特性) | [项目结构](#-项目结构) | [API文档](#-api接口)

</div>

## ✨ 功能特性

- 🖼️ **多格式支持** - 支持 PNG、ICO、JPG、JPEG、GIF、SVG 等多种图片格式
- 📁 **智能分类管理** - 自动识别文件夹结构，支持动态分类创建
- 🔍 **实时搜索** - 基于文件名的智能搜索功能
- 📄 **分页展示** - 支持灵活的分页配置（20/50/100张每页）
- ⬆️ **图片上传** - 支持拖拽上传和分类选择
- 🗑️ **图片删除** - 安全的图片删除功能
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🚀 **高性能** - 基于 Vite 的快速开发和构建

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/carolcoral/icon.git
cd icon
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
# 同时启动前端和后端
npm run dev:full

# 或者分别启动
npm run start:dev  # 启动后端 (端口3000)
npm run dev        # 启动前端 (端口5173)
```

4. **访问应用**
- 前端应用：http://localhost:5173
- 后端API：http://localhost:3000

## 📁 项目结构

```
icon/
├── 📁 src/                    # Vue3 前端源码
│   ├── 📄 App.vue            # 主应用组件
│   ├── 📄 main.js            # 应用入口
│   ├── 📄 style.css          # 全局样式
│   ├── 📁 components/        # Vue组件
│   └── 📁 services/          # API服务
├── 📁 node-functions/        # Express后端
│   └── 📁 express/
│       ├── 📄 [[index]].js   # 开发环境服务器
│       └── 📄 [[production]].js # 生产环境服务器
├── 📁 public/                # 静态资源
│   └── 📁 assets/
│       └── 📁 images/        # 图片存储目录
│           ├── 📁 docker/    # Docker图标分类
│           ├── 📁 github/    # GitHub徽章分类
│           └── 📁 other/     # 其他图标分类
├── 📄 vite.config.js         # Vite开发配置
├── 📄 vite.config.production.js # Vite生产配置
├── 📄 package.json           # 项目依赖配置
├── 📄 tailwind.config.js     # Tailwind CSS配置
└── 📄 README.md             # 项目文档
```

## 🖼️ 图片管理

### 图片目录结构

图片存储在 `public/assets/images/` 目录下，按分类文件夹组织：

```
public/assets/images/
├── 📁 docker/     # Docker相关图标
├── 📁 github/     # GitHub徽章和图标
├── 📁 other/      # 其他分类图标
└── 📁 synology/   # Synology相关图标
```

### 添加新分类

1. **创建分类文件夹**
```bash
mkdir public/assets/images/your-category
```

2. **添加图片文件**
```bash
# 支持的格式：png, ico, jpg, jpeg, gif, svg
cp your-image.png public/assets/images/your-category/
```

3. **自动识别**
系统会自动检测新分类，刷新页面即可在分类下拉框中看到

### 图片访问方式

支持多种访问格式：

#### 直接访问（推荐）
```
http://localhost:3000/<分类名>/<图片名>
```

#### API访问
```
http://localhost:3000/images/<分类名>/<图片名>
```

#### 前端代理访问
```
http://localhost:5173/<分类名>/<图片名>
```

### 示例访问

假设有文件 `public/assets/images/github/logo.png`：

- ✅ `http://localhost:3000/github/logo.png`
- ✅ `http://localhost:3000/images/github/logo.png`
- ✅ `http://localhost:5173/github/logo.png`

## 🛠️ 开发指南

### 开发命令

```bash
npm run dev          # 启动前端开发服务器
npm run start:dev    # 启动后端开发服务器
npm run dev:full     # 同时启动前后端
npm run build        # 构建生产版本
npm start           # 启动生产服务器
```

### 技术栈

**前端技术栈：**
- Vue 3.3.4 - 渐进式JavaScript框架
- Vite 4.4.5 - 下一代前端构建工具
- Tailwind CSS 3.3.0 - 实用优先的CSS框架
- Axios 1.5.0 - HTTP客户端
- @headlessui/vue - 无障碍UI组件
- @heroicons/vue - 精美图标库

**后端技术栈：**
- Express 4.18.2 - Web应用框架
- CORS - 跨域资源共享中间件
- Multer - 文件上传处理
- fs-extra - 增强的文件系统操作

## 📡 API接口

### 获取分类列表

```http
GET /api/categories
```

**响应示例：**
```json
[
  { "label": "docker", "value": "docker" },
  { "label": "github", "value": "github" },
  { "label": "other", "value": "other" }
]
```

### 获取图片列表

```http
GET /api/images?category=all&page=1&limit=20
```

**查询参数：**
- `category`: 分类名称（可选，默认"all"）
- `page`: 页码（可选，默认1）
- `limit`: 每页数量（可选，默认20）
- `search`: 搜索关键词（可选）

**响应示例：**
```json
{
  "images": [
    {
      "name": "logo.png",
      "category": "github",
      "url": "/images/github/logo.png",
      "path": "github/logo.png"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### 上传图片

```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- image: 图片文件
- category: 分类名称
```

### 删除图片

```http
DELETE /api/images/:category/:imageName
```

## 🚀 部署指南

### 生产环境构建

```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

### 环境变量配置

支持以下环境变量：
- `PORT`: 服务器端口（默认3000）
- `NODE_ENV`: 环境模式（development/production）

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }

    # 图片访问代理
    location ~ ^/([^/]+)/([^/]+\.(png|ico|jpg|jpeg|gif|svg))$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 代码规范

- 遵循Vue 3 Composition API最佳实践
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 添加适当的注释和文档

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 📞 联系方式

- 项目地址：https://github.com/carolcoral/icon
- Issues：https://github.com/carolcoral/icon/issues
- 作者：XIN·DU

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by [XIN·DU](https://xindu.site)

</div>