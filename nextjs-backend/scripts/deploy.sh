#!/bin/bash

# Next.js 图标管理系统部署脚本
# 使用方法: ./scripts/deploy.sh [docker|pm2|build]

set -e

DEPLOY_TYPE=${1:-docker}
PROJECT_NAME="icon-manager-backend"

echo "🚀 开始部署 Next.js 图标管理系统..."
echo "📦 部署方式: $DEPLOY_TYPE"

# 检查 Node.js 版本
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
        exit 1
    fi
    
    echo "✅ Node.js 版本检查通过: $(node -v)"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."
    npm ci --only=production
    echo "✅ 依赖安装完成"
}

# 构建项目
build_project() {
    echo "🔨 构建项目..."
    npm run build
    echo "✅ 项目构建完成"
}

# Docker 部署
deploy_docker() {
    echo "🐳 使用 Docker 部署..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 停止现有容器
    echo "🛑 停止现有容器..."
    docker-compose down || true
    
    # 构建并启动
    echo "🔨 构建 Docker 镜像..."
    docker-compose build --no-cache
    
    echo "🚀 启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 健康检查
    health_check
    
    echo "✅ Docker 部署完成"
    echo "🌐 服务地址: http://localhost:3000"
}

# PM2 部署
deploy_pm2() {
    echo "⚡ 使用 PM2 部署..."
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        echo "📦 安装 PM2..."
        npm install -g pm2
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 停止现有进程
    echo "🛑 停止现有进程..."
    pm2 delete $PROJECT_NAME || true
    
    # 启动应用
    echo "🚀 启动应用..."
    pm2 start ecosystem.config.js --env production
    
    # 保存 PM2 配置
    pm2 save
    
    # 健康检查
    health_check
    
    echo "✅ PM2 部署完成"
    echo "📊 查看状态: pm2 status"
    echo "📝 查看日志: pm2 logs $PROJECT_NAME"
}

# 仅构建
build_only() {
    echo "🔨 仅构建项目..."
    check_node_version
    install_dependencies
    build_project
    echo "✅ 构建完成，可以使用 npm start 启动服务"
}

# 健康检查
health_check() {
    echo "🔍 执行健康检查..."
    
    # 等待服务完全启动
    sleep 5
    
    # 检查 API 端点
    for i in {1..10}; do
        if curl -f -s http://localhost:3000/api/categories > /dev/null; then
            echo "✅ 健康检查通过"
            return 0
        fi
        echo "⏳ 等待服务启动... ($i/10)"
        sleep 3
    done
    
    echo "❌ 健康检查失败，请检查服务状态"
    return 1
}

# 清理函数
cleanup() {
    echo "🧹 清理临时文件..."
    # 这里可以添加清理逻辑
}

# 错误处理
error_handler() {
    echo "❌ 部署过程中发生错误"
    cleanup
    exit 1
}

# 设置错误处理
trap error_handler ERR

# 主逻辑
case $DEPLOY_TYPE in
    "docker")
        check_node_version
        deploy_docker
        ;;
    "pm2")
        check_node_version
        install_dependencies
        build_project
        deploy_pm2
        ;;
    "build")
        build_only
        ;;
    *)
        echo "❌ 未知的部署类型: $DEPLOY_TYPE"
        echo "💡 支持的部署类型: docker, pm2, build"
        exit 1
        ;;
esac

echo "🎉 部署完成！"
echo ""
echo "📋 部署信息:"
echo "   - 部署方式: $DEPLOY_TYPE"
echo "   - 服务端口: 3000"
echo "   - API 地址: http://localhost:3000/api"
echo "   - 健康检查: http://localhost:3000/api/categories"
echo ""
echo "📚 更多信息请查看 DEPLOYMENT.md"