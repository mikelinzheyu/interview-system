#!/bin/bash

# AI面试系统 - Docker部署验证脚本
# ================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 验证项目
verify_project() {
    print_header "验证项目结构"

    files=(
        "docker-compose.yml"
        ".env.docker"
        "backend/Dockerfile"
        "backend/package.json"
        "frontend/Dockerfile"
        "frontend/package.json"
        "frontend/vite.config.js"
        "nginx/ssl/cert.pem"
        "nginx/ssl/key.pem"
    )

    for file in "${files[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            print_success "Found: $file"
        else
            print_error "Missing: $file"
        fi
    done
}

# 验证Docker镜像
verify_images() {
    print_header "验证Docker镜像"

    if docker images | grep -q "interview-system/backend"; then
        print_success "Backend image found: $(docker images | grep 'interview-system/backend' | awk '{print $3}')"
    else
        print_error "Backend image not found"
    fi

    if docker images | grep -q "interview-system/frontend"; then
        print_success "Frontend image found: $(docker images | grep 'interview-system/frontend' | awk '{print $3}')"
    else
        print_error "Frontend image not found"
    fi
}

# 验证容器运行状态
verify_containers() {
    print_header "验证容器运行状态"

    containers=("interview-backend" "interview-frontend" "interview-redis")

    for container in "${containers[@]}"; do
        if docker ps -a | grep -q "$container"; then
            status=$(docker ps -a --filter "name=$container" --format "{{.Status}}")
            if echo "$status" | grep -q "Up"; then
                print_success "$container is running: $status"
            else
                print_error "$container is not running: $status"
            fi
        else
            print_warning "$container does not exist"
        fi
    done
}

# 验证健康检查
verify_health() {
    print_header "验证服务健康状态"

    # 后端API健康检查
    if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "Backend API health check passed"
    else
        print_error "Backend API health check failed"
    fi

    # 前端健康检查
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
    fi

    # Redis健康检查
    if docker-compose --env-file .env.docker exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis connection check passed"
    else
        print_error "Redis connection check failed"
    fi
}

# 验证网络
verify_network() {
    print_header "验证Docker网络"

    if docker network ls | grep -q "interview-network"; then
        print_success "Network 'interview-network' exists"

        # 检查连接的容器
        containers=$(docker network inspect interview-network --format '{{json .Containers}}' 2>/dev/null | grep -o '"Name":"[^"]*"' | cut -d'"' -f4 || true)
        if [ -n "$containers" ]; then
            echo "Connected containers:"
            echo "$containers" | while read -r container; do
                echo "  - $container"
            done
        fi
    else
        print_error "Network 'interview-network' not found"
    fi
}

# 验证端口绑定
verify_ports() {
    print_header "验证端口绑定"

    ports=(
        "80:interview-frontend:HTTP"
        "443:interview-frontend:HTTPS"
        "8080:interview-backend:Backend API"
        "6379:interview-redis:Redis"
    )

    for port_info in "${ports[@]}"; do
        port=$(echo $port_info | cut -d':' -f1)
        name=$(echo $port_info | cut -d':' -f2)
        desc=$(echo $port_info | cut -d':' -f3)

        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_success "Port $port ($desc) is listening"
        else
            print_warning "Port $port ($desc) is not listening"
        fi
    done
}

# 验证日志
verify_logs() {
    print_header "验证日志文件"

    log_dirs=("logs/backend" "logs/frontend" "logs/redis")

    for dir in "${log_dirs[@]}"; do
        if [ -d "$dir" ]; then
            file_count=$(ls -1 "$dir" 2>/dev/null | wc -l)
            print_success "Log directory exists: $dir ($file_count files)"
        else
            print_warning "Log directory missing: $dir"
        fi
    done
}

# 检查磁盘使用
verify_disk() {
    print_header "验证磁盘使用"

    usage=$(df -h . | awk 'NR==2 {print $5}')
    available=$(df -h . | awk 'NR==2 {print $4}')

    echo "Disk usage: $usage"
    echo "Available: $available"

    # Docker资源信息
    if command -v docker &> /dev/null; then
        print_success "Docker资源使用:"
        docker system df
    fi
}

# 主菜单
show_menu() {
    print_header "AI面试系统 - 部署验证工具"
    echo "1. 验证项目结构"
    echo "2. 验证Docker镜像"
    echo "3. 验证容器运行状态"
    echo "4. 验证服务健康状态"
    echo "5. 验证Docker网络"
    echo "6. 验证端口绑定"
    echo "7. 验证日志文件"
    echo "8. 检查磁盘使用"
    echo "9. 运行全部验证"
    echo "10. 查看容器日志"
    echo "0. 退出"
    echo ""
}

# 查看日志菜单
show_logs_menu() {
    print_header "选择要查看的日志"
    echo "1. 后端日志"
    echo "2. 前端日志"
    echo "3. Redis日志"
    echo "4. 所有日志"
    echo "0. 返回"
    echo ""
}

# 主循环
main() {
    while true; do
        show_menu
        read -p "请选择操作 (0-10): " choice

        case $choice in
            1)
                verify_project
                ;;
            2)
                verify_images
                ;;
            3)
                verify_containers
                ;;
            4)
                verify_health
                ;;
            5)
                verify_network
                ;;
            6)
                verify_ports
                ;;
            7)
                verify_logs
                ;;
            8)
                verify_disk
                ;;
            9)
                verify_project
                verify_images
                verify_containers
                verify_network
                verify_logs
                verify_disk
                verify_health
                ;;
            10)
                while true; do
                    show_logs_menu
                    read -p "请选择 (0-4): " log_choice

                    case $log_choice in
                        1)
                            docker-compose --env-file .env.docker logs -f backend --tail=50
                            ;;
                        2)
                            docker-compose --env-file .env.docker logs -f frontend --tail=50
                            ;;
                        3)
                            docker-compose --env-file .env.docker logs -f redis --tail=50
                            ;;
                        4)
                            docker-compose --env-file .env.docker logs -f --tail=100
                            ;;
                        0)
                            break
                            ;;
                        *)
                            print_error "无效选择"
                            ;;
                    esac
                done
                ;;
            0)
                print_success "退出验证工具"
                exit 0
                ;;
            *)
                print_error "无效选择，请重试"
                ;;
        esac

        echo ""
        read -p "按Enter继续..."
    done
}

# 如果有参数，运行指定的验证
if [ $# -gt 0 ]; then
    case "$1" in
        all)
            verify_project
            verify_images
            verify_containers
            verify_network
            verify_logs
            verify_disk
            verify_health
            ;;
        health)
            verify_health
            ;;
        *)
            print_error "未知选项: $1"
            echo "用法: $0 [all|health|interactive]"
            exit 1
            ;;
    esac
else
    # 交互模式
    main
fi
