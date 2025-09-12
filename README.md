# 🎨 图标管理系统

<div align="center">

![Vue.js](https://img.shields.io/badge/Vue.js-3.3.4-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)

**基于 Vue3 + Node.js + Tailwind CSS 的现代化图标管理系统**

[在线演示](https://icon.xindu.site) | [快速开始](#-快速开始) | [API文档](#-api接口) | [贡献指南](#-贡献指南)

</div>

## ✨ 功能特性

- 🖼️ **多格式支持** - 支持 PNG、ICO、JPG、JPEG、GIF、SVG 等多种图片格式
- 📁 **智能分类** - 自动识别 `public/assets/images/` 下的文件夹作为分类标签
- 🔗 **直接访问** - 支持 `<域名>/<属性名>/<图片名>` 格式直接访问图片
- 📄 **分页展示** - 支持 20/50/100 张每页的灵活分页
- 🔍 **分类筛选** - 基于文件夹的智能分类搜索功能
- ⚙️ **可配置** - 支持自定义页面标题、Logo、页脚信息等
- 📱 **响应式** - 完美适配桌面端和移动端
- 🚀 **高性能** - 基于 Vite 的快速开发和构建

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/icon-manager.git
cd icon-manager
```

2. **安装依赖**
```bash
# 安装所有依赖（前端+后端）
npm run install-all

# 或者分别安装
npm install                    # 后端依赖
cd client && npm install       # 前端依赖
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
- 前端应用：http://localhost:5173
- 后端API：http://localhost:3000

## 📁 项目结构

```
icon-manager/
├── 📁 client/                 # Vue3 前端项目
│   ├── 📁 src/
│   │   ├── 📄 App.vue         # 主组件
│   │   ├── 📄 main.js         # 入口文件
│   │   └── 📄 style.css       # 全局样式
│   ├── 📄 index.html          # HTML模板
│   ├── 📄 package.json        # 前端依赖
│   ├── 📄 vite.config.js      # Vite配置
│   └── 📄 tailwind.config.js  # Tailwind配置
├── 📁 server/                 # Node.js 后端
│   └── 📄 index.js            # 服务器入口
├── 📁 public/
│   └── 📁 assets/
│       └── 📁 images/         # 🎯 图片存储目录
│           └── 📁 github/     # GitHub徽章分类
├── 📄 package.json            # 项目依赖
└── 📄 README.md              # 项目文档
```

## 📸 图片管理

### 添加图片

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
   - 系统会自动识别新的文件夹作为分类
   - 刷新页面即可在分类选择器中看到新分类

### 图片访问方式

系统支持多种图片访问方式：

#### 1. 直接访问（推荐）
```
http://localhost:3000/<分类名>/<图片名>
```

#### 2. 标准API访问
```
http://localhost:3000/images/<分类名>/<图片名>
```

#### 3. 前端代理访问
```
http://localhost:5173/<分类名>/<图片名>
```

### 示例

假设你有一个文件 `public/assets/images/github/logo.png`：

- ✅ `http://localhost:3000/github/logo.png`
- ✅ `http://localhost:3000/images/github/logo.png`
- ✅ `http://localhost:5173/github/logo.png`

## 🔧 配置说明

### 站点配置

在 `client/src/App.vue` 中修改站点配置：

```javascript
const siteConfig = reactive({
  title: '图标管理系统',           // 网站标题
  logo: '/path/to/logo.png',      // 网站Logo（可选）
  navigation: [                   // 导航菜单
    { name: '首页', href: '#' },
    { name: '关于', href: '#about' },
    { name: '帮助', href: '#help' }
  ],
  copyright: '© 2024 图标管理系统. All rights reserved.',
  icp: 'ICP备案号：京ICP备12345678号'  // ICP备案信息（可选）
})
```

### 服务器配置

在 `server/index.js` 中修改服务器配置：

```javascript
const PORT = process.env.PORT || 3000;  // 服务器端口
```

## 🛠️ 开发指南

### 开发模式

```bash
npm run dev          # 同时启动前后端开发服务器
npm run server       # 仅启动后端服务器
npm run client       # 仅启动前端开发服务器
```

### 生产构建

```bash
npm run build        # 构建前端项目
npm start           # 启动生产服务器
```

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Vue 3 Composition API 最佳实践
- 使用 Tailwind CSS 进行样式开发

## 📡 API接口

### 获取分类列表

```http
GET /api/categories
```

**响应示例：**
```json
[
  { "label": "github", "value": "github" },
  { "label": "icons", "value": "icons" }
]
```

### 获取图片列表

```http
GET /api/images?category=github&page=1&limit=20
```

**参数说明：**
- `category`: 分类名称（可选，默认为 "all"）
- `page`: 页码（可选，默认为 1）
- `limit`: 每页数量（可选，默认为 20）

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
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### 直接访问图片

```http
GET /<category>/<imageName>
```

**示例：**
```http
GET /github/logo.png
```

## 🚀 部署指南

### Docker 部署

1. **构建镜像**
```bash
docker build -t icon-manager .
```

2. **运行容器**
```bash
docker run -p 3000:3000 -v $(pwd)/public/assets/images:/app/public/assets/images icon-manager
```

### 传统部署

1. **构建项目**
```bash
npm run build
```

2. **上传文件**
```bash
# 上传以下文件到服务器
- server/
- public/
- package.json
- 构建后的前端文件
```

3. **安装依赖并启动**
```bash
npm install --production
npm start
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 图片直接访问
    location ~ ^/([^/]+)/([^/]+\.(png|ico|jpg|jpeg|gif|svg))$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **Fork 项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 开发规范

- 遵循现有的代码风格
- 添加适当的注释
- 确保所有测试通过
- 更新相关文档

## 📝 更新日志

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🎨 现代化界面设计
- 📁 智能分类管理
- 🔗 多种访问方式
- 📱 响应式设计

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Express.js](https://expressjs.com/) - 快速、极简的 Node.js Web 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📞 联系我们

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/icon-manager/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/icon-manager/discussions)

---

<div align="center">

### 📈 项目热度趋势

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/icon-manager&type=Date)](https://star-history.com/#your-username/icon-manager&Date)

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by [Your Name](https://github.com/your-username)

</div>
