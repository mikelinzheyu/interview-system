@echo off
echo ==================================================
echo 面试系统混合部署启动脚本
echo ==================================================

echo [信息] 由于网络问题，使用混合部署方案：
echo - 前端：本地Vite开发服务器
echo - 后端：本地Mock服务器
echo - 数据库：如果可用，使用Docker MySQL

REM 检查端口占用
echo.
echo 检查端口占用情况...
netstat -an | findstr :3306 >nul
if %errorlevel% equ 0 (
    echo [警告] 端口3306已被占用，可能已有数据库在运行
) else (
    echo [信息] 端口3306可用
)

netstat -an | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo [警告] 端口8080已被占用
) else (
    echo [信息] 端口8080可用
)

netstat -an | findstr :5174 >nul
if %errorlevel% equ 0 (
    echo [警告] 端口5174已被占用
) else (
    echo [信息] 端口5174可用
)

echo.
echo 启动后端Mock服务器...
cd ..\frontend
start "Backend Mock Server" "C:\Program Files\nodejs\node.exe" mock-server.js

echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo.
echo 启动前端开发服务器...
start "Frontend Dev Server" "C:\Program Files\nodejs\npm.cmd" run dev

echo.
echo ==================================================
echo 混合部署启动完成！
echo ==================================================
echo 前端地址: http://localhost:5174
echo 后端Mock: http://localhost:3001
echo.
echo 注意:
echo - 数据库连接可能需要单独配置
echo - 这是开发/测试环境配置
echo - 生产环境请使用完整Docker方案
echo ==================================================

pause