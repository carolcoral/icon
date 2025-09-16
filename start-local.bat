@echo off
echo 🚀 本地启动图标管理系统 (不使用Docker)
echo ================================

echo 🔍 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node.js 已安装
    node --version
) else (
    echo ❌ Node.js 未安装，请先安装 Node.js
    goto :end
)

echo 🔍 检查 npm 环境...
npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ npm 已安装
    npm --version
) else (
    echo ❌ npm 未安装
    goto :end
)

echo.
echo 📦 安装依赖...
if not exist "node_modules" (
    echo 安装根目录依赖...
    npm install
)

if not exist "client\node_modules" (
    echo 安装客户端依赖...
    cd client
    npm install
    cd ..
)

echo.
echo 📁 创建图片目录...
if not exist "public\assets\images" mkdir "public\assets\images"

echo.
echo 🎯 启动服务...
echo ================================
echo 前端开发服务器: http://localhost:5173
echo 后端API服务器: http://localhost:3000
echo ================================
echo.

npm run dev

:end
pause