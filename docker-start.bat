@echo off
echo 🚀 启动图标管理系统 - 开发环境
echo ================================

echo 🔍 检查端口可用性...
netstat -an | findstr ":3000" >nul
if %errorlevel% == 0 (
    echo ⚠️  端口 3000 已被占用
) else (
    echo ✅ 端口 3000 可用
)

netstat -an | findstr ":5173" >nul
if %errorlevel% == 0 (
    echo ⚠️  端口 5173 已被占用
) else (
    echo ✅ 端口 5173 可用
)

echo 📁 创建图片目录...
if not exist "public\assets\images" mkdir "public\assets\images"

echo 🎯 启动前后端服务...
echo 前端开发服务器: http://localhost:5173
echo 后端API服务器: http://localhost:3000
echo ================================

npm run dev