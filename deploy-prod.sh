#!/bin/bash
# AI面试系统 - 生产环境部署脚本
# =====================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

log_info "=========================================="
log_info "AI面试系统 - 生产环境部署"
log_info "=========================================="

# 1. 检查Docker和docker-compose
log_info "检查Docker和docker-compose..."
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose未安装"
    exit 1
fi

log_success "Docker和docker-compose已安装"
docker --version
docker-compose --version

# 2. 检查配置文件
log_info "检查配置文件..."
if [ ! -f ".env.prod" ]; then
    log_error ".env.prod文件不存在，请先配置"
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "docker-compose.prod.yml文件不存在"
    exit 1
fi

log_success "配置文件检查完成"

# 3. 创建必要的目录
log_info "创建数据目录..."
mkdir -p data/db/{init,backups}
mkdir -p data/redis
mkdir -p data/backend/uploads
mkdir -p data/storage
mkdir -p data/frontend/cache
mkdir -p data/proxy/cache
mkdir -p logs/{db,redis,backend,storage,frontend,proxy,prometheus,grafana,elasticsearch}
mkdir -p nginx/ssl
mkdir -p monitoring/{prometheus,grafana}

log_success "数据目录创建完成"

# 4. 检查并创建SSL证书
log_info "检查SSL证书..."
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    log_warn "SSL证书不存在，使用自签证书..."
    mkdir -p nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/CN=localhost"
    log_success "自签证书已创建"
else
    log_success "SSL证书已存在"
fi

# 5. 构建Docker镜像
log_info "构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

log_success "Docker镜像构建完成"

# 6. 启动服务
log_info "启动服务..."
docker-compose -f docker-compose.prod.yml up -d

log_success "服务启动完成"

# 7. 等待服务就绪
log_info "等待服务就绪（最多60秒）..."
sleep 10

for i in {1..12}; do
    if curl -f http://localhost/health &> /dev/null; then
        log_success "服务已就绪"
        break
    fi
    if [ $i -eq 12 ]; then
        log_warn "服务启动超时，请检查日志"
    fi
    log_info "等待中... ($((i*5))秒)"
    sleep 5
done

# 8. 显示服务状态
log_info "显示服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 9. 显示访问信息
log_info "=========================================="
log_success "部署完成！"
log_info "=========================================="
log_info "访问地址:"
log_info "  前端: https://localhost"
log_info "  后端API: https://localhost/api"
log_info "  存储服务: https://localhost/storage"
log_info ""
log_info "监控面板 (需要启用monitoring profile):"
log_info "  Prometheus: http://localhost:9090"
log_info "  Grafana: http://localhost/grafana"
log_info ""
log_info "日志位置: ./logs/"
log_info "数据位置: ./data/"
log_info ""
log_info "有用的命令:"
log_info "  查看日志: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
log_info "  停止服务: docker-compose -f docker-compose.prod.yml down"
log_info "  重启服务: docker-compose -f docker-compose.prod.yml restart"
log_info "=========================================="

