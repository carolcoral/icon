@echo off
echo 开始测试构建过程...

REM 检查 Node.js 版本
echo 检查 Node.js 版本...
node --version
npm --version

REM 清理之前的构建
echo 清理之前的构建...
if exist node_modules rmdir /s /q node_modules
if exist client\node_modules rmdir /s /q client\node_modules
if exist client\dist rmdir /s /q client\dist

REM 安装根目录依赖
echo 安装根目录依赖...
npm install

REM 安装客户端依赖
echo 安装客户端依赖...
cd client
npm install

REM 测试构建
echo 测试前端构建...
npm run build

if %errorlevel% equ 0 (
    echo ✅ 前端构建成功！
) else (
    echo ❌ 前端构建失败！
    exit /b 1
)

cd ..

echo ✅ 所有构建测试通过！
echo 现在可以尝试 Docker 构建：
echo docker build -t icon-manager .
pause
