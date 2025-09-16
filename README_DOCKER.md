# 🐳 Docker 部署指南

### ✅ 实现的功能

1. **图片文件夹映射到宿主机**
   - 支持实时同步：宿主机增删图片 → 容器内立即更新
   - 映射路径：`./public/assets/images` ↔ `/app/public/assets/images`

2. **开发环境一体化构建**
   - 前后端打包在同一个镜像中
   - 使用 `npm run dev` 同时启动前后端服务
   - 支持热重载和实时开发

3. **直接端口访问**
   - 移除了 nginx 代理配置
   - 直接暴露 5173 端口访问前端
   - 暴露 3000 端口访问后端 API

## 🚀 快速启动

### 方式一：Docker Compose（推荐）

```bash
# 检查 Docker 环境
.\test-docker-setup.bat

# 构建并启动
docker compose up --build

# 或后台运行
docker compose up -d --build
```

### 方式二：本地开发

```bash
# 本地启动（不使用 Docker）
.\start-local.bat
```

## 📁 目录结构

```
icon/
├── Dockerfile                 # 开发环境一体化构建
├── docker-compose.yml         # 服务编排配置
├── public/assets/images/       # 图片目录（映射到宿主机）
│   ├── icons/                 # 图标分类
│   ├── logos/                 # 标志分类
│   └── avatars/               # 头像分类
├── client/                    # 前端代码
├── node-functions/            # 后端代码
└── package.json               # 项目配置
```

## 🔧 配置详情

### Dockerfile 特性
- **单阶段构建**：简化构建流程
- **开发环境**：保留所有开发依赖
- **用户权限**：非 root 用户运行
- **健康检查**：自动监控服务状态

### docker-compose.yml 特性
- **端口映射**：5173（前端）+ 3000（后端）
- **卷映射**：图片目录实时同步
- **环境变量**：开发环境配置
- **网络隔离**：独立网络空间

## 📊 使用方法

### 1. 添加图片
```bash
# 直接在宿主机操作
cp your-image.png ./public/assets/images/icons/
mkdir ./public/assets/images/new-category
```

### 2. 访问服务
- **前端界面**：http://localhost:5173
- **API 接口**：http://localhost:3000/api/categories
- **图片直链**：http://localhost:3000/assets/images/icons/home.png

### 3. 管理容器
```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # Windows 查看端口占用
   netstat -ano | findstr :5173
   netstat -ano | findstr :3000
   ```

2. **图片不显示**
   - 检查文件路径：`./public/assets/images/`
   - 确认文件格式：PNG, ICO, JPG, JPEG, GIF, SVG
   - 验证文件权限

3. **容器启动失败**
   ```bash
   # 查看详细日志
   docker compose logs icon-manager
   
   # 重新构建
   docker compose build --no-cache
   ```

## 🎯 开发建议

1. **实时开发**：修改代码后自动重载
2. **图片管理**：直接操作宿主机文件夹
3. **调试模式**：查看容器日志定位问题
4. **性能优化**：生产环境请使用构建版本

## 📝 注意事项

- 确保 Docker Desktop 正在运行
- 图片目录权限设置正确
- 端口 5173 和 3000 未被占用
- 建议图片文件大小不超过 10MB