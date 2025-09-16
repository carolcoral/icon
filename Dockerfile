# 图标管理系统 Docker 配置 - 开发环境一体化构建
FROM node:18-alpine

# 添加构建参数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# 添加标签
LABEL maintainer="XIN·DU <https://xindu.site>" \
      org.opencontainers.image.title="Online Icon Library" \
      org.opencontainers.image.description="基于Vue3 + Node.js + Express的现代化在线图标库管理系统" \
      org.opencontainers.image.url="https://github.com/carolcoral/icon" \
      org.opencontainers.image.source="https://github.com/carolcoral/icon" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="MIT"

# 设置工作目录
WORKDIR /app

# 复制根目录 package.json
COPY package*.json ./

# 安装根目录依赖
RUN npm ci && npm cache clean --force

# 复制客户端 package.json
COPY client/package*.json ./client/

# 安装客户端依赖（包括开发依赖，用于 vite dev server）
WORKDIR /app/client
RUN npm ci && npm cache clean --force

# 回到根目录
WORKDIR /app

# 复制所有源代码
COPY . .

# 创建图片目录（如果不存在）
RUN mkdir -p public/assets/images

# 设置权限，确保可以读写图片目录
RUN chmod -R 755 public/assets/images

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# 更改文件所有权
RUN chown -R appuser:nodejs /app
USER appuser

# 暴露端口（前端开发服务器）
EXPOSE 5173
# 暴露后端API端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/categories', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 启动脚本：同时启动前端开发服务器和后端API
CMD ["npm", "run", "dev"]