#!/bin/bash

# Dify AI Chat 快速启动脚本
# 使用最新的 API Key: app-Bj1UccX9v9X1aw6st7OW5paG

echo "=========================================="
echo "  🚀 Dify AI Chat 快速启动"
echo "=========================================="
echo ""

# 设置环境变量
export DIFY_CHAT_API_KEY="app-Bj1UccX9v9X1aw6st7OW5paG"
export DIFY_CHAT_APP_ID="NF8mUftOYiGfQEzE"
export DIFY_API_URL="https://api.dify.ai/v1"

echo "✅ 环境变量已设置："
echo "   DIFY_CHAT_API_KEY: ${DIFY_CHAT_API_KEY}"
echo "   DIFY_CHAT_APP_ID: ${DIFY_CHAT_APP_ID}"
echo "   DIFY_API_URL: ${DIFY_API_URL}"
echo ""

# 清理旧进程
echo "🧹 清理旧进程..."
pkill -f "node.*mock-server" 2>/dev/null || true
sleep 1

# 启动后端
echo ""
echo "🚀 启动后端服务..."
cd "$(dirname "$0")"
node mock-server.js
