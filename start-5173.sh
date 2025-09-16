#!/bin/bash

echo "🚀 图标管理系统 - 5173端口直接访问启动脚本"
echo "=============================================="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "🐳 Docker 状态正常"

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 清理冲突的容器
echo "🧹 清理冲突容器..."
docker stop $(docker ps -q --filter "name=icon-manager") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=icon-manager") 2>/dev/null || true

# 检查端口占用
echo "🔍 检查端口占用..."
if netstat -tuln 2>/dev/null | grep -q ":5173 "; then
    echo "⚠️  端口 5173 被占用，尝试释放..."
    # 尝试停止占用端口的进程
    lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true
fi

if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    echo "⚠️  端口 3000 被占用，尝试释放..."
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
fi

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "📊 服务状态："
docker-compose ps

# 测试连接
echo ""
echo "🔍 测试连接..."
if curl -s http://localhost:3000/api/categories > /dev/null; then
    echo "✅ 后端 API (3000) 正常"
else
    echo "❌ 后端 API (3000) 连接失败"
fi

if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端服务 (5173) 正常"
else
    echo "❌ 前端服务 (5173) 连接失败"
fi

echo ""
echo "🎉 启动完成！"
echo ""
echo "🌐 访问地址："
echo "  前端界面: http://localhost:5173"
echo "  后端API:  http://localhost:3000/api/categories"
echo ""
echo "📁 图片管理："
echo "  图片文件夹: ./public/assets/images/"
echo "  实时同步: ✅ 支持"
echo "  直接访问: http://localhost:3000/images/<分类>/<图片名>"
echo ""
echo "📝 常用命令："
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
echo "🔄 实时同步测试："
echo "  1. 在 public/assets/images/ 创建新文件夹"
echo "  2. 添加图片文件"
echo "  3. 刷新浏览器查看更新"

