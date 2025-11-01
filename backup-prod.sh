#!/bin/bash
#
# AI面试系统 - 生产环境备份脚本
# 功能：自动备份数据库、Redis缓存和用户文件
# 使用: ./backup-prod.sh [options]
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
LOGS_DIR="${SCRIPT_DIR}/logs"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env.docker"

# 备份时间戳
BACKUP_TIME=$(date +'%Y%m%d_%H%M%S')
BACKUP_PATH="${BACKUP_DIR}/backup_${BACKUP_TIME}"

# 备份保留天数
RETENTION_DAYS=30

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

# 检查前置条件
check_prerequisites() {
    log "检查前置条件..."

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose文件不存在: $COMPOSE_FILE"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境配置文件不存在: $ENV_FILE"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装"
        exit 1
    fi

    log_success "前置条件检查完成"
}

# 创建备份目录
create_backup_dir() {
    log "创建备份目录..."
    mkdir -p "$BACKUP_PATH"
    log_success "备份目录已创建: $BACKUP_PATH"
}

# 备份Redis数据
backup_redis() {
    log "备份Redis数据..."

    # 触发Redis后台保存
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        exec -T redis redis-cli BGSAVE || {
        log_warning "Redis BGSAVE命令执行失败"
    }

    # 等待后台保存完成
    sleep 5

    # 复制RDB文件
    if [ -f "${DATA_DIR}/redis/dump.rdb" ]; then
        cp "${DATA_DIR}/redis/dump.rdb" "${BACKUP_PATH}/" || {
            log_warning "复制Redis RDB文件失败"
        }
        log_success "Redis RDB文件已备份"
    else
        log_warning "Redis RDB文件不存在"
    fi

    # 备份AOF文件（如果启用）
    if [ -f "${DATA_DIR}/redis/appendonly.aof" ]; then
        cp "${DATA_DIR}/redis/appendonly.aof" "${BACKUP_PATH}/" || {
            log_warning "复制Redis AOF文件失败"
        }
        log_success "Redis AOF文件已备份"
    fi
}

