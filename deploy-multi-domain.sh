#!/bin/bash

# ================================================================
# 多域名 Nginx 部署脚本
# 用途：在服务器上自动化部署多域名 Nginx 配置
# 使用：bash deploy-multi-domain.sh
# ================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/opt/interview-system"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
NGINX_SERVICE="interview-nginx"
NGINX_CONFIG="nginx.conf"

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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 检查前置条件
check_prerequisites() {
    print_header "检查部署前置条件"

    # 检查项目目录
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
    cd "$PROJECT_DIR"
    print_success "项目目录存在: $PROJECT_DIR"

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    print_success "Docker 已安装"

    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    print_success "Docker Compose 已安装"

    # 检查 Nginx 配置文件
    if [ ! -f "$NGINX_CONFIG" ]; then
        print_error "Nginx 配置文件不存在: $NGINX_CONFIG"
        exit 1
    fi
    print_success "Nginx 配置文件存在"

    # 检查 Docker Compose 文件
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker Compose 文件不存在: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    print_success "Docker Compose 文件存在"

    # 检查 SSL 证书
    if [ ! -f "/etc/letsencrypt/live/viewself.cn/fullchain.pem" ]; then
        print_warning "SSL 证书文件不存在: /etc/letsencrypt/live/viewself.cn/fullchain.pem"
        print_info "如需申请证书，请运行:"
        echo "    certbot certonly --standalone -d viewself.cn -d www.viewself.cn -d storage.viewself.cn"
        read -p "继续部署吗? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "部署已取消"
            exit 1
        fi
    else
        print_success "SSL 证书文件存在"
    fi

    # 检查 DNS A 记录
    print_info "检查 DNS 解析..."
    for domain in "viewself.cn" "www.viewself.cn" "storage.viewself.cn"; do
        if ping -c 1 "$domain" &> /dev/null; then
            print_success "DNS 可解析: $domain"
        else
            print_warning "DNS 可能未生效: $domain (但可继续部署)"
        fi
    done
}

# 验证 Nginx 配置
validate_nginx_config() {
    print_header "验证 Nginx 配置语法"

    if [ ! -f "$NGINX_CONFIG" ]; then
        print_error "Nginx 配置文件不存在"
        exit 1
    fi

    # 检查关键配置
    if grep -q "server_name viewself.cn" "$NGINX_CONFIG"; then
        print_success "找到 viewself.cn server block"
    else
        print_error "缺少 viewself.cn server block"
        exit 1
    fi

    if grep -q "server_name storage.viewself.cn" "$NGINX_CONFIG"; then
        print_success "找到 storage.viewself.cn server block"
    else
        print_error "缺少 storage.viewself.cn server block"
        exit 1
    fi

    if grep -q "proxy_pass http://interview-frontend:80" "$NGINX_CONFIG"; then
        print_success "前端代理配置正确"
    else
        print_warning "前端代理配置可能不正确"
    fi

    if grep -q "proxy_pass http://interview-storage:8081" "$NGINX_CONFIG"; then
        print_success "存储服务代理配置正确"
    else
        print_warning "存储服务代理配置可能不正确"
    fi
}

# 备份现有配置
backup_config() {
    print_header "备份现有配置"

    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if [ -f "$NGINX_CONFIG" ]; then
        cp "$NGINX_CONFIG" "$BACKUP_DIR/$NGINX_CONFIG"
        print_success "已备份 nginx.conf: $BACKUP_DIR/$NGINX_CONFIG"
    fi

    print_info "备份目录: $BACKUP_DIR"
}

# 检查容器状态
check_containers() {
    print_header "检查容器状态"

    docker-compose -f "$DOCKER_COMPOSE_FILE" ps

    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "$NGINX_SERVICE"; then
        print_success "Nginx 容器正在运行"
    else
        print_warning "Nginx 容器未运行"
    fi
}

