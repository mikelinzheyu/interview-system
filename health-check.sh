#!/bin/bash
# 生产环境健康检查脚本

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

FAILED=0

echo "=========================================="
echo "生产环境健康检查"
echo "=========================================="
echo

# 1. 检查Docker
log_info "检查Docker..."
if docker ps &>/dev/null; then
    log_success "Docker运行中"
else
    log_error "Docker未运行"
    FAILED=$((FAILED+1))
fi

# 2. 检查容器状态
log_info "检查容器状态..."
for service in db redis backend storage-service frontend nginx-proxy; do
    status=$(docker ps -q -f name="interview-${service}" 2>/dev/null)
    if [ -n "$status" ]; then
        log_success "interview-${service} 运行中"
    else
        log_warn "interview-${service} 未运行"
    fi
done

# 3. 检查磁盘空间
log_info "检查磁盘空间..."
usage=$(df / | tail -1 | awk '{print int($5)}')
if [ "$usage" -lt 90 ]; then
    log_success "磁盘使用: ${usage}%"
else
    log_error "磁盘使用过高: ${usage}%"
    FAILED=$((FAILED+1))
fi

# 4. 检查内存
log_info "检查内存..."
mem_available=$(free -m | awk '/^Mem/{print $7}')
if [ "$mem_available" -gt 500 ]; then
    log_success "可用内存: ${mem_available}MB"
else
    log_warn "可用内存不足: ${mem_available}MB"
fi

# 5. 检查数据卷
log_info "检查数据卷..."
for dir in data logs nginx/ssl; do
    if [ -d "$dir" ]; then
        log_success "$dir 目录存在"
    else
        log_warn "$dir 目录不存在"
    fi
done

# 6. 检查HTTP健康状态
log_info "检查HTTP服务..."
if curl -k -f https://localhost/health &>/dev/null 2>&1 || curl -f http://localhost/health &>/dev/null 2>&1; then
    log_success "前端响应正常"
else
    log_error "前端无响应"
    FAILED=$((FAILED+1))
fi

# 7. 检查API健康状态
log_info "检查API服务..."
if curl -k -f https://localhost/api/health &>/dev/null 2>&1 || curl -f http://localhost:8080/api/health &>/dev/null 2>&1; then
    log_success "API响应正常"
else
    log_error "API无响应"
    FAILED=$((FAILED+1))
fi

# 8. 检查Redis
log_info "检查Redis服务..."
if docker exec interview-redis redis-cli ping &>/dev/null; then
    log_success "Redis连接正常"
else
    log_error "Redis连接失败"
    FAILED=$((FAILED+1))
fi

# 9. 检查数据库
log_info "检查数据库..."
if docker exec interview-db psql -U admin -d interview_system -c "SELECT 1" &>/dev/null; then
    log_success "数据库连接正常"
else
    log_warn "数据库连接失败或未配置"
fi

# 10. 检查日志大小
log_info "检查日志大小..."
log_size=$(du -sh logs 2>/dev/null | cut -f1)
log_success "日志大小: $log_size"

echo
echo "=========================================="
if [ "$FAILED" -eq 0 ]; then
    log_success "所有检查通过！系统运行正常"
    exit 0
else
    log_error "发现 $FAILED 个问题，需要处理"
    exit 1
fi
