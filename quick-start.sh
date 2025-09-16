#!/bin/bash

echo "🚀 图标管理系统快速启动脚本"
echo "=============================="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "🐳 Docker 状态正常"

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# 清理冲突的容器
echo "🧹 清理冲突容器..."
docker stop $(docker ps -q --filter "name=icon-manager") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=icon-manager") 2>/dev/null || true

# 选择启动模式
echo ""
echo "请选择启动模式："
echo "1) 生产环境 (端口 3001)"
echo "2) 开发环境 (端口 3001 + 5173)"
echo "3) 自定义端口"
echo ""
read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo "🏭 启动生产环境..."
        docker-compose up -d --build
        echo "✅ 生产环境启动完成！"
        echo "🌐 访问地址: http://localhost:3001"
        ;;
    2)
        echo "🛠️  启动开发环境..."
        docker-compose -f docker-compose.dev.yml up -d --build
        echo "✅ 开发环境启动完成！"
        echo "🌐 前端: http://localhost:5173"
        echo "🔧 后端API: http://localhost:3001"
        ;;
    3)
        read -p "请输入自定义端口 (默认 3002): " custom_port
        custom_port=${custom_port:-3002}
        echo "🔧 使用自定义端口 $custom_port..."
        docker run -d -p $custom_port:3000 --name icon-manager-custom \
            -v $(pwd)/public/assets/images:/app/public/assets/images \
            -e NODE_ENV=production \
            $(docker build -q .)
        echo "✅ 自定义端口启动完成！"
        echo "🌐 访问地址: http://localhost:$custom_port"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📊 容器状态："
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

echo ""
echo "📝 常用命令："
echo "查看日志: docker-compose logs -f"
echo "停止服务: docker-compose down"
echo "重启服务: docker-compose restart"

