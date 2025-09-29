#!/bin/bash

# 面试系统部署脚本

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

# 检查 Docker 和 Docker Compose
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "依赖检查完成"
}

# 构建镜像
build_images() {
    log_info "构建镜像..."

    # 构建后端镜像
    log_info "构建后端镜像..."
    docker-compose build backend

    # 构建前端镜像
    log_info "构建前端镜像..."
    docker-compose build frontend

    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."

    # 启动所有服务
    docker-compose up -d

    log_success "服务启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."

    # 等待服务启动
    sleep 10

    # 检查数据库
    if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
        log_success "MySQL 服务正常"
    else
        log_error "MySQL 服务异常"
    fi

    # 检查后端
    if curl -f http://localhost:8080/api/actuator/health > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_warning "后端服务可能未就绪，请稍后检查"
    fi

    # 检查前端
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_warning "前端服务可能未就绪，请稍后检查"
    fi
}

# 显示服务信息
show_info() {
    log_info "服务信息:"
    echo "前端地址: http://localhost"
    echo "后端地址: http://localhost:8080"
    echo "数据库地址: localhost:3306"
    echo "Redis地址: localhost:6379"
    echo ""
    log_info "管理命令:"
    echo "查看日志: docker-compose logs -f [service]"
    echo "停止服务: docker-compose down"
    echo "重启服务: docker-compose restart [service]"
    echo "查看状态: docker-compose ps"
}

# 主函数
main() {
    log_info "开始部署面试系统..."

    check_dependencies
    build_images
    start_services
    check_services
    show_info

    log_success "部署完成!"
}

# 处理命令行参数
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build")
        check_dependencies
        build_images
        ;;
    "start")
        start_services
        ;;
    "check")
        check_services
        ;;
    "stop")
        log_info "停止所有服务..."
        docker-compose down
        log_success "服务已停止"
        ;;
    "restart")
        log_info "重启服务..."
        docker-compose restart
        log_success "服务已重启"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "clean")
        log_warning "清理所有数据..."
        docker-compose down -v
        docker system prune -f
        log_success "清理完成"
        ;;
    *)
        echo "用法: $0 {deploy|build|start|stop|restart|check|logs|clean}"
        echo ""
        echo "deploy  - 完整部署 (默认)"
        echo "build   - 只构建镜像"
        echo "start   - 启动服务"
        echo "stop    - 停止服务"
        echo "restart - 重启服务"
        echo "check   - 检查服务状态"
        echo "logs    - 查看日志"
        echo "clean   - 清理所有数据"
        exit 1
        ;;
esac