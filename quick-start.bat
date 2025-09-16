@echo off
echo 🚀 图标管理系统快速启动脚本
echo ==============================

REM 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未运行，请先启动 Docker
    pause
    exit /b 1
)

echo 🐳 Docker 状态正常

REM 停止现有容器
echo 🛑 停止现有容器...
docker-compose down >nul 2>&1
docker-compose -f docker-compose.dev.yml down >nul 2>&1

REM 清理冲突的容器
echo 🧹 清理冲突容器...
for /f "tokens=1" %%i in ('docker ps -q --filter "name=icon-manager" 2^>nul') do docker stop %%i >nul 2>&1
for /f "tokens=1" %%i in ('docker ps -aq --filter "name=icon-manager" 2^>nul') do docker rm %%i >nul 2>&1

REM 选择启动模式
echo.
echo 请选择启动模式：
echo 1^) 生产环境 (端口 3001^)
echo 2^) 开发环境 (端口 3001 + 5173^)
echo 3^) 自定义端口
echo.
set /p choice="请输入选择 (1-3): "

if "%choice%"=="1" (
    echo 🏭 启动生产环境...
    docker-compose up -d --build
    echo ✅ 生产环境启动完成！
    echo 🌐 访问地址: http://localhost:3001
) else if "%choice%"=="2" (
    echo 🛠️  启动开发环境...
    docker-compose -f docker-compose.dev.yml up -d --build
    echo ✅ 开发环境启动完成！
    echo 🌐 前端: http://localhost:5173
    echo 🔧 后端API: http://localhost:3001
) else if "%choice%"=="3" (
    set /p custom_port="请输入自定义端口 (默认 3002): "
    if "%custom_port%"=="" set custom_port=3002
    echo 🔧 使用自定义端口 %custom_port%...
    docker run -d -p %custom_port%:3000 --name icon-manager-custom -v "%cd%\public\assets\images:/app/public/assets/images" -e NODE_ENV=production $(docker build -q .)
    echo ✅ 自定义端口启动完成！
    echo 🌐 访问地址: http://localhost:%custom_port%
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo 📊 容器状态：
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

echo.
echo 📝 常用命令：
echo 查看日志: docker-compose logs -f
echo 停止服务: docker-compose down
echo 重启服务: docker-compose restart
pause
