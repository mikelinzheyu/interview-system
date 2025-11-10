#!/bin/bash
# 一键清理部署目录脚本
# 在本地机器上运行，自动连接到服务器并清理

set -e

# 配置
SERVER_IP="47.76.110.106"
SERVER_USER="root"
SERVER_PORT="22"
DEPLOY_PATH="/opt/interview-system"

echo "======================================="
echo "🚀 开始执行服务器清理"
echo "======================================="
echo ""
echo "📍 服务器信息："
echo "   IP: $SERVER_IP"
echo "   用户: $SERVER_USER"
echo "   端口: $SERVER_PORT"
echo "   清理目录: $DEPLOY_PATH"
echo ""

# 检查 SSH 连接
echo "⏳ 检查 SSH 连接..."
if ! ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "echo 'SSH 连接成功' > /dev/null" 2>/dev/null; then
  echo "❌ SSH 连接失败！"
  echo "请确保："
  echo "  1. 服务器 IP 正确（当前：$SERVER_IP）"
  echo "  2. SSH 密钥已配置"
  echo "  3. 网络连接正常"
  exit 1
fi
echo "✅ SSH 连接成功"
echo ""

# 远程执行清理命令
echo "🛑 在服务器上执行清理..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'EOSSH'
set -e

echo "📂 进入部署目录..."
cd /opt/interview-system 2>/dev/null || {
  echo "⚠️  /opt/interview-system 目录不存在，无需清理"
  exit 0
}

echo "📂 当前目录：$(pwd)"
echo ""

echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || {
  echo "⚠️  docker-compose down 失败，继续清理文件..."
}

echo "✅ 容器已停止"
echo ""

echo "📂 返回上级目录..."
cd /opt

echo "🗑️  删除旧部署目录..."
rm -rf interview-system

echo "✅ 旧目录已删除"
echo ""

echo "✅ 服务器清理完成！"
EOSSH

echo ""
echo "======================================="
echo "✅ 清理成功！"
echo "======================================="
echo ""
echo "📋 后续步骤："
echo "  1. 打开 GitHub Actions: https://github.com/mikelinzheyu/interview-system/actions"
echo "  2. 找到最新失败的工作流"
echo "  3. 点击 'Re-run all jobs' 重新部署"
echo "  4. 等待部署完成"
echo ""
echo "⏱️  部署通常需要 5-10 分钟"
echo ""
