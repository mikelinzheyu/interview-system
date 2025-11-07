#!/bin/bash
#
# AI面试系统 - 生产环境恢复脚本
# 功能：从备份恢复数据库、Redis缓存和用户文件
# 使用: ./restore-backup.sh [backup_file_or_date]
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
DATA_DIR="${SCRIPT_DIR}/data"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env.docker"

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

# 显示使用方法
show_usage() {
    echo "使用方法:"
    echo "  $0 [backup_file_or_date]"
    echo ""
    echo "示例:"
    echo "  $0 backup_20240101_120000.tar.gz"
    echo "  $0 20240101_120000"
    echo "  $0                     # 使用最新备份"
    echo ""
}

# 列出可用备份
list_backups() {
    echo ""
    echo "可用备份列表:"
    if [ -d "$BACKUP_DIR" ] && [ -n "$(ls -A "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null)" ]; then
        ls -lhrt "$BACKUP_DIR"/backup_*.tar.gz | awk '{print "  " $9 " (" $5 ")"}'
    else
        echo "  没有可用备份"
    fi
    echo ""
}

# 查找备份文件
find_backup_file() {
    local search_pattern="$1"

    if [ -z "$search_pattern" ]; then
        # 使用最新备份
        BACKUP_FILE=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
        if [ -z "$BACKUP_FILE" ]; then
            log_error "没有找到备份文件"
            list_backups
            exit 1
        fi
        log "使用最新备份: $(basename "$BACKUP_FILE")"
    elif [ -f "$BACKUP_DIR/$search_pattern" ]; then
        BACKUP_FILE="$BACKUP_DIR/$search_pattern"
    elif [ -f "$BACKUP_DIR/backup_${search_pattern}.tar.gz" ]; then
        BACKUP_FILE="$BACKUP_DIR/backup_${search_pattern}.tar.gz"
    elif [ -f "$search_pattern" ]; then
        BACKUP_FILE="$search_pattern"
    else
        log_error "未找到备份文件: $search_pattern"
        list_backups
        exit 1
    fi

    log_success "找到备份文件: $BACKUP_FILE"
}

# 检查前置条件
check_prerequisites() {
    log "检查前置条件..."

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose文件不存在"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装"
        exit 1
    fi

    log_success "前置条件检查完成"
}

# 确认恢复操作
confirm_restore() {
    echo ""
    log_warning "请确认恢复操作："
    echo "  源备份: $(basename "$BACKUP_FILE")"
    echo "  目标位置: $DATA_DIR"
    echo ""
    echo "警告: 恢复操作将覆盖现有数据！"
    echo ""
    read -p "继续恢复? (是/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "恢复操作已取消"
        exit 1
    fi
}

# 停止服务
stop_services() {
    log "停止服务..."

    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || {
        log_warning "停止服务失败"
    }

    sleep 5
    log_success "服务已停止"
}

# 创建快照（用于恢复失败时回滚）
create_snapshot() {
    log "创建当前数据快照（用于失败回滚）..."

    local snapshot_dir="${BACKUP_DIR}/.snapshot_$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$snapshot_dir"

    if [ -d "${DATA_DIR}/redis" ]; then
        cp -r "${DATA_DIR}/redis" "$snapshot_dir/" || {
            log_warning "快照创建失败"
        }
    fi

    log_success "快照已创建: $snapshot_dir"
}

# 解压备份文件
extract_backup() {
    log "解压备份文件..."

    local temp_extract="${BACKUP_DIR}/.temp_extract_$$"
    mkdir -p "$temp_extract"

    tar -xzf "$BACKUP_FILE" -C "$temp_extract" || {
        log_error "备份文件解压失败"
        rm -rf "$temp_extract"
        exit 1
    }

    # 找到备份目录
    local backup_content=$(ls "$temp_extract")
    EXTRACT_DIR="${temp_extract}/${backup_content}"

    log_success "备份文件已解压: $EXTRACT_DIR"
}