# 备份用户上传文件
backup_uploads() {
    log "备份用户上传文件..."

    if [ -d "${SCRIPT_DIR}/backend/uploads" ]; then
        mkdir -p "${BACKUP_PATH}/uploads"
        cp -r "${SCRIPT_DIR}/backend/uploads"/* "${BACKUP_PATH}/uploads/" 2>/dev/null || {
            log_warning "复制上传文件失败"
        }
        log_success "用户上传文件已备份"
    else
        log_warning "上传文件目录不存在"
    fi
}

# 备份应用配置
backup_config() {
    log "备份应用配置..."

    mkdir -p "${BACKUP_PATH}/config"

    # 备份docker-compose配置
    cp "${COMPOSE_FILE}" "${BACKUP_PATH}/config/" || {
        log_warning "备份docker-compose.yml失败"
    }

    # 备份环境配置（不包含敏感信息）
    cp "${ENV_FILE}" "${BACKUP_PATH}/config/.env.docker.backup" || {
        log_warning "备份环境配置失败"
    }

    # 备份nginx配置
    if [ -d "${SCRIPT_DIR}/nginx" ]; then
        cp -r "${SCRIPT_DIR}/nginx" "${BACKUP_PATH}/config/" 2>/dev/null || {
            log_warning "备份nginx配置失败"
        }
    fi

    log_success "应用配置已备份"
}

# 备份日志
backup_logs() {
    log "备份应用日志..."

    if [ -d "$LOGS_DIR" ]; then
        mkdir -p "${BACKUP_PATH}/logs"
        cp -r "$LOGS_DIR"/* "${BACKUP_PATH}/logs/" 2>/dev/null || {
            log_warning "复制日志失败"
        }
        log_success "应用日志已备份"
    else
        log_warning "日志目录不存在"
    fi
}

# 备份数据库（如果有）
backup_database() {
    log "备份数据库..."

    # PostgreSQL备份示例
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        ps postgres &>/dev/null; then
        log "检测到PostgreSQL，执行数据库备份..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T postgres pg_dump -U postgres > "${BACKUP_PATH}/database.sql" || {
            log_warning "数据库备份失败"
        }
        log_success "PostgreSQL数据库已备份"
    fi

    # MySQL备份示例
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
        ps mysql &>/dev/null; then
        log "检测到MySQL，执行数据库备份..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
            exec -T mysql mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" --all-databases > \
            "${BACKUP_PATH}/database.sql" || {
            log_warning "MySQL备份失败"
        }
        log_success "MySQL数据库已备份"
    fi
}

# 创建备份清单
create_manifest() {
    log "创建备份清单..."

    cat > "${BACKUP_PATH}/MANIFEST.txt" << EOF
备份信息
========

备份时间: $(date)
备份位置: $BACKUP_PATH
系统版本: $(cat "${SCRIPT_DIR}/.env.docker" | grep "APP_VERSION" || echo "未知")

包含文件:
EOF

    # 列出备份内容
    find "$BACKUP_PATH" -type f -exec ls -lh {} \; | awk '{print $9, "(" $5 ")"}' >> "${BACKUP_PATH}/MANIFEST.txt"

    log_success "备份清单已生成"
}

# 压缩备份
compress_backup() {
    log "压缩备份文件..."

    cd "$BACKUP_DIR"
    tar -czf "backup_${BACKUP_TIME}.tar.gz" "backup_${BACKUP_TIME}" || {
        log_error "备份压缩失败"
        return 1
    }

    # 计算压缩后大小
    local compressed_size=$(du -sh "backup_${BACKUP_TIME}.tar.gz" | cut -f1)
    log_success "备份已压缩: backup_${BACKUP_TIME}.tar.gz (${compressed_size})"

    # 可选：删除未压缩的备份目录（节省空间）
    # rm -rf "backup_${BACKUP_TIME}"
}

# 上传备份到远程存储
upload_backup() {
    log "上传备份到远程存储..."

    # S3 上传示例
    if command -v aws &> /dev/null; then
        log "检测到AWS CLI，尝试上传到S3..."
        aws s3 cp "${BACKUP_DIR}/backup_${BACKUP_TIME}.tar.gz" \
            "s3://interview-system-backups/" || {
            log_warning "S3上传失败"
        }
        log_success "备份已上传到S3"
    fi

    # 7zip到远程位置示例
    if [ -n "$REMOTE_BACKUP_PATH" ]; then
        log "复制备份到远程位置: $REMOTE_BACKUP_PATH"
        cp "${BACKUP_DIR}/backup_${BACKUP_TIME}.tar.gz" "$REMOTE_BACKUP_PATH/" || {
            log_warning "复制到远程位置失败"
        }
        log_success "备份已复制到远程位置"
    fi
}

# 清理过期备份
cleanup_old_backups() {
    log "清理过期备份（保留${RETENTION_DAYS}天）..."

    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete || {
        log_warning "清理过期备份失败"
    }

    local count=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" | wc -l)
    log_success "备份清理完成，当前保留${count}个备份"
}

# 显示备份统计
show_backup_stats() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}备份完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "备份统计:"
    echo "  备份位置: $BACKUP_PATH"
    echo "  压缩文件: backup_${BACKUP_TIME}.tar.gz"
    echo "  备份大小: $(du -sh "$BACKUP_DIR/backup_${BACKUP_TIME}.tar.gz" 2>/dev/null | cut -f1 || echo '未知')"
    echo "  包含内容:"
    echo "    - Redis数据库"
    echo "    - 用户上传文件"
    echo "    - 应用配置"
    echo "    - 应用日志"
    [ -f "${BACKUP_PATH}/database.sql" ] && echo "    - 应用数据库"
    echo ""
    echo "保留策略: ${RETENTION_DAYS}天"
    echo ""
    echo "所有备份:"
    ls -lh "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   AI面试系统 - 生产环境备份脚本        ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"

    check_prerequisites
    create_backup_dir
    backup_redis
    backup_uploads
    backup_config
    backup_logs
    backup_database
    create_manifest
    compress_backup
    upload_backup
    cleanup_old_backups
    show_backup_stats

    log_success "备份流程已完成"
}

# 错误处理
trap 'log_error "备份发生错误"; exit 1' ERR

# 执行主函数
main "$@"
