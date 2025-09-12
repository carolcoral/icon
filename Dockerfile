# 图标管理系统 Docker 配置
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖
RUN npm install
RUN cd client && npm install

# 复制源代码
COPY . .

# 构建前端项目
RUN cd client && npm run build

# 创建图片目录
RUN mkdir -p public/assets/images

# 设置权限
RUN chmod -R 755 public/assets/images

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]