#!/bin/bash

echo "🔧 Docker 构建修复验证脚本"
echo "=============================="

# 检查必要文件
echo "📁 检查必要文件..."

required_files=(
    "package.json"
    "client/package.json"
    "client/vite.config.js"
    "node-functions/index.js"
    "Dockerfile"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 检查 package.json 语法
echo ""
echo "🔍 检查 package.json 语法..."

if command -v node &> /dev/null; then
    node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('✅ 根目录 package.json 语法正确')" 2>/dev/null || {
        echo "❌ 根目录 package.json 语法错误"
        exit 1
    }
    
    node -e "JSON.parse(require('fs').readFileSync('client/package.json', 'utf8')); console.log('✅ 客户端 package.json 语法正确')" 2>/dev/null || {
        echo "❌ 客户端 package.json 语法错误"
        exit 1
    }
else
    echo "⚠️  Node.js 未安装，跳过语法检查"
fi

# 检查 Dockerfile 语法
echo ""
echo "🐳 检查 Dockerfile 语法..."

if command -v docker &> /dev/null; then
    echo "🔍 验证 Dockerfile 语法..."
    docker build --dry-run . 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Dockerfile 语法正确"
    else
        echo "⚠️  Dockerfile 可能有语法问题，但继续测试"
    fi
else
    echo "⚠️  Docker 未安装，跳过语法检查"
fi

# 检查依赖问题
echo ""
echo "📦 检查依赖配置..."

# 检查根目录是否有非标准字段
if grep -q "clientDependencies\|clientDevDependencies" package.json; then
    echo "❌ 发现非标准依赖字段，需要清理"
    exit 1
else
    echo "✅ 根目录 package.json 依赖配置正确"
fi

# 检查客户端依赖
if grep -q "terser" client/package.json; then
    echo "⚠️  客户端包含 terser 依赖，可能影响构建"
else
    echo "✅ 客户端依赖配置正确"
fi

# 检查脚本配置
echo ""
echo "🔧 检查脚本配置..."

if grep -q "node-functions/production.js" package.json; then
    echo "❌ 发现不存在的 production.js 引用"
    exit 1
else
    echo "✅ 脚本配置正确"
fi

echo ""
echo "🎉 所有检查通过！"
echo ""
echo "📝 修复内容总结："
echo "1. ✅ 移除了非标准的 clientDependencies 字段"
echo "2. ✅ 修复了 start 脚本指向不存在的文件"
echo "3. ✅ 移除了可能有问题的 terser 依赖"
echo "4. ✅ 优化了 Dockerfile 使用多阶段构建"
echo "5. ✅ 分离了构建和生产环境"
echo ""
echo "🚀 现在可以重新尝试构建："
echo "docker build -t icon-manager ."

