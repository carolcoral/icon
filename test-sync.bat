@echo off
echo 🔄 图片文件夹实时同步测试脚本
echo ================================

REM 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行，请先启动 Docker
    pause
    exit /b 1
)

echo 🐳 Docker 状态正常

REM 检查图片文件夹
echo 📁 检查图片文件夹结构...
if exist "public\assets\images" (
    echo ✅ 图片文件夹存在
    echo 📊 当前分类：
    for /d %%i in (public\assets\images\*) do echo   - %%~ni
) else (
    echo ❌ 图片文件夹不存在
    pause
    exit /b 1
)

REM 启动服务
echo.
echo 🚀 启动服务...
docker-compose up -d --build

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo 📊 服务状态：
docker-compose ps

REM 测试 API
echo.
echo 🔍 测试 API 连接...
curl -s http://localhost:3000/api/categories >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端 API 正常
) else (
    echo ❌ 后端 API 连接失败
)

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端服务正常
) else (
    echo ❌ 前端服务连接失败
)

echo.
echo 🧪 实时同步测试：
echo 1. 在 public\assets\images\ 目录下创建新分类文件夹
echo 2. 添加图片文件到新分类
echo 3. 访问 http://localhost:5173 查看是否实时更新
echo.
echo 📝 测试命令：
echo # 创建测试分类
echo mkdir public\assets\images\test-category
echo.
echo # 复制测试图片
echo copy public\assets\images\docker\docker.png public\assets\images\test-category\
echo.
echo # 查看 API 响应
echo curl http://localhost:3000/api/categories
echo.
echo # 查看图片列表
echo curl http://localhost:3000/api/images?category=test-category

echo.
echo 🌐 访问地址：
echo 前端界面: http://localhost:5173
echo 后端API: http://localhost:3000/api/categories
echo 图片访问: http://localhost:3000/images/^<分类^>/^<图片名^>

echo.
echo 📝 常用命令：
echo 查看日志: docker-compose logs -f
echo 停止服务: docker-compose down
echo 重启服务: docker-compose restart
pause