# 恢复Redis数据
restore_redis() {
    log "恢复Redis数据..."

    if [ ! -d "${EXTRACT_DIR}/redis" ]; then
        log_warning "备份中没有Redis数据，跳过"
        return
    fi

    # 停止Redis容器
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop redis 2>/dev/null || true
    sleep 2

    # 清除旧数据
    rm -rf "${DATA_DIR}/redis"/* || true

    # 复制RDB文件
    if [ -f "${EXTRACT_DIR}/redis/dump.rdb" ]; then
        cp "${EXTRACT_DIR}/redis/dump.rdb" "${DATA_DIR}/redis/" || {
            log_error "复制RDB文件失败"
            return 1
        }
        log_success "Redis RDB文件已恢复"
    fi

    # 复制AOF文件（如果存在）
    if [ -f "${EXTRACT_DIR}/redis/appendonly.aof" ]; then
        cp "${EXTRACT_DIR}/redis/appendonly.aof" "${DATA_DIR}/redis/" || {
            log_warning "复制AOF文件失败"
        }
    fi

    log_success "Redis数据已恢复"
}

# 恢复用户上传文件
restore_uploads() {
    log "恢复用户上传文件..."

    if [ ! -d "${EXTRACT_DIR}/uploads" ]; then
        log_warning "备份中没有上传文件，跳过"
        return
    fi

    mkdir -p "${SCRIPT_DIR}/backend/uploads"

    # 清除旧文件（可选）
    # rm -rf "${SCRIPT_DIR}/backend/uploads"/*

    cp -r "${EXTRACT_DIR}/uploads"/* "${SCRIPT_DIR}/backend/uploads/" || {
        log_warning "恢复上传文件失败"
        return
    }

    log_success "用户上传文件已恢复"
}

# 恢复数据库
restore_database() {
    log "恢复数据库..."

    if [ ! -f "${EXTRACT_DIR}/database.sql" ]; then
        log_warning "备份中没有数据库备份，跳过"
        return
    fi

    # PostgreSQL恢复
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        ps postgres &>/dev/null 2>&1; then
        log "恢复PostgreSQL数据库..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T postgres psql -U postgres < "${EXTRACT_DIR}/database.sql" || {
            log_error "PostgreSQL恢复失败"
            return 1
        }
        log_success "PostgreSQL数据库已恢复"
    fi

    # MySQL恢复
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        ps mysql &>/dev/null 2>&1; then
        log "恢复MySQL数据库..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T mysql mysql -u root -p"${MYSQL_ROOT_PASSWORD}" < \
            "${EXTRACT_DIR}/database.sql" || {
            log_error "MySQL恢复失败"
            return 1
        }
        log_success "MySQL数据库已恢复"
    fi
}

# 恢复配置文件
restore_config() {
    log "恢复应用配置..."

    if [ -d "${EXTRACT_DIR}/config" ]; then
        # 恢复nginx配置（如果存在）
        if [ -d "${EXTRACT_DIR}/config/nginx" ]; then
            cp -r "${EXTRACT_DIR}/config/nginx" "${SCRIPT_DIR}/" || {
                log_warning "恢复nginx配置失败"
            }
        fi
        log_success "应用配置已恢复"
    else
        log_warning "备份中没有配置文件"
    fi
}

# 启动服务
start_services() {
    log "启动服务..."

    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d || {
        log_error "启动服务失败"
        return 1
    }

    log_success "服务已启动"
}

# 验证恢复
verify_restore() {
    log "验证恢复..."

    local max_attempts=30
    local attempt=0

    # 等待Redis就绪
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T redis redis-cli ping &>/dev/null; then
            log_success "Redis服务已就绪"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_warning "Redis服务启动超时"
    fi

    # 等待后端服务就绪
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T backend curl -f http://localhost:3001/api/health &>/dev/null; then
            log_success "后端服务已就绪"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_warning "后端服务启动超时"
    fi

    log_success "验证完成"
}

# 清理临时文件
cleanup() {
    log "清理临时文件..."

    if [ -n "$EXTRACT_DIR" ] && [ -d "${EXTRACT_DIR%/*}" ]; then
        rm -rf "${EXTRACT_DIR%/*}" || true
    fi

    log_success "清理完成"
}

# 显示恢复信息
show_restore_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}恢复完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "恢复信息:"
    echo "  源备份: $(basename "$BACKUP_FILE")"
    echo "  恢复时间: $(date)"
    echo ""
    echo "服务状态:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    echo ""
    echo "常用命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  验证数据: docker-compose exec redis redis-cli"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   AI面试系统 - 生产环境恢复脚本        ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"

    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        list_backups
        exit 0
    fi

    check_prerequisites
    find_backup_file "$1"
    confirm_restore
    create_snapshot
    stop_services
    extract_backup
    restore_redis
    restore_uploads
    restore_database
    restore_config
    start_services
    verify_restore
    cleanup
    show_restore_info

    log_success "恢复流程已完成"
}

# 错误处理
trap 'log_error "恢复发生错误"; cleanup; exit 1' ERR

# 执行主函数
main "$@"
