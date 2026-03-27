#!/bin/bash
# Docker 部署验证脚本
# ================================================
# 验证所有服务是否正常运行

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

# 辅助函数
pass_test() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASS_COUNT++))
}

fail_test() {
  echo -e "${RED}❌ $1${NC}"
  ((FAIL_COUNT++))
}

warn_test() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

info_test() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ================================================
# 开始验证
# ================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Docker 部署验证                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 检查 Docker
echo "🐳 Docker 环境检查"
echo "─────────────────────────────────────────────────────────"

if docker ps &> /dev/null; then
  pass_test "Docker daemon 正在运行"
  DOCKER_VERSION=$(docker --version)
  info_test "$DOCKER_VERSION"
else
  fail_test "Docker daemon 未运行"
  exit 1
fi

echo ""

# 2. 检查容器状态
echo "📦 容器状态检查"
echo "─────────────────────────────────────────────────────────"

# 检查是否存在 docker-compose.local.yml
if [ ! -f "docker-compose.local.yml" ]; then
  fail_test "docker-compose.local.yml 文件不存在"
  exit 1
fi

# 获取容器状态
CONTAINERS=$(docker-compose -f docker-compose.local.yml ps --quiet 2>/dev/null)

if [ -z "$CONTAINERS" ]; then
  fail_test "没有找到正在运行的容器"
  echo ""
  info_test "请先运行部署脚本: bash deploy-docker.sh"
  exit 1
fi

pass_test "容器已启动"

# 检查各个容器状态
echo ""
info_test "各容器状态:"

REQUIRED_CONTAINERS=("interview-db" "interview-redis" "interview-backend" "interview-frontend")

for container in "${REQUIRED_CONTAINERS[@]}"; do
  STATUS=$(docker ps --filter "name=$container" --format "{{.Status}}" 2>/dev/null)
  if [ -z "$STATUS" ]; then
    fail_test "$container 未运行"
  else
    pass_test "$container: $STATUS"
  fi
done

echo ""

# 3. 服务可达性检查
echo "🔗 服务可达性检查"
echo "─────────────────────────────────────────────────────────"

# 检查后端 API
info_test "检查后端 API (http://localhost:3001/health)..."
if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
  HEALTH=$(curl -s http://localhost:3001/health)
  pass_test "后端 API 响应正常"
  info_test "健康状态: $(echo $HEALTH | jq -r '.status // "unknown"' 2>/dev/null || echo "OK")"
else
  fail_test "后端 API 无响应"
fi

echo ""

# 检查前端
info_test "检查前端 (http://localhost:8080)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
  pass_test "前端响应正常 (HTTP $HTTP_CODE)"
else
  fail_test "前端响应异常 (HTTP $HTTP_CODE)"
fi

echo ""

# 4. 数据库连接检查
echo "🗄️  数据库检查"
echo "─────────────────────────────────────────────────────────"

# 检查 PostgreSQL
info_test "检查 PostgreSQL..."
if docker exec interview-db pg_isready -U admin > /dev/null 2>&1; then
  pass_test "PostgreSQL 连接正常"

  # 检查数据库是否存在
  DB_COUNT=$(docker exec interview-db psql -U admin -d interview_system -c "SELECT 1" 2>/dev/null | wc -l)
  if [ $DB_COUNT -gt 0 ]; then
    pass_test "数据库 interview_system 存在"
  else
    fail_test "数据库 interview_system 不存在或无法访问"
  fi
else
  fail_test "PostgreSQL 连接失败"
fi

echo ""

# 检查 Redis
info_test "检查 Redis..."
if docker exec interview-redis redis-cli ping > /dev/null 2>&1; then
  pass_test "Redis 连接正常"

  # 检查 Redis 信息
  INFO=$(docker exec interview-redis redis-cli info server | head -5)
  info_test "Redis 已就绪"
else
  fail_test "Redis 连接失败"
fi

echo ""

# 5. API 功能检查
echo "🧪 API 功能检查"
echo "─────────────────────────────────────────────────────────"

# 检查获取用户信息
info_test "检查获取用户信息 API..."
USER_RESPONSE=$(curl -s -H "Authorization: Bearer 1" http://localhost:3001/api/users/me 2>/dev/null)
if echo "$USER_RESPONSE" | jq . > /dev/null 2>&1; then
  USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.id // "unknown"' 2>/dev/null)
  pass_test "用户信息 API 正常 (用户 ID: $USER_ID)"
else
  fail_test "用户信息 API 无效"
fi

echo ""

# 检查隐私设置 API
info_test "检查隐私设置 API..."
PRIVACY_RESPONSE=$(curl -s -H "Authorization: Bearer 1" http://localhost:3001/api/users/privacy 2>/dev/null)
if echo "$PRIVACY_RESPONSE" | jq . > /dev/null 2>&1; then
  pass_test "隐私设置 API 正常"
else
  fail_test "隐私设置 API 无效"
fi

echo ""

# 检查界面偏好 API
info_test "检查界面偏好 API..."
PREF_RESPONSE=$(curl -s -H "Authorization: Bearer 1" http://localhost:3001/api/users/preferences 2>/dev/null)
if echo "$PREF_RESPONSE" | jq . > /dev/null 2>&1; then
  pass_test "界面偏好 API 正常"
else
  fail_test "界面偏好 API 无效"
fi

echo ""

# 6. 容器日志检查
echo "📋 容器日志检查"
echo "─────────────────────────────────────────────────────────"

# 检查是否有错误日志
BACKEND_ERRORS=$(docker logs interview-backend 2>&1 | grep -i "error" | head -3)
if [ -z "$BACKEND_ERRORS" ]; then
  pass_test "后端日志无严重错误"
else
  warn_test "后端日志检测到错误（可能是正常的启动日志）"
  echo "$BACKEND_ERRORS" | sed 's/^/  /'
fi

echo ""

# 7. 资源使用检查
echo "💻 资源使用情况"
echo "─────────────────────────────────────────────────────────"

# 检查容器资源使用
info_test "容器资源使用:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -6

echo ""

# ================================================
# 总结
# ================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ 验证总结                                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "通过测试: ${GREEN}$PASS_COUNT${NC}"
echo -e "失败测试: ${RED}$FAIL_COUNT${NC}"

echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✨ 所有验证通过！${NC}"
  echo ""
  echo "访问应用:"
  echo "  • 前端: http://localhost:8080"
  echo "  • API: http://localhost:3001/api"
  echo ""
else
  echo -e "${RED}⚠️  部分验证失败，请查看上面的错误信息${NC}"
  echo ""
  echo "常见问题排查:"
  echo "  1. 容器还在启动中，请等待 1-2 分钟后重新运行此脚本"
  echo "  2. 查看容器日志: docker-compose -f docker-compose.local.yml logs -f"
  echo "  3. 检查端口是否被占用: netstat -ano | findstr :3001"
  echo "  4. 确保 Docker Desktop 正在运行"
  echo ""
fi

echo "验证完成。"
