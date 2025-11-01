#!/bin/bash

# AI面试系统 - Docker生产部署脚本
# ========================================
# 使用方法: ./docker-deploy-prod.sh [start|stop|restart|logs|status|clean]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME=${COMPOSE_PROJECT_NAME:-interview-system}
ENV_FILE=.env.docker
DOCKER_COMPOSE_FILE=docker-compose.yml

# 帮助函数
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 检查环境
check_environment() {
    print_header "检查环境"

    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    print_success "Docker已安装: $(docker --version)"

    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    print_success "Docker Compose已安装: $(docker-compose --version)"

    # 检查必要文件
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "$DOCKER_COMPOSE_FILE 不存在"
        exit 1
    fi
    print_success "$DOCKER_COMPOSE_FILE 已找到"

    if [ ! -f "$ENV_FILE" ]; then
        print_warning "$ENV_FILE 不存在，使用默认配置"
        if [ ! -f ".env.production" ]; then
            print_error ".env.production 不存在，请创建环境配置文件"
            exit 1
        fi
        cp .env.production $ENV_FILE
        print_success "从 .env.production 复制配置"
    fi
    print_success "$ENV_FILE 已找到"

    # 创建必要的目录
    mkdir -p logs/{backend,frontend,redis,proxy}
    mkdir -p data/redis
    mkdir -p backend/uploads
    mkdir -p nginx/ssl
    print_success "目录结构已创建"
}

# 准备部署
prepare_deployment() {
    print_header "准备部署"

    # 检查.env文件中的关键配置
    if grep -q "DIFY_API_KEY=your-dify-api-key" $ENV_FILE; then
        print_warning "检测到未配置的DIFY_API_KEY，请在$ENV_FILE中配置"
    fi

    # 生成自签名证书 (如果不存在)
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        print_warning "SSL证书不存在，生成自签名证书..."
        mkdir -p nginx/ssl
        openssl req -x509 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
            -days 365 -nodes -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Interview System/CN=localhost" 2>/dev/null || true
        print_success "自签名证书已生成"
    fi

    print_success "部署准备完成"
}

# 构建镜像
build_images() {
    print_header "构建Docker镜像"

    print_warning "构建后端镜像..."
    docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE build backend
    print_success "后端镜像构建完成"

    print_warning "构建前端镜像..."
    docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE build frontend
    print_success "前端镜像构建完成"

    print_warning "验证Redis镜像..."
    docker pull redis:7-alpine > /dev/null 2>&1 || true
    print_success "Redis镜像已就绪"

    print_success "所有镜像构建完成"
}

# 启动服务
start_services() {
    print_header "启动服务"

    print_warning "启动Docker Compose栈..."
    docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE up -d

    # 等待服务启动
    sleep 5

    print_warning "等待服务健康检查..."
    for i in {1..30}; do
        backend_health=$(docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE ps backend | grep -c "healthy" || true)
        frontend_health=$(docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE ps frontend | grep -c "healthy" || true)
        redis_health=$(docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE ps redis | grep -c "healthy" || true)

        if [ "$backend_health" -gt 0 ] && [ "$frontend_health" -gt 0 ] && [ "$redis_health" -gt 0 ]; then
            print_success "所有服务已启动且健康"
            break
        fi

        if [ $i -eq 30 ]; then
            print_error "服务启动超时，请检查日志"
            show_logs
            exit 1
        fi

        echo -n "."
        sleep 1
    done

    print_success "服务启动完成"
}

# 显示服务状态
show_status() {
    print_header "服务状态"
    docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE ps

    print_header "网络信息"
    docker network ls | grep interview-network || true

    print_header "容器统计"
    docker stats --no-stream || true
}

# 显示日志
show_logs() {
    print_header "服务日志"

    if [ -z "$1" ]; then
        docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE logs --tail=50 -f
    else
        docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE logs --tail=50 -f $1
    fi
}

# 停止服务
stop_services() {
    print_header "停止服务"

    print_warning "停止Docker Compose栈..."
    docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE down

    print_success "服务已停止"
}

# 重启服务
restart_services() {
    print_header "重启服务"
    stop_services
    sleep 2
    start_services
}

# 清理数据
clean_data() {
    print_header "清理数据"

    print_warning "即将删除所有容器和数据，确定吗? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        print_warning "已取消"
        return
    fi

    print_warning "停止并删除所有容器..."
    docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE down -v

    print_warning "删除日志文件..."
    rm -rf logs/*

    print_warning "删除Redis数据..."
    rm -rf data/redis/*

    print_success "清理完成"
}

# 验证部署
verify_deployment() {
    print_header "验证部署"

    # 检查后端API
    print_warning "检查后端API..."
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "后端API健康检查通过"
    else
        print_error "后端API健康检查失败"
    fi

    # 检查前端
    print_warning "检查前端..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "前端健康检查通过"
    else
        print_error "前端健康检查失败"
    fi

    # 检查Redis
    print_warning "检查Redis..."
    if docker-compose --env-file $ENV_FILE -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis连接通过"
    else
        print_error "Redis连接失败"
    fi

    print_header "部署验证完成"
}

# 显示使用信息
show_usage() {
    cat << EOF
AI面试系统 - Docker生产部署脚本

使用方法: $0 [命令]

命令列表:
  start       - 构建并启动所有服务
  stop        - 停止所有服务
  restart     - 重启所有服务
  logs        - 查看服务日志 (可选: logs backend|frontend|redis)
  status      - 显示服务状态
  verify      - 验证部署状态
  clean       - 清理所有数据
  help        - 显示此帮助信息

示例:
  $0 start                    # 启动服务
  $0 logs backend             # 查看后端日志
  $0 status                   # 查看服务状态
  $0 restart                  # 重启服务

环境变量:
  COMPOSE_PROJECT_NAME       - 项目名称 (默认: interview-system)
  ENV_FILE                   - 环境配置文件 (默认: .env.docker)

EOF
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            check_environment
            prepare_deployment
            build_images
            start_services
            verify_deployment
            print_header "部署成功"
            echo "前端地址: http://localhost"
            echo "后端API: http://localhost:8080/api"
            echo "Redis: localhost:6379"
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            verify_deployment
            ;;
        logs)
            show_logs $2
            ;;
        status)
            show_status
            ;;
        verify)
            verify_deployment
            ;;
        clean)
            clean_data
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "未知的命令: $1"
            show_usage
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
