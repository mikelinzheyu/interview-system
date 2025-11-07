#!/bin/bash

# AI面试系统 - 一键部署脚本
# ================================

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_success "系统依赖检查通过"
}

# 环境配置检查
check_environment() {
    log_info "检查环境配置..."

    if [ ! -f ".env" ]; then
        log_warning ".env 文件不存在，从模板创建..."
        cp .env.example .env
        log_warning "请编辑 .env 文件并配置必要的参数（特别是 DIFY_API_KEY）"
        read -p "按 Enter 继续..."
    fi

    # 检查关键配置
    if grep -q "your-dify-api-key-here" .env; then
        log_warning "检测到默认的 Dify API 密钥，请确保已正确配置"
    fi

    log_success "环境配置检查完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要的目录..."

    mkdir -p logs/{frontend,backend,redis,proxy}
    mkdir -p data/redis
    mkdir -p nginx/ssl

    log_success "目录创建完成"
}

# 构建和启动服务
deploy_services() {
    log_info "开始构建和部署服务..."

    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose down 2>/dev/null || true

    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build --no-cache

    # 启动服务
    log_info "启动服务..."
    docker-compose up -d

    log_success "服务部署完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务启动..."

    # 等待后端服务
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8080/api/health &>/dev/null; then
            log_success "后端服务已就绪"
            break
        fi

        log_info "等待后端服务... ($((attempt + 1))/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "后端服务启动超时"
        docker-compose logs backend
        exit 1
    fi

    # 等待前端服务
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost/health &>/dev/null; then
            log_success "前端服务已就绪"
            break
        fi

        log_info "等待前端服务... ($((attempt + 1))/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "前端服务启动超时"
        docker-compose logs frontend
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "🎉 AI面试系统部署成功！"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 访问地址:"
    echo "   前端应用: http://localhost"
    echo "   API服务:  http://localhost:8080"
    echo "   健康检查: http://localhost/health"
    echo
    echo "🛠️  管理命令:"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo
    echo "📁 重要目录:"
    echo "   日志目录: ./logs/"
    echo "   数据目录: ./data/"
    echo "   配置文件: ./.env"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 主函数
main() {
    echo "🚀 AI面试系统 - 自动部署脚本"
    echo "=================================="
    echo

    check_dependencies
    check_environment
    create_directories
    deploy_services
    wait_for_services
    show_deployment_info

    log_success "部署完成！🎊"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 运行主函数
main "$@"