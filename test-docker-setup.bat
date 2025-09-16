@echo off
echo 🔍 Docker 环境检测...
echo ================================

echo 检查 Docker 是否安装...
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Docker 已安装
    docker --version
) else (
    echo ❌ Docker 未安装
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop
    goto :end
)

echo.
echo 检查 Docker Compose 是否可用...
docker compose version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Docker Compose 已安装 (新版本)
    docker compose version
    set COMPOSE_CMD=docker compose
) else (
    docker-compose --version >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Docker Compose 已安装 (旧版本)
        docker-compose --version
        set COMPOSE_CMD=docker-compose
    ) else (
        echo ❌ Docker Compose 未安装
        echo 请确保 Docker Desktop 包含 Compose 功能
        goto :end
    )
)

echo.
echo 🔧 验证配置文件...
if exist "Dockerfile" (
    echo ✅ Dockerfile 存在
) else (
    echo ❌ Dockerfile 不存在
    goto :end
)

if exist "docker-compose.yml" (
    echo ✅ docker-compose.yml 存在
) else (
    echo ❌ docker-compose.yml 不存在
    goto :end
)

echo.
echo 📁 检查目录结构...
if not exist "public\assets\images" (
    echo 📁 创建图片目录...
    mkdir "public\assets\images"
)
echo ✅ 图片目录已准备

echo.
echo 🚀 准备启动服务...
echo ================================
echo 使用以下命令启动服务：
echo.
echo   %COMPOSE_CMD% up --build
echo.
echo 或者后台运行：
echo   %COMPOSE_CMD% up -d --build
echo.
echo 访问地址：
echo   前端: http://localhost:5173
echo   API:  http://localhost:3000
echo ================================

:end
pause