@echo off
echo 🧪 GitHub Actions 工作流测试脚本
echo ==================================

REM 检查工作流文件是否存在
echo 📁 检查工作流文件...

if exist ".github\workflows\docker-build.yml" (
    echo ✅ docker-build.yml 存在
) else (
    echo ❌ docker-build.yml 不存在
    exit /b 1
)

if exist ".github\workflows\dockerhub-build.yml" (
    echo ✅ dockerhub-build.yml 存在
) else (
    echo ❌ dockerhub-build.yml 不存在
    exit /b 1
)

REM 检查 Dockerfile
echo.
echo 🐳 检查 Dockerfile...

if exist "Dockerfile" (
    echo ✅ Dockerfile 存在
    
    REM 检查 Dockerfile 语法
    where docker >nul 2>nul
    if %errorlevel% equ 0 (
        echo 🔍 检查 Dockerfile 语法...
        docker build --dry-run . >nul 2>nul
        if %errorlevel% equ 0 (
            echo ✅ Dockerfile 语法正确
        ) else (
            echo ⚠️  Dockerfile 可能有语法问题
        )
    ) else (
        echo ⚠️  Docker 未安装，跳过语法检查
    )
) else (
    echo ❌ Dockerfile 不存在
    exit /b 1
)

REM 检查必要的文件
echo.
echo 📋 检查必要文件...

if exist "package.json" (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 不存在
    exit /b 1
)

if exist "client\package.json" (
    echo ✅ client\package.json 存在
) else (
    echo ❌ client\package.json 不存在
    exit /b 1
)

if exist "client\vite.config.js" (
    echo ✅ client\vite.config.js 存在
) else (
    echo ❌ client\vite.config.js 不存在
    exit /b 1
)

if exist "node-functions\index.js" (
    echo ✅ node-functions\index.js 存在
) else (
    echo ❌ node-functions\index.js 不存在
    exit /b 1
)

REM 检查 cron 表达式
echo.
echo ⏰ 检查定时任务配置...

for /f "tokens=2 delims='" %%a in ('findstr "cron:" .github\workflows\docker-build.yml') do set cron_pattern=%%a
echo 📅 Cron 表达式: %cron_pattern%

echo.
echo 🎉 所有检查完成！
echo.
echo 📝 下一步操作：
echo 1. 提交并推送代码到 GitHub
echo 2. 在 GitHub 仓库的 Actions 页面查看工作流
echo 3. 手动触发一次测试构建
echo 4. 等待每天凌晨3点的自动构建
pause
