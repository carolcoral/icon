#!/bin/bash

echo "🔧 Docker 端口冲突解决脚本"
echo "=============================="

# 检查端口占用情况
echo "📊 检查端口占用情况..."

check_port() {
    local port=$1
    if command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            echo "❌ 端口 $port 被占用"
            return 1
        else
            echo "✅ 端口 $port 可用"
            return 0
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":$port "; then
            echo "❌ 端口 $port 被占用"
            return 1
        else
            echo "✅ 端口 $port 可用"
            return 0
        fi
    else
        echo "⚠️  无法检查端口状态"
        return 0
    fi
}

echo "检查常用端口..."
check_port 3000
check_port 3001
check_port 5173
check_port 80

# 检查 Docker 容器
echo ""
echo "🐳 检查 Docker 容器..."

if command -v docker &> /dev/null; then
    echo "正在运行的容器："
    docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
    
    echo ""
    echo "所有容器（包括停止的）："
    docker ps -a --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
    
    # 检查是否有冲突的容器
    if docker ps -a --format "{{.Names}}" | grep -q "icon-manager"; then
        echo ""
        echo "⚠️  发现现有的 icon-manager 容器"
        echo "建议停止并删除："
        echo "docker stop icon-manager"
        echo "docker rm icon-manager"
    fi
else
    echo "⚠️  Docker 未安装或未在 PATH 中"
fi

echo ""
echo "🛠️  解决方案："
echo ""
echo "1. 使用修改后的端口配置："
echo "   docker-compose up -d"
echo "   # 现在使用端口 3001 而不是 3000"
echo ""
echo "2. 停止冲突的容器："
echo "   docker-compose down"
echo "   docker stop \$(docker ps -q)"
echo ""
echo "3. 使用开发环境配置："
echo "   docker-compose -f docker-compose.dev.yml up -d"
echo ""
echo "4. 手动指定端口："
echo "   docker-compose up -d --scale icon-manager=0"
echo "   docker run -d -p 3002:3000 --name icon-manager-custom ."
echo ""
echo "5. 检查并杀死占用端口的进程："
echo "   # Linux/Mac"
echo "   sudo lsof -ti:3000 | xargs kill -9"
echo "   # Windows"
echo "   netstat -ano | findstr :3000"
echo "   taskkill /PID <PID> /F"