# 重启 Nginx 容器
restart_nginx() {
    print_header "重启 Nginx 容器"

    print_info "停止旧的 Nginx 容器..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    print_info "使用新配置启动 Nginx 容器..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --force-recreate "$NGINX_SERVICE"

    # 等待容器启动
    print_info "等待容器启动..."
    sleep 5

    # 验证容器是否运行
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "$NGINX_SERVICE"; then
        print_success "Nginx 容器已成功启动"
    else
        print_error "Nginx 容器启动失败"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs "$NGINX_SERVICE"
        exit 1
    fi
}

# 测试 Nginx 配置
test_nginx() {
    print_header "测试 Nginx 配置"

    print_info "执行 nginx -t 测试..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$NGINX_SERVICE" nginx -t; then
        print_success "Nginx 配置验证通过"
    else
        print_error "Nginx 配置验证失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    print_header "验证部署"

    print_info "测试 HTTP 重定向..."
    if timeout 5 bash -c "echo > /dev/tcp/localhost/80" 2>/dev/null; then
        print_success "HTTP 80 端口响应正常"
    else
        print_warning "HTTP 80 端口无响应（可能需要外网访问测试）"
    fi

    print_info "测试 HTTPS 连接..."
    if timeout 5 bash -c "echo > /dev/tcp/localhost/443" 2>/dev/null; then
        print_success "HTTPS 443 端口响应正常"
    else
        print_warning "HTTPS 443 端口无响应（可能需要外网访问测试）"
    fi

    print_info "检查 Nginx 日志..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail 20 "$NGINX_SERVICE" | tail -10

    print_info "后续验证步骤:"
    echo "    1. 清除浏览器缓存"
    echo "    2. 访问 https://viewself.cn -> 应看到前端应用"
    echo "    3. 访问 https://storage.viewself.cn -> 应看到存储服务"
}

# 显示部署摘要
show_summary() {
    print_header "部署摘要"

    echo -e "${GREEN}部署配置:${NC}"
    echo "  项目目录: $PROJECT_DIR"
    echo "  Nginx 配置: $NGINX_CONFIG"
    echo "  服务: $NGINX_SERVICE"
    echo ""
    echo -e "${GREEN}域名配置:${NC}"
    echo "  viewself.cn → interview-frontend:80 (前端)"
    echo "  www.viewself.cn → interview-frontend:80 (前端)"
    echo "  storage.viewself.cn → interview-storage:8081 (存储服务)"
    echo ""
    echo -e "${GREEN}SSL 证书:${NC}"
    echo "  /etc/letsencrypt/live/viewself.cn/"
    echo ""
    echo -e "${GREEN}后续步骤:${NC}"
    echo "  1. 验证 HTTP 重定向: curl -I http://viewself.cn"
    echo "  2. 验证 HTTPS: curl -I https://viewself.cn"
    echo "  3. 在浏览器中访问两个域名验证功能"
    echo "  4. 检查日志: docker-compose -f $DOCKER_COMPOSE_FILE logs -f $NGINX_SERVICE"
}

# 显示帮助信息
show_help() {
    cat << EOF
使用方法: bash deploy-multi-domain.sh [选项]

选项:
  -h, --help              显示此帮助信息
  -c, --check-only        仅检查前置条件，不部署
  -f, --force             跳过某些确认，强制部署
  -v, --validate-only     仅验证配置，不部署

示例:
  bash deploy-multi-domain.sh                 # 完整部署
  bash deploy-multi-domain.sh -c              # 仅检查
  bash deploy-multi-domain.sh -f              # 强制部署

EOF
}

# 主程序
main() {
    local check_only=false
    local force=false
    local validate_only=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check-only)
                check_only=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -v|--validate-only)
                validate_only=true
                shift
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 执行部署流程
    print_header "多域名 Nginx 部署脚本"
    echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"

    check_prerequisites

    if [ "$check_only" = true ]; then
        print_success "前置条件检查完毕"
        exit 0
    fi

    validate_nginx_config

    if [ "$validate_only" = true ]; then
        print_success "配置验证完毕"
        exit 0
    fi

    backup_config
    check_containers
    restart_nginx
    test_nginx
    verify_deployment
    show_summary

    print_header "部署完成"
    echo "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
    print_success "Nginx 多域名配置部署成功！"
}

# 运行主程序
main "$@"
