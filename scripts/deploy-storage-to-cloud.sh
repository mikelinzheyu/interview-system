#!/bin/bash
# 云服务器一键部署脚本
# 使用方法：
# curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/interview-system/main/scripts/deploy-storage-to-cloud.sh | bash
# 或
# chmod +x deploy-storage-to-cloud.sh && ./deploy-storage-to-cloud.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🚀 Storage Service 云服务器一键部署脚本                    ║"
echo "║     Nginx + Docker + Redis 完整生产环境                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误: 请使用 sudo 运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}步骤 1: 检查依赖...${NC}"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安装，正在安装...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker root
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose 未安装，正在安装...${NC}"
    apt-get update
    apt-get install -y docker-compose
fi

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx 未安装，正在安装...${NC}"
    apt-get update
    apt-get install -y nginx certbot python3-certbot-nginx
fi

# 检查 Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git 未安装，正在安装...${NC}"
    apt-get install -y git
fi

echo -e "${GREEN}✓ 依赖检查完成${NC}"
echo ""

# 获取必要的信息
echo -e "${YELLOW}步骤 2: 收集配置信息...${NC}"

read -p "请输入 GitHub 仓库地址 (例: https://github.com/username/interview-system.git): " GITHUB_REPO
read -p "请输入域名 (例: storage.interview-system.com): " DOMAIN_NAME
read -p "请输入 Redis 密码 (最少16字符): " REDIS_PASSWORD
read -p "请输入存储服务 API Key (最少32字符): " STORAGE_API_KEY

