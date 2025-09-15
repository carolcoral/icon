#!/bin/bash

echo "开始测试构建过程..."

# 检查 Node.js 版本
echo "检查 Node.js 版本..."
node --version
npm --version

# 清理之前的构建
echo "清理之前的构建..."
rm -rf node_modules client/node_modules client/dist

# 安装根目录依赖
echo "安装根目录依赖..."
npm install

# 安装客户端依赖
echo "安装客户端依赖..."
cd client
npm install

# 测试构建
echo "测试前端构建..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功！"
else
    echo "❌ 前端构建失败！"
    exit 1
fi

cd ..

echo "✅ 所有构建测试通过！"
echo "现在可以尝试 Docker 构建："
echo "docker build -t icon-manager ."
