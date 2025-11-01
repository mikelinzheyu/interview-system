#!/bin/bash

# ==========================================
# Storage Service 部署验证脚本
# Interview System - Deployment Verification
# ==========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 计数器
PASSED=0
FAILED=0
WARNINGS=0

# 日志函数
log_title() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▸ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

log_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# 验证函数

verify_docker() {
    log_title "Docker 环境验证"

    # 检查 Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_pass "Docker 已安装: $DOCKER_VERSION"
    else
        log_fail "Docker 未安装"
        return 1
    fi

    # 检查 Docker Compose
    if command -v docker-compose &> /dev/null; then
        DC_VERSION=$(docker-compose --version)
        log_pass "Docker Compose 已安装: $DC_VERSION"
    else
        log_fail "Docker Compose 未安装"
        return 1
    fi

    # 检查 Docker 运行
    if docker ps > /dev/null 2>&1; then
        log_pass "Docker 运行正常"
    else
        log_fail "无法访问 Docker 守护进程"
        return 1
    fi
}

verify_files() {
    log_title "文件和配置验证"

    # 检查关键文件
    local files=(
        "docker-compose.yml"
        "storage-service/Dockerfile.prod"
        "storage-service/pom.xml"
        "storage-service/src/main/resources/application.properties"
        "storage-service/src/main/resources/application-prod.properties"
    )

    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_pass "文件存在: $file"
        else
            log_fail "文件缺失: $file"
        fi
    done

    # 检查目录
    local dirs=("logs" "data")
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_pass "目录存在: $dir"
        else
            log_warn "目录缺失: $dir (将在启动时创建)"
        fi
    done

    # 检查环境文件
    if [ -f ".env.prod" ]; then
        log_pass "环境配置文件存在: .env.prod"
    else
        log_warn "环境配置文件缺失: .env.prod (使用默认值)"
    fi
}

verify_containers() {
    log_title "容器状态验证"

    # 检查 Redis
    if docker ps --filter "name=interview-redis" --format "table {{.Names}}" | grep -q "interview-redis"; then
        log_pass "Redis 容器正在运行"

        # 测试 Redis 连接
        if docker exec interview-redis redis-cli ping > /dev/null 2>&1; then
            log_pass "Redis 连接正常"
        else
            log_fail "Redis 连接失败"
        fi
    else
        log_warn "Redis 容器未运行 (可能尚未启动)"
    fi

    # 检查 Storage Service
    if docker ps --filter "name=interview-storage-service" --format "table {{.Names}}" | grep -q "interview-storage-service"; then
        log_pass "Storage Service 容器正在运行"

        # 检查容器状态
        STATUS=$(docker inspect interview-storage-service --format='{{.State.Status}}')
        if [ "$STATUS" = "running" ]; then
            log_pass "Storage Service 状态: $STATUS"
        else
            log_fail "Storage Service 状态: $STATUS"
        fi
    else
        log_warn "Storage Service 容器未运行 (可能尚未启动)"
    fi

    # 检查 Backend
    if docker ps --filter "name=interview-backend" --format "table {{.Names}}" | grep -q "interview-backend"; then
        log_pass "Backend 容器正在运行"
    else
        log_warn "Backend 容器未运行"
    fi

    # 检查 Frontend
    if docker ps --filter "name=interview-frontend" --format "table {{.Names}}" | grep -q "interview-frontend"; then
        log_pass "Frontend 容器正在运行"
    else
        log_warn "Frontend 容器未运行"
    fi
}

verify_connectivity() {
    log_title "网络连接验证"

    # 检查 Storage Service
    if curl -sf http://localhost:8081/api/sessions > /dev/null 2>&1; then
        log_pass "Storage Service API 连接正常 (http://localhost:8081/api/sessions)"
    else
        log_warn "Storage Service API 无响应 (可能尚未就绪或未启动)"
    fi

    # 检查 Backend
    if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
        log_pass "Backend API 连接正常 (http://localhost:8080)"
    else
        log_warn "Backend API 无响应"
    fi

    # 检查 Frontend
    if curl -sf http://localhost/ > /dev/null 2>&1; then
        log_pass "Frontend 连接正常 (http://localhost)"
    else
        log_warn "Frontend 无响应"
    fi

    # 检查 Redis
    if redis-cli ping > /dev/null 2>&1; then
        log_pass "Redis 本地连接正常"
    elif docker exec interview-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        log_pass "Redis 容器连接正常"
    else
        log_warn "Redis 连接无法验证"
    fi
}

