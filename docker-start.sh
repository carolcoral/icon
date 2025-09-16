#!/bin/bash

echo "🚀 启动图标管理系统 - 开发环境"
echo "================================"

# 检查端口是否可用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port 已被占用"
        return 1
    else
        echo "✅ 端口 $port 可用"
        return 0
    fi
}

# 检查必要的端口
echo "🔍 检查端口可用性..."
check_port 3000
check_port 5173

# 确保图片目录存在
echo "📁 创建图片目录..."
mkdir -p public/assets/images
chmod 755 public/assets/images

# 启动服务
echo "🎯 启动前后端服务..."
echo "前端开发服务器: http://localhost:5173"
echo "后端API服务器: http://localhost:3000"
echo "================================"

# 使用 concurrently 同时启动前后端
exec npm run dev