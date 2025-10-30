#!/bin/bash
# 本地启动脚本 - 快速启动存储服务进行本地开发和测试
# 使用方法: chmod +x start-local.sh && ./start-local.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 存储服务本地启动脚本                                 ║${NC}"
echo -e "${BLUE}║      Storage Service Local Startup Script                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 Docker
echo -e "${YELLOW}[1/4] 检查 Docker 状态...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓ Docker 已安装${NC}"
docker --version
echo ""

# 检查 Docker Compose
echo -e "${YELLOW}[2/4] 检查 Docker Compose 状态...${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
docker-compose --version
echo ""

# 进入 storage-service 目录
echo -e "${YELLOW}[3/4] 准备启动容器...${NC}"

cd storage-service

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，复制 .env.example${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env 文件已创建${NC}"
    else
        echo -e "${RED}✗ .env.example 文件不存在${NC}"
        exit 1
    fi
fi

echo ""

# 启动容器
echo -e "${YELLOW}[4/4] 启动 Docker 容器...${NC}"

# 停止已运行的容器
if docker-compose ps | grep -q "interview-redis\|interview-storage"; then
    echo "停止已运行的容器..."
    docker-compose down
fi

# 启动容器
docker-compose up -d

# 等待容器启动
echo "等待容器启动..."
sleep 10

# 检查容器状态
echo ""
echo -e "${BLUE}容器状态：${NC}"
docker-compose ps

echo ""

# 检查服务健康
echo -e "${BLUE}健康检查：${NC}"

MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s -f -H "Authorization: Bearer ak_dev_test_key_12345678901234567890" \
        "http://localhost:8081/api/sessions" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 存储服务已启动并响应${NC}"
        break
    fi
    echo -e "${YELLOW}⏳ 尝试 $((ATTEMPT+1))/$MAX_ATTEMPTS...${NC}"
    ((ATTEMPT++))
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}✗ 存储服务启动超时${NC}"
    echo "查看日志: docker-compose logs"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ 启动完成！存储服务已准备就绪                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "📌 快速命令："
echo ""
echo "  查看日志:"
echo "    docker-compose logs -f                         # 所有日志"
echo "    docker-compose logs -f interview-redis         # Redis 日志"
echo "    docker-compose logs -f interview-storage-service  # 存储服务日志"
echo ""
echo "  测试 API:"
echo "    curl -H \"Authorization: Bearer ak_dev_test_key_12345678901234567890\" \\"
echo "      http://localhost:8081/api/sessions"
echo ""
echo "  运行本地测试:"
echo "    ../scripts/test-storage-service-local.sh"
echo ""
echo "  停止容器:"
echo "    docker-compose down"
echo ""
echo "  进入容器 CLI:"
echo "    docker-compose exec interview-redis redis-cli -a redis-dev-password"
echo ""

echo "🌐 服务地址："
echo "  本地: http://localhost:8081"
echo "  API: http://localhost:8081/api/sessions"
echo ""

echo "📚 文档："
echo "  快速启动: ../../QUICK_START_DEPLOYMENT.md"
echo "  详细步骤: ../../IMPLEMENTATION_STEPS.md"
echo "  本地测试: ../scripts/test-storage-service-local.sh"
echo ""
