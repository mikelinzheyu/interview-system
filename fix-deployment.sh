#!/bin/bash

set -e

echo "========== 开始修复部署问题 =========="
echo ""

# 获取变量
DEPLOY_HOST="47.76.110.106"
DEPLOY_USER="root"
DEPLOY_PORT="22"
DEPLOY_PATH="/opt/interview-system"

echo "连接到服务器: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PORT"
echo "目标路径: $DEPLOY_PATH"
echo ""

# 通过SSH执行修复命令
ssh -o StrictHostKeyChecking=no -p $DEPLOY_PORT $DEPLOY_USER@$DEPLOY_HOST << 'REMOTE_COMMANDS'
set -e

echo "========== 检查目录结构 =========="
ls -lah /opt/interview-system/

echo ""
echo "========== 创建 ssl 目录 =========="
mkdir -p /opt/interview-system/ssl
ls -lah /opt/interview-system/ | grep ssl

echo ""
echo "========== 检查 nginx.conf 文件 =========="
if [ -f /opt/interview-system/nginx.conf ]; then
    echo "✓ nginx.conf 文件存在"
    ls -lah /opt/interview-system/nginx.conf
else
    echo "✗ nginx.conf 文件不存在！"
    exit 1
fi

echo ""
echo "========== 停止旧容器 =========="
cd /opt/interview-system
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

echo ""
echo "========== 清理旧网络和卷（可选）=========="
docker network prune -f || true

echo ""
echo "========== 拉取最新镜像 =========="
docker-compose -f docker-compose.prod.yml pull

echo ""
echo "========== 启动新容器 =========="
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "========== 等待服务启动 =========="
sleep 30

echo ""
echo "========== 检查容器状态 =========="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========== 修复完成！=========="
REMOTE_COMMANDS

echo ""
echo "✅ 修复脚本执行完成！"

