@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🎨 图标管理系统安装脚本
echo ================================

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js ^(^>= 16.0.0^)
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查 npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js 版本: %NODE_VERSION%
echo ✅ npm 版本: %NPM_VERSION%

REM 安装依赖
echo.
echo 📦 安装项目依赖...
call npm install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

echo.
echo 📦 安装前端依赖...
cd client
call npm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)
cd ..

REM 创建示例图片目录
echo.
echo 📁 创建图片目录...
if not exist "public\assets\images\github" (
    mkdir "public\assets\images\github"
)

echo.
echo 🎉 安装完成！
echo.
echo 🚀 启动开发服务器:
echo    npm run dev
echo.
echo 🌐 访问地址:
echo    前端: http://localhost:5173
echo    后端: http://localhost:3000
echo.
echo 📖 更多信息请查看 README.md
echo.
pause