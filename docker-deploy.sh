#!/bin/bash

# AI 面试系统完整 Docker 部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose-full.yml"

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Docker 未安装"
        exit 1
    fi
    print_success "Docker 已安装"
}

check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose 未安装"
        exit 1
    fi
    print_success "Docker Compose 已安装"
}

main() {
    case "${1:-help}" in
        start)
            print_header "启动所有服务"
            print_info "检查前置条件..."
            check_docker
            check_docker_compose
            print_info "构建镜像..."
            docker-compose -f $COMPOSE_FILE build
            print_info "启动容器..."
            docker-compose -f $COMPOSE_FILE up -d
            print_info "等待服务启动..."
            sleep 60
            print_info "验证容器状态..."
            docker-compose -f $COMPOSE_FILE ps
            print_success "所有服务已启动"
            ;;
        stop)
            print_header "停止所有服务"
            print_info "停止容器..."
            docker-compose -f $COMPOSE_FILE down
            print_success "所有服务已停止"
            ;;
        restart)
            print_header "重启所有服务"
            print_info "重启容器..."
            docker-compose -f $COMPOSE_FILE restart
            sleep 30
            docker-compose -f $COMPOSE_FILE ps
            print_success "所有服务已重启"
            ;;
        logs)
            print_header "显示服务日志"
            if [ -z "$2" ]; then
                docker-compose -f $COMPOSE_FILE logs -f
            else
                docker-compose -f $COMPOSE_FILE logs -f "$2"
            fi
            ;;
        status)
            print_header "容器状态"
            docker-compose -f $COMPOSE_FILE ps
            ;;
        *)
            echo "AI 面试系统 Docker 部署脚本"
            echo "使用: $0 [start|stop|restart|logs|status]"
            ;;
    esac
}

main "$@"
