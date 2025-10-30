#!/bin/bash

# Storage Service Docker 生产环境部署脚本
# 使用方式: ./deploy-prod.sh [start|stop|restart|logs|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose-prod.yml"
COMPOSE_CMD="docker-compose -f $COMPOSE_FILE"

# 函数定义
print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        echo "请访问: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker 已安装"
}

check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        echo "请访问: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose 已安装"
}

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "$COMPOSE_FILE 文件不存在"
        exit 1
    fi
    print_success "$COMPOSE_FILE 文件已找到"
}

start_services() {
    print_header "启动存储服务"

    print_info "检查前置条件..."
    check_docker
    check_docker_compose
    check_compose_file

    print_info "构建镜像..."
    $COMPOSE_CMD build

    print_info "启动服务..."
    $COMPOSE_CMD up -d

    print_info "等待服务启动（60秒）..."
    sleep 60

    print_info "验证服务状态..."
    $COMPOSE_CMD ps

    print_info "测试健康检查..."
    if curl -f http://localhost:8081/api/sessions > /dev/null 2>&1; then
        print_success "健康检查通过"
    else
        print_error "健康检查失败，请查看日志"
        echo -e "\n${YELLOW}查看日志:${NC}"
        echo "  docker-compose -f $COMPOSE_FILE logs -f interview-storage-service"
        exit 1
    fi

    print_success "存储服务已成功启动"

    echo ""
    echo -e "${BLUE}📊 服务信息:${NC}"
    echo "  Storage Service URL: http://localhost:8081"
    echo "  API 端点: http://localhost:8081/api/sessions"
    echo "  Redis: interview-redis:6379"
    echo ""
    echo -e "${BLUE}📝 常用命令:${NC}"
    echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f interview-storage-service"
    echo "  停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"
}

stop_services() {
    print_header "停止存储服务"

    print_info "停止所有容器..."
    $COMPOSE_CMD down

    print_success "服务已停止"
}

restart_services() {
    print_header "重启存储服务"

    print_info "重启所有容器..."
    $COMPOSE_CMD restart

    print_info "等待服务重启（30秒）..."
    sleep 30

    print_info "验证服务状态..."
    $COMPOSE_CMD ps

    print_success "服务已重启"
}

show_logs() {
    print_header "显示服务日志"

    case "${1:-all}" in
        storage)
            $COMPOSE_CMD logs -f interview-storage-service
            ;;
        redis)
            $COMPOSE_CMD logs -f interview-redis
            ;;
        *)
            $COMPOSE_CMD logs -f
            ;;
    esac
}

show_status() {
    print_header "服务状态"

    $COMPOSE_CMD ps

    echo -e "\n${BLUE}资源使用情况:${NC}"
    docker stats --no-stream $(docker-compose -f $COMPOSE_FILE ps -q 2>/dev/null) 2>/dev/null || echo "无运行中的容器"

    echo -e "\n${BLUE}网络信息:${NC}"
    docker network inspect interview-system_interview-network 2>/dev/null | grep -A 10 "Containers" || echo "网络未找到"
}

backup_data() {
    print_header "备份数据"

    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR

    TIMESTAMP=$(date +%Y%m%d-%H%M%S)

    print_info "备份 Redis 数据..."
    docker-compose -f $COMPOSE_FILE exec -T interview-redis \
        redis-cli -a redis-password-prod --rdb /data/dump.rdb > /dev/null 2>&1

    docker cp interview-redis:/data/dump.rdb \
        $BACKUP_DIR/redis-backup-$TIMESTAMP.rdb

    print_success "Redis 数据已备份到: $BACKUP_DIR/redis-backup-$TIMESTAMP.rdb"

    print_info "备份应用日志..."
    docker cp interview-storage-service:/app/logs \
        $BACKUP_DIR/logs-backup-$TIMESTAMP

    print_success "应用日志已备份到: $BACKUP_DIR/logs-backup-$TIMESTAMP"

    echo ""
    print_info "备份总大小:"
    du -sh $BACKUP_DIR/
}

health_check() {
    print_header "健康检查"

    print_info "检查 Redis..."
    if $COMPOSE_CMD exec -T interview-redis \
        redis-cli -a redis-password-prod ping > /dev/null 2>&1; then
        print_success "Redis 健康"
    else
        print_error "Redis 异常"
        return 1
    fi

    print_info "检查 Storage Service..."
    if curl -f http://localhost:8081/api/sessions > /dev/null 2>&1; then
        print_success "Storage Service 健康"
    else
        print_error "Storage Service 异常"
        return 1
    fi

    print_success "所有服务健康检查通过"
}

# 主程序
main() {
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs "${2:-all}"
            ;;
        status)
            show_status
            ;;
        backup)
            backup_data
            ;;
        health)
            health_check
            ;;
        help|*)
            echo -e "${BLUE}Storage Service Docker 生产部署脚本${NC}"
            echo ""
            echo "使用方式: $0 [命令]"
            echo ""
            echo "命令:"
            echo "  start              启动服务"
            echo "  stop               停止服务"
            echo "  restart            重启服务"
            echo "  logs [service]     显示日志 (service: storage|redis|all)"
            echo "  status             显示服务状态"
            echo "  backup             备份数据"
            echo "  health             执行健康检查"
            echo "  help               显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  $0 start                 # 启动服务"
            echo "  $0 logs storage          # 显示 Storage Service 日志"
            echo "  $0 backup                # 备份数据"
            echo ""
            ;;
    esac
}

# 执行主程序
main "$@"
