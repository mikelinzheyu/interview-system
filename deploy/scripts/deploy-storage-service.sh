#!/bin/bash

# ==========================================
# Storage Service 部署脚本 (Bash)
# Interview System - Production Deployment
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${CYAN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 检查命令执行结果
check_command() {
    if [ $? -ne 0 ]; then
        log_error "$1"
        exit 1
    fi
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."

    mkdir -p logs/storage
    mkdir -p data/storage
    mkdir -p logs/backend
    mkdir -p logs/frontend
    mkdir -p logs/redis

    chmod -R 777 logs data
    log_success "目录创建完成"
}

# 构建镜像
build_images() {
    log_info "开始构建 Docker 镜像..."

    if [ "$1" = "force" ]; then
        docker-compose -f docker-compose.yml build --no-cache
    else
        docker-compose -f docker-compose.yml build
    fi

    check_command "镜像构建失败"
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动 Docker 容器..."

    docker-compose -f docker-compose.yml up -d
    check_command "容器启动失败"

    log_success "容器启动成功"
    sleep 5
}

# 停止服务
stop_services() {
    log_info "停止 Docker 容器..."

    docker-compose -f docker-compose.yml down
    check_command "容器停止失败"

    log_success "容器停止成功"
}

# 重启服务
restart_services() {
    log_info "重启服务..."

    stop_services
    start_services

    log_success "服务重启成功"
}

# 显示日志
show_logs() {
    log_info "显示 Storage Service 日志..."
    echo ""
    docker-compose -f docker-compose.yml logs -f storage-service
}

# 显示状态
show_status() {
    log_info "检查容器状态..."
    echo ""
    docker-compose -f docker-compose.yml ps
    echo ""
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    echo ""

    # 检查 Storage Service
    log_info "检查 Storage Service 健康状态..."
    if curl -sf http://localhost:8081/api/sessions > /dev/null 2>&1; then
        log_success "Storage Service 正常运行 ✓"
    else
        log_warning "无法连接 Storage Service"
    fi

    # 检查 Redis
    log_info "检查 Redis 连接..."
    if docker exec interview-redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis 正常运行 ✓"
    else
        log_warning "无法连接 Redis"
    fi

    # 检查 Backend
    log_info "检查 Backend 健康状态..."
    if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
        log_success "Backend 正常运行 ✓"
    else
        log_warning "无法连接 Backend (可能未启动)"
    fi

    echo ""
    log_success "健康检查完成"
}

# 显示摘要
show_summary() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  Interview System - Storage Service${NC}"
    echo -e "${CYAN}  生产环境部署${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    echo -e "${YELLOW}服务信息:${NC}"
    echo -e "  Storage Service: ${GREEN}http://localhost:8081/api/sessions${NC}"
    echo -e "  Backend API:     ${GREEN}http://localhost:8080${NC}"
    echo -e "  Frontend:        ${GREEN}http://localhost${NC}"
    echo -e "  Redis:           ${GREEN}localhost:6379${NC}"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo -e "  ./deploy-storage-service.sh logs     # 查看日志"
    echo -e "  ./deploy-storage-service.sh status   # 查看状态"
    echo -e "  ./deploy-storage-service.sh health   # 健康检查"
    echo -e "  ./deploy-storage-service.sh restart  # 重启服务"
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo ""
}

# 主函数
main() {
    ACTION=${1:-start}

    # 检查 Docker
    log_info "检查 Docker 环境..."
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_success "找到 Docker: $DOCKER_VERSION"
    else
        log_error "Docker 未安装或不在 PATH 中"
        exit 1
    fi

    log_info "执行操作: $ACTION"
    echo ""

    case $ACTION in
        build)
            create_directories
            build_images
            show_summary
            ;;
        start)
            create_directories
            build_images
            start_services
            show_summary
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            show_summary
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        rebuild)
            create_directories
            stop_services
            build_images force
            start_services
            show_summary
            ;;
        *)
            log_error "未知操作: $ACTION"
            echo "用法: $0 {build|start|stop|restart|logs|status|health|rebuild}"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
