@echo off
echo 🔧 Docker 端口冲突解决脚本
echo ==============================

REM 检查端口占用情况
echo 📊 检查端口占用情况...

echo 检查常用端口...
netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ❌ 端口 3000 被占用
    netstat -ano | findstr :3000
) else (
    echo ✅ 端口 3000 可用
)

netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ❌ 端口 3001 被占用
    netstat -ano | findstr :3001
) else (
    echo ✅ 端口 3001 可用
)

netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ❌ 端口 5173 被占用
    netstat -ano | findstr :5173
) else (
    echo ✅ 端口 5173 可用
)

netstat -ano | findstr :80 >nul
if %errorlevel% equ 0 (
    echo ❌ 端口 80 被占用
    netstat -ano | findstr :80
) else (
    echo ✅ 端口 80 可用
)

REM 检查 Docker 容器
echo.
echo 🐳 检查 Docker 容器...

where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo 正在运行的容器：
    docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
    
    echo.
    echo 所有容器（包括停止的）：
    docker ps -a --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
    
    REM 检查是否有冲突的容器
    docker ps -a --format "{{.Names}}" | findstr "icon-manager" >nul
    if %errorlevel% equ 0 (
        echo.
        echo ⚠️  发现现有的 icon-manager 容器
        echo 建议停止并删除：
        echo docker stop icon-manager
        echo docker rm icon-manager
    )
) else (
    echo ⚠️  Docker 未安装或未在 PATH 中
)

echo.
echo 🛠️  解决方案：
echo.
echo 1. 使用修改后的端口配置：
echo    docker-compose up -d
echo    # 现在使用端口 3001 而不是 3000
echo.
echo 2. 停止冲突的容器：
echo    docker-compose down
echo    docker stop ^(docker ps -q^)
echo.
echo 3. 使用开发环境配置：
echo    docker-compose -f docker-compose.dev.yml up -d
echo.
echo 4. 手动指定端口：
echo    docker-compose up -d --scale icon-manager=0
echo    docker run -d -p 3002:3000 --name icon-manager-custom .
echo.
echo 5. 检查并杀死占用端口的进程：
echo    netstat -ano ^| findstr :3000
echo    taskkill /PID ^<PID^> /F
pause

