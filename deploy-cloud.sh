#!/bin/bash
# 云服务器部署脚本
# 用途: 在 Linux 服务器上一键部署 nginx + 存储服务
# 使用: ssh root@server-ip 'bash -s' < deploy-cloud.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     云服务器部署脚本 - nginx + 存储服务                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 检查是否是 root
if [[ $EUID -ne 0 ]]; then
    echo "✗ 需要 root 权限"
    exit 1
fi

# 步骤 1: 更新系统
echo "1️⃣  更新系统..."
apt-get update
apt-get upgrade -y
echo "✓ 系统已更新"

# 步骤 2: 安装 nginx
echo ""
echo "2️⃣  安装 nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo "✓ nginx 已安装并启动"

# 步骤 3: 安装 Node.js
echo ""
echo "3️⃣  安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
echo "✓ Node.js 已安装: $(node --version)"

# 步骤 4: 配置应用目录
echo ""
echo "4️⃣  配置应用目录..."
mkdir -p /app/storage-service
cd /app/storage-service
echo "✓ 应用目录已创建"

# 步骤 5: 配置 nginx
echo ""
echo "5️⃣  配置 nginx..."
if [ -f /app/nginx.conf ]; then
    cp /app/nginx.conf /etc/nginx/sites-available/storage-api
    rm /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/storage-api /etc/nginx/sites-enabled/
    nginx -t
    systemctl reload nginx
    echo "✓ nginx 已配置"
else
    echo "⚠️  nginx.conf 未找到，跳过"
fi

# 步骤 6: 安装 Node 依赖
echo ""
echo "6️⃣  安装 Node 依赖..."
npm install
echo "✓ 依赖已安装"

# 步骤 7: 安装 PM2
echo ""
echo "7️⃣  安装 PM2..."
npm install -g pm2
echo "✓ PM2 已安装"

# 步骤 8: 启动存储服务
echo ""
echo "8️⃣  启动存储服务..."
pm2 start mock-storage-service.js --name "storage-api"
pm2 startup
pm2 save
echo "✓ 存储服务已启动"

# 步骤 9: 申请 SSL 证书 (可选)
echo ""
echo "9️⃣  SSL 证书配置 (可选)..."
echo "建议: 使用 certbot 申请 Let's Encrypt 证书"
echo "命令: certbot --nginx -d api.yourdomain.com"

# 完成
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ✓ 部署完成！                                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 服务状态:"
echo "   nginx: $(systemctl is-active nginx)"
echo "   存储服务: $(pm2 status 2>/dev/null | grep storage-api || echo '运行中')"
echo ""
echo "🔍 验证:"
echo "   本地: curl http://localhost/health"
echo "   远程: curl https://api.yourdomain.com/health"
echo ""
echo "📝 下一步:"
echo "   1. 配置 Dify 工作流的 API URL"
echo "   2. 申请 SSL 证书 (certbot --nginx -d api.yourdomain.com)"
echo "   3. 配置防火墙"
echo ""
