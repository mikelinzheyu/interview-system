#!/bin/bash

# ====================================================
# AI面试系统 - 生产环境部署脚本
# ====================================================

set -e

# 颜色定义
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    log_info "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker未运行，请启动Docker"
        exit 1
    fi

    log_success "Docker环境检查通过"
}

# 检查Docker Compose是否安装
check_docker_compose() {
    log_info "检查Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装"
        exit 1
    fi
    log_success "Docker Compose检查通过"
}

# 检查环境变量文件
check_env() {
    log_info "检查环境配置..."
    if [ ! -f .env.production ]; then
        log_warning ".env.production 不存在，从示例文件复制..."
        cp .env.example .env.production
        log_warning "请编辑 .env.production 并设置正确的密码和密钥"
        exit 1
    fi
    log_success "环境配置检查通过"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    mkdir -p data/redis
    mkdir -p logs/redis
    mkdir -p logs/storage-api
    mkdir -p logs/backend
    mkdir -p logs/nginx
    mkdir -p logs/proxy
    mkdir -p nginx/ssl
    log_success "目录创建完成"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    docker-compose -f docker-compose.production.yml build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose -f docker-compose.production.yml up -d
    log_success "服务启动完成"
}

# 等待服务健康检查
wait_for_health() {
    log_info "等待服务启动..."
    sleep 10

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local unhealthy=$(docker-compose -f docker-compose.production.yml ps | grep -c "unhealthy" || true)
        local starting=$(docker-compose -f docker-compose.production.yml ps | grep -c "starting" || true)

        if [ $unhealthy -eq 0 ] && [ $starting -eq 0 ]; then
            log_success "所有服务已健康运行"
            return 0
        fi

        attempt=$((attempt + 1))
        log_info "等待服务健康检查... ($attempt/$max_attempts)"
        sleep 10
    done

    log_error "服务启动超时"
    return 1
}

# 显示服务状态
show_status() {
    log_info "服务状态："
    docker-compose -f docker-compose.production.yml ps
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}部署完成！${NC}"
    echo "=========================================="
    echo ""
    echo "服务访问地址："
    echo "  前端: http://localhost:80"
    echo "  后端API: http://localhost:3001"
    echo "  存储API: http://localhost:8090"
    echo "  Redis: localhost:6379"
    echo ""
    echo "常用命令："
    echo "  查看日志: docker-compose -f docker-compose.production.yml logs -f"
    echo "  停止服务: docker-compose -f docker-compose.production.yml down"
    echo "  重启服务: docker-compose -f docker-compose.production.yml restart"
    echo ""
    echo "配置文件："
    echo "  环境变量: production/.env.production"
    echo "  Docker配置: production/docker-compose.production.yml"
    echo ""
}

# 主函数
main() {
    cd "$(dirname "$0")"

    echo "=========================================="
    echo "  AI面试系统 - 生产环境部署"
    echo "=========================================="
    echo ""

    check_docker
    check_docker_compose
    check_env
    create_directories

    log_info "开始部署..."

    build_images
    start_services

    if wait_for_health; then
        show_status
        show_access_info
    else
        log_error "部署失败，请查看日志"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
}

# 运行主函数
main "$@"
