# GitHub Actions 自动构建和发布配置

本项目配置了 GitHub Actions 工作流，实现每天凌晨3点自动构建和发布 Docker 镜像。

## 🚀 工作流功能

### 1. GitHub Container Registry (推荐)
- **文件**: `.github/workflows/docker-build.yml`
- **镜像地址**: `ghcr.io/your-username/icon-manager`
- **触发条件**:
  - 每天凌晨3点（北京时间）自动触发
  - 推送到 main 分支时触发
  - 创建版本标签时触发
  - 手动触发

### 2. Docker Hub (可选)
- **文件**: `.github/workflows/dockerhub-build.yml`
- **镜像地址**: `your-username/icon-manager`
- **需要额外配置**: Docker Hub 用户名和访问令牌

## ⚙️ 配置步骤

### GitHub Container Registry (自动配置)
1. 无需额外配置，使用 GitHub Token 自动认证
2. 镜像会自动发布到 `ghcr.io/your-username/icon-manager`

### Docker Hub (可选配置)
1. 在 Docker Hub 创建访问令牌
2. 在 GitHub 仓库设置中添加 Secrets:
   - `DOCKERHUB_USERNAME`: 您的 Docker Hub 用户名
   - `DOCKERHUB_TOKEN`: Docker Hub 访问令牌

## 📋 镜像标签策略

- `latest`: main 分支的最新版本
- `v1.0.0`: 版本标签
- `v1.0`: 主版本号
- `v1`: 大版本号
- `main-abc1234`: 分支名-提交哈希

## 🏗️ 多架构支持

支持以下架构：
- `linux/amd64` (Intel/AMD 64位)
- `linux/arm64` (ARM 64位)

## 📦 使用方法

### 拉取镜像
```bash
# GitHub Container Registry
docker pull ghcr.io/your-username/icon-manager:latest

# Docker Hub (如果配置了)
docker pull your-username/icon-manager:latest
```

### 运行容器
```bash
# 基本运行
docker run -d -p 3000:3000 --name icon-manager ghcr.io/your-username/icon-manager:latest

# 使用 Docker Compose
docker-compose up -d
```

## 🔧 手动触发

1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Build and Push Docker Image" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支并点击 "Run workflow"

## 📊 构建状态

- ✅ 成功: 绿色勾号
- ❌ 失败: 红色叉号
- 🟡 进行中: 黄色圆圈

## 🛠️ 故障排除

### 常见问题

1. **权限错误**
   - 确保仓库有 `packages: write` 权限
   - 检查 GitHub Token 是否有效

2. **构建失败**
   - 检查 Dockerfile 语法
   - 确认所有依赖文件存在
   - 查看构建日志获取详细错误信息

3. **推送失败**
   - 检查容器注册表凭据
   - 确认镜像名称格式正确

### 调试步骤

1. 查看 Actions 日志
2. 检查 Secrets 配置
3. 验证 Dockerfile 语法
4. 测试本地构建

## 📈 监控和维护

- 定期检查构建状态
- 监控镜像大小和构建时间
- 更新依赖版本
- 清理旧版本镜像

## 🔒 安全考虑

- 使用非 root 用户运行容器
- 定期更新基础镜像
- 扫描镜像漏洞
- 限制 Secrets 权限范围
