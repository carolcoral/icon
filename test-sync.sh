#!/bin/bash

echo "🔄 图片文件夹实时同步测试脚本"
echo "================================"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "🐳 Docker 状态正常"

# 检查图片文件夹
echo "📁 检查图片文件夹结构..."
if [ -d "public/assets/images" ]; then
    echo "✅ 图片文件夹存在"
    echo "📊 当前分类："
    ls -la public/assets/images/ | grep "^d" | awk '{print "  - " $9}'
else
    echo "❌ 图片文件夹不存在"
    exit 1
fi

# 启动服务
echo ""
echo "🚀 启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 服务状态："
docker-compose ps

# 测试 API
echo ""
echo "🔍 测试 API 连接..."
if curl -s http://localhost:3000/api/categories > /dev/null; then
    echo "✅ 后端 API 正常"
else
    echo "❌ 后端 API 连接失败"
fi

if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务连接失败"
fi

echo ""
echo "🧪 实时同步测试："
echo "1. 在 public/assets/images/ 目录下创建新分类文件夹"
echo "2. 添加图片文件到新分类"
echo "3. 访问 http://localhost:5173 查看是否实时更新"
echo ""
echo "📝 测试命令："
echo "# 创建测试分类"
echo "mkdir -p public/assets/images/test-category"
echo ""
echo "# 复制测试图片"
echo "cp public/assets/images/docker/docker.png public/assets/images/test-category/"
echo ""
echo "# 查看 API 响应"
echo "curl http://localhost:3000/api/categories"
echo ""
echo "# 查看图片列表"
echo "curl http://localhost:3000/api/images?category=test-category"

echo ""
echo "🌐 访问地址："
echo "前端界面: http://localhost:5173"
echo "后端API: http://localhost:3000/api/categories"
echo "图片访问: http://localhost:3000/images/<分类>/<图片名>"

echo ""
echo "📝 常用命令："
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "重启服务: docker-compose restart"
