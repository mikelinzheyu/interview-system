#!/bin/bash
# 快速启动脚本 - 同时启动前后端

echo "======================================"
echo "   AI面试官系统 - 前后端启动脚本"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"
echo ""

# 启动后端
echo "🚀 启动后端服务器..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "   📦 安装后端依赖..."
    npm install
fi
npm start &
BACKEND_PID=$!
echo "   ✅ 后端已启动 (PID: $BACKEND_PID)"
echo ""

# 等待后端启动
sleep 3

# 启动前端
echo "🚀 启动前端服务器..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "   📦 安装前端依赖..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "   ✅ 前端已启动 (PID: $FRONTEND_PID)"
echo ""

echo "======================================"
echo "✅ 系统已启动！"
echo "======================================"
echo ""
echo "📱 前端地址："
echo "   http://localhost:5174/"
echo ""
echo "🔌 后端 API 地址："
echo "   http://localhost:3001/api"
echo ""
echo "🧪 测试页面："
echo "   http://localhost:5174/community/posts/20"
echo ""
echo "📋 按 Ctrl+C 关闭所有服务"
echo ""

# 等待中断信号
wait