# 验证密码强度
if [ ${#REDIS_PASSWORD} -lt 16 ]; then
    echo -e "${RED}错误: Redis 密码至少需要 16 个字符${NC}"
    exit 1
fi

if [ ${#STORAGE_API_KEY} -lt 32 ]; then
    echo -e "${RED}错误: API Key 至少需要 32 个字符${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 配置信息收集完成${NC}"
echo ""

# 克隆或更新代码
echo -e "${YELLOW}步骤 3: 克隆/更新代码...${NC}"

PROJECT_DIR="/home/interview-system"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

if [ -d ".git" ]; then
    echo "仓库已存在，正在更新..."
    git pull origin main
else
    echo "克隆仓库..."
    git clone $GITHUB_REPO .
fi

echo -e "${GREEN}✓ 代码同步完成${NC}"
echo ""

# 配置环境变量
echo -e "${YELLOW}步骤 4: 配置环境变量...${NC}"

cd $PROJECT_DIR/storage-service

cat > .env.prod << EOF
# Redis 配置
SPRING_REDIS_HOST=interview-redis
SPRING_REDIS_PORT=6379
SPRING_REDIS_PASSWORD=$REDIS_PASSWORD
SPRING_REDIS_TIMEOUT=3000ms
SPRING_REDIS_DATABASE=0
SPRING_REDIS_LETTUCE_POOL_MAX_ACTIVE=8
SPRING_REDIS_LETTUCE_POOL_MAX_IDLE=8

# 存储服务配置
SERVER_PORT=8081
SESSION_STORAGE_API_KEY=$STORAGE_API_KEY

# Spring 配置
SPRING_PROFILES_ACTIVE=prod

# Java 配置
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200

# 时区
TZ=Asia/Shanghai

# 日志配置
LOGGING_LEVEL_COM_EXAMPLE_INTERVIEWSTORAGE=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=WARN
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_DATA_REDIS=INFO
EOF

echo -e "${GREEN}✓ 环境变量配置完成${NC}"
echo ""

# 启动 Docker 容器
echo -e "${YELLOW}步骤 5: 启动 Docker 容器...${NC}"

docker-compose -f docker-compose-prod.yml down || true
docker-compose -f docker-compose-prod.yml up -d

# 等待容器启动
echo "等待容器启动..."
sleep 15

# 检查容器状态
if ! docker-compose -f docker-compose-prod.yml ps | grep -q "interview-storage-service"; then
    echo -e "${RED}错误: 存储服务容器启动失败${NC}"
    docker-compose -f docker-compose-prod.yml logs interview-storage-service
    exit 1
fi

if ! docker-compose -f docker-compose-prod.yml ps | grep -q "interview-redis"; then
    echo -e "${RED}错误: Redis 容器启动失败${NC}"
    docker-compose -f docker-compose-prod.yml logs interview-redis
    exit 1
fi

echo -e "${GREEN}✓ Docker 容器启动成功${NC}"
echo ""

# 健康检查
echo -e "${YELLOW}步骤 6: 执行健康检查...${NC}"

for i in {1..5}; do
    if curl -f -H "Authorization: Bearer $STORAGE_API_KEY" http://localhost:8081/api/sessions &> /dev/null; then
        echo -e "${GREEN}✓ 存储服务响应正常${NC}"
        break
    fi
    if [ $i -lt 5 ]; then
        echo "尝试 $i/5，等待服务启动..."
        sleep 3
    else
        echo -e "${RED}错误: 存储服务无法响应${NC}"
        exit 1
    fi
done

echo ""

# 配置 Nginx
echo -e "${YELLOW}步骤 7: 配置 Nginx 反向代理...${NC}"

NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN_NAME"

cat > $NGINX_CONFIG << 'NGINX_EOF'
# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    # SSL 证书（由 certbot 生成）
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 限流配置（防止滥用）
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
    limit_req zone=api_limit burst=40 nodelay;

    # 日志配置
    access_log /var/log/nginx/storage-service-access.log;
    error_log /var/log/nginx/storage-service-error.log;

    # 存储服务反向代理
    location /api/ {
        # 验证 API Key
        if ($http_authorization = "") {
            return 401 '{"error": "Missing Authorization header"}';
        }

        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;

        # 转发请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;

        # 超时配置
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # 缓存禁用
        proxy_cache off;
        proxy_buffering off;
    }

    # 健康检查端点（无需认证）
    location /health {
        proxy_pass http://127.0.0.1:8081/api/sessions;
        access_log off;
    }
}
NGINX_EOF

# 替换域名占位符
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" $NGINX_CONFIG

# 启用配置
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/ || true

# 测试 Nginx 配置
if ! nginx -t; then
    echo -e "${RED}错误: Nginx 配置有错误${NC}"
    exit 1
fi

# 重启 Nginx
systemctl restart nginx

echo -e "${GREEN}✓ Nginx 配置完成${NC}"
echo ""

# 获取 SSL 证书
echo -e "${YELLOW}步骤 8: 获取 SSL 证书...${NC}"

if [ ! -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME
else
    echo "SSL 证书已存在，跳过获取"
fi

echo -e "${GREEN}✓ SSL 证书配置完成${NC}"
echo ""

# 配置自动更新
echo -e "${YELLOW}步骤 9: 配置自动更新...${NC}"

# 添加 cron 任务（定期更新证书）
CRON_JOB="0 3 * * * certbot renew --quiet"
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ 自动更新任务已配置${NC}"
fi

# 配置 logrotate（日志轮转）
if [ ! -f "/etc/logrotate.d/storage-service" ]; then
    cat > /etc/logrotate.d/storage-service << 'LOGROTATE_EOF'
/var/log/nginx/storage-service-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
LOGROTATE_EOF
fi

echo -e "${GREEN}✓ 日志轮转配置完成${NC}"
echo ""

# 最终测试
echo -e "${YELLOW}步骤 10: 最终测试...${NC}"

sleep 5

if curl -f -H "Authorization: Bearer $STORAGE_API_KEY" https://$DOMAIN_NAME/api/sessions &> /dev/null; then
    echo -e "${GREEN}✓ HTTPS 访问正常${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS 可能需要等待 DNS 生效，请稍候再试${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ 部署完成！                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}重要信息：${NC}"
echo "  📍 域名: https://$DOMAIN_NAME"
echo "  🔐 API Key: $STORAGE_API_KEY"
echo "  🗝️  Redis 密码: $REDIS_PASSWORD"
echo ""
echo -e "${YELLOW}后续步骤：${NC}"
echo "  1. 在 Dify 中更新 API 地址为: https://$DOMAIN_NAME/api/sessions"
echo "  2. 测试工作流 1, 2, 3"
echo "  3. 监控日志: docker-compose logs -f"
echo ""
echo -e "${YELLOW}有用的命令：${NC}"
echo "  查看日志: docker-compose -f docker-compose-prod.yml logs -f"
echo "  重启服务: docker-compose -f docker-compose-prod.yml restart"
echo "  停止服务: docker-compose -f docker-compose-prod.yml down"
echo "  健康检查: curl -H 'Authorization: Bearer $STORAGE_API_KEY' https://$DOMAIN_NAME/api/sessions"
echo ""
echo -e "${YELLOW}安全提示：${NC}"
echo "  ⚠️  请妥善保管 API Key 和 Redis 密码"
echo "  ⚠️  定期备份 Redis 数据"
echo "  ⚠️  监控服务运行状态"
echo ""
