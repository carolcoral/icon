@echo off
echo 🚀 图标管理系统 - 5173端口直接访问启动脚本
echo ==============================================

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

REM 清理冲突的容器
echo 🧹 清理冲突容器...
for /f "tokens=1" %%i in ('docker ps -q --filter "name=icon-manager" 2^>nul') do docker stop %%i >nul 2>&1
for /f "tokens=1" %%i in ('docker ps -aq --filter "name=icon-manager" 2^>nul') do docker rm %%i >nul 2>&1

REM 检查端口占用
echo 🔍 检查端口占用...
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口 5173 被占用，尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1
)

netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ⚠️  端口 3000 被占用，尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
)

REM 启动服务
echo 🚀 启动服务...
docker-compose up -d --build

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 15 /nobreak >nul

REM 检查服务状态
echo 📊 服务状态：
docker-compose ps

REM 测试连接
echo.
echo 🔍 测试连接...
curl -s http://localhost:3000/api/categories >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端 API (3000) 正常
) else (
    echo ❌ 后端 API (3000) 连接失败
)

curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 前端服务 (5173) 正常
) else (
    echo ❌ 前端服务 (5173) 连接失败
)

echo.
echo 🎉 启动完成！
echo.
echo 🌐 访问地址：
echo   前端界面: http://localhost:5173
echo   后端API:  http://localhost:3000/api/categories
echo.
echo 📁 图片管理：
echo   图片文件夹: .\public\assets\images\
echo   实时同步: ✅ 支持
echo   直接访问: http://localhost:3000/images/^<分类^>/^<图片名^>
echo.
echo 📝 常用命令：
echo   查看日志: docker-compose logs -f
echo   停止服务: docker-compose down
echo   重启服务: docker-compose restart
echo.
echo 🔄 实时同步测试：
echo   1. 在 public\assets\images\ 创建新文件夹
echo   2. 添加图片文件
echo   3. 刷新浏览器查看更新
pause

