#!/bin/bash

echo "🧪 GitHub Actions 工作流测试脚本"
echo "=================================="

# 检查工作流文件是否存在
echo "📁 检查工作流文件..."

if [ -f ".github/workflows/docker-build.yml" ]; then
    echo "✅ docker-build.yml 存在"
else
    echo "❌ docker-build.yml 不存在"
    exit 1
fi

if [ -f ".github/workflows/dockerhub-build.yml" ]; then
    echo "✅ dockerhub-build.yml 存在"
else
    echo "❌ dockerhub-build.yml 不存在"
    exit 1
fi

# 检查 YAML 语法
echo ""
echo "🔍 检查 YAML 语法..."

if command -v yamllint &> /dev/null; then
    yamllint .github/workflows/docker-build.yml
    yamllint .github/workflows/dockerhub-build.yml
    echo "✅ YAML 语法检查通过"
else
    echo "⚠️  yamllint 未安装，跳过语法检查"
fi

# 检查 Dockerfile
echo ""
echo "🐳 检查 Dockerfile..."

if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile 存在"
    
    # 检查 Dockerfile 语法
    if command -v docker &> /dev/null; then
        echo "🔍 检查 Dockerfile 语法..."
        docker build --dry-run . 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Dockerfile 语法正确"
        else
            echo "⚠️  Dockerfile 可能有语法问题"
        fi
    else
        echo "⚠️  Docker 未安装，跳过语法检查"
    fi
else
    echo "❌ Dockerfile 不存在"
    exit 1
fi

# 检查必要的文件
echo ""
echo "📋 检查必要文件..."

required_files=(
    "package.json"
    "client/package.json"
    "client/vite.config.js"
    "node-functions/index.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 检查 cron 表达式
echo ""
echo "⏰ 检查定时任务配置..."

cron_pattern=$(grep -o "cron: '[^']*'" .github/workflows/docker-build.yml | cut -d"'" -f2)
echo "📅 Cron 表达式: $cron_pattern"

# 解析 cron 表达式
IFS=' ' read -r minute hour day month weekday <<< "$cron_pattern"
echo "🕐 执行时间: 每天 $hour:$minute (UTC)"
echo "🕐 北京时间: 每天 $((hour + 8)):$minute"

echo ""
echo "🎉 所有检查完成！"
echo ""
echo "📝 下一步操作："
echo "1. 提交并推送代码到 GitHub"
echo "2. 在 GitHub 仓库的 Actions 页面查看工作流"
echo "3. 手动触发一次测试构建"
echo "4. 等待每天凌晨3点的自动构建"
