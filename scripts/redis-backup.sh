#!/bin/bash
# Redis 备份和恢复脚本
# 用于备份和恢复生产环境的 Redis 数据

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REDIS_PASSWORD="${REDIS_PASSWORD:-redis-password-prod}"

# 函数：创建备份
backup_redis() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              🔄 Redis 备份开始                               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 创建备份目录
    mkdir -p "$BACKUP_DIR"

    # 执行 Redis BGSAVE（后台保存）
    echo -e "${YELLOW}[1/3] 触发 Redis 后台保存...${NC}"
    docker-compose exec -T interview-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE
    echo -e "${GREEN}✓ 后台保存已触发${NC}"
    echo ""

    # 等待备份完成
    echo -e "${YELLOW}[2/3] 等待备份完成...${NC}"
    sleep 5

    # 复制备份文件
    echo -e "${YELLOW}[3/3] 复制备份文件...${NC}"
    BACKUP_FILE="$BACKUP_DIR/redis-dump-$TIMESTAMP.rdb"
    docker cp interview-redis:/data/dump.rdb "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✓ 备份成功${NC}"
        echo "  文件: $BACKUP_FILE"
        echo "  大小: $SIZE"
    else
        echo -e "${RED}✗ 备份失败${NC}"
        return 1
    fi

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  备份完成！                                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
}

# 函数：恢复备份
restore_redis() {
    if [ -z "$1" ]; then
        echo -e "${RED}错误: 请指定备份文件路径${NC}"
        echo "用法: $0 restore <backup-file>"
        return 1
    fi

    BACKUP_FILE="$1"

    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}错误: 备份文件不存在: $BACKUP_FILE${NC}"
        return 1
    fi

    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              🔄 Redis 恢复开始                               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 确认恢复操作
    echo -e "${YELLOW}⚠️  警告：此操作将覆盖现有数据！${NC}"
    read -p "是否继续？(yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "恢复已取消"
        return 0
    fi

    # 停止存储服务
    echo -e "${YELLOW}[1/4] 停止存储服务...${NC}"
    docker-compose stop interview-storage-service
    echo -e "${GREEN}✓ 存储服务已停止${NC}"
    echo ""

    # 停止 Redis
    echo -e "${YELLOW}[2/4] 停止 Redis...${NC}"
    docker-compose stop interview-redis
    echo -e "${GREEN}✓ Redis 已停止${NC}"
    echo ""

    # 复制备份文件
    echo -e "${YELLOW}[3/4] 复制备份文件到 Redis 容器...${NC}"
    docker cp "$BACKUP_FILE" interview-redis:/data/dump.rdb
    echo -e "${GREEN}✓ 备份文件已复制${NC}"
    echo ""

    # 启动 Redis
    echo -e "${YELLOW}[4/4] 启动 Redis 和存储服务...${NC}"
    docker-compose up -d
    sleep 10
    echo -e "${GREEN}✓ 服务已启动${NC}"
    echo ""

    # 验证恢复
    echo -e "${YELLOW}验证恢复...${NC}"
    if docker-compose exec -T interview-redis redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis 已连接${NC}"

        # 显示数据库信息
        echo ""
        echo "Redis 数据库信息:"
        docker-compose exec -T interview-redis redis-cli -a "$REDIS_PASSWORD" INFO keyspace
    else
        echo -e "${RED}✗ Redis 连接失败${NC}"
        return 1
    fi

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  恢复完成！                                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
}

# 函数：列出备份
list_backups() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              📋 Redis 备份列表                               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR)" ]; then
        echo "没有找到备份文件"
        return 0
    fi

    ls -lh "$BACKUP_DIR" | awk '{print $9, "(" $5 ")"}'
}

# 函数：显示使用说明
show_usage() {
    echo -e "${BLUE}Redis 备份和恢复工具${NC}"
    echo ""
    echo "用法: $0 <command> [options]"
    echo ""
    echo "命令:"
    echo "  backup                    - 创建 Redis 备份"
    echo "  restore <file>            - 从备份文件恢复"
    echo "  list                      - 列出所有备份"
    echo "  help                      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 backup                 - 创建新备份"
    echo "  $0 restore ./backups/redis-dump-20250101_120000.rdb"
    echo "  $0 list                   - 查看备份列表"
    echo ""
}

# 主程序
COMMAND="${1:-help}"

case "$COMMAND" in
    backup)
        backup_redis
        ;;
    restore)
        restore_redis "$2"
        ;;
    list)
        list_backups
        ;;
    help)
        show_usage
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        show_usage
        exit 1
        ;;
esac
