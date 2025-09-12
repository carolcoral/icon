#!/bin/bash

# 图标管理系统安装脚本
# Icon Manager Installation Script

set -e

echo "🎨 图标管理系统安装脚本"
echo "================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js (>= 16.0.0)"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

echo ""
echo "📦 安装前端依赖..."
cd client && npm install && cd ..

# 创建示例图片目录
echo ""
echo "📁 创建图片目录..."
mkdir -p public/assets/images/github

# 设置权限
echo ""
echo "🔐 设置目录权限..."
chmod -R 755 public/assets/images/

echo ""
echo "🎉 安装完成！"
echo ""
echo "🚀 启动开发服务器:"
echo "   npm run dev"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3000"
echo ""
echo "📖 更多信息请查看 README.md"