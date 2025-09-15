# Next.js 图标管理系统部署指南

## 🚀 部署方式

### 1. Docker 部署（推荐）

#### 快速启动
```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f nextjs-backend
```

#### 自定义配置
1. 修改 `docker-compose.yml` 中的端口映射
2. 更新 `nginx.conf` 中的域名配置
3. 添加 SSL 证书到 `ssl/` 目录

### 2. 传统部署

#### 构建项目
```bash
npm run build
npm start
```

#### PM2 部署
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "icon-backend" -- start

# 保存 PM2 配置
pm2 save
pm2 startup
```

## 🔧 环境配置

### 环境变量
创建 `.env.production` 文件：
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# 可选：数据库配置
# DATABASE_URL=your_database_url

# 可选：文件存储配置
# UPLOAD_PATH=/app/public/assets/images
```

### 生产环境优化
1. **图片存储**: 建议使用外部存储服务（如 AWS S3、阿里云 OSS）
2. **CDN**: 配置 CDN 加速静态资源访问
3. **监控**: 添加应用监控和日志收集
4. **备份**: 定期备份图片文件和配置

## 🌐 域名配置

### Nginx 反向代理
1. 修改 `nginx.conf` 中的 `server_name`
2. 配置 SSL 证书
3. 重启 Nginx 服务

### 直接访问
如果不使用 Nginx，确保防火墙开放 3000 端口：
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 📊 健康检查

### API 端点测试
```bash
# 检查服务状态
curl http://your-domain.com/api/categories

# 检查图片访问
curl http://your-domain.com/github/github.png
```

### 监控脚本
```bash
#!/bin/bash
# health-check.sh
ENDPOINT="http://localhost:3000/api/categories"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

## 🔒 安全配置

### 1. 文件上传限制
- 最大文件大小：10MB
- 允许的文件类型：PNG, ICO, JPG, JPEG, GIF, SVG
- 文件名过滤和清理

### 2. CORS 配置
生产环境建议限制 CORS 来源：
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-frontend-domain.com' },
        // ...其他头部
      ],
    },
  ];
}
```

### 3. 速率限制
建议添加 API 速率限制中间件。

## 📝 维护操作

### 日志管理
```bash
# Docker 日志
docker-compose logs --tail=100 nextjs-backend

# PM2 日志
pm2 logs icon-backend
```

### 备份恢复
```bash
# 备份图片文件
tar -czf images-backup-$(date +%Y%m%d).tar.gz public/assets/images/

# 恢复图片文件
tar -xzf images-backup-20241201.tar.gz
```

### 更新部署
```bash
# Docker 更新
docker-compose pull
docker-compose up -d

# 传统更新
git pull
npm install
npm run build
pm2 restart icon-backend
```

## 🚨 故障排除

### 常见问题
1. **端口占用**: 检查端口是否被其他服务占用
2. **权限问题**: 确保图片目录有写入权限
3. **内存不足**: 监控服务器资源使用情况
4. **网络问题**: 检查防火墙和网络配置

### 调试命令
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查进程状态
ps aux | grep node
```

## 📞 技术支持

如遇到部署问题，请检查：
1. Node.js 版本 >= 18
2. 系统资源充足
3. 网络连接正常
4. 配置文件语法正确