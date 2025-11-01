@echo off
REM 启动前端开发服务器
cd /d "D:\code7\interview-system\frontend"
echo Starting Vite development server...
echo.
"C:\Program Files\nodejs\node.exe" "D:\code7\interview-system\frontend\node_modules\vite\bin\vite.js" --host 0.0.0.0 --port 5174
