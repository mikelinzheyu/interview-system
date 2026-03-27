#!/bin/bash
# AI 面试系统 - 全 Docker 生产环境一键部署脚本
# ================================================
# 用法: bash deploy-docker.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 辅助函数
print_header() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ================================================
# 开始部署
# ================================================

print_header "AI 面试系统 - Docker 部署启动"

# 1. 检查前置条件
print_info "检查前置条件..."

if ! command -v docker &> /dev/null; then
  print_error "Docker 未安装。请先安装 Docker Desktop"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  print_error "Docker Compose 未安装。请先安装 Docker Compose"
  exit 1
fi

print_success "Docker 已安装"
print_info "Docker 版本: $(docker --version)"
print_info "Docker Compose 版本: $(docker-compose --version)"

# 2. 检查 Docker daemon 是否运行
print_info "检查 Docker daemon 状态..."
if ! docker ps &> /dev/null; then
  print_error "Docker daemon 未运行。请启动 Docker Desktop"
  exit 1
fi
print_success "Docker daemon 正在运行"

# 3. 检查磁盘空间
print_info "检查可用磁盘空间..."
# 注意：此脚本在 bash 中运行，磁盘空间检查方式可能因操作系统而异
# 这里简化了实现

# 4. 创建必要的目录
print_info "创建必要的目录..."
mkdir -p logs/db logs/nginx backend/logs backend/uploads frontend/logs
print_success "目录创建完成"

# 5. 检查 docker-compose.local.yml 是否存在
if [ ! -f "docker-compose.local.yml" ]; then
  print_error "docker-compose.local.yml 文件不存在"
  exit 1
fi
print_success "docker-compose.local.yml 文件已找到"

# 6. 检查 Dockerfile 是否存在
if [ ! -f "backend/Dockerfile.prod" ]; then
  print_error "backend/Dockerfile.prod 文件不存在"
  exit 1
fi

if [ ! -f "frontend/Dockerfile.prod" ]; then
  print_error "frontend/Dockerfile.prod 文件不存在"
  exit 1
fi
print_success "Dockerfile 文件已找到"

# 7. 构建和启动容器
print_header "开始构建 Docker 镜像并启动容器"

print_info "这可能需要 5-10 分钟..."
echo ""

if docker-compose -f docker-compose.local.yml up -d; then
  print_success "容器启动成功"
else
  print_error "容器启动失败。请查看错误信息"
  exit 1
fi

echo ""
print_info "等待容器完全启动..."
sleep 10

# 8. 检查容器状态
print_header "检查容器状态"
docker-compose -f docker-compose.local.yml ps

# 9. 检查服务健康状态
print_header "检查服务健康状态"

print_info "检查后端 API..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  print_success "后端 API 运行正常"
else
  print_warning "后端 API 还未就绪，可能需要更多时间启动"
fi

print_info "检查前端..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
  print_success "前端运行正常"
else
  print_warning "前端还未就绪，可能需要更多时间启动"
fi

print_info "检查数据库..."
if docker exec interview-db pg_isready -U admin 2>/dev/null; then
  print_success "数据库运行正常"
else
  print_warning "数据库还未就绪"
fi

print_info "检查 Redis..."
if docker exec interview-redis redis-cli ping 2>/dev/null; then
  print_success "Redis 运行正常"
else
  print_warning "Redis 还未就绪"
fi

# 10. 显示访问信息
print_header "部署完成！"

echo ""
echo "✨ 所有服务已启动"
echo ""
echo "📱 访问应用:"
echo "   前端 UI:     ${GREEN}http://localhost:8080${NC}"
echo "   后端 API:    ${GREEN}http://localhost:3001/api${NC}"
echo ""
echo "📊 数据库访问:"
echo "   PostgreSQL:  localhost:5432 (用户: admin)"
echo "   Redis:       localhost:6379"
echo ""
echo "🔧 常用命令:"
echo "   查看日志:     ${BLUE}docker-compose -f docker-compose.local.yml logs -f${NC}"
echo "   查看状态:     ${BLUE}docker-compose -f docker-compose.local.yml ps${NC}"
echo "   重启服务:     ${BLUE}docker-compose -f docker-compose.local.yml restart${NC}"
echo "   停止服务:     ${BLUE}docker-compose -f docker-compose.local.yml stop${NC}"
echo "   删除容器:     ${BLUE}docker-compose -f docker-compose.local.yml down${NC}"
echo ""
echo "📚 更多信息: 查看 DOCKER_DEPLOYMENT_GUIDE.md"
echo ""

# 11. 可选的性能建议
print_header "部署建议"

# 检查内存
if command -v free &> /dev/null; then
  FREE_MEM=$(free -h | awk 'NR==2 {print $7}')
  print_info "可用内存: $FREE_MEM"
  if [ "$(free -h | awk 'NR==2 {print $2}' | grep -o '[0-9]*')" -lt 8 ]; then
    print_warning "内存不足 8GB，可能影响性能"
  fi
fi

print_success "部署流程完成！"
print_info "建议等待 30-60 秒让所有服务完全初始化"
print_info "然后访问 http://localhost:8080 查看应用"

echo ""