verify_logs() {
    log_title "日志文件验证"

    # 检查日志目录
    if [ -d "logs/storage" ]; then
        log_pass "Storage Service 日志目录存在"

        if [ -f "logs/storage/storage-service.log" ]; then
            log_pass "Storage Service 日志文件存在"
            FILE_SIZE=$(du -sh "logs/storage/storage-service.log" | cut -f1)
            log_info "日志文件大小: $FILE_SIZE"
        else
            log_warn "Storage Service 日志文件不存在 (尚未产生日志)"
        fi
    else
        log_warn "Storage Service 日志目录不存在"
    fi
}

verify_configuration() {
    log_title "配置验证"

    # 检查 docker-compose.yml 中的 storage-service 配置
    if grep -q "interview-storage-service" docker-compose.yml; then
        log_pass "docker-compose.yml 包含 storage-service 配置"
    else
        log_fail "docker-compose.yml 缺少 storage-service 配置"
    fi

    # 检查 application-prod.properties
    if [ -f "storage-service/src/main/resources/application-prod.properties" ]; then
        if grep -q "spring.profiles.active=prod" storage-service/src/main/resources/application-prod.properties; then
            log_pass "Spring 生产配置正确"
        else
            log_warn "Spring 生产配置可能不完整"
        fi
    else
        log_fail "application-prod.properties 文件缺失"
    fi

    # 检查 Dockerfile.prod
    if grep -q "FROM openjdk:17-jdk-alpine" storage-service/Dockerfile.prod; then
        log_pass "Dockerfile.prod 使用正确的基础镜像"
    else
        log_warn "Dockerfile.prod 基础镜像可能不同"
    fi
}

verify_security() {
    log_title "安全检查"

    # 检查是否在使用默认 API Key
    if grep -q "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" .env.prod 2>/dev/null; then
        log_warn "使用了默认的 API Key，建议修改"
    elif grep -q "ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" docker-compose.yml 2>/dev/null; then
        log_warn "docker-compose.yml 包含默认的 API Key，建议使用环境变量"
    else
        log_pass "未检测到默认的 API Key (未配置)"
    fi

    # 检查 Redis 密码
    if [ -f ".env.prod" ]; then
        if grep -q "REDIS_PASSWORD=" .env.prod; then
            if grep "REDIS_PASSWORD=" .env.prod | grep -v "^#" | grep -q "REDIS_PASSWORD=$"; then
                log_warn "Redis 密码未设置"
            else
                log_pass "Redis 密码已配置"
            fi
        fi
    fi

    # 检查 Dockerfile 中的非 root 用户
    if grep -q "USER appuser" storage-service/Dockerfile.prod; then
        log_pass "Dockerfile 正确配置了非 root 用户运行"
    else
        log_fail "Dockerfile 未配置非 root 用户"
    fi
}

show_summary() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▸ 验证总结${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "通过: ${GREEN}$PASSED${NC} | 失败: ${RED}$FAILED${NC} | 警告: ${YELLOW}$WARNINGS${NC}"
    echo ""

    if [ $FAILED -eq 0 ] && [ $PASSED -gt 0 ]; then
        echo -e "${GREEN}✓ 验证通过！可以继续部署。${NC}"
        echo ""
        echo "后续步骤:"
        echo "  1. 配置 .env.prod 文件"
        echo "  2. 运行: docker-compose -f docker-compose.yml up -d"
        echo "  3. 等待 40 秒让服务启动"
        echo "  4. 验证: curl http://localhost:8081/api/sessions"
        echo ""
        return 0
    else
        echo -e "${RED}✗ 验证发现问题，请修复后重试。${NC}"
        echo ""
        return 1
    fi
}

# 主函数
main() {
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  Storage Service 部署验证              ║${NC}"
    echo -e "${CYAN}║  Interview System v1.0.0               ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

    verify_docker
    verify_files
    verify_configuration
    verify_containers
    verify_connectivity
    verify_logs
    verify_security

    show_summary
}

# 执行主函数
main
