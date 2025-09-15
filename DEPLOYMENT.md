# 🚀 GitHub Actions 自动构建部署指南

## 📋 概述

本项目已配置 GitHub Actions 工作流，实现：
- ⏰ **每天凌晨3点**自动构建和发布 Docker 镜像
- 🏗️ **多架构支持** (AMD64/ARM64)
- 📦 **自动版本管理**和标签
- 🔄 **手动触发**构建

## 🎯 快速开始

### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "feat: 添加 GitHub Actions 自动构建配置"
git push origin main
```

### 2. 查看工作流状态
1. 访问 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 查看 "Build and Push Docker Image" 工作流

### 3. 手动触发测试
1. 在 Actions 页面选择工作流
2. 点击 "Run workflow"
3. 选择分支并执行

## 🐳 镜像使用

### GitHub Container Registry (推荐)
```bash
# 拉取最新镜像
docker pull ghcr.io/your-username/icon-manager:latest

# 运行容器
docker run -d -p 3000:3000 --name icon-manager \
  ghcr.io/your-username/icon-manager:latest
```

### Docker Hub (可选)
```bash
# 拉取最新镜像
docker pull your-username/icon-manager:latest

# 运行容器
docker run -d -p 3000:3000 --name icon-manager \
  your-username/icon-manager:latest
```

## ⚙️ 配置说明

### 自动触发条件
- 🕐 **定时触发**: 每天凌晨3点（北京时间）
- 🔄 **代码推送**: 推送到 main 分支时
- 🏷️ **版本发布**: 创建 v* 标签时
- 👆 **手动触发**: 在 GitHub Actions 页面手动执行

### 镜像标签策略
- `latest`: main 分支最新版本
- `v1.0.0`: 具体版本号
- `v1.0`: 主版本号
- `v1`: 大版本号
- `main-abc1234`: 分支名-提交哈希

## 🔧 高级配置

### Docker Hub 配置 (可选)
如果需要发布到 Docker Hub，需要设置以下 Secrets：

1. 在 GitHub 仓库设置中添加：
   - `DOCKERHUB_USERNAME`: 您的 Docker Hub 用户名
   - `DOCKERHUB_TOKEN`: Docker Hub 访问令牌

2. 获取 Docker Hub Token：
   - 登录 Docker Hub
   - 进入 Account Settings → Security
   - 创建新的 Access Token

### 自定义构建时间
修改 `.github/workflows/docker-build.yml` 中的 cron 表达式：
```yaml
schedule:
  - cron: '0 19 * * *'  # UTC 19:00 = 北京时间 03:00
```

## 📊 监控和维护

### 构建状态监控
- ✅ **成功**: 绿色勾号
- ❌ **失败**: 红色叉号  
- 🟡 **进行中**: 黄色圆圈

### 常见问题排查

#### 1. 构建失败
- 检查 Dockerfile 语法
- 确认所有依赖文件存在
- 查看构建日志获取详细错误

#### 2. 推送失败
- 检查容器注册表凭据
- 确认镜像名称格式正确
- 验证权限设置

#### 3. 定时任务不执行
- 确认仓库是公开的或已启用 Actions
- 检查 cron 表达式格式
- 验证 GitHub Actions 服务状态

## 🛡️ 安全最佳实践

- ✅ 使用非 root 用户运行容器
- ✅ 定期更新基础镜像
- ✅ 扫描镜像安全漏洞
- ✅ 限制 Secrets 权限范围
- ✅ 使用多阶段构建减小镜像大小

## 📈 性能优化

- 🚀 使用构建缓存加速构建
- 📦 多架构并行构建
- 🔄 增量构建和推送
- 💾 优化 Dockerfile 层缓存

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 多架构构建](https://docs.docker.com/buildx/working-with-buildx/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Hub](https://hub.docker.com/)

---

**🎉 恭喜！您的项目现在支持自动构建和发布了！**
